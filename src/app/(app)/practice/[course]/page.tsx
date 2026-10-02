import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { canSeeCourse } from "@/lib/stream";
import { requireOnboarded } from "@/lib/auth";
import { getCourse } from "@/lib/syllabus";
import { courseUnits } from "@/lib/quiz";
import { Crumbs } from "@/components/Crumbs";
import { StartQuizButton } from "@/components/StartQuizButton";

export async function generateMetadata({ params }: { params: Promise<{ course: string }> }): Promise<Metadata> {
  return { title: `Practice · ${getCourse((await params).course)?.short ?? ""}` };
}

export default async function PracticeCourse({ params }: { params: Promise<{ course: string }> }) {
  const { profile } = await requireOnboarded();
  const c = getCourse((await params).course);
  const units = c ? courseUnits(c.code) : [];
  if (!c || units.length === 0 || !canSeeCourse(profile.branch, c.code, c.type)) notFound();
  return (
    <div className="flex flex-col gap-5">
      <Crumbs items={[{ href: "/practice", label: "Practice" }, { label: c.short }]} />
      <h1 className="text-3xl">{c.name}</h1>
      <ol className="flex flex-col gap-3">
        {units.map((n) => (
          <li key={n} className="card flex flex-col gap-3">
            <div><span className="text-xs font-black tracking-wide text-muted">UNIT {n}</span><h2 className="text-lg">{c.units[n - 1]?.title}</h2></div>
            <StartQuizButton kind="practice" course={c.code} unit={n}>Start 10 questions</StartQuizButton>
          </li>
        ))}
      </ol>
    </div>
  );
}
