/**
 * Mathematical and state simulation models for BCA 3D Virtual Laboratories.
 * - cpointer3d: C memory layout, pointer indirection, and stack/heap allocation
 * - hardarch3d: Motherboard architecture, PCIe/memory bus throughput, and clock speeds
 * - sdlc3d: Software engineering models (Waterfall vs. Spiral vs. Agile Scrum velocity)
 */

export interface CMemoryCell {
  address: number;
  name: string;
  value: number | string;
  isPointer: boolean;
  pointsTo?: number;
  segment: "stack" | "heap" | "data";
  bytes: number;
}

export function simulateCMemory(mode: "pointer" | "array" | "malloc" | "double", n: number) {
  const cells: CMemoryCell[] = [];
  if (mode === "pointer") {
    cells.push(
      { address: 0x7ffd00, name: "x", value: n, isPointer: false, segment: "stack", bytes: 4 },
      { address: 0x7ffd04, name: "p", value: "0x7ffd00", isPointer: true, pointsTo: 0x7ffd00, segment: "stack", bytes: 8 }
    );
  } else if (mode === "double") {
    cells.push(
      { address: 0x7ffd00, name: "val", value: n * 2, isPointer: false, segment: "stack", bytes: 4 },
      { address: 0x7ffd04, name: "ptr1", value: "0x7ffd00", isPointer: true, pointsTo: 0x7ffd00, segment: "stack", bytes: 8 },
      { address: 0x7ffd0c, name: "ptr2", value: "0x7ffd04", isPointer: true, pointsTo: 0x7ffd04, segment: "stack", bytes: 8 }
    );
  } else if (mode === "array") {
    for (let i = 0; i < 4; i++) {
      cells.push({ address: 0x7ffd00 + i * 4, name: `arr[${i}]`, value: (i + 1) * n, isPointer: false, segment: "stack", bytes: 4 });
    }
  } else {
    // malloc dynamic allocation
    cells.push(
      { address: 0x7ffd00, name: "h_ptr", value: "0x55aa10", isPointer: true, pointsTo: 0x55aa10, segment: "stack", bytes: 8 },
      { address: 0x55aa10, name: "*h_ptr", value: n * 10, isPointer: false, segment: "heap", bytes: 4 }
    );
  }
  return cells;
}

export interface HardwareBusState {
  cpuFreqGhz: number;
  ramThroughputGbs: number;
  pcieLaneBandwidthGbs: number;
  activeComponent: "cpu" | "ram" | "pcie" | "storage";
  latencyNs: number;
}

export function computeHardwareBusMetrics(cpuGhz: number, ddrGen: number, pcieLanes: number) {
  const ramBandwidth = ddrGen === 4 ? 25.6 : ddrGen === 5 ? 51.2 : 12.8;
  const pcieBandwidth = pcieLanes * 1.97; // Gen 4 x1 = ~1.97 GB/s
  const cpuCycleTimeNs = (1 / cpuGhz).toFixed(3);
  return {
    ramBandwidthGbs: ramBandwidth,
    pcieBandwidthGbs: parseFloat(pcieBandwidth.toFixed(2)),
    cpuCycleTimeNs: parseFloat(cpuCycleTimeNs),
  };
}

export interface SDLCState {
  model: "waterfall" | "spiral" | "agile";
  sprint: number;
  velocity: number;
  bugsFound: number;
  riskMitigatedPct: number;
}

export function simulateSDLC(model: "waterfall" | "spiral" | "agile", phase: number) {
  if (model === "waterfall") {
    const phases = ["Requirements", "Design", "Implementation", "Testing", "Deployment"];
    return {
      currentPhase: phases[Math.min(phase, phases.length - 1)],
      progressPct: Math.min(100, Math.round((phase / (phases.length - 1)) * 100)),
      flexibility: "Rigid (Changes costly)",
    };
  } else if (model === "spiral") {
    return {
      currentPhase: `Quadrant ${(phase % 4) + 1} (Iteration ${Math.floor(phase / 4) + 1})`,
      progressPct: Math.min(100, phase * 15),
      flexibility: "Risk-Driven Incremental",
    };
  } else {
    // Agile
    return {
      currentPhase: `Sprint ${phase} Daily Scrum & Delivery`,
      progressPct: Math.min(100, phase * 25),
      flexibility: "High Adaptability & Continuous Feedback",
    };
  }
}
