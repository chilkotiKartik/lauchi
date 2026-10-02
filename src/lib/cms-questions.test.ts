import { describe, expect, it } from "vitest";
import { describeAnswer, gradeAnswer, matchesSearch, paginate, parseCsv, parseImport, questionSchema } from "./cms-questions-core";

const base = { course: "AHT-001", unit: 1, stem: "Which is a vector?", explanation: "", steps: [], difficulty: 2, tags: [] };

describe("questionSchema", () => {
  it("accepts a valid mcq", () => expect(questionSchema.safeParse({ ...base, kind: "mcq", options: ["Mass", "Velocity"], answer: 1 }).success).toBe(true));
  it("needs 2-6 options and an in-range answer", () => {
    expect(questionSchema.safeParse({ ...base, kind: "mcq", options: ["Only"], answer: 0 }).success).toBe(false);
    expect(questionSchema.safeParse({ ...base, kind: "mcq", options: ["a", "b", "c", "d", "e", "f", "g"], answer: 0 }).success).toBe(false);
    expect(questionSchema.safeParse({ ...base, kind: "mcq", options: ["a", "b"], answer: 2 }).success).toBe(false);
    expect(questionSchema.safeParse({ ...base, kind: "mcq", options: ["a", "A"], answer: 0 }).success).toBe(false);
  });
  it("validates multi, tf and numeric", () => {
    expect(questionSchema.safeParse({ ...base, kind: "multi", options: ["a", "b", "c"], answer: [0, 2] }).success).toBe(true);
    expect(questionSchema.safeParse({ ...base, kind: "multi", options: ["a", "b", "c"], answer: [0, 0] }).success).toBe(false);
    expect(questionSchema.safeParse({ ...base, kind: "multi", options: ["a", "b"], answer: [3] }).success).toBe(false);
    expect(questionSchema.safeParse({ ...base, kind: "tf", options: ["True", "False"], answer: 0 }).success).toBe(true);
    expect(questionSchema.safeParse({ ...base, kind: "tf", options: ["Yes", "No"], answer: 0 }).success).toBe(false);
    expect(questionSchema.safeParse({ ...base, kind: "numeric", options: [], answer: { value: 9.8, tol: 0.1 } }).success).toBe(true);
    expect(questionSchema.safeParse({ ...base, kind: "numeric", options: [], answer: { value: 9.8, tol: -1 } }).success).toBe(false);
    expect(questionSchema.safeParse({ ...base, kind: "numeric", options: ["a", "b"], answer: { value: 1, tol: 0 } }).success).toBe(false);
  });
});

describe("gradeAnswer", () => {
  it("grades each kind", () => {
    expect(gradeAnswer("mcq", 1, 1)).toBe(true);
    expect(gradeAnswer("mcq", 1, 0)).toBe(false);
    expect(gradeAnswer("mcq", 1, [1])).toBe(false);
    expect(gradeAnswer("multi", [0, 2], [2, 0])).toBe(true);
    expect(gradeAnswer("multi", [0, 2], [0])).toBe(false);
    expect(gradeAnswer("multi", [0, 2], [0, 2, 2])).toBe(false);
    expect(gradeAnswer("tf", 0, 0)).toBe(true);
  });
  it("applies numeric tolerance and accepts a decimal comma", () => {
    const a = { value: 9.8, tol: 0.1 };
    expect(gradeAnswer("numeric", a, "9,85")).toBe(true);
    expect(gradeAnswer("numeric", a, "9.95")).toBe(false);
    expect(gradeAnswer("numeric", a, "abc")).toBe(false);
    expect(gradeAnswer("numeric", a, "")).toBe(false);
    expect(gradeAnswer("numeric", { value: 3, tol: 0 }, "3")).toBe(true);
  });
  it("describes answers", () => {
    expect(describeAnswer("mcq", ["a", "b"], 1)).toBe("b");
    expect(describeAnswer("numeric", [], { value: 2, tol: 0.5 })).toBe("2 (± 0.5)");
  });
});

describe("csv import", () => {
  it("parses quotes, commas and newlines", () => {
    const rows = parseCsv('a,"b, c","d ""q"""\n1,2,"x\ny"\n');
    expect(rows[0].cells).toEqual(["a", "b, c", 'd "q"']);
    expect(rows[1].cells).toEqual(["1", "2", "x\ny"]);
  });
  const header = "course,unit,kind,stem,options,answer,tolerance,explanation,steps,difficulty,tags\n";
  it("imports valid rows of every kind", () => {
    const csv = header + [
      'AHT-001,1,mcq,"Which is a vector?",Mass|Velocity,B,,Velocity has direction,,1,vectors',
      "AHT-001,1,multi,Pick vectors,Force|Mass|Velocity,A|C,,,s1|s2,2,",
      "AHT-001,2,tf,Light is a wave,,true,,,,3,",
      "AHT-001,2,numeric,g in m/s2?,,9.8,0.1,,,2,",
    ].join("\n");
    const r = parseImport(csv);
    expect(r.errors).toEqual([]);
    expect(r.rows).toHaveLength(4);
    expect(r.rows[0].answer).toBe(1);
    expect(r.rows[1].answer).toEqual([0, 2]);
    expect(r.rows[1].steps).toEqual(["s1", "s2"]);
    expect(r.rows[2].options).toEqual(["True", "False"]);
    expect(r.rows[3].answer).toEqual({ value: 9.8, tol: 0.1 });
  });
  it("is all-or-nothing and reports line numbers", () => {
    const csv = header + "AHT-001,1,mcq,Good one,a|b,A,,,,2,\nAHT-001,1,mcq,Bad one,a,A,,,,2,\nAHT-001,1,mcq,Short\n";
    const r = parseImport(csv);
    expect(r.rows).toEqual([]);
    expect(r.errors.map((e) => e.line)).toEqual([3, 4]);
  });
  it("checks the course and unit exist", () => {
    const r = parseImport("AHT-001,9,mcq,Question here,a|b,A,,,,2,", (c, u) => c === "AHT-001" && u <= 5);
    expect(r.errors[0].message).toMatch(/doesn't exist/);
  });
  it("rejects empty input", () => expect(parseImport("  \n").errors).toHaveLength(1));
});

describe("helpers", () => {
  it("searches stem and tags", () => {
    expect(matchesSearch({ stem: "Gauss law", tags: ["electro"] }, "gauss")).toBe(true);
    expect(matchesSearch({ stem: "x", tags: ["electro"] }, "ELEC")).toBe(true);
    expect(matchesSearch({ stem: "x", tags: [] }, "zzz")).toBe(false);
  });
  it("paginates 20 per page and clamps", () => {
    const all = Array.from({ length: 45 }, (_, i) => i);
    expect(paginate(all, 1).items).toHaveLength(20);
    expect(paginate(all, 3).items).toHaveLength(5);
    expect(paginate(all, 99).page).toBe(3);
    expect(paginate([], 1).pages).toBe(1);
  });
});
