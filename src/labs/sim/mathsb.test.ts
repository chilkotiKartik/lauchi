import { describe, expect, it } from "vitest";
import {
  ODES, rk4Solve, rk4Path, slopeLab, charRoots, steadyState, oscillate, seriesTerms, partialSums, seriesInfo, zeta, NFACT_SUM,
  pluckCoeff, pluckShape, stringU, heatU, fundamental, heatHalfLife, cmap, cderiv, crCheck, residue, type MapId, type OdeId,
} from "./mathsb";

describe("first-order ODEs and RK4", () => {
  it("RK4 on y′ = y from y(0) = 1 gives e at x = 1", () => {
    const r = rk4Solve((_x, y) => y, 0, 1, 1, 0.05);
    expect(r.ok).toBe(true);
    expect(Math.abs(r.y - Math.E)).toBeLessThan(1e-6);
  });
  it("integrates backwards too", () => {
    expect(rk4Solve((_x, y) => y, 0, 1, -1, 0.05).y).toBeCloseTo(1 / Math.E, 6);
  });
  it("matches every closed form where it exists", () => {
    const cases: [OdeId, number, number, number][] = [["linear", 0, 1, 1.5], ["logistic", -2, 0.2, 2], ["circle", 0, 2, 1.2], ["xminusy", -1, 2, 3], ["ycosx", 0, 1, 3]];
    for (const [id, x0, y0, x1] of cases) {
      const o = slopeLab(id, x0, y0, x1);
      expect(o.yRk, id).not.toBeNull();
      expect(o.err!, id).toBeLessThan(1e-4);
    }
  });
  it("exact solutions satisfy the initial condition", () => {
    for (const id of Object.keys(ODES) as OdeId[]) expect(ODES[id].exact(0.5, 0.7, 0.5), id).toBeCloseTo(0.7, 12);
  });
  it("known values: y′ = x + y, y(0) = 0 → y = eˣ − x − 1", () => {
    expect(ODES.linear.exact(0, 0, 1)).toBeCloseTo(Math.E - 2, 12);
    expect(ODES.ycosx.exact(0, 1, Math.PI / 2)).toBeCloseTo(Math.E, 12);
  });
  it("logistic tends to 1 and blows up for y₀ < 0", () => {
    expect(ODES.logistic.exact(0, 0.5, 20)!).toBeCloseTo(1, 6);
    expect(ODES.logistic.exact(0, -0.5, 3)).toBeNull();
    expect(slopeLab("logistic", 0, -0.5, 3).yRk).toBeNull();
  });
  it("circle solution stops at the vertical tangent", () => {
    expect(ODES.circle.exact(0, 1, 1.5)).toBeNull();
    expect(slopeLab("circle", 0, 1, 1.5).yRk).toBeNull();
    expect(slopeLab("circle", 0, 1, 0.6).yRk!).toBeCloseTo(0.8, 5);
  });
  it("classifies the equations", () => {
    expect(ODES.linear.type).toBe("Linear");
    expect(ODES.logistic.type).toBe("Bernoulli");
    expect(ODES.circle.type).toBe("Exact");
    expect(ODES.ycosx.type).toBe("Variable separable");
  });
  it("path stays inside the view and never contains NaN", () => {
    const p = rk4Path(ODES.linear.f, 0, 1, 3, 0.02, 3.3);
    expect(p.length).toBeGreaterThan(2);
    for (const [x, y] of p) { expect(Number.isFinite(x) && Number.isFinite(y)).toBe(true); expect(Math.abs(y)).toBeLessThanOrEqual(3.3); }
    expect(rk4Path(ODES.circle.f, 0, 0, 3, 0.02, 3.3, 25).length).toBe(1);
  });
});

