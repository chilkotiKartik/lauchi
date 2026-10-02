/**
 * Pure logic for the "cstx" Programming for Problem Solving (CST-001) flagship labs: a tiny real compiler + CPU,
 * a C control-flow interpreter, sorting / recursion traces, a first-fit heap and struct / union / FILE models.
 * No React, no three. Scenes only walk the traces produced here.
 */
import { structLayout, unionSize, type CType } from "./cprog";

/* ═══════════════════════ 1. Compilation pipeline + CPU ═══════════════════════ */

export type ProgId = "hello" | "sum" | "loop";
export const PROG_NAME: Record<ProgId, string> = { hello: "Hello, printf", sum: "Sum of two ints", loop: "Loop 1..n" };
export const STAGES = ["preprocess", "compile", "assemble", "link", "run"] as const;
export type Stage = (typeof STAGES)[number];
export const STAGE_NAME: Record<Stage, string> = { preprocess: "Preprocess (.c to .i)", compile: "Compile (.i to .s)", assemble: "Assemble (.s to .o)", link: "Link (.o to a.out)", run: "Load and run" };

/** C source text for the chosen program and its inputs. */
export function sourceOf(p: ProgId, a: number, b: number, n: number): string[] {
  const head = ["#include <stdio.h>", "int main(void) {"];
  if (p === "hello") return [...head, '  printf("Hi!");', "  return 0;", "}"];
  if (p === "sum") return [...head, `  int a = ${a}, b = ${b};`, '  printf("%d", a + b);', "  return 0;", "}"];
  return [...head, `  int n = ${n}, s = 0;`, "  for (int i = 1; i <= n; i++) s += i;", '  printf("%d", s);', "  return 0;", "}"];
}

/** Stage 1: the preprocessor pastes the header in place of #include. */
export function preprocess(src: string[]): string[] {
  const hdr = ["# 1 \"stdio.h\"", "typedef unsigned long size_t;", "extern int printf(const char *fmt, ...);", "extern int scanf(const char *fmt, ...);", "# 2 \"main.c\""];
  return src.flatMap((l) => (l.startsWith("#include") ? hdr : [l]));
}

export type Op = "hlt" | "movi" | "load" | "store" | "add" | "addi" | "cmp" | "jmp" | "jg" | "out" | "outc";
/** Opcode byte for each instruction. */
export const OPCODE: Record<Op, number> = { hlt: 0x00, movi: 0x01, load: 0x02, store: 0x03, add: 0x04, addi: 0x05, cmp: 0x06, jmp: 0x07, jg: 0x08, out: 0x09, outc: 0x0a };
const OP_OF = Object.fromEntries(Object.entries(OPCODE).map(([k, v]) => [v, k as Op])) as Record<number, Op>;
export const REGS = ["eax", "ebx", "ecx", "edx"] as const;
export const CODE_BASE = 0x40;
export const MEM_WORDS = 8;

export interface Asm { op: Op; a: number; b: number; target?: string; label?: string; text: string }

const jump = (op: "jmp" | "jg", target: string): Asm => ({ op, a: 0, b: 0, target, text: `${op} ${target}` });
const mi = (r: number, v: number): Asm => ({ op: "movi", a: r, b: v, text: `mov ${REGS[r]}, ${v}` });
const ld = (r: number, m: number): Asm => ({ op: "load", a: r, b: m, text: `mov ${REGS[r]}, [0x${m.toString(16)}]` });
const st = (m: number, r: number): Asm => ({ op: "store", a: m, b: r, text: `mov [0x${m.toString(16)}], ${REGS[r]}` });
const ad = (r: number, s: number): Asm => ({ op: "add", a: r, b: s, text: `add ${REGS[r]}, ${REGS[s]}` });
const ai = (r: number, v: number): Asm => ({ op: "addi", a: r, b: v, text: `add ${REGS[r]}, ${v}` });
const cm = (r: number, s: number): Asm => ({ op: "cmp", a: r, b: s, text: `cmp ${REGS[r]}, ${REGS[s]}` });
const ou = (r: number): Asm => ({ op: "out", a: r, b: 0, text: `call print_int(${REGS[r]})` });
const oc = (v: number): Asm => ({ op: "outc", a: 0, b: v, text: `call putchar(${v})` });
const hl: Asm = { op: "hlt", a: 0, b: 0, text: "hlt" };

/** Stage 2: the tiny compiler. Variables live in RAM words (as in an unoptimised build); labels name jump targets. */
export function compile(p: ProgId, a: number, b: number, n: number): Asm[] {
  if (p === "hello") return [oc(72), oc(105), oc(33), hl];
  if (p === "sum") return [mi(0, a), st(0, 0), mi(0, b), st(1, 0), ld(0, 0), ld(1, 1), ad(0, 1), st(2, 0), ou(0), hl];
  const L = ".L_loop", E = ".L_end";
  return [
    mi(0, n), st(0, 0), mi(0, 0), st(1, 0), mi(0, 1), st(2, 0),
    { ...ld(0, 2), label: L }, ld(1, 0), cm(0, 1), jump("jg", E),
    ld(2, 1), ad(2, 0), st(1, 2), ai(0, 1), st(2, 0), jump("jmp", L),
    { ...ld(0, 1), label: E }, ou(0), hl,
  ];
}

