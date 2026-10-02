/** Pure maths for the second set of BCA labs (BCA-003 Digital Electronics, BCA-006 Data Structures). No React, no three. */
import { bitsOf, popcount } from "./bcax";

export { bitsOf, popcount };
export const mask = (n: number) => (1 << n) - 1;
export const lg2c = (n: number) => (n <= 1 ? 0 : Math.ceil(Math.log2(n)));

/* ===================== BCA-003 Digital Electronics ===================== */

/* ---- universal gates (NAND / NOR) and De Morgan ---- */
export type Basis = "nand" | "nor";
export type Target = "not" | "and" | "or" | "xor";
/** Netlists: nets 0 = A, 1 = B, gate i drives net 2 + i; every gate has two inputs of the same basis gate. The last gate is the output. */
export const NETLIST: Record<Basis, Record<Target, [number, number][]>> = {
  nand: { not: [[0, 0]], and: [[0, 1], [2, 2]], or: [[0, 0], [1, 1], [2, 3]], xor: [[0, 1], [0, 2], [1, 2], [3, 4]] },
  nor: { not: [[0, 0]], or: [[0, 1], [2, 2]], and: [[0, 0], [1, 1], [2, 3]], xor: [[0, 1], [0, 2], [1, 2], [3, 4], [5, 5]] },
};
export const basisGate = (b: Basis, x: number, y: number) => (b === "nand" ? (x & y) ^ 1 : (x | y) ^ 1);
export function evalNet(basis: Basis, target: Target, a: number, b: number): number[] {
  const nets = [a, b];
  for (const [i, j] of NETLIST[basis][target]) nets.push(basisGate(basis, nets[i], nets[j]));
  return nets;
}
export const targetOut = (t: Target, a: number, b: number) => (t === "not" ? a ^ 1 : t === "and" ? a & b : t === "or" ? a | b : a ^ b);
/** Level (depth from the inputs) of each gate in a netlist. */
export function netLevels(basis: Basis, target: Target): number[] {
  const lv = [0, 0];
  return NETLIST[basis][target].map(([i, j]) => { const d = Math.max(lv[i], lv[j]) + 1; lv.push(d); return d; });
}
export const gateCountU = (basis: Basis, target: Target) => NETLIST[basis][target].length;
export function deMorgan(a: number, b: number) {
  return { nandAB: (a & b) ^ 1, orNots: (a ^ 1) | (b ^ 1), norAB: (a | b) ^ 1, andNots: (a ^ 1) & (b ^ 1) };
}

/* ---- parity and Hamming (7,4) ---- */
/** Hamming (7,4) codeword in positions 1..7 = p1 p2 d1 p4 d2 d3 d4 (d1 = MSB of the nibble). */
export function hammingEncode(d: number): number[] {
  const [d1, d2, d3, d4] = bitsOf(d, 4);
  return [d1 ^ d2 ^ d4, d1 ^ d3 ^ d4, d1, d2 ^ d3 ^ d4, d2, d3, d4];
}
export function hammingSyndrome(c: number[]) {
  const s1 = c[0] ^ c[2] ^ c[4] ^ c[6], s2 = c[1] ^ c[2] ^ c[5] ^ c[6], s4 = c[3] ^ c[4] ^ c[5] ^ c[6];
  return { s1, s2, s4, pos: s4 * 4 + s2 * 2 + s1 };
}
export function flipAt(w: number[], ps: number[]): number[] {
  const o = w.slice();
  for (const p of ps) if (p >= 1 && p <= o.length) o[p - 1] ^= 1;
  return o;
}
export function hammingRun(d: number, e1: number, e2: number) {
  const sent = hammingEncode(d), rx = flipAt(sent, [e1, e2]), syn = hammingSyndrome(rx);
  const fixed = syn.pos > 0 ? flipAt(rx, [syn.pos]) : rx.slice();
  const out = fixed[2] * 8 + fixed[4] * 4 + fixed[5] * 2 + fixed[6];
  return { sent, rx, syn, fixed, out, ok: out === d, nErr: (e1 >= 1 && e1 <= 7 ? 1 : 0) + (e2 >= 1 && e2 <= 7 ? 1 : 0) - (e1 === e2 && e1 >= 1 ? 2 : 0) };
}
export const parityBit = (d: number, odd: boolean) => (popcount(d & 15) & 1) ^ (odd ? 1 : 0);
export function parityRun(d: number, odd: boolean, e1: number, e2: number) {
  const word = [...bitsOf(d, 4), parityBit(d, odd)], rx = flipAt(word, [e1, e2]);
  const ones = rx.reduce((s, b) => s + b, 0), bad = (ones & 1) !== (odd ? 1 : 0);
  const flips = rx.filter((b, i) => b !== word[i]).length;
  return { word, rx, detected: bad, flips };
}

