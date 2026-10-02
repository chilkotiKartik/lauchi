import "./classes.css";
import type { WeakUnit } from "@/lib/classes";

/** Horizontal bars: the units where the whole class scores lowest. Bar length is accuracy; each row also states the number. */
export function WeakAreas({ units, labels }: { units: WeakUnit[]; labels: Record<string, string> }) {
  if (!units.length) return <p className="text-muted">No quiz answers from this class yet. Weak areas appear once students finish a few quizzes.</p>;
  return (
    <ol className="flex flex-col gap-3" aria-label="Weakest units, lowest accuracy first" data-testid="weak-areas">
      {units.map((u) => (
        <li key={`${u.course}:${u.unit}`} className="flex flex-col gap-1">
          <div className="flex items-baseline justify-between gap-3">
            <span className="min-w-0 truncate font-extrabold text-head">{labels[`${u.course}:${u.unit}`] ?? `${u.course} · Unit ${u.unit}`}</span>
            <span className="shrink-0 font-black tabular-nums text-head">{u.pct}%</span>
          </div>
          <div className="cls-bar" role="img" aria-label={`${u.pct} percent correct over ${u.total} questions`}>
            <i style={{ width: `${Math.max(2, u.pct)}%`, background: u.pct < 50 ? "var(--red)" : u.pct < 75 ? "var(--gold)" : "var(--green)" }} />
          </div>
          <span className="text-xs text-muted">{u.total} questions{u.students ? ` · ${u.students} student${u.students === 1 ? "" : "s"}` : ""}</span>
        </li>
      ))}
    </ol>
  );
}
