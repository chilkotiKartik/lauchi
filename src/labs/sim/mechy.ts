/** Pure maths for the round-3 Basic Mechanical Engineering labs (group mechy). SI units unless a name says otherwise. */

export const G0 = 9.81;
export const RHO_W = 1000;
const clamp = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/* ───────────── Elastic constants (cube under normal, shear or volumetric load) ───────────── */

/** Modulus of rigidity and bulk modulus from E and Poisson's ratio ν (same unit as E). */
export function elasticConstants(E: number, nu: number) {
  const G = E / (2 * (1 + nu));
  const K = nu < 0.5 ? E / (3 * (1 - 2 * nu)) : Infinity;
  /** E rebuilt from K and G: E = 9KG/(3K + G). */
  const Echeck = Number.isFinite(K) ? (9 * K * G) / (3 * K + G) : 3 * G;
  return { G, K, Echeck };
}

export type CubeMode = "normal" | "shear" | "volume";
/**
 * A cube of side `a` (mm) under a load of `s` MPa: uniaxial tension σ, pure shear τ or all-round pressure p. E in GPa.
 * Returns strains and deformations (mm, mm³).
 */
export function cubeLoad(E: number, nu: number, mode: CubeMode, s: number, a: number) {
  const Emp = E * 1000, { G, K } = elasticConstants(Emp, nu);
  let ex = 0, ey = 0, gamma = 0, ev = 0;
  if (mode === "normal") { ex = s / Emp; ey = -nu * ex; ev = ex * (1 - 2 * nu); }
  else if (mode === "shear") { gamma = s / G; }
  else { ex = (-s * (1 - 2 * nu)) / Emp; ey = ex; ev = Number.isFinite(K) ? -s / K : 0; }
  const V = a ** 3;
  return { ex, ey, gamma, ev, dA: ex * a, dLat: ey * a, shift: gamma * a, dV: ev * V, V };
}

/* ───────────── Stepped bar under axial loads ───────────── */

/**
 * A three-segment bar A–B–C–D with axial point loads at the four joints (kN, + = to the right).
 * The load at B is found from equilibrium. Areas in mm², lengths in mm, E in GPa.
 * Internal force N (kN, + = tension), stress (MPa) and change in length (mm) per segment.
 */
export function steppedBar(FA: number, FC: number, FD: number, A: [number, number, number], L: [number, number, number], E: number) {
  const FB = -(FA + FC + FD);
  const N: [number, number, number] = [-FA, -(FA + FB), FD];
  const Emp = E * 1000;
  const sigma = N.map((n, i) => (n * 1000) / A[i]) as [number, number, number];
  const dL = N.map((n, i) => (n * 1000 * L[i]) / (A[i] * Emp)) as [number, number, number];
  const total = dL[0] + dL[1] + dL[2];
  let worst = 0;
  for (let i = 1; i < 3; i++) if (Math.abs(sigma[i]) > Math.abs(sigma[worst])) worst = i;
  return { FB, N, sigma, dL, total, worst };
}

/* ───────────── Carbon steels, cast iron & alloy steels ───────────── */

/** Normalised plain-carbon steel, typical handbook values: [C %, UTS MPa, yield MPa, elongation %, Brinell]. */
const STEEL: [number, number, number, number, number][] = [
  [0.05, 310, 200, 40, 90], [0.2, 410, 250, 30, 120], [0.4, 580, 330, 22, 170], [0.6, 750, 400, 16, 215], [0.8, 870, 450, 10, 250], [1.0, 920, 470, 7, 280], [1.5, 900, 460, 3, 290],
];
/** Grey cast iron: [C %, UTS, elongation %, Brinell] — no yield point. */
const CI: [number, number, number, number][] = [[2.0, 320, 0.8, 230], [3.0, 250, 0.6, 210], [4.0, 150, 0.4, 180]];

