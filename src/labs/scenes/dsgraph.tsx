"use client";
import { GEDGES, GN, adjMatrix, graphFrames, type GAlg } from "../sim/bcax";
import { Instances, type Inst } from "../kit";
import { Check, LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { BCAX_SPECS } from "../meta/bcax.specs";
import { Bench, C, Cell, Halo, Node3, Packet, Rail, Txt, type V3 } from "./bcax-kit";

const POS: V3[] = [[-4, 1.8, 0], [-2, 3.0, -0.6], [1.0, 3.2, -0.8], [-2.2, 0.8, 0.9], [0.6, 1.7, 0.4], [2.2, 0.5, 1.3], [4.2, 1.7, 0]];
const NAME: Record<GAlg, string> = { bfs: "Breadth-first search (queue)", dfs: "Depth-first search (stack)", prim: "Prim's minimum spanning tree", kruskal: "Kruskal's minimum spanning tree" };

export default function DsGraphLab() {
  const [P, set, reset] = useLabParams(BCAX_SPECS.dsgraph);
  const { alg, s, step, mat } = P;
  const frames = graphFrames(alg as GAlg, s), k = Math.min(step, frames.length - 1), f = frames[k];
  const mst = alg === "prim" || alg === "kruskal";
  const seen = alg === "kruskal" ? new Set<number>(f.tree.flatMap((e) => [GEDGES[e][0], GEDGES[e][1]])) : new Set(f.order);
  const mx = adjMatrix();
  const cells: Inst[] = [];
  mx.forEach((row, r) => row.forEach((v, c) => cells.push({ p: [(c - 3) * 0.36, 0.1, 2.0 + r * 0.36], s: [0.3, 0.12, 0.3], c: v ? C.green : "#33444e" })));
  const holder = f.holder.map((h) => (alg === "kruskal" ? String(GEDGES[h][2]) : GN[h]));
  const tp = (u: number): V3 => POS[u];
  const path: V3[] = f.order.length > 1 && !mst ? f.order.map(tp) : [];
  return (
    <LabFrame
      label="Seven glowing vertices joined by weighted edges floating above a bench: a search or spanning-tree algorithm lights visited vertices green and tree edges thick green, with the queue, stack or edge list laid out in front"
      camera={[0, 3.6, 11]}
      onReset={reset}
      scene={() => (<group position={[0, -0.5, 0]}>
        <Bench w={13} d={6} />
        {GEDGES.map(([u, v, w], i) => {
          const tree = f.tree.includes(i), rej = f.rejected.includes(i), cur = alg === "kruskal" && f.cur === i;
          const mid: V3 = [(POS[u][0] + POS[v][0]) / 2, (POS[u][1] + POS[v][1]) / 2 + 0.22, (POS[u][2] + POS[v][2]) / 2 + 0.2];
          return (<group key={i}>
            <Rail a={tp(u)} b={tp(v)} c={tree ? C.green : rej ? C.red : cur ? C.gold : C.light} on={tree || cur} r={tree ? 0.09 : 0.035} />
            {mst && <Txt p={mid} s={String(w)} h={0.3} c={tree ? C.green : rej ? C.red : C.gold} glow={0.8} />}
          </group>);
        })}
        {POS.map((p, i) => (<group key={i}>
          <Node3 p={p} r={0.38} c={i === f.cur && !mst ? C.gold : seen.has(i) ? C.green : f.holder.includes(i) ? C.blue : "#566a75"} glow={seen.has(i) ? 0.7 : 0.25} v={GN[i]} tc="#10202a" />
          {i === f.cur && alg !== "kruskal" && <Halo p={p} r={0.65} />}
        </group>))}
        {path.length > 1 && <Packet path={path} c={C.white} speed={0.12} r={0.1} />}
        {mat ? <Instances items={cells} cap={49} /> : (alg !== "kruskal" ? holder : holder.slice(0, 8)).slice(0, 9).map((h, i) => <Cell key={i} p={[-3.6 + i * 0.95, 0.3, 2.6]} s={[0.8, 0.6, 0.4]} c={alg === "dfs" ? C.purple : alg === "kruskal" ? C.orange : C.blue} glow={0.3} v={h} th={0.36} />)}
      </group>)}
      readouts={[
        ["Step", `${k} of ${frames.length - 1}`], [mst ? "Vertices in tree" : "Visit order", f.order.length ? f.order.map((i) => GN[i]).join(" ") : mst ? "-" : "-"],
        [alg === "bfs" ? "Queue (front first)" : alg === "dfs" ? "Stack (top last)" : alg === "kruskal" ? "Edges still to test" : "Cut edges", holder.join(" ") || "empty"],
        ["Tree edges / weight", `${f.tree.length} / ${f.weight}`], ["What happened", f.note],
      ]}
      controls={<>
        <Slider label="Step" value={step} min={0} max={12} step={1} digits={0} onChange={(x) => set("step", Math.round(x))} />
        <Pick label="Algorithm" value={alg} options={(Object.keys(NAME) as GAlg[]).map((id) => ({ id, label: NAME[id] }))} onChange={(x) => set("alg", x)} />
        <Slider label="Start vertex (0 = A)" value={s} min={0} max={6} step={1} digits={0} onChange={(x) => set("s", Math.round(x))} />
        <Check label="Show the adjacency matrix instead" checked={mat} onChange={(x) => set("mat", x)} />
      </>}
      note={<p><b>BFS</b> visits a vertex, then all its neighbours, using a FIFO <b>queue</b>; <b>DFS</b> dives as deep as possible using a <b>stack</b> (PYQ Q5.16). Both take O(V + E) with an adjacency list and O(V²) with the adjacency matrix (tick the box: green tiles are 1s, the matrix of an undirected graph is symmetric). A <b>spanning tree</b> connects all V vertices with V − 1 edges and no cycle. <b>Prim</b> grows one tree by the cheapest edge leaving it; <b>Kruskal</b> sorts all edges and accepts each one that does not close a cycle (red = rejected). Both give total weight 39 on this graph.</p>}
    />
  );
}
