import { num, opt, type ParamSpec } from "../params-core";

/** Adjustable values of the AHT-005 Analytical Mathematics labs (unit 1 to 5). */
export const MATHSB_SPECS = {
  slopefield: { id: opt("linear", ["linear", "logistic", "circle", "xminusy", "ycosx"] as const), x0: num(0, -3, 3), y0: num(1, -2.5, 2.5), x1: num(1, -3, 3) },
  oscillator: { m: num(1, 0.2, 5), c: num(0.4, 0, 8), k: num(4, 0.5, 25), F0: num(1, 0, 3), w: num(1.5, 0.1, 6) },
  series: { id: opt("geometric", ["geometric", "pseries", "altharm", "nfact", "invfact"] as const), N: num(20, 2, 60), r: num(0.6, -1.5, 1.5), p: num(2, 0.5, 4) },
  string: { mode: opt("wave", ["wave", "heat"] as const), p: num(0.3, 0.05, 0.95), h: num(0.5, 0.1, 1), N: num(15, 1, 50), c: num(2, 0.5, 4), L: num(1, 0.5, 2), alpha: num(0.05, 0.01, 0.2) },
  complexmap: { id: opt("sq", ["sq", "inv", "exp", "sin", "mobius"] as const), px: num(0.5, -2, 2), py: num(0.5, -2, 2) },
} satisfies Record<string, ParamSpec>;
