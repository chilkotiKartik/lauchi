import { describe, expect, it } from "vitest";
import { buildSchedule, groupByDay, progressPct, taskLinks, weakUnits } from "@/lib/exam";
import type { PlanUnit } from "@/lib/plan";

const u = (course: string, unit: number, topics: number, done: number, accuracy: number | null): PlanUnit => ({ course, short: course, unit, title: `U${unit}`, topics, done, accuracy });
const units = [u("EET-001", 1, 6, 0, 0.3), u("EET-001", 2, 4, 4, 0.95), u("AHT-001", 1, 8, 2, null)];

describe("buildSchedule", () => {
  it("is empty when the exam is today, past, or nothing is in scope", () => {
    expect(buildSchedule(units, "2026-10-02", "2026-10-02")).toEqual([]);
    expect(buildSchedule(units, "2026-10-02", "2026-10-01")).toEqual([]);
    expect(buildSchedule([], "2026-10-02", "2026-10-20")).toEqual([]);
  });
  it("keeps every task between today and the day before the exam, with unique keys", () => {
    const t = buildSchedule(units, "2026-10-02", "2026-10-12");
    expect(t.every((x) => x.day >= "2026-10-02" && x.day < "2026-10-12")).toBe(true);
    expect(new Set(t.map((x) => `${x.day}|${x.course}|${x.unit}|${x.kind}`)).size).toBe(t.length);
  });
  it("schedules one day when only one day is left", () => {
    expect(new Set(buildSchedule(units, "2026-10-02", "2026-10-03").map((x) => x.day))).toEqual(new Set(["2026-10-02"]));
  });
  it("skips learning for finished units, and puts the weak unit's work before the strong one's", () => {
    const t = buildSchedule(units, "2026-10-02", "2026-10-30");
    expect(t.some((x) => x.course === "EET-001" && x.unit === 2 && x.kind === "learn")).toBe(false);
    const first = (course: string, unit: number) => t.findIndex((x) => x.course === course && x.unit === unit && x.kind === "practice");
    expect(first("EET-001", 1)).toBeLessThan(first("EET-001", 2));
    expect(t.some((x) => x.kind === "revise" && x.unit === 2)).toBe(false);
  });
  it("gives bigger units longer learn blocks and weaker units longer practice", () => {
    const t = buildSchedule(units, "2026-10-02", "2026-10-30");
    const m = (c: string, n: number, k: string) => t.find((x) => x.course === c && x.unit === n && x.kind === k)!.minutes;
    expect(m("AHT-001", 1, "learn")).toBeGreaterThan(0);
    expect(m("EET-001", 1, "practice")).toBeGreaterThan(m("EET-001", 2, "practice"));
  });
  it("ends with one mock per subject, never before the learning of that subject", () => {
    const t = buildSchedule(units, "2026-10-02", "2026-10-30");
    expect(t.filter((x) => x.kind === "mock").map((x) => x.course).sort()).toEqual(["AHT-001", "EET-001"]);
    const lastLearn = Math.max(...t.map((x, i) => (x.kind === "learn" ? i : -1)));
    expect(t.findIndex((x) => x.kind === "mock")).toBeGreaterThan(lastLearn);
  });
});

describe("helpers", () => {
  it("progress, grouping, links and weak units", () => {
    expect(progressPct([])).toBe(0);
    expect(progressPct([{ done: true }, { done: false }, { done: false }, { done: true }])).toBe(50);
    expect(groupByDay([{ day: "b" }, { day: "a" }, { day: "b" }]).map((g) => [g.day, g.tasks.length])).toEqual([["a", 1], ["b", 2]]);
    expect(taskLinks({ course: "EET-001", unit: 2, kind: "pyq" })[0].href).toBe("/pyq?course=EET-001&unit=2");
    expect(taskLinks({ course: "EET-001", unit: 0, kind: "mock" })[0].href).toBe("/mock");
    expect(weakUnits(units).map((x) => x.unit)).toEqual([1, 2]);
  });
});
