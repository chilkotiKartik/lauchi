import { generateAt } from "@/lib/quiz-core";

/** Pure pieces of the daily challenge: the same student on the same day always gets the same five questions. */
export const DAILY_COUNT = 5;
export const WEAK_SLOTS = 2;
export type DailyItem = { c: string; u: number; t: number; s: number };
export type UnitRef = { course: string; unit: number };

/** FNV-1a hash of "userId:day" as a signed 32-bit integer. */
export function dailySeed(userId: string, day: string): number {
  let h = 0x811c9dc5;
  const s = `${userId}:${day}`;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return h | 0;
}
const rng = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

/** Up to `count` questions: the first slots come from the student's weakest units (`weak`, weakest first), the rest from
 * a seeded shuffle of every unit they can see (`pool`). No two questions share a unit while there are enough units. */
export function chooseItems(o: { seed: number; pool: UnitRef[]; weak?: UnitRef[]; count?: number }): DailyItem[] {
  const count = o.count ?? DAILY_COUNT;
  const rand = rng(o.seed);
  const key = (u: UnitRef) => `${u.course}:${u.unit}`;
  const inPool = new Set(o.pool.map(key));
  const order: UnitRef[] = [];
  const seen = new Set<string>();
  for (const w of (o.weak ?? []).filter((x) => inPool.has(key(x))).slice(0, WEAK_SLOTS)) if (!seen.has(key(w))) { seen.add(key(w)); order.push(w); }
  const rest = o.pool.filter((u) => !seen.has(key(u)));
  for (let i = rest.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [rest[i], rest[j]] = [rest[j], rest[i]]; }
  order.push(...rest);
  if (order.length === 0) return [];
  const items: DailyItem[] = [], texts = new Set<string>();
  for (let n = 0; n < count; n++) {
    const u = order[n % order.length];
    for (let attempt = 0; attempt < 12; attempt++) {
      const g = generateAt(u.course, u.unit, (rand() * 4294967296) | 0, 0);
      if (!g) break;
      if (texts.has(g.q.q) && attempt < 11) continue;
      texts.add(g.q.q);
      items.push({ c: u.course, u: u.unit, t: g.t, s: g.s });
      break;
    }
  }
  return items;
}

export type DayCell = { day: string; done: boolean; score: number | null; today: boolean };
/** The last `days` India days oldest first, marking the ones with a completed challenge. */
export function historyStrip(rows: { day: string; score: number | null; completed_at: string | null }[], daysList: string[], today: string): DayCell[] {
  const by = new Map(rows.filter((r) => r.completed_at).map((r) => [r.day, r.score]));
  return daysList.map((day) => ({ day, done: by.has(day), score: by.get(day) ?? null, today: day === today }));
}
