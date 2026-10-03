import { generateAt } from "@/lib/quiz-core";
import type { DailyItem, UnitRef } from "@/lib/daily";

/**
 * Sunday Quest, the pure parts. Once a week (Sunday, India time) a 12-question quest is built from the units the student
 * practised Monday–Saturday, with more questions from the units they got wrong. During the week the same function shows
 * what Sunday will cover, so "prepare" means something concrete.
 */
export const SUNDAY_COUNT = 12;
export const MAX_UNITS = 6;
export const SUNDAY_XP = { finish: 10, perCorrect: 4, bonus: 20 } as const;
export const maxSundayXp = (n = SUNDAY_COUNT) => SUNDAY_XP.finish + SUNDAY_XP.perCorrect * n + SUNDAY_XP.bonus;
/** XP the database pays (mirror of sunday_answer() in migration 0022, for previews and tests). */
export const sundayXp = (correct: number, total: number) => SUNDAY_XP.finish + correct * SUNDAY_XP.perCorrect + (correct * 5 >= total * 4 ? SUNDAY_XP.bonus : 0);

const dow = (day: string) => new Date(`${day}T00:00:00Z`).getUTCDay(); // 0 = Sunday
const shift = (day: string, n: number) => { const d = new Date(`${day}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
export const isSunday = (day: string) => dow(day) === 0;
/** The Sunday of this India week (today if it is Sunday). Weeks run Monday to Sunday. */
export const questDay = (day: string) => (isSunday(day) ? day : shift(day, 7 - dow(day)));
/** The Monday that starts the quest's week. */
export const weekMonday = (sunday: string) => shift(sunday, -6);
export const daysUntil = (day: string) => (isSunday(day) ? 0 : 7 - dow(day));
/** Midnight India time at the start of a day, as an ISO instant (for database range queries). */
export const istStart = (day: string) => `${day}T00:00:00+05:30`;

export type UnitWeek = UnitRef & { attempts: number; wrong: number };
export type PlannedUnit = UnitRef & { attempts: number; wrong: number; questions: number };

/** Answers per unit from a week's quiz sessions and daily challenges. A mock tags each answer with its own unit ("u"). */
export function weekStats(
  sessions: { course: string; unit: number; answers: Record<string, { ok?: boolean; u?: number } | null> | null }[],
  dailies: { items: { c: string; u: number }[]; answers: Record<string, { ok?: boolean } | null> | null }[],
): UnitWeek[] {
  const m = new Map<string, UnitWeek>();
  const add = (course: string, unit: number, ok: boolean) => {
    const k = `${course}:${unit}`;
    const s = m.get(k) ?? { course, unit, attempts: 0, wrong: 0 };
    s.attempts++; if (!ok) s.wrong++;
    m.set(k, s);
  };
  for (const s of sessions) for (const a of Object.values(s.answers ?? {})) if (a && typeof a === "object") add(s.course, Number.isInteger(a.u) ? (a.u as number) : s.unit, a.ok === true);
  for (const d of dailies) for (const [i, a] of Object.entries(d.answers ?? {})) { const it = d.items[Number(i)]; if (it && a) add(it.c, it.u, a.ok === true); }
  return [...m.values()];
}

/**
 * Which units Sunday covers and how many questions each gets. Studied units in the student's pool are ranked by mistakes
 * (then practice); the top MAX_UNITS each get one question and the rest are shared out by mistakes + 1. A week with no
 * practice becomes a mixed review of `fallback` units (already shuffled by the caller).
 */
export function planQuest(stats: UnitWeek[], pool: UnitRef[], fallback: UnitRef[] = [], count = SUNDAY_COUNT): { review: boolean; units: PlannedUnit[] } {
  const inPool = new Set(pool.map((u) => `${u.course}:${u.unit}`));
  const studied = stats.filter((s) => s.attempts > 0 && inPool.has(`${s.course}:${s.unit}`))
    .sort((a, b) => b.wrong - a.wrong || b.attempts - a.attempts || a.course.localeCompare(b.course) || a.unit - b.unit)
    .slice(0, MAX_UNITS);
  const review = studied.length === 0;
  const base: UnitWeek[] = review ? fallback.filter((u) => inPool.has(`${u.course}:${u.unit}`)).slice(0, MAX_UNITS).map((u) => ({ ...u, attempts: 0, wrong: 0 })) : studied;
  if (!base.length) return { review, units: [] };
  const units: PlannedUnit[] = base.map((u) => ({ ...u, questions: 1 }));
  let left = count - units.length;
  const weight = units.map((u) => u.wrong + 1);
  const total = weight.reduce((a, b) => a + b, 0);
  const share = weight.map((w) => (w / total) * left);
  share.forEach((x, i) => { const n = Math.floor(x); units[i].questions += n; left -= n; });
  // hand out what rounding left over to the largest remainders, so the total is exactly `count`
  share.map((x, i) => ({ i, r: x - Math.floor(x) })).sort((a, b) => b.r - a.r || a.i - b.i).slice(0, Math.max(0, left)).forEach(({ i }) => units[i].questions++);
  return { review, units };
}

const rng = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
/** The concrete questions for a plan: no repeated question text, deterministic for a seed, mixed order. */
export function questItems(units: PlannedUnit[], seed: number): DailyItem[] {
  const rand = rng(seed);
  const items: DailyItem[] = [], texts = new Set<string>();
  for (const u of units) {
    for (let n = 0; n < u.questions; n++) {
      for (let attempt = 0; attempt < 15; attempt++) {
        const g = generateAt(u.course, u.unit, (rand() * 4294967296) | 0, 0);
        if (!g) break;
        if (texts.has(g.q.q) && attempt < 14) continue;
        texts.add(g.q.q);
        items.push({ c: u.course, u: u.unit, t: g.t, s: g.s });
        break;
      }
    }
  }
  for (let i = items.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [items[i], items[j]] = [items[j], items[i]]; }
  return items;
}

/** Consecutive completed Sundays ending with the latest one (this Sunday counts once it is done; an open one doesn't break it). */
export function sundayStreak(completed: string[], today: string): number {
  const done = new Set(completed);
  let d = isSunday(today) && done.has(today) ? today : shift(questDay(today), -7);
  let n = 0;
  while (done.has(d)) { n++; d = shift(d, -7); }
  return n;
}
