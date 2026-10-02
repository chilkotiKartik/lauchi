import { describe, expect, it } from "vitest";
import {
  C, H, HC_EV_NM, LAMBDA_C_PM, ME_C2_KEV, METALS, QE, brewsterDeg, compton, diffraction, fiber, fmtSI, fmtSci, hall, fermiBelowEc, niSi, nmToRgb,
  photoelectric, pnJunction, polarization, prng, slitIntensity, toDeg, toRad,
} from "./physics";

describe("constants", () => {
  it("hc ≈ 1240 eV·nm, λc ≈ 2.426 pm, mₑc² ≈ 511 keV", () => {
    expect(HC_EV_NM).toBeCloseTo(1240, 0);
    expect(LAMBDA_C_PM).toBeCloseTo(2.426, 3);
    expect(ME_C2_KEV).toBeCloseTo(511, 0);
    expect((H * C) / QE).toBeGreaterThan(1.239e-6);
  });
});

describe("formatting and helpers", () => {
  it("fmtSI picks a sensible prefix", () => {
    expect(fmtSI(0.0031, "V")).toBe("3.10 mV");
    expect(fmtSI(1.25, "m/s")).toBe("1.25 m/s");
    expect(fmtSI(-2.5e-10, "V")).toBe("−250 pV");
    expect(fmtSI(0, "A")).toBe("0 A");
    expect(fmtSI(NaN, "A")).toBe("—");
  });
  it("fmtSci writes powers of ten", () => {
    expect(fmtSci(6.24e-4)).toBe("6.24 × 10⁻⁴");
    expect(fmtSci(9.999e5, 2)).toBe("1.00 × 10⁶");
  });
  it("prng is deterministic and in [0,1)", () => {
    const a = prng(7), b = prng(7);
    for (let i = 0; i < 20; i++) { const x = a(); expect(x).toBe(b()); expect(x).toBeGreaterThanOrEqual(0); expect(x).toBeLessThan(1); }
  });
  it("nmToRgb is coloured across the visible range and violet in the UV", () => {
    for (const nm of [400, 450, 500, 550, 600, 650, 700]) { const c = nmToRgb(nm); expect(Math.max(...c)).toBeGreaterThan(0.3); }
    const uv = nmToRgb(200);
    expect(uv[2]).toBe(1);
  });
  it("degree helpers round-trip", () => { expect(toDeg(toRad(37))).toBeCloseTo(37, 10); });
});

describe("diffraction", () => {
  it("single slit: central maximum 1, first minimum at sinθ = λ/a", () => {
    expect(slitIntensity(0, 0.55, 2, 6, 1)).toBeCloseTo(1, 12);
    expect(slitIntensity(0.55 / 2, 0.55, 2, 6, 1)).toBeCloseTo(0, 12);
    expect(slitIntensity(0.3, 0.55, 2, 6, 1)).toBeLessThan(0.1);
  });
  it("single-slit minimum for a = λ is 90°", () => {
    expect(diffraction(500, 0.5, 5, 1).firstMinDeg).toBeCloseTo(90, 6);
  });
  it("a < λ has no minimum", () => {
    expect(diffraction(700, 0.6, 5, 1).firstMinDeg).toBeNull();
  });
  it("double slit: bright at sinθ = λ/d, dark at λ/2d, height follows the envelope", () => {
    const lam = 0.55, a = 1, d = 5;
    expect(slitIntensity(lam / d, lam, a, d, 2)).toBeCloseTo(slitIntensity(lam / d, lam, a, d, 1), 9);
    expect(slitIntensity(lam / (2 * d), lam, a, d, 2)).toBeCloseTo(0, 12);
  });
  it("N slits: principal maxima keep height, N − 2 subsidiary maxima sit between them", () => {
    const lam = 0.6, a = 0.5, d = 4, N = 5;
    expect(slitIntensity(lam / d, lam, a, d, N)).toBeCloseTo(slitIntensity(lam / d, lam, a, d, 1), 9);
    // zeros at sinθ = k λ / (N d) for k not a multiple of N
    expect(slitIntensity((2 * lam) / (N * d), lam, a, d, N)).toBeCloseTo(0, 12);
    let peaks = 0, prev = 1, prev2 = 1;
    for (let i = 1; i < 4000; i++) {
      const s = (i / 4000) * 0.95 * (lam / d), v = slitIntensity(s, lam, a, d, N);
      if (prev > prev2 && prev > v) peaks++;
      prev2 = prev; prev = v;
    }
    expect(peaks).toBe(N - 2);
  });
  it("angles, envelope count, missing orders and resolving power", () => {
    const r = diffraction(550, 2, 6, 10);
    expect(r.firstMinDeg).toBeCloseTo((Math.asin(0.55 / 2) * 180) / Math.PI, 8);
    expect(r.firstOrderDeg).toBeCloseTo((Math.asin(0.55 / 6) * 180) / Math.PI, 8);
    expect(r.inEnvelope).toBe(5);        // orders 0, ±1, ±2 (order 3 sits on the first minimum)
    expect(r.missing.slice(0, 2)).toEqual([3, 6]);
    expect(r.R).toBe(10);
    expect(r.dLambdaNm).toBeCloseTo(55, 8);
    expect(diffraction(550, 2, 5, 3).missing).toEqual([]);   // d/a = 2.5 not an integer
  });
  it("slits cannot overlap: d is raised to a", () => {
    expect(diffraction(550, 4, 2, 2).dUsed).toBe(4);
  });
});

