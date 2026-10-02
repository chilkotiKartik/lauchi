"use client";
import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Rich } from "@/lib/rich";
import { splitSteps } from "@/lib/steps";

/** "Show me the method": a worked solution revealed one step at a time, then the final result.
 * Give it a `key` per question so it starts again at step 1. */
export function StepByStep({ why, result, className = "" }: { why: string; result?: string; className?: string }) {
  const steps = useMemo(() => splitSteps(why), [why]);
  const [shown, setShown] = useState(1);
  const reduce = useReducedMotion();
  if (steps.length === 0) return null;
  const n = steps.length, all = shown >= n;
  return (
    <section aria-label="Worked solution" className={`mt-2 flex flex-col gap-2 rounded-2xl border-2 border-line bg-card p-3 text-ink ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-black text-head">Show me the method</p>
        {n > 1 && <span className="text-xs font-bold text-muted">Step {Math.min(shown, n)} of {n}</span>}
      </div>
      <ol className="flex flex-col gap-2" aria-live="polite">
        <AnimatePresence initial={false}>
          {steps.slice(0, shown).map((s, i) => (
            <motion.li key={i} data-step={i + 1} initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}
              className="flex items-start gap-2 text-sm leading-relaxed text-head">
              {n > 1 && <span aria-hidden className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-blue-l text-xs font-black text-blue-t">{i + 1}</span>}
              <span className="min-w-0 break-words"><Rich text={s} /></span>
            </motion.li>
          ))}
        </AnimatePresence>
      </ol>
      {!all ? (
        <>
          <p className="text-xs font-bold text-muted">Try the next step yourself first, then check it.</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="voice-btn" onClick={() => setShown(shown + 1)}>Next step</button>
            <button type="button" className="voice-btn" onClick={() => setShown(n)}>Show all</button>
          </div>
        </>
      ) : result ? (
        <motion.p initial={reduce ? false : { opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.25 }}
          className="rounded-xl bg-gold-l px-3 py-2 text-sm text-head">
          <b className="mr-1 font-black">Final answer</b> <Rich text={result} />
        </motion.p>
      ) : null}
    </section>
  );
}
