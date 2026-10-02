import { describe, expect, it } from "vitest";
import { MATHI_EXPERIMENTS } from "./mathi";
import * as S from "../sim/mathi";
import { MATHI_LABS } from "../meta/mathi";
import { MATHI_SPECS } from "../meta/mathi.specs";

const A = (lab: string, id: string) => { const q = MATHI_EXPERIMENTS[lab].questions.find((x) => x.id === id); if (!q || q.type !== "numeric") throw new Error(id); return q; };
const near = (lab: string, id: string, v: number) => { const q = A(lab, id); expect(Math.abs(q.answer - v), `${id}: ${q.answer} vs ${v}`).toBeLessThanOrEqual(Math.max(q.tolerance, 1e-9)); };

describe("MATHI experiments are well formed", () => {
  it("has 11 experiments for real labs with valid steps and questions", () => {
    expect(Object.keys(MATHI_EXPERIMENTS)).toHaveLength(11);
    for (const [id, e] of Object.entries(MATHI_EXPERIMENTS)) {
      expect(e.labId).toBe(id);
      const lab = MATHI_LABS.find((l) => l.id === id)!;
      expect(lab, id).toBeTruthy();
      expect(e.steps.length).toBeGreaterThanOrEqual(5);
      expect(e.questions.length).toBeGreaterThanOrEqual(6);
      expect(e.summary.length).toBeGreaterThanOrEqual(3);
      for (const t of ["mcq", "tf", "numeric"]) expect(e.questions.some((q) => q.type === t), `${id} ${t}`).toBe(true);
      expect(e.questions.some((q) => q.scenario), id).toBe(true);
      for (const q of e.questions) { expect(q.solution.length, q.id).toBeGreaterThanOrEqual(2); expect(q.explanation, q.id).toBeTruthy(); }
      const spec = (MATHI_SPECS as unknown as Record<string, Record<string, { kind: string; options?: readonly string[]; max?: number; min?: number }>>)[id];
      for (const s of e.steps) {
        if (s.check.kind === "preset" && s.check.name) expect(lab.presets.map((p) => p.name), s.id).toContain(s.check.name);
        if (s.check.kind !== "param") continue;
        const p = spec[s.check.key];
        expect(p, `${id}.${s.id} key`).toBeTruthy();
        if (p.kind === "opt") expect(p.options, s.id).toContain(s.check.value);
        if (p.kind === "num" && s.check.op === "gte") expect(s.check.value as number, s.id).toBeLessThanOrEqual(p.max as number);
        if (p.kind === "num" && s.check.op === "lte") expect(s.check.value as number, s.id).toBeGreaterThanOrEqual(p.min as number);
      }
    }
  });
  it("every Maths I lab has presets inside its spec ranges", () => {
    expect(MATHI_LABS).toHaveLength(20);
    for (const l of MATHI_LABS) {
      const spec = (MATHI_SPECS as unknown as Record<string, Record<string, { kind: string; options?: readonly string[]; max?: number; min?: number }>>)[l.id];
      expect(spec, l.id).toBeTruthy();
      expect(l.presets.length).toBeGreaterThanOrEqual(2);
      for (const p of l.presets) for (const [k, v] of Object.entries(p.values)) {
        const sp = spec[k]; expect(sp, `${l.id}.${k}`).toBeTruthy();
        if (sp.kind === "num") { expect(v as number, `${l.id}.${p.name}.${k}`).toBeGreaterThanOrEqual(sp.min as number); expect(v as number, `${l.id}.${p.name}.${k}`).toBeLessThanOrEqual(sp.max as number); }
        if (sp.kind === "opt") expect(sp.options, `${l.id}.${p.name}.${k}`).toContain(v);
      }
    }
  });
});

