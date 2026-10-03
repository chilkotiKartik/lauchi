"use client";
import { useState, useTransition } from "react";
import { flash } from "@/components/admin/AdminFlash";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Rich } from "@/lib/rich";
import { DIFFICULTY_LABEL, KIND_LABEL, type Kind } from "@/lib/cms-questions-core";
import { StatusBadge } from "./QuestionForm";
import { deleteQuestions, duplicateQuestion, setQuestionStatus } from "./actions";

export type TableRow = { id: string; stem: string; where: string; kind: Kind; status: string; difficulty: number; updated: string };

export function QuestionTable({ rows }: { rows: TableRow[] }) {
  const router = useRouter();
  const [sel, setSel] = useState<string[]>([]);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, run] = useTransition();
  const all = rows.length > 0 && sel.length === rows.length;
  const toggle = (id: string) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  function bulk(kind: "published" | "draft" | "delete", ids: string[]) {
    if (!ids.length) return;
    if (kind === "delete" && !window.confirm(`Delete ${ids.length} ${ids.length === 1 ? "question" : "questions"}? This can't be undone.`)) return;
    setMsg(null);
    run(async () => {
      const r = kind === "delete" ? await deleteQuestions(ids) : await setQuestionStatus(ids, kind);
      flash(r.ok, r.message); // shown above the list: this table remounts when the refreshed rows change
      if (r.ok) { setSel([]); router.refresh(); }
    });
  }
  function dup(id: string) {
    setMsg(null);
    run(async () => {
      const r = await duplicateQuestion(id);
      if (r.ok) router.push(`/admin/questions/${r.id}`); else setMsg({ ok: false, text: r.message });
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Bulk actions">
        <label className="flex items-center gap-2 font-extrabold text-head">
          <input type="checkbox" className="h-5 w-5" checked={all} onChange={() => setSel(all ? [] : rows.map((r) => r.id))} /> Select all on this page
        </label>
        <button type="button" className="btn btn-blue" disabled={!sel.length || pending} onClick={() => bulk("published", sel)}>Publish selected</button>
        <button type="button" className="btn btn-ghost" disabled={!sel.length || pending} onClick={() => bulk("draft", sel)}>Unpublish selected</button>
        <button type="button" className="btn btn-ghost" disabled={!sel.length || pending} onClick={() => bulk("delete", sel)}>Delete selected</button>
        <span className="text-sm text-muted">{sel.length} selected</span>
      </div>
      <div aria-live="polite">{msg && <p className={msg.ok ? "ok" : "err"} role={msg.ok ? "status" : "alert"}>{msg.text}</p>}</div>
      <ul className="flex flex-col gap-2" aria-label="Questions">
        {rows.map((r) => (
          <li key={r.id} className="flex flex-wrap items-start gap-3 rounded-2xl border-2 border-line p-3">
            <input type="checkbox" className="mt-1 h-5 w-5 shrink-0" checked={sel.includes(r.id)} onChange={() => toggle(r.id)} aria-label={`Select: ${r.stem.slice(0, 60)}`} />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <Link href={`/admin/questions/${r.id}`} className="break-words font-extrabold text-head"><Rich text={r.stem.length > 160 ? r.stem.slice(0, 159) + "…" : r.stem} /></Link>
              <span className="flex flex-wrap items-center gap-2 text-sm text-muted">
                <StatusBadge status={r.status} />
                <span>{r.where}</span><span>·</span><span>{KIND_LABEL[r.kind]}</span><span>·</span><span>{DIFFICULTY_LABEL[r.difficulty]}</span><span>·</span><span>Edited {r.updated}</span>
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href={`/admin/questions/${r.id}`} className="btn btn-ghost" aria-label={`Edit: ${r.stem.slice(0, 40)}`}>Edit</Link>
              <button type="button" className="btn btn-ghost" disabled={pending} onClick={() => dup(r.id)} aria-label={`Duplicate: ${r.stem.slice(0, 40)}`}>Duplicate</button>
              <button type="button" className="btn btn-ghost" disabled={pending} onClick={() => bulk("delete", [r.id])} aria-label={`Delete: ${r.stem.slice(0, 40)}`}>Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
