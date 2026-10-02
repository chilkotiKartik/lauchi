import type { Metadata } from "next";
import Link from "next/link";
import { visibleCourses } from "@/lib/stream";
import { requireOnboarded } from "@/lib/auth";
import { listCourses, type CourseSummary } from "@/lib/syllabus";
import { countDone, doneTopics } from "@/lib/progress";
import { Bar } from "@/components/Crumbs";

export const metadata: Metadata = { title: "Learn" };

const GROUPS: [CourseSummary["type"], string][] = [["theory", "Theory subjects"], ["lab", "Labs and practicals"], ["bridge", "Bridge courses (Biotechnology)"], ["minor", "Minor: Advance Web Development"]];

export default async function Learn() {
  const { supabase, profile } = await requireOnboarded();
  const done = await doneTopics(supabase);
  const courses = visibleCourses(profile.branch, listCourses());
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl">Learn</h1>
        <p className="text-muted">Pick a subject, then a unit, then a topic. {courses.length} courses, {courses.reduce((s, c) => s + c.items, 0)} topics and experiments.</p>
      </div>
      {GROUPS.map(([type, title]) => (
        <section key={type} aria-labelledby={`g-${type}`} className="flex flex-col gap-3">
          <h2 id={`g-${type}`} className="text-xl">{title}</h2>
          <ul className="enter grid gap-3 sm:grid-cols-2">
            {courses.filter((c) => c.type === type).map((c) => {
              const d = countDone(done, c.code + ":");
              return (
                <li key={c.code}>
                  <Link href={`/learn/${c.code}`} className="card flex h-full flex-col gap-2 text-ink no-underline hover:border-blue">
                    <span className="text-xs font-black tracking-wide text-muted">{c.code} · SEM {c.sem.replace(/ \(.*/, "").toUpperCase()}</span>
                    <b className="text-lg leading-tight text-head">{c.name}</b>
                    <span className="text-sm text-muted">{c.type === "lab" ? `${c.items} experiments` : `${c.units} units · ${c.items} topics`}</span>
                    {c.type !== "lab" && <Bar value={d} max={c.items} label={`${c.name} progress`} />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
