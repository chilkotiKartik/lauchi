"use client";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Rich } from "@/lib/rich";
import { useLocalJson } from "@/lib/local-store";
import { Confetti } from "@/components/motion";
import { ALL_SPECS } from "@/labs/meta";
import { clampParams, type Params } from "@/labs/params-core";
import { requestLiveReset, useLiveLab } from "@/labs/live-store";
import { evaluateStep, formatDuration, passMark, scoreAttempt, type StepContext } from "@/labs/experiments/engine";
import { sfx } from "@/lib/sound";
import type { Experiment } from "@/labs/experiments/types";
import { QuestionCard, type Answered } from "./QuestionCard";

type Saved = { best: number; attempts: number; steps: string[] };
const FRESH: Saved = { best: 0, attempts: 0, steps: [] };
type Base = { params: Params | null; resets: number; presets: number };
type Tab = "aim" | "steps" | "questions" | "results";
const TABS: { id: Tab; label: string }[] = [{ id: "aim", label: "Aim & Equipment" }, { id: "steps", label: "Steps" }, { id: "questions", label: "Questions" }, { id: "results", label: "Results" }];

const sameParams = (a: Params | null, b: Params) => !!a && Object.keys(b).every((k) => a[k] === b[k]);

function Tick({ on, reduce }: { on: boolean; reduce: boolean }) {
  return (
    <span aria-hidden className={`grid size-7 shrink-0 place-items-center rounded-full border-2 transition-colors ${on ? "border-green bg-green text-white" : "border-line2 bg-card"}`}>
      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
        <motion.path d="M5 12.5l4.5 4.5L19 7.5" initial={false} animate={{ pathLength: on ? 1 : 0, opacity: on ? 1 : 0 }} transition={{ duration: reduce ? 0 : 0.35 }} />
      </svg>
    </span>
  );
}

