/** Pure maths for the BCAZ Computer Organization labs (BCA-007). No React, no three. */

export const bs = (v: number, n: number) => (v >>> 0).toString(2).padStart(n, "0").slice(-n);
export const log2c = (n: number) => Math.max(0, Math.ceil(Math.log2(Math.max(1, n))));

/* ---------------- IEEE 754 ---------------- */
export const FP_FORMATS = { mini: { eb: 4, mb: 3, name: "8-bit mini (1-4-3)" }, half: { eb: 5, mb: 10, name: "half (1-5-10)" }, single: { eb: 8, mb: 23, name: "single (1-8-23)" } } as const;
export type FpFmt = keyof typeof FP_FORMATS;

const rne = (v: number) => { const f = Math.floor(v), d = v - f; return d > 0.5 ? f + 1 : d < 0.5 ? f : f % 2 === 0 ? f : f + 1; };

/** Encode x with eb exponent bits and mb fraction bits (round to nearest even). */
export function fpEncode(x: number, eb: number, mb: number) {
  const bias = 2 ** (eb - 1) - 1, emax = 2 ** eb - 1;
  const sign = x < 0 || Object.is(x, -0) ? 1 : 0, a = Math.abs(x);
  let E = 0, f = 0;
  if (Number.isNaN(x)) { E = emax; f = 2 ** (mb - 1); }
  else if (a === Infinity) E = emax;
  else if (a > 0) {
    let e = Math.floor(Math.log2(a));
    if (2 ** e > a) e--; else if (2 ** (e + 1) <= a) e++;
    E = e + bias;
    if (E >= 1) {
      f = rne((a / 2 ** e - 1) * 2 ** mb);
      if (f >= 2 ** mb) { f = 0; E++; }
      if (E >= emax) { E = emax; f = 0; }
    } else {
      f = rne((a / 2 ** (1 - bias)) * 2 ** mb);
      if (f >= 2 ** mb) { E = 1; f = 0; } else E = 0;
    }
  }
  return fpDescribe(sign, E, f, eb, mb);
}
export function fpDescribe(sign: number, E: number, f: number, eb: number, mb: number) {
  const bias = 2 ** (eb - 1) - 1, emax = 2 ** eb - 1;
  let kind: "zero" | "subnormal" | "normal" | "inf" | "nan" = "normal", value: number;
  if (E === emax) { kind = f === 0 ? "inf" : "nan"; value = f === 0 ? (sign ? -Infinity : Infinity) : NaN; }
  else if (E === 0) { kind = f === 0 ? "zero" : "subnormal"; value = (sign ? -1 : 1) * (f / 2 ** mb) * 2 ** (1 - bias); }
  else value = (sign ? -1 : 1) * (1 + f / 2 ** mb) * 2 ** (E - bias);
  const unb = E === 0 ? 1 - bias : E - bias;
  return { sign, E, f, bias, kind, value, unb, ulp: 2 ** (unb - mb), bits: bs(sign, 1) + bs(E, eb) + bs(f, mb), eb, mb };
}
/** Hex of a 1+eb+mb bit pattern (pads to whole nibbles). */
export function fpHex(r: { sign: number; E: number; f: number; eb: number; mb: number }) {
  const total = 1 + r.eb + r.mb, big = (BigInt(r.sign) << BigInt(total - 1)) | (BigInt(r.E) << BigInt(r.mb)) | BigInt(r.f);
  return big.toString(16).toUpperCase().padStart(Math.ceil(total / 4), "0");
}
export function fpModel(x: number, fmt: FpFmt) {
  const F = FP_FORMATS[fmt], r = fpEncode(x, F.eb, F.mb);
  return { ...r, hex: fpHex(r), err: r.value - x, mant: r.kind === "normal" ? 1 + r.f / 2 ** F.mb : r.kind === "subnormal" ? r.f / 2 ** F.mb : 0, name: F.name };
}
/** Floating-point addition on mini-format style operands: align exponents, add mantissas, normalise. Returns steps. */
export function fpAddSteps(a: number, b: number) {
  const ea = Math.floor(Math.log2(Math.abs(a))), eb = Math.floor(Math.log2(Math.abs(b)));
  const ma = a / 2 ** ea, mb = b / 2 ** eb, shift = Math.abs(ea - eb), e = Math.max(ea, eb);
  const sa = ea >= eb ? ma : ma / 2 ** shift, sb = eb >= ea ? mb : mb / 2 ** shift;
  const sum = sa + sb, ne = sum === 0 ? 0 : Math.floor(Math.log2(Math.abs(sum))), nm = sum / 2 ** ne;
  return { shift, e, sum, normE: e + ne, normM: nm, result: nm * 2 ** (e + ne) };
}

