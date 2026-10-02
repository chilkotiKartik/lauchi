/** Pure maths for the round-3 labs (group phyy): Engineering Physics (AHT-001). SI units unless a name says otherwise. */

export const K = {
  h: 6.62607015e-34,
  hbar: 1.054571817e-34,
  c: 2.99792458e8,
  e: 1.602176634e-19,
  me: 9.1093837015e-31,
  mp: 1.67262192369e-27,
  mn: 1.67492749804e-27,
  eps0: 8.8541878128e-12,
  mu0: 1.25663706212e-6,
  kB: 1.380649e-23,
  muB: 9.2740100783e-24,
} as const;
const D2R = Math.PI / 180, R2D = 180 / Math.PI;

/* ---------- formatting (pure, shared by the scenes) ---------- */

const SUP: Record<string, string> = { "-": "⁻", "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹" };
const sup = (n: number) => String(n).split("").map((ch) => SUP[ch] ?? ch).join("");
/** Number as text: plain for 0.01 … 9999, otherwise "m × 10ⁿ". */
export function sci(x: number, sig = 3): string {
  if (!Number.isFinite(x)) return x > 0 ? "∞" : x < 0 ? "−∞" : "—";
  if (x === 0) return "0";
  const a = Math.abs(x), s = x < 0 ? "−" : "";
  if (a >= 0.01 && a < 1e4) return s + String(Number(a.toPrecision(sig)));
  let ex = Math.floor(Math.log10(a)), m = a / 10 ** ex;
  if (Number(m.toPrecision(sig)) >= 10) { m /= 10; ex += 1; }
  return `${s}${Number(m.toPrecision(sig))} × 10${sup(ex)}`;
}
/** 10^lg as text, for numbers too big or small for a double (lg is the base-10 logarithm). */
export function sciLog(lg: number, sig = 3): string {
  if (Math.abs(lg) < 300) return sci(10 ** lg, sig);
  let ex = Math.floor(lg), m = 10 ** (lg - ex);
  if (Number(m.toPrecision(sig)) >= 10) { m /= 10; ex += 1; }
  return `${Number(m.toPrecision(sig))} × 10${sup(ex)}`;
}

/** Small seeded PRNG (mulberry32) for repeatable scatter in scenes. */
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

/** Approximate sRGB colour (hex) of visible light, 380–780 nm. */
export function nmHex(nm: number): string {
  let r = 0, g = 0, b = 0;
  if (nm < 440) { r = Math.max(0, (440 - nm) / 60); b = 1; } else if (nm < 490) { g = (nm - 440) / 50; b = 1; }
  else if (nm < 510) { g = 1; b = (510 - nm) / 20; } else if (nm < 580) { r = (nm - 510) / 70; g = 1; }
  else if (nm < 645) { r = 1; g = (645 - nm) / 65; } else r = 1;
  const f = nm < 420 ? 0.4 + 0.6 * Math.max(0, (nm - 380) / 40) : nm > 700 ? 0.4 + 0.6 * Math.max(0, (780 - nm) / 80) : 1;
  const h = (v: number) => Math.round(255 * Math.min(1, Math.max(0, v * f)) ** 0.8).toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}

/* ---------- U1: Fresnel's biprism ---------- */

/**
 * Fresnel's biprism. lamNm wavelength, alphaDeg prism angle, mu prism index, aCm source→biprism, bCm biprism→screen,
 * optional thin sheet (tUm thickness, muS index) in one beam.
 */
export function biprism(lamNm: number, alphaDeg: number, mu: number, aCm: number, bCm: number, tUm = 0, muS = 1.5) {
  const lam = lamNm * 1e-9, a = aCm / 100, b = bCm / 100, D = a + b;
  const delta = (mu - 1) * alphaDeg * D2R;          // deviation of each half (thin prism)
  const d = 2 * a * delta;                           // virtual-source separation
  const beta = (lam * D) / d;                        // fringe width
  const field = 2 * b * delta;                       // width of the overlap region on the screen
  const nFringes = field / beta;
  const shift = ((muS - 1) * (tUm * 1e-6) * D) / d;  // lateral shift of the whole pattern
  const shiftFringes = ((muS - 1) * (tUm * 1e-6)) / lam;
  return { D, delta, d, beta, field, nFringes, shift, shiftFringes };
}
/** Two-beam intensity (0 … 1) on the screen at y (m), for virtual sources d apart a distance D away, pattern shifted by `shift`. */
export const twoBeam = (y: number, lam: number, d: number, D: number, shift = 0) => Math.cos((Math.PI * d * (y - shift)) / (lam * D)) ** 2;

