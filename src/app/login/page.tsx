import Link from "next/link";
import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";
import { safeNext } from "@/lib/safe-path";

export const metadata: Metadata = { title: "Log in" };

export default async function Login({ searchParams }: { searchParams: Promise<{ next?: string; error?: string; tab?: string }> }) {
  const sp = await searchParams;
  const notice = sp.error === "link" ? "That sign-in link expired or was already used. Request a new one."
    : sp.error === "google" ? "Google sign-in isn't available right now. Use password or email sign in instead." : undefined;
  const initialTab = sp.tab === "register" ? "register" : sp.tab === "magic" ? "magic" : "login";
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-5 py-10">
      <div className="text-center">
        <Link href="/" className="text-3xl font-black text-head no-underline">lockin<span className="text-green-t">.</span></Link>
        <h1 className="mt-4 text-3xl">{initialTab === "register" ? "Create an account" : "Log in or sign up"}</h1>
        <p className="mt-2 text-muted">Study smarter with 3D labs, unit quizzes, and mock exams.</p>
      </div>
      <LoginForm next={safeNext(sp.next)} google={process.env.NEXT_PUBLIC_GOOGLE_ENABLED === "true"} notice={notice} initialTab={initialTab} />
    </main>
  );
}
