/** Pure helpers for the Ask Lochi tutor: context params, the grounded-context builder and the practice-question schema. No server-only imports so it can be unit-tested. */
import { z } from "zod";

export const CONTEXT_BUDGET = 6000;

export const ctxParams = z.object({
  course: z.string().regex(/^[A-Z]{2,3}-[0-9]{3}$/).optional(),
  unit: z.coerce.number().int().min(1).max(20).optional(),
  topic: z.coerce.number().int().min(1).max(200).optional(),
  pyq: z.string().regex(/^Q[0-9]{1,2}\.[0-9]{1,2}$/).optional(),
  /** "<quiz session id>:<question index>" as used by the mistakes notebook. */
  mistake: z.string().regex(/^[A-Za-z0-9_-]{6,64}:[0-9]{1,3}$/).optional(),
});
export type CtxParams = z.infer<typeof ctxParams>;

/** Read context params out of a query-string object or a JSON body, dropping anything invalid. */
export function parseCtx(raw: unknown): CtxParams | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const pick = (k: string) => { const v = Array.isArray(r[k]) ? (r[k] as unknown[])[0] : r[k]; return v === undefined || v === null || v === "" ? undefined : v; };
  const out: Record<string, unknown> = {};
  for (const k of ["course", "unit", "topic", "pyq", "mistake"] as const) {
    const v = pick(k);
    if (v === undefined) continue;
    const one = ctxParams.shape[k].safeParse(v);
    if (one.success) out[k] = one.data;
  }
  return Object.keys(out).length ? (out as CtxParams) : null;
}

export type MistakeIn = { q: string; given: string; right: string; why: string };
export type ContextInput = {
  courseName?: string;
  unit?: { n: number; title: string; topics: string[]; formulas: string[]; hints: string[] };
  topic?: { title: string; lesson?: { intro: string; sections: { h: string; p: string[]; formula?: string[] }[] } };
  pyq?: { id: string; title: string; text: string };
  answer?: { marks: number; rubric: { point: string; marks: number }[]; answer: string[]; formulas?: string[]; result?: string };
  mistakes?: MistakeIn[];
  /** A single mistake the student opened Lochi from; shown first. */
  focusMistake?: MistakeIn;
};
export type BuiltContext = { text: string; sources: string[] };

const strip = (s: string) => s.replace(/<[^>]+>/g, "").replace(/\s+\n/g, "\n").trim();
const clip = (s: string, n: number) => (s.length <= n ? s : s.slice(0, Math.max(0, n - 1)).trimEnd() + "…");
const mist = (m: MistakeIn) => `Q: ${clip(strip(m.q), 300)}\nStudent answered: ${clip(strip(m.given), 120)}\nCorrect: ${clip(strip(m.right), 120)}\nWhy: ${clip(strip(m.why), 300)}`;

