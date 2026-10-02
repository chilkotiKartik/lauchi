import { describe, expect, it } from "vitest";
import { breakthrough, calorimeter, calTrace, cft, complementName, corrosion, dulong, ellingham, ionExchange, limeSoda, nmrInfo, nmrSpectrum, snMech, stribeck, viscAt } from "./chemx";

describe("crystal field theory", () => {
  it("[Co(NH₃)₆]³⁺ d⁶ strong field is low spin and diamagnetic; [CoF₆]³⁻ is high spin with 4 unpaired", () => {
    const ls = cft(6, "oct", 22900, 21000), hs = cft(6, "oct", 13000, 21000);
    expect(ls.unpaired).toBe(0); expect(ls.lowSpin).toBe(true); expect(ls.cfse).toBeCloseTo(-2.4, 6);
    expect(hs.unpaired).toBe(4); expect(hs.cfse).toBeCloseTo(-0.4, 6); expect(hs.mu).toBeCloseTo(4.899, 3);
  });
  it("d⁸ square planar [Ni(CN)₄]²⁻ is diamagnetic; tetrahedral [NiCl₄]²⁻ has 2 unpaired", () => {
    expect(cft(8, "sqp", 35000, 20000).unpaired).toBe(0);
    expect(cft(8, "tet", 8000, 20000).unpaired).toBe(2);
  });
  it("d³ and d¹⁰ never change", () => {
    expect(cft(3, "oct", 40000, 10000).unpaired).toBe(3);
    expect(cft(10, "oct", 20000, 20000).cfse).toBeCloseTo(0, 9);
  });
  it("absorbed light and colour", () => { expect(cft(1, "oct", 20300, 20000).lambdaNm).toBeCloseTo(492.6, 0); expect(complementName(500)).toBe("purple"); });
});

describe("Ellingham", () => {
  it("carbon reduces FeO only above the crossover (~1000 K)", () => {
    const e = ellingham("feo", "c_co", 900), h = ellingham("feo", "c_co", 1300);
    expect(e.feasible).toBe(false); expect(h.feasible).toBe(true);
    expect(e.cross).toBeGreaterThan(950); expect(e.cross).toBeLessThan(1050);
  });
  it("Al₂O₃ cannot be reduced by carbon below 2000 K", () => { expect(ellingham("al2o3", "c_co", 1800).feasible).toBe(false); });
  it("the Zn line bends up after boiling", () => {
    const a = ellingham("zno", "c_co", 1100).gOx, b = ellingham("zno", "c_co", 1300).gOx;
    expect((b - a) / 200).toBeGreaterThan(0.25);
  });
});

describe("water softening", () => {
  it("ion exchange: 100 L of resin at 40 g/L softens 16 000 L of 250 ppm water", () => {
    const r = ionExchange(150, 100, 100, 40);
    expect(r.breakthroughL).toBeCloseTo(16000, 6);
    expect(breakthrough(16000, 16000)).toBeCloseTo(0.5, 6);
    expect(breakthrough(5000, 16000)).toBeLessThan(0.01);
  });
  it("lime–soda matches the PYQ Q3.13 numbers", () => {
    const l = limeSoda(10, 5, 10, 10, 0, 50, 80, 90);
    expect(l.limeKg).toBeCloseTo(1.3875, 4);
    expect(l.sodaKg).toBeCloseTo(1.1778, 3);
  });
});

describe("corrosion", () => {
  it("acid and oxygen speed it up; enough cathodic current stops it", () => {
    expect(corrosion(3, 8, 1, "none", 0).rate).toBeGreaterThan(corrosion(7, 8, 1, "none", 0).rate);
    expect(corrosion(7, 12, 1, "none", 0).rate).toBeGreaterThan(corrosion(7, 2, 1, "none", 0).rate);
    const c = corrosion(7, 8, 1, "iccp", 5);
    expect(c.frac).toBe(1); expect(c.rate).toBe(0);
    expect(corrosion(3, 8, 1, "none", 0).mech).toMatch(/hydrogen/);
  });
  it("zinc anode wastes about 10.7 kg/A·year", () => { expect(corrosion(7, 8, 1, "zinc", 0).anodeKgPerYear / 0.6).toBeCloseTo(11.9, 0); });
});

describe("bomb calorimeter", () => {
  it("recovers the Dulong GCV and NCV = GCV − 0.09 H × 587", () => {
    const c = calorimeter(1, 80, 5, 2000, 500);
    expect(c.gcv).toBeCloseTo(dulong(80, 5), 6);
    expect(c.ncv).toBeCloseTo(dulong(80, 5) - 0.09 * 5 * 587, 6);
    expect(calTrace(0, c.dT, 0.02)).toBe(0);
    expect(calTrace(200, c.dT, 0.02)).toBeGreaterThan(c.dT * 0.9);
  });
});

describe("lubrication", () => {
  it("viscosity falls with temperature, less for high VI", () => {
    expect(viscAt(100, 100, 40)).toBe(100);
    expect(viscAt(100, 150, 100) / 100).toBeGreaterThan(viscAt(100, 0, 100) / 100);
  });
  it("regimes along the Stribeck curve", () => {
    expect(stribeck(15, 100, 120, 50, 9000).regime).toBe("boundary");
    expect(stribeck(220, 100, 40, 3000, 500).regime).toBe("hydrodynamic");
  });
});

describe("NMR", () => {
  it("Larmor frequency 42.58 MHz/T; multiplets shrink in ppm at higher field", () => {
    expect(nmrInfo("ethanol", 9.4).nu0).toBeCloseTo(400.2, 0);
    expect(nmrSpectrum("ethanol", 1.41).Jppm).toBeGreaterThan(nmrSpectrum("ethanol", 14.1).Jppm);
    const s = nmrSpectrum("chloroethane", 7.05);
    expect(s.lines.filter((l) => Math.abs(l.d - 3.57) < 0.1)).toHaveLength(4); // quartet
    expect(nmrInfo("isobutylbr", 7.05).signals).toBe(3);
    expect(nmrInfo("tbutylbenz", 7.05).totalH).toBe(14);
  });
});

describe("SN1 / SN2", () => {
  it("methyl + strong Nu + aprotic → SN2; tertiary + protic → SN1", () => {
    expect(snMech("methyl", true, "aprotic", 1, 298).main).toBe("SN2");
    expect(snMech("tertiary", false, "protic", 1, 298).main).toBe("SN1");
    expect(snMech("tertiary", false, "protic", 1, 298).inversionPct).toBeCloseTo(50, 0);
    expect(snMech("primary", true, "aprotic", 1, 298).inversionPct).toBeGreaterThan(99);
  });
});
