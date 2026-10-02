"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Lochi, type LochiMood } from "@/components/Lochi";
import { BRANCHES, GOALS } from "@/lib/academics";
import { completeOnboarding } from "./actions";

type Step = "name" | "branch" | "semester" | "goal" | "done";
const ORDER: Step[] = ["name", "branch", "semester", "goal"];

export function Onboarding({ initialName }: { initialName: string }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("name");
  const [name, setName] = useState(initialName);
  const [branch, setBranch] = useState<string>("");
  const [semester, setSemester] = useState<1 | 2 | null>(null);
  const [goal, setGoal] = useState<number>(50);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  const trimmed = name.trim();
  const canNext = step === "name" ? trimmed.length > 0 && consent : step === "branch" ? !!branch : step === "semester" ? !!semester : true;
  const idx = ORDER.indexOf(step);

  const say: Record<Step, [LochiMood, string]> = {
    name: ["welcome", "Hi, I'm Lochi! What should I call you?"],
    branch: ["thinking", `Nice to meet you, ${trimmed || "friend"}. Which branch are you in?`],
    semester: ["happy", "Which semester are you studying now?"],
    goal: ["idle", "How much do you want to study each day?"],
    done: ["celebrate", `Welcome, ${trimmed}!`],
  };

  function next() {
    setError("");
    if (step !== "goal") return setStep(ORDER[idx + 1]);
    start(async () => {
      const res = await completeOnboarding({
        name: trimmed, branch, year: 1, semester, dailyGoalXp: goal, consent,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
      if (res.ok) setStep("done"); else setError(res.message);
    });
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-5 px-5 py-8">
      {step !== "done" && (
        <div className="bar" role="progressbar" aria-label="Setup progress" aria-valuemin={0} aria-valuemax={ORDER.length} aria-valuenow={idx + 1}>
          <i style={{ width: `${((idx + 1) / ORDER.length) * 100}%` }} />
        </div>
      )}
      <div className="flex items-center gap-4" aria-live="polite">
        <Lochi mood={say[step][0]} size={84} />
        <p className="card flex-1 !py-3 text-lg font-extrabold text-head">{say[step][1]}</p>
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="flex flex-1 flex-col gap-3">
          {step === "name" && (<>
            <label htmlFor="name" className="sr-only">Your name</label>
            <input id="name" className="field" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} autoComplete="given-name" placeholder="Your name" autoFocus />
            <label className="flex items-start gap-3 text-sm">
              <input type="checkbox" className="mt-1 h-5 w-5 shrink-0" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
              <span>I am 18 or older and I agree to the <Link href="/terms" target="_blank">Terms</Link> and <Link href="/privacy" target="_blank">Privacy Policy</Link>.</span>
            </label>
          </>)}
          {step === "branch" && BRANCHES.map((b) => (
            <button key={b.key} type="button" className="choice" aria-pressed={branch === b.key} onClick={() => setBranch(b.key)}>
              <span className="w-16 shrink-0 font-black">{b.key}</span><span>{b.name}</span>
            </button>
          ))}
          {step === "semester" && (<>
            {([1, 2] as const).map((s) => (
              <button key={s} type="button" className="choice" aria-pressed={semester === s} onClick={() => setSemester(s)}>Semester {s === 1 ? "I" : "II"} · first year</button>
            ))}
            <p className="text-sm text-muted">Second year and later are coming soon.</p>
          </>)}
          {step === "goal" && GOALS.map((g) => (
            <button key={g.xp} type="button" className="choice" aria-pressed={goal === g.xp} onClick={() => setGoal(g.xp)}>
              <span className="flex-1"><b>{g.label}</b> · {g.xp} XP a day<br /><span className="text-sm font-semibold text-muted">{g.hint}</span></span>
            </button>
          ))}
          {step === "done" && (<>
            <p className="text-center text-muted">Your dashboard is ready.</p>
            <button className="btn btn-wide" onClick={() => router.replace("/home")}>Let&apos;s go</button>
          </>)}
        </motion.div>
      </AnimatePresence>
      {error && <p className="err" role="alert">{error}</p>}
      {step !== "done" && (
        <div className="flex gap-3">
          {idx > 0 && <button type="button" className="btn btn-ghost" onClick={() => setStep(ORDER[idx - 1])}>Back</button>}
          <button type="button" className="btn flex-1" disabled={!canNext || pending} onClick={next}>{step === "goal" ? (pending ? "Saving…" : "Finish") : "Continue"}</button>
        </div>
      )}
    </main>
  );
}
