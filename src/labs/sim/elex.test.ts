import { describe, expect, it } from "vitest";
import { GATES, bit, byteString, channelProfile, diodeCurrent, diodeModel, diodeQ, eng, fixedBias, gate, nmos, opamp, opampOut, thermalVoltage, toBase, toBcd, truthTable, type OpAmpCfg } from "./elex";

describe("diode", () => {
  it("thermal voltage at 300 K is 25.85 mV", () => expect(thermalVoltage(300)).toBeCloseTo(0.02585, 5));
  it("zero volts gives zero current; reverse current saturates near −I_S", () => {
    const d = diodeModel("si", 300, 1, 5.1);
    expect(diodeCurrent(0, d)).toBe(0);
    expect(diodeCurrent(-1, d)).toBeCloseTo(-1e-12, 15);
  });
  it("current rises about tenfold per 60 mV (n = 1) in forward bias", () => {
    const d = diodeModel("si", 300, 1, 5.1);
    expect(diodeCurrent(0.66, d) / diodeCurrent(0.6, d)).toBeCloseTo(Math.exp(0.06 / thermalVoltage(300)), 6);
  });
  it("Q point satisfies both the diode law and the load line; Si drops ~0.6 V at a few mA", () => {
    const d = diodeModel("si", 300, 1, 5.1), Q = diodeQ(3, 1000, d);
    expect(Q.V).toBeGreaterThan(0.55); expect(Q.V).toBeLessThan(0.75);
    expect(Q.I).toBeCloseTo((3 - Q.V) / 1000, 12);
    expect(diodeCurrent(Q.V, d)).toBeCloseTo(Q.I, 9);
    expect(Q.region).toBe("forward");
  });
  it("germanium turns on at lower voltage than silicon", () => {
    expect(diodeQ(3, 1000, diodeModel("ge", 300, 1, 5.1)).V).toBeLessThan(diodeQ(3, 1000, diodeModel("si", 300, 1, 5.1)).V - 0.2);
  });
  it("a Zener clamps the reverse voltage near −V_z", () => {
    const Q = diodeQ(-12, 1000, diodeModel("si", 300, 1, 5.1));
    expect(Q.region).toBe("breakdown");
    expect(Q.V).toBeLessThan(-5.1); expect(Q.V).toBeGreaterThan(-8);
  });
  it("a hotter diode conducts at a lower voltage", () => {
    expect(diodeQ(3, 1000, diodeModel("si", 360, 1, 5.1)).V).toBeLessThan(diodeQ(3, 1000, diodeModel("si", 300, 1, 5.1)).V);
  });
});

describe("BJT fixed bias", () => {
  it("12 V, 240 kΩ, 2 kΩ, β = 100 → I_B = 47.1 µA, I_C = 4.71 mA, V_CE = 2.58 V", () => {
    const B = fixedBias(12, 240e3, 2e3, 100);
    expect(B.IB).toBeCloseTo(47.083e-6, 8); expect(B.IC).toBeCloseTo(4.7083e-3, 6); expect(B.VCE).toBeCloseTo(2.583, 2); expect(B.region).toBe("active");
  });
  it("too much base current saturates the transistor at V_CE = 0.2 V", () => {
    const B = fixedBias(12, 60e3, 2e3, 100);
    expect(B.region).toBe("saturation"); expect(B.VCE).toBeCloseTo(0.2, 9); expect(B.IC).toBeCloseTo(11.8 / 2e3, 9);
  });
  it("no base drive is cut-off", () => { const B = fixedBias(0.5, 100e3, 1e3, 100); expect(B.region).toBe("cut-off"); expect(B.IC).toBe(0); });
  it("I_E = I_B + I_C", () => { const B = fixedBias(15, 300e3, 3e3, 150); expect(B.IE).toBeCloseTo(B.IB + B.IC, 12); });
});

