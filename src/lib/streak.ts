export type DayKey = string; // YYYY-MM-DD in the student's own timezone

export function dayKey(date: Date, timeZone: string): DayKey {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

function shift(day: DayKey, by: number): DayKey {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + by);
  return d.toISOString().slice(0, 10);
}

/** Consecutive active days ending today, or ending yesterday if today has no activity yet. */
export function currentStreak(activeDays: Iterable<DayKey>, today: DayKey): number {
  const set = new Set(activeDays);
  let cursor = set.has(today) ? today : shift(today, -1);
  let n = 0;
  while (set.has(cursor)) { n++; cursor = shift(cursor, -1); }
  return n;
}

export const lastDays = (today: DayKey, count: number): DayKey[] =>
  Array.from({ length: count }, (_, i) => shift(today, i - (count - 1)));

export const FREEZE_EVERY = 7;
export const FREEZE_MAX = 2;

/** Mirror of the SQL `streak_calc` rule (the database is the source of truth; this is for tests and previews).
 * Walk the days before `today`: an active day adds 1 to the run and every 7th run day banks a freeze (max 2); a missed day
 * spends a banked freeze when the run is alive, otherwise the run resets. Today never costs a freeze. `startBanked` is the
 * number of freezes already banked when the first day of `activeDays` is reached. */
export function streakWithFreezes(activeDays: Iterable<DayKey>, today: DayKey, startBanked = 0): { streak: number; freezes: number; frozen: DayKey[] } {
  const set = new Set(activeDays);
  const first = [...set].filter((d) => d < today).sort()[0];
  let run = 0, banked = Math.min(FREEZE_MAX, Math.max(0, startBanked));
  const frozen: DayKey[] = [];
  if (first) {
    for (let d = first; d < today; d = shift(d, 1)) {
      if (set.has(d)) { run++; if (run % FREEZE_EVERY === 0) banked = Math.min(FREEZE_MAX, banked + 1); }
      else if (run > 0 && banked > 0) { banked--; frozen.push(d); }
      else run = 0;
    }
  }
  const todayOn = set.has(today);
  return {
    streak: run + (todayOn ? 1 : 0),
    freezes: Math.min(FREEZE_MAX, banked + (todayOn && (run + 1) % FREEZE_EVERY === 0 ? 1 : 0)),
    frozen,
  };
}

/** Monday of the week containing `day` (YYYY-MM-DD, any calendar day). */
export function weekStart(day: DayKey): DayKey {
  const dow = new Date(`${day}T00:00:00Z`).getUTCDay(); // 0 = Sunday
  return shift(day, -((dow + 6) % 7));
}
export const addDays = shift;
