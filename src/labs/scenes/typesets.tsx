"use client";
import { useMemo } from "react";
import { stateSpace } from "../sim/webb";
import { C, Instances, Spin, type Inst } from "../kit";
import { LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { WEBB_SPECS } from "../meta/webb.specs";

export default function TypeSetsLab() {
  const [P, set, reset] = useLabParams(WEBB_SPECS.typesets);
  const bools = Math.round(P.bools), valid = Math.round(P.valid), o = stateSpace(bools, valid);
  const items = useMemo<Inst[]>(() => {
    const s = stateSpace(Math.round(P.bools), Math.round(P.valid)), side = Math.ceil(Math.sqrt(s.total)), sp = Math.min(0.42, 3.4 / side);
    return Array.from({ length: s.total }, (_, i) => {
      const ok = i < s.valid, col = i % side, row = Math.floor(i / side);
      return { p: [(col - (side - 1) / 2) * sp, ok ? 0.15 : -0.05, (row - (side - 1) / 2) * sp], s: [sp * 0.8, ok ? 0.5 : 0.2, sp * 0.8], c: ok ? C.green : C.red };
    });
  }, [P.bools, P.valid]);
  return (
    <LabFrame
      label="A slowly turning square of blocks, one per combination of the boolean flags: tall green blocks are legal states and low red blocks are impossible states"
      camera={[0, 3.2, 5.2]}
      animated
      onReset={reset}
      scene={() => (<Spin speed={0.15}><Instances items={items} cap={256} /></Spin>)}
      readouts={[
        ["Combinations of the flags", String(o.total)],
        ["Legal states", String(o.valid)],
        ["Impossible states", String(o.illegal)],
        ["Share impossible", `${o.illegalPct.toFixed(1)}%`],
        ["Tags in a union type", String(o.valid)],
      ]}
      controls={<>
        <Slider label="Boolean flags in the state" value={bools} min={1} max={8} step={1} digits={0} onChange={(x) => set("bools", Math.round(x))} />
        <Slider label="States that make sense" value={valid} min={1} max={10} step={1} digits={0} onChange={(x) => set("valid", Math.round(x))} />
      </>}
      note={<p>State like <code>{"{ loading: boolean; error: boolean; data: boolean }"}</code> can hold 2³ = 8 combinations, but only three make sense: loading, error, or success. The other five (green blocks are legal, red are impossible) are bugs the type checker cannot see. A discriminated union such as <code>{"{ kind: 'loading' } | { kind: 'error' } | { kind: 'ok'; data }"}</code> has exactly the legal states, so impossible ones cannot be written. The number of flag combinations doubles with every flag. If you ask for more legal states than there are combinations, the lab caps them.</p>}
    />
  );
}
