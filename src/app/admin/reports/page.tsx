import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { ReportStatusForm } from "@/components/admin/ReportStatusForm";
import { courseLabel, courseOptions } from "@/app/admin/data";

export const metadata: Metadata = { title: "Reports" };

type Report = { id: string; source: "quiz" | "pyq" | "lesson"; ref: string; course: string | null; unit: number | null; text: string; status: "open" | "fixed" | "ignored"; fix_note: string; created_at: string };
const STATUSES = ["open", "fixed", "ignored", "all"] as const;
const SOURCE = { quiz: "Quiz question", pyq: "PYQ", lesson: "Lesson" } as const;
const CUSTOM = /^C-([0-9a-f-]{36})$/i;

function howToFix(r: Report) {
  const custom = CUSTOM.exec(r.ref);
  if (custom) return <>This is a custom PYQ. <Link href={`/admin/pyqs?edit=${custom[1]}#pyq-form`}>Edit it directly</Link>.</>;
  if (r.source === "quiz") return <>Quiz questions are generated from templates in <code>content/src/gen_*.js</code>. Send this ref to a developer to fix the template, then mark it fixed.</>;
  if (r.source === "pyq") return <>Built-in PYQs come from <code>src/content/pyq/{r.course ?? "<code>"}.json</code>. A developer fixes them there.</>;
  return <>Lesson text lives in <code>src/content/lessons</code>. A developer fixes it there.</>;
}

const when = (iso: string) => new Date(iso).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

export default async function AdminReports({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const status = (STATUSES as readonly string[]).includes(sp.status ?? "") ? (sp.status as (typeof STATUSES)[number]) : "open";
  const opts = courseOptions();
  let rows: Report[] = [];
  let failed = false;
  try {
    let q = createAdminClient().from("question_reports").select("id,source,ref,course,unit,text,status,fix_note,created_at");
    if (status !== "all") q = q.eq("status", status);
    const { data, error } = await q.order("created_at", { ascending: false }).limit(200);
    if (error) failed = true; else rows = (data ?? []) as Report[];
  } catch { failed = true; }

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-3xl">Reports</h1>
        <p className="text-muted">Problems students flagged in questions and lessons. Reporters stay anonymous here.</p>
      </header>
      <nav aria-label="Filter by status" className="flex gap-2 overflow-x-auto pb-1">
        {STATUSES.map((s) => (
          <Link key={s} href={s === "open" ? "/admin/reports" : `/admin/reports?status=${s}`} className="adm-tab" aria-current={status === s ? "page" : undefined}>
            {s[0].toUpperCase() + s.slice(1)}
          </Link>
        ))}
      </nav>
      {failed ? <p className="err" role="alert">We couldn&apos;t load reports. Refresh to try again.</p>
        : rows.length === 0 ? <p className="card text-muted">{status === "open" ? "No open reports. Nice and clean." : "Nothing here."}</p>
        : (
          <ul className="flex flex-col gap-3" aria-label="Reports">
            {rows.map((r) => (
              <li key={r.id} className="card flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className={`chip ${r.status === "open" ? "chip-hot" : r.status === "fixed" ? "chip-th" : "chip-soft"}`}>{r.status[0].toUpperCase() + r.status.slice(1)}</span>
                  <span className="chip chip-cool">{SOURCE[r.source] ?? r.source}</span>
                  {r.course && <span className="chip chip-id">{courseLabel(opts, r.course)}{r.unit ? ` · U${r.unit}` : ""}</span>}
                  <span className="ml-auto text-xs text-muted"><time dateTime={r.created_at}>{when(r.created_at)}</time></span>
                </div>
                <p className="whitespace-pre-wrap break-words text-head">{r.text}</p>
                <p className="break-all text-sm text-muted">Ref: <code className="rounded bg-soft px-1.5 py-0.5 text-ink">{r.ref}</code></p>
                <p className="text-sm">{howToFix(r)}</p>
                <ReportStatusForm id={r.id} status={r.status} note={r.fix_note} />
              </li>
            ))}
          </ul>
        )}
    </div>
  );
}
