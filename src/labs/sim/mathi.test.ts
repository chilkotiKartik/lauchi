import { describe, expect, it } from "vitest";
import {
  CH_MATS, CURVES, E3_MATS, ERR_FUNCS, FIELDS3, GFIELDS, LAMINAE, MAPS, PHI, REGIONS, RR_MATS, SFIELDS, SYSTEMS,
  beta, betaNumeric, identity, spectralNorm, cayley, cellImage, charPoly, cubicRoots, diag2, diagPower, directional, divCurl, eig3, eigenCoords, errorApprox, euler, gamma, gauss,
  jacobian, lamina, levelStatus, lineWork, matPow, orbit2, planePolygon, planeMin, planesInfo, polyArea, rankOf, regionArea, revolve, rowSteps, rowSummary,
  sinCosInt, solve3, sphereDist, stokes, strips, taylor2, taylor2Terms, workPath,
  type FieldId, type PhiId, type SFieldId, type V3,
} from "./mathi";

const close = (a: number, b: number, tol = 1e-6) => expect(Math.abs(a - b)).toBeLessThan(tol);

describe("taylor2 (Taylor series in two variables)", () => {
  it("e^x sin y has the four terms y + xy + x²y/2 − y³/6 up to degree 3", () => {
    expect(taylor2("exsiny", 3, 0, 0).terms).toBe(4);
    expect(taylor2Terms("exsiny", 3)).toBe("y + xy + x²y/2 − y³/6");
    close(taylor2("exsiny", 3, 0.5, 0.5).p, 0.5 + 0.25 + 0.0625 - 0.125 / 6);
  });
  it("e^x log(1+y) has exactly six terms up to degree 3", () => {
    expect(taylor2("exlog", 3, 0, 0).terms).toBe(6);
    close(taylor2("exlog", 3, 0.3, 0.2).p, 0.2 + 0.06 - 0.02 + 0.009 - 0.006 + 0.008 / 3, 1e-12);
  });
  it("error shrinks as the degree rises and vanishes at the origin", () => {
    const e = (n: number) => Math.abs(taylor2("sinxcosy", n, 0.8, 0.6).err);
    expect(e(5)).toBeLessThan(e(3));
    expect(e(3)).toBeLessThan(e(1));
    close(taylor2("exsiny", 4, 0, 0).err, 0);
  });
});

describe("Euler's theorem", () => {
  it("x fx + y fy = n f for every homogeneous function", () => {
    for (const id of ["h2", "h3", "root", "ratio", "zero"] as const) {
      const r = euler(id, 1.3, 0.7, 1.5);
      close(r.lhs, r.rhs as number, 1e-9);
      close(r.scaled, r.scaledPred as number, 1e-9);
    }
  });
  it("fails for a non-homogeneous function", () => {
    const r = euler("nonh", 1, 2, 1);
    expect(r.rhs).toBeNull();
    expect(r.lhs).toBeCloseTo(2 * 1 + 2 * 12, 9);
  });
  it("degree-0 function has f(tx, ty) = f(x, y)", () => close(euler("zero", 2, 1, 2.5).scaled, euler("zero", 2, 1, 1).f, 1e-12));
});

describe("Lagrange multipliers", () => {
  it("minimum of x²+y²+z² on ax+by+cz=p is p²/(a²+b²+c²)", () => {
    const m = planeMin(1, 2, 2, 9)!;
    close(m.min, 9); close(m.dist, 3); close(m.lambda, -2);
    close(m.pt[0] + 2 * m.pt[1] + 2 * m.pt[2], 9);
  });
  it("point (3,4,12) from the sphere of radius 2 and 1", () => {
    const s = sphereDist([3, 4, 12], 2);
    close(s.dmin, 11); close(s.dmax, 15);
    close(sphereDist([3, 4, 12], 1).dmax, 14);
  });
  it("level sphere status around the contact radius", () => {
    expect(levelStatus(1, 3)).toBe("free"); expect(levelStatus(3, 3)).toBe("touch"); expect(levelStatus(5, 3)).toBe("cut");
    expect(planeMin(0, 0, 0, 1)).toBeNull();
  });
});

