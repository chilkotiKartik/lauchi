/**
 * Maths for the ECT-001 Basic Electronics labs (diode, BJT, MOSFET, op-amp, logic).
 * Pure functions only: no React, no three. SI units unless a name says otherwise.
 */

/* ───────────── shared helpers ───────────── */

/** Boltzmann constant (J/K) and electron charge (C), exact SI values. */
export const K_B = 1.380649e-23, Q_E = 1.602176634e-19;

const PREFIX: [number, string][] = [[1e9, "G"], [1e6, "M"], [1e3, "k"], [1, ""], [1e-3, "m"], [1e-6, "µ"], [1e-9, "n"], [1e-12, "p"], [1e-15, "f"]];
/** Engineering notation with an SI prefix and about 3 significant figures, e.g. eng(0.0123, "A") → "12.3 mA". */
export function eng(x: number, unit: string): string {
  if (Number.isNaN(x)) return `— ${unit}`;
  if (!Number.isFinite(x)) return `∞ ${unit}`;
  if (x === 0) return `0 ${unit}`;
  const a = Math.abs(x);
  let [s, p] = PREFIX[PREFIX.length - 1];
  for (const [sc, pr] of PREFIX) if (a >= sc * 0.9995) { s = sc; p = pr; break; }
  const v = x / s, av = Math.abs(v);
  const txt = v.toFixed(av >= 99.95 ? 0 : av >= 9.995 ? 1 : 2);
  return `${txt.replace("-", "−")} ${p}${unit}`;
}

/** Small deterministic PRNG (mulberry32) so scenes never call Math.random during render. */
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

/** Root of an increasing function g on [lo, hi] by bisection (g(lo) ≤ 0 ≤ g(hi)). */
export function bisect(g: (x: number) => number, lo: number, hi: number, iters = 200): number {
  for (let i = 0; i < iters && hi - lo > 1e-15; i++) {
    const m = (lo + hi) / 2;
    if (g(m) > 0) hi = m; else lo = m;
  }
  return (lo + hi) / 2;
}

/* ───────────── 1. junction diode ───────────── */

/** Thermal voltage V_T = kT/q (volts) at absolute temperature T (kelvin). 300 K → 25.85 mV. */
export const thermalVoltage = (T: number) => (K_B * T) / Q_E;

export type DiodeMaterial = "si" | "ge";
/** Reverse saturation current at 300 K (A): typical small-signal values. */
export const IS_300: Record<DiodeMaterial, number> = { si: 1e-12, ge: 1e-6 };
/** I_S(T): rule of thumb — it roughly doubles for every 10 K rise. */
export const saturationCurrent = (mat: DiodeMaterial, T: number) => IS_300[mat] * 2 ** ((T - 300) / 10);

/** Zener (breakdown) resistance used for the steep breakdown line, ohms. */
export const R_ZENER = 5;

export interface DiodeModel { Is: number; n: number; VT: number; Vz: number; Rz: number }
export function diodeModel(mat: DiodeMaterial, T: number, n: number, Vz: number, Rz = R_ZENER): DiodeModel {
  return { Is: saturationCurrent(mat, T), n, VT: thermalVoltage(T), Vz, Rz };
}

/** Diode current (A) at voltage V: Shockley I_S(e^{V/nV_T} − 1), plus a steep line (V + V_z)/R_z below −V_z. */
export function diodeCurrent(V: number, d: DiodeModel): number {
  const x = Math.min(V / (d.n * d.VT), 80); // cap only stops overflow far outside any operating point
  let I = d.Is * Math.expm1(x);
  if (V < -d.Vz) I += (V + d.Vz) / d.Rz;
  return I;
}
/** dI/dV (siemens). Its reciprocal is the dynamic (small-signal) resistance r_d = nV_T/(I + I_S) away from breakdown. */
export function diodeSlope(V: number, d: DiodeModel): number {
  const x = Math.min(V / (d.n * d.VT), 80);
  return (d.Is / (d.n * d.VT)) * Math.exp(x) + (V < -d.Vz ? 1 / d.Rz : 0);
}
/** Inverse of the forward Shockley branch: the voltage that gives current I > 0. */
export const diodeVoltageFor = (I: number, d: DiodeModel) => d.n * d.VT * Math.log1p(I / d.Is);

export type DiodeRegion = "forward" | "reverse" | "breakdown" | "unbiased";
/**
 * Q point of a source V_s in series with R and the diode: solves V_s = I·R + V_D with I = f(V_D).
 * The root lies between 0 and V_s because f is increasing and f(0) = 0.
 */
