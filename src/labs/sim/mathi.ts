/**
 * Pure maths for the `mathi` labs (AHT-003 Introduction to Engineering Mathematics, Maths I):
 * Taylor series in two variables, Euler's theorem, Lagrange multipliers, change of order of integration,
 * Beta/Gamma, curve tracing, Jacobians, error approximation, centre of mass, solids of revolution of
 * parametric curves, gradient, divergence/curl, line integrals, Gauss and Stokes theorems, linear systems as
 * planes, row reduction, Cayley-Hamilton, diagonalisation and 3x3 eigen problems. No React, no three.
 */
import { fmt, simpson } from "./mathsa";

export { fmt };
export type XY = [number, number];
export type V3 = [number, number, number];
export type Fn = (x: number) => number;
export type Fn2 = (x: number, y: number) => number;
export type Fn3 = (x: number, y: number, z: number) => number;

/* ───────────────────────── shared numerics ───────────────────────── */

const GLX = [0.1834346424956498, 0.525532409916329, 0.7966664774136267, 0.9602898564975363];
const GLW = [0.362683783378362, 0.3137066458778873, 0.2223810344533745, 0.1012285362903763];
/** 8-point Gauss-Legendre on [a, b], repeated on `panels` equal pieces. */
export function gl(f: Fn, a: number, b: number, panels = 1): number {
  let s = 0;
  const h = (b - a) / panels;
  for (let p = 0; p < panels; p++) {
    const lo = a + p * h, m = lo + h / 2, r = h / 2;
    for (let i = 0; i < 4; i++) s += GLW[i] * r * (f(m - r * GLX[i]) + f(m + r * GLX[i]));
  }
  return s;
}

const LANCZOS = [0.9999999999998099, 676.5203681218851, -1259.1392167224028, 771.3234287776531, -176.6150291621406, 12.507343278686905, -0.13857109526572012, 9.984369578019572e-6, 1.5056327351493116e-7];
/** Gamma function (Lanczos), x not a non-positive integer. */
export function gamma(x: number): number {
  if (x < 0.5) return Math.PI / (Math.sin(Math.PI * x) * gamma(1 - x));
  const z = x - 1, t = z + 7.5;
  let a = LANCZOS[0];
  for (let i = 1; i < 9; i++) a += LANCZOS[i] / (z + i);
  return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * a;
}

const FACT = (n: number): number => (n <= 1 ? 1 : n * FACT(n - 1));
const norm3 = (v: V3) => Math.hypot(v[0], v[1], v[2]);
const dot3 = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross3 = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

/** Signed number text for linear combinations: "+ 3" / "− 2". */
export const frac = (x: number): string => {
  if (Math.abs(x - Math.round(x)) < 1e-9) return String(Math.round(x)).replace("-", "−");
  for (const d of [2, 3, 4, 5, 6, 8, 9, 10, 12]) {
    const n = x * d;
    if (Math.abs(n - Math.round(n)) < 1e-9) return `${String(Math.round(n)).replace("-", "−")}/${d}`;
  }
  return fmt(x, 3);
};

/* ───────────────────────── 1. Taylor series, two variables ───────────────────────── */

export type T2Id = "exsiny" | "exlog" | "sinxcosy";
const sinC = (j: number) => (j % 2 === 0 ? 0 : (((j - 1) / 2) % 2 === 0 ? 1 : -1) / FACT(j));
const cosC = (j: number) => (j % 2 === 1 ? 0 : ((j / 2) % 2 === 0 ? 1 : -1) / FACT(j));
const expC = (j: number) => 1 / FACT(j);
const logC = (j: number) => (j === 0 ? 0 : (j % 2 === 1 ? 1 : -1) / j);
export const T2_FUNCS: Record<T2Id, { label: string; f: Fn2; cx: (i: number) => number; cy: (j: number) => number }> = {
  exsiny: { label: "eˣ sin y", f: (x, y) => Math.exp(x) * Math.sin(y), cx: expC, cy: sinC },
  exlog: { label: "eˣ log(1 + y)", f: (x, y) => Math.exp(x) * Math.log(1 + y), cx: expC, cy: logC },
  sinxcosy: { label: "sin x cos y", f: (x, y) => Math.sin(x) * Math.cos(y), cx: sinC, cy: cosC },
};
/** Taylor polynomial of total degree <= n about (0, 0): value, exact value and the number of non-zero terms. */
export function taylor2(id: T2Id, n: number, x: number, y: number) {
  const F = T2_FUNCS[id];
  let p = 0, terms = 0;
  for (let i = 0; i <= n; i++) for (let j = 0; j <= n - i; j++) {
    const c = F.cx(i) * F.cy(j);
    if (Math.abs(c) > 1e-15) { p += c * Math.pow(x, i) * Math.pow(y, j); terms++; }
  }
  const f = F.f(x, y);
  return { f, p, err: p - f, terms };
}
/** Text of the polynomial's terms, e.g. "y + xy + x²y/2 − y³/6". */
export function taylor2Terms(id: T2Id, n: number): string {
  const F = T2_FUNCS[id], sup = ["", "", "²", "³", "⁴", "⁵", "⁶"];
  const out: string[] = [];
  for (let d = 0; d <= n; d++) for (let j = 0; j <= d; j++) {
    const i = d - j, c = F.cx(i) * F.cy(j);
    if (Math.abs(c) < 1e-15) continue;
    const mon = (i ? "x" + sup[i] : "") + (j ? "y" + sup[j] : "") || "1";
    const ac = Math.abs(c), den = Math.round(1 / ac);
    const body = den === 1 ? mon : mon === "1" ? `1/${den}` : `${mon}/${den}`;
    out.push((c < 0 ? "− " : out.length ? "+ " : "") + body);
  }
  return out.join(" ");
}

/* ───────────────────────── 2. Partial derivatives and Euler's theorem ───────────────────────── */

export type EulerId = "h2" | "h3" | "root" | "ratio" | "zero" | "nonh";
export const EULER_FUNCS: Record<EulerId, { label: string; f: Fn2; fx: Fn2; fy: Fn2; n: number | null }> = {
  h2: { label: "x² + xy + y²", f: (x, y) => x * x + x * y + y * y, fx: (x, y) => 2 * x + y, fy: (x, y) => x + 2 * y, n: 2 },
  h3: { label: "x³ + y³ + xy²", f: (x, y) => x ** 3 + y ** 3 + x * y * y, fx: (x, y) => 3 * x * x + y * y, fy: (x, y) => 3 * y * y + 2 * x * y, n: 3 },
  root: { label: "√(x² + y²)", f: (x, y) => Math.hypot(x, y), fx: (x, y) => x / Math.hypot(x, y), fy: (x, y) => y / Math.hypot(x, y), n: 1 },
  ratio: { label: "x²y / (x + y)", f: (x, y) => (x * x * y) / (x + y), fx: (x, y) => (x * x * y + 2 * x * y * y) / ((x + y) ** 2), fy: (x, y) => x ** 3 / ((x + y) ** 2), n: 2 },
  zero: { label: "(x − y) / (x + y)", f: (x, y) => (x - y) / (x + y), fx: (x, y) => (2 * y) / ((x + y) ** 2), fy: (x, y) => (-2 * x) / ((x + y) ** 2), n: 0 },
  nonh: { label: "x² + y³ (not homogeneous)", f: (x, y) => x * x + y ** 3, fx: (x) => 2 * x, fy: (_x, y) => 3 * y * y, n: null },
};
export function euler(id: EulerId, x: number, y: number, t: number) {
  const F = EULER_FUNCS[id], f = F.f(x, y), fx = F.fx(x, y), fy = F.fy(x, y);
  const lhs = x * fx + y * fy;
  return { f, fx, fy, lhs, rhs: F.n === null ? null : F.n * f, n: F.n, scaled: F.f(t * x, t * y), scaledPred: F.n === null ? null : Math.pow(t, F.n) * f };
}

/* ───────────────────────── 3. Lagrange multipliers ───────────────────────── */