/** Stage 3: the assembler turns mnemonics into 3-byte machine words (opcode, operand A, operand B). Jump targets are offsets inside the object file. */
export function assemble(asm: Asm[]): number[] {
  const at: Record<string, number> = {};
  asm.forEach((x, i) => { if (x.label) at[x.label] = i * 3; });
  const out: number[] = [];
  for (const x of asm) {
    const b = x.target ? at[x.target] : x.b;
    out.push(OPCODE[x.op], x.a & 0xff, b & 0xff);
  }
  return out;
}

/** Stage 4: the linker places the code at CODE_BASE and adds that base to every jump target (relocation). */
export function link(obj: number[], base = CODE_BASE): number[] {
  const out = obj.slice();
  for (let i = 0; i < out.length; i += 3) if (OP_OF[out[i]] === "jmp" || OP_OF[out[i]] === "jg") out[i + 2] = (out[i + 2] + base) & 0xff;
  return out;
}

export const hex2 = (x: number) => (x & 0xff).toString(16).toUpperCase().padStart(2, "0");
export const hexBytes = (b: number[]) => b.map(hex2);

/** Decode one machine word back to text (what the control unit does in the Decode step). */
export function decode(bytes: number[], pc: number, base = CODE_BASE): string {
  const i = pc - base;
  if (i < 0 || i + 2 > bytes.length - 1) return "??";
  const op = OP_OF[bytes[i]], a = bytes[i + 1], b = bytes[i + 2];
  switch (op) {
    case "hlt": return "hlt";
    case "movi": return `mov ${REGS[a]}, ${b}`;
    case "load": return `mov ${REGS[a]}, [0x${b.toString(16)}]`;
    case "store": return `mov [0x${a.toString(16)}], ${REGS[b]}`;
    case "add": return `add ${REGS[a]}, ${REGS[b]}`;
    case "addi": return `add ${REGS[a]}, ${b}`;
    case "cmp": return `cmp ${REGS[a]}, ${REGS[b]}`;
    case "jmp": return `jmp 0x${b.toString(16)}`;
    case "jg": return `jg 0x${b.toString(16)}`;
    case "out": return `call print_int(${REGS[a]})`;
    case "outc": return `call putchar(${b})`;
    default: return "??";
  }
}

export interface CpuState { pc: number; regs: number[]; mem: number[]; cmp: number; out: string; count: number; ir: string; done: boolean; touched: number }
/** Stage 5: a real fetch-decode-execute loop over the linked bytes. states[k] is the machine after k instructions. */
export function runVM(bytes: number[], base = CODE_BASE, limit = 400): CpuState[] {
  let s: CpuState = { pc: base, regs: [0, 0, 0, 0], mem: new Array(MEM_WORDS).fill(0), cmp: 0, out: "", count: 0, ir: "(reset)", done: false, touched: -1 };
  const states = [s];
  while (!s.done && s.count < limit) {
    const i = s.pc - base;
    if (i < 0 || i + 2 >= bytes.length) { s = { ...s, done: true, ir: "(fell off the end)" }; states.push(s); break; }
    const op = OP_OF[bytes[i]], a = bytes[i + 1], b = bytes[i + 2];
    const regs = s.regs.slice(), mem = s.mem.slice();
    let pc = s.pc + 3, cmp = s.cmp, out = s.out, done = false, touched = -1;
    switch (op) {
      case "hlt": done = true; pc = s.pc; break;
      case "movi": regs[a] = b; break;
      case "load": regs[a] = mem[b]; touched = b; break;
      case "store": mem[a] = regs[b]; touched = a; break;
      case "add": regs[a] = regs[a] + regs[b]; break;
      case "addi": regs[a] = regs[a] + b; break;
      case "cmp": cmp = regs[a] - regs[b]; break;
      case "jmp": pc = b; break;
      case "jg": if (cmp > 0) pc = b; break;
      case "out": out += String(regs[a]); break;
      case "outc": out += String.fromCharCode(b); break;
    }
    s = { pc, regs, mem, cmp, out, count: s.count + 1, ir: decode(bytes, s.pc, base), done, touched };
    states.push(s);
  }
  return states;
}

/** Everything the pipeline lab shows, from the chosen program and numbers. */
export function buildPipeline(p: ProgId, a: number, b: number, n: number) {
  const src = sourceOf(p, a, b, n), pre = preprocess(src), asm = compile(p, a, b, n), obj = assemble(asm), exe = link(obj), states = runVM(exe);
  return { src, pre, asm, obj, exe, states };
}

/* ═══════════════════════ 2. Control-flow interpreter ═══════════════════════ */