describe("change of order of integration", () => {
  it("both orders converge to the exact value", () => {
    for (const id of ["sin", "exp", "pyq", "quarter"] as const) {
      const R = REGIONS[id];
      close(strips(id, "dydx", 400).sum, R.exact, 2e-4);
      close(strips(id, "dxdy", 400).sum, R.exact, 2e-4);
    }
  });
  it("PYQ value 3/8, sin y / y gives 2, and region areas agree", () => {
    close(REGIONS.pyq.exact, 0.375); close(REGIONS.sin.exact, 2);
    for (const id of ["sin", "exp", "pyq", "quarter"] as const) close(regionArea(id, "dydx"), regionArea(id, "dxdy"), 1e-3);
    close(regionArea("quarter"), Math.PI, 1e-3);
  });
  it("few strips are less accurate than many", () => {
    const e = (n: number) => Math.abs(strips("exp", "dydx", n).sum - REGIONS.exp.exact);
    expect(e(4)).toBeGreaterThan(e(40));
  });
});

describe("Beta and Gamma", () => {
  it("Γ(1/2) = √π, Γ(n+1) = n!", () => { close(gamma(0.5), Math.sqrt(Math.PI), 1e-9); close(gamma(5), 24, 1e-7); close(gamma(1), 1, 1e-9); });
  it("B(m,n) = Γ(m)Γ(n)/Γ(m+n) = numeric integral; B(1/2,1/2) = π", () => {
    close(beta(0.5, 0.5), Math.PI, 1e-8); close(beta(2, 3), 1 / 12, 1e-9);
    close(betaNumeric(2.5, 1.5), beta(2.5, 1.5), 1e-6); close(betaNumeric(3, 2), beta(3, 2), 1e-6);
    close(beta(2, 5), beta(5, 2), 1e-12);
  });
  it("PYQ ∫₀^{2π} sin⁴θ cos²θ dθ = 4·½B(5/2,3/2) = π/8", () => { close(4 * sinCosInt(4, 2), Math.PI / 8, 1e-8); close(sinCosInt(2, 0), Math.PI / 4, 1e-8); });
});

describe("curve tracing", () => {
  it("areas of loop / enclosed region match the numeric polygon area", () => {
    close(polyArea(CURVES.astroid.loop(1)!), (3 * Math.PI) / 8, 2e-3);
    close(polyArea(CURVES.folium.loop(1)!), 1.5, 2e-2);
    close(polyArea(CURVES.strophoid.loop(1)!), 2 - Math.PI / 2, 2e-3);
    close(CURVES.cissoid.area(2), 12 * Math.PI);
  });
  it("points satisfy the curve equations", () => {
    for (const p of CURVES.strophoid.pts(1.5, 6)) if (p) close(p[1] ** 2 * (1.5 - p[0]), p[0] ** 2 * (1.5 + p[0]), 1e-6);
    for (const p of CURVES.folium.pts(1, 6)) if (p) close(p[0] ** 3 + p[1] ** 3, 3 * p[0] * p[1], 1e-6);
    for (const p of CURVES.cissoid.pts(1, 6)) if (p) close(p[1] ** 2 * (2 - p[0]), p[0] ** 3, 1e-6);
  });
  it("asymptote text and symmetry", () => {
    expect(CURVES.strophoid.asym(2)).toBe("x = 2.00"); expect(CURVES.cissoid.asym(1.5)).toBe("x = 3.00"); expect(CURVES.astroid.asym(1)).toContain("none");
  });
});

describe("Jacobians", () => {
  it("J of polar is r, of x=u+v,y=u−v is −2, of x=u,y=uv is u", () => {
    close(MAPS.polar.J(2, 1), 2); close(MAPS.shear.J(1, 1), -2); close(MAPS.ux.J(1.5, 0.4), 1.5); close(MAPS.hyper.J(1, 2), -1);
  });
  it("area of the image cell ≈ |J| du dv for small cells, and J·J′ = 1", () => {
    for (const id of ["polar", "ellipse", "shear", "ux", "hyper"] as const) {
      const r = jacobian(id, 1.5, 1.2, 0.05, 0.05);
      close(r.xyArea / r.predicted, 1, 2e-2);
      close(r.product, 1, 1e-4);
    }
  });
  it("a linear map maps the cell to a parallelogram of area |J| du dv exactly", () => {
    const r = jacobian("shear", 1, 1, 0.4, 0.5); close(r.xyArea, 0.4, 1e-9);
    expect(cellImage("polar", 1, 0, 1, 1)).toHaveLength(48);
  });
});