/* ---------------- RISC vs CISC ---------------- */
export function riscCisc(icC: number, ratio: number, cpiC: number, cpiR: number, fC: number, fR: number, bytesC = 3.4, bytesR = 4) {
  const icR = icC * ratio, tC = (icC * 1e6 * cpiC) / (fC * 1e6), tR = (icR * 1e6 * cpiR) / (fR * 1e6);
  return { icR, tC, tR, speedup: tC / tR, mipsC: fC / cpiC, mipsR: fR / cpiR, sizeC: icC * bytesC, sizeR: icR * bytesR, winner: tR < tC ? "RISC" : tR > tC ? "CISC" : "tie" };
}

/* ---------------- Instruction formats ---------------- */
export type Node = string | [string, Node, Node];
export const EXPRS: Record<string, { text: string; tree: Node }> = {
  e1: { text: "X = (A + B) * (C + D)", tree: ["*", ["+", "A", "B"], ["+", "C", "D"]] },
  e2: { text: "X = A * B + C * D", tree: ["+", ["*", "A", "B"], ["*", "C", "D"]] },
  e3: { text: "X = (A - B) / (C + D * E)", tree: ["/", ["-", "A", "B"], ["+", "C", ["*", "D", "E"]]] },
};
export const VARS: Record<string, number> = { A: 2, B: 3, C: 4, D: 5, E: 6 };
const OPN: Record<string, string> = { "+": "ADD", "-": "SUB", "*": "MUL", "/": "DIV" };
const apply = (o: string, x: number, y: number) => (o === "+" ? x + y : o === "-" ? x - y : o === "*" ? x * y : x / y);
export type Ins = { text: string; mem: number; bytes: number; result: number };
const isLeaf = (n: Node): n is string => typeof n === "string";

