import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { chooseTemplate, difficultyTable, levelFor, recentFromSessions, templatePriors, type Level, type TemplateStat } from "@/lib/adaptive";
import { needsPick, sessionGenerated } from "@/lib/quiz-core";

export type QuizSession = {
  id: string; course: string; unit: number; seed: number; kind: "practice" | "topic" | "mock" | "assignment"; topic_key: string | null; total: number;
  answers: Record<string, { a: unknown; ok: boolean; t?: number; s?: number; u?: number }>; picks?: Record<string, number> | null; submitted_at: string | null; correct: number | null; xp: number | null; created_at: string;
};

/** Always scoped to the owner: the service-role client bypasses RLS, so the user id filter is the authorization check. */
export async function loadSession(userId: string, id: string): Promise<QuizSession | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data } = await createAdminClient().from("quiz_sessions")
    .select("id,course,unit,seed,kind,topic_key,total,answers,picks,submitted_at,correct,xp,created_at").eq("id", id).eq("user_id", userId).single();
  return (data as QuizSession | null) ?? null;
}

// ------------------------------------------------------------------ adaptive practice (see src/lib/adaptive.ts)

const statCache = new Map<string, { at: number; table: number[] }>();
/** Estimated success rate of every template in a unit: the question-based prior, refined by all students' answers. */
export async function unitDifficulty(course: string, unit: number): Promise<number[]> {
  const key = `${course}:${unit}`;
  const hit = statCache.get(key);
  if (hit && Date.now() - hit.at < 10 * 60_000) return hit.table;
  let stats: TemplateStat[] = [];
  try {
    const { data } = await createAdminClient().rpc("quiz_template_stats", { p_course: course, p_unit: unit });
    stats = ((data ?? []) as { template: number; attempts: number | string; correct: number | string }[])
      .map((r) => ({ template: Number(r.template), attempts: Number(r.attempts), correct: Number(r.correct) }));
  } catch { /* priors alone still work */ }
  const table = difficultyTable(templatePriors(course, unit), stats);
  statCache.set(key, { at: Date.now(), table });
  return table;
}

/** The student's last 20 answers in this unit (practice, topic quizzes and assignments), oldest first. */
async function recentAnswers(userId: string, course: string, unit: number): Promise<boolean[]> {
  const { data } = await createAdminClient().from("quiz_sessions").select("answers,unit,kind,created_at")
    .eq("user_id", userId).eq("course", course).eq("unit", unit).in("kind", ["practice", "topic", "assignment"])
    .order("created_at", { ascending: false }).limit(12);
  return recentFromSessions((data ?? []) as { answers: Record<string, { ok?: boolean; u?: number }>; unit: number; kind: string }[], unit);
}

/** Make sure question `index` of a practice session has its adaptive template stored; returns the session with it. */
export async function ensurePick(userId: string, s: QuizSession, index: number): Promise<QuizSession> {
  if (!needsPick(s, index) || index >= s.total) return s;
  const [difficulty, recent] = await Promise.all([unitDifficulty(s.course, s.unit), recentAnswers(userId, s.course, s.unit)]);
  const used = Array.from({ length: s.total }, (_, i) => i).filter((i) => i !== index && (i === 0 || s.picks?.[String(i)] !== undefined || s.answers[String(i)]))
    .map((i) => sessionGenerated(s, i)?.t).filter((t): t is number => typeof t === "number");
  const t = chooseTemplate({ difficulty, recent, used, seed: s.seed, index });
  const { data, error } = await createAdminClient().rpc("set_quiz_pick", { p_user: userId, p_session: s.id, p_index: index, p_template: t });
  if (error) return s;
  return { ...s, picks: { ...(s.picks ?? {}), [String(index)]: Number(data) } };
}

/** "warming up" / "steady" / "challenge" for each known question of a practice session (null elsewhere). */
export async function practiceLevels(s: QuizSession): Promise<(Level | null)[]> {
  if (s.kind !== "practice") return Array.from({ length: s.total }, () => null);
  const table = await unitDifficulty(s.course, s.unit);
  return Array.from({ length: s.total }, (_, i) => {
    if (needsPick(s, i)) return null;
    const t = sessionGenerated(s, i)?.t;
    return typeof t === "number" && table[t] !== undefined ? levelFor(table[t], table) : null;
  });
}