describe("approximation of error", () => {
  it("equal 1.2% errors in three parallel resistors give 1.2% error in r", () => {
    const e = errorApprox("par", [20, 30, 60], [1.2, 1.2, 1.2]);
    close(e.f, 10, 1e-9); close(e.percent, 1.2, 1e-9);
  });
  it("cylinder: 1% in r and 2% in h gives 4%", () => close(errorApprox("cyl", [3, 10], [1, 2]).percent, 4, 1e-9));
  it("linear estimate is close to the exact worst case for small errors", () => {
    const e = errorApprox("box", [4, 5, 6], [0.5, 0.5, 0.5]);
    close(e.exact / e.df, 1, 1e-2); expect(e.top).toBeTruthy();
    expect(ERR_FUNCS.rect.f([3, 4])).toBe(12);
  });
});

describe("centre of mass of a lamina", () => {
  it("uniform triangle (0,0)(2,0)(2,4): area 4, centroid (4/3, 4/3)", () => {
    const r = lamina("tri", "uniform", 0, 0);
    close(r.M, 4, 1e-9); close(r.cx, 4 / 3, 1e-9); close(r.cy, 4 / 3, 1e-9);
  });
  it("PYQ Q3.4: ρ = 1+x+y gives M = 44/3, centroid (16/11, 18/11)", () => {
    const r = lamina("tri", "lin", 0, 0);
    close(r.M, 44 / 3, 1e-9); close(r.cx, 16 / 11, 1e-9); close(r.cy, 18 / 11, 1e-9);
  });
  it("semicircle ȳ = 4r/3π, quarter disc x̄ = ȳ = 4r/3π, pivot moments vanish at the centroid", () => {
    close(lamina("semi", "uniform", 0, 0).cy, 8 / (3 * Math.PI), 2e-3);
    close(lamina("quarter", "uniform", 0, 0).cx, 4 / Math.PI, 2e-3);
    const c = lamina("rect", "uniform", 1.5, 1); close(c.momX, 0, 1e-9); close(c.off, 0, 1e-9);
    expect(LAMINAE.tri.poly).toHaveLength(3);
  });
});

describe("solids of revolution of parametric curves", () => {
  it("astroid: V = 32πa³/105, S = 12πa²/5, upper half length 3a", () => {
    const r = revolve("astroid", 1);
    close(r.V, (32 * Math.PI) / 105, 1e-4); close(r.S, (12 * Math.PI) / 5, 1e-3); close(r.L, 3, 1e-4);
  });
  it("cycloid: V = 5π²a³, S = 64πa²/3, arch length 8a", () => {
    const r = revolve("cycloid", 1);
    close(r.V, 5 * Math.PI ** 2, 1e-3); close(r.S, (64 * Math.PI) / 3, 1e-3); close(r.L, 8, 1e-4);
  });
  it("sphere and the loop of y²=x²(x+4): V = 64π/3, scaling a³", () => {
    const s = revolve("circle", 2); close(s.V, (4 * Math.PI * 8) / 3, 1e-4); close(s.S, 16 * Math.PI, 1e-4);
    close(revolve("loop", 1).V, (64 * Math.PI) / 3, 1e-6); close(revolve("loop", 2).V / revolve("loop", 1).V, 8, 1e-9);
  });
});

describe("gradient and directional derivative", () => {
  it("PYQ: φ = x²yz + 4xz² at (1,−2,1) along 2i − j − 2k", () => {
    const r = directional("f1", [1, -2, 1], [2, -1, -2]);
    expect(r.grad).toEqual([0, 1, 6]); close(r.D, -13 / 3); close(r.phi, -2 + 4);
  });
  it("gradient agrees with finite differences for every φ", () => {
    for (const id of Object.keys(PHI) as PhiId[]) {
      const p: V3 = [1.1, -0.7, 0.9], e = 1e-6, g = PHI[id].grad(...p);
      for (let k = 0; k < 3; k++) { const q: V3 = [...p]; q[k] += e; close((PHI[id].f(...q) - PHI[id].f(...p)) / e, g[k], 1e-4); }
    }
  });
  it("maximum D equals |∇φ| along the gradient; zero perpendicular", () => {
    const g = PHI.f3.grad(1, 2, 2); const r = directional("f3", [1, 2, 2], g); close(r.D, r.gradMag); close(r.angle, 0, 1e-6);
    close(directional("f4", [1, 1, 1], [1, -1, 0]).D, 0);
  });
});

