/** Pure maths for the AHT-001 Engineering Physics labs. SI units unless a name says otherwise. No React, no three. */

export const H = 6.626e-34;      // Planck constant, J s
export const C = 2.998e8;        // speed of light, m/s
export const QE = 1.602e-19;     // elementary charge, C
export const ME = 9.109e-31;     // electron mass, kg
export const KB = 1.381e-23;     // Boltzmann constant, J/K
export const EPS0 = 8.854e-12;   // vacuum permittivity, F/m
/** hc in eV·nm (≈ 1240). Also equals hc in keV·pm. */
export const HC_EV_NM = ((H * C) / QE) * 1e9;
/** Compton wavelength of the electron h / mₑc, in pm (≈ 2.426). */
export const LAMBDA_C_PM = (H / (ME * C)) * 1e12;
/** Electron rest energy mₑc² in keV (≈ 511). */
export const ME_C2_KEV = (ME * C * C) / QE / 1e3;

const DEG = Math.PI / 180;
export const toDeg = (r: number) => r / DEG;
export const toRad = (d: number) => d * DEG;

/* ───────────────────────── formatting & helpers ───────────────────────── */

const PREFIX: [number, string][] = [[1e9, "G"], [1e6, "M"], [1e3, "k"], [1, ""], [1e-3, "m"], [1e-6, "µ"], [1e-9, "n"], [1e-12, "p"], [1e-15, "f"]];
/** 0.0125 V → "12.5 mV". Uses a real minus sign. */
export function fmtSI(x: number, unit: string, sig = 3): string {
  if (!Number.isFinite(x)) return "—";
  if (x === 0) return `0 ${unit}`;
  const ax = Math.abs(x);
  const [f, p] = PREFIX.find(([f]) => ax >= f * 0.9995) ?? PREFIX[PREFIX.length - 1];
  const v = ax / f;
  const dec = Math.max(0, sig - 1 - Math.floor(Math.log10(v)));
  return `${x < 0 ? "−" : ""}${v.toFixed(dec)} ${p}${unit}`;
}
const SUP: Record<string, string> = { "-": "⁻", "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹" };
/** 1.23e-4 → "1.23 × 10⁻⁴". */
export function fmtSci(x: number, digits = 2): string {
  if (!Number.isFinite(x)) return "—";
  if (x === 0) return "0";
  const e = Math.floor(Math.log10(Math.abs(x)));
  let m = x / 10 ** e;
  let ee = e;
  if (Math.abs(Number(m.toFixed(digits))) >= 10) { m /= 10; ee += 1; }
  const sign = m < 0 ? "−" : "";
  return `${sign}${Math.abs(m).toFixed(digits)} × 10${String(ee).split("").map((c) => SUP[c] ?? c).join("")}`;
}

/** Small seeded PRNG (mulberry32) so particle layouts are deterministic and render-pure. */
export function prng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Approximate display colour of a wavelength in nm, as linear-ish RGB 0–1. Below 380 nm (UV) it returns a violet glow. */
export function nmToRgb(nm: number): [number, number, number] {
  if (nm < 380) return [0.55, 0.3, 1];
  let r = 0, g = 0, b = 0;
  if (nm < 440) { r = (440 - nm) / 60; b = 1; } else if (nm < 490) { g = (nm - 440) / 50; b = 1; }
  else if (nm < 510) { g = 1; b = (510 - nm) / 20; } else if (nm < 580) { r = (nm - 510) / 70; g = 1; }
  else if (nm < 645) { r = 1; g = (645 - nm) / 65; } else { r = 1; }
  // dim towards the ends of the visible range, as the eye does
  const f = nm < 420 ? 0.35 + (0.65 * (nm - 380)) / 40 : nm > 680 ? 0.35 + (0.65 * (780 - nm)) / 100 : 1;
  return [Math.min(1, r * f + 0.02), Math.min(1, g * f + 0.02), Math.min(1, b * f + 0.02)];
}

/* ───────────────────────── 1. Fraunhofer diffraction by N slits ───────────────────────── */

/** Relative intensity I/I₀ at angle θ (given as sin θ) for N slits of width a, spacing d, wavelength λ (all the same length unit). */
export function slitIntensity(sinT: number, lambda: number, a: number, d: number, N: number): number {
  const beta = (Math.PI * a * sinT) / lambda;
  const env = Math.abs(beta) < 1e-9 ? 1 : (Math.sin(beta) / beta) ** 2;
  if (N <= 1) return env;
  const g = (Math.PI * d * sinT) / lambda;
  const sg = Math.sin(g);
  const arr = Math.abs(sg) < 1e-9 ? 1 : (Math.sin(N * g) / (N * sg)) ** 2;
  return env * arr;
}

