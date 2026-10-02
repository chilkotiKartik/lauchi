"use client";
import { useId, useState } from "react";
import { Rich } from "@/lib/rich";
import { gradeQuestion, parseNumber } from "@/labs/experiments/engine";
import type { Question } from "@/labs/experiments/types";

export type Answered = { given: number | boolean | string; hintUsed: boolean; correct: boolean };

/** One question: answer, optional hint (halves the marks), check, then the full worked solution. */
export function QuestionCard({ q, number, total, answered, onAnswer, onHint, hintShown, onNext, last }: {
  q: Question; number: number; total: number; answered: Answered | undefined; hintShown: boolean;
  onAnswer: (a: Answered) => void; onHint: () => void; onNext: () => void; last: boolean;
}) {
  const uid = useId();
  const [pick, setPick] = useState<number | boolean | null>(null);
  const [text, setText] = useState("");
  const checked = !!answered;
  const parsed = q.type === "numeric" ? parseNumber(text) : null;
  const ready = q.type === "numeric" ? parsed !== null : pick !== null;
  const check = () => {
    if (checked || !ready) return;
    const given = q.type === "numeric" ? (parsed as number) : (pick as number | boolean);
    onAnswer({ given, hintUsed: hintShown, correct: gradeQuestion(q, given) });
  };
  const opts: { value: number | boolean; label: string }[] = q.type === "mcq" ? q.options.map((o, i) => ({ value: i, label: o })) : q.type === "tf" ? [{ value: true, label: "True" }, { value: false, label: "False" }] : [];
  const shownPick = answered && q.type !== "numeric" ? (answered.given as number | boolean) : pick;
  const half = hintShown && !checked;

  return (
    <form className="grid gap-3" onSubmit={(e) => { e.preventDefault(); check(); }} aria-labelledby={`${uid}-p`}>
      <p className="text-xs font-black uppercase tracking-wide text-muted">Question {number} of {total} · {q.marks} {q.marks === 1 ? "mark" : "marks"}</p>
      {q.scenario && (
        <div className="rounded-2xl border-2 border-purple bg-purple-l p-3 text-sm text-body">
          <p className="mb-1 text-xs font-black uppercase tracking-wide text-purple-t">Scenario</p>
          <p><Rich text={q.scenario} /></p>
        </div>
      )}
      <fieldset className="grid gap-2" disabled={checked}>
        <legend id={`${uid}-p`} className="mb-2 font-black leading-snug text-head"><Rich text={q.prompt} /></legend>
        {q.type === "numeric" ? (
          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor={`${uid}-n`} className="sr-only">Your answer{q.unit ? ` in ${q.unit}` : ""}</label>
            <input id={`${uid}-n`} className="field max-w-[11rem]" inputMode="decimal" autoComplete="off" placeholder="Type a number" value={text} onChange={(e) => setText(e.target.value)} aria-invalid={text !== "" && parsed === null} />
            {q.unit && <span className="font-black text-head">{q.unit}</span>}
            {text !== "" && parsed === null && <span className="text-sm font-bold text-red-t">Numbers only, please.</span>}
          </div>
        ) : opts.map((o, i) => {
          const isPick = shownPick === o.value;
          const isAns = checked && (q.type === "mcq" ? q.answer === o.value : q.answer === o.value);
          const wrong = checked && isPick && !isAns;
          return (
            <label key={i} className={`flex cursor-pointer items-start gap-3 rounded-2xl border-2 p-3 text-[0.95rem] font-semibold text-body transition-colors focus-within:ring-2 focus-within:ring-blue ${isAns ? "border-green bg-green-l" : wrong ? "border-red bg-red-l" : isPick ? "border-blue bg-blue-l" : "border-line bg-card hover:border-line2"}`}>
              <input type="radio" className="mt-1 size-4 accent-[var(--blue)]" name={`${uid}-opt`} checked={isPick} onChange={() => setPick(o.value)} />
              <span className="flex-1"><Rich text={o.label} /></span>
              {checked && isAns && <span className="text-xs font-black text-green-t">Correct answer</span>}
              {wrong && <span className="text-xs font-black text-red-t">Your answer</span>}
            </label>
          );
        })}
      </fieldset>

      {!checked && q.hint && (
        hintShown
          ? <p className="rounded-xl bg-gold-l px-3 py-2 text-sm font-semibold text-body"><b>Hint:</b> <Rich text={q.hint} /> <span className="text-muted">(Using the hint halves the marks for this question.)</span></p>
          : <button type="button" className="btn btn-ghost justify-self-start" onClick={onHint}>Show hint (half marks)</button>
      )}

      {!checked ? (
        <button className="btn justify-self-start" disabled={!ready}>Check answer</button>
      ) : (
        <div className="grid gap-3">
          <p role="status" className={answered.correct ? "ok" : "err"}>
            {answered.correct ? `Correct! +${answered.hintUsed ? q.marks / 2 : q.marks} ${(answered.hintUsed ? q.marks / 2 : q.marks) === 1 ? "mark" : "marks"}${answered.hintUsed ? " (hint used, half marks)" : ""}.` : "Not quite. +0 marks."}
            {q.type === "numeric" && !answered.correct && <> The answer is {q.answer}{q.unit ? ` ${q.unit}` : ""} (± {q.tolerance}).</>}
          </p>
          <div className="grid gap-3 rounded-2xl border-2 border-line bg-soft p-3 text-[0.95rem] text-body">
            {q.formulas && q.formulas.length > 0 && (
              <div><p className="text-xs font-black uppercase tracking-wide text-muted">Formulas</p>
                <ul className="mt-1 grid gap-1">{q.formulas.map((f, i) => <li key={i} className="font-bold text-head"><Rich text={f} /></li>)}</ul></div>
            )}
            <div><p className="text-xs font-black uppercase tracking-wide text-muted">Solution</p>
              <ol className="mt-1 list-decimal space-y-1 pl-5">{q.solution.map((s, i) => <li key={i}><Rich text={s} /></li>)}</ol></div>
            <p><b className="text-head">Why: </b><Rich text={q.explanation} /></p>
            {q.commonMistake && <p className="rounded-xl bg-gold-l px-3 py-2"><b className="text-head">Common mistake: </b><Rich text={q.commonMistake} /></p>}
          </div>
          <button type="button" className="btn justify-self-start" onClick={onNext} autoFocus>{last ? "See results" : "Next question"}</button>
        </div>
      )}
      {half && <span className="sr-only">Hint shown. Marks for this question are halved.</span>}
    </form>
  );
}