describe("divergence and curl", () => {
  const num = (id: FieldId, p: V3) => {
    const F = FIELDS3[id].F, e = 1e-5, d = (k: number, c: number) => { const a: V3 = [...p], b: V3 = [...p]; a[k] += e; b[k] -= e; return (F(...a)[c] - F(...b)[c]) / (2 * e); };
    return { div: d(0, 0) + d(1, 1) + d(2, 2), curl: [d(1, 2) - d(2, 1), d(2, 0) - d(0, 2), d(0, 1) - d(1, 0)] };
  };
  it("analytic div and curl match finite differences", () => {
    for (const id of Object.keys(FIELDS3) as FieldId[]) {
      const p: V3 = [0.9, 1.3, -0.6], n = num(id, p), a = divCurl(id, p);
      close(n.div, a.div, 1e-4); a.curl.forEach((c, i) => close(n.curl[i], c, 1e-4));
    }
  });
  it("PYQ fields are solenoidal and irrotational; rotation has curl 2k", () => {
    for (const id of ["radial", "yzx", "mix"] as const) { const r = divCurl(id, [1, 2, 3]); expect(r.solenoidal && r.irrotational).toBe(true); }
    expect(divCurl("rot", [0, 0, 0]).curl).toEqual([0, 0, 2]); expect(divCurl("src", [1, 1, 1]).div).toBe(3);
  });
});

describe("line integrals", () => {
  it("conservative field: work is path independent and equals φ(B) − φ(A)", () => {
    for (const k of [1, 2, 3]) close(workPath("cons", 1, 1, k), 1, 1e-9);
    close(lineWork("cons", 1.5, 2, 2).potential as number, 4.5, 1e-9); close(lineWork("cons", 1.5, 2, 3).diff, 0, 1e-9);
  });
  it("F = (−y, x): zero along y = x, 1/3 along y = x²", () => { close(workPath("rot", 1, 1, 1), 0, 1e-9); close(workPath("rot", 1, 1, 2), 1 / 3, 1e-9); });
  it("F = (y, x²) along the line is 5/6 and the loop equals the area integral of curl", () => {
    close(workPath("mix", 1, 1, 1), 5 / 6, 1e-9);
    // curl_z = 2x − 1 integrated over the region between y = x² and y = x gives work(parabola) − work(line)
    const area = (2 * (1 / 3 - 1 / 4) - (1 / 2 - 1 / 3)); // ∫(2x−1)(x − x²) dx
    close(lineWork("mix", 1, 1, 2).loop, -area, 1e-6);
  });
});

describe("Gauss divergence theorem", () => {
  it("PYQ: F = 4xz i − y² j + yz k over the unit cube gives 3/2", () => { const g = gauss("pyq1", 1, 1, 1); close(g.surface, 1.5); close(g.volume, 1.5); });
  it("surface flux equals volume integral of div for every field and box", () => {
    for (const id of Object.keys(GFIELDS) as (keyof typeof GFIELDS)[]) close(gauss(id, 1.3, 0.8, 2.1).diff, 0, 1e-9);
  });
  it("radial field gives 3abc; constant field gives zero net flux", () => { close(gauss("rad", 2, 3, 4).surface, 72); close(gauss("const", 2, 3, 4).surface, 0, 1e-9); close(gauss("pyq2", 1.2, 0.9, 1.7).volume, 1.2 ** 2 * 0.9 * 1.7 + (1.2 * 0.81 * 1.7) / 2, 1e-9); });
});

describe("Stokes theorem", () => {
  it("PYQ: F = (x²+y²)i − 2xy j round the rectangle x = ±a, y = 0..b gives −4ab²", () => { const s = stokes("pyq1", 1, 2, 0); close(s.circulation, -16); close(s.flux, -16); });
  it("line integral equals surface integral for every field at any tilt", () => {
    for (const id of Object.keys(SFIELDS) as SFieldId[]) for (const beta of [0, 35, 70]) close(stokes(id, 1.4, 2.2, beta).diff, 0, 1e-9);
  });
  it("conservative field has zero circulation; rotation gives 2 × area", () => { close(stokes("grad", 1, 2, 30).circulation, 0, 1e-9); close(stokes("rot", 1.5, 2, 0).circulation, 2 * 3 * 2, 1e-9); close(stokes("rot", 1.5, 2, 60).circulation, 2 * 3 * 2 * Math.cos(Math.PI / 3), 1e-9); });
});

