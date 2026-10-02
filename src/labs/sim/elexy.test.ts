import { describe, expect, it } from "vitest";
import {
  acLoad, acPoint, alphaOf, betaOf, bitRow, bjtCurrents, bjtRegion, cbOutput, ceInput, ceOutput, ceToCc, complements, divSteps, evalNet, fetAmp, fmaxSlew,
  fromBase, fullWave, gateFn, hAmp, jfetBias, jfetGm, levels, mos, mosMode, mosTransfer, multiplier, opReal, par, pnI, schottkyI, schottkyIs, si, slewTrace,
  toBase, tunnelG, tunnelI, tunnelPV, tunnelRegion, UNETS, vAt, vbeFor, type UBase, type UTarget,
} from "./elexy";

describe("helpers", () => {
  it("si formatting and parallel resistors", () => {
    expect(si(0.0123, "A")).toBe("12.3 mA");
    expect(si(-2200, "Ω")).toBe("−2.20 kΩ");
    expect(par(10, 10)).toBeCloseTo(5, 12);
    expect(par(10, Infinity)).toBeCloseTo(10, 12);
    expect(par(Infinity)).toBe(Infinity);
  });
});

describe("tunnel, Schottky and p–n diodes", () => {
  it("tunnel diode peaks at I_p, then shows negative resistance down to a valley", () => {
    const pv = tunnelPV(0.01, "ge");
    expect(pv.Ipk).toBeCloseTo(0.01, 4);
    expect(tunnelG(0.15, 0.01, "ge")).toBeLessThan(0);
    expect(tunnelG(0.03, 0.01, "ge")).toBeGreaterThan(0);
    expect(pv.Vv).toBeGreaterThan(0.25); expect(pv.Vv).toBeLessThan(0.4);
    expect(pv.pvr).toBeGreaterThan(6); expect(pv.pvr).toBeLessThan(11);
    expect(tunnelPV(0.01, "gaas").pvr).toBeGreaterThan(pv.pvr);
    expect(tunnelRegion(0.15, 0.01, "ge")).toBe("negative resistance");
    expect(tunnelI(-0.1, 0.01, "ge")).toBeLessThan(-0.03); // conducts in reverse
    expect(tunnelI(0, 0.01, "ge")).toBeCloseTo(0, 12);
  });
  it("Schottky turns on ~0.25 V earlier than a silicon p–n diode", () => {
    expect(vAt(1e-3, 1e-12)).toBeCloseTo(0.536, 2);
    const vs = vAt(1e-3, schottkyIs(0.65), 1.05);
    expect(vs).toBeGreaterThan(0.25); expect(vs).toBeLessThan(0.35);
    expect(schottkyI(0.3, 0.65)).toBeGreaterThan(1000 * pnI(0.3));
    expect(schottkyIs(0.75)).toBeLessThan(schottkyIs(0.65));
  });
});

describe("voltage multiplier", () => {
  it("no-load output n·Vm, doubler sag and ripple I/fC, PIV 2Vm", () => {
    expect(multiplier(2, 10, 0, 50, 100, 0).Vout).toBeCloseTo(20, 9);
    expect(multiplier(3, 10, 0, 50, 100, 0).Vout).toBeCloseTo(30, 9);
    const d = multiplier(2, 100, 0, 50, 100, 10);
    expect(d.drop).toBeCloseTo(0.01 / (50 * 100e-6), 9); // 2 V
    expect(d.ripple).toBeCloseTo(2, 9);
    expect(multiplier(4, 100, 0, 50, 100, 10).ripple).toBeCloseTo(6, 9); // N(N+1)/2 = 3 for N = 2 stages
    expect(multiplier(4, 100, 0, 50, 100, 10).drop).toBeCloseTo(14, 9); // 2N³/3 + N²/2 − N/6 = 7
    expect(d.PIV).toBe(200);
    expect(multiplier(2, 10, 0.7, 50, 100, 0).Vout).toBeCloseTo(18.6, 9);
  });
});