describe("polarization", () => {
  it("Malus law: 60° passes cos² = 0.25; crossed passes none", () => {
    const p = polarization(60, "none", 0);
    expect(p.malus).toBeCloseTo(0.25, 12);
    expect(p.frac).toBeCloseTo(0.125, 12);            // after the first polariser only I₀/2 remains
    expect(polarization(90, "none", 0).frac).toBeCloseTo(0, 12);
    expect(polarization(0, "none", 0).frac).toBeCloseTo(0.5, 12);
    expect(p.state).toBe("linear");
  });
  it("quarter-wave plate at 45° makes circular light: any analyser passes I₀/4", () => {
    for (const a of [0, 33, 90, 141]) {
      const p = polarization(a, "quarter", 45);
      expect(p.state).toBe("circular");
      expect(p.ratio).toBeCloseTo(1, 6);
      expect(p.frac).toBeCloseTo(0.25, 9);
    }
  });
  it("quarter-wave plate along the polariser axis leaves linear light; at another angle it is elliptical", () => {
    expect(polarization(0, "quarter", 0).state).toBe("linear");
    expect(polarization(0, "quarter", 90).state).toBe("linear");
    const e = polarization(0, "quarter", 30);
    expect(e.state).toBe("elliptical");
    expect(e.ratio).toBeGreaterThan(0);
    expect(e.ratio).toBeLessThan(1);
  });
  it("half-wave plate at 45° rotates the polarisation by 90°", () => {
    expect(polarization(90, "half", 45).frac).toBeCloseTo(0.5, 9);
    expect(polarization(0, "half", 45).frac).toBeCloseTo(0, 9);
    expect(polarization(0, "half", 45).axisDeg).toBeCloseTo(90, 6);
  });
  it("half-wave plate at φ rotates the axis by 2φ", () => {
    const p = polarization(0, "half", 22.5);
    expect(p.axisDeg).toBeCloseTo(45, 6);
    expect(polarization(45, "half", 22.5).frac).toBeCloseTo(0.5, 9);
  });
  it("plates never change the total intensity reaching the analyser", () => {
    for (const plate of ["quarter", "half"] as const) {
      const p = polarization(0, plate, 20);
      const sum = polarization(0, plate, 20).frac + polarization(90, plate, 20).frac;
      expect(sum).toBeCloseTo(0.5, 9);
      expect(p.Eu[0] ** 2 + p.Eu[1] ** 2 + p.Ev[0] ** 2 + p.Ev[1] ** 2).toBeCloseTo(1, 9);
    }
  });
  it("Brewster angle tan⁻¹(n)", () => {
    expect(brewsterDeg(1.5)).toBeCloseTo(56.31, 2);
    expect(brewsterDeg(1)).toBeCloseTo(45, 10);
  });
});

