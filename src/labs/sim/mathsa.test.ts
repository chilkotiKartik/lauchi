import { describe, expect, it } from "vitest";
import {
  FIELDS, advect, angleBetween, calculus, circulation, clipLine, diffQuotient, diskIntegral, fluxOut, fmt, greens,
  lines, mvt, prng, quadrant, revolution, riemann, simpson,
} from "./mathsa";

const PI = Math.PI;

describe("helpers", () => {
  it("Simpson is exact for cubics and accurate for sin", () => {
    expect(simpson((x) => x ** 3 - x, 0, 2, 2)).toBeCloseTo(2, 12);
    expect(simpson(Math.sin, 0, PI)).toBeCloseTo(2, 9);
    expect(simpson(Math.sin, PI, 0)).toBeCloseTo(-2, 9);
  });
  it("fmt avoids negative zero and uses a real minus sign", () => {
    expect(fmt(-0.0001, 3)).toBe("0.000");
    expect(fmt(-1.5, 1)).toBe("−1.5");
    expect(fmt(NaN)).toBe("—");
  });
  it("prng is deterministic and in [0, 1)", () => {
    const a = prng(7), b = prng(7);
    for (let i = 0; i < 50; i++) { const x = a(); expect(x).toBe(b()); expect(x).toBeGreaterThanOrEqual(0); expect(x).toBeLessThan(1); }
  });
});

describe("solids of revolution", () => {
  it("cone from y = x/2 on [0, 4]: V = πr²h/3, S = πrl", () => {
    const r = 2, h = 4, R = revolution("line", 0, 4);
    expect(R.V).toBeCloseTo((PI * r * r * h) / 3, 8);
    expect(R.S).toBeCloseTo(PI * r * Math.hypot(r, h), 8);
    expect(R.xbar).toBeCloseTo((2 / 3) * h, 8); // triangle centroid
  });
  it("frustum from the line on [2, 4]: V = πh(R² + Rr + r²)/3", () => {
    expect(revolution("line", 2, 4).V).toBeCloseTo((PI * 2 * (4 + 2 + 1)) / 3, 8);
  });
  it("sin x on [0, π] gives V = π²/2, and region area 2 with x̄ = π/2", () => {
    const R = revolution("sin", 0, PI);
    expect(R.V).toBeCloseTo((PI * PI) / 2, 8);
    expect(R.A).toBeCloseTo(2, 8);
    expect(R.xbar).toBeCloseTo(PI / 2, 8);
    expect(R.S).toBeCloseTo(2 * PI * (Math.SQRT2 + Math.log(1 + Math.SQRT2)), 6); // classic 2π(√2 + ln(1 + √2))
  });
  it("paraboloid from √x on [0, 4]: V = π b²/2 = 8π, half the cylinder; S = (π/6)((4b + 1)^{3/2} − 1)", () => {
    const R = revolution("sqrt", 0, 4);
    expect(R.V).toBeCloseTo(8 * PI, 8);
    expect(R.S).toBeCloseTo((PI / 6) * (17 ** 1.5 - 1), 6);
  });
  it("x² on [a, b]: V = π(b⁵ − a⁵)/5, x̄ = 3/4·(b⁴ − a⁴)/(b³ − a³)", () => {
    const R = revolution("x2", 1, 2);
    expect(R.V).toBeCloseTo((PI * 31) / 5, 8);
    expect(R.xbar).toBeCloseTo((0.75 * 15) / 7, 8);
  });
  it("Pappus: V = 2π ȳ A for f ≥ 0, and swapped limits give the same solid", () => {
    const R = revolution("x2", 0, 2);
    expect(R.V).toBeCloseTo(2 * PI * R.ybar * R.A, 8);
    expect(revolution("x2", 2, 0).V).toBeCloseTo(R.V, 10);
    expect(revolution("x2", 1, 1).V).toBe(0);
  });
});

