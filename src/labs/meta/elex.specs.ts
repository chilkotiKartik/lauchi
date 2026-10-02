import { flag, num, opt, type ParamSpec } from "../params-core";

/** Adjustable values of the Basic Electronics (ECT-001) labs. */
export const ELEX_SPECS = {
  diodeiv: { Vs: num(3, -25, 25), R: num(1000, 10, 10000), mat: opt("si", ["si", "ge"] as const), T: num(300, 250, 400), n: num(1, 1, 2), Vz: num(5.1, 2, 20) },
  bjt: { VCC: num(12, 1, 30), RB: num(240, 10, 2000), RC: num(2, 0.1, 10), beta: num(100, 20, 400), early: flag(false) },
  mosfet: { VGS: num(3, 0, 8), VDS: num(4, 0, 10), Vt: num(1.5, 0.3, 4), k: num(2, 0.1, 10), lambda: num(0.02, 0, 0.1) },
  opamp: { A: num(1, 0.1, 5), mode: opt("inv", ["inv", "noninv", "follower", "summing", "integrator"] as const), Rin: num(10, 1, 100), Rf: num(47, 1, 1000), C: num(0.1, 0.01, 10), f: num(1000, 10, 100000), V2: num(0.5, -3, 3), Vsat: num(12, 5, 15) },
  logic: { n: num(173, 0, 255), gate: opt("and", ["and", "or", "not", "nand", "nor", "xor", "xnor"] as const), a: flag(true), b: flag(false) },
} satisfies Record<string, ParamSpec>;
