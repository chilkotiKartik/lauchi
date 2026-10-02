import { describe, expect, it } from "vitest";
import { diesel, dieselEfficiency, G, heatDevice, incline, MATERIALS, moi, ottoEfficiency, prng, sci, stressAt, tensile, tensileCurve, tensileRegion, venturi } from "./mech";

describe("incline", () => {
  it("angle of repose for μs = 0.577 is 30°", () => expect(incline(10, 1, 0.577, 0.5, 0).repose).toBeCloseTo(30, 1));
  it("normal force and slope component", () => {
    const r = incline(30, 10, 0.5, 0.4, 0);
    expect(r.N).toBeCloseTo(10 * G * Math.cos(Math.PI / 6), 6);
    expect(r.down).toBeCloseTo(10 * G * 0.5, 6);
  });
  it("stays put below the repose angle, with friction equal to mg sin θ", () => {
    const r = incline(20, 10, 0.5, 0.4, 0);
    expect(r.state).toBe("rest"); expect(r.a).toBe(0);
    expect(r.friction).toBeCloseTo(r.down, 9);
  });
  it("slides down above repose: a = g(sin θ − μk cos θ)", () => {
    const r = incline(40, 5, 0.5, 0.3, 0);
    expect(r.state).toBe("down");
    expect(r.a).toBeCloseTo(-G * (Math.sin((40 * Math.PI) / 180) - 0.3 * Math.cos((40 * Math.PI) / 180)), 6);
  });
  it("frictionless slope: a = g sin θ, independent of mass", () => {
    expect(incline(30, 2, 0, 0, 0).a).toBeCloseTo(-G / 2, 9);
    expect(incline(30, 50, 0, 0, 0).a).toBeCloseTo(-G / 2, 9);
  });
  it("a big enough push drives it up the slope", () => {
    const r = incline(20, 10, 0.5, 0.4, 100);
    expect(r.state).toBe("up");
    expect(r.a).toBeCloseTo((100 - r.down - 0.4 * r.N) / 10, 9);
  });
  it("kinetic friction is capped at the static coefficient", () => expect(incline(45, 1, 0.3, 0.9, 0).muKUsed).toBe(0.3));
});

describe("area moment of inertia", () => {
  it("rectangle 100 × 200 mm: I = bd³/12 = 6.667e7 mm⁴", () => {
    const r = moi("rect", 100, 200, 10, 10, 0);
    expect(r.Ix).toBeCloseTo(6.6667e7, -3); expect(r.A).toBe(20000); expect(r.ybar).toBe(100);
    expect(r.k).toBeCloseTo(200 / Math.sqrt(12), 6);
  });
  it("parallel-axis theorem: I + Ah²", () => {
    const r = moi("rect", 100, 200, 10, 10, 100);
    expect(r.Ishift).toBeCloseTo(6.6667e7 + 20000 * 100 * 100, -3);
  });
  it("solid circle: πd⁴/64, polar = πd⁴/32", () => {
    const r = moi("circle", 0, 100, 0, 0, 0);
    expect(r.Ix).toBeCloseTo((Math.PI * 1e8) / 64, 3); expect(r.J).toBeCloseTo((Math.PI * 1e8) / 32, 3);
  });
  it("hollow circle: π(D⁴ − d⁴)/64", () => {
    const r = moi("hollow", 0, 100, 10, 0, 0);
    expect(r.di).toBe(80); expect(r.Ix).toBeCloseTo((Math.PI * (1e8 - 80 ** 4)) / 64, 3);
  });
  it("I-section 100 × 200, tf 10, tw 6", () => {
    const r = moi("isec", 100, 200, 10, 6, 0);
    expect(r.A).toBe(2 * 1000 + 6 * 180);
    expect(r.Ix).toBeCloseTo((100 * 200 ** 3 - 94 * 180 ** 3) / 12, 3);
  });
  it("I- and T-sections with a full-width web are rectangles", () => {
    const rect = moi("rect", 80, 150, 0, 0, 0);
    expect(moi("isec", 80, 150, 20, 80, 0).Ix).toBeCloseTo(rect.Ix, 3);
    expect(moi("tsec", 80, 150, 20, 80, 0).Ix).toBeCloseTo(rect.Ix, 3);
    expect(moi("tsec", 80, 150, 20, 80, 0).ybar).toBeCloseTo(75, 9);
  });
  it("T-section centroid", () => expect(moi("tsec", 100, 120, 20, 20, 0).ybar).toBeCloseTo(80, 9));
});

describe("tensile test", () => {
  it("elastic region follows Hooke's law σ = Eε", () => {
    expect(stressAt("steel", 0.001)).toBeCloseTo(200, 6);
    expect(tensileRegion("steel", 0.001)).toBe("elastic");
  });
  it("peak engineering stress equals the UTS at the start of necking", () => {
    for (const m of ["steel", "al", "cu", "ci"] as const) {
      const M = MATERIALS[m];
      expect(stressAt(m, M.eu)).toBeCloseTo(M.su, 6);
      expect(Math.max(...tensileCurve(m).map((p) => p[1]))).toBeCloseTo(M.su, 0);
    }
  });
  it("mild steel has a yield plateau, then necking, then fracture", () => {
    expect(stressAt("steel", 0.01)).toBe(250);
    expect(tensileRegion("steel", 0.22)).toBe("necking");
    expect(stressAt("steel", 0.22)).toBeLessThan(410);
    expect(tensile("steel", 30, 50, 10).fractured).toBe(true);
    expect(stressAt("steel", 0.3)).toBe(0);
  });
  it("cast iron is brittle: breaks below 1% strain", () => {
    expect(MATERIALS.ci.brittle).toBe(true);
    expect(tensile("ci", 1, 50, 10).region).toBe("fractured");
  });
  it("force = σA₀ and ΔL = εL₀", () => {
    const t = tensile("steel", 1, 50, 10);
    expect(t.F).toBeCloseTo(250 * (Math.PI * 100) / 4, 6);
    expect(t.dL).toBeCloseTo(0.5, 9);
  });
});

