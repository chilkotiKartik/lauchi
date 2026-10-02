import { describe, expect, it } from "vitest";
import {
  centriPump, couette, cubeLoad, elasticConstants, equilibrium, hydraulicLift, hydroP, ironCarbon, manometer, mercury, phases, pistonFrac, portOpens,
  prng, rtd, secondLaw, sfee, shearStress, steppedBar, thermocouple, twoStroke, twoStrokePhase,
} from "./mechy";

describe("elastic constants", () => {
  it("steel E = 200 GPa, ν = 0.3 → G = 76.9 GPa, K = 166.7 GPa, and E = 9KG/(3K + G)", () => {
    const c = elasticConstants(200, 0.3);
    expect(c.G).toBeCloseTo(76.923, 3); expect(c.K).toBeCloseTo(166.667, 3); expect(c.Echeck).toBeCloseTo(200, 9);
  });
  it("ν = 0.5 is incompressible (K → ∞) and ν = 0 gives G = E/2, K = E/3", () => {
    expect(elasticConstants(1, 0.5).K).toBe(Infinity);
    const z = elasticConstants(90, 0); expect(z.G).toBe(45); expect(z.K).toBe(30);
  });
  it("cube: σ = 100 MPa on steel strains 5×10⁻⁴; pure shear has no volume change; pressure p shrinks volume by p/K", () => {
    const n = cubeLoad(200, 0.3, "normal", 100, 100);
    expect(n.ex).toBeCloseTo(5e-4, 12); expect(n.ey).toBeCloseTo(-1.5e-4, 12); expect(n.ev).toBeCloseTo(2e-4, 12); expect(n.dA).toBeCloseTo(0.05, 10);
    expect(cubeLoad(200, 0.3, "shear", 100, 100).ev).toBe(0);
    expect(cubeLoad(200, 0.3, "shear", 100, 100).gamma).toBeCloseTo(100 / 76923.08, 8);
    const v = cubeLoad(200, 0.3, "volume", 100, 100);
    expect(v.ev).toBeCloseTo(-100 / 166666.67, 9); expect(v.ev).toBeCloseTo(3 * v.ex, 12);
  });
});

describe("stepped bar", () => {
  it("PYQ LMNP: 50 kN at L, 500 kN at N, 200 kN at P → P = 350 kN and δ = +0.278 mm (E = 210 GPa)", () => {
    const b = steppedBar(-50, -500, 200, [600, 2400, 1200], [1000, 1000, 600], 210);
    expect(b.FB).toBeCloseTo(350, 9);
    expect(b.N).toEqual([50, -300, 200]);
    expect(b.total).toBeCloseTo(0.27778, 4);
  });
  it("PYQ rod 2 cm × 2 cm × 100 cm, 1000 kgf, E = 2 × 10⁶ kgf/cm² → δ = 0.125 mm", () => {
    const b = steppedBar(-9.81, 0, 9.81, [400, 400, 400], [400, 300, 300], 196.2);
    expect(b.FB).toBeCloseTo(0, 9); expect(b.total).toBeCloseTo(0.125, 9);
  });
  it("δ = PL/AE adds segment by segment and sign follows tension/compression", () => {
    const b = steppedBar(100, 0, -100, [500, 500, 500], [1000, 1000, 1000], 200);
    expect(b.total).toBeCloseTo(-3, 9); expect(b.sigma[0]).toBeCloseTo(-200, 9);
  });
});

describe("iron–carbon materials", () => {
  it("strength and hardness rise and ductility falls with carbon up to the eutectoid 0.8 %", () => {
    const a = ironCarbon(0.1, "plain"), b = ironCarbon(0.45, "plain"), c = ironCarbon(0.8, "plain");
    expect(a.uts).toBeLessThan(b.uts); expect(b.uts).toBeLessThan(c.uts);
    expect(a.bhn).toBeLessThan(c.bhn); expect(a.el).toBeGreaterThan(c.el);
    expect(ironCarbon(0.2, "plain").uts).toBe(410);
  });
  it("cast iron is brittle: no yield, < 1 % elongation, far less tough than mild steel", () => {
    const ci = ironCarbon(3, "plain"), ms = ironCarbon(0.2, "plain");
    expect(ci.brittle).toBe(true); expect(ci.el).toBeLessThan(1); expect(ci.cls).toBe("Grey cast iron");
    expect(ms.toughness).toBeGreaterThan(50 * ci.toughness);
  });
  it("alloying raises strength; resilience = σy²/2E; pearlite is 100 % at 0.8 % C", () => {
    expect(ironCarbon(0.4, "alloy").uts).toBeGreaterThan(ironCarbon(0.4, "plain").uts * 1.5);
    expect(ironCarbon(0.2, "plain").resilience).toBeCloseTo((250 * 250) / (2 * 210000) * 1000, 6);
    expect(phases(0.8).pearlite).toBe(1); expect(phases(0.4).ferrite).toBeCloseTo(0.5, 9);
    const r = prng(7), s = prng(7); expect(r()).toBe(s());
  });
});

