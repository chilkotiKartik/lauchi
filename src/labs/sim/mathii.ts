/**
 * Pure maths for the extra AHT-005 Analytical Mathematics (Maths II) labs.
 * Unit 1: exact equations, orthogonal trajectories, Newton cooling, Clairaut.
 * Unit 2: variation of parameters, Cauchy-Euler, simultaneous linear ODEs.
 * Unit 3: half-range Fourier series, Parseval, uniform convergence.
 * Unit 4: Lagrange PDE, 2-D heat, d'Alembert wave, homogeneous linear PDEs.
 * Unit 5: harmonic functions, Cauchy integral formula, residues, real integrals, singularities.
 */

export type C2 = [number, number];
const TAU = 2 * Math.PI;

/* ───────────────────────────── shared helpers ───────────────────────────── */

export const cadd = (a: C2, b: C2): C2 => [a[0] + b[0], a[1] + b[1]];
export const cmul = (a: C2, b: C2): C2 => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
export const cdiv = (a: C2, b: C2): C2 => { const d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; };
export const cexp = (a: C2): C2 => { const e = Math.exp(a[0]); return [e * Math.cos(a[1]), e * Math.sin(a[1])]; };
export const csin = (a: C2): C2 => [Math.sin(a[0]) * Math.cosh(a[1]), Math.cos(a[0]) * Math.sinh(a[1])];
export const ccos = (a: C2): C2 => [Math.cos(a[0]) * Math.cosh(a[1]), -Math.sin(a[0]) * Math.sinh(a[1])];
export const cabs = (a: C2) => Math.hypot(a[0], a[1]);
export const cpow = (a: C2, n: number): C2 => {
  let r: C2 = [1, 0];
  const k = Math.abs(n);
  for (let i = 0; i < k; i++) r = cmul(r, a);
  return n < 0 ? cdiv([1, 0], r) : r;
};
export const fact = (n: number) => { let f = 1; for (let i = 2; i <= n; i++) f *= i; return f; };

/** Composite Simpson rule on [a, b] with n (even) panels. */
export function simpson(f: (x: number) => number, a: number, b: number, n = 200): number {
  const m = n % 2 ? n + 1 : n, h = (b - a) / m;
  let s = f(a) + f(b);
  for (let i = 1; i < m; i++) s += f(a + i * h) * (i % 2 ? 4 : 2);
  return (s * h) / 3;
}

/** Marching squares on an n × n grid of values over [−half, half]² (row-major, row j = y index). Returns flat x1,y1,x2,y2,… */
export function contourSegs(vals: number[], n: number, x0: number, x1: number, y0: number, y1: number, level: number): number[] {
  const out: number[] = [];
  const px = (i: number) => x0 + ((x1 - x0) * i) / (n - 1), py = (j: number) => y0 + ((y1 - y0) * j) / (n - 1);
  const cross = (xa: number, ya: number, va: number, xb: number, yb: number, vb: number): [number, number] | null => {
    if (!Number.isFinite(va) || !Number.isFinite(vb)) return null;
    if ((va < level) === (vb < level)) return null;
    const t = (level - va) / (vb - va);
    return [xa + t * (xb - xa), ya + t * (yb - ya)];
  };
  for (let j = 0; j < n - 1; j++) {
    for (let i = 0; i < n - 1; i++) {
      const a = vals[j * n + i], b = vals[j * n + i + 1], c = vals[(j + 1) * n + i + 1], d = vals[(j + 1) * n + i];
      const e = [
        cross(px(i), py(j), a, px(i + 1), py(j), b),
        cross(px(i + 1), py(j), b, px(i + 1), py(j + 1), c),
        cross(px(i + 1), py(j + 1), c, px(i), py(j + 1), d),
        cross(px(i), py(j + 1), d, px(i), py(j), a),
      ].filter((p): p is [number, number] => p !== null);
      if (e.length === 2) out.push(e[0][0], e[0][1], e[1][0], e[1][1]);
      else if (e.length === 4) out.push(e[0][0], e[0][1], e[1][0], e[1][1], e[2][0], e[2][1], e[3][0], e[3][1]);
    }
  }
  return out;
}

/* ═════════════════════════ UNIT 1: first-order ODEs ═════════════════════════ */

