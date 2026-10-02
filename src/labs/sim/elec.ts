/**
 * EET-001 Basic Electrical Engineering maths for the `elec` labs.
 * Pure functions in SI units: no React, no three, no allocation in the per-frame helpers.
 */

export const TAU = 2 * Math.PI;
export const SQRT3 = Math.sqrt(3);
const DEG = Math.PI / 180;

/** Engineering format with an SI prefix and 3 significant figures, e.g. si(0.00207, "Wb") → "2.07 mWb". */
export function si(x: number, unit: string, sig = 3): string {
  if (!Number.isFinite(x)) return `— ${unit}`;
  if (x === 0) return `0 ${unit}`;
  const a = Math.abs(x);
  const [f, p] = a >= 1e6 ? [1e-6, "M"] : a >= 1e3 ? [1e-3, "k"] : a >= 1 ? [1, ""] : a >= 1e-3 ? [1e3, "m"] : [1e6, "µ"];
  return `${Number((x * f).toPrecision(sig))} ${p}${unit}`;
}

// ───────────────────────── Unit 1: Thevenin & maximum power transfer ─────────────────────────

export interface Thevenin {
  Vth: number; Rth: number;
  /** Source-branch current (through R1), divider current (through R2) and load current; I1 = I2 + IL (KCL). */
  I1: number; I2: number; IL: number;
  VL: number; PL: number;
  /** Maximum power the network can deliver, V_th²/(4R_th), reached when R_L = R_th. */
  Pmax: number; RLopt: number;
  /** Share of the battery's power that reaches the load. */
  eff: number;
}

/** Source V with R1 in series, R2 across the terminals, load R_L across the terminals. */
export function thevenin(V: number, R1: number, R2: number, RL: number): Thevenin {
  const Vth = (V * R2) / (R1 + R2), Rth = (R1 * R2) / (R1 + R2);
  const IL = Vth / (Rth + RL), VL = IL * RL, PL = IL * VL;
  const I2 = VL / R2, I1 = (V - VL) / R1;
  const Pmax = (Vth * Vth) / (4 * Rth);
  return { Vth, Rth, I1, I2, IL, VL, PL, Pmax, RLopt: Rth, eff: V * I1 > 0 ? PL / (V * I1) : 0 };
}

/** P_L = V_th² R_L / (R_th + R_L)². */
export function loadPower(Vth: number, Rth: number, RL: number): number {
  const i = Vth / (Rth + RL);
  return i * i * RL;
}

// ───────────────────────── Unit 2: balanced three-phase AC ─────────────────────────

export type Connection = "star" | "delta";
export interface ThreePhase { VL: number; Iph: number; IL: number; P: number; Q: number; S: number; pf: number }

/**
 * Balanced load: phase voltage V_ph across each impedance |Z|∠±φ.
 * Star: V_L = √3 V_ph, I_L = I_ph. Delta: V_L = V_ph, I_L = √3 I_ph. Q > 0 for a lagging (inductive) load.
 */
export function threePhase(Vph: number, conn: Connection, Z: number, phiDeg: number, lead: boolean): ThreePhase {
  const Iph = Vph / Z;
  const VL = conn === "star" ? SQRT3 * Vph : Vph;
  const IL = conn === "star" ? Iph : SQRT3 * Iph;
  const phi = phiDeg * DEG, S = SQRT3 * VL * IL;
  return { VL, Iph, IL, S, P: S * Math.cos(phi), Q: (lead ? -1 : 1) * S * Math.sin(phi), pf: Math.cos(phi) };
}

// ───────────────────────── Unit 3: hysteresis (simplified tanh model) ─────────────────────────

export type MaterialId = "softiron" | "silicon" | "hardsteel" | "ferrite";
export interface Material { name: string; Bs: number; Hc: number; a: number }

/**
 * Typical textbook-order values. Bs: saturation flux density (T); Hc: major-loop coercivity (A/m);
 * a: shape field (A/m) of the tanh branches — smaller a relative to Hc gives a squarer loop.
 */
export const MATERIALS: Record<MaterialId, Material> = {
  softiron: { name: "Soft iron", Bs: 1.8, Hc: 80, a: 120 },
  silicon: { name: "Silicon steel", Bs: 1.9, Hc: 40, a: 50 },
  hardsteel: { name: "Hard steel (magnet)", Bs: 1.1, Hc: 5000, a: 2500 },
  ferrite: { name: "Soft ferrite", Bs: 0.45, Hc: 15, a: 50 },
};

/** The field that drives the material well into saturation: H_c + 3a. */
export const hSat = (m: Material) => m.Hc + 3 * m.a;

/** ln cosh x without overflow. */
function lncosh(x: number) {
  const ax = Math.abs(x);
  return ax + Math.log1p(Math.exp(-2 * ax)) - Math.LN2;
}

/**
 * Closing offset k for a loop of peak field Hm. Branches:
 *   descending B = Bs[tanh((H + Hc)/a) − k],  ascending B = Bs[tanh((H − Hc)/a) + k],
 * so both meet at (±Hm, ±Bm). For Hm ≫ Hc + a, k → 0 and the loop is the major loop.
 */
export function loopK(m: Material, Hm: number) {
  return (Math.tanh((Hm + m.Hc) / m.a) - Math.tanh((Hm - m.Hc) / m.a)) / 2;
}

/** B on the loop at field H: `desc` = true on the descending branch (H falling from +Hm). */
export function loopB(m: Material, k: number, H: number, desc: boolean) {
  return desc ? m.Bs * (Math.tanh((H + m.Hc) / m.a) - k) : m.Bs * (Math.tanh((H - m.Hc) / m.a) + k);
}