/* ---------- U1: wedge-shaped film ---------- */

/** Air (or liquid, index mu) wedge between two plates touching at one end and held apart by a wire of diameter dUm at distance LCm. */
export function wedge(lamNm: number, dUm: number, LCm: number, mu = 1) {
  const lam = lamNm * 1e-9, t = dUm * 1e-6, L = LCm / 100;
  const theta = Math.atan(t / L);
  const beta = lam / (2 * mu * Math.tan(theta));     // fringe width β = λ / 2μθ
  const nDark = Math.floor((2 * mu * t) / lam) + 1;  // dark fringes in reflected light, including the contact edge (t = 0)
  const thickAt = (n: number) => (n * lam) / (2 * mu); // film thickness under the nth dark fringe
  return { theta, beta, nDark, thickAt, orders: (2 * mu * t) / lam };
}
/** Reflected intensity (0 … 1) for film thickness t: dark where 2μt = nλ (the half-wave loss at one surface). Transmitted is the complement. */
export const filmReflect = (t: number, lam: number, mu = 1) => Math.sin((2 * Math.PI * mu * t) / lam) ** 2;

/* ---------- U2: Einstein coefficients and the three-level ruby laser ---------- */

/** Einstein relations for a transition of wavelength lamNm at temperature T, plus a three-level pump at w = W/A₂₁. */
export function einstein(lamNm: number, T: number, w: number) {
  const lam = lamNm * 1e-9, nu = K.c / lam, E = K.h * nu;
  const eV = E / K.e;
  const AoverB = (8 * Math.PI * K.h * nu ** 3) / K.c ** 3;   // A₂₁/B₂₁
  const x = E / (K.kB * T);                                   // hν/kT
  const lgSpontStim = x > 30 ? x / Math.LN10 : Math.log10(Math.expm1(x)); // log₁₀(e^x − 1)
  const lgN2N1 = -x / Math.LN10;                               // Boltzmann
  const inversion = (w - 1) / (w + 1);                         // (N₂ − N₁)/N, fast 3→2 decay
  const upper = w / (1 + w);                                   // N₂/N
  return { nu, eV, AoverB, x, lgSpontStim, lgN2N1, inversion, upper, lasing: w > 1 };
}

/* ---------- U2: double refraction in calcite ---------- */

export const CALCITE = { no: 1.6584, ne: 1.4864, balsam: 1.55 } as const;
/** Calcite at 589 nm: thDeg = angle between the ray direction and the optic axis, tMm thickness, psiDeg crystal turn, anDeg analyser angle. */
export function calcite(thDeg: number, tMm: number, psiDeg: number, anDeg: number) {
  const { no, ne, balsam } = CALCITE, th = thDeg * D2R;
  const neTh = 1 / Math.sqrt(Math.cos(th) ** 2 / no ** 2 + Math.sin(th) ** 2 / ne ** 2); // E-wave index
  const tanT = Math.tan(th);
  const rho = thDeg >= 90 ? 0 : Math.atan(((no * no - ne * ne) * tanT) / (ne * ne + no * no * tanT * tanT)); // walk-off angle
  const sep = tMm * Math.tan(rho);                                   // mm between O and E exit points
  const rel = (anDeg - psiDeg) * D2R;
  const IE = 0.5 * Math.cos(rel) ** 2, IO = 0.5 * Math.sin(rel) ** 2;  // E vibrates in the principal section, O perpendicular
  const critO = Math.asin(balsam / no) * R2D;                          // O ray TIR at the Canada balsam in a Nicol
  const dn = no - neTh;
  return { neTh, rho: rho * R2D, sep, IE, IO, critO, dn, halfWave: 589e-9 / (2 * Math.abs(no - ne)) };
}
/** Half- and quarter-wave plate thickness for a birefringence |μₒ − μₑ|. */
export const wavePlate = (lam: number, dn: number) => ({ half: lam / (2 * Math.abs(dn)), quarter: lam / (4 * Math.abs(dn)) });

/* ---------- U3: Poynting vector ---------- */