export type FlowId = "break" | "continue" | "primes" | "pattern" | "shortcirc" | "semicolon";
export const FLOW_NAME: Record<FlowId, string> = { break: "break at 16..18 (PYQ Q2.9)", continue: "continue at 16..18", primes: "Primes from 2 to N", pattern: "Number triangle", shortcirc: "Short-circuit && and || (PYQ Q2.8)", semicolon: "for-loop with stray ; (PYQ Q2.10)" };
/** Station on the 3D railway where the token stands for an event. */
export type Role = "start" | "init" | "test" | "body" | "branch" | "out" | "step" | "test2" | "step2" | "brk" | "cont" | "skip" | "end";

type E = { t: "n"; v: number } | { t: "v"; n: string } | { t: "b"; op: string; l: E; r: E } | { t: "pre"; n: string; d: number } | { t: "post"; n: string; d: number };
type S =
  | { k: "set"; n: string; e: E; line: number }
  | { k: "while"; c: E; b: S[]; line: number }
  | { k: "for"; i: S; c: E; s: S; b: S[]; line: number }
  | { k: "if"; c: E; t: S[]; line: number }
  | { k: "brk"; line: number } | { k: "cont"; line: number }
  | { k: "out"; fmt: "d" | "nl" | "sp"; e?: E; line: number }
  | { k: "expr"; e: E; line: number };
const N = (v: number): E => ({ t: "n", v }), V = (n: string): E => ({ t: "v", n }), B = (op: string, l: E, r: E): E => ({ t: "b", op, l, r });

export interface FlowEvent { role: Role; line: number; note: string; vars: Record<string, number>; out: string; gate: boolean | null; iter: number }
export interface FlowRun { source: string[]; events: FlowEvent[]; truncated: boolean; output: string }

function exprStr(e: E): string {
  switch (e.t) {
    case "n": return String(e.v);
    case "v": return e.n;
    case "pre": return (e.d > 0 ? "++" : "--") + e.n;
    case "post": return e.n + (e.d > 0 ? "++" : "--");
    case "b": return `${exprStr(e.l)} ${e.op} ${exprStr(e.r)}`;
  }
}

const LIMIT = 900;
class Stop extends Error {}

/** Runs the statement list with C semantics and records an event per statement, test and (when `deep`) per operand. */
function interpret(source: string[], prog: S[], init: Record<string, number>, deep = false): FlowRun {
  const vars: Record<string, number> = { ...init };
  const events: FlowEvent[] = [];
  let out = "", iter = 0, depth = 0;
  const rec = (role: Role, line: number, note: string, gate: boolean | null = null) => {
    if (events.length >= LIMIT) throw new Stop();
    events.push({ role, line, note, vars: { ...vars }, out, gate, iter });
  };
  const ev = (e: E, line: number, role: Role): number => {
    switch (e.t) {
      case "n": return e.v;
      case "v": return vars[e.n];
      case "pre": vars[e.n] += e.d; return vars[e.n];
      case "post": { const o = vars[e.n]; vars[e.n] += e.d; return o; }
      case "b": {
        if (e.op === "&&" || e.op === "||") {
          const l = ev(e.l, line, role), lt = l !== 0;
          if (deep) rec(role, line, `left of ${e.op}: ${exprStr(e.l)} = ${l} (${lt ? "true" : "false"})`, lt);
          const skip = e.op === "&&" ? !lt : lt;
          if (skip) { if (deep) rec("skip", line, `right side "${exprStr(e.r)}" is NOT evaluated (short-circuit)`, null); return lt ? 1 : 0; }
          const r = ev(e.r, line, "branch"), rt = r !== 0;
          if (deep) rec("branch", line, `right of ${e.op}: ${exprStr(e.r)} = ${r} (${rt ? "true" : "false"})`, rt);
          return rt ? 1 : 0;
        }
        const l = ev(e.l, line, role), r = ev(e.r, line, role);
        switch (e.op) {
          case "+": return l + r; case "-": return l - r; case "*": return l * r; case "%": return r === 0 ? 0 : l % r;
          case "<": return +(l < r); case "<=": return +(l <= r); case ">": return +(l > r); case ">=": return +(l >= r);
          case "==": return +(l === r); default: return +(l !== r);
        }
      }
    }
  };
  type Sig = "brk" | "cont" | null;
  const run = (list: S[]): Sig => {
    for (const s of list) {
      const sig = one(s);
      if (sig) return sig;
    }
    return null;
  };
  const one = (s: S): Sig => {
    switch (s.k) {
      case "set": { const v = ev(s.e, s.line, "init"); vars[s.n] = v; rec(depth > 0 ? "body" : "init", s.line, `${s.n} = ${exprStr(s.e)} gives ${v}`); return null; }
      case "expr": { const v = ev(s.e, s.line, "body"); rec("body", s.line, `${exprStr(s.e)} evaluates to ${v}`); return null; }
      case "out": { const txt = s.fmt === "nl" ? "\n" : s.fmt === "sp" ? " " : String(ev(s.e!, s.line, "body")); out += txt; rec("out", s.line, s.fmt === "nl" ? "print a newline" : s.fmt === "sp" ? "print a space" : `print ${txt}`); return null; }
      case "brk": rec("brk", s.line, "break: leave the loop at once"); return "brk";
      case "cont": rec("cont", s.line, "continue: skip to the next iteration"); return "cont";
      case "if": { const v = ev(s.c, s.line, "branch") !== 0; rec("branch", s.line, `if (${exprStr(s.c)}) is ${v ? "true" : "false"}`, v); return v ? run(s.t) : null; }
      case "while": case "for": {
        const inner = depth > 0;
        const tr: Role = inner ? "test2" : "test", sr: Role = inner ? "step2" : "step";
        if (s.k === "for") one(s.i);
        for (;;) {
          const v = ev(s.c, s.line, tr) !== 0;
          rec(tr, s.line, `test ${exprStr(s.c)} is ${v ? "true" : "false"}`, v);
          if (!v) break;
          iter++; depth++;
          const sig = run(s.b);
          depth--;
          if (sig === "brk") break;
          if (s.k === "for") { if (s.s.k === "set") vars[s.s.n] = ev(s.s.e, s.line, sr); rec(sr, s.line, "step part runs"); }
        }
        return null;
      }
    }
  };
  let truncated = false;
  rec("start", 1, "program starts");
  try { run(prog); rec("end", source.length, "program ends"); } catch (e) { if (e instanceof Stop) truncated = true; else throw e; }
  return { source, events, truncated, output: out };
}