/* ---- canonical SOP / POS of a 3-variable function f (bit m of f is f at minterm m = ABC) ---- */
export const minterms3 = (f: number) => [0, 1, 2, 3, 4, 5, 6, 7].filter((m) => (f >> m) & 1);
export const maxterms3 = (f: number) => [0, 1, 2, 3, 4, 5, 6, 7].filter((m) => !((f >> m) & 1));
export function sopString(f: number): string {
  const ms = minterms3(f);
  if (!ms.length) return "0";
  if (ms.length === 8) return "1";
  return ms.map((m) => "ABC".split("").map((v, i) => ((m >> (2 - i)) & 1 ? v : v + "'")).join("")).join(" + ");
}
export function posString(f: number): string {
  const ms = maxterms3(f);
  if (!ms.length) return "1";
  if (ms.length === 8) return "0";
  return ms.map((m) => "(" + "ABC".split("").map((v, i) => ((m >> (2 - i)) & 1 ? v + "'" : v)).join(" + ") + ")").join("");
}
/** Data inputs of a 4:1 multiplexer (selects A, B) that implements f: 0, 1, C or C'. */
export function mux4Inputs(f: number): string[] {
  return [0, 1, 2, 3].map((ab) => {
    const c0 = (f >> (ab * 2)) & 1, c1 = (f >> (ab * 2 + 1)) & 1;
    return c0 === 0 && c1 === 0 ? "0" : c0 === 1 && c1 === 1 ? "1" : c1 === 1 ? "C" : "C'";
  });
}
export function evalMux4(inputs: string[], a: number, b: number, c: number): number {
  const s = inputs[a * 2 + b];
  return s === "0" ? 0 : s === "1" ? 1 : s === "C" ? c : c ^ 1;
}

/* ---- BCD to seven-segment decoder ---- */
const SEGS = "abcdefg";
const SEG_STR: Record<number, string> = { 0: "abcdef", 1: "bc", 2: "abdeg", 3: "abcdg", 4: "bcfg", 5: "acdfg", 6: "acdefg", 7: "abc", 8: "abcdefg", 9: "abcdfg", 10: "abcefg", 11: "cdefg", 12: "adef", 13: "bcdeg", 14: "adefg", 15: "aefg" };
/** Segment states a..g (1 = lit) for input d. Inputs above 9 are blank, or shown as hex letters. */
export function segments(d: number, dc: "blank" | "hex"): number[] {
  if (d > 9 && dc === "blank") return [0, 0, 0, 0, 0, 0, 0];
  return SEGS.split("").map((s) => (SEG_STR[d].includes(s) ? 1 : 0));
}
/** Minimised sum-of-products of each segment for BCD digits 0-9 (A = MSB, don't cares 10-15 used). */
export const SEG_EQ: Record<string, string> = {
  a: "A + C + BD + B'D'", b: "B' + C'D' + CD", c: "B + C' + D", d: "A + B'D' + B'C + CD' + BC'D",
  e: "B'D' + CD'", f: "A + C'D' + BC' + BD'", g: "A + BC' + B'C + CD'",
};
export function segEval(seg: string, d: number): number {
  const A = (d >> 3) & 1, B = (d >> 2) & 1, C = (d >> 1) & 1, D = d & 1, n = (x: number) => x ^ 1;
  switch (seg) {
    case "a": return A | C | (B & D) | (n(B) & n(D));
    case "b": return n(B) | (n(C) & n(D)) | (C & D);
    case "c": return B | n(C) | D;
    case "d": return A | (n(B) & n(D)) | (n(B) & C) | (C & n(D)) | (B & n(C) & D);
    case "e": return (n(B) & n(D)) | (C & n(D));
    case "f": return A | (n(C) & n(D)) | (B & n(C)) | (B & n(D));
    default: return A | (B & n(C)) | (n(B) & C) | (C & n(D));
  }
}
/** Series-resistor LED current in mA for one lit segment (5 V supply, 2 V LED drop). */
export const segCurrent = (r: number) => (3 / r) * 1000;