/** Exact equations and integrating factors (PYQ Q1.1 and Q1.3). */
export type ExactId = "q13a" | "q13b" | "q13c" | "q13d" | "q11" | "ydxxdy";
export type IfId = "one" | "x" | "y" | "xy" | "x2" | "y2" | "y4" | "x2y2";
export const IF_POW: Record<IfId, [number, number]> = { one: [0, 0], x: [1, 0], y: [0, 1], xy: [1, 1], x2: [2, 0], y2: [0, 2], y4: [0, 4], x2y2: [2, 2] };
export const IF_LABEL: Record<IfId, string> = { one: "1 (none)", x: "1/x", y: "1/y", xy: "1/(xy)", x2: "1/x²", y2: "1/y²", y4: "1/y⁴", x2y2: "1/(x²y²)" };
export interface ExactEq {
  label: string; text: string; M: (x: number, y: number) => number; N: (x: number, y: number) => number;
  /** The integrating factor that makes it exact (textbook answer). */
  ifKey: IfId;
  /** Potential φ with φ = c the solution, for each integrating factor that gives an exact equation. */
  phi: Partial<Record<IfId, (x: number, y: number) => number>>;
  sol: string;
}
export const EXACT: Record<ExactId, ExactEq> = {
  q13a: { label: "Q1.3(a) (5x⁴+3x²y²−2xy³)dx + (2x³y−3x²y²−5y⁴)dy", text: "(5x⁴ + 3x²y² − 2xy³)dx + (2x³y − 3x²y² − 5y⁴)dy = 0", ifKey: "one",
    M: (x, y) => 5 * x ** 4 + 3 * x * x * y * y - 2 * x * y ** 3, N: (x, y) => 2 * x ** 3 * y - 3 * x * x * y * y - 5 * y ** 4,
    phi: { one: (x, y) => x ** 5 + x ** 3 * y * y - x * x * y ** 3 - y ** 5 }, sol: "x⁵ + x³y² − x²y³ − y⁵ = c" },
  q13b: { label: "Q1.3(b) (x²y−2xy²)dx − (x³−3x²y)dy", text: "(x²y − 2xy²)dx − (x³ − 3x²y)dy = 0", ifKey: "x2y2",
    M: (x, y) => x * x * y - 2 * x * y * y, N: (x, y) => -(x ** 3) + 3 * x * x * y,
    phi: { x2y2: (x, y) => x / y - 2 * Math.log(x) + 3 * Math.log(y) }, sol: "x/y − 2 ln x + 3 ln y = c" },
  q13c: { label: "Q1.3(c) {y(1+1/x)+cos y}dx + (x+ln x−x sin y)dy", text: "{y(1 + 1/x) + cos y}dx + (x + ln x − x sin y)dy = 0", ifKey: "one",
    M: (x, y) => y * (1 + 1 / x) + Math.cos(y), N: (x, y) => x + Math.log(x) - x * Math.sin(y),
    phi: { one: (x, y) => x * y + y * Math.log(x) + x * Math.cos(y) }, sol: "xy + y ln x + x cos y = c" },
  q13d: { label: "Q1.3(d) (2xy⁴eʸ+2xy³+y)dx + (x²y⁴eʸ−x²y²−3x)dy", text: "(2xy⁴eʸ + 2xy³ + y)dx + (x²y⁴eʸ − x²y² − 3x)dy = 0", ifKey: "y4",
    M: (x, y) => 2 * x * y ** 4 * Math.exp(y) + 2 * x * y ** 3 + y, N: (x, y) => x * x * y ** 4 * Math.exp(y) - x * x * y * y - 3 * x,
    phi: { y4: (x, y) => x * x * Math.exp(y) + (x * x) / y + x / y ** 3 }, sol: "x²eʸ + x²/y + x/y³ = c" },
  q11: { label: "Q1.1 (1+3e^(x/y))dx + 3e^(x/y)(1−x/y)dy", text: "(1 + 3e^(x/y))dx + 3e^(x/y)(1 − x/y)dy = 0", ifKey: "one",
    M: (x, y) => 1 + 3 * Math.exp(x / y), N: (x, y) => 3 * Math.exp(x / y) * (1 - x / y),
    phi: { one: (x, y) => x + 3 * y * Math.exp(x / y) }, sol: "x + 3y·e^(x/y) = c" },
  ydxxdy: { label: "y dx − x dy = 0 (three integrating factors)", text: "y dx − x dy = 0", ifKey: "y2",
    M: (_x, y) => y, N: (x) => -x,
    phi: { y2: (x, y) => x / y, xy: (x, y) => Math.log(x) - Math.log(y), x2: (x, y) => -y / x }, sol: "x/y = c" },
};
export const mult = (id: IfId, x: number, y: number) => { const [i, j] = IF_POW[id]; return x ** -i * y ** -j; };
/** ∂(μM)/∂y and ∂(μN)/∂x by central differences. */
export function exactParts(eq: ExactEq, ifId: IfId, x: number, y: number, h = 1e-5) {
  const m = (xx: number, yy: number) => mult(ifId, xx, yy) * eq.M(xx, yy), n = (xx: number, yy: number) => mult(ifId, xx, yy) * eq.N(xx, yy);
  const My = (m(x, y + h) - m(x, y - h)) / (2 * h), Nx = (n(x + h, y) - n(x - h, y)) / (2 * h);
  return { My, Nx, diff: My - Nx };
}
const EX_PTS: [number, number][] = [[0.7, 0.9], [1.3, 0.6], [1.9, 1.4], [0.9, 2.1], [2.2, 1.0]];
export function isExact(eq: ExactEq, ifId: IfId): boolean {
  return EX_PTS.every(([x, y]) => { const p = exactParts(eq, ifId, x, y, 1e-4); return Math.abs(p.diff) <= 1e-4 * (1 + Math.abs(p.My) + Math.abs(p.Nx)); });
}
export function exactLab(id: ExactId, ifId: IfId, x0: number, y0: number) {
  const eq = EXACT[id], p = exactParts(eq, ifId, x0, y0), exact = isExact(eq, ifId), pf = exact ? eq.phi[ifId] ?? null : null;
  return { ...p, exact, right: ifId === eq.ifKey, phi: pf ? pf(x0, y0) : null, hasPotential: pf !== null };
}

/** Orthogonal trajectories of y = c·xⁿ: the family has y′ = n y/x, the orthogonal family x² + n y² = k. */
export function orthoInfo(n: number, c: number, xi: number) {
  const y = c * xi ** n, m1 = (n * y) / xi, m2 = n * y === 0 ? Infinity : -xi / (n * y), k = xi * xi + n * y * y;
  const a1 = Math.atan(m1), a2 = Number.isFinite(m2) ? Math.atan(m2) : Math.PI / 2;
  return { y, m1, m2, k, angle: (Math.abs(a1 - a2) * 180) / Math.PI, product: Number.isFinite(m2) ? m1 * m2 : NaN };
}
export const familyY = (n: number, c: number, x: number) => c * x ** n;
export function orthoY(n: number, k: number, x: number): number { const s = (k - x * x) / n; return s >= 0 && n !== 0 ? Math.sqrt(s) : NaN; }
export function orthoName(n: number): string {
  if (n === 0) return "vertical lines x = k";
  if (n === 1) return "circles x² + y² = k";
  if (n === -1) return "rectangular hyperbolas x² − y² = k";
  return n > 0 ? "ellipses x² + " + n + "y² = k" : "hyperbolas x² − " + -n + "y² = k";
}

/** Newton's law of cooling (growth and decay when the surroundings are 0): dT/dt = −k(T − Ts). */
export function cooling(T0: number, Ts: number, k: number, t: number) {
  const T = Ts + (T0 - Ts) * Math.exp(-k * t);
  return { T, rate: -k * (T - Ts), half: Math.LN2 / k, tau: 1 / k };
}
/** Time at which the body reaches `Tt`, or NaN if it never does. */
export function timeTo(T0: number, Ts: number, k: number, Tt: number): number {
  const r = (T0 - Ts) / (Tt - Ts);
  return r > 0 && Number.isFinite(r) ? Math.log(r) / k : NaN;
}
/** Cooling constant from two readings: the body falls from T0 to T1 in t1. */
export const coolingK = (T0: number, T1: number, Ts: number, t1: number) => Math.log((T0 - Ts) / (T1 - Ts)) / t1;