/** Minimise x² + y² + z² on the plane ax + by + cz = p. */
export function planeMin(a: number, b: number, c: number, p: number) {
  const n2 = a * a + b * b + c * c;
  if (n2 < 1e-12) return null;
  return { min: (p * p) / n2, pt: [(p * a) / n2, (p * b) / n2, (p * c) / n2] as V3, lambda: (-2 * p) / n2, dist: Math.abs(p) / Math.sqrt(n2) };
}
/** Nearest and farthest points of the sphere |X| = R from the point P. */
export function sphereDist(P: V3, R: number) {
  const d = norm3(P);
  if (d < 1e-9) return { dmin: R, dmax: R, near: [R, 0, 0] as V3, far: [-R, 0, 0] as V3, lambdaNear: 0 };
  const u: V3 = [P[0] / d, P[1] / d, P[2] / d];
  return { dmin: Math.abs(d - R), dmax: d + R, near: [u[0] * R, u[1] * R, u[2] * R] as V3, far: [-u[0] * R, -u[1] * R, -u[2] * R] as V3, lambdaNear: 1 - d / R };
}
/** Where a level sphere of radius r sits against the plane at distance d. */
export function levelStatus(r: number, d: number): "free" | "touch" | "cut" {
  if (Math.abs(r - d) < 0.02) return "touch";
  return r < d ? "free" : "cut";
}

/* ───────────────────────── 4. Change of order of integration ───────────────────────── */

export type RegionId = "sin" | "exp" | "pyq" | "quarter";
export type Region = {
  label: string; x: XY; y: XY; ylo: Fn; yhi: Fn; xlo: Fn; xhi: Fn; f: Fn2; exact: number; text: string;
};
const sinc = (y: number) => (Math.abs(y) < 1e-9 ? 1 : Math.sin(y) / y);
export const REGIONS: Record<RegionId, Region> = {
  sin: { label: "∫₀^π ∫ₓ^π (sin y)/y dy dx", x: [0, Math.PI], y: [0, Math.PI], ylo: (x) => x, yhi: () => Math.PI, xlo: () => 0, xhi: (y) => y, f: (_x, y) => sinc(y), exact: 2, text: "0 ≤ x ≤ y ≤ π" },
  exp: { label: "∫₀¹ ∫ₓ¹ e^(y²) dy dx", x: [0, 1], y: [0, 1], ylo: (x) => x, yhi: () => 1, xlo: () => 0, xhi: (y) => y, f: (_x, y) => Math.exp(y * y), exact: (Math.E - 1) / 2, text: "0 ≤ x ≤ y ≤ 1" },
  pyq: { label: "∫₀¹ ∫ₓ²^(2−x) xy dy dx", x: [0, 1], y: [0, 2], ylo: (x) => x * x, yhi: (x) => 2 - x, xlo: () => 0, xhi: (y) => (y <= 1 ? Math.sqrt(y) : 2 - y), f: (x, y) => x * y, exact: 3 / 8, text: "x² ≤ y ≤ 2 − x" },
  quarter: { label: "∬ xy over x² + y² ≤ 4, x, y ≥ 0", x: [0, 2], y: [0, 2], ylo: () => 0, yhi: (x) => Math.sqrt(Math.max(0, 4 - x * x)), xlo: () => 0, xhi: (y) => Math.sqrt(Math.max(0, 4 - y * y)), f: (x, y) => x * y, exact: 2, text: "quarter disc of radius 2" },
};
export type Order = "dydx" | "dxdy";
/** n midpoint strips on the outer variable; the inner integral is done exactly (Gauss). Returns the strips and their sum. */
export function strips(id: RegionId, order: Order, n: number) {
  const R = REGIONS[id];
  const [o0, o1] = order === "dydx" ? R.x : R.y, h = (o1 - o0) / n;
  const out: { c: number; w: number; lo: number; hi: number; v: number }[] = [];
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const c = o0 + (i + 0.5) * h;
    const lo = order === "dydx" ? R.ylo(c) : R.xlo(c), hi = order === "dydx" ? R.yhi(c) : R.xhi(c);
    const v = hi > lo ? gl((s) => (order === "dydx" ? R.f(c, s) : R.f(s, c)), lo, hi, 2) : 0;
    out.push({ c, w: h, lo, hi, v });
    sum += v * h;
  }
  return { strips: out, sum };
}
export function regionArea(id: RegionId, order: Order = "dydx") {
  const R = REGIONS[id];
  return order === "dydx" ? gl((x) => R.yhi(x) - R.ylo(x), R.x[0], R.x[1], 200) : gl((y) => R.xhi(y) - R.xlo(y), R.y[0], R.y[1], 200);
}

/* ───────────────────────── 5. Beta and Gamma ───────────────────────── */

export const beta = (m: number, n: number) => (gamma(m) * gamma(n)) / gamma(m + n);
/** B(m, n) as 2∫ sin^(2m−1)θ cos^(2n−1)θ dθ over [0, π/2] (m, n >= 1/2). */
export function betaNumeric(m: number, n: number) {
  return 2 * simpson((t) => Math.pow(Math.sin(t), 2 * m - 1) * Math.pow(Math.cos(t), 2 * n - 1), 0, Math.PI / 2, 4000);
}
/** ∫₀^{π/2} sin^p θ cos^q θ dθ = ½ B((p+1)/2, (q+1)/2). */
export const sinCosInt = (p: number, q: number) => 0.5 * beta((p + 1) / 2, (q + 1) / 2);
export function betaIntegrand(m: number, n: number, view: "beta" | "sincos"): Fn {
  return view === "beta" ? (x) => Math.pow(x, m - 1) * Math.pow(1 - x, n - 1) : (t) => Math.pow(Math.sin(t), 2 * m - 1) * Math.pow(Math.cos(t), 2 * n - 1);
}

/* ───────────────────────── 6. Curve tracing ───────────────────────── */

export type CurveId = "strophoid" | "folium" | "cissoid" | "astroid";
const clipPts = (raw: XY[], E: number): (XY | null)[] => raw.map((p) => (Number.isFinite(p[0]) && Number.isFinite(p[1]) && Math.abs(p[0]) <= E && Math.abs(p[1]) <= E ? p : null));
export const CURVES: Record<CurveId, {
  label: string; eq: string; pts: (a: number, E: number) => (XY | null)[]; loop: (a: number) => XY[] | null;
  sym: string; tangents: string; asym: (a: number) => string; areaLabel: string; area: (a: number) => number; asymX: ((a: number) => XY[]) | null;
}> = {
  strophoid: {
    label: "Strophoid", eq: "y²(a − x) = x²(a + x)",
    pts: (a, E) => clipPts(Array.from({ length: 1201 }, (_, i) => { const ph = -1.5 + (3 * i) / 1200, t = Math.tan(ph); const x = (a * (t * t - 1)) / (t * t + 1); return [x, t * x] as XY; }), E),
    loop: (a) => Array.from({ length: 201 }, (_, i) => { const t = -1 + (2 * i) / 200, x = (a * (t * t - 1)) / (t * t + 1); return [x, t * x] as XY; }),
    sym: "about the x-axis", tangents: "y = x and y = −x (node)", asym: (a) => `x = ${fmt(a, 2)}`,
    areaLabel: "Loop area", area: (a) => a * a * (2 - Math.PI / 2), asymX: (a) => [[a, -5], [a, 5]],
  },
  folium: {
    label: "Folium of Descartes", eq: "x³ + y³ = 3axy",
    pts: (a, E) => clipPts(Array.from({ length: 1601 }, (_, i) => { const t = -8 + (16 * i) / 1600, d = 1 + t * t * t; return Math.abs(d) < 0.03 ? [NaN, NaN] : [(3 * a * t) / d, (3 * a * t * t) / d]; }) as XY[], E),
    loop: (a) => Array.from({ length: 401 }, (_, i) => { const t = Math.tan((Math.PI / 2) * (i / 400) * 0.9999), d = 1 + t ** 3; return [(3 * a * t) / d, (3 * a * t * t) / d] as XY; }),
    sym: "about the line y = x", tangents: "x = 0 and y = 0 (node)", asym: (a) => `x + y + ${fmt(a, 2)} = 0`,
    areaLabel: "Loop area", area: (a) => 1.5 * a * a, asymX: (a) => [[-5, 5 - a], [5, -5 - a]],
  },
  cissoid: {
    label: "Cissoid of Diocles", eq: "y²(2a − x) = x³",
    pts: (a, E) => clipPts(Array.from({ length: 1201 }, (_, i) => { const ph = -1.5 + (3 * i) / 1200, t = Math.tan(ph), x = (2 * a * t * t) / (1 + t * t); return [x, t * x] as XY; }), E),
    loop: () => null,
    sym: "about the x-axis", tangents: "y = 0 (cusp at the origin)", asym: (a) => `x = ${fmt(2 * a, 2)}`,
    areaLabel: "Area to asymptote", area: (a) => 3 * Math.PI * a * a, asymX: (a) => [[2 * a, -5], [2 * a, 5]],
  },
  astroid: {
    label: "Astroid", eq: "x^(2/3) + y^(2/3) = a^(2/3)",
    pts: (a) => Array.from({ length: 401 }, (_, i) => { const t = (2 * Math.PI * i) / 400; return [a * Math.cos(t) ** 3, a * Math.sin(t) ** 3] as XY; }),
    loop: (a) => Array.from({ length: 401 }, (_, i) => { const t = (2 * Math.PI * i) / 400; return [a * Math.cos(t) ** 3, a * Math.sin(t) ** 3] as XY; }),
    sym: "about both axes and y = ±x", tangents: "four cusps at (±a, 0), (0, ±a)", asym: () => "none (closed curve)",
    areaLabel: "Enclosed area", area: (a) => (3 * Math.PI * a * a) / 8, asymX: null,
  },
};
export function polyArea(p: XY[]): number {
  let s = 0;
  for (let i = 0; i < p.length; i++) { const q = p[(i + 1) % p.length]; s += p[i][0] * q[1] - q[0] * p[i][1]; }
  return Math.abs(s) / 2;
}

