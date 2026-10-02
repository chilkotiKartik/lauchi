"use client";
import { useMemo } from "react";
import { rerender } from "../sim/webb";
import { C, Instances, Segs, Spin, type Inst } from "../kit";
import { Check, LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { WEBB_SPECS } from "../meta/webb.specs";

function build(depth: number, branch: number, mask: boolean[]) {
  const nodes: Inst[] = [], edges: number[] = [], prev: number[][] = [];
  for (let L = 0; L <= depth; L++) {
    const count = branch ** L, r = L * 0.75, y = 1.7 - L * 0.85, cur: number[] = [];
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + L * 0.4, p: [number, number, number] = [Math.cos(a) * r, y, Math.sin(a) * r];
      cur.push(nodes.length);
      const hit = mask[nodes.length];
      nodes.push({ p, s: hit ? [0.3, 0.3, 0.3] : [0.18, 0.18, 0.18], c: hit ? C.red : C.blue });
      if (L > 0) { const q = nodes[prev[L - 1][Math.floor(i / branch)]].p; edges.push(q[0], q[1], q[2], p[0], p[1], p[2]); }
    }
    prev.push(cur);
  }
  return { nodes, edges };
}

export default function RerenderLab() {
  const [P, set, reset] = useLabParams(WEBB_SPECS.rerender);
  const depth = Math.round(P.depth), level = Math.min(Math.round(P.level), depth);
  const r = rerender(depth, Math.round(P.branch), level, P.memo);
  const g = useMemo(() => build(Math.round(P.depth), Math.round(P.branch), rerender(Math.round(P.depth), Math.round(P.branch), Math.min(Math.round(P.level), Math.round(P.depth)), P.memo).mask), [P.depth, P.branch, P.level, P.memo]);
  return (
    <LabFrame
      label="A slowly turning tree of component balls joined by lines; balls that re-render after the state change are large and red and the others are small and blue"
      camera={[0, 0.6, 7.6]}
      animated
      onReset={reset}
      scene={() => (<Spin speed={0.3}><Segs pts={g.edges} c="#9db0ba" /><Instances items={g.nodes} cap={341} shape="sphere" /></Spin>)}
      readouts={[
        ["Components in the tree", String(r.total)],
        ["Re-rendered by this update", String(r.rendered)],
        ["Renders avoided", `${r.savedPct.toFixed(1)}%`],
        ["State lives at level", String(level)],
      ]}
      controls={<>
        <Slider label="Tree depth" value={depth} min={1} max={4} step={1} digits={0} onChange={(x) => set("depth", Math.round(x))} />
        <Slider label="Children per component" value={P.branch} min={1} max={4} step={1} digits={0} onChange={(x) => set("branch", Math.round(x))} />
        <Slider label="Level where the state changes" value={level} min={0} max={4} step={1} digits={0} onChange={(x) => set("level", Math.round(x))} />
        <Check label="Wrap children in React.memo" checked={P.memo} onChange={(v) => set("memo", v)} />
      </>}
      note={<p>When a component&apos;s state changes, React renders that component again and, by default, every component below it, even if their props did not change. Red balls re-render, blue ones do not. Put state low in the tree and only a small subtree re-renders. React.memo lets a child skip rendering when its props are unchanged, so only the component that owns the state renders. The lab keeps things simple: memo is applied to all children and props never change. The level is limited to the tree depth.</p>}
    />
  );
}
