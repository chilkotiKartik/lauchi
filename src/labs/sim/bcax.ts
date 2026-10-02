/** Pure maths for the BCA labs (Digital Electronics, Data Structures, Computer Organization, Java). No React, no three. */

export const bitsOf = (v: number, n: number): number[] => Array.from({ length: n }, (_, i) => (v >> (n - 1 - i)) & 1);
export const bstr = (v: number, n: number) => bitsOf(v, n).join("");
export const popcount = (v: number) => { let c = 0; for (let x = v; x > 0; x >>= 1) c += x & 1; return c; };

/* ===================== BCA-003 Digital Electronics ===================== */

/** 8-bit signed forms of n (|n| <= 127). */
export function signedForms(n: number, bits = 8) {
  const mag = Math.abs(n), mask = (1 << bits) - 1;
  return {
    sm: (n < 0 ? 1 << (bits - 1) : 0) | mag,
    ones: n < 0 ? ~mag & mask : mag,
    twos: n < 0 ? (mask + 1 - mag) & mask : mag,
  };
}
export const fromTwos = (v: number, bits = 8) => (v & (1 << (bits - 1)) ? v - (1 << bits) : v);

/** Decimal digit d (0-9) in the 4-bit codes of the syllabus. */
export function digitCodes(d: number) {
  return { bcd: d, xs3: d + 3, gray: d ^ (d >> 1), parity: popcount(d) & 1 };
}

/** An 8-bit pattern read as xxxx.xxxx (four integer bits, four fraction bits). */
export function fracBinary(fb: number) {
  const int = fb >> 4, fr = fb & 15;
  return { int, fr, value: int + fr / 16 };
}

export type Imp = { bits: string; terms: number[]; used: boolean };
export type QM = { cols: Imp[][]; primes: Imp[]; essential: string[]; cover: Imp[]; chart: { m: number; by: string[] }[]; sop: string };

const ones = (s: string) => s.split("").filter((c) => c === "1").length;
export function impSop(i: Imp, nv: number) {
  const L = "ABCDE".slice(0, nv);
  let o = "";
  for (let k = 0; k < nv; k++) if (i.bits[k] === "1") o += L[k]; else if (i.bits[k] === "0") o += L[k] + "'";
  return o || "1";
}
export const impCovers = (i: Imp, m: number, nv: number) => {
  const b = m.toString(2).padStart(nv, "0");
  return i.bits.split("").every((c, k) => c === "-" || c === b[k]);
};

/** Quine-McCluskey tabular minimisation. */
export function qm(minterms: number[], nv: number): QM {
  const ms = [...new Set(minterms)].sort((a, b) => a - b);
  let cur: Imp[] = ms.map((m) => ({ bits: m.toString(2).padStart(nv, "0"), terms: [m], used: false }));
  const cols: Imp[][] = [], primes: Imp[] = [];
  while (cur.length) {
    cur.sort((a, b) => ones(a.bits) - ones(b.bits) || (a.bits < b.bits ? -1 : 1));
    cols.push(cur);
    const next = new Map<string, Imp>();
    for (let i = 0; i < cur.length; i++) for (let j = i + 1; j < cur.length; j++) {
      const a = cur[i].bits, b = cur[j].bits;
      let diff = -1, ok = true;
      for (let k = 0; k < nv && ok; k++) if (a[k] !== b[k]) { if (a[k] === "-" || b[k] === "-" || diff >= 0) ok = false; else diff = k; }
      if (ok && diff >= 0) {
        const bits = a.slice(0, diff) + "-" + a.slice(diff + 1);
        cur[i].used = true; cur[j].used = true;
        if (!next.has(bits)) next.set(bits, { bits, terms: [...new Set([...cur[i].terms, ...cur[j].terms])].sort((x, y) => x - y), used: false });
      }
    }
    primes.push(...cur.filter((x) => !x.used));
    cur = [...next.values()];
  }
  const chart = ms.map((m) => ({ m, by: primes.filter((p) => impCovers(p, m, nv)).map((p) => p.bits) }));
  const essential = [...new Set(chart.filter((r) => r.by.length === 1).map((r) => r.by[0]))];
  const cover: Imp[] = primes.filter((p) => essential.includes(p.bits));
  let left = ms.filter((m) => !cover.some((p) => impCovers(p, m, nv)));
  while (left.length) {
    let best: Imp | null = null, bc = -1;
    for (const p of primes) if (!cover.includes(p)) { const c = left.filter((m) => impCovers(p, m, nv)).length; if (c > bc) { bc = c; best = p; } }
    if (!best || bc <= 0) break;
    cover.push(best);
    left = left.filter((m) => !impCovers(best!, m, nv));
  }
  return { cols, primes, essential, cover, chart, sop: cover.map((p) => impSop(p, nv)).join(" + ") || "0" };
}

export const QM_SETS = {
  q34: { m: [0, 1, 5, 7, 10, 14], nv: 4, name: "PYQ Q3.4: f(A,B,C,D) = Σm(0,1,5,7,10,14)" },
  cyc: { m: [0, 1, 2, 5, 6, 7, 8, 9, 10, 14], nv: 4, name: "Cyclic cover: Σm(0,1,2,5,6,7,8,9,10,14)" },
  q33: { m: [0, 1, 2, 4, 7, 8, 12, 14, 15, 16, 17, 18, 20, 24, 28, 30, 31], nv: 5, name: "PYQ Q3.3: 5-variable Σm(0,1,2,4,7,8,12,14,15,16,17,18,20,24,28,30,31)" },
} as const;

/** n-bit adder. Bits are listed least significant first. */
export function addBits(a: number, b: number, cin: number, n = 4) {
  const s: number[] = [], c: number[] = [cin], p: number[] = [], g: number[] = [];
  for (let i = 0; i < n; i++) {
    const x = (a >> i) & 1, y = (b >> i) & 1;
    p.push(x ^ y); g.push(x & y);
    s.push((x ^ y) ^ c[i]);
    c.push((x & y) | ((x ^ y) & c[i]));
  }
  return { s, c, p, g, value: s.reduce((acc, bit, i) => acc + (bit << i), 0), cout: c[n] };
}
/** Gate delays (every AND, OR, XOR = 1 unit): ripple carry grows 2 per stage, look-ahead is flat. */
export const adderDelay = (n: number, kind: "ripple" | "lookahead") => (kind === "ripple" ? { sum: 2 * n, cout: 2 * n + 1 } : { sum: 4, cout: 3 });
/** a - b by adding the 2's complement; cout = 1 means no borrow (a >= b). */
export function subtract(a: number, b: number, n = 4) {
  const mask = (1 << n) - 1, r = addBits(a, ~b & mask, 1, n);
  return { diff: r.value, noBorrow: r.cout === 1, bits: r.s, c: r.c, signed: r.cout === 1 ? r.value : r.value - (1 << n) };
}
/** One BCD digit adder: binary add, then add 6 when the result exceeds 9. */
export function bcdAdd(a: number, b: number, cin: number) {
  const z = a + b + cin, fix = z > 9;
  const r = fix ? z + 6 : z;
  return { z, fix, digit: r & 15, carry: fix ? 1 : 0, text: `${fix ? 1 : 0}${r & 15}` };
}

export const muxOut = (data: number, sel: number) => (data >> sel) & 1;
export const decoder = (sel: number, en: boolean, n = 3) => (en ? 1 << sel : 0) & ((1 << (1 << n)) - 1);
export function prioEnc(data: number) {
  if (!data) return { valid: 0, y: 0 };
  let y = 0;
  for (let i = 0; i < 8; i++) if ((data >> i) & 1) y = i;
  return { valid: 1, y };
}
/** 16:1 multiplexer from four 4:1 multiplexers and one more 4:1 multiplexer. */
export function mux16(data: number, sel: number) {
  const g = sel >> 2, inner = sel & 3;
  const firstRank = [0, 1, 2, 3].map((k) => (data >> (4 * k + inner)) & 1);
  return { g, inner, firstRank, out: firstRank[g], chips: 5 };
}