/* ───────────────────────── 7. Jacobian and change of variables ───────────────────────── */

export type MapId = "polar" | "ellipse" | "shear" | "ux" | "hyper";
export const MAPS: Record<MapId, { label: string; eq: string; xy: (u: number, v: number) => XY; J: (u: number, v: number) => number }> = {
  polar: { label: "Polar", eq: "x = u cos v, y = u sin v", xy: (u, v) => [u * Math.cos(v), u * Math.sin(v)], J: (u) => u },
  ellipse: { label: "Elliptic polar", eq: "x = 2u cos v, y = 1.5u sin v", xy: (u, v) => [2 * u * Math.cos(v), 1.5 * u * Math.sin(v)], J: (u) => 3 * u },
  shear: { label: "Linear", eq: "x = u + v, y = u − v", xy: (u, v) => [u + v, u - v], J: () => -2 },
  ux: { label: "x = u, y = uv", eq: "x = u, y = uv", xy: (u, v) => [u, u * v], J: (u) => u },
  hyper: { label: "Hyperbolic", eq: "x = uv, y = u/v", xy: (u, v) => [u * v, u / v], J: (u, v) => (-2 * u) / v },
};
/** Boundary of the cell [u0, u0+du] × [v0, v0+dv] mapped to the xy-plane (anticlockwise, 12 points per side). */
export function cellImage(id: MapId, u0: number, v0: number, du: number, dv: number): XY[] {
  const M = MAPS[id], pts: XY[] = [], k = 12;
  for (let i = 0; i < k; i++) pts.push(M.xy(u0 + (du * i) / k, v0));
  for (let i = 0; i < k; i++) pts.push(M.xy(u0 + du, v0 + (dv * i) / k));
  for (let i = 0; i < k; i++) pts.push(M.xy(u0 + du - (du * i) / k, v0 + dv));
  for (let i = 0; i < k; i++) pts.push(M.xy(u0, v0 + dv - (dv * i) / k));
  return pts;
}
export function jacobian(id: MapId, u: number, v: number, du: number, dv: number) {
  const M = MAPS[id], J = M.J(u, v), img = cellImage(id, u, v, du, dv);
  // numeric inverse Jacobian ∂(u,v)/∂(x,y) from the 2×2 matrix of partials
  const e = 1e-5, p0 = M.xy(u, v), pu = M.xy(u + e, v), pv = M.xy(u, v + e);
  const xu = (pu[0] - p0[0]) / e, yu = (pu[1] - p0[1]) / e, xv = (pv[0] - p0[0]) / e, yv = (pv[1] - p0[1]) / e;
  const det = xu * yv - xv * yu;
  return { J, absJ: Math.abs(J), uvArea: du * dv, xyArea: polyArea(img), predicted: Math.abs(J) * du * dv, centre: M.xy(u + du / 2, v + dv / 2), inv: 1 / det, product: J * (1 / det) };
}

/* ───────────────────────── 8. Approximation of error ───────────────────────── */

export type ErrId = "cyl" | "box" | "par" | "rect";
export const ERR_FUNCS: Record<ErrId, { label: string; vars: number; names: string[]; f: (v: number[]) => number; grad: (v: number[]) => number[] }> = {
  cyl: { label: "Cylinder volume V = πr²h", vars: 2, names: ["r", "h"], f: (v) => Math.PI * v[0] * v[0] * v[1], grad: (v) => [2 * Math.PI * v[0] * v[1], Math.PI * v[0] * v[0]] },
  box: { label: "Box volume V = lbh", vars: 3, names: ["l", "b", "h"], f: (v) => v[0] * v[1] * v[2], grad: (v) => [v[1] * v[2], v[0] * v[2], v[0] * v[1]] },
  par: { label: "Parallel resistance 1/r = 1/r₁ + 1/r₂ + 1/r₃", vars: 3, names: ["r₁", "r₂", "r₃"], f: (v) => 1 / (1 / v[0] + 1 / v[1] + 1 / v[2]), grad: (v) => { const r = 1 / (1 / v[0] + 1 / v[1] + 1 / v[2]); return v.map((x) => (r * r) / (x * x)); } },
  rect: { label: "Rectangle area A = lb", vars: 2, names: ["l", "b"], f: (v) => v[0] * v[1], grad: (v) => [v[1], v[0]] },
};
export function errorApprox(id: ErrId, vals: number[], pct: number[]) {
  const E = ERR_FUNCS[id], v = vals.slice(0, E.vars), dv = v.map((x, i) => (x * pct[i]) / 100);
  const f = E.f(v), g = E.grad(v);
  const parts = g.map((gi, i) => Math.abs(gi * dv[i]));
  const df = parts.reduce((a, b) => a + b, 0);
  // exact worst case over every + / − corner
  let worst = 0;
  for (let m = 0; m < 1 << E.vars; m++) {
    const w = v.map((x, i) => x + (m & (1 << i) ? dv[i] : -dv[i]));
    worst = Math.max(worst, Math.abs(E.f(w) - f));
  }
  let top = 0;
  parts.forEach((p, i) => { if (p > parts[top]) top = i; });
  return { f, df, exact: worst, rel: f !== 0 ? df / f : 0, percent: f !== 0 ? (100 * df) / f : 0, parts, top: E.names[top] };
}

/* ───────────────────────── 9. Centre of mass of a lamina ───────────────────────── */

