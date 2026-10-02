import { describe, expect, it } from "vitest";
import { courseUnits, generate } from "./quiz-core";
import { GEN } from "@/content/gen.generated.cjs";
import { splitSteps } from "./steps";

const norm = (s: string) => s.replace(/\s+/g, " ").trim();
const balanced = (s: string) => ["sub", "sup"].every((t) => (s.match(new RegExp(`<${t}>`, "g")) ?? []).length === (s.match(new RegExp(`</${t}>`, "g")) ?? []).length);

describe("splitSteps", () => {
  it("splits sentences and semicolons but not decimals, abbreviations, entities or <sub>/<sup>", () => {
    expect(splitSteps("τ = L/R = 0.8 s; final current V/R = 4.8 A. Then i = 1.062 A.")).toEqual(["τ = L/R = 0.8 s;", "final current V/R = 4.8 A.", "Then i = 1.062 A."]);
    expect(splitSteps("γ = 0.0031, i.e. 0.31%. Small ripple.")).toEqual(["γ = 0.0031, i.e. 0.31%.", "Small ripple."]);
    expect(splitSteps("For e.g. Newton's rings use 1.52. Done here.")).toEqual(["For e.g. Newton's rings use 1.52.", "Done here."]);
    expect(splitSteps("If P &lt; M/2 then CO₃ = 2P. Next step here.")).toEqual(["If P &lt; M/2 then CO₃ = 2P.", "Next step here."]);
    expect(splitSteps("Use V<sub>a. b</sub> here. Then stop.")).toEqual(["Use V<sub>a. b</sub> here.", "Then stop."]);
    expect(splitSteps("Case (P = 0: only HCO₃; P = M: only OH.) Then add.")).toEqual(["Case (P = 0: only HCO₃; P = M: only OH.)", "Then add."]);
    expect(splitSteps("E. coli K-12 is a strain. Others exist.")).toEqual(["E. coli K-12 is a strain.", "Others exist."]);
    expect(splitSteps("V<sub>L</sub> = 12 V. I<sub>R</sub> = 6 mA.")).toEqual(["V<sub>L</sub> = 12 V.", "I<sub>R</sub> = 6 mA."]);
    expect(splitSteps("f(x) = x is odd, so a₀ = 0 on the interval.")).toEqual(["f(x) = x is odd,", "so a₀ = 0 on the interval."]);
  });
  it("handles empty and one-sentence text", () => {
    expect(splitSteps("  ")).toEqual([]);
    expect(splitSteps("Just one fact.")).toEqual(["Just one fact."]);
  });
  it("on real generated questions: steps are non-empty, ordered and join back to the original", () => {
    let checked = 0, multi = 0;
    for (const course of Object.keys(GEN)) for (const unit of courseUnits(course)) for (const seed of [7, 99991]) for (const i of [0, 3]) {
      const q = generate(course, unit, seed, i)!;
      const steps = splitSteps(q.why);
      expect(steps.length, q.why).toBeGreaterThan(0);
      for (const s of steps) { expect(s.trim().length, q.why).toBeGreaterThan(0); expect(balanced(s), s).toBe(true); expect(s).not.toMatch(/^\.\d/); }
      expect(steps.join(" "), q.why).toBe(norm(q.why));
      if (steps.length > 1) multi++;
      checked++;
    }
    expect(checked).toBeGreaterThanOrEqual(20);
    expect(multi).toBeGreaterThan(checked / 4);
  });
});