/** Clairaut's equation y = px + f(p) and its singular solution (the envelope of the lines y = cx + f(c)). */
export type ClairautId = "parab" | "inv" | "ellipse";
export const CLAIRAUT_LABEL: Record<ClairautId, string> = { parab: "y = px + a p²", inv: "y = px + a/p", ellipse: "y = px + √(a²p² + b²)" };
export function clairautF(kind: ClairautId, a: number, b: number, p: number): number {
  return kind === "parab" ? a * p * p : kind === "inv" ? a / p : Math.sqrt(a * a * p * p + b * b);
}
/** Point where the line of slope c touches the envelope. */
export function clairautTouch(kind: ClairautId, a: number, b: number, c: number): [number, number] {
  if (kind === "parab") return [-2 * a * c, -a * c * c];
  if (kind === "inv") return [a / (c * c), (2 * a) / c];
  const s = Math.sqrt(a * a * c * c + b * b);
  return [(-a * a * c) / s, (b * b) / s];
}
/** The singular solution (envelope) y(x); for y = px + a/p pass the sign of the branch (+1 upper, −1 lower). Returns NaN outside its domain. */
export function clairautEnv(kind: ClairautId, a: number, b: number, x: number, branch = 1): number {
  if (kind === "parab") return -(x * x) / (4 * a);
  if (kind === "inv") return x >= 0 ? branch * 2 * Math.sqrt(a * x) : NaN;
  const q = 1 - (x * x) / (a * a);
  return q >= 0 ? b * Math.sqrt(q) : NaN;
}
export function clairautSingular(kind: ClairautId, a: number): string {
  return kind === "parab" ? `y = −x²/${(4 * a).toFixed(2)}  (x² = −4a y)` : kind === "inv" ? "y² = 4ax" : "x²/a² + y²/b² = 1, y > 0";
}

/* ═════════════════════ UNIT 2: higher-order and simultaneous ═════════════════════ */

/** Variation of parameters for y″ + a y′ + b y = R(x). */
export type VpId = "secx" | "tanx" | "q21a" | "q21b" | "q21e" | "q21f";
export interface VpEq {
  label: string; a: number; b: number; y1: (x: number) => number; y2: (x: number) => number; dy1: (x: number) => number; dy2: (x: number) => number;
  R: (x: number) => number; xmin: number; xmax: number; base: number; text: string; cf: string;
}
export const VP: Record<VpId, VpEq> = {
  secx: { label: "y″ + y = sec x (Q2.1, a = 1)", text: "y″ + y = sec x", cf: "c₁ cos x + c₂ sin x", a: 0, b: 1, y1: Math.cos, y2: Math.sin, dy1: (x) => -Math.sin(x), dy2: Math.cos, R: (x) => 1 / Math.cos(x), xmin: -1.3, xmax: 1.3, base: 0 },
  tanx: { label: "y″ + y = tan x", text: "y″ + y = tan x", cf: "c₁ cos x + c₂ sin x", a: 0, b: 1, y1: Math.cos, y2: Math.sin, dy1: (x) => -Math.sin(x), dy2: Math.cos, R: Math.tan, xmin: -1.3, xmax: 1.3, base: 0 },
  q21a: { label: "Q2.1 y″ − 3y′ + 2y = eˣ/(1+eˣ)", text: "y″ − 3y′ + 2y = eˣ/(1 + eˣ)", cf: "c₁eˣ + c₂e²ˣ", a: -3, b: 2, y1: Math.exp, y2: (x) => Math.exp(2 * x), dy1: Math.exp, dy2: (x) => 2 * Math.exp(2 * x), R: (x) => Math.exp(x) / (1 + Math.exp(x)), xmin: -2, xmax: 2, base: 0 },
  q21b: { label: "Q2.1 y″ − 6y′ + 9y = e³ˣ/x²", text: "y″ − 6y′ + 9y = e³ˣ/x²", cf: "(c₁ + c₂x)e³ˣ", a: -6, b: 9, y1: (x) => Math.exp(3 * x), y2: (x) => x * Math.exp(3 * x), dy1: (x) => 3 * Math.exp(3 * x), dy2: (x) => (1 + 3 * x) * Math.exp(3 * x), R: (x) => Math.exp(3 * x) / (x * x), xmin: 0.4, xmax: 2.2, base: 1 },
  q21e: { label: "Q2.1 y″ − y = 2/(1+eˣ)", text: "y″ − y = 2/(1 + eˣ)", cf: "c₁eˣ + c₂e⁻ˣ", a: 0, b: -1, y1: Math.exp, y2: (x) => Math.exp(-x), dy1: Math.exp, dy2: (x) => -Math.exp(-x), R: (x) => 2 / (1 + Math.exp(x)), xmin: -2.5, xmax: 2.5, base: 0 },
  q21f: { label: "Q2.1 y″ − 2y′ = eˣ sin x", text: "y″ − 2y′ = eˣ sin x", cf: "c₁ + c₂e²ˣ", a: -2, b: 0, y1: () => 1, y2: (x) => Math.exp(2 * x), dy1: () => 0, dy2: (x) => 2 * Math.exp(2 * x), R: (x) => Math.exp(x) * Math.sin(x), xmin: -2, xmax: 2.5, base: 0 },
};
export const vpWronskian = (e: VpEq, x: number) => e.y1(x) * e.dy2(x) - e.y2(x) * e.dy1(x);
/** u₁ = −∫ y₂R/W dx, u₂ = ∫ y₁R/W dx, measured from the base point. */
export function vpU(e: VpEq, x: number): [number, number] {
  const u1 = -simpson((s) => (e.y2(s) * e.R(s)) / vpWronskian(e, s), e.base, x, 240);
  const u2 = simpson((s) => (e.y1(s) * e.R(s)) / vpWronskian(e, s), e.base, x, 240);
  return [u1, u2];
}
export function vpSolve(id: VpId, x: number, c1 = 0, c2 = 0) {
  const e = VP[id], [u1, u2] = vpU(e, x);
  const yp = u1 * e.y1(x) + u2 * e.y2(x);
  const dyp = u1 * e.dy1(x) + u2 * e.dy2(x);
  const W = vpWronskian(e, x);
  const h = 1e-3, [a1, a2] = vpU(e, x + h), [b1, b2] = vpU(e, x - h);
  const dypp = ((a1 * e.dy1(x + h) + a2 * e.dy2(x + h)) - (b1 * e.dy1(x - h) + b2 * e.dy2(x - h))) / (2 * h);
  const residual = dypp + e.a * dyp + e.b * yp - e.R(x);
  const y = c1 * e.y1(x) + c2 * e.y2(x) + yp;
  return { u1, u2, yp, dyp, W, residual, y };
}
export const vpX = (id: VpId, s: number) => VP[id].xmin + s * (VP[id].xmax - VP[id].xmin);

