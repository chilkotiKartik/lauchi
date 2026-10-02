import { describe, expect, it } from "vitest";
import { doubletProfile, gratingI, laser, led, mixEfficiency, nmHex, polarimeter, rayleigh, solarCell } from "./phyx";

describe("grating resolution", () => {
  it("principal maxima have unit intensity and N−1 zeros between them", () => {
    expect(gratingI(0, 589, 2000, 10)).toBeCloseTo(1, 6);
    expect(gratingI(589 / 2000, 589, 2000, 10)).toBeCloseTo(1, 6);
    expect(gratingI(589 / (10 * 2000), 589, 2000, 10)).toBeCloseTo(0, 6); // first zero at Δ(sin θ) = λ/(Nd)
  });
  it("sodium D lines need R ≈ 982; 1000 lines in first order resolve them", () => {
    const r = rayleigh(589, 0.6, 500, 1000, 1);
    expect(r.needed).toBeCloseTo(981.7, 0);
    expect(r.have).toBe(1000);
    expect(r.status).toMatch(/resolved/);
    expect(rayleigh(589, 0.6, 500, 400, 1).status).toBe("not resolved");
    expect(rayleigh(589, 0.6, 500, 400, 3).have).toBe(1200);
  });
  it("orders beyond d/λ do not form", () => { expect(rayleigh(600, 1, 1200, 100, 2).visible).toBe(false); });
  it("profile is normalised", () => { const p = doubletProfile(589, 0.6, 2000, 1000, 1); expect(Math.max(...p.map((x) => x[1]))).toBeLessThanOrEqual(1.0001); });
});

describe("He–Ne laser model", () => {
  it("mixing is best near 7:1", () => { expect(mixEfficiency(7)).toBe(1); expect(mixEfficiency(1)).toBeLessThan(0.3); });
  it("threshold follows (1/2L) ln(1/R1R2) and longer cavities have closer modes", () => {
    const a = laser(5, 7, 30, 99);
    expect(a.gth).toBeCloseTo(Math.log(1 / (0.999 * 0.99)) / 0.6 + 0.005, 6);
    expect(a.lasing).toBe(true);
    expect(a.fsrMHz).toBeCloseTo(499.7, 0);
    expect(laser(5, 7, 100, 99).fsrMHz).toBeCloseTo(149.9, 0);
    expect(a.photonEv).toBeCloseTo(1.959, 2);
  });
  it("too much output coupling or no current: no lasing", () => {
    expect(laser(5, 7, 15, 90).lasing).toBe(false);
    expect(laser(0, 7, 30, 99).out).toBe(0);
  });
});

describe("polarimeter", () => {
  it("θ = S l c: 10 % sucrose in a 20 cm tube rotates 13.3°", () => {
    const p = polarimeter("sucrose", 10, 20, 0);
    expect(p.theta).toBeCloseTo(13.3, 6);
    expect(p.matchDeg).toBeCloseTo(103.3, 6);
  });
  it("at the match setting both halves are equally dark", () => {
    const p = polarimeter("glucose", 15, 20, 0);
    const q = polarimeter("glucose", 15, 20, p.matchDeg);
    expect(Math.abs(q.left - q.right)).toBeLessThan(1e-9);
    expect(q.balanced).toBe(true);
    expect(polarimeter("fructose", 10, 10, 0).theta).toBeLessThan(0); // laevorotatory
  });
});

describe("solar cell and LED", () => {
  it("a 100 cm² silicon cell gives ~3.5 A and ~0.6–0.7 V at 1 sun", () => {
    const c = solarCell(1000, 100, 300, 0.15);
    expect(c.Isc).toBeCloseTo(3.5, 3);
    expect(c.Voc).toBeGreaterThan(0.55); expect(c.Voc).toBeLessThan(0.75);
    expect(c.FF).toBeGreaterThan(0.7); expect(c.FF).toBeLessThan(0.86);
    expect(c.eff).toBeGreaterThan(12); expect(c.eff).toBeLessThan(22);
    expect(c.Iop).toBeCloseTo(c.Vop / 0.15, 3);
  });
  it("heat lowers Voc, darkness gives nothing", () => {
    expect(solarCell(1000, 100, 340, 1).Voc).toBeLessThan(solarCell(1000, 100, 300, 1).Voc);
    expect(solarCell(0, 100, 300, 1).Pm).toBe(0);
  });
  it("LED colour follows λ = 1240/E_g", () => {
    expect(led("gaasp", 2).lambda).toBeCloseTo(652.5, 0);
    expect(led("gap", 1.5).on).toBe(false);
    expect(led("gap", 2.4).on).toBe(true);
    expect(nmHex(650)).toBe("#ff0000");
  });
});
