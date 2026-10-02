import { describe, expect, it } from "vitest";
import {
  alternator, batteryPack, deltaTerminals, deltaToStar, eng, fuseTime, ladder, magCircuit, mcbTime, motionalEmf, murFromFlux, parallelAC,
  pfCorrection, polesFor, protection, rcdTime, revolvingFields, singlePhaseIM, starDelta, starTerminals, starToDelta, superposition,
  twoSource, twoSourceMesh, waveAt, waveNumeric, waveStats,
} from "./elecy";

describe("Kirchhoff: two sources, three resistors", () => {
  it("PYQ: 10 V/10 Ω and 20 V/20 Ω across a 40 Ω branch gives 0.2857 A", () => {
    const r = twoSource(10, 10, 20, 20, 40);
    expect(r.VA).toBeCloseTo(80 / 7, 6);
    expect(r.I3).toBeCloseTo(2 / 7, 6);
  });
  it("satisfies KCL and both KVL loops, and agrees with mesh analysis", () => {
    const r = twoSource(12, 4, -6, 3, 8), m = twoSourceMesh(12, 4, -6, 3, 8);
    expect(r.kcl).toBeCloseTo(0, 12);
    expect(r.kvl1).toBeCloseTo(0, 12);
    expect(r.kvl2).toBeCloseTo(0, 12);
    expect(m.Im1).toBeCloseTo(r.Im1, 10);
    expect(m.Im2).toBeCloseTo(r.Im2, 10);
    expect(m.I3).toBeCloseTo(r.I3, 10);
  });
  it("conserves power and gives zero I2 when V2 equals the open-circuit node voltage", () => {
    const r = twoSource(12, 4, 9, 6, 12);
    expect(r.I2).toBeCloseTo(0, 12);
    const q = twoSource(15, 7, 5, 2, 9);
    expect(q.P1 + q.P2).toBeCloseTo(q.Pr, 10);
  });
});

describe("Superposition and Norton", () => {
  it("the load current is the sum of the single-source currents", () => {
    const s = superposition(50, 0.5, 30, 20, 20, 10);
    expect(s.IL1 + s.IL2).toBeCloseTo(s.IL, 12);
    expect(s.PL).not.toBeCloseTo(s.Psum, 3);         // power does not superpose
  });
  it("Norton / Thevenin equivalents reproduce the load current", () => {
    for (const RL of [1, 10, 47, 300]) {
      const s = superposition(24, 0.3, 10, 15, 6, RL);
      expect((s.IN * s.RN) / (s.RN + RL)).toBeCloseTo(s.IL, 10);
    }
    const s = superposition(24, 0.3, 10, 15, 6, 5);
    expect(s.RN).toBeCloseTo(6 + 6, 10);
    expect(s.Vth).toBeCloseTo(s.IN * s.RN, 10);
  });
  it("hand values: V alone 50 V, R1 30, R2 20, R3 20, RL 10", () => {
    // A: 20‖(20+10)=12 Ω → VA = 50·12/42 ; iL = VA/30
    const l = ladder(50, 0, 30, 20, 20, 10);
    expect(l.iL).toBeCloseTo((50 * 12) / 42 / 30, 10);
    expect(l.i1).toBeCloseTo(l.i2 + l.i3, 10);
    // current source alone: Is splits between RL and (R3 + R1‖R2)
    const m = ladder(0, 0.5, 30, 20, 20, 10);
    expect(m.iL).toBeCloseTo((0.5 * 32) / 42, 10);
  });
});

