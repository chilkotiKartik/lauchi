import { describe, expect, it } from "vitest";
import { chooseTemplate, difficultyTable, levelFor, predict, priorFromQuestion, recentAccuracy, recentFromSessions, refine, templatePriors } from "./adaptive";
import { courseUnits, fromTemplate, generateAt, pickSeed, sessionGenerated } from "./quiz-core";
import { GEN } from "@/content/gen.generated.cjs";

describe("adaptive difficulty", () => {
  it("orders the prior by type: mcq easier than nat easier than msq", () => {
    const base = { q: "Find x.", why: "x = 1." };
    const mcq = priorFromQuestion({ ...base, type: "mcq", o: ["a", "b"], a: 0 });
    const nat = priorFromQuestion({ ...base, type: "nat", a: 1 });
    const msq = priorFromQuestion({ ...base, type: "msq", o: ["a", "b"], a: [0] });
    expect(mcq).toBeGreaterThan(nat); expect(nat).toBeGreaterThan(msq);
    const long = priorFromQuestion({ type: "nat", a: 1, q: "Given 1, 2, 3, 4, 5 and 6 find x.", why: "Step one is long enough here. Step two is long too; step three follows. Step four ends it with a lot of words to read." });
    expect(long).toBeLessThan(nat);
  });
  it("gives every template of every unit a prior in range", () => {
    for (const c of Object.keys(GEN)) for (const u of courseUnits(c)) {
      const p = templatePriors(c, u);
      expect(p.length).toBe(GEN[c][u].length);
      for (const x of p) { expect(x).toBeGreaterThanOrEqual(0.25); expect(x).toBeLessThanOrEqual(0.92); }
    }
  });
  it("uses real data only from 20 attempts", () => {
    expect(refine(0.7, { attempts: 19, correct: 0 })).toBe(0.7);
    expect(refine(0.7, { attempts: 40, correct: 8 })).toBeLessThan(0.4);
    expect(difficultyTable([0.7, 0.7], [{ template: 1, attempts: 100, correct: 95 }])[1]).toBeGreaterThan(0.85);
  });
  it("recent accuracy uses only the last 20 answers", () => {
    expect(recentAccuracy([true, false])).toBeNull();
    const a = recentAccuracy([...Array(30).fill(false), ...Array(20).fill(true)])!;
    expect(a).toBeGreaterThan(0.9);
  });
  it("targets ~70%: cruising picks harder, struggling picks easier", () => {
    const difficulty = [0.9, 0.8, 0.7, 0.55, 0.4, 0.3];
    const pick = (recent: boolean[]) => chooseTemplate({ difficulty, recent, used: [], seed: 1, index: 3 });
    const cruising = difficulty[pick(Array(20).fill(true))];
    const struggling = difficulty[pick(Array(20).fill(false))];
    const fresh = difficulty[pick([])];
    expect(cruising).toBeLessThan(fresh);
    expect(struggling).toBeGreaterThan(fresh);
    expect(Math.abs(predict(fresh, null, 0.6) - 0.7)).toBeLessThan(0.11);
  });
  it("avoids repeating templates and is deterministic", () => {
    const difficulty = [0.7, 0.7, 0.7];
    const a = chooseTemplate({ difficulty, recent: [], used: [0, 1], seed: 9, index: 2 });
    expect(a).toBe(2);
    expect(chooseTemplate({ difficulty, recent: [true], used: [], seed: 5, index: 4 })).toBe(chooseTemplate({ difficulty, recent: [true], used: [], seed: 5, index: 4 }));
  });
  it("labels levels by thirds", () => {
    const all = [0.3, 0.4, 0.5, 0.6, 0.7, 0.8];
    expect(levelFor(0.8, all)).toBe("warming up");
    expect(levelFor(0.3, all)).toBe("challenge");
    expect(levelFor(0.55, all)).toBe("steady");
  });
  it("flattens recent answers oldest first, unit-filtered", () => {
    const rows = [
      { kind: "practice", unit: 1, answers: { "1": { ok: false }, "0": { ok: true } } },
      { kind: "practice", unit: 1, answers: { "0": { ok: false }, "1": { ok: true, u: 2 } } },
    ];
    expect(recentFromSessions(rows, 1)).toEqual([false, true, false]);
  });
  it("a picked practice question is stable and rebuilt from its answer tag", () => {
    const s = { kind: "practice", course: "AHT-001", unit: 1, seed: 42, picks: { "1": 3 } as Record<string, number>, answers: {} };
    const g = sessionGenerated(s, 1)!;
    expect(g.t).toBe(3);
    expect(g.q).toEqual(fromTemplate("AHT-001", 1, 3, pickSeed(42, 1)));
    // question 0 stays the plain seeded one, and an answered question is rebuilt from its tag even without picks
    expect(sessionGenerated(s, 0)!.q).toEqual(generateAt("AHT-001", 1, 42, 0)!.q);
    const tagged = { ...s, picks: {}, answers: { "1": { a: 0, ok: false, t: g.t, s: g.s, u: 1 } } };
    expect(sessionGenerated(tagged, 1)!.q).toEqual(g.q);
    // a mock keeps its fixed questions
    const m = { kind: "mock", course: "AHT-001", unit: 1, seed: 42 };
    expect(sessionGenerated(m, 0)!.q).toEqual(generateAt("AHT-001", courseUnits("AHT-001")[0], 42, 0)!.q);
  });
});