describe("manometer & Pascal", () => {
  it("PYQ: 250 cm of Hg on a gas tank with p_atm = 101 kPa → 0.4345 MPa absolute", () => {
    const m = manometer(250, 13.6, 0, 0, 101);
    expect(m.pg).toBeCloseTo(333540, 0); expect(m.pabs / 1e6).toBeCloseTo(0.4345, 4);
  });
  it("PYQ: oil SG 0.95, 150 cm deep → 13.98 kN/m²", () => {
    expect(hydroP(0.95, 1.5) / 1000).toBeCloseTo(13.98, 2);
    expect(manometer(150, 0.95, 0, 0, 101).pg / 1000).toBeCloseTo(13.98, 2);
  });
  it("a liquid column above the left limb subtracts s₁y; equal heads read zero", () => {
    expect(manometer(10, 13.6, 13.6, 10, 100).pg).toBeCloseTo(0, 9);
    expect(manometer(0, 13.6, 1, 50, 100).vacuum).toBe(true);
  });
  it("PYQ lift: 1.2 × 10⁴ N car on 0.90 m², plunger 0.20 m² → 2667 N", () => {
    const l = hydraulicLift(12, 0.2, 0.9, 10, 100);
    expect(l.F1).toBeCloseTo(2666.67, 1); expect(l.MA).toBeCloseTo(4.5, 9);
    expect(l.workIn).toBeCloseTo(l.workOut, 6); // ideal: energy conserved
    expect(hydraulicLift(12, 0.2, 0.9, 10, 50).F1).toBeCloseTo(5333.33, 1);
  });
});

describe("viscosity", () => {
  it("R.K. Bansal: 0.8 m square plate, 1.5 mm oil film, 0.3 m/s, 150 N → μ = 1.17 Pa·s", () => {
    const c = couette("newtonian", 1.171875, 0.3, 1.5, 0.64, 900);
    expect(c.tau).toBeCloseTo(234.375, 6); expect(c.F).toBeCloseTo(150, 6); expect(c.rate).toBeCloseTo(200, 9);
  });
  it("Newtonian apparent viscosity is constant; shear-thinning falls and shear-thickening rises with rate", () => {
    expect(couette("newtonian", 0.1, 1, 1, 1, 1000).apparent).toBeCloseTo(0.1, 12);
    expect(couette("thinning", 0.1, 2, 1, 1, 1000).apparent).toBeLessThan(couette("thinning", 0.1, 1, 1, 1, 1000).apparent);
    expect(couette("thickening", 0.1, 2, 1, 1, 1000).apparent).toBeGreaterThan(couette("thickening", 0.1, 1, 1, 1, 1000).apparent);
  });
  it("a Bingham plastic needs its yield stress before it shears; ν = μ/ρ", () => {
    expect(shearStress("bingham", 0.5, 1e-9)).toBeCloseTo(20, 6); expect(shearStress("bingham", 0.5, 0)).toBe(0);
    expect(couette("newtonian", 0.9, 1, 1, 1, 900).nu).toBeCloseTo(1e-3, 12);
  });
});

describe("steady flow energy equation", () => {
  it("P.K. Nag nozzle: h 3000 → 2762 kJ/kg, V₁ = 60 m/s → V₂ = 692.5 m/s", () => {
    expect(sfee("nozzle", 3000, 2762, 60, 0, 0, 0, 1).V2).toBeCloseTo(692.5, 1);
    expect(sfee("nozzle", 2000, 2100, 10, 0, 0, 0, 1).possible).toBe(false);
  });
  it("adiabatic turbine with no KE/PE change: w = h₁ − h₂; compressor work is negative", () => {
    const t = sfee("turbine", 3200, 2600, 50, 50, 0, 0, 2);
    expect(t.w).toBeCloseTo(600, 9); expect(t.power).toBeCloseTo(1200, 9); expect(t.possible).toBe(true);
    expect(sfee("compressor", 300, 450, 10, 10, 0, -10, 1).w).toBeCloseTo(-160, 9);
  });
  it("boiler: q = h₂ − h₁ (+ ΔKE); a 10 m drop releases 0.0981 kJ/kg", () => {
    expect(sfee("boiler", 420, 2800, 0, 0, 0, 0, 1).q).toBeCloseTo(2380, 9);
    expect(sfee("turbine", 3000, 3000, 0, 0, 10, 0, 1).w).toBeCloseTo(0.0981, 9);
  });
});

