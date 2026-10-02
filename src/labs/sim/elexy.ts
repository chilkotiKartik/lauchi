/**
 * Maths for the round-3 ECT-001 Basic Electronics labs (group elexy).
 * Pure functions only: no React, no three. Units are given in every name or comment
 * (circuit labs use the exam-friendly V, mA, kΩ, µs set: V = mA × kΩ).
 */

/* ───────────── shared helpers ───────────── */

/** Thermal voltage kT/q at 300 K (V). */
export const VT = 0.025852;

const PREFIX: [number, string][] = [[1e9, "G"], [1e6, "M"], [1e3, "k"], [1, ""], [1e-3, "m"], [1e-6, "µ"], [1e-9, "n"], [1e-12, "p"]];
/** Engineering notation with an SI prefix and about 3 significant figures: si(0.0123, "A") → "12.3 mA". */
export function si(x: number, unit: string): string {
  if (Number.isNaN(x)) return `— ${unit}`;
  if (!Number.isFinite(x)) return `${x < 0 ? "−" : ""}∞ ${unit}`;
  if (x === 0) return `0 ${unit}`;
  const a = Math.abs(x);
  let [s, p] = PREFIX[PREFIX.length - 1];
  for (const [sc, pr] of PREFIX) if (a >= sc * 0.9995) { s = sc; p = pr; break; }
  const v = x / s, av = Math.abs(v);
  return `${v.toFixed(av >= 99.95 ? 0 : av >= 9.995 ? 1 : 2).replace("-", "−")} ${p}${unit}`;
}
/** Parallel combination; Infinity entries (open circuits) are ignored. */
export function par(...r: number[]): number {
  let g = 0;
  for (const x of r) if (Number.isFinite(x)) { if (x <= 0) return 0; g += 1 / x; }
  return g === 0 ? Infinity : 1 / g;
}
/** Root of a decreasing-then-crossing function on [lo, hi] (g(lo) ≥ 0 ≥ g(hi)) by bisection. */
function bisectDown(g: (x: number) => number, lo: number, hi: number) {
  for (let i = 0; i < 200 && hi - lo > 1e-13; i++) { const m = (lo + hi) / 2; if (g(m) > 0) lo = m; else hi = m; }
  return (lo + hi) / 2;
}
const sq = (x: number) => x * x;

/* ───────────── U1: tunnel, Schottky and p–n diodes ───────────── */

export type TunnelMat = "ge" | "gaas";
/** Peak voltage V_p and the diffusion saturation current per mA of peak current, for a Ge or GaAs tunnel diode. */
export const TUNNEL: Record<TunnelMat, { Vp: number; IsPerIp: number; label: string }> = {
  ge: { Vp: 0.065, IsPerIp: 1e-10, label: "Germanium" },
  gaas: { Vp: 0.1, IsPerIp: 1e-14, label: "Gallium arsenide" },
};
/**
 * Tunnel diode current (A) at bias V (V): an empirical band-to-band tunnelling term I_p(V/V_p)e^(1 − V/V_p)
 * (which peaks at exactly I_p when V = V_p) plus the ordinary diffusion current I_s(e^(V/V_T) − 1).
 * In reverse the tunnelling term continues as a straight line (a tunnel diode conducts freely in reverse).
 */
