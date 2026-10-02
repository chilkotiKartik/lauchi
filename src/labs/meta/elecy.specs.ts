import { flag, num, opt, type ParamSpec } from "../params-core";

/** Round-3 labs (group elecy). */
export const ELECY_SPECS = {
  kirchhoff: { V1: num(10, 0, 50), R1: num(10, 1, 100), V2: num(20, -50, 50), R2: num(20, 1, 100), R3: num(40, 1, 200) },
  superposition: { V: num(50, 0, 100), Is: num(0.5, 0, 5), R1: num(30, 1, 200), R2: num(20, 1, 200), R3: num(20, 1, 200), RL: num(10, 1, 200) },
  stardelta: { R1: num(10, 1, 100), R2: num(10, 1, 100), R3: num(10, 1, 100), mode: opt("y2d", ["y2d", "d2y"] as const) },
  acwaveforms: { Vm: num(325.3, 1, 400), f: num(50, 1, 100), wave: opt("sine", ["sine", "half", "full", "square", "triangle"] as const), th: num(45, 0, 360) },
  acparallel: { V: num(230, 50, 440), f: num(50, 25, 100), R1: num(50, 1, 200), L: num(318, 0, 1000), R2: num(75, 0, 200), C: num(159, 0, 500) },
  magneticgap: { N: num(200, 10, 1000), I: num(2, 0.1, 10), lc: num(80, 10, 200), A: num(12, 1, 50), mur: num(1592, 100, 10000), g: num(0, 0, 5), ideal: flag(false) },
  faradaylenz: { B: num(0.8, 0.05, 2), l: num(0.5, 0.1, 1), v: num(10, 0, 20), th: num(60, 0, 90), R: num(2, 0.1, 100) },
  singlephaseim: { f: num(50, 25, 60), poles: num(4, 2, 8), s: num(0.05, 0, 1), start: opt("capstart", ["none", "split", "capstart", "caprun"] as const) },
  alternator: { P: num(4, 2, 24), N: num(1500, 100, 3600), phi: num(30, 1, 200), T: num(240, 10, 2000), Kw: num(0.96, 0.7, 1) },
  switchgear: { I: num(10, 1, 1000), In: num(16, 6, 63), curve: opt("C", ["B", "C", "D"] as const), leak: num(0, 0, 300), rcd: opt("30", ["10", "30", "100", "300"] as const) },
  batterypack: { Ns: num(6, 1, 16), Np: num(1, 1, 8), chem: opt("leadacid", ["leadacid", "nicd", "liion"] as const), Ah: num(150, 0.5, 200), I: num(10, 0.1, 100) },
} satisfies Record<string, ParamSpec>;
