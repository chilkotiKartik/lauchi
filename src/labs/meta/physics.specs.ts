import { num, opt, type ParamSpec } from "../params-core";

/** Adjustable values of the AHT-001 Engineering Physics labs. Presets, saved setups and share links are clamped to these. */
export const PHYSICS_SPECS = {
  diffraction: { nm: num(550, 400, 700), a: num(2, 0.5, 10), d: num(6, 1, 30), N: num(2, 1, 10) },
  polarization: { ang: num(30, 0, 180), plate: opt("none", ["none", "quarter", "half"] as const), fast: num(45, 0, 180), n: num(1.5, 1.3, 2.5) },
  fiber: { launch: num(12, 0, 45), n1: num(1.5, 1.4, 1.8), n2: num(1.45, 1.3, 1.55) },
  photoelectric: { nm: num(300, 150, 700), I: num(50, 5, 100), V: num(0, -2, 7), metal: opt("na", ["cs", "na", "k", "zn", "cu"] as const) },
  compton: { lam: num(20, 1, 100), th: num(90, 0, 180) },
  pnjunction: { logNa: num(16, 14, 18), logNd: num(16, 14, 18), V: num(0, -5, 0.7), T: num(300, 250, 400) },
  hall: { I: num(10, 1, 50), B: num(0.5, 0.05, 2), logn: num(22, 18, 29), t: num(1, 0.1, 5), type: opt("electron", ["electron", "hole"] as const) },
} satisfies Record<string, ParamSpec>;