/** Isotropic source of power 10^lgP W, at distance 10^lgr m, in a non-magnetic medium of relative permittivity er. */
export function poynting(lgP: number, lgr: number, er = 1) {
  const P = 10 ** lgP, r = 10 ** lgr, n = Math.sqrt(er);
  const S = P / (4 * Math.PI * r * r);                // ⟨S⟩ = P/4πr²
  const Z = Math.sqrt(K.mu0 / (K.eps0 * er));        // wave impedance E/H
  const E0 = Math.sqrt(2 * S * Z), H0 = E0 / Z, B0 = K.mu0 * H0;
  const v = K.c / n, u = S / v;                       // mean energy density
  return { P, r, S, E0, Erms: E0 / Math.SQRT2, H0, B0, Z, v, u, n };
}

/* ---------- U3: displacement current in a charging capacitor ---------- */

/** Parallel circular plates (radius aCm, gap dMm) fed by I = I₀ sin ωt (I₀ in mA, f in kHz); probe loop of radius rCm centred between the plates. */
export function dispCurrent(ImA: number, fkHz: number, aCm: number, dMm: number, rCm: number) {
  const I0 = ImA / 1000, w = 2 * Math.PI * fkHz * 1000, a = aCm / 100, d = dMm / 1000, r = rCm / 100;
  const A = Math.PI * a * a, C = (K.eps0 * A) / d;
  const Jd = I0 / A;                                   // ε₀ ∂E/∂t peak = I₀/A
  const E0 = I0 / (K.eps0 * A * w), V0 = E0 * d;
  const Id = I0 * Math.min(1, (r * r) / (a * a));      // displacement current through the probe loop
  const B = (K.mu0 * Id) / (2 * Math.PI * r);          // Ampère–Maxwell
  const Bwire = (K.mu0 * I0) / (2 * Math.PI * r);      // same loop round the wire
  return { A, C, Jd, E0, V0, Id, B, Bwire, w };
}

/* ---------- U3: dia-, para- and ferromagnetism ---------- */

export type MagMat = "bi" | "cu" | "al2o3" | "gd" | "fe";
/** n: atoms (or formula units) per m³, Z: electrons each (diamagnets), mu: moment in Bohr magnetons, chi: measured room-temperature χ (SI, volume). */
export const MAGS: Record<MagMat, { name: string; kind: "dia" | "para" | "ferro"; n: number; Z?: number; chi?: number; mu?: number; Tc?: number }> = {
  bi: { name: "Bismuth", kind: "dia", n: 2.82e28, Z: 83, chi: -1.66e-4 },
  cu: { name: "Copper", kind: "dia", n: 8.49e28, Z: 29, chi: -9.63e-6 },
  al2o3: { name: "Alumina Al₂O₃", kind: "dia", n: 2.33e28, Z: 50, chi: -5e-5 },
  gd: { name: "Gadolinium sulphate (Curie paramagnet)", kind: "para", n: 4.87e27, mu: 7.94 },
  fe: { name: "Iron", kind: "ferro", n: 8.5e28, mu: 2.22, Tc: 1043 },
};
/** Langevin function L(a) = coth a − 1/a. */
export const langevin = (a: number) => (Math.abs(a) < 1e-4 ? a / 3 - (a * a * a) / 45 : 1 / Math.tanh(a) - 1 / a);
/** Langevin diamagnetic susceptibility χ = −μ₀ N Z e² ⟨r²⟩ / 6m. */
export const langevinDia = (N: number, Z: number, r2: number) => (-K.mu0 * N * Z * K.e * K.e * r2) / (6 * K.me);
/** Reduced spontaneous magnetisation m = tanh(m T_C / T) of the Weiss mean-field model (spin ½). */
export function weissM(T: number, Tc: number) {
  if (T >= Tc) return 0;
  const tau = Tc / Math.max(T, 1e-6);
  let lo = 1e-12, hi = 1;
  for (let i = 0; i < 80; i++) { const m = (lo + hi) / 2; if (m - Math.tanh(m * tau) > 0) hi = m; else lo = m; }
  return (lo + hi) / 2;
}
/** Domain-rotation field scale used for iron below T_C (simplified anhysteretic model). */
export const H_DOMAIN = 400;
export function magnet(mat: MagMat, H: number, T: number) {
  const m = MAGS[mat];
  let chi = 0, M = 0, align = 0, ms = 0, curie = 0, rRms = 0;
  if (m.kind === "dia") {
    chi = m.chi ?? 0; M = chi * H;
    rRms = Math.sqrt((-chi * 6 * K.me) / (K.mu0 * m.n * (m.Z ?? 1) * K.e * K.e)); // ⟨r²⟩^½ implied by Langevin's formula
  } else {
    const mu = (m.mu ?? 1) * K.muB;
    if (m.kind === "para") {
      curie = (K.mu0 * m.n * mu * mu) / (3 * K.kB);
      const a = (K.mu0 * mu * H) / (K.kB * T);
      align = langevin(a);
      M = m.n * mu * align;
      chi = H > 0 ? M / H : curie / T;
    } else {
      const Tc = m.Tc ?? 1043;
      curie = (K.mu0 * m.n * mu * mu) / K.kB;
      ms = weissM(T, Tc);
      if (T < Tc) {
        const Ms = m.n * mu * ms;
        align = Math.tanh(H / H_DOMAIN);
        M = Ms * align;
        chi = H > 0 ? M / H : Ms / H_DOMAIN;
      } else {
        chi = curie / (T - Tc + 1e-9);
        M = chi * H;
        align = Math.min(1, M / (m.n * mu));
      }
    }
  }
  const B = K.mu0 * (H + M);
  return { kind: m.kind, chi, M, B, mur: 1 + chi, align, ms, curie, rRms };
}

