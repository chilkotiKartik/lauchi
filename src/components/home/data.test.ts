import { describe, expect, it } from "vitest";
import { dayNames, lastDays, litOrbs, pickLab, shiftDay, towerHeights } from "./data";

describe("home scene data", () => {
  it("shifts days across month and year ends", () => {
    expect(shiftDay("2026-03-01", -1)).toBe("2026-02-28");
    expect(shiftDay("2026-01-01", -1)).toBe("2025-12-31");
    expect(shiftDay("2026-12-31", 1)).toBe("2027-01-01");
  });
  it("returns the last 7 days oldest first, zero-filled", () => {
    expect(lastDays("2026-10-02", { "2026-10-02": 40, "2026-09-30": 10, "2026-01-01": 99 })).toEqual([0, 0, 0, 0, 10, 0, 40]);
    expect(dayNames("2026-10-02")).toHaveLength(7);
    expect(dayNames("2026-10-02")[6]).toBe("Fri");
  });
  it("lights orbs in proportion to the goal", () => {
    expect(litOrbs(0, 50)).toBe(0);
    expect(litOrbs(24, 50)).toBe(4);
    expect(litOrbs(49, 50)).toBe(9);
    expect(litOrbs(50, 50)).toBe(10);
    expect(litOrbs(500, 50)).toBe(10);
    expect(litOrbs(5, 0)).toBe(10);
  });
  it("scales tower heights to the busiest day", () => {
    expect(towerHeights([0, 0, 0])).toEqual([0, 0, 0]);
    expect(towerHeights([50, 25, 0, 1000])).toEqual([0.08, 0.08, 0, 1]);
    expect(towerHeights([100, 50])).toEqual([1, 0.5]);
  });
  it("picks a lab by unit, then subject, then first", () => {
    const labs = [{ id: "a", title: "A", where: [["X", 1]] as const }, { id: "b", title: "B", where: [["Y", 2]] as const }, { id: "c", title: "C", where: [["Y", 3]] as const }];
    expect(pickLab(labs, { course: "Y", unit: 3 })?.id).toBe("c");
    expect(pickLab(labs, { course: "Y", unit: 9 })?.id).toBe("b");
    expect(pickLab(labs, { course: "Z", unit: 1 })?.id).toBe("a");
    expect(pickLab(labs, null)?.id).toBe("a");
    expect(pickLab([], null)).toBeNull();
  });
});
