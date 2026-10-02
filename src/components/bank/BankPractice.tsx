"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { Rich } from "@/lib/rich";
import { answerCmsQuestion, type AnswerResult } from "@/app/(app)/bank/actions";
import type { Given } from "@/lib/cms-questions-core";
import { QuestionView } from "./QuestionView";
import type { PublicQuestion } from "@/lib/cms-questions";

type Done = Extract<AnswerResult, { ok: true }>;

/** Practice one unit's published questions. The answer is checked on the server; the key and explanation arrive only after answering. */
export function BankPractice({ questions, backHref, pyqHref, missedHref }: { questions: Pick<PublicQuestion, "id" | "kind" | "stem" | "options" | "difficulty">[]; backHref: string; pyqHref: string | null; missedHref: string }) {
  const [i, setI] = useState(0);
  const [value, setValue] = useState<Given | null>(null);
  const [result, setResult] = useState<Done | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [score, setScore] = useState({ right: 0, xp: 0, done: 0 });
  const [pending, start] = useTransition();
  const q = questions[i];

  if (!q) {
    return (
      <section className="card flex flex-col gap-3" aria-labelledby="bank-done">
        <h2 id="bank-done" className="text-2xl">Set finished</h2>
        <p>You got <b>{score.right}</b> of <b>{score.done}</b> right{score.xp > 0 ? <> and earned <b>{score.xp} XP</b></> : null}.</p>
        <div className="flex flex-wrap gap-2">
          {score.right < score.done && <Link href={missedHref} className="btn btn-blue" prefetch={false}>Practise the ones I missed</Link>}
          <Link href={backHref} className="btn btn-ghost">Back to units</Link>
          {pyqHref && <Link href={pyqHref} className="btn btn-ghost">Previous-year questions</Link>}
        </div>
      </section>
    );
  }

  const ready = value !== null && (Array.isArray(value) ? value.length > 0 : typeof value === "string" ? value.trim() !== "" : true);
  function check() {
    if (!ready || pending || value === null) return;
    setError(null);
    start(async () => {
      const r = await answerCmsQuestion({ id: q.id, answer: value });
      if (!r.ok) { setError(r.error); return; }
      setResult(r);
      setScore((s) => ({ right: s.right + (r.correct ? 1 : 0), xp: s.xp + r.xp, done: s.done + 1 }));
    });
  }
  function next() { setI(i + 1); setValue(null); setResult(null); setError(null); }

  return (
    <section className="card flex flex-col gap-4" aria-label="Practice question" key={q.id}>
      <div className="flex items-center justify-between gap-2 text-sm font-extrabold text-muted">
        <span>Question {i + 1} of {questions.length}</span>
        <span>{score.right} right so far</span>
      </div>
      <QuestionView q={q} value={value} onChange={setValue} locked={!!result} marks={result && q.kind !== "numeric" ? { right: result.rightIdx } : null} groupLabel={`Answer to question ${i + 1}`} />
      {error && <p className="err" role="alert">{error}</p>}
      {result && (
        <div role="status" className={`flex flex-col gap-2 ${result.correct ? "ok" : "err"}`}>
          <p className="text-base"><b>{result.correct ? "Correct!" : "Not quite."}</b>{!result.correct && result.right ? <> The right answer is <b>{result.right}</b>.</> : null}{result.xp > 0 ? <> +{result.xp} XP</> : null}</p>
          {result.explanation && <p className="whitespace-pre-wrap font-bold"><Rich text={result.explanation} /></p>}
          {result.steps.length > 0 && (
            <ol className="flex list-decimal flex-col gap-1 pl-5 font-bold" aria-label="Worked steps">
              {result.steps.map((s, k) => <li key={k}><Rich text={s} /></li>)}
            </ol>
          )}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {!result
          ? <button type="button" className="btn" disabled={!ready || pending} onClick={check}>{pending ? "Checking…" : "Check answer"}</button>
          : <button type="button" className="btn" onClick={next}>{i + 1 < questions.length ? "Next question" : "See my result"}</button>}
        <Link href={backHref} className="btn btn-ghost">Back to units</Link>
      </div>
    </section>
  );
}
