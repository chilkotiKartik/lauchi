import { describe, expect, it } from "vitest";
import { addDays, buildPlan, daysBetween, priority, type PlanUnit } from "./plan";

const U = (o: Partial<PlanUnit>): PlanUnit => ({ course: "AHT-003", short: "Maths", unit: 1, title: "Calculus", topics: 4, done: 0, accuracy: null, ...o });

describe("study plan", () => {
  it("date helpers", () => {
    expect(addDays("2026-09-30", 1)).toBe("2026-10-01");
    expect(daysBetween("2026-09-30", "2026-10-10")).toBe(10);
  });
  it("finished, strong units rank last", () => {
    expect(priority(U({ done: 4, accuracy: 1 }))).toBeLessThan(priority(U({ done: 0, accuracy: 0.4 })));
    expect(priority(U({ accuracy: 0.3 }))).toBeGreaterThan(priority(U({ accuracy: 0.9 })));
  });
  it("no plan when the exam is today or past", () => {
    expect(buildPlan([U({})], "2026-10-01", "2026-10-01", 2).days).toEqual([]);
    expect(buildPlan([U({})], "2026-10-05", "2026-10-01", 2).days).toEqual([]);
  });
  it("respects the daily budget and never plans past the exam", () => {
    const units = Array.from({ length: 6 }, (_, i) => U({ unit: i + 1, topics: 6 }));
    const p = buildPlan(units, "2026-10-01", "2026-10-11", 2);
    expect(p.days).toHaveLength(10);
    for (const d of p.days) expect(d.minutes).toBeLessThanOrEqual(120 + 45);
    expect(p.days[p.days.length - 1].date).toBe("2026-10-10");
  });
  it("reports overflow when there is not enough time", () => {
    const units = Array.from({ length: 10 }, (_, i) => U({ unit: i + 1, topics: 10 }));
    expect(buildPlan(units, "2026-10-01", "2026-10-04", 1).overflow).toBeGreaterThan(0);
  });
  it("puts the weakest unit first and skips finished work", () => {
    const p = buildPlan([U({ unit: 1, done: 4, accuracy: 1 }), U({ unit: 2, accuracy: 0.2 }), U({ unit: 3, accuracy: 0.9 })], "2026-10-01", "2026-10-20", 3);
    expect(p.days[0].items[0].unit).toBe(2);
    expect(p.days.flatMap((d) => d.items).filter((i) => i.kind === "learn" && i.unit === 1)).toHaveLength(0);
  });
  it("re-planning after progress reduces the work (auto-reschedule)", () => {
    const before = buildPlan([U({ topics: 8, done: 0 })], "2026-10-01", "2026-10-15", 2).totalMinutes;
    const after = buildPlan([U({ topics: 8, done: 6 })], "2026-10-05", "2026-10-15", 2).totalMinutes;
    expect(after).toBeLessThan(before);
  });
  it("adds revision blocks near the end for weak units", () => {
    const p = buildPlan([U({ topics: 2, accuracy: 0.3 })], "2026-10-01", "2026-10-21", 2);
    expect(p.days.slice(-4).flatMap((d) => d.items).some((i) => i.kind === "revise")).toBe(true);
  });
});