export function tunnelI(V: number, IpA: number, mat: TunnelMat): number {
  const { Vp, IsPerIp } = TUNNEL[mat];
  const it = V >= 0 ? IpA * (V / Vp) * Math.exp(1 - V / Vp) : (IpA * Math.E * V) / Vp;
  return it + IsPerIp * IpA * 1e3 * (Math.exp(Math.min(V, 1.2) / VT) - 1);
}
/** Slope dI/dV (S) of the tunnel diode by central difference. */
export const tunnelG = (V: number, IpA: number, mat: TunnelMat) => (tunnelI(V + 1e-5, IpA, mat) - tunnelI(V - 1e-5, IpA, mat)) / 2e-5;
/** Peak and valley points of a tunnel diode (found by scanning the slope). */
export function tunnelPV(IpA: number, mat: TunnelMat) {
  let Vv = TUNNEL[mat].Vp;
  for (let V = TUNNEL[mat].Vp * 1.05; V < 1; V += 5e-4) if (tunnelG(V, IpA, mat) >= 0) { Vv = V; break; }
  const Vp = TUNNEL[mat].Vp, Ipk = tunnelI(Vp, IpA, mat), Iv = tunnelI(Vv, IpA, mat);
  return { Vp, Ipk, Vv, Iv, pvr: Ipk / Iv };
}
export function tunnelRegion(V: number, IpA: number, mat: TunnelMat): string {
  const { Vp, Vv } = tunnelPV(IpA, mat);
  if (V < 0) return "reverse: tunnels freely";
  if (V < Vp) return "tunnelling current rising";
  if (V < Vv) return "negative resistance";
  return "normal diode (diffusion)";
}
/** Saturation current (A) of a Schottky diode of area 10⁻⁴ cm² with barrier φ_B (eV): I_s = A**·A·T²·e^(−φ_B/V_T), A** = 120 A cm⁻² K⁻². */
export const schottkyIs = (phiB: number) => 120 * 1e-4 * 300 * 300 * Math.exp(-phiB / VT);
export const SCHOTTKY_N = 1.05;
/** Schottky diode current (A). */
export const schottkyI = (V: number, phiB: number) => schottkyIs(phiB) * (Math.exp(Math.min(V, 1.2) / (SCHOTTKY_N * VT)) - 1);
/** Silicon p–n diode current (A), I_s = 10⁻¹² A. */
export const PN_IS = 1e-12;
export const pnI = (V: number) => PN_IS * (Math.exp(Math.min(V, 1.2) / VT) - 1);
/** Forward voltage (V) at which a diode with saturation current Is and ideality n carries I (A). */
export const vAt = (I: number, Is: number, n = 1) => n * VT * Math.log(I / Is + 1);

/* ───────────── U2: voltage multipliers ───────────── */

/**
 * Half-wave (Cockcroft–Walton) voltage multiplier of order n (2 = doubler, 3 = tripler, 4 = quadrupler) fed with a sine of peak Vm (V).
 * No-load output n(Vm − V_D). With a load current I the output sags by (I/fC)(n³/12 + n²/8 − n/12) and ripples by (I/fC)·n(n + 2)/8
 * (the classic CW result with N = n/2 stages; for a doubler both are I/fC). Every diode and every capacitor except the first sees 2Vm.
 */
export function multiplier(n: number, Vm: number, VD: number, f: number, CuF: number, ILmA: number) {
  const N = Math.round(n), k = (ILmA / 1000) / (f * CuF * 1e-6);
  const Vnl = N * Math.max(0, Vm - VD);
  const drop = k * (N ** 3 / 12 + N ** 2 / 8 - N / 12);
  const ripple = k * (N * (N + 2)) / 8;
  const Vout = Math.max(0, Vnl - drop);
  return { n: N, Vnl, drop, ripple, Vout, PIV: 2 * Vm, reg: Vout > 0 ? (drop / Vout) * 100 : Infinity, name: ["", "", "doubler", "tripler", "quadrupler"][N] ?? `×${N}` };
}

/* ───────────── U2: bridge vs centre-tap full-wave rectifier ───────────── */

export type FwTopo = "bridge" | "ct";
/**
 * Full-wave rectifier with peak voltage Vm across the conducting half (V), load RL (Ω), diode forward resistance rd (Ω) and cut-in Vγ (V).
 * A bridge has two diodes in the current path, a centre-tap one.
 */
export function fullWave(topo: FwTopo, Vm: number, RL: number, rd: number, Vg: number) {
  const nd = topo === "bridge" ? 2 : 1;
  const Im = Math.max(0, Vm - nd * Vg) / (nd * rd + RL);
  const Idc = (2 * Im) / Math.PI, Irms = Im / Math.SQRT2, Vdc = Idc * RL;
  const eta = Im > 0 ? (sq(Idc) * RL) / (sq(Irms) * (RL + nd * rd)) : 0;
  const ripple = Im > 0 ? Math.sqrt(sq(Irms / Idc) - 1) : 0;
  return { nd, Im, Idc, Irms, Vdc, eta, ripple, PIV: topo === "bridge" ? Vm : 2 * Vm, TUF: topo === "bridge" ? 0.812 : 0.693, diodes: topo === "bridge" ? 4 : 2 };
}

