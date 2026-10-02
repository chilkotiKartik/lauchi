"use client";
import { stateBatch } from "../sim/webb";
import { Bars, C, Floor, Panel } from "../kit";
import { Check, LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { WEBB_SPECS } from "../meta/webb.specs";

export default function StateBatchLab() {
  const [P, set, reset] = useLabParams(WEBB_SPECS.statebatch);
  const clicks = Math.round(P.clicks), sets = Math.round(P.sets), up = P.mode === "updater";
  const o = stateBatch(clicks, sets, up, P.batch);
  const max = clicks * sets;
  return (
    <LabFrame
      label="Four columns: setter calls made in blue, the final count in green, updates lost in red and renders in gold"
      camera={[0, 0.7, 6.2]}
      animated={false}
      onReset={reset}
      scene={() => (
        <group>
          <Floor size={12} y={-1.4} divisions={12} />
          <Panel p={[0, 0.2, -0.7]} w={6.8} h={3.8} />
          <Bars values={[max, o.count, o.lost, o.renders]} max={Math.max(1, max)} colors={[C.blue, C.green, C.red, C.gold]} x0={-1.7} y0={-1.4} w={0.7} gap={0.35} height={3.1} glow={0.3} />
        </group>
      )}
      readouts={[
        ["Setter calls made", String(max)],
        ["Final count", String(o.count)],
        ["Updates lost", String(o.lost)],
        ["Renders", String(o.renders)],
        ["Added per click", String(o.perClick)],
      ]}
      controls={<>
        <Slider label="Button clicks" value={clicks} min={1} max={10} step={1} digits={0} onChange={(x) => set("clicks", Math.round(x))} />
        <Slider label="Setter calls per click" value={sets} min={1} max={5} step={1} digits={0} onChange={(x) => set("sets", Math.round(x))} />
        <Pick label="How the setter is called" value={P.mode} options={[{ id: "direct", label: "setCount(count + 1)" }, { id: "updater", label: "setCount(c => c + 1)" }]} onChange={(v) => set("mode", v)} />
        <Check label="Batch updates (React 18 default)" checked={P.batch} onChange={(v) => set("batch", v)} />
      </>}
      note={<p>Inside one click handler, <code>count</code> is a snapshot: every <code>setCount(count + 1)</code> call sees the same old value, so three calls add only 1 (the red column is the updates that were lost). The updater form <code>setCount(c =&gt; c + 1)</code> receives the latest pending value, so all three count. Batching means React applies all the calls from one event and renders once, so renders equal clicks; without batching each call would render separately (gold column). StrictMode&apos;s double-invoking of updaters does not change the result.</p>}
    />
  );
}
