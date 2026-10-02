import { flag, num, opt, type ParamSpec } from "../params-core";

/** Extra ECT-001 Basic Electronics labs. */
export const ELEXX_SPECS = {
  semicond: { T: num(300, 200, 500), logN: num(16, 14, 19), E: num(100, 0, 1000), mat: opt("si", ["si", "ge", "gaas"] as const), type: opt("n", ["intrinsic", "n", "p"] as const) },
  clipper: { Vm: num(5, 1, 20), Vref: num(1, -5, 5), f: num(50, 10, 1000), ideal: flag(false), mode: opt("posclip", ["posclip", "negclip", "dualclip", "posclamp", "negclamp"] as const) },
  zener: { Vin: num(16, 0, 30), Rs: num(220, 50, 2000), Vz: num(10, 3, 20), IL: num(20, 0, 250), Pz: num(500, 250, 5000) },
  biasstab: { T: num(25, -20, 150), VCC: num(12, 5, 24), RC: num(2, 0.5, 10), RE: num(1, 0.1, 5), R1: num(47, 5, 200), R2: num(10, 1, 100), RB: num(470, 50, 2000), beta: num(100, 30, 300), vin: num(10, 1, 50), kind: opt("divider", ["fixed", "divider"] as const) },
  jfet: { VGS: num(-1, -5, 0), VDS: num(8, 0, 25), IDSS: num(10, 2, 20), VP: num(-4, -6, -1) },
  kmap: { ones: num(65152, 0, 65535), dc: num(0, 0, 65535), useDc: flag(false), form: opt("sop", ["sop", "pos"] as const) },
} satisfies Record<string, ParamSpec>;
