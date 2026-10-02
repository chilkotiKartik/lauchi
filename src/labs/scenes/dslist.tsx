"use client";
import { listFrames, listOrder, type LOp, type LMode } from "../sim/bcax";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { BCAX_SPECS } from "../meta/bcax.specs";
import { Arrow, Bench, C, Cell, Glide, Halo, Pointer, Rail, Slab, Txt, type V3 } from "./bcax-kit";

export default function DsListLab() {
  const [P, set, reset] = useLabParams(BCAX_SPECS.dslist);
  const { mode, op, step } = P;
  const frames = listFrames(mode as LMode, op as LOp), k = Math.min(step, frames.length - 1), f = frames[k];
  const order = listOrder(f), dbl = mode === "doubly";
  const ids = Object.keys(f.val).map(Number);
  const pos = (id: number): V3 => {
    const i = order.indexOf(id);
    if (i >= 0) return [(i - (order.length - 1) / 2) * 2.5, 0.9, 0];
    if (f.freed.includes(id)) return [(order.indexOf(2) - 1) * 0.0 + 0.5, -0.1, 1.6];
    const t = f.next[id] ?? (f.head ?? 1);
    const ti = order.indexOf(t);
    return [((ti >= 0 ? ti : 0) - (order.length - 1) / 2) * 2.5 - 1.2, 2.7, 0];
  };
  const arrows: { a: V3; b: V3; c: string; key: string }[] = [];
  for (const id of ids) {
    const nx = f.next[id];
    if (nx !== null && nx !== undefined) {
      const A = pos(id), B = pos(nx), main = order.includes(id) && order.includes(nx);
      if (main && B[0] < A[0] - 0.1) arrows.push({ key: `w${id}`, a: [A[0], A[1] + 0.55, 0], b: [B[0], B[1] + 0.55, 0], c: C.gold });
      else arrows.push({ key: `n${id}`, a: [A[0] + 0.8, A[1] + (main ? 0.1 : 0), 0], b: [B[0] - 0.8, B[1] + (main ? 0.1 : 0.2), 0], c: C.gold });
    }
    const pv = f.prev[id];
    if (dbl && pv !== null && pv !== undefined) { const A = pos(id), B = pos(pv); arrows.push({ key: `p${id}`, a: [A[0] - 0.8, A[1] - 0.2, 0.2], b: [B[0] + 0.8, B[1] - 0.2, 0.2], c: C.purple }); }
  }
  const wrap = (ar: { a: V3; b: V3; c: string; key: string }) => ar.key.startsWith("w");
  return (
    <LabFrame
      label="Linked-list nodes as boxes on a steel bench joined by glowing pointer arrows: a new node hovers above the list while its pointers are rewired step by step, then drops into place; deleted nodes sink and turn red"
      camera={[0, 3.4, 10]}
      onReset={reset}
      scene={(playing) => (<group position={[0, -0.6, 0]}>
        <Bench w={14} d={6} />
        {ids.map((id) => {
          const p = pos(id), hot = f.hot.includes(id), gone = f.freed.includes(id);
          return (<Glide key={id} to={p} playing={playing}>
            {dbl && <Slab p={[-0.6, 0, 0]} s={[0.35, 0.8, 0.5]} c={C.purple} glow={0.3} />}
            <Cell p={[0, 0, 0]} s={[0.9, 0.8, 0.5]} c={gone ? C.red : hot ? C.gold : C.blue} glow={hot ? 0.8 : 0.2} v={f.val[id]} tc={hot ? "#2a1d00" : "#ffffff"} th={0.42} />
            <Slab p={[0.6, 0, 0]} s={[0.35, 0.8, 0.5]} c={C.gold} glow={0.4} />
            {hot && <Halo p={[0, 0, 0]} r={0.85} />}
            <Txt p={[0, -0.65, 0.2]} s={String(100 * id)} h={0.22} c={C.light} glow={0.5} />
          </Glide>);
        })}
        {arrows.map((ar) => wrap(ar) ? (<group key={ar.key}>
          <Rail a={[ar.a[0], 1.0, 0]} b={[ar.a[0], 1.85, 0]} c={ar.c} on={true} r={0.04} />
          <Rail a={[ar.a[0], 1.85, 0]} b={[ar.b[0], 1.85, 0]} c={ar.c} on={true} r={0.04} />
          <Arrow a={[ar.b[0], 1.85, 0]} b={[ar.b[0], 1.2, 0]} c={ar.c} on={true} />
        </group>) : <Arrow key={ar.key} a={ar.a} b={ar.b} c={ar.c} on={true} />)}
        {f.head !== null && <Pointer p={[pos(f.head)[0], 2.05, 0]} c={C.green} />}
        {mode !== "circular" && order.length > 0 && <Txt p={[pos(order[order.length - 1])[0] + 1.35, 0.9, 0]} s="X" h={0.4} c={C.red} />}
      </group>)}
      readouts={[
        ["Step", `${k} of ${frames.length - 1}`], ["What happened", f.note], ["List now", order.map((i) => f.val[i]).join(" → ") || "empty"],
        ["Nodes in list", String(order.length)], ["Head holds", f.head !== null ? String(f.val[f.head]) : "null"],
      ]}
      controls={<>
        <Slider label="Pointer step" value={step} min={0} max={5} step={1} digits={0} onChange={(x) => set("step", Math.round(x))} />
        <Pick label="List type" value={mode} options={[{ id: "singly", label: "Singly linked" }, { id: "doubly", label: "Doubly linked" }, { id: "circular", label: "Circular singly linked" }]} onChange={(x) => set("mode", x)} />
        <Pick label="Operation" value={op} options={[{ id: "head", label: "Insert at the head" }, { id: "mid", label: "Insert 25 after 20" }, { id: "tail", label: "Insert at the tail" }, { id: "del", label: "Delete node 30" }]} onChange={(x) => set("op", x)} />
      </>}
      note={<p>Each node holds data and a <b>next</b> pointer (gold); a doubly linked node also has a <b>prev</b> pointer (purple), costing one more pointer of memory per node but allowing backward traversal and O(1) deletion. In a circular list the last node points back to the head (arrow looping over the top). Order matters when rewiring: set the new node&apos;s pointers first, then change the old ones, otherwise the rest of the list is lost. Step from 0 upward and watch only the last step make the new node reachable. The small numbers under nodes are pretend memory addresses. The green marker is HEAD; the red X is null.</p>}
    />
  );
}
