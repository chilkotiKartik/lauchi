/** Pure maths for the extra AHT-002 labs. No React, no three. */

/* ───────────── Crystal field theory ───────────── */

export type Geometry = "oct" | "tet" | "sqp";
/** Orbital energies in units of Δ (octahedral Δ_o for oct and sqp, Δ_t for tet). Order: lowest first. */
export const LEVELS: Record<Geometry, { name: string; e: number }[]> = {
  oct: [{ name: "d_xy", e: -0.4 }, { name: "d_yz", e: -0.4 }, { name: "d_zx", e: -0.4 }, { name: "d_z²", e: 0.6 }, { name: "d_x²−y²", e: 0.6 }],
  tet: [{ name: "d_z²", e: -0.6 }, { name: "d_x²−y²", e: -0.6 }, { name: "d_xy", e: 0.4 }, { name: "d_yz", e: 0.4 }, { name: "d_zx", e: 0.4 }],
  sqp: [{ name: "d_yz", e: -0.514 }, { name: "d_zx", e: -0.514 }, { name: "d_z²", e: -0.428 }, { name: "d_xy", e: 0.228 }, { name: "d_x²−y²", e: 1.228 }],
};

/**
 * Fills d-electrons into the split orbitals. A new electron pairs in a lower orbital only if the energy step to the next empty
 * higher level (gap·Δ) is larger than the pairing energy P; that gives high-spin vs low-spin automatically.
 */
export function cft(d: number, geo: Geometry, deltaCm: number, pairingCm: number) {
  const lv = LEVELS[geo];
  const occ = [0, 0, 0, 0, 0];
  const D = geo === "tet" ? deltaCm * (4 / 9) : deltaCm; // tetrahedral splitting is ~4/9 of octahedral for the same ligands
  for (let k = 0; k < d; k++) {
    // candidate: lowest orbital with 0 electrons, and lowest orbital with 1 electron
    let empty = -1, half = -1;
    for (let i = 0; i < 5; i++) { if (occ[i] === 0 && empty < 0) empty = i; if (occ[i] === 1 && half < 0) half = i; }
    if (empty < 0) { occ[half]++; continue; }
    if (half < 0) { occ[empty]++; continue; }
    const costEmpty = lv[empty].e * D, costPair = lv[half].e * D + pairingCm;
    if (costPair < costEmpty) occ[half]++; else occ[empty]++;
  }
  const unpaired = occ.filter((x) => x === 1).length;
  const pairs = occ.filter((x) => x === 2).length;
  const cfse = occ.reduce((s, n, i) => s + n * lv[i].e, 0); // in units of Δ (for tet: Δ_t)
  // pairs forced on top of what a free ion would have (free ion pairs only when d > 5)
  const extraPairs = Math.max(0, pairs - Math.max(0, d - 5));
  const lowSpin = geo !== "tet" && extraPairs > 0;
  const mu = Math.sqrt(unpaired * (unpaired + 2));
  const lambdaNm = D > 0 ? 1e7 / D : 0;
  return { occ, unpaired, pairs, cfse, cfseCm: cfse * D, pairingCost: extraPairs * pairingCm, lowSpin, mu, D, lambdaNm, magnetic: unpaired > 0 ? "paramagnetic" : "diamagnetic" };
}

/** Colour seen ≈ complement of the absorbed wavelength. */
export function complementName(nm: number): string {
  if (nm < 400) return "colourless (absorbs UV)";
  if (nm < 435) return "yellow-green";
  if (nm < 480) return "yellow";
  if (nm < 490) return "orange";
  if (nm < 500) return "red";
  if (nm < 560) return "purple";
  if (nm < 580) return "violet";
  if (nm < 595) return "blue";
  if (nm < 605) return "greenish-blue";
  if (nm < 750) return "blue-green";
  return "colourless (absorbs IR)";
}

/* ───────────── Ellingham diagram ───────────── */

/** ΔG° = A + B·T (kJ per mol O₂), with an optional kink at a boiling/melting point where the slope changes. */
export const OXIDES = {
  feo: { name: "2Fe + O₂ → 2FeO", A: -519.2, B: 0.125 },
  zno: { name: "2Zn + O₂ → 2ZnO", A: -696, B: 0.201, kinkT: 1180, B2: 0.393 },
  al2o3: { name: "4/3Al + O₂ → 2/3Al₂O₃", A: -1120, B: 0.214 },
  mgo: { name: "2Mg + O₂ → 2MgO", A: -1202, B: 0.217, kinkT: 1363, B2: 0.403 },
  cu2o: { name: "4Cu + O₂ → 2Cu₂O", A: -338, B: 0.145 },
  nio: { name: "2Ni + O₂ → 2NiO", A: -479, B: 0.172 },
} as const;
export const REDUCERS = {
  c_co: { name: "2C + O₂ → 2CO", A: -221, B: -0.179 },
  c_co2: { name: "C + O₂ → CO₂", A: -394, B: -0.001 },
  co_co2: { name: "2CO + O₂ → 2CO₂", A: -566, B: 0.173 },
} as const;
export type OxideId = keyof typeof OXIDES;
export type ReducerId = keyof typeof REDUCERS;

