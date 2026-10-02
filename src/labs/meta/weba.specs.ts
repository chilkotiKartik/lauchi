import { flag, num, opt, type ParamSpec } from "../params-core";

/** Adjustable values of the Web Development 101 and 201 labs. */
export const WEBA_SPECS = {
  httpjourney: { rtt: num(50, 5, 500), dns: num(30, 0, 200), https: flag(true), server: num(100, 0, 1000), size: num(500, 10, 5000), mbps: num(20, 1, 200) },
  domtree: { depth: num(3, 1, 4), branch: num(3, 1, 4) },
  specificity: { id1: num(0, 0, 9), cls1: num(2, 0, 9), tag1: num(1, 0, 9), id2: num(1, 0, 9), cls2: num(0, 0, 9), tag2: num(0, 0, 9), imp: flag(false) },
  jsdouble: { a: num(0.1, -100, 100), b: num(0.2, -100, 100), op: opt("add", ["add", "sub", "mul"] as const), n: num(53, 40, 60) },
  pipeline: { n: num(12, 3, 24), t: num(50, 0, 100), m: num(2, 1, 5) },
  callstack: { n: num(5, 1, 12), kind: opt("fib", ["fact", "fib", "sum"] as const), step: num(0, 0, 1000) },
  formsize: { fields: num(4, 1, 20), keyLen: num(6, 1, 30), valLen: num(20, 1, 200), special: num(10, 0, 100), fileKB: num(0, 0, 500) },
  eventloop: { ticks: num(1, 0, 4), promises: num(2, 0, 4), d1: num(50, 0, 200), d2: num(0, 0, 200), d3: num(10, 0, 200) },
  semver: { M: num(1, 0, 3), m: num(2, 0, 4), p: num(0, 0, 4), kind: opt("caret", ["caret", "tilde", "exact", "gte"] as const) },
  closure: { t: num(7, 0, 30), n: num(3, 1, 6), mode: opt("closure", ["closure", "global"] as const) },
  coverage: { tests: num(5, 0, 40), branches: num(20, 4, 40), per: num(2, 1, 6), bugs: num(3, 0, 6) },
  dbindex: { exp: num(6, 2, 8), fanout: num(100, 50, 500), index: flag(true) },
  apiqueue: { lambda: num(40, 1, 200), mu: num(25, 5, 100), c: num(2, 1, 8) },
  flexbox: { W: num(600, 100, 800), n: num(3, 1, 8), basis: num(100, 0, 300), grow: num(1, 0, 3), shrink: num(1, 0, 3), gap: num(10, 0, 40), wrap: flag(false) },
  ssrcsr: { rtt: num(50, 10, 500), bw: num(20, 1, 200), html: num(40, 5, 300), js: num(300, 20, 2000), server: num(100, 0, 1000), api: num(80, 0, 1000), cpu: num(2, 1, 6) },
  csrf: { bytes: num(16, 1, 32), rate: num(1000, 1, 1000000), life: num(60, 1, 1440) },
  passwordcrack: { len: num(8, 1, 20), cs: opt("lower", ["digits", "lower", "alnum", "full"] as const), scheme: opt("md5", ["md5", "sha256", "bcrypt"] as const), cost: num(10, 4, 14), salt: flag(false) },
} satisfies Record<string, ParamSpec>;
