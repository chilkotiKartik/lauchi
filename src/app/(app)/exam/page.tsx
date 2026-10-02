import type { Metadata } from "next";
import Link from "next/link";
import { requireOnboarded } from "@/lib/auth";
import { localDay } from "@/lib/insights";
import { daysBetween } from "@/lib/plan";
import { weakUnits, type StoredTask } from "@/lib/exam";
import { dueCount } from "@/lib/revise";
import { ArtPlan } from "@/components/art";
import { ExamDateForm } from "@/components/exam/ExamDateForm";
import { ScopeForm, type ScopeCourse } from "@/components/exam/ScopeForm";
import { BuildButton, Schedule, type ScheduleTask } from "@/components/exam/Schedule";
import { loadAllUnits, loadScope } from "./data";

export const metadata: Metadata = { title: "Exam prep" };

export default async function Exam() {
  const s = await requireOnboarded();
  const { supabase, profile } = s;
  const today = localDay(new Date(), profile.timezone);
  const left = profile.exam_date ? daysBetween(today, profile.exam_date) : null;
  const head = (
    <header className="flex items-center gap-3"><ArtPlan size={56} /><div><h1 className="text-3xl">Exam prep</h1><p className="text-muted">Your countdown, weak spots and a day-by-day revision schedule.</p></div></header>
  );
  if (!profile.exam_date || (left !== null && left <= 0)) {
    return (
      <div className="flex flex-col gap-5">{head}
        <section className="card flex flex-col gap-3" aria-labelledby="date-h">
          <h2 id="date-h" className="text-xl">{profile.exam_date ? "Your exam date has passed" : "When is your exam?"}</h2>
          <p>Pick the date of your first exam and lockin. will lay out what to revise each day until then.</p>
          <ExamDateForm examDate={null} hours={profile.study_hours} min={today} />
        </section>
      </div>
    );
  }
  const all = await loadAllUnits(s);
  const [{ units, chosen }, tasksRes, due] = await Promise.all([loadScope(s, all), supabase.from("exam_tasks").select("id,day,course,unit,kind,minutes,done").order("day", { ascending: true }).limit(2000), dueCount(supabase, profile.id).catch(() => 0)]);
  const info = new Map(all.map((u) => [`${u.course}:${u.unit}`, u]));
  const short = new Map(all.map((u) => [u.course, u.short]));
  const tasks: ScheduleTask[] = ((tasksRes.data ?? []) as StoredTask[]).map((t) => ({ ...t, unit: Number(t.unit), minutes: Number(t.minutes), short: short.get(t.course) ?? t.course, title: info.get(`${t.course}:${t.unit}`)?.title ?? "" }));
  const weak = weakUnits(units, 5);
  const courses: ScopeCourse[] = [...new Set(all.map((u) => u.course))].map((code) => ({
    code, short: short.get(code) ?? code,
    units: all.filter((u) => u.course === code).map((u) => ({ n: u.unit, title: u.title, picked: chosen ? chosen.has(`${code}:${u.unit}`) : true })),
  }));
  const topicsLeft = units.reduce((n, u) => n + (u.topics - u.done), 0);
  return (
    <div className="flex flex-col gap-5">{head}
      <section className="grid grid-cols-3 gap-3" aria-label="Countdown">
        <div className="card text-center"><b className="text-3xl text-head">{left}</b><p className="text-xs text-muted">{left === 1 ? "day left" : "days left"}</p></div>
        <div className="card text-center"><b className="text-3xl text-head">{topicsLeft}</b><p className="text-xs text-muted">topics to learn</p></div>
        <div className="card text-center"><b className="text-3xl text-head">{due}</b><p className="text-xs text-muted">to <Link href="/revise">revise today</Link></p></div>
      </section>
      <section className="card flex flex-col gap-2" aria-labelledby="date-h">
        <h2 id="date-h" className="text-xl">Exam on {new Date(profile.exam_date + "T00:00:00").toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</h2>
        <ExamDateForm examDate={profile.exam_date} hours={profile.study_hours} min={today} />
        <p className="text-sm text-muted">Want a topic-by-topic learning plan by hours a day? See your <Link href="/plan">Study plan</Link>.</p>
      </section>
      <section className="card flex flex-col gap-2" aria-labelledby="weak-h">
        <h2 id="weak-h" className="text-xl">Weak spots</h2>
        {weak.length === 0 ? <p className="text-muted">Take a few <Link href="/practice">practice quizzes</Link> and your weakest units will show up here.</p> : (
          <ul className="flex flex-col gap-2">
            {weak.map((u) => (
              <li key={`${u.course}:${u.unit}`} className="flex flex-wrap items-center gap-2 rounded-xl bg-soft p-3">
                <span className="min-w-0 flex-1"><b className="text-head">{u.short}</b> · Unit {u.unit}: {u.title}</span>
                <span className="chip chip-hot">{Math.round((u.accuracy ?? 0) * 100)}% right</span>
                <Link href={`/practice/${u.course}`} className="text-sm font-extrabold">Practice</Link>
                <Link href={`/pyq?course=${u.course}&unit=${u.unit}`} className="text-sm font-extrabold">PYQs</Link>
              </li>
            ))}
          </ul>
        )}
        <p className="text-sm text-muted">Based on your own quiz and mock results. Units you haven&apos;t tried yet count as half-weak in the schedule.</p>
      </section>
      <section className="flex flex-col gap-3" aria-labelledby="sched-h">
        <h2 id="sched-h" className="text-xl">Revision schedule</h2>
        {tasks.length === 0 ? (
          <div className="card flex flex-col gap-3"><p>Build a schedule from today to {new Date(profile.exam_date + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "long" })}. Weak and unfinished units come first.</p><BuildButton /></div>
        ) : <Schedule tasks={tasks} today={today} />}
      </section>
      <section className="card" aria-labelledby="scope-h">
        <details>
          <summary className="cursor-pointer text-xl font-black text-head" id="scope-h">Choose subjects and units {chosen ? `(${chosen.size} picked)` : "(all included)"}</summary>
          <div className="flex flex-col gap-3 pt-3">
            <p className="text-sm text-muted">Tick only what your exam covers, save, then use Regenerate schedule.</p>
            <ScopeForm courses={courses} />
          </div>
        </details>
      </section>
    </div>
  );
}
