"use client";
import { useMemo } from "react";
import { callStates, SORT_ARRAYS, sortStates, type SortAlg, type SortArr } from "../sim/cstx";
import { Check, LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { CSTX_SPECS } from "../meta/cstx.specs";
import { Bench, C, cyc, Glass, Led, Slab } from "./cstx-kit";

const ALG_NAME: Record<SortAlg, string> = { bubble: "Bubble sort", insertion: "Insertion sort", selection: "Selection sort", quick: "Quick sort (first element pivot)" };
const ARR_NAME: Record<SortArr, string> = { a1: "[3, 5, 2, 6, 4, 1, 8]", a2: "[5, 1, 4, 2, 8, 7]", a3: "[56, 21, 2, 31, 23, -8, 7]", a4: "[54, 26, 93, 17, 77, 31, 44, 55, 20]" };

export default function SortStackLab() {
  const [P, set, reset] = useLabParams(CSTX_SPECS.sortstack);
  const { mode, alg, arr, early, n, step } = P;
  const nn = mode === "fib" ? Math.min(Math.round(n), 8) : Math.round(n);
  const sorts = useMemo(() => sortStates(alg as SortAlg, SORT_ARRAYS[arr as SortArr], early), [alg, arr, early]);
  const calls = useMemo(() => callStates(mode === "fib" ? "fib" : "fact", nn), [mode, nn]);
  const isSort = mode === "sort";
  const total = (isSort ? sorts.length : calls.length) - 1, k = Math.min(Math.round(step), total);
  const S = sorts[Math.min(k, sorts.length - 1)], CS = calls[Math.min(k, calls.length - 1)];
  const lo = Math.min(...S.arr, 0), hi = Math.max(...S.arr), cnt = S.arr.length, span = 7.4;
  const w = Math.min(0.7, span / cnt - 0.12);
  const hOf = (v: number) => 0.25 + ((v - lo) / Math.max(1, hi - lo)) * 3;
  const colour = (i: number) => {
    if (S.kind === "done" || S.fixed[i]) return C.green;
    if ((S.kind === "swap" || S.kind === "shift") && (i === S.i || i === S.j)) return C.red;
    if (S.kind === "cmp" && (i === S.i || i === S.j)) return C.gold;
    if (i === S.pivot) return C.purple;
    return C.blue;
  };
  return (
    <LabFrame
      label={isSort ? "Glass-capped 3D bars on a steel bench sorting step by step: gold bars are being compared, red ones swapped, purple is the quick-sort pivot and green bars are in their final place" : "A tower of stacked slabs on a steel bench, one per active function call: a slab is pushed for every call and popped with a glowing green flash for every return"}
      camera={isSort ? [0, 4.6, 8.6] : [4.6, 3.6, 7.4]}
      onReset={reset}
      scene={() => (<group position={[0, -0.5, 0]}>
        <Bench w={12} d={7} />
        {isSort ? (<group>
          {S.arr.map((v, i) => {
            const h = hOf(v), x = (i - (cnt - 1) / 2) * (span / cnt);
            return <Slab key={i} p={[x, h / 2, 0]} s={[w, h, w]} c={colour(i)} glow={colour(i) === C.blue ? 0.12 : 0.55} />;
          })}
          {S.arr.map((_, i) => <Slab key={"b" + i} p={[(i - (cnt - 1) / 2) * (span / cnt), 0.03, 0.9]} s={[w, 0.06, 0.18]} c={i === S.i || i === S.j ? C.gold : "#4d6574"} glow={i === S.i || i === S.j ? 0.8 : 0} />)}
          <Glass p={[0, 1.9, 0]} s={[8.2, 3.8, 1.5]} c={C.blue} on={S.kind !== "start"} o={0.07} />
          <Led p={[4.6, 0.2, 2.5]} c={S.kind === "done" ? C.green : C.gold} />
        </group>) : (<group>
          {CS.stack.map((f, d) => (<group key={d}>
            <Slab p={[0, 0.25 + d * 0.5, 0]} s={[2.3 - Math.min(0.9, d * 0.06), 0.42, 1.4]} c={cyc(d)} glow={d === CS.stack.length - 1 ? (CS.kind === "ret" ? 1 : 0.5) : 0.12} />
            <Slab p={[1.6, 0.25 + d * 0.5, 0]} s={[0.2 + Math.min(1.2, Math.abs(f.ret ?? 0) / 40), 0.2, 0.3]} c={f.ret === null ? C.grey : C.green} glow={f.ret === null ? 0 : 0.8} />
          </group>))}
          {CS.stack.length === 0 && <Slab p={[0, 0.2, 0]} s={[2.3, 0.1, 1.4]} c={CS.kind === "start" ? C.grey : C.green} glow={CS.kind === "start" ? 0 : 0.9} />}
          {Array.from({ length: Math.min(30, CS.calls) }, (_, i) => <Slab key={i} p={[-3.2 + (i % 10) * 0.28, 0.1, 2.4 + Math.floor(i / 10) * 0.28]} s={[0.2, 0.12, 0.2]} c={C.gold} glow={0.5} />)}
          <Glass p={[0, 2.8, 0]} s={[3.2, 5.6, 2]} c={C.purple} on={CS.stack.length > 0} o={0.06} />
        </group>)}
      </group>)}
      readouts={isSort ? [
        ["Step", `${k} of ${total}`],
        ["Comparisons", String(S.cmps)],
        [alg === "insertion" ? "Shifts" : "Swaps", String(S.swaps)],
        ["Pass / partition", String(S.pass)],
        ["Array now", `[${S.arr.join(", ")}]`],
        ["This step", S.note],
      ] : [
        ["Step", `${k} of ${total}`],
        ["Stack depth now", String(CS.stack.length)],
        ["Deepest stack", String(CS.maxDepth)],
        ["Calls made", String(CS.calls)],
        ["Last returned value", CS.last === null ? "(none yet)" : String(CS.last)],
        ["This step", CS.note],
      ]}
      controls={<>
        <Slider label="Step through the trace" value={step} min={0} max={300} step={1} digits={0} onChange={(x) => set("step", Math.round(x))} />
        <Pick label="Mode" value={mode} options={[{ id: "sort", label: "Sorting bars" }, { id: "fact", label: "Recursion: factorial(n)" }, { id: "fib", label: "Recursion: fibonacci(n)" }]} onChange={(x) => set("mode", x)} />
        {isSort && <Pick label="Algorithm" value={alg as SortAlg} options={(Object.keys(ALG_NAME) as SortAlg[]).map((id) => ({ id, label: ALG_NAME[id] }))} onChange={(x) => set("alg", x)} />}
        {isSort && <Pick label="Exam array" value={arr as SortArr} options={(Object.keys(ARR_NAME) as SortArr[]).map((id) => ({ id, label: ARR_NAME[id] }))} onChange={(x) => set("arr", x)} />}
        {isSort && alg === "bubble" && <Check label="Stop early when a pass has no swap" checked={early} onChange={(x) => set("early", x)} />}
        {!isSort && <Slider label={mode === "fib" ? "n for fibonacci(n) (max 8)" : "n for factorial(n)"} value={mode === "fib" ? nn : n} min={1} max={10} step={1} digits={0} onChange={(x) => set("n", Math.round(x))} />}
      </>}
      note={isSort ? (
        <p>The simulator records every comparison and swap of {ALG_NAME[alg as SortAlg]} on {ARR_NAME[arr as SortArr]}, so the counts are exact. Bubble sort makes n(n−1)/2 comparisons at most; with early exit it stops after a pass with no swap. Insertion sort does <b>shifts</b> instead of swaps. Selection sort always compares n(n−1)/2 times but swaps at most n−1 times. Quick sort uses the first element as pivot, scans from both ends and puts the pivot in its final (green) place. Gold = comparing, red = swap or shift, purple = pivot, green = final position.</p>
      ) : (
        <p>Every call to {mode === "fib" ? "fibonacci" : "factorial"} pushes a <b>stack frame</b> (a slab) and every return pops one. The small bar beside a slab appears when that call has computed its return value. The stack depth is the height of the tower; fibonacci(n) makes many more calls than factorial(n) because it calls itself twice, yet its tower never grows taller than n. The gold dots count calls made so far.</p>
      )}
    />
  );
}
