/**
 * Models behind the three BCA 3D labs. Every number here is one a textbook or datasheet gives:
 * - cpointer3d: a C program's variables laid out the way gcc places them on x86-64 Linux (stack below rbp, aligned to
 *   their size, little-endian bytes; glibc heap chunks with an 8-byte size header and 32-byte minimum chunks).
 * - hardarch3d: DDR transfer rates and CAS latencies, 64-bit channels, PCIe per-lane rates after line encoding.
 * - sdlc3d: Waterfall, Spiral (Boehm) and Scrum timelines with the commonly quoted relative cost of fixing a requirement.
 */

// ------------------------------------------------------------------ C memory model
export type CMode = "pointer" | "array" | "malloc" | "double";
export type Segment = "stack" | "heap";
export type CVar = {
  name: string; type: string; addr: number; size: number; seg: Segment;
  /** little-endian bytes, as they sit in memory (byte 0 = lowest address) */
  bytes: number[];
  /** what `printf` would show for it */
  shown: string;
  /** for a pointer: the address it holds */
  pointsTo?: number;
  /** glibc's chunk header (not a C variable) */
  header?: boolean;
};
export type Arrow = { from: number; to: number; strong: boolean };
export type CMemory = { vars: CVar[]; arrows: Arrow[]; code: string[]; expr: string; exprAddr: number; exprValue: number; extra: [string, string] };

/** A typical stack frame base on 64-bit Linux (user space tops out just below 0x7fff_ffff_ffff). */
export const RBP = 0x7ffd_3a40;
/** A typical first glibc heap block of a PIE program (heap starts just after the program at 0x5555_5555_xxxx). */
export const HEAP = 0x5555_5555_92a0;
export const STACK_WINDOW: [number, number] = [RBP - 0x30, RBP]; // 48 bytes = 6 rows of 8
export const HEAP_WINDOW: [number, number] = [HEAP - 0x10, HEAP + 0x20];

export const hex = (n: number) => "0x" + n.toString(16);
/** Little-endian bytes of a non-negative integer (works past 2^32, unlike bit operators). */
export function leBytes(v: number, size: number): number[] {
  const out: number[] = [];
  let x = Math.max(0, Math.floor(v));
  for (let i = 0; i < size; i++) { out.push(x % 256); x = Math.floor(x / 256); }
  return out;
}
const int = (name: string, addr: number, v: number, seg: Segment = "stack"): CVar => ({ name, type: "int", addr, size: 4, seg, bytes: leBytes(v, 4), shown: String(v) });
const ptr = (name: string, type: string, addr: number, to: number): CVar => ({ name, type, addr, size: 8, seg: "stack", bytes: leBytes(to, 8), shown: hex(to), pointsTo: to });

/** The memory of a short C program for each mode. `idx` (0–3) is the element reached by pointer arithmetic. */
export function cMemory(mode: CMode, val: number, idx = 0): CMemory {
  const i = Math.max(0, Math.min(3, Math.round(idx)));
  if (mode === "pointer") {
    const x = int("x", RBP - 0x14, val), p = ptr("p", "int *", RBP - 0x10, x.addr);
    return { vars: [x, p], arrows: [{ from: p.addr, to: x.addr, strong: true }], code: [`int x = ${val};`, "int *p = &x;", "printf(\"%d\", *p);"],
      expr: "*p", exprAddr: x.addr, exprValue: val, extra: ["sizeof(x) / sizeof(p)", "4 B / 8 B"] };
  }
  if (mode === "double") {
    const v = int("v", RBP - 0x1c, val), p = ptr("p", "int *", RBP - 0x18, v.addr), pp = ptr("pp", "int **", RBP - 0x10, p.addr);
    return { vars: [v, p, pp], arrows: [{ from: pp.addr, to: p.addr, strong: true }, { from: p.addr, to: v.addr, strong: true }],
      code: [`int v = ${val};`, "int *p = &v;", "int **pp = &p;", "printf(\"%d\", **pp);"], expr: "**pp", exprAddr: v.addr, exprValue: val, extra: ["Memory reads for **pp", "2 (pp → p → v)"] };
  }
  if (mode === "array") {
    const base = RBP - 0x20;
    const els = [0, 1, 2, 3].map((k) => int(`arr[${k}]`, base + 4 * k, val * (k + 1)));
    const p = ptr("p", "int *", RBP - 0x28, base + 4 * i);
    return { vars: [...els, p], arrows: [{ from: p.addr, to: base + 4 * i, strong: true }],
      code: [`int arr[4] = {${els.map((e) => e.shown).join(", ")}};`, `int *p = arr + ${i};   /* moves ${i} × sizeof(int) = ${4 * i} bytes */`, "printf(\"%d\", *p);"],
      expr: `*(arr + ${i})`, exprAddr: base + 4 * i, exprValue: val * (i + 1), extra: ["p − arr", `${i} elements = ${4 * i} bytes`] };
  }
  // malloc: a pointer on the stack holds the address of a heap block; glibc keeps the chunk size just before it
  const h = ptr("h", "int *", RBP - 0x10, HEAP);
  const header: CVar = { name: "chunk size", type: "size_t", addr: HEAP - 8, size: 8, seg: "heap", bytes: leBytes(0x21, 8), shown: "0x21 (32 B, in use)", header: true };
  const els = [0, 1, 2, 3].map((k) => int(`h[${k}]`, HEAP + 4 * k, val * (k + 1), "heap"));
  return { vars: [h, header, ...els], arrows: [{ from: h.addr, to: HEAP, strong: false }, { from: h.addr, to: HEAP + 4 * i, strong: true }],
    code: ["int *h = malloc(4 * sizeof(int));", `for (int k = 0; k < 4; k++) h[k] = (k + 1) * ${val};`, `printf("%d", h[${i}]);`, "free(h);"],
    expr: `h[${i}]`, exprAddr: HEAP + 4 * i, exprValue: val * (i + 1), extra: ["Heap chunk", "16 B asked → 32 B chunk"] };
}

