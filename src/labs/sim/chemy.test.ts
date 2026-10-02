import { describe, expect, it } from "vitest";
import {
  alkalinity, alkPH, bands, beer, chainPopulation, CHROMO, DA_DH, DA_DS, dielsAlder, epsAt, hess, IR_MOLS, irMode, lubricant, modeCount, nmToHex,
  polyGrowth, ro, sci, seenColour, stepGrowth, viscAt, viscIndex, vulcan,
} from "./chemy";

describe("band theory", () => {
  it("silicon at 300 K has n_i ≈ 10¹⁰ cm⁻³ and an absorption edge near 1100 nm", () => {
    const b = bands(1.12, 300, "none");
    expect(b.ni).toBeGreaterThan(5e9); expect(b.ni).toBeLessThan(2e10);
    expect(b.edgeNm).toBeCloseTo(1107, 0);
    expect(b.cls).toBe("Semiconductor");
    expect(b.Ef).toBeCloseTo(0.56, 6);
  });
  it("classifies metals and insulators", () => {
    expect(bands(0, 300, "none").cls).toMatch(/Conductor/);
    const d = bands(5.47, 300, "none");
    expect(d.cls).toBe("Insulator");
    expect(d.ni).toBeLessThan(1e-20);
  });
  it("carriers grow with temperature; donors set n ≈ N_D and lift E_F", () => {
    expect(bands(1.12, 400, "none").ni).toBeGreaterThan(bands(1.12, 300, "none").ni * 100);
    const n = bands(1.12, 300, "n");
    expect(n.n).toBeCloseTo(1e16, -10);
    expect(n.p).toBeLessThan(1e5);
    expect(n.Ef).toBeGreaterThan(0.9);
    expect(bands(1.12, 300, "p").Ef).toBeLessThan(0.25);
  });
});

describe("Hess's law", () => {
  it("PYQ: ΔHf of methane from heats of combustion = −74.8 kJ/mol", () => {
    const h = hess("ch4", -393.5, -285.83, -890.36);
    expect(h.dH).toBeCloseTo(-74.8, 1);
    expect(h.nature).toBe("Exothermic");
    expect(h.dU).toBeCloseTo(-74.8 + 2.479, 2); // Δn_g = −1
  });
  it("PYQ: hydrogenation of ethene = −136.8 kJ/mol", () => {
    expect(hess("hydrog", -1411, -285.8, -1560).dH).toBeCloseTo(-136.8, 6);
  });
  it("graphite → diamond is slightly endothermic and ΔU = ΔH (no gas)", () => {
    const h = hess("diamond", -393.5, 0, -395.4);
    expect(h.dH).toBeCloseTo(1.9, 6);
    expect(h.dU).toBeCloseTo(h.dH, 9);
    expect(h.nature).toBe("Endothermic");
  });
});

describe("reverse osmosis", () => {
  it("sea water (35 g/L NaCl, 25 °C) has π ≈ 29.7 bar", () => {
    expect(ro(60, 35, 25, 1, "nacl").pi).toBeCloseTo(29.7, 1);
  });
  it("5 % sucrose at 25 °C: π = CRT ≈ 3.62 bar; i = 3 for CaCl₂", () => {
    expect(ro(10, 50, 25, 1, "sucrose").pi).toBeCloseTo(3.62, 2);
    expect(ro(10, 11.098, 25, 1, "cacl2").pi).toBeCloseTo(3 * 0.1 * 0.0831446 * 298.15, 3);
  });
  it("flux is A(ΔP − π): zero at ΔP = π, reversed with no pressure, permeate only in RO", () => {
    const a = ro(60, 35, 25, 2, "nacl");
    expect(a.J).toBeCloseTo(2 * (60 - a.pi), 9);
    expect(a.permeateMgL).toBeCloseTo(175, 6);
    const n = ro(0, 35, 25, 1, "nacl");
    expect(n.J).toBeLessThan(0); expect(n.mode).toMatch(/Natural osmosis/); expect(n.permeateMgL).toBe(0);
    expect(ro(0, 0, 25, 1, "nacl").J).toBe(0);
  });
});

