/** Pure maths for the round-3 Basic Electrical (EET-001) labs (group elecy). SI units unless a name says otherwise. */

export const MU0 = 4 * Math.PI * 1e-7;
const D2R = Math.PI / 180;

/** Short engineering format: 3 significant figures with a k / m / µ prefix. */
export function eng(x: number, unit: string, sig = 3): string {
  if (!Number.isFinite(x)) return `∞ ${unit}`.trim();
  if (Math.abs(x) < 1e-12) return `0 ${unit}`.trim();
  const a = Math.abs(x);
  const [f, p] = a >= 1e6 ? [1e-6, "M"] : a >= 1e3 ? [1e-3, "k"] : a >= 1 ? [1, ""] : a >= 1e-3 ? [1e3, "m"] : [1e6, "µ"];
  return `${Number((x * f).toPrecision(sig))} ${p}${unit}`.trim();
}

/** A time in seconds as readable text ("never" for infinity). */
export function dur(s: number): string {
  if (!Number.isFinite(s)) return "never";
  if (s < 1) return `${Number((s * 1000).toPrecision(2))} ms`;
  if (s < 120) return `${Number(s.toPrecision(3))} s`;
  if (s < 7200) return `${(s / 60).toFixed(1)} min`;
  return `${(s / 3600).toFixed(1)} h`;
}

/* ═════════════ Unit 1 · Kirchhoff's laws, mesh and node analysis ═════════════ */
/**
 * Two sources and three resistors: V1 in series with R1 and V2 in series with R2 both feed node A; R3 joins A to the
 * common (ground) node. Positive I1 / I2 flow out of the + terminal of each source into node A; I3 flows down R3.
 */
export function twoSource(V1: number, R1: number, V2: number, R2: number, R3: number) {
  const VA = (V1 / R1 + V2 / R2) / (1 / R1 + 1 / R2 + 1 / R3);        // node equation at A
  const I1 = (V1 - VA) / R1, I2 = (V2 - VA) / R2, I3 = VA / R3;
  // Mesh currents (both clockwise): loop 1 = V1-R1-R3, loop 2 = R3-R2-V2.
  const Im1 = I1, Im2 = -I2;
  const P1 = V1 * I1, P2 = V2 * I2;                                   // power delivered by each source (negative = absorbing)
  const Pr = I1 * I1 * R1 + I2 * I2 * R2 + I3 * I3 * R3;
  return { VA, I1, I2, I3, Im1, Im2, kcl: I1 + I2 - I3, kvl1: V1 - I1 * R1 - I3 * R3, kvl2: V2 - I2 * R2 - I3 * R3, P1, P2, Pr, P3: I3 * I3 * R3 };
}
/** The same circuit by mesh analysis (Cramer's rule on the 2 × 2 mesh matrix), used as an independent check. */
export function twoSourceMesh(V1: number, R1: number, V2: number, R2: number, R3: number) {
  // (R1+R3) Im1 − R3 Im2 = V1 ; −R3 Im1 + (R2+R3) Im2 = −V2
  const a = R1 + R3, b = -R3, c = -R3, d = R2 + R3, det = a * d - b * c;
  const Im1 = (V1 * d - b * -V2) / det, Im2 = (a * -V2 - c * V1) / det;
  return { Im1, Im2, I3: Im1 - Im2 };
}

/* ═════════════ Unit 1 · Superposition and Norton ═════════════ */
/**
 * Ladder: V (series R1) → node A; R2 from A to ground; R3 from A to node B; load RL from B to ground;
 * a current source Is pumps current from ground into B. Returns every branch current (A).
 */