/* ───────────── U3: BJT configurations and current gains ───────────── */

export const alphaOf = (beta: number) => beta / (1 + beta);
export const betaOf = (alpha: number) => alpha / (1 - alpha);
/** CE currents (mA) from β, base current I_B (mA) and leakage I_CEO (mA): I_C = βI_B + I_CEO, I_E = I_C + I_B. */
export function bjtCurrents(beta: number, IBmA: number, ICEOmA: number) {
  const IC = beta * IBmA + ICEOmA;
  return { IC, IE: IC + IBmA, ICBO: ICEOmA / (1 + beta), alpha: alphaOf(beta), gamma: 1 + beta };
}
const IS_BJT = 1.75e-12; // mA: gives I_C ≈ 1 mA at V_BE = 0.7 V
/** CE input characteristic: I_B (mA) against V_BE (V); a larger V_CE moves the curve right (base-width modulation, exaggerated). */
export const ceInput = (VBE: number, VCE: number, beta: number) => (IS_BJT / beta) * (Math.exp(Math.min(VBE, 1) / VT) - 1) * (1 + 1.5 * Math.exp(-VCE / 0.15));
/** V_BE (V) that gives base current IB (mA) at a given V_CE. */
export const vbeFor = (IB: number, VCE: number, beta: number) => VT * Math.log((IB * beta) / (IS_BJT * (1 + 1.5 * Math.exp(-VCE / 0.15))) + 1);
/** CE output characteristic: I_C (mA) against V_CE (V) for base current IB (mA); V_A = 150 V. */
export const ceOutput = (VCE: number, IB: number, beta: number, ICEO: number) => (beta * IB + ICEO) * (1 - Math.exp(-Math.max(0, VCE) / 0.08)) * (1 + Math.max(0, VCE) / 150);
/** CB input characteristic: I_E (mA) against V_EB (V); a larger V_CB moves the curve left (Early effect, exaggerated). */
export const cbInput = (VEB: number, VCB: number, alpha: number) => (IS_BJT / (1 - alpha * 0.999)) * 1e-2 * (Math.exp(Math.min(VEB, 1) / VT) - 1) * (1 + Math.max(0, VCB) / 10);
export const vebFor = (IE: number, VCB: number, alpha: number) => VT * Math.log(IE / ((IS_BJT / (1 - alpha * 0.999)) * 1e-2 * (1 + Math.max(0, VCB) / 10)) + 1);
/** CB output characteristic: I_C = αI_E + I_CBO for V_CB ≥ 0, falling to zero once the collector junction is forward-biased (V_CB ≈ −0.6 V). */
export const cbOutput = (VCB: number, IE: number, alpha: number, ICBO: number) => Math.max(0, alpha * IE + ICBO - 1e-10 * (Math.exp(Math.min(-VCB, 1) / VT) - 1));

export type BjtCfg = "cb" | "ce" | "cc";
export function bjtRegion(cfg: BjtCfg, Vout: number, Iin: number): string {
  if (Iin <= 0) return "cut-off";
  if (cfg === "cb") return Vout < 0 ? "saturation" : "active";
  return Vout < 0.2 ? "saturation" : "active";
}

/* ───────────── U3: h-parameter amplifier (CE and CC) ───────────── */

export type HSet = { hi: number; hr: number; hf: number; ho: number };
/** CE → CC h-parameters: h_ic = h_ie, h_rc = 1 − h_re ≈ 1, h_fc = −(1 + h_fe), h_oc = h_oe. */
export const ceToCc = (h: HSet): HSet => ({ hi: h.hi, hr: 1 - h.hr, hf: -(1 + h.hf), ho: h.ho });
/**
 * Exact low-frequency h-parameter analysis of one stage (Ω, S): A_i = −h_f/(1 + h_o R_L), R_i = h_i + h_r A_i R_L, A_v = A_i R_L / R_i,
 * A_vs = A_v R_i/(R_i + R_s), Y_o = h_o − h_f h_r/(h_i + R_s), R_o = 1/Y_o.
 */
