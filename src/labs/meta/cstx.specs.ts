import { flag, num, opt, type ParamSpec } from "../params-core";

const MT = ["char", "short", "int", "float", "double"] as const;
/** Adjustable values of the five flagship Programming for Problem Solving (CST-001) labs. */
export const CSTX_SPECS = {
  cpipeline: { prog: opt("sum", ["hello", "sum", "loop"] as const), stage: opt("run", ["preprocess", "compile", "assemble", "link", "run"] as const), step: num(0, 0, 160), a: num(7, 0, 100), b: num(5, 0, 100), n: num(5, 1, 10) },
  ctrlflow: { prog: opt("break", ["break", "continue", "primes", "pattern", "shortcirc", "semicolon"] as const), step: num(0, 0, 900), n: num(5, 1, 30), vi: num(4, -5, 9), vj: num(-1, -5, 9), vk: num(0, -5, 9) },
  sortstack: { mode: opt("sort", ["sort", "fact", "fib"] as const), alg: opt("bubble", ["bubble", "insertion", "selection", "quick"] as const), arr: opt("a2", ["a1", "a2", "a3", "a4"] as const), early: flag(true), n: num(4, 1, 10), step: num(0, 0, 300) },
  ptrheap: { mode: opt("ptr", ["ptr", "heap"] as const), pty: opt("int", ["char", "int", "double"] as const), d: num(2, 0, 9), script: opt("leak", ["basic", "leak", "realloc"] as const), step: num(0, 0, 6) },
  structunion: { view: opt("struct", ["struct", "union", "file"] as const), n: num(3, 1, 5), m1: opt("char", MT), m2: opt("int", MT), m3: opt("char", MT), m4: opt("short", MT), m5: opt("double", MT), wt: opt("int", MT), rt: opt("char", MT), val: num(1094861636, 0, 2147483647), fmode: opt("r", ["r", "w", "a", "r+", "w+", "a+"] as const), ex: flag(true), rd: num(3, 0, 8), wr: num(2, 0, 8) },
} satisfies Record<string, ParamSpec>;
