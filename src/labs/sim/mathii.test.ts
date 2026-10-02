import { describe, expect, it } from "vitest";
import {
  EXACT, exactLab, isExact, exactParts, orthoInfo, orthoY, familyY, orthoName, cooling, timeTo, coolingK,
  clairautF, clairautTouch, clairautEnv, VP, vpSolve, vpWronskian, vpX, ceRoots, ceY, ceResidual, sysInfo, sysPath,
  halfCoeffs, halfSum, halfEnergy, parCoeffs, parEnergy, parDeduce, parNorm, parSum, ucSup, ucSupGrid, ucNeeded, ucUniform,
  rotateAbout, lagrangePQR, rotInvariants, coneRay, seedPoint, plateSteady, plateDecay, plateCool, plateRate, waveU, WAVE_L, waveClass,
  pdeRoots, pdeResidual, pdeZ, HARM, harmCheck, ciContour, ciDeriv, ciInside, resPoles, resFn, contourOver2pi, resInside,
  realExact, realNumeric, realPoles, realG, singInfo, singResidueNumeric, taylorCoeff, simpson, contourSegs, cabs, type HarmId, type ExactId,
} from "./mathii";

const close = (a: number, b: number, tol = 1e-6) => expect(Math.abs(a - b), `${a} vs ${b}`).toBeLessThanOrEqual(tol);

describe("helpers", () => {
  it("Simpson integrates sin on [0, π] to 2", () => close(simpson(Math.sin, 0, Math.PI, 100), 2, 1e-7));
  it("marching squares finds the circle x² + y² = 1", () => {
    const n = 41, v: number[] = [];
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const x = -2 + (4 * i) / (n - 1), y = -2 + (4 * j) / (n - 1); v.push(x * x + y * y); }
    const s = contourSegs(v, n, -2, 2, -2, 2, 1);
    expect(s.length).toBeGreaterThan(80);
    for (let i = 0; i < s.length; i += 2) close(Math.hypot(s[i], s[i + 1]), 1, 0.02);
  });
});

describe("exact equations (unit 1)", () => {
  it("every PYQ equation is exact with its own integrating factor and the potential matches M and N", () => {
    for (const id of Object.keys(EXACT) as ExactId[]) {
      const eq = EXACT[id];
      expect(isExact(eq, eq.ifKey), id).toBe(true);
      const f = eq.phi[eq.ifKey]!, h = 1e-6, x = 1.3, y = 0.8, mu = (xx: number, yy: number) => (eq.ifKey === "one" ? 1 : exactParts(eq, eq.ifKey, xx, yy).My * 0 + 1);
      void mu;
      const [i, j] = { one: [0, 0], x: [1, 0], y: [0, 1], xy: [1, 1], x2: [2, 0], y2: [0, 2], y4: [0, 4], x2y2: [2, 2] }[eq.ifKey];
      const m = x ** -i * y ** -j;
      close((f(x + h, y) - f(x - h, y)) / (2 * h), m * eq.M(x, y), 1e-4);
      close((f(x, y + h) - f(x, y - h)) / (2 * h), m * eq.N(x, y), 1e-4);
    }
  });
  it("Q1.3(b) is not exact until multiplied by 1/(x²y²)", () => {
    expect(isExact(EXACT.q13b, "one")).toBe(false);
    expect(isExact(EXACT.q13b, "x2y2")).toBe(true);
    expect(Math.abs(exactLab("q13b", "one", 1, 1).diff)).toBeGreaterThan(0.5);
  });
  it("Q1.3(a) potential value and y dx − x dy has three factors", () => {
    close(exactLab("q13a", "one", 1, 1).phi!, 0, 1e-12);
    expect(isExact(EXACT.ydxxdy, "y2") && isExact(EXACT.ydxxdy, "xy") && isExact(EXACT.ydxxdy, "x2")).toBe(true);
    expect(isExact(EXACT.ydxxdy, "one")).toBe(false);
  });
});