export type LaminaId = "tri" | "semi" | "rect" | "quarter";
export type RhoId = "uniform" | "lin" | "height";
export const LAMINAE: Record<LaminaId, { label: string; x: XY; lo: Fn; hi: Fn; poly: XY[] }> = {
  tri: { label: "Triangle (0,0) (2,0) (2,4)", x: [0, 2], lo: () => 0, hi: (x) => 2 * x, poly: [[0, 0], [2, 0], [2, 4]] },
  semi: { label: "Semicircle, radius 2", x: [0, 4], lo: () => 0, hi: (x) => Math.sqrt(Math.max(0, 4 - (x - 2) ** 2)), poly: Array.from({ length: 41 }, (_, i) => { const t = (Math.PI * i) / 40; return [2 + 2 * Math.cos(t), 2 * Math.sin(t)] as XY; }) },
  rect: { label: "Rectangle 3 × 2", x: [0, 3], lo: () => 0, hi: () => 2, poly: [[0, 0], [3, 0], [3, 2], [0, 2]] },
  quarter: { label: "Quarter disc, radius 3", x: [0, 3], lo: () => 0, hi: (x) => Math.sqrt(Math.max(0, 9 - x * x)), poly: [[0, 0], ...Array.from({ length: 31 }, (_, i) => { const t = (Math.PI / 2) * (i / 30); return [3 * Math.cos(t), 3 * Math.sin(t)] as XY; })] },
};
export const RHOS: Record<RhoId, { label: string; f: Fn2 }> = {
  uniform: { label: "Uniform ρ = 1", f: () => 1 },
  lin: { label: "ρ = 1 + x + y", f: (x, y) => 1 + x + y },
  height: { label: "ρ = 1 + y", f: (_x, y) => 1 + y },
};
export function lamina(id: LaminaId, rho: RhoId, px: number, py: number) {
  const L = LAMINAE[id], r = RHOS[rho].f;
  const I = (g: Fn2) => gl((x) => { const lo = L.lo(x), hi = L.hi(x); return hi > lo ? gl((y) => g(x, y), lo, hi, 2) : 0; }, L.x[0], L.x[1], 12);
  const M = I(r), Mx = I((x, y) => x * r(x, y)), My = I((x, y) => y * r(x, y));
  const cx = Mx / M, cy = My / M;
  return { M, cx, cy, area: I(() => 1), momX: M * (cx - px), momY: M * (cy - py), off: Math.hypot(cx - px, cy - py) };
}

/* ───────────────────────── 10. Solids of revolution of parametric curves ───────────────────────── */

export type RevId = "astroid" | "cycloid" | "circle" | "loop";
export const REV_CURVES: Record<RevId, { label: string; t: XY; xy: (t: number, a: number) => XY; d: (t: number, a: number) => XY; eq: string }> = {
  astroid: { label: "Astroid x = a cos³t, y = a sin³t", eq: "upper half, t from 0 to π", t: [0, Math.PI], xy: (t, a) => [a * Math.cos(t) ** 3, a * Math.sin(t) ** 3], d: (t, a) => [-3 * a * Math.cos(t) ** 2 * Math.sin(t), 3 * a * Math.sin(t) ** 2 * Math.cos(t)] },
  cycloid: { label: "Cycloid x = a(t − sin t), y = a(1 − cos t)", eq: "one arch, t from 0 to 2π", t: [0, 2 * Math.PI], xy: (t, a) => [a * (t - Math.sin(t)), a * (1 - Math.cos(t))], d: (t, a) => [a * (1 - Math.cos(t)), a * Math.sin(t)] },
  circle: { label: "Semicircle x = a cos t, y = a sin t", eq: "t from 0 to π", t: [0, Math.PI], xy: (t, a) => [a * Math.cos(t), a * Math.sin(t)], d: (t, a) => [-a * Math.sin(t), a * Math.cos(t)] },
  loop: { label: "Loop of y² = x²(x + 4)", eq: "x = s² − 4, y = s(4 − s²)", t: [0, 2], xy: (s, a) => [a * (s * s - 4), a * s * (4 - s * s)], d: (s, a) => [2 * a * s, a * (4 - 3 * s * s)] },
};
export function revolve(id: RevId, a: number) {
  const C = REV_CURVES[id], n = 2000;
  const V = Math.PI * simpson((t) => { const p = C.xy(t, a), d = C.d(t, a); return p[1] * p[1] * Math.abs(d[0]); }, C.t[0], C.t[1], n);
  const S = 2 * Math.PI * simpson((t) => { const p = C.xy(t, a), d = C.d(t, a); return p[1] * Math.hypot(d[0], d[1]); }, C.t[0], C.t[1], n);
  const L = simpson((t) => { const d = C.d(t, a); return Math.hypot(d[0], d[1]); }, C.t[0], C.t[1], n);
  return { V, S, L, yBar: L > 0 ? S / (2 * Math.PI * L) : 0 };
}

/* ───────────────────────── 11. Gradient and directional derivative ───────────────────────── */

export type PhiId = "f1" | "f2" | "f3" | "f4";
export const PHI: Record<PhiId, { label: string; f: Fn3; grad: (x: number, y: number, z: number) => V3 }> = {
  f1: { label: "x²yz + 4xz²", f: (x, y, z) => x * x * y * z + 4 * x * z * z, grad: (x, y, z) => [2 * x * y * z + 4 * z * z, x * x * z, x * x * y + 8 * x * z] },
  f2: { label: "(x² + y² + z²)^(−1/2)", f: (x, y, z) => 1 / Math.sqrt(x * x + y * y + z * z), grad: (x, y, z) => { const r3 = Math.pow(x * x + y * y + z * z, 1.5) || 1; return [-x / r3, -y / r3, -z / r3]; } },
  f3: { label: "x² + y² + z²", f: (x, y, z) => x * x + y * y + z * z, grad: (x, y, z) => [2 * x, 2 * y, 2 * z] },
  f4: { label: "xyz", f: (x, y, z) => x * y * z, grad: (x, y, z) => [y * z, x * z, x * y] },
};
export function directional(id: PhiId, p: V3, d: V3) {
  const P = PHI[id], g = P.grad(p[0], p[1], p[2]), gm = norm3(g), dm = norm3(d);
  const u: V3 = dm > 1e-9 ? [d[0] / dm, d[1] / dm, d[2] / dm] : [1, 0, 0];
  const D = dot3(g, u);
  const cos = gm > 1e-12 ? D / gm : 0;
  return { phi: P.f(p[0], p[1], p[2]), grad: g, gradMag: gm, u, D, angle: (Math.acos(Math.max(-1, Math.min(1, cos))) * 180) / Math.PI, normal: (gm > 1e-12 ? [g[0] / gm, g[1] / gm, g[2] / gm] : [0, 0, 0]) as V3 };
}

/* ───────────────────────── 12. Divergence and curl ───────────────────────── */

export type FieldId = "radial" | "yzx" | "mix" | "rot" | "src" | "poly";
export const FIELDS3: Record<FieldId, { label: string; F: (x: number, y: number, z: number) => V3; div: Fn3; curl: (x: number, y: number, z: number) => V3 }> = {
  radial: { label: "r⃗ / r³ (inverse square)", F: (x, y, z) => { const r3 = Math.pow(x * x + y * y + z * z, 1.5) || 1; return [x / r3, y / r3, z / r3]; }, div: () => 0, curl: () => [0, 0, 0] },
  yzx: { label: "(y + z) i + (z + x) j + (x + y) k", F: (x, y, z) => [y + z, z + x, x + y], div: () => 0, curl: () => [0, 0, 0] },
  mix: { label: "(y² − z² + 3yz − 2x, 3xz + 2xy, 3xy − 2xz + 2z)", F: (x, y, z) => [y * y - z * z + 3 * y * z - 2 * x, 3 * x * z + 2 * x * y, 3 * x * y - 2 * x * z + 2 * z], div: () => 0, curl: () => [0, 0, 0] },
  rot: { label: "(−y, x, 0) rigid rotation", F: (x, y) => [-y, x, 0], div: () => 0, curl: () => [0, 0, 2] },
  src: { label: "(x, y, z) source", F: (x, y, z) => [x, y, z], div: () => 3, curl: () => [0, 0, 0] },
  poly: { label: "(x²y, y²z, z²x)", F: (x, y, z) => [x * x * y, y * y * z, z * z * x], div: (x, y, z) => 2 * x * y + 2 * y * z + 2 * z * x, curl: (x, y, z) => [-y * y, -z * z, -x * x] },
};
export function divCurl(id: FieldId, p: V3) {
  const F = FIELDS3[id], c = F.curl(p[0], p[1], p[2]), d = F.div(p[0], p[1], p[2]);
  return { F: F.F(p[0], p[1], p[2]), div: d, curl: c, curlMag: norm3(c), solenoidal: Math.abs(d) < 1e-9, irrotational: norm3(c) < 1e-9 };
}

