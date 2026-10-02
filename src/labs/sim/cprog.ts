/**
 * Pure logic for the CST-001 (Programming for Problem Solving in C) labs. No React, no three.
 * Algorithms are run once into a full trace of steps; the scenes only walk that trace, so every number is
 * deterministic and testable. C type sizes follow a typical 64-bit GCC (the same rules as the app's quizzes).
 */

/** Small seeded PRNG (mulberry32): same seed → same sequence. Returns numbers in [0, 1). */
export function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ───────────────────────────── Sorting ───────────────────────────── */

export type SortAlgo = "bubble" | "insertion" | "selection";
export type InputOrder = "random" | "nearly" | "reversed";
export type SortKind = "start" | "cmp" | "swap" | "shift" | "key" | "insert" | "min" | "done";

/** One frame of a sorting run. `a` is the array as it looks at this step. */
export interface SortStep {
  a: number[];
  /** Highlighted pair (compared, or swapped/shifted); -1 when none. */
  i: number; j: number;
  /** Held element: the insertion-sort key, or the current minimum in selection sort; -1 when none. */
  key: number;
  kind: SortKind;
  /** Indices in [lo, hi) are drawn as the sorted part. */
  lo: number; hi: number;
  /** Comparisons and swaps/shifts done so far (including this step). */
  cmp: number; mov: number;
  pass: number;
  /** The C statement being executed. */
  line: string;
}

export const SORT_INFO: Record<SortAlgo, { name: string; best: string; worst: string; moves: string }> = {
  bubble: { name: "Bubble sort", best: "O(n)", worst: "O(n²)", moves: "Swaps" },
  insertion: { name: "Insertion sort", best: "O(n)", worst: "O(n²)", moves: "Shifts" },
  selection: { name: "Selection sort", best: "O(n²)", worst: "O(n²)", moves: "Swaps" },
};

