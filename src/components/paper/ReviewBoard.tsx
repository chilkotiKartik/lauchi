"use client";
import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Rich } from "@/lib/rich";
import { Confetti } from "@/components/motion";
import { PAPER, gradeBand, paperTotal, partScore, weakUnits, type QuestionView, type RubricPoint, type SelfMarks } from "@/lib/paper";
import { saveMarks, startPaper } from "@/app/(app)/paper/actions";
import { PhotoCheck } from "./PhotoCheck";

type Props = {
  paperId: string; subject: string; code: string; mode: "practice" | "exam"; questions: QuestionView[];
  chosen: string[]; marks: SelfMarks; checkOn: boolean; autoSubmitted: boolean;
};
type SaveState = "idle" | "saving" | "saved" | "error";

export function ReviewBoard(p: Props) {
  const reduce = useReducedMotion();
  const [marks, setMarks] = useState<SelfMarks>(p.marks);
  const [save, setSave] = useState<SaveState>("idle");
  const [error, setError] = useState("");
  const [open, setOpen] = useState<Set<string>>(() => new Set(p.chosen.length ? p.chosen.slice(0, 1) : ["1a"]));
  const [pending, start] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef(marks);

  const rubrics: Record<string, RubricPoint[]> = {};
  for (const q of p.questions) for (const part of q.parts) rubrics[part.key] = part.review?.rubric ?? [];
  const { total, perQuestion } = paperTotal(rubrics, marks);
  const band = gradeBand(total);
  const weak = weakUnits(perQuestion);
  const [party, setParty] = useState(total >= 60 ? 1 : 0);

  async function persist() {
    timer.current = null;
    setSave("saving");
    const r = await saveMarks(p.paperId, latest.current);
    setSave(r.ok ? "saved" : "error");
    setError(r.ok ? "" : r.error);
  }
  function tick(key: string, i: number) {
    const cur = marks[key]?.t ?? [];
    const t = cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i].sort((a, b) => a - b);
    const next = { ...marks, [key]: { t } };
    if (!t.length) delete next[key];
    const before = total, after = paperTotal(rubrics, next).total;
    if (before < 60 && after >= 60) setParty((n) => n + 1);
    setMarks(next);
    latest.current = next;
    setSave("saving");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => { void persist(); }, 600);
  }
  const toggleOpen = (k: string) => setOpen((s) => { const n = new Set(s); if (n.has(k)) n.delete(k); else n.add(k); return n; });

  return (
    <div className="flex flex-col gap-5">
      {party > 0 && total >= 60 && <Confetti key={party} />}
      <section className="pp-hall" aria-labelledby="rv-h">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <p className="pp-eyebrow">{p.autoSubmitted ? "Time up · paper handed in" : "Paper handed in"} · {p.mode === "exam" ? "Exam mode" : "Practice mode"}</p>
          <h1 id="rv-h" className="text-2xl text-white sm:text-3xl">Mark your paper</h1>
          <p className="text-sm text-white/85">{p.subject} · Tick each point your answer really has. The best two parts of each question count, like UTU.</p>
        </div>
        <motion.div className="pp-score" initial={reduce ? false : { scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 260, damping: 20 }}>
          <span className="text-xs font-black uppercase tracking-widest opacity-80">Your total</span>
          <span className="text-5xl font-black tabular-nums"><span data-testid="paper-total">{total}</span><span className="text-xl opacity-80"> / 100</span></span>
          <span className="pp-grade" aria-label={`Grade ${band.grade}, ${band.label}`}>{band.grade} · {band.label}</span>
        </motion.div>
      </section>

      <section className="card flex flex-col gap-3" aria-labelledby="wk-h">
        <h2 id="wk-h" className="text-lg">By unit</h2>
        <ul className="grid grid-cols-5 gap-2" aria-label="Marks per question">
          {perQuestion.map((s, i) => (
            <li key={i} className="flex flex-col items-center gap-1">
              <div className="pp-bar" aria-hidden><motion.div className="pp-bar-fill" style={{ background: s >= 14 ? "var(--green)" : s >= 10 ? "var(--gold)" : "var(--red)" }}
                initial={false} animate={{ height: `${(s / (PAPER.partMarks * PAPER.attemptPerQ)) * 100}%` }} transition={{ duration: reduce ? 0 : 0.4 }} /></div>
              <span className="text-xs font-black text-head">U{i + 1}</span>
              <span className="text-xs tabular-nums text-muted">{s}/20</span>
            </li>
          ))}
        </ul>
        {weak.length ? (
          <p className="text-[0.95rem]"><b className="text-head">Weak units:</b> {weak.map((u, i) => (
            <span key={u}>{i > 0 && ", "}<Link href={`/pyq?course=${p.code}&unit=${u}`}>Unit {u}: {p.questions[u - 1]?.unitTitle}</Link></span>
          ))}. Practise their most repeated PYQs next.</p>
        ) : <p className="ok">No weak units on this paper. Great balance!</p>}
      </section>

      <ol className="flex flex-col gap-5">
        {p.questions.map((q) => (
          <li key={q.n} className="flex flex-col gap-3" aria-labelledby={`rq${q.n}`}>
            <h2 id={`rq${q.n}`} className="text-xl">Question {q.n} <span className="text-base text-muted">· Unit {q.n}: {q.unitTitle} · {perQuestion[q.n - 1]}/20</span></h2>
            {q.parts.map((part) => {
              const rubric = part.review?.rubric ?? [];
              const model = part.review?.model ?? null;
              const ticks = marks[part.key]?.t ?? [];
              const score = partScore(rubric, marks[part.key]);
              const isOpen = open.has(part.key);
              const tried = p.chosen.includes(part.key);
              return (
                <article key={part.key} className={`card pp-review ${tried ? "is-tried" : ""}`} aria-label={`Q${q.n} (${part.key[1]})`} data-part={part.key}>
                  <div className="flex flex-wrap items-center gap-2">
                    <b className="text-lg text-head">Q{q.n} ({part.key[1]})</b>
                    {tried && <span className="chip chip-cool">You attempted this</span>}
                    <span className={`chip ${part.kind === "numerical" ? "chip-num" : "chip-th"}`}>{part.kind === "numerical" ? "Numerical" : "Theory"}</span>
                    <span className="ml-auto font-black tabular-nums text-head" aria-label={`${score} of 10 marks`}>{score} / 10</span>
                  </div>
                  {part.lines.map((t, i) => <p key={i} className="pp-text"><Rich text={t} /></p>)}

                  <button type="button" className="pp-disclose" aria-expanded={isOpen} onClick={() => toggleOpen(part.key)}>
                    {isOpen ? "Hide the model answer" : model ? "Show the model answer" : "Show the answer guide"}
                  </button>
                  {isOpen && (
                    <motion.div className="pp-model" initial={reduce ? false : { opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}>
                      {model ? (
                        <>
                          {model.answer.map((b, i) => <p key={i}><Rich text={b} /></p>)}
                          {model.formulas && model.formulas.length > 0 && (
                            <ul className="flex flex-wrap gap-2" aria-label="Key formulas">{model.formulas.map((f, i) => <li key={i} className="pp-formula"><Rich text={f} /></li>)}</ul>
                          )}
                          {model.diagram && <p><b className="text-head">Diagram: </b><Rich text={model.diagram} /></p>}
                          {model.result && <p className="pp-result"><b>Result: </b><Rich text={model.result} /></p>}
                        </>
                      ) : (
                        <p><b className="text-head">Model answer coming soon.</b> Until then, mark yourself with the general examiner&apos;s guide below and check your notes or the <Link href={`/pyq?course=${p.code}&unit=${q.n}`}>PYQ bank</Link> for this question.</p>
                      )}
                    </motion.div>
                  )}

                  <fieldset className="pp-rubric">
                    <legend className="font-black text-head">{model ? "Marking scheme" : "General marking guide"} <span className="text-sm text-muted">(out of 10)</span></legend>
                    {rubric.map((r, i) => (
                      <label key={i} className={`pp-rub ${ticks.includes(i) ? "is-on" : ""}`}>
                        <input type="checkbox" checked={ticks.includes(i)} onChange={() => tick(part.key, i)} />
                        <span className="min-w-0 flex-1"><Rich text={r.point} /></span>
                        <span className="tabular-nums font-black">{r.marks}</span>
                      </label>
                    ))}
                  </fieldset>
                  <PhotoCheck course={p.code} id={part.id} part={part.key} on={p.checkOn} />
                </article>
              );
            })}
          </li>
        ))}
      </ol>

      <div className="sticky bottom-24 z-10 flex flex-col gap-2 md:bottom-4">
        <div className="card flex flex-wrap items-center gap-3">
          <b className="text-head">Total {total} / 100 · {band.grade}</b>
          <span className="text-sm text-muted" role="status" aria-live="polite">{save === "saving" ? "Saving…" : save === "saved" ? "Marks saved" : save === "error" ? "Not saved" : "Tick points to mark"}</span>
          <div className="ml-auto flex flex-wrap gap-2">
            <button type="button" className="btn" onClick={() => { if (timer.current) clearTimeout(timer.current); void persist(); }}>Save marks</button>
            <button type="button" className="btn btn-ghost" disabled={pending} onClick={() => start(async () => { const r = await startPaper({ course: p.code, mode: p.mode }); if (r?.error) setError(r.error); })}>
              {pending ? "Building…" : "Generate another paper"}
            </button>
          </div>
        </div>
        {error && <p className="err" role="alert">{error}</p>}
      </div>
      <p className="text-center text-sm"><Link href="/paper">All your papers →</Link></p>
    </div>
  );
}