/** Compile X = tree for a zero/one/two/three-address machine and execute it, recording per-instruction memory references and value. */
export function compileExpr(tree: Node, fmt: "zero" | "one" | "two" | "three"): Ins[] {
  const out: Ins[] = [], mem: Record<string, number> = { ...VARS };
  const OP = 8, MA = 16, RA = 4;
  const isMem = (s: string) => /^[A-EXT]\d?$/.test(s) && !/^R/.test(s);
  const push = (text: string, ops: string[], result: number) => out.push({ text, mem: 1 + ops.filter(isMem).length, bytes: (OP + ops.reduce((s, o) => s + (isMem(o) ? MA : RA), 0)) / 8, result });
  if (fmt === "zero") {
    const st: number[] = [];
    const g = (n: Node) => {
      if (isLeaf(n)) { st.push(mem[n]); push(`PUSH ${n}`, [n], mem[n]); return; }
      g(n[1]); g(n[2]); const y = st.pop()!, x = st.pop()!, r = apply(n[0], x, y); st.push(r); push(OPN[n[0]], [], r);
    };
    g(tree); const top = st.pop()!; push("POP X", ["X"], top); return out;
  }
  if (fmt === "one") {
    let acc = 0, t = 0;
    const g = (n: Node): void => {
      if (isLeaf(n)) { acc = mem[n]; push(`LOAD ${n}`, [n], acc); return; }
      const [o, l, r] = n;
      if (isLeaf(r)) { g(l); acc = apply(o, acc, mem[r]); push(`${OPN[o]} ${r}`, [r], acc); }
      else if (isLeaf(l) && (o === "+" || o === "*")) { g(r); acc = apply(o, acc, mem[l]); push(`${OPN[o]} ${l}`, [l], acc); }
      else { g(r); const tn = `T${++t}`; mem[tn] = acc; push(`STORE ${tn}`, [tn], acc); g(l); acc = apply(o, acc, mem[tn]); push(`${OPN[o]} ${tn}`, [tn], acc); }
    };
    g(tree); mem.X = acc; push("STORE X", ["X"], acc); return out;
  }
  if (fmt === "two") {
    const reg: number[] = []; let k = 0;
    const g = (n: Node): number => {
      const i = k++;
      if (isLeaf(n)) { reg[i] = mem[n]; push(`MOV R${i + 1},${n}`, [`R${i + 1}`, n], reg[i]); return i; }
      const a = g(n[1]);
      if (isLeaf(n[2])) { reg[a] = apply(n[0], reg[a], mem[n[2]]); push(`${OPN[n[0]]} R${a + 1},${n[2]}`, [`R${a + 1}`, n[2]], reg[a]); }
      else { const b = g(n[2]); reg[a] = apply(n[0], reg[a], reg[b]); push(`${OPN[n[0]]} R${a + 1},R${b + 1}`, [`R${a + 1}`, `R${b + 1}`], reg[a]); }
      return a;
    };
    const r = g(tree); push(`MOV X,R${r + 1}`, ["X", `R${r + 1}`], reg[r]); return out;
  }
  const reg: number[] = []; let k = 0;
  const val = (s: string) => (s.startsWith("R") ? reg[Number(s.slice(1)) - 1] : mem[s]);
  const g = (n: Node, dest?: string): string => {
    if (isLeaf(n)) return n;
    const a = g(n[1]), b = g(n[2]), d = dest ?? `R${++k}`, v = apply(n[0], val(a), val(b));
    if (d.startsWith("R")) reg[Number(d.slice(1)) - 1] = v; else mem[d] = v;
    push(`${OPN[n[0]]} ${d},${a},${b}`, [d, a, b], v); return d;
  };
  g(tree, "X"); return out;
}
export function formatStats(tree: Node, fmt: "zero" | "one" | "two" | "three") {
  const p = compileExpr(tree, fmt);
  return { prog: p, count: p.length, bytes: p.reduce((s, i) => s + i.bytes, 0), refs: p.reduce((s, i) => s + i.mem, 0), final: p[p.length - 1].result };
}

/* ---------------- ALSU ---------------- */
export type AlsuMode = "arith" | "logic" | "shl" | "shr";
export function alsu(mode: AlsuMode, s: number, cin: boolean, a: number, b: number, n = 4) {
  const M = (1 << n) - 1, c = cin ? 1 : 0;
  let r = 0, carry = 0, label = "", ovf = 0;
  if (mode === "arith") {
    const y = [0, b, ~b & M, M][s], t = a + y + c;
    r = t & M; carry = t > M ? 1 : 0;
    const sa = a >> (n - 1), sy = y >> (n - 1), sr = r >> (n - 1);
    ovf = sa === sy && sr !== sa ? 1 : 0;
    label = ["A + cin (transfer / increment)", "A + B + cin (add)", "A + B' + cin (subtract when cin = 1)", "A - 1 + cin (decrement / transfer)"][s];
  } else if (mode === "logic") {
    r = [a & b, a | b, a ^ b, ~a & M][s]; label = ["A AND B", "A OR B", "A XOR B", "NOT A"][s];
  } else if (mode === "shl") { r = (a << 1) & M | c; carry = (a >> (n - 1)) & 1; label = "shift left A (serial in = cin)"; }
  else { r = (a >> 1) | (c << (n - 1)); carry = a & 1; label = "shift right A (serial in = cin)"; }
  return { r, carry, z: r === 0 ? 1 : 0, neg: (r >> (n - 1)) & 1, v: ovf, label, signed: r & (1 << (n - 1)) ? r - (1 << n) : r };
}