function interp<T extends number[]>(tab: T[], x: number, col: number) {
  if (x <= tab[0][0]) return tab[0][col];
  for (let i = 1; i < tab.length; i++) if (x <= tab[i][0]) return lerp(tab[i - 1][col], tab[i][col], (x - tab[i - 1][0]) / (tab[i][0] - tab[i - 1][0]));
  return tab[tab.length - 1][col];
}

export type SteelKind = "plain" | "alloy";
export function steelClass(c: number) {
  if (c <= 0.25) return "Low-carbon (mild) steel";
  if (c <= 0.6) return "Medium-carbon steel";
  if (c <= 1.5) return "High-carbon steel";
  if (c < 2) return "Ultra-high-carbon (rarely used)";
  return "Grey cast iron";
}
/**
 * Typical properties of an iron–carbon material with `c` % carbon (simplified, smoothed handbook trends).
 * `alloy` = Cr–Ni–Mo alloy steel, hardened and tempered (or alloy cast iron above 2 % C).
 */
export function ironCarbon(c: number, kind: SteelKind) {
  const brittle = c >= 2;
  let uts: number, ys: number, el: number, bhn: number;
  if (c <= 1.5) { uts = interp(STEEL, c, 1); ys = interp(STEEL, c, 2); el = interp(STEEL, c, 3); bhn = interp(STEEL, c, 4); }
  else if (!brittle) { const t = (c - 1.5) / 0.5; uts = lerp(900, 320, t); ys = lerp(460, 320, t); el = lerp(3, 0.8, t); bhn = lerp(290, 230, t); }
  else { uts = interp(CI, c, 1); el = interp(CI, c, 2); bhn = interp(CI, c, 3); ys = uts; }
  if (kind === "alloy") {
    if (brittle) { uts *= 1.3; bhn *= 1.3; el *= 0.8; ys = uts; }
    else { uts *= 1.6; ys = Math.min(0.9 * uts, ys * 2.4); el *= 0.6; bhn *= 1.7; }
  }
  const E = brittle ? 110 : 210; // GPa
  /** Modulus of resilience σ_y²/2E (kJ/m³) — the elastic energy a cubic metre can store and give back. */
  const resilience = (ys * ys) / (2 * E * 1000) * 1000;
  const use = brittle ? "machine beds, engine blocks, pipes, manhole covers"
    : kind === "alloy" ? "crankshafts, gears, axles, high-strength bolts"
    : c <= 0.25 ? "sheet, wire, structural sections, nails" : c <= 0.6 ? "rails, shafts, gears, forgings" : "cutting tools, springs, files, dies";
  const base = { uts, ys, el, bhn, E, resilience, brittle, use, cls: kind === "alloy" ? (brittle ? "Alloy cast iron" : "Alloy steel (Cr–Ni–Mo)") : steelClass(c) };
  /** Toughness = area under the stress–strain curve up to fracture (MJ/m³). */
  const curve = ironCurve(base);
  let toughness = 0;
  for (let i = 1; i < curve.length; i++) toughness += ((curve[i][0] - curve[i - 1][0]) / 100) * (curve[i][1] + curve[i - 1][1]) / 2;
  return { ...base, toughness, curve };
}
type IronBase = { uts: number; ys: number; el: number; E: number; brittle: boolean };

/** Engineering stress–strain curve (strain %, stress MPa) for those properties. */
export function ironCurve(p: IronBase, n = 80): [number, number][] {
  const out: [number, number][] = [];
  const ey = (p.ys / (p.E * 1000)) * 100;
  if (p.brittle) {
    for (let i = 0; i <= n; i++) { const e = (p.el * i) / n, x = e / p.el; out.push([e, p.uts * (1.35 * x - 0.35 * x * x)]); }
    return out;
  }
  const eu = Math.max(ey * 2, p.el * 0.6);
  out.push([0, 0], [ey, p.ys]);
  for (let i = 1; i <= n; i++) {
    const e = ey + ((p.el - ey) * i) / n;
    const s = e <= eu ? p.ys + (p.uts - p.ys) * Math.sin(((e - ey) / (eu - ey)) * Math.PI / 2) : p.uts - 0.2 * p.uts * ((e - eu) / (p.el - eu)) ** 2;
    out.push([e, s]);
  }
  return out;
}

