import { describe, expect, it } from "vitest";
import {
  ORBITAL_IDS, atomFill, chainLengths, diatomicSpectrum, fmtPow10, gibbs, hardness, hardnessClass, molarMasses, moSpecies, moFill,
  mulberry32, boilResult, nernstCell, orbitalInfo, psi, radialR, sampleOrbital, SPEC_MOLS, MONOMERS, rotPopulation, sup,
} from "./chem";

describe("hydrogen orbitals", () => {
  it("node counts and energies", () => {
    expect(orbitalInfo("2s").radialNodes).toBe(1);
    expect(orbitalInfo("3s").radialNodes).toBe(2);
    expect(orbitalInfo("2pz").radialNodes).toBe(0);
    expect(orbitalInfo("3dz2").angularNodes).toBe(2);
    expect(orbitalInfo("3pz").radialNodes).toBe(1);
    expect(orbitalInfo("1s").energyEv).toBeCloseTo(-13.6, 6);
    expect(orbitalInfo("3s").energyEv).toBeCloseTo(-1.511, 3);
  });
  it("radial functions are normalised", () => {
    for (const id of ORBITAL_IDS) expect(orbitalInfo(id).norm, id).toBeCloseTo(1, 2);
  });
  it("1s most probable radius is a0, 2p is 4 a0, 2s radial node is at 2 a0", () => {
    expect(orbitalInfo("1s").rMostProbable).toBeCloseTo(1, 3);
    expect(orbitalInfo("2pz").rMostProbable).toBeCloseTo(4, 3);
    expect(orbitalInfo("2s").nodeRadii).toHaveLength(1);
    expect(orbitalInfo("2s").nodeRadii[0]).toBeCloseTo(2, 3);
    expect(orbitalInfo("3s").nodeRadii).toHaveLength(2);
    expect(orbitalInfo("3s").nodeRadii[0]).toBeCloseTo(1.9, 1);
    expect(orbitalInfo("3s").nodeRadii[1]).toBeCloseTo(7.1, 1);
  });
  it("sampling is deterministic and honours nodal planes", () => {
    const a = sampleOrbital("2pz", 500), b = sampleOrbital("2pz", 500);
    expect(Array.from(a.pos.slice(0, 30))).toEqual(Array.from(b.pos.slice(0, 30)));
    // 2pz: no sample on the xy plane except by chance; lobes have both signs, sign follows z
    let pos = 0, neg = 0;
    for (let i = 0; i < 500; i++) { if (a.sign[i] > 0) pos++; else neg++; expect(Math.sign(a.pos[i * 3 + 2]) === a.sign[i] || Math.abs(a.pos[i * 3 + 2]) < 1e-3).toBe(true); }
    expect(pos).toBeGreaterThan(150); expect(neg).toBeGreaterThan(150);
    const s = sampleOrbital("2s", 2000);
    let inner = 0; for (let i = 0; i < 2000; i++) if (s.r[i] < 2) inner++;
    // P(r < 2 a0) for 2s is about 0.05 + ... just check both signs present
    expect(inner).toBeGreaterThan(50); expect(inner).toBeLessThan(1900);
  });
  it("mean radius of 1s samples is 1.5 a0", () => {
    const s = sampleOrbital("1s", 6000);
    let m = 0; for (let i = 0; i < 6000; i++) m += s.r[i]; m /= 6000;
    expect(m).toBeGreaterThan(1.42); expect(m).toBeLessThan(1.58);
  });
  it("psi signs", () => {
    expect(psi("2pz", 0, 0, 1)).toBeGreaterThan(0);
    expect(psi("2pz", 0, 0, -1)).toBeLessThan(0);
    expect(psi("2s", 0, 0, 1)).toBeGreaterThan(0);
    expect(psi("2s", 0, 0, 3)).toBeLessThan(0);
    expect(radialR(1, 0, 0)).toBeCloseTo(2, 9);
  });
});