export function ladder(V: number, Is: number, R1: number, R2: number, R3: number, RL: number) {
  // Nodal: [1/R1+1/R2+1/R3, −1/R3; −1/R3, 1/R3+1/RL] [VA; VB] = [V/R1; Is]
  const a = 1 / R1 + 1 / R2 + 1 / R3, b = -1 / R3, d = 1 / R3 + 1 / RL, det = a * d - b * b;
  const VA = ((V / R1) * d - b * Is) / det, VB = (a * Is - b * (V / R1)) / det;
  return { VA, VB, i1: (V - VA) / R1, i2: VA / R2, i3: (VA - VB) / R3, iL: VB / RL };
}
export function superposition(V: number, Is: number, R1: number, R2: number, R3: number, RL: number) {
  const both = ladder(V, Is, R1, R2, R3, RL), vOnly = ladder(V, 0, R1, R2, R3, RL), iOnly = ladder(0, Is, R1, R2, R3, RL);
  const RN = R3 + (R1 * R2) / (R1 + R2);                                // sources killed: V shorted, Is opened
  const p23 = (R2 * R3) / (R2 + R3), VAsc = (V * p23) / (R1 + p23);     // B shorted to ground
  const IN = VAsc / R3 + Is, Vth = IN * RN;
  const PL = both.iL * both.iL * RL, Psum = vOnly.iL ** 2 * RL + iOnly.iL ** 2 * RL;
  return { both, vOnly, iOnly, IL1: vOnly.iL, IL2: iOnly.iL, IL: both.iL, RN, IN, Vth, PL, Psum };
}

/* ═════════════ Unit 1 · Star–delta transformation ═════════════ */
/** Delta (R_ab, R_bc, R_ca) → star (R_a, R_b, R_c): product of the two adjacent arms over the sum. */
export function deltaToStar(Rab: number, Rbc: number, Rca: number) {
  const s = Rab + Rbc + Rca;
  return { Ra: (Rab * Rca) / s, Rb: (Rab * Rbc) / s, Rc: (Rbc * Rca) / s };
}
/** Star (R_a, R_b, R_c) → delta: R_ab = R_a + R_b + R_aR_b/R_c, etc. */
export function starToDelta(Ra: number, Rb: number, Rc: number) {
  const p = Ra * Rb + Rb * Rc + Rc * Ra;
  return { Rab: p / Rc, Rbc: p / Ra, Rca: p / Rb };
}
const par = (x: number, y: number) => (x * y) / (x + y);
/** Resistance between each pair of terminals with the third left open, for a delta and for a star. */
export const deltaTerminals = (Rab: number, Rbc: number, Rca: number) => ({ ab: par(Rab, Rbc + Rca), bc: par(Rbc, Rab + Rca), ca: par(Rca, Rab + Rbc) });
export const starTerminals = (Ra: number, Rb: number, Rc: number) => ({ ab: Ra + Rb, bc: Rb + Rc, ca: Rc + Ra });
export function starDelta(mode: "y2d" | "d2y", R1: number, R2: number, R3: number) {
  if (mode === "y2d") {
    const d = starToDelta(R1, R2, R3);
    return { star: { Ra: R1, Rb: R2, Rc: R3 }, delta: d, term: starTerminals(R1, R2, R3) };
  }
  const s = deltaToStar(R1, R2, R3);
  return { star: s, delta: { Rab: R1, Rbc: R2, Rca: R3 }, term: deltaTerminals(R1, R2, R3) };
}

