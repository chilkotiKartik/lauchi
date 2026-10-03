import { num, opt, type ParamSpec } from "../params-core";

export const BCAY_SPECS = {
  cpointer3d: {
    mode: opt("pointer", ["pointer", "array", "malloc", "double"] as const),
    val: num(42, 1, 999),
  },
  hardarch3d: {
    cpuGhz: num(3.6, 1.0, 5.5),
    ddrGen: opt("4", ["3", "4", "5"] as const),
    pcieLanes: num(16, 1, 16),
  },
  sdlc3d: {
    model: opt("agile", ["waterfall", "spiral", "agile"] as const),
    phase: num(2, 1, 8),
  },
} satisfies Record<string, ParamSpec>;
