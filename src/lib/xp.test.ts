import { describe, expect, it } from "vitest";
import { levelFromXp, xpForLevel } from "./xp";
import { currentStreak, dayKey, lastDays } from "./streak";

describe("levels", () => {
  it("has fixed thresholds", () => {
    expect([1, 2, 3, 4, 5].map(xpForLevel)).toEqual([0, 100, 300, 600, 1000]);
  });
  it("maps xp to level at every boundary", () => {
    for (let l = 1; l <= 60; l++) {
      expect(levelFromXp(xpForLevel(l)).level).toBe(l);
      if (l > 1) expect(levelFromXp(xpForLevel(l) - 1).level).toBe(l - 1);
    }
  });
  it("clamps bad input", () => {
    expect(levelFromXp(-5).level).toBe(1);
    expect(levelFromXp(0).into).toBe(0);
  });
});

describe("streak", () => {
  it("counts consecutive days including today", () => {
    expect(currentStreak(["2026-09-28", "2026-09-29", "2026-09-30"], "2026-09-30")).toBe(3);
  });
  it("keeps the streak alive until the day ends", () => {
    expect(currentStreak(["2026-09-28", "2026-09-29"], "2026-09-30")).toBe(2);
  });
  it("breaks after a missed day", () => {
    expect(currentStreak(["2026-09-27", "2026-09-28"], "2026-09-30")).toBe(0);
  });
  it("handles month and year boundaries", () => {
    expect(currentStreak(["2026-12-31", "2027-01-01"], "2027-01-01")).toBe(2);
  });
  it("uses the student's timezone for the day", () => {
    const t = new Date("2026-09-30T20:00:00Z");
    expect(dayKey(t, "Asia/Calcutta")).toBe("2026-10-01");
    expect(dayKey(t, "UTC")).toBe("2026-09-30");
  });
  it("lists the last N days ending today", () => {
    expect(lastDays("2026-09-30", 3)).toEqual(["2026-09-28", "2026-09-29", "2026-09-30"]);
  });
});
