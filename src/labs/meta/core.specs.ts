import { flag, num, opt, type ParamSpec } from "../params-core";

/** Adjustable values of the first 18 labs: default, then allowed range. Presets, saved setups and share links are clamped to these. */
export const CORE_SPECS = {
  box: { n: num(2, 1, 6), L: num(0.5, 0.2, 2) },
  eigen: { a: num(2, -3, 3), b: num(1, -3, 3), c: num(1, -3, 3), d: num(2, -3, 3) },
  emwave: { nm: num(550, 400, 700), pol: num(0, 0, 180), amp: num(1, 0.3, 1.5) },
  field: { q1: num(2, -4, 4), q2: num(-2, -4, 4), d: num(2.4, 1, 5) },
  fourier: { n: num(3, 1, 40) },
  interference: { n: num(2, 2, 5), lambda: num(1, 0.4, 2), sep: num(2, 0.6, 3) },
  otto: { r: num(8, 4, 14), g: num(1.4, 1.3, 1.67), tau: num(6, 3, 10) },
  pendulum: { L: num(1.5, 0.5, 3), g: num(9.81, 1.6, 24.8), th0: num(60, 5, 170), damp: num(0.05, 0, 0.5) },
  polar: { a: num(0, 0, 3), b: num(2, 0.5, 3), k: num(3, 1, 8) },
  projectile: { v: num(20, 5, 40), ang: num(45, 5, 85), g: num(9.81, 1.6, 25), k: num(0, 0, 1) },
  rectifier: { mode: opt("smooth", ["half", "full", "smooth"] as const), C: num(470, 10, 2200), R: num(500, 50, 2000), Vp: num(10, 2, 12) },
  rings: { nm: num(550, 400, 700), R: num(60, 20, 100) },
  rlc: { R: num(20, 1, 200), L: num(100, 10, 500), C: num(10, 1, 100), f: num(150, 20, 1000) },
  surface: { id: opt("cubic", ["cubic", "saddle", "bowl", "xy6", "wave"] as const), lagr: flag(false), r: num(1, 0.2, 4), px: num(0.5, -4, 4), py: num(0.5, -4, 4) },
  taylor: { id: opt("sin", ["sin", "cos", "exp", "ln"] as const), n: num(3, 1, 15), a: num(0, -2, 2), x0: num(1.5, -3, 3) },
  titration: { kind: opt("strong", ["strong", "weak"] as const), Vb: num(10, 0, 60), Cb: num(0.1, 0.05, 0.2) },
  volume: { id: opt("sum", ["xy", "sum", "flat"] as const), n: num(6, 1, 40), a: num(2, 0.5, 3), b: num(2, 0.5, 3) },
  vsepr: { dom: num(4, 2, 6), lone: num(0, 0, 3) },
} satisfies Record<string, ParamSpec>;