const inc = (n: string): S => ({ k: "set", n, e: { t: "b", op: "+", l: V(n), r: N(1) }, line: 0 });
const incAt = (n: string, line: number): S => ({ ...inc(n), line });

/** Builds the event trace of one of the exam programs. n is the bound used by primes, pattern and the stray-semicolon loop; (vi,vj,vk) feed the short-circuit program. */
export function flowTrace(id: FlowId, n: number, vi = 4, vj = -1, vk = 0): FlowRun {
  switch (id) {
    case "break": case "continue": {
      const src = ["int a = 14;", "while (a < 20) {", "  ++a;", "  if (a >= 16 && a <= 18) {", `    ${id};`, "  }", '  printf("%d ", a);', "}"];
      const jmp: S = id === "break" ? { k: "brk", line: 5 } : { k: "cont", line: 5 };
      const prog: S[] = [
        { k: "set", n: "a", e: N(14), line: 1 },
        { k: "while", c: B("<", V("a"), N(20)), line: 2, b: [
          { k: "expr", e: { t: "pre", n: "a", d: 1 }, line: 3 },
          { k: "if", c: B("&&", B(">=", V("a"), N(16)), B("<=", V("a"), N(18))), line: 4, t: [jmp] },
          { k: "out", fmt: "d", e: V("a"), line: 7 }, { k: "out", fmt: "sp", line: 7 },
        ] },
      ];
      return interpret(src, prog, {});
    }
    case "primes": {
      const src = ["for (i = 2; i <= N; i++) {", "  p = 1;", "  for (j = 2; j * j <= i; j++)", "    if (i % j == 0) p = 0;", "  if (p == 1) printf(\"%d \", i);", "}"];
      const prog: S[] = [{ k: "for", i: { k: "set", n: "i", e: N(2), line: 1 }, c: B("<=", V("i"), N(n)), s: incAt("i", 1), line: 1, b: [
        { k: "set", n: "p", e: N(1), line: 2 },
        { k: "for", i: { k: "set", n: "j", e: N(2), line: 3 }, c: B("<=", B("*", V("j"), V("j")), V("i")), s: incAt("j", 3), line: 3, b: [
          { k: "if", c: B("==", B("%", V("i"), V("j")), N(0)), line: 4, t: [{ k: "set", n: "p", e: N(0), line: 4 }] },
        ] },
        { k: "if", c: B("==", V("p"), N(1)), line: 5, t: [{ k: "out", fmt: "d", e: V("i"), line: 5 }, { k: "out", fmt: "sp", line: 5 }] },
      ] }];
      return interpret(src, prog, { i: 0, j: 0, p: 0 });
    }
    case "pattern": {
      const src = ["for (i = 1; i <= N; i++) {", "  for (j = 1; j <= i; j++)", '    printf("%d ", j);', '  printf("\\n");', "}"];
      const prog: S[] = [{ k: "for", i: { k: "set", n: "i", e: N(1), line: 1 }, c: B("<=", V("i"), N(n)), s: incAt("i", 1), line: 1, b: [
        { k: "for", i: { k: "set", n: "j", e: N(1), line: 2 }, c: B("<=", V("j"), V("i")), s: incAt("j", 2), line: 2, b: [{ k: "out", fmt: "d", e: V("j"), line: 3 }, { k: "out", fmt: "sp", line: 3 }] },
        { k: "out", fmt: "nl", line: 4 },
      ] }];
      return interpret(src, prog, { i: 0, j: 0 });
    }
    case "shortcirc": {
      const src = [`int i = ${vi}, j = ${vj}, k = ${vk}, y, z;`, "y = i + 5 && j + 1 || k + 2;", "z = i + 5 || j + 1 && k + 2;", 'printf("y=%d z=%d", y, z);'];
      const sum = (a: string, c: number): E => B("+", V(a), N(c));
      const prog: S[] = [
        { k: "set", n: "i", e: N(vi), line: 1 }, { k: "set", n: "j", e: N(vj), line: 1 }, { k: "set", n: "k", e: N(vk), line: 1 },
        { k: "set", n: "y", e: B("||", B("&&", sum("i", 5), sum("j", 1)), sum("k", 2)), line: 2 },
        { k: "set", n: "z", e: B("||", sum("i", 5), B("&&", sum("j", 1), sum("k", 2))), line: 3 },
      ];
      const run = interpret(src, prog, { y: 0, z: 0 }, true);
      const last = run.events[run.events.length - 1];
      const txt = `y=${last.vars.y} z=${last.vars.z}`;
      if (!run.truncated) { run.events.splice(run.events.length - 1, 0, { role: "out", line: 4, note: `print ${txt}`, vars: { ...last.vars }, out: txt, gate: null, iter: 0 }); run.events[run.events.length - 1].out = txt; }
      run.output = txt;
      return run;
    }
    case "semicolon": {
      const src = ["int k;", `for (k = 1; k <= ${n}; k++);   /* stray ; = empty body */`, "{", '  printf("%d ", k);', "}"];
      const prog: S[] = [
        { k: "for", i: { k: "set", n: "k", e: N(1), line: 2 }, c: B("<=", V("k"), N(n)), s: incAt("k", 2), line: 2, b: [] },
        { k: "out", fmt: "d", e: V("k"), line: 4 }, { k: "out", fmt: "sp", line: 4 },
      ];
      return interpret(src, prog, { k: 0 });
    }
  }
}