export type FF = "SR" | "JK" | "D" | "T";
export function ffNext(t: FF, q: number, x: number, y: number): { q: number; kind: string; bad: boolean } {
  if (t === "D") return { q: x, kind: x ? "set" : "reset", bad: false };
  if (t === "T") return { q: x ? 1 - q : q, kind: x ? "toggle" : "hold", bad: false };
  if (t === "SR") {
    if (x && y) return { q: 0, kind: "invalid", bad: true };
    return x ? { q: 1, kind: "set", bad: false } : y ? { q: 0, kind: "reset", bad: false } : { q, kind: "hold", bad: false };
  }
  if (x && y) return { q: 1 - q, kind: "toggle", bad: false };
  return x ? { q: 1, kind: "set", bad: false } : y ? { q: 0, kind: "reset", bad: false } : { q, kind: "hold", bad: false };
}
/** Excitation tables: inputs the base flip-flop needs to go from q to qn (don't-cares taken as 0). */
export function excite(base: FF, q: number, qn: number): [number, number] {
  if (base === "D") return [qn, 0];
  if (base === "T") return [q ^ qn, 0];
  if (base === "SR") return q === 0 ? (qn ? [1, 0] : [0, 0]) : qn ? [0, 0] : [0, 1];
  return q === 0 ? (qn ? [1, 0] : [0, 0]) : qn ? [0, 0] : [0, 1];
}
export const FF_TWO = (t: FF) => t === "SR" || t === "JK";
/** Clock k pulses. Target flip-flop `tgt` is built from `base`; its inputs come from the bit patterns xs and ys (bit i for pulse i). */
export function ffRun(base: FF, tgt: FF, k: number, xs: number, ys: number, q0 = 0) {
  const qs = [q0], tin: [number, number][] = [], bin: [number, number][] = [], kinds: string[] = [];
  for (let i = 0; i < k; i++) {
    const x = (xs >> i) & 1, y = FF_TWO(tgt) ? (ys >> i) & 1 : 0, q = qs[i];
    const r = ffNext(tgt, q, x, y);
    const qn = r.bad ? q : r.q;
    tin.push([x, y]);
    bin.push(base === tgt ? [x, y] : excite(base, q, qn));
    kinds.push(r.kind);
    qs.push(qn);
  }
  return { qs, tin, bin, kinds };
}

export type Ctr = "ripple" | "sync" | "ring" | "johnson" | "shift";
/** State of an n-bit register after k clock pulses, most significant bit first. */
export function ctrState(kind: Ctr, n: number, k: number, din = 0): number[] {
  if (kind === "ripple" || kind === "sync") return bitsOf(k % (1 << n), n);
  let s = kind === "ring" ? bitsOf(1 << (n - 1), n) : Array(n).fill(0);
  for (let i = 0; i < k; i++) {
    const head = kind === "ring" ? s[n - 1] : kind === "johnson" ? 1 - s[n - 1] : (din >> (i % 8)) & 1;
    s = [head, ...s.slice(0, n - 1)];
  }
  return s;
}
export const ctrMod = (kind: Ctr, n: number) => (kind === "ripple" || kind === "sync" ? 2 ** n : kind === "ring" ? n : kind === "johnson" ? 2 * n : n);
/** Highest clock frequency (MHz): ripple adds every flip-flop delay, synchronous adds one flip-flop and one gate. */
export const ctrFmax = (kind: Ctr, n: number, tpd: number, tg: number) => (kind === "ripple" ? 1000 / (n * tpd) : 1000 / (tpd + tg));

export type Mach = { next: Record<string, [string, string]>; out: Record<string, [number, number]> };
export const RED_STATES = ["a", "b", "c", "d", "e"] as const;
export const RED_MACHINE: Mach = {
  next: { a: ["a", "b"], b: ["c", "d"], c: ["a", "b"], d: ["e", "d"], e: ["a", "b"] },
  out: { a: [0, 0], b: [0, 0], c: [0, 0], d: [0, 1], e: [0, 0] },
};
/** Partition refinement; rounds[0] is split by outputs, the last round is stable. */
export function reduceStates(m: Mach = RED_MACHINE): string[][][] {
  const st = Object.keys(m.next);
  const key0 = (s: string) => m.out[s].join("");
  const group = (key: (s: string) => string) => { const mp = new Map<string, string[]>(); for (const s of st) { const k = key(s); mp.set(k, [...(mp.get(k) ?? []), s]); } return [...mp.values()]; };
  let part = group(key0);
  const rounds = [part];
  for (;;) {
    const idx = (s: string) => part.findIndex((g) => g.includes(s));
    const nxt = group((s) => `${idx(s)}|${idx(m.next[s][0])}|${idx(m.next[s][1])}`);
    if (nxt.length === part.length) break;
    part = nxt; rounds.push(part);
  }
  return rounds;
}

/** Overlapping sequence detector machine. Mealy has L states; Moore has L+1 (one extra "matched" state). */
export function detMachine(pat: string, model: "mealy" | "moore") {
  const L = pat.length, p = pat.split("").map(Number);
  const pi = Array(L).fill(0);
  for (let i = 1, k = 0; i < L; i++) { while (k && p[i] !== p[k]) k = pi[k - 1]; if (p[i] === p[k]) k++; pi[i] = k; }
  const step = (s: number, b: number) => { let q = s; if (q === L) q = pi[L - 1]; while (q && p[q] !== b) q = pi[q - 1]; return p[q] === b ? q + 1 : 0; };
  const delta = (s: number, b: number): { to: number; out: number } => {
    const raw = step(s, b);
    if (model === "mealy") return { to: raw === L ? pi[L - 1] : raw, out: raw === L ? 1 : 0 };
    return { to: raw, out: raw === L ? 1 : 0 };
  };
  return { L, states: model === "mealy" ? L : L + 1, delta };
}
export function detector(pat: string, model: "mealy" | "moore", input: number[]) {
  const m = detMachine(pat, model);
  let s = 0, hits = 0;
  const steps = input.map((b) => {
    const r = m.delta(s, b), from = s;
    hits += r.out; s = r.to;
    return { b, from, to: r.to, out: r.out, hits };
  });
  return { states: m.states, steps, L: m.L };
}

export type Wave = { t: number[]; A: number[]; An: number[]; P1: number[]; P2: number[]; P3: number[]; F: number[] };
/** F = AB + A'C with B = C = 1 while A falls at t = 2 ns. */
export function hazardWave(dinv: number, dand: number, cons: boolean, tEnd = 12, dt = 0.05): Wave {
  const t0 = 2, w: Wave = { t: [], A: [], An: [], P1: [], P2: [], P3: [], F: [] };
  const A = (t: number) => (t < t0 ? 1 : 0), An = (t: number) => 1 - A(t - dinv);
  for (let t = 0; t <= tEnd + 1e-9; t += dt) {
    const a = A(t), an = An(t), p1 = A(t - dand), p2 = An(t - dand), p3 = cons ? 1 : 0;
    w.t.push(t); w.A.push(a); w.An.push(an); w.P1.push(p1); w.P2.push(p2); w.P3.push(p3); w.F.push(p1 | p2 | p3);
  }
  return w;
}
export const glitchWidth = (dinv: number, cons: boolean) => (cons ? 0 : dinv);
/** Two-variable race: both y1 and y2 must go 0 to 1. The faster one flips first. */
export function raceResult(critical: boolean, d1: number, d2: number) {
  const mid = Math.abs(d1 - d2) < 1e-9 ? "11" : d1 < d2 ? "10" : "01";
  const final = critical ? (mid === "11" ? "11" : mid) : "11";
  return { mid, final };
}

export type Fam = "TTL" | "CMOS" | "ECL";
export function famLevels(f: Fam, vdd: number) {
  if (f === "TTL") return { voh: 2.4, vol: 0.4, vih: 2.0, vil: 0.8, lo: 0, hi: 5 };
  if (f === "ECL") return { voh: -0.9, vol: -1.75, vih: -1.165, vil: -1.475, lo: -2.2, hi: -0.5 };
  return { voh: vdd, vol: 0, vih: 0.7 * vdd, vil: 0.3 * vdd, lo: 0, hi: vdd };
}
export function famMetrics(f: Fam, vdd: number, n: number, mhz: number, cl: number) {
  const v = famLevels(f, vdd), nmh = v.voh - v.vih, nml = v.vil - v.vol;
  const limit = f === "TTL" ? Math.min(Math.floor(16 / 1.6), Math.floor(0.4 / 0.04)) : f === "ECL" ? 25 : 50;
  const perLoad = f === "TTL" ? 0.8 : f === "ECL" ? 0.1 : 1.5 * (5 / vdd);
  const tp0 = f === "TTL" ? 10 : f === "ECL" ? 1 : 8 * (5 / vdd);
  const tpd = tp0 + perLoad * n;
  const power = f === "TTL" ? 10 : f === "ECL" ? 25 : (cl + n * 5) * 1e-12 * vdd * vdd * mhz * 1e6 * 1e3;
  return { ...v, nmh, nml, limit, tpd, power, overloaded: n > limit };
}

/* ===================== BCA-006 Data Structures ===================== */

export type SFrame = { cells: (string | null)[]; top: number; front: number; rear: number; count: number; op: string; note: string; out: string; err: boolean };

