import { num, opt, type ParamSpec } from "../params-core";

const EQ = ["q13a", "q13b", "q13c", "q13d", "q11", "ydxxdy"] as const;
const MU = ["one", "x", "y", "xy", "x2", "y2", "y4", "x2y2"] as const;
/** Adjustable values of the Maths II (AHT-005) labs, units 1 to 5. */
export const MATHII_SPECS = {
  exactode: { x0: num(1.2, 0.4, 2.6), y0: num(1, 0.4, 2.6), eq: opt("q13b", EQ), mu: opt("one", MU) },
  orthotraj: { n: num(2, -3, 3), c: num(1, 0.2, 3), xi: num(1.2, 0.3, 2.8) },
  cooling: { t: num(10, 0, 60), T0: num(100, 20, 150), Ts: num(30, -10, 40), k: num(0.034, 0.005, 0.4), Tt: num(60, 0, 120) },
  clairaut: { c: num(1, -3, 3), kind: opt("parab", ["parab", "inv", "ellipse"] as const), a: num(1, 0.3, 3), b: num(2, 0.5, 4) },
  varparam: { s: num(0.6, 0, 1), eq: opt("secx", ["secx", "tanx", "q21a", "q21b", "q21e", "q21f"] as const), c1: num(0, -2, 2), c2: num(0, -2, 2) },
  cauchyeuler: { a: num(1, -4, 6), b: num(-1, -4, 8), x: num(1.5, 0.2, 4), c1: num(1, -2, 2), c2: num(0.5, -2, 2) },
  coupledode: { a: num(0, -3, 3), b: num(1, -3, 3), c: num(-1, -3, 3), d: num(0, -3, 3), x0: num(1, -3, 3), y0: num(0, -3, 3), T: num(4, 1, 10) },
  halfrange: { u: num(0.4, 0, 1), fn: opt("x", ["x", "xsq", "one", "tri", "sinpl", "abscos"] as const), kind: opt("sine", ["sine", "cosine"] as const), N: num(6, 1, 40), L: num(3.1416, 1, 6.3) },
  parseval: { N: num(5, 1, 60), fn: opt("x", ["x", "xsq", "abs", "sq"] as const) },
  uniformconv: { n: num(5, 1, 60), fn: opt("xn", ["xn", "hump", "sinn", "sinsum"] as const), a: num(0.9, 0.3, 1), eps: num(0.1, 0.02, 0.6) },
  lagrangepde: { l: num(1, -2, 2), m: num(1, -2, 2), n: num(1, -2, 2), mode: opt("rot", ["rot", "cone"] as const), s0: num(0.5, -1.5, 1.5), k: num(0.3, -1, 1), h: num(0.4, -1, 1), th: num(60, 0, 360) },
  heat2d: { U: num(100, 10, 200), mode: opt("steady", ["steady", "decay", "cool"] as const), b: num(1, 0.5, 2.5), m: num(1, 1, 4), n: num(1, 1, 4), a2: num(0.2, 0.05, 1), t: num(0.1, 0, 1), px: num(0.5, 0.02, 0.98), py: num(0.5, 0.02, 0.98) },
  dalembert: { t: num(1, 0, 6), mode: opt("pulses", ["pulses", "string", "hammer"] as const), c: num(1, 0.5, 3), w: num(0.5, 0.2, 1.2), amp: num(1, 0.5, 2), xp: num(3, 0, 6) },
  homopde: { A: num(1, 0.5, 3), B: num(-3, -8, 8), C: num(2, -9, 9), px: num(0.4, -2, 2), py: num(-0.7, -3, 3) },
  harmonic: { px: num(0.8, -2, 2), py: num(0.6, -2, 2), fn: opt("cube", ["cube", "logr", "ecos", "expy", "lin", "notharm"] as const) },
  cauchyint: { ax: num(0.5, -3, 3), ay: num(0.3, -3, 3), R: num(2, 0.5, 3.5), n: num(0, 0, 3), fn: opt("ez", ["ez", "sinz", "cosz", "z2"] as const) },
  residues: { n2: num(1, -5, 5), n1: num(0, -5, 5), n0: num(0, -5, 5), p1: num(1, -4, 4), p2: num(2, -4, 4), p3: num(3, -4, 4), R: num(3.5, 0.5, 5), mode: opt("simple", ["simple", "double"] as const) },
  realintegral: { a: num(2, 1, 10), b: num(1, -8, 8), mode: opt("inv", ["inv", "sq", "cos2", "sin2"] as const) },
  singular: { m: num(3, 0, 6), fn: opt("ez", ["ez", "sinz", "cosz", "essen"] as const), rho: num(0.6, 0.1, 1.5) },
} satisfies Record<string, ParamSpec>;