export interface DiffractionInfo {
  /** Spacing actually used: slits cannot overlap, so d is taken as at least a (µm). */
  dUsed: number;
  /** First single-slit minimum sin⁻¹(λ/a) in degrees, or null when λ ≥ a (no minimum: light spreads into the whole half-space). */
  firstMinDeg: number | null;
  /** First-order grating maximum sin⁻¹(λ/d) in degrees, or null when λ ≥ d. */
  firstOrderDeg: number | null;
  /** Highest order m with mλ/d < 1. */
  maxOrder: number;
  /** Principal maxima strictly inside the central diffraction envelope (including m = 0). */
  inEnvelope: number;
  /** Positive orders that are missing because they fall on a single-slit minimum (d/a an integer). */
  missing: number[];
  /** Resolving power R = mN for m = 1. */
  R: number;
  /** Smallest resolvable wavelength difference λ/R at m = 1 (nm). */
  dLambdaNm: number;
}

export function diffraction(nm: number, aUm: number, dUm: number, N: number): DiffractionInfo {
  const lam = nm * 1e-3; // µm
  const d = Math.max(dUm, aUm);
  const rel = lam / aUm;
  const firstMinDeg = rel < 1 - 1e-9 ? toDeg(Math.asin(rel)) : Math.abs(rel - 1) <= 1e-9 ? 90 : null;
  const firstOrderDeg = lam <= d ? toDeg(Math.asin(Math.min(1, lam / d))) : null;
  const maxOrder = Math.max(0, Math.ceil(d / lam - 1e-9) - 1);
  const ratio = d / aUm;
  const envOrder = firstMinDeg === null ? maxOrder : Math.min(maxOrder, Math.ceil(ratio - 1e-9) - 1);
  const isInt = Math.abs(ratio - Math.round(ratio)) < 1e-6;
  const missing: number[] = [];
  if (isInt) { const k = Math.round(ratio); for (let m = k; m <= maxOrder && missing.length < 6; m += k) missing.push(m); }
  const R = Math.round(N);
  return { dUsed: d, firstMinDeg, firstOrderDeg, maxOrder, inEnvelope: 2 * envOrder + 1, missing, R, dLambdaNm: nm / R };
}

/* ───────────────────────── 2. Polarisation (Jones calculus) ───────────────────────── */

export type Plate = "none" | "quarter" | "half";
export type Cx = [number, number];
const cmul = (a: Cx, b: Cx): Cx => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
const cadd = (a: Cx, b: Cx): Cx => [a[0] + b[0], a[1] + b[1]];
const cscale = (a: Cx, s: number): Cx => [a[0] * s, a[1] * s];
const abs2 = (a: Cx) => a[0] * a[0] + a[1] * a[1];

export interface PolarInfo {
  /** Field reaching the analyser: components along the polariser axis (u) and at 90° to it (v), unit amplitude. */
  Eu: Cx; Ev: Cx;
  /** Complex amplitude passed by the analyser (along its axis), same scale. */
  A: Cx;
  /** Transmitted intensity as a fraction of the unpolarised input I₀ (the polariser alone passes 1/2). */
  frac: number;
  /** Malus's law cos²θ for polariser → analyser with no plate. */
  malus: number;
  state: "linear" | "circular" | "elliptical";
  /** Orientation of the (major) axis, degrees from the polariser axis, 0–180. */
  axisDeg: number;
  /** Minor/major axis ratio b/a (0 linear, 1 circular). */
  ratio: number;
}

/** Unpolarised light → polariser (axis at 0°) → optional wave plate (fast axis at φ) → analyser at θ. */
export function polarization(analyserDeg: number, plate: Plate, fastDeg: number): PolarInfo {
  let Eu: Cx = [1, 0], Ev: Cx = [0, 0];
  if (plate !== "none") {
    const G = plate === "quarter" ? Math.PI / 2 : Math.PI;
    const f = toRad(fastDeg), c = Math.cos(f), s = Math.sin(f);
    const Ef = cadd(cscale(Eu, c), cscale(Ev, s));
    const Es = cmul(cadd(cscale(Eu, -s), cscale(Ev, c)), [Math.cos(G), Math.sin(G)]); // slow axis lags by Γ
    Eu = cadd(cscale(Ef, c), cscale(Es, -s));
    Ev = cadd(cscale(Ef, s), cscale(Es, c));
  }
  const th = toRad(analyserDeg);
  const A = cadd(cscale(Eu, Math.cos(th)), cscale(Ev, Math.sin(th)));
  const S0 = abs2(Eu) + abs2(Ev), S1 = abs2(Eu) - abs2(Ev);
  const S2 = 2 * (Eu[0] * Ev[0] + Eu[1] * Ev[1]), S3 = 2 * (Eu[0] * Ev[1] - Eu[1] * Ev[0]);
  const c3 = Math.max(-1, Math.min(1, S3 / S0));
  const ratio = Math.abs(Math.tan(Math.asin(c3) / 2));
  const state = Math.abs(c3) > 0.9995 ? "circular" : Math.abs(c3) < 1e-6 ? "linear" : "elliptical";
  let axisDeg = toDeg(Math.atan2(S2, S1) / 2);
  if (axisDeg < -1e-9) axisDeg += 180;
  if (axisDeg >= 179.9995) axisDeg = 0;
  const m = Math.cos(th) ** 2;
  return { Eu, Ev, A, frac: 0.5 * abs2(A), malus: m, state, axisDeg, ratio: state === "linear" ? 0 : Math.min(1, ratio) };
}