export function diodeQ(Vs: number, R: number, d: DiodeModel) {
  const V = Vs === 0 ? 0 : bisect((v) => diodeCurrent(v, d) - (Vs - v) / R, Math.min(0, Vs), Math.max(0, Vs));
  const I = (Vs - V) / R;
  const region: DiodeRegion = Vs === 0 ? "unbiased" : V <= -d.Vz ? "breakdown" : V > 0 ? "forward" : "reverse";
  return { V, I, P: V * I, rd: 1 / diodeSlope(V, d), region };
}

/* ───────────── 2. BJT, fixed bias, common emitter ───────────── */

export const VBE_ON = 0.7, VCE_SAT = 0.2;
export type BjtRegion = "cut-off" | "active" | "saturation";

/**
 * Fixed bias: R_B from V_CC to the base, R_C from V_CC to the collector, emitter grounded.
 * I_B = (V_CC − 0.7)/R_B, I_C = βI_B (active) limited to (V_CC − 0.2)/R_C (saturation).
 * With a finite Early voltage V_A, I_C = βI_B(1 + V_CE/V_A) solved together with the load line.
 */
export function fixedBias(VCC: number, RB: number, RC: number, beta: number, VA = Infinity) {
  const IB = Math.max(0, (VCC - VBE_ON) / RB);
  const ICsat = Math.max(0, (VCC - VCE_SAT) / RC);
  const a = beta * IB;
  const ICact = Number.isFinite(VA) ? (a * (1 + VCC / VA)) / (1 + (a * RC) / VA) : a;
  let IC: number, region: BjtRegion;
  if (IB <= 0) { IC = 0; region = "cut-off"; }
  else if (ICact >= ICsat) { IC = ICsat; region = "saturation"; }
  else { IC = ICact; region = "active"; }
  return { IB, IC, VCE: VCC - IC * RC, IE: IB + IC, ICsat, region, S: 1 + beta };
}

/** One output characteristic I_C(V_CE) for base current I_B (smooth saturation knee below ~0.2 V, Early slope 1/V_A). */
export function bjtOutputCurve(VCE: number, IB: number, beta: number, VA = Infinity): number {
  const early = Number.isFinite(VA) ? 1 + VCE / VA : 1;
  return beta * IB * early * (1 - Math.exp(-VCE / 0.05));
}

/* ───────────── 3. enhancement n-MOSFET (square law) ───────────── */

export type MosRegion = "cut-off" | "triode" | "saturation";
/**
 * Square-law n-MOSFET. k (A/V²) is k′W/L. Cut-off V_GS ≤ V_t; triode V_DS < V_GS − V_t:
 * I_D = k[(V_GS − V_t)V_DS − V_DS²/2]; saturation I_D = (k/2)(V_GS − V_t)².
 * Both carry the (1 + λV_DS) factor so the curves join smoothly at pinch-off (as in SPICE level 1).
 */
export function nmos(VGS: number, VDS: number, Vt: number, k: number, lambda: number) {
  const Vov = VGS - Vt, cl = 1 + lambda * VDS;
  if (Vov <= 0) return { region: "cut-off" as MosRegion, ID: 0, gm: 0, gds: 0, ro: Infinity, Vov, VDSsat: 0 };
  let ID: number, gm: number, gds: number, region: MosRegion;
  if (VDS < Vov) {
    const base = k * (Vov * VDS - (VDS * VDS) / 2);
    ID = base * cl; gm = k * VDS * cl; gds = k * (Vov - VDS) * cl + base * lambda; region = "triode";
  } else {
    const base = (k / 2) * Vov * Vov;
    ID = base * cl; gm = k * Vov * cl; gds = base * lambda; region = "saturation";
  }
  // saturation: r_o = 1/(λI_D) (≈ 1/g_ds); triode: the channel resistance 1/g_ds
  const ro = region === "saturation" ? (lambda > 0 ? 1 / (lambda * ID) : Infinity) : 1 / gds;
  return { region, ID, gm, gds, ro, Vov, VDSsat: Vov };
}

/**
 * Relative inversion-layer thickness at u = x/L along the channel (1 at the source), from the gradual-channel
 * model: charge ∝ V_ov − V(x), which gives √(1 − u(2V_ov·V_e − V_e²)/V_ov²) with V_e = min(V_DS, V_ov).
 * In saturation it falls to 0 at the drain end: pinch-off.
 */
export function channelProfile(u: number, Vov: number, VDS: number): number {
  if (Vov <= 0) return 0;
  const Ve = Math.min(Math.max(VDS, 0), Vov);
  return Math.sqrt(Math.max(0, 1 - (u * (2 * Vov * Ve - Ve * Ve)) / (Vov * Vov)));
}

/* ───────────── 4. op-amp amplifiers (ideal op-amp, output clips at ±V_sat) ───────────── */

export type OpMode = "inv" | "noninv" | "follower" | "summing" | "integrator";
export interface OpAmpCfg { mode: OpMode; A: number; f: number; Rin: number; Rf: number; C: number; V2: number; Vsat: number }

