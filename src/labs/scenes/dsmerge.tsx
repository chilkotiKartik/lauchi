"use client";
import { MERGE_ARRAYS, mergeFrames, radixFrames } from "../sim/bcax";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { BCAX_SPECS } from "../meta/bcax.specs";
import { Bench, C, Cell, Glass, Glide, Slab, Txt, cyc } from "./bcax-kit";

export default function DsMergeLab() {
  const [P, set, reset] = useLabParams(BCAX_SPECS.dsmerge);
  const { mode, arr, step } = P;
  const mf = mergeFrames(MERGE_ARRAYS[arr]), rf = radixFrames();
  const isM = mode === "merge", frames = isM ? mf : rf, k = Math.min(step, frames.length - 1);
  const M = mf[Math.min(k, mf.length - 1)], R = rf[Math.min(k, rf.length - 1)];
  const n = M.arr.length, sp = Math.min(1.1, 9 / n), hi = Math.max(...M.arr);
  const runOf = (i: number) => M.runs.findIndex((r) => i >= r[0] && i <= r[1]);
  return (
    <LabFrame
      label={isM ? "Bars on a bench that merge sort splits and merges: a glass frame marks the segment being worked on and merged runs take their own colour as they become sorted" : "Ten glass bins numbered 0 to 9 on a bench: radix sort drops each number into the bin of its current digit and collects them in order, three passes in all"}
      camera={[0, 3.8, 10.5]}
      onReset={reset}
      scene={(playing) => (<group position={[0, -0.6, 0]}>
        <Bench w={14} d={6} />
        {isM ? (<group>
          {M.arr.map((v, i) => {
            const h = 0.3 + (v / hi) * 3, r = runOf(i);
            return (
              <Glide key={`${v}`} to={[(i - (n - 1) / 2) * sp, h / 2, 0]} playing={playing}>
                <Slab p={[0, 0, 0]} s={[sp * 0.78, h, sp * 0.78]} c={r >= 0 ? cyc(M.runs[r][0] + M.runs[r][1]) : C.blue} glow={M.active && i >= M.active[0] && i <= M.active[1] ? 0.7 : 0.15} />
                <Txt p={[0, h / 2 + 0.3, 0]} s={String(v)} h={0.3} c={C.white} />
              </Glide>
            );
          })}
          {M.active && <Glass p={[((M.active[0] + M.active[1]) / 2 - (n - 1) / 2) * sp, 1.8, 0]} s={[(M.active[1] - M.active[0] + 1) * sp, 4, 1.4]} c={C.gold} on={true} o={0.1} />}
        </group>) : (<group>
          {Array.from({ length: 10 }, (_, b) => (<group key={b}>
            <Glass p={[(b - 4.5) * 1.15, 1.2, 0]} s={[1.0, 2.4, 1.0]} c={C.blue} on={R.buckets[b].length > 0} o={0.08} />
            <Txt p={[(b - 4.5) * 1.15, -0.3, 0.7]} s={String(b)} h={0.35} c={C.gold} />
            {R.phase !== "start" && R.buckets[b].map((v, c) => <Cell key={`${v}`} p={[(b - 4.5) * 1.15, 0.35 + c * 0.55, 0]} s={[0.95, 0.48, 0.8]} c={cyc(b)} glow={0.3} v={v} th={0.28} />)}
          </group>))}
          {R.arr.map((v, i) => <Cell key={`a${i}`} p={[(i - (R.arr.length - 1) / 2) * 1.2, 0.3, 2.6]} s={[1.05, 0.55, 0.4]} c={R.phase === "collect" ? C.green : C.purple} glow={0.35} v={v} th={0.3} />)}
        </group>)}
      </group>)}
      readouts={isM ? [
        ["Step", `${k} of ${mf.length - 1}`], ["Comparisons so far", String(M.cmps)], ["Array now", M.arr.join(" ")], ["Active segment", M.active ? `[${M.active[0]}..${M.active[1]}]` : "none"], ["What happened", M.note],
      ] : [
        ["Step", `${k} of ${rf.length - 1}`], ["Pass", R.pass === 0 ? "-" : `${R.pass} of 3`], ["Array now", R.arr.join(" ")], ["What happened", R.note],
      ]}
      controls={<>
        <Slider label="Step" value={step} min={0} max={30} step={1} digits={0} onChange={(x) => set("step", Math.round(x))} />
        <Pick label="Algorithm" value={mode} options={[{ id: "merge", label: "Merge sort" }, { id: "radix", label: "Radix sort (LSD)" }]} onChange={(x) => set("mode", x)} />
        {isM && <Pick label="Array" value={arr} options={[{ id: "m1", label: "38 27 43 3 9 82 10" }, { id: "m2", label: "8 3 5 4 7 6 2 1" }, { id: "m3", label: "5 1 4 2 8 7" }]} onChange={(x) => set("arr", x)} />}
      </>}
      note={<p><b>Merge sort</b> is divide and conquer: split the array in halves until single elements remain, then merge sorted halves with at most n − 1 comparisons each. It always takes O(n log n) time with O(n) extra space and is stable. <b>Quick sort</b> partitions around a pivot instead: O(n log n) on average but O(n²) in the worst case, in place (PYQ Q5.20). <b>Radix sort</b> never compares keys: it distributes numbers into 10 buckets by one digit at a time, least significant first, and collects them in order; with d digits it costs O(d·(n + 10)).</p>}
    />
  );
}
