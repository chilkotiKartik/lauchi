import { describe, expect, it } from "vitest";
import { evaluateStep, formatDuration, gradeQuestion, parseNumber, scoreAttempt, type StepContext } from "./engine";
import type { Question } from "./types";

const ctx = (o: Partial<StepContext> = {}): StepContext => ({ params: { RL: 10, proc: "isobaric", useDc: false }, baseline: { RL: 10, proc: "isobaric", useDc: false }, resets: 0, baseResets: 0, presets: 0, basePresets: 0, lastPreset: null, ...o });

describe("evaluateStep", () => {
  it("changed compares with the value at experiment start", () => {
    expect(evaluateStep({ kind: "param", key: "RL", op: "changed" }, ctx())).toBe(false);
    expect(evaluateStep({ kind: "param", key: "RL", op: "changed" }, ctx({ params: { RL: 11 } }))).toBe(true);
    expect(evaluateStep({ kind: "param", key: "RL", op: "changed" }, ctx({ baseline: null }))).toBe(false);
  });
  it("numeric comparisons only apply to numbers", () => {
    expect(evaluateStep({ kind: "param", key: "RL", op: "gte", value: 10 }, ctx())).toBe(true);
    expect(evaluateStep({ kind: "param", key: "RL", op: "gte", value: 11 }, ctx())).toBe(false);
    expect(evaluateStep({ kind: "param", key: "RL", op: "lte", value: 10 }, ctx())).toBe(true);
    expect(evaluateStep({ kind: "param", key: "proc", op: "gte", value: 1 }, ctx())).toBe(false);
  });
  it("eq and neq work for strings and booleans", () => {
    expect(evaluateStep({ kind: "param", key: "proc", op: "eq", value: "isobaric" }, ctx())).toBe(true);
    expect(evaluateStep({ kind: "param", key: "proc", op: "neq", value: "isobaric" }, ctx())).toBe(false);
    expect(evaluateStep({ kind: "param", key: "useDc", op: "eq", value: true }, ctx({ params: { useDc: true } }))).toBe(true);
  });
  it("is false with no live lab or an unknown key", () => {
    expect(evaluateStep({ kind: "param", key: "RL", op: "neq", value: 1 }, ctx({ params: null }))).toBe(false);
    expect(evaluateStep({ kind: "param", key: "zzz", op: "neq", value: 1 }, ctx())).toBe(false);
  });
  it("preset and reset compare counters", () => {
    expect(evaluateStep({ kind: "reset" }, ctx())).toBe(false);
    expect(evaluateStep({ kind: "reset" }, ctx({ resets: 1 }))).toBe(true);
    expect(evaluateStep({ kind: "preset" }, ctx({ presets: 1, lastPreset: "A" }))).toBe(true);
    expect(evaluateStep({ kind: "preset", name: "B" }, ctx({ presets: 1, lastPreset: "A" }))).toBe(false);
    expect(evaluateStep({ kind: "preset", name: "A" }, ctx({ presets: 1, lastPreset: "A" }))).toBe(true);
    expect(evaluateStep({ kind: "preset" }, ctx({ presets: 2, basePresets: 2 }))).toBe(false);
  });
  it("manual needs the tick", () => {
    expect(evaluateStep({ kind: "manual" }, ctx())).toBe(false);
    expect(evaluateStep({ kind: "manual" }, ctx({ manual: true }))).toBe(true);
  });
});

const base = { id: "q", prompt: "p", marks: 2, solution: ["a", "b"], explanation: "e" };
const mcq: Question = { ...base, type: "mcq", options: ["a", "b", "c"], answer: 1 };
const tf: Question = { ...base, type: "tf", answer: false };
const numq: Question = { ...base, type: "numeric", answer: 19.78, tolerance: 0.1 };

describe("gradeQuestion", () => {
  it("grades mcq by index", () => { expect(gradeQuestion(mcq, 1)).toBe(true); expect(gradeQuestion(mcq, 0)).toBe(false); expect(gradeQuestion(mcq, null)).toBe(false); });
  it("grades true/false", () => { expect(gradeQuestion(tf, false)).toBe(true); expect(gradeQuestion(tf, true)).toBe(false); });
  it("grades numeric within an absolute tolerance, accepting text", () => {
    expect(gradeQuestion(numq, 19.85)).toBe(true);
    expect(gradeQuestion(numq, "19,7")).toBe(true);
    expect(gradeQuestion(numq, 19.9)).toBe(false);
    expect(gradeQuestion(numq, "abc")).toBe(false);
    expect(gradeQuestion(numq, "")).toBe(false);
  });
});

describe("parseNumber", () => {
  it("parses plain numbers only", () => {
    expect(parseNumber(" -2.5 ")).toBe(-2.5);
    expect(parseNumber("−3")).toBe(-3);
    expect(parseNumber("1e3")).toBe(1000);
    expect(parseNumber("1.2.3")).toBeNull();
    expect(parseNumber("12 V")).toBeNull();
  });
});

describe("scoreAttempt", () => {
  it("full marks", () => {
    const s = scoreAttempt([mcq], { q: { correct: true, hintUsed: false } });
    expect(s.total).toBe(2);
    expect(s.percent).toBe(100);
  });
  it("hint costs half the marks", () => {
    const qa = { ...mcq, id: "a" }, qb = { ...mcq, id: "b", marks: 2 };
    const s = scoreAttempt([qa, qb], { a: { correct: true, hintUsed: true }, b: { correct: true, hintUsed: false } });
    expect(s.earned).toBe(3); expect(s.total).toBe(4); expect(s.percent).toBe(75); expect(s.passed).toBe(true);
  });
  it("wrong and unanswered earn nothing; pass mark respected", () => {
    const qa = { ...mcq, id: "a" }, qb = { ...tf, id: "b" };
    const s = scoreAttempt([qa, qb], { a: { correct: false, hintUsed: false } });
    expect(s.earned).toBe(0); expect(s.passed).toBe(false);
    expect(scoreAttempt([qa, qb], { a: { correct: true, hintUsed: false } }, 50).passed).toBe(true);
    expect(scoreAttempt([], {}).percent).toBe(0);
  });
});

describe("formatDuration", () => { it("formats", () => { expect(formatDuration(45_000)).toBe("45 s"); expect(formatDuration(65_000)).toBe("1 min 05 s"); }); });
