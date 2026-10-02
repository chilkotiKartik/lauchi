import { flag, num, opt, type ParamSpec } from "../params-core";

/** Adjustable values of the Engineering Chemistry (AHT-002) labs. */
export const CHEM_SPECS = {
  orbitals: { pts: num(3000, 500, 6000), orbital: opt("1s", ["1s", "2s", "2pz", "2px", "3s", "3pz", "3dz2", "3dxy"] as const), cut: flag(false) },
  motheory: { charge: num(0, -2, 2), mol: opt("O2", ["H2", "He2", "Li2", "Be2", "B2", "C2", "N2", "O2", "F2", "Ne2"] as const) },
  nernst: { logA: num(0, -4, 1), logC: num(0, -4, 1), T: num(298, 273, 373), cell: opt("daniell", ["daniell", "znag", "cuag", "fecu"] as const) },
  gibbs: { T: num(300, 100, 2000), rxn: opt("vap", ["vap", "caco3", "haber", "custom"] as const), dH: num(50, -300, 300), dS: num(100, -300, 300) },
  hardness: { ca: num(60, 0, 300), mg: num(12, 0, 120), hco3: num(200, 0, 600), boil: flag(false) },
  polymer: { n: num(60, 5, 300), spread: num(0.4, 0, 1.2), monomer: opt("ethylene", ["ethylene", "vinylchloride", "propylene", "styrene", "mma"] as const) },
  spectro: { k: num(516, 100, 3000), r: num(127.5, 60, 200), mol: opt("HCl", ["HCl", "CO", "H2", "HF", "N2"] as const) },
} satisfies Record<string, ParamSpec>;
