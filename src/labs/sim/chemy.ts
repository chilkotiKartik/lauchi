/** Pure maths for the round-3 Engineering Chemistry labs (group chemy). No React, no three. */

export const R = 8.314462618;          // J mol⁻¹ K⁻¹
export const R_LBAR = 0.0831446;        // L bar mol⁻¹ K⁻¹
export const KB_EV = 8.617333262e-5;    // eV K⁻¹
export const HC_EV_NM = 1239.84;        // eV nm

/** Small seeded PRNG (mulberry32) so scenes are deterministic. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SUP: Record<string, string> = { "-": "⁻", "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹" };
/** 1.23e10 → "1.23 × 10¹⁰". */
export function sci(x: number, digits = 2): string {
  if (!Number.isFinite(x)) return "∞";
  if (x === 0) return "0";
  const e = Math.floor(Math.log10(Math.abs(x)));
  if (e >= -2 && e <= 3) return x.toFixed(Math.max(0, digits - Math.max(0, e)));
  const m = x / 10 ** e;
  return `${m.toFixed(digits)} × 10${String(e).split("").map((c) => SUP[c]).join("")}`;
}

/* ───────────── Band theory (U1) ───────────── */

export type Doping = "none" | "n" | "p";
export const DOPANT_CM3 = 1e16;
/**
 * Intrinsic carrier density n_i = √(N_c N_v) e^(−E_g/2kT) with √(N_c N_v) ≈ 2.5 × 10¹⁹ (T/300)^1.5 cm⁻³ (simplified: same effective
 * masses for every solid). Gives about 10¹⁰ cm⁻³ for silicon at 300 K.
 */
export function bands(Eg: number, T: number, dop: Doping) {
  const kT = KB_EV * T;
  const metal = Eg < 0.05;
  const cls = metal ? "Conductor (bands overlap)" : Eg < 3 ? "Semiconductor" : "Insulator";
  const Neff = 2.5e19 * (T / 300) ** 1.5;
  const frac = metal ? 1 : Math.exp(-Eg / (2 * kT));
  const ni = metal ? 8.5e22 : Neff * frac;
  let n = ni, p = ni;
  if (!metal && dop !== "none") {
    const half = DOPANT_CM3 / 2, maj = half + Math.sqrt(half * half + ni * ni), min = (ni * ni) / maj;
    if (dop === "n") { n = maj; p = min; } else { p = maj; n = min; }
  }
  // Fermi level above the valence-band top: mid-gap for intrinsic, shifted by kT ln(n/ni) when doped
  const Ef = metal ? 0 : Math.min(Eg, Math.max(0, Eg / 2 + kT * Math.log(n / ni)));
  const edgeNm = metal ? Infinity : HC_EV_NM / Eg;
  return { kT, metal, cls, ni, n, p, Ef, edgeNm, frac };
}

/* ───────────── Hess's law (U2) ───────────── */

export type HessRxn = "ch4" | "hydrog" | "diamond";
type Sp = { f: string; k: "a" | "b" | "c"; nu: number };
export const HESS: Record<HessRxn, { eq: string; reac: Sp[]; prod: Sp[]; dng: number; burnt: string; labels: Record<"a" | "b" | "c", string | null> }> = {
  ch4: { eq: "C(graphite) + 2H₂(g) → CH₄(g)", reac: [{ f: "C", k: "a", nu: 1 }, { f: "H₂", k: "b", nu: 2 }], prod: [{ f: "CH₄", k: "c", nu: 1 }], dng: -1, burnt: "CO₂(g) + 2H₂O(l)", labels: { a: "ΔHc of C(graphite)", b: "ΔHc of H₂", c: "ΔHc of CH₄" } },
  hydrog: { eq: "C₂H₄(g) + H₂(g) → C₂H₆(g)", reac: [{ f: "C₂H₄", k: "a", nu: 1 }, { f: "H₂", k: "b", nu: 1 }], prod: [{ f: "C₂H₆", k: "c", nu: 1 }], dng: -1, burnt: "2CO₂(g) + 3H₂O(l)", labels: { a: "ΔHc of C₂H₄", b: "ΔHc of H₂", c: "ΔHc of C₂H₆" } },
  diamond: { eq: "C(graphite) → C(diamond)", reac: [{ f: "C(gr)", k: "a", nu: 1 }], prod: [{ f: "C(dia)", k: "c", nu: 1 }], dng: 0, burnt: "CO₂(g)", labels: { a: "ΔHc of graphite", b: null, c: "ΔHc of diamond" } },
};
/** ΔH_rxn = Σ ν ΔHc(reactants) − Σ ν ΔHc(products) (Hess's law through the combustion products). kJ/mol. */
export function hess(rxn: HessRxn, a: number, b: number, c: number, T = 298.15) {
  const v = { a, b, c }, r = HESS[rxn];
  const sumR = r.reac.reduce((s, x) => s + x.nu * v[x.k], 0), sumP = r.prod.reduce((s, x) => s + x.nu * v[x.k], 0);
  const dH = sumR - sumP;
  const dU = dH - (r.dng * R * T) / 1000;
  return { dH, sumR, sumP, dU, dng: r.dng, nature: Math.abs(dH) < 0.05 ? "Thermoneutral" : dH < 0 ? "Exothermic" : "Endothermic" };
}