describe("Star–delta", () => {
  it("PYQ: three 10 Ω star arms become 30 Ω delta arms, and back", () => {
    const d = starToDelta(10, 10, 10);
    expect(d.Rab).toBeCloseTo(30, 10); expect(d.Rbc).toBeCloseTo(30, 10); expect(d.Rca).toBeCloseTo(30, 10);
    const y = deltaToStar(30, 30, 30);
    expect(y.Ra).toBeCloseTo(10, 10);
  });
  it("conversions are inverse and keep every terminal-pair resistance", () => {
    const y = deltaToStar(5, 10, 15);
    expect(y.Ra).toBeCloseTo((5 * 15) / 30, 10);
    const d = starToDelta(y.Ra, y.Rb, y.Rc);
    expect(d.Rab).toBeCloseTo(5, 10); expect(d.Rbc).toBeCloseTo(10, 10); expect(d.Rca).toBeCloseTo(15, 10);
    const a = deltaTerminals(5, 10, 15), b = starTerminals(y.Ra, y.Rb, y.Rc);
    expect(a.ab).toBeCloseTo(b.ab, 10); expect(a.bc).toBeCloseTo(b.bc, 10); expect(a.ca).toBeCloseTo(b.ca, 10);
  });
  it("starDelta wrapper picks the right direction", () => {
    expect(starDelta("y2d", 2, 3, 6).delta.Rab).toBeCloseTo(36 / 6, 10);
    expect(starDelta("d2y", 30, 30, 30).star.Rc).toBeCloseTo(10, 10);
  });
});

describe("Waveforms: rms, average, form and peak factor", () => {
  it("sine: 0.707, 0.637, 1.11, 1.414", () => {
    const s = waveStats("sine", 1, 50);
    expect(s.rms).toBeCloseTo(0.7071, 4); expect(s.avg).toBeCloseTo(0.6366, 4);
    expect(s.ff).toBeCloseTo(1.1107, 4); expect(s.pf).toBeCloseTo(1.4142, 4);
    expect(s.w).toBeCloseTo(314.16, 2);
  });
  it("half-wave: Vm/2 and Vm/π (FF 1.57, PF 2); square FF = PF = 1; triangle PF √3", () => {
    const h = waveStats("half", 10, 50);
    expect(h.rms).toBeCloseTo(5, 10); expect(h.avg).toBeCloseTo(10 / Math.PI, 10); expect(h.ff).toBeCloseTo(Math.PI / 2, 10); expect(h.pf).toBeCloseTo(2, 10);
    expect(waveStats("square", 3, 50).ff).toBeCloseTo(1, 10);
    expect(waveStats("triangle", 3, 50).pf).toBeCloseTo(Math.sqrt(3), 10);
  });
  it("closed forms agree with numerical integration", () => {
    for (const w of ["sine", "half", "full", "square", "triangle"] as const) {
      const n = waveNumeric(w, 2), s = waveStats(w, 2, 50);
      expect(n.rms).toBeCloseTo(s.rms, 3);
      const avg = w === "half" || w === "full" ? n.mean : n.halfMean;
      expect(avg).toBeCloseTo(s.avg, 3);
    }
    expect(waveAt("sine", 141.4, Math.PI / 2)).toBeCloseTo(141.4, 6);
    expect(waveStats("sine", 141.4, 120 / (2 * Math.PI)).rms).toBeCloseTo(100, 1);   // PYQ e = 141.4 sin 120t
  });
});

describe("Parallel AC branches", () => {
  it("PYQ: coil 50 Ω + 318 mH ‖ 75 Ω + 159 µF on 230 V, 50 Hz → 3.94 A at 0.96 lag", () => {
    const r = parallelAC(230, 50, 50, 318, 75, 159);
    expect(r.Imag).toBeCloseTo(3.94, 1);
    expect(r.pf).toBeCloseTo(0.962, 2);
    expect(r.phi).toBeGreaterThan(0);
    expect(r.P).toBeCloseTo(cabsq(r.I1) * 50 + cabsq(r.I2) * 75, 6);
  });
  it("PYQ: a coil drawing 2 A and 100 W from 230 V 50 Hz is 25 Ω and about 357 mH", () => {
    const r = parallelAC(230, 50, 25, 357.3, 0, 0);
    expect(r.Imag).toBeCloseTo(2, 2);
    expect(r.P).toBeCloseTo(100, 0);
    expect(r.pf).toBeCloseTo(0.2174, 3);
  });
  it("the ideal capacitor that cancels the coil's Q gives unity pf and the smallest current", () => {
    const XL = 2 * Math.PI * 50 * 0.3573, C = XL / (2 * Math.PI * 50 * (25 * 25 + XL * XL)) * 1e6;
    const r = parallelAC(230, 50, 25, 357.3, 0, C);
    expect(r.pf).toBeCloseTo(1, 6);
    expect(r.Imag).toBeCloseTo(100 / 230, 3);
    expect(r.S * r.S).toBeCloseTo(r.P * r.P + r.Q * r.Q, 4);
    const k = pfCorrection(100, 0.2174, 1, 230, 50);
    expect(k.C * 1e6).toBeCloseTo(C, 0);
  });
});
const cabsq = (z: { re: number; im: number }) => z.re * z.re + z.im * z.im;

