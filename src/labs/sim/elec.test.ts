import { describe, expect, it } from "vitest";
import { MATERIALS, TAU, coilAxis, gapField, hysteresis, induction, loadPower, loopAreaExact, loopPoints, phaseCurrent, polygonArea, resultantInto, si, syncSpeed, thevenin, threePhase, transformer } from "./elec";

describe("thevenin", () => {
  it("12 V, 10 Ω and 20 Ω: Vth = 8 V, Rth = 6.667 Ω", () => {
    const T = thevenin(12, 10, 20, 10);
    expect(T.Vth).toBeCloseTo(8, 9);
    expect(T.Rth).toBeCloseTo(20 / 3, 9);
  });
  it("KCL: I1 = I2 + IL and P_L = V_L·I_L", () => {
    const T = thevenin(24, 5, 15, 7);
    expect(T.I1).toBeCloseTo(T.I2 + T.IL, 9);
    expect(T.PL).toBeCloseTo(T.VL * T.IL, 12);
  });
  it("power peaks at R_L = R_th with P = Vth²/4Rth, and the peak efficiency of the source is under 100 %", () => {
    const T = thevenin(12, 10, 20, 20 / 3);
    expect(T.PL).toBeCloseTo(T.Pmax, 9);
    expect(loadPower(T.Vth, T.Rth, T.Rth * 0.8)).toBeLessThan(T.Pmax);
    expect(loadPower(T.Vth, T.Rth, T.Rth * 1.25)).toBeLessThan(T.Pmax);
    expect(T.eff).toBeLessThan(1);
  });
});

describe("three-phase", () => {
  it("star: V_L = √3 V_ph, I_L = I_ph; delta: V_L = V_ph, I_L = √3 I_ph", () => {
    const s = threePhase(230, "star", 20, 0, false), d = threePhase(230, "delta", 20, 0, false);
    expect(s.VL).toBeCloseTo(230 * Math.sqrt(3), 9); expect(s.IL).toBeCloseTo(s.Iph, 12);
    expect(d.VL).toBe(230); expect(d.IL).toBeCloseTo(d.Iph * Math.sqrt(3), 12);
  });
  it("on the same line voltage delta takes three times the star power for the same phase impedance", () => {
    expect(threePhase(400, "delta", 20, 30, false).P / threePhase(400 / Math.sqrt(3), "star", 20, 30, false).P).toBeCloseTo(3, 9);
  });
  it("P² + Q² = S² and leading load gives Q < 0", () => {
    const r = threePhase(230, "star", 15, 40, true);
    expect(r.P ** 2 + r.Q ** 2).toBeCloseTo(r.S ** 2, 4);
    expect(r.Q).toBeLessThan(0);
    expect(r.pf).toBeCloseTo(Math.cos((40 * Math.PI) / 180), 12);
  });
});

describe("hysteresis", () => {
  it("loop area of a saturating loop tends to 4·Bs·Hc", () => {
    const m = MATERIALS.silicon;
    expect(loopAreaExact(m, 1e5)).toBeCloseTo(4 * m.Bs * m.Hc, 3);
  });
  it("numerical loop area matches the exact integral", () => {
    const m = MATERIALS.softiron, Hm = 400;
    expect(polygonArea(loopPoints(m, Hm, 800))).toBeCloseTo(loopAreaExact(m, Hm), 0);
  });
  it("hard steel loses far more per cycle than silicon steel; loss scales with f and volume", () => {
    const hard = hysteresis("hardsteel", 1.5, 50, 100), soft = hysteresis("silicon", 1.5, 50, 100);
    expect(hard.area).toBeGreaterThan(20 * soft.area);
    expect(hysteresis("silicon", 1.5, 100, 200).P).toBeCloseTo(soft.P * 4, 9);
  });
  it("coercivity and retentivity are positive and below the material limits", () => {
    const h = hysteresis("softiron", 2, 50, 100);
    expect(h.Hc).toBeGreaterThan(0); expect(h.Br).toBeGreaterThan(0); expect(h.Br).toBeLessThan(MATERIALS.softiron.Bs);
  });
});

describe("transformer", () => {
  it("V2/V1 = N2/N1 and V1·I1 = V2·I2", () => {
    const T = transformer(230, 500, 100, 50, 10, 20);
    expect(T.V2).toBeCloseTo(46, 9); expect(T.I1 * 230).toBeCloseTo(T.V2 * T.I2, 9); expect(T.kind).toBe("step-down");
  });
  it("EMF equation: Φm = V/(4.44 f N)", () => {
    const T = transformer(230, 500, 100, 50, 10, 20);
    expect(T.phim).toBeCloseTo(230 / (4.44 * 50 * 500), 12);
    expect(T.Bm).toBeCloseTo(T.phim / 0.002, 12);
  });
  it("flags saturation above 1.6 T", () => {
    expect(transformer(230, 120, 60, 50, 20, 10).saturated).toBe(true);
    expect(transformer(230, 500, 100, 50, 10, 20).saturated).toBe(false);
  });
});

describe("rotating field", () => {
  it("N_s = 120f/P: 2 poles 50 Hz is 3000 rpm, 6 poles 1000 rpm", () => {
    expect(syncSpeed(50, 2)).toBe(3000); expect(syncSpeed(50, 6)).toBe(1000);
  });
  it("4 % slip on 3000 rpm gives 2880 rpm and a 2 Hz rotor current", () => {
    const m = induction(50, 2, 0.04);
    expect(m.N).toBeCloseTo(2880, 9); expect(m.fr).toBeCloseTo(2, 12); expect(m.slipRpm).toBeCloseTo(120, 9);
  });
  it("the three currents sum to zero and the resultant has constant size 1.5", () => {
    const out = [0, 0];
    for (const wt of [0, 0.7, 2.1, 4]) {
      expect(phaseCurrent(0, wt) + phaseCurrent(1, wt) + phaseCurrent(2, wt)).toBeCloseTo(0, 12);
      resultantInto(out, wt, 1);
      expect(Math.hypot(out[0], out[1])).toBeCloseTo(1.5, 12);
    }
  });
  it("swapping two phases reverses the rotation direction", () => {
    const a = [0, 0], b = [0, 0];
    resultantInto(a, 0.5, 1); resultantInto(b, 0.6, 1);
    const da = Math.atan2(b[1], b[0]) - Math.atan2(a[1], a[0]);
    resultantInto(a, 0.5, -1); resultantInto(b, 0.6, -1);
    const db = Math.atan2(b[1], b[0]) - Math.atan2(a[1], a[0]);
    expect(da).toBeGreaterThan(0); expect(db).toBeLessThan(0);
  });
  it("air-gap field is a travelling wave 1.5·cos(pp θ − ωt)", () => {
    expect(gapField(0.3, 2, 1.1, 1)).toBeCloseTo(1.5 * Math.cos(2 * 0.3 - 1.1), 12);
    expect(coilAxis(1, 1)).toBeCloseTo(TAU / 3, 12);
  });
});

describe("si()", () => {
  it("formats with SI prefixes", () => { expect(si(0.00207, "Wb")).toBe("2.07 mWb"); expect(si(2500, "W")).toBe("2.5 kW"); });
});
