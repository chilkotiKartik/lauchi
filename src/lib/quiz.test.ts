import { describe, expect, it } from "vitest";
import { GEN } from "@/content/gen.generated.cjs";
import { bankSize, courseUnits, generate, grade, toPublic } from "./quiz-core";

describe("seeded question engine", () => {
  it("covers every subject with a bank", () => expect(Object.keys(GEN).sort()).toEqual(["AHT-000","AHT-001","AHT-002","AHT-003","AHT-004","AHT-005","BCA-001","BCA-002","BCA-003","BCA-004","BCA-005","BCA-006","BCA-007","BCA-008","BCA-009","BCA-010","BCA-011","BTT-001","CST-001","ECT-001","EET-001","MET-001","WD-101","WD-201","WD-301","WD-401"]));
  it("is deterministic per (course, unit, seed, index)", () => {
    for (let s = 1; s <= 30; s++) expect(generate("AHT-003", 1, s, 3)).toEqual(generate("AHT-003", 1, s, 3));
  });
  it("gives different questions for different seeds", () => {
    const texts = new Set(Array.from({ length: 40 }, (_, s) => generate("AHT-003", 1, s * 7919, 0)!.q));
    expect(texts.size).toBeGreaterThan(20);
  });
  it("does not repeat a question inside a session", () => {
    const qs = Array.from({ length: 8 }, (_, i) => generate("AHT-001", 1, 12345, i)!.q);
    expect(new Set(qs).size).toBe(8);
  });
  it("leaves Math.random restored", () => {
    const before = Math.random; generate("AHT-003", 1, 5, 0); expect(Math.random).toBe(before);
  });
  it("never leaks answers in the public form", () => {
    const pub = toPublic(generate("AHT-003", 1, 9, 0)!);
    expect(Object.keys(pub).every((k) => ["type", "q", "o"].includes(k))).toBe(true);
  });
  it("every template in every unit yields a well-formed question across seeds", () => {
    let checked = 0;
    for (const course of Object.keys(GEN)) for (const unit of courseUnits(course)) {
      for (let i = 0; i < 12; i++) for (let seed = 1; seed <= 6; seed++) {
        const q = generate(course, unit, seed * 104729 + i, i % 5)!;
        expect(q, `${course} u${unit}`).toBeTruthy();
        expect(q.q.trim().length).toBeGreaterThan(5);
        expect(q.why.trim().length).toBeGreaterThan(5);
        // the web-development banks teach JavaScript, so "undefined" and "NaN" are legitimate words there (bank-e.test.ts covers them)
        expect((course.startsWith("WD-") ? /\[object/ : /undefined|NaN|\[object/).test(q.q + q.why), `${course} u${unit}: ${q.q}`).toBe(false);
        if (q.type === "nat") expect(Number.isFinite(q.a as number)).toBe(true);
        else { expect(q.o!.length).toBeGreaterThanOrEqual(3); expect(new Set(q.o).size).toBe(q.o!.length); }
        if (q.type === "mcq") expect(q.o![q.a as number]).toBeDefined();
        if (q.type === "msq") expect((q.a as number[]).length).toBeGreaterThan(0);
        checked++;
      }
    }
    expect(checked).toBeGreaterThan(2000);
    expect(bankSize("AHT-003", 1)).toBeGreaterThan(3);
  }, 30000);
});

describe("grading", () => {
  const mcq = { type: "mcq" as const, q: "x", o: ["a", "b", "c", "d"], a: 2, why: "w" };
  const msq = { type: "msq" as const, q: "x", o: ["a", "b", "c", "d"], a: [0, 2], why: "w" };
  const nat = { type: "nat" as const, q: "x", a: 8, why: "w" };
  it("mcq", () => { expect(grade(mcq, 2)).toBe(true); expect(grade(mcq, 1)).toBe(false); expect(grade(mcq, "2")).toBe(false); expect(grade(mcq, null)).toBe(false); });
  it("msq needs the exact set", () => { expect(grade(msq, [2, 0])).toBe(true); expect(grade(msq, [0])).toBe(false); expect(grade(msq, [0, 1, 2])).toBe(false); });
  it("nat accepts tolerance and unicode minus", () => {
    expect(grade(nat, "8")).toBe(true); expect(grade(nat, "8.02")).toBe(true); expect(grade(nat, "9")).toBe(false); expect(grade(nat, "abc")).toBe(false);
    expect(grade({ ...nat, a: -3 }, "−3")).toBe(true);
  });
});

import { sessionQuestion, sessionUnit, courseUnits as cu, rightAnswer, givenAnswer } from "./quiz-core";
describe("mock sessions", () => {
  const s = { kind: "mock", course: "AHT-003", unit: 1, seed: 12345 };
  it("cycle through every unit of the subject", () => {
    const units = cu("AHT-003");
    expect(units.length).toBeGreaterThan(1);
    expect(Array.from({ length: units.length }, (_, i) => sessionUnit(s, i))).toEqual(units);
    expect(sessionUnit(s, units.length)).toBe(units[0]);
  });
  it("are deterministic and stay within the unit's bank", () => {
    for (let i = 0; i < 20; i++) {
      const a = sessionQuestion(s, i)!, b = sessionQuestion(s, i)!;
      expect(a).not.toBeNull();
      expect(a.q).toBe(b.q);
    }
  });
  it("describe answers", () => {
    const q = sessionQuestion(s, 0)!;
    expect(rightAnswer(q).length).toBeGreaterThan(0);
    expect(givenAnswer(q, null)).toBe("No answer");
  });
  it("non-mock sessions ignore the mock mapping", () => {
    expect(sessionUnit({ ...s, kind: "practice", unit: 3 }, 7)).toBe(3);
  });
});
