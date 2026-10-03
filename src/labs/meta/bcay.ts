import type { LabMeta } from "../types";

export const BCAY_LABS: LabMeta[] = [
  {
    id: "cpointer3d",
    title: "C Memory Model & Pointer Architecture",
    where: [["BCA-001", 3], ["BCA-001", 4]],
    blurb: "Explore 3D stack and heap memory boxes, pointer dereference rays, array indexing, and double indirection (**ptr) in real-time.",
    topics: ["Pointers and addresses", "Pointer arithmetic", "Dynamic memory allocation (malloc)", "Array memory layout"],
    animated: true,
    presets: [
      { name: "Single Pointer", note: "Pointer p holds address 0x7FFD00 and dereferences to integer value 42.", values: { mode: "pointer", val: 42 } },
      { name: "Double Pointer (**ptr)", note: "Pointer ptr2 points to ptr1 which points to val.", values: { mode: "double", val: 50 } },
      { name: "Heap Dynamic Malloc", note: "Stack pointer h_ptr points to allocated heap memory at 0x55AA10.", values: { mode: "malloc", val: 15 } },
    ],
  },
  {
    id: "hardarch3d",
    title: "Motherboard & PC Hardware Architecture",
    where: [["BCA-004", 1], ["BCA-004", 2]],
    blurb: "Inspect 3D CPU sockets, DDR RAM DIMMs, PCIe expansion lanes, and high-speed data buses with real-time throughput telemetry.",
    topics: ["Motherboard architecture", "CPU clock speed and cycles", "RAM bus bandwidth", "PCIe lane throughput"],
    animated: true,
    presets: [
      { name: "Gaming Rig (DDR5 + x16)", note: "4.8 GHz CPU, DDR5 dual-channel (51.2 GB/s) and 16-lane PCIe Gen4 highway.", values: { cpuGhz: 4.8, ddrGen: "5", pcieLanes: 16 } },
      { name: "Standard Desktop", note: "3.6 GHz CPU with DDR4 memory (25.6 GB/s).", values: { cpuGhz: 3.6, ddrGen: "4", pcieLanes: 8 } },
    ],
  },
  {
    id: "sdlc3d",
    title: "Software Engineering Models & Agile Scrum",
    where: [["BCA-009", 1], ["BCA-009", 2]],
    blurb: "Simulate Waterfall sequential phase gates vs. Spiral risk evaluation vs. Agile Scrum sprint cycles in 3D.",
    topics: ["Waterfall model", "Spiral model", "Agile Scrum methodology", "Sprint velocity & burndown"],
    animated: true,
    presets: [
      { name: "Agile Sprint #3", note: "Two-week agile sprint cycle with continuous daily scrum and burndown tracking.", values: { model: "agile", phase: 3 } },
      { name: "Waterfall Phase Gate", note: "Sequential requirements to deployment pipeline.", values: { model: "waterfall", phase: 2 } },
      { name: "Spiral Risk Model", note: "Iterative spiral cycle analyzing risk quadrants.", values: { model: "spiral", phase: 4 } },
    ],
  },
];
