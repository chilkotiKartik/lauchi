import type { DayCell } from "@/lib/daily";

const short = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });

/** The last 14 days: a filled tile where the daily challenge was finished. */
export function HistoryStrip({ cells }: { cells: DayCell[] }) {
  const done = cells.filter((c) => c.done).length;
  return (
    <section className="card flex flex-col gap-3" aria-labelledby="hist">
      <div className="flex items-baseline justify-between gap-2">
        <h2 id="hist" className="text-xl">Last 14 days</h2>
        <p className="text-sm text-muted">{done} of 14 finished</p>
      </div>
      <ol className="grid grid-cols-7 gap-2" aria-label="Daily challenge history">
        {cells.map((c) => (
          <li key={c.day} data-done={c.done ? "1" : "0"}
            className={`flex h-14 flex-col items-center justify-center rounded-xl border-2 text-xs font-black ${c.done ? "border-green bg-green-l text-green-t" : c.today ? "border-blue bg-blue-l text-blue-t" : "border-line bg-card text-muted"}`}
            aria-label={`${short(c.day)}: ${c.done ? `finished, ${c.score} of 5` : c.today ? "today, not finished yet" : "not finished"}`}>
            <span aria-hidden="true">{c.done ? `${c.score}/5` : "–"}</span>
            <span aria-hidden="true" className="font-bold opacity-80">{short(c.day)}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