describe("molecular orbital theory", () => {
  it("bond orders", () => {
    expect(moSpecies("o2").bondOrder).toBe(2);
    expect(moSpecies("n2").bondOrder).toBe(3);
    expect(moSpecies("he2").bondOrder).toBe(0);
    expect(moSpecies("h2").bondOrder).toBe(1);
    expect(moSpecies("he2p").bondOrder).toBe(0.5);
    expect(moSpecies("li2").bondOrder).toBe(1);
    expect(moSpecies("b2").bondOrder).toBe(1);
    expect(moSpecies("c2").bondOrder).toBe(2);
    expect(moSpecies("o2p").bondOrder).toBe(2.5);
    expect(moSpecies("o2m").bondOrder).toBe(1.5);
    expect(moSpecies("o2mm").bondOrder).toBe(1);
    expect(moSpecies("f2").bondOrder).toBe(1);
    expect(moSpecies("ne2").bondOrder).toBe(0);
  });
  it("magnetism", () => {
    expect(moSpecies("o2").unpaired).toBe(2);
    expect(moSpecies("o2").magnetic).toContain("Paramagnetic");
    expect(moSpecies("n2").unpaired).toBe(0);
    expect(moSpecies("n2").magnetic).toBe("Diamagnetic");
    expect(moSpecies("b2").unpaired).toBe(2); // s-p mixing puts the last 2 e- in degenerate pi
    expect(moSpecies("c2").unpaired).toBe(0);
    expect(moSpecies("o2p").unpaired).toBe(1);
    expect(moSpecies("o2m").unpaired).toBe(1);
    expect(moSpecies("o2mm").unpaired).toBe(0);
    expect(moSpecies("he2p").unpaired).toBe(1);
    expect(moSpecies("f2").unpaired).toBe(0);
  });
  it("configuration strings and ordering", () => {
    expect(moSpecies("o2").config).toBe("σ1s² σ*1s² σ2s² σ*2s² σ2pz² π2p⁴ π*2p²");
    expect(moSpecies("n2").config).toBe("σ1s² σ*1s² σ2s² σ*2s² π2p⁴ σ2pz²");
    expect(moSpecies("n2").mixed).toBe(true);
    expect(moSpecies("o2").mixed).toBe(false);
    expect(moSpecies("h2").config).toBe("σ1s²");
  });
  it("electron counts and formulas", () => {
    expect(moFill("O2", -2).electrons).toBe(18);
    expect(moFill("O2", 1).electrons).toBe(15);
    expect(moSpecies("o2mm").formula).toBe("O₂²⁻");
    expect(moSpecies("he2p").formula).toBe("He₂⁺");
    expect(moSpecies("o2").formula).toBe("O₂");
    expect(moSpecies("he2").verdict).toContain("Does not exist");
  });
  it("atom fill obeys Hund", () => {
    expect(atomFill(8)).toEqual({ s1: 2, s2: 2, p: 4, pUp: 3, pDown: 1 });
    expect(atomFill(1).s1).toBe(1);
  });
});

describe("Nernst / galvanic cells", () => {
  it("standard cell potentials", () => {
    expect(nernstCell("daniell", 0, 0, 298.15).E0).toBeCloseTo(1.1, 9);
    expect(nernstCell("znag", 0, 0, 298.15).E0).toBeCloseTo(1.56, 9);
    expect(nernstCell("cuag", 0, 0, 298.15).E0).toBeCloseTo(0.46, 9);
    expect(nernstCell("fecu", 0, 0, 298.15).E0).toBeCloseTo(0.78, 9);
  });
  it("n and Q", () => {
    expect(nernstCell("daniell", 0, 0, 298).n).toBe(2);
    expect(nernstCell("znag", 0, 0, 298).n).toBe(2);
    expect(nernstCell("cuag", 0, 0, 298).n).toBe(2);
    const c = nernstCell("znag", -1, -2, 298); // Q = [Zn]/[Ag]^2 = 0.1 / 1e-4 = 1000
    expect(c.log10Q).toBeCloseTo(3, 9);
  });
  it("E = E0 at Q = 1 and drops 29.6 mV per decade of Q (n=2, 298 K)", () => {
    const a = nernstCell("daniell", 0, 0, 298.15), b = nernstCell("daniell", 1, 0, 298.15);
    expect(a.E).toBeCloseTo(a.E0, 12);
    expect(a.E - b.E).toBeCloseTo(0.02959, 4);
  });
  it("Delta G and K for Daniell", () => {
    const c = nernstCell("daniell", 0, 0, 298.15);
    expect(c.dGkJ).toBeCloseTo(-212.3, 0);
    expect(c.log10K).toBeCloseTo(37.2, 1);
  });
  it("cell dies at equilibrium: Q = K gives E = 0, dG = 0", () => {
    const c0 = nernstCell("daniell", 0, 0, 298.15);
    const c = nernstCell("daniell", c0.log10K, 0, 298.15);
    expect(Math.abs(c.E)).toBeLessThan(1e-9);
    expect(Math.abs(c.dGkJ)).toBeLessThan(1e-6);
  });
  it("fmtPow10", () => {
    expect(fmtPow10(37.2)).toBe("1.58 × 10³⁷");
    expect(fmtPow10(2)).toBe("100");
    expect(sup("-12")).toBe("⁻¹²");
  });
});

