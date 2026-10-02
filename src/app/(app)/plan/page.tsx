import type { Metadata } from "next";
import Link from "next/link";
import { visibleCourses } from "@/lib/stream";
import { requireOnboarded } from "@/lib/auth";
import { listCourses, getCourse } from "@/lib/syllabus";
import { doneTopics } from "@/lib/progress";
import { loadActivity } from "@/lib/activity";
import { allUnitStats } from "@/lib/mock-units";
import { buildPlan, MIN_PER_TOPIC, type PlanUnit } from "@/lib/plan";
import { localDay } from "@/lib/insights";
import { ArtPlan } from "@/components/art";

export const metadata: Metadata = { title: "Study plan" };

const semOk = (sem: string, n: number) => /^I or II/.test(sem) || (n === 1 ? /^I\b(?! or)/.test(sem) : /^II\b/.test(sem));
const fmt = (m: number) => (m >= 60 ? `${Math.floor(m / 60)}h${m % 60 ? ` ${m % 60}m` : ""}` : `${m}m`);

export default async function Plan() {
  const { supabase, profile } = await requireOnboarded();
  if (!profile.exam_date) {
    return (
      <div className="flex flex-col gap-4">
        <header className="flex items-center gap-3"><ArtPlan size={56} /><h1 className="text-3xl">Study plan</h1></header>
        <div className="card flex flex-col gap-3"><p>Tell lockin. when your exam is and how many hours you can study each day, and it will lay out a day-by-day plan.</p><Link href="/settings#exam" className="btn w-fit">Set my exam date</Link></div>
      </div>
    );
  }
  const [done, { sessions }] = await Promise.all([doneTopics(supabase), loadActivity(supabase)]);
  const stats = await allUnitStats(profile.id, sessions);
  const units: PlanUnit[] = [];
  for (const s of visibleCourses(profile.branch, listCourses())) {
    if (s.type !== "theory" || !semOk(s.sem, profile.semester ?? 1)) continue;
    const c = getCourse(s.code); if (!c) continue;
    for (const u of c.units) {
      const st = stats.find((x) => x.course === c.code && x.unit === u.n);
      units.push({ course: c.code, short: c.short, unit: u.n, title: u.title, topics: u.topics.length,
        done: u.topics.filter((_, i) => done.has(`${c.code}:${u.n}:${i + 1}`)).length, accuracy: st ? st.pct / 100 : null });
    }
  }
  const today = localDay(new Date(), profile.timezone);
  const plan = buildPlan(units, today, profile.exam_date, profile.study_hours);
  const left = units.reduce((n, u) => n + (u.topics - u.done), 0);
  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center gap-3"><ArtPlan size={56} /><div><h1 className="text-3xl">Study plan</h1><p className="text-muted">Exam on {new Date(profile.exam_date + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })} · {profile.study_hours} h a day · <Link href="/settings#exam">change</Link></p></div></header>
      {plan.days.length === 0 ? (
        <p className="card">Your exam date is today or has passed. <Link href="/settings#exam">Set a new date</Link> to get a plan.</p>
      ) : (
        <>
          <section className="grid grid-cols-3 gap-3" aria-label="Plan summary">
            <div className="card text-center"><b className="text-2xl text-head">{plan.span}</b><p className="text-xs text-muted">days left</p></div>
            <div className="card text-center"><b className="text-2xl text-head">{left}</b><p className="text-xs text-muted">topics to learn</p></div>
            <div className="card text-center"><b className="text-2xl text-head">{fmt(plan.totalMinutes)}</b><p className="text-xs text-muted">planned</p></div>
          </section>
          {plan.overflow > 0 && <p className="err" role="status">There isn&apos;t enough time to cover everything at {profile.study_hours} h a day: about {fmt(plan.overflow)} would be left. Study more hours a day in Settings, or focus on the first units.</p>}
          <p className="text-sm text-muted">We assume about {MIN_PER_TOPIC} minutes per topic you haven&apos;t finished. Finish topics and this plan shortens itself. Miss a day and the plan re-spreads the remaining work from today.</p>
          <ol className="flex flex-col gap-3">
            {plan.days.filter((d) => d.items.length > 0).map((d, i) => (
              <li key={d.date}>
                <details open={i < 3} className="card !p-0">
                  <summary className="flex cursor-pointer items-center justify-between gap-3 p-4">
                    <span className="font-black text-head">{d.date === today ? "Today" : new Date(d.date + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}</span>
                    <span className="text-sm text-muted">{d.items.length} {d.items.length === 1 ? "block" : "blocks"} · {fmt(d.minutes)}</span>
                  </summary>
                  <ul className="flex flex-col gap-2 px-4 pb-4">
                    {d.items.map((it, k) => (
                      <li key={k}><Link href={`/learn/${it.course}/${it.unit}`} className="flex items-center gap-3 rounded-xl bg-soft p-3 text-ink no-underline hover:bg-line">
                        <span className={`rounded-lg px-2 py-1 text-xs font-black ${it.kind === "revise" ? "bg-purple-l text-purple-t" : "bg-green-l text-green-t"}`}>{it.kind === "revise" ? "Revise" : "Learn"}</span>
                        <span className="flex-1"><b className="text-head">{it.short}</b> · Unit {it.unit}: {it.title}</span><span className="text-sm text-muted">{fmt(it.minutes)}</span>
                      </Link></li>
                    ))}
                  </ul>
                </details>
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  );
}
