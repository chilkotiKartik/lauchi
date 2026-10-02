import { describe, expect, it } from "vitest";
import { SURFACES, circleExtrema, criticalPoints, eigen2, squareWave, volumeUnder, VSEPR } from "./math";

const S = (id: string) => SURFACES.find((s) => s.id === id)!;

describe("critical points", () => {
  it("x³+y³−3xy has saddle (0,0) and minimum (1,1)", () => {
    const c = criticalPoints(S("cubic").f, 2.2);
    expect(c).toHaveLength(2);
    const o = c.find((p) => Math.abs(p.x) < 1e-3)!;
    const m = c.find((p) => Math.abs(p.x - 1) < 1e-3)!;
    expect(o.kind).toBe("saddle");
    expect(m.kind).toBe("min");
    expect(m.y).toBeCloseTo(1, 3);
    expect(m.z).toBeCloseTo(-1, 3);
  });
  it("xy(6−x−y) has maximum at (2,2) value 8", () => {
    const c = criticalPoints(S("xy6").f, 4);
    const m = c.find((p) => p.kind === "max")!;
    expect(m.x).toBeCloseTo(2, 3);
    expect(m.z).toBeCloseTo(8, 3);
  });
  it("bowl min, saddle surface saddle", () => {
    expect(criticalPoints(S("bowl").f, 2)[0].kind).toBe("min");
    expect(criticalPoints(S("saddle").f, 2)[0].kind).toBe("saddle");
  });
});

describe("Lagrange on the unit circle", () => {
  it("extrema of xy are ±1/2", () => {
    const e = circleExtrema((x, y) => x * y, 1);
    expect(e.max.z).toBeCloseTo(0.5, 4);
    expect(e.min.z).toBeCloseTo(-0.5, 4);
  });
});

describe("misc math", () => {
  it("volume under xy over [0,2]x[0,3] = 9", () => expect(volumeUnder((x, y) => x * y, 2, 3)).toBeCloseTo(9, 3));
  it("eigenvalues of [[2,1],[1,2]] are 3 and 1", () => {
    const e = eigen2(2, 1, 1, 2);
    expect(e.real && e.values).toEqual([3, 1]);
  });
  it("rotation matrix has complex eigenvalues", () => expect(eigen2(0, -1, 1, 0).real).toBe(false));
  it("square wave partial sum approaches 1", () => expect(squareWave(Math.PI / 2, 400)).toBeCloseTo(1, 2));
  it("VSEPR tetrahedral angle ≈109.47°", () => {
    const [a, b] = VSEPR[4].dirs;
    const ang = (Math.acos(a[0] * b[0] + a[1] * b[1] + a[2] * b[2]) * 180) / Math.PI;
    expect(ang).toBeCloseTo(109.47, 1);
  });
});

import { vsepr, maxLonePairs } from "./math";
describe("vsepr", () => {
  it("names shapes", () => {
    expect(vsepr(4, 1).shape).toBe("Trigonal pyramidal");
    expect(vsepr(5, 3).shape).toBe("Linear");
    expect(vsepr(6, 2).shape).toBe("Square planar");
  });
  it("square planar keeps bonded pairs in one plane", () => {
    const v = vsepr(6, 2);
    expect(v.bonded.every((d) => d[2] === 0 || d[1] === 0 || d[0] === 0)).toBe(true);
    expect(v.bonded).toHaveLength(4);
  });
  it("clamps lone pairs", () => expect(vsepr(2, 5).lone).toBe(maxLonePairs(2)));
});

import { taylor, projectile } from "./math";
describe("taylor", () => {
  it("sin degree 7 at 1 is close to sin(1)", () => expect(taylor("sin", 7, 0, 1)).toBeCloseTo(Math.sin(1), 5));
  it("exp degree 10 at 1", () => expect(taylor("exp", 10, 0, 1)).toBeCloseTo(Math.E, 6));
  it("ln(1+x) degree 40 at 0.5", () => expect(taylor("ln", 40, 0, 0.5)).toBeCloseTo(Math.log(1.5), 8));
  it("expanding about a≠0 still matches", () => expect(taylor("cos", 8, 2, 2.5)).toBeCloseTo(Math.cos(2.5), 6));
});
describe("projectile", () => {
  it("no drag matches v²sin2θ/g", () => {
    const r = projectile(20, 45, 9.81, 0);
    expect(r.range).toBeCloseTo((20 * 20) / 9.81, 0);
    expect(r.maxH).toBeCloseTo((20 * 20 * 0.5) / (2 * 9.81), 1);
  });
  it("drag shortens the range", () => expect(projectile(20, 45, 9.81, 0.3).range).toBeLessThan(projectile(20, 45, 9.81, 0).range));
});