/* ---------------- Microprogrammed control ---------------- */
export type Micro = { ops: string; cond: "u" | "i" | "z"; br: "inc" | "jmp" | "call" | "ret" | "map"; ad: number; name: string };
export const CONTROL_MEMORY: Micro[] = [
  { name: "FETCH1", ops: "AR <- PC", cond: "u", br: "inc", ad: 0 },
  { name: "FETCH2", ops: "IR <- M[AR], PC <- PC + 1", cond: "u", br: "inc", ad: 0 },
  { name: "DECODE", ops: "AR <- IR(addr)", cond: "u", br: "map", ad: 0 },
  { name: "INDRCT", ops: "AR <- M[AR]", cond: "u", br: "ret", ad: 0 },
  { name: "ADD", ops: "(if I = 1 call INDRCT)", cond: "i", br: "call", ad: 3 },
  { name: "ADD2", ops: "DR <- M[AR]", cond: "u", br: "inc", ad: 0 },
  { name: "ADD3", ops: "AC <- AC + DR", cond: "u", br: "jmp", ad: 0 },
  { name: "LDA", ops: "(if I = 1 call INDRCT)", cond: "i", br: "call", ad: 3 },
  { name: "LDA2", ops: "DR <- M[AR]", cond: "u", br: "inc", ad: 0 },
  { name: "LDA3", ops: "AC <- DR", cond: "u", br: "jmp", ad: 0 },
  { name: "STA", ops: "(if I = 1 call INDRCT)", cond: "i", br: "call", ad: 3 },
  { name: "STA2", ops: "M[AR] <- AC", cond: "u", br: "jmp", ad: 0 },
  { name: "BRZ", ops: "(if AC = 0 go to BRZ3)", cond: "z", br: "jmp", ad: 14 },
  { name: "BRZ2", ops: "no operation", cond: "u", br: "jmp", ad: 0 },
  { name: "BRZ3", ops: "PC <- AR", cond: "u", br: "jmp", ad: 0 },
  { name: "SPARE", ops: "unused", cond: "u", br: "jmp", ad: 0 },
];
export const OPCODE_MAP = [4, 7, 10, 12] as const;
export const OPNAMES = ["ADD", "LDA", "STA", "BRZ"] as const;
export const CONTROL_WORD_BITS = 3 + 3 + 3 + 2 + 2 + 4;

/** Micro-address trace of one instruction from CAR = 0 until the sequencer returns to 0. */
export function microTrace(opcode: number, indirect: boolean, zero: boolean) {
  const trace: { car: number; next: number; how: string }[] = [];
  let car = 0, sbr = -1;
  for (let guard = 0; guard < 40; guard++) {
    const m = CONTROL_MEMORY[car];
    const take = m.cond === "u" || (m.cond === "i" && indirect) || (m.cond === "z" && zero);
    let next = car + 1, how = "increment";
    if (m.br === "map") { next = OPCODE_MAP[opcode & 3]; how = "map opcode bits"; }
    else if (m.br === "ret") { next = sbr; how = "return (SBR)"; }
    else if (m.br === "jmp" && take) { next = m.ad; how = m.ad === 0 ? "jump to FETCH" : `jump to ${m.ad}`; }
    else if (m.br === "call" && take) { sbr = car + 1; next = m.ad; how = `call ${m.ad}, save ${car + 1}`; }
    trace.push({ car, next, how });
    if (next === 0) break;
    car = next;
  }
  return trace;
}

/* ---------------- Common bus ---------------- */
export function busModel(k: number, n: number, src: number, mode: "mux" | "tri") {
  const s = src % k, val = (i: number) => ((i * 37 + 11) * 7 + 5) % (2 ** n);
  const sel = log2c(k);
  const mux = n * (k - 1), tri = n * k;
  return { s, bus: val(s), regs: Array.from({ length: k }, (_, i) => val(i)), selLines: sel, mux2: mux, tri, gates: mode === "mux" ? n * (k * 1 + 1) + (sel ? 2 ** sel : 0) : tri + 2 ** sel, mux4: Math.ceil(k / 4) * n };
}