describe("vector fields and Green's theorem", () => {
  it("rotation field has curl 2 and circulation 2πr²", () => {
    const g = greens("rotation", 0, 0, 1);
    expect(g.curl).toBe(2); expect(g.div).toBe(0);
    expect(g.circ).toBeCloseTo(2 * PI, 9);
    expect(g.flux).toBeCloseTo(0, 9);
  });
  it("source field: flux 2πr², circulation 0", () => {
    const g = greens("source", 0.5, -0.3, 1.5);
    expect(g.flux).toBeCloseTo(2 * PI * 2.25, 8);
    expect(g.circ).toBeCloseTo(0, 9);
  });
  it("shear (y, 0) has curl −1 even though its streamlines are straight", () => {
    expect(greens("shear", 1, 1, 0.8).circ).toBeCloseTo(-PI * 0.64, 9);
  });
  it("Green's theorem: ∮F·dr = ∬curl dA and ∮F·n ds = ∬div dA for every field, off-centre", () => {
    for (const id of Object.keys(FIELDS) as (keyof typeof FIELDS)[]) {
      const g = greens(id, 0.4, -0.7, 1.3);
      expect(g.circ, id).toBeCloseTo(g.curlInt, 6);
      expect(g.flux, id).toBeCloseTo(g.divInt, 6);
    }
  });
  it("limit cycle: flux through the unit circle is 2πr²(1 − r²) = 0 at r = 1", () => {
    const F = FIELDS.cycle;
    expect(fluxOut(F, 0, 0, 1)).toBeCloseTo(0, 9);
    expect(fluxOut(F, 0, 0, 0.5)).toBeCloseTo(2 * PI * 0.25 * 0.75, 9);
    expect(diskIntegral(F.div, 0, 0, 0.5)).toBeCloseTo(2 * PI * 0.25 * 0.75, 9);
    expect(circulation(F, 0, 0, 1)).toBeCloseTo(2 * PI, 9);
  });
  it("advected tracers stay finite and inside the box", () => {
    const n = 50, p = new Float32Array(2 * n), life = new Float32Array(n), r = prng(3);
    for (let i = 0; i < 2 * n; i++) p[i] = r() * 4 - 2;
    for (let k = 0; k < 200; k++) advect(FIELDS.source, p, life, 0.05, 2.5, r);
    for (const v of p) { expect(Number.isFinite(v)).toBe(true); expect(Math.abs(v)).toBeLessThanOrEqual(2.5 + 1e-6); }
  });
});

describe("mean value theorem", () => {
  it("x² on [0, 2]: slope 2 and c = 1 (always the midpoint for a parabola)", () => {
    const m = mvt("x2", 0, 2);
    expect(m.slope).toBeCloseTo(2, 12);
    expect(m.cs).toHaveLength(1); expect(m.cs[0]).toBeCloseTo(1, 12);
    expect(m.rolle).toBe(false);
  });
  it("Rolle: x³ − 3x on [−√3, √3] gives c = ±1", () => {
    const m = mvt("cubic", -Math.sqrt(3), Math.sqrt(3));
    expect(m.rolle).toBe(true); expect(m.slope).toBe(0);
    expect(m.cs.map((c) => +c.toFixed(9))).toEqual([-1, 1]);
  });
  it("Rolle: sin x on [0, π] gives c = π/2", () => {
    const m = mvt("sin", 0, PI);
    expect(m.rolle).toBe(true);
    expect(m.cs).toHaveLength(1); expect(m.cs[0]).toBeCloseTo(PI / 2, 12);
  });
  it("eˣ on [0, 1]: c = ln(e − 1)", () => {
    const m = mvt("exp", 0, 1);
    expect(m.cs[0]).toBeCloseTo(Math.log(Math.E - 1), 12);
  });
  it("every c found satisfies f′(c) = slope and lies strictly inside", () => {
    const cases: [Parameters<typeof mvt>[0], number, number][] = [["cubic", -1.5, 2], ["sin", -3, 3], ["sin", 0.2, 2.9], ["exp", -2, 3]];
    const df = { cubic: (x: number) => 3 * x * x - 3, sin: Math.cos, exp: Math.exp, x2: (x: number) => 2 * x };
    for (const [id, a, b] of cases) {
      const m = mvt(id, a, b);
      expect(m.cs.length, `${id} [${a}, ${b}]`).toBeGreaterThan(0);
      for (const c of m.cs) { expect(df[id](c)).toBeCloseTo(m.slope, 9); expect(c).toBeGreaterThan(a); expect(c).toBeLessThan(b); }
    }
  });
  it("degenerate interval has no slope", () => {
    expect(Number.isNaN(mvt("x2", 1, 1).slope)).toBe(true);
  });
});

