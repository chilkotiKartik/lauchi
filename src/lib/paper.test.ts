import { describe, expect, it } from "vitest";
import { getPyq } from "./pyq";
import {
  PART_KEYS, buildPaper, checkResultSchema, clampCheck, cleanChosen, extractJson, formatClock, genericRubric, gradeBand,
  paperTotal, parseImage, partScore, pickParts, questionScore, remainingMs, scaleRubric, timeUp, weakUnits, type PoolItem,
} from "./paper";

const sum = (r: { marks: number }[]) => r.reduce((s, x) => s + x.marks, 0);

describe("paper builder", () => {
  const codes = ["AHT-001", "AHT-002", "EET-001", "ECT-001", "MET-001"];
  for (const code of codes) it(`${code}: 5 questions × 3 different parts from the right unit, same seed → same paper`, () => {
    const s = getPyq(code)!;
    for (const seed of [1, 42, 99999, 1_999_999_999]) {
      const p = buildPaper(s.units, seed);
      expect(p).toHaveLength(5);
      p.forEach((ids, q) => {
        expect(ids).toHaveLength(3);
        expect(new Set(ids).size).toBe(3);
        const unit = s.units.find((u) => u.n === q + 1)!;
        for (const id of ids) expect(unit.pyqs.some((x) => x.id === id)).toBe(true);
      });
      expect(buildPaper(s.units, seed)).toEqual(p);
    }
    expect(buildPaper(s.units, 7)).not.toEqual(buildPaper(s.units, 8));
  });

  it("favours the most repeated questions", () => {
    const pool: PoolItem[] = [{ id: "Q1.1", kind: "theory", repeated: 20 }, ...Array.from({ length: 9 }, (_, i) => ({ id: `Q1.${i + 2}`, kind: "theory" as const, repeated: null }))];
    let hot = 0;
    for (let seed = 1; seed <= 400; seed++) if (pickParts(pool, seed, 1).includes("Q1.1")) hot++;
    expect(hot / 400).toBeGreaterThan(0.85);
  });

  it("mixes theory and numericals when the unit has both", () => {
    const pool: PoolItem[] = [
      ...Array.from({ length: 6 }, (_, i) => ({ id: `Q2.${i + 1}`, kind: "theory" as const, repeated: 9 })),
      { id: "Q2.9", kind: "numerical", repeated: null },
    ];
    for (let seed = 1; seed <= 100; seed++) {
      const ids = pickParts(pool, seed, 2);
      expect(ids).toContain("Q2.9");
      expect(new Set(ids).size).toBe(3);
    }
  });

  it("copes with a unit that has fewer than three questions", () => {
    expect(pickParts([{ id: "Q5.1", kind: "theory", repeated: 1 }], 3, 5)).toEqual(["Q5.1"]);
    expect(pickParts([], 3, 5)).toEqual([]);
  });
});

describe("rubrics and marks", () => {
  it("scales a model answer's rubric to 10 marks in half marks", () => {
    const r = scaleRubric([{ point: "a", marks: 2 }, { point: "b", marks: 1 }, { point: "c", marks: 2 }], 5);
    expect(sum(r)).toBe(10);
    expect(r.map((x) => x.marks)).toEqual([4, 2, 4]);
    const odd = scaleRubric([{ point: "a", marks: 3 }, { point: "b", marks: 3 }, { point: "c", marks: 1 }], 7);
    expect(sum(odd)).toBe(10);
    for (const x of odd) { expect(x.marks * 2).toBe(Math.round(x.marks * 2)); expect(x.marks).toBeGreaterThanOrEqual(0.5); }
    expect(scaleRubric([], 10)).toEqual([]);
  });
  it("generic rubrics add up to 10", () => {
    expect(sum(genericRubric("theory"))).toBe(10);
    expect(sum(genericRubric("numerical"))).toBe(10);
  });
  it("part score sums ticks, ignores bad or repeated ticks and caps at 10", () => {
    const r = genericRubric("theory");
    expect(partScore(r, { t: [0, 1] })).toBe(6);
    expect(partScore(r, { t: [0, 0, 9] })).toBe(2);
    expect(partScore([{ point: "x", marks: 8 }, { point: "y", marks: 8 }], { t: [0, 1] })).toBe(10);
    expect(partScore(r, undefined)).toBe(0);
  });
  it("counts the best two parts of each question and grades the total", () => {
    expect(questionScore([4, 9, 7])).toBe(16);
    const g = genericRubric("theory");
    const rubrics = Object.fromEntries(PART_KEYS.map((k) => [k, g]));
    const all = Object.fromEntries(PART_KEYS.map((k) => [k, { t: [0, 1, 2, 3] }]));
    expect(paperTotal(rubrics, all).total).toBe(100);
    const some = paperTotal(rubrics, { "1a": { t: [0] }, "1b": { t: [1] }, "1c": { t: [0, 1] }, "3b": { t: [3] } });
    expect(some.perQuestion).toEqual([10, 0, 2, 0, 0]);
    expect(some.total).toBe(12);
    expect(weakUnits(some.perQuestion)).toEqual([2, 4, 5, 3]);
    expect(gradeBand(95).grade).toBe("O");
    expect(gradeBand(60).grade).toBe("B+");
    expect(gradeBand(39.5).grade).toBe("F");
  });
  it("keeps at most two attempted parts per question", () => {
    expect(cleanChosen(["1a", "1b", "1c", "2c", "2c", "9z", "6a"])).toEqual(["1a", "1b", "2c"]);
  });
});

