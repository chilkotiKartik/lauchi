import { describe, expect, it } from "vitest";
import { LESSONS } from "@/content/lessons";
import { emptyLesson, validateLesson } from "./cms-lessons";
import { validateLabQuestion, rowToQuestion } from "./cms-lab";

const good = () => JSON.parse(JSON.stringify(LESSONS["AHT-003:1:1"]));

describe("validateLesson", () => {
  it("accepts every built-in lesson shape", () => {
    for (const [k, l] of Object.entries(LESSONS)) { const v = validateLesson(JSON.parse(JSON.stringify(l))); expect(v.ok, `${k}: ${v.errors.join("; ")}`).toBe(true); }
  });
  it("rejects raw html", () => {
    const l = good(); l.intro = l.intro + " <script>alert(1)</script>";
    expect(validateLesson(l, { strict: false }).ok).toBe(false);
    const m = good(); m.mistakes[0] = "ok <b>bold</b> and H<sub>2</sub>O";
    expect(validateLesson(m).ok).toBe(true);
  });
  it("enforces the publish minimums only when strict", () => {
    const blank = emptyLesson();
    expect(validateLesson(blank, { strict: false }).ok).toBe(true);
    const v = validateLesson(blank, { strict: true });
    expect(v.ok).toBe(false);
    const short = good(); short.sections = short.sections.slice(0, 1);
    expect(validateLesson(short).errors.join(" ")).toMatch(/2 sections/);
  });
  it("checks answer range, duplicate options and lab ids", () => {
    const a = good(); a.check[0].a = a.check[0].o.length;
    expect(validateLesson(a).errors.join(" ")).toMatch(/correct option/);
    const b = good(); b.check[0].o[1] = b.check[0].o[0];
    expect(validateLesson(b).errors.join(" ")).toMatch(/different/);
    const c = good(); c.lab = { id: "no-such-lab", label: "x" };
    expect(validateLesson(c).errors.join(" ")).toMatch(/lab/);
  });
  it("drops blank lines and rejects wrong types", () => {
    const l = good(); l.mistakes = [...l.mistakes, "   ", ""];
    const v = validateLesson(l); expect(v.ok && v.lesson.mistakes.length).toBe(good().mistakes.length);
    expect(validateLesson({ intro: 5 }).ok).toBe(false);
    expect(validateLesson(null).ok).toBe(false);
  });
});

describe("validateLabQuestion", () => {
  const base = { prompt: "What happens to the period when length doubles?", marks: 2, solution: ["T is proportional to the square root of L"], explanation: "Period grows by root two." };
  it("accepts mcq, tf and numeric", () => {
    expect(validateLabQuestion({ ...base, type: "mcq", options: ["a", "b"], answer: 1 }).ok).toBe(true);
    expect(validateLabQuestion({ ...base, type: "tf", answer: false }).ok).toBe(true);
    expect(validateLabQuestion({ ...base, type: "numeric", answer: 1.41, tolerance: 0.02, unit: "" }).ok).toBe(true);
  });
  it("rejects bad answers, duplicates, html and non-numbers", () => {
    expect(validateLabQuestion({ ...base, type: "mcq", options: ["a", "b"], answer: 2 }).ok).toBe(false);
    expect(validateLabQuestion({ ...base, type: "mcq", options: ["a", "a"], answer: 0 }).ok).toBe(false);
    expect(validateLabQuestion({ ...base, prompt: "<img src=x onerror=1> hello there", type: "tf", answer: true }).ok).toBe(false);
    expect(validateLabQuestion({ ...base, type: "numeric", answer: null, tolerance: 0 }).ok).toBe(false);
    expect(validateLabQuestion({ ...base, type: "numeric", answer: 1, tolerance: -1 }).ok).toBe(false);
  });
  it("turns a row into a prefixed question and skips malformed rows", () => {
    const q = rowToQuestion({ id: "abc", payload: { ...base, type: "tf", answer: true } });
    expect(q?.id).toBe("cms-abc");
    expect(rowToQuestion({ id: "x", payload: { type: "tf" } })).toBeNull();
  });
});
