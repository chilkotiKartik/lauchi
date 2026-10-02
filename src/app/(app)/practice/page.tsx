import type { Metadata } from "next";
import Link from "next/link";
import { visibleCourses } from "@/lib/stream";
import { requireOnboarded } from "@/lib/auth";
import { listCourses } from "@/lib/syllabus";
import { courseUnits } from "@/lib/quiz";

export const metadata: Metadata = { title: "Practice" };

export default async function Practice() {
  const { profile } = await requireOnboarded();
  const courses = visibleCourses(profile.branch, listCourses()).filter((c) => courseUnits(c.code).length > 0);
  return (
    <div className="flex flex-col gap-5">
      <div><h1 className="text-3xl">Practice</h1><p className="text-muted">Choose a subject, then a unit. Every quiz has fresh questions, checked instantly.</p></div>
      <ul className="enter grid gap-3 sm:grid-cols-2">
        {courses.map((c) => (
          <li key={c.code}>
            <Link href={`/practice/${c.code}`} className="card flex h-full flex-col gap-1 text-ink no-underline hover:border-blue">
              <span className="text-xs font-black tracking-wide text-muted">{c.code}</span>
              <b className="text-lg text-head">{c.name}</b>
              <span className="text-sm text-muted">{courseUnits(c.code).length} units</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