/** Array stack of capacity cap: six pushes then seven pops (so small stacks overflow and the last pop underflows). */
export function stackFrames(cap: number): SFrame[] {
  const script = ["push 10", "push 20", "push 30", "push 40", "push 50", "push 60", "pop", "pop", "pop", "pop", "pop", "pop", "pop"];
  const arr: (string | null)[] = Array(cap).fill(null);
  let top = -1;
  const fr: SFrame[] = [{ cells: [...arr], top, front: 0, rear: -1, count: 0, op: "start", note: "Empty stack: top = -1", out: "", err: false }];
  for (const op of script) {
    let note = "", err = false;
    if (op.startsWith("push")) {
      const v = op.split(" ")[1];
      if (top === cap - 1) { note = `OVERFLOW: top = ${top} = MAX-1, cannot push ${v}`; err = true; } else { top++; arr[top] = v; note = `top++ gives ${top}; A[${top}] = ${v}`; }
    } else if (top === -1) { note = "UNDERFLOW: top = -1, nothing to pop"; err = true; } else { note = `item = A[${top}] = ${arr[top]}; top-- gives ${top - 1}`; arr[top] = null; top--; }
    fr.push({ cells: [...arr], top, front: 0, rear: top, count: top + 1, op, note, out: "", err });
  }
  return fr;
}

/** Circular queue of capacity N with rear = (rear + 1) mod N. */
export function queueFrames(N: number): SFrame[] {
  const script = ["enq 11", "enq 22", "enq 33", "enq 44", "deq", "deq", "enq 55", "enq 66", "enq 77", "enq 88", "deq", "enq 99"];
  const arr: (string | null)[] = Array(N).fill(null);
  let front = 0, rear = -1, count = 0;
  const fr: SFrame[] = [{ cells: [...arr], top: -1, front, rear, count, op: "start", note: "Empty queue: count = 0", out: "", err: false }];
  for (const op of script) {
    let note = "", err = false;
    if (op.startsWith("enq")) {
      const v = op.split(" ")[1];
      if (count === N) { note = `FULL: count = ${N}, cannot insert ${v}`; err = true; } else { rear = (rear + 1) % N; arr[rear] = v; count++; note = `rear = (rear + 1) mod ${N} = ${rear}; Q[${rear}] = ${v}${rear === 0 && count > 1 ? " (wrapped round)" : ""}`; }
    } else if (count === 0) { note = "EMPTY: nothing to remove"; err = true; } else { note = `item = Q[${front}] = ${arr[front]}; front = (front + 1) mod ${N} = ${(front + 1) % N}`; arr[front] = null; front = (front + 1) % N; count--; }
    fr.push({ cells: [...arr], top: -1, front, rear, count, op, note, out: "", err });
  }
  return fr;
}

export const EXPRS = {
  e1: { infix: "(2+3)*4-6/2", postfix: "23+4*62/-", value: 17 },
  e2: { infix: "8/(5-3)+2*3", postfix: "853-/23*+", value: 10 },
} as const;
const PREC: Record<string, number> = { "+": 1, "-": 1, "*": 2, "/": 2 };
const applyOp = (op: string, a: number, b: number) => (op === "+" ? a + b : op === "-" ? a - b : op === "*" ? a * b : Math.trunc(a / b));

export function postfixFrames(post: string): SFrame[] {
  const st: number[] = [];
  const fr: SFrame[] = [{ cells: [], top: -1, front: 0, rear: -1, count: 0, op: "start", note: "Scan the postfix string left to right", out: "", err: false }];
  for (const t of post.split("")) {
    let note: string;
    if (/\d/.test(t)) { st.push(Number(t)); note = `operand ${t}: push`; } else { const b = st.pop() ?? 0, a = st.pop() ?? 0, r = applyOp(t, a, b); st.push(r); note = `operator ${t}: pop ${b} and ${a}, push ${a} ${t} ${b} = ${r}`; }
    fr.push({ cells: st.map(String), top: st.length - 1, front: 0, rear: st.length - 1, count: st.length, op: t, note, out: "", err: false });
  }
  return fr;
}
export function infixFrames(inf: string): SFrame[] {
  const ops: string[] = [];
  let out = "";
  const fr: SFrame[] = [{ cells: [], top: -1, front: 0, rear: -1, count: 0, op: "start", note: "Scan the infix string left to right", out, err: false }];
  const push = (op: string, note: string) => fr.push({ cells: [...ops], top: ops.length - 1, front: 0, rear: ops.length - 1, count: ops.length, op, note, out, err: false });
  for (const t of inf.split("")) {
    if (/\d/.test(t)) { out += t; push(t, `operand ${t}: copy to output`); }
    else if (t === "(") { ops.push(t); push(t, "( goes on the stack"); }
    else if (t === ")") { while (ops.length && ops[ops.length - 1] !== "(") out += ops.pop(); ops.pop(); push(t, "): pop to output until ("); }
    else { while (ops.length && ops[ops.length - 1] !== "(" && PREC[ops[ops.length - 1]] >= PREC[t]) out += ops.pop(); ops.push(t); push(t, `operator ${t}: pop equal or higher precedence, then push`); }
  }
  while (ops.length) out += ops.pop();
  push("end", "pop everything left to the output");
  return fr;
}

/** Address calculation for arrays. */
export const addr1D = (base: number, w: number, i: number, lb = 0) => base + (i - lb) * w;
export const addr2D = (base: number, w: number, rows: number, cols: number, i: number, j: number, rowMajor: boolean) => base + (rowMajor ? i * cols + j : j * rows + i) * w;

/* ---- linked lists ---- */
export type LS = { val: Record<number, number>; next: Record<number, number | null>; prev: Record<number, number | null>; head: number | null; freed: number[]; hot: number[] };
export type LFrame = LS & { note: string };
export type LMode = "singly" | "doubly" | "circular";
export type LOp = "head" | "mid" | "tail" | "del";
const cloneLS = (s: LS): LS => ({ val: { ...s.val }, next: { ...s.next }, prev: { ...s.prev }, head: s.head, freed: [...s.freed], hot: [...s.hot] });
export function listBase(mode: LMode): LS {
  const s: LS = { val: { 1: 10, 2: 20, 3: 30, 4: 40 }, next: { 1: 2, 2: 3, 3: 4, 4: mode === "circular" ? 1 : null }, prev: {}, head: 1, freed: [], hot: [] };
  if (mode === "doubly") s.prev = { 1: null, 2: 1, 3: 2, 4: 3 };
  return s;
}
export function listFrames(mode: LMode, op: LOp): LFrame[] {
  const s = listBase(mode), N = 5, d = mode === "doubly", c = mode === "circular";
  const steps: [string, (x: LS) => void][] = [];
  const NEWV: Record<LOp, number> = { head: 5, mid: 25, tail: 50, del: 0 };
  if (op !== "del") {
    steps.push([`Create node N with data ${NEWV[op]}; both pointers start empty`, (x) => { x.val[N] = NEWV[op]; x.next[N] = null; if (d) x.prev[N] = null; x.hot = [N]; }]);
    if (op === "head") {
      steps.push(["N.next = head", (x) => { x.next[N] = x.head; x.hot = [N]; }]);
      if (d) steps.push(["head.prev = N", (x) => { x.prev[x.head as number] = N; x.hot = [x.head as number]; }]);
      if (c) steps.push(["tail.next = N (keep the ring closed)", (x) => { x.next[4] = N; x.hot = [4]; }]);
      steps.push(["head = N", (x) => { x.head = N; x.hot = [N]; }]);
    } else if (op === "mid") {
      steps.push(["N.next = node20.next", (x) => { x.next[N] = x.next[2]; x.hot = [N]; }]);
      if (d) steps.push(["N.prev = node20", (x) => { x.prev[N] = 2; x.hot = [N]; }, ] as [string, (x: LS) => void]);
      if (d) steps.push(["node30.prev = N", (x) => { x.prev[3] = N; x.hot = [3]; }]);
      steps.push(["node20.next = N (the list now passes through N)", (x) => { x.next[2] = N; x.hot = [2]; }]);
    } else {
      steps.push([c ? "N.next = head (circular: the new tail points back to the head)" : "N.next = null (it is the new last node)", (x) => { x.next[N] = c ? x.head : null; x.hot = [N]; }]);
      if (d) steps.push(["N.prev = tail", (x) => { x.prev[N] = 4; x.hot = [N]; }]);
      steps.push(["tail.next = N", (x) => { x.next[4] = N; x.hot = [4]; }]);
    }
  } else {
    steps.push(["Find the node to delete (30) and keep a pointer to its predecessor (20)", (x) => { x.hot = [3, 2]; }]);
    steps.push(["node20.next = node30.next (skip over node 30)", (x) => { x.next[2] = x.next[3]; x.hot = [2]; }]);
    if (d) steps.push(["node40.prev = node20", (x) => { x.prev[4] = 2; x.hot = [4]; }]);
    steps.push(["free(node30): its memory is released", (x) => { x.freed = [3]; x.hot = []; }]);
  }
  const out: LFrame[] = [{ ...cloneLS(s), note: "The list before the operation" }];
  for (const [note, fn] of steps) { fn(s); out.push({ ...cloneLS(s), note }); }
  return out;
}
/** Node ids reachable from head, in order (stops at null or after returning to the head). */
export function listOrder(s: LS): number[] {
  const out: number[] = [];
  let cur = s.head;
  while (cur !== null && !out.includes(cur) && out.length < 12) { out.push(cur); cur = s.next[cur] ?? null; }
  return out;
}

