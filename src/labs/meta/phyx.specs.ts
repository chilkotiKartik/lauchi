import { flag, num, opt, type ParamSpec } from "../params-core";

/** Extra AHT-001 Engineering Physics labs. */
export const PHYX_SPECS = {
  rayleigh: { N: num(600, 50, 3000), dlam: num(0.6, 0.05, 5), lam: num(589, 400, 700), lpm: num(500, 100, 1200), m: num(1, 1, 3) },
  laser: { I: num(5, 0, 10), mix: num(7, 1, 15), L: num(30, 10, 100), R2: num(99, 90, 99.9) },
  polarimeter: { c: num(10, 0, 30), l: num(20, 5, 40), an: num(90, 0, 180), sample: opt("sucrose", ["sucrose", "glucose", "fructose", "water"] as const) },
  solarcell: { G: num(1000, 0, 1500), A: num(100, 1, 200), T: num(300, 250, 350), R: num(0.15, 0.01, 5), V: num(1.95, 0, 3.5), mode: opt("solar", ["solar", "led"] as const), mat: opt("gaasp", ["gaas", "gaasp", "gap", "ingan"] as const), cells: flag(false) },
} satisfies Record<string, ParamSpec>;