import { rlc, rectifier, titrationPH, otto, newtonRing, boxEnergy, boxPsi, photonNm, pendulum } from "./math";
describe("electrical and electronics", () => {
  it("RLC resonates at 1/(2π√LC) with Z = R and zero phase", () => {
    const f0 = rlc(10, 0.1, 1e-6, 100).f0;
    const r = rlc(10, 0.1, 1e-6, f0);
    expect(f0).toBeCloseTo(503.29, 1);
    expect(r.Z).toBeCloseTo(10, 6);
    expect(r.phase).toBeCloseTo(0, 6);
    expect(rlc(10, 0.1, 1e-6, f0 * 2).phase).toBeGreaterThan(0); // above resonance: inductive
    expect(rlc(10, 0.1, 1e-6, f0 / 2).phase).toBeLessThan(0);   // below: capacitive
  });
  it("full-wave average is 2Vp/π; half-wave is Vp/π", () => {
    const avg = (a: number[]) => a.reduce((s, v) => s + v, 0) / a.length;
    expect(avg(rectifier("full", 10, 50, 1, 1, 4, 4000).vout)).toBeCloseTo((2 * 10) / Math.PI, 1);
    expect(avg(rectifier("half", 10, 50, 1, 1, 4, 4000).vout)).toBeCloseTo(10 / Math.PI, 1);
  });
  it("a bigger capacitor gives less ripple", () => {
    const ripple = (C: number) => { const v = rectifier("smooth", 10, 50, 1000, C, 6, 3000).vout.slice(1500); return Math.max(...v) - Math.min(...v); };
    expect(ripple(1e-3)).toBeLessThan(ripple(1e-5));
  });
});
describe("chemistry", () => {
  it("strong acid–strong base: pH 1 at start, 7 at equivalence, 13 for a large excess", () => {
    expect(titrationPH("strong", 0.1, 25, 0.1, 0)).toBeCloseTo(1, 3);
    expect(titrationPH("strong", 0.1, 25, 0.1, 25)).toBeCloseTo(7, 3);
    expect(titrationPH("strong", 0.1, 25, 0.1, 75)).toBeCloseTo(13 - Math.log10(2), 2);
  });
  it("weak acid: pH = pKa at half-equivalence and > 7 at equivalence", () => {
    expect(titrationPH("weak", 0.1, 25, 0.1, 12.5, 1.8e-5)).toBeCloseTo(-Math.log10(1.8e-5), 2);
    expect(titrationPH("weak", 0.1, 25, 0.1, 25, 1.8e-5)).toBeGreaterThan(8);
  });
});
describe("mechanical, optics, quantum", () => {
  it("Otto efficiency is 1 − r^(1−γ) and net work equals heat in × efficiency", () => {
    const o = otto(8, 1.4, 6);
    expect(o.efficiency).toBeCloseTo(0.5647, 3);
    expect(o.work).toBeCloseTo(o.heatIn * o.efficiency, 6);
  });
  it("Newton's rings radius grows as √n", () => expect(newtonRing(4, 589e-9, 1) / newtonRing(1, 589e-9, 1)).toBeCloseTo(2, 10));
  it("electron in a 1 nm box: E₁ ≈ 0.376 eV, E₂ = 4E₁, ψ normalised", () => {
    expect(boxEnergy(1, 1)).toBeCloseTo(0.376, 3);
    expect(boxEnergy(2, 1)).toBeCloseTo(4 * 0.376, 3);
    let s = 0; const N = 2000; for (let i = 0; i < N; i++) s += boxPsi(3, 2, ((i + 0.5) / N) * 2) ** 2 * (2 / N);
    expect(s).toBeCloseTo(1, 4);
    expect(photonNm(boxEnergy(2, 1) - boxEnergy(1, 1))).toBeGreaterThan(900);
  });
  it("pendulum: small-angle period matches 2π√(L/g); large angles are slower", () => {
    const a = pendulum(1, 9.81, 5, 0, 30), b = pendulum(1, 9.81, 80, 0, 30);
    expect(a.period).toBeCloseTo(a.small, 2);
    expect(b.period).toBeGreaterThan(a.period * 1.1);
  });
  it("damping shrinks the swing", () => {
    const d = pendulum(1, 9.81, 40, 0.5, 20).theta;
    expect(Math.max(...d.slice(-800).map(Math.abs))).toBeLessThan(0.1);
  });
});