/** Cauchy-Euler x²y″ + a x y′ + b y = 0: put x = eᶻ to get m² + (a−1)m + b = 0. */
export type CeKind = "real" | "repeat" | "complex";
export function ceRoots(a: number, b: number): { kind: CeKind; m1: number; m2: number; alpha: number; beta: number; disc: number } {
  const s = a - 1, disc = s * s - 4 * b;
  if (disc > 1e-9) { const r = Math.sqrt(disc); return { kind: "real", m1: (-s + r) / 2, m2: (-s - r) / 2, alpha: -s / 2, beta: 0, disc }; }
  if (disc >= -1e-9) return { kind: "repeat", m1: -s / 2, m2: -s / 2, alpha: -s / 2, beta: 0, disc };
  return { kind: "complex", m1: -s / 2, m2: -s / 2, alpha: -s / 2, beta: Math.sqrt(-disc) / 2, disc };
}
export function ceY(a: number, b: number, c1: number, c2: number, x: number): number {
  const r = ceRoots(a, b);
  if (r.kind === "real") return c1 * x ** r.m1 + c2 * x ** r.m2;
  if (r.kind === "repeat") return (c1 + c2 * Math.log(x)) * x ** r.m1;
  const th = r.beta * Math.log(x);
  return x ** r.alpha * (c1 * Math.cos(th) + c2 * Math.sin(th));
}
export function ceDY(a: number, b: number, c1: number, c2: number, x: number): number {
  const r = ceRoots(a, b);
  if (r.kind === "real") return c1 * r.m1 * x ** (r.m1 - 1) + c2 * r.m2 * x ** (r.m2 - 1);
  if (r.kind === "repeat") return c2 * x ** (r.m1 - 1) + r.m1 * (c1 + c2 * Math.log(x)) * x ** (r.m1 - 1);
  const th = r.beta * Math.log(x);
  return x ** (r.alpha - 1) * ((r.alpha * c1 + r.beta * c2) * Math.cos(th) + (r.alpha * c2 - r.beta * c1) * Math.sin(th));
}
/** x²y″ + a x y′ + b y evaluated on the closed-form solution (should be ≈ 0). */
export function ceResidual(a: number, b: number, c1: number, c2: number, x: number): number {
  const h = 1e-5, y = ceY(a, b, c1, c2, x), dy = ceDY(a, b, c1, c2, x);
  const d2 = (ceDY(a, b, c1, c2, x + h) - ceDY(a, b, c1, c2, x - h)) / (2 * h);
  return x * x * d2 + a * x * dy + b * y;
}

/** Linear system x′ = a x + b y, y′ = c x + d y. */
export function sysInfo(a: number, b: number, c: number, d: number) {
  const tr = a + d, det = a * d - b * c, disc = tr * tr - 4 * det, eps = 1e-9;
  let l1: C2, l2: C2;
  if (disc >= 0) { const r = Math.sqrt(disc); l1 = [(tr + r) / 2, 0]; l2 = [(tr - r) / 2, 0]; } else { const r = Math.sqrt(-disc) / 2; l1 = [tr / 2, r]; l2 = [tr / 2, -r]; }
  let kind: string;
  if (Math.abs(det) <= eps) kind = "degenerate (a line of equilibria)";
  else if (det < 0) kind = "saddle (unstable)";
  else if (Math.abs(disc) <= eps) kind = tr < 0 ? "stable improper / star node" : "unstable improper / star node";
  else if (disc > 0) kind = tr < 0 ? "stable node (sink)" : "unstable node (source)";
  else if (Math.abs(tr) <= eps) kind = "centre (closed orbits)";
  else kind = tr < 0 ? "stable spiral (sink)" : "unstable spiral (source)";
  return { tr, det, disc, l1, l2, kind };
}
export function sysPath(a: number, b: number, c: number, d: number, x0: number, y0: number, T: number, n = 200, cap = 12): [number, number, number][] {
  const out: [number, number, number][] = [[0, x0, y0]];
  const h = T / n;
  let x = x0, y = y0;
  const f = (xx: number, yy: number): [number, number] => [a * xx + b * yy, c * xx + d * yy];
  for (let i = 1; i <= n; i++) {
    const k1 = f(x, y), k2 = f(x + (h * k1[0]) / 2, y + (h * k1[1]) / 2), k3 = f(x + (h * k2[0]) / 2, y + (h * k2[1]) / 2), k4 = f(x + h * k3[0], y + h * k3[1]);
    x += (h / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]); y += (h / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]);
    out.push([i * h, x, y]);
    if (Math.abs(x) > cap || Math.abs(y) > cap) break;
  }
  return out;
}

/* ═════════════════════════ UNIT 3: Fourier and convergence ═════════════════════════ */

export type HalfId = "x" | "xsq" | "one" | "tri" | "sinpl" | "abscos";
export const HALF_LABEL: Record<HalfId, string> = { x: "f(x) = x", xsq: "f(x) = x²", one: "f(x) = 1", tri: "triangle: x then L − x", sinpl: "f(x) = sin(πx/L)", abscos: "f(x) = |cos(πx/L)|" };
export function halfF(id: HalfId, L: number, x: number): number {
  switch (id) {
    case "x": return x;
    case "xsq": return x * x;
    case "one": return 1;
    case "tri": return x < L / 2 ? x : L - x;
    case "sinpl": return Math.sin((Math.PI * x) / L);
    default: return Math.abs(Math.cos((Math.PI * x) / L));
  }
}
/** Half-range coefficients on (0, L): sine → b₁..b_N (index 0 = b₁); cosine → a₀..a_N (index 0 = a₀, with f = a₀/2 + Σ aₙ cos). */
export function halfCoeffs(id: HalfId, kind: "sine" | "cosine", L: number, N: number): number[] {
  const out: number[] = [];
  const panels = 480;
  if (kind === "sine") {
    for (let n = 1; n <= N; n++) out.push((2 / L) * simpson((x) => halfF(id, L, x) * Math.sin((n * Math.PI * x) / L), 0, L, panels));
  } else {
    for (let n = 0; n <= N; n++) out.push((2 / L) * simpson((x) => halfF(id, L, x) * Math.cos((n * Math.PI * x) / L), 0, L, panels));
  }
  return out;
}
/** Partial sum with the first N harmonics. */
export function halfSum(kind: "sine" | "cosine", coef: number[], L: number, N: number, x: number): number {
  if (kind === "sine") { let s = 0; for (let n = 1; n <= N; n++) s += coef[n - 1] * Math.sin((n * Math.PI * x) / L); return s; }
  let s = coef[0] / 2;
  for (let n = 1; n <= N; n++) s += coef[n] * Math.cos((n * Math.PI * x) / L);
  return s;
}
/** Parseval for half-range series: (2/L)∫₀ᴸ f² dx and the part carried by the first N harmonics. */
export function halfEnergy(id: HalfId, kind: "sine" | "cosine", L: number, coef: number[], N: number) {
  const total = (2 / L) * simpson((x) => halfF(id, L, x) ** 2, 0, L, 480);
  let part = 0;
  if (kind === "sine") for (let n = 1; n <= N; n++) part += coef[n - 1] ** 2;
  else { part = (coef[0] * coef[0]) / 2; for (let n = 1; n <= N; n++) part += coef[n] ** 2; }
  return { total, part, frac: total > 0 ? part / total : 1 };
}