/* ───────────── Reverse osmosis (U3) ───────────── */

export type Solute = "nacl" | "cacl2" | "sucrose";
export const SOLUTES: Record<Solute, { name: string; M: number; i: number }> = {
  nacl: { name: "NaCl", M: 58.44, i: 2 },
  cacl2: { name: "CaCl₂", M: 110.98, i: 3 },
  sucrose: { name: "Sucrose", M: 342.3, i: 1 },
};
export const RO_REJECTION = 0.995;
/** van 't Hoff π = iCRT; water flux J = A(ΔP − π) (solution–diffusion model, simplified: no concentration polarisation). */
export function ro(P: number, gL: number, Tc: number, A: number, sol: Solute) {
  const s = SOLUTES[sol], C = gL / s.M, T = Tc + 273.15;
  const pi = s.i * C * R_LBAR * T;
  const net = P - pi;
  const J = A * net; // L m⁻² h⁻¹, negative = water flows into the brine (ordinary osmosis)
  const mode = Math.abs(net) < 0.05 ? "Equilibrium (ΔP = π)" : net > 0 ? "Reverse osmosis: pure water squeezed out" : P <= 0.001 ? "Natural osmosis: water flows into the brine" : "Osmosis wins (ΔP < π)";
  const permeateMgL = net > 0 ? gL * 1000 * (1 - RO_REJECTION) : 0;
  return { C, pi, net, J, mode, permeateMgL, perDay: Math.max(0, J) * 24 };
}

/* ───────────── Alkalinity (U3) ───────────── */

/** Alkalinity in ppm (mg/L as CaCO₃) from a titre: V_acid × N × 50 × 1000 / V_sample. */
export function alkPpm(vAcid: number, N: number, Vs: number) { return (vAcid * N * 50 * 1000) / Vs; }

/** The P/M table. P (phenolphthalein) ≤ M (methyl orange, total). */
export function alkalinity(Pml: number, Mml: number, N: number, Vs: number) {
  const pm = Math.min(Pml, Mml);
  const P = alkPpm(pm, N, Vs), M = alkPpm(Mml, N, Vs);
  let OH = 0, CO3 = 0, HCO3 = 0, rule = "";
  if (M <= 0) rule = "No alkalinity";
  else if (P === 0) { HCO3 = M; rule = "P = 0: only HCO₃⁻"; }
  else if (P >= M) { OH = M; rule = "P = M: only OH⁻"; }
  else if (Math.abs(P - M / 2) < 1e-9) { CO3 = M; rule = "P = ½M: only CO₃²⁻"; }
  else if (P < M / 2) { CO3 = 2 * P; HCO3 = M - 2 * P; rule = "P < ½M: CO₃²⁻ + HCO₃⁻"; }
  else { OH = 2 * P - M; CO3 = 2 * (M - P); rule = "P > ½M: OH⁻ + CO₃²⁻"; }
  return { P, M, OH, CO3, HCO3, rule, clipped: Pml > Mml };
}

const KA1 = 10 ** -6.35, KA2 = 10 ** -10.33, KW = 1e-14;
/**
 * pH of the sample after adding v mL of strong acid (normality N). Composition from the P/M result (ppm as CaCO₃).
 * Solves the charge balance of the carbonate system by bisection on log[H⁺].
 */