/* ---- binary search trees ---- */
export type T = { key: number; l: T | null; r: T | null } | null;
export const insertT = (t: T, key: number): T => (t === null ? { key, l: null, r: null } : key < t.key ? { ...t, l: insertT(t.l, key) } : key > t.key ? { ...t, r: insertT(t.r, key) } : t);
export const buildT = (keys: readonly number[]): T => keys.reduce<T>((t, k) => insertT(t, k), null);
export const heightT = (t: T): number => (t === null ? 0 : 1 + Math.max(heightT(t.l), heightT(t.r)));
export const sizeT = (t: T): number => (t === null ? 0 : 1 + sizeT(t.l) + sizeT(t.r));
export const minT = (t: NonNullable<T>): number => (t.l ? minT(t.l) : t.key);
export function pathT(t: T, key: number): number[] { const p: number[] = []; let c = t; while (c) { p.push(c.key); if (key === c.key) break; c = key < c.key ? c.l : c.r; } return p; }
export function traverseT(t: T, order: "in" | "pre" | "post" | "level"): number[] {
  if (order === "level") { const out: number[] = [], q: T[] = [t]; while (q.length) { const n = q.shift() as T; if (n) { out.push(n.key); q.push(n.l, n.r); } } return out; }
  const go = (n: T): number[] => (n === null ? [] : order === "in" ? [...go(n.l), n.key, ...go(n.r)] : order === "pre" ? [n.key, ...go(n.l), ...go(n.r)] : [...go(n.l), ...go(n.r), n.key]);
  return go(t);
}
export function deleteT(t: T, key: number): T {
  if (t === null) return null;
  if (key < t.key) return { ...t, l: deleteT(t.l, key) };
  if (key > t.key) return { ...t, r: deleteT(t.r, key) };
  if (!t.l) return t.r;
  if (!t.r) return t.l;
  const s = minT(t.r);
  return { key: s, l: t.l, r: deleteT(t.r, s) };
}
export function deleteCase(t: T, key: number): "leaf" | "one child" | "two children" | "missing" {
  let c = t; while (c && c.key !== key) c = key < c.key ? c.l : c.r;
  if (!c) return "missing";
  return c.l && c.r ? "two children" : c.l || c.r ? "one child" : "leaf";
}
export type Pos = { key: number; x: number; d: number; parent: number | null; bf: number };
/** Inorder rank as x and depth as d. */
export function layoutT(t: T): Pos[] {
  const out: Pos[] = []; let x = 0;
  const go = (n: T, d: number, parent: number | null): void => { if (!n) return; go(n.l, d + 1, n.key); out.push({ key: n.key, x: x++, d, parent, bf: heightT(n.l) - heightT(n.r) }); go(n.r, d + 1, n.key); };
  go(t, 0, null);
  return out;
}
export const BST_SETS = { q512: [15, 10, 20, 8, 12, 17, 25], skew: [10, 20, 30, 40, 50], mix: [50, 30, 70, 20, 40, 60, 80] } as const;

/* ---- AVL ---- */
export type AF = { tree: T; note: string; rot: string; bad: number | null; key: number | null };
const rotR = (t: NonNullable<T>): NonNullable<T> => { const l = t.l as NonNullable<T>; return { key: l.key, l: l.l, r: { key: t.key, l: l.r, r: t.r } }; };
const rotL = (t: NonNullable<T>): NonNullable<T> => { const r = t.r as NonNullable<T>; return { key: r.key, l: { key: t.key, l: t.l, r: r.l }, r: r.r }; };
const bfT = (t: T) => (t === null ? 0 : heightT(t.l) - heightT(t.r));
function lowestBad(t: T, key: number): number | null {
  if (!t) return null;
  const sub = key < t.key ? lowestBad(t.l, key) : key > t.key ? lowestBad(t.r, key) : null;
  return sub !== null ? sub : Math.abs(bfT(t)) > 1 ? t.key : null;
}
function fixAt(t: T, k: number): { t: T; rot: string } {
  if (!t) return { t, rot: "" };
  if (t.key === k) {
    const b = bfT(t);
    if (b > 1) { if (bfT(t.l) >= 0) return { t: rotR(t), rot: "LL" }; return { t: rotR({ ...t, l: rotL(t.l as NonNullable<T>) }), rot: "LR" }; }
    if (bfT(t.r) <= 0) return { t: rotL(t), rot: "RR" };
    return { t: rotL({ ...t, r: rotR(t.r as NonNullable<T>) }), rot: "RL" };
  }
  if (k < t.key) { const r = fixAt(t.l, k); return { t: { ...t, l: r.t }, rot: r.rot }; }
  const r = fixAt(t.r, k); return { t: { ...t, r: r.t }, rot: r.rot };
}
export function avlFrames(keys: readonly number[]): AF[] {
  let t: T = null;
  const fr: AF[] = [{ tree: null, note: "Empty tree", rot: "", bad: null, key: null }];
  for (const key of keys) {
    t = insertT(t, key);
    const bad = lowestBad(t, key);
    if (bad === null) { fr.push({ tree: t, note: `Insert ${key}: every balance factor stays in -1, 0, +1`, rot: "", bad: null, key }); continue; }
    const r = fixAt(t, bad);
    fr.push({ tree: t, note: `Insert ${key}: node ${bad} has balance factor ${bfT(find(t, bad))} (a ${r.rot} case)`, rot: r.rot, bad, key });
    t = r.t;
    fr.push({ tree: t, note: `${r.rot} rotation at ${bad} restores the balance`, rot: r.rot, bad: null, key });
  }
  return fr;
}
export function find(t: T, key: number): T { let c = t; while (c && c.key !== key) c = key < c.key ? c.l : c.r; return c; }
export const AVL_SETS = { ll: [30, 20, 10], rr: [10, 20, 30], lr: [30, 10, 20], rl: [10, 30, 20], long: [10, 20, 30, 40, 50, 25] } as const;

/* ---- graphs ---- */
export const GN = ["A", "B", "C", "D", "E", "F", "G"] as const;
export const GEDGES: [number, number, number][] = [[0, 1, 7], [0, 3, 5], [1, 2, 8], [1, 3, 9], [1, 4, 7], [2, 4, 5], [3, 4, 15], [3, 5, 6], [4, 5, 8], [4, 6, 9], [5, 6, 11]];
export const adjList = (n = 7): number[][] => { const a: number[][] = Array.from({ length: n }, () => []); for (const [u, v] of GEDGES) { a[u].push(v); a[v].push(u); } return a.map((l) => l.sort((x, y) => x - y)); };
export const adjMatrix = (): number[][] => { const m = Array.from({ length: 7 }, () => Array(7).fill(0)); for (const [u, v] of GEDGES) { m[u][v] = 1; m[v][u] = 1; } return m; };
export type GFrame = { order: number[]; holder: number[]; cur: number; tree: number[]; rejected: number[]; weight: number; note: string };
export type GAlg = "bfs" | "dfs" | "prim" | "kruskal";
export function graphFrames(alg: GAlg, s: number): GFrame[] {
  const adj = adjList(), eIdx = (u: number, v: number) => GEDGES.findIndex(([a, b]) => (a === u && b === v) || (a === v && b === u));
  const fr: GFrame[] = [];
  if (alg === "bfs") {
    const seen = new Set([s]), q = [s], order: number[] = [], tree: number[] = [];
    fr.push({ order: [], holder: [...q], cur: -1, tree: [], rejected: [], weight: 0, note: `Enqueue the start vertex ${GN[s]}` });
    while (q.length) {
      const u = q.shift() as number; order.push(u);
      for (const v of adj[u]) if (!seen.has(v)) { seen.add(v); q.push(v); tree.push(eIdx(u, v)); }
      fr.push({ order: [...order], holder: [...q], cur: u, tree: [...tree], rejected: [], weight: 0, note: `Dequeue ${GN[u]}, visit it and enqueue its unseen neighbours` });
    }
  } else if (alg === "dfs") {
    const seen = new Set<number>(), st = [s], order: number[] = [], tree: number[] = [], via = new Map<number, number>();
    fr.push({ order: [], holder: [...st], cur: -1, tree: [], rejected: [], weight: 0, note: `Push the start vertex ${GN[s]}` });
    while (st.length) {
      const u = st.pop() as number;
      if (seen.has(u)) continue;
      seen.add(u); order.push(u); if (via.has(u)) tree.push(eIdx(via.get(u) as number, u));
      for (const v of [...adj[u]].reverse()) if (!seen.has(v)) { st.push(v); via.set(v, u); }
      fr.push({ order: [...order], holder: [...st], cur: u, tree: [...tree], rejected: [], weight: 0, note: `Pop ${GN[u]}, visit it and push its unseen neighbours` });
    }
  } else if (alg === "prim") {
    const inT = new Set([s]), tree: number[] = []; let w = 0;
    fr.push({ order: [s], holder: [], cur: s, tree: [], rejected: [], weight: 0, note: `Start the tree at ${GN[s]}` });
    while (inT.size < 7) {
      let best = -1;
      GEDGES.forEach(([u, v, c], i) => { if (inT.has(u) !== inT.has(v) && (best < 0 || c < GEDGES[best][2])) best = i; });
      if (best < 0) break;
      const [u, v, c] = GEDGES[best], nv = inT.has(u) ? v : u;
      inT.add(nv); tree.push(best); w += c;
      fr.push({ order: [...inT], holder: [], cur: nv, tree: [...tree], rejected: [], weight: w, note: `Cheapest edge leaving the tree: ${GN[u]}-${GN[v]} (${c}); add ${GN[nv]}` });
    }
  } else {
    const par = [0, 1, 2, 3, 4, 5, 6], root = (x: number): number => (par[x] === x ? x : (par[x] = root(par[x])));
    const sorted = GEDGES.map((e, i) => ({ e, i })).sort((a, b) => a.e[2] - b.e[2] || a.i - b.i);
    const tree: number[] = [], rej: number[] = []; let w = 0;
    fr.push({ order: [], holder: sorted.map((x) => x.i), cur: -1, tree: [], rejected: [], weight: 0, note: "Sort all edges by weight" });
    sorted.forEach(({ e, i }, k) => {
      const [u, v, c] = e, ru = root(u), rv = root(v);
      if (ru !== rv) { par[ru] = rv; tree.push(i); w += c; } else rej.push(i);
      fr.push({ order: [], holder: sorted.slice(k + 1).map((x) => x.i), cur: i, tree: [...tree], rejected: [...rej], weight: w, note: ru !== rv ? `Edge ${GN[u]}-${GN[v]} (${c}) joins two components: accept` : `Edge ${GN[u]}-${GN[v]} (${c}) would make a cycle: reject` });
    });
  }
  return fr;
}

