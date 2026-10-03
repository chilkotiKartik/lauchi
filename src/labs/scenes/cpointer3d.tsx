"use client";
import { Line } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useLabParams } from "../params";
import { BCAY_SPECS } from "../meta/bcay.specs";
import { LabFrame, Pick, Slider } from "../ui";
import { Instances, type Inst, type V3 } from "../kit";
import { Tick } from "../Stage";
import { cMemory, hex, HEAP_WINDOW, ownerOf, STACK_WINDOW, type CMemory, type CVar } from "../sim/bcay";

// One byte = one key on a memory "strip": 8 bytes per row, higher addresses higher up (as stack diagrams are drawn).
const CELL = 0.36, GAP = 0.05, ROW = 0.46, ROWS = 6;
const STACK_X = -2.6, HEAP_X = 2.6, Y0 = -1.5;
const COLOR = { int: "#4fc76a", heapInt: "#ff9a1f", ptr: "#2ba6f5", header: "#8e7ad6", free: "#1d2b34" };

/** Centre of the byte at `addr` in a bank whose left edge is `x0`. */
function bytePos(addr: number, start: number, x0: number): V3 {
  const off = addr - start, row = Math.floor(off / 8), col = off % 8;
  return [x0 + (col - 3.5) * (CELL + GAP), Y0 + row * ROW, 0];
}
const where = (v: { seg: string }) => (v.seg === "heap" ? { start: HEAP_WINDOW[0], x: HEAP_X } : { start: STACK_WINDOW[0], x: STACK_X });
function colorOf(v: CVar) { return v.header ? COLOR.header : v.pointsTo !== undefined ? COLOR.ptr : v.seg === "heap" ? COLOR.heapInt : COLOR.int; }

/** All 96 bytes of both windows, coloured by owner; a byte that holds 0 is drawn darker, so the little-endian layout shows. */
function bytes(m: CMemory, heapOn: boolean): Inst[] {
  const out: Inst[] = [];
  const col = new THREE.Color(), dark = new THREE.Color("#0b1318");
  for (const [win, x, on] of [[STACK_WINDOW, STACK_X, true], [HEAP_WINDOW, HEAP_X, heapOn]] as const) {
    for (let a = win[0]; a < win[1]; a++) {
      const v = on ? ownerOf(m.vars, a) : null;
      const p = bytePos(a, win[0], x);
      if (!v) { out.push({ p, s: [CELL, CELL, 0.12], c: on ? COLOR.free : "#141e24" }); continue; }
      const b = v.bytes[a - v.addr];
      col.set(colorOf(v)).lerp(dark, b === 0 ? 0.72 : 0);
      out.push({ p: [p[0], p[1], 0.06], s: [CELL, CELL, 0.24], c: "#" + col.getHexString() });
    }
  }
  return out;
}

/** A curved pointer arrow from the middle of the pointer's 8 bytes to the first byte of what it points at. */
function PointerArrow({ from, to, strong, playing }: { from: V3; to: V3; strong: boolean; playing: boolean }) {
  const { pts, head, quat, curve } = useMemo(() => {
    const a = new THREE.Vector3(from[0], from[1], 0.2), b = new THREE.Vector3(to[0], to[1], 0.22);
    const lift = 0.9 + a.distanceTo(b) * 0.22;
    const c = new THREE.QuadraticBezierCurve3(a, a.clone().add(b).multiplyScalar(0.5).add(new THREE.Vector3(0, 0.25, lift)), b);
    const tan = c.getTangent(1).normalize();
    return { pts: c.getPoints(40).map((p) => [p.x, p.y, p.z] as V3), head: b.clone().addScaledVector(tan, -0.09), quat: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), tan), curve: c };
  }, [from, to]);
  const dot = useRef<THREE.Mesh>(null), t = useRef(0);
  const color = strong ? "#7fd3ff" : "#4b7d99";
  return (
    <group>
      <Line points={pts} color={color} lineWidth={strong ? 3 : 1.6} dashed={!strong} dashSize={0.12} gapSize={0.08} />
      <mesh position={head} quaternion={quat}>
        <coneGeometry args={[0.08, 0.2, 14]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} />
      </mesh>
      {strong && playing && (
        <>
          <Tick fn={(dt) => { t.current = (t.current + Math.min(dt, 0.05) * 0.6) % 1; const p = curve.getPoint(t.current); dot.current?.position.set(p.x, p.y, p.z); }} />
          <mesh ref={dot}><sphereGeometry args={[0.06, 12, 12]} /><meshStandardMaterial color="#ffffff" emissive="#bfe9ff" emissiveIntensity={1.2} /></mesh>
        </>
      )}
    </group>
  );
}

/** A thin frame around the 4 bytes the expression reads. */
function Highlight({ p, size }: { p: V3; size: number }) {
  const w = size * (CELL + GAP) - GAP + 0.08, x = p[0] + ((size - 1) * (CELL + GAP)) / 2;
  return (
    <mesh position={[x, p[1], 0.06]}>
      <boxGeometry args={[w, CELL + 0.08, 0.3]} />
      <meshStandardMaterial color="#ffe08a" emissive="#ffc83d" emissiveIntensity={0.5} transparent opacity={0.22} depthWrite={false} />
    </mesh>
  );
}

