/**
 * Pure maths for the `mathsa` labs: solids of revolution, 2D vector fields and Green's theorem,
 * the mean value theorem, first-principles derivatives with Riemann sums, and straight lines.
 * No React, no three.
 */

export type Fn = (x: number) => number;
export type Fn2 = (x: number, y: number) => number;

/** Composite Simpson's rule on [a, b] with n (made even) sub-intervals. Signed: ∫_b^a = −∫_a^b. */
export function simpson(f: Fn, a: number, b: number, n = 400): number {
  if (a === b) return 0;
  const m = n % 2 ? n + 1 : n, h = (b - a) / m;
  let s = f(a) + f(b);
  for (let i = 1; i < m; i++) s += (i % 2 ? 4 : 2) * f(a + i * h);
  return (s * h) / 3;
}

/** Fixed-decimal text without "−0.000". Non-finite → "—". */
export function fmt(x: number, d = 3): string {
  if (!Number.isFinite(x)) return "—";
  const s = x.toFixed(d);
  return /^-0(\.0*)?$/.test(s) ? s.slice(1) : s.replace("-", "−");
}

/** Small seeded PRNG (mulberry32) so scenes never call Math.random during render. */
export function prng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ───────────────────────── 1. Solids of revolution ───────────────────────── */

/** `ff` is f·f′, which keeps the surface-area integrand finite for √x at x = 0. */
export const REV_FUNCS = {
  x2: { label: "y = x²", f: (x: number) => x * x, ff: (x: number) => 2 * x * x * x },
  sqrt: { label: "y = √x", f: (x: number) => Math.sqrt(Math.max(0, x)), ff: () => 0.5 },
  sin: { label: "y = sin x", f: Math.sin, ff: (x: number) => Math.sin(x) * Math.cos(x) },
  line: { label: "y = x / 2 (straight line)", f: (x: number) => x / 2, ff: (x: number) => x / 4 },
} as const;
export type RevId = keyof typeof REV_FUNCS;

export interface Revolution { lo: number; hi: number; V: number; S: number; A: number; xbar: number; ybar: number; maxAbs: number }

/**
 * Region between y = f(x) and the x-axis on [a, b] (swapped if a > b), revolved about the x-axis.
 * V = π∫f² dx (disc method), S = 2π∫|f|√(1 + f′²) dx = 2π∫√(f² + (f f′)²) dx,
 * A = ∫|f| dx, centroid x̄ = ∫x|f| dx / A, ȳ = ∫½ f|f| dx / A (Pappus: V = 2π ȳ A when f ≥ 0).
 */
export function revolution(id: RevId, a: number, b: number, n = 400): Revolution {
  const { f, ff } = REV_FUNCS[id];
  const lo = Math.min(a, b), hi = Math.max(a, b);
  const V = Math.PI * simpson((x) => f(x) ** 2, lo, hi, n);
  const S = 2 * Math.PI * simpson((x) => Math.sqrt(f(x) ** 2 + ff(x) ** 2), lo, hi, n);
  const A = simpson((x) => Math.abs(f(x)), lo, hi, n);
  const xbar = A > 1e-12 ? simpson((x) => x * Math.abs(f(x)), lo, hi, n) / A : NaN;
  const ybar = A > 1e-12 ? simpson((x) => 0.5 * f(x) * Math.abs(f(x)), lo, hi, n) / A : NaN;
  let maxAbs = 0;
  for (let i = 0; i <= 200; i++) maxAbs = Math.max(maxAbs, Math.abs(f(lo + ((hi - lo) * i) / 200)));
  return { lo, hi, V, S, A, xbar, ybar, maxAbs };
}

/* ───────────────────────── 2. Vector fields & Green's theorem ───────────────────────── */

export interface Field { label: string; P: Fn2; Q: Fn2; div: Fn2; curl: Fn2 }
/** F = (P, Q); div F = ∂P/∂x + ∂Q/∂y, (curl F)·k = ∂Q/∂x − ∂P/∂y (worked out by hand for each field). */
export const FIELDS = {
  rotation: { label: "Rotation (−y, x)", P: (_x, y) => -y, Q: (x) => x, div: () => 0, curl: () => 2 },
  source: { label: "Source (x, y)", P: (x) => x, Q: (_x, y) => y, div: () => 2, curl: () => 0 },
  shear: { label: "Shear (y, 0)", P: (_x, y) => y, Q: () => 0, div: () => 0, curl: () => -1 },
  saddle: { label: "Saddle (x, −y)", P: (x) => x, Q: (_x, y) => -y, div: () => 0, curl: () => 0 },
  mixed: { label: "Spiral (x − y, x + y)", P: (x, y) => x - y, Q: (x, y) => x + y, div: () => 2, curl: () => 2 },
  cycle: {
    label: "Limit cycle (−y + x(1 − r²), x + y(1 − r²))",
    P: (x, y) => -y + x * (1 - x * x - y * y), Q: (x, y) => x + y * (1 - x * x - y * y),
    div: (x, y) => 2 - 4 * (x * x + y * y), curl: () => 2,
  },
} as const satisfies Record<string, Field>;
export type FieldId = keyof typeof FIELDS;

