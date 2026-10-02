import { num, opt, type ParamSpec } from "../params-core";

/** Adjustable values of the Basic Mechanical Engineering (MET-001) labs. */
export const MECH_SPECS = {
  incline: { theta: num(30, 0, 80), m: num(10, 1, 100), muS: num(0.5, 0, 1.5), muK: num(0.4, 0, 1.5), P: num(0, 0, 600) },
  moi: { b: num(100, 10, 300), d: num(150, 10, 300), tf: num(15, 2, 100), tw: num(10, 2, 100), h: num(0, 0, 200), sec: opt("rect", ["rect", "circle", "hollow", "isec", "tsec"] as const) },
  tensile: { eps: num(5, 0, 50), L0: num(100, 20, 300), d0: num(10, 5, 25), mat: opt("steel", ["steel", "al", "cu", "ci"] as const) },
  bernoulli: { Q: num(5, 0.5, 30), D1: num(100, 30, 200), D2: num(50, 15, 180), Cd: num(0.98, 0.9, 1) },
  carnot: { TH: num(600, 300, 1500), TC: num(300, 200, 400), input: num(100, 1, 1000), frac: num(0.6, 0.1, 1), dev: opt("engine", ["engine", "fridge", "pump"] as const) },
  diesel: { r: num(18, 6, 25), rho: num(2, 1.2, 4), g: num(1.4, 1.3, 1.67) },
} satisfies Record<string, ParamSpec>;
