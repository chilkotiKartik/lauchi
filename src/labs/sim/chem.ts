/** Engineering Chemistry (AHT-002) lab maths. Pure functions: no React, no three. */

// ---------- shared ----------
export const R_GAS = 8.314462618; // J/(mol·K)
export const FARADAY = 96485.33212; // C/mol
export const PLANCK = 6.62607015e-34; // J·s
export const C_CM = 2.99792458e10; // speed of light in cm/s
export const AMU = 1.66053906660e-27; // kg
export const AVOGADRO = 6.02214076e23;
export const KB = 1.380649e-23; // J/K
export const BOHR_PM = 52.9177; // a₀ in pm

/** Small deterministic PRNG (mulberry32): same seed → same sequence, so every picture is reproducible. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SUP: Record<string, string> = { "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹", "-": "⁻", "+": "⁺", ".": "·" };
/** "12" → "¹²". */
export const sup = (s: string | number) => String(s).split("").map((c) => SUP[c] ?? c).join("");

/** Pretty number for a quantity that can span many decades: 10^x form outside [0.01, 10⁴). */
export function fmtPow10(log10v: number, digits = 2): string {
  if (!Number.isFinite(log10v)) return log10v > 0 ? "∞" : "0";
  if (log10v >= -2 && log10v < 4) return Number((10 ** log10v).toPrecision(3)).toString();
  const e = Math.floor(log10v), m = 10 ** (log10v - e);
  const mm = Number(m.toFixed(digits));
  return mm >= 10 ? `1 × 10${sup(e + 1)}` : `${mm.toFixed(digits)} × 10${sup(e)}`;
}

// ---------- 1. hydrogen atomic orbitals ----------
export type OrbitalId = "1s" | "2s" | "2pz" | "2px" | "3s" | "3pz" | "3dz2" | "3dxy";
export const ORBITAL_IDS: readonly OrbitalId[] = ["1s", "2s", "2pz", "2px", "3s", "3pz", "3dz2", "3dxy"];
export const ORBITALS: Record<OrbitalId, { n: number; l: number; ml: string; label: string }> = {
  "1s": { n: 1, l: 0, ml: "0", label: "1s" },
  "2s": { n: 2, l: 0, ml: "0", label: "2s" },
  "2pz": { n: 2, l: 1, ml: "0", label: "2pz" },
  "2px": { n: 2, l: 1, ml: "±1", label: "2px" },
  "3s": { n: 3, l: 0, ml: "0", label: "3s" },
  "3pz": { n: 3, l: 1, ml: "0", label: "3pz" },
  "3dz2": { n: 3, l: 2, ml: "0", label: "3dz²" },
  "3dxy": { n: 3, l: 2, ml: "±2", label: "3dxy" },
};

/** Hydrogen radial function R_nl(r), r in units of a₀ (a₀ = 1). */
export function radialR(n: number, l: number, r: number): number {
  const key = n * 10 + l;
  switch (key) {
    case 10: return 2 * Math.exp(-r);
    case 20: return (1 / (2 * Math.SQRT2)) * (2 - r) * Math.exp(-r / 2);
    case 21: return (1 / (2 * Math.sqrt(6))) * r * Math.exp(-r / 2);
    case 30: return (2 / (81 * Math.sqrt(3))) * (27 - 18 * r + 2 * r * r) * Math.exp(-r / 3);
    case 31: return (4 / (81 * Math.sqrt(6))) * (6 * r - r * r) * Math.exp(-r / 3);
    case 32: return (4 / (81 * Math.sqrt(30))) * r * r * Math.exp(-r / 3);
    default: return 0;
  }
}

/** Real angular shape of the orbital along the unit direction (x, y, z), scaled so its largest |value| is 1. */
export function angularShape(id: OrbitalId, x: number, y: number, z: number): number {
  switch (id) {
    case "2pz": case "3pz": return z;
    case "2px": return x;
    case "3dz2": return (3 * z * z - 1) / 2;
    case "3dxy": return 2 * x * y;
    default: return 1;
  }
}

