import { flag, num, opt, type ParamSpec } from "../params-core";

/** Round-3 labs (group phyy). */
export const PHYY_SPECS = {
  biprism: { lam: num(589.3, 400, 700), alpha: num(1, 0.3, 3), mu: num(1.5, 1.4, 1.8), a: num(20, 5, 50), b: num(80, 20, 150), sheet: flag(false), t: num(5, 0.5, 20), ms: num(1.58, 1.3, 1.8) },
  wedge: { lam: num(589, 400, 700), D: num(20, 2, 100), L: num(5, 2, 15), mu: num(1, 1, 1.7), trans: flag(false) },
  einstein: { lam: num(694.3, 300, 1100), T: num(300, 100, 6000), w: num(0.6, 0, 5) },
  calcite: { th: num(45, 0, 90), psi: num(0, 0, 360), t: num(10, 1, 30), an: num(0, 0, 180) },
  poynting: { lgP: num(2, 0, 27), lgr: num(0, -1, 12), er: num(1, 1, 81) },
  dispcurrent: { I: num(20, 1, 500), f: num(200, 1, 1000), a: num(10, 2, 20), d: num(2, 0.5, 20), r: num(5, 0.5, 30) },
  magnetism: { H: num(1000, 0, 100000), T: num(300, 1, 1500), mat: opt("gd", ["bi", "cu", "al2o3", "gd", "fe"] as const) },
  wavepacket: { lgv: num(6, 2, 8.4), sp: num(10, 0.001, 50), pt: opt("e", ["e", "p", "n"] as const), conv: opt("rel", ["rel", "kin"] as const) },
  davisson: { V: num(54, 10, 600), d: num(2.15, 1, 4), phi: num(50, 0, 90) },
  ekband: { T: num(300, 1, 600), E: num(1.5, 0.3, 4), mat: opt("gaas", ["gaas", "si", "ge", "gan", "inp"] as const) },
} satisfies Record<string, ParamSpec>;
