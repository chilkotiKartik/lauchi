import { describe, expect, it } from "vitest";
import { buildContext, CONTEXT_BUDGET, parseCtx, parseMcq, systemWith, SYSTEM_BASE } from "./tutor";

const unit = { n: 3, title: "Transformers", topics: ["EMF equation", "Losses"], formulas: ["E = 4.44 f N phi"], hints: ["Draw the phasor diagram"] };
const m = (n: number) => ({ q: `Question ${n} ` + "x".repeat(50), given: "A", right: "B", why: "because " + n });

describe("buildContext", () => {
  it("is empty without inputs", () => expect(buildContext({})).toEqual({ text: "", sources: [] }));
  it("includes syllabus, mistakes, pyq and model answer with chip labels", () => {
    const r = buildContext({
      unit, mistakes: [m(1), m(2), m(3)],
      pyq: { id: "Q3.2", title: "EMF", text: "Derive the EMF equation." },
      answer: { marks: 5, rubric: [{ point: "Flux", marks: 2 }], answer: ["Step <b>1</b>"], result: "E=4.44" },
    });
    expect(r.sources).toEqual(["PYQ Q3.2", "PYQ Q3.2 model answer", "your last 3 mistakes", "Unit 3 syllabus"]);
    expect(r.text).toContain("EMF equation");
    expect(r.text).toContain("Step 1");
    expect(r.text).not.toContain("<b>");
  });
  it("puts the opened mistake first and singularises the label", () => {
    const r = buildContext({ focusMistake: m(9), mistakes: [m(1)], unit });
    expect(r.sources[0]).toBe("the question you got wrong");
    expect(r.sources).toContain("your last 1 mistake");
    expect(r.text.indexOf("Question 9")).toBeLessThan(r.text.indexOf("SYLLABUS"));
  });
  it("stays within the budget and drops low-priority sections first", () => {
    const big = "word ".repeat(3000);
    const r = buildContext({ pyq: { id: "Q1.1", title: "t", text: big }, unit, mistakes: [m(1)] });
    expect(r.text.length).toBeLessThanOrEqual(CONTEXT_BUDGET);
    expect(r.sources[0]).toBe("PYQ Q1.1");
    expect(r.text.endsWith("…") || r.sources.length < 3).toBe(true);
    expect(buildContext({ unit }, 100).text.length).toBeLessThanOrEqual(100);
  });
  it("uses lesson text when present", () => {
    const r = buildContext({ topic: { title: "Losses", lesson: { intro: "Intro text", sections: [{ h: "Iron", p: ["core loss"], formula: ["Pi"] }] } } });
    expect(r.sources).toEqual(["lesson: Losses"]);
    expect(r.text).toContain("core loss");
  });
});

describe("parseCtx", () => {
  it("accepts valid params and drops invalid ones", () => {
    expect(parseCtx({ course: "EET-001", unit: "3", pyq: "Q3.2", topic: "x", mistake: "../etc" })).toEqual({ course: "EET-001", unit: 3, pyq: "Q3.2" });
    expect(parseCtx({ q: "hi" })).toBeNull();
    expect(parseCtx(null)).toBeNull();
    expect(parseCtx({ course: ["EET-001"] })).toEqual({ course: "EET-001" });
  });
});

describe("parseMcq / systemWith", () => {
  const ok = { question: "What is 2+2?", options: ["1", "2", "3", "4"], answer: 3, explanation: "Because." };
  it("validates and tolerates code fences", () => {
    expect(parseMcq(JSON.stringify(ok))).toEqual(ok);
    expect(parseMcq("```json\n" + JSON.stringify(ok) + "\n```")).toEqual(ok);
    expect(parseMcq(JSON.stringify({ ...ok, answer: 4 }))).toBeNull();
    expect(parseMcq(JSON.stringify({ ...ok, options: ["a", "b"] }))).toBeNull();
    expect(parseMcq("not json")).toBeNull();
  });
  it("appends context only when there is some", () => {
    expect(systemWith("")).toBe(SYSTEM_BASE);
    expect(systemWith("## X\nbody")).toContain("outside it, still help");
  });
});