/* ═══════════════════════ 3. Sorting traces and the call stack ═══════════════════════ */

export type SortAlg = "bubble" | "insertion" | "selection" | "quick";
export const SORT_ARRAYS = {
  a1: [3, 5, 2, 6, 4, 1, 8],
  a2: [5, 1, 4, 2, 8, 7],
  a3: [56, 21, 2, 31, 23, -8, 7],
  a4: [54, 26, 93, 17, 77, 31, 44, 55, 20],
} as const;
export type SortArr = keyof typeof SORT_ARRAYS;

export interface SortState { arr: number[]; i: number; j: number; kind: "start" | "cmp" | "swap" | "shift" | "done"; cmps: number; swaps: number; pass: number; fixed: boolean[]; pivot: number; note: string }

/** Every comparison and swap (or shift) of the algorithm as a list of states; states[0] is the untouched array. `early` lets bubble sort stop after a pass with no swap. */
export function sortStates(alg: SortAlg, input: readonly number[], early = true): SortState[] {
  const a = input.slice(), n = a.length, fixed = new Array<boolean>(n).fill(false), out: SortState[] = [];
  let cmps = 0, swaps = 0, pass = 0, pivot = -1;
  const push = (kind: SortState["kind"], i: number, j: number, note: string) => out.push({ arr: a.slice(), i, j, kind, cmps, swaps, pass, fixed: fixed.slice(), pivot, note });
  push("start", -1, -1, "Unsorted array");
  const swap = (x: number, y: number) => { const t = a[x]; a[x] = a[y]; a[y] = t; swaps++; };
  if (alg === "bubble") {
    for (let p = 0; p < n - 1; p++) {
      pass = p + 1;
      let sw = false;
      for (let j = 0; j < n - 1 - p; j++) {
        cmps++; push("cmp", j, j + 1, `compare a[${j}]=${a[j]} and a[${j + 1}]=${a[j + 1]}`);
        if (a[j] > a[j + 1]) { swap(j, j + 1); sw = true; push("swap", j, j + 1, `swap: ${a[j + 1]} > ${a[j]}`); }
      }
      fixed[n - 1 - p] = true;
      if (early && !sw) { for (let q = 0; q < n; q++) fixed[q] = true; break; }
    }
  } else if (alg === "insertion") {
    fixed[0] = true;
    for (let i = 1; i < n; i++) {
      pass = i;
      const key = a[i];
      let j = i - 1;
      while (j >= 0) {
        cmps++; push("cmp", j, j + 1, `compare a[${j}]=${a[j]} with key ${key}`);
        if (a[j] > key) { a[j + 1] = a[j]; swaps++; push("shift", j, j + 1, `shift ${a[j]} one place right`); j--; } else break;
      }
      a[j + 1] = key; fixed[i] = true;
      push("shift", j + 1, j + 1, `insert key ${key} at position ${j + 1}`);
    }
  } else if (alg === "selection") {
    for (let i = 0; i < n - 1; i++) {
      pass = i + 1;
      let m = i;
      for (let j = i + 1; j < n; j++) {
        cmps++; push("cmp", m, j, `compare a[${j}]=${a[j]} with the minimum so far ${a[m]}`);
        if (a[j] < a[m]) m = j;
      }
      if (m !== i) { swap(i, m); push("swap", i, m, `swap the minimum into position ${i}`); }
      fixed[i] = true;
    }
  } else {
    const qs = (lo: number, hi: number) => {
      if (lo >= hi) { if (lo === hi) fixed[lo] = true; return; }
      pass++;
      const pv = a[lo]; pivot = lo;
      let i = lo + 1, j = hi;
      while (i <= j) {
        while (i <= hi) { cmps++; push("cmp", i, lo, `a[${i}]=${a[i]} <= pivot ${pv}?`); if (a[i] <= pv) i++; else break; }
        while (j > lo) { cmps++; push("cmp", j, lo, `a[${j}]=${a[j]} > pivot ${pv}?`); if (a[j] > pv) j--; else break; }
        if (i < j) { swap(i, j); push("swap", i, j, `swap a[${i}] and a[${j}]`); }
      }
      if (j !== lo) { swap(lo, j); push("swap", lo, j, `put pivot ${pv} in its final place ${j}`); }
      fixed[j] = true; pivot = -1;
      qs(lo, j - 1); qs(j + 1, hi);
    };
    qs(0, n - 1);
  }
  for (let q = 0; q < n; q++) fixed[q] = true;
  pivot = -1;
  push("done", -1, -1, "Sorted");
  return out;
}