/** Full-range Fourier series on (−π, π) with closed-form coefficients, for Parseval's theorem. */
export type ParId = "x" | "xsq" | "abs" | "sq";
export const PAR_LABEL: Record<ParId, string> = { x: "f(x) = x", xsq: "f(x) = x²", abs: "f(x) = |x|", sq: "square wave (−1, +1)" };
export function parCoeffs(id: ParId, n: number): { a: number; b: number } {
  const s = n % 2 === 0 ? 1 : -1; // (−1)ⁿ
  switch (id) {
    case "x": return { a: 0, b: -2 * s / n };
    case "xsq": return { a: (4 * s) / (n * n), b: 0 };
    case "abs": return { a: (2 * (s - 1)) / (Math.PI * n * n), b: 0 };
    default: return { a: 0, b: n % 2 ? 4 / (n * Math.PI) : 0 };
  }
}
export const parA0 = (id: ParId) => (id === "xsq" ? (2 * Math.PI * Math.PI) / 3 : id === "abs" ? Math.PI : 0);
/** (1/π)∫₋π^π f² dx. */
export const parNorm = (id: ParId) => (id === "x" ? (2 * Math.PI * Math.PI) / 3 : id === "xsq" ? (2 * Math.PI ** 4) / 5 : id === "abs" ? (2 * Math.PI * Math.PI) / 3 : 2);
export function parEnergy(id: ParId, N: number): number {
  let e = (parA0(id) * parA0(id)) / 2;
  for (let n = 1; n <= N; n++) { const c = parCoeffs(id, n); e += c.a * c.a + c.b * c.b; }
  return e;
}
/** The numerical series Parseval sums, as [description, exact value, estimate from N harmonics]. */
export function parDeduce(id: ParId, N: number): { label: string; exact: number; est: number } {
  const e = parEnergy(id, N), pi2 = Math.PI * Math.PI;
  switch (id) {
    case "x": return { label: "Σ 1/n²", exact: pi2 / 6, est: e / 4 };
    case "xsq": return { label: "Σ 1/n⁴", exact: Math.PI ** 4 / 90, est: (e - (parA0(id) ** 2) / 2) / 16 };
    case "abs": return { label: "Σ over odd n of 1/n⁴", exact: Math.PI ** 4 / 96, est: ((e - pi2 / 2) * pi2) / 16 };
    default: return { label: "Σ over odd n of 1/n²", exact: pi2 / 8, est: (e * pi2) / 16 };
  }
}
export function parSum(id: ParId, N: number, x: number): number {
  let s = parA0(id) / 2;
  for (let n = 1; n <= N; n++) { const c = parCoeffs(id, n); s += c.a * Math.cos(n * x) + c.b * Math.sin(n * x); }
  return s;
}

/** Uniform convergence of sequences / series of functions. */
export type UcId = "xn" | "hump" | "sinn" | "sinsum";
export const UC_LABEL: Record<UcId, string> = { xn: "fₙ(x) = xⁿ on [0, a]", hump: "fₙ(x) = n x e^(−n x) on [0, 2]", sinn: "fₙ(x) = sin(nx)/n on [0, π]", sinsum: "Sₙ(x) = Σ sin(kx)/k², k ≤ n, on [0, π]" };
export function ucF(id: UcId, n: number, x: number): number {
  switch (id) {
    case "xn": return x ** n;
    case "hump": return n * x * Math.exp(-n * x);
    case "sinn": return Math.sin(n * x) / n;
    default: { let s = 0; for (let k = 1; k <= n; k++) s += Math.sin(k * x) / (k * k); return s; }
  }
}
export function ucLimit(id: UcId, a: number, x: number): number {
  if (id === "xn") return x >= 1 ? 1 : 0;
  if (id === "sinsum") return ucF("sinsum", 600, x);
  return 0;
}
export const ucXmax = (id: UcId, a: number) => (id === "xn" ? a : id === "hump" ? 2 : Math.PI);
/** sup |fₙ − f| (exact where it is known; for the series the M-test tail bound Σ_{k>n} 1/k²). */
export function ucSup(id: UcId, n: number, a: number): number {
  switch (id) {
    case "xn": return a >= 1 ? 1 : a ** n;
    case "hump": return n > 0 ? Math.exp(-1) : 0;
    case "sinn": return 1 / n;
    default: { let t = (Math.PI * Math.PI) / 6; for (let k = 1; k <= n; k++) t -= 1 / (k * k); return Math.max(0, t); }
  }
}
/** Grid sup over the interval (a numerical cross-check of ucSup; for sinsum measured against S₆₀₀). */
export function ucSupGrid(id: UcId, n: number, a: number, pts = 800): number {
  const xm = ucXmax(id, a);
  let s = 0;
  for (let i = 0; i <= pts; i++) {
    const x = (xm * i) / pts;
    const lim = id === "xn" && x >= 1 ? 0 : ucLimit(id, a, x);
    s = Math.max(s, Math.abs(ucF(id, n, x) - lim));
  }
  return s;
}
/** Smallest N with sup < eps for every later n, or null if the sup never gets below eps (not uniform). */
export function ucNeeded(id: UcId, a: number, eps: number): number | null {
  for (let n = 1; n <= 3000; n++) if (ucSup(id, n, a) < eps) return n;
  return null;
}
export const ucUniform = (id: UcId, a: number) => (id === "xn" ? a < 1 : id !== "hump");

/* ═════════════════════════ UNIT 4: partial differential equations ═════════════════════════ */