/* ---- hashing ---- */
export type HScheme = "chain" | "linear" | "quad" | "double";
export type HFrame = { slots: (number | null)[]; chains: number[][]; last: number | null; h: number; seq: number[]; failed: boolean; probes: number; total: number; n: number };
export const HKEYS = { k1: [50, 700, 76, 85, 92, 73, 101], k2: [12, 44, 13, 88, 23, 94, 11, 39] } as const;
export const probeAt = (scheme: HScheme, key: number, m: number, i: number) => {
  const h = key % m;
  return scheme === "linear" ? (h + i) % m : scheme === "quad" ? (h + i * i) % m : scheme === "double" ? (h + i * (1 + (key % (m - 1)))) % m : h;
};
export function hashFrames(scheme: HScheme, m: number, keys: readonly number[]): HFrame[] {
  const slots: (number | null)[] = Array(m).fill(null), chains: number[][] = Array.from({ length: m }, () => []);
  let total = 0;
  const fr: HFrame[] = [{ slots: [...slots], chains: chains.map((c) => [...c]), last: null, h: 0, seq: [], failed: false, probes: 0, total, n: 0 }];
  keys.forEach((key, idx) => {
    const seq: number[] = []; let failed = false, probes = 0;
    if (scheme === "chain") { const h = key % m; seq.push(h); probes = chains[h].length + 1; chains[h].push(key); }
    else {
      failed = true;
      for (let i = 0; i < m; i++) { const p = probeAt(scheme, key, m, i); seq.push(p); probes++; if (slots[p] === null) { slots[p] = key; failed = false; break; } }
    }
    total += probes;
    fr.push({ slots: [...slots], chains: chains.map((c) => [...c]), last: key, h: key % m, seq, failed, probes, total, n: idx + 1 });
  });
  return fr;
}

/* ---- complexity ---- */
export type LoopProg = "lin" | "nest" | "tri" | "log" | "nlogn";
export function loopCount(prog: LoopProg, n: number): number {
  let c = 0;
  if (prog === "lin") for (let i = 0; i < n; i++) c++;
  else if (prog === "nest") for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) c++;
  else if (prog === "tri") for (let i = 0; i < n; i++) for (let j = 0; j < i; j++) c++;
  else if (prog === "log") for (let i = 1; i <= n; i *= 2) c++;
  else for (let i = 0; i < n; i++) for (let j = 1; j <= n; j *= 2) c++;
  return c;
}
export const growth = (n: number) => ({ log: Math.log2(Math.max(1, n)), lin: n, nlogn: n * Math.log2(Math.max(1, n)), quad: n * n, exp: 2 ** n });
/** Smallest n0 with a n^2 + b n + c <= k n^2 for every n from n0 up to 3000; null when there is none. */
export function bigONaught(a: number, b: number, c: number, k: number): number | null {
  let n0 = 1;
  for (let n = 3000; n >= 1; n--) if (a * n * n + b * n + c > k * n * n) { n0 = n + 1; break; }
  return n0 > 3000 ? null : n0;
}

/* ---- merge and radix sort ---- */
export type MFrame = { arr: number[]; active: [number, number] | null; runs: [number, number][]; cmps: number; note: string };
export const MERGE_ARRAYS = { m1: [38, 27, 43, 3, 9, 82, 10], m2: [8, 3, 5, 4, 7, 6, 2, 1], m3: [5, 1, 4, 2, 8, 7] } as const;
export function mergeFrames(input: readonly number[]): MFrame[] {
  const a = [...input], fr: MFrame[] = []; let cmps = 0; const runs: [number, number][] = [];
  fr.push({ arr: [...a], active: null, runs: [], cmps, note: "Unsorted array" });
  const sort = (lo: number, hi: number): void => {
    if (lo >= hi) return;
    const mid = (lo + hi) >> 1;
    fr.push({ arr: [...a], active: [lo, hi], runs: runs.map((r) => [...r] as [number, number]), cmps, note: `Divide [${lo}..${hi}] into [${lo}..${mid}] and [${mid + 1}..${hi}]` });
    sort(lo, mid); sort(mid + 1, hi);
    const L = a.slice(lo, mid + 1), R = a.slice(mid + 1, hi + 1); let i = 0, j = 0, k = lo;
    while (i < L.length && j < R.length) { cmps++; a[k++] = L[i] <= R[j] ? L[i++] : R[j++]; }
    while (i < L.length) a[k++] = L[i++];
    while (j < R.length) a[k++] = R[j++];
    for (let x = runs.length - 1; x >= 0; x--) if (runs[x][0] >= lo && runs[x][1] <= hi) runs.splice(x, 1);
    runs.push([lo, hi]);
    fr.push({ arr: [...a], active: [lo, hi], runs: runs.map((r) => [...r] as [number, number]), cmps, note: `Merge the two sorted halves into [${lo}..${hi}] (${cmps} comparisons so far)` });
  };
  sort(0, a.length - 1);
  return fr;
}
export type RFrame = { arr: number[]; buckets: number[][]; pass: number; phase: "start" | "distribute" | "collect"; note: string };
export const RADIX_ARR = [170, 45, 75, 90, 802, 24, 2, 66];
export function radixFrames(input: readonly number[] = RADIX_ARR): RFrame[] {
  let a = [...input];
  const fr: RFrame[] = [{ arr: [...a], buckets: Array.from({ length: 10 }, () => []), pass: 0, phase: "start", note: "Unsorted numbers" }];
  const names = ["units", "tens", "hundreds"];
  for (let p = 0; p < 3; p++) {
    const b: number[][] = Array.from({ length: 10 }, () => []), div = 10 ** p;
    for (const x of a) b[Math.floor(x / div) % 10].push(x);
    fr.push({ arr: [...a], buckets: b.map((l) => [...l]), pass: p + 1, phase: "distribute", note: `Pass ${p + 1}: drop each number into the bucket of its ${names[p]} digit` });
    a = b.flat();
    fr.push({ arr: [...a], buckets: b.map((l) => [...l]), pass: p + 1, phase: "collect", note: `Collect the buckets in order 0 to 9 (stable): ${a.join(", ")}` });
  }
  return fr;
}

/* ===================== BCA-007 Computer Organization & Architecture ===================== */