describe("orthogonal trajectories", () => {
  it("parabolas y = cx² are cut at right angles by ellipses x² + 2y² = k", () => {
    const o = orthoInfo(2, 1, 1);
    close(o.y, 1); close(o.m1, 2); close(o.m2, -0.5); close(o.k, 3); close(o.product, -1); close(o.angle, 90, 1e-9);
    close(orthoY(2, 3, 1), 1);
  });
  it("lines y = cx meet circles at 90°, hyperbolas xy = c meet x² − y² = k", () => {
    close(orthoInfo(1, 2, 1.5).angle, 90, 1e-9); expect(orthoName(1)).toContain("circles");
    close(orthoInfo(-1, 1, 2).product, -1); expect(orthoName(-1)).toContain("hyperbolas");
  });
  it("family and orthogonal curve pass through the same point", () => {
    const o = orthoInfo(0.5, 1.2, 2);
    close(familyY(0.5, 1.2, 2), o.y); close(orthoY(0.5, o.k, 2), o.y);
  });
});

describe("Newton cooling", () => {
  it("textbook: 100 °C to 80 °C in 10 min in a 30 °C room, then after 20 min", () => {
    const k = coolingK(100, 80, 30, 10);
    close(k, Math.log(70 / 50) / 10, 1e-12);
    close(cooling(100, 30, k, 20).T, 30 + 70 * Math.exp(-2 * Math.log(1.4)), 1e-9);
  });
  it("limits: T(0) = T0, T(∞) = Ts, half-excess time ln2/k", () => {
    close(cooling(90, 20, 0.1, 0).T, 90); close(cooling(90, 20, 0.1, 1000).T, 20, 1e-9); close(cooling(90, 20, 0.1, 0).half, Math.LN2 / 0.1, 1e-12);
  });
  it("time to reach a target and growth from below", () => {
    close(cooling(90, 20, 0.1, timeTo(90, 20, 0.1, 55)).T, 55, 1e-9);
    expect(Number.isNaN(timeTo(90, 20, 0.1, 10))).toBe(true);
    close(cooling(5, 25, 0.2, timeTo(5, 25, 0.2, 20)).T, 20, 1e-9);
  });
});

describe("Clairaut", () => {
  it("the envelope touches each line of the family with the same slope", () => {
    for (const kind of ["parab", "inv", "ellipse"] as const) {
      const a = 1.5, b = 2, c = kind === "inv" ? 0.8 : 1.1, [xt, yt] = clairautTouch(kind, a, b, c);
      close(yt, c * xt + clairautF(kind, a, b, c), 1e-9);
    }
  });
  it("singular solutions: y = −x²/4a, y² = 4ax, x²/a² + y²/b² = 1", () => {
    const [x1, y1] = clairautTouch("parab", 2, 0, 0.7); close(y1, -(x1 * x1) / 8, 1e-9);
    const [x2, y2] = clairautTouch("inv", 2, 0, 0.7); close(y2 * y2, 8 * x2, 1e-9);
    const [x3, y3] = clairautTouch("ellipse", 3, 2, -1.2); close((x3 * x3) / 9 + (y3 * y3) / 4, 1, 1e-9);
  });
  it("PYQ y = px + a/p: line of slope 2 has intercept a/2", () => close(clairautF("inv", 3, 0, 2), 1.5));
  it("the envelope function passes through the touch point with slope c", () => {
    for (const [kind, c] of [["parab", 0.9], ["inv", 0.7], ["inv", -0.7], ["ellipse", 1.3]] as const) {
      const [xt, yt] = clairautTouch(kind, 1.2, 1.7, c), br = c < 0 ? -1 : 1, h = 1e-6;
      close(clairautEnv(kind, 1.2, 1.7, xt, br), yt, 1e-9);
      close((clairautEnv(kind, 1.2, 1.7, xt + h, br) - clairautEnv(kind, 1.2, 1.7, xt - h, br)) / (2 * h), c, 1e-5);
    }
  });
});

describe("variation of parameters", () => {
  it("y″ + y = sec x gives y_p = cos x ln cos x + x sin x", () => {
    const x = 0.7, s = vpSolve("secx", x);
    close(s.yp, Math.cos(x) * Math.log(Math.cos(x)) + x * Math.sin(x), 1e-8);
    close(s.u1, Math.log(Math.cos(x)), 1e-8); close(s.u2, x, 1e-8);
  });
  it("Wronskians: cos/sin → 1, eˣ/e²ˣ → e³ˣ, e³ˣ/xe³ˣ → e⁶ˣ", () => {
    close(vpWronskian(VP.secx, 0.3), 1, 1e-12); close(vpWronskian(VP.q21a, 0.5), Math.exp(1.5), 1e-9); close(vpWronskian(VP.q21b, 1.2), Math.exp(7.2), 1e-6);
  });
  it("every equation: the particular solution satisfies the ODE", () => {
    for (const id of Object.keys(VP) as (keyof typeof VP)[]) {
      const x = vpX(id, 0.4), s = vpSolve(id, x, 0.5, -0.3);
      expect(Math.abs(s.residual), id).toBeLessThan(2e-4 * (1 + Math.abs(VP[id].R(x))));
    }
  });
});

