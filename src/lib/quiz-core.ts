import { GEN } from "@/content/gen.generated.cjs";
import type { RawQuestion } from "@/content/gen.generated.cjs";

export type PublicQuestion = { type: "mcq" | "nat" | "msq"; q: string; o?: string[] };
export type Answer = number | number[] | string;

const mulberry32 = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

/** Templates call Math.random directly; run each one with a seeded generator, synchronously, then restore it. */
function withSeed<T>(seed: number, fn: () => T, skip = 0): T {
  const original = Math.random;
  const rand = mulberry32(seed);
  // Advance the generator here, not with a bare `Math.random();` in the caller: the production minifier treats that as
  // dead code and drops it, which made rebuilt questions differ from the ones that were shown.
  for (let i = 0; i < skip; i++) rand();
  Math.random = rand;
  try { return fn(); } finally { Math.random = original; }
}

export const hasBank = (course: string, unit: number) => Boolean(GEN[course]?.[unit]?.length);
export const bankSize = (course: string, unit: number) => GEN[course]?.[unit]?.length ?? 0;
export const courseUnits = (course: string): number[] => Object.keys(GEN[course] ?? {}).map(Number).sort((a, b) => a - b);

export type Generated = { q: RawQuestion; t: number; s: number };
/** Question `index` of a session is a pure function of (course, unit, seed, index). Also says which template made it (`t`)
 * and the effective seed it ran with (`s`), so `fromTemplate(course, unit, t, s)` rebuilds exactly the same question. */
export function generateAt(course: string, unit: number, seed: number, index: number): Generated | null {
  const bank = GEN[course]?.[unit];
  if (!bank?.length) return null;
  const earlier = new Set<string>();
  for (let i = 0; i <= index; i++) {
    for (let attempt = 0; attempt < 25; attempt++) {
      const s = (seed ^ Math.imul(i + 1, 0x9e3779b1) ^ Math.imul(attempt, 0x85ebca6b)) | 0;
      const out = withSeed(s, () => { const t = Math.floor(Math.random() * bank.length); return { q: bank[t](), t }; });
      if (!earlier.has(out.q.q) || attempt === 24) {
        earlier.add(out.q.q);
        if (i === index) return { ...out, s };
        break;
      }
    }
  }
  return null;
}
export function generate(course: string, unit: number, seed: number, index: number): RawQuestion | null {
  return generateAt(course, unit, seed, index)?.q ?? null;
}
/** One question from a chosen template. The first draw is skipped (it is the template pick in `generateAt`), so a
 * (template, seed) pair taken from `generateAt` reproduces that question exactly. */
export function fromTemplate(course: string, unit: number, t: number, s: number): RawQuestion | null {
  const f = GEN[course]?.[unit]?.[t];
  if (!f) return null;
  return withSeed(s, f, 1);
}
/** The effective seed for question `index` of an adaptive (template-picked) practice session. */
export const pickSeed = (seed: number, index: number) => (seed ^ Math.imul(index + 1, 0x9e3779b1)) | 0;

export const toPublic = (q: RawQuestion): PublicQuestion => ({ type: q.type, q: q.q, ...(q.o ? { o: q.o } : {}) });

export function grade(q: RawQuestion, r: Answer | null | undefined): boolean {
  if (r == null) return false;
  if (q.type === "mcq") return typeof r === "number" && r === q.a;
  if (q.type === "msq") return Array.isArray(r) && [...r].sort().join() === [...(q.a as number[])].sort().join();
  const v = parseFloat(String(r).replace("−", "-"));
  const a = q.a as number;
  return !Number.isNaN(v) && Math.abs(v - a) < Math.max(0.011, Math.abs(a) * 0.005);
}

/** A typed numeric answer: digits with an optional sign, decimal point or exponent ("−" accepted as minus). Letters are refused. */
export const isNumberAnswer = (t: string) => /^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(t.trim().replace("−", "-"));

export const newSeed = () => crypto.getRandomValues(new Uint32Array(1))[0] | 0;

type AnswerRow = { a?: unknown; ok?: boolean; t?: number; s?: number; u?: number };
export type SessionLike = { kind: string; course: string; unit: number; seed: number; picks?: Record<string, number> | null; answers?: Record<string, AnswerRow> | null };
/** Which unit question `i` belongs to: a mock cycles through every unit of the subject; other sessions stay in one unit. */
export function sessionUnit(s: SessionLike, i: number): number {
  if (s.kind !== "mock") return s.unit;
  const u = courseUnits(s.course);
  return u.length ? u[i % u.length] : s.unit;
}
const isInt = (x: unknown): x is number => typeof x === "number" && Number.isInteger(x);
/** The template an adaptive practice session chose for question `i` (question 0 is always the seeded warm-up). */
export function sessionPick(s: SessionLike, i: number): number | null {
  if (s.kind !== "practice" || i === 0) return null;
  const p = s.picks?.[String(i)];
  return isInt(p) && p >= 0 ? p : null;
}
/** True when question `i` of a practice session is still waiting for its adaptive template pick. */
export const needsPick = (s: SessionLike, i: number) => s.kind === "practice" && i > 0 && sessionPick(s, i) === null && !s.answers?.[String(i)];
/** Rebuild question `i` of a session. An answered question carries its own (template, seed, unit) tag, so it is rebuilt
 * from that; an unanswered one comes from the adaptive pick (practice) or the seed alone (everything else). */
export function sessionGenerated(s: SessionLike, i: number): Generated | null {
  const tag = s.answers?.[String(i)];
  if (tag && isInt(tag.t) && isInt(tag.s)) {
    const unit = isInt(tag.u) ? tag.u : sessionUnit(s, i);
    const q = fromTemplate(s.course, unit, tag.t, tag.s);
    if (q) return { q, t: tag.t, s: tag.s };
  }
  if (s.kind === "mock") {
    const u = courseUnits(s.course);
    return u.length ? generateAt(s.course, u[i % u.length], s.seed, Math.floor(i / u.length)) : null;
  }
  const t = sessionPick(s, i);
  if (t !== null) {
    const sd = pickSeed(s.seed, i);
    const q = fromTemplate(s.course, s.unit, t, sd);
    if (q) return { q, t, s: sd };
  }
  return generateAt(s.course, s.unit, s.seed, i);
}
export function sessionQuestion(s: SessionLike, i: number): RawQuestion | null {
  return sessionGenerated(s, i)?.q ?? null;
}
/** Human-readable correct answer for a question. */
export const rightAnswer = (q: RawQuestion) => q.type === "nat" ? String(q.a) : q.type === "mcq" ? q.o![q.a as number] : (q.a as number[]).map((i) => q.o![i]).join("; ");
/** The student's stored answer, as text. */
export function givenAnswer(q: RawQuestion, a: unknown): string {
  if (a == null) return "No answer";
  if (q.type === "nat") return String(a);
  if (q.type === "mcq") return typeof a === "number" ? (q.o![a] ?? "—") : "—";
  return Array.isArray(a) ? a.map((i) => q.o![i as number] ?? "—").join("; ") : "—";
}

export const MOCK_MINUTES = 30;