describe("MOSFET", () => {
  it("saturation current is (k/2)(V_GS − V_t)²", () => {
    const M = nmos(3, 6, 1.5, 2e-3, 0);
    expect(M.region).toBe("saturation"); expect(M.ID).toBeCloseTo(0.5 * 2e-3 * 1.5 * 1.5, 12); expect(M.gm).toBeCloseTo(2e-3 * 1.5, 12);
  });
  it("triode current matches k[(V_GS−V_t)V_DS − V_DS²/2]", () => {
    const M = nmos(4, 1, 1.5, 2e-3, 0);
    expect(M.region).toBe("triode"); expect(M.ID).toBeCloseTo(2e-3 * (2.5 * 1 - 0.5), 12);
  });
  it("is continuous at pinch-off and zero below threshold", () => {
    expect(nmos(3, 1.5 - 1e-9, 1.5, 2e-3, 0.02).ID).toBeCloseTo(nmos(3, 1.5, 1.5, 2e-3, 0.02).ID, 9);
    const c = nmos(1, 5, 1.5, 2e-3, 0.02); expect(c.region).toBe("cut-off"); expect(c.ID).toBe(0);
  });
  it("channel is uniform at V_DS = 0 and pinches off at the drain in saturation", () => {
    expect(channelProfile(1, 2, 0)).toBeCloseTo(1, 12);
    expect(channelProfile(1, 2, 5)).toBeCloseTo(0, 12);
    expect(channelProfile(0, 2, 5)).toBe(1);
  });
});

describe("op-amp", () => {
  const base: OpAmpCfg = { mode: "inv", A: 1, f: 1000, Rin: 10e3, Rf: 47e3, C: 0.1e-6, V2: 0.5, Vsat: 12 };
  it("inverting gain −R_f/R_in and 180° phase", () => { const r = opamp(base); expect(r.gain).toBeCloseTo(-4.7, 12); expect(r.phase).toBe(180); expect(r.clipped).toBe(false); });
  it("non-inverting gain 1 + R_f/R_in; follower gain 1", () => {
    expect(opamp({ ...base, mode: "noninv" }).gain).toBeCloseTo(5.7, 12); expect(opamp({ ...base, mode: "follower" }).gain).toBe(1);
  });
  it("clips at the rails", () => {
    const c = { ...base, mode: "noninv" as const, Rf: 470e3 }, r = opamp(c);
    expect(r.clipped).toBe(true); expect(r.outPeak).toBe(12); expect(opampOut(c, Math.PI / 2)).toBe(12);
  });
  it("integrator amplitude A/(2πfRC) with a 90° shift", () => {
    const c = { ...base, mode: "integrator" as const, f: 200 }, r = opamp(c);
    expect(r.gain).toBeCloseTo(1 / (2 * Math.PI * 200 * 10e3 * 0.1e-6), 9); expect(r.phase).toBe(90);
  });
  it("summing adds the dc input", () => expect(opamp({ ...base, mode: "summing" }).idealPeak).toBeCloseTo(4.7 * 1.5, 9));
});

describe("logic and number systems", () => {
  it("truth tables of the seven gates", () => {
    const y = (g: (typeof GATES)[number]) => truthTable(g).map((r) => Number(r.y)).join("");
    expect(y("and")).toBe("0001"); expect(y("or")).toBe("0111"); expect(y("nand")).toBe("1110"); expect(y("nor")).toBe("1000");
    expect(y("xor")).toBe("0110"); expect(y("xnor")).toBe("1001"); expect(y("not")).toBe("10");
  });
  it("NAND alone builds NOT, AND and OR", () => {
    for (const a of [false, true]) for (const b of [false, true]) {
      expect(gate("nand", a, a)).toBe(!a);
      expect(gate("nand", gate("nand", a, b), gate("nand", a, b))).toBe(a && b);
      expect(gate("nand", gate("nand", a, a), gate("nand", b, b))).toBe(a || b);
    }
  });
  it("number conversions", () => {
    expect(byteString(173)).toBe("1010 1101"); expect(toBase(173, 16, 2)).toBe("AD"); expect(toBase(173, 8)).toBe("255");
    expect(toBcd(173)).toBe("0001 0111 0011"); expect(toBcd(92)).toBe("1001 0010"); expect(bit(173, 0)).toBe(true); expect(bit(173, 1)).toBe(false);
  });
  it("engineering format", () => { expect(eng(0.0123, "A")).toBe("12.3 mA"); expect(eng(4.7e-6, "A")).toBe("4.70 µA"); expect(eng(0, "V")).toBe("0 V"); });
});
