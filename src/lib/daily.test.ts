import { describe, expect, it } from "vitest";
import { courseUnits, fromTemplate } from "./quiz-core";
import { chooseItems, dailySeed, historyStrip, type UnitRef } from "./daily";
import { lastDays } from "./streak";

const codes = ["AHT-002", "AHT-001", "EET-001", "BCA-001"];
const pool: UnitRef[] = codes.flatMap((course) => courseUnits(course).map((unit) => ({ course, unit })));

describe("daily challenge selection", () => {
  it("has a real bank to pick from", () => expect(pool.length).toBeGreaterThan(4));
  it("is deterministic per student and day, and differs between days", () => {
    const a = chooseItems({ seed: dailySeed("u1", "2026-10-02"), pool });
    expect(a).toEqual(chooseItems({ seed: dailySeed("u1", "2026-10-02"), pool }));
    expect(a).not.toEqual(chooseItems({ seed: dailySeed("u1", "2026-10-03"), pool }));
    expect(a).not.toEqual(chooseItems({ seed: dailySeed("u2", "2026-10-02"), pool }));
  });
  it("gives five rebuildable questions, weakest units first", () => {
    const weak = [pool[3], pool[5]];
    const items = chooseItems({ seed: 42, pool, weak });
    expect(items).toHaveLength(5);
    expect([items[0].c, items[0].u]).toEqual([weak[0].course, weak[0].unit]);
    expect([items[1].c, items[1].u]).toEqual([weak[1].course, weak[1].unit]);
    expect(new Set(items.map((i) => `${i.c}:${i.u}`)).size).toBe(5);
    for (const i of items) expect(fromTemplate(i.c, i.u, i.t, i.s)).not.toBeNull();
  });
  it("ignores weak units outside the pool and copes with an empty pool", () => {
    const items = chooseItems({ seed: 1, pool, weak: [{ course: "XXX-999", unit: 1 }] });
    expect(items.every((i) => i.c !== "XXX-999")).toBe(true);
    expect(chooseItems({ seed: 1, pool: [] })).toEqual([]);
  });
  it("repeats units when there are fewer than five", () => {
    expect(chooseItems({ seed: 7, pool: pool.slice(0, 2) })).toHaveLength(5);
  });
});

describe("historyStrip", () => {
  it("marks completed days", () => {
    const days = lastDays("2026-10-02", 14);
    const cells = historyStrip([{ day: "2026-10-01", score: 4, completed_at: "x" }, { day: "2026-09-30", score: null, completed_at: null }], days, "2026-10-02");
    expect(cells).toHaveLength(14);
    expect(cells[12]).toMatchObject({ day: "2026-10-01", done: true, score: 4 });
    expect(cells[11].done).toBe(false);
    expect(cells[13].today).toBe(true);
  });
});