export function alkPH(v: number, OH: number, CO3: number, HCO3: number, N: number, Vs: number) {
  const L = Vs / 1000, Vt = (Vs + v) / 1000;
  const ohMol = (OH / 50000) * L, co3Mol = (CO3 / 100000) * L, hco3Mol = (HCO3 / 50000) * L; // ppm/50 = meq/L
  const Na = (ohMol + 2 * co3Mol + hco3Mol) / Vt, CT = (co3Mol + hco3Mol) / Vt, Cl = (N * v) / 1000 / Vt;
  const f = (h: number) => { const d = h * h + KA1 * h + KA1 * KA2; return Na + h - KW / h - (CT * (KA1 * h + 2 * KA1 * KA2)) / d - Cl; };
  let lo = -14.5, hi = 0.5;
  for (let i = 0; i < 60; i++) { const mid = (lo + hi) / 2; if (f(10 ** mid) > 0) hi = mid; else lo = mid; }
  return -(lo + hi) / 2;
}

/* ───────────── Step vs chain growth (U4) ───────────── */

/** Carothers: X̄n = (1 + r)/(1 + r − 2rp); with r = 1, X̄n = 1/(1 − p), X̄w = (1 + p)/(1 − p), PDI = 1 + p (Flory). */
export function stepGrowth(p: number, r = 1) {
  const Xn = (1 + r) / (1 + r - 2 * r * p);
  const PDI = 1 + p;
  return { Xn, Xw: Xn * PDI, PDI, monomerLeft: (1 - p) ** 2 };
}
export function polyGrowth(p: number, r: number, M0: number, dpChain: number) {
  const s = stepGrowth(p, r);
  return { ...s, Mn: s.Xn * M0, chainXn: dpChain, chainMn: dpChain * M0, chainMonomerLeft: 1 - p };
}
/** Chain lengths for a picture of `total` repeat units: Flory most-probable distribution (step) or long chains + leftover monomer (chain). */
export function chainPopulation(mode: "step" | "chain", p: number, total: number, seed = 7): number[] {
  const rnd = rng(seed), out: number[] = [];
  let left = total;
  if (mode === "chain") {
    const inChains = Math.round(total * p), L = 40;
    let k = inChains;
    while (k > 0) { const n = Math.min(k, L); out.push(n); k -= n; }
    left = total - inChains;
    for (let i = 0; i < left; i++) out.push(1);
    return out;
  }
  while (left > 0) {
    // geometric draw: P(x) = (1 − p) p^(x − 1)
    const u = Math.max(1e-12, rnd());
    const x = Math.max(1, Math.ceil(Math.log(u) / Math.log(p)));
    const n = Math.min(left, x);
    out.push(n); left -= n;
  }
  return out;
}

/* ───────────── Viscosity index & lubricant points (U4) ───────────── */

/** Dean–Davis VI = (L − U)/(L − H) × 100, viscosities at 100 °F of oils that match the test oil at 210 °F. */
export function viscIndex(U: number, H: number, L: number) {
  if (L - H <= 0) return NaN;
  return ((L - U) / (L - H)) * 100;
}
export const SUS210 = 60;
const F100K = 310.93, F210K = 371.89;
/** Viscosity at T °C by log–log interpolation through the 100 °F and 210 °F values (Walther-type chart, simplified). */
export function viscAt(v100: number, Tc: number, v210 = SUS210) {
  const T = Math.max(150, Tc + 273.15);
  const y1 = Math.log10(Math.log10(v100)), y2 = Math.log10(Math.log10(v210));
  const B = (y1 - y2) / (Math.log10(F210K) - Math.log10(F100K));
  const y = y1 - B * (Math.log10(T) - Math.log10(F100K));
  return 10 ** (10 ** y);
}
export function lubricant(U: number, H: number, L: number, Tc: number, flash: number, fire: number, cloud: number, pour: number) {
  const VI = viscIndex(U, H, L);
  const rating = !Number.isFinite(VI) ? "L must exceed H" : VI >= 100 ? "High VI (Pennsylvanian-like)" : VI >= 35 ? "Medium VI" : VI >= 0 ? "Low VI (Gulf-coast-like)" : "Below Gulf standard";
  const state = Tc < pour ? "Solid: will not pour" : Tc < cloud ? "Cloudy: wax crystals" : Tc < flash ? "Clear liquid: safe" : Tc < fire ? "Vapour flashes (≥ flash point)" : "Burns steadily (≥ fire point)";
  return { VI, rating, state, nu: viscAt(U, Tc), nuH: viscAt(H, Tc), nuL: viscAt(L, Tc), gap: fire - flash, range: [pour, flash] as const };
}