export function dG(line: { A: number; B: number; kinkT?: number; B2?: number }, T: number) {
  if (line.kinkT !== undefined && line.B2 !== undefined && T > line.kinkT) return line.A + line.B * line.kinkT + line.B2 * (T - line.kinkT);
  return line.A + line.B * T;
}

export function ellingham(ox: OxideId, red: ReducerId, T: number) {
  const o = OXIDES[ox], r = REDUCERS[red];
  const gOx = dG(o, T), gRed = dG(r, T);
  const gReduction = gRed - gOx; // reducer oxidised + metal oxide reduced, per mol O₂
  // crossover: scan for the first T (300–2500 K) where the reducer line falls below the oxide line
  let cross: number | null = null;
  for (let t = 300; t <= 2500; t += 1) if (dG(r, t) < dG(o, t)) { cross = t; break; }
  return { gOx, gRed, gReduction, feasible: gReduction < 0, cross };
}

/* ───────────── Water softening ───────────── */

/** Ion exchange: hardness removed until the resin capacity (g CaCO₃ equivalent) is used up. */
export function ionExchange(caPpm: number, mgPpm: number, resinL: number, capGPerL: number) {
  const hard = caPpm + mgPpm;                        // mg/L as CaCO₃
  const capacityG = resinL * capGPerL;               // g as CaCO₃
  const breakthroughL = hard > 0 ? (capacityG * 1000) / hard : Infinity;
  const hclKg = (capacityG * (36.5 / 50)) / 1000;    // HCl to regenerate (1 eq CaCO₃ = 50 g ↔ 36.5 g HCl), ideal
  return { hard, capacityG, breakthroughL, hclKg };
}
/** Effluent hardness (fraction of feed) after V litres: an S-shaped breakthrough curve around the exhaustion volume. */
export const breakthrough = (V: number, Vb: number) => 1 / (1 + Math.exp(-(V - Vb) / Math.max(1, 0.06 * Vb)));

/** Lime–soda requirement per litre (mg) and for the whole volume (kg), all inputs in mg/L as CaCO₃. */
export function limeSoda(tCa: number, tMg: number, pCa: number, pMg: number, co2: number, volM3: number, limePurity = 90, sodaPurity = 95) {
  const lime = 0.74 * (tCa + 2 * tMg + pMg + co2);   // mg/L
  const soda = 1.06 * (pCa + pMg);                   // mg/L
  const L = volM3 * 1000;
  return { lime, soda, limeKg: (lime * L) / 1e6 * (100 / limePurity), sodaKg: (soda * L) / 1e6 * (100 / sodaPurity), temp: tCa + tMg, perm: pCa + pMg, total: tCa + tMg + pCa + pMg };
}

/* ───────────── Corrosion and cathodic protection ───────────── */

export type Protect = "none" | "zinc" | "magnesium" | "iccp";
/** Simplified mixed-potential model for bare steel in water. Current densities in μA/cm². */
export function corrosion(pH: number, o2ppm: number, areaM2: number, protect: Protect, iccpA: number) {
  const iH = 40 * Math.pow(10, -(pH - 2)) * 10;        // hydrogen evolution: strong only in acid (400 μA/cm² at pH 2)
  const iO = 5.5 * o2ppm;                               // oxygen reduction, diffusion-limited (≈ 45 μA/cm² at 8 ppm)
  const icorr = iH + iO + 0.5;                          // free corrosion = total cathodic demand (+ tiny background)
  const needA = (icorr * 1e-6) * areaM2 * 1e4;          // A needed to fully protect
  const supplyA = protect === "none" ? 0 : protect === "zinc" ? 0.6 : protect === "magnesium" ? 1.8 : iccpA;
  const frac = needA > 0 ? Math.min(1, supplyA / needA) : 1;
  const rate = 0.0116 * icorr * (1 - frac);             // mm/year (1 μA/cm² ≈ 0.0116 mm/y for iron)
  const anode = protect === "zinc" ? { M: 65.38, n: 2 } : protect === "magnesium" ? { M: 24.31, n: 2 } : null;
  const year = 3.156e7;
  const anodeKgPerYear = anode ? (supplyA * year * anode.M) / (anode.n * 96485) / 1000 / 0.9 : 0;
  const mech = pH < 4.5 ? "hydrogen evolution (acidic)" : "oxygen absorption (neutral/basic)";
  return { iH, iO, icorr, needA, supplyA, frac, rate, bareRate: 0.0116 * icorr, anodeKgPerYear, mech, overprotect: protect === "iccp" && iccpA > 2 * needA };
}

