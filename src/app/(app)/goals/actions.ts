"use server";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { goalsSchema } from "@/lib/goals";
import { indiaToday } from "@/lib/social";
import { weekStart } from "@/lib/streak";

export type SaveGoalsResult = { ok: true } | { ok: false; error: string };

/** Saves the goal for the current India week (Monday to Sunday) for the signed-in student only. */
export async function saveGoals(raw: unknown): Promise<SaveGoalsResult> {
  const s = await getSession();
  if (!s || !s.profile.onboarded_at) return { ok: false, error: "Your session expired. Log in again." };
  const p = goalsSchema.safeParse(raw);
  if (!p.success) return { ok: false, error: "Weekly XP must be 10 to 5000 and quizzes 0 to 100, whole numbers." };
  const { error } = await createAdminClient().from("weekly_goals").upsert(
    { user_id: s.user.id, week_start: weekStart(indiaToday()), xp_target: p.data.xpTarget, quizzes_target: p.data.quizzesTarget, updated_at: new Date().toISOString() },
    { onConflict: "user_id,week_start" });
  if (error) return { ok: false, error: "We couldn't save your goal. Try again." };
  revalidatePath("/goals");
  return { ok: true };
}
