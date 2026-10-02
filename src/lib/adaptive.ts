/** Adaptive difficulty for Practice sessions — pure logic, no I/O (the server wiring lives in quiz-session.ts).
 *
 * Every question template gets an estimated success rate without hand-tagging:
 *  (a) a prior read off a generated sample: question type (msq is hardest, then nat, then mcq), how long the working is,
 *      how many steps it takes and how many numbers the stem throws at the student;
 *  (b) refined by real data once a template has 20 or more recorded attempts across all students.
 * The next practice question then comes from the template whose predicted success for THIS student (from their last
 * 20 answers in the unit) is closest to 70%. */
import { GEN } from "@/content/gen.generated.cjs";
import type { RawQuestion } from "@/content/gen.generated.cjs";
import { fromTemplate } from "./quiz-core";
import { splitSteps } from "./steps";

export const TARGET = 0.7;
export const RECENT = 20;
export const MIN_ATTEMPTS = 20;
export type Level = "warming up" | "steady" | "challenge";
export type TemplateStat = { template: number; attempts: number; correct: number };

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));
const logit = (p: number) => { const q = clamp(p, 0.02, 0.98); return Math.log(q / (1 - q)); };
const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));

export function features(q: RawQuestion) {
  const plain = (s: string) => s.replace(/<[^>]*>/g, "");
  return {
    type: q.type,
    steps: splitSteps(q.why).length,
    whyLength: plain(q.why).length,
    numbers: (plain(q.q).match(/\d+(?:\.\d+)?/g) ?? []).length,
  };
}

/** Estimated chance an average student gets this question right, from the question alone. */
export function priorFromQuestion(q: RawQuestion): number {
  const f = features(q);
  let p = f.type === "mcq" ? 0.82 : f.type === "nat" ? 0.66 : 0.58;
  p -= Math.min(0.15, Math.max(0, f.steps - 1) * 0.04);
  p -= Math.min(0.12, Math.max(0, f.whyLength - 80) / 100 * 0.03);
  p -= Math.min(0.1, Math.max(0, f.numbers - 2) * 0.015);
  return clamp(p, 0.25, 0.92);
}

const priorCache = new Map<string, number[]>();
/** Prior success rate of every template in a unit (averaged over a few fixed seeds, cached). */
export function templatePriors(course: string, unit: number): number[] {
  const key = `${course}:${unit}`;
  const hit = priorCache.get(key);
  if (hit) return hit;
  const bank = GEN[course]?.[unit] ?? [];
  const out = bank.map((_, t) => {
    const seeds = [11, 2027, 90001];
    const ps = seeds.map((s) => fromTemplate(course, unit, t, s)).filter((q): q is RawQuestion => q !== null).map(priorFromQuestion);
    return ps.length ? ps.reduce((a, b) => a + b, 0) / ps.length : 0.7;
  });
  priorCache.set(key, out);
  return out;
}

/** Refine a prior with observed data: only once there are at least 20 attempts, and still shrunk toward the prior. */
export function refine(prior: number, stat?: { attempts: number; correct: number } | null): number {
  if (!stat || stat.attempts < MIN_ATTEMPTS) return prior;
  return clamp((stat.correct + 10 * prior) / (stat.attempts + 10), 0.05, 0.98);
}

export function difficultyTable(priors: number[], stats: TemplateStat[]): number[] {
  const by = new Map(stats.map((s) => [s.template, s]));
  return priors.map((p, t) => refine(p, by.get(t)));
}

/** Smoothed recent accuracy (newest last; only the last 20 count). Null when there is too little to go on. */
export function recentAccuracy(recent: boolean[]): number | null {
  const last = recent.slice(-RECENT);
  if (last.length < 3) return null;
  const right = last.filter(Boolean).length;
  return (right + TARGET * 4) / (last.length + 4);
}

/** Predicted chance THIS student gets a template right: shift the template's rate by how far the student's recent
 * accuracy sits from the unit's average rate (on the logit scale). */
export function predict(p: number, acc: number | null, unitMean: number): number {
  if (acc === null) return p;
  return sigmoid(logit(p) + logit(acc) - logit(unitMean));
}

const hash = (a: number, b: number) => {
  let h = Math.imul(a ^ 0x5bd1e995, 0x27d4eb2d) ^ Math.imul(b + 0x165667b1, 0x85ebca6b);
  h ^= h >>> 15; h = Math.imul(h, 0x2c1b3c6d); h ^= h >>> 12;
  return h >>> 0;
};

/** Choose the next template: closest predicted success to 70%, avoiding templates already used in this session, with a
 * seeded choice among near-equal candidates so sessions don't all look the same. Deterministic for the same inputs. */
export function chooseTemplate(o: { difficulty: number[]; recent: boolean[]; used: number[]; seed: number; index: number }): number {
  const n = o.difficulty.length;
  if (n === 0) return 0;
  const mean = o.difficulty.reduce((a, b) => a + b, 0) / n;
  const acc = recentAccuracy(o.recent);
  const used = new Set(o.used);
  const allUsed = used.size >= n;
  const score = o.difficulty.map((p, t) => Math.abs(predict(p, acc, mean) - TARGET) + (!allUsed && used.has(t) ? 1 : 0));
  const best = Math.min(...score);
  const near = score.map((s, t) => ({ s, t })).filter((x) => x.s <= best + 0.04).map((x) => x.t);
  return near[hash(o.seed, o.index) % near.length];
}

/** Which third of the unit's difficulty range a template falls in: easy = warming up, hard = challenge. */
export function levelFor(p: number, all: number[]): Level {
  if (all.length < 3) return "steady";
  const sorted = [...all].sort((a, b) => a - b);
  const lo = sorted[Math.floor(sorted.length / 3)], hi = sorted[Math.floor((2 * sorted.length) / 3)];
  if (p >= hi) return "warming up";
  if (p < lo) return "challenge";
  return "steady";
}

/** Flatten stored sessions (newest first, as the database returns them) into answers in time order, oldest first. */
export function recentFromSessions(rows: { answers: Record<string, { ok?: boolean; u?: number }> | null; unit: number; kind: string }[], unit: number): boolean[] {
  const out: boolean[] = [];
  for (const r of [...rows].reverse()) {
    const entries = Object.entries(r.answers ?? {}).map(([k, v]) => [Number(k), v] as const).sort((a, b) => a[0] - b[0]);
    for (const [, v] of entries) {
      if (!v || typeof v.ok !== "boolean") continue;
      if ((typeof v.u === "number" ? v.u : r.unit) !== unit) continue;
      out.push(v.ok);
    }
  }
  return out.slice(-RECENT);
}