/** A permutation of 1…n: shuffled by the seed, nearly sorted (a few adjacent swaps) or reversed. */
export function makeInput(n: number, seed: number, order: InputOrder): number[] {
  const N = Math.max(1, Math.round(n));
  const a = Array.from({ length: N }, (_, i) => i + 1);
  if (order === "reversed") return a.reverse();
  const rnd = mulberry32(0x9e3779b9 ^ Math.round(seed));
  if (order === "random") {
    for (let i = N - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  const swaps = Math.max(1, Math.round(N / 10));
  for (let s = 0; s < swaps && N > 1; s++) { const j = Math.floor(rnd() * (N - 1)); const t = a[j]; a[j] = a[j + 1]; a[j + 1] = t; }
  return a;
}

/** The whole run of a sorting algorithm on `input`, one entry per comparison / move, starting with the unsorted array. */
export function sortTrace(algo: SortAlgo, input: readonly number[]): SortStep[] {
  const a = input.slice(), n = a.length, out: SortStep[] = [];
  let cmp = 0, mov = 0;
  const push = (kind: SortKind, i: number, j: number, key: number, lo: number, hi: number, pass: number, line: string) =>
    out.push({ a: a.slice(), i, j, key, kind, lo, hi, cmp, mov, pass, line });
  const sw = (x: number, y: number) => { const t = a[x]; a[x] = a[y]; a[y] = t; };

  if (algo === "bubble") {
    push("start", -1, -1, -1, n, n, 0, "for (i = 0; i < n - 1; i++)");
    let passes = 0, early = false;
    for (let i = 0; i < n - 1; i++) {
      passes = i + 1;
      let swapped = false;
      for (let j = 0; j < n - 1 - i; j++) {
        cmp++;
        const gt = a[j] > a[j + 1];
        push("cmp", j, j + 1, -1, n - i, n, i + 1, `if (a[${j}] > a[${j + 1}])  // ${a[j]} > ${a[j + 1]} ${gt}`);
        if (gt) { sw(j, j + 1); mov++; swapped = true; push("swap", j, j + 1, -1, n - i, n, i + 1, `swap(&a[${j}], &a[${j + 1}]); swapped = 1;`); }
      }
      if (!swapped) { early = true; break; }
    }
    push("done", -1, -1, -1, 0, n, passes, early ? "if (!swapped) break;  // no swaps: sorted" : "loop ends: array sorted");
  } else if (algo === "insertion") {
    push("start", -1, -1, -1, 0, Math.min(1, n), 0, "for (i = 1; i < n; i++)");
    for (let i = 1; i < n; i++) {
      const key = a[i];
      let j = i - 1;
      push("key", -1, -1, i, 0, i, i, `key = a[${i}]; j = ${i - 1};  // key = ${key}`);
      while (j >= 0) {
        cmp++;
        const gt = a[j] > key;
        push("cmp", j, j + 1, j + 1, 0, i + 1, i, `while (j >= 0 && a[${j}] > key)  // ${a[j]} > ${key} ${gt}`);
        if (!gt) break;
        // a[j+1] = a[j]: the key's slot moves one place left (drawn as the key sliding past the bigger value)
        a[j + 1] = a[j]; a[j] = key; mov++;
        push("shift", j, j + 1, j, 0, i + 1, i, `a[${j + 1}] = a[${j}]; j--;  // shift ${a[j + 1]} right`);
        j--;
      }
      push("insert", -1, -1, j + 1, 0, i + 1, i, `a[${j + 1}] = key;  // ${key} placed`);
    }
    push("done", -1, -1, -1, 0, n, Math.max(0, n - 1), "loop ends: array sorted");
  } else {
    push("start", -1, -1, -1, 0, 0, 0, "for (i = 0; i < n - 1; i++)");
    for (let i = 0; i < n - 1; i++) {
      let min = i;
      push("min", -1, -1, min, 0, i, i + 1, `min = ${i};  // a[${i}] = ${a[i]} for now`);
      for (let j = i + 1; j < n; j++) {
        cmp++;
        const lt = a[j] < a[min];
        push("cmp", j, min, min, 0, i, i + 1, `if (a[${j}] < a[min])  // ${a[j]} < ${a[min]} ${lt}`);
        if (lt) { min = j; push("min", -1, -1, min, 0, i, i + 1, `min = ${j};  // new smallest ${a[j]}`); }
      }
      if (min !== i) { sw(i, min); mov++; push("swap", i, min, -1, 0, i, i + 1, `swap(&a[${i}], &a[${min}]);`); }
    }
    push("done", -1, -1, -1, 0, n, Math.max(0, n - 1), "loop ends: array sorted");
  }
  return out;
}

/* ───────────────────────────── Searching ───────────────────────────── */

export type SearchMethod = "linear" | "binary";

/** A fixed strictly increasing array (gaps of 1–4): the first n values are the same for every n. Max value ≤ 256. */
export function searchArray(n: number): number[] {
  const r = mulberry32(2024), out: number[] = [];
  let v = 1 + Math.floor(r() * 3);
  for (let i = 0; i < n; i++) { out.push(v); v += 1 + Math.floor(r() * 4); }
  return out;
}

/** One probe of a search. Step 0 is the set-up; step k (k ≥ 1) is the k-th element examined. */
export interface SearchStep { lo: number; hi: number; at: number; probes: number; msg: string }
export interface SearchRun { steps: SearchStep[]; found: number; probes: number }

export function searchTrace(method: SearchMethod, a: readonly number[], x: number): SearchRun {
  const n = a.length, steps: SearchStep[] = [];
  if (method === "linear") {
    steps.push({ lo: 0, hi: n - 1, at: -1, probes: 0, msg: "for (i = 0; i < n; i++)" });
    for (let i = 0; i < n; i++) {
      const eq = a[i] === x;
      steps.push({ lo: 0, hi: n - 1, at: i, probes: i + 1, msg: eq ? `a[${i}] = ${a[i]} == ${x} → found` : `a[${i}] = ${a[i]} ≠ ${x} → ${i === n - 1 ? "end: not found" : "i++"}` });
      if (eq) return { steps, found: i, probes: i + 1 };
    }
    return { steps, found: -1, probes: n };
  }
  let lo = 0, hi = n - 1, p = 0;
  steps.push({ lo, hi, at: -1, probes: 0, msg: `low = 0, high = ${n - 1}` });
  while (lo <= hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    p++;
    if (a[mid] === x) { steps.push({ lo, hi, at: mid, probes: p, msg: `a[${mid}] = ${a[mid]} == ${x} → found` }); return { steps, found: mid, probes: p }; }
    const less = a[mid] < x;
    const nlo = less ? mid + 1 : lo, nhi = less ? hi : mid - 1;
    const msg = `a[${mid}] = ${a[mid]} ${less ? "<" : ">"} ${x} → ${less ? `low = ${mid + 1}` : `high = ${mid - 1}`}${nlo > nhi ? "; low > high: not found" : ""}`;
    steps.push({ lo, hi, at: mid, probes: p, msg });
    lo = nlo; hi = nhi;
  }
  return { steps, found: -1, probes: p };
}

/** Worst-case number of probes of binary search on n elements: ⌈log₂(n + 1)⌉ (computed with integers). */
export function binaryWorst(n: number): number {
  let b = 0;
  while (2 ** b < n + 1) b++;
  return b;
}

/* ───────────────────────────── Pointers ───────────────────────────── */

export const PTR_TYPES = { char: 1, short: 2, int: 4, double: 8 } as const;
export type PtrType = keyof typeof PTR_TYPES;
export const PTR_BASES = { x1000: 0x1000, x2000: 0x2000, stack: 0x7ffe3c10 } as const;
export type PtrBase = keyof typeof PTR_BASES;

/** `T a[n]` at address `base`, `p = &a[k]`, looking at `p + i`. Elements hold a[j] = 10·(j + 1). */
export function pointerInfo(type: PtrType, n: number, k: number, i: number, base: number) {
  const size = PTR_TYPES[type], idx = k + i, addrK = base + k * size, addrP = addrK + i * size;
  const inBounds = idx >= 0 && idx < n;
  return { size, idx, addrK, addrP, offset: i * size, sizeofA: n * size, inBounds, onePast: idx === n, value: inBounds ? 10 * (idx + 1) : null };
}

export const hex = (x: number) => "0x" + Math.round(x).toString(16);

/* ───────────────────────────── Bits ───────────────────────────── */

export type BitOp = "and" | "or" | "xor" | "not" | "shl" | "shr";
export const BIT_SYMBOL: Record<BitOp, string> = { and: "&", or: "|", xor: "^", not: "~", shl: "<<", shr: ">>" };

/** The 8-bit result, as if stored back into an unsigned char. */
export function bitOp(op: BitOp, a: number, b: number, s: number): number {
  const A = a & 255, B = b & 255;
  switch (op) {
    case "and": return A & B;
    case "or": return A | B;
    case "xor": return A ^ B;
    case "not": return ~A & 255;
    case "shl": return (A << s) & 255;
    case "shr": return A >> s;
  }
}

/** "0000 1100" */
export const bin8 = (x: number) => { const s = (x & 255).toString(2).padStart(8, "0"); return `${s.slice(0, 4)} ${s.slice(4)}`; };
export const hex2 = (x: number) => "0x" + (x & 255).toString(16).toUpperCase().padStart(2, "0");
/** Bits of x, index 0 = least significant. */
export const bitsOf = (x: number) => Array.from({ length: 8 }, (_, i) => (x >> i) & 1);

export function bitExpr(op: BitOp, a: number, b: number, s: number): string {
  if (op === "not") return `(unsigned char)~${a}`;
  if (op === "shl" || op === "shr") return `${a} ${BIT_SYMBOL[op]} ${s}`;
  return `${a} ${BIT_SYMBOL[op]} ${b}`;
}

const pow2 = (x: number) => x > 0 && (x & (x - 1)) === 0;
export function bitHint(op: BitOp, a: number, b: number, s: number): string {
  const r = bitOp(op, a, b, s);
  switch (op) {
    case "and":
      if (b === 1) return `a & 1 tests odd: ${a} is ${r ? "odd" : "even"}`;
      if (pow2(b)) return `a & ${b} tests bit ${Math.log2(b)}: it is ${r ? "set" : "clear"}`;
      return "& keeps only bits set in both (masking)";
    case "or":
      if (pow2(b)) return `a | ${b} sets bit ${Math.log2(b)}`;
      return "| turns on every bit set in either";
    case "xor":
      if (a === b) return "a ^ a is 0: every bit cancels";
      if (b === 0) return "a ^ 0 is a";
      if (b === 255) return "a ^ 0xFF flips all 8 bits, same as ~a";
      return "^ flips a's bits where b has 1s; (a ^ b) ^ b == a";
    case "not":
      return `~a flips every bit: 255 − ${a} = ${r} (as int it is ${-a - 1})`;
    case "shl":
      if (s === 0) return "shifting by 0 changes nothing";
      if (a << s > 255) return `bits past bit 7 are lost: ${a << s} as int, ${r} as unsigned char`;
      return `a << ${s} multiplies by 2^${s}: ${a} × ${1 << s} = ${r}`;
    case "shr":
      if (s === 0) return "shifting by 0 changes nothing";
      return `a >> ${s} divides by 2^${s}, rounding down: ${a} / ${1 << s} = ${r}`;
  }
}

/* ───────────────────────────── Struct layout ───────────────────────────── */

export type CType = "char" | "short" | "int" | "float" | "long" | "double" | "ptr";
/** [size, alignment] on a typical 64-bit GCC. */
export const CTYPE: Record<CType, [number, number]> = { char: [1, 1], short: [2, 2], int: [4, 4], float: [4, 4], long: [8, 8], double: [8, 8], ptr: [8, 8] };
export const CTYPE_NAME: Record<CType, string> = { char: "char", short: "short", int: "int", float: "float", long: "long", double: "double", ptr: "char *" };

export interface Layout { offsets: number[]; size: number; align: number; padding: number; pads: { at: number; len: number }[] }

/** Same rule as gcLayout: each member at the next multiple of its alignment, total rounded up to the largest alignment. */
export function structLayout(types: readonly CType[]): Layout {
  let off = 0, ma = 1, used = 0;
  const offsets: number[] = [], pads: { at: number; len: number }[] = [];
  for (const t of types) {
    const [s, al] = CTYPE[t];
    const next = Math.ceil(off / al) * al;
    if (next > off) pads.push({ at: off, len: next - off });
    offsets.push(next);
    off = next + s; used += s; ma = Math.max(ma, al);
  }
  const size = Math.ceil(off / ma) * ma;
  if (size > off) pads.push({ at: off, len: size - off });
  return { offsets, size, align: ma, padding: size - used, pads };
}

/** Member order sorted by size, largest first (stable): the usual way to minimise padding. Returns the original indices. */
export function sortedOrder(types: readonly CType[]): number[] {
  return types.map((_, i) => i).sort((x, y) => CTYPE[types[y]][1] - CTYPE[types[x]][1] || CTYPE[types[y]][0] - CTYPE[types[x]][0] || x - y);
}

/** sizeof a union of these members: largest member rounded up to the strictest alignment. */
export function unionSize(types: readonly CType[]): number {
  let mx = 0, ma = 1;
  for (const t of types) { mx = Math.max(mx, CTYPE[t][0]); ma = Math.max(ma, CTYPE[t][1]); }
  return Math.ceil(mx / ma) * ma;
}
