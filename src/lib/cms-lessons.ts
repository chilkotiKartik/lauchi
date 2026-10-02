import { z } from "zod";
import type { Lesson } from "@/content/lessons/types";
import { LABS } from "@/labs/registry";

/** Same rule as src/content/content.test.ts: only <sub> <sup> <b> <i> may appear; any other tag is refused. */
export const TAG = /<\/?(?!(?:sub|sup|b|i)>)[a-z][a-z0-9]*(?:\s[^<>]*)?\/?>/i;
const CONTROL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;
export const COURSE_RE = /^[A-Z]{2,3}-[0-9]{3}$/;

const str = (max: number) => z.string().max(max).transform((s) => s.trim());
const lines = (maxItems: number, maxLen: number) => z.array(z.string().max(maxLen)).max(maxItems).transform((a) => a.map((s) => s.trim()).filter(Boolean));

/** Shape of a lesson as stored in cms_lessons.body (blank lines are dropped; text is trimmed). */
export const lessonBodySchema = z.object({
  intro: str(3000),
  sections: z.array(z.object({ h: str(200), p: lines(30, 3000), formula: lines(20, 500).optional() })).max(20),
  examples: z.array(z.object({ q: str(2000), steps: lines(30, 1000), ans: str(1000) })).max(20),
  mistakes: lines(20, 1000),
  check: z.array(z.object({ q: str(1000), o: lines(8, 300), a: z.number().int(), why: str(1000) })).max(30),
  lab: z.object({ id: z.string().max(64), label: str(200) }).optional(),
});

export type LessonCheck = { ok: true; lesson: Lesson; errors: [] } | { ok: false; lesson: null; errors: string[] };

export function lessonTexts(l: Lesson): string[] {
  return [l.intro, ...l.sections.flatMap((s) => [s.h, ...s.p, ...(s.formula ?? [])]), ...l.examples.flatMap((e) => [e.q, ...e.steps, e.ans]), ...l.mistakes, ...l.check.flatMap((c) => [c.q, ...c.o, c.why]), ...(l.lab ? [l.lab.label] : [])];
}

/**
 * Parses and validates a lesson. `strict` (publishing) mirrors content.test.ts: intro > 40 chars, >= 2 sections, >= 1 example,
 * >= 2 mistakes, >= 2 checks, answer index in range, options unique. Drafts only need safe markup and a consistent shape.
 */
export function validateLesson(input: unknown, opts: { strict: boolean; labIds?: Set<string> } = { strict: true }): LessonCheck {
  const p = lessonBodySchema.safeParse(input);
  if (!p.success) return { ok: false, lesson: null, errors: p.error.issues.map((i) => `${i.path.join(".") || "lesson"}: ${i.message}`).slice(0, 10) };
  const l: Lesson = p.data;
  if (l.lab && !l.lab.id) delete l.lab;
  for (const s of l.sections) if (s.formula && s.formula.length === 0) delete s.formula;
  const errors: string[] = [];
  for (const t of lessonTexts(l)) {
    if (CONTROL.test(t)) { errors.push("Some text has characters we can't accept."); break; }
    if (TAG.test(t)) { errors.push(`Only <sub> <sup> <b> <i> are allowed in the text. Remove other tags near: "${t.slice(0, 50)}"`); break; }
  }
  l.check.forEach((c, i) => {
    if (c.o.length && (c.a < 0 || c.a >= c.o.length)) errors.push(`Check ${i + 1}: the correct option number must be one of the options.`);
    if (new Set(c.o).size !== c.o.length) errors.push(`Check ${i + 1}: options must all be different.`);
  });
  if (l.lab) { const ids = opts.labIds ?? new Set(LABS.map((x) => x.id)); if (!ids.has(l.lab.id)) errors.push("The linked lab doesn't exist."); }
  if (opts.strict) {
    if (l.intro.length <= 40) errors.push("The intro needs more than 40 characters.");
    if (l.sections.length < 2) errors.push("Add at least 2 sections.");
    l.sections.forEach((s, i) => { if (!s.h) errors.push(`Section ${i + 1} needs a heading.`); if (s.p.length === 0) errors.push(`Section ${i + 1} needs at least one paragraph.`); });
    if (l.examples.length < 1) errors.push("Add at least 1 worked example.");
    l.examples.forEach((e, i) => { if (!e.q || e.steps.length === 0 || !e.ans) errors.push(`Example ${i + 1} needs a question, steps and an answer.`); });
    if (l.mistakes.length < 2) errors.push("Add at least 2 common mistakes.");
    if (l.check.length < 2) errors.push("Add at least 2 self-check questions.");
    l.check.forEach((c, i) => {
      if (!c.q || !c.why) errors.push(`Check ${i + 1} needs a question and an explanation.`);
      if (c.o.length < 2) errors.push(`Check ${i + 1} needs at least 2 options.`);
    });
  }
  return errors.length ? { ok: false, lesson: null, errors } : { ok: true, lesson: l, errors: [] };
}

export const emptyLesson = (): Lesson => ({
  intro: "", sections: [{ h: "", p: [""] }, { h: "", p: [""] }], examples: [{ q: "", steps: [""], ans: "" }], mistakes: ["", ""],
  check: [{ q: "", o: ["", "", "", ""], a: 0, why: "" }, { q: "", o: ["", "", "", ""], a: 0, why: "" }],
});

export const lessonKey = (course: string, unit: number, topic: number) => `${course}:${unit}:${topic}`;

export const lessonTargetSchema = z.object({
  course: z.string().regex(COURSE_RE, "Pick a subject"),
  unit: z.coerce.number().int().min(1).max(12),
  topic: z.coerce.number().int().min(1).max(200),
});

/** Text-only title of the lesson: first 200 chars of the topic title. */
export const clip = (s: string, n: number) => (s.length > n ? s.slice(0, n) : s);
