"use client";
import { motion, useReducedMotion } from "framer-motion";
import type { ForecastDay } from "@/lib/revise";

/** Reviews due over the next 7 days: one thin bar per day, value labelled on top, a full table for screen readers. */
export function ReviseForecast({ days }: { days: ForecastDay[] }) {
  const reduce = useReducedMotion();
  const max = Math.max(1, ...days.map((d) => d.n));
  const sum = days.reduce((a, d) => a + d.n, 0);
  return (
    <section className="card flex flex-col gap-3" aria-labelledby="rv-week">
      <div className="flex items-baseline justify-between gap-2">
        <h2 id="rv-week" className="text-lg">Next 7 days</h2>
        <span className="text-sm text-muted">{sum} {sum === 1 ? "review" : "reviews"}</span>
      </div>
      <div className="grid h-36 grid-cols-7 items-end gap-2" aria-hidden>
        {days.map((d, i) => (
          <div key={d.day} className="group relative flex h-full flex-col items-center justify-end gap-1" title={`${d.label}: ${d.n} ${d.n === 1 ? "review" : "reviews"}`}>
            <span className="text-xs font-black tabular-nums text-head">{d.n > 0 ? d.n : ""}</span>
            <motion.span
              className={`block w-full max-w-7 rounded-t-[4px] ${i === 0 ? "bg-blue" : "bg-blue/45"} group-hover:bg-blue-d`}
              initial={reduce ? false : { height: 0 }} animate={{ height: d.n ? `${Math.max(6, (d.n / max) * 82)}%` : "2px" }}
              transition={{ duration: 0.5, delay: reduce ? 0 : i * 0.04, ease: [0.2, 0.9, 0.3, 1] }}
              style={d.n ? undefined : { background: "var(--line)" }}
            />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2 border-t-2 border-line pt-1" aria-hidden>
        {days.map((d) => <span key={d.day} className="text-center text-[11px] font-bold text-muted">{d.label}</span>)}
      </div>
      <table className="sr-only">
        <caption>Reviews due over the next 7 days</caption>
        <thead><tr><th scope="col">Day</th><th scope="col">Reviews due</th></tr></thead>
        <tbody>{days.map((d) => <tr key={d.day}><td>{d.label === "Tmrw" ? "Tomorrow" : `${d.label} ${d.day}`}</td><td>{d.n}</td></tr>)}</tbody>
      </table>
    </section>
  );
}