export type V3 = [number, number, number];
/** Lagrange PDE (mz − ny)p + (nx − lz)q = ly − mx : the characteristics rotate about the axis (l, m, n). */
export function rotateAbout(axis: V3, r: V3, theta: number): V3 {
  const len = Math.hypot(axis[0], axis[1], axis[2]);
  if (len < 1e-12) return r;
  const k: V3 = [axis[0] / len, axis[1] / len, axis[2] / len], c = Math.cos(theta), s = Math.sin(theta);
  const dot = k[0] * r[0] + k[1] * r[1] + k[2] * r[2];
  const cr: V3 = [k[1] * r[2] - k[2] * r[1], k[2] * r[0] - k[0] * r[2], k[0] * r[1] - k[1] * r[0]];
  return [r[0] * c + cr[0] * s + k[0] * dot * (1 - c), r[1] * c + cr[1] * s + k[1] * dot * (1 - c), r[2] * c + cr[2] * s + k[2] * dot * (1 - c)];
}
/** The right-hand sides P, Q, R of the Lagrange equation at (x, y, z). */
export const lagrangePQR = (axis: V3, r: V3): V3 => [axis[1] * r[2] - axis[2] * r[1], axis[2] * r[0] - axis[0] * r[2], axis[0] * r[1] - axis[1] * r[0]];
export const seedPoint = (s: number, k: number, h: number): V3 => [1, s, k * s * s + h];
export function rotInvariants(axis: V3, r: V3) {
  const u = r[0] * r[0] + r[1] * r[1] + r[2] * r[2], v = axis[0] * r[0] + axis[1] * r[1] + axis[2] * r[2], len = Math.hypot(axis[0], axis[1], axis[2]);
  const axial = len > 1e-12 ? v / len : 0;
  return { u, v, axial, radius: Math.sqrt(Math.max(0, u - axial * axial)), period: len > 1e-12 ? TAU / len : Infinity };
}
/** x p + y q = z : characteristics are straight rays through the origin, solution z = x φ(y/x). */
export const coneRay = (r: V3, t: number): V3 => { const e = Math.exp(t); return [r[0] * e, r[1] * e, r[2] * e]; };

/** 2-D heat / Laplace on a plate 0 < x < 1, 0 < y < b. */
export function plateSteady(U: number, b: number, x: number, y: number, K = 61): number {
  let s = 0;
  for (let k = 1; k <= K; k += 2) {
    const kp = k * Math.PI, ratio = Math.exp(kp * (y - b)) * (1 - Math.exp(-2 * kp * y)) / (1 - Math.exp(-2 * kp * b));
    s += ((4 * U) / kp) * Math.sin(kp * x) * ratio;
  }
  return s;
}
export const plateRate = (alpha2: number, b: number, m: number, n: number) => alpha2 * Math.PI * Math.PI * (m * m + (n * n) / (b * b));
export function plateDecay(U: number, b: number, m: number, n: number, alpha2: number, t: number, x: number, y: number): number {
  return U * Math.sin(m * Math.PI * x) * Math.sin((n * Math.PI * y) / b) * Math.exp(-plateRate(alpha2, b, m, n) * t);
}
/** Uniform initial temperature U, all four edges kept at 0. */
export function plateCool(U: number, b: number, alpha2: number, t: number, x: number, y: number, K = 21): number {
  let s = 0;
  for (let m = 1; m <= K; m += 2) for (let n = 1; n <= K; n += 2) {
    s += ((16 * U) / (Math.PI * Math.PI * m * n)) * Math.sin(m * Math.PI * x) * Math.sin((n * Math.PI * y) / b) * Math.exp(-plateRate(alpha2, b, m, n) * t);
  }
  return s;
}
export type PlateMode = "steady" | "decay" | "cool";
export function plateTemp(mode: PlateMode, U: number, b: number, m: number, n: number, alpha2: number, t: number, x: number, y: number): number {
  return mode === "steady" ? plateSteady(U, b, x, y) : mode === "decay" ? plateDecay(U, b, m, n, alpha2, t, x, y) : plateCool(U, b, alpha2, t, x, y);
}

/** d'Alembert solution of u_tt = c² u_xx. */
export type WaveMode = "pulses" | "string" | "hammer";
export const WAVE_L = 6;
const bump = (z: number, w: number) => Math.exp(-((z / w) ** 2));
/** Odd, 2L-periodic extension of the plucked triangle on [0, L] (peak at L/3). */
export function pluckExt(z: number, L: number, amp: number): number {
  const p = L / 3;
  let s = ((z % (2 * L)) + 2 * L) % (2 * L), sign = 1;
  if (s > L) { s = 2 * L - s; sign = -1; }
  const v = s <= p ? (amp * s) / p : (amp * (L - s)) / (L - p);
  return sign * v;
}
export function waveU(mode: WaveMode, c: number, w: number, amp: number, x: number, t: number): number {
  const L = WAVE_L;
  if (mode === "pulses") return 0.5 * amp * (bump(x - L / 2 - c * t, w) + bump(x - L / 2 + c * t, w));
  if (mode === "string") return 0.5 * (pluckExt(x - c * t, L, amp) + pluckExt(x + c * t, L, amp));
  // hammer: u_t(x, 0) = amp on |x − L/2| < w, u(x, 0) = 0 → u = (1/2c) ∫ g over [x − ct, x + ct]
  const lo = Math.max(x - c * t, L / 2 - w), hi = Math.min(x + c * t, L / 2 + w);
  return hi > lo ? (amp * (hi - lo)) / (2 * c) : 0;
}
export const waveClass = (c: number) => ({ A: c * c, B: 0, C: -1, disc: 4 * c * c, kind: "hyperbolic" });

/** Homogeneous linear PDE (A D² + B D D′ + C D′²) z = 0 : z = φ(y + m x) with A m² + B m + C = 0. */
export function pdeRoots(A: number, B: number, C: number) {
  const disc = B * B - 4 * A * C;
  const kind: "hyperbolic" | "parabolic" | "elliptic" = disc > 1e-9 ? "hyperbolic" : disc >= -1e-9 ? "parabolic" : "elliptic";
  if (kind === "hyperbolic") { const r = Math.sqrt(disc); return { kind, disc, m1: [(-B + r) / (2 * A), 0] as C2, m2: [(-B - r) / (2 * A), 0] as C2 }; }
  if (kind === "parabolic") return { kind, disc, m1: [-B / (2 * A), 0] as C2, m2: [-B / (2 * A), 0] as C2 };
  const r = Math.sqrt(-disc) / (2 * A);
  return { kind, disc, m1: [-B / (2 * A), r] as C2, m2: [-B / (2 * A), -r] as C2 };
}
export function pdeZ(A: number, B: number, C: number, x: number, y: number): number {
  const r = pdeRoots(A, B, C);
  if (r.kind === "hyperbolic") return Math.sin(y + r.m1[0] * x) + Math.sin(y + r.m2[0] * x);
  if (r.kind === "parabolic") return Math.sin(y + r.m1[0] * x) + x * Math.cos(y + r.m1[0] * x);
  const al = r.m1[0], be = r.m1[1];
  return Math.sin(y + al * x) * Math.cosh(be * x) + Math.cos(y + al * x) * Math.sinh(be * x);
}
export function pdeResidual(A: number, B: number, C: number, x: number, y: number, h = 1e-3): number {
  const f = (a: number, b: number) => pdeZ(A, B, C, a, b);
  const zxx = (f(x + h, y) - 2 * f(x, y) + f(x - h, y)) / (h * h), zyy = (f(x, y + h) - 2 * f(x, y) + f(x, y - h)) / (h * h);
  const zxy = (f(x + h, y + h) - f(x + h, y - h) - f(x - h, y + h) + f(x - h, y - h)) / (4 * h * h);
  return A * zxx + B * zxy + C * zyy;
}

