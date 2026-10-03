"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { canSeeCourse } from "@/lib/stream";
import { gradeCmsAnswer } from "@/lib/cms-questions";

export type AnswerResult =
  | { ok: true; correct: boolean; right: string; rightIdx: number[]; explanation: string; steps: string[]; xp: number }
  | { ok: false; error: string };

const input = z.object({
  id: z.string().uuid(),
  answer: z.union([z.number().int().min(0).max(5), z.array(z.number().int().min(0).max(5)).max(6), z.string().max(30)]),
});

/** Grades one answer on the server (the key never reaches the browser before this), records it and pays XP once per question per day. */
export async function answerCmsQuestion(raw: unknown): Promise<AnswerResult> {
  const s = await getSession();
  if (!s) return { ok: false, error: "Your session expired. Log in again." };
  if (!s.profile.onboarded_at) return { ok: false, error: "Finish setting up your profile first." };
  const p = input.safeParse(raw);
  if (!p.success) return { ok: false, error: "That answer isn't valid." };
  const g = await gradeCmsAnswer(p.data.id, p.data.answer);
  if (!g.ok) return g;
  if (!canSeeCourse(s.profile, g.course)) return { ok: false, error: "That question isn't available for your course." };
  let xp = 0;
  try {
    const { data, error } = await createAdminClient().rpc("cms_record_attempt", { p_user: s.user.id, p_question: p.data.id, p_correct: g.correct });
    if (error) throw error;
    xp = Number((data as { xp?: number } | null)?.xp ?? 0);
  } catch { return { ok: false, error: "We couldn't save that answer. Try again." }; }
  revalidatePath("/bank", "layout");
  return { ok: true, correct: g.correct, right: g.right, rightIdx: g.rightIdx, explanation: g.explanation, steps: g.steps, xp };
}