describe("Magnetic circuit", () => {
  it("PYQ: ideal core, 2.3 mm gap, 18 cm², 83 turns, 1.5 A", () => {
    const m = magCircuit(83, 1.5, 60, 18, 1000, 2.3, true);
    expect(m.Sc).toBe(0);
    expect(m.Sg).toBeCloseTo(1.0168e6, -2);
    expect(m.phi).toBeCloseTo(1.2244e-4, 7);
    expect(m.B).toBeCloseTo(0.068, 3);
  });
  it("PYQ: iron ring 80 cm, 12 cm², 200 turns, 2 A, 1.2 mWb → B = 1 T, μr ≈ 1592", () => {
    const mur = murFromFlux(200, 2, 1.2e-3, 80, 12);
    expect(mur).toBeCloseTo(1592, 0);
    const m = magCircuit(200, 2, 80, 12, mur, 0, false);
    expect(m.phi).toBeCloseTo(1.2e-3, 8);
    expect(m.B).toBeCloseTo(1, 6);
    expect(m.S).toBeCloseTo(400 / 1.2e-3, 0);
  });
  it("a small gap dominates the reluctance", () => {
    const m = magCircuit(500, 1, 50, 10, 4000, 1, false);
    expect(m.gapShare).toBeGreaterThan(0.85);
    expect(m.Hg * 1e-3 + m.Hc * 0.5).toBeCloseTo(500, 6);        // Σ H·l = N·I (Ampère)
  });
});

describe("Faraday / Lenz: motional emf", () => {
  it("e = Blv sin θ and mechanical power equals electrical power", () => {
    const m = motionalEmf(0.8, 0.5, 10, 60, 2);
    expect(m.e).toBeCloseTo(3.4641, 4);
    expect(m.Pm).toBeCloseTo(m.Pe, 10);
    expect(motionalEmf(1, 1, 5, 0, 1).e).toBe(0);
    expect(motionalEmf(1, 1, 5, 90, 1).F).toBeCloseTo(5, 10);
  });
});

describe("Single-phase induction motor", () => {
  it("one winding: equal forward and backward fields and zero starting torque", () => {
    const r = revolvingFields(0, 0);
    expect(r.F).toBeCloseTo(0.5, 10); expect(r.B).toBeCloseTo(0.5, 10);
    const m = singlePhaseIM(50, 4, 1, "none");
    expect(m.T).toBeCloseTo(0, 10); expect(m.Tstart).toBeCloseTo(0, 10);
  });
  it("starting torque = a sin α; 90° gives a pure rotating field", () => {
    expect(singlePhaseIM(50, 4, 1, "split").Tstart).toBeCloseTo(Math.sin((25 * Math.PI) / 180), 10);
    expect(singlePhaseIM(50, 4, 1, "capstart").Tstart).toBeCloseTo(Math.sin((80 * Math.PI) / 180), 10);
    const q = revolvingFields(1, 90);
    expect(q.F).toBeCloseTo(1, 10); expect(q.B).toBeCloseTo(0, 10);
  });
  it("Ns = 120f/P, a pushed motor runs on one winding, the switch drops the auxiliary", () => {
    const m = singlePhaseIM(50, 4, 0.05, "capstart");
    expect(m.Ns).toBe(1500); expect(m.N).toBeCloseTo(1425, 10);
    expect(m.auxIn).toBe(false);
    expect(m.T).toBeGreaterThan(0);
    expect(singlePhaseIM(50, 4, 0.05, "caprun").auxIn).toBe(true);
  });
});