/* ═════════════════════════ UNIT 5: functions of a complex variable ═════════════════════════ */

export type HarmId = "cube" | "logr" | "ecos" | "expy" | "lin" | "notharm";
export interface HarmFn { label: string; u: (x: number, y: number) => number; v: ((x: number, y: number) => number) | null; f: ((z: C2) => C2) | null; fText: string; vText: string; harmonic: boolean }
export const HARM: Record<HarmId, HarmFn> = {
  cube: { label: "u = x³ − 3xy² (Q5.1)", u: (x, y) => x ** 3 - 3 * x * y * y, v: (x, y) => 3 * x * x * y - y ** 3, f: (z) => cpow(z, 3), fText: "f(z) = z³", vText: "v = 3x²y − y³", harmonic: true },
  logr: { label: "u = ½ log(x² + y²) (Q5.1)", u: (x, y) => 0.5 * Math.log(x * x + y * y), v: (x, y) => Math.atan2(y, x), f: (z) => [Math.log(cabs(z)), Math.atan2(z[1], z[0])], fText: "f(z) = log z", vText: "v = arctan(y/x) = θ", harmonic: true },
  ecos: { label: "u = eˣ cos y", u: (x, y) => Math.exp(x) * Math.cos(y), v: (x, y) => Math.exp(x) * Math.sin(y), f: cexp, fText: "f(z) = eᶻ", vText: "v = eˣ sin y", harmonic: true },
  expy: { label: "u = e⁻ˣ(x sin y − y cos y) (Q5.1)", u: (x, y) => Math.exp(-x) * (x * Math.sin(y) - y * Math.cos(y)), v: (x, y) => Math.exp(-x) * (x * Math.cos(y) + y * Math.sin(y)), f: (z) => cmul([0, 1], cmul(z, cexp([-z[0], -z[1]]))), fText: "f(z) = i z e⁻ᶻ", vText: "v = e⁻ˣ(x cos y + y sin y)", harmonic: true },
  lin: { label: "u = 3x − 2xy (Q5.1)", u: (x, y) => 3 * x - 2 * x * y, v: (x, y) => x * x - y * y + 3 * y, f: (z) => cadd(cmul([0, 1], cmul(z, z)), [3 * z[0], 3 * z[1]]), fText: "f(z) = i z² + 3z", vText: "v = x² − y² + 3y", harmonic: true },
  notharm: { label: "u = x² + y² (not harmonic)", u: (x, y) => x * x + y * y, v: null, f: null, fText: "no analytic f exists", vText: "no conjugate", harmonic: false },
};
export function harmCheck(id: HarmId, x: number, y: number) {
  const H = HARM[id], h = 1e-4;
  const uxx = (H.u(x + h, y) - 2 * H.u(x, y) + H.u(x - h, y)) / (h * h), uyy = (H.u(x, y + h) - 2 * H.u(x, y) + H.u(x, y - h)) / (h * h);
  const g = (fn: (a: number, b: number) => number, d: "x" | "y") => (d === "x" ? (fn(x + h, y) - fn(x - h, y)) : (fn(x, y + h) - fn(x, y - h))) / (2 * h);
  const ux = g(H.u, "x"), uy = g(H.u, "y");
  if (!H.v) return { lap: uxx + uyy, ux, uy, vx: NaN, vy: NaN, crA: NaN, crB: NaN, dot: NaN };
  const vx = g(H.v, "x"), vy = g(H.v, "y");
  return { lap: uxx + uyy, ux, uy, vx, vy, crA: ux - vy, crB: uy + vx, dot: ux * vx + uy * vy };
}

export type CiId = "ez" | "sinz" | "cosz" | "z2";
export const CI_LABEL: Record<CiId, string> = { ez: "f(z) = eᶻ", sinz: "f(z) = sin z", cosz: "f(z) = cos z", z2: "f(z) = z²" };
export function ciF(id: CiId, z: C2): C2 { return id === "ez" ? cexp(z) : id === "sinz" ? csin(z) : id === "cosz" ? ccos(z) : cmul(z, z); }
/** n-th derivative f⁽ⁿ⁾(a). */
export function ciDeriv(id: CiId, n: number, a: C2): C2 {
  if (id === "ez") return cexp(a);
  if (id === "z2") return n === 0 ? cmul(a, a) : n === 1 ? [2 * a[0], 2 * a[1]] : n === 2 ? [2, 0] : [0, 0];
  const k = n % 4;
  const s = csin(a), c = ccos(a), neg = (z: C2): C2 => [-z[0], -z[1]];
  if (id === "sinz") return k === 0 ? s : k === 1 ? c : k === 2 ? neg(s) : neg(c);
  return k === 0 ? c : k === 1 ? neg(s) : k === 2 ? neg(c) : s;
}
/** n!/(2πi) ∮_{|z|=R} f(z)/(z − a)ⁿ⁺¹ dz by the trapezoid rule on the circle. */
export function ciContour(id: CiId, n: number, a: C2, R: number, N = 1440): C2 {
  let re = 0, im = 0;
  for (let k = 0; k < N; k++) {
    const th = (TAU * k) / N, z: C2 = [R * Math.cos(th), R * Math.sin(th)];
    const g = cdiv(ciF(id, z), cpow([z[0] - a[0], z[1] - a[1]], n + 1)), t = cmul(g, z);
    re += t[0]; im += t[1];
  }
  const s = fact(n) / N;
  return [re * s, im * s];
}
export const ciInside = (a: C2, R: number) => Math.hypot(a[0], a[1]) < R;

