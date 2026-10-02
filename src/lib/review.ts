import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { givenAnswer, rightAnswer, sessionQuestion, sessionUnit } from "@/lib/quiz";
import { getCourse } from "@/lib/syllabus";
import type { QuizSession } from "@/lib/quiz-session";

export type ReviewItem = {
  session: string; index: number; course: string; courseShort: string; unit: number; unitTitle: string; kind: QuizSession["kind"];
  q: string; given: string; right: string; why: string; ok: boolean; at: string | null;
};

/** Rebuild every question of a finished session from its seed and set it beside what the student answered. */
export function reviewSession(s: QuizSession): ReviewItem[] {
  const c = getCourse(s.course);
  const out: ReviewItem[] = [];
  for (let i = 0; i < s.total; i++) {
    const q = sessionQuestion(s, i);
    if (!q) continue;
    const a = s.answers[String(i)];
    const unit = sessionUnit(s, i);
    out.push({
      session: s.id, index: i, course: s.course, courseShort: c?.short ?? s.course, unit, unitTitle: c?.units[unit - 1]?.title ?? `Unit ${unit}`,
      kind: s.kind, q: q.q, given: givenAnswer(q, a?.a), right: rightAnswer(q), why: q.why, ok: Boolean(a?.ok), at: s.submitted_at,
    });
  }
  return out;
}

/** The student's most recent wrong answers across finished quizzes. Scoped to the owner: the service-role client bypasses RLS. */
export async function recentMistakes(userId: string, sessions = 30, max = 60): Promise<ReviewItem[]> {
  const { data } = await createAdminClient().from("quiz_sessions")
    .select("id,course,unit,seed,kind,topic_key,total,answers,submitted_at,correct,xp,created_at")
    .eq("user_id", userId).order("created_at", { ascending: false }).limit(sessions * 2);
  const done = ((data ?? []) as QuizSession[]).filter((s) => s.submitted_at).slice(0, sessions);
  return done.flatMap((s) => reviewSession(s).filter((r) => !r.ok)).slice(0, max);
}