describe("constant-coefficient second-order ODE", () => {
  it("critical damping at c = 2√(km)", () => {
    const r = charRoots(1, 4, 4);
    expect(r.type).toBe("Critically damped");
    expect(r.zeta).toBeCloseTo(1, 12);
    expect(r.r1).toBeCloseTo(-2, 12);
    expect(charRoots(2, 2 * Math.sqrt(2 * 8), 8).type).toBe("Critically damped");
  });
  it("under- and over-damped roots", () => {
    const u = charRoots(1, 2, 5); // r² + 2r + 5 = 0 → −1 ± 2i
    expect(u.type).toBe("Under-damped"); expect(u.re).toBeCloseTo(-1, 12); expect(u.im).toBeCloseTo(2, 12);
    const o = charRoots(1, 5, 4); // (r + 1)(r + 4)
    expect(o.type).toBe("Over-damped"); expect(o.r1).toBeCloseTo(-1, 12); expect(o.r2).toBeCloseTo(-4, 12);
    expect(charRoots(1, 0, 4).type).toBe("Undamped");
  });
  it("steady-state amplitude and phase", () => {
    expect(steadyState(1, 0.5, 4, 2, 0).amp).toBeCloseTo(0.5, 12); // static: F₀/k
    const r = steadyState(1, 0.2, 4, 1, 2); // at ω₀: F₀/(cω) and φ = 90°
    expect(r.amp).toBeCloseTo(2.5, 12); expect(r.phase).toBeCloseTo(Math.PI / 2, 12);
    expect(steadyState(1, 0, 4, 1, 2).amp).toBe(Infinity);
  });
  it("free undamped motion is y₀ cos ω₀t", () => {
    const ys = oscillate(1, 0, 4, 0, 0, 1, 0, 5, 0.01);
    expect(ys[ys.length - 1]).toBeCloseTo(Math.cos(10), 6);
  });
  it("forced damped motion settles onto the particular integral", () => {
    const m = 1, c = 1, k = 4, F0 = 1, w = 1.5, T = 40;
    const ys = oscillate(m, c, k, F0, w, 0, 0, T, 0.01), s = steadyState(m, c, k, F0, w);
    expect(ys[ys.length - 1]).toBeCloseTo(s.amp * Math.cos(w * T - s.phase), 5);
  });
});

describe("series", () => {
  it("Σ 1/n² → π²/6", () => {
    expect(zeta(2)).toBeCloseTo(Math.PI ** 2 / 6, 10);
    expect(zeta(4)).toBeCloseTo(Math.PI ** 4 / 90, 10);
    expect(zeta(3)).toBeCloseTo(1.2020569031595942, 10);
    const S = partialSums(seriesTerms("pseries", 2000, 0, 2));
    expect(Math.abs(S[1999] - Math.PI ** 2 / 6)).toBeLessThan(1 / 1999);
  });
  it("geometric partial sums and limit", () => {
    const S = partialSums(seriesTerms("geometric", 10, 0.5, 0));
    expect(S[9]).toBeCloseTo((1 - 0.5 ** 10) / 0.5, 12);
    expect(seriesInfo("geometric", 0.5, 0).limit).toBe(2);
    expect(seriesInfo("geometric", 1, 0).converges).toBe(false);
    expect(seriesInfo("geometric", -1.2, 0).converges).toBe(false);
  });
  it("Σ 1/n! = e − 1 and Σ (−1)ⁿ⁺¹/n = ln 2", () => {
    expect(partialSums(seriesTerms("invfact", 20, 0, 0))[19]).toBeCloseTo(Math.E - 1, 12);
    const A = partialSums(seriesTerms("altharm", 1000, 0, 0));
    expect(Math.abs(A[999] - Math.LN2)).toBeLessThan(1 / 1001);
  });
  it("Σ n!/nⁿ and its ratio limit 1/e", () => {
    expect(NFACT_SUM).toBeCloseTo(1.8798538621752585, 10);
    const a = seriesTerms("nfact", 201, 0, 0);
    expect(a[200] / a[199]).toBeCloseTo(1 / Math.E, 2);
    expect(seriesInfo("nfact", 0, 0).ratio).toBeCloseTo(0.36788, 5);
  });
  it("p-series verdicts", () => {
    expect(seriesInfo("pseries", 0, 1).converges).toBe(false);
    expect(seriesInfo("pseries", 0, 1.5).converges).toBe(true);
    expect(seriesInfo("pseries", 0, 2).limitText.startsWith("π²/6")).toBe(true);
    expect(seriesInfo("pseries", 0, 2).ratio).toBe(1);
  });
});

