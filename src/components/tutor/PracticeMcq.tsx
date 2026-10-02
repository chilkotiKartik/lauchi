"use client";
import { useState } from "react";
import type { Mcq } from "@/lib/tutor";

/** One AI-made practice question with instant feedback. */
export function PracticeMcq({ mcq }: { mcq: Mcq }) {
  const [pick, setPick] = useState<number | null>(null);
  const done = pick !== null;
  return (
    <div className="card flex w-full flex-col gap-3" role="group" aria-label="Practice question">
      <p className="text-xs font-black uppercase tracking-wide text-muted">Practice question</p>
      <p className="font-bold text-head">{mcq.question}</p>
      <ul className="flex flex-col gap-2">
        {mcq.options.map((o, i) => {
          const right = done && i === mcq.answer;
          const wrong = done && i === pick && i !== mcq.answer;
          return (
            <li key={i}>
              <button type="button" disabled={done} onClick={() => setPick(i)} aria-pressed={pick === i}
                className={`w-full rounded-xl border-2 px-3 py-2 text-left font-bold ${right ? "border-green-600 bg-green-100 text-green-900" : wrong ? "border-red-600 bg-red-100 text-red-900" : "border-line bg-card text-head hover:border-blue"}`}>
                <span className="mr-2 text-muted">{"ABCD"[i]}.</span>{o}{right && <span className="sr-only"> (correct)</span>}{wrong && <span className="sr-only"> (your answer, not correct)</span>}
              </button>
            </li>
          );
        })}
      </ul>
      {done && (
        <div role="status" className="flex flex-col gap-1 rounded-xl bg-soft p-3">
          <p className="font-black text-head">{pick === mcq.answer ? "Correct!" : `Not quite. The answer is ${"ABCD"[mcq.answer]}.`}</p>
          <p className="whitespace-pre-wrap text-head">{mcq.explanation}</p>
        </div>
      )}
    </div>
  );
}