/** Residue theorem for N(z)/((z−p1)(z−p2)(z−p3)) (simple) or N(z)/((z−p1)²(z−p2)) (double), N = n2 z² + n1 z + n0, real poles. */
export type ResMode = "simple" | "double";
export interface Pole { z: number; order: number; res: number }
export function resPoles(mode: ResMode, n2: number, n1: number, n0: number, p1: number, p2: number, p3: number): Pole[] | null {
  const N = (z: number) => n2 * z * z + n1 * z + n0, dN = (z: number) => 2 * n2 * z + n1;
  if (mode === "simple") {
    const ps = [p1, p2, p3];
    for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) if (Math.abs(ps[i] - ps[j]) < 0.05) return null;
    return ps.map((p, i) => { let d = 1; ps.forEach((q, j) => { if (j !== i) d *= p - q; }); return { z: p, order: 1, res: N(p) / d }; });
  }
  if (Math.abs(p1 - p2) < 0.05) return null;
  const d = p1 - p2;
  return [{ z: p1, order: 2, res: (dN(p1) * d - N(p1)) / (d * d) }, { z: p2, order: 1, res: N(p2) / (d * d) }];
}
export function resFn(mode: ResMode, n2: number, n1: number, n0: number, p1: number, p2: number, p3: number, z: C2): C2 {
  const num: C2 = cadd(cadd(cmul([n2, 0], cmul(z, z)), [n1 * z[0], n1 * z[1]]), [n0, 0]);
  const d1: C2 = [z[0] - p1, z[1]], d2: C2 = [z[0] - p2, z[1]], d3: C2 = [z[0] - p3, z[1]];
  return cdiv(num, mode === "simple" ? cmul(cmul(d1, d2), d3) : cmul(cmul(d1, d1), d2));
}
/** ∮_{|z|=R} f dz / (2πi) by the trapezoid rule. */
export function contourOver2pi(f: (z: C2) => C2, R: number, N = 2880): C2 {
  let re = 0, im = 0;
  for (let k = 0; k < N; k++) {
    const th = (TAU * k) / N, z: C2 = [R * Math.cos(th), R * Math.sin(th)], t = cmul(f(z), z);
    re += t[0]; im += t[1];
  }
  return [re / N, im / N];
}
export const resInside = (poles: Pole[], R: number) => poles.filter((p) => Math.abs(p.z) < R).reduce((s, p) => s + p.res, 0);

/** ∫₀^{2π} F(θ) dθ by the unit-circle residue method, F a rational function of cos θ. */
export type RealId = "inv" | "sq" | "cos2" | "sin2";
export const REAL_LABEL: Record<RealId, string> = { inv: "1/(a + b cos θ)", sq: "1/(a + b cos θ)²", cos2: "cos 2θ/(a + b cos θ)", sin2: "sin²θ/(a + b cos θ)" };
export function realF(id: RealId, a: number, b: number, th: number): number {
  const d = a + b * Math.cos(th);
  return id === "inv" ? 1 / d : id === "sq" ? 1 / (d * d) : id === "cos2" ? Math.cos(2 * th) / d : Math.sin(th) ** 2 / d;
}
/** Closed form via the residue at the pole inside |z| = 1 (needs a > |b|), else null. */
export function realExact(id: RealId, a: number, b: number): number | null {
  if (!(a > Math.abs(b))) return null;
  const s = Math.sqrt(a * a - b * b), i0 = TAU / s;
  if (b === 0) return id === "inv" ? TAU / a : id === "sq" ? TAU / (a * a) : id === "cos2" ? 0 : Math.PI / a;
  const rho = (s - a) / b, i2 = i0 * rho * rho;
  return id === "inv" ? i0 : id === "sq" ? (TAU * a) / s ** 3 : id === "cos2" ? i2 : 0.5 * (i0 - i2);
}
export function realNumeric(id: RealId, a: number, b: number, N = 4096): number { let s = 0; for (let k = 0; k < N; k++) s += realF(id, a, b, (TAU * k) / N); return (s * TAU) / N; }
/** Poles of 1/(a + b cos θ) in z = e^{iθ}: b z² + 2a z + b = 0. Returns [inside, outside] or null. */
export function realPoles(a: number, b: number): [number, number] | null {
  if (b === 0 || !(a > Math.abs(b))) return null;
  const s = Math.sqrt(a * a - b * b);
  return [(-a + s) / b, (-a - s) / b];
}
/** The integrand after z = e^{iθ}: F(cos θ, sin θ)/(i z), as a complex function of z. */
export function realG(id: RealId, a: number, b: number, z: C2): C2 {
  const zi = cdiv([1, 0], z), c: C2 = [(z[0] + zi[0]) / 2, (z[1] + zi[1]) / 2], c2: C2 = [(cmul(z, z)[0] + cmul(zi, zi)[0]) / 2, (cmul(z, z)[1] + cmul(zi, zi)[1]) / 2];
  const den: C2 = [a + b * c[0], b * c[1]];
  let F: C2;
  if (id === "inv") F = cdiv([1, 0], den);
  else if (id === "sq") F = cdiv([1, 0], cmul(den, den));
  else if (id === "cos2") F = cdiv(c2, den);
  else F = cdiv([(1 - c2[0]) / 2, -c2[1] / 2], den);
  return cdiv(F, cmul([0, 1], z));
}

/** Singularity at z = 0 of f(z) = g(z)/zᵐ (g = eᶻ, sin z, cos z) or zᵐ e^(1/z). */
export type SingId = "ez" | "sinz" | "cosz" | "essen";
export const SING_LABEL: Record<SingId, string> = { ez: "f(z) = eᶻ / zᵐ", sinz: "f(z) = sin z / zᵐ", cosz: "f(z) = cos z / zᵐ", essen: "f(z) = zᵐ e^(1/z)" };
export function taylorCoeff(id: SingId, j: number): number {
  if (j < 0) return 0;
  if (id === "ez") return 1 / fact(j);
  if (id === "sinz") return j % 2 === 1 ? ((j - 1) / 2 % 2 === 0 ? 1 : -1) / fact(j) : 0;
  if (id === "cosz") return j % 2 === 0 ? ((j / 2) % 2 === 0 ? 1 : -1) / fact(j) : 0;
  return 0;
}
export function singFn(id: SingId, m: number, z: C2): C2 {
  if (id === "essen") return cmul(cpow(z, m), cexp(cdiv([1, 0], z)));
  const g = id === "ez" ? cexp(z) : id === "sinz" ? csin(z) : ccos(z);
  return cdiv(g, cpow(z, m));
}
export function singInfo(id: SingId, m: number) {
  if (id === "essen") return { kind: "essential singularity", order: Infinity, residue: 1 / fact(m + 1), coeffs: [] as { p: number; c: number }[] };
  const ord = id === "sinz" ? 1 : 0, order = m - ord;
  const kind = order <= 0 ? "removable singularity" : order === 1 ? "simple pole" : `pole of order ${order}`;
  const coeffs: { p: number; c: number }[] = [];
  for (let j = 0; j < m + 3; j++) { const c = taylorCoeff(id, j); if (c !== 0) coeffs.push({ p: j - m, c }); }
  return { kind, order: Math.max(0, order), residue: m >= 1 ? taylorCoeff(id, m - 1) : 0, coeffs };
}
export const singResidueNumeric = (id: SingId, m: number, rho: number): C2 => contourOver2pi((z) => singFn(id, m, z), rho, 2880);