/** The board each address window sits on, with a row of gold contacts so it reads as memory hardware. */
function Module({ x, active }: { x: number; active: boolean }) {
  const w = 8 * (CELL + GAP) + 0.4, h = ROWS * ROW + 0.35;
  return (
    <group position={[x, Y0 + ((ROWS - 1) * ROW) / 2, -0.12]}>
      <mesh><boxGeometry args={[w, h, 0.1]} /><meshStandardMaterial color={active ? "#123528" : "#10201a"} roughness={0.7} metalness={0.1} /></mesh>
      {Array.from({ length: 14 }, (_, i) => (
        <mesh key={i} position={[-w / 2 + 0.2 + i * ((w - 0.4) / 13), -h / 2 - 0.07, 0]}>
          <boxGeometry args={[0.1, 0.16, 0.04]} />
          <meshStandardMaterial color="#d9a441" metalness={0.9} roughness={0.25} />
        </mesh>
      ))}
    </group>
  );
}

export default function CPointer3DLab() {
  const [P, set, reset] = useLabParams(BCAY_SPECS.cpointer3d);
  const { mode, val, idx } = P;
  const m = useMemo(() => cMemory(mode, val, idx), [mode, val, idx]);
  const heapOn = mode === "malloc";
  const items = useMemo(() => bytes(m, heapOn), [m, heapOn]);
  const posOf = (addr: number) => { const v = m.vars.find((x) => addr >= x.addr && addr < x.addr + x.size); const w = where(v ?? { seg: "stack" }); return bytePos(addr, w.start, w.x); };
  const ptrMid = (addr: number): V3 => { const a = posOf(addr), b = posOf(addr + 7); return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, 0]; };
  const target = m.vars.find((v) => v.addr === m.exprAddr);
  const usesIdx = mode === "array" || mode === "malloc";
  const lead = m.vars.find((v) => v.addr === m.arrows[0].from); // the pointer the expression starts from

  return (
    <LabFrame
      label="Bytes of a C program's stack frame and heap block, with pointer arrows from each pointer to the bytes it addresses"
      camera={[0.4, 1.2, 8.4]}
      onReset={reset}
      scene={(playing) => (
        <group position={[0, 0.3, 0]}>
          <Module x={STACK_X} active />
          <Module x={HEAP_X} active={heapOn} />
          <Instances items={items} cap={96} />
          {target && <Highlight p={posOf(target.addr)} size={target.size} />}
          {m.arrows.map((a, i) => <PointerArrow key={`${mode}-${i}-${a.to}`} from={ptrMid(a.from)} to={posOf(a.to)} strong={a.strong} playing={playing} />)}
        </group>
      )}
      readouts={[
        [`${m.expr} (value)`, String(m.exprValue)],
        [`&${target?.name ?? "target"} (address)`, hex(m.exprAddr)],
        [`${lead?.name ?? "p"} holds`, hex(lead?.pointsTo ?? 0)],
        m.extra,
      ]}
      controls={
        <>
          <Slider label="Value stored (val)" value={val} min={1} max={999} step={1} digits={0} onChange={(v) => set("val", v)} />
          <Pick label="Program" value={mode} onChange={(v) => set("mode", v)} options={[
            { id: "pointer", label: "int *p = &x" },
            { id: "array", label: "Array + pointer arithmetic" },
            { id: "double", label: "Pointer to pointer (int **)" },
            { id: "malloc", label: "malloc on the heap" },
          ]} />
          {usesIdx && <Slider label="Index (arr + i / h[i])" value={idx} min={0} max={3} step={1} digits={0} onChange={(v) => set("idx", v)} />}
        </>
      }
      note={
        <>
          <pre className="overflow-x-auto rounded-xl bg-[#0b141a] p-3 text-sm leading-relaxed text-[#cfe8f5]"><code>{m.code.join("\n")}</code></pre>
          <p>Each small block is <b>one byte</b>. Green bytes belong to <code>int</code>s (4 bytes), blue to pointers (8 bytes on a 64-bit machine), orange to heap memory, purple to glibc&apos;s chunk header; dark blocks are unused padding. Bytes are stored <b>little-endian</b>: the lowest byte comes first, so a small number like {val} lights only its first byte or two.</p>
          <p>A pointer is just a number: the address of the first byte of what it points to. The arrow starts at the pointer&apos;s 8 bytes and ends on that byte. <code>arr + i</code> adds <code>i × sizeof(int)</code> = {4 * idx} bytes for i = {idx}. The stack (left, near 0x7ffd…) grows towards lower addresses; malloc memory lives on the heap (right, near 0x5555…).</p>
        </>
      }
      viva={[
        ["What does a pointer store?", "The address of another object: a number giving the location of that object's first byte. On a 64-bit system every data pointer is 8 bytes, whatever it points to."],
        ["If int *p = arr, what is p + 1?", "The address 4 bytes further on (sizeof(int)), i.e. &arr[1]. Pointer arithmetic is scaled by the size of the pointed-to type."],
        ["Why does **pp need two memory reads?", "pp holds the address of p; reading it gives p, which holds the address of v; reading that gives v's value."],
        ["Where do local variables and malloc'd memory live?", "Locals live in the function's stack frame and disappear when it returns; malloc returns heap memory that lives until free() is called."],
        ["What is little-endian?", "A byte order where the least significant byte is stored at the lowest address. x86 and most ARM systems use it."],
      ]}
    />
  );
}
