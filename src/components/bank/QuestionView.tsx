"use client";
import { Rich } from "@/lib/rich";
import { DIFFICULTY_LABEL, KIND_LABEL, type Given, type Kind } from "@/lib/cms-questions-core";

export type ViewQuestion = { kind: Kind; stem: string; options: string[]; difficulty: number };

/** The question as a student sees it. Used by the practice page and by the admin's live preview. */
export function QuestionView({ q, value, onChange, locked, marks, groupLabel = "Answer" }: {
  q: ViewQuestion; value: Given | null; onChange: (v: Given) => void; locked?: boolean;
  /** After grading: which options are right (to colour them). */
  marks?: { right: number[] } | null; groupLabel?: string;
}) {
  const picked = (i: number) => (Array.isArray(value) ? value.includes(i) : value === i);
  const state = (i: number) => {
    if (!marks) return "";
    const right = marks.right.includes(i);
    return right ? "!border-green !bg-green-l" : picked(i) ? "!border-red !bg-red-l" : "";
  };
  function toggle(i: number) {
    if (locked) return;
    if (q.kind === "multi") { const cur = Array.isArray(value) ? value : []; onChange(cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i].sort((a, b) => a - b)); }
    else onChange(i);
  }
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="chip chip-cool">{KIND_LABEL[q.kind]}</span>
        <span className="chip chip-soft">{DIFFICULTY_LABEL[q.difficulty] ?? "Medium"}</span>
        {q.kind === "multi" && <span className="text-sm text-muted">Pick every correct option.</span>}
      </div>
      <p className="whitespace-pre-wrap break-words text-lg font-extrabold text-head"><Rich text={q.stem || "Your question appears here."} /></p>
      {q.kind === "numeric" ? (
        <div className="flex flex-col gap-1">
          <label htmlFor="bank-num" className="text-sm font-extrabold text-head">Your answer</label>
          <input id="bank-num" className="field" inputMode="decimal" autoComplete="off" disabled={locked} value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(e.target.value.slice(0, 30))} />
        </div>
      ) : (
        <div className="flex flex-col gap-2" role={q.kind === "multi" ? "group" : "radiogroup"} aria-label={groupLabel}>
          {q.options.map((o, i) => (
            <button key={i} type="button" role={q.kind === "multi" ? "checkbox" : "radio"} aria-checked={picked(i)} disabled={locked}
              onClick={() => toggle(i)} className={`choice ${picked(i) && !marks ? "!border-blue !bg-blue-l" : ""} ${state(i)}`}>
              <span className="text-muted" aria-hidden>{String.fromCharCode(65 + i)}.</span>
              <span className="min-w-0 break-words"><Rich text={o || "…"} /></span>
              {marks?.right.includes(i) && <span className="ml-auto text-green-t" aria-label="correct">✓</span>}
              {marks && picked(i) && !marks.right.includes(i) && <span className="ml-auto text-red-t" aria-label="your answer, wrong">✗</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