/** Guided experiment next to a 3D lab: aim, live-verified steps, questions with worked solutions, and a scored result. */
export function ExperimentPanel({ experiment: e }: { experiment: Experiment }) {
  const reduce = !!useReducedMotion();
  const live = useLiveLab(e.labId);
  const [saved, setSaved] = useLocalJson<Saved>(`lockin.exp.${e.labId}`, FRESH);
  const [tab, setTab] = useState<Tab>("aim");
  const [open, setOpen] = useState(false);
  const [base, setBase] = useState<Base | null>(null);
  const [settling, setSettling] = useState(false);
  const [hintStep, setHintStep] = useState<string | null>(null);
  const [qIndex, setQIndex] = useState(0);
  const [round, setRound] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answered | undefined>>({});
  const [hints, setHints] = useState<Record<string, boolean>>({});
  const [elapsed, setElapsed] = useState<number | null>(null);
  const [celebrate, setCelebrate] = useState(false);
  const t0 = useRef<number | null>(null);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const pass = passMark(e);
  const defaults = useMemo(() => (ALL_SPECS[e.labId] ? (clampParams(ALL_SPECS[e.labId], null) as Params) : null), [e.labId]);

  useEffect(() => { t0.current ??= Date.now(); }, []);
  // Remember where the lab was when the experiment began, so "changed" steps compare with that.
  if (!base && live.params) setBase({ params: live.params, resets: live.resets, presets: live.presets });
  // After a restart, wait until the lab has really gone back to its defaults before judging steps again.
  if (settling && (!live.params || !defaults || sameParams(live.params, defaults))) setSettling(false);

  const doneSet = useMemo(() => new Set(saved.steps), [saved.steps]);
  const ctxFor = (manual: boolean): StepContext => ({ params: live.params, baseline: base?.params ?? null, resets: live.resets, baseResets: base?.resets ?? live.resets, presets: live.presets, basePresets: base?.presets ?? live.presets, lastPreset: live.lastPreset, manual });
  const fresh = useMemo(() => {
    if (!base || settling) return [] as string[];
    const c = ctxFor(false);
    return e.steps.filter((s) => s.check.kind !== "manual" && !doneSet.has(s.id) && evaluateStep(s.check, c)).map((s) => s.id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [e.steps, base, settling, live, doneSet]);
  useEffect(() => {
    if (fresh.length) {
      sfx.pop();
      setSaved({ ...saved, steps: [...saved.steps, ...fresh] });
    }
  }, [fresh, saved, setSaved]);

  const stepsDone = e.steps.filter((s) => doneSet.has(s.id)).length;
  const currentStep = e.steps.find((s) => !doneSet.has(s.id))?.id ?? null;
  const results = useMemo(() => Object.fromEntries(Object.entries(answers).map(([id, a]) => [id, a && { correct: a.correct, hintUsed: a.hintUsed }])), [answers]);
  const score = scoreAttempt(e.questions, results, pass);
  const answeredCount = e.questions.filter((q) => answers[q.id]).length;
  const finished = answeredCount === e.questions.length && elapsed !== null;

  useEffect(() => {
    if (!celebrate) return;
    sfx.victory();
    const t = setTimeout(() => setCelebrate(false), 3500);
    return () => clearTimeout(t);
  }, [celebrate]);

  const tickManual = (id: string) => { if (!doneSet.has(id)) setSaved({ ...saved, steps: [...saved.steps, id] }); };
  const retry = (go = true) => { setAnswers({}); setHints({}); setQIndex(0); setElapsed(null); setCelebrate(false); setRound((r) => r + 1); if (go) setTab("questions"); };
  const restart = () => {
    setSaved({ ...saved, steps: [] });
    setSettling(true);
    requestLiveReset(e.labId);
    setBase({ params: defaults, resets: live.resets, presets: live.presets });
    setHintStep(null); setTab("steps");
    t0.current = Date.now();
    retry(false);
  };

  const onAnswer = (qid: string, a: Answered) => {
    const next = { ...answers, [qid]: a };
    setAnswers(next);
    if (e.questions.every((q) => next[q.id])) {
      const sc = scoreAttempt(e.questions, Object.fromEntries(Object.entries(next).map(([id, x]) => [id, x && { correct: x.correct, hintUsed: x.hintUsed }])), pass);
      setElapsed(Date.now() - (t0.current ?? Date.now()));
      setSaved({ ...saved, attempts: saved.attempts + 1, best: Math.max(saved.best, sc.percent) });
      if (sc.passed) setCelebrate(true);
    }
  };
  const next = () => { if (qIndex < e.questions.length - 1) setQIndex(qIndex + 1); else setTab("results"); };

  const onTabKey = (ev: KeyboardEvent) => {
    const i = TABS.findIndex((t) => t.id === tab);
    const j = ev.key === "ArrowRight" ? (i + 1) % TABS.length : ev.key === "ArrowLeft" ? (i + TABS.length - 1) % TABS.length : ev.key === "Home" ? 0 : ev.key === "End" ? TABS.length - 1 : -1;
    if (j < 0) return;
    ev.preventDefault(); setTab(TABS[j].id); tabRefs.current[TABS[j].id]?.focus();
  };

  const q = e.questions[Math.min(qIndex, e.questions.length - 1)];
  const pct = Math.round((stepsDone / e.steps.length) * 100);

  return (
    <section aria-label="Experiment" data-testid="experiment-panel" className="card overflow-hidden !p-0">
      {celebrate && !reduce && <Confetti />}
      <button type="button" className="flex w-full items-center gap-3 bg-gradient-to-r from-blue-l to-purple-l p-4 text-left lg:cursor-default" aria-expanded={open} aria-controls="exp-body" onClick={() => setOpen(!open)}>
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-blue text-xl text-white" aria-hidden>⚗</span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2"><span className="text-xs font-black uppercase tracking-wide text-blue-t">Experiment</span>{saved.best > 0 && <span className="chip chip-warm">Best {saved.best}%</span>}</span>
          <span className="block font-black leading-tight text-head">{e.title}</span>
          <span className="mt-1.5 flex items-center gap-2" aria-hidden>
            <span className="h-2 flex-1 overflow-hidden rounded-full bg-card"><motion.span className="block h-full rounded-full bg-green" initial={false} animate={{ width: `${pct}%` }} transition={{ duration: reduce ? 0 : 0.4 }} /></span>
            <span className="text-xs font-black text-muted">{stepsDone}/{e.steps.length}</span>
          </span>
        </span>
        <span className="text-lg font-black text-muted lg:hidden" aria-hidden>{open ? "−" : "+"}</span>
      </button>

      <div id="exp-body" className={open ? "block" : "hidden lg:block"}>
        <div role="tablist" aria-label="Experiment sections" className="flex gap-1 overflow-x-auto border-b-2 border-line px-2 pt-2" onKeyDown={onTabKey}>
          {TABS.map((t) => (
            <button key={t.id} ref={(el) => { tabRefs.current[t.id] = el; }} role="tab" id={`exp-tab-${t.id}`} aria-selected={tab === t.id} aria-controls={`exp-pane-${t.id}`} tabIndex={tab === t.id ? 0 : -1}
              onClick={() => setTab(t.id)}
              className={`whitespace-nowrap rounded-t-xl border-b-4 px-3 py-2 text-sm font-black transition-colors ${tab === t.id ? "border-blue text-blue-t" : "border-transparent text-muted hover:text-head"}`}>{t.label}</button>
          ))}
        </div>

        <div role="tabpanel" id={`exp-pane-${tab}`} aria-labelledby={`exp-tab-${tab}`} tabIndex={0} className="max-h-[70vh] overflow-y-auto p-4 lg:max-h-[calc(100dvh-14rem)]">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={tab} initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }} transition={{ duration: reduce ? 0 : 0.18 }} className="grid gap-4">
              {tab === "aim" && (
                <>
                  <div><h3 className="text-xs font-black uppercase tracking-wide text-muted">Aim</h3><p className="mt-1 text-body"><Rich text={e.aim} /></p></div>
                  <div><h3 className="text-xs font-black uppercase tracking-wide text-muted">You will be able to</h3>
                    <ul className="mt-1 list-disc space-y-1 pl-5 text-body">{e.objectives.map((o, i) => <li key={i}><Rich text={o} /></li>)}</ul></div>
                  <div><h3 className="text-xs font-black uppercase tracking-wide text-muted">Equipment</h3>
                    <ul className="mt-2 grid gap-2">{e.equipment.map((x) => (
                      <li key={x.name} className="rounded-2xl border-2 border-line bg-soft p-3">
                        <p className="font-black text-head">{x.name}</p>
                        <p className="text-sm text-body"><Rich text={x.what} /></p>
                        {x.where && <p className="mt-1 text-xs font-bold text-blue-t">Find it: {x.where}</p>}
                      </li>))}</ul></div>
                  <button type="button" className="btn justify-self-start" onClick={() => setTab("steps")}>Start the steps</button>
                </>
              )}

              {tab === "steps" && (
                <>
                  <p className="text-sm text-muted" role="status">{stepsDone} of {e.steps.length} steps done. Steps tick by themselves when the lab shows what the step asks for.</p>
                  <ol className="grid gap-2">
                    {e.steps.map((s, i) => {
                      const done = doneSet.has(s.id), cur = s.id === currentStep;
                      return (
                        <li key={s.id} data-done={done} aria-current={cur ? "step" : undefined} className={`rounded-2xl border-2 p-3 transition-colors ${done ? "border-green bg-green-l" : cur ? "border-blue bg-blue-l" : "border-line bg-card"}`}>
                          <div className="flex items-start gap-3">
                            <Tick on={done} reduce={reduce} />
                            <div className="min-w-0 flex-1">
                              <p className="font-black leading-snug text-head"><span className="sr-only">Step {i + 1}. {done ? "Done. " : cur ? "Current step. " : ""}</span><span aria-hidden>{i + 1}. </span>{s.title}</p>
                              <p className="mt-0.5 text-sm text-body"><Rich text={s.text} /></p>
                              {hintStep === s.id && s.hint && <p className="mt-2 rounded-xl bg-gold-l px-3 py-2 text-sm font-semibold text-body"><b>Hint:</b> <Rich text={s.hint} /></p>}
                              {!done && (
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {s.hint && hintStep !== s.id && <button type="button" className="pill !px-3 text-sm" onClick={() => setHintStep(s.id)}>Hint</button>}
                                  {s.check.kind === "manual" && <button type="button" className="pill !px-3 text-sm hover:border-green" onClick={() => tickManual(s.id)}>I have done this</button>}
                                </div>
                              )}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className="btn btn-ghost" onClick={restart}>Restart experiment</button>
                    <button type="button" className="btn" onClick={() => setTab("questions")}>Go to questions</button>
                  </div>
                </>
              )}

              {tab === "questions" && (
                <>
                  <div className="flex items-center gap-2" aria-hidden><span className="h-2 flex-1 overflow-hidden rounded-full bg-soft"><motion.span className="block h-full rounded-full bg-blue" initial={false} animate={{ width: `${(answeredCount / e.questions.length) * 100}%` }} transition={{ duration: reduce ? 0 : 0.3 }} /></span><span className="text-xs font-black text-muted">{answeredCount}/{e.questions.length}</span></div>
                  <p className="sr-only" role="status">{answeredCount} of {e.questions.length} questions answered.</p>
                  <QuestionCard key={`${round}-${q.id}`} q={q} number={qIndex + 1} total={e.questions.length} answered={answers[q.id]} hintShown={!!hints[q.id]}
                    onHint={() => setHints({ ...hints, [q.id]: true })} onAnswer={(a) => onAnswer(q.id, a)} onNext={next} last={qIndex === e.questions.length - 1} />
                </>
              )}

              {tab === "results" && (
                finished ? (
                  <>
                    <div className={`rounded-2xl border-2 p-4 text-center ${score.passed ? "border-green bg-green-l" : "border-gold bg-gold-l"}`}>
                      <p className="text-xs font-black uppercase tracking-wide text-muted">{score.passed ? "Experiment passed" : `Not passed yet (pass mark ${pass}%)`}</p>
                      <p className="text-4xl font-black text-head" data-testid="exp-score">{score.percent}%</p>
                      <p className="font-bold text-body">{score.earned} / {score.total} marks</p>
                    </div>
                    <dl className="grid grid-cols-3 gap-2 text-center">
                      {[["Steps done", `${stepsDone}/${e.steps.length}`], ["Correct", `${score.correctCount}/${e.questions.length}`], ["Time", formatDuration(elapsed ?? 0)]].map(([k, v]) => (
                        <div key={k} className="rounded-2xl border-2 border-line bg-soft p-2"><dt className="text-xs font-black uppercase text-muted">{k}</dt><dd className="font-black text-head">{v}</dd></div>
                      ))}
                    </dl>
                    {saved.best > 0 && <p className="text-sm font-bold text-muted">Best score: {saved.best}% · Attempts: {saved.attempts}</p>}
                    <div><h3 className="text-xs font-black uppercase tracking-wide text-muted">What you learned</h3>
                      <ul className="mt-1 list-disc space-y-1 pl-5 text-body">{e.summary.map((s, i) => <li key={i}><Rich text={s} /></li>)}</ul></div>
                    <div><h3 className="text-xs font-black uppercase tracking-wide text-muted">Question review</h3>
                      <ul className="mt-2 grid gap-2">{e.questions.map((x, i) => {
                        const a = answers[x.id];
                        return (
                          <li key={x.id}>
                            <details className="rounded-2xl border-2 border-line bg-card p-3">
                              <summary className="cursor-pointer font-bold text-head"><span className={a?.correct ? "text-green-t" : "text-red-t"}>{a?.correct ? "Correct" : "Wrong"}</span> · Q{i + 1}. <Rich text={x.prompt} /></summary>
                              <div className="mt-2 grid gap-2 text-sm text-body">
                                {x.type === "mcq" && <p><b className="text-head">Answer:</b> <Rich text={x.options[x.answer]} /></p>}
                                {x.type === "tf" && <p><b className="text-head">Answer:</b> {x.answer ? "True" : "False"}</p>}
                                {x.type === "numeric" && <p><b className="text-head">Answer:</b> {x.answer}{x.unit ? ` ${x.unit}` : ""}</p>}
                                <ol className="list-decimal space-y-1 pl-5">{x.solution.map((s, k) => <li key={k}><Rich text={s} /></li>)}</ol>
                                <p><Rich text={x.explanation} /></p>
                              </div>
                            </details>
                          </li>
                        );
                      })}</ul></div>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" className="btn" onClick={() => retry()}>Retry questions</button>
                      <button type="button" className="btn btn-ghost" onClick={restart}>Restart experiment</button>
                    </div>
                  </>
                ) : (
                  <>
                    <p role="status" className="rounded-2xl bg-soft p-4 text-body">Answer all {e.questions.length} questions to see your score. You have answered {answeredCount} so far, and finished {stepsDone} of {e.steps.length} steps.</p>
                    <button type="button" className="btn justify-self-start" onClick={() => setTab("questions")}>Continue questions</button>
                  </>
                )
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
