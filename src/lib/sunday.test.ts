import { describe, expect, it } from "vitest";
import { daysUntil, isSunday, maxSundayXp, planQuest, questDay, questItems, sundayStreak, sundayXp, weekMonday, weekStats } from "./sunday";
import { fromTemplate } from "./quiz-core";

describe("Sunday Quest dates (India weeks, Monday to Sunday)", () => {
  it("finds this week's Sunday and Monday", () => {
    expect(isSunday("2026-10-04")).toBe(true);
    expect(questDay("2026-10-03")).toBe("2026-10-04"); // Saturday → tomorrow
    expect(questDay("2026-09-28")).toBe("2026-10-04"); // Monday → end of week
    expect(questDay("2026-10-04")).toBe("2026-10-04");
    expect(weekMonday("2026-10-04")).toBe("2026-09-28");
    expect(daysUntil("2026-10-01")).toBe(3);
    expect(daysUntil("2026-10-04")).toBe(0);
  });
});

describe("what the quest covers", () => {
  const pool = [{ course: "AHT-001", unit: 1 }, { course: "AHT-001", unit: 2 }, { course: "AHT-002", unit: 1 }, { course: "EET-001", unit: 1 }];
  it("counts answers per unit from quizzes (mock answers carry their own unit) and daily challenges", () => {
    const s = weekStats(
      [{ course: "AHT-001", unit: 1, answers: { "0": { ok: true }, "1": { ok: false } } }, { course: "AHT-001", unit: 1, answers: { "0": { ok: false, u: 2 } } }],
      [{ items: [{ c: "EET-001", u: 1 }], answers: { "0": { ok: false } } }],
    );
    const by = Object.fromEntries(s.map((x) => [`${x.course}:${x.unit}`, x]));
    expect(by["AHT-001:1"]).toMatchObject({ attempts: 2, wrong: 1 });
    expect(by["AHT-001:2"]).toMatchObject({ attempts: 1, wrong: 1 });
    expect(by["EET-001:1"]).toMatchObject({ attempts: 1, wrong: 1 });
  });
  it("gives every studied unit a question, more to the units with mistakes, exactly 12 in all", () => {
    const p = planQuest([{ course: "AHT-001", unit: 1, attempts: 20, wrong: 8 }, { course: "AHT-002", unit: 1, attempts: 10, wrong: 0 }, { course: "XXX-999", unit: 1, attempts: 5, wrong: 5 }], pool);
    expect(p.review).toBe(false);
    expect(p.units.map((u) => u.course)).toEqual(["AHT-001", "AHT-002"]); // a unit outside the student's subjects is ignored
    expect(p.units.reduce((a, u) => a + u.questions, 0)).toBe(12);
    expect(p.units[0].questions).toBeGreaterThan(p.units[1].questions);
    expect(p.units[1].questions).toBeGreaterThanOrEqual(1);
  });
  it("turns a week without practice into a mixed review", () => {
    const p = planQuest([], pool, [pool[2], pool[0]]);
    expect(p.review).toBe(true);
    expect(p.units.map((u) => u.course)).toEqual(["AHT-002", "AHT-001"]);
    expect(p.units.reduce((a, u) => a + u.questions, 0)).toBe(12);
  });
  it("builds real, distinct, reproducible questions", () => {
    const plan = planQuest([{ course: "AHT-001", unit: 1, attempts: 4, wrong: 2 }, { course: "AHT-002", unit: 1, attempts: 4, wrong: 0 }], pool);
    const a = questItems(plan.units, 12345), b = questItems(plan.units, 12345);
    expect(a).toEqual(b);
    expect(a).toHaveLength(12);
    const texts = a.map((i) => fromTemplate(i.c, i.u, i.t, i.s)?.q);
    expect(texts.every(Boolean)).toBe(true);
    expect(new Set(texts).size).toBeGreaterThanOrEqual(10);
  });
});

describe("rewards", () => {
  it("pays 10 + 4 per correct answer + 20 at 80%", () => {
    expect(sundayXp(0, 12)).toBe(10);
    expect(sundayXp(9, 12)).toBe(46);
    expect(sundayXp(10, 12)).toBe(70);
    expect(sundayXp(12, 12)).toBe(maxSundayXp());
    expect(maxSundayXp()).toBe(78);
  });
  it("counts consecutive Sundays; an unfinished today doesn't break the run", () => {
    expect(sundayStreak(["2026-09-20", "2026-09-27"], "2026-10-03")).toBe(2);
    expect(sundayStreak(["2026-09-20", "2026-09-27"], "2026-10-04")).toBe(2);
    expect(sundayStreak(["2026-09-20", "2026-09-27", "2026-10-04"], "2026-10-04")).toBe(3);
    expect(sundayStreak(["2026-09-13", "2026-09-27"], "2026-10-01")).toBe(1);
    expect(sundayStreak([], "2026-10-01")).toBe(0);
  });
});