/** ∮ F·dr anticlockwise round the circle centre (cx, cy), radius r. Trapezoid in θ (exact-ish for periodic integrands). */
export function circulation(F: Field, cx: number, cy: number, r: number, n = 720): number {
  let s = 0;
  for (let k = 0; k < n; k++) {
    const t = (2 * Math.PI * k) / n, c = Math.cos(t), sn = Math.sin(t), x = cx + r * c, y = cy + r * sn;
    s += F.P(x, y) * -sn + F.Q(x, y) * c;
  }
  return (s * r * 2 * Math.PI) / n;
}
/** Outward flux ∮ F·n ds through the same circle. */
export function fluxOut(F: Field, cx: number, cy: number, r: number, n = 720): number {
  let s = 0;
  for (let k = 0; k < n; k++) {
    const t = (2 * Math.PI * k) / n, c = Math.cos(t), sn = Math.sin(t), x = cx + r * c, y = cy + r * sn;
    s += F.P(x, y) * c + F.Q(x, y) * sn;
  }
  return (s * r * 2 * Math.PI) / n;
}
/** ∬ g dA over the disk: Simpson in ρ, trapezoid in θ, with the Jacobian ρ. */
export function diskIntegral(g: Fn2, cx: number, cy: number, r: number, nr = 40, nt = 96): number {
  let tot = 0;
  for (let k = 0; k < nt; k++) {
    const t = (2 * Math.PI * k) / nt, c = Math.cos(t), sn = Math.sin(t);
    tot += simpson((rho) => g(cx + rho * c, cy + rho * sn) * rho, 0, r, nr);
  }
  return (tot * 2 * Math.PI) / nt;
}

export interface Greens { P: number; Q: number; div: number; curl: number; circ: number; curlInt: number; flux: number; divInt: number }
/** Everything the vector-field lab reads out for a probe circle. Green: ∮F·dr = ∬curl dA; divergence form: ∮F·n ds = ∬div dA. */
export function greens(id: FieldId, px: number, py: number, r: number): Greens {
  const F: Field = FIELDS[id];
  return {
    P: F.P(px, py), Q: F.Q(px, py), div: F.div(px, py), curl: F.curl(px, py),
    circ: circulation(F, px, py, r), curlInt: diskIntegral(F.curl, px, py, r),
    flux: fluxOut(F, px, py, r), divInt: diskIntegral(F.div, px, py, r),
  };
}

/**
 * Advance tracer particles (x, y pairs in `p`) along F with a midpoint (RK2) step. Speed is capped at `vmax`
 * so fast regions stay readable. Particles that leave the square |x|,|y| ≤ W or grow old respawn at random.
 */
export function advect(F: Field, p: Float32Array, life: Float32Array, dt: number, W: number, rnd: () => number, vmax = 2.5) {
  const n = life.length;
  for (let i = 0; i < n; i++) {
    let x = p[2 * i], y = p[2 * i + 1];
    let u = F.P(x, y), v = F.Q(x, y), m = Math.hypot(u, v);
    if (m > vmax) { u *= vmax / m; v *= vmax / m; }
    const xm = x + 0.5 * dt * u, ym = y + 0.5 * dt * v;
    u = F.P(xm, ym); v = F.Q(xm, ym); m = Math.hypot(u, v);
    if (m > vmax) { u *= vmax / m; v *= vmax / m; }
    x += dt * u; y += dt * v; life[i] += dt;
    if (life[i] > 6 || Math.abs(x) > W || Math.abs(y) > W || !Number.isFinite(x + y) || (m < 1e-3 && life[i] > 2)) {
      x = (rnd() * 2 - 1) * W; y = (rnd() * 2 - 1) * W; life[i] = rnd() * 3;
    }
    p[2 * i] = x; p[2 * i + 1] = y;
  }
}

/* ───────────────────────── 3. Mean value theorem ───────────────────────── */

