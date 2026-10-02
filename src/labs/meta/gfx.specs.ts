import { num, opt, type ParamSpec } from "../params-core";

/** Adjustable values of the Engineering Graphics labs. */
export const GFX_SPECS = {
  scalerf: { len: num(2400, 1, 50000), scale: opt("s1_10", ["s1_1", "s1_2", "s1_5", "s1_10", "s1_20", "s1_50", "s1_100", "s2_1", "s5_1"] as const), sheet: opt("a4", ["a4", "a3", "a2"] as const) },
  projection: { sep: num(30, 5, 100), h1: num(10, 0, 80), d1: num(20, 0, 80), h2: num(50, 0, 80), d2: num(20, 0, 80) },
  isometric: { az: num(45, 0, 90), el: num(35.264, 0, 90), edge: num(50, 10, 100) },
  sectionplane: { tilt: num(30, 0, 80), r: num(20, 10, 60), h: num(100, 40, 200) },
  cadcoords: { l1: num(100, 10, 200), a1: num(0, 0, 360), l2: num(60, 10, 200), a2: num(90, 0, 360), l3: num(100, 10, 200), a3: num(180, 0, 360) },
} satisfies Record<string, ParamSpec>;
