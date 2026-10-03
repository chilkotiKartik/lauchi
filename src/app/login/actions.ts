"use server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPublicEnv } from "@/lib/env";
import { emailSchema, newPasswordSchema, passwordSchema } from "@/lib/schemas";
import { safeNext } from "@/lib/safe-path";

export type LoginState = {
  status: "idle" | "sent" | "success" | "error";
  message?: string;
  email?: string;
};

/** Base URL for links in sign-in emails. The configured site URL always wins: a request's Host header is client-controlled,
 * so it is only used in development or when no site URL is set. */
async function origin() {
  const site = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (site && /^https?:\/\//.test(site)) return site;
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";
  return `${proto}://${host}`;
}

export async function signInWithPasswordAction(_prev: LoginState, form: FormData): Promise<LoginState> {
  if (!getPublicEnv()) return { status: "error", message: "Sign-in is not configured on this server yet." };
  
  const parsedEmail = emailSchema.safeParse(form.get("email"));
  if (!parsedEmail.success) return { status: "error", message: parsedEmail.error.issues[0].message };

  const parsedPassword = passwordSchema.safeParse(form.get("password"));
  if (!parsedPassword.success) return { status: "error", message: parsedPassword.error.issues[0].message };

  const next = safeNext(String(form.get("next") ?? ""));
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: parsedEmail.data,
    password: parsedPassword.data,
  });

  if (error) {
    if (/invalid login credentials/i.test(error.message)) {
      return { status: "error", message: "Incorrect email or password. Please check and try again." };
    }
    if (/email not confirmed/i.test(error.message)) {
      return { status: "error", message: "Please confirm your email address before signing in." };
    }
    if (error.status === 429 || /rate/i.test(error.message)) return { status: "error", message: "Too many attempts. Wait a minute and try again." };
    return { status: "error", message: "We couldn't sign you in. Please try again." };
  }

  redirect(next || "/home");
}

export async function signUpWithPasswordAction(_prev: LoginState, form: FormData): Promise<LoginState> {
  if (!getPublicEnv()) return { status: "error", message: "Sign-in is not configured on this server yet." };

  const parsedEmail = emailSchema.safeParse(form.get("email"));
  if (!parsedEmail.success) return { status: "error", message: parsedEmail.error.issues[0].message };

  const parsedPassword = newPasswordSchema.safeParse(form.get("password"));
  if (!parsedPassword.success) return { status: "error", message: parsedPassword.error.issues[0].message };

  const next = safeNext(String(form.get("next") ?? ""));
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email: parsedEmail.data,
    password: parsedPassword.data,
    options: {
      emailRedirectTo: `${await origin()}/auth/callback?next=${encodeURIComponent(next || "/welcome")}`,
    },
  });

  if (error) {
    if (/user already registered/i.test(error.message)) {
      return { status: "error", message: "An account with this email already exists. Please sign in instead." };
    }
    if (/password/i.test(error.message)) return { status: "error", message: "Choose a stronger password: at least 8 characters, not a common one." };
    if (error.status === 429 || /rate/i.test(error.message)) return { status: "error", message: "Too many attempts. Wait a minute and try again." };
    return { status: "error", message: "We couldn't create your account. Please try again." };
  }

  // If session is returned immediately (e.g. email confirmations disabled)
  if (data.session) {
    redirect(next || "/welcome");
  }

  return {
    status: "sent",
    email: parsedEmail.data,
    message: "Registration successful! If required, please verify your email before logging in.",
  };
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
