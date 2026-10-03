import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { canSeeCourse } from "@/lib/stream";
import { requireOnboarded } from "@/lib/auth";
import { getCourse } from "@/lib/syllabus";
import { doneTopics } from "@/lib/progress";
import { hasBank } from "@/lib/quiz";
import { Bar, Crumbs } from "@/components/Crumbs";
import { StartQuizButton } from "@/components/StartQuizButton";
import { Rich } from "@/lib/rich";
import { CourseResources } from "@/components/resources/CourseResources";

export async function generateMetadata({ params }: { params: Promise<{ course: string; unit: string }> }): Promise<Metadata> {
  const p = await params; const u = getCourse(p.course)?.units[+p.unit - 1];
  return { title: u?.title ?? "Unit" };
}

export default async function UnitPage({ params }: { params: Promise<{ course: string; unit: string }> }) {
  const { supabase, profile } = await requireOnboarded();
  const p = await params; const n = Number(p.unit);
  const c = getCourse(p.course); const u = c && Number.isInteger(n) ? c.units[n - 1] : undefined;
  if (!c || !u || !canSeeCourse(profile, c.code, c.type)) notFound();
  const done = await doneTopics(supabase);
  const d = u.topics.filter((_, i) => done.has(`${c.code}:${n}:${i + 1}`)).length;
  return (
    <div className="flex flex-col gap-5">
      <Crumbs items={[{ href: "/learn", label: "Learn" }, { href: `/learn/${c.code}`, label: c.short }, { label: `Unit ${n}` }]} />
      <header className="flex flex-col gap-2">
        <p className="text-xs font-black tracking-wide text-muted">UNIT {n}{u.hours ? ` · ${u.hours} HOURS` : ""}</p>
        <h1 className="text-3xl">{u.title}</h1>
        <Bar value={d} max={u.topics.length} label="Unit progress" />
        <p className="text-sm text-muted">{d} of {u.topics.length} topics done</p>
      </header>
      <section aria-labelledby="topics" className="flex flex-col gap-2">
        <h2 id="topics" className="text-xl">Topics</h2>
        <ol className="flex flex-col gap-2">
          {u.topics.map((t, i) => {
            const score = done.get(`${c.code}:${n}:${i + 1}`);
            return (
              <li key={i}>
                <Link href={`/learn/${c.code}/${n}/${i + 1}`} className="card flex items-center gap-3 !py-3 text-ink no-underline hover:border-blue">
                  <span aria-hidden className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 text-sm font-black ${score !== undefined ? "border-green bg-green text-[#0d3a19]" : "border-line text-muted"}`}>{score !== undefined ? "✓" : i + 1}</span>
                  <span className="flex-1 font-extrabold text-head">{t}</span>
                  <span className="text-xs text-muted">{score !== undefined ? `best ${score}%` : ""}<span className="sr-only">{score !== undefined ? " completed" : " not started"}</span></span>
                </Link>
              </li>
            );
          })}
        </ol>
      </section>
      <CourseResources course={c.code} unit={n} />
      {hasBank(c.code, n) && (
        <section className="card flex flex-col gap-2"><h2 className="text-lg">Practice this unit</h2><p className="text-sm text-muted">10 fresh questions every time, checked instantly.</p>
          <StartQuizButton kind="practice" course={c.code} unit={n}>Start practice</StartQuizButton></section>
      )}
      {u.formulas.length > 0 && (
        <section aria-labelledby="formulas" className="flex flex-col gap-2"><h2 id="formulas" className="text-xl">Key formulas</h2>
          <ul className="card flex flex-col gap-2">{u.formulas.map((f, i) => <li key={i} className="ml-5 list-disc"><Rich text={f} /></li>)}</ul></section>
      )}
      {u.hints.length > 0 && (
        <section aria-labelledby="hints" className="flex flex-col gap-2"><h2 id="hints" className="text-xl">How to prepare</h2>
          <ul className="card flex flex-col gap-2">{u.hints.map((f, i) => <li key={i} className="ml-5 list-disc">{f}</li>)}</ul></section>
      )}
    </div>
  );
}
