import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPublicEnv } from "@/lib/env";

export type Profile = {
  id: string; email: string | null; name: string; branch: string | null; year: number | null; semester: number | null;
  daily_goal_xp: number; exam_date: string | null; study_hours: number; timezone: string; language: "en" | "hi"; onboarded_at: string | null;
};

/** The signed-in user as far as pages need it. Built from the verified access-token claims (no extra network call). */
export type SessionUser = { id: string; email: string | null };

/**
 * The signed-in student, or null. Memoised per request.
 * Fast path: the access token's signature is checked locally against the project's cached JWKS (`getClaims`), instead of a
 * round trip to Supabase Auth on every page, and the profile row is read in parallel (RLS returns only the caller's row).
 * Projects still on a shared-secret (HS256) key fall back to `getUser()` inside `getClaims`, so this is never less safe.
 */
export const getSession = cache(async () => {
  if (!getPublicEnv()) return null;
  const store = await (await import("next/headers")).cookies();
  const hasAuth = store.getAll().some((c) => c.name.startsWith("sb-") && c.name.includes("-auth-token"));
  if (!hasAuth) return null;

  const supabase = await createClient();
  const [claimsRes, profileRes] = await Promise.all([
    supabase.auth.getClaims(),
    supabase.from("profiles")
      .select("id,email,name,branch,year,semester,daily_goal_xp,exam_date,study_hours,timezone,language,onboarded_at")
      .limit(1).single<Profile>(),
  ]);
  const sub = claimsRes.data?.claims?.sub;
  const profile = profileRes.data;
  if (!sub || !profile || profile.id !== sub) return null;
  const email = typeof claimsRes.data?.claims?.email === "string" ? claimsRes.data.claims.email : null;
  const user: SessionUser = { id: sub, email };
  return { supabase, user, profile };
});

export async function requireOnboarded() {
  const s = await getSession();
  if (!s) redirect("/login");
  if (!s.profile.onboarded_at) redirect("/welcome");
  return s;
}
