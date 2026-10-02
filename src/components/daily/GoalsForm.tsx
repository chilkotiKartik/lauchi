"use client";
import { useState, useTransition } from "react";
import { saveGoals } from "@/app/(app)/goals/actions";

export function GoalsForm({ xpTarget, quizzesTarget, saved }: { xpTarget: number; quizzesTarget: number; saved: boolean }) {
  const [xp, setXp] = useState(String(xpTarget));
  const [quizzes, setQuizzes] = useState(String(quizzesTarget));
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    start(async () => {
      const r = await saveGoals({ xpTarget: Number(xp), quizzesTarget: Number(quizzes) });
      setMsg(r.ok ? { ok: true, text: "Goal saved for this week." } : { ok: false, text: r.error });
    });
  }
  return (
    <form onSubmit={submit} className="flex flex-col gap-3" aria-label="Set this week's goal">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm font-bold text-head">XP this week
          <input className="field" type="number" inputMode="numeric" min={10} max={5000} step={1} required value={xp} onChange={(e) => setXp(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1 text-sm font-bold text-head">Quizzes this week
          <input className="field" type="number" inputMode="numeric" min={0} max={100} step={1} required value={quizzes} onChange={(e) => setQuizzes(e.target.value)} />
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button className="btn" disabled={pending}>{pending ? "Saving…" : saved ? "Update goal" : "Save goal"}</button>
        {msg && <p role={msg.ok ? "status" : "alert"} className={msg.ok ? "ok" : "err"}>{msg.text}</p>}
      </div>
    </form>
  );
}