export type CMap = "direct" | "set2" | "set4" | "full";
export const CACHE_LINES = 8;
export const CACHE_SEQS = {
  conf: { seq: [0, 8, 0, 8, 0, 8, 1, 9, 1, 9], name: "Conflict: blocks 0 and 8 share a line" },
  loc: { seq: [0, 1, 2, 3, 0, 1, 2, 3, 4, 5, 0, 1], name: "Loops with locality" },
  mix: { seq: [0, 4, 8, 12, 0, 4, 8, 12, 16, 0], name: "Four blocks cycling" },
} as const;
export type CFrame = { block: number; set: number; way: number; hit: boolean; evicted: number | null; hits: number; misses: number; cache: (number | null)[][] };
/** LRU cache of 8 lines. Direct = 8 sets of 1, 2-way = 4 sets of 2, 4-way = 2 sets of 4, fully associative = 1 set of 8. */
export function cacheRun(map: CMap, seq: readonly number[]): CFrame[] {
  const ways = map === "direct" ? 1 : map === "set2" ? 2 : map === "set4" ? 4 : CACHE_LINES, sets = CACHE_LINES / ways;
  const cache: (number | null)[][] = Array.from({ length: sets }, () => Array(ways).fill(null));
  const age: number[][] = Array.from({ length: sets }, () => Array(ways).fill(0));
  let hits = 0, misses = 0, t = 0;
  const fr: CFrame[] = [{ block: -1, set: 0, way: 0, hit: false, evicted: null, hits, misses, cache: cache.map((s) => [...s]) }];
  for (const b of seq) {
    t++;
    const s = b % sets;
    let w = cache[s].indexOf(b), evicted: number | null = null; const hit = w >= 0;
    if (!hit) {
      w = cache[s].indexOf(null);
      if (w < 0) { w = age[s].indexOf(Math.min(...age[s])); evicted = cache[s][w]; }
      cache[s][w] = b; misses++;
    } else hits++;
    age[s][w] = t;
    fr.push({ block: b, set: s, way: w, hit, evicted, hits, misses, cache: cache.map((x) => [...x]) });
  }
  return fr;
}
/** Effective memory access time (ns). sequential: a miss pays cache then memory; simultaneous: memory is started together. */
export const emat = (h: number, tc: number, tm: number, simultaneous = false) => h * tc + (1 - h) * (simultaneous ? tm : tc + tm);

export type Repl = "fifo" | "lru" | "opt";
export const PAGE_SEQS = {
  classic: [7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2, 1, 2, 0, 1, 7, 0, 1],
  belady: [1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5],
} as const;
export type PFrame = { page: number; fault: boolean; frames: (number | null)[]; evicted: number | null; faults: number };
export function pageRun(alg: Repl, nf: number, seq: readonly number[]): PFrame[] {
  const fr: (number | null)[] = Array(nf).fill(null), last: number[] = Array(nf).fill(-1), load: number[] = Array(nf).fill(-1);
  let faults = 0;
  const out: PFrame[] = [{ page: -1, fault: false, frames: [...fr], evicted: null, faults }];
  seq.forEach((p, t) => {
    let i = fr.indexOf(p), fault = false, ev: number | null = null;
    if (i < 0) {
      fault = true; faults++;
      i = fr.indexOf(null);
      if (i < 0) {
        if (alg === "fifo") i = load.indexOf(Math.min(...load));
        else if (alg === "lru") i = last.indexOf(Math.min(...last));
        else {
          const nxt = fr.map((f) => { const k = seq.indexOf(f as number, t + 1); return k < 0 ? Infinity : k; });
          i = nxt.indexOf(Math.max(...nxt));
        }
        ev = fr[i];
      }
      fr[i] = p; load[i] = t;
    }
    last[i] = t;
    out.push({ page: p, fault, frames: [...fr], evicted: ev, faults });
  });
  return out;
}

export type BFrame = { A: number; Q: number; Q1: number; M: number; n: number; op: string; note: string; cycle: number };
const mask = (n: number) => (1 << n) - 1;
/** Booth's algorithm on n-bit two's complement numbers (default 4 bits). */
export function boothFrames(m: number, q: number, n = 4): BFrame[] {
  const M = m & mask(n);
  let A = 0, Q = q & mask(n), Q1 = 0;
  const fr: BFrame[] = [{ A, Q, Q1, M, n, op: "start", note: "A = 0, Q = multiplier, Q-1 = 0", cycle: 0 }];
  for (let c = 1; c <= n; c++) {
    const pair = `${Q & 1}${Q1}`;
    if (pair === "01") { A = (A + M) & mask(n); fr.push({ A, Q, Q1, M, n, op: "A + M", note: `Q0 Q-1 = ${pair}: A = A + M`, cycle: c }); }
    else if (pair === "10") { A = (A - M) & mask(n); fr.push({ A, Q, Q1, M, n, op: "A - M", note: `Q0 Q-1 = ${pair}: A = A - M`, cycle: c }); }
    else fr.push({ A, Q, Q1, M, n, op: "none", note: `Q0 Q-1 = ${pair}: no add or subtract`, cycle: c });
    const sign = A >> (n - 1);
    Q1 = Q & 1; Q = ((Q >> 1) | ((A & 1) << (n - 1))) & mask(n); A = (A >> 1) | (sign << (n - 1));
    fr.push({ A, Q, Q1, M, n, op: "shift", note: "Arithmetic shift right of A, Q, Q-1", cycle: c });
  }
  return fr;
}
export const boothProduct = (f: BFrame) => { const v = (f.A << f.n) | f.Q; return v & (1 << (2 * f.n - 1)) ? v - (1 << (2 * f.n)) : v; };
export const toSigned = (v: number, n: number) => (v & (1 << (n - 1)) ? v - (1 << n) : v);
/** Restoring division of an n-bit dividend by a divisor. */
export function divFrames(dividend: number, divisor: number, n = 4): BFrame[] {
  let A = 0, Q = dividend & mask(n);
  const fr: BFrame[] = [{ A, Q, Q1: 0, M: divisor, n, op: "start", note: "A = 0, Q = dividend, M = divisor", cycle: 0 }];
  for (let c = 1; c <= n; c++) {
    A = ((A << 1) | (Q >> (n - 1))) & mask(n + 1); Q = (Q << 1) & mask(n);
    fr.push({ A, Q, Q1: 0, M: divisor, n, op: "shift", note: "Shift A, Q left one bit", cycle: c });
    const t = A - divisor;
    if (t < 0) { Q |= 0; fr.push({ A: t & mask(n + 1), Q, Q1: 0, M: divisor, n, op: "A - M < 0", note: "A - M is negative: restore A, Q0 = 0", cycle: c }); fr.push({ A, Q, Q1: 0, M: divisor, n, op: "restore", note: "A restored", cycle: c }); }
    else { A = t; Q |= 1; fr.push({ A, Q, Q1: 0, M: divisor, n, op: "A - M >= 0", note: "A - M is not negative: keep it, Q0 = 1", cycle: c }); }
  }
  return fr;
}

export type AMode = "imm" | "dir" | "ind" | "reg" | "regind" | "autodec" | "rel" | "idx";
export const AMEM: Record<number, number> = { 399: 450, 400: 700, 500: 800, 600: 900, 702: 325, 800: 300 };
export const memAt = (a: number) => AMEM[a] ?? ((a * 7 + 13) % 1000);
export const PC_AFTER_FETCH = 202;
export function effective(mode: AMode, x: number, r1: number, xr: number) {
  switch (mode) {
    case "imm": return { ea: null as number | null, operand: x, accesses: 0 };
    case "dir": return { ea: x, operand: memAt(x), accesses: 1 };
    case "ind": { const p = memAt(x); return { ea: p, operand: memAt(p), accesses: 2 }; }
    case "reg": return { ea: null, operand: r1, accesses: 0 };
    case "regind": return { ea: r1, operand: memAt(r1), accesses: 1 };
    case "autodec": return { ea: r1 - 1, operand: memAt(r1 - 1), accesses: 1 };
    case "rel": return { ea: PC_AFTER_FETCH + x, operand: memAt(PC_AFTER_FETCH + x), accesses: 1 };
    default: return { ea: x + xr, operand: memAt(x + xr), accesses: 1 };
  }
}

