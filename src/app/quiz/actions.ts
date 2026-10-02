"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { courseUnits, grade, hasBank, newSeed, rightAnswer, sessionGenerated, sessionUnit, toPublic, type Answer, type PublicQuestion } from "@/lib/quiz";
import { getCourse, parseTopicKey } from "@/lib/syllabus";
import { ensurePick, loadSession, practiceLevels } from "@/lib/quiz-session";
import { quizRef, titleSnippet } from "@/lib/revise";
import type { Level } from "@/lib/adaptive";

const startSchema = z.object({
  kind: z.enum(["practice", "topic", "mock", "assignment"]),
  course: z.string().regex(/^[A-Z]{2,3}-[0-9]{3}$/),
  unit: z.number().int().min(1).max(12).default(1),
  topicKey: z.string().max(40).optional(),
});
export type QuizError = { error: string };
const COUNT = { practice: 10, topic: 5, mock: 20, assignment: 10 } as const;


function getClient(s: NonNullable<Awaited<ReturnType<typeof getSession>>>) {
  try {
    return createAdminClient();
  } catch {
    return s.supabase;
  }
}

export async function startQuiz(input: unknown): Promise<QuizError> {
  const s = await getSession();
  if (!s || !s.profile.onboarded_at) redirect("/login");
  const p = startSchema.safeParse(input);
  if (!p.success) return { error: "That quiz isn't available." };
  const { kind, course, unit, topicKey } = p.data;
  const c = getCourse(course);
  if (kind === "mock") {
    if (!c || courseUnits(course).length === 0) return { error: "There are no questions for this subject yet." };
  } else if (!c || !c.units[unit - 1] || !hasBank(course, unit)) return { error: "There are no questions for this unit yet." };
  if (kind === "topic") {
    const t = topicKey ? parseTopicKey(topicKey) : null;
    if (!t || t.course !== course || t.unit !== unit || !c.units[unit - 1].topics[t.topic - 1]) return { error: "That topic doesn't exist." };
  }
  const client = getClient(s);
  if (kind === "assignment") {
    // An assignment is resumable: reopen the one this student left unfinished for this unit.
    let resume: string | null = null;
    try {
      const { data: open } = await client.from("quiz_sessions").select("id").eq("user_id", s.user.id).eq("kind", "assignment")
        .eq("course", course).eq("unit", unit).is("submitted_at", null).order("created_at", { ascending: false }).limit(1);
      resume = (open?.[0] as { id: string } | undefined)?.id ?? null;
    } catch { /* fall through and start a fresh one */ }
    if (resume) redirect(`/quiz/${resume}`);
  }
  let id: string;
  try {
    const { data, error } = await client.rpc("start_quiz_session", {
      p_user: s.user.id, p_course: course, p_unit: unit, p_seed: newSeed(), p_kind: kind, p_topic: kind === "topic" ? topicKey : null, p_total: COUNT[kind],
    });
    if (error) {
      return { error: /too many/.test(error.message) ? "You've done a lot of quizzes today. Come back tomorrow." : `We couldn't start the quiz (${error.message}). Try again.` };
    }
    id = data as string;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Quizzes aren't configured on this server yet.";
    return { error: msg };
  }
  redirect(`/quiz/${id}`);
}

const sessionId = z.string().uuid();
const answerSchema = z.object({
  session: sessionId, index: z.number().int().min(0).max(19),
  answer: z.union([z.number().int().min(0).max(9), z.array(z.number().int().min(0).max(9)).max(10), z.string().max(30)]),
});
export type CheckResult = { ok: true; correct: boolean; why: string; right: string; next?: { q: PublicQuestion; level: Level | null } } | { ok: false; error: string };