/* ---------------- Shift micro-operations ---------------- */
export type ShiftKind = "shl" | "shr" | "ashl" | "ashr" | "cil" | "cir";
export function shiftOp(v: number, n: number, kind: ShiftKind, count: number) {
  const M = 2 ** n - 1; let x = v & M, carry = 0, ovf = 0;
  for (let i = 0; i < count; i++) {
    const msb = (x >> (n - 1)) & 1, lsb = x & 1;
    if (kind === "shl") { carry = msb; x = (x << 1) & M; }
    else if (kind === "shr") { carry = lsb; x >>= 1; }
    else if (kind === "ashl") { carry = msb; const nx = (x << 1) & M; if (((nx >> (n - 1)) & 1) !== msb) ovf = 1; x = nx; }
    else if (kind === "ashr") { carry = lsb; x = (x >> 1) | (msb << (n - 1)); }
    else if (kind === "cil") { carry = msb; x = ((x << 1) & M) | msb; }
    else { carry = lsb; x = (x >> 1) | (lsb << (n - 1)); }
  }
  return { out: x, carry, ovf, signedIn: (v & M) >= 2 ** (n - 1) ? (v & M) - 2 ** n : v & M, signedOut: x >= 2 ** (n - 1) ? x - 2 ** n : x };
}

/* ---------------- Memory hierarchy ---------------- */
export function hierarchy(h1: number, h2: number, tc: number, tm: number, td: number) {
  const p1 = h1 / 100, p2 = h2 / 100;
  const eat = p1 * tc + (1 - p1) * (p2 * (tc + tm) + (1 - p2) * (tc + tm + td));
  const eatPar = p1 * tc + (1 - p1) * (p2 * tm + (1 - p2) * (tm + td));
  const noCache = p2 * tm + (1 - p2) * (tm + td);
  return { eat, eatPar, noCache, speedup: noCache / eat, diskFrac: (1 - p1) * (1 - p2) };
}

/* ---------------- RAM chip arrangement ---------------- */
export const CHIPS = { "1Kx4": [1024, 4], "1Kx8": [1024, 8], "2Kx8": [2048, 8], "256x4": [256, 4], "4Kx4": [4096, 4] } as const;
export type ChipId = keyof typeof CHIPS;
export function ramBuild(addrLines: number, width: number, chip: ChipId, row: number) {
  const [cw, cb] = CHIPS[chip], words = 2 ** addrLines, rows = Math.max(1, words / cw), cols = Math.max(1, Math.ceil(width / cb));
  const sel = Math.max(0, addrLines - Math.log2(cw)), r = Math.min(row, rows - 1);
  return { words, rows, cols, chips: rows * cols, selLines: sel, decoder: sel > 0 ? `${sel} to ${2 ** sel}` : "none", low: r * cw, high: r * cw + cw - 1, row: r, chipLines: Math.log2(cw), bits: words * width };
}

/* ---------------- Cache write policy ---------------- */
export function accessTrace(pattern: "loop" | "stream" | "rand", len: number, wr: number) {
  let s = 12345;
  const rnd = () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; };
  return Array.from({ length: len }, (_, i) => {
    const blk = pattern === "loop" ? [3, 7, 3, 7, 11, 3][i % 6] : pattern === "stream" ? i : Math.floor(rnd() * 12);
    return { blk, w: rnd() * 100 < wr };
  });
}
export function cachePolicy(policy: "wt" | "wb", lines: number, pattern: "loop" | "stream" | "rand", wr: number, upto: number) {
  const tr = accessTrace(pattern, 48, wr), tag: number[] = Array(lines).fill(-1), dirty: boolean[] = Array(lines).fill(false);
  let hits = 0, misses = 0, memW = 0, memR = 0;
  const log: { blk: number; w: boolean; hit: boolean; line: number; evictDirty: boolean }[] = [];
  for (let i = 0; i < Math.min(upto, tr.length); i++) {
    const { blk, w } = tr[i], line = blk % lines, hit = tag[line] === blk;
    let evictDirty = false;
    if (hit) hits++;
    else {
      misses++;
      if (policy === "wb" && tag[line] >= 0 && dirty[line]) { memW++; evictDirty = true; }
      if (!(policy === "wt" && w)) { tag[line] = blk; dirty[line] = false; memR++; }
    }
    if (w) { if (policy === "wt") memW++; else if (tag[line] === blk) dirty[line] = true; }
    log.push({ blk, w, hit, line, evictDirty });
  }
  const n = Math.max(1, hits + misses);
  return { hits, misses, memW, memR, ratio: hits / n, tag, dirty, log, traffic: memW + memR, dirtyLines: dirty.filter(Boolean).length };
}