export type PInst = { name: string; dest: number | null; src: number[]; load?: boolean; branch?: boolean };
export type PProg = "alu" | "load" | "free" | "branch";
export const PIPE_PROGS: Record<PProg, PInst[]> = {
  alu: [{ name: "add r1,r2,r3", dest: 1, src: [2, 3] }, { name: "sub r4,r1,r5", dest: 4, src: [1, 5] }, { name: "and r6,r1,r7", dest: 6, src: [1, 7] }, { name: "or r8,r1,r9", dest: 8, src: [1, 9] }, { name: "xor r10,r11,r12", dest: 10, src: [11, 12] }],
  load: [{ name: "lw r1,0(r2)", dest: 1, src: [2], load: true }, { name: "add r3,r1,r4", dest: 3, src: [1, 4] }, { name: "sub r5,r3,r6", dest: 5, src: [3, 6] }, { name: "or r7,r8,r9", dest: 7, src: [8, 9] }, { name: "and r10,r11,r12", dest: 10, src: [11, 12] }],
  free: [{ name: "add r1,r2,r3", dest: 1, src: [2, 3] }, { name: "sub r4,r5,r6", dest: 4, src: [5, 6] }, { name: "and r7,r8,r9", dest: 7, src: [8, 9] }, { name: "or r10,r11,r12", dest: 10, src: [11, 12] }, { name: "xor r13,r14,r15", dest: 13, src: [14, 15] }],
  branch: [{ name: "add r1,r2,r3", dest: 1, src: [2, 3] }, { name: "beq r1,r4,L", dest: null, src: [1, 4], branch: true }, { name: "sub r5,r6,r7", dest: 5, src: [6, 7] }, { name: "or r8,r9,r10", dest: 8, src: [9, 10] }, { name: "and r11,r12,r13", dest: 11, src: [12, 13] }],
};
export type PRow = { name: string; IF: number; ID: number; EX: number; MEM: number; WB: number; stalls: number };
export function pipeline(prog: PProg, fwd: boolean, branchPenalty: number) {
  const ins = PIPE_PROGS[prog], rows: PRow[] = [];
  let ifc = 1, bubbles = 0;
  ins.forEach((it, i) => {
    let id = ifc + 1;
    const nat = id;
    for (let p = 0; p < i; p++) {
      const pr = rows[p], pd = ins[p].dest;
      if (pd !== null && it.src.includes(pd)) id = Math.max(id, fwd ? (ins[p].load ? pr.MEM : pr.EX) : pr.WB);
    }
    rows.push({ name: it.name, IF: ifc, ID: id, EX: id + 1, MEM: id + 2, WB: id + 3, stalls: id - nat });
    ifc = id;
    if (it.branch) { ifc += branchPenalty; bubbles += branchPenalty; }
  });
  const cycles = rows[rows.length - 1].WB, stalls = rows.reduce((a, r) => a + r.stalls, 0) + bubbles;
  return { rows, cycles, stalls, cpi: cycles / ins.length, speedup: (5 * ins.length) / cycles };
}

export type IoMode = "prog" | "intr" | "dma";
export function ioModel(words: number, td: number, ti: number) {
  const ts = 20, total = words * td;
  const prog = { busy: total, total, free: 0 };
  const intr = { busy: words * Math.min(ti, td), total, free: 1 - Math.min(ti, td) / td };
  const dmaBusy = ts + ti + words * 1;
  const dma = { busy: dmaBusy, total: total + ts, free: 1 - dmaBusy / (total + ts) };
  return { prog, intr, dma };
}
/** Daisy chain: device 0 sits next to the CPU and wins; later devices only see the grant if all earlier ones pass it on. */
export function daisy(req: number) {
  for (let i = 0; i < 4; i++) if ((req >> i) & 1) return { winner: i, passed: Array.from({ length: i }, (_, k) => k) };
  return { winner: -1, passed: [0, 1, 2, 3] };
}

export const OPN = ["HLT", "LDA", "ADD", "STA", "JMP", "JMPI"] as const;
export type CFr = { phase: "fetch" | "decode" | "exec" | "int" | "halt"; rtl: string; pc: number; ar: number; ir: number; ac: number; dr: number; mem: number[]; src: string; dst: string; note: string };
export const COA_PROGS = {
  add: { mem: { 2: 0x1c, 3: 0x2d, 4: 0x3e, 5: 0x00, 12: 5, 13: 3 }, name: "A = 5 + 3" },
  jump: { mem: { 2: 0x1c, 3: 0x45, 4: 0x2d, 5: 0x3e, 6: 0x00, 12: 5, 13: 3 }, name: "Jump over an instruction" },
} as const;
export function cycleFrames(prog: keyof typeof COA_PROGS, irq: boolean): CFr[] {
  const mem = Array(16).fill(0);
  for (const [a, v] of Object.entries(COA_PROGS[prog].mem)) mem[Number(a)] = v;
  mem[1] = 0x50;
  let pc = 2, ar = 0, ir = 0, ac = 0, dr = 0, count = 0, doneInt = !irq;
  const fr: CFr[] = [];
  const push = (phase: CFr["phase"], rtl: string, src: string, dst: string, note: string) => fr.push({ phase, rtl, pc, ar, ir, ac, dr, mem: [...mem], src, dst, note });
  push("fetch", "reset: PC = 2", "", "", "Registers cleared, PC points at the first instruction");
  for (let guard = 0; guard < 40; guard++) {
    ar = pc; push("fetch", "T0: AR <- PC", "PC", "AR", "The address of the next instruction goes to the address register");
    ir = mem[ar]; pc += 1; push("fetch", "T1: IR <- M[AR], PC <- PC + 1", "MEM", "IR", "The instruction is read from memory; PC moves on");
    const op = ir >> 4, ad = ir & 15;
    push("decode", `T2: decode IR(op) = ${OPN[op]}, AR <- IR(addr) = ${ad}`, "IR", "AR", `Opcode ${OPN[op]} chosen; address field ${ad}`);
    ar = ad;
    if (op === 0) { push("halt", "HLT: stop the clock", "", "", "Execution ends"); break; }
    if (op === 1) { dr = mem[ar]; push("exec", "T3: DR <- M[AR]", "MEM", "DR", "Operand read"); ac = dr; push("exec", "T4: AC <- DR", "DR", "AC", "Operand loaded into the accumulator"); }
    else if (op === 2) { dr = mem[ar]; push("exec", "T3: DR <- M[AR]", "MEM", "DR", "Operand read"); ac += dr; push("exec", "T4: AC <- AC + DR", "ALU", "AC", "The ALU adds DR to AC"); }
    else if (op === 3) { mem[ar] = ac; push("exec", "T3: M[AR] <- AC", "AC", "MEM", "The accumulator is stored to memory"); }
    else if (op === 4) { pc = ad; push("exec", "T3: PC <- AR", "AR", "PC", "Jump: PC is overwritten with the target"); }
    else { dr = mem[ar]; push("exec", "T3: DR <- M[AR]", "MEM", "DR", "Read the saved return address"); pc = dr; push("exec", "T4: PC <- DR", "DR", "PC", "Return from the interrupt service routine"); }
    count++;
    if (!doneInt && count === 1) {
      doneInt = true;
      ar = 0; push("int", "R=1: AR <- 0, TD <- PC", "PC", "AR", "Interrupt flag R is set: save the return address");
      mem[0] = pc; push("int", "M[AR] <- TD, PC <- 1", "PC", "MEM", `The return address ${pc} is stored at M[0]; PC jumps to the service routine at 1`);
      pc = 1; push("int", "IEN <- 0, R <- 0", "", "PC", "Further interrupts are disabled; the service routine (JMPI 0) will run next");
    }
  }
  return fr;
}

/* ===================== BCA-008 Java OOP ===================== */

export type JClass = "Animal" | "Dog" | "Puppy" | "Cat";
export type JMeth = "speak" | "eat" | "fetch";
export const J_PARENT: Record<JClass, JClass | null> = { Animal: null, Dog: "Animal", Puppy: "Dog", Cat: "Animal" };
export const J_DEFS: Record<JClass, Partial<Record<JMeth, string>>> = {
  Animal: { speak: "Some sound", eat: "Animal eats" },
  Dog: { speak: "Woof", fetch: "Dog fetches" },
  Puppy: { eat: "Puppy drinks milk" },
  Cat: { speak: "Meow" },
};
export const jChain = (c: JClass): JClass[] => { const o: JClass[] = []; for (let x: JClass | null = c; x; x = J_PARENT[x]) o.push(x); return o; };
export const jSubtype = (sub: JClass, sup: JClass) => jChain(sub).includes(sup);
/** Compile-time check against the reference type, then run-time lookup from the object's real class upwards. */
export function dispatch(ref: JClass, obj: JClass, m: JMeth) {
  if (!jSubtype(obj, ref)) return { ok: false, error: `incompatible types: ${obj} cannot be converted to ${ref}`, lookup: [] as JClass[], impl: null as JClass | null, out: "" };
  if (!jChain(ref).some((c) => J_DEFS[c][m] !== undefined)) return { ok: false, error: `cannot find symbol: ${m}() is not defined in ${ref} or its parents`, lookup: [], impl: null, out: "" };
  const lookup: JClass[] = [];
  for (const c of jChain(obj)) { lookup.push(c); if (J_DEFS[c][m] !== undefined) return { ok: true, error: "", lookup, impl: c, out: J_DEFS[c][m] as string }; }
  return { ok: false, error: "no implementation", lookup, impl: null, out: "" };
}

