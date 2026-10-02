"use server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPublicEnv } from "@/lib/env";
import { emailSchema } from "@/lib/schemas";
import { safeNext } from "@/lib/safe-path";

export type LoginState = { status: "idle" | "sent" | "error"; message?: string; email?: string };

async function origin() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function sendMagicLink(_prev: LoginState, form: FormData): Promise<LoginState> {
  if (!getPublicEnv()) return { status: "error", message: "Sign-in is not configured on this server yet." };
  const parsed = emailSchema.safeParse(form.get("email"));
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0].message };
  const next = safeNext(String(form.get("next") ?? ""));
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data,
    options: { emailRedirectTo: `${await origin()}/auth/callback?next=${encodeURIComponent(next)}`, shouldCreateUser: true },
  });
  if (error) {
    const limited = error.status === 429 || /rate/i.test(error.message);
    return { status: "error", message: limited ? "Too many emails requested. Wait a minute and try again." : "We couldn't send the link. Try again shortly." };
  }
  return { status: "sent", email: parsed.data };
}

export async function signInWithGoogle(form: FormData) {
  if (!getPublicEnv() || process.env.NEXT_PUBLIC_GOOGLE_ENABLED !== "true") redirect("/login?error=google");
  const next = safeNext(String(form.get("next") ?? ""));
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${await origin()}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  if (error || !data.url) redirect("/login?error=google");
  redirect(data.url);
}
