import { describe, expect, it } from "vitest";
import { LAB_MAP, PYQ_CODES, SHORT, countQuestions, getPyq, pyqCodesFor } from "./pyq";

const FIRST_YEAR = ["AHT-001", "AHT-002", "EET-001", "ECT-001", "MET-001", "AHT-003", "AHT-005", "CST-001"];

const strings = (x: unknown): string[] => (typeof x === "string" ? [x] : Array.isArray(x) ? x.flatMap(strings) : x && typeof x === "object" ? Object.values(x).flatMap(strings) : []);

describe("pyq bank", () => {
  it("loads the core five first, then the rest alphabetically", () => {
    expect(PYQ_CODES.slice(0, 5)).toEqual(FIRST_YEAR.slice(0, 5));
    const rest = PYQ_CODES.slice(5);
    expect(rest).toEqual([...rest].sort());
    for (const c of FIRST_YEAR) expect(PYQ_CODES).toContain(c);
    expect(new Set(PYQ_CODES).size).toBe(PYQ_CODES.length);
  });

  it("filters codes with pyqCodesFor", () => {
    expect(pyqCodesFor((c) => c === "CST-001")).toEqual(["CST-001"]);
    expect(pyqCodesFor(() => true)).toEqual(PYQ_CODES);
  });

  for (const code of FIRST_YEAR) {
    it(`${code} is well formed`, () => {
      const s = getPyq(code)!;
      expect(s).not.toBeNull();
      expect(SHORT[code]).toBeTruthy();
      expect(s.units).toHaveLength(5);
      expect(countQuestions(s)).toBeGreaterThan(0);
      expect(Array.isArray(s.priority)).toBe(true);
      const bad = /\[cite|\\|\$|`/;
      const num = /^\d+( to \d+)?$/;
      for (const u of s.units) {
        expect(u.pyqs.length).toBeGreaterThanOrEqual(1);
        expect(Array.isArray(u.predicted)).toBe(true);
        for (const t of strings(u)) expect(t).not.toMatch(bad);
        for (const q of u.pyqs) {
          expect(q.marks === null || num.test(q.marks)).toBe(true);
          for (const p of q.parts) expect(p.marks === null || num.test(p.marks)).toBe(true);
        }
      }
      for (const u of s.units) for (const l of u.labs) expect(LAB_MAP[`${code}:${l.id}`] ?? []).toBeInstanceOf(Array);
    });
  }

  it("maps every new-subject lab blueprint", () => {
    for (const code of ["AHT-003", "AHT-005", "CST-001"]) for (const u of getPyq(code)!.units) for (const l of u.labs) expect(LAB_MAP[`${code}:${l.id}`]?.length).toBeGreaterThan(0);
  });
});