/** `solve(s, lo, hi)` returns every real c with f′(c) = s that could lie in [lo, hi] (closed form). */
export const MVT_FUNCS = {
  cubic: {
    label: "f(x) = x³ − 3x", f: (x: number) => x ** 3 - 3 * x, df: (x: number) => 3 * x * x - 3,
    solve: (s: number) => (s >= -3 ? [-Math.sqrt(1 + s / 3), Math.sqrt(1 + s / 3)] : []),
  },
  sin: {
    label: "f(x) = sin x", f: Math.sin, df: Math.cos,
    solve: (s: number, lo: number, hi: number) => {
      if (Math.abs(s) > 1) return [];
      const c0 = Math.acos(s), out: number[] = [];
      for (let k = Math.floor(lo / (2 * Math.PI)) - 1; k <= Math.ceil(hi / (2 * Math.PI)) + 1; k++) out.push(c0 + 2 * Math.PI * k, -c0 + 2 * Math.PI * k);
      return out;
    },
  },
  exp: { label: "f(x) = eˣ", f: Math.exp, df: Math.exp, solve: (s: number) => (s > 0 ? [Math.log(s)] : []) },
  x2: { label: "f(x) = x²", f: (x: number) => x * x, df: (x: number) => 2 * x, solve: (s: number) => [s / 2] },
} as const;
export type MvtId = keyof typeof MVT_FUNCS;

export interface Mvt { lo: number; hi: number; fa: number; fb: number; slope: number; cs: number[]; rolle: boolean }
/** Lagrange MVT on [a, b] (swapped if a > b): slope = (f(b) − f(a))/(b − a) and all c in (a, b) with f′(c) = slope. */
export function mvt(id: MvtId, a: number, b: number): Mvt {
  const F = MVT_FUNCS[id];
  const lo = Math.min(a, b), hi = Math.max(a, b), fa = F.f(lo), fb = F.f(hi);
  if (hi - lo < 1e-9) return { lo, hi, fa, fb, slope: NaN, cs: [], rolle: false };
  const slope = (fb - fa) / (hi - lo);
  const eps = 1e-9 * Math.max(1, Math.abs(fa), Math.abs(fb));
  const cs = F.solve(slope, lo, hi).filter((c) => c > lo + 1e-9 && c < hi - 1e-9).sort((p, q) => p - q)
    .filter((c, i, arr) => i === 0 || c - arr[i - 1] > 1e-7);
  return { lo, hi, fa, fb, slope: Math.abs(slope) < eps ? 0 : slope, cs, rolle: Math.abs(fb - fa) < eps };
}

/* ───────────────────────── 4. Derivative & integral basics ───────────────────────── */

/** f, f′ and an antiderivative F. `pos`: only defined for x > 0. */
export const CALC_FUNCS = {
  x2: { label: "x²", f: (x: number) => x * x, df: (x: number) => 2 * x, F: (x: number) => x ** 3 / 3, pos: false },
  x3: { label: "x³", f: (x: number) => x ** 3, df: (x: number) => 3 * x * x, F: (x: number) => x ** 4 / 4, pos: false },
  sin: { label: "sin x", f: Math.sin, df: Math.cos, F: (x: number) => -Math.cos(x), pos: false },
  exp: { label: "eˣ", f: Math.exp, df: Math.exp, F: Math.exp, pos: false },
  inv: { label: "1/x (x > 0)", f: (x: number) => 1 / x, df: (x: number) => -1 / (x * x), F: Math.log, pos: true },
} as const;
export type CalcId = keyof typeof CALC_FUNCS;
export type Rule = "left" | "mid" | "right";

/** First-principles difference quotient (f(x₀ + h) − f(x₀)) / h. */
export const diffQuotient = (f: Fn, x0: number, h: number) => (f(x0 + h) - f(x0)) / h;

/** Riemann sum with n equal strips from a to b (signed; Δx < 0 if b < a), sampled at the left end, midpoint or right end. */
export function riemann(f: Fn, a: number, b: number, n: number, rule: Rule): number {
  const dx = (b - a) / n, off = rule === "left" ? 0 : rule === "mid" ? 0.5 : 1;
  let s = 0;
  for (let i = 0; i < n; i++) s += f(a + (i + off) * dx);
  return s * dx;
}

