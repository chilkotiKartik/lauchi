"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { fromTemplate, grade, rightAnswer, type Answer } from "@/lib/quiz";
import { quizRef, titleSnippet } from "@/lib/revise";
import { indiaToday } from "@/lib/social";
import { loadDailyRow } from "@/lib/daily-server";

const input = z.object({
  index: z.number().int().min(0).max(9),
  answer: z.union([z.number().int().min(0).max(9), z.array(z.number().int().min(0).max(9)).max(10), z.string().max(30)]),
});
export type DailyAnswerResult =
  | { ok: true; correct: boolean; why: string; right: string; done: boolean; score?: number; xp?: number }
  | { ok: false; error: string };

/** Grades one question of today's challenge on the server. The first answer to a question stands; the last one pays XP once. */
export async function answerDaily(raw: unknown): Promise<DailyAnswerResult> {
  const s = await getSession();
  if (!s || !s.profile.onboarded_at) return { ok: false, error: "Your session expired. Log in again." };
  const p = input.safeParse(raw);
  if (!p.success) return { ok: false, error: "That answer isn't valid." };
  const day = indiaToday();
  const row = await loadDailyRow(s.user.id, day);
  if (!row) return { ok: false, error: "Open today's challenge first." };
  if (row.completed_at) return { ok: false, error: "You already finished today's challenge. Come back tomorrow." };
  const item = row.items[p.data.index];
  const q = item ? fromTemplate(item.c, item.u, item.t, item.s) : null;
  if (!item || !q) return { ok: false, error: "That question isn't available." };
  const prior = row.answers?.[String(p.data.index)];
  const correct = prior ? prior.ok : grade(q, p.data.answer as Answer);
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("daily_answer", { p_user: s.user.id, p_day: day, p_index: p.data.index, p_answer: p.data.answer, p_ok: correct });
  if (error) return { ok: false, error: /already completed/.test(error.message) ? "You already finished today's challenge." : "We couldn't save that answer. Try again." };
  if (!prior && !correct) {
    try { await admin.rpc("revise_add", { p_user: s.user.id, p_kind: "quiz", p_ref: quizRef(item.c, item.u, item.t, item.s), p_course: item.c, p_unit: item.u, p_title: titleSnippet(q.q) }); } catch { /* bonus only */ }
  }
  const r = (data ?? {}) as { done?: boolean; score?: number; xp?: number };
  if (r.done) { revalidatePath("/daily"); revalidatePath("/goals"); revalidatePath("/home"); }
  return { ok: true, correct, why: q.why, right: rightAnswer(q), done: Boolean(r.done), score: r.score, xp: r.xp };
}