/* ───────────── UV–Vis & Beer–Lambert (U5) ───────────── */

export type Chromo = "ethane" | "tma" | "ethene" | "butadiene" | "hexatriene" | "carotene" | "acetone" | "benzene";
export const CHROMO: Record<Chromo, { name: string; lmax: number; eps: number; tr: string }> = {
  ethane: { name: "Ethane", lmax: 135, eps: 10000, tr: "σ → σ*" },
  tma: { name: "Trimethylamine", lmax: 199, eps: 3950, tr: "n → σ*" },
  ethene: { name: "Ethene", lmax: 171, eps: 15530, tr: "π → π*" },
  butadiene: { name: "1,3-Butadiene", lmax: 217, eps: 21000, tr: "π → π*" },
  hexatriene: { name: "1,3,5-Hexatriene", lmax: 258, eps: 35000, tr: "π → π*" },
  carotene: { name: "β-Carotene", lmax: 452, eps: 139000, tr: "π → π* (11 C=C)" },
  acetone: { name: "Acetone", lmax: 279, eps: 15, tr: "n → π* (forbidden, weak)" },
  benzene: { name: "Benzene", lmax: 255, eps: 215, tr: "π → π* (B band)" },
};
const BAND_W = 2600; // cm⁻¹ half-width of the Gaussian band
/** Molar absorptivity at λ (nm): a Gaussian band in wavenumber around λmax. */
export function epsAt(ch: Chromo, lam: number) {
  const c = CHROMO[ch], d = (1e7 / lam - 1e7 / c.lmax) / BAND_W;
  return c.eps * Math.exp(-d * d);
}
/** Beer–Lambert: A = ε c l (c in mol/L, l in cm); %T = 100 × 10^−A. `cmM` is in mmol/L. */
export function beer(ch: Chromo, cmM: number, l: number, lam: number) {
  const eps = epsAt(ch, lam), A = eps * (cmM / 1000) * l;
  const c = CHROMO[ch];
  return { eps, A, T: 100 * 10 ** -A, lmax: c.lmax, tr: c.tr, eV: HC_EV_NM / c.lmax, kJ: 119627 / c.lmax, region: regionOf(c.lmax), seen: seenColour(c.lmax) };
}
export function regionOf(nm: number) { return nm < 200 ? "Vacuum UV" : nm < 400 ? "Near UV" : nm <= 700 ? "Visible" : "Near IR"; }
/** Colour seen = complement of the absorbed colour. */
export function seenColour(nm: number) {
  if (nm < 400) return "Colourless";
  if (nm < 435) return "Yellow-green";
  if (nm < 480) return "Yellow-orange";
  if (nm < 490) return "Orange";
  if (nm < 500) return "Red";
  if (nm < 560) return "Purple";
  if (nm < 580) return "Violet";
  if (nm < 595) return "Blue";
  if (nm < 605) return "Green-blue";
  return "Blue-green";
}
/** Approximate RGB hex for a wavelength; UV shows as violet-purple. */
export function nmToHex(nm: number) {
  let r = 0, g = 0, b = 0;
  if (nm < 380) { r = 0.66; g = 0.44; b = 1; }
  else if (nm < 440) { r = -(nm - 440) / 60; b = 1; }
  else if (nm < 490) { g = (nm - 440) / 50; b = 1; }
  else if (nm < 510) { g = 1; b = -(nm - 510) / 20; }
  else if (nm < 580) { r = (nm - 510) / 70; g = 1; }
  else if (nm < 645) { r = 1; g = -(nm - 645) / 65; }
  else { r = 1; }
  const h = (x: number) => Math.round(Math.min(1, Math.max(0, x)) * 255).toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}

/* ───────────── Diels–Alder (U5) ───────────── */