/* ---------- U4: de Broglie wave packet ---------- */

export const MASS = { e: K.me, p: K.mp, n: K.mn } as const;
/**
 * Free particle of speed 10^lgv m/s (capped below c) with a Gaussian momentum spread sp % (σp/p).
 * conv "rel": E = γmc² (vp = c²/v); "kin": E = p²/2m (vp = v/2). vg = v either way.
 */
export function wavePacket(lgv: number, sp: number, pt: keyof typeof MASS, conv: "rel" | "kin") {
  const m = MASS[pt], v = Math.min(10 ** lgv, 0.999 * K.c), beta = v / K.c, g = 1 / Math.sqrt(1 - beta * beta);
  const p = g * m * v, lam = K.h / p;
  const vg = v, vp = conv === "rel" ? (K.c * K.c) / v : v / 2;
  const dp = (sp / 100) * p, dx = K.hbar / (2 * dp);   // minimum-uncertainty (Gaussian) packet: σx σp = ħ/2
  const ke = (g - 1) * m * K.c * K.c;
  return { v, beta, gamma: g, p, lam, vg, vp, prod: vp * vg, dp, dx, ke, ratio: vp / vg };
}
/** Minimum Δx from Δx·Δp ≥ ħ/2, for mass m, speed v and fractional speed accuracy f. */
export const minDx = (m: number, v: number, f: number) => K.hbar / (2 * m * v * f);

/* ---------- U4: Davisson–Germer ---------- */

/** de Broglie wavelength (m) of an electron accelerated through V volts, with or without the relativistic correction. */
export const lamElectron = (V: number, rel = true) => K.h / Math.sqrt(2 * K.me * K.e * V * (rel ? 1 + (K.e * V) / (2 * K.me * K.c * K.c) : 1));
/** Surface-grating intensity (0 … 1) from N rows of atoms spaced d, at scattering angle phi (rad) from the reversed beam. */
export function rowsPattern(phi: number, lam: number, d: number, N = 8) {
  const x = (Math.PI * d * Math.sin(phi)) / lam, s = Math.sin(x);
  if (Math.abs(s) < 1e-9) return 1;
  return (Math.sin(N * x) / (N * s)) ** 2;
}
export function davisson(V: number, dA: number, phiDeg: number) {
  const lam = lamElectron(V), lamNR = lamElectron(V, false), d = dA * 1e-10;
  const v = (K.h / lam) / K.me / Math.sqrt(1 + ((K.h / lam) / (K.me * K.c)) ** 2);
  const peaks: number[] = [];
  for (let n = 1; n <= 4; n++) { const s = (n * lam) / d; if (s <= 1) peaks.push(Math.asin(s) * R2D); }
  const I = rowsPattern(phiDeg * D2R, lam, d);
  return { lam, lamNR, lamA: lam * 1e10, simpleA: 12.27 / Math.sqrt(V), relPct: (lam / lamNR - 1) * 100, v, peaks, I, p: K.h / lam };
}

/* ---------- U5: E–k diagram, direct and indirect gaps ---------- */