/* ───────────────────────── 13. Line integrals ───────────────────────── */

export type LFieldId = "cons" | "rot" | "mix";
export const LFIELDS: Record<LFieldId, { label: string; F: (x: number, y: number) => XY; pot: Fn2 | null; curlz: Fn2 }> = {
  cons: { label: "F = (2xy, x²) = ∇(x²y)", F: (x, y) => [2 * x * y, x * x], pot: (x, y) => x * x * y, curlz: () => 0 },
  rot: { label: "F = (−y, x)", F: (x, y) => [-y, x], pot: null, curlz: () => 2 },
  mix: { label: "F = (y, x²)", F: (x, y) => [y, x * x], pot: null, curlz: (x) => 2 * x - 1 },
};
/** Work along y = By (x/Bx)^k from the origin to (Bx, By). */
export function workPath(f: LFieldId, bx: number, by: number, k: number): number {
  const F = LFIELDS[f].F;
  return simpson((x) => {
    const s = x / bx, y = by * Math.pow(s, k), dy = k === 0 ? 0 : (by * k * Math.pow(s, k - 1)) / bx, v = F(x, y);
    return v[0] + v[1] * dy;
  }, 0, bx, 400);
}
export function lineWork(f: LFieldId, bx: number, by: number, k: number) {
  const path = workPath(f, bx, by, k), line = workPath(f, bx, by, 1), pot = LFIELDS[f].pot;
  return { path, line, diff: path - line, loop: path - line, potential: pot ? pot(bx, by) - pot(0, 0) : null };
}

/* ───────────────────────── 14. Gauss divergence theorem on a box ───────────────────────── */

export type GId = "pyq1" | "pyq2" | "rad" | "const";
export const GFIELDS: Record<GId, { label: string; F: (x: number, y: number, z: number) => V3; div: Fn3 }> = {
  pyq1: { label: "F = 4xz i − y² j + yz k", F: (x, y, z) => [4 * x * z, -y * y, y * z], div: (_x, y, z) => 4 * z - 2 * y + y },
  pyq2: { label: "F = x² i + z j + yz k", F: (x, y, z) => [x * x, z, y * z], div: (x, y) => 2 * x + y },
  rad: { label: "F = x i + y j + z k", F: (x, y, z) => [x, y, z], div: () => 3 },
  const: { label: "F = i + 2j + 3k (constant)", F: () => [1, 2, 3], div: () => 0 },
};
export function gauss(id: GId, a: number, b: number, c: number) {
  const G = GFIELDS[id], F = G.F;
  const face2 = (f: Fn2, u1: number, v1: number) => gl((u) => gl((v) => f(u, v), 0, v1, 2), 0, u1, 2);
  const f = {
    x0: face2((y, z) => -F(0, y, z)[0], b, c), x1: face2((y, z) => F(a, y, z)[0], b, c),
    y0: face2((x, z) => -F(x, 0, z)[1], a, c), y1: face2((x, z) => F(x, b, z)[1], a, c),
    z0: face2((x, y) => -F(x, y, 0)[2], a, b), z1: face2((x, y) => F(x, y, c)[2], a, b),
  };
  const surface = f.x0 + f.x1 + f.y0 + f.y1 + f.z0 + f.z1;
  const volume = gl((x) => gl((y) => gl((z) => G.div(x, y, z), 0, c, 2), 0, b, 2), 0, a, 2);
  return { faces: f, surface, volume, diff: surface - volume };
}

/* ───────────────────────── 15. Stokes' theorem on a tilted rectangle ───────────────────────── */

export type SFieldId = "pyq1" | "pyq2" | "rot" | "grad";
export const SFIELDS: Record<SFieldId, { label: string; F: (x: number, y: number, z: number) => V3; curl: (x: number, y: number, z: number) => V3 }> = {
  pyq1: { label: "F = (x² + y²) i − 2xy j", F: (x, y) => [x * x + y * y, -2 * x * y, 0], curl: (x, y) => [0, 0, -4 * y] },
  pyq2: { label: "F = y² i + x² j − (x + z) k", F: (x, y, z) => [y * y, x * x, -(x + z)], curl: (x, y) => [0, 1, 2 * x - 2 * y] },
  rot: { label: "F = −y i + x j", F: (x, y) => [-y, x, 0], curl: () => [0, 0, 2] },
  grad: { label: "F = ∇(xyz) = (yz, xz, xy)", F: (x, y, z) => [y * z, x * z, x * y], curl: () => [0, 0, 0] },
};
/** Rectangle −a ≤ x ≤ a, 0 ≤ s ≤ b in a plane tilted by beta (degrees) about the x-axis. */
export function stokes(id: SFieldId, a: number, b: number, betaDeg: number) {
  const S = SFIELDS[id], t = (betaDeg * Math.PI) / 180, cs = Math.cos(t), sn = Math.sin(t);
  const P = (x: number, s: number): V3 => [x, s * cs, s * sn];
  const n: V3 = [0, -sn, cs];
  const edge = (x0: number, s0: number, x1: number, s1: number) => gl((u) => {
    const x = x0 + (x1 - x0) * u, s = s0 + (s1 - s0) * u, p = P(x, s), F = S.F(p[0], p[1], p[2]);
    const dr: V3 = [x1 - x0, (s1 - s0) * cs, (s1 - s0) * sn];
    return dot3(F, dr);
  }, 0, 1, 2);
  const e = { bottom: edge(-a, 0, a, 0), right: edge(a, 0, a, b), top: edge(a, b, -a, b), left: edge(-a, b, -a, 0) };
  const circulation = e.bottom + e.right + e.top + e.left;
  const flux = gl((x) => gl((s) => { const p = P(x, s); return dot3(S.curl(p[0], p[1], p[2]), n); }, 0, b, 2), -a, a, 2);
  return { edges: e, circulation, flux, diff: circulation - flux, normal: n };
}
export function curlAt(id: SFieldId, p: V3): V3 { return SFIELDS[id].curl(p[0], p[1], p[2]); }

/* ───────────────────────── 16-17. Linear algebra helpers ───────────────────────── */

export type Mat = number[][];
const EPS = 1e-9;
const clean = (x: number) => (Math.abs(x) < 1e-9 ? 0 : Math.abs(x - Math.round(x)) < 1e-9 ? Math.round(x) : x);
export const matMul = (A: Mat, B: Mat): Mat => A.map((r) => B[0].map((_, j) => r.reduce((s, v, k) => s + v * B[k][j], 0)));
export const identity = (n: number): Mat => Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)));
export function matPow(A: Mat, k: number): Mat {
  let R = identity(A.length);
  for (let i = 0; i < k; i++) R = matMul(R, A);
  return R;
}
export const trace = (A: Mat) => A.reduce((s, r, i) => s + r[i], 0);
export function det(A: Mat): number {
  const n = A.length;
  if (n === 1) return A[0][0];
  if (n === 2) return A[0][0] * A[1][1] - A[0][1] * A[1][0];
  return A[0][0] * (A[1][1] * A[2][2] - A[1][2] * A[2][1]) - A[0][1] * (A[1][0] * A[2][2] - A[1][2] * A[2][0]) + A[0][2] * (A[1][0] * A[2][1] - A[1][1] * A[2][0]);
}

/** Solve a system given as an augmented 3×4 matrix: rank of A, rank of [A|B] and the solution set. */
export type Solution =
  | { kind: "unique"; pt: V3 }
  | { kind: "line"; pt: V3; dir: V3 }
  | { kind: "plane" }
  | { kind: "none" };