/* ---- magnitude comparator ---- */
export function compareN(a: number, b: number, n: number) {
  const m = mask(n), x = a & m, y = b & m;
  return { a: x, b: y, gt: x > y, eq: x === y, lt: x < y };
}
/** Index from the MSB (0 = MSB) of the first bit where a and b differ, or -1 when equal. */
export function decidingBit(a: number, b: number, n: number): number {
  const x = bitsOf(a & mask(n), n), y = bitsOf(b & mask(n), n);
  return x.findIndex((v, i) => v !== y[i]);
}

/* ---- latches ---- */
export type LatchKind = "srnor" | "srnand" | "gatedd";
/** Input pairs applied one per step. srnor: (S,R). srnand: (S',R'). gatedd: (E,D). */
export const LATCH_SEQ: Record<LatchKind, string[]> = {
  srnor: ["00", "10", "00", "01", "00", "11", "00", "10"],
  srnand: ["11", "01", "11", "10", "11", "00", "11", "01"],
  gatedd: ["01", "11", "01", "10", "00", "11", "10", "11"],
};
/** Q after each step: 0, 1, or 2 = unpredictable. Also flags the forbidden input. */
export function latchRun(kind: LatchKind, k: number) {
  const seq = LATCH_SEQ[kind], qs: number[] = [0], bad: boolean[] = [false];
  for (let i = 0; i < Math.min(k, seq.length); i++) {
    const [x, y] = seq[i].split("").map(Number), q = qs[qs.length - 1];
    let nq = q, forb = false;
    if (kind === "srnor") { if (x && y) { nq = 0; forb = true; } else if (x) nq = 1; else if (y) nq = 0; else nq = q === 2 || bad[bad.length - 1] ? 2 : q; }
    else if (kind === "srnand") { if (!x && !y) { nq = 1; forb = true; } else if (!x) nq = 1; else if (!y) nq = 0; else nq = q === 2 || bad[bad.length - 1] ? 2 : q; }
    else { nq = x ? y : q; }
    qs.push(nq); bad.push(forb);
  }
  return { qs, bad, seq };
}
/** A level-triggered JK with J = K = 1 toggles every tpd while the clock is high. A master-slave JK toggles once. */
export const raceToggles = (pw: number, tpd: number) => Math.floor(pw / tpd);
/** Longest clock pulse (ns) that still gives one toggle in a level-triggered JK. */
export const maxPulse = (tpd: number) => tpd * 2 - 1e-9;

/* ---- shift registers ---- */
export type SrMode = "siso" | "sipo" | "piso" | "pipo" | "bidir";
export function shiftRun(mode: SrMode, din: number, k: number, left: boolean) {
  const stream = bitsOf(din, 4);
  let reg = [0, 0, 0, 0];
  const out: number[] = [];
  for (let t = 1; t <= k; t++) {
    if (mode === "pipo") reg = stream.slice();
    else if (mode === "piso") {
      if (t === 1) reg = stream.slice().reverse();
      else { out.push(reg[3]); reg = [0, reg[0], reg[1], reg[2]]; }
    } else {
      const bit = t <= 4 ? stream[t - 1] : 0;
      if (mode === "bidir" && left) { out.push(reg[0]); reg = [reg[1], reg[2], reg[3], bit]; }
      else { out.push(reg[3]); reg = [bit, reg[0], reg[1], reg[2]]; }
    }
  }
  return { reg, out, stream };
}
export const SR_CLOCKS: Record<SrMode, { load: number; read: number; total: number }> = {
  siso: { load: 4, read: 4, total: 8 }, sipo: { load: 4, read: 0, total: 4 }, piso: { load: 1, read: 3, total: 4 }, pipo: { load: 1, read: 0, total: 1 }, bidir: { load: 4, read: 4, total: 8 },
};