describe("wave and heat equations", () => {
  it("b₁ of a mid-plucked string is 8h/π², even modes vanish", () => {
    expect(pluckCoeff(1, 0.5, 0.5, 1)).toBeCloseTo((8 * 0.5) / Math.PI ** 2, 12);
    expect(pluckCoeff(2, 0.5, 0.5, 1)).toBeCloseTo(0, 12);
    expect(pluckCoeff(3, 1, 1, 2)).toBeCloseTo(-8 / (9 * Math.PI ** 2), 12);
  });
  it("the sine series rebuilds the plucked shape", () => {
    for (const x of [0.1, 0.5, 0.7]) expect(stringU(x, 0, 400, 0.5, 0.3, 1, 2)).toBeCloseTo(pluckShape(x, 0.5, 0.3, 1), 3);
  });
  it("after half a period the shape is flipped and mirrored; after a period it returns", () => {
    const L = 1.5, c = 2, a = 0.4, h = 0.6;
    for (const x of [0.2, 0.9, 1.3]) {
      expect(stringU(x, L / c, 300, h, a, L, c)).toBeCloseTo(-pluckShape(L - x, h, a, L), 2);
      expect(stringU(x, (2 * L) / c, 300, h, a, L, c)).toBeCloseTo(stringU(x, 0, 300, h, a, L, c), 10);
    }
  });
  it("fundamental frequency and heat half-life", () => {
    expect(fundamental(2, 1)).toBe(1);
    const th = heatHalfLife(1, 0.05);
    expect(th).toBeCloseTo(Math.LN2 / (Math.PI ** 2 * 0.05), 12);
    // one mode only: the amplitude halves in exactly th
    expect(heatU(0.5, th, 1, 1, 0.5, 1, 0.05) / heatU(0.5, 0, 1, 1, 0.5, 1, 0.05)).toBeCloseTo(0.5, 12);
  });
});

describe("complex maps", () => {
  const ids: MapId[] = ["sq", "inv", "exp", "sin", "mobius"];
  it("|f′| of z² at 1 + i is 2√2 with rotation 45°", () => {
    const d = cderiv("sq", 1, 1);
    expect(Math.hypot(d[0], d[1])).toBeCloseTo(2 * Math.SQRT2, 12);
    expect(Math.atan2(d[1], d[0])).toBeCloseTo(Math.PI / 4, 12);
  });
  it("known values", () => {
    const a = cmap("inv", 0, 1); expect(a[0]).toBeCloseTo(0, 12); expect(a[1]).toBeCloseTo(-1, 12);
    const e = cmap("exp", 0, Math.PI); expect(e[0]).toBeCloseTo(-1, 12); expect(e[1]).toBeCloseTo(0, 12);
    const s = cmap("sin", Math.PI / 2, 0); expect(s[0]).toBeCloseTo(1, 12);
    const m = cmap("mobius", 0, 1); expect(m[0]).toBeCloseTo(0, 12); expect(m[1]).toBeCloseTo(0, 12);
    for (const x of [-3, 0.4, 7]) { const w = cmap("mobius", x, 0); expect(Math.hypot(w[0], w[1])).toBeCloseTo(1, 12); } // real axis → unit circle
    expect(Number.isNaN(cmap("inv", 0, 0)[0])).toBe(true);
  });
  it("the exact derivative matches a numerical one and Cauchy–Riemann holds", () => {
    for (const id of ids) {
      const x = 0.7, y = 0.4, cr = crCheck(id, x, y), d = cderiv(id, x, y);
      expect(cr.holds, id).toBe(true);
      expect(cr.ux, id).toBeCloseTo(d[0], 5);
      expect(cr.vx, id).toBeCloseTo(d[1], 5);
    }
  });
  it("residues agree with a contour integral", () => {
    for (const [id, cx, cy] of [["inv", 0, 0], ["mobius", 0, -1]] as const) {
      let re = 0, im = 0; const n = 2000, r = 0.3;
      for (let k = 0; k < n; k++) {
        const t = (2 * Math.PI * (k + 0.5)) / n, w = cmap(id, cx + r * Math.cos(t), cy + r * Math.sin(t));
        const dzr = -r * Math.sin(t) * ((2 * Math.PI) / n), dzi = r * Math.cos(t) * ((2 * Math.PI) / n);
        re += w[0] * dzr - w[1] * dzi; im += w[0] * dzi + w[1] * dzr;
      }
      // (1/2πi)∮ f dz
      const res = residue(id)!;
      expect(im / (2 * Math.PI), id).toBeCloseTo(res[0], 6);
      expect(-re / (2 * Math.PI), id).toBeCloseTo(res[1], 6);
    }
  });
});