export function rankOf(M: Mat, cols = M[0].length): number {
  const A = M.map((r) => r.slice(0, cols));
  let r = 0;
  for (let c = 0; c < cols && r < A.length; c++) {
    let p = r;
    for (let i = r + 1; i < A.length; i++) if (Math.abs(A[i][c]) > Math.abs(A[p][c])) p = i;
    if (Math.abs(A[p][c]) < EPS) continue;
    [A[r], A[p]] = [A[p], A[r]];
    for (let i = r + 1; i < A.length; i++) { const f = A[i][c] / A[r][c]; for (let j = c; j < cols; j++) A[i][j] -= f * A[r][j]; }
    r++;
  }
  return r;
}
export function solve3(M: Mat): { rankA: number; rankAug: number; sol: Solution } {
  const rankA = rankOf(M, 3), rankAug = rankOf(M, 4);
  if (rankA !== rankAug) return { rankA, rankAug, sol: { kind: "none" } };
  const A = M.map((r) => r.slice(0, 3) as V3), B = M.map((r) => r[3]);
  if (rankA === 3) {
    const D = det(A), col = (k: number): Mat => A.map((r, i) => r.map((v, j) => (j === k ? B[i] : v)));
    return { rankA, rankAug, sol: { kind: "unique", pt: [det(col(0)) / D, det(col(1)) / D, det(col(2)) / D] } };
  }
  if (rankA === 2) {
    // two independent normals n1, n2: direction n1 × n2, point = least-norm solution
    let best: [number, number] = [0, 1], bm = 0;
    for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) { const m = norm3(cross3(A[i], A[j])); if (m > bm) { bm = m; best = [i, j]; } }
    const [i, j] = best, dir = cross3(A[i], A[j]), dm = norm3(dir);
    const Q: Mat = [A[i], A[j], dir], rhs = [B[i], B[j], 0];
    const D = det(Q), rep = (k: number): Mat => Q.map((r, q) => r.map((v, c) => (c === k ? rhs[q] : v)));
    return { rankA, rankAug, sol: { kind: "line", pt: [det(rep(0)) / D, det(rep(1)) / D, det(rep(2)) / D], dir: [dir[0] / dm, dir[1] / dm, dir[2] / dm] } };
  }
  return { rankA, rankAug, sol: { kind: "plane" } };
}

/* ───────────────────────── 16. Linear systems as three planes ───────────────────────── */

export type SysId = "pyq1" | "pyq2" | "unique";
export const SYSTEMS: Record<SysId, { label: string; rows: (lam: number, mu: number) => Mat; eq: (lam: number, mu: number) => string[] }> = {
  pyq1: { label: "2x − 5y + 2z = 8, 2x + 4y + 6z = 5, x + 2y + λz = μ", rows: (l, m) => [[2, -5, 2, 8], [2, 4, 6, 5], [1, 2, l, m]], eq: () => [] },
  pyq2: { label: "x + y + z = 16, x + 2y + 5z = 10, 2x + 3y + λz = μ", rows: (l, m) => [[1, 1, 1, 16], [1, 2, 5, 10], [2, 3, l, m]], eq: () => [] },
  unique: { label: "x + y + z = 6, 2x − y + z = 3, x + 2y + λz = μ", rows: (l, m) => [[1, 1, 1, 6], [2, -1, 1, 3], [1, 2, l, m]], eq: () => [] },
};
export function planesInfo(id: SysId, lam: number, mu: number) {
  const M = SYSTEMS[id].rows(lam, mu), { rankA, rankAug, sol } = solve3(M);
  const verdict = sol.kind === "none" ? "No solution (inconsistent)" : sol.kind === "unique" ? "Unique solution" : sol.kind === "line" ? "Infinitely many (a line)" : "Infinitely many (a plane)";
  const text = sol.kind === "unique" ? `(${fmt(sol.pt[0], 3)}, ${fmt(sol.pt[1], 3)}, ${fmt(sol.pt[2], 3)})` : sol.kind === "line" ? `line through (${fmt(sol.pt[0], 2)}, ${fmt(sol.pt[1], 2)}, ${fmt(sol.pt[2], 2)})` : sol.kind === "plane" ? "a whole plane" : "—";
  return { M, rankA, rankAug, sol, verdict, text, detA: det(M.map((r) => r.slice(0, 3))) };
}
/** Polygon where the plane n·X = d meets the cube [-R, R]³ (vertices in order), or [] if they miss. */
export function planePolygon(n: V3, d: number, R: number): V3[] {
  const corners: V3[] = [];
  for (let i = 0; i < 8; i++) corners.push([i & 1 ? R : -R, i & 2 ? R : -R, i & 4 ? R : -R]);
  const pts: V3[] = [];
  for (let i = 0; i < 8; i++) for (let k = 0; k < 3; k++) {
    if (i & (1 << k)) continue;
    const a = corners[i], b = corners[i | (1 << k)], da = dot3(n, a) - d, db = dot3(n, b) - d;
    if ((da < 0 && db > 0) || (da > 0 && db < 0) || da === 0) {
      const t = da === db ? 0 : da / (da - db);
      pts.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]);
    }
  }
  if (pts.length < 3) return [];
  const c: V3 = [0, 0, 0];
  pts.forEach((p) => { c[0] += p[0] / pts.length; c[1] += p[1] / pts.length; c[2] += p[2] / pts.length; });
  const nn = norm3(n) || 1, u = cross3(n, Math.abs(n[0]) < 0.9 * nn ? [1, 0, 0] : [0, 1, 0]), um = norm3(u), uu: V3 = [u[0] / um, u[1] / um, u[2] / um], vv = cross3([n[0] / nn, n[1] / nn, n[2] / nn], uu);
  return pts.sort((p, q) => Math.atan2(dot3([p[0] - c[0], p[1] - c[1], p[2] - c[2]], vv), dot3([p[0] - c[0], p[1] - c[1], p[2] - c[2]], uu)) - Math.atan2(dot3([q[0] - c[0], q[1] - c[1], q[2] - c[2]], vv), dot3([q[0] - c[0], q[1] - c[1], q[2] - c[2]], uu)));
}

/** Line where two planes n1·X = d1 and n2·X = d2 meet (null if parallel). */
export function pairLine(n1: V3, d1: number, n2: V3, d2: number): { pt: V3; dir: V3 } | null {
  const dir = cross3(n1, n2), dm = norm3(dir);
  if (dm < 1e-9) return null;
  const Q: Mat = [n1, n2, dir], rhs = [d1, d2, 0], D = det(Q), rep = (k: number): Mat => Q.map((r, q) => r.map((v, c) => (c === k ? rhs[q] : v)));
  return { pt: [det(rep(0)) / D, det(rep(1)) / D, det(rep(2)) / D], dir: [dir[0] / dm, dir[1] / dm, dir[2] / dm] };
}

/* ───────────────────────── 17. Row reduction ───────────────────────── */