describe("Cauchy-Euler", () => {
  it("roots: x²y″ + xy′ − y → ±1; x²y″ − 3xy′ + 5y → 2 ± i; x²y″ − 3xy′ + 4y → double 2", () => {
    const r1 = ceRoots(1, -1); close(r1.m1, 1); close(r1.m2, -1);
    const r2 = ceRoots(-3, 5); expect(r2.kind).toBe("complex"); close(r2.alpha, 2); close(r2.beta, 1);
    const r3 = ceRoots(-3, 4); expect(r3.kind).toBe("repeat"); close(r3.m1, 2);
  });
  it("closed forms satisfy the equation (residual ≈ 0)", () => {
    for (const [a, b] of [[1, -1], [-3, 5], [-3, 4], [4, 2]]) close(ceResidual(a, b, 0.7, -0.4, 1.6), 0, 1e-5);
  });
  it("values: y = x² at x = 3 for c1 = 1 and m = 2", () => close(ceY(-3, 4, 1, 0, 3), 9, 1e-12));
});

describe("simultaneous linear ODEs", () => {
  it("classification: spring (centre), saddle, node, spiral from PYQ Q2.3 (7x − y, 2x + 5y)", () => {
    expect(sysInfo(0, 1, -1, 0).kind).toContain("centre");
    expect(sysInfo(1, 0, 0, -1).kind).toContain("saddle");
    expect(sysInfo(-1, 0, 0, -2).kind).toContain("stable node");
    const s = sysInfo(7, -1, 2, 5); expect(s.kind).toContain("unstable spiral"); close(s.tr, 12); close(s.det, 37); close(s.l1[0], 6); close(s.l1[1], 1);
  });
  it("RK4 matches closed forms", () => {
    const p = sysPath(0, 1, -1, 0, 1, 0, 2, 400), e = p[p.length - 1];
    close(e[1], Math.cos(2), 1e-6); close(e[2], -Math.sin(2), 1e-6);
    const q = sysPath(-1, 0, 0, -2, 2, 3, 1, 200), f = q[q.length - 1];
    close(f[1], 2 * Math.exp(-1), 1e-7); close(f[2], 3 * Math.exp(-2), 1e-7);
  });
  it("trace and determinant", () => { const s = sysInfo(2, 1, 1, 2); close(s.tr, 4); close(s.det, 3); expect(s.kind).toContain("unstable node"); });
});

describe("half-range series", () => {
  it("f = x on (0, π): sine bₙ = 2(−1)ⁿ⁺¹/n and cosine a₀ = π, aₙ = 2((−1)ⁿ − 1)/(πn²)", () => {
    const b = halfCoeffs("x", "sine", Math.PI, 4); close(b[0], 2, 1e-6); close(b[1], -1, 1e-6); close(b[2], 2 / 3, 1e-6);
    const a = halfCoeffs("x", "cosine", Math.PI, 3); close(a[0], Math.PI, 1e-6); close(a[1], -4 / Math.PI, 1e-6); close(a[2], 0, 1e-6);
  });
  it("f = x² sine b₁ = 2π − 8/π, cosine a₀ = 2π²/3, aₙ = 4(−1)ⁿ/n²", () => {
    close(halfCoeffs("xsq", "sine", Math.PI, 1)[0], 2 * Math.PI - 8 / Math.PI, 1e-6);
    const a = halfCoeffs("xsq", "cosine", Math.PI, 2); close(a[0], (2 * Math.PI * Math.PI) / 3, 1e-6); close(a[1], -4, 1e-6); close(a[2], 1, 1e-6);
  });
  it("sin(πx/L) has cosine a₀ = 4/π; the series converges to f inside and to 0 at the end for the sine series of f = 1", () => {
    close(halfCoeffs("sinpl", "cosine", 2, 2)[0], 4 / Math.PI, 1e-6);
    const c = halfCoeffs("one", "sine", Math.PI, 99);
    close(halfSum("sine", c, Math.PI, 99, Math.PI / 2), 1, 0.02); close(halfSum("sine", c, Math.PI, 99, Math.PI), 0, 1e-9);
  });
  it("Parseval fraction tends to 1", () => {
    const c = halfCoeffs("x", "sine", Math.PI, 60); const e = halfEnergy("x", "sine", Math.PI, c, 60);
    expect(e.frac).toBeGreaterThan(0.98); expect(e.frac).toBeLessThanOrEqual(1.0000001);
  });
});

