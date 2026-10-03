/**
 * Per-subject progress for the dashboard cards and the subject level path, computed only from the student's real
 * data: topics marked done, practice-quiz results per unit, and finished 3D labs.
 */
export type UnitState = "new" | "started" | "weak" | "ok" | "strong";
export type UnitProgress = { n: number; title: string; topics: number; topicsDone: number; pct: number | null; attempts: number; state: UnitState; stars: 0 | 1 | 2 | 3 };
export type SubjectProgress = { code: string; name: string; short: string; credits: number; pct: number; units: UnitProgress[]; labs: number };

type CourseIn = { code: string; name: string; short: string; credits: number; units: { n: number; title: string; topics: string[] }[] };
type StatIn = { course: string; unit: number; pct: number; attempts: number };

/** Stars for a unit's practice accuracy: 60% → 1, 75% → 2, 90% → 3 (the same bars the quiz results use). */
export const starsFor = (pct: number | null): 0 | 1 | 2 | 3 => (pct === null ? 0 : pct >= 90 ? 3 : pct >= 75 ? 2 : pct >= 60 ? 1 : 0);

/** A unit's colour on the dashboard: tested units by accuracy, otherwise whether any topic was read. */
export function unitState(topicsDone: number, pct: number | null, attempts: number): UnitState {
  if (attempts > 0 && pct !== null) return pct >= 75 ? "strong" : pct >= 60 ? "ok" : "weak";
  return topicsDone > 0 ? "started" : "new";
}

export function subjectProgress(c: CourseIn, done: { has: (key: string) => boolean }, stats: StatIn[], labCount: number): SubjectProgress {
  const units = c.units.map((u) => {
    const topicsDone = u.topics.filter((_, i) => done.has(`${c.code}:${u.n}:${i + 1}`)).length;
    const st = stats.find((s) => s.course === c.code && s.unit === u.n);
    const pct = st && st.attempts > 0 ? st.pct : null;
    return { n: u.n, title: u.title, topics: u.topics.length, topicsDone, pct, attempts: st?.attempts ?? 0, state: unitState(topicsDone, pct, st?.attempts ?? 0), stars: starsFor(pct) };
  });
  const total = units.reduce((a, u) => a + u.topics, 0);
  const read = units.reduce((a, u) => a + u.topicsDone, 0);
  return { code: c.code, name: c.name, short: c.short, credits: c.credits, pct: total ? Math.round((100 * read) / total) : 0, units, labs: labCount };
}

/** Streak milestones worth celebrating, and the next one to aim for. */
export const MILESTONES = [3, 7, 14, 30, 50, 100, 200, 365];
export const nextMilestone = (streak: number) => MILESTONES.find((m) => m > streak) ?? streak + 100;

/** Today's streak status, Duolingo-style: done for today, still to do, or at risk late in the evening. */
export function streakMood(todayXp: number, hour: number): "done" | "todo" | "risk" {
  if (todayXp > 0) return "done";
  return hour >= 20 ? "risk" : "todo";
}

/** A unit's chest opens once its practice accuracy reaches 60% (one star). */
export const CHEST_PCT = 60;
export const CHEST_XP = 20;
export const chestReady = (pct: number | null) => pct !== null && pct >= CHEST_PCT;
