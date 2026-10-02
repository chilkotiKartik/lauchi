import { z } from "zod";
import type { Question } from "@/labs/experiments/types";
import { TAG } from "@/lib/cms-lessons";

const CONTROL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;
const clean = (s: string) => !CONTROL.test(s) && !TAG.test(s);
const text = (max: number) => z.string().max(max).transform((s) => s.trim()).refine(clean, "Only <sub> <sup> <b> <i> are allowed");
const list = (n: number, max: number) => z.array(z.string().max(max)).max(n).transform((a) => a.map((s) => s.trim()).filter(Boolean)).refine((a) => a.every(clean), "Only <sub> <sup> <b> <i> are allowed");

const num = () => z.preprocess((v) => (v === null || v === undefined || v === "" ? NaN : v), z.coerce.number({ error: "Enter a number" }));

const base = {
  prompt: text(600).pipe(z.string().min(5, "Write the question")),
  scenario: text(800).optional(),
  marks: num().pipe(z.number().int().min(1, "Marks 1 to 10").max(10, "Marks 1 to 10")),
  hint: text(300).optional(),
  formulas: list(6, 200).optional(),
  solution: list(12, 500).pipe(z.array(z.string()).min(1, "Add at least one solution step")),
  explanation: text(800).pipe(z.string().min(3, "Write a short explanation")),
  commonMistake: text(400).optional(),
};

export const labQuestionSchema = z.discriminatedUnion("type", [
  z.object({ ...base, type: z.literal("mcq"), options: list(6, 200).pipe(z.array(z.string()).min(2, "Add at least 2 options").max(6)), answer: num().pipe(z.number().int().min(0)) }),
  z.object({ ...base, type: z.literal("tf"), answer: z.boolean() }),
  z.object({ ...base, type: z.literal("numeric"), answer: num().pipe(z.number({ error: "Answer must be a number" }).finite("Answer must be a number")), tolerance: num().pipe(z.number({ error: "Tolerance must be a number" }).min(0, "Tolerance can't be negative").finite()), unit: text(20).optional() }),
]);

export type LabQuestionCheck = { ok: true; q: Omit<Question, "id"> } | { ok: false; errors: Record<string, string> };

/** Validates a lab question payload by the engine's Question type. Optional blank fields are removed. */
export function validateLabQuestion(input: unknown): LabQuestionCheck {
  const p = labQuestionSchema.safeParse(input);
  if (!p.success) { const e: Record<string, string> = {}; for (const i of p.error.issues) { const k = i.path.join(".") || "_"; if (!(k in e)) e[k] = i.message; } return { ok: false, errors: e }; }
  const q = p.data as Record<string, unknown>;
  for (const k of ["scenario", "hint", "commonMistake", "unit"]) if (q[k] === "" || q[k] === undefined) delete q[k];
  if (Array.isArray(q.formulas) && q.formulas.length === 0) delete q.formulas;
  if (q.type === "mcq" && (q.answer as number) >= (q.options as string[]).length) return { ok: false, errors: { answer: "The correct option must be one of the options" } };
  if (q.type === "mcq" && new Set(q.options as string[]).size !== (q.options as string[]).length) return { ok: false, errors: { options: "Options must all be different" } };
  return { ok: true, q: q as Omit<Question, "id"> };
}

/** A stored row → the Question the lab panel scores. Returns null for malformed rows so one bad row never breaks a lab. */
export function rowToQuestion(row: { id: string; payload: unknown }): Question | null {
  const v = validateLabQuestion(row.payload);
  return v.ok ? ({ ...v.q, id: `cms-${row.id}` } as Question) : null;
}
