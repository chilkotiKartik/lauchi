import { describe, expect, it } from "vitest";
import * as G from "./gfx";

describe("scales", () => {
  it("multiplies by the representative fraction", () => { expect(G.scaleFit(2400, "s1_10", "a4").drawn).toBeCloseTo(240, 9); expect(G.scaleFit(50, "s5_1", "a3").drawn).toBe(250); });
  it("checks the sheet with a 10 mm border", () => { expect(G.scaleFit(2400, "s1_5", "a4").fits).toBe(false); expect(G.scaleFit(2400, "s1_10", "a4").fits).toBe(true); expect(G.scaleFit(1, "s1_1", "a2").usable).toBe(574); });
  it("finds the largest standard scale that fits", () => { expect(G.scaleFit(2400, "s1_1", "a4").bestText).toBe("1:10"); expect(G.scaleFit(100, "s1_1", "a4").bestText).toBe("2:1"); expect(G.scaleFit(50, "s1_1", "a4").bestText).toBe("5:1"); });
});
describe("line projections", () => {
  it("3-4-5 triangle", () => { const p = G.lineProjection(30, 10, 20, 50, 20); expect(p.tl).toBeCloseTo(50, 9); expect(p.theta).toBeCloseTo(53.13, 2); expect(p.phi).toBe(0); expect(p.tv).toBe(30); expect(p.fv).toBeCloseTo(50, 9); });
  it("a line in the HP", () => { const p = G.lineProjection(40, 0, 10, 0, 40); expect(p.theta).toBe(0); expect(p.phi).toBeCloseTo(Math.atan(30 / 40) * 180 / Math.PI, 9); });
  it("true length ≥ both apparent lengths", () => { const p = G.lineProjection(25, 5, 60, 45, 10); expect(p.tl).toBeGreaterThanOrEqual(Math.max(p.fv, p.tv)); });
});
describe("isometric", () => {
  it("all three edges shrink to 0.8165 at 45°, 35.264°", () => { for (const r of G.foreshortening(45, G.ISO_EL)) expect(r).toBeCloseTo(G.ISO_SCALE, 4); expect(G.ISO_SCALE).toBeCloseTo(0.8165, 4); expect(G.ISO_EL).toBeCloseTo(35.264, 3); });
  it("front view shows two edges true and one as a point", () => { const f = G.foreshortening(0, 0); expect(f[0]).toBeCloseTo(1, 9); expect(f[1]).toBeCloseTo(1, 9); expect(f[2]).toBeCloseTo(0, 9); });
  it("top view", () => { const f = G.foreshortening(0, 90); expect(f[1]).toBeCloseTo(0, 9); expect(f[0]).toBeCloseTo(1, 9); });
});
describe("cylinder section", () => {
  it("flat cut is a circle of area πr²", () => { const s = G.cylinderSection(20, 100, 0); expect(s.shape).toBe("circle"); expect(s.area).toBeCloseTo(Math.PI * 400, 6); });
  it("inclined cut is an ellipse of area πr²/cos α", () => { const s = G.cylinderSection(20, 200, 45); expect(s.shape).toBe("ellipse"); expect(s.area).toBeCloseTo((Math.PI * 400) / Math.cos(Math.PI / 4), 6); expect(s.semiMajor).toBeCloseTo(20 / Math.cos(Math.PI / 4), 9); });
  it("steep cut leaves through the ends", () => { const s = G.cylinderSection(20, 40, 60); expect(s.shape).toBe("part of an ellipse"); expect(s.area).toBeLessThan((Math.PI * 400) / Math.cos(Math.PI / 3)); expect(s.xm).toBeCloseTo(20 / Math.tan(Math.PI / 3), 9); });
  it("nearly vertical cut approaches a rectangle 2r × h", () => { const s = G.cylinderSection(20, 100, 89.99); expect(s.area).toBeCloseTo(40 * 100, -1); });
});
describe("polar path", () => {
  it("a 100 × 60 rectangle", () => {
    const p = G.polarPath([[100, 0], [60, 90], [100, 180]]);
    expect(p.pts[1][0]).toBeCloseTo(100, 9); expect(p.pts[2][1]).toBeCloseTo(60, 9); expect(p.pts[3][0]).toBeCloseTo(0, 9);
    expect(p.back).toBeCloseTo(60, 9); expect(p.closeAngle).toBeCloseTo(270, 6); expect(p.area).toBeCloseTo(6000, 6); expect(p.perimeter).toBeCloseTo(320, 6);
  });
  it("closing a 3-4-5 triangle", () => { const p = G.polarPath([[30, 0], [40, 90]]); expect(p.back).toBeCloseTo(50, 9); expect(p.area).toBeCloseTo(600, 6); });
});