describe("Parseval", () => {
  it("energy of the first N harmonics approaches (1/π)∫f²", () => {
    for (const id of ["x", "xsq", "abs", "sq"] as const) { close(parEnergy(id, 4000), parNorm(id), 2e-3 * parNorm(id)); }
  });
  it("deductions: Σ1/n² = π²/6, Σ1/n⁴ = π⁴/90, odd Σ1/n⁴ = π⁴/96, odd Σ1/n² = π²/8", () => {
    for (const id of ["x", "xsq", "abs", "sq"] as const) { const d = parDeduce(id, 3000); close(d.est, d.exact, 2e-3 * d.exact); }
    close(parDeduce("xsq", 1).exact, Math.PI ** 4 / 90, 1e-12);
  });
  it("coefficients and partial sums: x has b₂ = −1, square wave has b₁ = 4/π; sums reach f", () => {
    close(parCoeffs("x", 2).b, -1); close(parCoeffs("sq", 1).b, 4 / Math.PI); close(parCoeffs("sq", 2).b, 0);
    close(parSum("xsq", 400, 2), 4, 1e-3); close(parSum("sq", 800, 1.2), 1, 2e-2);
  });
});

describe("uniform convergence", () => {
  it("xⁿ on [0, a]: sup = aⁿ → 0 for a < 1 but 1 for a = 1", () => {
    close(ucSup("xn", 10, 0.8), 0.8 ** 10, 1e-12); close(ucSup("xn", 50, 1), 1); expect(ucUniform("xn", 0.9)).toBe(true); expect(ucUniform("xn", 1)).toBe(false);
    expect(ucNeeded("xn", 1, 0.5)).toBeNull(); expect(ucNeeded("xn", 0.5, 0.01)).toBe(7);
  });
  it("n x e^(−nx) has constant sup 1/e (pointwise but not uniform); sin(nx)/n has sup 1/n", () => {
    close(ucSupGrid("hump", 20, 1, 4000), Math.exp(-1), 1e-3); close(ucSup("hump", 5, 1), Math.exp(-1), 1e-12); expect(ucNeeded("hump", 1, 0.1)).toBeNull();
    close(ucSupGrid("sinn", 8, 1, 3200), 1 / 8, 1e-4); expect(ucNeeded("sinn", 1, 0.05)).toBe(21);
  });
  it("Weierstrass M-test: the real error of Σ sin(kx)/k² never exceeds the tail Σ_{k>n} 1/k²", () => {
    for (const n of [3, 10, 25]) expect(ucSupGrid("sinsum", n, 1, 400)).toBeLessThanOrEqual(ucSup("sinsum", n, 1) + 1e-6);
    close(ucSup("sinsum", 10, 1), Math.PI ** 2 / 6 - [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].reduce((s, k) => s + 1 / (k * k), 0), 2e-4);
  });
});

