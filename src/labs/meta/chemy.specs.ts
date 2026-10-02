import { num, opt, type ParamSpec } from "../params-core";

/** Round-3 labs (group chemy): Engineering Chemistry (AHT-002). */
export const CHEMY_SPECS = {
  bandtheory: { Eg: num(1.12, 0, 6), T: num(300, 50, 800), dop: opt("none", ["none", "n", "p"] as const) },
  hesslaw: { a: num(-393.5, -2000, -100), b: num(-285.83, -2000, -100), c: num(-890.36, -2000, -100), rxn: opt("ch4", ["ch4", "hydrog", "diamond"] as const) },
  revosmosis: { P: num(60, 0, 100), salt: num(35, 0, 80), T: num(25, 5, 45), A: num(1, 0.2, 4), sol: opt("nacl", ["nacl", "cacl2", "sucrose"] as const) },
  alkalinity: { P: num(5, 0, 50), M: num(15, 0, 60), V: num(100, 25, 250), N: num(0.02, 0.005, 0.1) },
  polygrowth: { p: num(0.95, 0.5, 0.999), r: num(1, 0.9, 1), M0: num(113, 14, 300), dpc: num(1000, 50, 5000), mode: opt("step", ["step", "chain"] as const) },
  visindex: { U: num(600, 100, 1500), H: num(500, 100, 1000), L: num(800, 300, 2000), T: num(40, -30, 300), flash: num(200, 100, 320), fire: num(230, 100, 350), cloud: num(-5, -40, 30), pour: num(-12, -50, 25) },
  beerlambert: { c: num(0.02, 0, 50), l: num(1, 0.1, 10), lam: num(217, 120, 700), ch: opt("butadiene", ["ethane", "tma", "ethene", "butadiene", "hexatriene", "carotene", "acetone", "benzene"] as const) },
  dielsalder: { T: num(400, 250, 1100), c0: num(1, 0.1, 5), xi: num(0.5, 0, 1), dn: opt("ethene", ["ethene", "acrolein", "maleic"] as const) },
  irmodes: { k: num(1, 1, 4), iso: num(1, 1, 2.5), mol: opt("h2o", ["h2o", "co2", "cs2", "hcl", "co", "n2"] as const) },
  vulcanize: { S: num(3, 0, 40), eff: num(8, 2, 50), T: num(298, 250, 400), lam: num(3, 1, 7) },
} satisfies Record<string, ParamSpec>;
