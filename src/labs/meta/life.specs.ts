import { num, opt, type ParamSpec } from "../params-core";

/** Adjustable values of the environment, biology and web-design labs. */
export const LIFE_SPECS = {
  ecosystem: { E0: num(10000, 1000, 100000), eff: num(10, 1, 30), levels: num(4, 2, 5), kind: opt("energy", ["energy", "grass", "tree"] as const) },
  population: { t: num(60, 0, 300), r: num(5, 0.1, 10), N0: num(100, 1, 2000), K: num(10000, 500, 100000) },
  greenhouse: { C: num(420, 200, 1200), lambda: num(0.8, 0.3, 1.5), dAlb: num(0, -0.05, 0.05) },
  dna: { pos: num(4, 1, 30), kind: opt("ts", ["none", "ts", "tv"] as const), sample: opt("s1", ["s1", "s2", "s3", "s4", "s5"] as const) },
  microbe: { t: num(8, 0, 60), mu: num(0.7, 0.1, 2), lag: num(2, 0, 10), log0: num(3, 1, 6), logK: num(9, 6, 11), kd: num(0.2, 0, 1), stat: num(6, 0, 24) },
  boxmodel: { w: num(200, 40, 400), h: num(120, 40, 300), pad: num(20, 0, 60), bor: num(6, 0, 30), mar: num(20, 0, 60), sizing: opt("content", ["content", "border"] as const) },
} satisfies Record<string, ParamSpec>;