describe("Lagrange PDE", () => {
  it("rotation about an axis conserves x²+y²+z² and lx+my+nz (Q4.2 integrals)", () => {
    const ax: [number, number, number] = [1, 2, 3], r: [number, number, number] = seedPoint(0.5, 0.4, 0.2), a = rotInvariants(ax, r);
    for (const th of [0.5, 1.7, 4]) { const q = rotateAbout(ax, r, th), b = rotInvariants(ax, q); close(b.u, a.u, 1e-12); close(b.v, a.v, 1e-12); }
  });
  it("a full turn returns to the start and the velocity is (mz − ny, nx − lz, ly − mx)", () => {
    const ax: [number, number, number] = [0, 0, 2], r: [number, number, number] = [1, 0, 0.5];
    const q = rotateAbout(ax, r, 2 * Math.PI); close(q[0], 1, 1e-12); close(q[2], 0.5, 1e-12);
    const pq = lagrangePQR([1, 2, 3], [4, 5, 6]); expect(pq).toEqual([2 * 6 - 3 * 5, 3 * 4 - 1 * 6, 1 * 5 - 2 * 4]);
    close(rotInvariants(ax, r).period, Math.PI, 1e-12);
  });
  it("cone x p + y q = z: rays keep y/x and z/x", () => {
    const r: [number, number, number] = [1, 0.5, 2], q = coneRay(r, 0.8); close(q[1] / q[0], 0.5); close(q[2] / q[0], 2);
  });
});

describe("2-D heat", () => {
  it("steady Laplace: centre of a square plate is U/4, the hot edge approaches U, the cold edges are 0", () => {
    close(plateSteady(100, 1, 0.5, 0.5), 25, 1e-6); close(plateSteady(100, 1, 0.5, 0), 0, 1e-9); close(plateSteady(100, 1, 0, 0.5), 0, 1e-9);
    expect(plateSteady(100, 1, 0.5, 0.999)).toBeGreaterThan(90);
  });
  it("decay of a (1,1) mode has rate 2α²π² on a square plate and halves in ln2/rate", () => {
    close(plateRate(0.1, 1, 1, 1), 0.2 * Math.PI ** 2, 1e-12);
    const t = Math.LN2 / plateRate(0.1, 1, 1, 1);
    close(plateDecay(80, 1, 1, 1, 0.1, t, 0.5, 0.5), 40, 1e-9);
  });
  it("cooling plate starts near U in the middle and the fundamental mode dominates later", () => {
    close(plateCool(100, 1, 0.5, 0, 0.5, 0.5, 61), 100, 3);
    const t = 0.2, p = plateCool(100, 1, 0.5, t, 0.5, 0.5), fund = ((16 * 100) / (Math.PI * Math.PI)) * Math.exp(-plateRate(0.5, 1, 1, 1) * t);
    close(p, fund, 0.02 * fund);
  });
});

describe("d'Alembert wave", () => {
  it("two pulses: starts as f, each half the height once apart; hammer plateau is amp·w/c", () => {
    close(waveU("pulses", 1, 0.5, 2, WAVE_L / 2, 0), 2, 1e-12); close(waveU("pulses", 1, 0.4, 2, WAVE_L / 2 + 2, 2), 1, 1e-3);
    close(waveU("hammer", 2, 0.3, 4, WAVE_L / 2, 1), (4 * 0.3) / 2, 1e-12);
  });
  it("plucked string: fixed ends, period 2L/c, mid-period inverted", () => {
    for (const t of [0, 0.7, 1.9]) { close(waveU("string", 1.5, 0.5, 1, 0, t), 0, 1e-9); close(waveU("string", 1.5, 0.5, 1, WAVE_L, t), 0, 1e-9); }
    close(waveU("string", 1.5, 0.5, 1, 2, 0.4), waveU("string", 1.5, 0.5, 1, 2, 0.4 + (2 * WAVE_L) / 1.5), 1e-9);
    close(waveU("string", 2, 0.5, 1, 2, 0), 1, 1e-12); close(waveU("string", 2, 0.5, 1, 4, WAVE_L / 2), -1, 1e-9); close(waveU("string", 2, 0.5, 1, 2, WAVE_L / 2), -0.5, 1e-9);
  });
  it("hyperbolic with B² − 4AC = 4c²", () => { close(waveClass(3).disc, 36); expect(waveClass(3).kind).toBe("hyperbolic"); close(waveClass(2).A, 4); });
});