describe("linear systems as planes", () => {
  it("PYQ Q5.2: x+y+z=16, x+2y+5z=10, 2x+3y+λz=μ", () => {
    expect(planesInfo("pyq2", 6, 26).sol.kind).toBe("line");
    expect(planesInfo("pyq2", 6, 20).sol.kind).toBe("none");
    expect(planesInfo("pyq2", 7, 5).sol.kind).toBe("unique");
    close(planesInfo("pyq2", 6, 26).detA, 0, 1e-9);
  });
  it("PYQ: 2x−5y+2z=8, 2x+4y+6z=5, x+2y+λz=μ is singular at λ = 3 and consistent only for μ = 5/2", () => {
    expect(planesInfo("pyq1", 3, 2.5).sol.kind).toBe("line"); expect(planesInfo("pyq1", 3, 3).sol.kind).toBe("none");
    expect(planesInfo("pyq1", 3, 2.5).rankA).toBe(2);
  });
  it("unique solution satisfies every equation; rank and plane polygons", () => {
    const i = planesInfo("unique", -1, 2); expect(i.sol.kind).toBe("unique");
    if (i.sol.kind === "unique") { close(i.sol.pt[0], 1); close(i.sol.pt[1], 2); close(i.sol.pt[2], 3); }
    expect(rankOf([[1, 2, 3], [2, 4, 6]])).toBe(1); expect(solve3([[1, 1, 1, 3], [2, 2, 2, 6], [3, 3, 3, 9]]).sol.kind).toBe("plane");
    expect(planePolygon([1, 1, 1], 0, 5).length).toBeGreaterThanOrEqual(3); expect(planePolygon([1, 0, 0], 99, 5)).toHaveLength(0);
    expect(SYSTEMS.pyq1.rows(3, 2)[2]).toEqual([1, 2, 3, 2]);
  });
});

describe("row reduction", () => {
  it("PYQ Q5.1 matrices have rank 3", () => {
    expect(rowSummary("rk1", rowSteps("rk1", "echelon").at(-1)!.M).rankA).toBe(3);
    expect(rowSummary("rk3", rowSteps("rk3", "echelon").at(-1)!.M).rankA).toBe(3);
    expect(rankOf(RR_MATS.rk1.M)).toBe(3);
  });
  it("consistency verdicts for the three systems", () => {
    expect(rowSummary("sys1", rowSteps("sys1", "gj").at(-1)!.M).verdict).toContain("unique");
    expect(rowSummary("sys2", rowSteps("sys2", "echelon").at(-1)!.M).verdict).toContain("infinitely many");
    expect(rowSummary("sys3", rowSteps("sys3", "echelon").at(-1)!.M).verdict).toContain("inconsistent");
  });
  it("Gauss-Jordan reaches the identity part with the solution (1, 2, 3); every demo has several steps", () => {
    const M = rowSteps("sys1", "gj").at(-1)!.M;
    expect(M.map((r) => r[3])).toEqual([1, 2, 3]); expect(M[0].slice(0, 3)).toEqual([1, 0, 0]);
    expect(rowSteps("rk1", "echelon").length).toBeGreaterThan(6);
    for (const id of Object.keys(RR_MATS) as (keyof typeof RR_MATS)[]) expect(rowSteps(id, "echelon").length).toBeGreaterThanOrEqual(4);
  });
});

