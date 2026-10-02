import { describe, expect, it } from "vitest";
import { accuracy, badges, bestStreak, dailyQuests, leaking, localDay, readiness, unitStats, type SessionRow } from "./insights";

const S = (o: Partial<SessionRow>): SessionRow => ({ course: "AHT-003", unit: 1, kind: "practice", total: 10, correct: 5, submitted_at: "2026-09-30T05:00:00Z", ...o });

describe("unit stats", () => {
  it("aggregates finished practice/topic sessions per unit and ignores mocks and unfinished", () => {
    const st = unitStats([S({ correct: 5 }), S({ correct: 9 }), S({ kind: "mock", correct: 1 }), S({ submitted_at: null, correct: null }), S({ unit: 2, correct: 10 })]);
    const u1 = st.find((s) => s.unit === 1)!;
    expect(u1).toMatchObject({ correct: 14, total: 20, attempts: 2, pct: 70 });
    expect(st).toHaveLength(2);
  });
  it("leaking = lowest accuracy first, never a perfect unit", () => {
    const l = leaking(unitStats([S({ unit: 1, correct: 9 }), S({ unit: 2, correct: 2 }), S({ unit: 3, correct: 10 }), S({ unit: 4, correct: 5 })]));
    expect(l.map((x) => x.unit)).toEqual([2, 4, 1]);
  });
});
describe("accuracy and readiness", () => {
  it("accuracy counts every finished session", () => {
    expect(accuracy([S({ correct: 5 }), S({ kind: "mock", correct: 10 }), S({ submitted_at: null, correct: null })])).toEqual({ correct: 15, total: 20, pct: 75 });
    expect(accuracy([])).toBeNull();
  });
  it("readiness is the mean of coverage and accuracy", () => {
    expect(readiness(10, 100, 90)).toEqual({ covered: 10, accuracy: 90, score: 50 });
    expect(readiness(0, 0, null).score).toBe(0);
  });
});
describe("days, quests, streaks", () => {
  it("localDay uses the student's time zone", () => {
    expect(localDay("2026-09-30T20:00:00Z", "Asia/Kolkata")).toBe("2026-10-01");
    expect(localDay("2026-09-30T20:00:00Z", "UTC")).toBe("2026-09-30");
  });
  it("quests are computed from real activity only", () => {
    const q = dailyQuests({ today: "2026-09-30", tz: "Asia/Kolkata", todayXp: 80, goal: 50, sessions: [S({ correct: 9 }), S({ correct: 3 }), S({ submitted_at: "2026-09-29T05:00:00Z" })], events: [{ kind: "topic_completed", xp: 20, created_at: "2026-09-30T06:00:00Z" }] });
    expect(q.map((x) => [x.id, x.value, x.target])).toEqual([["goal", 50, 50], ["quizzes", 2, 2], ["sharp", 1, 1], ["topic", 1, 1]]);
  });
  it("best streak finds the longest run", () => {
    expect(bestStreak({ "2026-09-01": 5, "2026-09-02": 5, "2026-09-03": 0, "2026-09-05": 9, "2026-09-06": 9, "2026-09-07": 9 })).toBe(3);
    expect(bestStreak({})).toBe(0);
  });
});
describe("badges", () => {
  it("are earned only by real achievements", () => {
    const none = badges({ totalXp: 0, level: 1, sessions: [], topicsDone: 0, best: 0 });
    expect(none.every((b) => !b.earned)).toBe(true);
    const some = badges({ totalXp: 120, level: 2, sessions: [S({ correct: 10 })], topicsDone: 0, best: 3 });
    expect(some.filter((b) => b.earned).map((b) => b.id).sort()).toEqual(["first", "perfect", "streak3", "xp100"]);
  });
});

import { mergeStats, mockUnitStats } from "./insights";
describe("mock questions feed unit stats", () => {
  const unitAt = (_c: string, i: number) => [1, 2, 3][i % 3];
  const mock = { course: "AHT-001", total: 6, answers: { "0": { ok: true }, "1": { ok: false }, "2": { ok: false }, "3": { ok: true }, "4": { ok: false } } as Record<string, { ok?: boolean }> };
  it("credits each answer to its own unit (unanswered ones are skipped)", () => {
    const s = mockUnitStats([mock], unitAt);
    const u = (n: number) => s.find((x) => x.unit === n)!;
    expect(u(1)).toMatchObject({ correct: 2, total: 2, pct: 100, attempts: 1 });
    expect(u(2)).toMatchObject({ correct: 0, total: 2, pct: 0 });
    expect(u(3)).toMatchObject({ correct: 0, total: 1, pct: 0 });
  });
  it("merges with quiz stats and recomputes the percentage", () => {
    const merged = mergeStats([{ course: "AHT-001", unit: 2, correct: 8, total: 10, attempts: 1, pct: 80 }], mockUnitStats([mock], unitAt));
    expect(merged.find((x) => x.unit === 2)).toMatchObject({ correct: 8, total: 12, attempts: 2, pct: 67 });
    expect(leaking(merged)[0].unit).toBe(3);
  });
});