describe("alkalinity", () => {
  it("P < ½M: CO₃²⁻ = 2P, HCO₃⁻ = M − 2P (100 mL, N/50 acid, P = 5 mL, M = 15 mL)", () => {
    const a = alkalinity(5, 15, 0.02, 100);
    expect(a.P).toBeCloseTo(50, 9); expect(a.M).toBeCloseTo(150, 9);
    expect(a.CO3).toBeCloseTo(100, 9); expect(a.HCO3).toBeCloseTo(50, 9); expect(a.OH).toBe(0);
  });
  it("P > ½M gives OH⁻ + CO₃²⁻; P = M only OH⁻; P = 0 only HCO₃⁻", () => {
    const a = alkalinity(12, 15, 0.02, 100);
    expect(a.OH).toBeCloseTo(90, 9); expect(a.CO3).toBeCloseTo(60, 9); expect(a.HCO3).toBe(0);
    expect(alkalinity(15, 15, 0.02, 100).OH).toBeCloseTo(150, 9);
    expect(alkalinity(0, 10, 0.02, 100).HCO3).toBeCloseTo(100, 9);
    const s = alkalinity(7.5, 15, 0.02, 100);
    expect(s.CO3).toBeCloseTo(150, 9); expect(s.OH + s.HCO3).toBe(0);
  });
  it("titration curve: phenolphthalein end point near pH 8.3, methyl orange end point near pH 4.3", () => {
    const pH = (v: number) => alkPH(v, 0, 150, 0, 0.02, 100);
    expect(pH(0)).toBeGreaterThan(10);
    expect(pH(7.5)).toBeCloseTo(8.3, 0);
    expect(pH(15)).toBeGreaterThan(3.9); expect(pH(15)).toBeLessThan(4.7);
    expect(pH(10)).toBeLessThan(pH(5));
  });
});

describe("step vs chain growth", () => {
  it("Carothers: p = 0.99 gives X̄n = 100, PDI → 2", () => {
    const s = stepGrowth(0.99);
    expect(s.Xn).toBeCloseTo(100, 6); expect(s.PDI).toBeCloseTo(1.99, 9);
    expect(stepGrowth(0.5).Xn).toBeCloseTo(2, 9);
  });
  it("stoichiometric imbalance r = 0.98 caps X̄n at 99 even at full conversion", () => {
    expect(stepGrowth(1, 0.98).Xn).toBeCloseTo(99, 6);
  });
  it("Nylon-6,6 (M₀ = 113) at 99 % has Mn ≈ 11 300; chain growth leaves 1 − p monomer", () => {
    const g = polyGrowth(0.99, 1, 113, 1000);
    expect(g.Mn).toBeCloseTo(11300, 0);
    expect(g.chainMonomerLeft).toBeCloseTo(0.01, 9); expect(g.monomerLeft).toBeCloseTo(1e-4, 9);
  });
  it("population pictures conserve repeat units", () => {
    for (const m of ["step", "chain"] as const) expect(chainPopulation(m, 0.9, 240).reduce((a, b) => a + b, 0)).toBe(240);
    expect(chainPopulation("chain", 0.25, 200).filter((x) => x === 1).length).toBe(150);
  });
});

describe("viscosity index and lubricant points", () => {
  it("PYQ: U = 600, H = 500, L = 800 SUS gives VI = 66.7", () => {
    expect(viscIndex(600, 500, 800)).toBeCloseTo(66.67, 2);
    expect(viscIndex(500, 500, 800)).toBeCloseTo(100, 9);
    expect(viscIndex(800, 500, 800)).toBeCloseTo(0, 9);
    expect(viscIndex(600, 800, 800)).toBeNaN();
  });
  it("viscosity chart passes through both reference points and falls with temperature", () => {
    expect(viscAt(600, 37.78)).toBeCloseTo(600, 0);
    expect(viscAt(600, 98.89)).toBeCloseTo(60, 0);
    expect(viscAt(600, 20)).toBeGreaterThan(600);
  });
  it("state ladder: pour < cloud < flash < fire", () => {
    const st = (T: number) => lubricant(600, 500, 800, T, 200, 230, -5, -12).state;
    expect(st(-20)).toMatch(/Solid/); expect(st(-8)).toMatch(/Cloudy/); expect(st(40)).toMatch(/Clear/);
    expect(st(210)).toMatch(/flash/); expect(st(240)).toMatch(/fire/);
  });
});

describe("UV–Vis and Beer–Lambert", () => {
  it("A = εcl at λmax: butadiene 0.02 mM in 1 cm → A = 0.42, %T ≈ 38", () => {
    const b = beer("butadiene", 0.02, 1, 217);
    expect(b.A).toBeCloseTo(0.42, 6); expect(b.T).toBeCloseTo(38.0, 1);
    expect(beer("butadiene", 0.04, 1, 217).A).toBeCloseTo(0.84, 6);
    expect(beer("butadiene", 0.02, 2, 217).A).toBeCloseTo(0.84, 6);
  });
  it("conjugation shifts λmax to longer wavelength (bathochromic shift)", () => {
    expect(CHROMO.ethene.lmax).toBeLessThan(CHROMO.butadiene.lmax);
    expect(CHROMO.butadiene.lmax).toBeLessThan(CHROMO.hexatriene.lmax);
    expect(CHROMO.ethane.lmax).toBeLessThan(CHROMO.butadiene.lmax);
    expect(epsAt("butadiene", 300)).toBeLessThan(epsAt("butadiene", 217) * 0.01);
  });
  it("β-carotene absorbs blue (452 nm) and looks orange; butadiene ΔE ≈ 5.7 eV", () => {
    expect(seenColour(452)).toMatch(/orange/i);
    expect(beer("butadiene", 1, 1, 217).eV).toBeCloseTo(5.71, 2);
    expect(nmToHex(650)).toBe("#ff0000");
  });
});