/* ───────────── Bomb calorimeter ───────────── */

/** Dulong-type GCV (cal/g) from C and H (no O, S): (8080 C + 34500 H)/100. */
export const dulong = (C: number, H: number) => (8080 * C + 34500 * H) / 100;
export function calorimeter(m: number, C: number, H: number, W: number, w: number, fuse = 10, acid = 50, cooling = 0.02, latent = 587) {
  const gcvTrue = dulong(C, H);
  const dT = (m * gcvTrue + fuse + acid) / (W + w) - cooling;   // what the thermometer shows (cooling makes it read low)
  const gcv = ((W + w) * (dT + cooling) - (fuse + acid)) / m;     // the textbook formula recovers the true GCV
  const ncv = gcv - 0.09 * H * latent;
  return { gcvTrue, dT, gcv, ncv, heatKcal: (m * gcv) / 1000, kJperKg: gcv * 4.184 };
}
/** Temperature reading (°C above start) at time t (s) for the temperature–time plot. */
export function calTrace(t: number, dT: number, cooling: number) {
  if (t < 60) return 0;
  const rise = dT + cooling;
  const up = rise * (1 - Math.exp(-(t - 60) / 25));
  return up - (cooling * Math.max(0, t - 60)) / 240;
}

/* ───────────── Lubrication (Stribeck) ───────────── */

/** Kinematic viscosity at T (°C) from the 40 °C value and the viscosity index (simplified Walther-like exponential). */
export function viscAt(nu40: number, VI: number, T: number) {
  const b = 0.03 * (1 - VI / 180) + 0.012;      // high VI → weaker temperature dependence
  return nu40 * Math.exp(-b * (T - 40));
}
export function stribeck(nu40: number, VI: number, T: number, rpm: number, loadN: number) {
  const nu = viscAt(nu40, VI, T);                 // cSt
  const mu = nu * 0.87e-3;                         // Pa·s (ρ ≈ 870 kg/m³)
  const P = loadN / (0.05 * 0.05);                 // bearing pressure on a 50 mm × 50 mm projected area, Pa
  const hersey = (mu * (rpm / 60)) / P;            // μN/P (dimensionless)
  const x = hersey / 2e-8;                         // scaled so the friction minimum sits near x ≈ 1
  const f = 0.12 / (1 + Math.pow(x / 0.45, 2.2)) + 0.0022 * x + 0.002;
  const regime = x < 0.35 ? "boundary" : x < 1.6 ? "mixed" : "hydrodynamic";
  const filmUm = 0.8 * Math.pow(x, 0.7);           // schematic film thickness
  const v = Math.PI * 0.05 * (rpm / 60);
  return { nu, mu, P, hersey, x, f, regime, filmUm, heatW: f * loadN * v };
}
export const stribeckF = (x: number) => 0.12 / (1 + Math.pow(x / 0.45, 2.2)) + 0.0022 * x + 0.002;

/* ───────────── ¹H NMR ───────────── */