/** Closed-loop gain magnitude/sign and phase (degrees) of output relative to the sine input. */
export function opampGain(c: OpAmpCfg): { gain: number; phase: number } {
  switch (c.mode) {
    case "inv": case "summing": return { gain: -c.Rf / c.Rin, phase: 180 };
    case "noninv": return { gain: 1 + c.Rf / c.Rin, phase: 0 };
    case "follower": return { gain: 1, phase: 0 };
    case "integrator": return { gain: 1 / (2 * Math.PI * c.f * c.Rin * c.C), phase: 90 }; // −1/(jωRC) = +j/(ωRC)
  }
}

/** Input (v1) at phase θ = ωt. */
export const opampIn = (c: OpAmpCfg, th: number) => c.A * Math.sin(th);
/** Ideal (unclipped) output at phase θ = ωt, steady state. */
export function opampIdeal(c: OpAmpCfg, th: number): number {
  const v = c.A * Math.sin(th);
  switch (c.mode) {
    case "inv": return (-c.Rf / c.Rin) * v;
    case "noninv": return (1 + c.Rf / c.Rin) * v;
    case "follower": return v;
    case "summing": return (-c.Rf / c.Rin) * (v + c.V2);
    case "integrator": return (c.A / (2 * Math.PI * c.f * c.Rin * c.C)) * Math.cos(th); // −(1/RC)∫A sin ωt dt
  }
}
/** Actual output: the ideal output limited to the rails ±V_sat. */
export const opampOut = (c: OpAmpCfg, th: number) => Math.max(-c.Vsat, Math.min(c.Vsat, opampIdeal(c, th)));

export function opamp(c: OpAmpCfg) {
  const { gain, phase } = opampGain(c);
  const idealPeak = c.mode === "summing" ? Math.abs(gain) * (c.A + Math.abs(c.V2)) : Math.abs(gain) * c.A;
  const outPeak = Math.min(idealPeak, c.Vsat);
  return { gain, phase, idealPeak, outPeak, clipped: idealPeak > c.Vsat + 1e-9, virtualGround: c.mode === "inv" || c.mode === "summing" || c.mode === "integrator" };
}

/* ───────────── 5. logic gates & number systems ───────────── */

export type Gate = "and" | "or" | "not" | "nand" | "nor" | "xor" | "xnor";
export const GATES: Gate[] = ["and", "or", "not", "nand", "nor", "xor", "xnor"];
export function gate(g: Gate, a: boolean, b: boolean): boolean {
  switch (g) {
    case "and": return a && b;
    case "or": return a || b;
    case "not": return !a;
    case "nand": return !(a && b);
    case "nor": return !(a || b);
    case "xor": return a !== b;
    case "xnor": return a === b;
  }
}
export const GATE_EXPR: Record<Gate, string> = {
  and: "Y = A·B", or: "Y = A + B", not: "Y = A′", nand: "Y = (A·B)′", nor: "Y = (A + B)′", xor: "Y = A ⊕ B = A′B + AB′", xnor: "Y = (A ⊕ B)′ = AB + A′B′",
};
export const inputsOf = (g: Gate) => (g === "not" ? 1 : 2);
/** Rows of the truth table in counting order (A is the more significant input). */
export function truthTable(g: Gate): { a: boolean; b: boolean; y: boolean }[] {
  const rows: { a: boolean; b: boolean; y: boolean }[] = [];
  if (g === "not") for (const a of [false, true]) rows.push({ a, b: false, y: gate(g, a, false) });
  else for (const a of [false, true]) for (const b of [false, true]) rows.push({ a, b, y: gate(g, a, b) });
  return rows;
}
export const rowIndex = (g: Gate, a: boolean, b: boolean) => (g === "not" ? Number(a) : Number(a) * 2 + Number(b));
/** NAND and NOR alone can build every other gate. */
export const UNIVERSAL: Gate[] = ["nand", "nor"];

/** Non-negative integer n in base 2, 8 or 16 (upper-case), zero-padded to `width` digits. */
export const toBase = (n: number, base: number, width = 1) => Math.floor(n).toString(base).toUpperCase().padStart(width, "0");
/** 8-bit binary grouped into nibbles: 173 → "1010 1101". */
export const byteString = (n: number) => { const s = toBase(n, 2, 8); return `${s.slice(0, 4)} ${s.slice(4)}`; };
/** Binary-coded decimal: each decimal digit as 4 bits, 173 → "0001 0111 0011". */
export const toBcd = (n: number) => String(Math.floor(n)).split("").map((d) => Number(d).toString(2).padStart(4, "0")).join(" ");
/** Bit i (0 = LSB) of n. */
export const bit = (n: number, i: number) => ((Math.floor(n) >> i) & 1) === 1;