export type JVar = { name: string; to: number | null };
export type JObj = { id: number; label: string; region: "heap" | "pool"; dead: boolean };
export type JFrame = { vars: JVar[]; objs: JObj[]; note: string; gc: boolean };
const jf = (vars: [string, number | null][], objs: [number, string, "heap" | "pool", boolean?][], note: string, gc = false): JFrame => ({ vars: vars.map(([name, to]) => ({ name, to })), objs: objs.map(([id, label, region, dead]) => ({ id, label, region, dead: !!dead })), note, gc });
export const JHEAP_FRAMES: Record<"gc" | "str", JFrame[]> = {
  gc: [
    jf([], [], "Empty heap, empty stack"),
    jf([["a", 1]], [[1, "Student(Asha)", "heap"]], "Student a = new Student(\"Asha\"); new allocates an object on the heap; a holds its reference"),
    jf([["a", 1], ["b", 1]], [[1, "Student(Asha)", "heap"]], "Student b = a; copies the reference, not the object: two variables, one object"),
    jf([["a", 1], ["b", 1], ["c", 2]], [[1, "Student(Asha)", "heap"], [2, "Student(Ravi)", "heap"]], "Student c = new Student(\"Ravi\"); a second object"),
    jf([["a", null], ["b", 1], ["c", 2]], [[1, "Student(Asha)", "heap"], [2, "Student(Ravi)", "heap"]], "a = null; the object is still reachable through b"),
    jf([["a", null], ["b", 2], ["c", 2]], [[1, "Student(Asha)", "heap", true], [2, "Student(Ravi)", "heap"]], "b = c; nothing refers to Asha any more: it is unreachable garbage"),
    jf([["a", null], ["b", 2], ["c", 2]], [[2, "Student(Ravi)", "heap"]], "The garbage collector runs and frees the unreachable object", true),
  ],
  str: [
    jf([], [], "The string pool and the heap are empty"),
    jf([["s1", 1]], [[1, "\"Java\"", "pool"]], "String s1 = \"Java\"; a literal goes into the string pool"),
    jf([["s1", 1], ["s2", 1]], [[1, "\"Java\"", "pool"]], "String s2 = \"Java\"; the same literal is reused: s1 == s2 is true"),
    jf([["s1", 1], ["s2", 1], ["s3", 2]], [[1, "\"Java\"", "pool"], [2, "String(Java)", "heap"]], "String s3 = new String(\"Java\"); new always makes a fresh heap object: s1 == s3 is false but s1.equals(s3) is true"),
    jf([["s1", 3], ["s2", 1], ["s3", 2]], [[1, "\"Java\"", "pool"], [2, "String(Java)", "heap"], [3, "\"Java!\"", "heap"]], "s1 = s1.concat(\"!\"); Strings are immutable, so a NEW object is made and s1 now refers to it"),
    jf([["s1", 3], ["sb", 4]], [[3, "\"Java!\"", "heap"], [4, "StringBuffer(Java)", "heap"]], "StringBuffer sb = new StringBuffer(\"Java\"); a mutable buffer"),
    jf([["s1", 3], ["sb", 4]], [[3, "\"Java!\"", "heap"], [4, "StringBuffer(Java!)", "heap"]], "sb.append(\"!\"); the SAME object changes in place: no new object, so repeated appends are faster"),
  ],
};
export const jLive = (f: JFrame) => f.objs.filter((o) => !o.dead).length;

export type ExKind = "none" | "arith" | "index" | "custom";
export type ExStep = { line: string; kind: "run" | "throw" | "catch" | "finally" | "skip" | "out"; block: number };
export const EX_BLOCKS = ["try {", "  stmt1;", "  risky();", "  stmt2;", "} catch (Arithmetic..)", "} catch (ArrayIndex..)", "} catch (Exception)", "} finally {", "after the try"] as const;
const EXN: Record<Exclude<ExKind, "none">, string> = { arith: "ArithmeticException", index: "ArrayIndexOutOfBoundsException", custom: "InsufficientFundsException (checked)" };
/** try / catch / finally control flow. */
export function excFlow(kind: ExKind, catchAll: boolean, early: boolean) {
  const st: ExStep[] = [{ line: "try block starts", kind: "run", block: 0 }, { line: "stmt1 runs", kind: "run", block: 1 }];
  let out = "stmt1 ", outcome = "normal";
  if (kind === "none") {
    st.push({ line: "risky() returns normally", kind: "run", block: 2 });
    if (early) { st.push({ line: "return inside try: finally still runs before returning", kind: "run", block: 2 }); outcome = "returned"; }
    else { st.push({ line: "stmt2 runs", kind: "run", block: 3 }); out += "stmt2 "; }
    st.push({ line: "catch blocks are skipped", kind: "skip", block: 4 });
  } else {
    st.push({ line: `risky() throws ${EXN[kind]}`, kind: "throw", block: 2 }, { line: "stmt2 is skipped", kind: "skip", block: 3 });
    const handler = kind === "arith" ? 4 : kind === "index" ? 5 : catchAll ? 6 : -1;
    if (handler >= 0) { st.push({ line: `caught by ${handler === 6 ? "catch (Exception e)" : "its matching catch"}`, kind: "catch", block: handler }); out += "catch "; outcome = "caught"; }
    else { st.push({ line: "no catch matches a checked exception that is not declared by catch: it propagates after finally", kind: "skip", block: 6 }); outcome = "propagates"; }
  }
  st.push({ line: "finally block runs (always)", kind: "finally", block: 7 }); out += "finally ";
  if (outcome !== "propagates" && outcome !== "returned") { st.push({ line: "execution continues after the try statement", kind: "out", block: 8 }); out += "after"; }
  return { steps: st, output: out.trim(), outcome };
}

export type TState = "NEW" | "RUNNABLE" | "RUNNING" | "TIMED_WAITING" | "BLOCKED" | "WAITING" | "TERMINATED";
export const THREAD_LIFE: { state: TState; note: string }[] = [
  { state: "NEW", note: "Thread t = new Thread(task); the object exists but has not started" },
  { state: "RUNNABLE", note: "t.start(); ready to run, waiting for the CPU scheduler" },
  { state: "RUNNING", note: "The scheduler gives t the CPU and run() executes" },
  { state: "TIMED_WAITING", note: "Thread.sleep(500); t gives up the CPU for 500 ms" },
  { state: "RUNNABLE", note: "The sleep time is over; t is ready again" },
  { state: "RUNNING", note: "t runs again" },
  { state: "BLOCKED", note: "t reaches a synchronized block whose lock another thread holds" },
  { state: "RUNNING", note: "The lock is released, t gets it and continues" },
  { state: "WAITING", note: "lock.wait(); t releases the lock and waits for notify()" },
  { state: "RUNNABLE", note: "Another thread calls lock.notify(); t competes for the lock again" },
  { state: "RUNNING", note: "t runs the rest of run()" },
  { state: "TERMINATED", note: "run() ends; the thread is dead and cannot be restarted" },
];
/** Two threads each do counter++ (load, add, store) N times; the CPU switches thread every q micro-steps. */
export function raceRun(q: number, N: number, sync: boolean) {
  let counter = 0;
  const th = [{ left: N, pc: 0, reg: 0 }, { left: N, pc: 0, reg: 0 }];
  let cur = 0, used = 0, lock = -1, guard = 0;
  while ((th[0].left > 0 || th[1].left > 0) && guard++ < 10000) {
    if (th[cur].left === 0 || used >= q) { cur = 1 - cur; used = 0; if (th[cur].left === 0) { cur = 1 - cur; } if (th[cur].left === 0) break; }
    const t = th[cur];
    if (sync && t.pc === 0) { if (lock !== -1 && lock !== cur) { cur = 1 - cur; used = 0; continue; } lock = cur; }
    if (t.pc === 0) t.reg = counter; else if (t.pc === 1) t.reg += 1; else { counter = t.reg; t.left--; if (sync) lock = -1; }
    t.pc = (t.pc + 1) % 3; used++;
  }
  return { counter, expected: 2 * N, lost: 2 * N - counter };
}

export type VmFrame = { pc: number; op: string; stack: number[]; locals: (number | null)[]; note: string };
export function jvmFrames(a: number, b: number, k: number): VmFrame[] {
  const code: [string, string][] = [
    [`bipush ${a}`, `push the constant ${a}`], ["istore_1", "pop into local variable 1 (a)"], [`bipush ${b}`, `push the constant ${b}`], ["istore_2", "pop into local variable 2 (b)"],
    ["iload_1", "push local 1 (a)"], ["iload_2", "push local 2 (b)"], [`bipush ${k}`, `push the constant ${k}`], ["imul", "pop two, push their product"], ["iadd", "pop two, push their sum"], ["istore_3", "pop into local variable 3 (c)"], ["return", "end of main"],
  ];
  const st: number[] = [], loc: (number | null)[] = [null, null, null, null];
  const fr: VmFrame[] = [{ pc: -1, op: "start", stack: [], locals: [...loc], note: "int a = A; int b = B; int c = a + b * K;  compiled to bytecode" }];
  code.forEach(([op, note], i) => {
    if (op.startsWith("bipush")) st.push(Number(op.split(" ")[1]));
    else if (op.startsWith("istore")) loc[Number(op.slice(-1))] = st.pop() ?? 0;
    else if (op.startsWith("iload")) st.push(loc[Number(op.slice(-1))] ?? 0);
    else if (op === "imul") { const y = st.pop() ?? 0, x = st.pop() ?? 0; st.push(x * y); }
    else if (op === "iadd") { const y = st.pop() ?? 0, x = st.pop() ?? 0; st.push(x + y); }
    fr.push({ pc: i, op, stack: [...st], locals: [...loc], note });
  });
  return fr;
}
