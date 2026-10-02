import { num, opt, type ParamSpec } from "../params-core";

/** Extra MET-001 Basic Mechanical labs. */
export const MECHX_SPECS = {
  truss: { P: num(10, 0, 100), W: num(0, 0, 200), bays: num(4, 2, 6), span: num(12, 4, 30), h: num(3, 1, 8), type: opt("pratt", ["pratt", "howe", "warren"] as const) },
  ladder: { th: num(60, 10, 89), k: num(0.5, 0, 1), muf: num(0.35, 0.05, 0.8), muw: num(0.2, 0, 0.6), W: num(200, 50, 500), Wm: num(700, 0, 1200), L: num(5, 2, 10) },
  beam: { w: num(10, 0, 50), u1: num(0, 0, 20), u2: num(6, 0, 20), W: num(0, 0, 200), a: num(4.5, 0, 20), L: num(9, 2, 20), b: num(200, 50, 500), d: num(400, 100, 1000) },
  pelton: { H: num(300, 50, 1000), d: num(100, 20, 300), D: num(1.5, 0.5, 4), rpm: num(500, 50, 1500) },
  pvwork: { p1: num(500, 100, 2000), V1: num(0.05, 0.01, 0.5), V2: num(0.15, 0.01, 0.5), n: num(1.3, 1.01, 1.67), T1: num(300, 250, 1000), q: num(50, 1, 500), proc: opt("polytropic", ["isobaric", "isochoric", "isothermal", "adiabatic", "polytropic"] as const) },
  engine4s: { r: num(9, 6, 22), rpm: num(600, 60, 3000), bore: num(80, 50, 150), stroke: num(90, 50, 150), crank: num(0, 0, 720), fuel: opt("si", ["si", "ci"] as const) },
  dualcycle: { r: num(12, 5, 22), q: num(1200, 300, 2500), rp: num(1.5, 1, 3), T1: num(300, 250, 350) },
} satisfies Record<string, ParamSpec>;