export async function checkAnswer(input: unknown): Promise<CheckResult> {
  const s = await getSession();
  if (!s) return { ok: false, error: "Your session expired. Log in again." };
  const p = answerSchema.safeParse(input);
  if (!p.success) return { ok: false, error: "That answer isn't valid." };
  let q = await loadSession(s.user.id, p.data.session);
  if (!q || q.submitted_at || p.data.index >= q.total) return { ok: false, error: "This quiz is finished." };
  const i = p.data.index;
  q = await ensurePick(s.user.id, q, i); // a practice question is only answerable once its adaptive pick is stored
  const gen = sessionGenerated(q, i);
  if (!gen) return { ok: false, error: "This quiz can't be loaded." };
  const raw = gen.q;
  const prior = q.answers[String(i)];
  const correct = prior ? prior.ok : grade(raw, p.data.answer as Answer);
  const client = getClient(s);
  if (!prior) {
    const unit = sessionUnit(q, i);
    const { error } = await client.rpc("record_answer_tagged", {
      p_user: s.user.id, p_session: q.id, p_index: i, p_answer: p.data.answer, p_correct: correct, p_template: gen.t, p_seed: gen.s, p_unit: unit,
    });
    if (error) return { ok: false, error: "We couldn't save that answer." };
    q = { ...q, answers: { ...q.answers, [String(i)]: { a: p.data.answer, ok: correct, t: gen.t, s: gen.s, u: unit } } };
    // every missed question joins the "Revise today" queue, due tomorrow
    if (!correct) {
      try {
        await client.rpc("revise_add", { p_user: s.user.id, p_kind: "quiz", p_ref: quizRef(q.course, unit, gen.t, gen.s), p_course: q.course, p_unit: unit, p_title: titleSnippet(raw.q) });
      } catch { /* the queue is a bonus: never block the quiz on it */ }
    }
  }
  // A mock or an assignment hides the verdict until the end, like a real exam.
  if (q.kind === "mock" || q.kind === "assignment") return { ok: true, correct: false, why: "", right: "" };
  let next: { q: PublicQuestion; level: Level | null } | undefined;
  if (q.kind === "practice" && i + 1 < q.total && !q.answers[String(i + 1)]) {
    try {
      q = await ensurePick(s.user.id, q, i + 1); // choose the next question now that this answer counts
      const nq = sessionGenerated(q, i + 1);
      if (nq) next = { q: toPublic(nq.q), level: (await practiceLevels(q))[i + 1] ?? null };
    } catch { /* the page falls back to picking on reload */ }
  }
  return { ok: true, correct, why: raw.why, right: rightAnswer(raw), next };
}

export type FinishResult = { ok: true; correct: number; total: number; xp: number; topicCompleted: boolean; passed: boolean; replay: boolean } | { ok: false; error: string };

/** `submitEarly` is only honoured for a mock: unanswered questions count as wrong (time up, or the student submits). */
export async function finishQuiz(input: unknown, submitEarly = false): Promise<FinishResult> {
  const s = await getSession();
  if (!s) return { ok: false, error: "Your session expired. Log in again." };
  const id = sessionId.safeParse(input);
  if (!id.success) return { ok: false, error: "Unknown quiz." };
  const client = getClient(s);
  if (submitEarly) {
    const q = await loadSession(s.user.id, id.data);
    if (!q || q.kind !== "mock") return { ok: false, error: "Unknown quiz." };
    if (!q.submitted_at) {
      for (let i = 0; i < q.total; i++) {
        if (q.answers[String(i)]) continue;
        await client.rpc("record_answer", { p_user: s.user.id, p_session: q.id, p_index: i, p_answer: null, p_correct: false });
      }
    }
  }
  const { data, error } = await client.rpc("finish_quiz_session", { p_user: s.user.id, p_session: id.data });
  if (error) return { ok: false, error: /fast/.test(error.message) ? "That was quick! Take a moment to read each question." : "We couldn't finish the quiz." };
  const r = data as { correct: number; total: number; xp: number; topic_completed: boolean; passed?: boolean; replay: boolean };
  revalidatePath("/", "layout");
  return { ok: true, correct: r.correct, total: r.total, xp: r.xp, topicCompleted: r.topic_completed, passed: r.passed ?? false, replay: r.replay };
}