describe("homogeneous linear PDEs", () => {
  it("PYQ Q4.4 (D² − 3DD′ + 2D′²): roots 1 and 2; Q4.1 z = f(y+2x) + g(y−3x) comes from m² + m − 6", () => {
    const r = pdeRoots(1, -3, 2); expect(r.kind).toBe("hyperbolic"); close(Math.max(r.m1[0], r.m2[0]), 2); close(Math.min(r.m1[0], r.m2[0]), 1);
    const q = pdeRoots(1, 1, -6); close(Math.max(q.m1[0], q.m2[0]), 2); close(Math.min(q.m1[0], q.m2[0]), -3);
  });
  it("types: equal roots parabolic (D² − 6DD′ + 9D′²), Laplace elliptic with m = ±i", () => {
    const p = pdeRoots(1, -6, 9); expect(p.kind).toBe("parabolic"); close(p.m1[0], 3);
    const e = pdeRoots(1, 0, 1); expect(e.kind).toBe("elliptic"); close(e.m1[1], 1); close(e.m2[1], -1);
  });
  it("the closed forms satisfy A z_xx + B z_xy + C z_yy = 0 in all three cases", () => {
    for (const [A, B, C] of [[1, -3, 2], [1, -6, 9], [1, 0, 1], [2, 1, 3], [1, 1, -2]]) close(pdeResidual(A, B, C, 0.4, -0.7), 0, 2e-4);
    close(pdeZ(1, 0, 1, 0, Math.PI / 2), 1, 1e-12);
  });
});

describe("harmonic functions", () => {
  it("harmonic ones have ∇²u = 0, Cauchy-Riemann holds, and ∇u ⟂ ∇v", () => {
    for (const id of ["cube", "logr", "ecos", "expy", "lin"] as HarmId[]) {
      const c = harmCheck(id, 0.8, 0.6);
      close(c.lap, 0, 5e-4); close(c.crA, 0, 5e-5); close(c.crB, 0, 5e-5); close(c.dot, 0, 5e-5);
    }
  });
  it("u = x² + y² is not harmonic (∇²u = 4) and has no conjugate", () => { close(harmCheck("notharm", 1, 1).lap, 4, 1e-3); expect(HARM.notharm.v).toBeNull(); });
  it("f(z) = u + iv for each pair", () => {
    for (const id of ["cube", "logr", "ecos", "expy", "lin"] as HarmId[]) {
      const H = HARM[id], z: [number, number] = [0.8, 0.6], w = H.f!(z);
      close(w[0], H.u(0.8, 0.6), 1e-9); close(w[1], H.v!(0.8, 0.6), 1e-9);
    }
  });
});

describe("Cauchy integral formula", () => {
  it("n = 0: e^z at a = 0.5 inside |z| = 2 gives e^0.5; outside gives 0 (Cauchy-Goursat)", () => {
    const i = ciContour("ez", 0, [0.5, 0], 2); close(i[0], Math.exp(0.5), 1e-9); close(i[1], 0, 1e-9);
    const o = ciContour("ez", 0, [3, 0], 2); close(cabs(o), 0, 1e-9);
  });
  it("derivatives: sin z at a = 1 gives cos 1, 2nd derivative −sin 1; z² gives 2a", () => {
    close(ciContour("sinz", 1, [1, 0], 2)[0], Math.cos(1), 1e-9); close(ciContour("sinz", 2, [1, 0], 2)[0], -Math.sin(1), 1e-9);
    close(ciContour("z2", 1, [0.3, 0.4], 1)[1], 0.8, 1e-9); close(ciDeriv("cosz", 1, [1, 0])[0], -Math.sin(1), 1e-12);
  });
  it("complex a, and inside/outside test", () => {
    const a: [number, number] = [0.5, 0.5], i = ciContour("ez", 0, a, 1.5), e = ciDeriv("ez", 0, a); close(i[0], e[0], 1e-9); close(i[1], e[1], 1e-9);
    expect(ciInside([1, 1], 1.5)).toBe(true); expect(ciInside([1, 1], 1.4)).toBe(false);
  });
});

