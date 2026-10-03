"use server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { fromTemplate, grade, rightAnswer, type Answer } from "@/lib/quiz";
import { quizRef, titleSnippet } from "@/lib/revise";
import { indiaToday } from "@/lib/social";
import { isSunday } from "@/lib/sunday";
import { loadSundayRow } from "@/lib/sunday-server";
import type { DailyAnswerResult } from "@/app/(app)/daily/actions";

const input = z.object({
  index: z.number().int().min(0).max(19),
  answer: z.union([z.number().int().min(0).max(9), z.array(z.number().int().min(0).max(9)).max(10), z.string().max(30)]),
});

/** Grades one Sunday Quest answer on the server. The first answer to a question stands; the last one pays XP once. */
export async function answerSunday(raw: unknown): Promise<DailyAnswerResult> {
  const s = await getSession();
  if (!s || !s.profile.onboarded_at) return { ok: false, error: "Your session expired. Log in again." };
  const p = input.safeParse(raw);
  if (!p.success) return { ok: false, error: "That answer isn't valid." };
  const day = indiaToday();
  if (!isSunday(day)) return { ok: false, error: "The Sunday Quest has closed. A new one opens next Sunday." };
  const row = await loadSundayRow(s.user.id, day);
  if (!row) return { ok: false, error: "Open this Sunday's quest first." };
  if (row.completed_at) return { ok: false, error: "You already finished this Sunday's quest." };
  const item = row.items[p.data.index];
  const q = item ? fromTemplate(item.c, item.u, item.t, item.s) : null;
  if (!item || !q) return { ok: false, error: "That question isn't available." };
  const prior = row.answers?.[String(p.data.index)];
  const correct = prior ? prior.ok : grade(q, p.data.answer as Answer);
  let admin;
  try { admin = createAdminClient(); } catch { return { ok: false, error: "The Sunday Quest isn't configured on this server yet." }; }
  const { data, error } = await admin.rpc("sunday_answer", { p_user: s.user.id, p_day: day, p_index: p.data.index, p_answer: p.data.answer, p_ok: correct });
  if (error) return { ok: false, error: /already completed/.test(error.message) ? "You already finished this Sunday's quest." : /closed/.test(error.message) ? "The Sunday Quest has closed." : "We couldn't save that answer. Try again." };
  // a missed question joins the spaced-repetition queue, like every other quiz
  if (!prior && !correct) {
    try { await admin.rpc("revise_add", { p_user: s.user.id, p_kind: "quiz", p_ref: quizRef(item.c, item.u, item.t, item.s), p_course: item.c, p_unit: item.u, p_title: titleSnippet(q.q) }); } catch { /* bonus only */ }
  }
  const r = (data ?? {}) as { done?: boolean; score?: number; xp?: number };
  // No revalidatePath here: it would re-render this page under the student before they see feedback on the last answer.
  // The runner refreshes when "See my score" is pressed; /home and /goals render fresh on every request.
  return { ok: true, correct, why: q.why, right: rightAnswer(q), done: Boolean(r.done), score: r.score, xp: r.xp };
}
