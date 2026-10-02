"use client";
import "./classes.css";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { removeStudentAction } from "@/app/(app)/classes/actions";
import { sortRoster, type RosterRow, type SortKey } from "@/lib/classes";

const COLS: { key: SortKey; label: string; num: boolean }[] = [
  { key: "name", label: "Student", num: false }, { key: "xp7", label: "XP 7d", num: true }, { key: "xp30", label: "XP 30d", num: true },
  { key: "streak", label: "Streak", num: true }, { key: "quizzes", label: "Quizzes", num: true }, { key: "accuracy", label: "Accuracy", num: true },
];

/** Roster with a progress table the teacher can sort. `weakLabels` maps "COURSE:unit" to a short readable name. */
export function RosterTable({ classId, rows, weakLabels }: { classId: string; rows: RosterRow[]; weakLabels: Record<string, string> }) {
  const [key, setKey] = useState<SortKey>("xp7");
  const [dir, setDir] = useState<"asc" | "desc">("desc");
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();
  const sorted = sortRoster(rows, key, dir);
  const sortBy = (k: SortKey) => { if (k === key) setDir(dir === "asc" ? "desc" : "asc"); else { setKey(k); setDir(k === "name" ? "asc" : "desc"); } };

  if (!rows.length) return <p className="card text-muted">Nobody has joined yet. Share the invite code and students will appear here.</p>;
  return (
    <div className="flex flex-col gap-2">
      <div className="cls-table-wrap">
        <table className="cls-table" style={{ minWidth: 720 }} data-testid="roster">
          <caption className="sr-only">Students in this class. Use the column buttons to sort.</caption>
          <thead>
            <tr>
              {COLS.map((c) => (
                <th key={c.key} className={c.num ? "num" : ""} scope="col" aria-sort={key === c.key ? (dir === "asc" ? "ascending" : "descending") : "none"}>
                  <button type="button" className="font-black uppercase" onClick={() => sortBy(c.key)}>{c.label}{key === c.key ? (dir === "asc" ? " ▲" : " ▼") : ""}</button>
                </th>
              ))}
              <th scope="col">Weakest units</th>
              <th scope="col"><span className="sr-only">Remove</span></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => (
              <tr key={r.user_id} data-testid="roster-row">
                <td className="font-extrabold text-head">{r.name}</td>
                <td className="num">{r.xp7}</td><td className="num">{r.xp30}</td><td className="num">{r.streak}d</td><td className="num">{r.quizzes}</td>
                <td className="num">{r.accuracy === null ? "–" : `${r.accuracy}%`}</td>
                <td className="text-sm">{r.weakest.length ? r.weakest.map((w) => `${weakLabels[`${w.course}:${w.unit}`] ?? `${w.course} U${w.unit}`} (${w.pct}%)`).join(", ") : <span className="text-muted">Nothing yet</span>}</td>
                <td>
                  <button type="button" className="btn btn-ghost !min-h-9 !px-3 !text-sm" disabled={pending} aria-label={`Remove ${r.name}`} onClick={() => {
                    if (!window.confirm(`Remove ${r.name} from this class? They can join again with the code.`)) return;
                    start(async () => { const x = await removeStudentAction(classId, r.user_id); setMsg(x.message ?? ""); if (x.ok) router.refresh(); });
                  }}>Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p role="status" className="min-h-[1.25rem] text-sm font-extrabold text-green-t">{msg}</p>
    </div>
  );
}
