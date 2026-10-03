import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { canSeeCourse } from "@/lib/stream";
import { requireOnboarded } from "@/lib/auth";
import { StartPaper } from "@/components/paper/StartPaper";
import { Trend } from "@/components/paper/Trend";
import { History } from "@/components/paper/History";
import { isPaperCourse, loadHistory, subjectName } from "../data";

export const metadata: Metadata = { title: "Start a paper" };

export default async function StartScreen({ params }: { params: Promise<{ course: string }> }) {
  const { course } = await params;
  if (!isPaperCourse(course)) notFound();
  const { supabase, profile } = await requireOnboarded();
  if (!canSeeCourse(profile, course)) notFound();
  const rows = await loadHistory(supabase, course);
  const scores = rows.filter((r) => r.total !== null).map((r) => r.total as number).reverse();
  return (
    <div className="flex flex-col gap-5">
      <section className="pp-hall" aria-labelledby="sh">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <p className="pp-eyebrow">{course} · End-semester paper</p>
          <h1 id="sh" className="text-3xl text-white">{subjectName(course)}</h1>
          <p className="text-white/85">Max marks 100 · Time 3 hours · 5 questions, one from each unit</p>
        </div>
      </section>
      <section className="card flex flex-col gap-3" aria-labelledby="rules">
        <h2 id="rules" className="text-xl">The paper</h2>
        <ul className="ml-5 list-disc leading-relaxed">
          <li>Five questions, one per unit. Each has three parts, (a), (b) and (c), of 10 marks each.</li>
          <li><b>Attempt any TWO parts of each question.</b></li>
          <li>The questions come from real previous-year papers, and the ones asked most often are the most likely to appear.</li>
          <li>Write your answers on paper. Tick the parts you attempt here, then mark yourself with the model answers afterwards.</li>
        </ul>
        <p className="text-sm text-muted">UTU-style pattern based on recent papers; check your own paper&apos;s instructions.</p>
        <StartPaper course={course} />
      </section>
      <section aria-labelledby="hist" className="flex flex-col gap-3">
        <h2 id="hist" className="text-xl">Your {subjectName(course)} papers</h2>
        <Trend scores={scores} />
        <History rows={rows} />
      </section>
      <p className="text-sm"><Link href="/paper">← All subjects</Link></p>
    </div>
  );
}