/** Sign-carrying (unnormalised) ψ at a point (a₀ units). */
export function psi(id: OrbitalId, x: number, y: number, z: number): number {
  const { n, l } = ORBITALS[id];
  const r = Math.hypot(x, y, z);
  if (r === 0) return radialR(n, l, 0) * (l === 0 ? 1 : 0);
  return radialR(n, l, r) * angularShape(id, x / r, y / r, z / r);
}

const RMAX = [0, 14, 30, 45];
const GRID = 6000;
/** Radial probability P(r) = r²R² on a fine grid, with its cumulative integral. */
function radialTable(n: number, l: number) {
  const rMax = RMAX[n], dr = rMax / GRID;
  const p = new Float64Array(GRID + 1), cdf = new Float64Array(GRID + 1);
  for (let i = 0; i <= GRID; i++) { const r = i * dr, R = radialR(n, l, r); p[i] = r * r * R * R; }
  for (let i = 1; i <= GRID; i++) cdf[i] = cdf[i - 1] + 0.5 * (p[i] + p[i - 1]) * dr;
  return { rMax, dr, p, cdf };
}

export interface OrbitalInfo {
  n: number; l: number; ml: string; label: string;
  radialNodes: number; angularNodes: number; energyEv: number;
  /** Radius (a₀) where r²R² peaks (outermost, global maximum). */
  rMostProbable: number;
  /** Radius (a₀) of the sphere holding 90 % of the probability. */
  r90: number;
  /** Radii (a₀) of the spherical radial nodes. */
  nodeRadii: number[];
  /** Total probability on the grid (≈ 1 — a check that R is normalised). */
  norm: number;
}

export function orbitalInfo(id: OrbitalId): OrbitalInfo {
  const o = ORBITALS[id];
  const { n, l } = o;
  const t = radialTable(n, l);
  let best = 1;
  for (let i = 1; i <= GRID; i++) if (t.p[i] > t.p[best]) best = i;
  // golden-section refine inside the bracketing cells
  let a = (best - 1) * t.dr, b = (best + 1) * t.dr;
  const f = (r: number) => r * r * radialR(n, l, r) ** 2;
  const g = (Math.sqrt(5) - 1) / 2;
  for (let k = 0; k < 60; k++) { const c = b - g * (b - a), d = a + g * (b - a); if (f(c) > f(d)) b = d; else a = c; }
  const rMostProbable = (a + b) / 2;
  const norm = t.cdf[GRID];
  let i90 = 0;
  while (i90 < GRID && t.cdf[i90] < 0.9 * norm) i90++;
  const lo = t.cdf[i90 - 1], hi = t.cdf[i90];
  const r90 = (i90 - 1 + (0.9 * norm - lo) / (hi - lo)) * t.dr;
  const nodeRadii: number[] = [];
  // sample on a grid shifted off the round numbers so a node sitting exactly on a grid point is not missed
  const off = t.dr * 0.37;
  for (let i = 1; i <= GRID; i++) {
    const r0 = (i - 1) * t.dr + off, r1 = i * t.dr + off;
    if (radialR(n, l, r0) * radialR(n, l, r1) < 0) {
      let x0 = r0, x1 = r1;
      for (let k = 0; k < 50; k++) { const m = (x0 + x1) / 2; if (radialR(n, l, x0) * radialR(n, l, m) <= 0) x1 = m; else x0 = m; }
      nodeRadii.push((x0 + x1) / 2);
    }
  }
  return { ...o, radialNodes: n - l - 1, angularNodes: l, energyEv: -13.6 / (n * n), rMostProbable, r90, nodeRadii, norm };
}

/**
 * Deterministic samples of |ψ|²: r from the inverse CDF of r²R², direction by rejection sampling on the
 * angular shape². Returns positions in a₀ (chemistry axes: z is the orbital's axis) and the sign of ψ at each point.
 */
