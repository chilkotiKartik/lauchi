"use client";
import { BST_SETS, buildT, deleteCase, deleteT, heightT, layoutT, minT, pathT, traverseT } from "../sim/bcax";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { BCAX_SPECS } from "../meta/bcax.specs";
import { Bench, C, Glide, Node3, Packet, Rail, type V3 } from "./bcax-kit";

export default function DsBstLab() {
  const [P, set, reset] = useLabParams(BCAX_SPECS.dsbst);
  const { kset, view, trav, key, step } = P;
  const keys = BST_SETS[kset];
  const full = buildT(keys);
  const tree = view === "build" ? buildT(keys.slice(0, Math.min(step, keys.length))) : view === "delete" && step >= 3 ? deleteT(full, key) : full;
  const lay = layoutT(tree), n = lay.length;
  const P3 = (k: number): V3 => { const q = lay.find((p) => p.key === k); return q ? [(q.x - (n - 1) / 2) * 1.0, 4.3 - q.d * 1.05, 0] : [0, 0, 0]; };
  const order = traverseT(full, trav === "in" ? "in" : trav === "pre" ? "pre" : trav === "post" ? "post" : "level");
  const spath = pathT(full, key), found = spath[spath.length - 1] === key;
  const lastKey = view === "build" && step > 0 ? keys[Math.min(step, keys.length) - 1] : null;
  const bpath = lastKey !== null ? pathT(tree, lastKey) : [];
  const vis = view === "traverse" ? order.slice(0, step) : view === "search" ? spath.slice(0, step) : view === "build" ? bpath : [];
  const nodeAt = (() => { let c = full; while (c && c.key !== key) c = key < c.key ? c.l : c.r; return c; })();
  const succ = nodeAt && nodeAt.l && nodeAt.r ? minT(nodeAt.r) : null;
  const colour = (k: number) => {
    if (view === "delete") return step >= 1 && step < 3 && k === key ? C.red : step === 2 && k === succ ? C.orange : "#3b6a8c";
    if (vis.length && k === vis[vis.length - 1]) return view === "search" && found && k === key ? C.green : C.gold;
    if (vis.includes(k)) return view === "traverse" ? C.green : C.purple;
    return "#3b6a8c";
  };
  const cmps = view === "search" ? spath.length : bpath.length;
  const trail: V3[] = vis.map((k) => P3(k));
  const lbl: Record<string, string> = { in: "Inorder (L, root, R)", pre: "Preorder (root, L, R)", post: "Postorder (L, R, root)", level: "Level order" };
  return (
    <LabFrame
      label="A binary search tree of glowing spheres that grows from the root as keys are inserted: a gold sphere follows the comparison path, traversals turn visited nodes green, searches and deletions highlight the nodes involved"
      camera={[0, 2.6, 10.5]}
      onReset={reset}
      scene={(playing) => (<group position={[0, -0.4, 0]}>
        <Bench w={13} d={4} />
        {lay.filter((p) => p.parent !== null).map((p) => <Rail key={`e${p.key}`} a={P3(p.parent as number)} b={P3(p.key)} c={C.light} on={vis.includes(p.key) && vis.includes(p.parent as number)} r={0.035} />)}
        {lay.map((p) => (
          <Glide key={p.key} to={P3(p.key)} playing={playing}>
            <Node3 p={[0, 0, 0]} r={0.38} c={colour(p.key)} glow={colour(p.key) === "#3b6a8c" ? 0.2 : 0.8} v={p.key} tc={colour(p.key) === C.gold ? "#2a1d00" : "#ffffff"} />
          </Glide>
        ))}
        {trail.length > 1 && <Packet path={trail} c={C.white} speed={0.2} r={0.1} />}
      </group>)}
      readouts={view === "build" ? [
        ["Keys inserted", `${Math.min(step, keys.length)} of ${keys.length}`], ["Last key", lastKey === null ? "-" : String(lastKey)], ["Comparisons for it", String(cmps)], ["Height of tree", String(heightT(tree))], ["Inorder", traverseT(tree, "in").join(" ") || "-"],
      ] : view === "traverse" ? [
        ["Order", lbl[trav]], ["Visited so far", `${Math.min(step, order.length)} of ${order.length}`], ["Sequence", order.slice(0, step).join(" ") || "-"], ["Full result", order.join(" ")],
      ] : view === "search" ? [
        ["Searching for", String(key)], ["Comparisons so far", String(Math.min(step, spath.length))], ["Path", spath.slice(0, step).join(" → ") || "-"], ["Result", step >= spath.length ? (found ? "found" : "not in the tree") : "searching"], ["Worst case", `${heightT(full)} comparisons (height)`],
      ] : [
        ["Deleting", String(key)], ["Case", deleteCase(full, key)], ["Replacement", deleteCase(full, key) === "two children" ? `inorder successor ${succ}` : "none needed"], ["Step", `${Math.min(step, 3)} of 3`], ["Inorder after", traverseT(deleteT(full, key), "in").join(" ")],
      ]}
      controls={<>
        <Slider label="Step" value={step} min={0} max={8} step={1} digits={0} onChange={(x) => set("step", Math.round(x))} />
        <Pick label="Experiment" value={view} options={[{ id: "build", label: "Build by inserting keys" }, { id: "traverse", label: "Tree traversals" }, { id: "search", label: "Search for a key" }, { id: "delete", label: "Delete a key" }]} onChange={(x) => set("view", x)} />
        <Pick label="Key set" value={kset} options={[{ id: "q512", label: "PYQ Q5.12: 15 10 20 8 12 17 25" }, { id: "mix", label: "50 30 70 20 40 60 80" }, { id: "skew", label: "Sorted 10 20 30 40 50 (degenerate)" }]} onChange={(x) => set("kset", x)} />
        {view === "traverse" && <Pick label="Traversal" value={trav} options={[{ id: "in", label: "Inorder" }, { id: "pre", label: "Preorder" }, { id: "post", label: "Postorder" }, { id: "level", label: "Level order" }]} onChange={(x) => set("trav", x)} />}
        {(view === "search" || view === "delete") && <Slider label="Key" value={key} min={1} max={99} step={1} digits={0} onChange={(x) => set("key", Math.round(x))} />}
      </>}
      note={<p>In a <b>BST</b> every left descendant is smaller and every right descendant larger than the node, so search, insert and delete follow one root-to-leaf path: O(height). Inorder traversal gives the keys sorted. A sorted insertion order degenerates into a chain of height n (try the last key set). To <b>delete</b>: a leaf is simply removed; a node with one child is replaced by that child; a node with two children takes the value of its inorder successor (smallest key in the right subtree), which is then removed (PYQ Q5.12 and the unit hint). Gold = current node, purple = path so far, green = visited.</p>}
    />
  );
}
