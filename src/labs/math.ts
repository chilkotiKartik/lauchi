/** Pure numeric helpers used by the live labs. No DOM, no three.js. */

export type Fn2 = (x: number, y: number) => number;

export const SURFACES = [
  { id: "cubic", label: "x³ + y³ − 3xy", f: (x, y) => x ** 3 + y ** 3 - 3 * x * y, range: 2.2, zcap: 6 },
  { id: "saddle", label: "x² − y²", f: (x, y) => x * x - y * y, range: 2, zcap: 4 },
  { id: "bowl", label: "x² + y²", f: (x, y) => x * x + y * y, range: 2, zcap: 4 },
  { id: "xy6", label: "xy(6 − x − y)", f: (x, y) => x * y * (6 - x - y), range: 4, zcap: 10 },
  { id: "wave", label: "sin x · cos y", f: (x, y) => Math.sin(x) * Math.cos(y), range: 3.2, zcap: 1 },
] as const satisfies readonly { id: string; label: string; f: Fn2; range: number; zcap: number }[];

export type SurfaceId = (typeof SURFACES)[number]["id"];

const H = 1e-4;
export const fx: (f: Fn2) => Fn2 = (f) => (x, y) => (f(x + H, y) - f(x - H, y)) / (2 * H);
export const fy: (f: Fn2) => Fn2 = (f) => (x, y) => (f(x, y + H) - f(x, y - H)) / (2 * H);
export function hessian(f: Fn2, x: number, y: number) {
  const h = 1e-3;
  const fxx = (f(x + h, y) - 2 * f(x, y) + f(x - h, y)) / (h * h);
  const fyy = (f(x, y + h) - 2 * f(x, y) + f(x, y - h)) / (h * h);
  const fxy = (f(x + h, y + h) - f(x + h, y - h) - f(x - h, y + h) + f(x - h, y - h)) / (4 * h * h);
  return { fxx, fyy, fxy, det: fxx * fyy - fxy * fxy };
}

export type CritKind = "min" | "max" | "saddle" | "unclear";
export interface Crit { x: number; y: number; z: number; kind: CritKind; det: number; fxx: number }

/** Newton from a grid of seeds, dedupe, classify by the second-derivative test. */
export function criticalPoints(f: Fn2, range: number, seeds = 9): Crit[] {
  const gx = fx(f), gy = fy(f);
  const out: Crit[] = [];
  for (let i = 0; i < seeds; i++) for (let j = 0; j < seeds; j++) {
    let x = -range + (2 * range * (i + 0.5)) / seeds;
    let y = -range + (2 * range * (j + 0.5)) / seeds;
    let ok = false;
    for (let it = 0; it < 40; it++) {
      const a = gx(x, y), b = gy(x, y);
      if (Math.hypot(a, b) < 1e-7) { ok = true; break; }
      const { fxx, fyy, fxy, det } = hessian(f, x, y);
      if (Math.abs(det) < 1e-9) break;
      const dx = (fyy * a - fxy * b) / det, dy = (-fxy * a + fxx * b) / det;
      x -= dx; y -= dy;
      if (Math.abs(x) > range * 1.5 || Math.abs(y) > range * 1.5) break;
    }
    if (!ok || Math.abs(x) > range || Math.abs(y) > range) continue;
    if (out.some((c) => Math.hypot(c.x - x, c.y - y) < 1e-3)) continue;
    const { det, fxx } = hessian(f, x, y);
    const kind: CritKind = det > 1e-3 ? (fxx > 0 ? "min" : "max") : det < -1e-3 ? "saddle" : "unclear";
    out.push({ x, y, z: f(x, y), kind, det, fxx });
  }
  return out.sort((p, q) => p.x - q.x || p.y - q.y);
}

/** Extremes of f on the circle x²+y²=r² by a fine scan + parabola-free refinement. */
export function circleExtrema(f: Fn2, r: number, n = 3600) {
  let min = { t: 0, z: Infinity }, max = { t: 0, z: -Infinity };
  for (let i = 0; i < n; i++) {
    const t = (2 * Math.PI * i) / n;
    const z = f(r * Math.cos(t), r * Math.sin(t));
    if (z < min.z) min = { t, z };
    if (z > max.z) max = { t, z };
  }
  const p = (o: { t: number; z: number }) => ({ x: r * Math.cos(o.t), y: r * Math.sin(o.t), z: o.z });
  return { min: p(min), max: p(max) };
}

