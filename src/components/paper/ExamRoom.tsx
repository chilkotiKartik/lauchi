"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Rich } from "@/lib/rich";
import { PAPER, PAPER_MS, cleanChosen, formatClock, remainingMs, type QuestionView } from "@/lib/paper";
import { pausePaper, savePaper, submitPaper } from "@/app/(app)/paper/actions";
import { CountdownRing } from "./CountdownRing";
import { PaperHeader } from "./PaperHeader";

type Props = {
  paperId: string; subject: string; code: string; mode: "practice" | "exam";
  questions: QuestionView[]; endsAt: string; pausedAt: string | null; serverNow: number;
  chosen: string[]; notes: string;
};
type SaveState = "idle" | "saving" | "saved" | "error";
const WARN_AT = [30, 10, 5, 1].map((m) => m * 60_000);

export function ExamRoom(p: Props) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [endsAt, setEndsAt] = useState(p.endsAt);
  const [pausedAt, setPausedAt] = useState<string | null>(p.pausedAt);
  const [left, setLeft] = useState(() => remainingMs({ ends_at: p.endsAt, paused_at: p.pausedAt, submitted_at: null }, p.serverNow));
  const [chosen, setChosen] = useState<string[]>(p.chosen);
  const [notes, setNotes] = useState(p.notes);
  const [save, setSave] = useState<SaveState>("idle");
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState("");
  const [announce, setAnnounce] = useState("");
  const [pending, start] = useTransition();
  const offset = useRef(0);
  const submitted = useRef(false);
  const warned = useRef(new Set<number>());
  const dirty = useRef<{ chosen?: string[]; notes?: string }>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finishRef = useRef<(auto?: boolean) => Promise<void>>(async () => {});
  const paused = pausedAt !== null;

  // the server's clock is the one that counts; remember how far this device's clock is off
  useEffect(() => { offset.current = p.serverNow - Date.now(); }, [p.serverNow]);

  useEffect(() => {
    const tick = () => {
      const ms = remainingMs({ ends_at: endsAt, paused_at: pausedAt, submitted_at: null }, Date.now() + offset.current);
      setLeft(ms);
      for (const w of WARN_AT) if (ms <= w && ms > w - 60_000 && !warned.current.has(w)) { warned.current.add(w); setAnnounce(`${w / 60_000} minute${w === 60_000 ? "" : "s"} left`); }
      if (ms <= 0 && !pausedAt && !submitted.current) { submitted.current = true; void finishRef.current(true); }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endsAt, pausedAt]);

  async function flush() {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    const patch = dirty.current;
    if (!patch.chosen && patch.notes === undefined) return true;
    dirty.current = {};
    setSave("saving");
    const r = await savePaper(p.paperId, patch);
    setSave(r.ok ? "saved" : "error");
    if (!r.ok) setError(r.error);
    return r.ok;
  }
  function queue(patch: { chosen?: string[]; notes?: string }, delay: number) {
    dirty.current = { ...dirty.current, ...patch };
    setSave("saving");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => { void flush(); }, delay);
  }

  function toggle(key: string) {
    const on = chosen.includes(key);
    const next = on ? chosen.filter((k) => k !== key) : cleanChosen([...chosen, key]);
    setChosen(next);
    queue({ chosen: next }, 300);
  }

  async function finish(auto = false) {
    setError("");
    await flush().catch(() => false);
    const r = await submitPaper(p.paperId);
    if (!r.ok) { submitted.current = false; setError(r.error); return; }
    if (auto) setAnnounce("Time is up. Your paper has been handed in.");
    router.refresh();
  }

  useEffect(() => { finishRef.current = finish; });

  function togglePause() {
    setError("");
    start(async () => {
      await flush();
      const r = await pausePaper(p.paperId, !paused);
      if (!r.ok) { setError(r.error); return; }
      if (r.endsAt) setEndsAt(r.endsAt);
      setPausedAt(r.pausedAt ?? null);
    });
  }

  const count = (q: number) => chosen.filter((k) => k[0] === String(q)).length;
  const done = p.questions.filter((q) => count(q.n) === PAPER.attemptPerQ).length;

  return (
    <div className="flex flex-col gap-5">
      <section className="pp-hall no-print" aria-label="Exam hall">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <p className="pp-eyebrow">{p.mode === "exam" ? "Exam mode · the clock can't stop" : "Practice mode · you can pause"}</p>
          <h1 className="text-2xl text-white sm:text-3xl">{p.subject}</h1>
          <p className="text-sm text-white/80">{p.code} · Max marks 100 · 3 hours · {done} of {PAPER.questions} questions have two parts marked</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {p.mode === "practice" && (
              <button type="button" className="btn btn-ghost" onClick={togglePause} disabled={pending}>{paused ? "Resume the clock" : "Pause the clock"}</button>
            )}
            <button type="button" className="btn btn-ghost" onClick={() => window.print()}>Print paper</button>
          </div>
        </div>
        <CountdownRing left={left} total={PAPER_MS} paused={paused} />
      </section>
      <div className="pp-mini no-print" aria-hidden><span className="tabular-nums">{formatClock(left)}</span>{paused && <span> · paused</span>}</div>
      <p className="sr-only" role="status" aria-live="polite">{announce}</p>

      <AnimatePresence>
        {paused && (
          <motion.div className="card no-print text-center" initial={reduce ? false : { opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <b className="text-head">The clock is paused.</b> The paper is hidden until you resume, just like closing your answer book.
          </motion.div>
        )}
      </AnimatePresence>

      <article className={`pp-sheet ${paused ? "pp-hidden" : ""}`} aria-label="Question paper" aria-hidden={paused || undefined}>
        <PaperHeader subject={p.subject} code={p.code} />
        <div className="pp-instr" role="note" aria-label="Instructions">
          <p><b>Note:</b> Attempt any TWO parts of each question. All questions carry equal marks.</p>
          <p className="pp-fine no-print">UTU-style pattern based on recent papers; check your own paper&apos;s instructions.</p>
        </div>
        <ol className="flex flex-col gap-6">
          {p.questions.map((q) => (
            <li key={q.n} className="pp-q" aria-labelledby={`q${q.n}`}>
              <h2 id={`q${q.n}`} className="pp-qh">Question {q.n}<span className="pp-unit"> · Unit {q.n}: {q.unitTitle}</span></h2>
              <ol className="flex flex-col gap-3">
                {q.parts.map((part) => {
                  const on = chosen.includes(part.key);
                  const full = !on && count(q.n) >= PAPER.attemptPerQ;
                  return (
                    <li key={part.key} className={`pp-part ${on ? "is-on" : ""}`} data-part={part.key}>
                      <span className="pp-letter" aria-hidden>({part.key[1]})</span>
                      <div className="min-w-0 flex-1">
                        {part.lines.map((t, i) => <p key={i} className="pp-text"><Rich text={t} /></p>)}
                        <div className="no-print mt-2 flex flex-wrap items-center gap-2">
                          <span className={`chip ${part.kind === "numerical" ? "chip-num" : "chip-th"}`}>{part.kind === "numerical" ? "Numerical" : "Theory"}</span>
                          {part.repeated ? <span className="chip chip-warm">Asked {part.repeated}×</span> : null}
                          <button type="button" className={`seg ${on ? "is-on is-green" : ""}`} aria-pressed={on} disabled={full}
                            aria-label={`Mark Q${q.n} (${part.key[1]}) as attempted`} title={full ? "You've already marked two parts of this question" : undefined}
                            onClick={() => toggle(part.key)}>
                            {on ? "✓ Attempted" : "Mark attempted"}
                          </button>
                        </div>
                      </div>
                      <span className="pp-marks" aria-label="10 marks">[10]</span>
                    </li>
                  );
                })}
              </ol>
            </li>
          ))}
        </ol>
      </article>

      <section className="card no-print flex flex-col gap-2">
        <h2 id="notes-h" className="text-lg">Scratch notes</h2>
        <p className="text-sm text-muted">Rough work, formulas to remember, what to come back to. Saved as you type.</p>
        <textarea id="pp-notes" aria-labelledby="notes-h" className="field min-h-36" value={notes} maxLength={20000}
          onChange={(e) => { setNotes(e.target.value); queue({ notes: e.target.value }, 1000); }} onBlur={() => void flush()} />
      </section>

      <div className="no-print flex flex-col gap-3">
        <p className="text-sm font-bold text-muted" role="status" aria-live="polite">
          {save === "saving" ? "Saving…" : save === "saved" ? "All changes saved" : save === "error" ? "Not saved yet. Check your connection." : "Your answers are written on paper; this page keeps the clock, your ticks and notes."}
        </p>
        {error && <p className="err" role="alert">{error}</p>}
        <AnimatePresence mode="wait" initial={false}>
          {confirm ? (
            <motion.div key="c" role="group" aria-label="Confirm submit" className="card flex flex-col gap-3" initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <b className="text-head">Hand in your paper?</b>
              <p className="text-sm">You can&apos;t change your attempted parts after this. Next you&apos;ll mark it with the model answers.</p>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="btn" disabled={pending} onClick={() => start(() => finish())}>{pending ? "Submitting…" : "Yes, submit"}</button>
                <button type="button" className="btn btn-ghost" onClick={() => setConfirm(false)}>Keep writing</button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="s" initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <button type="button" className="btn btn-blue btn-wide" onClick={() => setConfirm(true)}>Submit paper</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