export function sampleOrbital(id: OrbitalId, count: number, seed = 7): { pos: Float32Array; sign: Float32Array; r: Float32Array } {
  const { n, l } = ORBITALS[id];
  const t = radialTable(n, l);
  const total = t.cdf[GRID];
  const rnd = mulberry32(seed * 7919 + ORBITAL_IDS.indexOf(id) * 104729 + 1);
  const pos = new Float32Array(count * 3), sign = new Float32Array(count), rs = new Float32Array(count);
  for (let k = 0; k < count; k++) {
    // radius: binary search in the CDF, then interpolate inside the cell
    const target = rnd() * total;
    let lo = 0, hi = GRID;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (t.cdf[m] < target) lo = m; else hi = m; }
    const span = t.cdf[hi] - t.cdf[lo];
    const r = (lo + (span > 0 ? (target - t.cdf[lo]) / span : 0.5)) * t.dr;
    // direction
    let x = 0, y = 0, z = 1, s = 1;
    for (let tries = 0; tries < 200; tries++) {
      z = 2 * rnd() - 1;
      const ph = 2 * Math.PI * rnd(), q = Math.sqrt(Math.max(0, 1 - z * z));
      x = q * Math.cos(ph); y = q * Math.sin(ph);
      s = angularShape(id, x, y, z);
      if (rnd() < s * s) break;
    }
    pos[k * 3] = x * r; pos[k * 3 + 1] = y * r; pos[k * 3 + 2] = z * r;
    const sg = Math.sign(radialR(n, l, r) * s);
    sign[k] = sg === 0 ? 1 : sg;
    rs[k] = r;
  }
  return { pos, sign, r: rs };
}

// ---------- 2. molecular orbital theory ----------
export type Diatomic = "H2" | "He2" | "Li2" | "Be2" | "B2" | "C2" | "N2" | "O2" | "F2" | "Ne2";
export const DIATOMICS: readonly Diatomic[] = ["H2", "He2", "Li2", "Be2", "B2", "C2", "N2", "O2", "F2", "Ne2"];
export const ELEMENT: Record<Diatomic, { sym: string; Z: number }> = {
  H2: { sym: "H", Z: 1 }, He2: { sym: "He", Z: 2 }, Li2: { sym: "Li", Z: 3 }, Be2: { sym: "Be", Z: 4 }, B2: { sym: "B", Z: 5 },
  C2: { sym: "C", Z: 6 }, N2: { sym: "N", Z: 7 }, O2: { sym: "O", Z: 8 }, F2: { sym: "F", Z: 9 }, Ne2: { sym: "Ne", Z: 10 },
};
export type MoId = "s1s" | "s1s*" | "s2s" | "s2s*" | "s2p" | "p2p" | "p2p*" | "s2p*";
const MO_INFO: Record<MoId, { label: string; bonding: boolean; deg: 1 | 2 }> = {
  s1s: { label: "σ1s", bonding: true, deg: 1 }, "s1s*": { label: "σ*1s", bonding: false, deg: 1 },
  s2s: { label: "σ2s", bonding: true, deg: 1 }, "s2s*": { label: "σ*2s", bonding: false, deg: 1 },
  s2p: { label: "σ2pz", bonding: true, deg: 1 }, p2p: { label: "π2p", bonding: true, deg: 2 },
  "p2p*": { label: "π*2p", bonding: false, deg: 2 }, "s2p*": { label: "σ*2pz", bonding: false, deg: 1 },
};
/** Energy order. B₂, C₂, N₂ (Z ≤ 7): s–p mixing pushes σ2pz above π2p. O₂, F₂, Ne₂: normal order. */
export const moOrder = (mixed: boolean): MoId[] =>
  mixed ? ["s1s", "s1s*", "s2s", "s2s*", "p2p", "s2p", "p2p*", "s2p*"] : ["s1s", "s1s*", "s2s", "s2s*", "s2p", "p2p", "p2p*", "s2p*"];

