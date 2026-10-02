/** Pure logic for the 3-hour UTU-style paper simulator: building a seeded paper, rubrics, self-marking and grading.
 *  No content imports here, so client components can use it without bundling the PYQ bank. */
import { z } from "zod";
import type { ModelAnswer } from "@/content/answers/types";

export const PAPER = { maxMarks: 100, minutes: 180, questions: 5, partsPerQ: 3, attemptPerQ: 2, partMarks: 10 } as const;
export const PAPER_MS = PAPER.minutes * 60_000;
export const LETTERS = ["a", "b", "c"] as const;
export type PaperMode = "practice" | "exam";
export const PAPER_COURSES = [
  "AHT-001", "AHT-002", "EET-001", "ECT-001", "MET-001",
  "AHT-003", "AHT-005", "CST-001",
  "BCA-001", "BCA-002", "BCA-003", "BCA-004", "BCA-005", "BCA-006", "BCA-007", "BCA-008", "BCA-009", "BCA-010", "BCA-011",
] as const;

/** "1a" … "5c": question number (1-based) and part letter. */
export const partKey = (q: number, p: number) => `${q + 1}${LETTERS[p]}`;
export const PART_KEYS: string[] = Array.from({ length: PAPER.questions }, (_, q) => LETTERS.map((_, p) => partKey(q, p))).flat();
export const isPartKey = (k: string) => PART_KEYS.includes(k);

/** Small deterministic PRNG (mulberry32). */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type PoolItem = { id: string; kind: "theory" | "numerical"; repeated: number | null };
/** Most-repeated questions are more likely: weight = 1 + times asked. */
export const weight = (q: PoolItem) => 1 + Math.max(0, q.repeated ?? 0);

function weightedPick(items: PoolItem[], r: () => number): PoolItem {
  const total = items.reduce((s, q) => s + weight(q), 0);
  let x = r() * total;
  for (const q of items) { x -= weight(q); if (x < 0) return q; }
  return items[items.length - 1];
}

/** Picks `n` different PYQs from one unit, weighted by repeat count, mixing theory and numericals when the unit has both. */
export function pickParts(pool: PoolItem[], seed: number, unit: number, n: number = PAPER.partsPerQ): string[] {
  const uniq = pool.filter((q, i) => pool.findIndex((x) => x.id === q.id) === i);
  const r = rng((Math.imul(seed >>> 0, 31) + unit * 7919) >>> 0);
  const picked: PoolItem[] = [];
  let left = [...uniq];
  while (picked.length < n && left.length) {
    const q = weightedPick(left, r);
    picked.push(q);
    left = left.filter((x) => x.id !== q.id);
  }
  // Mix: if every pick is the same kind but the unit has the other kind too, swap the least-weighted pick for one.
  const kinds = new Set(picked.map((q) => q.kind));
  if (picked.length >= 2 && kinds.size === 1) {
    const other = left.filter((q) => !kinds.has(q.kind));
    if (other.length) {
      let low = picked.length - 1;
      for (let i = picked.length - 1; i >= 0; i--) if (weight(picked[i]) < weight(picked[low])) low = i;
      picked[low] = weightedPick(other, r);
    }
  }
  return picked.map((q) => q.id);
}

/** The whole paper: one question per unit (the first five units), three parts each. Same seed → same paper. */
export function buildPaper(units: { n: number; pyqs: PoolItem[] }[], seed: number): string[][] {
  return [...units].sort((a, b) => a.n - b.n).slice(0, PAPER.questions).map((u) => pickParts(u.pyqs, seed, u.n));
}

export const newSeed = () => 1 + Math.floor(Math.random() * 2_000_000_000);

// ------------------------------------------------------------------ rubrics
export type RubricPoint = { point: string; marks: number };

const half = (x: number) => Math.round(x * 2) / 2;

/** Rescales a model answer's rubric (written for its own marks) to a 10-mark part, in half marks, adding up exactly. */
export function scaleRubric(rubric: RubricPoint[], marks: number, to: number = PAPER.partMarks): RubricPoint[] {
  const clean = rubric.filter((r) => r && typeof r.point === "string" && Number.isFinite(r.marks) && r.marks > 0);
  const sum = clean.reduce((s, r) => s + r.marks, 0);
  const base = marks > 0 && Math.abs(sum - marks) < 1e-6 ? marks : sum;
  if (!clean.length || base <= 0) return [];
  const out = clean.map((r) => ({ point: r.point, marks: Math.max(0.5, half((r.marks * to) / base)) }));
  let diff = half(to - out.reduce((s, r) => s + r.marks, 0));
  // put any rounding difference on the biggest points first, never below half a mark
  const order = out.map((_, i) => i).sort((a, b) => out[b].marks - out[a].marks);
  for (let k = 0; diff !== 0 && k < order.length * 20; k++) {
    const i = order[k % order.length];
    const step = diff > 0 ? 0.5 : -0.5;
    if (out[i].marks + step >= 0.5) { out[i].marks += step; diff = half(diff - step); }
  }
  return out;
}

