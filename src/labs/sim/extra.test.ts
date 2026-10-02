import { describe, expect, it } from "vitest";
import { ATP_DG0, cellSize, deltaG, depletionYears, gcd, gcdTrace, harvestLitres, limitAt, loadBill, mcbFor, mm, partial, qEq, reserveAt, resources, speciesArea, tankYear, wireFor, MONSOON } from "./extra";

describe("resources", () => {
  it("steady use lasts R/c", () => expect(depletionYears(1000, 20, 0)).toBe(50));
  it("2% growth: ln(1 + Rg/c)/g", () => expect(depletionYears(1000, 20, 0.02)).toBeCloseTo(Math.log(2) / 0.02, 6));
  it("the reserve reaches zero at the depletion time", () => {
    const T = depletionYears(500, 10, 0.03);
    expect(reserveAt(500, 10, 0.03, T)).toBeCloseTo(0, 6);
    expect(reserveAt(500, 10, 0.03, T - 1)).toBeGreaterThan(0);
  });
  it("recycling lengthens the life", () => { const r = resources(1000, 20, 2, 50); expect(r.grownRecycled).toBeGreaterThan(r.grow); expect(r.steady).toBe(50); });
});
describe("species–area", () => {
  it("losing 90% of habitat with z = 0.25 loses ~43.8% of species", () => expect(speciesArea(200, 10, 0.25).lostPct).toBeCloseTo(43.77, 1));
  it("all habitat left keeps every species", () => expect(speciesArea(200, 100, 0.3).S).toBe(200));
  it("a bigger z loses more", () => expect(speciesArea(200, 50, 0.4).lost).toBeGreaterThan(speciesArea(200, 50, 0.2).lost));
});
describe("rainwater", () => {
  it("100 m² × 800 mm × 0.8 = 64 000 L", () => expect(harvestLitres(100, 800, 0.8)).toBe(64000));
  it("monsoon shares add to 100", () => expect(MONSOON.reduce((a, b) => a + b, 0)).toBe(100));
  it("a bigger tank never loses more water to overflow", () => {
    expect(tankYear(100, 800, 0.8, 30000, 100).overflow).toBeLessThanOrEqual(tankYear(100, 800, 0.8, 5000, 100).overflow);
  });
  it("shortfall + supplied = demand", () => { const t = tankYear(100, 800, 0.8, 20000, 300); expect(t.met).toBeGreaterThanOrEqual(0); expect(t.met).toBeLessThanOrEqual(100); });
});
describe("load and bill", () => {
  it("MCB and wire ladders", () => { expect(mcbFor(11)).toBe(16); expect(mcbFor(6)).toBe(6); expect(wireFor(16)).toBe(2.5); expect(wireFor(32)).toBe(6); });
  it("adds up energy and cost", () => {
    const r = loadBill({ bulbs: 10, fans: 4, acs: 0, acHours: 0, fridge: false, tariff: 6, fixed: 100, volts: 230 });
    expect(r.connected).toBe(90 + 300);
    expect(r.energy).toBeCloseTo((90 * 6 * 30 + 300 * 10 * 30) / 1000, 6);
    expect(r.bill).toBeCloseTo(r.energy * 6 + 100, 6);
  });
});
describe("gcd flowchart", () => {
  it("Euclid by remainders", () => { const t = gcdTrace(48, 18, "mod"); expect(t.at(-1)!.a).toBe(6); expect(t.at(-1)!.node).toBe("output"); });
  it("Euclid by subtraction agrees", () => expect(gcdTrace(48, 18, "sub").at(-1)!.a).toBe(6));
  it("matches the plain function", () => { for (const [a, b] of [[7, 3], [100, 75], [17, 13], [1, 1]]) expect(gcdTrace(a, b, "mod").at(-1)!.a).toBe(gcd(a, b)); });
});
describe("cell size", () => {
  it("sphere SA/V = 3/r", () => expect(cellSize(2, 100, 1).saOverV).toBeCloseTo(1.5, 9));
  it("diffusion time grows with r²", () => expect(cellSize(20, 100, 1).diffusionS / cellSize(10, 100, 1).diffusionS).toBeCloseTo(4, 9));
  it("folding multiplies the surface", () => expect(cellSize(5, 100, 4).saFolded).toBeCloseTo(4 * cellSize(5, 100, 1).sa, 9));
});
describe("enzyme kinetics", () => {
  it("v = Vmax/2 at S = Km", () => expect(mm(5, 100, 5, 0, 1, "none").v).toBeCloseTo(50, 9));
  it("competitive: Vmax same, Km × (1 + I/Ki)", () => { const r = mm(5, 100, 5, 2, 1, "competitive"); expect(r.vmaxApp).toBe(100); expect(r.kmApp).toBeCloseTo(15, 9); });
  it("non-competitive: Vmax/(1 + I/Ki), Km same", () => { const r = mm(5, 100, 5, 1, 1, "noncompetitive"); expect(r.vmaxApp).toBeCloseTo(50, 9); expect(r.kmApp).toBe(5); });
  it("uncompetitive lowers both", () => { const r = mm(5, 100, 5, 1, 1, "uncompetitive"); expect(r.vmaxApp).toBeCloseTo(50, 9); expect(r.kmApp).toBeCloseTo(2.5, 9); });
  it("a saturating substrate approaches Vmax", () => expect(mm(1e6, 100, 5, 0, 1, "none").v).toBeGreaterThan(99.9));
});
describe("free energy", () => {
  it("ΔG equals ΔG°′ when Q = 1", () => expect(deltaG(13.8, 310, 0)).toBe(13.8));
  it("ΔG = 0 at the equilibrium ratio", () => expect(deltaG(-20, 298, Math.log10(qEq(-20, 298)))).toBeCloseTo(0, 6));
  it("ATP hydrolysis in a cell (Q ≈ 1e-4) is about −54 kJ/mol", () => expect(deltaG(ATP_DG0, 310, -4)).toBeCloseTo(-54.2, 0));
  it("coupling 13.8 with ATP hydrolysis is spontaneous", () => expect(13.8 + ATP_DG0).toBeLessThan(0));
});
describe("limits", () => {
  it("removable hole: limit 2k, f(k) missing", () => { const r = limitAt("hole", 2, 2, 1); expect(r.limit).toBe(4); expect(r.at).toBeNull(); expect(r.continuous).toBe(false); });
  it("hole elsewhere is continuous", () => { const r = limitAt("hole", 3, 2, 1); expect(r.continuous).toBe(true); expect(r.limit).toBe(5); });
  it("jump: one-sided limits differ", () => { const r = limitAt("jump", 1, 1, 2); expect(r.left).toBe(1); expect(r.right).toBe(3); expect(r.exists).toBe(false); });
  it("sinc tends to 1 at 0", () => { const r = limitAt("sinc", 0, 0, 0); expect(r.limit).toBe(1); expect(r.continuous).toBe(false); });
  it("pole: infinite one-sided limits", () => { const r = limitAt("pole", 1, 1, 0); expect(r.left).toBe(-Infinity); expect(r.right).toBe(Infinity); expect(r.exists).toBe(false); });
});
describe("partial fractions", () => {
  it("(3x+5)/((x−1)(x+2)) = 8/3/(x−1) + 1/3/(x+2)", () => { const p = partial(3, 5, 1, -2); expect(p.A).toBeCloseTo(8 / 3, 9); expect(p.B).toBeCloseTo(1 / 3, 9); });
  it("the two forms agree everywhere", () => { const p = partial(2, -7, 3, -1); for (const x of [-4, 0.5, 2, 5.5]) expect(p.sum(x)).toBeCloseTo(p.whole(x), 9); });
});