describe("fibre", () => {
  const f = fiber(1.5, 1.45, 10);
  it("n₁ = 1.5, n₂ = 1.45: NA ≈ 0.384, acceptance ≈ 22.6°, critical ≈ 75.2°, Δ ≈ 3.3%", () => {
    expect(f.NA).toBeCloseTo(0.384, 3);
    expect(f.acceptDeg).toBeCloseTo(22.59, 1);
    expect(f.critDeg).toBeCloseTo(75.16, 1);
    expect(f.delta).toBeCloseTo(0.0333, 3);
  });
  it("glass/air critical angle is 41.8°", () => { expect(fiber(1.5, 1, 0).critDeg).toBeCloseTo(41.81, 2); });
  it("guided exactly when the launch angle is inside the acceptance angle", () => {
    expect(fiber(1.5, 1.45, 22).guided).toBe(true);
    expect(fiber(1.5, 1.45, 23).guided).toBe(false);
    expect(fiber(1.5, 1.45, 0).guided).toBe(true);
    expect(fiber(1.5, 1.45, 0).wallDeg).toBeCloseTo(90, 10);
  });
  it("wall angle follows Snell's law at the end face", () => {
    const r = fiber(1.5, 1.45, 30);
    expect(Math.sin(toRad(30))).toBeCloseTo(1.5 * Math.sin(toRad(r.refrDeg)), 10);
    expect(r.wallDeg).toBeCloseTo(90 - r.refrDeg, 10);
  });
  it("NA ≥ 1 accepts everything; n₂ ≥ n₁ never guides", () => {
    const big = fiber(1.8, 1.3, 40);
    expect(big.NA).toBeGreaterThan(1);
    expect(big.acceptDeg).toBe(90);
    expect(big.guided).toBe(true);
    const bad = fiber(1.4, 1.45, 5);
    expect(bad.guided).toBe(false);
    expect(bad.NA).toBeNull();
  });
});

describe("photoelectric effect", () => {
  it("sodium threshold ≈ 544 nm; caesium ≈ 590 nm; copper ≈ 264 nm", () => {
    expect(photoelectric(400, METALS.na.phi, 0).lambda0).toBeCloseTo(544, 0);
    expect(photoelectric(400, METALS.cs.phi, 0).lambda0).toBeCloseTo(590.5, 0);
    expect(photoelectric(400, METALS.cu.phi, 0).lambda0).toBeCloseTo(263.8, 0);
  });
  it("photon energy hc/λ: 400 nm is 3.1 eV", () => { expect(photoelectric(400, 2, 0).E).toBeCloseTo(3.1, 2); });
  it("Kmax = hν − φ and stopping potential Kmax/e", () => {
    const p = photoelectric(300, METALS.na.phi, 0);
    expect(p.emits).toBe(true);
    expect(p.kmax).toBeCloseTo(1240 / 300 - 2.28, 2);
    expect(p.V0).toBeCloseTo(p.kmax, 12);
  });
  it("no emission below threshold, whatever the voltage", () => {
    const p = photoelectric(600, METALS.na.phi, -2);
    expect(p.emits).toBe(false);
    expect(p.kmax).toBe(0);
    expect(p.fraction).toBe(0);
  });
  it("collector current falls to zero at V = V₀", () => {
    const p = photoelectric(300, METALS.na.phi, 0);
    expect(photoelectric(300, METALS.na.phi, 0).fraction).toBe(1);
    expect(photoelectric(300, METALS.na.phi, p.V0 / 2).fraction).toBeCloseTo(0.5, 9);
    expect(photoelectric(300, METALS.na.phi, p.V0).fraction).toBeCloseTo(0, 9);
    expect(photoelectric(300, METALS.na.phi, p.V0 + 1).fraction).toBe(0);
    expect(photoelectric(300, METALS.na.phi, -1).fraction).toBe(1);
  });
});