describe("Gibbs free energy", () => {
  it("water vaporisation crossover is about 373 K", () => {
    const g = gibbs(40.7, 109, 373);
    expect(g.Tcross).toBeCloseTo(373.4, 0);
    expect(Math.abs(g.dG)).toBeLessThan(0.1);
    expect(gibbs(40.7, 109, 300).spontaneous).toBe(false);
    expect(gibbs(40.7, 109, 400).spontaneous).toBe(true);
  });
  it("CaCO3 decomposition needs about 1100 K", () => {
    expect(gibbs(178, 161, 300).Tcross).toBeCloseTo(1105.6, 0);
    expect(gibbs(178, 161, 1000).spontaneous).toBe(false);
    expect(gibbs(178, 161, 1200).spontaneous).toBe(true);
  });
  it("Haber: spontaneous at 298 K (ΔG ≈ −33 kJ) and reverses above ~464 K", () => {
    const g = gibbs(-92.2, -198.7, 298);
    expect(g.dG).toBeCloseTo(-33.0, 0);
    expect(g.Tcross).toBeCloseTo(464, 0);
    expect(gibbs(-92.2, -198.7, 600).spontaneous).toBe(false);
  });
  it("K = e^(-ΔG/RT) and no crossover when signs favour or forbid always", () => {
    const g = gibbs(-10, 50, 300);
    expect(g.Tcross).toBeNull();
    expect(g.log10K).toBeCloseTo((10 + 15) * 1000 / (8.314462618 * 300 * Math.LN10), 6);
    expect(gibbs(10, -50, 300).Tcross).toBeNull();
    expect(gibbs(-10, 50, 300).regime).toContain("every T");
    expect(gibbs(0, 0, 300).dG).toBe(0);
  });
});

describe("hardness of water", () => {
  it("100 mg/L Ca2+ = 250 ppm CaCO3, 50 mg/L Mg2+ = 208 ppm", () => {
    expect(hardness(100, 0, 0).total).toBeCloseTo(250, 9);
    expect(hardness(0, 24, 0).total).toBeCloseTo(100, 9);
    expect(hardness(0, 12, 0).total).toBeCloseTo(50, 9);
  });
  it("temporary / permanent / Clark", () => {
    const h = hardness(80, 24, 244); // Ca 200 + Mg 100 = 300; HCO3 244 -> 200 as CaCO3
    expect(h.total).toBeCloseTo(300, 9);
    expect(h.alkalinity).toBeCloseTo(200, 9);
    expect(h.temporary).toBeCloseTo(200, 9);
    expect(h.permanent).toBeCloseTo(100, 9);
    expect(h.clark).toBeCloseTo(21, 9);
    expect(h.cls).toBe("Hard");
    const b = hardness(80, 24, 244, true);
    expect(b.remaining).toBeCloseTo(100, 9);
    expect(b.cls).toBe("Moderately hard");
  });
  it("temporary never exceeds total", () => {
    const h = hardness(10, 0, 500);
    expect(h.temporary).toBeCloseTo(25, 9);
    expect(h.permanent).toBe(0);
  });
  it("boiling removes exactly the temporary hardness", () => {
    const b = boilResult(80, 24, 244);
    expect(b.precip).toBeCloseTo(200, 9);
    expect(b.ca).toBe(0); // 200 ppm of Ca hardness all precipitated
    expect(b.mg).toBeCloseTo(24, 9);
    expect(b.hco3).toBeCloseTo(0, 9);
    const after = hardness(b.ca, b.mg, b.hco3);
    expect(after.total).toBeCloseTo(hardness(80, 24, 244, true).remaining, 9);
    const c = boilResult(20, 24, 244); // Ca 50 ppm + Mg 100 ppm = 150, alk 200 -> temporary 150, everything goes
    expect(hardness(c.ca, c.mg, c.hco3).total).toBeCloseTo(0, 9);
  });
  it("classification bands", () => {
    expect(hardnessClass(74.9)).toBe("Soft");
    expect(hardnessClass(75)).toBe("Moderately hard");
    expect(hardnessClass(150)).toBe("Hard");
    expect(hardnessClass(300)).toBe("Hard");
    expect(hardnessClass(300.1)).toBe("Very hard");
  });
});