describe("Diels–Alder", () => {
  it("ΔH° and ΔS° from tabulated data: −167.6 kJ/mol and −187.5 J/(mol K)", () => {
    expect(DA_DH).toBeCloseTo(-167.6, 6); expect(DA_DS).toBeCloseTo(-187.5, 6);
  });
  it("spontaneous at room temperature, reverses (retro-Diels–Alder) above ≈ 894 K", () => {
    const a = dielsAlder(298, "ethene", 1);
    expect(a.dG).toBeCloseTo(-111.7, 1); expect(a.spont).toBe(true);
    expect(a.Tc).toBeCloseTo(893.9, 0);
    expect(dielsAlder(1000, "ethene", 1).spont).toBe(false);
  });
  it("electron-poor dienophiles react faster; second-order half-life halves when c₀ doubles", () => {
    expect(dielsAlder(400, "maleic", 1).k).toBeGreaterThan(dielsAlder(400, "acrolein", 1).k);
    expect(dielsAlder(400, "acrolein", 1).k).toBeGreaterThan(dielsAlder(400, "ethene", 1).k);
    expect(dielsAlder(400, "ethene", 2).half).toBeCloseTo(dielsAlder(400, "ethene", 1).half / 2, 6);
  });
});

describe("IR normal modes", () => {
  it("3N − 6 for bent H₂O, 3N − 5 for linear CO₂ and diatomics", () => {
    expect(modeCount(IR_MOLS.h2o)).toBe(3); expect(modeCount(IR_MOLS.co2)).toBe(4); expect(modeCount(IR_MOLS.hcl)).toBe(1);
  });
  it("selection rules: CO₂ symmetric stretch and N₂ are IR inactive, CO₂ asymmetric stretch is active", () => {
    expect(irMode("co2", 1, 1).mode.ir).toBe(false);
    expect(irMode("co2", 4, 1).mode.ir).toBe(true);
    expect(irMode("n2", 1, 1).mode.ir).toBe(false);
    expect(irMode("n2", 4, 1).idx).toBe(0);
  });
  it("PYQ: H₂O at 3652 cm⁻¹ → D₂O ≈ 2660 cm⁻¹; HCl → DCl ≈ 2070 cm⁻¹", () => {
    expect(irMode("h2o", 1, 2.014 / 1.008).nu).toBeCloseTo(2659, -1);
    expect(irMode("hcl", 1, 2.014 / 1.008).nu).toBeCloseTo(2069, -1);
    expect(irMode("h2o", 1, 1).nu).toBe(3652);
  });
  it("normal modes do not move the centre of mass", () => {
    for (const m of Object.values(IR_MOLS)) for (const md of m.modes) for (let ax = 0; ax < 3; ax++) {
      expect(m.atoms.reduce((s, a, i) => s + a.m * md.vec[i][ax], 0)).toBeCloseTo(0, 1);
    }
  });
});

describe("vulcanisation", () => {
  it("3 phr S at 8 S atoms per crosslink gives G ≈ 0.52 MPa, Mc ≈ 4400 g/mol", () => {
    const v = vulcan(3, 8, 298, 2);
    expect(v.G / 1e6).toBeCloseTo(0.52, 2);
    expect(v.Mc).toBeGreaterThan(4300); expect(v.Mc).toBeLessThan(4500);
    expect(v.E).toBeCloseTo(3 * v.G, 6);
  });
  it("raw rubber has no network; modulus ∝ T (entropy spring)", () => {
    expect(vulcan(0, 8, 298, 2).G).toBe(0);
    expect(vulcan(3, 8, 400, 2).G / vulcan(3, 8, 200, 2).G).toBeCloseTo(2, 9);
    expect(vulcan(40, 8, 298, 2).cls).toMatch(/Ebonite/);
  });
  it("neo-Hookean stress is zero unstretched and rises with λ", () => {
    expect(vulcan(3, 8, 298, 1).stress).toBeCloseTo(0, 9);
    expect(vulcan(3, 8, 298, 3).stress).toBeGreaterThan(vulcan(3, 8, 298, 2).stress);
  });
});

describe("formatting", () => {
  it("sci() writes powers of ten", () => {
    expect(sci(9.8e9)).toBe("9.80 × 10⁹");
    expect(sci(1.5e-27)).toBe("1.50 × 10⁻²⁷");
    expect(sci(12.3)).toBe("12.3");
  });
});
