import type { Metadata } from "next";
import Link from "next/link";
import { SubjectBadge, subjectColor } from "@/components/home/Dashboard";
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
              const i = courses.indexOf(c);
              return (
                <li key={c.code}>
                  <Link href={`/learn/${c.code}`} className="tile h-full !gap-2 !p-4" style={{ ["--accent" as string]: subjectColor(i) }}>
                    <span className="flex items-center gap-3">
                      <SubjectBadge name={c.name} index={i} size={44} />
                      <span className="min-w-0">
                        <span className="block text-[11px] font-black uppercase tracking-wide text-muted">{c.code} · Sem {c.sem.replace(/ \(.*/, "")}</span>
                        <b className="block leading-snug text-head">{c.name}</b>
                      </span>
                    </span>
                    <span className="text-sm font-bold text-muted">{c.type === "lab" ? `${c.items} experiments` : `${c.units} units · ${d} of ${c.items} topics done`}</span>
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