export interface Frame { n: number; ret: number | null }
export interface CallState { stack: Frame[]; kind: "start" | "call" | "ret"; calls: number; maxDepth: number; last: number | null; note: string }
/** Call-stack trace of factorial(n) or fibonacci(n): each push (call) and pop (return) is one state. */
export function callStates(kind: "fact" | "fib", n: number): CallState[] {
  const out: CallState[] = [], stack: Frame[] = [];
  let calls = 0, maxDepth = 0, last: number | null = null;
  const nm = kind === "fact" ? "fact" : "fib";
  const push = (k: CallState["kind"], note: string) => out.push({ stack: stack.map((f) => ({ ...f })), kind: k, calls, maxDepth, last, note });
  push("start", "main() is about to call " + nm + "(" + n + ")");
  const f = (m: number): number => {
    calls++; stack.push({ n: m, ret: null }); maxDepth = Math.max(maxDepth, stack.length);
    push("call", `call ${nm}(${m}): push a frame`);
    let r: number;
    if (kind === "fact") r = m <= 1 ? 1 : m * f(m - 1);
    else r = m <= 1 ? m : f(m - 1) + f(m - 2);
    stack[stack.length - 1].ret = r; last = r;
    push("ret", `${nm}(${m}) returns ${r}: pop its frame`);
    stack.pop();
    return r;
  };
  f(n);
  return out;
}
export const factorial = (n: number): number => (n <= 1 ? 1 : n * factorial(n - 1));
export const fibonacci = (n: number): number => (n <= 1 ? n : fibonacci(n - 1) + fibonacci(n - 2));

/* ═══════════════════════ 4. Pointers and the heap ═══════════════════════ */

export const PTR_SIZE = { char: 1, int: 4, double: 8 } as const;
export type PtrKind = keyof typeof PTR_SIZE;
export const PTR_BASE = 0x7ffc1000;
/** ptr1 = arr; ptr2 = arr + d. Differences are scaled by sizeof(element); casting to char * gives the byte distance. */
export function ptrArith(kind: PtrKind, d: number) {
  const size = PTR_SIZE[kind], p1 = PTR_BASE, p2 = PTR_BASE + d * size;
  return { size, p1, p2, diffElems: (p2 - p1) / size, diffBytes: p2 - p1, value: (d + 1) * 10 };
}

export const HEAP_BYTES = 128;
export const GRAIN = 8;
export const HEAP_BASE = 0x5000;
export interface Block { start: number; size: number; free: boolean; id: number; zeroed: boolean }
export interface HeapOp { k: "malloc" | "calloc" | "realloc" | "free" | "assign" | "null"; p: string; q?: string; size?: number; cnt?: number; code: string }
export type HeapScript = "basic" | "leak" | "realloc";
export const HEAP_SCRIPTS: Record<HeapScript, HeapOp[]> = {
  basic: [
    { k: "malloc", p: "p", size: 16, code: "p = malloc(16);" },
    { k: "calloc", p: "q", cnt: 4, size: 4, code: "q = calloc(4, sizeof(int));" },
    { k: "realloc", p: "p", size: 40, code: "p = realloc(p, 40);" },
    { k: "free", p: "p", code: "free(p);" },
    { k: "free", p: "q", code: "free(q);" },
  ],
  leak: [
    { k: "malloc", p: "p", size: 32, code: "p = malloc(32);" },
    { k: "malloc", p: "q", size: 24, code: "q = malloc(24);" },
    { k: "assign", p: "p", q: "q", code: "p = q;   /* old p lost */" },
    { k: "free", p: "q", code: "free(q);" },
  ],
  realloc: [
    { k: "malloc", p: "a", size: 24, code: "a = malloc(24);" },
    { k: "malloc", p: "b", size: 16, code: "b = malloc(16);" },
    { k: "realloc", p: "a", size: 48, code: "a = realloc(a, 48);" },
    { k: "free", p: "b", code: "free(b);" },
    { k: "malloc", p: "c", size: 32, code: "c = malloc(32);" },
  ],
};

