"use client";
import { useLayoutEffect, useRef } from "react";
import * as THREE from "three";
import { PTR_BASES, PTR_TYPES, hex, pointerInfo, type PtrBase, type PtrType } from "../sim/cprog";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { CPROG_SPECS } from "../meta/cprog.specs";

const dummy = new THREE.Object3D(), PER = 48, CW = 0.135, PAD = 2;
const C = { a: new THREE.Color("#2ba6f5"), b: new THREE.Color("#5bc0ff"), out: new THREE.Color("#3a2a35"), p: new THREE.Color("#ffc83d"), q: new THREE.Color("#44c95a"), bad: new THREE.Color("#ff5a5f") };

/** Position of byte number `t` of the memory window (row-major, PER bytes per row). */
const cell = (t: number) => [((t % PER) - PER / 2 + 0.5) * CW, -Math.floor(t / PER) * 0.5] as const;

function Memory({ n, size, k, idx, ok }: { n: number; size: number; k: number; idx: number; ok: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const total = (n + 2 * PAD) * size;
  useLayoutEffect(() => {
    const m = ref.current; if (!m) return;
    for (let t = 0; t < total; t++) {
      const el = Math.floor(t / size) - PAD, [x, y] = cell(t);
      const inArr = el >= 0 && el < n;
      dummy.position.set(x, y, 0); dummy.scale.set(CW * 0.9, el === k || el === idx ? 0.46 : 0.3, 0.4); dummy.updateMatrix();
      m.setMatrixAt(t, dummy.matrix);
      m.setColorAt(t, el === idx ? (ok ? C.q : C.bad) : el === k ? C.p : !inArr ? C.out : el % 2 === 0 ? C.a : C.b);
    }
    m.count = total; m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [n, size, k, idx, ok, total]);
  return <instancedMesh ref={ref} args={[undefined, undefined, 3 * PER]}><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial roughness={0.45} /></instancedMesh>;
}

export default function PointersLab() {
  const [P, set, reset] = useLabParams(CPROG_SPECS.pointers);
  const { n, type, k, i, base } = P;
  const R = pointerInfo(type, n, k, i, PTR_BASES[base]);
  const total = (n + 2 * PAD) * R.size, rows = Math.ceil(total / PER);
  const markAt = (idx: number) => { const first = Math.min(Math.max(idx + PAD, 0), n + 2 * PAD - 1) * R.size; return cell(first); };
  const [kx, ky] = markAt(k), [qx, qy] = markAt(R.idx);
  const kOk = k < n;
  const ok = R.inBounds;
  return (
    <LabFrame
      label="Computer memory drawn byte by byte as rows of small cubes: the array elements alternate two shades of blue, memory outside the array is dark, a gold marker shows the pointer p and a green or red marker shows where p plus i points"
      camera={[0, 0.2, 8.4]}
      animated={false}
      onReset={reset}
      scene={() => (<group position={[0, 0.9 + (rows - 1) * 0.25, 0]}>
        <Memory n={n} size={R.size} k={kOk ? k : -99} idx={R.idx} ok={ok} />
        <mesh position={[kx + (R.size * CW) / 2 - CW / 2, ky + 0.55, 0]} rotation={[0, 0, Math.PI]}><coneGeometry args={[0.13, 0.32, 10]} /><meshStandardMaterial color="#ffc83d" emissive="#ffc83d" emissiveIntensity={0.5} /></mesh>
        <mesh position={[qx + (R.size * CW) / 2 - CW / 2, qy - 0.55, 0]}><coneGeometry args={[0.13, 0.32, 10]} /><meshStandardMaterial color={ok ? "#44c95a" : "#ff5a5f"} emissive={ok ? "#44c95a" : "#ff5a5f"} emissiveIntensity={0.5} /></mesh>
      </group>)}
      readouts={[
        [`p = &a[${k}]`, hex(R.addrK)], [`p + ${i}  (address)`, hex(R.addrP)], ["Byte offset i × sizeof", `${i} × ${R.size} = ${R.offset}`],
        [`*(p + ${i})`, R.value !== null ? String(R.value) : R.onePast ? "one past the end: do not read" : "out of bounds: undefined"], [`sizeof(a)`, `${n} × ${R.size} = ${R.sizeofA} bytes`], ["Index p + i points to", `a[${R.idx}] ${ok ? "(inside the array)" : "(outside the array)"}`],
      ]}
      controls={<>
        <Slider label="Array length n" value={n} min={2} max={12} step={1} digits={0} onChange={(x) => set("n", Math.round(x))} />
        <Slider label="Pointer starts at a[k]: k" value={k} min={0} max={11} step={1} digits={0} onChange={(x) => set("k", Math.round(x))} />
        <Slider label="Offset i in p + i" value={i} min={-3} max={6} step={1} digits={0} onChange={(x) => set("i", Math.round(x))} />
        <Pick<PtrType> label="Element type" value={type} options={(Object.keys(PTR_TYPES) as PtrType[]).map((id) => ({ id, label: `${id} (${PTR_TYPES[id]} byte${PTR_TYPES[id] > 1 ? "s" : ""})` }))} onChange={(x) => set("type", x)} />
        <Pick<PtrBase> label="Array address (base)" value={base} options={[{ id: "x1000", label: "0x1000" }, { id: "x2000", label: "0x2000" }, { id: "stack", label: "0x7ffe3c10 (stack)" }]} onChange={(x) => set("base", x)} />
      </>}
      note={<p>Memory is a long row of numbered bytes; each small cube is one byte and the array a[] is a run of equal-sized elements (alternating blue shades) holding 10, 20, 30, … The gold marker is p = &amp;a[k]. In C, p + i does not add i bytes but i × sizeof(*p) bytes, so it lands exactly i elements away; *(p + i) is the same as a[k + i]. The green marker shows where p + i points; it turns red when that is outside the array (dark cubes are other memory). Pointing one past the last element is legal, but dereferencing it, or anything further out, is undefined behaviour. Two spare elements are drawn before and after the array; addresses are typical examples.</p>}
    />
  );
}