describe("derivative and integral basics", () => {
  it("difference quotient of x² at 1 is exactly 2 + h", () => {
    expect(diffQuotient((x) => x * x, 1, 0.5)).toBeCloseTo(2.5, 12);
    expect(diffQuotient((x) => x * x, 1, 0.01)).toBeCloseTo(2.01, 12);
  });
  it("Riemann sums: left/right bracket x² on [0, 1] and the midpoint is closer", () => {
    const f = (x: number) => x * x;
    expect(riemann(f, 0, 1, 4, "left")).toBeCloseTo(14 / 64, 12);
    expect(riemann(f, 0, 1, 4, "right")).toBeCloseTo(30 / 64, 12);
    expect(riemann(f, 0, 1, 4, "mid")).toBeCloseTo(21 / 64, 12);
  });
  it("exact integrals: ∫₀^π sin = 2, ∫₁^e 1/x = 1, ∫₀² x³ = 4", () => {
    expect(calculus("sin", 1, 0.1, 0, PI, 4, "mid").exact).toBeCloseTo(2, 12);
    expect(calculus("inv", 2, 0.1, 1, Math.E, 10, "right").exact).toBeCloseTo(1, 12);
    expect(calculus("x3", 1, 0.1, 0, 2, 50, "mid").exact).toBeCloseTo(4, 12);
  });
  it("midpoint sum for sin on [0, π] with 4 strips is about 2.0524", () => {
    expect(calculus("sin", 1, 0.1, 0, PI, 4, "mid").sum).toBeCloseTo(2.05234, 4);
  });
  it("1/x is undefined when the interval touches x ≤ 0", () => {
    expect(calculus("inv", 1, 0.1, -1, 2, 6, "mid").ok).toBe(false);
    expect(calculus("inv", 1, 0.1, 0.5, 2, 6, "mid").ok).toBe(true);
  });
  it("f′ of eˣ is eˣ", () => {
    const c = calculus("exp", 1, 0.5, 0, 1, 6, "mid");
    expect(c.d).toBeCloseTo(Math.E, 12);
    expect(c.exact).toBeCloseTo(Math.E - 1, 12);
  });
});

describe("straight lines", () => {
  it("perpendicular slopes (m1·m2 = −1) meet at 90°", () => {
    expect(angleBetween(0.5, -2)).toBeCloseTo(90, 12);
    expect(angleBetween(1, 0)).toBeCloseTo(45, 12);
    expect(angleBetween(Infinity, 0)).toBeCloseTo(90, 12);
    expect(angleBetween(Infinity, 1)).toBeCloseTo(45, 12);
    expect(angleBetween(2, 2)).toBe(0);
  });
  it("default setup: slope 1/2, distance √45, midpoint (0, 0.5), meet at (−1, 0), tan θ = 1/3", () => {
    const L = lines(-3, -1, 3, 2, 1, 1);
    expect(L.m1).toBeCloseTo(0.5, 12);
    expect(L.dist).toBeCloseTo(Math.sqrt(45), 12);
    expect(L.mid).toEqual([0, 0.5]);
    expect(L.hit![0]).toBeCloseTo(-1, 12); expect(L.hit![1]).toBeCloseTo(0, 12);
    expect(L.tan).toBeCloseTo(1 / 3, 12);
    expect(L.relation).toBe("neither");
    expect(L.quad).toBe("III");
  });
  it("parallel lines report the gap |c1 − c2|/√(1 + m²)", () => {
    const L = lines(-3, -1, 3, 2, 0.5, 2);
    expect(L.relation).toBe("parallel"); expect(L.hit).toBeNull();
    expect(L.gap).toBeCloseTo(1.5 / Math.sqrt(1.25), 12);
    expect(lines(-3, -1, 3, 2, 0.5, 0.5).relation).toBe("coincident");
  });
  it("perpendicular verdict, vertical line and coincident points", () => {
    expect(lines(-2, -1, 2, 1, -2, 1).relation).toBe("perpendicular");
    const V = lines(2, -3, 2, 3, 0, 1);
    expect(V.vertical).toBe(true); expect(V.relation).toBe("perpendicular");
    expect(V.hit![0]).toBeCloseTo(2, 12); expect(V.hit![1]).toBeCloseTo(1, 12);
    expect(lines(1, 1, 1, 1, 0, 0).ok).toBe(false);
  });
  it("quadrants", () => {
    expect(quadrant(1, 1)).toBe("I"); expect(quadrant(-1, 1)).toBe("II");
    expect(quadrant(-1, -1)).toBe("III"); expect(quadrant(1, -1)).toBe("IV");
    expect(quadrant(0, 2)).toBe("on the y-axis"); expect(quadrant(0, 0)).toBe("origin");
  });
  it("clipLine keeps segments inside the square", () => {
    const s = clipLine(0, 0, 1, 1, 5)!;
    expect(s[0]).toEqual([-5, -5]); expect(s[1]).toEqual([5, 5]);
    expect(clipLine(0, 9, 1, 0, 5)).toBeNull();
    const v = clipLine(2, 0, 0, 1, 5)!;
    expect(v[0]).toEqual([2, -5]); expect(v[1]).toEqual([2, 5]);
  });
});