/* ---------------- Bus arbitration ---------------- */
export function arbitrate(scheme: "daisy" | "parallel" | "rotating", req: number, n: number, rounds: number, tpd: number, tg: number) {
  const wins = Array(n).fill(0), seq: number[] = [];
  let last = -1;
  for (let r = 0; r < rounds; r++) {
    let w = -1;
    for (let k = 0; k < n; k++) {
      const i = scheme === "rotating" ? (last + 1 + k) % n : k;
      if ((req >> i) & 1) { w = i; break; }
    }
    seq.push(w); if (w >= 0) { wins[w]++; last = w; }
  }
  const first = seq[0] ?? -1;
  const delay = scheme === "daisy" ? (first + 1) * tpd : (1 + log2c(n)) * tg;
  const starved = Array.from({ length: n }, (_, i) => ((req >> i) & 1) === 1 && wins[i] === 0);
  return { seq, wins, first, delay, starved, wires: scheme === "daisy" ? 3 : 2 * n + log2c(n) };
}

/* ---------------- Priority interrupts ---------------- */
export function interruptRun(gap: number, len: number, mask: number, ovh: number) {
  // INT3 (lowest priority) at t = 0, INT2 at gap, INT1 at 2 gap, INT0 at 3 gap. Priority: INT0 highest.
  const src = [3, 2, 1, 0].map((p, k) => ({ p, arr: k * gap, rem: len, started: -1, done: -1, masked: ((mask >> p) & 1) === 1 }));
  const live = src.filter((s) => !s.masked), segs: { p: number; a: number; b: number }[] = [];
  let t = 0, cur = -1, depth = 0, maxDepth = 0, ctx = 0;
  for (let guard = 0; guard < 4000 && live.some((s) => s.done < 0); guard++) {
    const ready = live.filter((s) => s.arr <= t && s.done < 0).sort((a, b) => a.p - b.p);
    if (!ready.length) { t++; continue; }
    const top = ready[0];
    if (cur !== top.p) {
      if (cur >= 0 && live.find((s) => s.p === cur)!.done < 0) { depth = ready.filter((s) => s.started >= 0).length; ctx++; }
      if (top.started < 0) { top.started = t; for (let i = 0; i < ovh; i++) t++; }
      cur = top.p; maxDepth = Math.max(maxDepth, ready.filter((s) => s.started >= 0).length);
    }
    const last = segs[segs.length - 1];
    if (last && last.p === top.p && last.b === t) last.b = t + 1; else segs.push({ p: top.p, a: t, b: t + 1 });
    top.rem--; t++;
    if (top.rem === 0) { top.done = t; cur = -1; }
  }
  void depth;
  const order = [...live].sort((a, b) => a.done - b.done).map((s) => s.p);
  const lat = (p: number) => { const s = src.find((x) => x.p === p)!; return s.masked ? -1 : s.started - s.arr; };
  return { segs, order, finish: t, maxDepth, ctx, latency: [0, 1, 2, 3].map(lat), done: src.map((s) => s.done), src };
}

/* ---------------- DMA ---------------- */
export function dmaModel(n: number, b: number, u: number, tm: number, td: number) {
  const p = u / 100, delay = n * tm * (1 - (1 - p) ** b), stall = b * tm;
  return { bus: tm / td, delay, worst: stall, transfer: n * td, slow: delay / (n * td), bursts: Math.ceil(n / b) };
}

/* ---------------- Handshake ---------------- */
export function handshake(mode: "strobe" | "handshake", tp: number, ts: number, td: number, tw: number) {
  if (mode === "handshake") {
    const T1 = ts, T2 = T1 + tp + td, T3 = T2 + tp, T4 = T3 + tp, end = T4 + tp;
    return { cycle: end, ok: true, dv: [T1, T3], ack: [T2 + 0, T4], data: [0, T3], T: [T1, T2, T3, T4], rate: 1000 / end, lost: false };
  }
  const T1 = ts, end = ts + tw, lost = td > tw;
  return { cycle: end, ok: !lost, dv: [T1, T1 + tw], ack: [0, 0], data: [0, T1 + tw], T: [T1, T1 + tw, T1 + tw, T1 + tw], rate: 1000 / end, lost };
}
