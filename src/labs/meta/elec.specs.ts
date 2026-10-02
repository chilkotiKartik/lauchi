import { flag, num, opt, type ParamSpec } from "../params-core";

/** Adjustable values of the Basic Electrical Engineering (EET-001) labs. */
export const ELEC_SPECS = {
  thevenin: { V: num(12, 1, 48), R1: num(10, 1, 100), R2: num(20, 1, 100), RL: num(10, 1, 200) },
  threephase: { VL: num(400, 100, 690), Z: num(20, 2, 100), phi: num(30, 0, 89), conn: opt("star", ["star", "delta"] as const), lead: flag(false) },
  hysteresis: { hpk: num(1.5, 0.1, 2.5), f: num(50, 1, 400), vol: num(100, 1, 1000), mat: opt("silicon", ["softiron", "silicon", "hardsteel", "ferrite"] as const) },
  transformer: { V1: num(230, 10, 440), N1: num(500, 50, 2000), N2: num(100, 10, 4000), f: num(50, 16, 400), RL: num(10, 1, 500), A: num(20, 2, 100) },
  rotatingfield: { f: num(50, 10, 100), poles: num(2, 2, 8), slip: num(0.04, 0, 1), slow: num(0.5, 0.05, 1), reverse: flag(false) },
} satisfies Record<string, ParamSpec>;