describe("Compton scattering", () => {
  it("90° adds one Compton wavelength (2.426 pm); 180° adds twice; 0° adds nothing", () => {
    expect(compton(50, 90).dl).toBeCloseTo(2.426, 3);
    expect(compton(50, 180).dl).toBeCloseTo(4.853, 2);
    expect(compton(50, 0).dl).toBeCloseTo(0, 12);
    expect(compton(50, 90).lam2).toBeCloseTo(52.426, 3);
  });
  it("photon energy hc/λ in keV: 71.1 pm → 17.4 keV (Mo Kα)", () => {
    expect(compton(71.1, 90).E1).toBeCloseTo(17.44, 1);
  });
  it("energy is conserved: electron KE = E − E′", () => {
    const c = compton(20, 60);
    expect(c.Ke).toBeCloseTo(c.E1 - c.E2, 12);
    expect(c.Ke).toBeGreaterThan(0);
  });
  it("recoil angle obeys momentum conservation and tan φ = cot(θ/2)/(1 + λc/λ)", () => {
    for (const [lam, th] of [[20, 90], [71.1, 45], [5, 130], [40, 10]] as const) {
      const c = compton(lam, th);
      const t = toRad(th);
      const tanPhi = Math.sin(t) / (c.lam2 / lam - Math.cos(t));
      expect(Math.tan(toRad(c.phiDeg))).toBeCloseTo(tanPhi, 8);
      expect(Math.tan(toRad(c.phiDeg))).toBeCloseTo(1 / Math.tan(t / 2) / (1 + LAMBDA_C_PM / lam), 8);
    }
    expect(compton(20, 90).phiDeg).toBeCloseTo(41.7, 1);
    expect(compton(20, 180).phiDeg).toBeCloseTo(0, 6);
  });
  it("relativistic energy–momentum: (pc)² = K² + 2K mₑc² for the recoil electron", () => {
    const c = compton(10, 70), t = toRad(70);
    const px = c.E1 - c.E2 * Math.cos(t), py = c.E2 * Math.sin(t);   // pc components in keV
    expect(px * px + py * py).toBeCloseTo(c.Ke * c.Ke + 2 * c.Ke * ME_C2_KEV, 3);
  });
});

describe("p–n junction", () => {
  it("nᵢ(300 K) = 1.5 × 10¹⁰ and rises steeply with T", () => {
    expect(niSi(300)).toBeCloseTo(1.5e10, -5);
    expect(niSi(400) / niSi(300)).toBeGreaterThan(1e2);
    expect(niSi(250)).toBeLessThan(niSi(300));
  });
  it("Si 10¹⁶/10¹⁶ at 300 K: V_bi ≈ 0.69 V, W ≈ 0.42 µm", () => {
    const j = pnJunction(16, 16, 0, 300);
    expect(j.Vbi).toBeCloseTo(0.693, 2);
    expect(j.W * 1e6).toBeCloseTo(0.423, 2);
    expect(j.bias).toBe("zero");
    expect(j.I).toBeCloseTo(0, 20);
  });
  it("V_bi grows with doping", () => {
    expect(pnJunction(18, 18, 0, 300).Vbi).toBeGreaterThan(pnJunction(16, 16, 0, 300).Vbi);
    expect(pnJunction(14, 14, 0, 300).Vbi).toBeLessThan(pnJunction(16, 16, 0, 300).Vbi);
  });
  it("W ∝ √(V_bi − V): reverse bias widens, forward bias narrows", () => {
    const w0 = pnJunction(16, 16, 0, 300), wr = pnJunction(16, 16, -5, 300), wf = pnJunction(16, 16, 0.5, 300);
    expect(wr.W).toBeGreaterThan(w0.W);
    expect(wf.W).toBeLessThan(w0.W);
    expect(wr.W / w0.W).toBeCloseTo(Math.sqrt((w0.Vbi + 5) / w0.Vbi), 9);
  });
  it("depletion charge neutrality Na·xp = Nd·xn, and the lighter side depletes more", () => {
    const j = pnJunction(17, 15, -1, 300);
    expect((10 ** 17 * j.xp) / (10 ** 15 * j.xn)).toBeCloseTo(1, 9);
    expect(j.xn).toBeGreaterThan(j.xp);
    expect(j.xp + j.xn).toBeCloseTo(j.W, 15);
  });
  it("Shockley diode: forward exponential, reverse saturation −Is, sign of bias", () => {
    const f = pnJunction(16, 16, 0.6, 300), r = pnJunction(16, 16, -5, 300);
    expect(f.bias).toBe("forward");
    expect(f.I).toBeCloseTo(f.Is * Math.expm1(0.6 / f.Vt), 12);
    expect(f.I).toBeGreaterThan(1e-5);
    expect(r.bias).toBe("reverse");
    expect(r.I).toBeCloseTo(-r.Is, 20);
    expect(pnJunction(16, 16, 0.65, 300).I / f.I).toBeCloseTo(Math.exp(0.05 / f.Vt), 3);
  });
  it("forward bias at or above V_bi collapses the depletion region", () => {
    const j = pnJunction(14, 14, 0.7, 300);
    expect(j.Vbi).toBeLessThan(0.7);
    expect(j.collapsed).toBe(true);
    expect(j.W).toBe(0);
  });
  it("Fermi level sits about 0.2 eV below Ec for 10¹⁶ donors, and closer for heavier doping", () => {
    expect(fermiBelowEc(16, 300)).toBeCloseTo(0.205, 2);
    expect(fermiBelowEc(18, 300)).toBeLessThan(fermiBelowEc(16, 300));
    expect(fermiBelowEc(18, 300)).toBeGreaterThan(0);
  });
  it("peak field E = 2(V_bi − V)/W", () => {
    const j = pnJunction(16, 16, 0, 300);
    expect(j.Emax).toBeCloseTo((2 * j.Vbi) / j.W, 3);
  });
});

