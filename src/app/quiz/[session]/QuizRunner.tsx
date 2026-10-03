"use client";
import { isNumberAnswer } from "@/lib/answer-format";
import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Lochi, type LochiMood } from "@/components/Lochi";
import { ArtBolt, ArtFlame } from "@/components/art";
import { Confetti } from "@/components/motion";
import { Rich } from "@/lib/rich";
import { checkAnswer, finishQuiz, type CheckResult, type FinishResult } from "../actions";
import { ListenButton, MicButton } from "@/components/Voice";
import { ReportButton } from "@/components/admin/ReportButton";
import { Coach, type CoachInfo } from "@/components/Coach";
import { sayReaction, sfx } from "@/lib/voice";
import { spokenNumber } from "@/lib/speech-text";
import { StepByStep } from "@/components/StepByStep";
import type { Level } from "@/lib/adaptive";

type Q = { type: "mcq" | "nat" | "msq"; q: string; o?: string[] };

const clock = (ms: number) => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };

const LEVEL_CLASS: Record<Level, string> = { "warming up": "chip-cool", steady: "chip-soft", challenge: "chip-hot" };

export function QuizRunner({ sessionId, questions: initialQuestions, levels: initialLevels, answered, title, backHref, isTopic, mock, assignment = false, submitted, coach }: {
  sessionId: string; questions: (Q | null)[]; levels?: (Level | null)[]; answered: number[]; title: string; backHref: string; isTopic: boolean; assignment?: boolean; coach?: CoachInfo;
  mock: { endsAt: number } | null; submitted: { correct: number; total: number; xp: number } | null;
}) {
  // Adaptive practice only knows question i+1 once question i is answered: the server sends it back with the verdict.
  const [questions, setQuestions] = useState(initialQuestions);
  const [levels, setLevels] = useState(initialLevels);
  const [done, setDone] = useState<Set<number>>(() => new Set(answered));
  const firstOpen = questions.findIndex((_, i) => !done.has(i));
  const [idx, setIdx] = useState(firstOpen === -1 ? questions.length : firstOpen);
  const [pick, setPick] = useState<number | null>(null);
  const [multi, setMulti] = useState<number[]>([]);
  const [text, setText] = useState("");
  const [result, setResult] = useState<CheckResult | null>(null);
  const [final, setFinal] = useState<FinishResult | null>(null);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const [left, setLeft] = useState<number | null>(null);
  const autoSubmitted = useRef(false);
  const [streak, setStreak] = useState(0);
  const [heard, setHeard] = useState("");

  const blind = Boolean(mock) || assignment; // no verdicts until the whole set is submitted
  const q = questions[idx];
  const ready = q && (q.type === "mcq" ? pick !== null : q.type === "msq" ? multi.length > 0 : text.trim() !== "" && isNumberAnswer(text));
  const answerValue = q?.type === "mcq" ? pick : q?.type === "msq" ? multi : text.trim();
  const finished = idx >= questions.length || Boolean(submitted) || Boolean(final?.ok);

  function submitAll() {
    setError("");
    start(async () => {
      const r = await finishQuiz(sessionId, Boolean(mock));
      if (r.ok) setFinal(r); else setError(r.error);
    });
  }

  useEffect(() => {
    if (!mock || finished) return;
    const tick = () => setLeft(mock.endsAt - Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [mock, finished]);
  useEffect(() => {
    if (mock && left !== null && left <= 0 && !finished && !autoSubmitted.current) { autoSubmitted.current = true; submitAll(); }
  });

  function reset() { setResult(null); setPick(null); setMulti([]); setText(""); setError(""); setHeard(""); }

  function check() {
    setError("");
    start(async () => {
      const r = await checkAnswer({ session: sessionId, index: idx, answer: answerValue });
      if (!r.ok) return setError(r.error);
      const nd = new Set(done).add(idx); setDone(nd);
      if (blind) { // no verdict during an exam or assignment: move straight on
        reset();
        const nxt = questions.findIndex((_, i) => i > idx && !nd.has(i));
        const any = nxt !== -1 ? nxt : questions.findIndex((_, i) => !nd.has(i));
        setIdx(any === -1 ? questions.length : any);
      } else {
        setResult(r);
        if (r.next) {
          const nx = r.next;
          setQuestions((qs) => qs.map((x, i) => (i === idx + 1 ? nx.q : x)));
          if (levels) setLevels(levels.map((x, i) => (i === idx + 1 ? nx.level : x)));
        }
        if (r.correct) {
          const n = streak + 1; setStreak(n);
          if (n >= 3 && n % 3 === 0) { sfx("combo"); sayReaction("combo", n / 3 - 1); } else { sfx("correct"); sayReaction("correct", idx); }
        } else { setStreak(0); sfx("wrong"); sayReaction("wrong", idx); }
      }
    });
  }
  function next() {
    reset();
    if (idx + 1 < questions.length) return setIdx(idx + 1);
    setIdx(questions.length);
    submitAll();
  }

  if (finished) {
    const summary: Extract<FinishResult, { ok: true }> | null = final?.ok ? final
      : submitted ? { ok: true, correct: submitted.correct, total: submitted.total, xp: submitted.xp, topicCompleted: false, passed: submitted.correct / submitted.total >= 0.6, replay: true } : null;
    const good = summary ? summary.correct / summary.total >= 0.6 : false;
    const mood: LochiMood = !summary ? "loading" : good ? "celebrate" : "thinking";
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-5 text-center">
        {summary && good && <Confetti />}
        <div className={summary ? "pop" : ""}><Lochi mood={mood} size={130} /></div>
        {!summary ? (
          <>
            <h1 className="text-3xl">{pending ? "Marking your quiz…" : "All answered"}</h1>
            {error && <p className="err" role="alert">{error}</p>}
            {!pending && <button className="btn" onClick={submitAll}>{error ? "Try again" : "Finish quiz"}</button>}
          </>
        ) : (
          <div role="status" className="flex flex-col items-center gap-3">
            <h1 className="text-3xl">{summary.replay ? "Quiz finished" : good ? "Nice work!" : "Keep practising"}</h1>
            <p className="text-lg">You got <b className="text-head">{summary.correct} of {summary.total}</b> right.</p>
            {summary.xp > 0 && <p className="inline-flex items-center gap-1 rounded-full bg-gold-l px-4 py-1 font-black text-head"><ArtBolt size={22} />+{summary.xp} XP</p>}
            {assignment && !summary.replay && summary.xp === 0 && <p className="text-muted">Assignment XP is paid once per unit, and you need 40% or more to earn it.</p>}
            {isTopic && summary.topicCompleted && <p className="ok">Topic completed!</p>}
            {isTopic && !summary.passed && <p className="text-muted">Score 60% or more to complete this topic.</p>}
            <Link href={`/quiz/${sessionId}/review`} className="btn btn-blue mt-2">Review every answer</Link>
            <Link href={backHref} className="btn btn-ghost">Continue</Link>
          </div>
        )}
      </main>
    );
  }

  if (!q) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-5 text-center">
        <Lochi mood="loading" size={110} />
        <h1 className="text-2xl">Picking your next question…</h1>
        <a href={`/quiz/${sessionId}`} className="btn">Load it</a>
      </main>
    );
  }
  const level = levels?.[idx] ?? null;
  const feedbackMood: LochiMood = result ? (result.ok && result.correct ? "correct" : "wrong") : "thinking";
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-4 px-4 pb-44 pt-4">
      <div className="flex items-center gap-3">
        <Link href={backHref} aria-label="Leave quiz" className="grid h-11 w-11 place-items-center rounded-xl text-2xl text-muted no-underline hover:bg-soft">×</Link>
        <div className="bar flex-1" role="progressbar" aria-label="Quiz progress" aria-valuemin={0} aria-valuemax={questions.length} aria-valuenow={done.size}>
          <i style={{ width: `${(done.size / questions.length) * 100}%` }} />
        </div>
        {!blind && streak >= 3 && <span key={streak} className="combo" role="status" aria-label={`${streak} correct in a row`}><ArtFlame size={18} />{streak} in a row</span>}
        {mock && left !== null && <span className={`pill !px-3 tabular-nums ${left < 120_000 ? "!border-red !text-red-t" : ""}`} role="timer" aria-label="Time left">{clock(left)}</span>}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm text-muted">{title} · Question {idx + 1} of {questions.length}</p>
        {level && <span className={`chip ${LEVEL_CLASS[level]}`} title="Practice adapts to how you are doing: about 7 in 10 should feel doable.">Level: {level}</span>}
      </div>
      {blind && (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Question palette">
          {questions.map((_, i) => (
            <button key={i} type="button" disabled={pending || done.has(i)} onClick={() => { reset(); setIdx(i); }} aria-label={`Question ${i + 1}${done.has(i) ? ", answered" : i === idx ? ", current" : ", not answered"}`} aria-current={i === idx ? "step" : undefined}
              className={`h-9 w-9 rounded-lg border-2 text-sm font-black ${i === idx ? "border-blue bg-blue-l text-blue-t" : done.has(i) ? "border-green bg-green-l text-green-t" : "border-line bg-card text-head"}`}>{i + 1}</button>
          ))}
        </div>
      )}
      <div className="flex items-start gap-3">
        <div className="hidden shrink-0 sm:block"><Lochi mood={feedbackMood} size={72} /></div>
        <h1 className="whitespace-pre-line text-xl font-extrabold leading-snug text-head sm:text-2xl"><Rich text={q.q} /></h1>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted">{q.type === "msq" ? "Select all that apply." : q.type === "nat" ? "Type a number, or say it." : "Pick one answer."}</p>
        <ListenButton key={idx} text={`${q.q}. ${q.o ? q.o.map((o, i) => `Option ${i + 1}: ${o}`).join(". ") : ""}`} label="Read question" />
      </div>
      <div className="flex flex-col gap-3" role={q.type === "msq" ? "group" : "radiogroup"} aria-label="Answers">
        {q.type === "nat" ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <input className="field min-w-0 flex-1" inputMode="decimal" autoComplete="off" aria-label="Your answer (numbers only)" placeholder="Numbers only, e.g. 15.12" value={text} disabled={!!result}
                onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && ready && !result) check(); }} />
              {!result && <MicButton label="Say" onText={(t) => { const n = spokenNumber(t); setHeard(n ? "" : `Heard "${t}" — that isn't a number.`); if (n) setText(n); }} />}
            </div>
            {heard && <p className="text-sm font-bold text-red-t" role="status">{heard}</p>}
          </div>
        ) : q.o!.map((o, i) => {
          const on = q.type === "mcq" ? pick === i : multi.includes(i);
          return (
            <button key={i} type="button" className="choice" aria-pressed={on} role={q.type === "mcq" ? "radio" : "checkbox"} aria-checked={on} disabled={!!result}
              onClick={() => q.type === "mcq" ? setPick(i) : setMulti(on ? multi.filter((x) => x !== i) : [...multi, i])}>
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border-2 border-line text-sm font-black">{i + 1}</span>
              <span><Rich text={o} /></span>
            </button>
          );
        })}
      </div>
      {error && <p className="err" role="alert">{error}</p>}
      <AnimatePresence>
        <motion.div key={result ? "fb" : "cta"} initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }} transition={{ duration: 0.18 }}
          className={`fixed inset-x-0 bottom-0 z-20 max-h-[78dvh] overflow-y-auto border-t-2 p-4 ${result ? (result.ok && result.correct ? "border-green bg-green-l" : "border-red bg-red-l") : "border-line bg-bg"}`}>
          <div className="mx-auto flex max-w-2xl flex-col gap-3">
            {result?.ok && (
              <div role="status">
                <p className={`text-lg font-black ${result.correct ? "text-green-t" : "text-red-t"}`}>{result.correct ? "Correct!" : "Not quite"}</p>
                {!result.correct && <p className="text-head"><b>Answer:</b> <Rich text={result.right} /></p>}
                {result.why && <StepByStep key={`steps${idx}`} why={result.why} result={result.right} />}
                <div className="mt-2"><ListenButton key={`why${idx}`} text={`${result.correct ? "Correct." : `The answer is ${result.right}.`} ${result.why}`} label="Hear the working" /> <ReportButton where="quiz" refId={`${sessionId}:${idx}`} course={coach?.course} unit={coach?.unit} /></div>
                {!result.correct && coach && <div className="mt-3"><Coach info={coach} question={q.q} right={result.right} mistake={`${sessionId}:${idx}`} /></div>}
              </div>
            )}
            {result ? (
              <button className={`btn btn-wide ${result.ok && result.correct ? "" : "!bg-[#c2303a] !text-white !shadow-[0_4px_0_#8f2028]"}`} onClick={next} disabled={pending}>
                {idx + 1 < questions.length ? "Continue" : "Finish"}
              </button>
            ) : (
              <div className={mock ? "grid grid-cols-2 gap-3" : ""}>
                <button className="btn btn-wide" onClick={check} disabled={!ready || pending}>{pending ? "Checking…" : blind ? "Save answer" : "Check"}</button>
                {mock && <button className="btn btn-ghost btn-wide" onClick={submitAll} disabled={pending}>Submit test</button>}
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </main>
  );
}