export type RrId = "rk1" | "rk3" | "sys1" | "sys2" | "sys3";
export const RR_MATS: Record<RrId, { label: string; M: Mat; aug: boolean; note: string }> = {
  rk1: { label: "Rank: 4×4 [1 2 3 0; 2 4 3 2; 3 2 1 3; 6 8 7 5]", M: [[1, 2, 3, 0], [2, 4, 3, 2], [3, 2, 1, 3], [6, 8, 7, 5]], aug: false, note: "PYQ Q5.1" },
  rk3: { label: "Rank: 4×4 [1 2 −1 4; 2 4 3 4; 1 2 3 4; −1 −2 6 −7]", M: [[1, 2, -1, 4], [2, 4, 3, 4], [1, 2, 3, 4], [-1, -2, 6, -7]], aug: false, note: "PYQ Q5.1" },
  sys1: { label: "System: x + y + z = 6, 2x − y + z = 3, x + 2y − z = 2", M: [[1, 1, 1, 6], [2, -1, 1, 3], [1, 2, -1, 2]], aug: true, note: "unique solution" },
  sys2: { label: "System: x + y + z = 16, x + 2y + 5z = 10, 2x + 3y + 6z = 26", M: [[1, 1, 1, 16], [1, 2, 5, 10], [2, 3, 6, 26]], aug: true, note: "PYQ Q5.2 with λ = 6, μ = 26" },
  sys3: { label: "System: x + y + z = 16, x + 2y + 5z = 10, 2x + 3y + 6z = 20", M: [[1, 1, 1, 16], [1, 2, 5, 10], [2, 3, 6, 20]], aug: true, note: "PYQ Q5.2 with λ = 6, μ = 20" },
};
export type RrStep = { op: string; M: Mat };
const rowName = (i: number) => `R${i + 1}`;
const term = (f: number, i: number) => (Math.abs(f - 1) < 1e-9 ? rowName(i) : `${frac(f)}·${rowName(i)}`);
/** Every elementary row operation of Gauss (echelon) or Gauss-Jordan (reduced echelon), one state per operation. */
export function rowSteps(id: RrId, mode: "echelon" | "gj"): RrStep[] {
  const { M: M0, aug } = RR_MATS[id];
  const M = M0.map((r) => r.slice()), rows = M.length, cols = aug ? M[0].length - 1 : M[0].length;
  const steps: RrStep[] = [{ op: "Start: the matrix as given", M: M.map((r) => r.slice()) }];
  const push = (op: string) => steps.push({ op, M: M.map((r) => r.map(clean)) });
  const pivots: [number, number][] = [];
  let r = 0;
  for (let c = 0; c < cols && r < rows; c++) {
    let p = -1;
    for (let i = r; i < rows; i++) if (Math.abs(M[i][c]) > EPS) { p = i; break; }
    if (p < 0) continue;
    if (p !== r) { [M[r], M[p]] = [M[p], M[r]]; push(`${rowName(r)} ↔ ${rowName(p)}`); }
    for (let i = r + 1; i < rows; i++) {
      if (Math.abs(M[i][c]) < EPS) continue;
      const f = M[i][c] / M[r][c];
      for (let j = 0; j < M[0].length; j++) M[i][j] -= f * M[r][j];
      M[i][c] = 0;
      push(`${rowName(i)} ← ${rowName(i)} ${f > 0 ? "−" : "+"} ${term(Math.abs(f), r)}`);
    }
    pivots.push([r, c]);
    r++;
  }
  if (mode === "gj") {
    for (let k = pivots.length - 1; k >= 0; k--) {
      const [pr, pc] = pivots[k], pv = M[pr][pc];
      if (Math.abs(pv - 1) > EPS) { for (let j = 0; j < M[0].length; j++) M[pr][j] /= pv; push(`${rowName(pr)} ← ${rowName(pr)} ÷ ${frac(pv)}`); }
      for (let i = 0; i < pr; i++) {
        if (Math.abs(M[i][pc]) < EPS) continue;
        const f = M[i][pc];
        for (let j = 0; j < M[0].length; j++) M[i][j] -= f * M[pr][j];
        M[i][pc] = 0;
        push(`${rowName(i)} ← ${rowName(i)} ${f > 0 ? "−" : "+"} ${term(Math.abs(f), pr)}`);
      }
    }
  }
  return steps;
}
export function rowSummary(id: RrId, S: Mat) {
  const { aug } = RR_MATS[id], cols = S[0].length;
  const nz = (row: number[], upto: number) => row.slice(0, upto).some((v) => Math.abs(v) > EPS);
  const rankA = S.filter((r) => nz(r, aug ? cols - 1 : cols)).length, rankAug = S.filter((r) => nz(r, cols)).length;
  const nvars = aug ? cols - 1 : cols;
  const verdict = !aug ? `rank = ${rankA}` : rankA !== rankAug ? "inconsistent (rank A ≠ rank [A|B])" : rankA === nvars ? "consistent, unique solution" : `consistent, infinitely many (${nvars - rankA} free)`;
  return { rankA, rankAug, verdict, nullity: nvars - rankA };
}
export const rowText = (r: number[] | undefined, aug: boolean) => (r ? r.map((v, j) => (aug && j === r.length - 1 ? "| " : "") + frac(clean(v))).join("  ") : "—");

/* ───────────────────────── 18. Cayley-Hamilton ───────────────────────── */

export type CHId = "m33a" | "m33b" | "m22a" | "m22b" | "custom";
export const CH_MATS: Record<CHId, { label: string; M: Mat | null }> = {
  m33a: { label: "3×3 [2 −1 1; −1 2 −1; 1 −1 2]", M: [[2, -1, 1], [-1, 2, -1], [1, -1, 2]] },
  m33b: { label: "3×3 [4 3 1; 2 1 −2; 1 2 1]", M: [[4, 3, 1], [2, 1, -2], [1, 2, 1]] },
  m22a: { label: "2×2 [1 2; 2 4] (singular)", M: [[1, 2], [2, 4]] },
  m22b: { label: "2×2 [1 4; 2 3]", M: [[1, 4], [2, 3]] },
  custom: { label: "Your own 2×2 (a, b, c, d)", M: null },
};
/** Characteristic polynomial coefficients c[0..n] of λ^i (Faddeev-LeVerrier). */
export function charPoly(A: Mat): number[] {
  const n = A.length, c = new Array<number>(n + 1).fill(0);
  c[n] = 1;
  let Mk = A.map((r) => r.map(() => 0));
  for (let k = 1; k <= n; k++) {
    Mk = matMul(A, Mk).map((r, i) => r.map((v, j) => v + (i === j ? c[n - k + 1] : 0)));
    c[n - k] = -trace(matMul(A, Mk)) / k;
  }
  return c.map(clean);
}
export function polyText(c: number[]): string {
  const sup = ["", "", "²", "³"];
  const out: string[] = [];
  for (let i = c.length - 1; i >= 0; i--) {
    const v = c[i];
    if (Math.abs(v) < 1e-9) continue;
    const a = Math.abs(v), body = i === 0 ? frac(a) : (Math.abs(a - 1) < 1e-9 ? "" : frac(a)) + "λ" + sup[i];
    out.push((v < 0 ? "− " : out.length ? "+ " : "") + body);
  }
  return out.join(" ") || "0";
}
export function cayley(A: Mat, k: number) {
  const n = A.length, c = charPoly(A);
  let P: Mat = A.map((r) => r.map(() => 0));
  for (let i = 0; i <= n; i++) { const Ai = matPow(A, i); P = P.map((r, a) => r.map((v, b) => v + c[i] * Ai[a][b])); }
  const resid = Math.max(...P.flat().map(Math.abs));
  const dt = det(A);
  let inv: Mat | null = null;
  if (Math.abs(dt) > 1e-9) {
    let S: Mat = A.map((r) => r.map(() => 0));
    for (let i = 1; i <= n; i++) { const Ai = matPow(A, i - 1); S = S.map((r, a) => r.map((v, b) => v + c[i] * Ai[a][b])); }
    inv = S.map((r) => r.map((v) => clean(-v / c[0])));
  }
  const Ak = matPow(A, k);
  return { c, poly: polyText(c), resid, det: dt, tr: trace(A), inv, Ak, trAk: trace(Ak), P };
}

/* ───────────────────────── 19. Diagonalisation (2×2) ───────────────────────── */

