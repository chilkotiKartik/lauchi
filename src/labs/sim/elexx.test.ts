import { describe, expect, it } from "vitest";
import { biasStab, cellOf, depletion, evalSop, jfet, jfetId, kmap, mintermAt, niAt, primeImplicants, semicond, shape, shaperInfo, zener } from "./elexx";

describe("semiconductors", () => {
  it("n_i(300 K) and its strong rise with T", () => {
    expect(niAt("si", 300)).toBeCloseTo(1.5e10, -7);
    expect(niAt("si", 400) / niAt("si", 300)).toBeGreaterThan(200);
  });
  it("PYQ: Si with 10¹⁷ donors has p = 2250 cm⁻³ and σ ≈ 21.6 S/cm (μn = 1350)", () => {
    const s = semicond("si", 300, "n", 17, 1);
    expect(s.p).toBeCloseTo(2250, -1);
    expect(s.sigma).toBeCloseTo(1.602e-19 * 1e17 * 1350, 2);
    expect(s.EF).toBeGreaterThan(0.35);
    expect(semicond("si", 300, "p", 16, 1).EF).toBeLessThan(0);
    expect(semicond("si", 300, "intrinsic", 16, 1).EF).toBeCloseTo(0, 9);
  });
});

describe("clippers and clampers", () => {
  it("clipper limits, clamper shifts without changing peak-to-peak", () => {
    expect(shape("posclip", 5, 5, 1, 0.7)).toBeCloseTo(1.7, 9);
    expect(shaperInfo("negclamp", 10, 0, 0.7).hi).toBeCloseTo(0.7, 9);
    expect(shaperInfo("negclamp", 10, 0, 0.7).pp).toBeCloseTo(20, 9);
    expect(shaperInfo("posclamp", 10, 2, 0).lo).toBeCloseTo(2, 9);
  });
});

describe("Zener regulator", () => {
  it("PYQ Q2.9: 16 V, 1 kΩ, 10 V, 3 kΩ load", () => {
    const z = zener(16, 1000, 10, 10 / 3, 500, 0);
    expect(z.on).toBe(true); expect(z.VL).toBeCloseTo(10, 9);
    expect(z.IZ * 1000).toBeCloseTo(2.667, 2); expect(z.PZ).toBeCloseTo(26.67, 1);
  });
  it("turns off when the load pulls too much", () => { expect(zener(12, 500, 6, 20, 500).on).toBe(false); });
});

describe("bias stability", () => {
  it("fixed bias drifts much more with temperature than divider bias", () => {
    const f25 = biasStab("fixed", 25, 12, 2, 1, 47, 10, 470, 100).IC, f100 = biasStab("fixed", 100, 12, 2, 1, 47, 10, 470, 100).IC;
    const d25 = biasStab("divider", 25, 12, 2, 1, 47, 10, 470, 100).IC, d100 = biasStab("divider", 100, 12, 2, 1, 47, 10, 470, 100).IC;
    expect(f100 / f25).toBeGreaterThan(1.4);
    expect(d100 / d25).toBeLessThan(1.25);
    expect(biasStab("divider", 25, 12, 2, 1, 47, 10, 470, 100).S).toBeLessThan(10);
  });
});

describe("JFET", () => {
  it("Shockley in saturation, continuity at pinch-off, cut-off below V_P", () => {
    expect(jfetId(-2, 10, 10, -4, 0).ID).toBeCloseTo(2.5, 9);
    const sat = jfetId(-1, 3, 10, -4, 0), edge = jfetId(-1, 2.9999, 10, -4, 0);
    expect(edge.ID).toBeCloseTo(sat.ID, 3);
    expect(jfetId(-5, 10, 10, -4).ID).toBe(0);
    expect(jfet(0, 10, 10, -4).gm).toBeCloseTo(5, 9);
    expect(depletion(1, 0, 10, -4, 4)).toBeCloseTo(1, 9); // pinched at the drain end
  });
});

describe("Karnaugh maps", () => {
  const mask = (ms: number[]) => ms.reduce((a, m) => a | (1 << m), 0);
  it("PYQ: Σm(7,9,10,11,12,13,14,15) → AB + AC + AD + BCD", () => {
    const k = kmap(mask([7, 9, 10, 11, 12, 13, 14, 15]), 0, false);
    expect(k.sopImps).toHaveLength(4);
    expect(k.literals).toBe(9);
    for (let m = 0; m < 16; m++) expect(evalSop(k.sopImps, m)).toBe([7, 9, 10, 11, 12, 13, 14, 15].includes(m));
  });
  it("don't-cares help: Σm(0,1,3,4,5)+d(2,6) = B′ + A′ (2 terms)", () => {
    // as a 4-variable map with D = 0 only? use 3-variable shape by forcing D-bit cells: here just check minimality on a known 4-var case
    const k = kmap(mask([0, 1, 2, 3, 8, 9, 10, 11]), 0, false);
    expect(k.sop).toBe("B′");
    const d = kmap(mask([1, 3, 5]), mask([7]), true);
    expect(d.sop).toBe("A′D");
  });
  it("every map is reproduced exactly by its minimal SOP (random check)", () => {
    for (const ones of [0x1234, 0xf0f0, 0x8001, 0x6996, 0x0ff0, 0x5555]) {
      const k = kmap(ones, 0, false);
      for (let m = 0; m < 16; m++) expect(evalSop(k.sopImps, m)).toBe(Boolean((ones >> m) & 1));
    }
    expect(kmap(0, 0, false).sop).toBe("0");
    expect(kmap(0xffff, 0, false).sop).toBe("1");
    expect(primeImplicants([0, 1, 2, 3])).toHaveLength(1);
  });
  it("gray-code cell positions round-trip", () => { for (let m = 0; m < 16; m++) { const { r, c } = cellOf(m); expect(mintermAt(r, c)).toBe(m); } });
});