describe("full-wave rectifiers", () => {
  it("PYQ: bridge, 220 sin 314t, R_L = 1 kΩ, r_d = 10 Ω", () => {
    const r = fullWave("bridge", 220, 1000, 10, 0);
    expect(r.Im * 1000).toBeCloseTo(215.7, 1);
    expect(r.Idc * 1000).toBeCloseTo(137.3, 1);
    expect(r.Irms * 1000).toBeCloseTo(152.5, 1);
    expect(r.ripple).toBeCloseTo(0.483, 3);
    expect(r.eta * 100).toBeCloseTo(79.5, 1);
  });
  it("PYQ: bridge, 120 V rms, silicon diodes: V_dc ≈ 107 V, PIV ≈ Vm", () => {
    const r = fullWave("bridge", 120 * Math.SQRT2, 1000, 0, 0.7);
    expect(r.Vdc).toBeCloseTo(107.1, 0);
    expect(r.Im * 1000).toBeCloseTo(168.3, 1);
    expect(r.PIV).toBeCloseTo(169.7, 1);
  });
  it("ideal limits: η = 8/π² = 81.1 %, centre-tap PIV = 2Vm", () => {
    expect(fullWave("ct", 10, 1000, 0, 0).eta).toBeCloseTo(8 / Math.PI ** 2, 9);
    expect(fullWave("ct", 10, 1000, 0, 0).PIV).toBe(20);
    expect(fullWave("bridge", 10, 1000, 5, 0).eta).toBeLessThan(fullWave("ct", 10, 1000, 5, 0).eta);
  });
});

describe("BJT gains and characteristics", () => {
  it("PYQ: α = 0.997 → β ≈ 332; β = 98, I_CEO = 40 µA, I_B = 0.3 mA → I_C = 29.44 mA", () => {
    expect(betaOf(0.997)).toBeCloseTo(332.3, 1);
    expect(alphaOf(99)).toBeCloseTo(0.99, 9);
    const c = bjtCurrents(98, 0.3, 0.04);
    expect(c.IC).toBeCloseTo(29.44, 9);
    expect(c.IE).toBeCloseTo(29.74, 9);
    expect(c.gamma).toBe(99);
  });
  it("output curves: flat at βI_B in the active region, zero at V_CE = 0; CB output dies at V_CB ≈ −0.6 V", () => {
    expect(ceOutput(10, 0.02, 100, 0) / 2).toBeCloseTo(1 + 10 / 150, 3);
    expect(ceOutput(0, 0.02, 100, 0)).toBe(0);
    expect(cbOutput(5, 1, 0.99, 0)).toBeCloseTo(0.99, 6);
    expect(cbOutput(-0.8, 1, 0.99, 0)).toBe(0);
    expect(bjtRegion("ce", 0.1, 0.02)).toBe("saturation");
    expect(bjtRegion("cb", 3, 1)).toBe("active");
  });
  it("input curve: V_BE ≈ 0.6–0.7 V for tens of µA and it inverts ceInput", () => {
    const v = vbeFor(0.02, 5, 100);
    expect(v).toBeGreaterThan(0.6); expect(v).toBeLessThan(0.75);
    expect(ceInput(v, 5, 100)).toBeCloseTo(0.02, 6);
    expect(ceInput(0.65, 0, 100)).toBeGreaterThan(ceInput(0.65, 5, 100));
  });
});

describe("h-parameter amplifier", () => {
  const h = { hi: 1100, hr: 2.5e-4, hf: 50, ho: 24e-6 };
  it("classic CE example (h_ie 1.1 kΩ, h_fe 50, R_L 10 kΩ, R_s 1 kΩ)", () => {
    const a = hAmp(h, 10000, 1000);
    expect(a.Ai).toBeCloseTo(-40.3, 1);
    expect(a.Ri).toBeCloseTo(999, 0);
    expect(a.Av).toBeCloseTo(-403.6, 0);
    expect(a.Avs).toBeCloseTo(-201.7, 0);
    expect(a.Ro / 1000).toBeCloseTo(55.4, 1);
  });
  it("approximate model limits: h_re = h_oe = 0 gives A_i = −h_fe, A_v = −h_fe R_L/h_ie, R_o = ∞", () => {
    const a = hAmp({ hi: 1000, hr: 0, hf: 100, ho: 0 }, 2000, 500);
    expect(a.Ai).toBe(-100); expect(a.Av).toBeCloseTo(-200, 9); expect(a.Ro).toBe(Infinity);
  });
  it("emitter follower: A_v just below 1, A_i ≈ 1 + h_fe, low R_o, high R_i", () => {
    const a = hAmp(ceToCc(h), 10000, 1000);
    expect(a.Av).toBeGreaterThan(0.99); expect(a.Av).toBeLessThan(1);
    expect(a.Ai).toBeCloseTo(51 / 1.24, 6);
    expect(a.Ro).toBeLessThan(50);
    expect(a.Ri).toBeGreaterThan(4e5);
  });
});