/** Small seeded PRNG (mulberry32) for repeatable grain patterns. */
export function prng(seed: number) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
/** Microstructure phase fractions: pearlite grows to 100 % at 0.8 % C (eutectoid); beyond it, cementite; above 2 % graphite flakes. */
export function phases(c: number) {
  if (c >= 2) return { ferrite: 0.3, pearlite: 0.6, cementite: 0, graphite: clamp((c - 1.5) / 3, 0.1, 0.5) };
  if (c <= 0.8) return { ferrite: 1 - c / 0.8, pearlite: c / 0.8, cementite: 0, graphite: 0 };
  const cem = (c - 0.8) / (6.67 - 0.8);
  return { ferrite: 0, pearlite: 1 - cem, cementite: cem, graphite: 0 };
}

/* ───────────── Manometer & Bourdon gauge ───────────── */

/**
 * U-tube manometer on a vessel. h = deflection of the manometric liquid (cm), s2 its specific gravity, s1 the specific gravity
 * of the vessel fluid (0 for a gas), y = height of vessel fluid above the left meniscus (cm). Atmosphere in kPa.
 */
export function manometer(h: number, s2: number, s1: number, y: number, patm: number) {
  const pg = RHO_W * G0 * (s2 * h - s1 * y) / 100; // Pa
  return { pg, pabs: pg + patm * 1000, headW: pg / (RHO_W * G0), bar: pg / 1e5, vacuum: pg < 0 };
}

/** Pressure at depth h (m) in a liquid of specific gravity s: p = ρgh. */
export const hydroP = (s: number, h: number) => s * RHO_W * G0 * h;

/* ───────────── Pascal's law: hydraulic lift ───────────── */

/** Hydraulic lift: load W (kN) on the ram of area A2, plunger area A1 (m²), lift (cm), efficiency (%). */
export function hydraulicLift(W: number, A1: number, A2: number, lift: number, eta: number) {
  const p = (W * 1000) / A2; // Pa
  const F1 = (p * A1) / (eta / 100); // N
  const travel = (lift / 100) * (A2 / A1); // m of plunger travel
  return { p, F1, MA: (W * 1000) / F1, ratio: A2 / A1, travel, workIn: F1 * travel, workOut: W * 1000 * (lift / 100) };
}

/* ───────────── Newton's law of viscosity ───────────── */

export type FluidKind = "newtonian" | "thinning" | "thickening" | "bingham";
export const BINGHAM_TY = 20; // Pa, yield stress of the Bingham plastic
/** Shear stress (Pa) for a shear rate (1/s); μ is the viscosity (Pa·s) or consistency index (Pa·sⁿ). */
export function shearStress(kind: FluidKind, mu: number, rate: number) {
  if (kind === "thinning") return mu * Math.pow(rate, 0.5);
  if (kind === "thickening") return mu * Math.pow(rate, 1.5);
  if (kind === "bingham") return rate > 0 ? BINGHAM_TY + mu * rate : 0;
  return mu * rate;
}
/** A plate of area A (m²) dragged at u (m/s) over a fluid film y (mm) thick: plane Couette flow. */
export function couette(kind: FluidKind, mu: number, u: number, y: number, A: number, rho: number) {
  const rate = u / (y / 1000);
  const tau = shearStress(kind, mu, rate);
  const F = tau * A, apparent = tau / rate;
  return { rate, tau, F, power: F * u, apparent, nu: apparent / rho };
}

/* ───────────── Steady flow energy equation ───────────── */