export type Dienophile = "ethene" | "acrolein" | "maleic";
/** Approximate gas/solution literature values with butadiene as the diene. Thermodynamics from ΔHf° and S° of butadiene + ethene → cyclohexene. */
export const DIENOPHILES: Record<Dienophile, { name: string; Ea: number; logA: number; product: string; stereo: string }> = {
  ethene: { name: "Ethene", Ea: 115, logA: 7.4, product: "Cyclohexene", stereo: "no stereocentres" },
  acrolein: { name: "Acrolein (CH₂=CH–CHO)", Ea: 82, logA: 6.2, product: "Cyclohex-3-ene-1-carbaldehyde", stereo: "racemic (one new stereocentre)" },
  maleic: { name: "Maleic anhydride", Ea: 60, logA: 5.6, product: "cis-1,2,3,6-Tetrahydrophthalic anhydride", stereo: "cis (syn addition keeps the cis groups cis)" },
};
export const DA_DH = -5.0 - (110.2 + 52.4);                               // −167.6 kJ/mol
export const DA_DS = 310.5 - (278.7 + 219.3);                            // −187.5 J mol⁻¹ K⁻¹
export function dielsAlder(T: number, d: Dienophile, c0: number) {
  const x = DIENOPHILES[d];
  const dG = DA_DH - (T * DA_DS) / 1000;
  const log10K = -(dG * 1000) / (R * T) / Math.LN10;
  const k = 10 ** x.logA * Math.exp(-(x.Ea * 1000) / (R * T)); // L mol⁻¹ s⁻¹
  const half = 1 / (k * c0); // second order, equal starting concentrations
  return { dG, log10K, Tc: (DA_DH * 1000) / DA_DS, k, half, spont: dG < 0 };
}

/* ───────────── IR / Raman normal modes (U5) ───────────── */

export type IrMol = "h2o" | "co2" | "cs2" | "hcl" | "co" | "n2";
type V = [number, number, number];
export type Mode = { name: string; nu: number; ir: boolean; raman: boolean; vec: V[] };
export type MolDef = { name: string; atoms: { el: string; m: number; p: V; q: number }[]; bonds: [number, number][]; linear: boolean; iso: number[]; bond: [number, number]; modes: Mode[] };

const u1: V = [-0.7907, -0.6122, 0], u2: V = [0.7907, -0.6122, 0];
const sc = (v: V, k: number): V => [v[0] * k, v[1] * k, v[2] * k];
const add = (a: V, b: V): V => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mH = 1.008, mO = 15.999, mC = 12.011, mS = 32.06;
const p1: V = [0.6122, -0.7907, 0], p2: V = [-0.6122, -0.7907, 0];
const lin = (mT: number, mM: number, nus: [number, number, number], raman: boolean[]): Mode[] => [
  { name: "Symmetric stretch", nu: nus[0], ir: false, raman: raman[0], vec: [[-1, 0, 0], [0, 0, 0], [1, 0, 0]] },
  { name: "Bend (in plane)", nu: nus[1], ir: true, raman: raman[1], vec: [[0, 1, 0], [0, (-2 * mT) / mM, 0], [0, 1, 0]] },
  { name: "Bend (out of plane, same ν)", nu: nus[1], ir: true, raman: raman[1], vec: [[0, 0, 1], [0, 0, (-2 * mT) / mM], [0, 0, 1]] },
  { name: "Asymmetric stretch", nu: nus[2], ir: true, raman: raman[2], vec: [[1, 0, 0], [(-2 * mT) / mM, 0, 0], [1, 0, 0]] },
];
export const IR_MOLS: Record<IrMol, MolDef> = {
  h2o: {
    name: "H₂O", linear: false, iso: [1, 2], bond: [1, 0], bonds: [[0, 1], [0, 2]],
    atoms: [{ el: "O", m: mO, p: [0, 0.35, 0], q: -0.66 }, { el: "H", m: mH, p: add([0, 0.35, 0], sc(u1, 1.2)), q: 0.33 }, { el: "H", m: mH, p: add([0, 0.35, 0], sc(u2, 1.2)), q: 0.33 }],
    modes: [
      { name: "Symmetric stretch", nu: 3652, ir: true, raman: true, vec: [sc(add(u1, u2), -mH / mO), u1, u2] },
      { name: "Bend (scissoring)", nu: 1595, ir: true, raman: true, vec: [sc(add(p1, p2), -mH / mO), p1, p2] },
      { name: "Asymmetric stretch", nu: 3756, ir: true, raman: true, vec: [sc(add(u1, sc(u2, -1)), -mH / mO), u1, sc(u2, -1)] },
    ],
  },
  co2: { name: "CO₂", linear: true, iso: [0, 2], bond: [0, 1], bonds: [[0, 1], [1, 2]], atoms: [{ el: "O", m: mO, p: [-1.16, 0, 0], q: -0.35 }, { el: "C", m: mC, p: [0, 0, 0], q: 0.7 }, { el: "O", m: mO, p: [1.16, 0, 0], q: -0.35 }], modes: lin(mO, mC, [1388, 667, 2349], [true, false, false]) },
  cs2: { name: "CS₂", linear: true, iso: [0, 2], bond: [0, 1], bonds: [[0, 1], [1, 2]], atoms: [{ el: "S", m: mS, p: [-1.55, 0, 0], q: -0.1 }, { el: "C", m: mC, p: [0, 0, 0], q: 0.2 }, { el: "S", m: mS, p: [1.55, 0, 0], q: -0.1 }], modes: lin(mS, mC, [658, 397, 1535], [true, false, false]) },
  hcl: { name: "HCl", linear: true, iso: [0], bond: [0, 1], bonds: [[0, 1]], atoms: [{ el: "H", m: mH, p: [-0.9, 0, 0], q: 0.18 }, { el: "Cl", m: 34.969, p: [0.4, 0, 0], q: -0.18 }], modes: [{ name: "Stretch", nu: 2886, ir: true, raman: true, vec: [[-1, 0, 0], [mH / 34.969, 0, 0]] }] },
  co: { name: "CO", linear: true, iso: [1], bond: [1, 0], bonds: [[0, 1]], atoms: [{ el: "C", m: mC, p: [-0.56, 0, 0], q: 0.1 }, { el: "O", m: mO, p: [0.56, 0, 0], q: -0.1 }], modes: [{ name: "Stretch", nu: 2143, ir: true, raman: true, vec: [[-1, 0, 0], [mC / mO, 0, 0]] }] },
  n2: { name: "N₂", linear: true, iso: [0, 1], bond: [0, 1], bonds: [[0, 1]], atoms: [{ el: "N", m: 14.007, p: [-0.55, 0, 0], q: 0 }, { el: "N", m: 14.007, p: [0.55, 0, 0], q: 0 }], modes: [{ name: "Stretch", nu: 2331, ir: false, raman: true, vec: [[-1, 0, 0], [1, 0, 0]] }] },
};
/** Number of vibrational modes: 3N − 5 (linear) or 3N − 6 (non-linear). */
export function modeCount(m: MolDef) { return 3 * m.atoms.length - (m.linear ? 5 : 6); }
/**
 * Mode `k` (1-based, clamped) with the isotope-shifted wavenumber ν' = ν √(μ/μ'), μ the reduced mass of the A–B bond
 * (simplified: local-oscillator approximation, harmonic).
 */