export interface MoLevel { id: MoId; label: string; bonding: boolean; deg: 1 | 2; electrons: number; up: number; down: number }
export interface MoResult {
  formula: string; electrons: number; mixed: boolean; levels: MoLevel[];
  bonding: number; antibonding: number; bondOrder: number; unpaired: number;
  config: string; magnetic: string; verdict: string; overflow: number;
}
/** Hund's rule inside a set of `deg` degenerate orbitals holding e electrons: singly fill first, then pair. */
export function hund(e: number, deg: number): { up: number; down: number } {
  const up = Math.min(e, deg);
  return { up, down: e - up };
}

export function formulaOf(mol: Diatomic, charge: number): string {
  const sym = ELEMENT[mol].sym;
  const q = charge === 0 ? "" : `${Math.abs(charge) === 1 ? "" : Math.abs(charge)}${charge > 0 ? "+" : "-"}`;
  return `${sym}₂${sup(q)}`;
}

/** Aufbau + Pauli + Hund filling of the homonuclear diatomic MO ladder. */
export function moFill(mol: Diatomic, charge: number): MoResult {
  const Z = ELEMENT[mol].Z;
  const mixed = Z <= 7;
  const electrons = Math.max(0, 2 * Z - charge);
  let left = electrons;
  const levels: MoLevel[] = moOrder(mixed).map((id) => {
    const info = MO_INFO[id];
    const e = Math.min(left, 2 * info.deg);
    left -= e;
    return { id, ...info, electrons: e, ...hund(e, info.deg) };
  });
  const overflow = left;
  let bonding = 0, antibonding = 0, unpaired = 0;
  for (const L of levels) { if (L.bonding) bonding += L.electrons; else antibonding += L.electrons; unpaired += L.up - L.down; }
  const bondOrder = (bonding - antibonding) / 2;
  const config = electrons === 0 ? "(no electrons)" : levels.filter((L) => L.electrons > 0).map((L) => `${L.label}${sup(L.electrons)}`).join(" ") + (overflow ? ` + ${overflow} e⁻ in n = 3 MOs` : "");
  const magnetic = unpaired > 0 ? `Paramagnetic (${unpaired} unpaired)` : "Diamagnetic";
  const verdict = overflow ? "Needs n = 3 orbitals (not modelled)" : bondOrder <= 0 ? "Does not exist (bond order 0)" : bondOrder < 1 ? "Weakly bound (exists, fragile)" : bondOrder >= 2.5 ? "Very stable, strong bond" : "Stable molecule";
  return { formula: formulaOf(mol, charge), electrons, mixed, levels, bonding, antibonding, bondOrder, unpaired, config, magnetic, verdict, overflow };
}

/** Ground-state fill of one atom's 1s, 2s, 2p (with Hund in 2p) for the side columns of the diagram. */
export function atomFill(e: number): { s1: number; s2: number; p: number; pUp: number; pDown: number } {
  const s1 = Math.min(e, 2), s2 = Math.min(Math.max(e - 2, 0), 2), p = Math.min(Math.max(e - 4, 0), 6);
  const h = hund(p, 3);
  return { s1, s2, p, pUp: h.up, pDown: h.down };
}

// ---------- 3. galvanic cell and the Nernst equation ----------
export type Metal = "Zn" | "Fe" | "Cu" | "Ag";
/** Standard reduction potentials E°(Mⁿ⁺/M) in volts at 298 K. */
export const E_STD: Record<Metal, number> = { Zn: -0.76, Fe: -0.44, Cu: 0.34, Ag: 0.8 };
export const ION_CHARGE: Record<Metal, number> = { Zn: 2, Fe: 2, Cu: 2, Ag: 1 };
export type CellId = "daniell" | "znag" | "cuag" | "fecu";
export const CELLS: Record<CellId, { anode: Metal; cathode: Metal; label: string }> = {
  daniell: { anode: "Zn", cathode: "Cu", label: "Daniell: Zn | Zn²⁺ || Cu²⁺ | Cu" },
  znag: { anode: "Zn", cathode: "Ag", label: "Zn | Zn²⁺ || Ag⁺ | Ag" },
  cuag: { anode: "Cu", cathode: "Ag", label: "Cu | Cu²⁺ || Ag⁺ | Ag" },
  fecu: { anode: "Fe", cathode: "Cu", label: "Fe | Fe²⁺ || Cu²⁺ | Cu" },
};
const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