export interface HeapState {
  blocks: Block[]; ptrs: Record<string, number | null>; /** pointer name -> block id it points at (also if freed = dangling) */
  used: number; free: number; leaked: number; leakedIds: number[]; dangling: string[]; note: string; addr: Record<string, number | null>;
}
const grain = (n: number) => Math.max(GRAIN, Math.ceil(n / GRAIN) * GRAIN);

/** First-fit allocation inside blocks (splits the free block). Returns the new block id or null. */
function alloc(blocks: Block[], size: number, nextId: () => number, zeroed: boolean): number | null {
  const need = grain(size);
  const i = blocks.findIndex((b) => b.free && b.size >= need);
  if (i < 0) return null;
  const b = blocks[i], id = nextId();
  const used: Block = { start: b.start, size: need, free: false, id, zeroed };
  if (b.size > need) blocks.splice(i, 1, used, { start: b.start + need, size: b.size - need, free: true, id: 0, zeroed: false });
  else blocks[i] = used;
  return id;
}
function coalesce(blocks: Block[]) {
  for (let i = 0; i < blocks.length - 1;) {
    if (blocks[i].free && blocks[i + 1].free) { blocks[i].size += blocks[i + 1].size; blocks.splice(i + 1, 1); } else i++;
  }
}
const freeBlock = (blocks: Block[], id: number) => { const b = blocks.find((x) => x.id === id); if (b) { b.free = true; b.id = 0; b.zeroed = false; } coalesce(blocks); };

/** states[k] is the heap after the first k statements of the script. */
export function heapStates(script: HeapScript): HeapState[] {
  const ops = HEAP_SCRIPTS[script];
  const blocks: Block[] = [{ start: 0, size: HEAP_BYTES, free: true, id: 0, zeroed: false }];
  const ptrs: Record<string, number | null> = {};
  const freed = new Set<number>();
  let idc = 0;
  const nextId = () => ++idc;
  const snap = (note: string): HeapState => {
    const live = new Set(Object.values(ptrs).filter((x): x is number => x !== null && !freed.has(x)));
    const al = blocks.filter((b) => !b.free), leakedBlocks = al.filter((b) => !live.has(b.id));
    const addr: Record<string, number | null> = {};
    for (const [k, id] of Object.entries(ptrs)) { const b = id === null ? undefined : blocks.find((x) => x.id === id); addr[k] = b ? HEAP_BASE + b.start : id === null ? null : -1; }
    return {
      blocks: blocks.map((b) => ({ ...b })), ptrs: { ...ptrs }, used: al.reduce((s, b) => s + b.size, 0), free: blocks.filter((b) => b.free).reduce((s, b) => s + b.size, 0),
      leaked: leakedBlocks.reduce((s, b) => s + b.size, 0), leakedIds: leakedBlocks.map((b) => b.id),
      dangling: Object.entries(ptrs).filter(([, id]) => id !== null && freed.has(id)).map(([k]) => k), note, addr,
    };
  };
  const out: HeapState[] = [snap("Empty heap: one 128-byte free block")];
  for (const op of ops) {
    let note = op.code;
    if (op.k === "malloc" || op.k === "calloc") {
      const bytes = op.k === "calloc" ? (op.cnt ?? 1) * (op.size ?? 0) : op.size ?? 0;
      const id = alloc(blocks, bytes, nextId, op.k === "calloc");
      ptrs[op.p] = id; note = id === null ? `${op.code} returned NULL: no free block is big enough` : `${op.code} first-fit gives a ${grain(bytes)}-byte block${op.k === "calloc" ? ", zeroed" : ""}`;
    } else if (op.k === "realloc") {
      const old = ptrs[op.p];
      const bi = blocks.findIndex((b) => b.id === old && !b.free);
      if (bi < 0) { const id = alloc(blocks, op.size ?? 0, nextId, false); ptrs[op.p] = id; note = `${op.code} (NULL pointer acts like malloc)`; }
      else {
        const b = blocks[bi], need = grain(op.size ?? 0), nxt = blocks[bi + 1];
        if (need <= b.size) {
          if (need < b.size) { blocks.splice(bi + 1, 0, { start: b.start + need, size: b.size - need, free: true, id: 0, zeroed: false }); b.size = need; coalesce(blocks); }
          note = `${op.code} shrinks in place`;
        } else if (nxt && nxt.free && b.size + nxt.size >= need) {
          const extra = need - b.size; b.size = need; nxt.start += extra; nxt.size -= extra; if (nxt.size === 0) blocks.splice(bi + 1, 1);
          note = `${op.code} grows in place into the free block next to it`;
        } else {
          const id = alloc(blocks, op.size ?? 0, nextId, false);
          if (id === null) note = `${op.code} returned NULL; the old block is untouched (and p still points to it)`;
          else { freeBlock(blocks, old as number); ptrs[op.p] = id; note = `${op.code} cannot grow in place: new block found first-fit, data copied, old block freed`; }
        }
      }
    } else if (op.k === "free") {
      const id = ptrs[op.p];
      if (id !== null && id !== undefined && !freed.has(id)) { freeBlock(blocks, id); freed.add(id); note = `${op.code} returns the block to the free list${"; " + op.p + " is now a dangling pointer"}`; }
    } else if (op.k === "assign") {
      ptrs[op.p] = ptrs[op.q as string] ?? null; note = `${op.code} the block p pointed to is now unreachable`;
    } else { ptrs[op.p] = null; note = `${op.code}`; }
    out.push(snap(note));
  }
  return out;
}