export type FlowDevice = "nozzle" | "turbine" | "compressor" | "boiler";
/**
 * SFEE per kg: h₁ + V₁²/2 + gz₁ + q = h₂ + V₂²/2 + gz₂ + w (h, q, w in kJ/kg, V in m/s, dz = z₁ − z₂ in m).
 * Nozzle (q = w = 0) → exit velocity; turbine/compressor → shaft work w; boiler (w = 0) → heat q.
 */
export function sfee(dev: FlowDevice, h1: number, h2: number, V1: number, V2: number, dz: number, q: number, mdot: number) {
  const dpe = (G0 * dz) / 1000; // kJ/kg released by falling dz
  if (dev === "nozzle") {
    const v2sq = V1 * V1 + 2000 * (h1 - h2 + dpe);
    const V2n = v2sq >= 0 ? Math.sqrt(v2sq) : NaN;
    return { V2: V2n, w: 0, q: 0, dke: Number.isFinite(V2n) ? (V2n * V2n - V1 * V1) / 2000 : NaN, dpe, possible: v2sq >= 0, power: 0 };
  }
  const dke = (V2 * V2 - V1 * V1) / 2000;
  if (dev === "boiler") {
    const qb = h2 - h1 + dke - dpe;
    return { V2, w: 0, q: qb, dke, dpe, possible: true, power: qb * mdot };
  }
  const w = h1 - h2 - dke + dpe + q;
  return { V2, w, q, dke, dpe, possible: dev === "turbine" ? w > 0 : w < 0, power: w * mdot };
}

/* ───────────── Second law: Kelvin–Planck vs Clausius ───────────── */

export type SecondMode = "clausius" | "kp" | "legal";
/**
 * An engine E and a refrigerator R between a hot (TH) and cold (TC) reservoir (K). Q1 kJ enters the engine.
 * `frac` = fraction of the Carnot efficiency / COP that the real machine reaches.
 * clausius: a Clausius violator pumps the engine's rejected heat straight back up with no work → a net single-reservoir engine.
 * kp: a 100 % engine (Kelvin–Planck violator) drives an ordinary refrigerator → net heat flows cold → hot with no work.
 * legal: a real engine drives a real refrigerator.
 */
export function secondLaw(mode: SecondMode, Q1: number, TH: number, TC: number, frac: number) {
  const etaC = 1 - TC / TH, copC = TC / (TH - TC);
  const eta = mode === "kp" ? 1 : frac * etaC;
  const W = eta * Q1;
  let hot: number, cold: number, Wnet: number, QL = 0, pumped = 0;
  if (mode === "clausius") {
    pumped = Q1 - W;          // heat rejected by the engine, sent back up for free
    hot = -Q1 + pumped; cold = 0; Wnet = W;
  } else {
    QL = frac * copC * W;     // fridge takes QL from cold using all of W
    hot = -Q1 + QL + W; cold = mode === "kp" ? -QL : (Q1 - W) - QL; Wnet = 0;
  }
  /** Entropy change of the two reservoirs (the devices run in cycles). */
  const dS = hot / TH + cold / TC;
  return { etaC, copC, eta, W, QL, pumped, hot, cold, Wnet, dS, ok: dS >= -1e-9 };
}

/* ───────────── Zeroth law & temperature sensors ───────────── */

export const SPECIFIC_HEAT = { water: 4.186, al: 0.9, cu: 0.385, fe: 0.45 } as const;
export type Mat = keyof typeof SPECIFIC_HEAT;
/** Two bodies brought into contact (no losses, no phase change): common temperature (°C) and heat passed A → B (kJ). */
export function equilibrium(TA: number, mA: number, cA: number, TB: number, mB: number, cB: number) {
  const CA = mA * cA, CB = mB * cB, T = (CA * TA + CB * TB) / (CA + CB);
  return { T, Q: CA * (TA - T) };
}
/** Pt100 RTD (linear, α = 0.00385 /°C): resistance in Ω. */
export const rtd = (T: number) => 100 * (1 + 0.00385 * T);
/** Type-K thermocouple with its cold junction in ice (≈ 41 µV/°C): EMF in mV. */
export const thermocouple = (T: number) => 0.041 * T;
/** Mercury-in-glass: column length (mm) for a 200 mm scale spanning −10 … 360 °C. */
export const mercury = (T: number) => (clamp(T, -10, 360) + 10) * (200 / 370);