/** Two-slit style intensity: sum of N point sources phasors at (x,y). */
export function waveField(sources: { x: number; y: number }[], k: number, t: number, x: number, y: number) {
  let s = 0;
  for (const p of sources) {
    const d = Math.hypot(x - p.x, y - p.y);
    s += Math.sin(k * d - t) / Math.sqrt(1 + d);
  }
  return s;
}

/** Volume under z=f(x,y) over [0,a]×[0,b] by midpoint rule. */
export function volumeUnder(f: Fn2, a: number, b: number, n = 200) {
  const dx = a / n, dy = b / n;
  let v = 0;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) v += f((i + 0.5) * dx, (j + 0.5) * dy) * dx * dy;
  return v;
}

/** Eigen decomposition of a real symmetric-or-not 2×2 matrix [[a,b],[c,d]]. */
export function eigen2(a: number, b: number, c: number, d: number) {
  const tr = a + d, det = a * d - b * c, disc = tr * tr / 4 - det;
  if (disc < 0) return { real: false as const, re: tr / 2, im: Math.sqrt(-disc), vectors: [] as [number, number][] };
  const s = Math.sqrt(disc);
  const vals = [tr / 2 + s, tr / 2 - s];
  const vecs = vals.map((l): [number, number] => {
    let v: [number, number] = Math.abs(b) > 1e-12 ? [b, l - a] : Math.abs(c) > 1e-12 ? [l - d, c] : l === a ? [1, 0] : [0, 1];
    const m = Math.hypot(v[0], v[1]) || 1;
    v = [v[0] / m, v[1] / m];
    return v;
  });
  return { real: true as const, values: vals as [number, number], vectors: vecs };
}

/** Fourier partial sum of a square wave with n odd harmonics. */
export const squareWave = (x: number, n: number) => {
  let s = 0;
  for (let k = 0; k < n; k++) { const m = 2 * k + 1; s += Math.sin(m * x) / m; }
  return (4 / Math.PI) * s;
};

/** VSEPR: electron-domain geometry unit vectors. */
export const VSEPR = {
  2: { name: "Linear", dirs: [[1, 0, 0], [-1, 0, 0]] },
  3: { name: "Trigonal planar", dirs: [[1, 0, 0], [-0.5, 0.866, 0], [-0.5, -0.866, 0]] },
  4: { name: "Tetrahedral", dirs: [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]].map(n) },
  5: { name: "Trigonal bipyramidal", dirs: [[0, 1, 0], [0, -1, 0], [1, 0, 0], [-0.5, 0, 0.866], [-0.5, 0, -0.866]] },
  6: { name: "Octahedral", dirs: [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]] },
} as Record<number, { name: string; dirs: number[][] }>;
function n(v: number[]) { const m = Math.hypot(...v); return v.map((c) => c / m); }

/** Molecular shape from bonding pairs (X) and lone pairs (E). Standard VSEPR table. */
const SHAPES: Record<string, string> = {
  "2,0": "Linear", "3,0": "Trigonal planar", "3,1": "Bent",
  "4,0": "Tetrahedral", "4,1": "Trigonal pyramidal", "4,2": "Bent",
  "5,0": "Trigonal bipyramidal", "5,1": "Seesaw", "5,2": "T-shaped", "5,3": "Linear",
  "6,0": "Octahedral", "6,1": "Square pyramidal", "6,2": "Square planar",
};
export const maxLonePairs = (domains: number) => ({ 2: 0, 3: 1, 4: 2, 5: 3, 6: 2 } as Record<number, number>)[domains] ?? 0;
export function vsepr(domains: number, lone: number) {
  const l = Math.min(lone, maxLonePairs(domains));
  const dirs = VSEPR[domains].dirs;
  const order = domains === 5 ? [2, 3, 4, 0, 1] : domains === 6 ? [0, 1, 2, 3, 4, 5] : dirs.map((_, i) => i);
  const loneIdx = order.slice(0, l);
  return {
    shape: SHAPES[`${domains},${l}`] ?? "—",
    lone: l,
    bonded: dirs.filter((_, i) => !loneIdx.includes(i)),
    pairs: loneIdx.map((i) => dirs[i]),
  };
}

