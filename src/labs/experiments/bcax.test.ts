import { describe, expect, it } from "vitest";
import { BCAX_EXPERIMENTS } from "./bcax";
import * as S from "../sim/bcax";
import { BCAX_LABS } from "../meta/bcax";
import { BCAX_SPECS } from "../meta/bcax.specs";

const A = (lab: string, id: string) => { const q = BCAX_EXPERIMENTS[lab].questions.find((x) => x.id === id); if (!q || q.type !== "numeric") throw new Error(id); return q.answer; };
const last = <T,>(a: T[]) => a[a.length - 1];

describe("BCAX experiments recompute from the simulators", () => {
  it("has 15 experiments for real labs with valid steps", () => {
    expect(Object.keys(BCAX_EXPERIMENTS).length).toBe(15);
    for (const [id, e] of Object.entries(BCAX_EXPERIMENTS)) {
      expect(e.labId).toBe(id);
      const lab = BCAX_LABS.find((l) => l.id === id)!;
      expect(lab, id).toBeTruthy();
      expect(e.steps.length).toBeGreaterThanOrEqual(5);
      expect(e.questions.length).toBeGreaterThanOrEqual(6);
      for (const t of ["mcq", "tf", "numeric"]) expect(e.questions.some((q) => q.type === t), `${id} ${t}`).toBe(true);
      expect(e.questions.some((q) => q.scenario), id).toBe(true);
      const spec = BCAX_SPECS[id as keyof typeof BCAX_SPECS] as Record<string, { kind: string; options?: readonly string[]; max?: number; min?: number }>;
      for (const s of e.steps) {
        if (s.check.kind === "preset" && s.check.name) expect(lab.presets.map((p) => p.name), s.id).toContain(s.check.name);
        if (s.check.kind === "param") {
          const p = spec[s.check.key]; expect(p, `${id}.${s.id} key`).toBeTruthy();
          if (p.kind === "opt") expect(p.options, s.id).toContain(s.check.value);
          if (p.kind === "num" && s.check.op === "gte") expect(s.check.value as number, s.id).toBeLessThanOrEqual(p.max as number);
          if (p.kind === "num" && s.check.op === "eq") { expect(s.check.value as number).toBeGreaterThanOrEqual(p.min as number); expect(s.check.value as number).toBeLessThanOrEqual(p.max as number); }
          if (p.kind === "flag") expect(typeof s.check.value).toBe("boolean");
        }
      }
    }
  });
  it("dlqm", () => {
    const r = S.qm([...S.QM_SETS.q34.m], 4);
    expect(A("dlqm", "dlqm-q3")).toBe(r.primes.length); expect(A("dlqm", "dlqm-q4")).toBe(r.essential.length); expect(A("dlqm", "dlqm-q6")).toBe(S.QM_SETS.q33.m.length);
  });
  it("addsub", () => {
    expect(A("addsub", "addsub-q1")).toBe(S.adderDelay(4, "ripple").sum); expect(A("addsub", "addsub-q2")).toBe(S.adderDelay(4, "lookahead").sum);
    expect(A("addsub", "addsub-q5")).toBe(S.bcdAdd(9, 8, 0).digit); expect(A("addsub", "addsub-q6")).toBe(S.subtract(9, 5).diff);
  });
  it("ffconv", () => {
    expect(A("ffconv", "ffconv-q4")).toBe(S.ffRun("SR", "D", 4, 90, 0).qs[4]);
    expect(A("ffconv", "ffconv-q5")).toBe(S.ffRun("JK", "T", 8, 117, 0).kinds.filter((k) => k === "toggle").length);
    expect(A("ffconv", "ffconv-q6")).toBe(last(S.ffRun("T", "T", 3, 0b011, 0).qs));
  });
  it("counters", () => {
    expect(A("counters", "counters-q1")).toBeCloseTo(S.ctrFmax("ripple", 4, 20, 10)); expect(A("counters", "counters-q2")).toBeCloseTo(S.ctrFmax("sync", 4, 20, 10), 1);
    expect(A("counters", "counters-q3")).toBe(S.ctrMod("johnson", 4)); expect(A("counters", "counters-q6")).toBe(3 * 30);
  });
  it("hazard", () => {
    expect(A("hazard", "hazard-q1")).toBe(S.glitchWidth(3, false));
    expect(S.raceResult(true, 3, 5).final).toBe("10"); expect(A("hazard", "hazard-q5")).toBe(10);
  });
  it("dsstack", () => {
    expect(A("dsstack", "dsstack-q2")).toBe(S.stackFrames(4)[4].top);
    expect(A("dsstack", "dsstack-q3")).toBe(Number(S.postfixFrames("23+4*62/-").at(-1)!.cells[0])); expect(A("dsstack", "dsstack-q6")).toBe(Number(S.postfixFrames("853-/23*+").at(-1)!.cells[0]));
    expect(A("dsstack", "dsstack-q4")).toBe(S.queueFrames(5)[8].rear);
  });
  it("dsbst", () => {
    const t = S.buildT(S.BST_SETS.q512);
    expect(A("dsbst", "dsbst-q1")).toBe(S.heightT(t)); expect(A("dsbst", "dsbst-q2")).toBe(S.pathT(t, 17).length);
    expect(A("dsbst", "dsbst-q4")).toBe(S.deleteT(t, 15)!.key); expect(A("dsbst", "dsbst-q5")).toBe(S.heightT(S.buildT(S.BST_SETS.skew)));
  });
  it("dsavl", () => {
    expect(A("dsavl", "dsavl-q2")).toBe(S.avlFrames(S.AVL_SETS.ll).at(-1)!.tree!.key);
    const long = S.avlFrames(S.AVL_SETS.long);
    expect(A("dsavl", "dsavl-q4")).toBe(long.filter((f) => f.bad !== null).length); expect(A("dsavl", "dsavl-q6")).toBe(S.heightT(long.at(-1)!.tree));
    expect(S.avlFrames(S.AVL_SETS.lr).find((f) => f.bad !== null)!.rot).toBe("LR");
  });
  it("dsgraph", () => {
    expect(A("dsgraph", "dsgraph-q2")).toBe(S.graphFrames("bfs", 0).at(-1)!.order.indexOf(4) + 1);
    expect(A("dsgraph", "dsgraph-q3")).toBe(S.graphFrames("kruskal", 0).at(-1)!.weight); expect(A("dsgraph", "dsgraph-q4")).toBe(S.graphFrames("prim", 0).at(-1)!.tree.length);
    expect(A("dsgraph", "dsgraph-q5")).toBe(S.graphFrames("kruskal", 0).at(-1)!.rejected.length);
  });
  it("dshash", () => {
    const lin = S.hashFrames("linear", 7, S.HKEYS.k1);
    expect(A("dshash", "dshash-q1")).toBe(85 % 7); expect(A("dshash", "dshash-q2")).toBe(lin.at(-1)!.slots.indexOf(85)); expect(A("dshash", "dshash-q3")).toBe(lin.at(-1)!.total);
    expect(A("dshash", "dshash-q4")).toBe(S.hashFrames("chain", 7, S.HKEYS.k1).at(-1)!.chains[1].length);
  });
  it("coabooth", () => {
    expect(A("coabooth", "coabooth-q2")).toBe(S.boothProduct(last(S.boothFrames(7, -3)))); expect(A("coabooth", "coabooth-q3")).toBe(S.boothFrames(7, -3).filter((f) => f.op === "shift").length);
    expect(A("coabooth", "coabooth-q5")).toBe(last(S.divFrames(13, 3)).Q); expect(A("coabooth", "coabooth-q6")).toBe(last(S.divFrames(13, 3)).A);
  });
  it("coacache", () => {
    expect(A("coacache", "coacache-q1")).toBeCloseTo(S.emat(0.9, 10, 100)); expect(A("coacache", "coacache-q2")).toBeCloseTo(S.emat(0.9, 10, 100, true));
    expect(A("coacache", "coacache-q3")).toBe(S.cacheRun("direct", S.CACHE_SEQS.conf.seq).at(-1)!.hits); expect(A("coacache", "coacache-q4")).toBe(S.cacheRun("set2", S.CACHE_SEQS.conf.seq).at(-1)!.hits);
  });
  it("coavmem", () => {
    const f = (a: S.Repl, n: number, s: readonly number[]) => S.pageRun(a, n, s).at(-1)!.faults;
    expect(A("coavmem", "coavmem-q1")).toBe(f("fifo", 3, S.PAGE_SEQS.classic)); expect(A("coavmem", "coavmem-q2")).toBe(f("lru", 3, S.PAGE_SEQS.classic)); expect(A("coavmem", "coavmem-q3")).toBe(f("opt", 3, S.PAGE_SEQS.classic));
    expect(A("coavmem", "coavmem-q4")).toBe(f("fifo", 4, S.PAGE_SEQS.belady));
  });
  it("jdispatch", () => {
    expect(A("jdispatch", "jdispatch-q3")).toBe(S.dispatch("Animal", "Puppy", "speak").lookup.length); expect(A("jdispatch", "jdispatch-q5")).toBe(S.jChain("Puppy").length);
  });
  it("jthread", () => {
    expect(A("jthread", "jthread-q2")).toBe(S.raceRun(2, 10, false).lost); expect(A("jthread", "jthread-q3")).toBe(S.raceRun(2, 10, true).counter); expect(A("jthread", "jthread-q5")).toBe(S.THREAD_LIFE.length - 1);
  });
});
