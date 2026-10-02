import { num, opt, type ParamSpec } from "../params-core";

/** Adjustable values of the mathsa labs: default, then allowed range. Presets, saved setups and share links are clamped to these. */
export const MATHSA_SPECS = {
  revolution: { fn: opt("x2", ["x2", "sqrt", "sin", "line"] as const), a: num(0, 0, 4), b: num(2, 0, 4), sweep: num(360, 0, 360) },
  vectorfield: {
    field: opt("rotation", ["rotation", "source", "shear", "saddle", "mixed", "cycle"] as const),
    r: num(1, 0.2, 2), px: num(0, -2, 2), py: num(0, -2, 2), fence: opt("tan", ["tan", "norm"] as const),
  },
  mvt: { fn: opt("cubic", ["cubic", "sin", "exp", "x2"] as const), a: num(-1.5, -4, 4), b: num(2, -4, 4) },
  calculus: {
    fn: opt("x2", ["x2", "x3", "sin", "exp", "inv"] as const), x0: num(1, -3, 3), h: num(0.5, 0.01, 1.5),
    a: num(0, -3, 3), b: num(2, -3, 3.2), n: num(6, 1, 50), rule: opt("mid", ["left", "mid", "right"] as const),
  },
  lines: { x1: num(-3, -5, 5), y1: num(-1, -5, 5), x2: num(3, -5, 5), y2: num(2, -5, 5), m: num(1, -5, 5), c: num(1, -5, 5) },
} satisfies Record<string, ParamSpec>;
