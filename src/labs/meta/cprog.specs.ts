import { flag, num, opt, type ParamSpec } from "../params-core";

const TYPES = ["char", "short", "int", "float", "long", "double", "ptr"] as const;
/** Adjustable values of the Programming for Problem Solving (CST-001) labs. */
export const CPROG_SPECS = {
  sorting: { n: num(12, 4, 40), algo: opt("bubble", ["bubble", "insertion", "selection"] as const), order: opt("random", ["random", "nearly", "reversed"] as const), seed: num(1, 0, 99), step: num(0, 0, 1600), auto: flag(false) },
  search: { n: num(32, 8, 64), method: opt("binary", ["linear", "binary"] as const), x: num(50, 1, 260), step: num(0, 0, 70), auto: flag(false) },
  pointers: { n: num(6, 2, 12), type: opt("int", ["char", "short", "int", "double"] as const), k: num(1, 0, 11), i: num(2, -3, 6), base: opt("x1000", ["x1000", "x2000", "stack"] as const) },
  bits: { a: num(12, 0, 255), b: num(10, 0, 255), s: num(2, 0, 7), op: opt("and", ["and", "or", "xor", "not", "shl", "shr"] as const) },
  structlayout: { n: num(4, 1, 6), m1: opt("char", TYPES), m2: opt("int", TYPES), m3: opt("char", TYPES), m4: opt("double", TYPES), m5: opt("short", TYPES), m6: opt("char", TYPES) },
} satisfies Record<string, ParamSpec>;