/* ───────────── Two-stroke engine ───────────── */

const ROD = 2; // connecting rod length / stroke (= l/r of 4)
/** Piston distance from TDC as a fraction of the stroke at crank angle θ (degrees after TDC). */
export function pistonFrac(theta: number) {
  const r = 0.5, l = ROD, a = (theta * Math.PI) / 180;
  return r * (1 - Math.cos(a)) + l - Math.sqrt(l * l - (r * Math.sin(a)) ** 2);
}
/** Crank angle (° after TDC, 0 … 180) at which a port whose top edge is `h` (fraction of stroke above BDC) is uncovered. */
export function portOpens(h: number) {
  const target = 1 - clamp(h, 0, 1);
  let lo = 0, hi = 180;
  for (let i = 0; i < 50; i++) { const m = (lo + hi) / 2; if (pistonFrac(m) < target) lo = m; else hi = m; }
  return (lo + hi) / 2;
}
/**
 * Single-cylinder engine: bore, stroke (mm), speed N (rpm), indicated mean effective pressure pm (bar),
 * exhaust and transfer port heights (% of stroke). IP = pm·L·A·n/60 with n = N (two-stroke) or N/2 (four-stroke).
 */
export function twoStroke(bore: number, stroke: number, N: number, pm: number, exH: number, trH: number) {
  const A = (Math.PI / 4) * (bore / 1000) ** 2, L = stroke / 1000;
  const Vs = A * L * 1e6; // cm³
  const ip2 = (pm * 1e5 * L * A * N) / 60, ip4 = ip2 / 2;
  const eo = portOpens(exH / 100), to = portOpens(trH / 100);
  return { Vs, ip2, ip4, powerPerS: N / 60, eo, ec: 360 - eo, exDur: 2 * (180 - eo), to, tc: 360 - to, trDur: 2 * (180 - to), trapped: 1 - exH / 100 };
}
/** What is happening above and below the piston at crank angle θ (0 = TDC). */
export function twoStrokePhase(theta: number, eo: number, to: number) {
  const a = ((theta % 360) + 360) % 360;
  if (a < 25 || a > 345) return "Ignition / combustion near TDC";
  if (a < eo) return "Power (expansion) — crankcase compressing charge";
  if (a < to) return "Exhaust blowdown";
  if (a <= 360 - to) return "Scavenging (transfer + exhaust open)";
  if (a <= 360 - eo) return "Exhaust port still open — charge loss";
  return "Compression — fresh charge drawn into crankcase";
}

/* ───────────── Centrifugal pump ───────────── */

/**
 * Centrifugal pump with radial entry and constant velocity of flow. N rpm, diameters and outlet width in mm, vane angles in degrees.
 * Euler head per newton = V_w2·u₂/g.
 */
export function centriPump(N: number, D1: number, D2: number, b2: number, beta1: number, beta2: number) {
  const u1 = (Math.PI * (D1 / 1000) * N) / 60, u2 = (Math.PI * (D2 / 1000) * N) / 60;
  const Vf = u1 * Math.tan((beta1 * Math.PI) / 180);
  const Vw2 = u2 - Vf / Math.tan((beta2 * Math.PI) / 180);
  const V2 = Math.hypot(Vw2, Vf), Vr2 = Math.hypot(u2 - Vw2, Vf);
  const H = (Vw2 * u2) / G0;
  const Q = Math.PI * (D2 / 1000) * (b2 / 1000) * Vf;
  const P = RHO_W * G0 * Q * H;
  return { u1, u2, Vf, Vw2, V2, Vr2, H, Q, P, alpha2: (Math.atan2(Vf, Vw2) * 180) / Math.PI };
}