/** Build the grounded context text (at most `budget` characters) plus the labels shown as chips. Sections are added in priority order. */
export function buildContext(i: ContextInput, budget = CONTEXT_BUDGET): BuiltContext {
  type Sec = { label: string; head: string; body: string };
  const secs: Sec[] = [];
  if (i.focusMistake) secs.push({ label: "the question you got wrong", head: "THE QUESTION THE STUDENT GOT WRONG (they opened Lochi from it)", body: mist(i.focusMistake) });
  if (i.pyq) secs.push({ label: `PYQ ${i.pyq.id}`, head: `PREVIOUS-YEAR QUESTION ${i.pyq.id}: ${i.pyq.title}`, body: strip(i.pyq.text) });
  if (i.pyq && i.answer) {
    const a = i.answer;
    const body = [
      `Marks: ${a.marks}`,
      a.rubric.length ? "Marking scheme: " + a.rubric.map((r) => `${strip(r.point)} (${r.marks})`).join("; ") : "",
      "Model answer:\n" + a.answer.map(strip).join("\n"),
      a.formulas?.length ? "Key formulas: " + a.formulas.map(strip).join("; ") : "",
      a.result ? "Result: " + strip(a.result) : "",
    ].filter(Boolean).join("\n");
    secs.push({ label: `PYQ ${i.pyq.id} model answer`, head: `MODEL ANSWER FOR ${i.pyq.id}`, body });
  }
  const ms = i.mistakes ?? [];
  if (ms.length) secs.push({ label: `your last ${ms.length} ${ms.length === 1 ? "mistake" : "mistakes"}`, head: "STUDENT'S RECENT WRONG ANSWERS IN THIS UNIT (newest first)", body: ms.slice(0, 5).map((m, n) => `${n + 1}. ${mist(m)}`).join("\n\n") });
  if (i.unit) {
    const u = i.unit;
    const body = [
      `Unit ${u.n}: ${u.title}`,
      u.topics.length ? "Topics: " + u.topics.map((t, n) => `${n + 1}. ${strip(t)}`).join(" | ") : "",
      u.formulas.length ? "Formulas: " + u.formulas.map(strip).join(" | ") : "",
      u.hints.length ? "Hints: " + u.hints.map(strip).join(" | ") : "",
    ].filter(Boolean).join("\n");
    secs.push({ label: `Unit ${u.n} syllabus`, head: `SYLLABUS${i.courseName ? ` (${i.courseName})` : ""}`, body });
  }
  if (i.topic?.lesson) {
    const l = i.topic.lesson;
    const body = [strip(l.intro), ...l.sections.map((s) => `${s.h}: ${s.p.map(strip).join(" ")}${s.formula?.length ? " [" + s.formula.map(strip).join("; ") + "]" : ""}`)].join("\n");
    secs.push({ label: `lesson: ${i.topic.title}`, head: `LESSON TEXT: ${i.topic.title}`, body });
  } else if (i.topic) secs.push({ label: `topic: ${i.topic.title}`, head: "TOPIC", body: i.topic.title });

  const parts: string[] = [];
  const sources: string[] = [];
  let left = budget;
  for (const s of secs) {
    const head = `## ${s.head}\n`;
    const room = left - head.length - 2;
    if (room < 80) continue;
    const body = clip(s.body, room);
    parts.push(head + body);
    sources.push(s.label);
    left -= head.length + body.length + 2;
  }
  return { text: parts.join("\n\n"), sources };
}

export const SYSTEM_BASE = "You are Lochi, the study helper inside lockin., an unofficial study app for Uttarakhand Technical University B.Tech students. Explain clearly and kindly, step by step, in plain text (no markdown tables; simple maths like x^2 or a/b is fine). Keep answers short unless asked for more. Only help with studying and learning. Never invent university rules, dates, marks or exam patterns; if you do not know, say so.";

/** The system instruction with grounded context appended. */
export function systemWith(ctx: string): string {
  if (!ctx) return SYSTEM_BASE;
  return `${SYSTEM_BASE}\n\nThe student is asking from a specific place in the app. Use this context when it helps. If the question is outside it, still help, but say so briefly.\n\n${ctx}`;
}

export const mcqSchema = z.object({
  question: z.string().trim().min(5).max(600),
  options: z.array(z.string().trim().min(1).max(300)).length(4),
  answer: z.number().int().min(0).max(3),
  explanation: z.string().trim().min(1).max(900),
});
export type Mcq = z.infer<typeof mcqSchema>;

/** Parse Gemini's JSON reply (tolerating code fences) into a practice question, or null. */
export function parseMcq(text: string): Mcq | null {
  const t = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  try { const r = mcqSchema.safeParse(JSON.parse(t)); return r.success ? r.data : null; } catch { return null; }
}

export const SIMILAR_PROMPT = "Write ONE fresh multiple-choice practice question for this student, at first-year B.Tech exam level, on the topic they are working on (use the context and the conversation; do not repeat a question already shown). Reply with strict JSON only: {\"question\": string, \"options\": [4 short strings, no letter prefixes], \"answer\": index 0-3 of the correct option, \"explanation\": string explaining step by step why it is correct}. Exactly one option must be correct. Plain text, simple maths like x^2 or a/b.";
