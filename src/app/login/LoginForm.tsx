"use client";
import { useActionState, useState } from "react";
import {
  signInWithPasswordAction,
  signUpWithPasswordAction,
  sendMagicLink,
  signInWithGoogle,
  type LoginState,
} from "./actions";
import { Lochi } from "@/components/Lochi";
import { QuickThemeToggle } from "@/components/QuickThemeToggle";

export function LoginForm({
  next,
  google,
  notice,
  initialTab = "login",
}: {
  next: string;
  google: boolean;
  notice?: string;
  initialTab?: "login" | "register" | "magic";
}) {
  const [tab, setTab] = useState<"login" | "register" | "magic">(initialTab);
  const [showPassword, setShowPassword] = useState(false);

  const [loginState, loginAction, loginPending] = useActionState<LoginState, FormData>(
    signInWithPasswordAction,
    { status: "idle" }
  );

  const [registerState, registerAction, registerPending] = useActionState<LoginState, FormData>(
    signUpWithPasswordAction,
    { status: "idle" }
  );

  const [magicState, magicAction, magicPending] = useActionState<LoginState, FormData>(
    sendMagicLink,
    { status: "idle" }
  );

  const currentState =
    tab === "login" ? loginState : tab === "register" ? registerState : magicState;
  const isPending =
    tab === "login" ? loginPending : tab === "register" ? registerPending : magicPending;

  if (currentState.status === "sent") {
    return (
      <div className="card flex flex-col items-center gap-3 text-center" role="status">
        <Lochi mood="happy" size={96} />
        <h2 className="text-2xl">
          {tab === "register" ? "Account Created!" : "Check your inbox"}
        </h2>
        <p className="text-muted">
          {currentState.message || (
            <>
              We sent a verification link to <b className="text-head">{currentState.email}</b>.
              Open it in this same browser.
            </>
          )}
        </p>
        <button
          type="button"
          onClick={() => setTab("login")}
          className="btn btn-ghost mt-2"
        >
          Back to Log in
        </button>
      </div>
    );
  }

  return (
    <div className="card flex flex-col gap-5 border-2 border-line bg-surface p-6 shadow-xl">
      {notice && <p className="err" role="alert">{notice}</p>}

      {/* Tabs */}
      <div className="flex rounded-2xl bg-soft p-1 border border-line">
        <button
          type="button"
          className={`flex-1 rounded-xl py-2 text-sm font-extrabold transition-all ${
            tab === "login"
              ? "bg-surface text-head shadow-sm border border-line"
              : "text-muted hover:text-head"
          }`}
          onClick={() => setTab("login")}
        >
          Sign In
        </button>
        <button
          type="button"
          className={`flex-1 rounded-xl py-2 text-sm font-extrabold transition-all ${
            tab === "register"
              ? "bg-surface text-head shadow-sm border border-line"
              : "text-muted hover:text-head"
          }`}
          onClick={() => setTab("register")}
        >
          Register
        </button>
      </div>

      {/* Theme Preference Onboarding Toggle */}
      <QuickThemeToggle />

      {/* Form Area */}
      {tab === "login" && (
        <form action={loginAction} className="flex flex-col gap-4" noValidate>
          <input type="hidden" name="next" value={next} />

          <div className="grid gap-1.5">
            <label htmlFor="login-email" className="text-sm font-black text-head">
              Email Address
            </label>
            <input
              id="login-email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              className="field"
              placeholder="you@example.com"
            />
          </div>

          <div className="grid gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="login-password" className="text-sm font-black text-head">
                Password
              </label>
              <button
                type="button"
                onClick={() => setTab("magic")}
                className="text-xs font-bold text-blue-t hover:underline"
              >
                Sign in without password?
              </button>
            </div>
            <div className="relative">
              <input
                id="login-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                className="field pr-12"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted hover:text-head"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {loginState.status === "error" && (
            <p className="err text-sm" role="alert">
              {loginState.message}
            </p>
          )}

          <button className="btn btn-wide mt-2" disabled={loginPending}>
            {loginPending ? "Signing in…" : "Sign In with Password"}
          </button>
        </form>
      )}

      {tab === "register" && (
        <form action={registerAction} className="flex flex-col gap-4" noValidate>
          <input type="hidden" name="next" value={next} />

          <div className="grid gap-1.5">
            <label htmlFor="register-email" className="text-sm font-black text-head">
              Email Address
            </label>
            <input
              id="register-email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              className="field"
              placeholder="you@example.com"
            />
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="register-password" className="text-sm font-black text-head">
              Create Password
            </label>
            <div className="relative">
              <input
                id="register-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                minLength={6}
                className="field pr-12"
                placeholder="At least 6 characters"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted hover:text-head"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <span className="text-[11px] text-muted">
              Minimum 6 characters. Use letters, numbers, and symbols.
            </span>
          </div>

          <div className="grid gap-1.5">
            <label className="text-sm font-black text-head">
              App Theme Preference
            </label>
            <QuickThemeToggle />
          </div>

          {registerState.status === "error" && (
            <p className="err text-sm" role="alert">
              {registerState.message}
            </p>
          )}

          <button className="btn btn-wide mt-2" disabled={registerPending}>
            {registerPending ? "Creating account…" : "Create Student Account"}
          </button>
        </form>
      )}

      {tab === "magic" && (
        <form action={magicAction} className="flex flex-col gap-4" noValidate>
          <input type="hidden" name="next" value={next} />

          <div className="flex items-center justify-between">
            <label htmlFor="magic-email" className="text-sm font-black text-head">
              Email Address
            </label>
            <button
              type="button"
              onClick={() => setTab("login")}
              className="text-xs font-bold text-blue-t hover:underline"
            >
              Back to Password Login
            </button>
          </div>
          <input
            id="magic-email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            className="field"
            placeholder="you@example.com"
          />

          {magicState.status === "error" && (
            <p className="err text-sm" role="alert">
              {magicState.message}
            </p>
          )}

          <button className="btn btn-wide mt-2" disabled={magicPending}>
            {magicPending ? "Sending link…" : "Email me a 1-Click Link"}
          </button>
        </form>
      )}

      {/* Google OAuth fallback */}
      {google && (
        <div className="border-t border-line pt-4">
          <form action={signInWithGoogle}>
            <input type="hidden" name="next" value={next} />
            <button className="btn btn-ghost btn-wide text-sm font-extrabold">
              Continue with Google
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
