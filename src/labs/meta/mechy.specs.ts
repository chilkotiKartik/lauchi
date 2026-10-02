import { flag, num, opt, type ParamSpec } from "../params-core";

/** Round-3 labs (group mechy). */
export const MECHY_SPECS = {
  elastic: { E: num(200, 10, 400), nu: num(0.3, 0, 0.49), s: num(100, 0, 500), a: num(100, 10, 200), mode: opt("normal", ["normal", "shear", "volume"] as const) },
  steppedbar: { FA: num(-50, -500, 500), FC: num(-500, -500, 500), FD: num(200, -500, 500), A1: num(600, 50, 5000), A2: num(2400, 50, 5000), A3: num(1200, 50, 5000), L1: num(1000, 100, 3000), L2: num(1000, 100, 3000), L3: num(600, 100, 3000), E: num(210, 50, 400) },
  carbonsteel: { c: num(0.2, 0.05, 4), kind: opt("plain", ["plain", "alloy"] as const) },
  manometer: { h: num(50, 0, 300), s2: num(13.6, 0.8, 13.6), s1: num(1, 0, 1.5), y: num(20, 0, 200), patm: num(101.3, 90, 102) },
  hydrolift: { W: num(12, 0.5, 50), A1: num(0.2, 0.005, 1), A2: num(0.9, 0.05, 5), lift: num(10, 1, 100), eta: num(100, 50, 100) },
  viscosity: { u: num(1, 0.05, 5), y: num(1, 0.05, 10), mu: num(0.1, 0.001, 2), A: num(0.5, 0.01, 2), rho: num(900, 700, 1300), kind: opt("newtonian", ["newtonian", "thinning", "thickening", "bingham"] as const) },
  sfee: { h1: num(3000, 0, 4000), h2: num(2762, 0, 4000), V1: num(60, 0, 300), V2: num(100, 0, 300), dz: num(0, -100, 100), q: num(0, -500, 500), mdot: num(1, 0.1, 100), dev: opt("nozzle", ["nozzle", "turbine", "compressor", "boiler"] as const) },
  secondlaw: { Q1: num(100, 10, 1000), TH: num(600, 300, 1500), TC: num(300, 200, 400), frac: num(0.6, 0.1, 1), mode: opt("clausius", ["clausius", "kp", "legal"] as const) },
  zerothlaw: { TA: num(80, -20, 300), TB: num(20, -20, 300), mA: num(1, 0.1, 10), mB: num(2, 0.1, 10), matA: opt("cu", ["water", "al", "cu", "fe"] as const), matB: opt("water", ["water", "al", "cu", "fe"] as const), sensor: opt("rtd", ["rtd", "tc", "hg"] as const), contact: flag(false) },
  twostroke: { rpm: num(3000, 300, 6000), bore: num(60, 40, 150), stroke: num(60, 40, 150), pm: num(5, 2, 12), ex: num(30, 15, 45), tr: num(20, 8, 35), crank: num(150, 0, 360), fuel: opt("si", ["si", "ci"] as const) },
  centripump: { N: num(1200, 500, 3000), D2: num(400, 100, 600), D1: num(200, 50, 300), b2: num(20, 5, 80), beta1: num(20, 10, 60), beta2: num(30, 15, 90) },
} satisfies Record<string, ParamSpec>;