export interface Calc { ok: boolean; fx0: number; d: number; dq: number; sum: number; exact: number; err: number }
export function calculus(id: CalcId, x0: number, h: number, a: number, b: number, n: number, rule: Rule): Calc {
  const F = CALC_FUNCS[id];
  const ok = !F.pos || Math.min(x0, x0 + h, a, b) > 0;
  if (!ok) return { ok, fx0: NaN, d: NaN, dq: NaN, sum: NaN, exact: NaN, err: NaN };
  const sum = riemann(F.f, a, b, n, rule), exact = F.F(b) - F.F(a);
  return { ok, fx0: F.f(x0), d: F.df(x0), dq: diffQuotient(F.f, x0, h), sum, exact, err: sum - exact };
}

/* ───────────────────────── 5. Straight lines ───────────────────────── */

/** Acute angle (degrees) between lines of slopes m1, m2 from tan θ = |(m1 − m2)/(1 + m1 m2)|; ±Infinity = vertical. */
export function angleBetween(m1: number, m2: number): number {
  const v1 = !Number.isFinite(m1), v2 = !Number.isFinite(m2);
  if (v1 && v2) return 0;
  if (v1 || v2) return 90 - (Math.atan(Math.abs(v1 ? m2 : m1)) * 180) / Math.PI;
  const den = 1 + m1 * m2;
  if (Math.abs(den) < 1e-12) return 90;
  return (Math.atan(Math.abs((m1 - m2) / den)) * 180) / Math.PI;
}

export function quadrant(x: number, y: number): string {
  if (x === 0 && y === 0) return "origin";
  if (x === 0) return "on the y-axis";
  if (y === 0) return "on the x-axis";
  return x > 0 ? (y > 0 ? "I" : "IV") : y > 0 ? "II" : "III";
}

export type Relation = "perpendicular" | "parallel" | "coincident" | "neither" | "undefined";
export interface Lines {
  ok: boolean; m1: number; c1: number; vertical: boolean; dist: number; mid: [number, number];
  angle: number; tan: number; relation: Relation; hit: [number, number] | null; gap: number; quad: string;
}
/** Line 1 through (x1, y1), (x2, y2); line 2: y = m x + c. */
export function lines(x1: number, y1: number, x2: number, y2: number, m: number, c: number): Lines {
  const dx = x2 - x1, dy = y2 - y1, dist = Math.hypot(dx, dy), mid: [number, number] = [(x1 + x2) / 2, (y1 + y2) / 2];
  const quad = quadrant(x1, y1);
  if (dist < 1e-12) return { ok: false, m1: NaN, c1: NaN, vertical: false, dist, mid, angle: NaN, tan: NaN, relation: "undefined", hit: null, gap: NaN, quad };
  const vertical = Math.abs(dx) < 1e-12, m1 = vertical ? Infinity : dy / dx, c1 = vertical ? NaN : y1 - m1 * x1;
  const angle = angleBetween(m1, m);
  const tan = vertical ? 1 / Math.abs(m) : Math.abs(1 + m1 * m) < 1e-12 ? Infinity : Math.abs((m1 - m) / (1 + m1 * m));
  // P1 + t(dx, dy) on y = m x + c  ⇒  t (dy − m dx) = m x1 + c − y1
  const cross = dy - m * dx, rhs = m * x1 + c - y1;
  let hit: [number, number] | null = null, gap = NaN, relation: Relation;
  if (Math.abs(cross) < 1e-12 * Math.max(1, dist)) {
    gap = Math.abs(rhs) / Math.sqrt(1 + m * m); // vertical distance |c1 − c| scaled by cos of the slope angle
    relation = gap < 1e-9 ? "coincident" : "parallel";
  } else {
    const t = rhs / cross;
    hit = [x1 + t * dx, y1 + t * dy];
    relation = Math.abs(angle - 90) < 1e-9 ? "perpendicular" : "neither";
  }
  return { ok: true, m1, c1, vertical, dist, mid, angle, tan, relation, hit, gap, quad };
}

/** Clip the infinite line through (px, py) with direction (dx, dy) to the square |x|, |y| ≤ W (Liang–Barsky). */
export function clipLine(px: number, py: number, dx: number, dy: number, W: number): [[number, number], [number, number]] | null {
  let t0 = -Infinity, t1 = Infinity;
  const edges: [number, number][] = [[-dx, px + W], [dx, W - px], [-dy, py + W], [dy, W - py]];
  for (const [p, q] of edges) {
    if (Math.abs(p) < 1e-15) { if (q < 0) return null; continue; }
    const r = q / p;
    if (p < 0) t0 = Math.max(t0, r); else t1 = Math.min(t1, r);
  }
  if (t0 > t1) return null;
  return [[px + t0 * dx, py + t0 * dy], [px + t1 * dx, py + t1 * dy]];
}
