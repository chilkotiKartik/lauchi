"use client";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Lochi } from "@/components/Lochi";
import { ProgressRing } from "@/components/ProgressRing";
import { StepByStep } from "@/components/StepByStep";
import { ListenButton } from "@/components/Voice";
import { ArtBolt } from "@/components/art";
import { Rich } from "@/lib/rich";
import { dueIn, forecast, GAPS } from "@/lib/revise";
import type { PublicQuestion } from "@/lib/quiz-core";
import type { ModelAnswer } from "@/content/answers/types";
import { reviewPyq, reviewQuiz, type ReviewResult } from "@/app/(app)/revise/actions";
import { ReviseForecast } from "./ReviseForecast";

type Base = { id: string; step: number; lapses: number; where: string };
export type SessionItem =
  | (Base & { kind: "quiz"; q: PublicQuestion })
  | (Base & { kind: "pyq"; pyqId: string; title: string; parts: { text: string; marks: string | null }[]; marks: string | null; href: string; model: ModelAnswer | null });

type Outcome = { correct: boolean; due: string; step: number; xp: number; why?: string; right?: string };

type BoardProps = { today: string; items: SessionItem[]; dueNow: number; reviewedToday: number; total: number; dues: { id: string; due: string }[] };

export function ReviseBoard(props: BoardProps) {
  // Each review revalidates the page, which would drop the item we are looking at and wipe its result.
  // So the board keeps the snapshot it started with and tracks progress itself ("reload for the next batch").
  const [snap] = useState(props);
  const { today, items, dueNow, reviewedToday, total, dues } = snap;
  const [idx, setIdx] = useState(0);
  const [done, setDone] = useState(0);
  const [xp, setXp] = useState(0);
  const [moved, setMoved] = useState<Record<string, string>>({});
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const reduce = useReducedMotion();

  const bars = useMemo(() => forecast(dues.map((d) => moved[d.id] ?? d.due), today), [dues, moved, today]);
  const left = Math.max(0, dueNow - done);
  const item = items[idx];
  const finished = items.length > 0 && idx >= items.length;

  function record(id: string, o: Outcome) {
    setOutcome(o);
    setDone((n) => n + 1);
    setXp((n) => n + o.xp);
    setMoved((m) => ({ ...m, [id]: o.due }));
  }
  function next() { setOutcome(null); setError(""); setIdx((i) => i + 1); }
  function gradePyq(ok: boolean) {
    if (!item) return;
    setError("");
    start(async () => {
      const r = await reviewPyq({ id: item.id, ok });
      if (!r.ok) return setError(r.error);
      record(item.id, { correct: ok, due: r.due, step: r.step, xp: r.xp });
    });
  }
  function onQuiz(r: ReviewResult) {
    if (!item) return;
    if (!r.ok) return setError(r.error);
    setError("");
    record(item.id, { correct: r.correct, due: r.due, step: r.step, xp: r.xp, why: r.why, right: r.right });
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="flex min-w-0 flex-col gap-4">
        {items.length === 0 ? (
          <section className="card flex flex-col items-center gap-3 text-center" aria-labelledby="rv-empty">
            <Lochi mood={total ? "happy" : "idle"} size={120} />
            <h2 id="rv-empty" className="text-2xl">{total ? "All caught up for today!" : "Nothing to revise yet"}</h2>
            <p className="max-w-md text-muted">
              {total
                ? nextDueText(bars)
                : "Every quiz question you get wrong, and every PYQ you mark practised, lands here and comes back right before you'd forget it."}
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Link href="/practice" className="btn">Practise a unit</Link>
              <Link href="/pyq" className="btn btn-ghost">Open the PYQ bank</Link>
            </div>
          </section>
        ) : finished ? (
          <section className="card flex flex-col items-center gap-3 text-center" role="status" aria-labelledby="rv-done">
            <div className="pop"><Lochi mood="celebrate" size={120} /></div>
            <h2 id="rv-done" className="text-2xl">Session done!</h2>
            <p className="text-muted">You reviewed {done} {done === 1 ? "question" : "questions"}. {left > 0 ? `${left} more are due — reload for the next batch.` : "Come back tomorrow for the next ones."}</p>
            {xp > 0 && <p className="inline-flex items-center gap-1 rounded-full bg-gold-l px-4 py-1 font-black text-head"><ArtBolt size={22} />+{xp} XP</p>}
            <Link href="/home" className="btn">Back to home</Link>
          </section>
        ) : item ? (
          <AnimatePresence mode="wait" initial={false}>
            <motion.section key={item.id} initial={reduce ? false : { opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={reduce ? undefined : { opacity: 0, x: -24 }}
              transition={{ duration: 0.22 }} className="card flex flex-col gap-3" aria-label={`Review ${idx + 1} of ${items.length}`}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="chip chip-soft">Review {idx + 1} of {items.length}</span>
                <span className={`chip ${item.kind === "pyq" ? "chip-hot" : "chip-cool"}`}>{item.kind === "pyq" ? "PYQ" : "Missed question"}</span>
                {item.lapses > 0 && <span className="chip chip-warm">Tricky: missed {item.lapses}×</span>}
              </div>
              <p className="text-xs font-black uppercase tracking-wide text-muted">{item.where}</p>
              {item.kind === "quiz"
                ? <QuizReview key={item.id} id={item.id} q={item.q} disabled={pending || !!outcome} onResult={onQuiz} />
                : <PyqReview key={item.id} item={item} />}
              {error && <p className="err" role="alert">{error}</p>}
              {item.kind === "pyq" && !outcome && (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <button type="button" className="btn" disabled={pending} onClick={() => gradePyq(true)}>I could answer it</button>
                  <button type="button" className="btn btn-ghost" disabled={pending} onClick={() => gradePyq(false)}>I need more practice</button>
                </div>
              )}
              {outcome && (
                <div role="status" className={`flex flex-col gap-2 rounded-2xl border-2 p-3 ${outcome.correct ? "border-green bg-green-l" : "border-red bg-red-l"}`}>
                  <p className={`text-lg font-black ${outcome.correct ? "text-green-t" : "text-red-t"}`}>
                    {item.kind === "pyq" ? (outcome.correct ? "Great, locked in." : "No problem, we'll bring it back soon.") : outcome.correct ? "Correct!" : "Not quite"}
                  </p>
                  <p className="text-sm text-head">
                    Next review {dueIn(outcome.due, today)} <span className="text-muted">(step {outcome.step + 1} of {GAPS.length}).</span>
                    {outcome.xp > 0 && <b className="ml-1">+{outcome.xp} XP</b>}
                  </p>
                  {item.kind === "quiz" && !outcome.correct && outcome.right && <p className="text-head"><b>Answer:</b> <Rich text={outcome.right} /></p>}
                  {item.kind === "quiz" && outcome.why && <StepByStep key={`s${item.id}`} why={outcome.why} result={outcome.right} />}
                </div>
              )}
              {outcome && <button type="button" className="btn btn-wide" onClick={next}>{idx + 1 < items.length ? "Next review" : "Finish session"}</button>}
            </motion.section>
          </AnimatePresence>
        ) : null}
      </div>

      <aside className="flex flex-col gap-4" aria-label="Revision overview">
        <section className="card flex items-center gap-4" aria-labelledby="rv-today">
          <ProgressRing value={reviewedToday + done} max={reviewedToday + done + left} label="Today's reviews done" color="var(--blue)" />
          <div className="min-w-0">
            <h2 id="rv-today" className="text-lg">Today</h2>
            <p className="text-2xl font-black text-head" data-testid="due-count">{left} due</p>
            <p className="text-sm text-muted">{reviewedToday + done} reviewed today · {total} in your queue</p>
          </div>
        </section>
        <ReviseForecast days={bars} />
      </aside>
    </div>
  );
}

function nextDueText(bars: { label: string; n: number }[]) {
  const nxt = bars.find((b, i) => i > 0 && b.n > 0);
  return nxt ? `Your next reviews: ${nxt.n} on ${nxt.label === "Tmrw" ? "tomorrow" : nxt.label}. Lochi will keep them warm.` : "Nothing due this week. Keep practising and missed questions will show up here.";
}

function PyqReview({ item }: { item: Extract<SessionItem, { kind: "pyq" }> }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="chip chip-id">{item.pyqId}</span>
        {item.marks && <span className="chip chip-soft">{item.marks} marks</span>}
      </div>
      <h2 className="text-xl leading-snug"><Rich text={item.title} /></h2>
      {item.parts.length > 0 && (
        <ol className="flex flex-col gap-2">
          {item.parts.map((x, k) => (
            <li key={k} className="rounded-xl bg-soft p-3 text-[0.97rem] leading-relaxed">
              {item.parts.length > 1 && <b className="mr-1 text-head">({String.fromCharCode(97 + k)})</b>}
              <Rich text={x.text} />
            </li>
          ))}
        </ol>
      )}
      <p className="text-sm text-muted">Answer it in your head or on paper first, then be honest with yourself.</p>
      <div className="flex flex-wrap gap-2">
        <ListenButton text={`${item.title}. ${item.parts.map((x) => x.text).join(". ")}`} />
        {item.model && (
          <button type="button" className="voice-btn" aria-expanded={open} aria-controls={`ma-${item.id}`} onClick={() => setOpen(!open)}>
            {open ? "Hide the model answer" : "See the model answer"}
          </button>
        )}
        <Link href={item.href} className="voice-btn no-underline">Open in PYQ bank</Link>
      </div>
      {item.model && open && (
        <div id={`ma-${item.id}`} className="flex flex-col gap-2 rounded-2xl border-2 border-line bg-soft p-3 text-sm leading-relaxed">
          {item.model.answer.map((b, i) => <p key={i}><Rich text={b} /></p>)}
          {item.model.formulas && item.model.formulas.length > 0 && (
            <ul className="flex flex-wrap gap-2">{item.model.formulas.map((f, i) => <li key={i} className="rounded-lg bg-card px-2 py-1 font-bold text-head"><Rich text={f} /></li>)}</ul>
          )}
          {item.model.diagram && <p><b className="text-head">Draw: </b><Rich text={item.model.diagram} /></p>}
          {item.model.result && <p><b className="text-head">Result: </b><Rich text={item.model.result} /></p>}
          {item.model.rubric.length > 0 && (
            <div>
              <p className="font-black text-head">How it is marked</p>
              <ul className="list-disc pl-5">{item.model.rubric.map((r, i) => <li key={i}><Rich text={r.point} /> <span className="text-muted">({r.marks})</span></li>)}</ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function QuizReview({ id, q, disabled, onResult }: { id: string; q: PublicQuestion; disabled: boolean; onResult: (r: ReviewResult) => void }) {
  const [pick, setPick] = useState<number | null>(null);
  const [multi, setMulti] = useState<number[]>([]);
  const [text, setText] = useState("");
  const [checking, start] = useTransition();
  const ready = q.type === "mcq" ? pick !== null : q.type === "msq" ? multi.length > 0 : text.trim() !== "";
  const locked = disabled || checking;
  function check() {
    const answer = q.type === "mcq" ? pick : q.type === "msq" ? multi : text.trim();
    start(async () => {
      try { onResult(await reviewQuiz({ id, answer })); } catch { onResult({ ok: false, error: "We couldn't reach the server. Try again." }); }
    });
  }
  return (
    <div className="flex flex-col gap-3">
      <h2 className="whitespace-pre-line text-xl font-extrabold leading-snug text-head"><Rich text={q.q} /></h2>
      <p className="text-sm text-muted">{q.type === "msq" ? "Select all that apply." : q.type === "nat" ? "Type a number." : "Pick one answer."}</p>
      {q.type === "nat" ? (
        <input className="field" inputMode="decimal" autoComplete="off" aria-label="Your answer" value={text} disabled={locked}
          onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && ready && !locked) check(); }} />
      ) : (
        <div className="flex flex-col gap-3" role={q.type === "msq" ? "group" : "radiogroup"} aria-label="Answers">
          {q.o!.map((o, i) => {
            const on = q.type === "mcq" ? pick === i : multi.includes(i);
            return (
              <button key={i} type="button" className="choice" aria-pressed={on} role={q.type === "mcq" ? "radio" : "checkbox"} aria-checked={on} disabled={locked}
                onClick={() => (q.type === "mcq" ? setPick(i) : setMulti(on ? multi.filter((x) => x !== i) : [...multi, i]))}>
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border-2 border-line text-sm font-black">{i + 1}</span>
                <span><Rich text={o} /></span>
              </button>
            );
          })}
        </div>
      )}
      {!disabled && <button type="button" className="btn btn-wide" onClick={check} disabled={!ready || locked}>{checking ? "Checking…" : "Check"}</button>}
    </div>
  );
}
