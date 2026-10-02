import { describe, expect, it } from "vitest";
import {
  K, biprism, calcite, davisson, dispCurrent, einstein, ekBand, filmReflect, gapFromNi, lamElectron, langevin, langevinDia, magnet,
  minDx, nmHex, poynting, rowsPattern, sci, sciLog, twoBeam, wavePacket, wavePlate, wedge, weissM,
} from "./phyy";

describe("formatting helpers", () => {
  it("writes small and big numbers in powers of ten", () => {
    expect(sci(123.456)).toBe("123");
    expect(sci(1.25657e-5, 5)).toBe("1.2566 × 10⁻⁵");
    expect(sci(-5e-4)).toBe("−5 × 10⁻⁴");
    expect(sci(9.996e5)).toBe("1 × 10⁶");
    expect(sciLog(480)).toBe("1 × 10⁴⁸⁰");
  });
  it("gives visible colours", () => {
    expect(nmHex(650)).toMatch(/^#ff0000$/);
    expect(nmHex(530)).toMatch(/^#[0-9a-f]{6}$/);
  });
});

describe("Fresnel's biprism", () => {
  const b = biprism(589.3, 1, 1.5, 20, 80);
  it("virtual sources d = 2a(μ−1)α and fringe width β = λD/d", () => {
    expect(b.d).toBeCloseTo(2 * 0.2 * 0.5 * (Math.PI / 180), 9);
    expect(b.beta).toBeCloseTo((589.3e-9 * 1) / b.d, 12);
    expect(b.beta * 1000).toBeCloseTo(0.1688, 3);
  });
  it("a thin sheet shifts the pattern by (μ−1)t/λ fringes = (μ−1)tD/d", () => {
    const s = biprism(589.3, 1, 1.5, 20, 80, 6.44, 1.58);
    expect(s.shiftFringes).toBeCloseTo(6.34, 2);
    expect(s.shift).toBeCloseTo(s.shiftFringes * s.beta, 12);
    expect(b.shift).toBe(0);
  });
  it("bright central fringe, dark half a fringe away; β grows with λ", () => {
    expect(twoBeam(0, 589.3e-9, b.d, b.D)).toBeCloseTo(1, 9);
    expect(twoBeam(b.beta / 2, 589.3e-9, b.d, b.D)).toBeCloseTo(0, 9);
    expect(biprism(700, 1, 1.5, 20, 80).beta).toBeGreaterThan(b.beta);
  });
});

describe("wedge-shaped film", () => {
  it("β = λ/2μθ", () => {
    const w = wedge(589, 20, 5);
    expect(w.theta).toBeCloseTo(4e-4, 9);
    expect(w.beta).toBeCloseTo(589e-9 / (2 * 4e-4), 9);
    expect(wedge(589, 20, 5, 1.33).beta).toBeCloseTo(w.beta / 1.33, 9);
  });
  it("counts dark fringes 2μt/λ + 1 and is dark at the contact edge", () => {
    expect(wedge(589, 20, 5).nDark).toBe(68);
    expect(filmReflect(0, 589e-9)).toBe(0);
    expect(filmReflect(589e-9 / 4, 589e-9)).toBeCloseTo(1, 9);
  });
});

describe("Einstein coefficients & three-level laser", () => {
  it("PYQ: a 6930 Å photon carries 1.79 eV", () => expect(einstein(693, 300, 0).eV).toBeCloseTo(1.789, 3));
  it("A/B = 8πhν³/c³ and spontaneous ≫ stimulated at room temperature", () => {
    const r = einstein(694.3, 300, 0);
    expect(r.AoverB).toBeCloseTo((8 * Math.PI * K.h * (K.c / 694.3e-9) ** 3) / K.c ** 3, 20);
    expect(r.AoverB).toBeCloseTo(4.98e-14, 15);
    expect(r.lgSpontStim).toBeGreaterThan(29);
    expect(r.lgN2N1).toBeCloseTo(-r.lgSpontStim, 6);
  });
  it("hot cavity: e^(hν/kT) − 1 exactly", () => {
    const r = einstein(600, 6000, 0);
    expect(10 ** r.lgSpontStim).toBeCloseTo(Math.expm1(r.x), 6);
  });
  it("three-level inversion needs W > A₂₁", () => {
    expect(einstein(694.3, 300, 1).inversion).toBe(0);
    expect(einstein(694.3, 300, 3).inversion).toBeCloseTo(0.5, 9);
    expect(einstein(694.3, 300, 0).inversion).toBe(-1);
  });
});

describe("calcite double refraction", () => {
  it("walk-off is about 6.2° at 45° to the optic axis and zero along / across it", () => {
    expect(calcite(45, 10, 0, 0).rho).toBeCloseTo(6.22, 1);
    expect(calcite(0, 10, 0, 0).rho).toBe(0);
    expect(calcite(90, 10, 0, 0).rho).toBe(0);
  });
  it("E index runs from n_o along the axis to n_e across it", () => {
    expect(calcite(0, 10, 0, 0).neTh).toBeCloseTo(1.6584, 4);
    expect(calcite(90, 10, 0, 0).neTh).toBeCloseTo(1.4864, 4);
  });
  it("Nicol: O ray is totally reflected beyond 69.2° at Canada balsam; O and E share the light", () => {
    const c = calcite(45, 10, 30, 75);
    expect(c.critO).toBeCloseTo(69.2, 1);
    expect(c.IO + c.IE).toBeCloseTo(0.5, 9);
    expect(c.IO).toBeCloseTo(0.25, 9);
  });
  it("PYQ: quartz half-wave plate for 5000 Å is 27.8 µm thick", () => expect(wavePlate(5000e-10, 1.553 - 1.544).half * 1e6).toBeCloseTo(27.78, 2));
});

describe("Poynting vector", () => {
  it("PYQ: 100 W bulb at 2 m", () => {
    const p = poynting(2, Math.log10(2));
    expect(p.S).toBeCloseTo(1.989, 3);
    expect(p.Erms).toBeCloseTo(27.4, 1);
    expect(p.E0).toBeCloseTo(38.7, 1);
  });
  it("PYQ: sun's surface 3.8 × 10²⁶ W, R = 7 × 10⁸ m", () => expect(poynting(Math.log10(3.8e26), Math.log10(7e8)).S / 1e7).toBeCloseTo(6.17, 2));
  it("PYQ: 1365 W/m² at the earth gives E₀ ≈ 1014 V/m, B₀ ≈ 3.38 µT, and E₀/B₀ = c", () => {
    const r = Math.sqrt(3.8e26 / (4 * Math.PI * 1365));
    const p = poynting(Math.log10(3.8e26), Math.log10(r));
    expect(p.S).toBeCloseTo(1365, 6);
    expect(p.E0).toBeCloseTo(1014, 0);
    expect(p.B0 * 1e6).toBeCloseTo(3.38, 2);
    expect(p.E0 / p.B0).toBeCloseTo(K.c, -2);
  });
  it("in a dielectric v = c/√εr", () => expect(poynting(2, 0, 4).v).toBeCloseTo(K.c / 2, 0));
});

describe("displacement current", () => {
  it("J_d·A equals the conduction current and V₀ = I₀/ωC", () => {
    const d = dispCurrent(20, 200, 10, 2, 5);
    expect(d.Jd * d.A).toBeCloseTo(0.02, 12);
    expect(d.V0).toBeCloseTo(0.02 / (d.w * d.C), 6);
  });
  it("outside the plates B is the same as round the wire (Ampère–Maxwell)", () => {
    const d = dispCurrent(20, 200, 10, 2, 15);
    expect(d.B).toBeCloseTo(d.Bwire, 15);
    expect(d.Id).toBeCloseTo(0.02, 12);
  });
  it("inside, B grows linearly with r and does not depend on the gap or frequency", () => {
    const a = dispCurrent(20, 200, 10, 2, 2), b = dispCurrent(20, 900, 10, 9, 4);
    expect(b.B / a.B).toBeCloseTo(2, 9);
  });
});

describe("magnetic materials", () => {
  it("PYQ: Al₂O₃, χ = −5 × 10⁻⁵, H = 10 A/m → M = −5 × 10⁻⁴ A/m, B ≈ 1.2566 × 10⁻⁵ T", () => {
    const m = magnet("al2o3", 10, 300);
    expect(m.M).toBeCloseTo(-5e-4, 12);
    expect(m.B).toBeCloseTo(1.25657e-5, 9);
  });
  it("diamagnet χ does not depend on T; Langevin gives a sensible orbit radius", () => {
    expect(magnet("bi", 1000, 50).chi).toBe(magnet("bi", 1000, 900).chi);
    const r = magnet("bi", 1000, 300).rRms;
    expect(r * 1e10).toBeGreaterThan(0.5);
    expect(r * 1e10).toBeLessThan(2);
    expect(langevinDia(2.82e28, 83, r * r)).toBeCloseTo(-1.66e-4, 9);
  });
  it("paramagnet obeys Curie's law χ = C/T and saturates at low T, high H", () => {
    const a = magnet("gd", 100, 150).chi, b = magnet("gd", 100, 300).chi;
    expect(a / b).toBeCloseTo(2, 4);
    expect(magnet("gd", 1000, 300).curie).toBeCloseTo(0.8, 1);
    expect(langevin(1e-3)).toBeCloseTo(1e-3 / 3, 9);
    expect(langevin(200)).toBeCloseTo(1 - 1 / 200, 6);
  });
  it("ferromagnet: Weiss m(T), Curie–Weiss above T_C", () => {
    expect(weissM(0.5, 1)).toBeCloseTo(0.9575, 3);
    expect(weissM(1.2, 1)).toBe(0);
    const f = magnet("fe", 1000, 1143);
    expect(f.chi).toBeCloseTo(f.curie / 100, 6);
    expect(magnet("fe", 2000, 300).B).toBeGreaterThan(2);
  });
});

describe("de Broglie wave packet", () => {
  it("PYQ: electron at 500 m/s known to 0.002 % → Δx ≥ 5.79 mm", () => {
    expect(minDx(K.me, 500, 2e-5) * 1000).toBeCloseTo(5.79, 2);
    expect(wavePacket(Math.log10(500), 0.002, "e", "kin").dx * 1000).toBeCloseTo(5.79, 2);
  });
  it("vp·vg = c² (relativistic) and vp = v/2 (kinetic energy only); vg = v", () => {
    const r = wavePacket(7, 10, "e", "rel");
    expect(r.prod / K.c ** 2).toBeCloseTo(1, 9);
    expect(r.vp).toBeGreaterThan(K.c);
    expect(wavePacket(7, 10, "e", "kin").vp).toBeCloseTo(5e6, 3);
    expect(r.vg).toBeCloseTo(1e7, 3);
  });
  it("λ = h/p and Δx·Δp = ħ/2", () => {
    const r = wavePacket(6, 5, "e", "rel");
    expect(r.lam * 1e9).toBeCloseTo(0.727, 3);
    expect((r.dx * r.dp) / K.hbar).toBeCloseTo(0.5, 9);
    expect(wavePacket(6, 5, "p", "rel").lam).toBeLessThan(r.lam / 1800);
  });
});

describe("Davisson–Germer", () => {
  it("54 V electrons: λ = 1.67 Å, first peak near 50° on nickel (d = 2.15 Å)", () => {
    const d = davisson(54, 2.15, 50);
    expect(d.lamA).toBeCloseTo(1.67, 2);
    expect(d.peaks[0]).toBeCloseTo(50.9, 0);
    expect(d.I).toBeGreaterThan(0.7);
  });
  it("λ = 12.27/√V Å without relativity; the correction matters at 100 kV", () => {
    expect(lamElectron(100, false) * 1e10).toBeCloseTo(1.2264, 3);
    expect(lamElectron(1e5) * 1e12).toBeCloseTo(3.70, 2);
    expect(lamElectron(1e5, false) * 1e12).toBeCloseTo(3.88, 2);
  });
  it("no diffraction peak when λ > d; grating factor is 1 at a peak", () => {
    expect(davisson(20, 2.15, 50).peaks.length).toBe(0);
    const lam = lamElectron(54);
    expect(rowsPattern(Math.asin(lam / 2.15e-10), lam, 2.15e-10)).toBeCloseTo(1, 6);
  });
});

describe("E–k diagram", () => {
  it("Varshni gaps at 300 K: Si 1.12, GaAs 1.42, Ge 0.66 eV", () => {
    expect(ekBand("si", 300, 1).Eg).toBeCloseTo(1.12, 2);
    expect(ekBand("gaas", 300, 1).Eg).toBeCloseTo(1.42, 2);
    expect(ekBand("ge", 300, 1).Eg).toBeCloseTo(0.66, 2);
  });
  it("GaAs is direct and emits near 870 nm; Si needs a phonon carrying ~10³ photon momenta", () => {
    const g = ekBand("gaas", 300, 1.5), s = ekBand("si", 300, 1.5);
    expect(g.direct).toBe(true);
    expect(g.lamNm).toBeCloseTo(871, -1);
    expect(g.absorb).toBe("direct");
    expect(s.absorb).toBe("phonon");
    expect(s.kRatio).toBeGreaterThan(500);
    expect(ekBand("si", 300, 0.9).absorb).toBe("none");
  });
  it("PYQ: Ge with N = 5 × 10²⁵ m⁻³ and nᵢ = 2.5 × 10¹⁹ m⁻³ → E_g ≈ 0.75 eV; Si nᵢ ≈ 10¹⁰ cm⁻³", () => {
    expect(gapFromNi(5e25, 2.5e19, 300)).toBeCloseTo(0.75, 2);
    const ni = ekBand("si", 300, 1).ni;
    expect(ni).toBeGreaterThan(1e9);
    expect(ni).toBeLessThan(2e10);
  });
});
