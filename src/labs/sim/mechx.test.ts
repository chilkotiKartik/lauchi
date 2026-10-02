import { describe, expect, it } from "vitest";
import { beam, bendStress, buildTruss, cycles, cyclePath, cylVolume, engine, ladder, pelton, peltonEta, pv, solveTruss, strokeOf } from "./mechx";

describe("truss", () => {
  it("all three types are statically determinate (m + 3 = 2j) and balance the load", () => {
    for (const t of ["pratt", "howe", "warren"] as const) for (const bays of [2, 3, 4, 6]) {
      const tr = buildTruss(t, bays, 12, 3, 10, 0), s = solveTruss(tr);
      expect(s, `${t} ${bays}`).not.toBeNull();
      expect(s!.Ray + s!.Rby).toBeCloseTo(10 * (bays - 1), 6);
      expect(s!.Rax).toBeCloseTo(0, 6);
    }
  });
  it("Pratt diagonals are in tension under gravity load, Howe diagonals in compression", () => {
    const p = buildTruss("pratt", 4, 12, 3, 10, 0), h = buildTruss("howe", 4, 12, 3, 10, 0);
    const diag = (tr: ReturnType<typeof buildTruss>, f: number[]) => tr.members.map((m, i) => ({ m, f: f[i] })).filter(({ m: [a, b] }) => tr.nodes[a][0] !== tr.nodes[b][0] && tr.nodes[a][1] !== tr.nodes[b][1] && !(a === 0 || b === 0 || a === 4 || b === 4));
    expect(diag(p, solveTruss(p)!.forces).every((d) => d.f > 0)).toBe(true);
    expect(diag(h, solveTruss(h)!.forces).every((d) => d.f < 0)).toBe(true);
  });
  it("triangle truss: apex load W gives rafters W/(2 sin θ)", () => {
    const tr = buildTruss("pratt", 2, 4, 2, 0, 10), s = solveTruss(tr)!; // rafters at 45°
    const rafter = s.forces[tr.members.findIndex(([a, b]) => a === 0 && b === 3)];
    expect(rafter).toBeCloseTo(-10 / (2 * Math.sin(Math.PI / 4)), 6);
  });
});

describe("ladder", () => {
  it("smooth wall, no man: θ_min = atan(1/2μ)", () => {
    const l = ladder(60, 5, 100, 0, 0, 0.3, 0);
    expect(l.thMin).toBeCloseTo((Math.atan(1 / 0.6) * 180) / Math.PI, 6);
    expect(ladder(l.thMin + 1, 5, 100, 0, 0, 0.3, 0).slips).toBe(false);
    expect(ladder(l.thMin - 1, 5, 100, 0, 0, 0.3, 0).slips).toBe(true);
  });
  it("climbing higher makes it less safe", () => { expect(ladder(65, 5, 200, 700, 1, 0.35, 0.25).safety).toBeLessThan(ladder(65, 5, 200, 700, 0.2, 0.35, 0.25).safety); });
});

describe("beam", () => {
  it("UDL over the whole span: R = wL/2, M = wL²/8 at mid-span", () => {
    const b = beam(6, 0, 3, 10, 0, 6);
    expect(b.RA).toBeCloseTo(30, 9); expect(b.Mmax).toBeCloseTo(45, 2); expect(b.xM).toBeCloseTo(3, 1);
  });
  it("PYQ: 9 m span, 10 kN/m over 6 m from the left: R_A = 40 kN, M_max = 80 kN·m at 4 m", () => {
    const b = beam(9, 0, 0, 10, 0, 6);
    expect(b.RA).toBeCloseTo(40, 9); expect(b.Mmax).toBeCloseTo(80, 1); expect(b.xM).toBeCloseTo(4, 1);
  });
  it("point load at centre WL/4 and a deflection of the right sign", () => {
    const b = beam(4, 20, 2, 0, 0, 0); expect(b.Mmax).toBeCloseTo(20, 6);
    expect(b.defl[b.n / 2]).toBeCloseTo(-1, 6);
    expect(bendStress(320, 100, 160)).toBeCloseTo(750, 6);
  });
});

describe("Pelton wheel", () => {
  it("jet speed √(2gH), best efficiency at u/V = 0.5", () => {
    const p = pelton(100, 100, 1, 300, 165, 1, 1);
    expect(p.V).toBeCloseTo(Math.sqrt(2 * 9.81 * 100), 9);
    expect(peltonEta(0.5)).toBeGreaterThan(peltonEta(0.4)); expect(peltonEta(0.5)).toBeGreaterThan(peltonEta(0.6));
    expect(peltonEta(0.5, 180, 1)).toBeCloseTo(1, 9);
  });
});

describe("piston work", () => {
  it("isothermal W = p1V1 ln(V2/V1); isobaric p ΔV; adiabatic (p1V1 − p2V2)/(γ − 1)", () => {
    expect(pv("isothermal", 600, 0.03, 0.09, 1.3, 300).W).toBeCloseTo(600 * 0.03 * Math.log(3), 6);
    expect(pv("isobaric", 200, 0.1, 0.3, 1.3, 300).W).toBeCloseTo(40, 9);
    const a = pv("adiabatic", 100, 1, 0.5, 1.3, 300);
    expect(a.p2).toBeCloseTo(100 * 2 ** 1.4, 6); expect(a.Q).toBeCloseTo(0, 6);
    const v = pv("isochoric", 100, 1, 1, 1.3, 300, 50); expect(v.W).toBe(0); expect(v.dU).toBe(50);
    expect(pv("isothermal", 100, 1, 2, 1.3, 300).Q).toBeCloseTo(pv("isothermal", 100, 1, 2, 1.3, 300).W, 6);
  });
});

describe("engine and cycles", () => {
  it("strokes every 180° and volume from TDC to BDC", () => {
    expect([0, 200, 400, 600].map(strokeOf)).toEqual(["suction", "compression", "power", "exhaust"]);
    expect(cylVolume(0, 9)).toBeCloseTo(1 / 8, 9);
    expect(cylVolume(180, 9)).toBeCloseTo(1 + 1 / 8, 9);
    expect(engine(100, 100, 8, 3000, false).eta).toBeCloseTo((1 - 8 ** -0.4) * 100, 6);
    expect(engine(100, 100, 8, 3000, false).Vs).toBeCloseTo(785.4, 1);
  });
  it("same r and heat: Otto > Dual > Diesel", () => {
    const c = cycles(10, 1200, 1.5);
    expect(c.otto.eta).toBeCloseTo((1 - 10 ** -0.4) * 100, 6);
    expect(c.otto.eta).toBeGreaterThan(c.dual.eta);
    expect(c.dual.eta).toBeGreaterThan(c.diesel.eta);
    expect(cyclePath("Dual", 10, 1200, 1.5).length).toBeGreaterThan(80);
  });
});