describe("second law", () => {
  it("reversible engine driving a reversible fridge: nothing changes, ΔS = 0", () => {
    const s = secondLaw("legal", 100, 600, 300, 1);
    expect(s.hot).toBeCloseTo(0, 9); expect(s.cold).toBeCloseTo(0, 9); expect(s.dS).toBeCloseTo(0, 12); expect(s.ok).toBe(true);
  });
  it("Clausius violator + engine = Kelvin–Planck violator: W from one reservoir, ΔS < 0", () => {
    const s = secondLaw("clausius", 100, 600, 300, 0.6);
    expect(s.cold).toBe(0); expect(-s.hot).toBeCloseTo(s.Wnet, 9); expect(s.Wnet).toBeCloseTo(30, 9); expect(s.ok).toBe(false);
  });
  it("Kelvin–Planck violator + fridge = Clausius violator: heat goes cold → hot with no net work", () => {
    const s = secondLaw("kp", 100, 600, 300, 1);
    expect(s.Wnet).toBe(0); expect(s.hot).toBeCloseTo(100, 9); expect(s.cold).toBeCloseTo(-100, 9); expect(s.ok).toBe(false);
    expect(secondLaw("legal", 100, 600, 300, 0.5).dS).toBeGreaterThan(0);
  });
});

describe("zeroth law & sensors", () => {
  it("equal heat capacities settle at the mean; heat lost by A = heat gained by B", () => {
    const e = equilibrium(80, 1, 4.186, 20, 1, 4.186);
    expect(e.T).toBeCloseTo(50, 9); expect(e.Q).toBeCloseTo(4.186 * 30, 9);
  });
  it("Pt100 RTD: 100 Ω at 0 °C, 138.5 Ω at 100 °C; type-K ≈ 4.1 mV at 100 °C", () => {
    expect(rtd(0)).toBe(100); expect(rtd(100)).toBeCloseTo(138.5, 9); expect(thermocouple(100)).toBeCloseTo(4.1, 9);
  });
  it("mercury column is linear and clamps outside its scale", () => {
    expect(mercury(-10)).toBe(0); expect(mercury(360)).toBeCloseTo(200, 9); expect(mercury(500)).toBeCloseTo(200, 9);
  });
});

describe("two-stroke engine", () => {
  it("piston at TDC and BDC; port timing is symmetric about BDC", () => {
    expect(pistonFrac(0)).toBeCloseTo(0, 12); expect(pistonFrac(180)).toBeCloseTo(1, 12);
    expect(portOpens(0)).toBeCloseTo(180, 4); expect(portOpens(1)).toBeCloseTo(0, 4);
    const e = twoStroke(60, 60, 3000, 5, 30, 20); expect(e.eo + e.ec).toBeCloseTo(360, 9); expect(e.eo).toBeLessThan(e.to);
  });
  it("IP = pm L A n /60 with n = N for a two-stroke — twice the four-stroke value", () => {
    const e = twoStroke(60, 60, 3000, 5, 30, 20);
    expect(e.ip2).toBeCloseTo(5e5 * 0.06 * (Math.PI / 4) * 0.06 ** 2 * 3000 / 60, 6);
    expect(e.ip2 / e.ip4).toBeCloseTo(2, 12); expect(e.Vs).toBeCloseTo(169.65, 2);
  });
  it("phase names follow the port events", () => {
    const e = twoStroke(60, 60, 3000, 5, 30, 20);
    expect(twoStrokePhase(180, e.eo, e.to)).toMatch(/Scavenging/); expect(twoStrokePhase(90, e.eo, e.to)).toMatch(/Power/); expect(twoStrokePhase(300, e.eo, e.to)).toMatch(/Compression/);
  });
});

describe("centrifugal pump", () => {
  it("R.K. Bansal: D 200/400 mm, 1200 rpm, vanes 20°/30° → work 44.1 N·m per N", () => {
    const p = centriPump(1200, 200, 400, 20, 20, 30);
    expect(p.u2).toBeCloseTo(25.13, 2); expect(p.Vf).toBeCloseTo(4.574, 3); expect(p.H).toBeCloseTo(44.1, 1);
  });
  it("radial vanes (β₂ = 90°) give V_w2 = u₂ and H = u₂²/g", () => {
    const p = centriPump(1500, 100, 300, 20, 20, 90);
    expect(p.Vw2).toBeCloseTo(p.u2, 9); expect(p.H).toBeCloseTo(p.u2 ** 2 / 9.81, 9);
  });
  it("head ∝ N² and Q = πD₂b₂V_f", () => {
    const a = centriPump(1000, 150, 300, 20, 25, 30), b = centriPump(2000, 150, 300, 20, 25, 30);
    expect(b.H / a.H).toBeCloseTo(4, 9); expect(a.Q).toBeCloseTo(Math.PI * 0.3 * 0.02 * a.Vf, 12);
  });
});
