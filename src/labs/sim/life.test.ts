import { describe, expect, it } from "vitest";
import { CODON_TABLE, DNA_SAMPLES, boxModel, dnaAnalysis, energyFlow, fmtNum, greenhouse, layerSides, logisticGrowth, microbe, microbeLogN, mutate, population, pyramidValues, transcribe, translate, wallaceTm } from "./life";

describe("ecosystem", () => {
  it("the 10 % law: 10 000 kcal → 1 000 → 100 → 10", () => {
    const F = energyFlow(10000, 10, 4);
    expect(F.energy.map((x) => Math.round(x))).toEqual([10000, 1000, 100, 10]);
    expect(F.topPct).toBeCloseTo(0.1, 9); expect(F.lostBeforeTop).toBeCloseTo(9990, 6);
  });
  it("energy lost plus the top level's energy equals the input", () => {
    const F = energyFlow(50000, 15, 5); expect(F.lost.reduce((a, b) => a + b, 0)).toBeCloseTo(50000, 6);
  });
  it("energy pyramid is always upright; numbers pyramid for a tree is not", () => {
    const e = pyramidValues("energy", 1000, 10, 5); expect(e.every((v, i) => i === 0 || v < e[i - 1])).toBe(true);
    const t = pyramidValues("tree", 1000, 10, 5); expect(t[0]).toBeLessThan(t[1]);
  });
  it("layer area is proportional to the value", () => {
    const s = layerSides([100, 25], 0.01); expect(s[1] ** 2 / s[0] ** 2).toBeCloseTo(0.25, 9);
  });
});

describe("population", () => {
  it("doubling time is ln 2 / r and the rule of 70 agrees closely", () => {
    const p = population(5, 100, 10000, 0); expect(p.doubling).toBeCloseTo(13.863, 3); expect(p.rule70).toBe(14);
  });
  it("logistic starts at N₀, approaches K, and is at K/2 at the inflection time", () => {
    expect(logisticGrowth(100, 10000, 0.05, 0)).toBeCloseTo(100, 9);
    expect(logisticGrowth(100, 10000, 0.05, 1000)).toBeCloseTo(10000, 3);
    const p = population(5, 100, 10000, 0); expect(logisticGrowth(100, 10000, 0.05, p.tHalfK)).toBeCloseTo(5000, 6);
  });
  it("exponential exceeds logistic and dN/dt peaks at K/2", () => {
    const p = population(5, 100, 10000, 100); expect(p.Nexp).toBeGreaterThan(p.Nlog);
    const rate = (t: number) => population(5, 100, 10000, t).dNdtLog;
    const th = population(5, 100, 10000, 0).tHalfK; expect(rate(th)).toBeGreaterThan(rate(th - 20)); expect(rate(th)).toBeGreaterThan(rate(th + 20));
  });
});

describe("greenhouse", () => {
  it("doubling CO₂ gives 3.71 W/m² and about 3 °C at λ = 0.8", () => {
    const g = greenhouse(560, 0.8, 0); expect(g.dFco2).toBeCloseTo(3.708, 2); expect(g.dT).toBeCloseTo(2.97, 1); expect(g.dT2x).toBeCloseTo(g.dT, 9);
  });
  it("280 ppm gives no forcing; more albedo cools", () => {
    expect(greenhouse(280, 0.8, 0).dT).toBe(0); expect(greenhouse(280, 0.8, 0.01).dT).toBeLessThan(0);
    expect(greenhouse(560, 0.8, 0.005).dFalb).toBeCloseTo(-1.70, 2);
  });
});

describe("DNA", () => {
  it("genetic code: AUG Met, UGG Trp, three stops, 64 codons", () => {
    expect(CODON_TABLE.AUG).toBe("Met"); expect(CODON_TABLE.UGG).toBe("Trp"); expect(["UAA", "UAG", "UGA"].every((c) => CODON_TABLE[c] === "Stop")).toBe(true);
    expect(Object.keys(CODON_TABLE)).toHaveLength(64); expect(CODON_TABLE.GCU).toBe("Ala"); expect(CODON_TABLE.ACU).toBe("Thr");
  });
  it("translation starts at AUG and stops at a stop codon", () => {
    const t = translate(transcribe("ATGGCTTAAGGG")); expect(t.aa).toEqual(["Met", "Ala"]); expect(t.stopped).toBe(true);
    expect(translate("GCUAUG").started).toBe(false);
  });
  it("classifies mutations: missense, silent, nonsense", () => {
    const s = DNA_SAMPLES.s1;
    expect(dnaAnalysis(s, 4, "ts").effect).toBe("missense"); expect(dnaAnalysis(s, 4, "ts").newAA).toBe("Thr");
    expect(dnaAnalysis(s, 6, "ts").effect).toBe("silent");
    expect(dnaAnalysis(s, 10, "tv").effect).toBe("nonsense"); expect(dnaAnalysis(s, 10, "tv").now.aa.length).toBe(3);
    expect(dnaAnalysis(s, 1, "tv").effect).toBe("start lost"); expect(dnaAnalysis(s, 5, "none").effect).toBe("none");
  });
  it("mutate replaces exactly one base and Tm follows Wallace's rule", () => {
    const m = mutate("ATGC", 2, "ts"); expect(m).toBe("ACGC"); expect(mutate("ATGC", 2, "none")).toBe("ATGC");
    expect(wallaceTm("ATGC")).toBe(2 * 2 + 4 * 2);
  });
  it("every sample is a whole number of codons that starts with ATG and ends in a stop", () => {
    for (const s of Object.values(DNA_SAMPLES)) { expect(s.length % 3).toBe(0); expect(s.startsWith("ATG")).toBe(true); expect(translate(transcribe(s)).stopped).toBe(true); expect(s.length).toBeLessThanOrEqual(30); }
  });
});

describe("microbe", () => {
  const p = { mu: 0.7, lag: 2, log0: 3, logK: 9, kd: 0.2, stat: 6 };
  it("no growth in the lag phase, then logistic growth to K, then decline", () => {
    expect(microbeLogN(p, 1)).toBeCloseTo(3, 9);
    expect(microbeLogN(p, 30)).toBeCloseTo(9, 1);
    expect(microbeLogN(p, 60)).toBeLessThan(microbeLogN(p, 30));
  });
  it("phase labels and generation time", () => {
    expect(microbe(p, 1).phase).toBe("Lag"); expect(microbe(p, 8).phase).toBe("Exponential (log)"); expect(microbe(p, 60).phase).toBe("Death");
    expect(microbe(p, 8).genTime).toBeCloseTo(Math.LN2 / 0.7, 12);
  });
  it("with no death rate the culture stays stationary", () => expect(microbe({ ...p, kd: 0 }, 60).phase).toBe("Stationary"));
});

describe("CSS box model", () => {
  it("content-box: 200 + 2·20 + 2·6 = 252 px; border-box keeps 200 px", () => {
    const c = boxModel(200, 120, 20, 6, 20, "content"); expect(c.borderW).toBe(252); expect(c.contentW).toBe(200); expect(c.outerW).toBe(292);
    const b = boxModel(200, 120, 20, 6, 20, "border"); expect(b.borderW).toBe(200); expect(b.contentW).toBe(148); expect(b.borderH).toBe(120);
  });
  it("content never goes negative", () => expect(boxModel(40, 40, 60, 30, 0, "border").contentW).toBe(0));
  it("formats numbers", () => { expect(fmtNum(1234567)).toBe("1,234,567"); expect(fmtNum(12.345)).toBe("12.3"); expect(fmtNum(2e9)).toContain("×"); });
});