/* ---- synchronous up / down counter design with T (or J = K) flip-flops ---- */
export function udNext(q: number, dir: "up" | "down" | "ud", up: boolean, m: number): number {
  const goUp = dir === "up" || (dir === "ud" && up);
  return goUp ? (q + 1) % m : (q - 1 + m) % m;
}
export function udRun(k: number, dir: "up" | "down" | "ud", up: boolean, m: number) {
  let q = 0;
  for (let i = 0; i < k; i++) q = udNext(q, dir, up, m);
  const nx = udNext(q, dir, up, m);
  return { q, nx, t: q ^ nx };
}
export function tEquations(dir: "up" | "down" | "ud"): string[] {
  if (dir === "up") return ["T0 = 1", "T1 = Q0", "T2 = Q0 Q1", "T3 = Q0 Q1 Q2"];
  if (dir === "down") return ["T0 = 1", "T1 = Q0'", "T2 = Q0' Q1'", "T3 = Q0' Q1' Q2'"];
  return ["T0 = 1", "T1 = X Q0 + X' Q0'", "T2 = X Q0 Q1 + X' Q0' Q1'", "T3 = X Q0 Q1 Q2 + X' Q0' Q1' Q2'"];
}
/** Maximum clock frequency (MHz) of the synchronous counter: clock-to-Q + AND-gate chain + set-up. */
export const udFmax = (tcq: number, tand: number, tsu: number, bits: number) => 1000 / (tcq + Math.max(0, bits - 2) * tand + tsu);

/* ---- state assignment ---- */
export type Enc = "binary" | "gray" | "onehot";
export const encBits = (enc: Enc, n: number) => (enc === "onehot" ? n : Math.max(1, lg2c(n)));
export const encodeState = (enc: Enc, i: number) => (enc === "binary" ? i : enc === "gray" ? i ^ (i >> 1) : 1 << i);
export function assignStats(enc: Enc, n: number) {
  const flips: number[] = [];
  for (let i = 0; i < n; i++) flips.push(popcount(encodeState(enc, i) ^ encodeState(enc, (i + 1) % n)));
  const ffs = encBits(enc, n), total = flips.reduce((s, x) => s + x, 0), max = Math.max(...flips);
  return { ffs, flips, total, max, avg: total / n, singleStep: max === 1, decodeGates: enc === "onehot" ? 0 : n, unused: (enc === "onehot" ? 2 ** n : 2 ** ffs) - n };
}

/* ---- set-up, hold and maximum clock frequency ---- */
export function timing(p: { tclk: number; tcq: number; tlogic: number; tsu: number; th: number; skew: number }) {
  const path = p.tcq + p.tlogic + p.tsu - p.skew;
  const setupSlack = p.tclk - path, holdSlack = p.tcq + p.tlogic / 2 - p.th - p.skew;
  return { path, setupSlack, holdSlack, fmax: 1000 / path, f: 1000 / p.tclk, setupOk: setupSlack >= 0, holdOk: holdSlack >= 0, arrive: p.tcq + p.tlogic };
}

/* ---- memories ---- */
export function memStats(a: number, w: number) {
  const words = 2 ** a, bits = words * w;
  return { words, bits, bytes: bits / 8 };
}
export function memChips(a: number, w: number, ca: number, cw: number) {
  const cA = Math.min(ca, a), rows = 2 ** (a - cA), cols = Math.ceil(w / cw);
  return { rows, cols, chips: rows * cols, selectBits: a - cA, wasted: cols * cw - w };
}
export const romWord = (ad: number, w: number) => (ad * ad) & mask(w);
export const ramWord = (ad: number, w: number) => (ad * 5 + 3) & mask(w);

