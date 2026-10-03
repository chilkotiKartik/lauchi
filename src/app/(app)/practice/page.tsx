import type { Metadata } from "next";
import Link from "next/link";
import { visibleCourses } from "@/lib/stream";
import { requireOnboarded } from "@/lib/auth";
import { listCourses } from "@/lib/syllabus";
import { courseUnits } from "@/lib/quiz";
import { loadActivity } from "@/lib/activity";
import { allUnitStats } from "@/lib/mock-units";
import { starsFor } from "@/lib/subject-progress";
import { SubjectBadge, subjectColor } from "@/components/home/Dashboard";

export const metadata: Metadata = { title: "Practice" };

export default async function Practice() {
  const { supabase, profile } = await requireOnboarded();
  const courses = visibleCourses(profile, listCourses()).filter((c) => courseUnits(c.code).length > 0);
  const { sessions } = await loadActivity(supabase);
  const stats = (await allUnitStats(profile.id, sessions)).filter((s) => s.attempts > 0);
  return (
    <div className="flex flex-col gap-5">
      <div><h1 className="text-3xl">Practice</h1><p className="text-muted">Pick a subject to open its level path. Every quiz has fresh questions, checked instantly. Earn up to 3 stars per unit.</p></div>
      <ul className="enter grid gap-3 sm:grid-cols-2">
        {courses.map((c, i) => {
          const units = courseUnits(c.code).length;
          const mine = stats.filter((s) => s.course === c.code);
          const stars = mine.reduce((a, s) => a + starsFor(s.pct), 0);
          return (
            <li key={c.code}>
              <Link href={`/practice/${c.code}`} className="tile h-full !flex-row !items-center !gap-3 !p-4" style={{ ["--accent" as string]: subjectColor(i) }}>
                <SubjectBadge name={c.name} index={i} />
                <span className="min-w-0 flex-1">
                  <span className="block text-[11px] font-black uppercase tracking-wide text-muted">{c.code} · {units} units</span>
                  <b className="block leading-snug text-head">{c.name}</b>
                  <span className="mt-1 block text-sm font-bold text-muted">{mine.length ? <><span className="text-gold-t" aria-hidden>★</span> {stars}/{units * 3} stars · {mine.length} of {units} units tried</> : "Not started yet · tap to begin"}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