describe("polymers", () => {
  it("chain lengths are seeded", () => {
    expect(Array.from(chainLengths(100, 0.5, 20))).toEqual(Array.from(chainLengths(100, 0.5, 20)));
    expect(mulberry32(1)()).toBe(mulberry32(1)());
  });
  it("monodisperse chains give PDI 1 and Mn = n·M0", () => {
    const m = molarMasses(chainLengths(500, 0, 300), MONOMERS.ethylene.m0);
    expect(m.PDI).toBeCloseTo(1, 9);
    expect(m.Mn).toBeCloseTo(14000, 6);
  });
  it("PDI grows with spread and tracks e^(sigma^2)", () => {
    const a = molarMasses(chainLengths(500, 0.3), 28).PDI, b = molarMasses(chainLengths(500, 0.8), 28).PDI;
    expect(b).toBeGreaterThan(a);
    expect(a).toBeCloseTo(Math.exp(0.09), 1);
    expect(molarMasses(chainLengths(500, 0.5), 28).DPn).toBeGreaterThan(450);
    expect(molarMasses(chainLengths(500, 0.5), 28).DPn).toBeLessThan(550);
    expect(molarMasses([1, 3], 10)).toEqual({ Mn: 20, Mw: (100 + 900) / 40, PDI: 25 / 20, DPn: 2 });
  });
});

describe("vibrational and rotational spectroscopy", () => {
  it("HCl stretch is about 2990 cm-1", () => {
    const m = SPEC_MOLS.HCl;
    const s = diatomicSpectrum(1, 35, m.k, m.r);
    expect(s.nu).toBeGreaterThan(2950); expect(s.nu).toBeLessThan(3030);
    expect(s.mu).toBeCloseTo(35 / 36, 6);
  });
  it("HCl rotational constant is about 10.6 cm-1 (spacing 21 cm-1)", () => {
    const m = SPEC_MOLS.HCl, s = diatomicSpectrum(m.m1, m.m2, m.k, m.r);
    expect(s.B).toBeCloseTo(10.6, 0);
    expect(s.spacing).toBeCloseTo(2 * s.B, 12);
  });
  it("CO stretch about 2170 cm-1 and B about 1.93 cm-1", () => {
    const m = SPEC_MOLS.CO, s = diatomicSpectrum(m.m1, m.m2, m.k, m.r);
    expect(s.nu).toBeCloseTo(2170, -1);
    expect(s.B).toBeCloseTo(1.93, 1);
  });
  it("H2 stretch is about 4400 cm-1 and N2 about 2360 cm-1", () => {
    expect(diatomicSpectrum(1.008, 1.008, 575, 74.1).nu).toBeCloseTo(4400, -2);
    expect(diatomicSpectrum(14.003, 14.003, 2295, 109.8).nu).toBeCloseTo(2360, -1);
  });
  it("zero-point energy is hν̃/2", () => {
    const s = diatomicSpectrum(1, 35, 516, 127.5);
    expect(s.zpeCm).toBeCloseTo(s.nu / 2, 9);
    expect(s.zpeKJ).toBeCloseTo(s.nu * 0.011963 / 2, 2); // 1 cm-1 = 0.011963 kJ/mol
  });
  it("homonuclear flags and rotational populations", () => {
    expect(SPEC_MOLS.H2.homo).toBe(true); expect(SPEC_MOLS.N2.homo).toBe(true); expect(SPEC_MOLS.HCl.homo).toBe(false);
    expect(rotPopulation(10.6, 0)).toBe(1);
    expect(rotPopulation(10.6, 3)).toBeGreaterThan(rotPopulation(10.6, 0));
  });
});
