import type { LabMeta } from "../types";

export const BCAY_LABS: LabMeta[] = [
  {
    id: "cpointer3d",
    title: "C Memory Model & Pointer Architecture",
    where: [["BCA-001", 3], ["BCA-001", 4]],
    blurb: "Every byte of a real stack frame and heap block: ints stored little-endian, 8-byte pointers aimed at the bytes they hold the address of, pointer arithmetic, ** and malloc.",
    topics: ["Pointers and addresses", "Pointer arithmetic", "Dynamic memory allocation (malloc)", "Array memory layout"],
    animated: true,
    presets: [
      { name: "Pointer to an int", note: "p (8 bytes) holds the address of x (4 bytes). The arrow ends on x's first byte; *p reads those 4 bytes back as 42.", values: { mode: "pointer", val: 42, idx: 0 } },
      { name: "Pointer arithmetic", note: "arr + 3 is 12 bytes past arr, not 3: the compiler multiplies by sizeof(int). The arrow lands on arr[3].", values: { mode: "array", val: 10, idx: 3 } },
      { name: "Pointer to a pointer", note: "pp holds p's address and p holds v's: **pp needs two memory reads.", values: { mode: "double", val: 50, idx: 0 } },
      { name: "malloc on the heap", note: "h lives on the stack but points far away to the heap. The 8 bytes just before the block are glibc's chunk size (0x21: 32 bytes, in use).", values: { mode: "malloc", val: 15, idx: 1 } },
    ],
  },
  {
    id: "hardarch3d",
    title: "Motherboard & PC Hardware Architecture",
    where: [["BCA-004", 1], ["BCA-004", 2]],
    blurb: "A desktop board you can turn around: CPU socket, one DIMM per memory channel, PCIe slots sized x1 to x16, and data moving on each bus at its real rate.",
    topics: ["Motherboard architecture", "CPU clock speed and cycles", "RAM bus bandwidth", "PCIe lane throughput"],
    animated: true,
    presets: [
      { name: "Office PC", note: "Single-channel DDR4: one DIMM, 25.6 GB/s. Adding a second stick in the other channel doubles bandwidth for very little money.", values: { cpuGhz: 3.2, ddrGen: "4", channels: 1, pcieGen: "3", pcieLanes: 4 } },
      { name: "Gaming PC", note: "Dual-channel DDR5-6400 (102.4 GB/s) and a PCIe 4.0 x16 graphics card (31.5 GB/s each way).", values: { cpuGhz: 4.8, ddrGen: "5", channels: 2, pcieGen: "4", pcieLanes: 16 } },
      { name: "The memory wall", note: "A 5 GHz core waits about 50 cycles just for DDR4's CAS latency. That is why CPUs have caches.", values: { cpuGhz: 5, ddrGen: "4", channels: 2, pcieGen: "4", pcieLanes: 16 } },
    ],
  },
  {
    id: "sdlc3d",
    title: "Software Engineering Models & Agile Scrum",
    where: [["BCA-009", 1], ["BCA-009", 2]],
    blurb: "Waterfall's one-way cascade, Boehm's risk-driven spiral and Scrum's two-week sprints side by side: when working software appears and what a late change costs.",
    topics: ["Waterfall model", "Spiral model", "Agile Scrum methodology", "Sprint velocity & burndown"],
    animated: true,
    presets: [
      { name: "Late change in Waterfall", note: "In Testing, a wrong requirement costs about 20× what it would have in the Requirements phase, and nothing has shipped yet.", values: { model: "waterfall", phase: 4 } },
      { name: "Spiral, second loop", note: "Each loop starts by retiring the biggest risks with a prototype, so remaining risk drops loop by loop.", values: { model: "spiral", phase: 6 } },
      { name: "Scrum sprint 3", note: "Three sprints in: 73 of 200 story points done and working software already in users' hands. The burndown bars show what is left.", values: { model: "agile", phase: 3 } },
    ],
  },
];