export function hAmp(h: HSet, RL: number, Rs: number) {
  const Ai = -h.hf / (1 + h.ho * RL);
  const Ri = h.hi + h.hr * Ai * RL;
  const Av = (Ai * RL) / Ri;
  const Avs = (Av * Ri) / (Ri + Rs);
  const Yo = h.ho - (h.hf * h.hr) / (h.hi + Rs);
  return { Ai, Ri, Av, Avs, Ro: Yo > 1e-15 ? 1 / Yo : Infinity, Ap: Math.abs(Ai * Av) };
}

/* ───────────── U3: DC and AC load lines ───────────── */

/**
 * CE amplifier with R_E bypassed (V, kΩ, mA). DC load line V_CE = V_CC − I_C(R_C + R_E); AC load line through Q with slope −1/r_ac, r_ac = R_C‖R_L.
 * Ideal maximum symmetrical swing (p-p) = 2·min(V_CEQ, I_CQ r_ac); the swing is largest when I_CQ = V_CC/(r_dc + r_ac).
 */
export function acLoad(VCC: number, RC: number, RE: number, RL: number, ICQ: number) {
  const rdc = RC + RE, rac = par(RC, RL);
  const IC = Math.min(Math.max(0, ICQ), VCC / rdc), VCEQ = VCC - IC * rdc;
  const vceOff = VCEQ + IC * rac, icSat = IC + VCEQ / rac;
  const swing = 2 * Math.min(VCEQ, IC * rac);
  return { rdc, rac, IC, VCEQ, vceOff, icSat, swing, limit: VCEQ < IC * rac ? "saturation" : "cut-off", ICopt: VCC / (rdc + rac), icDcSat: VCC / rdc };
}
/** Instantaneous collector current and V_CE (mA, V) for a sinusoidal collector-current drive of peak ip (mA) at phase th, clipped by cut-off and saturation. */
export function acPoint(L: ReturnType<typeof acLoad>, ip: number, th: number): [number, number] {
  const ic = Math.min(L.icSat, Math.max(0, L.IC + ip * Math.sin(th)));
  return [Math.max(0, L.VCEQ - (ic - L.IC) * L.rac), ic];
}

/* ───────────── U4: depletion and enhancement MOSFETs ───────────── */

export type MosType = "enh" | "dep";
/**
 * n-channel MOSFET (V, mA). Enhancement: I_D = k(V_GS − V_T)² in saturation (k in mA/V²).
 * Depletion: Shockley I_D = I_DSS(1 − V_GS/V_P)², valid for negative (depletion mode) and positive (enhancement mode) V_GS.
 * Triode below V_DS(sat) = V_GS − V_th: I_D = k[2(V_GS − V_th)V_DS − V_DS²].
 */
export function mos(type: MosType, VGS: number, VDS: number, VT: number, k: number, IDSS: number, VP: number) {
  const vth = type === "enh" ? VT : VP, kk = type === "enh" ? k : IDSS / (VP * VP);
  const vov = VGS - vth;
  if (vov <= 0) return { ID: 0, region: "cut-off (no channel)", gm: 0, vth, vov: 0, VDSsat: 0, kk };
  const VDSsat = vov, sat = VDS >= VDSsat;
  const ID = sat ? kk * vov * vov : kk * (2 * vov * VDS - VDS * VDS);
  return { ID, region: sat ? "saturation (pinched off)" : "ohmic / triode", gm: sat ? 2 * kk * vov : 2 * kk * VDS, vth, vov, VDSsat, kk };
}
/** Transfer characteristic I_D(V_GS) in saturation (mA). */
export const mosTransfer = (type: MosType, VGS: number, VT: number, k: number, IDSS: number, VP: number) => (type === "enh" ? (VGS > VT ? k * sq(VGS - VT) : 0) : VGS > VP ? IDSS * sq(1 - VGS / VP) : 0);
export function mosMode(type: MosType, VGS: number, VT: number, VP: number): string {
  if (type === "enh") return VGS > VT ? "enhancement: channel induced" : "below threshold: no channel";
  if (VGS <= VP) return "fully depleted: cut-off";
  return VGS < 0 ? "depletion mode" : VGS > 0 ? "enhancement mode" : "V_GS = 0: I_D = I_DSS";
}