describe("venturi meter", () => {
  it("continuity A₁v₁ = A₂v₂ = Q", () => {
    const v = venturi(10, 100, 50, 0.98);
    expect(v.A1 * v.v1).toBeCloseTo(0.01, 12); expect(v.A2 * v.v2).toBeCloseTo(0.01, 12);
    expect(v.v2 / v.v1).toBeCloseTo(4, 9);
  });
  it("Bernoulli pressure drop and mercury manometer", () => {
    const v = venturi(10, 100, 50, 1);
    expect(v.dpIdeal).toBeCloseTo(500 * (v.v2 ** 2 - v.v1 ** 2), 6);
    expect(v.dp).toBeCloseTo(v.dpIdeal, 9);
    expect(v.hm).toBeCloseTo(v.dp / (12600 * G), 9);
    expect(v.hm).toBeGreaterThan(0.09); expect(v.hm).toBeLessThan(0.11);
  });
  it("C_d < 1 needs a larger pressure drop for the same flow", () => {
    expect(venturi(10, 100, 50, 0.95).dp).toBeCloseTo(venturi(10, 100, 50, 1).dp / 0.95 ** 2, 6);
  });
  it("Reynolds number at the throat", () => {
    const v = venturi(10, 100, 50, 1);
    expect(v.Re).toBeCloseTo(v.v2 * 0.05 / 1e-6, 3);
  });
});

describe("heat engines", () => {
  it("Carnot engine 600 K / 300 K = 50%", () => {
    const r = heatDevice("engine", 600, 300, 100, 1);
    expect(r.valid && r.limit).toBeCloseTo(0.5, 12);
    expect(r.valid && r.dS).toBeCloseTo(0, 9);
  });
  it("Carnot refrigerator 300 K / 250 K: COP = 5; heat pump COP = 6", () => {
    const f = heatDevice("fridge", 300, 250, 1, 1), p = heatDevice("pump", 300, 250, 1, 1);
    expect(f.valid && f.limit).toBeCloseTo(5, 12);
    expect(p.valid && p.limit).toBeCloseTo(6, 12);
  });
  it("energy balance Q_H = W + Q_C and the second law ΔS ≥ 0", () => {
    for (const dev of ["engine", "fridge", "pump"] as const) for (const frac of [0.2, 0.6, 1]) {
      const r = heatDevice(dev, 500, 280, 50, frac);
      if (!r.valid) throw new Error("invalid");
      expect(r.QH).toBeCloseTo(r.W + r.QC, 9);
      expect(r.dS).toBeGreaterThanOrEqual(-1e-9);
      if (frac < 1) expect(r.dS).toBeGreaterThan(0);
    }
  });
  it("T_C ≥ T_H is rejected", () => expect(heatDevice("engine", 300, 300, 10, 0.5).valid).toBe(false));
});

describe("Diesel cycle", () => {
  it("r = 18, ρ = 2, γ = 1.4 → 63.2%", () => {
    expect(dieselEfficiency(18, 2, 1.4)).toBeCloseTo(0.632, 3);
    expect(diesel(18, 2, 1.4).eff).toBeCloseTo(dieselEfficiency(18, 2, 1.4), 9);
  });
  it("is less efficient than Otto at the same r", () => {
    for (const rho of [1.2, 2, 3.5]) expect(dieselEfficiency(16, rho, 1.4)).toBeLessThan(ottoEfficiency(16, 1.4));
  });
  it("tends to Otto as the cut-off ratio → 1", () => expect(dieselEfficiency(18, 1.0001, 1.4)).toBeCloseTo(ottoEfficiency(18, 1.4), 4));
  it("net work = efficiency × heat in; MEP = W/(V₁ − V₂)", () => {
    const d = diesel(20, 2.5, 1.4);
    expect(d.work).toBeCloseTo(d.formula * d.heatIn, 9);
    expect(d.mep).toBeCloseTo((d.work * 20) / 19, 9);
    expect(d.ottoWork).toBeGreaterThan(d.work);
  });
});

describe("helpers", () => {
  it("formats scientific numbers", () => {
    expect(sci(66666666.7)).toBe("6.667 × 10⁷");
    expect(sci(12.5)).toBe("12.5");
    expect(sci(0.00012)).toBe("1.200 × 10⁻⁴");
  });
  it("seeded PRNG is deterministic and in [0, 1)", () => {
    const a = prng(7), b = prng(7);
    for (let i = 0; i < 100; i++) { const x = a(); expect(x).toBe(b()); expect(x).toBeGreaterThanOrEqual(0); expect(x).toBeLessThan(1); }
  });
});