export type Diag2 = { kind: "real" | "scalar" | "defective" | "complex"; l1: number; l2: number; v1: XY; v2: XY; re: number; im: number };
export function diag2(a: number, b: number, c: number, d: number): Diag2 {
  const tr = a + d, dt = a * d - b * c, disc = tr * tr - 4 * dt;
  if (disc < -1e-9) return { kind: "complex", l1: NaN, l2: NaN, v1: [0, 0], v2: [0, 0], re: tr / 2, im: Math.sqrt(-disc) / 2 };
  const s = Math.sqrt(Math.max(0, disc)), l1 = (tr + s) / 2, l2 = (tr - s) / 2;
  const vec = (l: number): XY => {
    let v: XY;
    if (Math.abs(b) > 1e-9) v = [b, l - a]; else if (Math.abs(c) > 1e-9) v = [l - d, c]; else v = Math.abs(l - a) < 1e-9 ? [1, 0] : [0, 1];
    const m = Math.hypot(v[0], v[1]) || 1;
    return [v[0] / m, v[1] / m];
  };
  if (s < 1e-9) {
    const scalar = Math.abs(b) < 1e-9 && Math.abs(c) < 1e-9 && Math.abs(a - d) < 1e-9;
    return scalar ? { kind: "scalar", l1, l2, v1: [1, 0], v2: [0, 1], re: l1, im: 0 } : { kind: "defective", l1, l2, v1: vec(l1), v2: vec(l1), re: l1, im: 0 };
  }
  return { kind: "real", l1, l2, v1: vec(l1), v2: vec(l2), re: l1, im: 0 };
}
export function diagPower(a: number, b: number, c: number, d: number, n: number) {
  const A: Mat = [[a, b], [c, d]], D = diag2(a, b, c, d), direct = matPow(A, n);
  if (D.kind !== "real" && D.kind !== "scalar") return { D, direct, viaP: null as Mat | null, P: null as Mat | null, resid: NaN, alpha: [NaN, NaN] as XY };
  const P: Mat = [[D.v1[0], D.v2[0]], [D.v1[1], D.v2[1]]], dP = P[0][0] * P[1][1] - P[0][1] * P[1][0];
  const Pi: Mat = [[P[1][1] / dP, -P[0][1] / dP], [-P[1][0] / dP, P[0][0] / dP]];
  const Dn: Mat = [[Math.pow(D.l1, n), 0], [0, Math.pow(D.l2, n)]];
  const viaP = matMul(matMul(P, Dn), Pi);
  return { D, direct, viaP, P, resid: Math.max(...direct.flat().map((v, i) => Math.abs(v - viaP.flat()[i]))), alpha: [0, 0] as XY };
}
export function orbit2(a: number, b: number, c: number, d: number, ang: number, n: number): XY[] {
  let x = Math.cos((ang * Math.PI) / 180), y = Math.sin((ang * Math.PI) / 180);
  const out: XY[] = [[x, y]];
  for (let i = 0; i < n; i++) { [x, y] = [a * x + b * y, c * x + d * y]; out.push([x, y]); }
  return out;
}
/** Coordinates (α, β) of p in the eigenbasis: p = α v1 + β v2. */
export function eigenCoords(D: Diag2, p: XY): XY {
  const dP = D.v1[0] * D.v2[1] - D.v2[0] * D.v1[1];
  if (Math.abs(dP) < 1e-9) return [NaN, NaN];
  return [(p[0] * D.v2[1] - D.v2[0] * p[1]) / dP, (D.v1[0] * p[1] - p[0] * D.v1[1]) / dP];
}

/* ───────────────────────── 20. Eigenproblem of a 3×3 matrix ───────────────────────── */

export type E3Id = "sym1" | "tri" | "sym2" | "ch33";
export const E3_MATS: Record<E3Id, { label: string; M: Mat }> = {
  sym1: { label: "[−2 5 4; 5 7 5; 4 5 −2] (symmetric)", M: [[-2, 5, 4], [5, 7, 5], [4, 5, -2]] },
  tri: { label: "[3 1 4; 0 2 6; 0 0 5] (triangular)", M: [[3, 1, 4], [0, 2, 6], [0, 0, 5]] },
  sym2: { label: "[6 −2 2; −2 3 −1; 2 −1 3] (repeated λ)", M: [[6, -2, 2], [-2, 3, -1], [2, -1, 3]] },
  ch33: { label: "[1 −6 −4; 0 4 2; 0 −6 −3]", M: [[1, -6, -4], [0, 4, 2], [0, -6, -3]] },
};
export const scaleMat = (M: Mat, k: number): Mat => M.map((r) => r.map((v) => v * k));
/** Real roots of λ³ + p λ² + q λ + r = 0 (descending), plus the complex pair if there is one. */
export function cubicRoots(c: number[]): { real: number[]; re: number; im: number } {
  const [r, q, p] = [c[0], c[1], c[2]];
  const a = q - (p * p) / 3, b = (2 * p ** 3) / 27 - (p * q) / 3 + r, sh = -p / 3;
  const D = (b * b) / 4 + (a * a * a) / 27;
  let real: number[] = [];
  let re = 0, im = 0;
  if (D > 1e-12) {
    const s = Math.cbrt(-b / 2 + Math.sqrt(D)) + Math.cbrt(-b / 2 - Math.sqrt(D));
    real = [s + sh];
    re = -s / 2 + sh; im = (Math.sqrt(3) / 2) * (Math.cbrt(-b / 2 + Math.sqrt(D)) - Math.cbrt(-b / 2 - Math.sqrt(D)));
  } else if (Math.abs(a) < 1e-12 && Math.abs(b) < 1e-12) real = [sh, sh, sh];
  else {
    const m = 2 * Math.sqrt(Math.max(0, -a / 3)), arg = Math.max(-1, Math.min(1, ((3 * b) / (a * m)) || 0)), th = Math.acos(arg) / 3;
    real = [0, 1, 2].map((k) => m * Math.cos(th - (2 * Math.PI * k) / 3) + sh);
  }
  real = real.map((x) => { let y = x; for (let i = 0; i < 4; i++) { const f = ((y + p) * y + q) * y + r, df = (3 * y + 2 * p) * y + q; if (Math.abs(df) > 1e-12) y -= f / df; } return y; });
  return { real: real.sort((x, y) => y - x), re, im: Math.abs(im) };
}
/** Orthonormal basis of the null space of a 3×3 matrix (by Gaussian elimination). */
export function nullSpace3(M: Mat, tol = 1e-6): V3[] {
  const A = M.map((r) => r.slice());
  const pivCols: number[] = [];
  let r = 0;
  for (let c = 0; c < 3 && r < 3; c++) {
    let p = r;
    for (let i = r + 1; i < 3; i++) if (Math.abs(A[i][c]) > Math.abs(A[p][c])) p = i;
    if (Math.abs(A[p][c]) < tol) continue;
    [A[r], A[p]] = [A[p], A[r]];
    const pv = A[r][c];
    for (let j = 0; j < 3; j++) A[r][j] /= pv;
    for (let i = 0; i < 3; i++) if (i !== r) { const f = A[i][c]; for (let j = 0; j < 3; j++) A[i][j] -= f * A[r][j]; }
    pivCols.push(c); r++;
  }
  const free = [0, 1, 2].filter((c) => !pivCols.includes(c));
  return free.map((fc) => {
    const v: V3 = [0, 0, 0];
    v[fc] = 1;
    pivCols.forEach((pc, row) => { v[pc] = -A[row][fc]; });
    const m = norm3(v);
    const w: V3 = [v[0] / m, v[1] / m, v[2] / m];
    const big = Math.abs(w[0]) > 1e-9 ? w[0] : Math.abs(w[1]) > 1e-9 ? w[1] : w[2];
    return big < 0 ? ([-w[0], -w[1], -w[2]] as V3) : w;
  });
}
export function eig3(A: Mat) {
  const c = charPoly(A), roots = cubicRoots(c);
  const distinct: { l: number; mult: number }[] = [];
  for (const x of roots.real) {
    const g = distinct.find((d) => Math.abs(d.l - x) < 1e-5 * (1 + Math.abs(x)));
    if (g) g.mult++; else distinct.push({ l: x, mult: 1 });
  }
  const groups = distinct.map((g) => {
    const lam = g.l, B = A.map((r, i) => r.map((v, j) => v - (i === j ? lam : 0)));
    return { l: lam, mult: g.mult, vectors: nullSpace3(B, 1e-6 * (1 + Math.abs(lam))) };
  });
  return { c, values: roots.real, complex: roots.real.length < 3 ? { re: roots.re, im: roots.im } : null, groups, trace: trace(A), det: det(A), diagonalizable: roots.real.length === 3 && groups.every((g) => g.vectors.length === g.mult) };
}

/** Largest stretch |Ax| over unit x (spectral norm), by power iteration on AᵀA. */
export function spectralNorm(A: Mat): number {
  const n = A.length, AtA = A[0].map((_, i) => A[0].map((__, j) => A.reduce((s, r) => s + r[i] * r[j], 0)));
  let v = new Array<number>(n).fill(1), lam = 0;
  for (let it = 0; it < 60; it++) {
    const w = AtA.map((r) => r.reduce((s, x, k) => s + x * v[k], 0)), m = Math.hypot(...w);
    if (m < 1e-12) return 0;
    lam = m; v = w.map((x) => x / m);
  }
  return Math.sqrt(lam);
}
