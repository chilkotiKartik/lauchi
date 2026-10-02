"use server";
import { getSession } from "@/lib/auth";
import { onboardingSchema } from "@/lib/schemas";

export type OnboardingResult = { ok: true } | { ok: false; message: string };

export async function completeOnboarding(input: unknown): Promise<OnboardingResult> {
  const s = await getSession();
  if (!s) return { ok: false, message: "Your session expired. Log in again." };
  const parsed = onboardingSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const v = parsed.data;
  const { error } = await s.supabase.from("profiles").update({
    name: v.name, branch: v.branch, year: v.year, semester: v.semester,
    daily_goal_xp: v.dailyGoalXp, timezone: v.timezone, onboarded_at: new Date().toISOString(),
  }).eq("id", s.user.id);
  if (error) return { ok: false, message: "We couldn't save that. Try again." };
  const { error: consentError } = await s.supabase.rpc("record_consent", { p_version: "2026-09" });
  if (consentError) return { ok: false, message: "We couldn't record your consent. Try again." };
  return { ok: true };
}
