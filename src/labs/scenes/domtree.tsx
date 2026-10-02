"use client";
import { useMemo } from "react";
import { domTree } from "../sim/weba";
import { C, Instances, Segs, Spin, type Inst } from "../kit";
import { LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { WEBA_SPECS } from "../meta/weba.specs";

const LEVEL = [C.gold, C.blue, C.green, C.purple, C.orange];
/** Nodes of a full tree laid out on a cone, plus the parent–child edges. */
function layout(depth: number, branch: number) {
  const nodes: Inst[] = [], edges: number[] = [], prev: number[][] = [];
  for (let L = 0; L <= depth; L++) {
    const count = branch ** L, r = L * 0.75, y = 1.7 - L * 0.85, cur: number[] = [];
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + L * 0.4;
      const p: [number, number, number] = [Math.cos(a) * r, y, Math.sin(a) * r];
      cur.push(nodes.length);
      nodes.push({ p, s: [0.24 - L * 0.03, 0.24 - L * 0.03, 0.24 - L * 0.03], c: LEVEL[L] });
      if (L > 0) { const q = nodes[prev[L - 1][Math.floor(i / branch)]].p; edges.push(q[0], q[1], q[2], p[0], p[1], p[2]); }
    }
    prev.push(cur);
  }
  return { nodes, edges };
}

export default function DomTreeLab() {
  const [P, set, reset] = useLabParams(WEBA_SPECS.domtree);
  const depth = Math.round(P.depth), branch = Math.round(P.branch);
  const t = domTree(depth, branch);
  const L = useMemo(() => layout(Math.round(P.depth), Math.round(P.branch)), [P.depth, P.branch]);
  return (
    <LabFrame
      label="A slowly turning tree of coloured balls joined by lines, one ball per HTML element, with the root at the top and each level a different colour"
      camera={[0, 0.6, 7.6]}
      animated
      onReset={reset}
      scene={() => (
        <Spin speed={0.3}>
          <Segs pts={L.edges} c="#9db0ba" />
          <Instances items={L.nodes} cap={341} shape="sphere" />
        </Spin>
      )}
      readouts={[
        ["Elements (nodes)", String(t.nodes)],
        ["Leaf nodes", String(t.leaves)],
        ["Levels", String(t.height)],
        ["Widest level", `${Math.max(...t.perLevel)} nodes`],
      ]}
      controls={<>
        <Slider label="Nesting depth" value={depth} min={1} max={4} step={1} digits={0} onChange={(x) => set("depth", Math.round(x))} />
        <Slider label="Children per element" value={branch} min={1} max={4} step={1} digits={0} onChange={(x) => set("branch", Math.round(x))} />
      </>}
      note={<p>The browser turns HTML into the Document Object Model: one node per element, nested inside its parent. Gold is the root (html), blue its children, green the next level, and so on. A full tree with b children per element and d levels below the root has 1 + b + b² + … + b^d nodes. Deeper and bushier pages have more nodes, which cost memory and make every style and layout pass slower. The browser&apos;s developer tools show this tree under Elements. This is an idealised, evenly branching page; real pages are lopsided.</p>}
    />
  );
}
