import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { canSeeCourse } from "@/lib/stream";
import { requireOnboarded } from "@/lib/auth";
import { getCourse } from "@/lib/syllabus";
import { courseUnits } from "@/lib/quiz";
import { Crumbs } from "@/components/Crumbs";
import { DuolingoCoursePath, type DuolingoUnit } from "@/components/DuolingoCoursePath";
import { loadActivity } from "@/lib/activity";
import { allUnitStats } from "@/lib/mock-units";

export async function generateMetadata({ params }: { params: Promise<{ course: string }> }): Promise<Metadata> {
  return { title: `Practice · ${getCourse((await params).course)?.short ?? ""}` };
}

export default async function PracticeCourse({ params }: { params: Promise<{ course: string }> }) {
  const { supabase, profile } = await requireOnboarded();
  const c = getCourse((await params).course);
  const unitsNumbers = c ? courseUnits(c.code) : [];
  if (!c || unitsNumbers.length === 0 || !canSeeCourse(profile.branch, c.code, c.type)) notFound();

  const { sessions } = await loadActivity(supabase);
  const unitStats = await allUnitStats(profile.id, sessions);
  const courseStats = unitStats.filter((u) => u.course === c.code);

  const weakest = courseStats.sort((a, b) => a.pct - b.pct)[0];
  const weakUnitNumber = weakest && weakest.pct < 60 ? weakest.unit : null;

  const duolingoUnits: DuolingoUnit[] = unitsNumbers.map((n, i) => {
    const st = courseStats.find((s) => s.unit === n);
    const hasAttempts = st ? st.attempts > 0 : false;
    const isCompleted = st ? st.pct >= 70 : false;
    const isUnlocked = i === 0 || isCompleted || hasAttempts; // First unit always open

    return {
      n,
      title: c.units[n - 1]?.title ?? `Unit ${n}`,
      isUnlocked: true, // Let all UTU units remain accessible with visual completion cues
      isCompleted,
      isNext: !isCompleted && isUnlocked,
      accuracy: st ? st.pct : undefined,
    };
  });

  return (
    <div className="flex flex-col gap-4">
      <Crumbs items={[{ href: "/practice", label: "Practice" }, { label: c.short }]} />
      <DuolingoCoursePath
        courseCode={c.code}
        courseName={c.name}
        units={duolingoUnits}
        weakUnit={weakUnitNumber}
      />
    </div>
  );
}
