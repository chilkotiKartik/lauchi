import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { canSeeCourse } from "@/lib/stream";
import { requireOnboarded } from "@/lib/auth";
import { getCourse } from "@/lib/syllabus";
import { courseUnits } from "@/lib/quiz";
import { Crumbs } from "@/components/Crumbs";
import { SubjectPath } from "@/components/learn/SubjectPath";
import { loadSubjectPath } from "@/lib/subject-path";

export async function generateMetadata({ params }: { params: Promise<{ course: string }> }): Promise<Metadata> {
  return { title: `Practice · ${getCourse((await params).course)?.short ?? ""}` };
}

/** Practice for one subject: the same level path as the subject page, so stars and chests are the same everywhere. */
export default async function PracticeCourse({ params }: { params: Promise<{ course: string }> }) {
  const { supabase, profile } = await requireOnboarded();
  const c = getCourse((await params).course);
  if (!c || courseUnits(c.code).length === 0 || !canSeeCourse(profile, c.code, c.type)) notFound();
  const { units, hasQuiz } = await loadSubjectPath(supabase, { id: profile.id, branch: profile.branch, semester: profile.semester }, c);
  return (
    <div className="flex flex-col gap-4">
      <Crumbs items={[{ href: "/practice", label: "Practice" }, { label: c.short }]} />
      <header>
        <h1 className="text-3xl">Practise {c.name}</h1>
        <p className="text-muted">Earn stars in each unit (60%, 75%, 90%) and open its chest. <Link href={`/learn/${c.code}`}>Subject page</Link></p>
      </header>
      <SubjectPath course={c.code} units={units} mockHref={hasQuiz ? "/mock" : null} />
    </div>
  );
}
