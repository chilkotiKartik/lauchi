import { describe, expect, it } from "vitest";
import { buildWeeks, defaultGoals, goalMet, goalsSchema, pct } from "./goals";

describe("weekly goals", () => {
  it("validates targets", () => {
    expect(goalsSchema.safeParse({ xpTarget: 300, quizzesTarget: 5 }).success).toBe(true);
    expect(goalsSchema.safeParse({ xpTarget: 5, quizzesTarget: 5 }).success).toBe(false);
    expect(goalsSchema.safeParse({ xpTarget: 300, quizzesTarget: 101 }).success).toBe(false);
    expect(goalsSchema.safeParse({ xpTarget: 300.5, quizzesTarget: 1 }).success).toBe(false);
    expect(goalsSchema.safeParse({ xpTarget: "300", quizzesTarget: 1 }).success).toBe(false);
  });
  it("defaults from the daily goal", () => {
    expect(defaultGoals(50)).toEqual({ xpTarget: 350, quizzesTarget: 5 });
    expect(defaultGoals(500).xpTarget).toBe(3500);
  });
  it("lists eight weeks newest first with progress and goals", () => {
    const w = buildWeeks("2026-10-02", [{ week_start: "2026-09-28", xp: "120", quizzes: 2 }, { week_start: "2026-09-14", xp: 400, quizzes: 6 }], [{ week_start: "2026-09-14", xp_target: 300, quizzes_target: 5 }]);
    expect(w).toHaveLength(8);
    expect(w[0]).toEqual({ weekStart: "2026-09-28", xp: 120, quizzes: 2, goal: null });
    expect(w[1].xp).toBe(0);
    expect(w[2].weekStart).toBe("2026-09-14");
    expect(goalMet(w[2])).toBe(true);
    expect(goalMet(w[0])).toBe(false);
    expect(w[7].weekStart).toBe("2026-08-10");
  });
  it("caps percentages", () => {
    expect(pct(50, 100)).toBe(50);
    expect(pct(500, 100)).toBe(100);
    expect(pct(0, 0)).toBe(100);
  });
});
