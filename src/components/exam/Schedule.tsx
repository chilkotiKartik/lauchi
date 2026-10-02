"use client";
import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import { regenerateSchedule, toggleTask } from "@/app/(app)/exam/actions";
import { KIND_LABEL, groupByDay, progressPct, taskLinks, type StoredTask } from "@/lib/exam";

export type ScheduleTask = StoredTask & { short: string; title: string };
const fmt = (m: number) => (m >= 60 ? `${Math.floor(m / 60)}h${m % 60 ? ` ${m % 60}m` : ""}` : `${m}m`);
const dayLabel = (d: string, today: string) => (d === today ? "Today" : new Date(d + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }));

export function Schedule({ tasks, today }: { tasks: ScheduleTask[]; today: string }) {
  const [opt, setOpt] = useOptimistic(tasks, (cur, p: { id: string; done: boolean }) => cur.map((t) => (t.id === p.id ? { ...t, done: p.done } : t)));
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");
  const pct = progressPct(opt);
  const days = groupByDay(opt);
  const regen = () => start(async () => { const r = await regenerateSchedule(); setMsg(r.status === "error" ? r.message ?? "" : ""); });
  const tick = (id: string, done: boolean) => start(async () => { setOpt({ id, done }); const r = await toggleTask(id, done); if (r.status === "error") setMsg(r.message ?? ""); });
  return (
    <div className="flex flex-col gap-4">
      <div className="card flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3"><b className="text-head">Progress</b><span className="font-black text-head">{pct}%</span></div>
        <div role="progressbar" aria-label="Schedule progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} className="h-3 overflow-hidden rounded-full bg-soft">
          <div className="h-full rounded-full bg-green" style={{ width: `${pct}%`, transition: "width .3s" }} />
        </div>
        <p className="text-sm text-muted">{opt.filter((t) => t.done).length} of {opt.length} tasks done</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className="btn btn-ghost" disabled={pending} onClick={regen}>{pending ? "Working…" : "Regenerate schedule"}</button>
        <span className="text-sm text-muted">Ticked tasks stay ticked. The rest is re-spread from today.</span>
      </div>
      {msg && <p className="err" role="alert">{msg}</p>}
      <ol className="flex flex-col gap-3">
        {days.map((d, i) => {
          const left = d.tasks.filter((t) => !t.done).length;
          const late = d.day < today && left > 0;
          return (
            <li key={d.day}>
              <details open={d.day === today || (d.day >= today && i < 4)} className="card !p-0">
                <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2 p-4">
                  <span className="font-black text-head">{dayLabel(d.day, today)}{late && <span className="chip chip-hot ml-2">Missed</span>}</span>
                  <span className="text-sm text-muted">{d.tasks.length - left}/{d.tasks.length} done · {fmt(d.tasks.reduce((n, t) => n + t.minutes, 0))}</span>
                </summary>
                <ul className="flex flex-col gap-2 px-4 pb-4">
                  {d.tasks.map((t) => (
                    <li key={t.id} className="flex flex-col gap-2 rounded-xl bg-soft p-3">
                      <label className="flex items-start gap-3">
                        <input type="checkbox" className="mt-1 h-5 w-5" checked={t.done} onChange={(e) => tick(t.id, e.target.checked)} />
                        <span className={`flex-1 ${t.done ? "text-muted line-through" : ""}`}><b className="text-head">{KIND_LABEL[t.kind]}</b> · {t.unit ? `${t.short} Unit ${t.unit}: ${t.title}` : t.short}</span>
                        <span className="text-sm text-muted">{fmt(t.minutes)}</span>
                      </label>
                      <span className="flex flex-wrap gap-3 pl-8 text-sm">
                        {taskLinks(t).map((l) => <Link key={l.label} href={l.href} className="font-extrabold">{l.label}</Link>)}
                      </span>
                    </li>
                  ))}
                </ul>
              </details>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function BuildButton() {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");
  return (
    <div className="flex flex-col gap-2">
      <button type="button" className="btn w-fit" disabled={pending} onClick={() => start(async () => { const r = await regenerateSchedule(); setMsg(r.status === "error" ? r.message ?? "" : ""); })}>{pending ? "Building…" : "Build my schedule"}</button>
      {msg && <p className="err" role="alert">{msg}</p>}
    </div>
  );
}
