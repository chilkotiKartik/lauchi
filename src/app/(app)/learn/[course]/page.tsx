import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { canSeeCourse } from "@/lib/stream";
import { requireOnboarded } from "@/lib/auth";
import { getCourse } from "@/lib/syllabus";
import { doneTopics } from "@/lib/progress";
import { Bar, Crumbs } from "@/components/Crumbs";

export async function generateMetadata({ params }: { params: Promise<{ course: string }> }): Promise<Metadata> {
  const c = getCourse((await params).course);
  return { title: c?.name ?? "Course" };
}

export default async function CoursePage({ params }: { params: Promise<{ course: string }> }) {
  const { supabase, profile } = await requireOnboarded();
  const c = getCourse((await params).course);
  if (!c || !canSeeCourse(profile.branch, c.code, c.type)) notFound();
  const done = await doneTopics(supabase);
  return (
    <div className="flex flex-col gap-5">
      <Crumbs items={[{ href: "/learn", label: "Learn" }, { label: c.name }]} />
      <header>
        <p className="text-xs font-black tracking-wide text-muted">{c.code} · L-T-P {c.ltp} · {c.credits} credits · Sem {c.sem}</p>
        <h1 className="text-3xl">{c.name}</h1>
        {c.marks?.total ? <p className="text-muted">Internal {(c.marks.ct ?? 0) + (c.marks.ta ?? 0)} · End-sem {c.marks.ese} · Total {c.marks.total} marks</p> : null}
        {c.note && <p className="mt-2 text-sm text-muted">{c.note}</p>}
      </header>
      {c.units.length > 0 && (
        <section aria-labelledby="units" className="flex flex-col gap-3">
          <h2 id="units" className="text-xl">Units</h2>
          <ol className="flex flex-col gap-3">
            {c.units.map((u) => {
              const d = u.topics.filter((_, i) => done.has(`${c.code}:${u.n}:${i + 1}`)).length;
              return (
                <li key={u.n}>
                  <Link href={`/learn/${c.code}/${u.n}`} className="card flex flex-col gap-2 text-ink no-underline hover:border-blue">
                    <span className="text-xs font-black tracking-wide text-muted">UNIT {u.n}{u.hours ? ` · ${u.hours} HOURS` : ""}</span>
                    <b className="text-lg text-head">{u.title}</b>
                    <span className="text-sm text-muted">{d} of {u.topics.length} topics done</span>
                    <Bar value={d} max={u.topics.length} label={`Unit ${u.n} progress`} />
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>
      )}
      {c.exps.length > 0 && (
        <section aria-labelledby="exps" className="flex flex-col gap-3">
          <h2 id="exps" className="text-xl">{c.type === "lab" ? "Experiments" : "Practicals"}</h2>
          <ol className="flex flex-col gap-2">
            {c.exps.map((e) => (
              <li key={e.n}><Link href={`/learn/${c.code}/lab/${e.n}`} className="card block !py-3 text-ink no-underline hover:border-blue"><b className="text-head">{e.n}. {e.title}</b></Link></li>
            ))}
          </ol>
        </section>
      )}
      {c.objectives.length > 0 && (
        <details className="card"><summary className="cursor-pointer font-black text-head">Course objectives and outcomes</summary>
          <ul className="mt-3 flex flex-col gap-1 text-sm">{[...c.objectives, ...c.outcomes].map((o, i) => <li key={i} className="ml-5 list-disc">{o}</li>)}</ul>
        </details>
      )}
      {c.ref.length > 0 && (
        <details className="card"><summary className="cursor-pointer font-black text-head">Books and references</summary>
          <ul className="mt-3 flex flex-col gap-1 text-sm">{[...c.text, ...c.ref].map((o, i) => <li key={i} className="ml-5 list-disc">{o}</li>)}</ul>
        </details>
      )}
    </div>
  );
}
