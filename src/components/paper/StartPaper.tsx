"use client";
import { useId, useState, useTransition } from "react";
import { startPaper } from "@/app/(app)/paper/actions";

/** Practice or exam mode, then build a fresh seeded paper. */
export function StartPaper({ course, label = "Start the paper" }: { course: string; label?: string }) {
  const name = useId();
  const [mode, setMode] = useState<"practice" | "exam">("practice");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-col gap-3">
      <fieldset className="flex flex-col gap-2 border-0 p-0">
        <legend className="mb-1 font-black text-head">How do you want to sit it?</legend>
        {([
          ["practice", "Practice mode", "You can pause the clock when life happens."],
          ["exam", "Exam mode", "No pause. Once you start, the 3 hours run out, like the real hall."],
        ] as const).map(([v, t, d]) => (
          <label key={v} className={`pp-rub ${mode === v ? "is-on" : ""}`}>
            <input type="radio" name={name} value={v} checked={mode === v} onChange={() => setMode(v)} />
            <span className="min-w-0 flex-1"><b className="text-head">{t}</b><br /><span className="text-sm text-muted">{d}</span></span>
          </label>
        ))}
      </fieldset>
      {error && <p className="err" role="alert">{error}</p>}
      <button type="button" className="btn btn-blue" disabled={pending}
        onClick={() => start(async () => { const r = await startPaper({ course, mode }); if (r?.error) setError(r.error); })}>
        {pending ? "Building your paper…" : label}
      </button>
    </div>
  );
}