/* ---- PLA / PAL ---- */
export type PlaFn = { name: string; vars: string; outs: string[]; terms: { pat: string; outs: number[] }[] };
export const PLA_FNS: Record<"fadd" | "gray" | "mux", PlaFn> = {
  fadd: { name: "Full adder", vars: "ABC", outs: ["Sum", "Cout"], terms: [{ pat: "001", outs: [0] }, { pat: "010", outs: [0] }, { pat: "100", outs: [0] }, { pat: "111", outs: [0] }, { pat: "11-", outs: [1] }, { pat: "1-1", outs: [1] }, { pat: "-11", outs: [1] }] },
  gray: { name: "Binary to Gray", vars: "ABC", outs: ["G2", "G1", "G0"], terms: [{ pat: "1--", outs: [0] }, { pat: "01-", outs: [1] }, { pat: "10-", outs: [1] }, { pat: "-01", outs: [2] }, { pat: "-10", outs: [2] }] },
  mux: { name: "2:1 multiplexer", vars: "SAB", outs: ["Y"], terms: [{ pat: "01-", outs: [0] }, { pat: "1-1", outs: [0] }] },
};
export const termOn = (pat: string, x: number) => pat.split("").every((c, i) => c === "-" || Number(c) === ((x >> (2 - i)) & 1));
export function termsOfOut(fn: PlaFn, o: number): number[] { return fn.terms.map((t, i) => (t.outs.includes(o) ? i : -1)).filter((i) => i >= 0); }
/** Outputs of the programmed device: a PLA shares terms; a PAL gives each output only `pt` terms of its own. */
export function plaOutputs(fn: PlaFn, x: number, dev: "pla" | "pal", pt: number): number[] {
  return fn.outs.map((_, o) => {
    const idx = termsOfOut(fn, o), use = dev === "pal" ? idx.slice(0, pt) : idx;
    return use.some((i) => termOn(fn.terms[i].pat, x)) ? 1 : 0;
  });
}
export const plaTruth = (fn: PlaFn, x: number) => fn.outs.map((_, o) => (termsOfOut(fn, o).some((i) => termOn(fn.terms[i].pat, x)) ? 1 : 0));
export function plaFuses(fn: PlaFn, dev: "pla" | "pal", pt: number) {
  const nIn = fn.vars.length, nOut = fn.outs.length, P = fn.terms.length;
  const need = Math.max(...fn.outs.map((_, o) => termsOfOut(fn, o).length));
  return dev === "pla"
    ? { and: P * 2 * nIn, or: P * nOut, terms: P, fits: true, need }
    : { and: nOut * pt * 2 * nIn, or: 0, terms: nOut * pt, fits: pt >= need, need };
}

/* ---- totem-pole, open-collector and tri-state outputs ---- */
export const OC = { vol: 0.4, voh: 2.4, iol: 16, ioh: 0.25, iil: 1.6, iih: 0.04 }; // V, V, mA, mA, mA, mA
/** Pull-up limits in kilo-ohms for n open-collector gates wired together driving m TTL loads. */
export function ocPullUp(vcc: number, n: number, m: number) {
  const room = OC.iol - m * OC.iil, leak = n * OC.ioh + m * OC.iih;
  return { min: room > 0 ? (vcc - OC.vol) / room : Infinity, max: (vcc - OC.voh) / leak, room, leak };
}
export const totemShort = (vcc: number) => ((vcc - 1.6) / 130) * 1000; // mA through the 130 ohm resistor
export function busState(en: number, data = [1, 0, 1]): { state: string; contention: boolean; drivers: number } {
  const on = [0, 1, 2].filter((i) => (en >> i) & 1);
  if (!on.length) return { state: "Z (floating)", contention: false, drivers: 0 };
  const vals = new Set(on.map((i) => data[i]));
  return vals.size > 1 ? { state: "X (contention)", contention: true, drivers: on.length } : { state: String([...vals][0]), contention: false, drivers: on.length };
}

/* ---- CMOS gates ---- */
export type CGate = "inv" | "nand" | "nor";
export function cmosEval(g: CGate, a: number, b: number) {
  const pa = a === 0, pb = b === 0, na = a === 1, nb = b === 1; // PMOS conducts on 0, NMOS on 1
  const up = g === "inv" ? pa : g === "nand" ? pa || pb : pa && pb;
  const down = g === "inv" ? na : g === "nand" ? na && nb : na || nb;
  return { pmos: [pa, g === "inv" ? false : pb], nmos: [na, g === "inv" ? false : nb], up, down, out: up ? 1 : 0 };
}
export const dynPower = (cl: number, vdd: number, mhz: number) => cl * vdd * vdd * mhz; // microwatts for pF, V, MHz