export interface CellResult { E0: number; n: number; log10Q: number; E: number; dGkJ: number; log10K: number; nernstSlope: number; reaction: string }
/**
 * Cell anode | anode ion (10^logA M) || cathode ion (10^logC M) | cathode at temperature T.
 * Overall: (n/za) M_a + (n/zc) M_c^{zc+} → (n/za) M_a^{za+} + (n/zc) M_c, Q = [a]^{n/za} / [c]^{n/zc}.
 */
export function nernstCell(cell: CellId, logA: number, logC: number, T: number): CellResult {
  const { anode, cathode } = CELLS[cell];
  const za = ION_CHARGE[anode], zc = ION_CHARGE[cathode];
  const n = (za * zc) / gcd(za, zc);
  const E0 = E_STD[cathode] - E_STD[anode];
  const ca = n / za, cc = n / zc;
  const log10Q = ca * logA - cc * logC;
  const slope = (R_GAS * T * Math.LN10) / (n * FARADAY); // volts per decade of Q
  const E = E0 - slope * log10Q;
  const dGkJ = (-n * FARADAY * E) / 1000;
  const log10K = (n * FARADAY * E0) / (R_GAS * T * Math.LN10);
  const coef = (k: number) => (k === 1 ? "" : `${k}`);
  const ionA = `${anode}${sup(`${za === 1 ? "" : za}+`)}`, ionC = `${cathode}${sup(`${zc === 1 ? "" : zc}+`)}`;
  const reaction = `${coef(ca)}${anode} + ${coef(cc)}${ionC} → ${coef(ca)}${ionA} + ${coef(cc)}${cathode}`;
  return { E0, n, log10Q, E, dGkJ, log10K, nernstSlope: slope, reaction };
}

// ---------- 4. Gibbs free energy and spontaneity ----------
export type RxnId = "vap" | "caco3" | "haber" | "custom";
export const REACTIONS: Record<Exclude<RxnId, "custom">, { label: string; dH: number; dS: number }> = {
  vap: { label: "H₂O(l) → H₂O(g)", dH: 40.7, dS: 109 },
  caco3: { label: "CaCO₃ → CaO + CO₂", dH: 178, dS: 161 },
  haber: { label: "N₂ + 3H₂ → 2NH₃", dH: -92.2, dS: -198.7 },
};
export interface GibbsResult { dG: number; TdS: number; Tcross: number | null; spontaneous: boolean; equilibrium: boolean; log10K: number; regime: string }
/** ΔG = ΔH − TΔS with ΔH in kJ/mol, ΔS in J/(mol·K), T in K. K = e^(−ΔG/RT). */
export function gibbs(dHkJ: number, dSJ: number, T: number): GibbsResult {
  const TdS = (T * dSJ) / 1000;
  const dG = dHkJ - TdS;
  const Tcross = dSJ !== 0 && dHkJ !== 0 && Math.sign(dHkJ) === Math.sign(dSJ) ? (dHkJ * 1000) / dSJ : null;
  const log10K = (-dG * 1000) / (R_GAS * T * Math.LN10);
  const regime = dHkJ <= 0 && dSJ >= 0 ? "spontaneous at every T" : dHkJ >= 0 && dSJ <= 0 ? "never spontaneous" : dHkJ > 0 ? "spontaneous above T꜀ (entropy-driven)" : "spontaneous below T꜀ (enthalpy-driven)";
  return { dG, TdS, Tcross, spontaneous: dG < 0, equilibrium: Math.abs(dG) < 0.05, log10K, regime };
}

