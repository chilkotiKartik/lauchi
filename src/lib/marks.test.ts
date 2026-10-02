import { describe, expect, it } from "vitest";
import { gradeFor, needed, predict, sessional, sgpa } from "./marks";

const S = { ct: 30, ta: 20, ese: 100 };
describe("marks maths (30 + 20 + 100)", () => {
  it("adds sessional marks and caps each part", () => {
    expect(sessional(S, 24, 16)).toBe(40);
    expect(sessional(S, 99, 99)).toBe(50);
    expect(sessional(S, -5, 3)).toBe(3);
  });
  it("needs 30 in the end sem even when sessional is strong", () => {
    expect(needed(S, 30, 20, 90).pass).toBe(30); // 50 + 30 = 80 of 150 clears 40% (60), but the end-sem floor is 30
  });
  it("computes what a pass and an A+ need", () => {
    const n = needed(S, 20, 12, 85); // sessional 32
    expect(n.sessional).toBe(32);
    expect(n.pass).toBe(30);        // 60 - 32 = 28, floored at 30
    expect(n.target).toBe(96);      // 0.85 * 150 = 127.5 -> 128 - 32 = 96
  });
  it("says unreachable when even full marks are not enough", () => {
    expect(needed(S, 0, 0, 90).target).toBeNull(); // 135 > 100
    expect(needed(S, 0, 0, 40).pass).toBe(60);
  });
  it("grades by percentage and fails below the end-sem floor", () => {
    expect(gradeFor(90)[0]).toBe("O"); expect(gradeFor(89.9)[0]).toBe("A+"); expect(gradeFor(39.9)[0]).toBe("F");
    const p = predict(S, 30, 20, 29); // 79 of 150 = 52.7%, but 29 < 30 in the end sem
    expect(p.passed).toBe(false); expect(p.grade).toBe("F"); expect(p.points).toBe(0);
    const q = predict(S, 25, 15, 80); // 120/150 = 80%
    expect(q.grade).toBe("A"); expect(q.passed).toBe(true); expect(q.total).toBe(120);
  });
  it("works for other schemes (15 + 10 + 50)", () => {
    const t = { ct: 15, ta: 10, ese: 50 };
    expect(needed(t, 10, 5, 80).target).toBe(Math.ceil(0.8 * 75 - 15));
    expect(predict(t, 15, 10, 50).grade).toBe("O");
  });
  it("SGPA weighs by credits and ignores empty input", () => {
    expect(sgpa([{ points: 10, credits: 4 }, { points: 6, credits: 4 }])).toBe(8);
    expect(sgpa([{ points: 9, credits: 3 }, { points: 5, credits: 1 }])).toBe(8);
    expect(sgpa([])).toBeNull();
    expect(sgpa([{ points: 8, credits: 0 }])).toBeNull();
  });
});
