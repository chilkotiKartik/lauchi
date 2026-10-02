"use client";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { CTYPE, CTYPE_NAME, sortedOrder, structLayout, unionSize, type CType } from "../sim/cprog";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { CPROG_SPECS } from "../meta/cprog.specs";

const dummy = new THREE.Object3D(), PAL = ["#2ba6f5", "#44c95a", "#ffc83d", "#a970ff", "#ff9a1f", "#ff5a5f"].map((c) => new THREE.Color(c)), PADC = new THREE.Color("#33454e");
const CW = 0.44;

function Grid({ types, order }: { types: CType[]; order: number[] }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const L = useMemo(() => structLayout(order.map((o) => types[o])), [types, order]);
  useLayoutEffect(() => {
    const m = ref.current; if (!m) return;
    const owner = new Int8Array(L.size).fill(-1);
    order.forEach((o, j) => { for (let b = 0; b < CTYPE[types[o]][0]; b++) owner[L.offsets[j] + b] = o; });
    for (let t = 0; t < L.size; t++) {
      const pad = owner[t] < 0;
      dummy.position.set((t % 8) * CW, -Math.floor(t / 8) * CW, 0); dummy.scale.set(CW * 0.9, CW * 0.9, pad ? 0.1 : 0.42); dummy.updateMatrix();
      m.setMatrixAt(t, dummy.matrix); m.setColorAt(t, pad ? PADC : PAL[owner[t] % 6]);
    }
    m.count = L.size; m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [L, order, types]);
  return <instancedMesh ref={ref} args={[undefined, undefined, 48]}><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial roughness={0.45} /></instancedMesh>;
}

export default function StructLayoutLab() {
  const [P, set, reset] = useLabParams(CPROG_SPECS.structlayout);
  const { n, m1, m2, m3, m4, m5, m6 } = P;
  const types = useMemo(() => [m1, m2, m3, m4, m5, m6].slice(0, n) as CType[], [n, m1, m2, m3, m4, m5, m6]);
  const orig = useMemo(() => types.map((_, i) => i), [types]);
  const sorted = useMemo(() => sortedOrder(types), [types]);
  const A = structLayout(types), B = structLayout(sorted.map((o) => types[o]));
  const keys = ["m1", "m2", "m3", "m4", "m5", "m6"] as const;
  const opts = (Object.keys(CTYPE) as CType[]).map((id) => ({ id, label: `${CTYPE_NAME[id]} (${CTYPE[id][0]} B)` }));
  return (
    <LabFrame
      label="Two grids of memory bytes for a C struct: the left in the order you wrote it and the right sorted largest first, each member in its own colour and the padding bytes in dark grey"
      camera={[0, 0.6, 8.4]}
      animated={false}
      onReset={reset}
      scene={() => (<group position={[0, 1.2, 0]}>
        <group position={[-3.9, 0, 0]}><Grid types={types} order={orig} /></group>
        <group position={[0.7, 0, 0]}><Grid types={types} order={sorted} /></group>
      </group>)}
      readouts={[
        ["sizeof (your order)", `${A.size} bytes`], ["Padding wasted", `${A.padding} bytes`], ["Member offsets", A.offsets.join(", ")],
        ["sizeof (largest first)", `${B.size} bytes`], ["Bytes saved by reordering", `${A.size - B.size}`], ["sizeof(union of the same)", `${unionSize(types)} bytes`],
      ]}
      controls={<>
        <Slider label="Number of members" value={n} min={1} max={6} step={1} digits={0} onChange={(x) => set("n", Math.round(x))} />
        {keys.slice(0, n).map((key, j) => (<Pick<CType> key={key} label={`Member ${j + 1} type`} value={P[key]} options={opts} onChange={(x) => set(key, x)} />))}
      </>}
      note={<p>Each cube is one byte, eight to a row, coloured by the member that owns it; dark thin cubes are padding. The compiler places every member at an address that is a multiple of its own size (its alignment), so a char followed by an int leaves 3 unused bytes, and it pads the end so that sizeof is a multiple of the largest alignment; that keeps every element of an array of structs aligned too. Left is your declared order, right is the same members sorted largest first, which normally wastes less. A union stores its members on top of each other so its size is that of the biggest member. Sizes assume a typical 64-bit GCC (long, double and pointers are 8 bytes); other compilers or options may differ.</p>}
    />
  );
}
