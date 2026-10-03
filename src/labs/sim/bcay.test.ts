import { describe, expect, it } from "vitest";
import { computeHardwareBusMetrics, simulateCMemory, simulateSDLC } from "./bcay";

describe("BCA-Y 3D Simulation Engines", () => {
  it("simulates C pointer, array, malloc and double pointer layouts", () => {
    const p = simulateCMemory("pointer", 42);
    expect(p).toHaveLength(2);
    expect(p[0].value).toBe(42);
    expect(p[1].isPointer).toBe(true);

    const arr = simulateCMemory("array", 10);
    expect(arr).toHaveLength(4);
    expect(arr[0].value).toBe(10);
    expect(arr[3].value).toBe(40);

    const m = simulateCMemory("malloc", 5);
    expect(m[1].segment).toBe("heap");

    const d = simulateCMemory("double", 20);
    expect(d).toHaveLength(3);
    expect(d[2].pointsTo).toBe(0x7ffd04);
  });

  it("calculates motherboard bus bandwidth and clock times", () => {
    const ddr4 = computeHardwareBusMetrics(3.6, 4, 16);
    expect(ddr4.ramBandwidthGbs).toBe(25.6);
    expect(ddr4.pcieBandwidthGbs).toBeGreaterThan(30);

    const ddr5 = computeHardwareBusMetrics(5.0, 5, 16);
    expect(ddr5.ramBandwidthGbs).toBe(51.2);
  });

  it("evaluates SDLC Waterfall, Spiral and Agile sprint states", () => {
    const wf = simulateSDLC("waterfall", 2);
    expect(wf.currentPhase).toBe("Implementation");

    const agile = simulateSDLC("agile", 3);
    expect(agile.currentPhase).toContain("Sprint 3");
    expect(agile.progressPct).toBe(75);
  });
});