/** A general UTU examiner's guide, used when a part has no model answer yet. Adds up to 10. */
export function genericRubric(kind: "theory" | "numerical"): RubricPoint[] {
  return kind === "numerical"
    ? [
        { point: "Writes the given data and what is to be found", marks: 1 },
        { point: "States the correct formula or principle", marks: 2 },
        { point: "Correct substitution and working, with units at each step", marks: 4 },
        { point: "Correct final answer with units, clearly marked", marks: 2 },
        { point: "Neat sketch or diagram where one helps", marks: 1 },
      ]
    : [
        { point: "Correct definition or statement of the idea", marks: 2 },
        { point: "Main explanation or derivation, step by step", marks: 4 },
        { point: "Neat, labelled diagram or a worked example", marks: 2 },
        { point: "Key formula, result or conclusion written clearly", marks: 2 },
      ];
}

export type PartView = {
  key: string; id: string; kind: "theory" | "numerical"; title: string; lines: string[]; repeated: number | null;
  /** Only sent once the paper is submitted. */
  review?: { rubric: RubricPoint[]; model: ModelAnswer | null };
};
export type QuestionView = { n: number; unitTitle: string; parts: PartView[] };

// ------------------------------------------------------------------ self-marking
export const selfMarkSchema = z.object({ t: z.array(z.number().int().min(0).max(30)).max(30) });
export type SelfMark = z.infer<typeof selfMarkSchema>;
export const selfMarksSchema = z.record(z.string().refine(isPartKey), selfMarkSchema);
export type SelfMarks = Record<string, SelfMark>;

/** Marks for one part from the ticked rubric points: summed, capped at the part's marks. */
export function partScore(rubric: RubricPoint[], mark: SelfMark | undefined): number {
  if (!mark) return 0;
  const seen = new Set<number>();
  let s = 0;
  for (const i of mark.t) if (!seen.has(i) && rubric[i]) { seen.add(i); s += rubric[i].marks; }
  return Math.min(PAPER.partMarks, half(s));
}

/** UTU counts two parts per question: the best two. */
export function questionScore(parts: number[]): number {
  return [...parts].sort((a, b) => b - a).slice(0, PAPER.attemptPerQ).reduce((s, x) => s + x, 0);
}

/** Total out of 100. `rubrics[key]` is the rubric of that part. */
export function paperTotal(rubrics: Record<string, RubricPoint[]>, marks: SelfMarks): { total: number; perQuestion: number[] } {
  const perQuestion = Array.from({ length: PAPER.questions }, (_, q) => questionScore(LETTERS.map((_, p) => {
    const k = partKey(q, p);
    return partScore(rubrics[k] ?? [], marks[k]);
  })));
  return { total: Math.min(PAPER.maxMarks, half(perQuestion.reduce((s, x) => s + x, 0))), perQuestion };
}

/** A rough guide to UTU's 10-point letter grades. */
export function gradeBand(total: number): { grade: string; label: string } {
  if (total >= 90) return { grade: "O", label: "Outstanding" };
  if (total >= 80) return { grade: "A+", label: "Excellent" };
  if (total >= 70) return { grade: "A", label: "Very good" };
  if (total >= 60) return { grade: "B+", label: "Good" };
  if (total >= 50) return { grade: "B", label: "Above average" };
  if (total >= 45) return { grade: "C", label: "Average" };
  if (total >= 40) return { grade: "P", label: "Pass" };
  return { grade: "F", label: "Below pass. Keep going." };
}

/** Units (1-based question numbers) scoring under half of their 20 marks, weakest first. */
export function weakUnits(perQuestion: number[]): number[] {
  const max = PAPER.partMarks * PAPER.attemptPerQ;
  return perQuestion.map((s, i) => ({ s, u: i + 1 })).filter((x) => x.s < max / 2).sort((a, b) => a.s - b.s || a.u - b.u).map((x) => x.u);
}

