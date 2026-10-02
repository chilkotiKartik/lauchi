import Link from "next/link";
import { gradeBand } from "@/lib/paper";
import { shortName, type HistoryRow } from "@/app/(app)/paper/data";

const when = (iso: string) => new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" }).format(new Date(iso));

/** Past attempts with scores. */
export function History({ rows }: { rows: HistoryRow[] }) {
  if (!rows.length) return <p className="card text-muted">No papers yet. Your first one will show up here with its score.</p>;
  return (
    <ul className="flex flex-col gap-2" aria-label="Your past papers">
      {rows.map((r) => (
        <li key={r.id}>
          <Link href={`/paper/${r.course}/${r.id}`} className="pp-hist" data-testid="paper-history-item">
            <span className="min-w-0 flex-1">
              <b className="block truncate text-head">{shortName(r.course)} · {r.mode === "exam" ? "Exam mode" : "Practice"}</b>
              <span className="text-sm text-muted">{when(r.started_at)}</span>
            </span>
            {r.total !== null ? (
              <span className="text-right"><b className="text-xl tabular-nums text-head">{r.total}/100</b><br /><span className="text-xs font-black text-muted">{gradeBand(r.total).grade}</span></span>
            ) : (
              <span className="chip chip-warm">{r.submitted_at ? "Not marked yet" : "In progress"}</span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