export const TAYLOR_FUNCS = {
  sin: { label: "sin x", f: Math.sin, d: (k: number, a: number) => Math.sin(a + (k * Math.PI) / 2), lo: -7, hi: 7 },
  cos: { label: "cos x", f: Math.cos, d: (k: number, a: number) => Math.cos(a + (k * Math.PI) / 2), lo: -7, hi: 7 },
  exp: { label: "eˣ", f: Math.exp, d: (_k: number, a: number) => Math.exp(a), lo: -3, hi: 3 },
  ln: { label: "ln(1 + x)", f: (x: number) => Math.log(1 + x), d: (k: number, a: number) => (k === 0 ? Math.log(1 + a) : ((k % 2 ? 1 : -1) * fact(k - 1)) / (1 + a) ** k), lo: -0.95, hi: 3 },
} as const;
export type TaylorId = keyof typeof TAYLOR_FUNCS;
function fact(n: number) { let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; }
/** Taylor polynomial of degree n about a, evaluated at x. */
export function taylor(id: TaylorId, n: number, a: number, x: number) {
  const F = TAYLOR_FUNCS[id];
  let s = 0;
  for (let k = 0; k <= n; k++) s += (F.d(k, a) / fact(k)) * (x - a) ** k;
  return s;
}

/** Projectile with optional linear drag (a = −k·v), semi-implicit Euler. Returns the path until it lands. */
export function projectile(v0: number, angleDeg: number, g: number, k: number, dt = 0.002) {
  const th = (angleDeg * Math.PI) / 180;
  let x = 0, y = 0, vx = v0 * Math.cos(th), vy = v0 * Math.sin(th), t = 0, maxH = 0, step = 0;
  const path: [number, number, number][] = [[0, 0, 0]];
  while (t < 200) {
    const px = x, py = y;
    vx += -k * vx * dt; vy += (-g - k * vy) * dt;
    x += vx * dt; y += vy * dt; t += dt; step++;
    if (y > maxH) maxH = y;
    if (y < 0) { const f = py / (py - y); x = px + (x - px) * f; y = 0; break; }
    if (step % 10 === 0) path.push([x, y, t]);
  }
  path.push([x, Math.max(0, y), t]);
  return { path, range: x, maxH, time: t };
}

/** Series RLC driven at frequency f (Hz). R in Ω, L in H, C in F. */
export function rlc(R: number, L: number, C: number, f: number) {
  const w = 2 * Math.PI * f, XL = w * L, XC = 1 / (w * C), X = XL - XC, Z = Math.hypot(R, X);
  const f0 = 1 / (2 * Math.PI * Math.sqrt(L * C));
  return { XL, XC, X, Z, phase: Math.atan2(X, R), f0, Q: (1 / R) * Math.sqrt(L / C), pf: R / Z };
}

/** Rectifier output over n samples spanning `cycles` cycles. mode: half, full, or full with a smoothing capacitor (C in F, R in Ω). */
export function rectifier(mode: "half" | "full" | "smooth", Vp: number, f: number, R: number, C: number, cycles = 3, n = 600) {
  const T = 1 / f, dt = (cycles * T) / n;
  const vin: number[] = [], vout: number[] = [];
  let vc = 0;
  for (let i = 0; i < n; i++) {
    const t = i * dt, v = Vp * Math.sin(2 * Math.PI * f * t);
    vin.push(v);
    if (mode === "half") vout.push(Math.max(0, v));
    else if (mode === "full") vout.push(Math.abs(v));
    else {
      const src = Math.abs(v);
      if (src > vc) vc = src; else vc = vc * Math.exp(-dt / (R * C)); // diode blocks; the capacitor discharges through the load
      vout.push(vc);
    }
  }
  return { vin, vout, dt };
}