/** Which variable owns the byte at `addr` (or null for padding / unused bytes). */
export function ownerOf(vars: CVar[], addr: number): CVar | null {
  return vars.find((v) => addr >= v.addr && addr < v.addr + v.size) ?? null;
}

// ------------------------------------------------------------------ motherboard buses
export type DdrGen = "3" | "4" | "5";
export type PcieGen = "3" | "4" | "5";
/** A common speed grade per generation: transfer rate (MT/s) and CAS latency (cycles of the memory clock). */
export const DDR: Record<DdrGen, { mts: number; cl: number; label: string }> = {
  "3": { mts: 1600, cl: 11, label: "DDR3-1600 CL11" },
  "4": { mts: 3200, cl: 16, label: "DDR4-3200 CL16" },
  "5": { mts: 6400, cl: 32, label: "DDR5-6400 CL32" },
};
/** Usable GB/s per lane per direction: 8 / 16 / 32 GT/s with 128b/130b encoding. */
export const PCIE_LANE: Record<PcieGen, number> = { "3": 0.985, "4": 1.969, "5": 3.938 };
const WIDTHS = [1, 2, 4, 8, 16];
/** A PCIe link trains to the widest standard width the slot supports (x1, x2, x4, x8, x16). */
export const linkWidth = (lanes: number) => WIDTHS.filter((w) => w <= Math.max(1, Math.round(lanes))).pop() ?? 1;

export function busMetrics(cpuGhz: number, ddr: DdrGen, channels: number, pcie: PcieGen, lanes: number) {
  const d = DDR[ddr], ch = Math.max(1, Math.min(4, Math.round(channels)));
  const perChannel = (d.mts * 8) / 1000; // 64-bit channel = 8 bytes per transfer
  const ramGBs = perChannel * ch;
  const casNs = (d.cl * 2000) / d.mts; // memory clock is half the transfer rate
  const width = linkWidth(lanes);
  return {
    cycleNs: 1 / cpuGhz,
    perChannel, ramGBs, casNs,
    casCycles: Math.round(casNs * cpuGhz),
    bytesPerCycle: ramGBs / cpuGhz,
    width, pcieGBs: PCIE_LANE[pcie] * width,
  };
}

// ------------------------------------------------------------------ software process models
export type SdlcModel = "waterfall" | "spiral" | "agile";
export const WATERFALL = ["Requirements", "Design", "Implementation", "Testing", "Deployment", "Maintenance"] as const;
/** Commonly quoted relative cost of fixing a requirements mistake by the phase it is found in (Boehm; IBM Systems Sciences). */
export const FIX_COST = [1, 5, 10, 20, 50, 100] as const;
export const SPIRAL_QUADRANTS = ["Determine objectives", "Identify and resolve risks", "Develop and test", "Plan the next iteration"] as const;
export const AGILE_BACKLOG = 200; // story points
/** Team velocity per sprint: a new team speeds up, then settles. */
export const velocity = (sprint: number) => [20, 25, 28][sprint - 1] ?? 30;

export function sdlc(model: SdlcModel, step: number) {
  const k = Math.max(1, Math.min(8, Math.round(step)));
  if (model === "waterfall") {
    const at = Math.min(k, WATERFALL.length) - 1;
    return {
      stage: WATERFALL[at], index: at, shipped: at >= 4, fixCost: FIX_COST[at],
      progress: Math.round(((at + 1) / WATERFALL.length) * 100), risk: Math.round(100 * (1 - at / 5) ** 1.3), backlog: null as number | null,
      loop: 0, quadrant: 0,
    };
  }
  if (model === "spiral") {
    const loop = Math.ceil(k / 4), quadrant = ((k - 1) % 4) + 1;
    const riskReviews = (loop - 1) + (quadrant >= 2 ? 1 : 0); // each loop's quadrant 2 retires most of the open risk
    return {
      stage: `Loop ${loop}: ${SPIRAL_QUADRANTS[quadrant - 1]}`, index: k - 1, shipped: loop >= 2 || quadrant >= 3,
      fixCost: 1 + (loop - 1) * 2 + (quadrant >= 3 ? 1 : 0), progress: Math.round((k / 8) * 100), risk: Math.round(100 * 0.4 ** riskReviews),
      backlog: null as number | null, loop, quadrant,
    };
  }
  let done = 0;
  for (let s = 1; s <= k; s++) done += velocity(s);
  const left = Math.max(0, AGILE_BACKLOG - done);
  return {
    stage: `Sprint ${k} (weeks ${2 * k - 1}–${2 * k})`, index: k - 1, shipped: true, fixCost: 2,
    progress: Math.round(((AGILE_BACKLOG - left) / AGILE_BACKLOG) * 100), risk: Math.round(100 * 0.75 ** k), backlog: left, loop: 0, quadrant: 0,
  };
}
/** Story points left after each sprint, for the burndown chart. */
export const burndown = (sprints = 8) => Array.from({ length: sprints }, (_, s) => Math.max(0, AGILE_BACKLOG - Array.from({ length: s + 1 }, (_, j) => velocity(j + 1)).reduce((a, b) => a + b, 0)));