describe("Hall effect", () => {
  it("V_H = IB/(nqt): 10 mA, 0.5 T, 10²² m⁻³, 1 mm → 3.12 mV", () => {
    const h = hall(10, 0.5, 22, 1, "hole");
    expect(h.VH).toBeCloseTo(3.121e-3, 5);
  });
  it("electrons give a negative Hall voltage and R_H, holes positive, equal magnitude", () => {
    const e = hall(10, 0.5, 22, 1, "electron"), p = hall(10, 0.5, 22, 1, "hole");
    expect(e.VH).toBeLessThan(0);
    expect(p.VH).toBeGreaterThan(0);
    expect(e.VH).toBeCloseTo(-p.VH, 12);
    expect(p.RH).toBeCloseTo(1 / (1e22 * 1.602e-19), 8);
    expect(e.RH).toBeCloseTo(-p.RH, 12);
    expect(p.VH).toBeCloseTo(p.RH * 0.01 * 0.5 / 1e-3, 9);
  });
  it("drift velocity I/(nqwt) for the 5 mm wide slab", () => {
    expect(hall(10, 0.5, 22, 1, "hole").vd).toBeCloseTo(1.249, 2);
  });
  it("V_H scales linearly with I and B, inversely with n and t", () => {
    const a = hall(10, 0.5, 22, 1, "hole").VH;
    expect(hall(20, 0.5, 22, 1, "hole").VH).toBeCloseTo(2 * a, 12);
    expect(hall(10, 1, 22, 1, "hole").VH).toBeCloseTo(2 * a, 12);
    expect(hall(10, 0.5, 23, 1, "hole").VH).toBeCloseTo(a / 10, 12);
    expect(hall(10, 0.5, 22, 2, "hole").VH).toBeCloseTo(a / 2, 12);
  });
  it("Hall field equals v_d·B", () => {
    const h = hall(10, 0.5, 22, 1, "hole");
    expect(h.EH).toBeCloseTo(h.vd * 0.5, 9);
  });
  it("copper: n = 8.5 × 10²⁸ gives a nanovolt-scale Hall voltage", () => {
    expect(Math.abs(hall(10, 0.5, Math.log10(8.5e28), 1, "electron").VH)).toBeLessThan(1e-9);
  });
});