/** Titration of `Va` mL of acid (M `Ca`) with base (M `Cb`), volume `Vb` mL. Weak acid uses Ka; strong uses full dissociation. */
export function titrationPH(kind: "strong" | "weak", Ca: number, Va: number, Cb: number, Vb: number, Ka = 1.8e-5) {
  const n_a = (Ca * Va) / 1000, n_b = (Cb * Vb) / 1000, V = (Va + Vb) / 1000, Kw = 1e-14;
  if (kind === "strong") {
    const net = (n_b - n_a) / V; // excess OH⁻ (positive) or H⁺ (negative)
    const h = net <= 0 ? (-net + Math.sqrt(net * net + 4 * Kw)) / 2 : Kw / ((net + Math.sqrt(net * net + 4 * Kw)) / 2);
    return -Math.log10(h);
  }
  // weak acid HA + strong base: solve charge balance [Na⁺] + [H⁺] = [A⁻] + [OH⁻] for [H⁺] by bisection
  const Na = n_b / V, Ct = n_a / V;
  const g = (h: number) => Na + h - (Ct * Ka) / (Ka + h) - Kw / h;
  let lo = 1e-14, hi = 1;
  for (let i = 0; i < 200; i++) { const mid = Math.sqrt(lo * hi); if (g(mid) > 0) hi = mid; else lo = mid; }
  return -Math.log10(Math.sqrt(lo * hi));
}

/** Otto cycle on a P–V plane with T₁ = 1, V₂ = 1, V₁ = r, and nR = 1. τ = T₃/T₁. */
export function otto(r: number, gamma: number, tau: number) {
  const T2 = r ** (gamma - 1), T3 = tau, T4 = tau / T2;
  const pts = { p1: { v: r, p: 1 / r }, p2: { v: 1, p: T2 }, p3: { v: 1, p: T3 }, p4: { v: r, p: T4 / r } };
  const path: [number, number][] = [];
  const seg = (a: { v: number; p: number }, b: { v: number; p: number }, adiabatic: boolean) => {
    for (let i = 0; i <= 40; i++) {
      const s = i / 40, v = a.v + (b.v - a.v) * s;
      path.push([v, adiabatic ? a.p * (a.v / v) ** gamma : a.p + (b.p - a.p) * s]);
    }
  };
  seg(pts.p1, pts.p2, true); seg(pts.p2, pts.p3, false); seg(pts.p3, pts.p4, true); seg(pts.p4, pts.p1, false);
  const heatIn = (T3 - T2) / (gamma - 1), heatOut = (T4 - 1) / (gamma - 1);
  return { pts, path, efficiency: 1 - r ** (1 - gamma), work: heatIn - heatOut, heatIn };
}

/** Radius of the nth dark ring in reflected light for a lens of radius of curvature R: r = √(nλR). */
export const newtonRing = (n: number, lambda: number, R: number) => Math.sqrt(n * lambda * R);

/** Particle in a 1-D box of width L (nm), electron mass. Energy in eV. ψ is normalised on [0, L]. */
export const boxEnergy = (n: number, Lnm: number) => (n * n * 0.376) / (Lnm * Lnm);
export const boxPsi = (n: number, Lnm: number, x: number) => Math.sqrt(2 / Lnm) * Math.sin((n * Math.PI * x) / Lnm);
export const photonNm = (eV: number) => 1239.84198 / eV;

/** Damped pendulum by RK4. Returns the angle series and the measured period (time between upward zero crossings). */
export function pendulum(L: number, g: number, theta0Deg: number, damping: number, seconds = 20, dt = 0.005) {
  let th = (theta0Deg * Math.PI) / 180, w = 0, t = 0;
  const f = (a: number, b: number) => [b, -(g / L) * Math.sin(a) - damping * b];
  const out: number[] = [];
  const crossings: number[] = [];
  let prev = th;
  for (let i = 0; i < seconds / dt; i++) {
    out.push(th);
    const [k1a, k1b] = f(th, w), [k2a, k2b] = f(th + (dt / 2) * k1a, w + (dt / 2) * k1b), [k3a, k3b] = f(th + (dt / 2) * k2a, w + (dt / 2) * k2b), [k4a, k4b] = f(th + dt * k3a, w + dt * k3b);
    th += (dt / 6) * (k1a + 2 * k2a + 2 * k3a + k4a); w += (dt / 6) * (k1b + 2 * k2b + 2 * k3b + k4b); t += dt;
    if (prev < 0 && th >= 0) crossings.push(t);
    prev = th;
  }
  const period = crossings.length >= 2 ? (crossings[crossings.length - 1] - crossings[0]) / (crossings.length - 1) : NaN;
  return { theta: out, dt, period, small: 2 * Math.PI * Math.sqrt(L / g) };
}
