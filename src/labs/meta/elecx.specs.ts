import { flag, num, opt, type ParamSpec } from "../params-core";

/** Extra EET-001 Basic Electrical labs. */
export const ELECX_SPECS = {
  transient: { V: num(10, 1, 24), R: num(1000, 10, 10000), C: num(100, 1, 1000), L: num(500, 10, 5000), t: num(100, 0, 2000), mode: opt("rc", ["rc", "rl"] as const) },
  wattmeter: { VL: num(415, 100, 440), IL: num(20, 1, 50), phi: num(30, -90, 90) },
  trtest: { x: num(0.75, 0, 1.25), kva: num(10, 1, 100), Pi: num(0.25, 0.05, 2), Pcu: num(0.6, 0.1, 5), pf: num(0.8, 0.2, 1), R: num(2, 0.5, 5), X: num(4, 1, 10), lead: flag(false), mode: opt("load", ["load", "oc", "sc"] as const) },
  meters: { I: num(10, -20, 20), fsd: num(20, 5, 100), Rm: num(10, 1, 100), range: num(1, 0.1, 10), ac: flag(false), kind: opt("pmmc", ["pmmc", "mi"] as const) },
  dcmachine: { phi: num(25, 5, 50), N: num(1000, 100, 2000), V: num(220, 100, 460), Ra: num(0.5, 0.05, 2), Ia: num(20, 0, 100), P: num(4, 2, 8), Z: num(480, 100, 1200), lap: flag(true), mode: opt("gen", ["gen", "motor"] as const) },
  torqueslip: { V: num(100, 50, 110), R2: num(0.2, 0.05, 1), X2: num(1, 0.3, 3), TL: num(150, 0, 800), f: num(50, 25, 60), poles: num(4, 2, 8) },
  powergrid: { P: num(100, 10, 500), km: num(150, 10, 500), r: num(0.07, 0.02, 0.2), pf: num(0.9, 0.7, 1), kV: opt("220", ["66", "132", "220", "400", "765"] as const) },
  earthing: { rho: num(100, 10, 1000), L: num(3, 1, 4), d: num(38, 25, 50), side: num(0.6, 0.3, 1.2), mcb: num(16, 6, 63), Ah: num(100, 20, 200), I: num(5, 0.5, 50), soc: num(80, 0, 100), salt: flag(false), mode: opt("pipe", ["pipe", "plate", "battery"] as const) },
} satisfies Record<string, ParamSpec>;
