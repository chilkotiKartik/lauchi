import { describe, expect, it } from "vitest";
import { addDays, currentStreak, streakWithFreezes, weekStart } from "./streak";

const run = (from: string, n: number) => Array.from({ length: n }, (_, i) => addDays(from, i));

describe("streakWithFreezes", () => {
  it("matches the plain streak when nothing is missed", () => {
    const days = run("2026-09-20", 5);
    expect(streakWithFreezes(days, "2026-09-25").streak).toBe(currentStreak(days, "2026-09-25"));
    expect(streakWithFreezes(days, "2026-09-25").freezes).toBe(0);
  });
  it("earns a freeze after 7 days and spends it on a missed day", () => {
    const days = [...run("2026-09-10", 7), ...run("2026-09-18", 2)]; // 10..16 active, 17 missed, 18..19 active
    const r = streakWithFreezes(days, "2026-09-20");
    expect(r.frozen).toEqual(["2026-09-17"]);
    expect(r.streak).toBe(9);
    expect(r.freezes).toBe(0);
  });
  it("breaks without a freeze", () => {
    const r = streakWithFreezes([...run("2026-09-10", 3), ...run("2026-09-15", 2)], "2026-09-17");
    expect(r.streak).toBe(2);
  });
  it("banks at most two freezes and counts the 7th day when it is today", () => {
    expect(streakWithFreezes(run("2026-09-01", 21), "2026-09-22").freezes).toBe(2);
    expect(streakWithFreezes(run("2026-09-01", 7), "2026-09-07").freezes).toBe(1);
    expect(streakWithFreezes(run("2026-09-01", 6), "2026-09-07").freezes).toBe(0);
  });
  it("does not spend a freeze on today", () => {
    const r = streakWithFreezes(run("2026-09-01", 7), "2026-09-08");
    expect(r.streak).toBe(7);
    expect(r.freezes).toBe(1);
    expect(r.frozen).toEqual([]);
  });
  it("is zero with no activity", () => expect(streakWithFreezes([], "2026-09-08")).toEqual({ streak: 0, freezes: 0, frozen: [] }));
});

describe("weekStart", () => {
  it("returns the Monday", () => {
    expect(weekStart("2026-10-02")).toBe("2026-09-28"); // Friday
    expect(weekStart("2026-09-28")).toBe("2026-09-28");
    expect(weekStart("2026-10-04")).toBe("2026-09-28"); // Sunday
  });
});
