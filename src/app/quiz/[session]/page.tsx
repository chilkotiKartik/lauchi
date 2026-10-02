import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireOnboarded } from "@/lib/auth";
import { ensurePick, loadSession, practiceLevels } from "@/lib/quiz-session";
import { MOCK_MINUTES, needsPick, sessionQuestion, toPublic } from "@/lib/quiz";
import { getCourse } from "@/lib/syllabus";
import { QuizRunner } from "./QuizRunner";
import { labsFor } from "@/labs/registry";
import { hasPyq } from "@/lib/pyq";

export const metadata: Metadata = { title: "Quiz" };

export default async function QuizPage({ params }: { params: Promise<{ session: string }> }) {
  const { user } = await requireOnboarded();
  const { session } = await params;
  let q = await loadSession(user.id, session);
  if (!q) notFound();
  // Adaptive practice: each question after the first is chosen when the one before it is answered. Make sure the
  // first open question has its pick stored (so a reload shows the same one); later ones stay unknown for now.
  const open = Array.from({ length: q.total }, (_, i) => i).find((i) => !q!.answers[String(i)]);
  if (q.kind === "practice" && !q.submitted_at && open !== undefined) q = await ensurePick(user.id, q, open);
  const s = q;
  const levels = await practiceLevels(s);
  const course = getCourse(q.course);
  const unit = course?.units[q.unit - 1];
  const back = q.kind === "mock" ? "/mock" : q.kind === "assignment" ? "/assignments" : q.topic_key ? `/learn/${q.course}/${q.unit}` : "/practice";
  const pending = (i: number) => needsPick(s, i);
  const questions = Array.from({ length: s.total }, (_, i) => {
    if (pending(i)) return null;
    const raw = sessionQuestion(s, i);
    return raw ? toPublic(raw) : null;
  });
  if (questions.some((x, i) => x === null && !pending(i))) notFound();
  const answered = Object.keys(q.answers).map(Number);
  return (
    <QuizRunner
      sessionId={q.id} questions={questions} answered={answered} levels={s.kind === "practice" ? levels : undefined}
      title={q.kind === "mock" ? `Mock test · ${course?.short ?? q.course}` : q.kind === "assignment" ? `Assignment · ${course?.short ?? q.course} · Unit ${q.unit}` : `${course?.short ?? q.course} · ${unit?.title ?? "Unit " + q.unit}`} backHref={back} isTopic={q.kind === "topic"}
      assignment={q.kind === "assignment"}
      mock={q.kind === "mock" ? { endsAt: new Date(q.created_at).getTime() + MOCK_MINUTES * 60_000 } : null}
      submitted={q.submitted_at ? { correct: q.correct ?? 0, total: q.total, xp: q.xp ?? 0 } : null}
      coach={q.kind === "mock" || q.kind === "assignment" ? undefined : {
        course: q.course, courseName: course?.name ?? q.course, unit: q.unit, unitTitle: unit?.title ?? `Unit ${q.unit}`,
        labs: labsFor(q.course, q.unit).slice(0, 2).map((l) => ({ id: l.id, title: l.title })), pyq: hasPyq(q.course),
      }}
    />
  );
}
