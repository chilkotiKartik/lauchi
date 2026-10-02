import { describe, expect, it } from "vitest";
import { addDays, dueIn, forecast, GAPS, indiaToday, parsePyqRef, parseQuizRef, pyqRef, quizRef, schedule, titleSnippet } from "./revise";
import { fromTemplate, generateAt } from "./quiz-core";

describe("revise queue", () => {
  it("climbs 1 → 3 → 7 → 21 → 60 days and stays at 60", () => {
    let st = 0; const gaps: number[] = []; const today = "2026-10-01";
    for (let k = 0; k < 6; k++) { const n = schedule(st, true, today); gaps.push((Date.parse(n.due) - Date.parse(today)) / 86_400_000); st = n.step; }
    expect(gaps).toEqual([3, 7, 21, 60, 60, 60]);
    expect(GAPS).toEqual([1, 3, 7, 21, 60]);
  });
  it("a wrong review resets to step 0, due tomorrow", () => {
    expect(schedule(3, false, "2026-12-31")).toEqual({ step: 0, due: "2027-01-01" });
  });
  it("uses the India day", () => {
    expect(indiaToday(new Date("2026-10-01T19:00:00Z"))).toBe("2026-10-02");
    expect(indiaToday(new Date("2026-10-01T18:00:00Z"))).toBe("2026-10-01");
    expect(addDays("2026-02-28", 1)).toBe("2026-03-01");
    expect(dueIn("2026-10-04", "2026-10-01")).toBe("in 3 days");
    expect(dueIn("2026-10-02", "2026-10-01")).toBe("tomorrow");
  });
  it("round-trips refs, and a quiz ref rebuilds the exact question", () => {
    const g = generateAt("AHT-001", 2, -123456789, 4)!;
    const ref = quizRef("AHT-001", 2, g.t, g.s);
    const p = parseQuizRef(ref)!;
    expect(fromTemplate(p.course, p.unit, p.t, p.s)).toEqual(g.q);
    expect(parseQuizRef("AHT-001:2:x:5")).toBeNull();
    expect(parsePyqRef(pyqRef("MET-001", "Q4.1"))).toEqual({ code: "MET-001", id: "Q4.1" });
    expect(parsePyqRef("MET-001:<x>")).toBeNull();
  });
  it("forecasts 7 days, overdue counted today", () => {
    const f = forecast(["2026-09-20", "2026-10-01", "2026-10-02", "2026-10-02", "2026-10-07", "2026-10-08"], "2026-10-01");
    expect(f.map((d) => d.n)).toEqual([2, 2, 0, 0, 0, 0, 1]);
    expect(f[0].label).toBe("Today");
  });
  it("makes short plain titles", () => {
    expect(titleSnippet("V<sub>T</sub> &lt; 2 V")).toBe("VT < 2 V");
    expect(titleSnippet("x".repeat(300)).length).toBe(140);
  });
});