export type Peak = { d: number; H: number; n: number; label: string };
export const NMR = {
  ethanol: { name: "Ethanol, CH₃CH₂OH", peaks: [{ d: 1.22, H: 3, n: 2, label: "CH₃ triplet" }, { d: 2.61, H: 1, n: 0, label: "OH singlet" }, { d: 3.69, H: 2, n: 3, label: "CH₂ quartet" }] },
  chloroethane: { name: "Chloroethane, CH₃CH₂Cl", peaks: [{ d: 1.48, H: 3, n: 2, label: "CH₃ triplet" }, { d: 3.57, H: 2, n: 3, label: "CH₂Cl quartet" }] },
  isobutylbr: { name: "Isobutyl bromide, (CH₃)₂CHCH₂Br", peaks: [{ d: 1.04, H: 6, n: 1, label: "2×CH₃ doublet" }, { d: 1.95, H: 1, n: 8, label: "CH multiplet" }, { d: 3.33, H: 2, n: 1, label: "CH₂Br doublet" }] },
  tbutylbenz: { name: "tert-Butylbenzene, C₁₀H₁₄", peaks: [{ d: 1.3, H: 9, n: 0, label: "C(CH₃)₃ singlet" }, { d: 7.28, H: 5, n: 0, label: "C₆H₅" }] },
  isobutylbenz: { name: "Isobutylbenzene, C₁₀H₁₄", peaks: [{ d: 0.88, H: 6, n: 1, label: "2×CH₃ doublet" }, { d: 1.86, H: 1, n: 8, label: "CH multiplet" }, { d: 2.45, H: 2, n: 1, label: "CH₂ doublet" }, { d: 7.12, H: 5, n: 0, label: "C₆H₅" }] },
  chloropropane: { name: "2-Chloropropane, (CH₃)₂CHCl", peaks: [{ d: 1.55, H: 6, n: 1, label: "2×CH₃ doublet" }, { d: 4.14, H: 1, n: 6, label: "CHCl septet" }] },
  acetone: { name: "Acetone, CH₃COCH₃", peaks: [{ d: 2.17, H: 6, n: 0, label: "2×CH₃ singlet" }] },
} as const satisfies Record<string, { name: string; peaks: Peak[] }>;
export type NmrId = keyof typeof NMR;
export const GAMMA_H_MHZ_PER_T = 42.577;
const binom = (n: number, k: number) => { let r = 1; for (let i = 1; i <= k; i++) r = (r * (n - i + 1)) / i; return r; };
const MULT = ["singlet", "doublet", "triplet", "quartet", "quintet", "sextet", "septet", "octet", "nonet"];
export const multiplicity = (n: number) => MULT[n] ?? `${n + 1} lines`;

/** Spectrum intensity at chemical shift δ (ppm): Lorentzian lines, n+1 binomial multiplets, J in Hz, linewidth in Hz. */
export function nmrSpectrum(id: NmrId, B0: number, JHz = 7, widthHz = 1.2, tms = true) {
  const nu0 = GAMMA_H_MHZ_PER_T * B0;               // MHz
  const Jppm = JHz / nu0, w = widthHz / nu0;
  const lines: { d: number; a: number }[] = [];
  for (const p of NMR[id].peaks) {
    const tot = 2 ** p.n;
    for (let k = 0; k <= p.n; k++) lines.push({ d: p.d + (k - p.n / 2) * Jppm, a: (p.H * binom(p.n, k)) / tot });
  }
  if (tms) lines.push({ d: 0, a: 0.6 });
  const at = (d: number) => lines.reduce((s, l) => s + l.a / (1 + ((d - l.d) / (w / 2)) ** 2), 0);
  return { nu0, Jppm, lines, at };
}
export function nmrInfo(id: NmrId, B0: number, T = 298) {
  const nu0 = GAMMA_H_MHZ_PER_T * B0;
  const dE = 6.626e-34 * nu0 * 1e6;                 // J
  const excessPpm = (dE / (2 * 1.381e-23 * T)) * 1e6;
  return { nu0, signals: NMR[id].peaks.length, totalH: NMR[id].peaks.reduce((s, p) => s + p.H, 0), dEueV: (dE / 1.602e-19) * 1e6, excessPpm };
}

/* ───────────── S_N1 vs S_N2 ───────────── */

export type Substrate = "methyl" | "primary" | "secondary" | "tertiary";
const K2: Record<Substrate, number> = { methyl: 30, primary: 1, secondary: 0.025, tertiary: 0.00001 };
const K1: Record<Substrate, number> = { methyl: 0.000001, primary: 0.00001, secondary: 0.012, tertiary: 1.2 };
export function snMech(sub: Substrate, nuStrong: boolean, solvent: "protic" | "aprotic", nuConc: number, T: number) {
  const tf = Math.exp(((T - 298) / 10) * 0.69);          // roughly doubles per 10 K
  const k2 = K2[sub] * (nuStrong ? 1 : 0.01) * (solvent === "aprotic" ? 10 : 1) * tf;
  const k1 = K1[sub] * (solvent === "protic" ? 10 : 0.1) * tf * 1.2;
  const r2 = k2 * nuConc, r1 = k1;
  const f2 = r2 / (r1 + r2);
  const main = f2 >= 0.5 ? "SN2" : "SN1";
  const inversionPct = 100 * f2 + 50 * (1 - f2);         // SN2 inverts fully, SN1 gives ~50:50
  // barrier heights from relative rates (schematic, kJ/mol): ΔG‡ = −RT ln(k/k_ref) + 80
  const g2 = 80 - 8.314e-3 * T * Math.log(Math.max(k2, 1e-12));
  const g1 = 80 - 8.314e-3 * T * Math.log(Math.max(k1, 1e-12));
  return { k1, k2, r1, r2, f2, main, inversionPct, g1, g2, rateLaw: main === "SN2" ? "rate = k[RX][Nu⁻]" : "rate = k[RX]" };
}