/* ═══════════════════════ 5. struct, union and FILE ═══════════════════════ */

export type MemberType = Extract<CType, "char" | "short" | "int" | "float" | "double">;
export const MEMBER_TYPES = ["char", "short", "int", "float", "double"] as const satisfies readonly MemberType[];
export function structInfo(types: readonly MemberType[]) {
  const L = structLayout(types);
  return { ...L, data: L.size - L.padding, unionSize: unionSize(types) };
}

/** Little-endian bytes (8 long, zero filled) after writing `value` through a member of type t of an all-zero union. */
export function unionWrite(t: MemberType, value: number): number[] {
  const buf = new DataView(new ArrayBuffer(8));
  if (t === "char") buf.setUint8(0, value & 0xff);
  else if (t === "short") buf.setUint16(0, value & 0xffff, true);
  else if (t === "int") buf.setInt32(0, Math.trunc(value) | 0, true);
  else if (t === "float") buf.setFloat32(0, value, true);
  else buf.setFloat64(0, value, true);
  return Array.from({ length: 8 }, (_, i) => buf.getUint8(i));
}
/** Reinterprets the same bytes through another member. */
export function unionRead(t: MemberType, bytes: readonly number[]): number {
  const buf = new DataView(new ArrayBuffer(8));
  bytes.forEach((b, i) => buf.setUint8(i, b));
  if (t === "char") return buf.getInt8(0);
  if (t === "short") return buf.getInt16(0, true);
  if (t === "int") return buf.getInt32(0, true);
  if (t === "float") return buf.getFloat32(0, true);
  return buf.getFloat64(0, true);
}

export type FMode = "r" | "w" | "a" | "r+" | "w+" | "a+";
export const FMODES = ["r", "w", "a", "r+", "w+", "a+"] as const;
export const FILE_INITIAL = "HELLO";
export interface FileRun {
  ok: boolean; err: string; created: boolean; truncated: boolean; canRead: boolean; canWrite: boolean;
  startContent: string; posOpen: number; readData: string; readErr: string; posRead: number; eof: boolean; wrote: string; writeErr: string; posEnd: number; content: string;
}
/** fopen(mode) on a file that exists or not, then fread(rd) and fwrite(wr bytes "ABC..."); assumes an fseek/fflush between read and write as C requires for + modes. */
export function fileSim(mode: FMode, exists: boolean, rd: number, wr: number): FileRun {
  const canRead = mode === "r" || mode.endsWith("+"), canWrite = mode !== "r";
  const base: FileRun = { ok: true, err: "", created: false, truncated: false, canRead, canWrite, startContent: exists ? FILE_INITIAL : "", posOpen: 0, readData: "", readErr: "", posRead: 0, eof: false, wrote: "", writeErr: "", posEnd: 0, content: exists ? FILE_INITIAL : "" };
  if (!exists && (mode === "r" || mode === "r+")) return { ...base, ok: false, err: "fopen returns NULL: the file does not exist", content: "" };
  let content = exists ? FILE_INITIAL : "";
  if (mode[0] === "w") { base.truncated = exists; content = ""; }
  base.created = !exists && mode[0] !== "r";
  let pos = 0;
  base.posOpen = pos;
  if (canRead) { const d = content.slice(pos, pos + rd); base.readData = d; pos += d.length; base.eof = d.length < rd; } else if (rd > 0) base.readErr = "fread fails: mode " + mode + " is write-only";
  base.posRead = pos;
  if (canWrite) {
    if (mode[0] === "a") pos = content.length;
    const d = "ABCDEFGH".slice(0, wr);
    content = content.slice(0, pos) + d + content.slice(pos + d.length);
    pos += d.length; base.wrote = d;
  } else if (wr > 0) base.writeErr = "fwrite fails: mode r is read-only";
  base.posEnd = pos; base.content = content;
  return base;
}
