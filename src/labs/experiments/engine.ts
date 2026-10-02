import type { Experiment, Question, StepCheck } from "./types";

type Scalar = number | string | boolean;
/** What the lab is doing right now compared with when the experiment (re)started. */
export type StepContext = {
  params: Record<string, Scalar> | null;
  baseline: Record<string, Scalar> | null;
  resets: number; baseResets: number;
  presets: number; basePresets: number;
  lastPreset: string | null;
  /** Steps the student ticked by hand. */
  manual?: boolean;
};

/** True when the real lab state satisfies the check. Never true without a live lab (except a manual tick). */
export function evaluateStep(check: StepCheck, c: StepContext): boolean {
  switch (check.kind) {
    case "manual": return !!c.manual;
    case "reset": return c.resets > c.baseResets;
    case "preset": return c.presets > c.basePresets && (check.name === undefined || c.lastPreset === check.name);
    case "param": {
      if (!c.params) return false;
      const v = c.params[check.key];
      if (v === undefined) return false;
      const want = check.value;
      switch (check.op) {
        case "changed": return c.baseline ? v !== c.baseline[check.key] : false;
        case "eq": return v === want;
        case "neq": return v !== want;
        case "gte": return typeof v === "number" && typeof want === "number" && v >= want;
        case "lte": return typeof v === "number" && typeof want === "number" && v <= want;
      }
    }
  }
}

export type Given = number | boolean | string;
/** Numeric tolerance is absolute, in the question's own unit. */
export function gradeQuestion(q: Question, given: Given | null | undefined): boolean {
  if (given === null || given === undefined) return false;
  if (q.type === "mcq") return typeof given === "number" && given === q.answer;
  if (q.type === "tf") return typeof given === "boolean" && given === q.answer;
  const n = typeof given === "number" ? given : parseNumber(String(given));
  return n !== null && Math.abs(n - q.answer) <= q.tolerance + 1e-12;
}

/** Accepts "3.5", " 3,5 ", "-2e3", "1.2×10^3" is NOT accepted (kept simple). Returns null when not a number. */
export function parseNumber(s: string): number | null {
  const t = s.trim().replace(",", ".").replace("−", "-");
  if (!/^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(t)) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

export type Result = { correct: boolean; hintUsed: boolean };
export type Score = { earned: number; total: number; percent: number; passed: boolean; correctCount: number };
/** A correct answer earns full marks; if the hint was used it earns half. Unanswered questions earn nothing. */
export function scoreAttempt(questions: Question[], results: Record<string, Result | undefined>, pass = 60): Score {
  let earned = 0, total = 0, correctCount = 0;
  for (const q of questions) {
    total += q.marks;
    const r = results[q.id];
    if (r?.correct) { earned += r.hintUsed ? q.marks / 2 : q.marks; correctCount++; }
  }
  const percent = total > 0 ? Math.round((earned / total) * 100) : 0;
  return { earned, total, percent, passed: percent >= pass, correctCount };
}

export const passMark = (e: Experiment) => e.pass ?? 60;

/** "1 min 05 s" style. */
export function formatDuration(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  return s < 60 ? `${s} s` : `${Math.floor(s / 60)} min ${String(s % 60).padStart(2, "0")} s`;
}
