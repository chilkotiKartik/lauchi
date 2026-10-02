import { flag, num, opt, type ParamSpec } from "../params-core";

/** Round-3 labs (group elexy). */
export const ELEXY_SPECS = {
  tunnel: { V: num(0.15, -0.2, 0.7), Ip: num(10, 1, 20), mat: opt("ge", ["ge", "gaas"] as const), phiB: num(0.65, 0.5, 0.85) },
  multiplier: { Vm: num(10, 2, 100), n: num(3, 2, 4), C: num(100, 1, 1000), IL: num(5, 0, 50), f: num(50, 50, 1000), VD: num(0.7, 0, 1) },
  bridgerect: { Vm: num(220, 5, 400), topo: opt("bridge", ["bridge", "ct"] as const), RL: num(1000, 100, 5000), rd: num(10, 0, 50), Vg: num(0, 0, 0.8) },
  bjtconfig: { beta: num(98, 20, 400), cfg: opt("ce", ["cb", "ce", "cc"] as const), IB: num(0.3, 0, 0.5), ICEO: num(40, 0, 100), Vout: num(6, -1, 15) },
  hparam: { hfe: num(50, 10, 400), cfg: opt("ce", ["ce", "cc"] as const), hie: num(1.1, 0.2, 10), hre: num(2.5, 0, 20), hoe: num(24, 0, 100), RL: num(10, 0.1, 50), Rs: num(1, 0, 20) },
  acload: { ICQ: num(2, 0.1, 6), VCC: num(12, 5, 30), RC: num(2, 0.5, 10), RE: num(0.5, 0, 5), RL: num(2, 0.5, 50), ip: num(1.5, 0, 6) },
  mosdepenh: { VGS: num(5, -6, 10), type: opt("enh", ["enh", "dep"] as const), VDS: num(10, 0, 20), VT: num(2, 0.5, 5), k: num(0.278, 0.05, 2), IDSS: num(6, 1, 20), VP: num(-3, -8, -1) },
  jfetbias: { RS: num(1, 0, 5), mode: opt("self", ["fixed", "self", "divider"] as const), VDD: num(20, 5, 30), RD: num(6, 0.5, 20), VGG: num(2, 0, 8), R1: num(2.1, 0.1, 20), R2: num(0.27, 0.05, 10), IDSS: num(10, 2, 20), VP: num(-4, -8, -1) },
  fetamp: { gm: num(1.875, 0.5, 10), cfg: opt("cs", ["cs", "cd", "cg"] as const), rd: num(25, 5, 200), RD: num(2, 0.5, 20), RS: num(2.2, 0.2, 20), load: flag(false), RL: num(10, 1, 100), RG: num(1, 0.1, 10), vin: num(50, 1, 500) },
  universal: { tpd: num(10, 1, 50), base: opt("nand", ["nand", "nor"] as const), target: opt("xor", ["not", "and", "or", "nand", "nor", "xor", "xnor"] as const), a: flag(true), b: flag(false) },
  numbase: { n: num(229, 0, 4095), frac: num(0.225, 0, 0.999999), group: opt("hex", ["oct", "hex"] as const) },
  opreal: { Rf: num(47, 0, 200), cfg: opt("inv", ["inv", "noninv"] as const), R1: num(10, 1, 100), logA: num(5, 1, 6), vin: num(1, 0.01, 5), f: num(1, 0.1, 100), SR: num(0.5, 0.1, 20) },
} satisfies Record<string, ParamSpec>;
