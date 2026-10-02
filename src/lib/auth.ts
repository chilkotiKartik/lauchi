import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPublicEnv } from "@/lib/env";

export type Profile = {
  id: string; email: string | null; name: string; branch: string | null; year: number | null; semester: number | null;
  daily_goal_xp: number; exam_date: string | null; study_hours: number; timezone: string; language: "en" | "hi"; onboarded_at: string | null;
};

export const getSession = cache(async () => {
  if (!getPublicEnv()) return null;
  const store = await (await import("next/headers")).cookies();
  const all = store.getAll();
  const hasAuth = all.some((c) => c.name.startsWith("sb-") && c.name.includes("-auth-token"));
  if (!hasAuth) return null;

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  const { data: profile } = await supabase
    .from("profiles").select("id,email,name,branch,year,semester,daily_goal_xp,exam_date,study_hours,timezone,language,onboarded_at")
    .eq("id", data.user.id).single<Profile>();
  return profile ? { supabase, user: data.user, profile } : null;
});

export async function requireOnboarded() {
  const s = await getSession();
  if (!s) redirect("/login");
  if (!s.profile.onboarded_at) redirect("/welcome");
  return s;
}