describe("Cayley-Hamilton", () => {
  it("PYQ 3×3: λ³ − 6λ² + 9λ − 4, p(A) = 0 and A⁻¹ = ¼[3 1 −1; 1 3 1; −1 1 3]", () => {
    const r = cayley(CH_MATS.m33a.M!, 3);
    expect(r.c).toEqual([-4, 9, -6, 1]); expect(r.poly).toBe("λ³ − 6λ² + 9λ − 4"); close(r.resid, 0, 1e-9);
    expect(r.inv!.map((row) => row.map((v) => v * 4))).toEqual([[3, 1, -1], [1, 3, 1], [-1, 1, 3]]);
  });
  it("second matrix: λ³ − 6λ² + 6λ − 11; singular 2×2 has no inverse", () => {
    expect(charPoly(CH_MATS.m33b.M!)).toEqual([-11, 6, -6, 1]); close(cayley(CH_MATS.m33b.M!, 2).resid, 0, 1e-8);
    expect(cayley(CH_MATS.m22a.M!, 2).inv).toBeNull(); expect(cayley(CH_MATS.m22a.M!, 2).poly).toBe("λ² − 5λ");
  });
  it("2×2 A² − (tr A)A + |A|I = O, and Aᵏ trace", () => {
    const r = cayley(CH_MATS.m22b.M!, 3); expect(r.c).toEqual([-5, -4, 1]); close(r.resid, 0, 1e-9);
    close(r.trAk, matPow([[1, 4], [2, 3]], 3).flat()[0] + matPow([[1, 4], [2, 3]], 3).flat()[3]); close(r.trAk, 5 ** 3 + (-1) ** 3, 1e-9);
  });
});

describe("diagonalisation", () => {
  it("[[4,1],[2,3]] has eigenvalues 5 and 2 and Aⁿ = PDⁿP⁻¹", () => {
    const D = diag2(4, 1, 2, 3); close(D.l1, 5); close(D.l2, 2); expect(D.kind).toBe("real");
    const r = diagPower(4, 1, 2, 3, 4); close(r.resid, 0, 1e-6); close(r.direct[0][0], (2 * 625 + 16) / 3 * 1, 1e-6);
  });
  it("complex, scalar and defective cases", () => {
    expect(diag2(0, -1, 1, 0).kind).toBe("complex"); expect(diag2(2, 0, 0, 2).kind).toBe("scalar"); expect(diag2(2, 1, 0, 2).kind).toBe("defective");
    expect(diagPower(0, -1, 1, 0, 2).viaP).toBeNull();
  });
  it("orbit follows the eigen decomposition and converges to the dominant direction", () => {
    const o = orbit2(2, 1, 1, 2, 30, 8), D = diag2(2, 1, 1, 2), c = eigenCoords(D, o[0]);
    close(o[3][0], c[0] * 27 * D.v1[0] + c[1] * D.v2[0], 1e-9);
    const last = o[8]; close(Math.abs(last[0] / last[1]), 1, 1e-2);
  });
});

describe("3×3 eigenproblem", () => {
  it("PYQ symmetric [−2 5 4; 5 7 5; 4 5 −2] has eigenvalues 12, −3, −6", () => {
    const e = eig3(E3_MATS.sym1.M); [12, -3, -6].forEach((v, i) => close(e.values[i], v, 1e-6)); close(e.trace, 3); close(e.det, 216);
  });
  it("triangular matrix has its diagonal entries; sum = trace and product = |A|", () => {
    const e = eig3(E3_MATS.tri.M); [5, 3, 2].forEach((v, i) => close(e.values[i], v, 1e-6));
    close(e.values.reduce((a, b) => a + b, 0), e.trace, 1e-8); close(e.values.reduce((a, b) => a * b, 1), e.det, 1e-6);
  });
  it("repeated eigenvalue 2, 2, 8 has two independent eigenvectors; vectors satisfy Av = λv", () => {
    const e = eig3(E3_MATS.sym2.M); expect(e.groups.map((g) => g.mult).sort()).toEqual([1, 2]); expect(e.diagonalizable).toBe(true);
    const A = E3_MATS.sym2.M;
    for (const g of e.groups) for (const v of g.vectors) A.forEach((row, i) => close(row[0] * v[0] + row[1] * v[1] + row[2] * v[2], g.l * v[i], 1e-6));
  });
  it("cubic roots with a complex pair", () => {
    const r = cubicRoots(charPoly([[0, -1, 0], [1, 0, 0], [0, 0, 2]])); expect(r.real).toHaveLength(1); close(r.real[0], 2, 1e-9); close(r.im, 1, 1e-6);
    expect(eig3(E3_MATS.ch33.M).groups.reduce((s, g) => s + g.vectors.length, 0)).toBe(3);
  });
});

describe("spectral norm", () => {
  it("largest stretch of a symmetric matrix is its largest |eigenvalue|; identity is 1", () => {
    close(spectralNorm(E3_MATS.sym1.M), 12, 1e-6); close(spectralNorm(identity(3)), 1, 1e-9); close(spectralNorm([[3, 0], [0, -5]]), 5, 1e-9);
  });
});