describe("clock", () => {
  const start = Date.parse("2026-10-01T10:00:00Z");
  const ends = new Date(start + 3 * 3600_000).toISOString();
  it("counts down and freezes while paused", () => {
    expect(formatClock(remainingMs({ ends_at: ends, paused_at: null, submitted_at: null }, start))).toBe("3:00:00");
    expect(formatClock(remainingMs({ ends_at: ends, paused_at: new Date(start + 60_000).toISOString(), submitted_at: null }, start + 3600_000))).toBe("2:59:00");
    expect(remainingMs({ ends_at: ends, paused_at: null, submitted_at: null }, start + 4 * 3600_000)).toBe(0);
    expect(timeUp({ ends_at: ends, paused_at: null, submitted_at: null }, start + 4 * 3600_000)).toBe(true);
    expect(timeUp({ ends_at: ends, paused_at: null, submitted_at: ends }, start + 4 * 3600_000)).toBe(false);
    expect(formatClock(59_001)).toBe("0:01:00");
  });
});

describe("photo check", () => {
  const rubric = [{ point: "Definition of a perfect truss", marks: 4 }, { point: "Difference table", marks: 6 }];
  it("clamps the examiner's marks to the rubric and recomputes the total", () => {
    const raw = checkResultSchema.parse({
      awarded: [{ point: "Definition of a perfect truss", marks: 9, max: 9, comment: "good" }, { point: "made up", marks: 3, max: 6, comment: "" }, { point: "extra", marks: 5, max: 5, comment: "" }],
      total: 99, max: 99, feedback: ["Draw the truss", " "], legible: true,
    });
    const c = clampCheck(rubric, raw);
    expect(c.awarded.map((a) => a.marks)).toEqual([4, 3]);
    expect(c.awarded.map((a) => a.max)).toEqual([4, 6]);
    expect(c.total).toBe(7);
    expect(c.max).toBe(10);
    expect(c.feedback).toEqual(["Draw the truss"]);
    const neg = clampCheck(rubric, checkResultSchema.parse({ awarded: [{ point: "x", marks: -5, max: 4, comment: "" }], total: 0, max: 10, feedback: [], legible: true }));
    expect(neg.total).toBe(0);
    const blurry = clampCheck(rubric, checkResultSchema.parse({ awarded: [{ point: "x", marks: 4, max: 4, comment: "" }], total: 4, max: 10, feedback: [], legible: false }));
    expect(blurry.total).toBe(0);
  });
  it("reads JSON wrapped in fences and rejects junk", () => {
    expect(extractJson('```json\n{"a":1}\n```')).toEqual({ a: 1 });
    expect(extractJson('Sure! {"a":2} hope that helps')).toEqual({ a: 2 });
    expect(extractJson("nope")).toBeNull();
  });
  it("accepts only real JPEG/PNG/WEBP images within the size limit", () => {
    const jpeg = btoa("\xff\xd8\xff\xe0" + "x".repeat(200));
    expect(parseImage(`data:image/jpeg;base64,${jpeg}`)?.mime).toBe("image/jpeg");
    expect(parseImage(jpeg)?.mime).toBe("image/jpeg");
    const png = btoa("\x89PNG\r\n\x1a\n" + "x".repeat(200));
    expect(parseImage(`data:image/jpeg;base64,${png}`)?.mime).toBe("image/png");
    expect(parseImage(btoa("<svg>" + "x".repeat(200)))).toBeNull();
    expect(parseImage("not base64!!")).toBeNull();
    expect(parseImage(btoa("\xff\xd8\xff" + "x".repeat(1_700_000)))).toBeNull();
  });
});