export type Semi = "gaas" | "si" | "ge" | "gan" | "inp";
/**
 * Varshni Eg(T) = Eg0 − αT²/(T + β) (eV), effective densities of states at 300 K (cm⁻³), lattice constant a (Å),
 * position of the conduction-band minimum as a fraction of the zone-edge wave number, and the direct (Γ) gap at 300 K for indirect materials.
 */
export const SEMIS: Record<Semi, { name: string; direct: boolean; Eg0: number; al: number; be: number; Nc: number; Nv: number; a: number; kmin: number; kEdge: number; EG: number }> = {
  gaas: { name: "GaAs", direct: true, Eg0: 1.519, al: 5.405e-4, be: 204, Nc: 4.7e17, Nv: 9.0e18, a: 5.653, kmin: 0, kEdge: 1, EG: 0 },
  si: { name: "Si", direct: false, Eg0: 1.17, al: 4.73e-4, be: 636, Nc: 2.8e19, Nv: 1.04e19, a: 5.431, kmin: 0.85, kEdge: 1, EG: 3.4 },
  ge: { name: "Ge", direct: false, Eg0: 0.7437, al: 4.774e-4, be: 235, Nc: 1.04e19, Nv: 6.0e18, a: 5.658, kmin: 1, kEdge: Math.sqrt(3) / 2, EG: 0.8 },
  gan: { name: "GaN", direct: true, Eg0: 3.47, al: 7.7e-4, be: 600, Nc: 2.3e18, Nv: 4.6e19, a: 4.52, kmin: 0, kEdge: 1, EG: 0 },
  inp: { name: "InP", direct: true, Eg0: 1.421, al: 4.9e-4, be: 327, Nc: 5.7e17, Nv: 1.1e19, a: 5.869, kmin: 0, kEdge: 1, EG: 0 },
};
export const varshni = (Eg0: number, al: number, be: number, T: number) => Eg0 - (al * T * T) / (T + be);
/** Intrinsic carrier density (cm⁻³): nᵢ = √(Nc Nv) (T/300)^{3/2} e^(−Eg/2kT). */
export const intrinsicN = (Nc: number, Nv: number, Eg: number, T: number) => Math.sqrt(Nc * Nv) * (T / 300) ** 1.5 * Math.exp((-Eg * K.e) / (2 * K.kB * T));
/** Band gap (eV) from nᵢ = N e^(−Eg/2kT) with Nc = Nv = N. */
export const gapFromNi = (N: number, ni: number, T: number) => (2 * K.kB * T * Math.log(N / ni)) / K.e;
export function ekBand(mat: Semi, T: number, Eph: number) {
  const s = SEMIS[mat];
  const Eg = varshni(s.Eg0, s.al, s.be, T);
  const EG = s.direct ? Eg : Math.max(Eg, s.EG + (Eg - varshni(s.Eg0, s.al, s.be, 300))); // direct (Γ) gap (EG is its 300 K value), shifted with T like Eg
  const lamNm = 1239.84198 / Eg;
  const kPhoton = (2 * Math.PI) / (lamNm * 1e-9);
  const kZone = (2 * Math.PI) / (s.a * 1e-10) * s.kEdge;        // |k| at the zone boundary in that direction
  const kMin = s.kmin * kZone;                                  // crystal momentum (ħk) the electron must lose
  const absorb: "none" | "direct" | "phonon" = Eph < Eg ? "none" : s.direct || Eph >= EG ? "direct" : "phonon";
  const ni = intrinsicN(s.Nc, s.Nv, Eg, Math.max(T, 1));
  return { Eg, EG, lamNm, kPhoton, kMin, kRatio: kMin / kPhoton, absorb, ni, direct: s.direct };
}

/** A length in metres as text with a sensible unit (fm … km). */
export function fmtLen(m: number, sig = 3): string {
  const a = Math.abs(m);
  const u: [number, string][] = [[1e3, "km"], [1, "m"], [1e-3, "mm"], [1e-6, "µm"], [1e-9, "nm"], [1e-12, "pm"], [1e-15, "fm"]];
  if (a >= 1e6 || (a > 0 && a < 1e-16)) return `${sci(m, sig)} m`;
  for (const [f, n] of u) if (a >= f) return `${Number((m / f).toPrecision(sig))} ${n}`;
  return `${Number((m / 1e-15).toPrecision(sig))} fm`;
}