/** Brewster angle tan⁻¹(n) in degrees, light going from air into a medium of index n. */
export const brewsterDeg = (n: number) => toDeg(Math.atan(n));

/* ───────────────────────── 3. Optical fibre ───────────────────────── */

export interface FiberInfo {
  /** Critical angle at the core–cladding wall sin⁻¹(n₂/n₁) (degrees), or null if n₂ ≥ n₁. */
  critDeg: number | null;
  /** Numerical aperture √(n₁² − n₂²) (from air), or null if n₂ ≥ n₁. */
  NA: number | null;
  /** Acceptance half-angle sin⁻¹(NA) in degrees (90 if NA ≥ 1). */
  acceptDeg: number | null;
  /** Relative index difference Δ = (n₁ − n₂)/n₁. */
  delta: number;
  /** Ray angle to the fibre axis inside the core (Snell at the air–core face). */
  refrDeg: number;
  /** Angle of incidence at the core–cladding wall (measured from the wall normal) = 90° − refrDeg. */
  wallDeg: number;
  guided: boolean;
}

export function fiber(n1: number, n2: number, launchDeg: number): FiberInfo {
  const refr = Math.asin(Math.sin(toRad(launchDeg)) / n1);
  const wallDeg = 90 - toDeg(refr);
  const delta = (n1 - n2) / n1;
  if (n2 >= n1) return { critDeg: null, NA: null, acceptDeg: null, delta, refrDeg: toDeg(refr), wallDeg, guided: false };
  const critDeg = toDeg(Math.asin(n2 / n1));
  const NA = Math.sqrt(n1 * n1 - n2 * n2);
  const acceptDeg = NA >= 1 ? 90 : toDeg(Math.asin(NA));
  return { critDeg, NA, acceptDeg, delta, refrDeg: toDeg(refr), wallDeg, guided: wallDeg >= critDeg - 1e-9 };
}

/* ───────────────────────── 4. Photoelectric effect ───────────────────────── */

/** Typical textbook work functions (eV); measured values vary with surface condition. */
export const METALS = {
  cs: { name: "Caesium", phi: 2.1, color: "#ffc83d" },
  na: { name: "Sodium", phi: 2.28, color: "#d7dfe3" },
  k: { name: "Potassium", phi: 2.3, color: "#b9c7ce" },
  zn: { name: "Zinc", phi: 4.3, color: "#8fa3ad" },
  cu: { name: "Copper", phi: 4.7, color: "#ff9a1f" },
} as const;
export type MetalId = keyof typeof METALS;

export interface PhotoInfo {
  /** Photon energy hc/λ, eV. */
  E: number;
  /** Threshold wavelength hc/φ, nm. */
  lambda0: number;
  emits: boolean;
  /** Maximum kinetic energy hν − φ (eV), 0 if no emission. */
  kmax: number;
  /** Stopping potential Kmax/e (V). */
  V0: number;
  /** Fraction of emitted electrons reaching the collector at retarding voltage V (simplified: KE spread evenly from 0 to Kmax). */
  fraction: number;
}

export function photoelectric(nm: number, phi: number, V: number): PhotoInfo {
  const E = HC_EV_NM / nm, lambda0 = HC_EV_NM / phi;
  const emits = E > phi;
  const kmax = emits ? E - phi : 0;
  const fraction = !emits ? 0 : V <= 0 ? 1 : Math.max(0, 1 - V / kmax);
  return { E, lambda0, emits, kmax, V0: kmax, fraction };
}

/* ───────────────────────── 5. Compton scattering ───────────────────────── */

export interface ComptonInfo {
  /** Wavelength shift Δλ = λc(1 − cos θ), pm. */
  dl: number;
  /** Scattered wavelength λ′, pm. */
  lam2: number;
  /** Photon energies before / after, keV. */
  E1: number; E2: number;
  /** Electron recoil kinetic energy, keV. */
  Ke: number;
  /** Electron recoil angle φ below the incident direction, degrees: tan φ = cot(θ/2) / (1 + λc/λ). */
  phiDeg: number;
}

