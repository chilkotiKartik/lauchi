"use client";
import { useMemo } from "react";
import { GRAIN, HEAP_BASE, HEAP_BYTES, HEAP_SCRIPTS, heapStates, ptrArith, PTR_SIZE, type HeapScript, type PtrKind } from "../sim/cstx";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { CSTX_SPECS } from "../meta/cstx.specs";
import { Instances, type Inst, type V3 } from "../kit";
import { Bench, C, cyc, Glass, Led, Rail, Slab } from "./cstx-kit";

const hex = (x: number) => "0x" + x.toString(16);
const SCRIPT_NAME: Record<HeapScript, string> = { basic: "malloc, calloc, realloc, free", leak: "Lost pointer (leak)", realloc: "realloc moves a block" };
const GX = (g: number): number => -3.3 + (g % 8) * 0.95, GZ = (g: number): number => 1.5 + Math.floor(g / 8) * 1.0;

export default function PtrHeapLab() {
  const [P, set, reset] = useLabParams(CSTX_SPECS.ptrheap);
  const { mode, pty, d, script, step } = P;
  const kind = pty as PtrKind, dd = Math.round(d);
  const pa = ptrArith(kind, dd);
  const heap = useMemo(() => heapStates(script as HeapScript), [script]);
  const ops = HEAP_SCRIPTS[script as HeapScript];
  const k = Math.min(Math.round(step), heap.length - 1), H = heap[k];
  const isPtr = mode === "ptr";

  const bytes = useMemo(() => {
    const sz = PTR_SIZE[kind], items: Inst[] = [];
    for (let b = 0; b < sz * 10; b++) items.push({ p: [-3.9 + (b % 40) * 0.2, 0.12, -1.2 + Math.floor(b / 40) * 0.24], s: [0.17, 0.2, 0.2], c: cyc(Math.floor(b / sz)) });
    return items;
  }, [kind]);
  const grains = useMemo(() => {
    const items: Inst[] = [];
    for (let g = 0; g < HEAP_BYTES / GRAIN; g++) {
      const b = H.blocks.find((x) => g * GRAIN >= x.start && g * GRAIN < x.start + x.size);
      const free = !b || b.free, leak = !!b && H.leakedIds.includes(b.id);
      items.push({ p: [GX(g), free ? 0.06 : 0.25, GZ(g)], s: [0.85, free ? 0.1 : 0.5, 0.85], c: free ? "#3a4a54" : leak ? C.red : cyc(b!.id - 1) });
    }
    return items;
  }, [H]);
  const pe = (i: number): V3 => [-3.9 + ((i * pa.size) % 40) * 0.2 + 0.08, 0.7, -1.2 + Math.floor((i * pa.size) / 40) * 0.24];
  const names = Object.keys(H.ptrs);

  return (
    <LabFrame
      label="Memory voxel lattice on a steel bench: the stack zone at the back holds an array of bytes with two pointer markers, or pointer variables with rails to the heap; the heap zone at the front is a grid of 8-byte cells coloured by block, dark when free and red when leaked"
      camera={[0, 6.4, 8.6]}
      onReset={reset}
      scene={() => (<group position={[0, -0.4, 0]}>
        <Bench w={12} d={8} cz={0.4} />
        <Slab p={[0, 0.0, -1.3]} s={[8.6, 0.06, 1.7]} c="#26343d" />
        <Glass p={[0, 0.5, -1.0]} s={[8.6, 1, 2.2]} c={C.blue} on={isPtr} o={0.07} />
        <Glass p={[0, 0.5, 2.0]} s={[8.2, 1, 2.6]} c={C.green} on={!isPtr} o={0.07} />
        <Led p={[-4.6, 0.2, -2.0]} c={C.blue} /><Led p={[-4.6, 0.2, 1.0]} c={C.green} on={!isPtr} />
        {isPtr ? (<group>
          <Instances items={bytes} cap={80} />
          <mesh position={pe(0)}><coneGeometry args={[0.16, 0.4, 12]} /><meshStandardMaterial color={C.blue} emissive={C.blue} emissiveIntensity={0.9} /></mesh>
          <mesh position={pe(dd)}><coneGeometry args={[0.16, 0.4, 12]} /><meshStandardMaterial color={C.orange} emissive={C.orange} emissiveIntensity={0.9} /></mesh>
          {dd > 0 && <Rail a={[pe(0)[0], 0.46, pe(0)[2] - 0.05]} b={[pe(dd)[0], 0.46, pe(dd)[2] - 0.05]} c={C.gold} on r={0.05} />}
          <Instances items={Array.from({ length: Math.min(80, pa.diffBytes) }, (_, b): Inst => ({ p: [-3.9 + b * 0.2 + (b >= 40 ? -8 : 0), 0.05, 0.2 + (b >= 40 ? 0.22 : 0)], s: [0.17, 0.06, 0.16], c: C.gold }))} cap={80} />
          <Instances items={grains.map((g) => ({ ...g, c: "#3a4a54", p: [g.p[0], 0.06, g.p[2]], s: [0.85, 0.1, 0.85] }))} cap={16} />
        </group>) : (<group>
          {names.map((nm, i) => {
            const pos: V3 = [-3.2 + i * 1.5, 0.2, -1.2], dang = H.dangling.includes(nm), a = H.addr[nm];
            const g = a && a > 0 ? (a - HEAP_BASE) / GRAIN : -1;
            return (<group key={nm}>
              <Slab p={pos} s={[0.9, 0.4, 0.9]} c={dang ? C.orange : a === null ? C.grey : C.purple} glow={0.45} />
              {g >= 0 && <Rail a={[pos[0], 0.45, pos[2] + 0.4]} b={[GX(g), 0.55, GZ(g) - 0.3]} c={dang ? C.orange : C.purple} on r={0.035} />}
            </group>);
          })}
          <Instances items={grains} cap={16} />
        </group>)}
      </group>)}
      readouts={isPtr ? [
        ["sizeof one element", `${pa.size} byte${pa.size > 1 ? "s" : ""}`],
        ["ptr1 = arr", hex(pa.p1)],
        ["ptr2 = arr + " + dd, hex(pa.p2)],
        ["ptr2 - ptr1", `${pa.diffElems} elements`],
        ["(char*)ptr2 - (char*)ptr1", `${pa.diffBytes} bytes`],
        ["*ptr2", String(pa.value)],
      ] : [
        ["Statement", k === 0 ? "(start)" : ops[k - 1].code],
        ["Used bytes", String(H.used)],
        ["Free bytes", String(H.free)],
        ["Leaked bytes", String(H.leaked)],
        ["Pointers", names.length ? names.map((n) => `${n}=${H.addr[n] === null ? "NULL" : H.addr[n]! < 0 ? "?" : hex(H.addr[n]!)}`).join("  ") : "(none)"],
        ["Result", H.note],
      ]}
      controls={<>
        <Pick label="View" value={mode} options={[{ id: "ptr", label: "Pointer arithmetic" }, { id: "heap", label: "Heap: malloc / free" }]} onChange={(x) => set("mode", x)} />
        {isPtr && <Slider label="Elements apart d (ptr2 = arr + d)" value={d} min={0} max={9} step={1} digits={0} onChange={(x) => set("d", Math.round(x))} />}
        {isPtr && <Pick label="Array element type" value={kind} options={[{ id: "char", label: "char (1 byte)" }, { id: "int", label: "int (4 bytes)" }, { id: "double", label: "double (8 bytes)" }]} onChange={(x) => set("pty", x)} />}
        {!isPtr && <Slider label="Statements executed" value={step} min={0} max={6} step={1} digits={0} onChange={(x) => set("step", Math.round(x))} />}
        {!isPtr && <Pick label="Program" value={script as HeapScript} options={(Object.keys(SCRIPT_NAME) as HeapScript[]).map((id) => ({ id, label: SCRIPT_NAME[id] }))} onChange={(x) => set("script", x)} />}
      </>}
      note={isPtr ? (
        <p>An array of 10 elements, one cube per byte, each element in its own colour. Adding d to a pointer moves it by <b>d × sizeof(*p)</b> bytes, and subtracting two pointers divides the byte distance by the element size, so <code>ptr2 - ptr1</code> is {pa.diffElems} while casting both to <code>char *</code> counts the raw bytes: {pa.diffBytes}. The gold bar lays that byte distance on the floor. Addresses assume a 64-bit stack starting at 0x7ffc1000.</p>
      ) : (
        <div className="grid gap-2">
          <p>A 128-byte heap in 8-byte cells, served <b>first-fit</b> (the first free block big enough is split) and merged again when neighbours are freed. Sizes are rounded up to a multiple of 8. A block still allocated that <b>no pointer reaches any more</b> is a memory leak and glows red; a pointer left aimed at a freed block is dangling and turns orange. <code>calloc</code> asks for count × size bytes and zero-fills; <code>realloc</code> grows in place only if the next block is free, otherwise it moves the data.</p>
          <pre className="overflow-auto rounded-xl bg-soft p-3 text-xs leading-relaxed text-head" aria-label="Program">{ops.map((o, i) => `${i < k ? "✓" : i === k ? "▶" : " "} ${o.code}`).join("\n")}</pre>
        </div>
      )}
    />
  );
}
