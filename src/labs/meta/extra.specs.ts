import { flag, num, opt, type ParamSpec } from "../params-core";

/** Adjustable values of the labs that fill the gaps in environment, electrical, C, biology and basic maths. */
export const EXTRA_SPECS = {
  resources: { R: num(1000, 100, 10000), c0: num(20, 1, 200), g: num(3, 0, 10), rec: num(0, 0, 80) },
  speciesarea: { hab: num(50, 1, 100), z: num(0.25, 0.1, 0.4), S0: num(1000, 10, 10000) },
  rainwater: { area: num(100, 10, 1000), rain: num(800, 200, 3000), coeff: num(0.8, 0.3, 0.95), tank: num(20000, 1000, 100000), use: num(300, 50, 2000) },
  loadbill: { bulbs: num(10, 0, 40), fans: num(4, 0, 15), acs: num(1, 0, 4), acHours: num(6, 0, 24), fridge: flag(true), tariff: num(7, 2, 12), fixed: num(150, 0, 500) },
  gcdflow: { a: num(48, 1, 999), b: num(18, 1, 999), method: opt("mod", ["mod", "sub"] as const), step: num(0, 0, 200) },
  cellsize: { r: num(10, 0.5, 100), D: num(500, 50, 1000), fold: num(1, 1, 50) },
  enzyme: { S: num(20, 0, 200), Vmax: num(100, 10, 200), Km: num(20, 1, 100), I: num(0, 0, 100), Ki: num(10, 1, 50), mode: opt("none", ["none", "competitive", "noncompetitive", "uncompetitive"] as const) },
  bioenergy: { dG0: num(-30.5, -60, 40), logQ: num(0, -6, 6), T: num(310, 273, 330), logQatp: num(-3.3, -6, 0), couple: flag(false) },
  limits: { a: num(1, -3, 3), k: num(1, -3, 3), j: num(1, -3, 3), h: num(0.5, 0.001, 1), kind: opt("hole", ["hole", "jump", "sinc", "pole"] as const) },
  partialfrac: { p: num(3, -9, 9), q: num(5, -9, 9), r1: num(1, -5, 5), r2: num(-2, -5, 5), x0: num(0.5, -4, 4) },
} satisfies Record<string, ParamSpec>;