describe("MATHI experiments recompute from the simulator", () => {
  it("lagrangemult", () => {
    near("lagrangemult", "lagrangemult-q2", S.planeMin(1, 2, 2, 18)!.min);
    near("lagrangemult", "lagrangemult-q3", S.planeMin(1, 2, 2, 9)!.lambda);
    near("lagrangemult", "lagrangemult-q4", S.sphereDist([1, 2, -1], Math.sqrt(24)).dmax);
    near("lagrangemult", "lagrangemult-q5", S.sphereDist([1, 2, -1], Math.sqrt(24)).dmin);
  });
  it("taylor2var", () => {
    near("taylor2var", "taylor2var-q2", S.taylor2("exsiny", 3, 0.5, 0.4).p);
    near("taylor2var", "taylor2var-q3", S.taylor2("exsiny", 1, 0.5, 0.4).err);
    near("taylor2var", "taylor2var-q4", S.taylor2("exsiny", 3, 0.5, 0.4).terms);
  });
  it("reverseorder", () => {
    near("reverseorder", "reverseorder-q1", S.REGIONS.sin.exact);
    near("reverseorder", "reverseorder-q2", S.strips("sin", "dxdy", 6).sum);
    near("reverseorder", "reverseorder-q3", S.regionArea("pyq"));
    near("reverseorder", "reverseorder-q4", S.REGIONS.pyq.exact);
    near("reverseorder", "reverseorder-q5", S.REGIONS.exp.exact);
    expect(Math.abs(S.strips("pyq", "dydx", 40).sum - 0.375)).toBeLessThan(0.002);
  });
  it("betagamma", () => {
    near("betagamma", "betagamma-q1", S.beta(2, 3));
    near("betagamma", "betagamma-q2", S.gamma(5));
    near("betagamma", "betagamma-q3", S.gamma(0.5));
    near("betagamma", "betagamma-q4", S.sinCosInt(4, 2));
    near("betagamma", "betagamma-q5", 4 * S.sinCosInt(4, 2));
  });
  it("jacobian", () => {
    near("jacobian", "jacobian-q1", S.jacobian("polar", 2, 0.5, 0.1, 0.1).J);
    near("jacobian", "jacobian-q2", S.jacobian("ux", 3, 0.5, 0.1, 0.1).J);
    near("jacobian", "jacobian-q3", S.jacobian("shear", 1, 1, 0.1, 0.1).J);
    near("jacobian", "jacobian-q4", S.jacobian("polar", 2, 0.5, 0.1, 0.1).predicted);
    near("jacobian", "jacobian-q5", S.jacobian("ellipse", 2, 0.5, 0.1, 0.1).J);
    expect(S.jacobian("polar", 2, 0.5, 0.1, 0.1).product).toBeCloseTo(1, 6);
  });
  it("revcurves", () => {
    near("revcurves", "revcurves-q1", S.revolve("astroid", 1).V);
    near("revcurves", "revcurves-q2", S.revolve("astroid", 1).S);
    near("revcurves", "revcurves-q3", S.revolve("cycloid", 1).V);
    near("revcurves", "revcurves-q4", S.revolve("loop", 1).V);
    near("revcurves", "revcurves-q5", S.revolve("astroid", 2).V);
    expect(S.revolve("astroid", 2).S / S.revolve("astroid", 1).S).toBeCloseTo(4, 6);
  });
  it("gradient", () => {
    const d = S.directional("f1", [1, -2, 1], [2, -1, -2]);
    near("gradient", "gradient-q1", d.gradMag);
    near("gradient", "gradient-q2", d.D);
    near("gradient", "gradient-q3", d.angle);
    near("gradient", "gradient-q4", S.directional("f3", [1, 2, 2], [1, 0, 0]).D);
  });
  it("gaussflux", () => {
    near("gaussflux", "gaussflux-q1", S.gauss("pyq1", 1, 1, 1).surface);
    near("gaussflux", "gaussflux-q2", S.gauss("pyq1", 1, 1, 1).faces.x1);
    near("gaussflux", "gaussflux-q3", S.gauss("rad", 1, 2, 3).surface);
    near("gaussflux", "gaussflux-q4", S.gauss("const", 1, 1, 1).surface);
  });
  it("planes3", () => {
    near("planes3", "planes3-q1", S.planesInfo("pyq2", 8, 26).detA);
    const sol = S.planesInfo("pyq2", 8, 26).sol;
    near("planes3", "planes3-q2", sol.kind === "unique" ? sol.pt[0] : NaN);
    near("planes3", "planes3-q3", S.planesInfo("pyq2", 6, 26).rankA);
    expect(S.planesInfo("pyq2", 6, 20).sol.kind).toBe("none");
    near("planes3", "planes3-q5", S.planesInfo("pyq1", 3, 2.5).detA);
    expect(S.planesInfo("pyq1", 3, 2.5).sol.kind).toBe("line");
  });
  it("caleyham", () => {
    const c = S.cayley(S.CH_MATS.m33a.M!, 4);
    near("caleyham", "caleyham-q1", c.det);
    near("caleyham", "caleyham-q2", c.inv![0][0]);
    near("caleyham", "caleyham-q3", c.trAk);
    const d = S.cayley(S.CH_MATS.m22b.M!, 2);
    near("caleyham", "caleyham-q4", d.inv![0][0]);
    near("caleyham", "caleyham-q5", d.Ak[1][1]);
  });
  it("eigen3d", () => {
    const e = S.eig3(S.E3_MATS.sym1.M);
    near("eigen3d", "eigen3d-q1", e.values[0]);
    near("eigen3d", "eigen3d-q2", e.trace);
    near("eigen3d", "eigen3d-q3", e.det);
    near("eigen3d", "eigen3d-q4", S.eig3(S.scaleMat(S.E3_MATS.tri.M, 2)).values[0]);
    near("eigen3d", "eigen3d-q5", e.values[1] * e.values[2]);
    expect(S.eig3(S.E3_MATS.sym2.M).diagonalizable).toBe(true);
  });
});
