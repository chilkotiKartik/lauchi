"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Lochi } from "@/components/Lochi";
import { Rich } from "@/lib/rich";
import { StepByStep } from "@/components/StepByStep";
import { answerDaily, type DailyAnswerResult } from "@/app/(app)/daily/actions";
import type { PublicQuestion } from "@/lib/quiz-core";

/** Runs a fixed set of server-graded questions (daily challenge by default; the Sunday Quest passes its own action). */
export function DailyRunner({ questions, answered, submit = answerDaily, label = "Challenge progress" }: {
  questions: (PublicQuestion | null)[]; answered: number[];
  submit?: (input: { index: number; answer: unknown }) => Promise<DailyAnswerResult>; label?: string;
}) {
  const router = useRouter();
  const first = questions.findIndex((_, i) => !answered.includes(i));
  const [idx, setIdx] = useState(first === -1 ? 0 : first);
  const [pick, setPick] = useState<number | null>(null);
  const [multi, setMulti] = useState<number[]>([]);
  const [text, setText] = useState("");
  const [result, setResult] = useState<DailyAnswerResult | null>(null);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const q = questions[idx];
  const ready = q && (q.type === "mcq" ? pick !== null : q.type === "msq" ? multi.length > 0 : text.trim() !== "");
  const value = q?.type === "mcq" ? pick : q?.type === "msq" ? multi : text.trim();
  const last = idx + 1 >= questions.length;

  function check() {
    setError("");
    start(async () => {
      const r = await submit({ index: idx, answer: value });
      if (!r.ok) return setError(r.error);
      setResult(r);
    });
  }
  function next() {
    if (result?.ok && result.done) return start(() => router.refresh());
    setResult(null); setPick(null); setMulti([]); setText(""); setError("");
    setIdx(idx + 1);
  }

  if (!q) return <p className="err" role="alert">This question couldn&apos;t be loaded. Refresh to try again.</p>;
  const ok = result?.ok ? result : null;
  return (
    <section className="card flex flex-col gap-4" aria-labelledby="dq">
      <div className="flex items-center gap-3">
        <div className="bar flex-1" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={questions.length} aria-valuenow={idx + (ok ? 1 : 0)}>
          <i style={{ width: `${((idx + (ok ? 1 : 0)) / questions.length) * 100}%` }} />
        </div>
        <p className="text-sm text-muted">Question {idx + 1} of {questions.length}</p>
      </div>
      <div className="flex items-start gap-3">
        <div className="hidden shrink-0 sm:block"><Lochi mood={ok ? (ok.correct ? "correct" : "wrong") : "thinking"} size={64} /></div>
        <h2 id="dq" className="whitespace-pre-line text-xl font-extrabold leading-snug text-head"><Rich text={q.q} /></h2>
      </div>
      <p className="text-sm text-muted">{q.type === "msq" ? "Select all that apply." : q.type === "nat" ? "Type a number." : "Pick one answer."}</p>
      <div className="flex flex-col gap-3" role={q.type === "msq" ? "group" : q.type === "mcq" ? "radiogroup" : undefined} aria-label="Answers">
        {q.type === "nat" ? (
          <input className="field" inputMode="decimal" autoComplete="off" aria-label="Your answer" value={text} disabled={!!result}
            onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && ready && !result) check(); }} />
        ) : q.o!.map((o, i) => {
          const on = q.type === "mcq" ? pick === i : multi.includes(i);
          return (
            <button key={i} type="button" className="choice" role={q.type === "mcq" ? "radio" : "checkbox"} aria-checked={on} disabled={!!result}
              onClick={() => q.type === "mcq" ? setPick(i) : setMulti(on ? multi.filter((x) => x !== i) : [...multi, i])}>
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border-2 border-line text-sm font-black">{i + 1}</span>
              <span><Rich text={o} /></span>
            </button>
          );
        })}
      </div>
      {error && <p className="err" role="alert">{error}</p>}
      {ok && (
        <div role="status" className={`rounded-2xl border-2 p-3 ${ok.correct ? "border-green bg-green-l" : "border-red bg-red-l"}`}>
          <p className={`text-lg font-black ${ok.correct ? "text-green-t" : "text-red-t"}`}>{ok.correct ? "Correct!" : "Not quite"}</p>
          {!ok.correct && <p className="text-head"><b>Answer:</b> <Rich text={ok.right} /></p>}
          {ok.why && <StepByStep key={`s${idx}`} why={ok.why} result={ok.right} />}
        </div>
      )}
      {ok ? (
        <button className="btn btn-wide" onClick={next} disabled={pending}>{ok.done ? "See my score" : last ? "Finish" : "Next question"}</button>
      ) : (
        <button className="btn btn-wide" onClick={check} disabled={!ready || pending}>{pending ? "Checking…" : "Check"}</button>
      )}
    </section>
  );
}
