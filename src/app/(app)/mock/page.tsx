import type { Metadata } from "next";
import Link from "next/link";
import { visibleCourses } from "@/lib/stream";
import { requireOnboarded } from "@/lib/auth";
import { listCourses } from "@/lib/syllabus";
import { courseUnits, MOCK_MINUTES } from "@/lib/quiz";
import { StartQuizButton } from "@/components/StartQuizButton";
import { ArtMock } from "@/components/art";

export const metadata: Metadata = { title: "Mock test" };

export default async function Mock() {
  const { supabase, profile } = await requireOnboarded();
  const courses = visibleCourses(profile.branch, listCourses()).filter((c) => courseUnits(c.code).length > 0);
  const { data } = await supabase.from("quiz_sessions").select("id,course,total,correct,submitted_at,created_at").eq("kind", "mock").order("created_at", { ascending: false }).limit(20);
  const past = ((data ?? []) as { id: string; course: string; total: number; correct: number | null; submitted_at: string | null; created_at: string }[]).filter((s) => s.submitted_at).slice(0, 8);
  const short = (code: string) => courses.find((c) => c.code === code)?.short ?? code;
  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center gap-3"><ArtMock size={56} /><div><h1 className="text-3xl">Mock test</h1><p className="text-muted">Exam-hall practice: 20 questions from every unit of one subject, {MOCK_MINUTES} minutes.</p></div></header>
      <ul className="card flex flex-col gap-2 text-[0.95rem]">
        <li className="ml-5 list-disc">A timer counts down. When it hits zero, your test is submitted automatically.</li>
        <li className="ml-5 list-disc">A palette shows which questions you have answered. Jump to any of them.</li>
        <li className="ml-5 list-disc">No right or wrong until you submit. Answers are final once saved.</li>
        <li className="ml-5 list-disc">After the test you can review every question with the worked answer.</li>
      </ul>
      <ul className="enter grid gap-3 sm:grid-cols-2">
        {courses.map((c) => (
          <li key={c.code} className="tile" style={{ ["--accent" as string]: "#a970ff" }}>
            <span className="text-xs font-black tracking-wide text-muted">{c.code}</span>
            <b>{c.name}</b>
            <span className="text-sm text-muted">{courseUnits(c.code).length} units covered</span>
            <StartQuizButton kind="mock" course={c.code} unit={1}>Start mock test</StartQuizButton>
          </li>
        ))}
      </ul>
      {past.length > 0 && (
        <section className="card" aria-labelledby="pm">
          <h2 id="pm" className="mb-3 text-xl">Your recent mocks</h2>
          <ul className="flex flex-col gap-2">
            {past.map((s) => (
              <li key={s.id}><Link href={`/quiz/${s.id}/review`} className="flex items-center justify-between rounded-xl bg-soft p-3 text-ink no-underline hover:bg-line">
                <span><b className="text-head">{short(s.course)}</b> · {new Date(s.created_at).toLocaleDateString("en-IN")}</span>
                <span className="font-black text-head">{s.correct} / {s.total}</span>
              </Link></li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