export function irMode(mol: IrMol, k: number, isoX: number) {
  const m = IR_MOLS[mol], n = m.modes.length, idx = Math.min(n, Math.max(1, Math.round(k))) - 1, md = m.modes[idx];
  const [a, b] = m.bond, ma = m.atoms[a].m, mb = m.atoms[b].m;
  const ka = m.iso.includes(a) ? isoX : 1, kb = m.iso.includes(b) ? isoX : 1;
  const mu = (ma * mb) / (ma + mb), mu2 = (ma * ka * mb * kb) / (ma * ka + mb * kb);
  const nu = md.nu * Math.sqrt(mu / mu2);
  return { idx, mode: md, count: modeCount(m), shown: n, nu, nu0: md.nu, umWave: 1e4 / nu, freqTHz: (nu * 2.99792458e10) / 1e12 };
}

/* ───────────── Vulcanisation (U4) ───────────── */

export const NR_DENSITY = 920; // kg/m³
/**
 * Sulphur (phr) → crosslink density ν = (moles of S per m³)/(S atoms per crosslink); network chains = 2ν.
 * Rubber elasticity: G = (2ν)RT, E ≈ 3G, nominal stress σ = G(λ − 1/λ²). Simplified: perfect network, no entanglements.
 */
export function vulcan(S: number, eff: number, T: number, lam: number) {
  const sMol = (S / (100 + S)) * NR_DENSITY * 1000 / 32.06;
  const nuX = sMol / eff, chains = 2 * nuX;
  const G = chains * R * T; // Pa
  const Mc = chains > 0 ? (NR_DENSITY * 1000) / chains : Infinity; // g/mol between crosslinks
  const stress = G * (lam - 1 / (lam * lam));
  const cls = S < 0.3 ? "Raw rubber: soft, sticky, flows" : S <= 10 ? "Soft vulcanised rubber" : S <= 25 ? "Hard rubber" : "Ebonite (rigid; model no longer applies)";
  return { nuX, chains, G, E: 3 * G, Mc, stress, cls };
}