// ---------- 5. hardness of water ----------
export interface HardnessResult {
  caAsCaCO3: number; mgAsCaCO3: number; total: number; alkalinity: number;
  temporary: number; permanent: number; clark: number; cls: string;
  /** Hardness still in the water (after boiling if `boiled`). */
  remaining: number;
}
export function hardnessClass(ppm: number): string {
  return ppm < 75 ? "Soft" : ppm < 150 ? "Moderately hard" : ppm <= 300 ? "Hard" : "Very hard";
}
/** Ca²⁺, Mg²⁺, HCO₃⁻ in mg/L → hardness in ppm CaCO₃ equivalents (eq. wt. CaCO₃ 50, Ca 20, Mg 12, HCO₃ 61). */
export function hardness(ca: number, mg: number, hco3: number, boiled = false): HardnessResult {
  const caAsCaCO3 = (ca * 50) / 20, mgAsCaCO3 = (mg * 50) / 12, alkalinity = (hco3 * 50) / 61;
  const total = caAsCaCO3 + mgAsCaCO3;
  const temporary = Math.min(total, alkalinity), permanent = total - temporary;
  const remaining = boiled ? permanent : total;
  return { caAsCaCO3, mgAsCaCO3, total, alkalinity, temporary, permanent, clark: remaining * 0.07, cls: hardnessClass(remaining), remaining };
}

// ---------- 6. addition polymers ----------
export type MonomerId = "ethylene" | "vinylchloride" | "propylene" | "styrene" | "mma";
export const MONOMERS: Record<MonomerId, { label: string; m0: number; polymer: string; abbr: string }> = {
  ethylene: { label: "Ethylene CH₂=CH₂", m0: 28, polymer: "Polyethylene", abbr: "PE" },
  vinylchloride: { label: "Vinyl chloride CH₂=CHCl", m0: 62.5, polymer: "Poly(vinyl chloride)", abbr: "PVC" },
  propylene: { label: "Propylene CH₂=CH–CH₃", m0: 42, polymer: "Polypropylene", abbr: "PP" },
  styrene: { label: "Styrene CH₂=CH–C₆H₅", m0: 104, polymer: "Polystyrene", abbr: "PS" },
  mma: { label: "Methyl methacrylate", m0: 100, polymer: "Poly(methyl methacrylate)", abbr: "PMMA" },
};
/**
 * Chain lengths drawn from a log-normal distribution with number-average ≈ n and log-spread σ
 * (σ = 0 → every chain exactly n long; ideal PDI = e^{σ²}). Seeded, so always the same sample.
 */
export function chainLengths(n: number, sigma: number, count = 4000, seed = 42): Int32Array {
  const rnd = mulberry32(seed);
  const out = new Int32Array(count);
  const mu = Math.log(n) - (sigma * sigma) / 2;
  for (let i = 0; i < count; i++) {
    const u1 = Math.max(rnd(), 1e-12), u2 = rnd();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    out[i] = Math.max(1, Math.round(Math.exp(mu + sigma * z)));
  }
  return out;
}
/** Mn = Σ NᵢMᵢ / Σ Nᵢ, Mw = Σ NᵢMᵢ² / Σ NᵢMᵢ, PDI = Mw/Mn. */
export function molarMasses(lengths: ArrayLike<number>, m0: number): { Mn: number; Mw: number; PDI: number; DPn: number } {
  let s1 = 0, s2 = 0;
  for (let i = 0; i < lengths.length; i++) { const M = lengths[i] * m0; s1 += M; s2 += M * M; }
  const Mn = s1 / lengths.length, Mw = s2 / s1;
  return { Mn, Mw, PDI: Mw / Mn, DPn: Mn / m0 };
}

