/** Pure helpers for the home scene. Everything here is derived from numbers the dashboard already loads. */

/** `YYYY-MM-DD` shifted by `delta` days (calendar arithmetic in UTC, so no timezone or DST surprises). */
export function shiftDay(day: string, delta: number): string {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + delta)).toISOString().slice(0, 10);
}

/** XP per day for the `n` days ending on `today`, oldest first. Days with no record count as 0. */
export function lastDays(today: string, days: Record<string, number>, n = 7): number[] {
  return Array.from({ length: n }, (_, i) => Math.max(0, Math.floor(days[shiftDay(today, i - (n - 1))] ?? 0)));
}

/** Short weekday names for the same window (Mon, Tue ...). */
export function dayNames(today: string, n = 7): string[] {
  return Array.from({ length: n }, (_, i) => new Date(`${shiftDay(today, i - (n - 1))}T00:00:00Z`).toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" }));
}

/** How many of the `slots` orbs are lit: today's share of the daily goal, rounded down (full only when the goal is met). */
export function litOrbs(todayXp: number, goal: number, slots = 10): number {
  if (goal <= 0) return todayXp > 0 ? slots : 0;
  return Math.min(slots, Math.floor((Math.max(0, todayXp) / goal) * slots));
}

/** Tower block heights in 0..1 relative to the busiest day. A day with XP always shows at least a sliver. */
export function towerHeights(xp: number[]): number[] {
  const max = Math.max(0, ...xp);
  return xp.map((v) => (max === 0 ? 0 : v === 0 ? 0 : Math.max(0.08, v / max)));
}

interface LabLike { id: string; title: string; where: readonly (readonly [string, number])[] }

/** A lab for the student's weakest unit if there is one, else any lab in the same subject, else the first visible lab. */
export function pickLab<T extends LabLike>(labs: readonly T[], weak: { course: string; unit: number } | null): T | null {
  if (labs.length === 0) return null;
  if (weak) {
    const exact = labs.find((l) => l.where.some(([c, u]) => c === weak.course && u === weak.unit));
    if (exact) return exact;
    const sameSubject = labs.find((l) => l.where.some(([c]) => c === weak.course));
    if (sameSubject) return sameSubject;
  }
  return labs[0];
}
