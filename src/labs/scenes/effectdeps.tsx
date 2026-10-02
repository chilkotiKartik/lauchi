"use client";
import { useMemo } from "react";
import { effectRuns, type DepsMode } from "../sim/webb";
import { C, Instances, Panel, type Inst } from "../kit";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { WEBB_SPECS } from "../meta/webb.specs";

export default function EffectDepsLab() {
  const [P, set, reset] = useLabParams(WEBB_SPECS.effectdeps);
  const renders = Math.round(P.renders), every = Math.round(P.every), mode = P.mode as DepsMode;
  const o = useMemo(() => effectRuns(renders, every, mode), [renders, every, mode]);
  const items = useMemo<Inst[]>(() => o.runs.map((run, i) => {
    const row = Math.floor(i / 20), col = i % 20, h = run ? 1.1 : 0.2;
    return { p: [-3.3 + col * 0.35, h / 2 - 0.5 - row * 1.5, 0], s: [0.26, h, 0.4], c: run ? C.orange : C.blue };
  }), [o]);
  return (
    <LabFrame
      label="A timeline of blocks, one per render: tall orange blocks are renders where the effect runs and short blue blocks are renders where it is skipped"
      camera={[0, 0.3, 6.2]}
      animated={false}
      onReset={reset}
      scene={() => (<group><Panel p={[0, 0, -0.5]} w={7.6} h={3.6} /><Instances items={items} cap={40} /></group>)}
      readouts={[
        ["Renders", String(renders)],
        ["Effect runs", String(o.count)],
        ["Cleanups before re-runs", String(o.cleanups)],
        ["Renders where it was skipped", String(o.skipped)],
      ]}
      controls={<>
        <Slider label="Number of renders" value={renders} min={5} max={40} step={1} digits={0} onChange={(x) => set("renders", Math.round(x))} />
        <Slider label="Dependency changes every" value={every} min={1} max={10} step={1} digits={0} unit=" renders" onChange={(x) => set("every", Math.round(x))} />
        <Pick label="Dependency array" value={mode} options={[{ id: "none", label: "No array: useEffect(fn)" }, { id: "empty", label: "Empty array: useEffect(fn, [])" }, { id: "dep", label: "One value: useEffect(fn, [count])" }, { id: "object", label: "A new object: useEffect(fn, [{ }])" }]} onChange={(v) => set("mode", v)} />
      </>}
      note={<p>Each block is one render. After a render React runs the effect only if the dependencies differ from the previous render (compared with Object.is). With no array it always runs; with [] only after the first render; with a value it runs when that value changes (here every few renders); and an object or function created inside the component is new each render, so it always counts as changed, a common cause of extra effect runs and even infinite loops. Before an effect re-runs, its cleanup function runs. useMemo and useCallback keep identities stable. Timeline wraps after 20 renders.</p>}
    />
  );
}
