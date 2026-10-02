"use client";
import { useActionState } from "react";
import { sendMagicLink, signInWithGoogle, type LoginState } from "./actions";
import { Lochi } from "@/components/Lochi";

export function LoginForm({ next, google, notice }: { next: string; google: boolean; notice?: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(sendMagicLink, { status: "idle" });
  if (state.status === "sent") {
    return (
      <div className="card flex flex-col items-center gap-3 text-center" role="status">
        <Lochi mood="happy" size={96} />
        <h2 className="text-2xl">Check your inbox</h2>
        <p className="text-muted">We sent a sign-in link to <b className="text-head">{state.email}</b>. Open it in this same browser.</p>
      </div>
    );
  }
  return (
    <div className="card flex flex-col gap-4">
      {notice && <p className="err" role="alert">{notice}</p>}
      <form action={action} className="flex flex-col gap-3" noValidate>
        <input type="hidden" name="next" value={next} />
        <label htmlFor="email" className="font-black text-head">Email</label>
        <input id="email" name="email" type="email" inputMode="email" autoComplete="email" required className="field" placeholder="you@example.com" aria-describedby={state.status === "error" ? "login-err" : undefined} />
        {state.status === "error" && <p id="login-err" className="err" role="alert">{state.message}</p>}
        <button className="btn btn-wide" disabled={pending}>{pending ? "Sending…" : "Email me a sign-in link"}</button>
      </form>
      {google && (
        <form action={signInWithGoogle}>
          <input type="hidden" name="next" value={next} />
          <button className="btn btn-ghost btn-wide">Continue with Google</button>
        </form>
      )}
    </div>
  );
}