/* ───────────── U4: JFET bias (fixed, self, voltage divider) ───────────── */

export type JBias = "fixed" | "self" | "divider";
/**
 * Q point of an n-channel JFET (V, mA, kΩ; R1, R2 in MΩ). Gate voltage V_G = −V_GG (fixed), 0 (self) or V_DD R2/(R1 + R2) (divider);
 * bias line V_GS = V_G − I_D R_S (R_S = 0 for fixed bias); Shockley I_D = I_DSS(1 − V_GS/V_P)². The root with V_P ≤ V_GS is returned.
 */
export function jfetBias(mode: JBias, VDD: number, RD: number, RS: number, VGG: number, R1: number, R2: number, IDSS: number, VP: number) {
  const VG = mode === "fixed" ? -VGG : mode === "divider" ? (VDD * R2) / (R1 + R2) : 0;
  const Rs = mode === "fixed" ? 0 : RS;
  const u = (id: number) => 1 - (VG - id * Rs) / VP;
  const shock = (id: number) => { const x = u(id); return x > 0 ? IDSS * x * x : 0; };
  let ID: number;
  if (Rs <= 0) ID = shock(0);
  else {
    // u(id) falls as id rises (VP < 0); the curve and the bias line cross once in [0, id where u = 0].
    const hi = (VG - VP) / Rs;
    ID = hi <= 0 ? 0 : bisectDown((id) => shock(id) - id, 0, hi);
  }
  const VGS = VG - ID * Rs, VDS = VDD - ID * (RD + Rs);
  const gm0 = (2 * IDSS) / Math.abs(VP), gm = VGS > VP ? gm0 * (1 - VGS / VP) : 0;
  const status = ID <= 0 ? "cut-off (V_GS ≤ V_P)" : VGS > 0 ? "gate forward-biased: avoid" : VDS < 0.05 ? "starved: V_DS ≈ 0" : VDS >= VGS - VP ? "saturation: good amplifier" : "ohmic: Q point too low";
  return { VG, VGS, ID, VDS, VS: ID * Rs, VD: VDD - ID * RD, gm0, gm, status };
}
/** Bias-line current (mA) at a given V_GS for the transfer-curve plot (NaN where the line has no current, e.g. fixed bias). */
export const biasLineI = (VG: number, RS: number, VGS: number) => (RS > 0 ? (VG - VGS) / RS : NaN);

/* ───────────── U4: FET small-signal amplifiers (CS, CD, CG) ───────────── */

export type FetCfg = "cs" | "cd" | "cg";
/** Gains and impedances (gm in mS, resistances in kΩ, RG in MΩ). RL = Infinity means no load. */
export function fetAmp(cfg: FetCfg, gm: number, rd: number, RD: number, RS: number, RL: number, RG: number) {
  if (cfg === "cs") {
    const Rp = par(rd, RD, RL);
    return { Av: -gm * Rp, Zi: RG * 1000, Zo: par(RD, rd), phase: 180 };
  }
  if (cfg === "cd") {
    const Rp = par(RS, RL, rd);
    return { Av: (gm * Rp) / (1 + gm * Rp), Zi: RG * 1000, Zo: par(RS, rd, 1 / gm), phase: 0 };
  }
  const Rp = par(RD, RL);
  return { Av: (gm * Rp + Rp / rd) / (1 + Rp / rd), Zi: par(RS, (rd + Rp) / (1 + gm * rd)), Zo: par(RD, rd), phase: 0 };
}
/** g_m of a JFET at V_GS (mS): g_m = (2I_DSS/|V_P|)(1 − V_GS/V_P). */
export const jfetGm = (IDSS: number, VP: number, VGS: number) => ((2 * IDSS) / Math.abs(VP)) * Math.max(0, 1 - VGS / VP);