export function compton(lamPm: number, thetaDeg: number): ComptonInfo {
  const th = toRad(thetaDeg);
  const dl = LAMBDA_C_PM * (1 - Math.cos(th));
  const lam2 = lamPm + dl;
  const E1 = HC_EV_NM / lamPm, E2 = HC_EV_NM / lam2; // keV·pm / pm = keV
  const phi = Math.atan2(Math.cos(th / 2), Math.sin(th / 2) * (1 + LAMBDA_C_PM / lamPm));
  return { dl, lam2, E1, E2, Ke: E1 - E2, phiDeg: toDeg(phi) };
}

/* ───────────────────────── 6. P–N junction (silicon) ───────────────────────── */

export const NI_SI_300 = 1.5e10;     // cm⁻³
export const EG_SI = 1.12;           // eV (taken constant)
export const EPS_SI = 11.7 * EPS0;   // F/m
/** Saturation current of the modelled diode at 300 K (A). It scales with nᵢ² at other temperatures. */
export const IS_300 = 1e-14;

/** Thermal voltage kT/q (V). */
export const thermalV = (T: number) => (KB * T) / QE;
/** Intrinsic carrier density of Si (cm⁻³): nᵢ ∝ T^{3/2} e^{−Eg/2kT}, pinned to 1.5 × 10¹⁰ at 300 K. */
export function niSi(T: number) {
  return NI_SI_300 * (T / 300) ** 1.5 * Math.exp((EG_SI / 2) * (1 / thermalV(300) - 1 / thermalV(T)));
}

export interface PnInfo {
  ni: number;          // cm⁻³
  Vt: number;          // kT/q, V
  Vbi: number;         // built-in potential, V
  /** V ≥ V_bi: the depletion approximation no longer holds (flat bands, high injection). */
  collapsed: boolean;
  W: number;           // depletion width, m
  xp: number; xn: number; // widths on the p and n sides, m
  Emax: number;        // peak field at the junction, V/m
  Is: number;          // saturation current, A
  I: number;           // Shockley diode current, A
  bias: "forward" | "reverse" | "zero";
}

/** Abrupt Si p–n junction. Na, Nd as log10 of cm⁻³; V applied (positive = forward); T in K. */
export function pnJunction(logNa: number, logNd: number, V: number, T: number): PnInfo {
  const Na = 10 ** logNa, Nd = 10 ** logNd, ni = niSi(T), Vt = thermalV(T);
  const Vbi = Vt * Math.log((Na * Nd) / (ni * ni));
  const drop = Vbi - V;
  const collapsed = drop <= 0;
  const NaM = Na * 1e6, NdM = Nd * 1e6;
  const W = collapsed ? 0 : Math.sqrt((2 * EPS_SI * drop * (NaM + NdM)) / (QE * NaM * NdM));
  const xn = (W * NaM) / (NaM + NdM), xp = (W * NdM) / (NaM + NdM);
  const Is = IS_300 * (ni / NI_SI_300) ** 2;
  const I = Is * Math.expm1(V / Vt);
  return { ni, Vt, Vbi, collapsed, W, xp, xn, Emax: W > 0 ? (2 * drop) / W : 0, Is, I, bias: V > 1e-9 ? "forward" : V < -1e-9 ? "reverse" : "zero" };
}

/** Depth of the Fermi level below Ec on the n side, Ec − E_F = kT ln(N_c/N_d) in eV (N_c = 2.8 × 10¹⁹ cm⁻³ at 300 K, ∝ T^{3/2}). Used to place E_F in the band diagram. */
export function fermiBelowEc(logNd: number, T: number) {
  return thermalV(T) * Math.log((2.8e19 * (T / 300) ** 1.5) / 10 ** logNd);
}

/* ───────────────────────── 7. Hall effect ───────────────────────── */

/** Slab width (across which V_H appears), used for the drift velocity and Hall field. */
export const HALL_WIDTH_MM = 5;

export interface HallInfo {
  /** Hall voltage V_front − V_back (V); positive for holes. */
  VH: number;
  /** Hall coefficient R_H = ±1/(nq), m³/C. */
  RH: number;
  /** Drift speed I/(nqwt), m/s. */
  vd: number;
  /** Hall field V_H / w, V/m (signed). */
  EH: number;
}

/** I in mA, B in T, carrier density as log10 m⁻³, thickness t (along B) in mm. */
export function hall(ImA: number, B: number, logn: number, tmm: number, type: "electron" | "hole"): HallInfo {
  const I = ImA * 1e-3, n = 10 ** logn, t = tmm * 1e-3, w = HALL_WIDTH_MM * 1e-3;
  const s = type === "hole" ? 1 : -1;
  const VH = (s * I * B) / (n * QE * t);
  return { VH, RH: s / (n * QE), vd: I / (n * QE * w * t), EH: VH / w };
}
