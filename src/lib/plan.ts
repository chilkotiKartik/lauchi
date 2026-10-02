/** Study-plan engine: pure functions, no I/O. Estimates are stated in the UI, not hidden. */

export type PlanUnit = {
  course: string; short: string; unit: number; title: string;
  topics: number; done: number;
  /** 0..1 quiz accuracy for this unit, or null when the student has not taken a quiz on it yet. */
  accuracy: number | null;
};
export type PlanItem = { course: string; short: string; unit: number; title: string; minutes: number; kind: "learn" | "revise" };
export type PlanDay = { date: string; items: PlanItem[]; minutes: number };

/** Minutes we budget per topic still to learn, and per revision pass over a unit. */
export const MIN_PER_TOPIC = 30;
export const REVISE_MIN = 45;

/** Higher = needs attention sooner: unfinished units first, weak or untested units before strong ones. */
export function priority(u: PlanUnit) {
  const remaining = u.topics ? 1 - u.done / u.topics : 0;
  const weak = u.accuracy === null ? 0.5 : 1 - u.accuracy;
  return remaining * 2 + weak;
}

export const addDays = (iso: string, n: number) => {
  const d = new Date(iso + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
export const daysBetween = (from: string, to: string) => Math.round((Date.parse(to + "T00:00:00Z") - Date.parse(from + "T00:00:00Z")) / 86_400_000);

/**
 * Spread the remaining work from `today` up to the day before the exam, `hours` per day.
 * Learning blocks go to the highest-priority units first; the last days (up to 20% of the time) are revision of the weakest units.
 * Never plans past the exam date, and returns `overflow` minutes when the time is not enough.
 */
export function buildPlan(units: PlanUnit[], today: string, exam: string, hours: number) {
  const span = daysBetween(today, exam);
  if (span <= 0) return { days: [] as PlanDay[], overflow: 0, totalMinutes: 0, span };
  const perDay = Math.max(30, Math.round(hours * 60));
  const days: PlanDay[] = Array.from({ length: span }, (_, i) => ({ date: addDays(today, i), items: [], minutes: 0 }));

  const revisionDays = span >= 5 ? Math.max(1, Math.floor(span * 0.2)) : 0;
  const learnDays = span - revisionDays;
  const ranked = [...units].sort((a, b) => priority(b) - priority(a) || a.course.localeCompare(b.course) || a.unit - b.unit);

  let d = 0, overflow = 0, total = 0;
  const put = (day: number, item: PlanItem) => { days[day].items.push(item); days[day].minutes += item.minutes; total += item.minutes; };

  for (const u of ranked) {
    let left = Math.max(0, u.topics - u.done) * MIN_PER_TOPIC;
    while (left > 0) {
      if (d >= learnDays) { overflow += left; break; }
      const room = perDay - days[d].minutes;
      if (room < 15) { d++; continue; }
      const m = Math.min(room, left);
      const last = days[d].items[days[d].items.length - 1];
      if (last && last.course === u.course && last.unit === u.unit && last.kind === "learn") { last.minutes += m; days[d].minutes += m; total += m; }
      else put(d, { course: u.course, short: u.short, unit: u.unit, title: u.title, minutes: m, kind: "learn" });
      left -= m;
    }
  }
  // Revision: weakest units first, one block each, filling the last days.
  let r = learnDays;
  for (const u of ranked.filter((x) => x.accuracy === null || x.accuracy < 0.8).slice(0, revisionDays * Math.max(1, Math.floor(perDay / REVISE_MIN)))) {
    while (r < span && perDay - days[r].minutes < REVISE_MIN) r++;
    if (r >= span) break;
    put(r, { course: u.course, short: u.short, unit: u.unit, title: u.title, minutes: REVISE_MIN, kind: "revise" });
  }
  return { days, overflow, totalMinutes: total, span };
}
