/** Pure maths for the AHT-005 Analytical Mathematics labs: slope fields, forced oscillator, series, string/heat, complex maps. */

/* ───────────────────────── First-order ODEs (unit 1) ───────────────────────── */

export type Fxy = (x: number, y: number) => number;

/** One classical fourth-order Runge–Kutta step for y′ = f(x, y). */
export function rk4Step(f: Fxy, x: number, y: number, h: number): number {
  const k1 = f(x, y), k2 = f(x + h / 2, y + (h * k1) / 2), k3 = f(x + h / 2, y + (h * k2) / 2), k4 = f(x + h, y + h * k3);
  return y + (h / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
}

/**
 * Integrate from (x0, y0) to x1 with RK4 (step close to `h`, adjusted to land exactly on x1).
 * `ok` is false when the solution blows up (|y| > 1e6) or its slope exceeds `maxSlope` (vertical tangent).
 */
export function rk4Solve(f: Fxy, x0: number, y0: number, x1: number, h = 0.05, maxSlope = 1e9): { y: number; ok: boolean } {
  if (x1 === x0) return { y: y0, ok: Number.isFinite(y0) && Number.isFinite(f(x0, y0)) };
  const n = Math.max(1, Math.ceil(Math.abs(x1 - x0) / h)), s = (x1 - x0) / n;
  let y = y0;
  for (let i = 0; i < n; i++) {
    const x = x0 + i * s;
    const k1 = f(x, y), k2 = f(x + s / 2, y + (s * k1) / 2), k3 = f(x + s / 2, y + (s * k2) / 2), k4 = f(x + s, y + s * k3);
    const worst = Math.max(Math.abs(k1), Math.abs(k2), Math.abs(k3), Math.abs(k4));
    if (!(worst <= maxSlope)) return { y, ok: false };
    y += (s / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
    if (!Number.isFinite(y) || Math.abs(y) > 1e6) return { y, ok: false };
  }
  return { y, ok: true };
}

/** Points of the RK4 solution curve from (x0, y0) towards xEnd, stopping when |y| leaves `yMax` or the slope passes `maxSlope`. */
export function rk4Path(f: Fxy, x0: number, y0: number, xEnd: number, h: number, yMax: number, maxSlope = 1e9): [number, number][] {
  const out: [number, number][] = [];
  if (!Number.isFinite(y0) || Math.abs(y0) > yMax) return out;
  out.push([x0, y0]);
  const n = Math.ceil(Math.abs(xEnd - x0) / h);
  if (n === 0) return out;
  const s = (xEnd - x0) / n;
  let y = y0;
  for (let i = 0; i < n; i++) {
    const x = x0 + i * s;
    const k1 = f(x, y), k2 = f(x + s / 2, y + (s * k1) / 2), k3 = f(x + s / 2, y + (s * k2) / 2), k4 = f(x + s, y + s * k3);
    if (!(Math.max(Math.abs(k1), Math.abs(k2), Math.abs(k3), Math.abs(k4)) <= maxSlope)) break;
    y += (s / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
    if (!Number.isFinite(y) || Math.abs(y) > yMax) break;
    out.push([x + s, y]);
  }
  return out;
}

export type OdeId = "linear" | "logistic" | "circle" | "xminusy" | "ycosx";
export interface Ode {
  label: string;
  type: string;
  f: Fxy;
  /** Closed-form y(x) through (x0, y0), or null where the solution does not reach x. */
  exact: (x0: number, y0: number, x: number) => number | null;
  /** Largest slope the integrator follows before calling the tangent vertical. */
  maxSlope: number;
}
export const ODES: Record<OdeId, Ode> = {
  linear: { label: "y′ = x + y", type: "Linear", f: (x, y) => x + y, maxSlope: 1e9,
    exact: (x0, y0, x) => (y0 + x0 + 1) * Math.exp(x - x0) - x - 1 },
  logistic: { label: "y′ = y(1 − y) (logistic)", type: "Bernoulli", f: (_x, y) => y * (1 - y), maxSlope: 1e9,
    exact: (x0, y0, x) => { const e = Math.exp(x - x0), d = 1 - y0 + y0 * e; return d > 0 ? (y0 * e) / d : null; } },
  circle: { label: "y′ = −x / y (circles)", type: "Exact", f: (x, y) => -x / y, maxSlope: 25,
    exact: (x0, y0, x) => { if (y0 === 0) return null; const r2 = x0 * x0 + y0 * y0; return x * x <= r2 ? Math.sign(y0) * Math.sqrt(r2 - x * x) : null; } },
  xminusy: { label: "y′ = x − y", type: "Linear", f: (x, y) => x - y, maxSlope: 1e9,
    exact: (x0, y0, x) => x - 1 + (y0 - x0 + 1) * Math.exp(x0 - x) },
  ycosx: { label: "y′ = y·cos x", type: "Variable separable", f: (x, y) => y * Math.cos(x), maxSlope: 1e9,
    exact: (x0, y0, x) => y0 * Math.exp(Math.sin(x) - Math.sin(x0)) },
};

/** Everything the slope-field readouts show. */
export function slopeLab(id: OdeId, x0: number, y0: number, x1: number, h = 0.05) {
  const o = ODES[id];
  const rk = rk4Solve(o.f, x0, y0, x1, h, o.maxSlope);
  const exact = o.exact(x0, y0, x1);
  const err = rk.ok && exact !== null ? Math.abs(rk.y - exact) : null;
  return { yRk: rk.ok ? rk.y : null, exact, err, type: o.type, slope: o.f(x0, y0) };
}

/* ───────────────────── Linear 2nd-order ODE (unit 2) ───────────────────── */

export type Damping = "Undamped" | "Under-damped" | "Critically damped" | "Over-damped";
/** Roots of m r² + c r + k = 0 and the damping class. */
export function charRoots(m: number, c: number, k: number) {
  const zeta = c / (2 * Math.sqrt(k * m));
  const re = -c / (2 * m), disc = c * c - 4 * m * k;
  let kind: "real" | "repeated" | "complex", type: Damping;
  if (c === 0) { kind = "complex"; type = "Undamped"; }
  else if (Math.abs(zeta - 1) < 1e-9) { kind = "repeated"; type = "Critically damped"; }
  else if (zeta < 1) { kind = "complex"; type = "Under-damped"; }
  else { kind = "real"; type = "Over-damped"; }
  const sq = Math.sqrt(Math.abs(disc)) / (2 * m);
  if (kind === "repeated") return { kind, type, zeta, r1: re, r2: re, re, im: 0 };
  if (kind === "real") return { kind, type, zeta, r1: re + sq, r2: re - sq, re, im: 0 };
  return { kind, type, zeta, r1: re, r2: re, re, im: sq };
}

/** Particular integral y_p = A cos(ωt − φ) of m y″ + c y′ + k y = F₀ cos ωt. */
export function steadyState(m: number, c: number, k: number, F0: number, w: number) {
  const a = k - m * w * w, b = c * w, D = Math.hypot(a, b);
  const amp = F0 === 0 ? 0 : D === 0 ? Infinity : F0 / D;
  return { amp, phase: Math.atan2(b, a) };
}

/** y(t) on [0, T] from y(0) = y0, y′(0) = v0, integrated with RK4 (samples every dt). */
export function oscillate(m: number, c: number, k: number, F0: number, w: number, y0: number, v0: number, T: number, dt: number): Float64Array {
  const n = Math.round(T / dt), ys = new Float64Array(n + 1);
  const acc = (t: number, y: number, v: number) => (F0 * Math.cos(w * t) - c * v - k * y) / m;
  let y = y0, v = v0;
  ys[0] = y;
  for (let i = 0; i < n; i++) {
    const t = i * dt;
    const k1y = v, k1v = acc(t, y, v);
    const k2y = v + (dt / 2) * k1v, k2v = acc(t + dt / 2, y + (dt / 2) * k1y, v + (dt / 2) * k1v);
    const k3y = v + (dt / 2) * k2v, k3v = acc(t + dt / 2, y + (dt / 2) * k2y, v + (dt / 2) * k2v);
    const k4y = v + dt * k3v, k4v = acc(t + dt, y + dt * k3y, v + dt * k3v);
    y += (dt / 6) * (k1y + 2 * k2y + 2 * k3y + k4y);
    v += (dt / 6) * (k1v + 2 * k2v + 2 * k3v + k4v);
    ys[i + 1] = y;
  }
  return ys;
}

/* ─────────────────────────── Series (unit 3) ─────────────────────────── */

export type SeriesId = "geometric" | "pseries" | "altharm" | "nfact" | "invfact";

/** The n-th term (n = 1, 2, …). The geometric series is Σ_{k≥0} rᵏ, so its n-th term is rⁿ⁻¹. */
export function seriesTerm(id: SeriesId, n: number, r: number, p: number): number {
  switch (id) {
    case "geometric": return Math.pow(r, n - 1);
    case "pseries": return 1 / Math.pow(n, p);
    case "altharm": return (n % 2 === 1 ? 1 : -1) / n;
    case "nfact": { let a = 1; for (let k = 1; k <= n; k++) a *= k / n; return a; }
    case "invfact": { let a = 1; for (let k = 2; k <= n; k++) a /= k; return a; }
  }
}
export function seriesTerms(id: SeriesId, N: number, r: number, p: number): number[] {
  return Array.from({ length: N }, (_, i) => seriesTerm(id, i + 1, r, p));
}
/** Running sums S₁ … S_N. */
export function partialSums(a: number[]): number[] {
  let s = 0;
  return a.map((x) => (s += x));
}

/** Riemann zeta ζ(p) for p > 1 by Euler–Maclaurin summation (≈ 1e-12 accurate). */
export function zeta(p: number): number {
  const M = 20;
  let s = 0;
  for (let n = 1; n < M; n++) s += Math.pow(n, -p);
  s += Math.pow(M, 1 - p) / (p - 1) + Math.pow(M, -p) / 2 + (p * Math.pow(M, -p - 1)) / 12;
  s -= (p * (p + 1) * (p + 2) * Math.pow(M, -p - 3)) / 720;
  s += (p * (p + 1) * (p + 2) * (p + 3) * (p + 4) * Math.pow(M, -p - 5)) / 30240;
  return s;
}

/** Σ n!/nⁿ (no closed form): summed until the terms are negligible. */
export const NFACT_SUM = partialSums(seriesTerms("nfact", 80, 0, 0))[79];

/** Known limit, ratio-test limit and verdict (with the test that decides it). */
export function seriesInfo(id: SeriesId, r: number, p: number): { limit: number | null; limitText: string; ratio: number; converges: boolean; verdict: string } {
  switch (id) {
    case "geometric": {
      const a = Math.abs(r);
      if (a < 1) return { limit: 1 / (1 - r), limitText: `1/(1 − r) = ${(1 / (1 - r)).toFixed(4)}`, ratio: a, converges: true, verdict: "Converges (ratio test, |r| < 1)" };
      return { limit: null, limitText: "none", ratio: a, converges: false, verdict: "Diverges (nth-term test: aₙ ↛ 0)" };
    }
    case "pseries": {
      if (p > 1) {
        const z = zeta(p), txt = Math.abs(p - 2) < 1e-9 ? `π²/6 = ${z.toFixed(6)}` : `ζ(${p.toFixed(2)}) = ${z.toFixed(6)}`;
        return { limit: z, limitText: txt, ratio: 1, converges: true, verdict: "Converges (p-series test, p > 1)" };
      }
      return { limit: null, limitText: "none (→ ∞)", ratio: 1, converges: false, verdict: "Diverges (p-series test, p ≤ 1)" };
    }
    case "altharm": return { limit: Math.LN2, limitText: `ln 2 = ${Math.LN2.toFixed(6)}`, ratio: 1, converges: true, verdict: "Converges conditionally (Leibniz test)" };
    case "nfact": return { limit: NFACT_SUM, limitText: `≈ ${NFACT_SUM.toFixed(6)} (no closed form)`, ratio: 1 / Math.E, converges: true, verdict: "Converges (ratio test, 1/e < 1)" };
    case "invfact": return { limit: Math.E - 1, limitText: `e − 1 = ${(Math.E - 1).toFixed(6)}`, ratio: 0, converges: true, verdict: "Converges (ratio test, limit 0)" };
  }
}

/* ─────────────────── Wave and heat equations (unit 4) ─────────────────── */

/** Initial shape of a string of length L plucked to height h at x = a. */
export const pluckShape = (x: number, h: number, a: number, L: number) => (x <= a ? (h * x) / a : (h * (L - x)) / (L - a));
/** Fourier sine coefficient bₙ = (2/L)∫₀ᴸ u₀ sin(nπx/L) dx = 2hL² sin(nπa/L) / (n²π² a(L − a)). */
export function pluckCoeff(n: number, h: number, a: number, L: number): number {
  return ((2 * h * L * L) / (n * n * Math.PI * Math.PI * a * (L - a))) * Math.sin((n * Math.PI * a) / L);
}
/** u(x, t) = Σ bₙ sin(nπx/L) cos(nπct/L), first N modes. */
export function stringU(x: number, t: number, N: number, h: number, a: number, L: number, c: number): number {
  let u = 0;
  for (let n = 1; n <= N; n++) u += pluckCoeff(n, h, a, L) * Math.sin((n * Math.PI * x) / L) * Math.cos((n * Math.PI * c * t) / L);
  return u;
}
/** u(x, t) = Σ bₙ sin(nπx/L) e^(−(nπ/L)² α t), first N modes (1-D heat equation, ends held at 0). */
export function heatU(x: number, t: number, N: number, h: number, a: number, L: number, alpha: number): number {
  let u = 0;
  for (let n = 1; n <= N; n++) u += pluckCoeff(n, h, a, L) * Math.sin((n * Math.PI * x) / L) * Math.exp(-Math.pow((n * Math.PI) / L, 2) * alpha * t);
  return u;
}
/** Fundamental frequency f₁ = c / 2L. */
export const fundamental = (c: number, L: number) => c / (2 * L);
/** Time for the first heat mode to halve: ln 2 / ((π/L)² α). */
export const heatHalfLife = (L: number, alpha: number) => Math.LN2 / (Math.pow(Math.PI / L, 2) * alpha);

/* ───────────────────── Complex functions (unit 5) ───────────────────── */

export type C2 = [number, number];
export type MapId = "sq" | "inv" | "exp" | "sin" | "mobius";

/** w = f(z) written into `out` (no allocation; NaN at a pole). */
export function cmapTo(id: MapId, x: number, y: number, out: C2): C2 {
  switch (id) {
    case "sq": out[0] = x * x - y * y; out[1] = 2 * x * y; break;
    case "inv": { const d = x * x + y * y; if (d === 0) { out[0] = NaN; out[1] = NaN; } else { out[0] = x / d; out[1] = -y / d; } break; }
    case "exp": { const e = Math.exp(x); out[0] = e * Math.cos(y); out[1] = e * Math.sin(y); break; }
    case "sin": out[0] = Math.sin(x) * Math.cosh(y); out[1] = Math.cos(x) * Math.sinh(y); break;
    case "mobius": { const d = x * x + (y + 1) * (y + 1); if (d === 0) { out[0] = NaN; out[1] = NaN; } else { out[0] = (x * x + y * y - 1) / d; out[1] = (-2 * x) / d; } break; }
  }
  return out;
}
export const cmap = (id: MapId, x: number, y: number): C2 => cmapTo(id, x, y, [0, 0]);

/** Exact derivative f′(z). */
export function cderiv(id: MapId, x: number, y: number): C2 {
  switch (id) {
    case "sq": return [2 * x, 2 * y];
    case "inv": { const d = x * x + y * y; if (d === 0) return [NaN, NaN]; const d2 = d * d; return [-(x * x - y * y) / d2, (2 * x * y) / d2]; }
    case "exp": return cmap("exp", x, y);
    case "sin": return [Math.cos(x) * Math.cosh(y), -Math.sin(x) * Math.sinh(y)];
    case "mobius": { const p = x * x - (y + 1) * (y + 1), q = 2 * x * (y + 1), d = p * p + q * q; if (d === 0) return [NaN, NaN]; return [(2 * q) / d, (2 * p) / d]; }
  }
}

/** Numerical Cauchy–Riemann check by central differences: uₓ = v_y and u_y = −vₓ. */
export function crCheck(id: MapId, x: number, y: number, h = 1e-5) {
  const a = cmap(id, x + h, y), b = cmap(id, x - h, y), c = cmap(id, x, y + h), d = cmap(id, x, y - h);
  const ux = (a[0] - b[0]) / (2 * h), vx = (a[1] - b[1]) / (2 * h), uy = (c[0] - d[0]) / (2 * h), vy = (c[1] - d[1]) / (2 * h);
  const scale = Math.max(1, Math.abs(ux), Math.abs(uy), Math.abs(vx), Math.abs(vy));
  const holds = Math.abs(ux - vy) < 1e-4 * scale && Math.abs(uy + vx) < 1e-4 * scale;
  return { ux, uy, vx, vy, holds };
}

export const MAPS: Record<MapId, { label: string; pole: string }> = {
  sq: { label: "w = z²", pole: "none (entire)" },
  inv: { label: "w = 1/z", pole: "z = 0, Res = 1" },
  exp: { label: "w = eᶻ", pole: "none (entire)" },
  sin: { label: "w = sin z", pole: "none (entire)" },
  mobius: { label: "w = (z − i)/(z + i)", pole: "z = −i, Res = −2i" },
};
/** Residue of f at its pole (for the maps with one): 1/z → 1 at 0; (z − i)/(z + i) → (z − i) at z = −i = −2i. */
export function residue(id: MapId): C2 | null {
  if (id === "inv") return [1, 0];
  if (id === "mobius") return [0, -2];
  return null;
}
