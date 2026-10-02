"use server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPublicEnv } from "@/lib/env";
import { emailSchema, passwordSchema } from "@/lib/schemas";
import { safeNext } from "@/lib/safe-path";

export type LoginState = {
  status: "idle" | "sent" | "success" | "error";
  message?: string;
  email?: string;
};

async function origin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  if (host && !host.startsWith("localhost")) {
    return `${proto}://${host}`;
  }
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  return `${proto}://${host ?? "localhost:3000"}`;
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
    return { status: "error", message: error.message || "Failed to sign in. Please try again." };
  }

  redirect(next || "/home");
}

export async function signUpWithPasswordAction(_prev: LoginState, form: FormData): Promise<LoginState> {
  if (!getPublicEnv()) return { status: "error", message: "Sign-in is not configured on this server yet." };

  const parsedEmail = emailSchema.safeParse(form.get("email"));
  if (!parsedEmail.success) return { status: "error", message: parsedEmail.error.issues[0].message };

  const parsedPassword = passwordSchema.safeParse(form.get("password"));
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
    return { status: "error", message: error.message || "Failed to create account. Please try again." };
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