/** Closed loop as [H, B] points: descending branch +Hm → −Hm, then ascending −Hm → +Hm (2n points). */
export function loopPoints(m: Material, Hm: number, n = 200): [number, number][] {
  const k = loopK(m, Hm), out: [number, number][] = [];
  for (let i = 0; i < n; i++) { const H = Hm * Math.cos((Math.PI * i) / (n - 1)); out.push([H, loopB(m, k, H, true)]); }
  for (let i = 0; i < n; i++) { const H = -Hm * Math.cos((Math.PI * i) / (n - 1)); out.push([H, loopB(m, k, H, false)]); }
  return out;
}

/** Numerical ∮ H dB (shoelace formula over the polygon): energy lost per cycle per m³ (J/m³). */
export function polygonArea(pts: [number, number][]) {
  let s = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length];
    s += x1 * y2 - x2 * y1;
  }
  return Math.abs(s) / 2;
}

/** Exact area ∫(B_desc − B_asc) dH over [−Hm, Hm] for this model; tends to 4·Bs·Hc for a saturating loop. */
export function loopAreaExact(m: Material, Hm: number) {
  const k = loopK(m, Hm), F = (H: number) => m.a * (lncosh((H + m.Hc) / m.a) - lncosh((H - m.Hc) / m.a));
  return m.Bs * (F(Hm) - F(-Hm)) - 4 * m.Bs * k * Hm;
}

export interface Hysteresis {
  Hm: number; Bm: number; k: number;
  /** Retentivity (B at H = 0 on the way down) and coercivity (|H| where B = 0) of this loop. */
  Br: number; Hc: number;
  /** Loop area (J/m³ per cycle), energy per cycle in the whole core (J), hysteresis loss (W). */
  area: number; energy: number; P: number;
  /** Steinmetz coefficient that reproduces this loss: η = area / Bm^1.6. */
  eta: number;
}

/** hpk: peak H as a multiple of the material's saturating field; f in Hz; volume in cm³. */
export function hysteresis(id: MaterialId, hpk: number, f: number, volCm3: number, n = 400): Hysteresis {
  const m = MATERIALS[id], Hm = hpk * hSat(m), k = loopK(m, Hm);
  const Bm = loopB(m, k, Hm, true);
  const Br = loopB(m, k, 0, true);
  const Hc = Math.max(0, m.Hc - m.a * Math.atanh(Math.min(k, 0.999999999)));
  const area = polygonArea(loopPoints(m, Hm, n));
  const energy = area * volCm3 * 1e-6;
  return { Hm, Bm, k, Br, Hc, area, energy, P: energy * f, eta: area / Math.pow(Bm, 1.6) };
}

// ───────────────────────── Unit 3: single-phase transformer ─────────────────────────

export interface Transformer {
  ratio: number; V2: number; I2: number; I1: number;
  /** Peak core flux Φm = V1/(4.44 f N1) (Wb) and peak flux density Bm = Φm/A (T). */
  phim: number; Bm: number;
  P: number; kind: "step-up" | "step-down" | "isolation"; saturated: boolean;
}

/** Ideal transformer. A in cm². Saturation warning above ~1.6 T (typical silicon-steel knee). */
export function transformer(V1: number, N1: number, N2: number, f: number, RL: number, Acm2: number): Transformer {
  const V2 = (V1 * N2) / N1, I2 = V2 / RL, I1 = (I2 * N2) / N1;
  const phim = V1 / (4.44 * f * N1), Bm = phim / (Acm2 * 1e-4);
  return { ratio: N1 / N2, V2, I2, I1, phim, Bm, P: V2 * I2, kind: N2 > N1 ? "step-up" : N2 < N1 ? "step-down" : "isolation", saturated: Bm > 1.6 };
}

// ───────────────────────── Unit 4: rotating field & induction motor ─────────────────────────

/** Synchronous speed N_s = 120 f / P (rpm). */
export const syncSpeed = (f: number, P: number) => (120 * f) / P;

export interface Induction { Ns: number; N: number; fr: number; slipRpm: number }
/** s as a fraction (0.04 = 4 %). */
export function induction(f: number, P: number, s: number): Induction {
  const Ns = syncSpeed(f, P);
  return { Ns, N: Ns * (1 - s), fr: s * f, slipRpm: Ns * s };
}

/** Per-unit current of phase k (0 = R, 1 = Y, 2 = B): cos(ωt − k·120°). */
export const phaseCurrent = (k: number, wt: number) => Math.cos(wt - (k * TAU) / 3);
/** Electrical angle of phase k's coil axis; seq = +1 (R-Y-B) or −1 (two phases swapped). */
export const coilAxis = (k: number, seq: number) => (seq * k * TAU) / 3;

/** Resultant of the three pulsating phase fields (per unit of Bm) written into out = [x, y]. */
export function resultantInto(out: Float64Array | number[], wt: number, seq: number) {
  let x = 0, y = 0;
  for (let k = 0; k < 3; k++) { const i = phaseCurrent(k, wt), a = coilAxis(k, seq); x += i * Math.cos(a); y += i * Math.sin(a); }
  out[0] = x; out[1] = y;
  return out;
}

/** Air-gap flux density (per unit of Bm) at mechanical angle θ of a machine with pp pole pairs: 1.5 cos(pp·θ − seq·ωt). */
export function gapField(theta: number, pp: number, wt: number, seq: number) {
  let b = 0;
  for (let k = 0; k < 3; k++) b += phaseCurrent(k, wt) * Math.cos(pp * theta - coilAxis(k, seq));
  return b;
}
