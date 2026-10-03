import { describe, expect, it } from "vitest";
import { burndown, busMetrics, cMemory, HEAP, leBytes, linkWidth, ownerOf, RBP, sdlc, STACK_WINDOW } from "./bcay";

describe("C memory model", () => {
  it("stores ints little-endian and pointers as 8-byte addresses", () => {
    expect(leBytes(0x12345678, 4)).toEqual([0x78, 0x56, 0x34, 0x12]);
    expect(leBytes(HEAP, 8).slice(4)).toEqual([0x55, 0x55, 0, 0]); // 0x5555_5555_92a0 needs more than 32 bits
    const m = cMemory("pointer", 42);
    const [x, p] = m.vars;
    expect(x.size).toBe(4);
    expect(p.size).toBe(8);
    expect(p.pointsTo).toBe(x.addr);
    expect(m.exprValue).toBe(42);
  });
  it("aligns every variable to its own size and keeps the stack inside the frame", () => {
    for (const mode of ["pointer", "double", "array", "malloc"] as const) {
      for (const v of cMemory(mode, 7, 2).vars) {
        expect(v.addr % v.size, `${mode} ${v.name}`).toBe(0);
        if (v.seg === "stack") { expect(v.addr).toBeGreaterThanOrEqual(STACK_WINDOW[0]); expect(v.addr + v.size).toBeLessThanOrEqual(RBP); }
      }
    }
  });
  it("never overlaps two variables", () => {
    for (const mode of ["pointer", "double", "array", "malloc"] as const) {
      const vs = cMemory(mode, 5, 3).vars;
      for (const a of vs) for (const b of vs) if (a !== b) expect(a.addr + a.size <= b.addr || b.addr + b.size <= a.addr).toBe(true);
    }
  });
  it("pointer arithmetic moves by sizeof(int) per element", () => {
    const m = cMemory("array", 10, 3);
    const base = m.vars[0].addr;
    expect(m.exprAddr - base).toBe(12);
    expect(m.exprValue).toBe(40);
    expect(ownerOf(m.vars, m.exprAddr)?.name).toBe("arr[3]");
  });
  it("double pointer: pp → p → v", () => {
    const m = cMemory("double", 20);
    const [v, p, pp] = m.vars;
    expect(pp.pointsTo).toBe(p.addr);
    expect(p.pointsTo).toBe(v.addr);
    expect(m.exprValue).toBe(20);
  });
  it("malloc: pointer on the stack, block on the heap after an 8-byte size header (0x21 = 32 B chunk, in use)", () => {
    const m = cMemory("malloc", 5, 1);
    expect(m.vars[0].seg).toBe("stack");
    expect(m.vars[0].pointsTo).toBe(HEAP);
    const header = m.vars.find((v) => v.header)!;
    expect(header.addr).toBe(HEAP - 8);
    expect(header.bytes[0]).toBe(0x21);
    expect(m.exprValue).toBe(10);
  });
});

describe("motherboard buses", () => {
  it("DDR bandwidth = transfers/s × 8 bytes × channels", () => {
    expect(busMetrics(3.6, "4", 1, "4", 16).ramGBs).toBeCloseTo(25.6);
    expect(busMetrics(3.6, "4", 2, "4", 16).ramGBs).toBeCloseTo(51.2);
    expect(busMetrics(3.6, "5", 2, "4", 16).ramGBs).toBeCloseTo(102.4);
  });
  it("CAS latency in ns = CL × 2000 / MT/s, and costs dozens of CPU cycles", () => {
    expect(busMetrics(4, "4", 2, "4", 16).casNs).toBeCloseTo(10);
    expect(busMetrics(4, "3", 2, "4", 16).casNs).toBeCloseTo(13.75);
    expect(busMetrics(4, "4", 2, "4", 16).casCycles).toBe(40);
  });
  it("PCIe: per-lane rate × trained link width", () => {
    expect(linkWidth(12)).toBe(8);
    expect(linkWidth(3)).toBe(2);
    expect(busMetrics(3, "4", 2, "4", 16).pcieGBs).toBeCloseTo(31.5, 1);
    expect(busMetrics(3, "4", 2, "3", 16).pcieGBs).toBeCloseTo(15.76, 1);
  });
});

describe("software process models", () => {
  it("waterfall: one phase after another, software only at deployment, change gets costlier", () => {
    expect(sdlc("waterfall", 2).stage).toBe("Design");
    expect(sdlc("waterfall", 3).shipped).toBe(false);
    expect(sdlc("waterfall", 5).shipped).toBe(true);
    expect(sdlc("waterfall", 6).fixCost).toBe(100);
    expect(sdlc("waterfall", 8).stage).toBe("Maintenance");
  });
  it("spiral: four quadrants per loop, risk falls after each risk analysis", () => {
    expect(sdlc("spiral", 1).stage).toContain("Loop 1");
    expect(sdlc("spiral", 5).quadrant).toBe(1);
    expect(sdlc("spiral", 6).risk).toBeLessThan(sdlc("spiral", 2).risk);
  });
  it("scrum: working software every sprint, backlog burns down by velocity", () => {
    expect(sdlc("agile", 1).shipped).toBe(true);
    expect(sdlc("agile", 3).backlog).toBe(200 - 20 - 25 - 28);
    expect(burndown()[7]).toBe(0);
    expect(sdlc("agile", 8).fixCost).toBeLessThan(sdlc("waterfall", 8).fixCost);
  });
});