/* ═════════════ Unit 2 · Sinusoidal and other periodic waveforms ═════════════ */
export type Wave = "sine" | "half" | "full" | "square" | "triangle";
/** Instantaneous value at phase angle θ (radians) for a waveform of peak Vm. */
export function waveAt(w: Wave, Vm: number, th: number): number {
  const x = ((th % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI), s = Math.sin(x);
  switch (w) {
    case "sine": return Vm * s;
    case "half": return s > 0 ? Vm * s : 0;
    case "full": return Vm * Math.abs(s);
    case "square": return x < Math.PI ? Vm : -Vm;
    case "triangle": {
      const u = x / (2 * Math.PI);                     // 0 → 0, ¼ → +Vm, ¾ → −Vm
      return Vm * (u < 0.25 ? 4 * u : u < 0.75 ? 2 - 4 * u : 4 * u - 4);
    }
  }
}
/**
 * RMS, average, form factor and peak factor. For the alternating (symmetric) waves the average is taken over a half
 * cycle, as the syllabus defines it; for rectified waves over the full cycle.
 */
export function waveStats(w: Wave, Vm: number, f: number) {
  const k: Record<Wave, [number, number]> = {
    sine: [1 / Math.SQRT2, 2 / Math.PI], half: [0.5, 1 / Math.PI], full: [1 / Math.SQRT2, 2 / Math.PI], square: [1, 1], triangle: [1 / Math.sqrt(3), 0.5],
  };
  const [kr, ka] = k[w], rms = kr * Vm, avg = ka * Vm;
  return { rms, avg, ff: rms / avg, pf: Vm / rms, T: 1 / f, w: 2 * Math.PI * f };
}
/** Numerical RMS and mean-|v| over one cycle (used by the tests to check the closed forms). */
export function waveNumeric(w: Wave, Vm: number, n = 20000) {
  let s2 = 0, s1 = 0, sh = 0;
  for (let i = 0; i < n; i++) { const v = waveAt(w, Vm, ((i + 0.5) / n) * 2 * Math.PI); s2 += v * v; s1 += v; if (i < n / 2) sh += v; }
  return { rms: Math.sqrt(s2 / n), mean: s1 / n, halfMean: sh / (n / 2) };
}

/* ═════════════ Unit 2 · Parallel AC branches, power triangle, pf correction ═════════════ */
export type Cx = { re: number; im: number };
const cx = (re: number, im: number): Cx => ({ re, im });
const cdiv = (a: Cx, b: Cx): Cx => { const d = b.re * b.re + b.im * b.im; return cx((a.re * b.re + a.im * b.im) / d, (a.im * b.re - a.re * b.im) / d); };
export const cabs = (a: Cx) => Math.hypot(a.re, a.im);
export const cang = (a: Cx) => Math.atan2(a.im, a.re) / D2R;
/**
 * Branch 1: coil R1 + jωL. Branch 2: R2 in series with C (C = 0 → branch removed). Both across V (reference phasor) at f.
 * Currents as phasors; φ > 0 means the supply current lags (inductive).
 */
export function parallelAC(V: number, f: number, R1: number, LmH: number, R2: number, CuF: number) {
  const w = 2 * Math.PI * f, XL = w * LmH * 1e-3, XC = CuF > 0 ? 1 / (w * CuF * 1e-6) : Infinity;
  const v = cx(V, 0);
  const I1 = cdiv(v, cx(R1, XL));
  const I2 = Number.isFinite(XC) ? cdiv(v, cx(R2, -XC)) : cx(0, 0);
  const I = cx(I1.re + I2.re, I1.im + I2.im);
  const Imag = cabs(I), phi = -cang(I);                               // angle of V minus angle of I
  const P = V * I.re, Q = -V * I.im, S = V * Imag;
  return { XL, XC, I1, I2, I, Imag, phi, pf: Imag > 0 ? P / S : 1, P, Q, S, Z: Imag > 0 ? V / Imag : Infinity };
}
/** Shunt capacitance that raises a load of P (W) from pf1 to pf2 (both lagging) on V, f. */
export function pfCorrection(P: number, pf1: number, pf2: number, V: number, f: number) {
  const Qc = P * (Math.tan(Math.acos(pf1)) - Math.tan(Math.acos(pf2)));
  return { Qc, C: Qc / (2 * Math.PI * f * V * V) };
}

/* ═════════════ Unit 3 · Magnetic circuit with an air gap ═════════════ */
/** Series magnetic circuit: core of mean length lc (cm), area A (cm²), relative permeability μr (ideal → ∞), air gap g (mm). */
export function magCircuit(N: number, I: number, lcCm: number, Acm2: number, mur: number, gMm: number, ideal: boolean) {
  const A = Acm2 * 1e-4, lc = lcCm / 100, g = gMm / 1000;
  const F = N * I;
  const Sc = ideal ? 0 : lc / (MU0 * mur * A), Sg = g / (MU0 * A), S = Sc + Sg;
  const phi = S > 0 ? F / S : Infinity, B = phi / A;
  const Hc = ideal ? 0 : B / (MU0 * mur), Hg = B / MU0;
  return { F, Sc, Sg, S, phi, B, Hc, Hg, gapShare: S > 0 ? Sg / S : 0, L: S > 0 ? (N * N) / S : Infinity };
}
/** Relative permeability from a measured flux (the iron-ring problem): μr = l / (μ0 A S), S = NI/Φ. */
export const murFromFlux = (N: number, I: number, phi: number, lcCm: number, Acm2: number) => (lcCm / 100) / (MU0 * Acm2 * 1e-4 * ((N * I) / phi));

/* ═════════════ Unit 3 · Faraday's and Lenz's laws: dynamically induced emf ═════════════ */
/** Conductor of length l moving at v through B, at θ between the velocity and the field; closed through R. */
export function motionalEmf(B: number, l: number, v: number, thetaDeg: number, R: number) {
  const s = Math.sin(thetaDeg * D2R), e = B * l * v * s, I = e / R, F = B * I * l * s;
  return { e, I, F, Pe: e * I, Pm: F * v, dPhi: B * l * v * s };
}

/* ═════════════ Unit 4 · Single-phase induction motor: double revolving field ═════════════ */
export type Start = "none" | "split" | "capstart" | "caprun";
/** Auxiliary-winding current as a fraction a of the main current, leading it by α degrees. */
export const START: Record<Start, { a: number; alpha: number; cutout: boolean }> = {
  none: { a: 0, alpha: 0, cutout: false },
  split: { a: 1, alpha: 25, cutout: true },        // resistive auxiliary winding: ≈ 20–30° between the currents
  capstart: { a: 1, alpha: 80, cutout: true },     // capacitor in series with the auxiliary winding: ≈ 80–90°
  caprun: { a: 1, alpha: 90, cutout: false },      // capacitor stays in: (nearly) a true rotating field
};
/**
 * Main winding on the x axis carrying cos ωt; auxiliary winding 90° away in space (on the −y axis) carrying
 * a·cos(ωt + α). The field phasor b(t) = cos ωt − j·a·cos(ωt + α) splits into a forward (anticlockwise) part
 * cf·e^{jωt} and a backward (clockwise) part cb·e^{−jωt}.
 */
export function revolvingFields(a: number, alphaDeg: number) {
  const al = alphaDeg * D2R, s = Math.sin(al), c = Math.cos(al);
  const cf: Cx = { re: 0.5 * (1 + a * s), im: -0.5 * a * c };
  const cb: Cx = { re: 0.5 * (1 - a * s), im: -0.5 * a * c };
  return { fwd: cf, bwd: cb, F: cabs(cf), B: cabs(cb) };
}
/** Torque of one rotating field of unit amplitude at slip s (peaks at 1 when s = r). */
export const fieldTorque = (s: number, r: number) => (2 * r * s) / (r * r + s * s);
export const SPIM_R = 0.2;                           // R₂/X₂ of the rotor (simplified)
export function singlePhaseIM(f: number, poles: number, s: number, start: Start) {
  const Ns = (120 * f) / poles, N = Ns * (1 - s);
  const st = START[start];
  const auxIn = st.a > 0 && (!st.cutout || s > 0.25);          // centrifugal switch opens near 75 % speed
  const a = auxIn ? st.a : 0;
  const rf = revolvingFields(a, st.alpha);
  const T = (sl: number) => rf.F ** 2 * fieldTorque(sl, SPIM_R) - rf.B ** 2 * fieldTorque(2 - sl, SPIM_R);
  const r0 = revolvingFields(st.a, st.alpha);
  const Tstart = r0.F ** 2 - r0.B ** 2;                         // = a·sin α, per unit of a full rotating field
  return { Ns, N, auxIn, F: rf.F, B: rf.B, T: T(s), Tstart, torqueAt: T, ratio: rf.B > 1e-9 ? rf.F / rf.B : Infinity };
}

/* ═════════════ Unit 4 · Alternator (synchronous generator) ═════════════ */
/** f = PN/120 ; E_ph = 4.44 f Φ T K_w ; star connection: E_L = √3 E_ph. Φ in mWb, T = turns per phase in series. */
export function alternator(P: number, N: number, phiMwb: number, T: number, Kw: number) {
  const f = (P * N) / 120, Eph = 4.44 * f * (phiMwb / 1000) * T * Kw;
  return { f, Eph, EL: Math.sqrt(3) * Eph, N50: 6000 / P, rotor: P <= 4 ? "cylindrical (turbo)" : "salient pole (hydro / diesel)" };
}
/** Poles needed for frequency f at speed N (rounded to an even number). */
export const polesFor = (f: number, N: number) => Math.max(2, 2 * Math.round((120 * f) / N / 2));

/* ═════════════ Unit 5 · Fuse, MCB and RCD (ELCB) ═════════════ */
export type Curve = "B" | "C" | "D";
export const MAG: Record<Curve, number> = { B: 5, C: 10, D: 20 };   // guaranteed instantaneous trip (× In)
/** MCB trip time (s) at I = k·In (simplified IEC 60898 shape): no trip ≤ 1.13 In, thermal region, then magnetic ≈ 10 ms. */
export function mcbTime(k: number, curve: Curve) {
  if (k >= MAG[curve]) return 0.01;
  if (k <= 1.13) return Infinity;
  return 250 / (k * k - 1.13 * 1.13);
}
/** HRC (gG) fuse melting time (s), simplified: about 1 h at 1.6 In, falling roughly as 1/I⁴ for big overcurrents. */
export function fuseTime(k: number) {
  if (k <= 1) return Infinity;
  return Math.max(0.004, 3600 * ((1.6 * 1.6 - 1) / (k * k - 1)) ** 2);
}
/** RCD / ELCB: trips when the residual (leakage) current reaches its rating; ≤ 300 ms at 1×, ≤ 40 ms at 5×. */
export function rcdTime(leakMa: number, ratingMa: number) {
  if (leakMa < ratingMa) return Infinity;
  return leakMa >= 5 * ratingMa ? 0.04 : 0.3 - (0.26 * (leakMa / ratingMa - 1)) / 4;
}
export function protection(I: number, In: number, curve: Curve, leakMa: number, ratingMa: number) {
  const k = I / In, tm = mcbTime(k, curve), tf = fuseTime(k), tr = rcdTime(leakMa, ratingMa);
  const list: [string, number][] = [["MCB", tm], ["Fuse", tf], ["RCD", tr]];
  let first = "nothing trips";
  let best = Infinity;
  for (const [n, t] of list) if (t < best) { best = t; first = n; }
  return { k, tm, tf, tr, first, tFirst: best, region: tm === 0.01 ? "magnetic (short circuit)" : Number.isFinite(tm) ? "thermal (overload)" : "normal load" };
}

/* ═════════════ Unit 5 · Batteries ═════════════ */
export type Chem = "leadacid" | "nicd" | "liion";
export const CHEM: Record<Chem, { V: number; whkg: number; etaWh: number; etaAh: number; life: number; name: string }> = {
  leadacid: { V: 2.0, whkg: 35, etaWh: 0.8, etaAh: 0.9, life: 500, name: "Lead–acid" },
  nicd: { V: 1.2, whkg: 50, etaWh: 0.7, etaAh: 0.8, life: 1500, name: "Ni–Cd" },
  liion: { V: 3.7, whkg: 180, etaWh: 0.95, etaAh: 0.99, life: 1500, name: "Li-ion" },
};
/** A pack of Ns cells in series and Np strings in parallel, discharged at a steady current I (ideal: no Peukert effect). */
export function batteryPack(chem: Chem, Ns: number, Np: number, cellAh: number, I: number) {
  const c = CHEM[chem], V = Ns * c.V, Ah = Np * cellAh, Wh = V * Ah;
  return { V, Ah, Wh, C: I / Ah, hours: Ah / I, P: V * I, kg: Wh / c.whkg, WhIn: Wh / c.etaWh, AhIn: Ah / c.etaAh, cells: Ns * Np };
}