// ---------- 7. vibrational and rotational spectroscopy ----------
export type SpecMol = "HCl" | "CO" | "H2" | "HF" | "N2";
export const SPEC_MOLS: Record<SpecMol, { label: string; a: string; b: string; m1: number; m2: number; k: number; r: number; homo: boolean }> = {
  HCl: { label: "H³⁵Cl", a: "H", b: "Cl", m1: 1.008, m2: 34.969, k: 516, r: 127.5, homo: false },
  CO: { label: "¹²C¹⁶O", a: "C", b: "O", m1: 12.0, m2: 15.995, k: 1902, r: 112.8, homo: false },
  H2: { label: "H₂", a: "H", b: "H", m1: 1.008, m2: 1.008, k: 575, r: 74.1, homo: true },
  HF: { label: "HF", a: "H", b: "F", m1: 1.008, m2: 18.998, k: 966, r: 91.7, homo: false },
  N2: { label: "¹⁴N₂", a: "N", b: "N", m1: 14.003, m2: 14.003, k: 2295, r: 109.8, homo: true },
};
export interface DiatomicSpec { mu: number; nu: number; B: number; spacing: number; zpeCm: number; zpeKJ: number; I: number }
/** Harmonic oscillator + rigid rotor. Masses in amu, k in N/m, r in pm → wavenumbers in cm⁻¹. */
export function diatomicSpectrum(m1: number, m2: number, k: number, rPm: number): DiatomicSpec {
  const mu = (m1 * m2) / (m1 + m2);
  const muKg = mu * AMU;
  const nu = Math.sqrt(k / muKg) / (2 * Math.PI * C_CM);
  const I = muKg * (rPm * 1e-12) ** 2;
  const B = PLANCK / (8 * Math.PI * Math.PI * C_CM * I);
  const zpeCm = nu / 2;
  const zpeKJ = (PLANCK * C_CM * zpeCm * AVOGADRO) / 1000;
  return { mu, nu, B, spacing: 2 * B, zpeCm, zpeKJ, I };
}
/** Relative population of rotational level J at temperature T: (2J+1)·e^{−hcBJ(J+1)/kT}. */
export function rotPopulation(B: number, J: number, T = 298): number {
  return (2 * J + 1) * Math.exp((-PLANCK * C_CM * B * J * (J + 1)) / (KB * T));
}

/** The species offered in the MO lab: id → molecule and charge. */
export const MO_SPECIES = {
  h2: { mol: "H2", charge: 0 }, he2p: { mol: "He2", charge: 1 }, he2: { mol: "He2", charge: 0 }, li2: { mol: "Li2", charge: 0 },
  b2: { mol: "B2", charge: 0 }, c2: { mol: "C2", charge: 0 }, n2: { mol: "N2", charge: 0 }, o2p: { mol: "O2", charge: 1 },
  o2: { mol: "O2", charge: 0 }, o2m: { mol: "O2", charge: -1 }, o2mm: { mol: "O2", charge: -2 }, f2: { mol: "F2", charge: 0 }, ne2: { mol: "Ne2", charge: 0 },
} as const satisfies Record<string, { mol: Diatomic; charge: number }>;
export type MoSpeciesId = keyof typeof MO_SPECIES;
export const MO_SPECIES_IDS = Object.keys(MO_SPECIES) as MoSpeciesId[];
export const moSpecies = (id: MoSpeciesId): MoResult => moFill(MO_SPECIES[id].mol, MO_SPECIES[id].charge);

/** What is left in the water after boiling: temporary hardness precipitates as CaCO₃ (Ca first, then Mg). Amounts in mg/L; precip in ppm CaCO₃. */
export function boilResult(ca: number, mg: number, hco3: number): { ca: number; mg: number; hco3: number; precip: number } {
  const h = hardness(ca, mg, hco3);
  const caEq = h.caAsCaCO3;
  const removeCa = Math.min(caEq, h.temporary), removeMg = h.temporary - removeCa;
  return {
    ca: Math.max(0, ca - (removeCa * 20) / 50),
    mg: Math.max(0, mg - (removeMg * 12) / 50),
    hco3: Math.max(0, hco3 - (h.temporary * 61) / 50),
    precip: h.temporary,
  };
}