describe("Alternator", () => {
  it("PYQ: 6 poles at 60 Hz → 1200 rpm; 20 Hz at that speed needs 2 poles", () => {
    expect(alternator(6, 1200, 30, 100, 1).f).toBeCloseTo(60, 10);
    expect(polesFor(20, 1200)).toBe(2);
  });
  it("textbook: 16 poles, 375 rpm, 30 mWb, 240 turns, Kw 0.96 → 50 Hz, 1534 V per phase, 2657 V line", () => {
    const a = alternator(16, 375, 30, 240, 0.96);
    expect(a.f).toBeCloseTo(50, 10);
    expect(a.Eph).toBeCloseTo(1534.5, 0);
    expect(a.EL).toBeCloseTo(2657.8, 0);
  });
  it("speed for 50 Hz and rotor type", () => {
    expect(alternator(2, 3000, 30, 100, 1).N50).toBe(3000);
    expect(alternator(4, 1500, 30, 100, 1).rotor).toMatch(/cylindrical/);
    expect(alternator(24, 250, 30, 100, 1).rotor).toMatch(/salient/);
  });
});

describe("Fuse, MCB and RCD", () => {
  it("MCB: no trip at 1.13 In, trips within an hour at 1.45 In, magnetic at 5/10/20 In", () => {
    expect(mcbTime(1.1, "C")).toBe(Infinity);
    expect(mcbTime(1.45, "C")).toBeLessThan(3600);
    expect(mcbTime(2.55, "B")).toBeLessThan(60);
    expect(mcbTime(2.55, "B")).toBeGreaterThan(1);
    expect(mcbTime(6, "B")).toBe(0.01);
    expect(mcbTime(6, "C")).toBeGreaterThan(1);
    expect(mcbTime(25, "D")).toBe(0.01);
  });
  it("fuse: about an hour at 1.6 In, faster for bigger currents", () => {
    expect(fuseTime(1.6)).toBeCloseTo(3600, 6);
    expect(fuseTime(1)).toBe(Infinity);
    expect(fuseTime(10)).toBeLessThan(fuseTime(5));
  });
  it("RCD trips at its rating (≤ 0.3 s) and within 40 ms at 5×; overload ignores it", () => {
    expect(rcdTime(20, 30)).toBe(Infinity);
    expect(rcdTime(30, 30)).toBeCloseTo(0.3, 10);
    expect(rcdTime(150, 30)).toBeCloseTo(0.04, 10);
    expect(protection(160, 16, "C", 0, 30).first).toBe("MCB");
    expect(protection(10, 16, "C", 40, 30).first).toBe("RCD");
    expect(protection(10, 16, "C", 0, 30).first).toBe("nothing trips");
  });
});

describe("Battery pack", () => {
  it("12 V 150 Ah lead–acid inverter battery at 10 A", () => {
    const b = batteryPack("leadacid", 6, 1, 150, 10);
    expect(b.V).toBe(12); expect(b.Ah).toBe(150); expect(b.Wh).toBe(1800);
    expect(b.hours).toBe(15); expect(b.C).toBeCloseTo(1 / 15, 10);
  });
  it("series adds voltage, parallel adds capacity", () => {
    const b = batteryPack("liion", 13, 4, 2.5, 5);
    expect(b.V).toBeCloseTo(48.1, 10); expect(b.Ah).toBe(10); expect(b.cells).toBe(52);
    expect(b.Wh).toBeCloseTo(481, 6);
  });
  it("recharge energy exceeds stored energy by 1/η, Li-ion is lightest", () => {
    const a = batteryPack("nicd", 10, 1, 10, 1), l = batteryPack("liion", 10, 1, 10, 1);
    expect(a.WhIn).toBeCloseTo(a.Wh / 0.7, 10);
    expect(l.kg / l.Wh).toBeLessThan(a.kg / a.Wh);
    expect(eng(1500, "W")).toBe("1.5 kW");
  });
});
