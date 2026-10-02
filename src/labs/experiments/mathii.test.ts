import { describe, expect, it } from "vitest";
import { MATHII_EXPERIMENTS } from "./mathii";
import { MATHII_LABS } from "../meta/mathii";
import { MATHII_SPECS } from "../meta/mathii.specs";
import { cooling, coolingK, timeTo, ceRoots, ceY, vpWronskian, VP, vpSolve, parDeduce, parNorm, ucSup, ucNeeded, pdeRoots, ciContour, ciDeriv, resPoles, resInside, realExact, realNumeric, exactLab } from "../sim/mathii";

const E = Object.fromEntries(MATHII_EXPERIMENTS.map((e) => [e.labId, e]));
const num = (lab: string, id: string) => { const q = E[lab].questions.find((x) => x.id === id); if (!q || q.type !== "numeric") throw new Error(id); return q; };
const close = (lab: string, id: string, v: number) => { const q = num(lab, id); expect(Math.abs(q.answer - v)).toBeLessThanOrEqual(Math.max(q.tolerance, 1e-9)); };

describe("MATHII experiments", () => {
  it("cover at least half of the labs and reference real labs, unique ids", () => {
    expect(MATHII_EXPERIMENTS.length).toBeGreaterThanOrEqual(MATHII_LABS.length / 2);
    const ids = new Set(MATHII_LABS.map((l) => l.id));
    const qids = new Set<string>();
    for (const e of MATHII_EXPERIMENTS) {
      expect(ids.has(e.labId)).toBe(true);
      expect(e.steps.length).toBeGreaterThanOrEqual(5); expect(e.steps.length).toBeLessThanOrEqual(8);
      expect(e.questions.length).toBeGreaterThanOrEqual(4); expect(e.questions.length).toBeLessThanOrEqual(6);
      for (const q of e.questions) { expect(qids.has(q.id)).toBe(false); qids.add(q.id); expect(q.solution.length).toBeGreaterThan(0); }
    }
  });
  it("step checks refer to real params, options and presets", () => {
    for (const e of MATHII_EXPERIMENTS) {
      const spec = MATHII_SPECS[e.labId as keyof typeof MATHII_SPECS] as Record<string, { kind?: string; min?: number; max?: number; options?: readonly string[] }>;
      const lab = MATHII_LABS.find((l) => l.id === e.labId)!;
      for (const s of e.steps) {
        if (s.check.kind === "param") {
          const sp = spec[s.check.key]; expect(sp, `${e.labId}.${s.check.key}`).toBeDefined();
          const v = s.check.value;
          if (typeof v === "number" && sp.min !== undefined && sp.max !== undefined) {
            if (s.check.op === "gte") expect(v).toBeLessThanOrEqual(sp.max);
            if (s.check.op === "lte") expect(v).toBeGreaterThanOrEqual(sp.min);
          }
          if (typeof v === "string" && sp.options) expect(sp.options).toContain(v);
        }
        if (s.check.kind === "preset" && s.check.name) expect(lab.presets.map((p) => p.name)).toContain(s.check.name);
      }
    }
  });
  it("exactode", () => {
    close("exactode", "exactode-q1", exactLab("q13a", "one", 1.2, 1).My);
    close("exactode", "exactode-q4", exactLab("q13a", "one", 1.2, 1).phi!);
    expect(exactLab("q13b", "x2y2", 1.2, 1).exact).toBe(true);
    expect(exactLab("q13d", "y4", 1.2, 1).exact).toBe(true);
    expect(exactLab("ydxxdy", "one", 1.2, 1).exact).toBe(false);
  });
  it("cooling", () => {
    const k = coolingK(100, 80, 30, 10);
    close("cooling", "cooling-q1", k);
    close("cooling", "cooling-q2", cooling(100, 30, k, 20).T);
    close("cooling", "cooling-q3", timeTo(100, 30, 0.034, 60));
    close("cooling", "cooling-q4", cooling(90, 20, 0.1, 0).half);
    expect(cooling(20, 40, 0.08, 500).T).toBeLessThanOrEqual(40);
  });
  it("cauchyeuler", () => {
    close("cauchyeuler", "cauchyeuler-q1", ceRoots(-3, 4).m1);
    expect(ceRoots(-3, 5)).toMatchObject({ kind: "complex", alpha: 2, beta: 1 });
    close("cauchyeuler", "cauchyeuler-q3", ceY(-3, 4, 1, 0, 3));
    close("cauchyeuler", "cauchyeuler-q5", ceY(0, -1, 1, 1, 2));
    expect(ceRoots(1, -1).kind).toBe("real");
  });
  it("varparam", () => {
    close("varparam", "varparam-q1", vpWronskian(VP.q21a, 1));
    close("varparam", "varparam-q2", vpWronskian(VP.q21b, 1));
    const x = 0.6; close("varparam", "varparam-q3", Math.cos(x) * Math.log(Math.cos(x)) + x * Math.sin(x));
    expect(Math.abs(vpSolve("secx", x).yp - (Math.cos(x) * Math.log(Math.cos(x)) + x * Math.sin(x)))).toBeLessThan(0.005);
  });
  it("parseval", () => {
    close("parseval", "parseval-q1", parDeduce("x", 5).exact);
    close("parseval", "parseval-q2", parDeduce("x", 5).est);
    close("parseval", "parseval-q3", parNorm("x"));
    close("parseval", "parseval-q4", parDeduce("sq", 8).exact);
    expect(Math.abs(parDeduce("xsq", 6).exact - parDeduce("xsq", 6).est)).toBeLessThan(Math.abs(parDeduce("x", 5).exact - parDeduce("x", 5).est));
  });
  it("uniformconv", () => {
    close("uniformconv", "uniformconv-q1", ucSup("xn", 5, 0.9));
    close("uniformconv", "uniformconv-q2", ucNeeded("xn", 0.9, 0.1)!);
    expect(ucSup("xn", 30, 1)).toBeCloseTo(1, 9);
    close("uniformconv", "uniformconv-q4", ucSup("hump", 10, 1));
    close("uniformconv", "uniformconv-q5", ucSup("sinn", 10, 1));
  });
  it("homopde", () => {
    close("homopde", "homopde-q1", pdeRoots(1, -3, 2).m1[0]);
    close("homopde", "homopde-q2", pdeRoots(1, -6, 9).disc);
    expect(pdeRoots(1, 0, 1).kind).toBe("elliptic");
    close("homopde", "homopde-q4", pdeRoots(1, 1, -6).disc);
  });
  it("cauchyint", () => {
    close("cauchyint", "cauchyint-q1", ciContour("ez", 0, [0.5, 0.3], 2)[0]);
    close("cauchyint", "cauchyint-q2", ciDeriv("sinz", 1, [1, 0])[0]);
    close("cauchyint", "cauchyint-q5", 2 * Math.PI * ciContour("ez", 0, [0, 0], 2)[0]);
  });
  it("residues", () => {
    const p = resPoles("simple", 1, 0, 0, 1, 2, 3)!;
    close("residues", "residues-q1", p[2].res);
    close("residues", "residues-q2", resInside(p, 3.5));
    close("residues", "residues-q3", resPoles("double", 1, 0, 0, 1, -2, 3)![0].res);
    close("residues", "residues-q5", Math.PI * 2 * resInside(p, 1.5));
  });
  it("realintegral", () => {
    close("realintegral", "realintegral-q1", realExact("inv", 3, 1)!);
    close("realintegral", "realintegral-q2", realExact("cos2", 5, 4)!);
    close("realintegral", "realintegral-q3", realExact("sin2", 5, -4)!);
    close("realintegral", "realintegral-q4", realExact("sq", 3, 1)!);
    close("realintegral", "realintegral-q4", realNumeric("sq", 3, 1));
    expect(realExact("inv", 1, 2)).toBeNull();
  });
});