describe("DC and AC load lines", () => {
  it("r_ac, intercepts and max symmetrical swing", () => {
    const L = acLoad(12, 2, 0.5, 2, 2);
    expect(L.rac).toBeCloseTo(1, 12);
    expect(L.VCEQ).toBeCloseTo(7, 12);
    expect(L.vceOff).toBeCloseTo(9, 12);
    expect(L.icSat).toBeCloseTo(9, 12);
    expect(L.swing).toBeCloseTo(4, 12);
    expect(L.limit).toBe("cut-off");
    const O = acLoad(12, 2, 0.5, 2, L.ICopt);
    expect(O.VCEQ).toBeCloseTo(O.IC * O.rac, 9); // optimum Q sits at the middle of the AC line
    expect(O.swing).toBeGreaterThan(L.swing);
  });
  it("signal clips at cut-off (i_c = 0)", () => {
    const L = acLoad(12, 2, 0.5, 2, 2);
    expect(acPoint(L, 3, -Math.PI / 2)[1]).toBe(0);
    expect(acPoint(L, 1, 0)[0]).toBeCloseTo(7, 12);
  });
});

describe("MOSFETs", () => {
  it("E-MOSFET: k = 0.278 mA/V², V_T = 2 V → I_D ≈ 10 mA at V_GS = 8 V; none below V_T", () => {
    expect(mos("enh", 8, 15, 2, 0.278, 6, -3).ID).toBeCloseTo(10.0, 1);
    expect(mos("enh", 1.5, 15, 2, 0.278, 6, -3).ID).toBe(0);
    expect(mosMode("enh", 1, 2, -3)).toContain("no channel");
  });
  it("D-MOSFET: I_DSS 6 mA, V_P −3 V → 10.67 mA at +1 V (enhancement mode), 0 at −3 V", () => {
    expect(mosTransfer("dep", 1, 2, 0.3, 6, -3)).toBeCloseTo(10.667, 3);
    expect(mosTransfer("dep", 0, 2, 0.3, 6, -3)).toBeCloseTo(6, 9);
    expect(mosTransfer("dep", -3, 2, 0.3, 6, -3)).toBe(0);
    expect(mosMode("dep", 1, 2, -3)).toBe("enhancement mode");
  });
  it("triode meets saturation smoothly at V_DS = V_GS − V_th", () => {
    const a = mos("enh", 5, 3 - 1e-9, 2, 0.5, 6, -3), b = mos("enh", 5, 3, 2, 0.5, 6, -3);
    expect(a.ID).toBeCloseTo(b.ID, 6);
    expect(b.gm).toBeCloseTo(3, 9);
  });
});

describe("JFET bias", () => {
  it("PYQ self-bias: V_DD 20 V, R_D 6 kΩ, R_S 1 kΩ, I_DSS 10 mA, V_P −4 V", () => {
    const q = jfetBias("self", 20, 6, 1, 0, 1, 1, 10, -4);
    expect(q.ID).toBeCloseTo(2.147, 3);
    expect(q.VGS).toBeCloseTo(-2.147, 3);
    expect(q.VDS).toBeCloseTo(4.97, 2);
  });
  it("fixed bias: V_GG 2 V, I_DSS 10 mA, V_P −8 V → 5.625 mA; R_S = 0 self-bias → I_DSS", () => {
    expect(jfetBias("fixed", 16, 2, 1, 2, 1, 1, 10, -8).ID).toBeCloseTo(5.625, 9);
    expect(jfetBias("self", 16, 2, 0, 0, 1, 1, 10, -8).ID).toBeCloseTo(10, 9);
    expect(jfetBias("fixed", 16, 2, 1, 9, 1, 1, 10, -8).ID).toBe(0);
  });
  it("voltage divider: V_G = 1.82 V, I_D ≈ 2.4 mA (textbook)", () => {
    const q = jfetBias("divider", 16, 2.4, 1.5, 0, 2.1, 0.27, 8, -4);
    expect(q.VG).toBeCloseTo(1.82, 2);
    expect(q.ID).toBeCloseTo(2.42, 1);
    expect(q.VGS).toBeCloseTo(-1.8, 1);
  });
});