describe("residue theorem", () => {
  it("PYQ Q5.5: z²/((z−1)(z−2)(z−3)) has residues 1/2, −4, 9/2 and ∮ = 2πi", () => {
    const p = resPoles("simple", 1, 0, 0, 1, 2, 3)!; close(p[0].res, 0.5); close(p[1].res, -4); close(p[2].res, 4.5);
    const I = contourOver2pi((z) => resFn("simple", 1, 0, 0, 1, 2, 3, z), 3.5); close(I[0], resInside(p, 3.5), 1e-6); close(I[0], 1, 1e-6); close(I[1], 0, 1e-6);
  });
  it("PYQ Q5.5: z²/((z−1)²(z+2)) on |z| = 3: residues 5/9 (double pole) and 4/9, ∮ = 2πi", () => {
    const p = resPoles("double", 1, 0, 0, 1, -2, 0)!; close(p[0].res, 5 / 9); close(p[1].res, 4 / 9);
    const I = contourOver2pi((z) => resFn("double", 1, 0, 0, 1, -2, 0, z), 3); close(I[0], 1, 1e-6);
  });
  it("only poles inside count; coinciding poles are rejected", () => {
    const p = resPoles("simple", 1, 0, 0, 1, 2, 3)!, I = contourOver2pi((z) => resFn("simple", 1, 0, 0, 1, 2, 3, z), 1.5);
    close(I[0], resInside(p, 1.5), 1e-6); close(I[0], 0.5, 1e-6); expect(resPoles("simple", 1, 0, 0, 1, 1.01, 3)).toBeNull();
  });
});

describe("real integrals by residues", () => {
  it("∫dθ/(2 + cos θ) = 2π/√3 and the numeric value agrees; PYQ ∫dθ/(3 + cos θ) = π/√2", () => {
    close(realExact("inv", 2, 1)!, (2 * Math.PI) / Math.sqrt(3), 1e-12); close(realNumeric("inv", 2, 1), realExact("inv", 2, 1)!, 1e-9);
    close(realExact("inv", 3, 1)!, Math.PI / Math.SQRT2, 1e-12);
  });
  it("PYQ ∫cos2θ/(5 + 4cosθ) = π/6, ∫sin²θ/(5 − 4cosθ) = π/4, ∫dθ/(a+b cosθ)² = 2πa/(a²−b²)^(3/2)", () => {
    close(realExact("cos2", 5, 4)!, Math.PI / 6, 1e-12); close(realNumeric("cos2", 5, 4), Math.PI / 6, 1e-9);
    close(realExact("sin2", 5, -4)!, Math.PI / 4, 1e-12); close(realNumeric("sin2", 5, -4), Math.PI / 4, 1e-9);
    close(realExact("sq", 2, 1)!, realNumeric("sq", 2, 1), 1e-9);
  });
  it("one pole inside the unit circle with product 1, undefined when a ≤ |b|, and 2πi·Res reproduces the value", () => {
    const [pin, pout] = realPoles(2, 1)!; close(pin * pout, 1, 1e-12); expect(Math.abs(pin)).toBeLessThan(1); close(pin, -2 + Math.sqrt(3), 1e-12);
    expect(realExact("inv", 1, 2)).toBeNull(); expect(realPoles(2, 2)).toBeNull();
    const eps = 1e-5, zc: [number, number] = [pin + eps, 0], g = realG("inv", 2, 1, zc);
    close(cabs(g) * eps * 2 * Math.PI, realExact("inv", 2, 1)!, 1e-3);
  });
});

describe("singularities and Laurent series", () => {
  it("sin z / z is removable, sin z / z⁴ a triple pole with residue −1/6, e^z / z³ has residue 1/2", () => {
    expect(singInfo("sinz", 1).kind).toContain("removable");
    const s = singInfo("sinz", 4); expect(s.kind).toBe("pole of order 3"); close(s.residue, -1 / 6, 1e-12);
    const e = singInfo("ez", 3); expect(e.kind).toBe("pole of order 3"); close(e.residue, 0.5, 1e-12);
  });
  it("numerical ∮ f dz/(2πi) equals the residue, for every radius", () => {
    for (const [id, m, rho] of [["ez", 3, 0.5], ["sinz", 3, 1.3], ["cosz", 2, 0.4], ["essen", 0, 0.7], ["essen", 2, 0.3]] as const) {
      const r = singResidueNumeric(id, m, rho); close(r[0], singInfo(id, m).residue, 1e-7); close(r[1], 0, 1e-7);
    }
  });
  it("e^(1/z) is essential with residue 1; Taylor coefficients of sin and cos", () => {
    const i = singInfo("essen", 0); expect(i.kind).toContain("essential"); close(i.residue, 1); close(singInfo("essen", 1).residue, 0.5);
    close(taylorCoeff("sinz", 3), -1 / 6); close(taylorCoeff("cosz", 2), -0.5); close(taylorCoeff("sinz", 2), 0);
  });
});