/* ───────────── U5: universal gates ───────────── */

export type UBase = "nand" | "nor";
export type UTarget = "not" | "and" | "or" | "nand" | "nor" | "xor" | "xnor";
/** A gate input: "A", "B" or the output of an earlier gate (its index). */
export type USrc = "A" | "B" | number;
export type UNet = USrc[][];
const DUAL: UNet = [["A", "B"]], NOT1: UNet = [["A", "A"]], NOT_NEXT = (net: UNet): UNet => [...net, [net.length - 1, net.length - 1]];
const ORLIKE: UNet = [["A", "A"], ["B", "B"], [0, 1]];
const XLIKE: UNet = [["A", "B"], ["A", 0], ["B", 0], [1, 2]];
/** Standard realisations with NAND only and NOR only (the last gate is the output). */
export const UNETS: Record<UBase, Record<UTarget, UNet>> = {
  nand: { not: NOT1, nand: DUAL, and: NOT_NEXT(DUAL), or: ORLIKE, nor: NOT_NEXT(ORLIKE), xor: XLIKE, xnor: NOT_NEXT(XLIKE) },
  nor: { not: NOT1, nor: DUAL, or: NOT_NEXT(DUAL), and: ORLIKE, nand: NOT_NEXT(ORLIKE), xnor: XLIKE, xor: NOT_NEXT(XLIKE) },
};
export function gateFn(g: UTarget, a: boolean, b: boolean): boolean {
  switch (g) {
    case "not": return !a;
    case "and": return a && b;
    case "or": return a || b;
    case "nand": return !(a && b);
    case "nor": return !(a || b);
    case "xor": return a !== b;
    default: return a === b;
  }
}
/** Output of every gate in the network for inputs a, b. */
export function evalNet(base: UBase, net: UNet, a: boolean, b: boolean): boolean[] {
  const out: boolean[] = [];
  const val = (s: USrc) => (s === "A" ? a : s === "B" ? b : out[s]);
  for (const [x, y] of net) out.push(base === "nand" ? !(val(x) && val(y)) : !(val(x) || val(y)));
  return out;
}
/** Logic level of every gate (1 = fed only by inputs). The last entry is the network depth. */
export function levels(net: UNet): number[] {
  const lv: number[] = [];
  for (const g of net) lv.push(1 + Math.max(...g.map((s) => (typeof s === "number" ? lv[s] : 0))));
  return lv;
}
export const U_EXPR: Record<UBase, Record<UTarget, string>> = {
  nand: { not: "Y = (A·A)′ = A′", nand: "Y = (A·B)′", and: "Y = ((A·B)′)′ = A·B", or: "Y = (A′·B′)′ = A + B (De Morgan)", nor: "Y = ((A′·B′)′)′ = (A + B)′", xor: "Y = ((A·(AB)′)′·(B·(AB)′)′)′ = A⊕B", xnor: "Y = (A⊕B)′" },
  nor: { not: "Y = (A + A)′ = A′", nor: "Y = (A + B)′", or: "Y = ((A + B)′)′ = A + B", and: "Y = (A′ + B′)′ = A·B (De Morgan)", nand: "Y = ((A′ + B′)′)′ = (A·B)′", xnor: "Y = ((A + (A+B)′)′ + (B + (A+B)′)′)′ = A⊙B", xor: "Y = (A⊙B)′ = A⊕B" },
};

/* ───────────── U5: number systems ───────────── */

