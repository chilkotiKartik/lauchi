import { describe, expect, it } from "vitest";
import { battery, dcMachine, earthFault, etaAt, grid, inductionTorque, meter, multiplier, pipeEarth, plateEarth, shunt, torqueSlip, transformerTest, transient, twoWattmeter } from "./elecx";

describe("transients", () => {
  it("RC reaches 63.2 % at one time constant", () => {
    const r = transient("rc", 10, 1000, 100, 0, 100);
    expect(r.tau).toBeCloseTo(0.1, 9); expect(r.vX).toBeCloseTo(6.321, 3); expect(r.pct).toBeCloseTo(63.2, 1);
  });
  it("RL current rises to V/R", () => { const r = transient("rl", 12, 6, 0, 600, 1000); expect(r.tau).toBeCloseTo(0.1, 9); expect(r.i).toBeCloseTo(2, 3); });
});

describe("two-wattmeter method", () => {
  it("upf: equal readings; 60° lag: W2 = 0; pf from readings", () => {
    const a = twoWattmeter(400, 10, 0); expect(a.W1).toBeCloseTo(a.W2, 9); expect(a.P).toBeCloseTo(Math.sqrt(3) * 4, 6);
    expect(twoWattmeter(400, 10, 60).W2).toBeCloseTo(0, 9);
    expect(twoWattmeter(400, 10, 75).negative).toBe(true);
    const b = twoWattmeter(415, 20, 36.87); expect(b.phiBack).toBeCloseTo(36.87, 6);
  });
});

describe("transformer", () => {
  it("max efficiency where Cu loss = iron loss", () => {
    const t = transformerTest(10, 0.25, 1, 1, 1, 2, 4, false);
    expect(t.xMax).toBeCloseTo(0.5, 9);
    expect(etaAt(0.5, 10, 0.25, 1, 1)).toBeGreaterThan(etaAt(0.4, 10, 0.25, 1, 1));
    expect(etaAt(0.5, 10, 0.25, 1, 1)).toBeGreaterThan(etaAt(0.6, 10, 0.25, 1, 1));
    expect(transformerTest(10, 0.2, 0.3, 1, 0.8, 2, 4, false).reg).toBeCloseTo(2 * 0.8 + 4 * 0.6, 9);
  });
});

describe("meters", () => {
  it("PMMC reads zero on AC; MI is square-law", () => {
    expect(meter("pmmc", 10, 20, true).defl).toBe(0);
    expect(meter("pmmc", 10, 20, false).defl).toBeCloseTo(45, 9);
    expect(meter("mi", 10, 20, true).defl).toBeCloseTo(22.5, 9);
    expect(meter("mi", -10, 20, false).defl).toBeCloseTo(22.5, 9);
  });
  it("shunt and multiplier", () => {
    expect(shunt(10, 10, 1)).toBeCloseTo(0.10101, 4);
    expect(multiplier(100, 1, 10)).toBeCloseTo(9900, 6);
  });
});

describe("DC machine", () => {
  it("E = PΦZN/60A and motor speed from back EMF", () => {
    expect(dcMachine("gen", 4, 480, 25, false, 1000, 0, 0.5, 0).E).toBeCloseTo(400, 6);
    expect(dcMachine("gen", 4, 480, 25, true, 1000, 0, 0.5, 0).E).toBeCloseTo(200, 6);
    const m = dcMachine("motor", 4, 480, 25, true, 0, 220, 0.5, 40);
    expect(m.E).toBeCloseTo(200, 6); expect(m.N).toBeCloseTo(1000, 6);
  });
});

describe("induction motor", () => {
  it("max torque at s = R2/X2, independent of R2 in size", () => {
    const a = torqueSlip(100, 0.2, 1, 50, 4, 10), b = torqueSlip(100, 0.4, 1, 50, 4, 10);
    expect(a.sm).toBeCloseTo(0.2, 9); expect(a.Tmax).toBeCloseTo(b.Tmax, 6);
    expect(inductionTorque(a.s!, 230, 0.2, 1, 50, 4)).toBeCloseTo(10, 4);
    expect(a.Ns).toBe(1500);
    expect(torqueSlip(100, 0.2, 1, 50, 4, 1e6).stalls).toBe(true);
    expect(torqueSlip(50, 0.2, 1, 50, 4, 1).Tmax).toBeCloseTo(a.Tmax / 4, 6); // T ∝ V²
  });
});

describe("grid, earthing, battery", () => {
  it("doubling voltage quarters the loss", () => { expect(grid(100, 220, 100, 0.1, 0.9).lossMW / grid(100, 440, 100, 0.1, 0.9).lossMW).toBeCloseTo(4, 6); });
  it("pipe and plate earth resistance", () => {
    expect(pipeEarth(100, 3, 38)).toBeCloseTo((100 / (2 * Math.PI * 3)) * Math.log(12 / 0.038), 6);
    expect(plateEarth(100, 0.6)).toBeCloseTo(25 * Math.sqrt(Math.PI / 0.36), 6);
    expect(earthFault(1).trips).toBe(true);
    expect(earthFault(50).trips).toBe(false);
  });
  it("battery lasts longer at low current (Peukert)", () => {
    expect(battery(100, 5, 100).hours).toBeCloseTo(20, 6);
    expect(battery(100, 10, 100).hours).toBeLessThan(10);
    expect(battery(100, 5, 50).sg).toBeCloseTo(1.2, 6);
  });
});
