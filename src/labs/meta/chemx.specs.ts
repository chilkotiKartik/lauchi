import { flag, num, opt, type ParamSpec } from "../params-core";

/** Extra AHT-002 Engineering Chemistry labs. */
export const CHEMX_SPECS = {
  cft: { d: num(6, 1, 10), D: num(22900, 5000, 40000), P: num(21000, 10000, 30000), geo: opt("oct", ["oct", "tet", "sqp"] as const) },
  ellingham: { T: num(1200, 300, 2200), ox: opt("feo", ["feo", "zno", "al2o3", "mgo", "cu2o", "nio"] as const), red: opt("c_co", ["c_co", "c_co2", "co_co2"] as const) },
  softening: { ca: num(150, 0, 500), mg: num(100, 0, 400), pca: num(60, 0, 400), pmg: num(40, 0, 300), vol: num(8000, 0, 40000), resin: num(100, 10, 500), cap: num(40, 20, 80), m3: num(50, 1, 500), mode: opt("ion", ["ion", "lime"] as const) },
  corrosion: { o2: num(8, 0, 15), pH: num(7, 2, 12), area: num(1, 0.1, 10), I: num(1, 0, 5), prot: opt("none", ["none", "zinc", "magnesium", "iccp"] as const) },
  calorimeter: { m: num(1, 0.5, 2), C: num(80, 60, 95), H: num(5, 1, 15), W: num(2000, 500, 3000), w: num(500, 100, 3000), latent: flag(true) },
  lubrication: { nu40: num(68, 10, 320), VI: num(100, 0, 150), T: num(60, 0, 150), rpm: num(1000, 10, 3000), load: num(2000, 100, 10000) },
  nmr: { B0: num(7.05, 1.41, 14.1), J: num(7, 2, 15), width: num(1.5, 0.3, 6), mol: opt("ethanol", ["ethanol", "chloroethane", "isobutylbr", "tbutylbenz", "isobutylbenz", "chloropropane", "acetone"] as const) },
  snmech: { conc: num(1, 0.01, 2), T: num(298, 273, 373), sub: opt("primary", ["methyl", "primary", "secondary", "tertiary"] as const), nu: opt("strong", ["strong", "weak"] as const), solv: opt("aprotic", ["protic", "aprotic"] as const) },
} satisfies Record<string, ParamSpec>;