const DIG = "0123456789ABCDEF";
/** Fraction (0 ≤ f < 1) to base b by repeated multiplication: digits and whether it terminated within maxDigits. */
export function fracDigits(f: number, base: number, maxDigits = 8): { digits: string; exact: boolean } {
  let x = f, s = "";
  for (let i = 0; i < maxDigits && x > 1e-12; i++) { x *= base; const d = Math.floor(x + 1e-9); s += DIG[Math.min(base - 1, d)]; x = Math.max(0, x - d); }
  return { digits: s, exact: x <= 1e-9 };
}
/** n (integer) + f (fraction) written in base b, e.g. toBase(229, 0.225, 16) = "E5.3999…". */
export function toBase(n: number, f: number, base: number, maxDigits = 8): string {
  const i = Math.floor(n).toString(base).toUpperCase();
  if (f <= 1e-12) return i;
  const { digits, exact } = fracDigits(f, base, maxDigits);
  return `${i}.${digits}${exact ? "" : "…"}`;
}
/** Repeated-division steps for the integer part: [quotient, remainder] pairs (read remainders bottom-up). */
export function divSteps(n: number, base: number): [number, number][] {
  const out: [number, number][] = [];
  let q = Math.floor(n);
  if (q === 0) return [[0, 0]];
  while (q > 0) { out.push([Math.floor(q / base), q % base]); q = Math.floor(q / base); }
  return out;
}
/** Value of a digit string in base b (with optional fraction): Σ dᵢ bⁱ. */
export function fromBase(s: string, base: number): number {
  const [ip, fp = ""] = s.toUpperCase().split(".");
  let v = 0;
  for (const c of ip) v = v * base + DIG.indexOf(c);
  for (let i = 0; i < fp.length; i++) v += DIG.indexOf(fp[i]) * base ** -(i + 1);
  return v;
}
/** 1's and 2's complement of an integer in `bits` bits (as binary strings). */
export function complements(n: number, bits: number) {
  const m = 2 ** bits, v = Math.floor(n) % m;
  return { ones: ((m - 1) ^ v).toString(2).padStart(bits, "0"), twos: ((m - v) % m).toString(2).padStart(bits, "0") };
}
/** Binary digits of n (integer part, `ib` bits) and its fraction (`fb` bits, truncated), most significant first. */
export function bitRow(n: number, f: number, ib: number, fb: number): number[] {
  const out: number[] = [];
  for (let i = ib - 1; i >= 0; i--) out.push((Math.floor(n) >> i) & 1);
  let x = f;
  for (let i = 0; i < fb; i++) { x *= 2; const d = x >= 1 - 1e-12 ? 1 : 0; out.push(d); x -= d; }
  return out;
}

/* ───────────── U5: practical op-amp (finite gain, virtual ground, slew rate) ───────────── */

export type OpCfg = "inv" | "noninv";
/** Closed-loop gain with finite open-loop gain A: A_CL = A_ideal · Aβ/(1 + Aβ), β = R1/(R1 + Rf). */
export function opReal(cfg: OpCfg, Rf: number, R1: number, A: number) {
  const ideal = cfg === "inv" ? -Rf / R1 : 1 + Rf / R1, beta = R1 / (R1 + Rf), loop = A * beta;
  return { ideal, actual: (ideal * loop) / (1 + loop), beta, loop, errPct: 100 / (1 + loop) };
}
/** Full-power bandwidth f_max = SR/(2πV_m) (Hz) for slew rate SR (V/µs) and output peak Vm (V). */
export const fmaxSlew = (SRVus: number, Vm: number) => (Vm > 0 ? (SRVus * 1e6) / (2 * Math.PI * Vm) : Infinity);
/** Two periods of the output: ideal (clipped at ±Vsat) and slew-rate limited, sampled n + 1 times. */
export function slewTrace(Vm: number, fHz: number, SRVus: number, Vsat: number, n = 200) {
  const T = 1 / fHz, dt = (2 * T) / n, smax = SRVus * 1e6 * dt;
  const ideal = (t: number) => Math.max(-Vsat, Math.min(Vsat, Vm * Math.sin(2 * Math.PI * fHz * t)));
  let y = 0;
  for (let i = 0; i < 3 * n; i++) { const target = ideal(i * dt); y += Math.max(-smax, Math.min(smax, target - y)); } // settle for six periods first
  const id: number[] = [], re: number[] = [];
  for (let i = 0; i <= n; i++) { const target = ideal(i * dt); y += Math.max(-smax, Math.min(smax, target - y)); id.push(target); re.push(y); }
  return { ideal: id, real: re, peak: Math.max(...re.map(Math.abs)) };
}
