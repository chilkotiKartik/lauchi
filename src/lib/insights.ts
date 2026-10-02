/** Pure calculations over a student's own quiz sessions and XP events. No I/O, so they are unit-tested. */

export type SessionRow = { course: string; unit: number; kind: "practice" | "topic" | "mock" | "assignment"; total: number; correct: number | null; submitted_at: string | null };
export type EventRow = { kind: string; xp: number; created_at: string };

export type UnitStat = { course: string; unit: number; correct: number; total: number; attempts: number; pct: number };

export function unitStats(sessions: SessionRow[]): UnitStat[] {
  const m = new Map<string, UnitStat>();
  for (const s of sessions) {
    if (!s.submitted_at || s.kind === "mock" || s.correct === null) continue; // a mock is credited to its units by mockUnitStats
    const k = `${s.course}:${s.unit}`;
    const u = m.get(k) ?? { course: s.course, unit: s.unit, correct: 0, total: 0, attempts: 0, pct: 0 };
    u.correct += s.correct; u.total += s.total; u.attempts++;
    u.pct = Math.round((u.correct / u.total) * 100);
    m.set(k, u);
  }
  return [...m.values()];
}
export type MockRow = { course: string; total: number; answers: Record<string, { ok?: boolean } | undefined> };

/** A mock cycles through every unit of a subject, so each answered question is credited to the unit it came from. */
export function mockUnitStats(mocks: MockRow[], unitAt: (course: string, i: number) => number): UnitStat[] {
  const m = new Map<string, UnitStat & { seen: Set<number> }>();
  mocks.forEach((mk, mi) => {
    for (let i = 0; i < mk.total; i++) {
      const a = mk.answers[String(i)];
      if (!a) continue;
      const unit = unitAt(mk.course, i), k = `${mk.course}:${unit}`;
      const u = m.get(k) ?? { course: mk.course, unit, correct: 0, total: 0, attempts: 0, pct: 0, seen: new Set<number>() };
      u.total++; if (a.ok) u.correct++;
      if (!u.seen.has(mi)) { u.seen.add(mi); u.attempts++; }
      u.pct = Math.round((u.correct / u.total) * 100);
      m.set(k, u);
    }
  });
  return [...m.values()].map((u) => ({ course: u.course, unit: u.unit, correct: u.correct, total: u.total, attempts: u.attempts, pct: u.pct }));
}
/** Adds several sets of per-unit stats together. */
export function mergeStats(...sets: UnitStat[][]): UnitStat[] {
  const m = new Map<string, UnitStat>();
  for (const st of sets) for (const x of st) {
    const k = `${x.course}:${x.unit}`, u = m.get(k) ?? { course: x.course, unit: x.unit, correct: 0, total: 0, attempts: 0, pct: 0 };
    u.correct += x.correct; u.total += x.total; u.attempts += x.attempts; u.pct = u.total ? Math.round((u.correct / u.total) * 100) : 0;
    m.set(k, u);
  }
  return [...m.values()];
}

/** The units to fix first: lowest accuracy among those actually attempted. */
export const leaking = (stats: UnitStat[], n = 3) => [...stats].filter((s) => s.pct < 100).sort((a, b) => a.pct - b.pct || b.attempts - a.attempts).slice(0, n);

export function accuracy(sessions: SessionRow[]) {
  let c = 0, t = 0;
  for (const s of sessions) if (s.submitted_at && s.correct !== null) { c += s.correct; t += s.total; }
  return t ? { correct: c, total: t, pct: Math.round((c / t) * 100) } : null;
}

/** "Readiness" = half of the syllabus you have completed (in subjects with quizzes) + half of your quiz accuracy. Both halves are shown to the student. */
export function readiness(doneTopics: number, totalTopics: number, acc: number | null) {
  const covered = totalTopics ? doneTopics / totalTopics : 0;
  return { covered: Math.round(covered * 100), accuracy: acc, score: Math.round((covered * 100 + (acc ?? 0)) / 2) };
}

/** Calendar day (YYYY-MM-DD) of an instant in a time zone. */
export const localDay = (iso: string | Date, tz: string) => new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));

export type Quest = { id: string; title: string; hint: string; value: number; target: number };
export function dailyQuests(o: { today: string; tz: string; todayXp: number; goal: number; sessions: SessionRow[]; events: EventRow[] }): Quest[] {
  const doneToday = o.sessions.filter((s) => s.submitted_at && localDay(s.submitted_at, o.tz) === o.today);
  const good = doneToday.filter((s) => s.correct !== null && s.correct / s.total >= 0.8).length;
  const topics = o.events.filter((e) => e.kind === "topic_completed" && localDay(e.created_at, o.tz) === o.today).length;
  return [
    { id: "goal", title: "Hit your daily goal", hint: `Earn ${o.goal} XP today`, value: Math.min(o.todayXp, o.goal), target: o.goal },
    { id: "quizzes", title: "Finish 2 quizzes", hint: "Any practice, topic or mock quiz", value: Math.min(doneToday.length, 2), target: 2 },
    { id: "sharp", title: "Score 80% or better", hint: "On any quiz you finish today", value: Math.min(good, 1), target: 1 },
    { id: "topic", title: "Complete a new topic", hint: "Pass a topic quiz with 60%+", value: Math.min(topics, 1), target: 1 },
  ];
}

/** Longest run of consecutive days with XP inside the window we have (last 84 days). */
export function bestStreak(days: Record<string, number>) {
  const keys = Object.keys(days).filter((k) => days[k] > 0).sort();
  let best = 0, run = 0, prev = "";
  for (const k of keys) {
    run = prev && Math.round((Date.parse(k) - Date.parse(prev)) / 86_400_000) === 1 ? run + 1 : 1;
    best = Math.max(best, run); prev = k;
  }
  return best;
}

export type Badge = { id: string; title: string; how: string; art: "star" | "trophy" | "medal" | "bolt" | "flame" | "rocket" | "brain" | "target"; earned: boolean; value: number; target: number };
export function badges(o: { totalXp: number; level: number; sessions: SessionRow[]; topicsDone: number; best: number }): Badge[] {
  const finished = o.sessions.filter((s) => s.submitted_at);
  const perfect = finished.some((s) => s.correct !== null && s.correct === s.total);
  const mocks = finished.filter((s) => s.kind === "mock").length;
  const B = (id: string, title: string, how: string, art: Badge["art"], value: number, target: number): Badge => ({ id, title, how, art, value: Math.min(value, target), target, earned: value >= target });
  return [
    B("first", "First steps", "Finish your first quiz", "star", finished.length, 1),
    B("perfect", "Flawless", "Get every answer right in a quiz", "target", perfect ? 1 : 0, 1),
    B("xp100", "Warm-up", "Earn 100 XP", "bolt", o.totalXp, 100),
    B("xp500", "On a roll", "Earn 500 XP", "rocket", o.totalXp, 500),
    B("topics5", "Topic hunter", "Complete 5 topics", "brain", o.topicsDone, 5),
    B("topics20", "Topic master", "Complete 20 topics", "trophy", o.topicsDone, 20),
    B("streak3", "Three in a row", "Study 3 days in a row", "flame", o.best, 3),
    B("streak7", "Full week", "Study 7 days in a row", "medal", o.best, 7),
    B("mock", "Exam ready", "Finish a mock test", "medal", mocks, 1),
    B("level5", "Level 5", "Reach level 5", "trophy", o.level, 5),
  ];
}
