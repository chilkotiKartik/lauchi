"use client";
import { useState } from "react";
import { Rich } from "@/lib/rich";

type Check = { q: string; o: string[]; a: number; why: string };

export function SelfCheck({ items }: { items: Check[] }) {
  const [picked, setPicked] = useState<Record<number, number>>({});
  return (
    <ol className="flex flex-col gap-4">
      {items.map((c, qi) => {
        const p = picked[qi];
        const answered = p !== undefined;
        return (
          <li key={qi} className="card flex flex-col gap-3">
            <p className="font-extrabold text-head"><span className="mr-2 text-muted">{qi + 1}.</span><Rich text={c.q} /></p>
            <div className="flex flex-col gap-2" role="radiogroup" aria-label={`Question ${qi + 1}`}>
              {c.o.map((o, i) => {
                const state = !answered ? "" : i === c.a ? "!border-green !bg-green-l" : i === p ? "!border-red !bg-red-l" : "";
                return (
                  <button key={i} type="button" role="radio" aria-checked={p === i} disabled={answered} onClick={() => setPicked({ ...picked, [qi]: i })} className={`choice ${state}`}>
                    <span><Rich text={o} /></span>
                    {answered && i === c.a && <span className="ml-auto text-green-t" aria-label="correct">✓</span>}
                    {answered && i === p && i !== c.a && <span className="ml-auto text-red-t" aria-label="your answer, wrong">✗</span>}
                  </button>
                );
              })}
            </div>
            {answered && <p role="status" className={p === c.a ? "ok" : "err"}><b>{p === c.a ? "Correct. " : "Not quite. "}</b><Rich text={c.why} /></p>}
          </li>
        );
      })}
    </ol>
  );
}