describe("FET amplifiers", () => {
  it("CS: g_m 1.875 mS, r_d 25 kΩ, R_D 2 kΩ → A_v ≈ −3.47, Z_o ≈ 1.85 kΩ", () => {
    const a = fetAmp("cs", 1.875, 25, 2, 1, Infinity, 1);
    expect(a.Av).toBeCloseTo(-3.47, 2);
    expect(a.Zo).toBeCloseTo(1.852, 2);
    expect(a.Zi).toBe(1000);
    expect(fetAmp("cs", 2, Infinity, 5, 1, Infinity, 1).Av).toBeCloseTo(-10, 9);
    expect(jfetGm(8, -4, -2)).toBeCloseTo(2, 12);
  });
  it("CD is below 1 and in phase; CG input impedance ≈ 1/g_m", () => {
    const d = fetAmp("cd", 2.28, 40, 1, 2.2, Infinity, 1);
    expect(d.Av).toBeGreaterThan(0.8); expect(d.Av).toBeLessThan(1);
    expect(d.Zo).toBeLessThan(1 / 2.28);
    const g = fetAmp("cg", 2, 1e9, 3, 10, Infinity, 1);
    expect(g.Zi).toBeCloseTo(par(10, 0.5), 3);
    expect(g.Av).toBeCloseTo(6, 3);
  });
});

describe("universal gates", () => {
  const targets: UTarget[] = ["not", "and", "or", "nand", "nor", "xor", "xnor"];
  it("every NAND-only and NOR-only network reproduces its truth table", () => {
    for (const base of ["nand", "nor"] as UBase[]) for (const t of targets) for (const a of [false, true]) for (const b of [false, true]) {
      const o = evalNet(base, UNETS[base][t], a, b);
      expect(o[o.length - 1], `${base} ${t} ${a} ${b}`).toBe(gateFn(t, a, b));
    }
  });
  it("gate counts: NAND gives AND in 2, OR in 3, XOR in 4; NOR gives OR in 2, AND in 3", () => {
    expect(UNETS.nand.and.length).toBe(2); expect(UNETS.nand.or.length).toBe(3); expect(UNETS.nand.xor.length).toBe(4);
    expect(UNETS.nor.or.length).toBe(2); expect(UNETS.nor.and.length).toBe(3);
    expect(UNETS.nand.not.length).toBe(1);
  });
  it("logic depth (gate delays on the longest path)", () => {
    expect(levels(UNETS.nand.xor).at(-1)).toBe(3);
    expect(levels(UNETS.nand.or).at(-1)).toBe(2);
    expect(levels(UNETS.nor.nand).at(-1)).toBe(3);
  });
});

describe("number systems", () => {
  it("PYQ: (229.225)₁₀ in binary and hex", () => {
    expect(toBase(229, 0.225, 2, 10)).toBe("11100101.0011100110…");
    expect(toBase(229, 0.225, 16, 4)).toBe("E5.3999…");
  });
  it("PYQ: (1BD.A0)₁₆ = 445.625 and (436.21)₈ = (100011110.010001)₂", () => {
    expect(fromBase("1BD.A0", 16)).toBeCloseTo(445.625, 12);
    const v = fromBase("436.21", 8);
    expect(v).toBeCloseTo(286.265625, 12);
    expect(toBase(Math.floor(v), v - Math.floor(v), 2)).toBe("100011110.010001");
  });
  it("repeated division, complements and bit rows", () => {
    expect(divSteps(13, 2).map((s) => s[1]).reverse().join("")).toBe("1101");
    expect(complements(5, 8)).toEqual({ ones: "11111010", twos: "11111011" });
    expect(complements(0, 4).twos).toBe("0000");
    expect(bitRow(5, 0.75, 4, 3)).toEqual([0, 1, 0, 1, 1, 1, 0]);
  });
});

describe("practical op-amp", () => {
  it("finite open-loop gain: error = 1/(1 + Aβ), → ideal as A → ∞", () => {
    const r = opReal("inv", 47, 10, 1e5);
    expect(r.ideal).toBeCloseTo(-4.7, 12);
    expect(r.errPct).toBeCloseTo(100 / (1 + 1e5 * (10 / 57)), 12);
    expect(opReal("noninv", 47, 10, 1e12).actual).toBeCloseTo(5.7, 9);
    expect(opReal("noninv", 0, 10, 100).actual).toBeCloseTo(100 / 101, 12); // follower with A = 100
  });
  it("PYQ: slew rate 0.5 V/µs, 10 V peak → f_max ≈ 7.96 kHz; above it the output is slew limited", () => {
    expect(fmaxSlew(0.5, 10)).toBeCloseTo(7958, 0);
    expect(slewTrace(10, 20000, 0.5, 13).peak).toBeLessThan(9);
    expect(slewTrace(10, 1000, 0.5, 13).peak).toBeCloseTo(10, 1);
  });
});
