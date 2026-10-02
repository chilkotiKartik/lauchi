import type { Metadata } from "next";
import { visibleCourses } from "@/lib/stream";
import { requireOnboarded } from "@/lib/auth";
import { getCourse, listCourses } from "@/lib/syllabus";
import { GRADES } from "@/lib/marks";
import { MarksCalc, type MarkSubject } from "@/components/MarksCalc";
import { ArtScores } from "@/components/art";

export const metadata: Metadata = { title: "Marks & SGPA" };

export default async function Marks() {
  const { profile } = await requireOnboarded();
  const subjects: MarkSubject[] = [];
  for (const c of visibleCourses(profile.branch, listCourses())) {
    if (c.type !== "theory" && c.type !== "bridge") continue;
    const m = getCourse(c.code)?.marks;
    if (m?.ct && m?.ta && m?.ese) subjects.push({ code: c.code, name: c.name, short: c.short, credits: c.credits, ct: m.ct, ta: m.ta, ese: m.ese });
  }
  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center gap-3"><ArtScores size={56} /><div><h1 className="text-3xl">Marks &amp; SGPA</h1><p className="text-muted">What do I need in the end sem to pass, or to hit my target grade?</p></div></header>
      <p role="note" className="card text-[0.95rem]">
        Uses each subject&apos;s own split from its syllabus (for most theory subjects: class tests 30 + teacher&apos;s assessment 20 + end sem 100). A pass here means at least 30% in the end sem and 40% overall. Grades: {GRADES.slice(0, 7).map((g) => `${g[0]} ${g[2]}%`).join(", ")}. These rules and the grade table come from your reference site, so check them against what your college publishes.
      </p>
      <MarksCalc subjects={subjects} />
    </div>
  );
}
