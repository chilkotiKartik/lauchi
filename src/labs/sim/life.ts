/** Pure maths for the life-science / environment / web labs (group `life`). No React, no three. */

/* ───────────── shared helpers ───────────── */

/** Small seeded PRNG (mulberry32) — scenes use it instead of Math.random so renders are deterministic. */
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

/** Deterministic pseudo-random number in [0, 1) from two integers. */
export function hash01(i: number, k: number): number {
  let h = Math.imul(i + 0x9e3779b9, 0x85ebca6b) ^ Math.imul(k + 0x7f4a7c15, 0xc2b2ae35);
  h ^= h >>> 16; h = Math.imul(h, 0x45d9f3b); h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

const SUP: Record<string, string> = { "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹", "-": "⁻" };
const group3 = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

/** Human-friendly number: 1,234 · 12.3 · 0.0625 · 1.23 × 10⁹. Deterministic (no locale). */
export function fmtNum(x: number): string {
  if (!Number.isFinite(x)) return "—";
  const a = Math.abs(x);
  if (a === 0) return "0";
  if (a >= 1e7) return sci(x);
  if (a >= 100) return (x < 0 ? "−" : "") + group3(a);
  if (a >= 0.001) return (x < 0 ? "−" : "") + String(Number(a.toPrecision(3)));
  return sci(x);
}
/** Scientific notation with Unicode superscripts: 1.23 × 10⁶. */
export function sci(x: number, digits = 2): string {
  if (!Number.isFinite(x)) return "—";
  if (x === 0) return "0";
  let e = Math.floor(Math.log10(Math.abs(x)));
  let m = x / 10 ** e;
  if (Math.abs(Number(m.toFixed(digits))) >= 10) { m /= 10; e += 1; }
  const exp = String(e).split("").map((c) => SUP[c] ?? c).join("");
  return `${m.toFixed(digits)} × 10${exp}`;
}

/* ───────────── 1. ecosystem: energy flow & ecological pyramids ───────────── */

export const TROPHIC_NAMES = ["Producers", "Primary consumers", "Secondary consumers", "Tertiary consumers", "Quaternary consumers"] as const;
export type PyramidKind = "energy" | "grass" | "tree";

/**
 * Energy reaching each trophic level when each transfer passes `effPct` % upwards (Lindeman: ≈ 10 %).
 * `lost[k]` is what level k does not pass on (respiration heat, waste, uneaten parts); the top level's own energy
 * is also eventually lost as heat, but `lostBeforeTop` counts only what never reaches the top.
 */
export function energyFlow(E0: number, effPct: number, levels: number) {
  const n = Math.max(1, Math.round(levels)), f = effPct / 100;
  const energy = Array.from({ length: n }, (_, k) => E0 * f ** k);
  const lost = energy.map((e, k) => (k < n - 1 ? e - energy[k + 1] : e));
  const top = energy[n - 1];
  return { energy, lost, top, lostBeforeTop: E0 - top, topPct: (top / E0) * 100 };
}

/** Illustrative counts of individuals per level (upright grassland pyramid, and a tree-based one that is inverted at the base). */
export const NUMBERS: Record<Exclude<PyramidKind, "energy">, { counts: number[]; who: string[] }> = {
  grass: { counts: [1_500_000, 200_000, 12_000, 900, 12], who: ["grass plants", "grasshoppers", "frogs", "snakes", "hawks"] },
  tree: { counts: [1, 12_000, 400, 15, 2], who: ["tree", "caterpillars", "small birds", "snakes", "hawks"] },
};

/** Values drawn for each layer of the chosen pyramid. */
export function pyramidValues(kind: PyramidKind, E0: number, effPct: number, levels: number): number[] {
  const n = Math.max(1, Math.round(levels));
  return kind === "energy" ? energyFlow(E0, effPct, n).energy : NUMBERS[kind].counts.slice(0, n);
}

/** Relative side of each square layer so its AREA is proportional to the value (min side keeps tiny tops visible). */
export function layerSides(values: number[], minSide = 0.08): number[] {
  const m = Math.max(...values);
  return values.map((v) => Math.max(minSide, Math.sqrt(Math.max(0, v) / m)));
}

/* ───────────── 2. population: exponential vs logistic ───────────── */

/** dN/dt = rN → N = N₀e^{rt}. */
export const expGrowth = (N0: number, r: number, t: number) => N0 * Math.exp(r * t);
/** dN/dt = rN(1 − N/K) → N = K / (1 + ((K − N₀)/N₀) e^{−rt}). */
export const logisticGrowth = (N0: number, K: number, r: number, t: number) => K / (1 + ((K - N0) / N0) * Math.exp(-r * t));

/** All population readouts. r in % per year. */
export function population(rPct: number, N0: number, K: number, t: number) {
  const r = rPct / 100;
  const Nexp = expGrowth(N0, r, t), Nlog = logisticGrowth(N0, K, r, t);
  const doubling = Math.LN2 / r, rule70 = 70 / rPct;
  // logistic inflection (N = K/2) at t* = ln((K − N₀)/N₀)/r; only ahead of us if N₀ < K/2
  const tHalfK = N0 < K / 2 ? Math.log((K - N0) / N0) / r : NaN;
  return { r, Nexp, Nlog, doubling, rule70, tHalfK, dNdtLog: r * Nlog * (1 - Nlog / K), dNdtExp: r * Nexp };
}

/* ───────────── 3. greenhouse: simplified energy-balance model ───────────── */

export const C_PRE = 280;           // pre-industrial CO₂, ppm
export const S0 = 1361;             // solar constant, W/m²
/** Myhre et al. (1998) simplified CO₂ forcing ΔF = 5.35 ln(C/C₀) W/m². */
export const co2Forcing = (C: number, C0 = C_PRE) => 5.35 * Math.log(C / C0);

/** Equilibrium warming ΔT = λ ΔF. An albedo increase Δα reflects S₀/4·Δα more sunlight (negative forcing). */
export function greenhouse(C: number, lambda: number, dAlbedo: number) {
  const dFco2 = co2Forcing(C), dFalb = -(S0 / 4) * dAlbedo, dF = dFco2 + dFalb;
  return { dFco2, dFalb, dF, dT: lambda * dF, dT2x: lambda * co2Forcing(2 * C_PRE), above: C - C_PRE, ratio: C / C_PRE };
}

/* ───────────── 4. dna: transcription, translation, point mutations ───────────── */

const B = "TCAG";
const AA1 = "FFLLSSSSYY**CC*WLLLLPPPPHHQQRRRRIIIMTTTTNNKKSSRRVVVVAAAADDEEGGGG"; // standard genetic code, NCBI table 1
const THREE: Record<string, string> = {
  A: "Ala", R: "Arg", N: "Asn", D: "Asp", C: "Cys", Q: "Gln", E: "Glu", G: "Gly", H: "His", I: "Ile",
  L: "Leu", K: "Lys", M: "Met", F: "Phe", P: "Pro", S: "Ser", T: "Thr", W: "Trp", Y: "Tyr", V: "Val", "*": "Stop",
};
/** mRNA codon (e.g. "AUG") → three-letter amino acid ("Met") or "Stop". */
export const CODON_TABLE: Record<string, string> = (() => {
  const t: Record<string, string> = {};
  for (let i = 0; i < 64; i++) {
    const c = B[i >> 4] + B[(i >> 2) & 3] + B[i & 3];
    t[c.replace(/T/g, "U")] = THREE[AA1[i]];
  }
  return t;
})();

export const DNA_SAMPLES = {
  s1: "ATGGCTTCTAAAGGTGAAGAACTGTTTTAA",
  s2: "ATGAGTAAAGGAGAAGAACTTTTCACTTGA",
  s3: "ATGGCCGCGGGCCCGCGCTGGTAG",
  s4: "ATGTTAAAATATTTAATTTAA",
  s5: "ATGCATCACCATCACCATCACTAA",
} as const;
export type DnaSample = keyof typeof DNA_SAMPLES;
export type MutKind = "none" | "ts" | "tv";

export const complement = (b: string) => ({ A: "T", T: "A", G: "C", C: "G" } as Record<string, string>)[b] ?? b;
/** Coding strand → mRNA (same sequence, U for T). */
export const transcribe = (coding: string) => coding.replace(/T/g, "U");
export const codons = (s: string) => s.match(/.{1,3}/g) ?? [];
/** Transition swaps purine↔purine / pyrimidine↔pyrimidine (A↔G, C↔T); this transversion swaps A↔T, G↔C. */
export function substitute(base: string, kind: MutKind): string {
  if (kind === "ts") return ({ A: "G", G: "A", C: "T", T: "C" } as Record<string, string>)[base] ?? base;
  if (kind === "tv") return complement(base);
  return base;
}
/** Point mutation at 1-based position `pos` of the coding strand. */
export function mutate(seq: string, pos: number, kind: MutKind): string {
  const i = Math.round(pos) - 1;
  if (kind === "none" || i < 0 || i >= seq.length) return seq;
  return seq.slice(0, i) + substitute(seq[i], kind) + seq.slice(i + 1);
}

/** Translate an mRNA in frame from its first base; needs AUG to start, stops at the first stop codon. */
export function translate(mrna: string): { aa: string[]; started: boolean; stopped: boolean } {
  const cs = codons(mrna).filter((c) => c.length === 3);
  if (cs[0] !== "AUG") return { aa: [], started: false, stopped: false };
  const aa: string[] = [];
  for (const c of cs) { const a = CODON_TABLE[c]; if (a === "Stop") return { aa, started: true, stopped: true }; aa.push(a); }
  return { aa, started: true, stopped: false };
}

/** Wallace rule for short oligos: Tm = 2(A+T) + 4(G+C) °C. */
export function wallaceTm(seq: string): number {
  let at = 0, gc = 0;
  for (const b of seq) { if (b === "A" || b === "T") at++; else if (b === "G" || b === "C") gc++; }
  return 2 * at + 4 * gc;
}
export function gcPercent(seq: string): number {
  let gc = 0; for (const b of seq) if (b === "G" || b === "C") gc++;
  return seq.length ? (gc / seq.length) * 100 : 0;
}

export type MutEffect = "none" | "silent" | "missense" | "nonsense" | "start lost" | "stop lost" | "non-coding";
/** Everything the DNA lab shows for one sequence + mutation. */
export function dnaAnalysis(seq: string, pos: number, kind: MutKind) {
  const p = Math.min(seq.length, Math.max(1, Math.round(pos)));
  const mut = mutate(seq, p, kind);
  const orig = translate(transcribe(seq)), now = translate(transcribe(mut));
  const ci = Math.floor((p - 1) / 3);
  const oc = transcribe(codons(seq)[ci] ?? ""), nc = transcribe(codons(mut)[ci] ?? "");
  const oa = CODON_TABLE[oc] ?? "?", na = CODON_TABLE[nc] ?? "?";
  const codingCodons = orig.aa.length + (orig.stopped ? 1 : 0); // codons up to and including the stop
  let effect: MutEffect;
  if (kind === "none") effect = "none";
  else if (ci >= codingCodons || oc.length < 3) effect = "non-coding";
  else if (ci === 0 && !now.started) effect = "start lost";
  else if (oa === na) effect = "silent";
  else if (na === "Stop") effect = "nonsense";
  else if (oa === "Stop") effect = "stop lost";
  else effect = "missense";
  return {
    pos: p, mut, mrna: transcribe(mut), orig, now, codonIndex: ci, oldCodon: oc, newCodon: nc, oldAA: oa, newAA: na,
    oldBase: seq[p - 1], newBase: mut[p - 1], effect, gc: gcPercent(mut), tm: wallaceTm(mut),
  };
}

/* ───────────── 5. microbe: bacterial growth curve ───────────── */

export interface MicrobeParams { mu: number; lag: number; log0: number; logK: number; kd: number; stat: number }
export type MicrobePhase = "Lag" | "Exponential (log)" | "Stationary" | "Death";

/**
 * Simplified model: no growth until the lag time λ; then logistic growth N = K / (1 + (K/N₀ − 1)e^{−μ(t−λ)});
 * nutrients run out once N reaches 99 % of K and the culture stays stationary for `stat` hours; after that cells die
 * first-order, dN/dt = −k_d N.
 */
export function microbeTimes(p: MicrobeParams) {
  const ratio = Math.max(10 ** (p.logK - p.log0) - 1, 1e-9);
  const t90 = p.lag + Math.max(0, Math.log(9 * ratio) / p.mu);
  const t99 = p.lag + Math.max(0, Math.log(99 * ratio) / p.mu);
  return { t90, t99, tDeath: t99 + p.stat };
}
/** log₁₀ N (cells/mL) at time t (h). */
export function microbeLogN(p: MicrobeParams, t: number): number {
  const N0 = 10 ** p.log0, K = 10 ** p.logK;
  const grow = (tt: number) => (tt <= p.lag ? p.log0 : Math.log10(K / (1 + (K / N0 - 1) * Math.exp(-p.mu * (tt - p.lag)))));
  const { tDeath } = microbeTimes(p);
  if (t <= tDeath) return grow(t);
  return Math.max(0, grow(tDeath) - (p.kd * (t - tDeath)) / Math.LN10);
}
export function microbe(p: MicrobeParams, t: number) {
  const { t90, t99, tDeath } = microbeTimes(p);
  const logN = microbeLogN(p, t);
  const peakLog = microbeLogN(p, Math.min(t, tDeath));
  const phase: MicrobePhase = t < p.lag ? "Lag" : t < t90 ? "Exponential (log)" : t < tDeath || p.kd === 0 ? "Stationary" : "Death";
  return { logN, N: 10 ** logN, phase, genTime: Math.LN2 / p.mu, generations: (peakLog - p.log0) / Math.log10(2), t90, t99, tDeath };
}

/* ───────────── 6. boxmodel: CSS box model ───────────── */

export type BoxSizing = "content" | "border";
/** The CSS box model. content-box: width is the content; border-box: width includes padding and border. */
export function boxModel(w: number, h: number, pad: number, bor: number, mar: number, sizing: BoxSizing) {
  const extra = 2 * pad + 2 * bor;
  const contentW = sizing === "content" ? w : Math.max(0, w - extra);
  const contentH = sizing === "content" ? h : Math.max(0, h - extra);
  const borderW = contentW + extra, borderH = contentH + extra;       // what the browser renders (offsetWidth)
  const paddingW = contentW + 2 * pad, paddingH = contentH + 2 * pad;
  const outerW = borderW + 2 * mar, outerH = borderH + 2 * mar;
  const css = `width: ${w}px; height: ${h}px; padding: ${pad}px; border: ${bor}px solid; margin: ${mar}px; box-sizing: ${sizing}-box;`;
  return { contentW, contentH, paddingW, paddingH, borderW, borderH, outerW, outerH, extra, css };
}
