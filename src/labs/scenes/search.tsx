"use client";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { binaryWorst, searchArray, searchTrace, type SearchMethod } from "../sim/cprog";
import { Tick } from "../Stage";
import { Check, LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { CPROG_SPECS } from "../meta/cprog.specs";

const dummy = new THREE.Object3D();
const COL = { out: new THREE.Color("#33454e"), win: new THREE.Color("#2ba6f5"), probe: new THREE.Color("#ffc83d"), found: new THREE.Color("#44c95a"), seen: new THREE.Color("#7a5a8a") };
const W = 7;

function Cells({ a, lo, hi, at, done, found, seen }: { a: number[]; lo: number; hi: number; at: number; done: boolean; found: boolean; seen: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = ref.current; if (!m) return;
    const n = a.length, bw = (W / n) * 0.82, top = a[n - 1];
    for (let i = 0; i < n; i++) {
      const h = (a[i] / top) * 2.4 + 0.15;
      dummy.position.set(-W / 2 + ((i + 0.5) / n) * W, h / 2, 0); dummy.scale.set(bw, h, bw); dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
      const inWin = i >= lo && i <= hi;
      m.setColorAt(i, i === at ? (done && found ? COL.found : COL.probe) : seen && !inWin ? COL.seen : inWin ? COL.win : COL.out);
    }
    m.count = n; m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [a, lo, hi, at, done, found, seen]);
  return <instancedMesh ref={ref} args={[undefined, undefined, 64]}><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial roughness={0.45} /></instancedMesh>;
}

export default function SearchLab() {
  const [P, set, reset] = useLabParams(CPROG_SPECS.search);
  const { n, method, x, step, auto } = P;
  const arr = useMemo(() => searchArray(n), [n]);
  const run = useMemo(() => searchTrace(method, arr, x), [method, arr, x]);
  const last = run.steps.length - 1, st = Math.min(step, last), S = run.steps[st];
  const acc = useRef(0);
  const tick = (dt: number) => { acc.current += Math.min(dt, 0.05); if (auto && acc.current > 0.5) { acc.current = 0; if (st < last) set("step", st + 1); } };
  const done = st === last, found = run.found >= 0;
  const nAt = arr.length, px = S.at >= 0 ? -W / 2 + ((S.at + 0.5) / nAt) * W : 0;
  const worst = method === "binary" ? binaryWorst(n) : n;
  return (
    <LabFrame
      label="A row of sorted 3D bars for a search: blue bars are the range still being searched, dark bars are ruled out, the gold bar is the element being checked and it turns green when the value is found"
      camera={[0, 1.4, 8.4]}
      onReset={reset}
      scene={() => (<group position={[0, -1.5, 0]}>
        <Tick fn={tick} />
        <Cells a={arr} lo={S.lo} hi={S.hi} at={S.at} done={done} found={found} seen={st > 0} />
        {S.at >= 0 && <mesh position={[px, 3.05, 0]} rotation={[0, 0, Math.PI]}><coneGeometry args={[0.2, 0.42, 12]} /><meshStandardMaterial color={done && found ? "#44c95a" : "#ffc83d"} emissive={done && found ? "#44c95a" : "#ffc83d"} emissiveIntensity={0.5} /></mesh>}
        <mesh position={[0, -0.05, 0]}><boxGeometry args={[W + 0.4, 0.08, 1]} /><meshStandardMaterial color="#33454e" /></mesh>
      </group>)}
      readouts={[
        ["Looking for", String(x)], ["Probes so far", `${S.probes} (worst case ${worst})`], ["Step", `${st} of ${last}`],
        ["Statement", S.msg], ["Result", done ? (found ? `found at index ${run.found}` : "not found") : "searching…"], ["Search range", S.at < 0 && st === 0 ? `a[0] … a[${n - 1}]` : `a[${S.lo}] … a[${S.hi}]`],
      ]}
      controls={<>
        <Slider label="Array size n" value={n} min={8} max={64} step={1} digits={0} onChange={(x2) => set("n", x2)} />
        <Slider label="Value to find" value={x} min={1} max={260} step={1} digits={0} onChange={(x2) => set("x", x2)} />
        <Slider label="Step through the search" value={step} min={0} max={70} step={1} digits={0} onChange={(x2) => set("step", x2)} />
        <Pick<SearchMethod> label="Method" value={method} options={[{ id: "binary", label: "Binary search" }, { id: "linear", label: "Linear search" }]} onChange={(x2) => set("method", x2)} />
        <Check label="Play the steps automatically" checked={auto} onChange={(x2) => set("auto", x2)} />
      </>}
      note={<p>The array is sorted (bar height is the stored value, which grows by 1–4 each place). Linear search examines a[0], a[1], … until it finds the value or runs out: up to n probes. Binary search needs the sorted order: it checks the middle element, then throws away the half that cannot contain the value, so the blue range halves each probe and the worst case is ⌈log₂(n + 1)⌉ probes: 7 for 64 elements, about 20 for a million. Purple bars have been ruled out by the search. Try a value not in the array (a gap between neighbours, or larger than the last value) to see the unsuccessful case. The probe counts shown are exactly what the C loop would do.</p>}
    />
  );
}
