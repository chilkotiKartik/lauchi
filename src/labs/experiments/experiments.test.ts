import { describe, expect, it } from "vitest";
import { EXPERIMENTS, getExperiment } from "./index";
import { LABS } from "../registry";
import { ALL_SPECS } from "../meta";
import { rlc, otto } from "../math";
import { nernstCell } from "../sim/chem";
import { thevenin } from "../sim/elec";
import { transformer } from "../sim/elec";

describe("experiment data", () => {
  const entries = Object.entries(EXPERIMENTS);
  it("has the core experiments", () => { for (const id of ["thevenin", "rings", "pvwork", "nernst", "kmap", "otto", "rlc", "transformer"]) expect(getExperiment(id), id).toBeTruthy(); });

  for (const [id, e] of entries) {
    describe(id, () => {
      it("matches a real lab", () => {
        expect(e.labId).toBe(id);
        expect(LABS.some((l) => l.id === id)).toBe(true);
        expect(ALL_SPECS[id]).toBeTruthy();
      });
      it("has steps whose params exist with the right type", () => {
        expect(e.steps.length).toBeGreaterThanOrEqual(5);
        expect(new Set(e.steps.map((s) => s.id)).size).toBe(e.steps.length);
        const spec = ALL_SPECS[id];
        for (const s of e.steps) {
          expect(s.title && s.text, s.id).toBeTruthy();
          if (s.check.kind !== "param") continue;
          const p = spec[s.check.key];
          expect(p, `${s.id}: key ${s.check.key}`).toBeTruthy();
          if (s.check.op === "changed") continue;
          const v = s.check.value;
          expect(v, `${s.id} needs a value`).not.toBeUndefined();
          if (p.kind === "num") {
            expect(typeof v, s.id).toBe("number");
            expect(["gte", "lte", "eq", "neq"]).toContain(s.check.op);
            if (s.check.op === "gte") expect(v as number, `${s.id} reachable`).toBeLessThanOrEqual(p.max);
            if (s.check.op === "lte") expect(v as number, `${s.id} reachable`).toBeGreaterThanOrEqual(p.min);
          } else if (p.kind === "opt") {
            expect(p.options, s.id).toContain(v);
            expect(["eq", "neq"]).toContain(s.check.op);
          } else {
            expect(typeof v, s.id).toBe("boolean");
            expect(["eq", "neq"]).toContain(s.check.op);
          }
        }
      });
      it("names real presets", () => {
        const lab = LABS.find((l) => l.id === id)!;
        for (const s of e.steps) if (s.check.kind === "preset" && s.check.name) expect(lab.presets.map((p) => p.name), s.id).toContain(s.check.name);
      });
      it("has a good question bank", () => {
        const qs = e.questions;
        expect(qs.length).toBeGreaterThanOrEqual(5);
        expect(new Set(qs.map((q) => q.id)).size).toBe(qs.length);
        expect(new Set(qs.map((q) => q.type)).size, "mix of question types").toBeGreaterThanOrEqual(2);
        for (const q of qs) {
          expect(q.marks, q.id).toBeGreaterThan(0);
          expect(q.solution.length, `${q.id} solution`).toBeGreaterThanOrEqual(1);
          expect(q.explanation, q.id).toBeTruthy();
          if (q.type === "mcq") { expect(q.options.length).toBeGreaterThanOrEqual(2); expect(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < q.options.length, q.id).toBe(true); }
          if (q.type === "numeric") { expect(Number.isFinite(q.answer)).toBe(true); expect(q.tolerance).toBeGreaterThanOrEqual(0); }
        }
      });
      it("has aim, equipment, summary", () => {
        expect(e.aim).toBeTruthy(); expect(e.objectives.length).toBeGreaterThan(0); expect(e.equipment.length).toBeGreaterThan(0);
        expect(e.summary.length).toBeGreaterThanOrEqual(3);
      });
    });
  }
});

/** Recompute the numeric answers of the core experiments from the lab's own maths. */
describe("numeric answers recompute", () => {
  const ans = (labId: string, qid: string) => { const q = EXPERIMENTS[labId].questions.find((x) => x.id === qid); if (!q || q.type !== "numeric") throw new Error(qid); return q; };
  const near = (labId: string, qid: string, value: number) => { const q = ans(labId, qid); expect(Math.abs(q.answer - value), `${qid}: ${q.answer} vs ${value}`).toBeLessThanOrEqual(q.tolerance); };
  it("thevenin", () => {
    near("thevenin", "thevenin-q6", thevenin(24, 10, 30, 10).Vth);
    near("thevenin", "thevenin-q7", thevenin(12, 10, 20, 6.667).Pmax);
    near("thevenin", "thevenin-q8", 9 ** 2 / (4 * 3));
  });
  it("rings", () => {
    near("rings", "rings-q6", Math.sqrt(5 * 589e-6 * 1000));
    near("rings", "rings-q7", 2 * Math.sqrt(10 * 500e-6 * 1250));
    near("rings", "rings-q8", ((5.95 ** 2 - 3.43 ** 2) / (4 * 10 * 1000)) * 1e6);
  });
  it("pvwork", () => {
    near("pvwork", "pvwork-q6", 600 * 0.03 * Math.log(3));
    near("pvwork", "pvwork-q7", 200 * (0.3 - 0.1));
    const p2 = 100 * (0.4 / 0.05) ** 1.4;
    near("pvwork", "pvwork-q8", (100 * 0.4 - p2 * 0.05) / 0.4);
  });
  it("nernst", () => {
    near("nernst", "nernst-q6", nernstCell("daniell", 0, -3, 298).E);
    near("nernst", "nernst-q7", (-2 * 96485 * 1.1) / 1000);
    near("nernst", "nernst-q8", nernstCell("znag", -1, -2, 298).E);
  });
  it("kmap", () => {
    near("kmap", "kmap-q6", [1, 3, 5].reduce((a, m) => a + 2 ** m, 0));
    near("kmap", "kmap-q7", 4 - 3);
  });
  it("otto", () => {
    near("otto", "otto-q6", otto(8, 1.4, 6).efficiency * 100);
    near("otto", "otto-q7", 0.4 ** -2.5);
    near("otto", "otto-q8", (540 + 60) / 60);
  });
  it("rlc", () => {
    near("rlc", "rlc-q6", rlc(20, 0.1, 1e-5, 150).f0);
    near("rlc", "rlc-q7", rlc(20, 0.1, 1e-5, 400).Z);
    near("rlc", "rlc-q8", (1 / (4 * Math.PI ** 2 * 1e12 * 200e-6)) * 1e12);
  });
  it("transformer", () => {
    const t = transformer(230, 500, 100, 50, 10, 20);
    near("transformer", "transformer-q6", t.I1);
    near("transformer", "transformer-q7", t.Bm);
    near("transformer", "transformer-q8", (920 * 24) / 230);
  });
});