// ------------------------------------------------------------------ time
export type Clock = { ends_at: string; paused_at: string | null; submitted_at: string | null };

/** Milliseconds left on the paper (frozen while paused), never below 0. */
export function remainingMs(c: Clock, now: number): number {
  const end = new Date(c.ends_at).getTime();
  const at = c.paused_at ? new Date(c.paused_at).getTime() : now;
  return Math.max(0, end - at);
}
/** True once the time is up on a paper that isn't paused or submitted. */
export const timeUp = (c: Clock, now: number) => !c.submitted_at && !c.paused_at && remainingMs(c, now) <= 0;

export function formatClock(ms: number): string {
  const t = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = t % 60;
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** Attempted toggles: only real part keys, no duplicates, at most two per question. */
export function cleanChosen(keys: string[]): string[] {
  const out: string[] = [];
  for (const k of keys) {
    if (!isPartKey(k) || out.includes(k)) continue;
    if (out.filter((x) => x[0] === k[0]).length >= PAPER.attemptPerQ) continue;
    out.push(k);
  }
  return out;
}

// ------------------------------------------------------------------ photo check (AI examiner)
export const checkRequestSchema = z.object({
  course: z.enum(PAPER_COURSES),
  id: z.string().regex(/^Q\d{1,2}\.\d{1,2}$/),
  part: z.string().refine(isPartKey).optional(),
  image: z.string().min(100).max(2_200_000),
});

export const checkResultSchema = z.object({
  awarded: z.array(z.object({
    point: z.string().max(400).catch(""),
    marks: z.coerce.number().catch(0),
    max: z.coerce.number().catch(0),
    comment: z.string().max(600).catch(""),
  })).max(30),
  total: z.coerce.number().catch(0),
  max: z.coerce.number().catch(0),
  feedback: z.array(z.string().max(600)).max(12).catch([]),
  legible: z.boolean().catch(true),
});
export type CheckResult = z.infer<typeof checkResultSchema>;

/** Trusts the examiner's marks only within the rubric: each awarded point is matched to a rubric point (by order) and
 *  clamped to that point's marks; the total is recomputed and capped. Points the model invented are dropped. */
export function clampCheck(rubric: RubricPoint[], raw: CheckResult): CheckResult {
  const awarded = rubric.map((r, i) => {
    const a = raw.awarded.find((x) => norm(x.point) === norm(r.point)) ?? raw.awarded[i];
    const m = a && Number.isFinite(a.marks) ? half(Math.min(r.marks, Math.max(0, a.marks))) : 0;
    return { point: r.point, marks: raw.legible ? m : 0, max: r.marks, comment: (a?.comment ?? "").trim() };
  });
  const max = rubric.reduce((s, r) => s + r.marks, 0);
  const total = Math.min(max, half(awarded.reduce((s, a) => s + a.marks, 0)));
  return { awarded, total, max, feedback: raw.feedback.map((f) => f.trim()).filter(Boolean).slice(0, 6), legible: raw.legible };
}
const norm = (s: string) => s.toLowerCase().replace(/<[^>]*>/g, "").replace(/[^a-z0-9]+/g, " ").trim();

/** Pulls a JSON object out of a model reply that may be wrapped in ```json fences. */
export function extractJson(text: string): unknown {
  const t = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  try { return JSON.parse(t); } catch { /* fall through */ }
  const a = t.indexOf("{"), b = t.lastIndexOf("}");
  if (a >= 0 && b > a) { try { return JSON.parse(t.slice(a, b + 1)); } catch { /* not JSON */ } }
  return null;
}

/** Strips a data: URL prefix and checks the image type. */
export function parseImage(s: string): { mime: "image/jpeg" | "image/png" | "image/webp"; data: string } | null {
  const m = /^data:image\/(?:jpeg|png|webp);base64,([\s\S]*)$/.exec(s);
  const data = m ? m[1] : s;
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(data)) return null;
  const bytes = Math.floor((data.length * 3) / 4);
  if (bytes > 1_600_000 || bytes < 64) return null;
  // trust the file's own magic bytes, not the label
  let head = "";
  try { head = atob(data.slice(0, 24)); } catch { return null; }
  const mime = head.startsWith("\xff\xd8\xff") ? "image/jpeg" : head.startsWith("\x89PNG") ? "image/png"
    : head.startsWith("RIFF") && head.slice(8, 12) === "WEBP" ? "image/webp" : null;
  return mime ? { mime, data } : null;
}
