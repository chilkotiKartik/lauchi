"use client";
import { AVL_SETS, avlFrames, heightT, layoutT } from "../sim/bcax";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { BCAX_SPECS } from "../meta/bcax.specs";
import { Bench, C, Glide, Halo, Node3, Rail, Txt, type V3 } from "./bcax-kit";

export default function DsAvlLab() {
  const [P, set, reset] = useLabParams(BCAX_SPECS.dsavl);
  const { seq, step } = P;
  const frames = avlFrames(AVL_SETS[seq]), k = Math.min(step, frames.length - 1), f = frames[k];
  const lay = layoutT(f.tree), n = lay.length;
  const P3 = (key: number): V3 => { const q = lay.find((p) => p.key === key); return q ? [(q.x - (n - 1) / 2) * 1.15, 4.0 - q.d * 1.15, 0] : [0, 0, 0]; };
  const bfCol = (bf: number, key: number) => (Math.abs(bf) > 1 || key === f.bad ? C.red : bf === 0 ? C.green : C.gold);
  const root = lay.find((p) => p.d === 0);
  return (
    <LabFrame
      label="An AVL tree of glowing spheres coloured by balance factor: green is balanced, gold leans by one and red is out of balance; when a rotation fixes it the spheres glide to their new places"
      camera={[0, 2.8, 10.5]}
      onReset={reset}
      scene={(playing) => (<group position={[0, -0.4, 0]}>
        <Bench w={13} d={4} />
        {lay.filter((p) => p.parent !== null).map((p) => <Rail key={`e${p.key}`} a={P3(p.parent as number)} b={P3(p.key)} c={C.light} on={true} r={0.035} />)}
        {lay.map((p) => (
          <Glide key={p.key} to={P3(p.key)} playing={playing}>
            <Node3 p={[0, 0, 0]} r={0.42} c={bfCol(p.bf, p.key)} glow={0.6} v={p.key} tc="#10202a" />
            <Txt p={[0.62, 0.5, 0.3]} s={p.bf > 0 ? `+${p.bf}` : String(p.bf)} h={0.26} c={C.white} glow={0.8} />
            {p.key === f.bad && <Halo p={[0, 0, 0]} r={0.8} c={C.red} />}
          </Glide>
        ))}
      </group>)}
      readouts={[
        ["Step", `${k} of ${frames.length - 1}`], ["What happened", f.note], ["Last key inserted", f.key === null ? "-" : String(f.key)],
        ["Rotation", f.rot || "none"], ["Height / root balance", `${heightT(f.tree)} / ${root ? (root.bf > 0 ? "+" : "") + root.bf : "-"}`],
      ]}
      controls={<>
        <Slider label="Step" value={step} min={0} max={12} step={1} digits={0} onChange={(x) => set("step", Math.round(x))} />
        <Pick label="Insertion sequence" value={seq} options={[{ id: "ll", label: "30, 20, 10  (LL case)" }, { id: "rr", label: "10, 20, 30  (RR case)" }, { id: "lr", label: "30, 10, 20  (LR case)" }, { id: "rl", label: "10, 30, 20  (RL case)" }, { id: "long", label: "10, 20, 30, 40, 50, 25" }]} onChange={(x) => set("seq", x)} />
      </>}
      note={<p>Balance factor = height(left) − height(right); an <b>AVL</b> tree keeps it in {"{"}−1, 0, +1{"}"} at every node, so the height stays O(log n) while a plain BST fed 10, 20, 30 would be a chain. When an insertion makes a node ±2 (red) one rotation repairs it. <b>LL</b> (left-left heavy): single right rotation. <b>RR</b>: single left rotation. <b>LR</b>: rotate the left child left, then the node right. <b>RL</b>: the mirror image. In every case the middle key becomes the root of that subtree (PYQ Q5.11). Step through each sequence and watch the spheres glide.</p>}
    />
  );
}
