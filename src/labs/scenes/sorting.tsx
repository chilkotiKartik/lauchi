"use client";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { SORT_INFO, makeInput, sortTrace, type InputOrder, type SortAlgo, type SortStep } from "../sim/cprog";
import { Tick } from "../Stage";
import { Check, LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { CPROG_SPECS } from "../meta/cprog.specs";

const dummy = new THREE.Object3D();
const COL = { plain: new THREE.Color("#2ba6f5"), sorted: new THREE.Color("#44c95a"), pair: new THREE.Color("#ffc83d"), move: new THREE.Color("#ff5a5f"), key: new THREE.Color("#a970ff") };
const W = 6.8;

function Bars({ S, n }: { S: SortStep; n: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = ref.current; if (!m) return;
    const bw = (W / n) * 0.8;
    for (let i = 0; i < n; i++) {
      const h = (S.a[i] / n) * 3.2 + 0.1;
      dummy.position.set(-W / 2 + ((i + 0.5) / n) * W, h / 2, 0); dummy.scale.set(bw, h, bw); dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
      const moved = S.kind === "swap" || S.kind === "shift";
      const c = i === S.key && S.kind !== "cmp" ? COL.key : i === S.i || i === S.j ? (moved ? COL.move : COL.pair) : i === S.key ? COL.key : i >= S.lo && i < S.hi ? COL.sorted : COL.plain;
      m.setColorAt(i, c);
    }
    m.count = n; m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [S, n]);
  return <instancedMesh ref={ref} args={[undefined, undefined, 40]}><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial roughness={0.45} /></instancedMesh>;
}

export default function SortingLab() {
  const [P, set, reset] = useLabParams(CPROG_SPECS.sorting);
  const { n, algo, order, seed, step, auto } = P;
  const trace = useMemo(() => sortTrace(algo, makeInput(n, seed, order)), [n, algo, order, seed]);
  const last = trace.length - 1, st = Math.min(step, last), S = trace[st];
  const acc = useRef(0);
  const tick = (dt: number) => {
    acc.current += Math.min(dt, 0.05);
    if (auto && acc.current > 0.14) { acc.current = 0; if (st < last) set("step", st + 1); }
  };
  const info = SORT_INFO[algo];
  return (
    <LabFrame
      label="A row of coloured 3D bars being sorted step by step: blue bars are unsorted, green are in their final place, gold are being compared and red are being swapped or shifted"
      camera={[0, 1.6, 8.4]}
      onReset={reset}
      scene={() => (<group position={[0, -1.6, 0]}>
        <Tick fn={tick} />
        <Bars S={S} n={n} />
        <mesh position={[0, -0.05, 0]}><boxGeometry args={[W + 0.4, 0.08, 1]} /><meshStandardMaterial color="#33454e" /></mesh>
      </group>)}
      readouts={[
        ["Step", `${st} of ${last}`], ["Comparisons so far", String(S.cmp)], [`${info.moves} so far`, String(S.mov)],
        ["Statement running", S.line], ["Best / worst case", `${info.best} / ${info.worst}`], ["Finished?", S.kind === "done" ? "Yes: sorted" : "Not yet"],
      ]}
      controls={<>
        <Slider label="Array size n" value={n} min={4} max={40} step={1} digits={0} onChange={(x) => set("n", x)} />
        <Slider label="Step through the run" value={step} min={0} max={1600} step={1} digits={0} onChange={(x) => set("step", x)} />
        <Pick<SortAlgo> label="Algorithm" value={algo} options={(Object.keys(SORT_INFO) as SortAlgo[]).map((id) => ({ id, label: SORT_INFO[id].name }))} onChange={(x) => set("algo", x)} />
        <Pick<InputOrder> label="Starting order" value={order} options={[{ id: "random", label: "Random" }, { id: "nearly", label: "Nearly sorted" }, { id: "reversed", label: "Reversed (worst case)" }]} onChange={(x) => set("order", x)} />
        <Slider label="Random seed" value={seed} min={0} max={99} step={1} digits={0} onChange={(x) => set("seed", x)} />
        <Check label="Play the steps automatically" checked={auto} onChange={(x) => set("auto", x)} />
      </>}
      note={<p>Heights are the values 1…n. Every step of the real algorithm is recorded first and this view just walks through that record, so the counts are exact: drag &quot;Step through the run&quot; (or tick auto-play) and the C statement in the readout is the line being executed. Bubble sort compares neighbours and swaps them, so big values float to the right; insertion sort picks a key (purple) and shifts larger values right until it fits; selection sort finds the minimum of the unsorted part (purple) and swaps it to the front. Bubble and insertion are O(n) on already-sorted data and O(n²) on reversed data; selection is O(n²) always but swaps at most n − 1 times. Any step number beyond the end of the run simply shows the finished array.</p>}
    />
  );
}
