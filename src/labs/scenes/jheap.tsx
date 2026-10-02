"use client";
import { JHEAP_FRAMES, jLive } from "../sim/bcax";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { BCAX_SPECS } from "../meta/bcax.specs";
import { Arrow, Bench, C, Cell, Glass, Glide, Halo, Slab, Txt, type V3 } from "./bcax-kit";

export default function JHeapLab() {
  const [P, set, reset] = useLabParams(BCAX_SPECS.jheap);
  const { mode, step } = P;
  const frames = JHEAP_FRAMES[mode], k = Math.min(step, frames.length - 1), f = frames[k];
  const objP = (id: number): V3 => {
    const o = f.objs.find((x) => x.id === id);
    const idx = f.objs.findIndex((x) => x.id === id);
    return o?.region === "pool" ? [3.2, 0.7, -1.2] : [2.4 + (idx % 2) * 2.4, 0.7, 0.5 + Math.floor(idx / 2) * 1.2];
  };
  const varP = (i: number): V3 => [-4.6, 0.6 + i * 0.85, 0.4];
  return (
    <LabFrame
      label="A stack of variable slots on the left holding references and a heap area on the right holding objects: glowing arrows join references to objects, an unreachable object turns red and the garbage collector removes it; string literals live in a separate pool"
      camera={[0, 3.6, 10]}
      onReset={reset}
      scene={(playing) => (<group position={[0, -0.6, 0]}>
        <Bench w={13} d={6} />
        <Glass p={[-4.6, 2.0, 0.4]} s={[2.0, 4.0, 1.1]} c={C.blue} on={true} o={0.07} />
        <Glass p={[4.0, 1.4, 0.2]} s={[5.6, 2.8, 3.4]} c={C.purple} on={f.gc} o={0.06} />
        {f.vars.map((v, i) => (<group key={v.name}>
          <Cell p={varP(i)} s={[1.7, 0.6, 0.5]} c={C.blue} glow={0.3} v={v.name} th={0.34} />
          {v.to !== null && <Arrow a={[varP(i)[0] + 0.9, varP(i)[1], 0.4]} b={[objP(v.to)[0] - 0.95, objP(v.to)[1], objP(v.to)[2]]} c={C.gold} on={true} />}
        </group>))}
        {f.objs.map((o) => (
          <Glide key={o.id} to={objP(o.id)} from={o.dead ? undefined : [objP(o.id)[0], objP(o.id)[1] + 2.5, objP(o.id)[2]]} playing={playing}>
            <Slab p={[0, 0, 0]} s={[1.8, 0.8, 0.8]} c={o.dead ? C.red : o.region === "pool" ? C.orange : C.green} glow={o.dead ? 0.9 : 0.35} />
            <Txt p={[0, 0, 0.45]} s={o.label.replace(/[^A-Za-z0-9]/g, "").slice(0, 6)} h={0.26} c="#10202a" />
            {o.dead && <Halo p={[0, 0, 0]} r={1.1} c={C.red} />}
          </Glide>
        ))}
        <Txt p={[-4.6, 4.3, 0.4]} s="StACH" h={0.3} c={C.blue} />
        <Txt p={[3.0, 3.0, 0.4]} s="HEAP" h={0.3} c={C.purple} />
      </group>)}
      readouts={[
        ["Step", `${k} of ${frames.length - 1}`], ["Live objects", String(jLive(f))], ["Unreachable (garbage)", String(f.objs.filter((o) => o.dead).length)],
        ["References", f.vars.map((v) => `${v.name}→${v.to ?? "null"}`).join("  ") || "none"], ["What happened", f.note],
      ]}
      controls={<>
        <Slider label="Statement executed" value={step} min={0} max={7} step={1} digits={0} onChange={(x) => set("step", Math.round(x))} />
        <Pick label="Experiment" value={mode} options={[{ id: "gc", label: "References and garbage collection" }, { id: "str", label: "String pool, new String, StringBuffer" }]} onChange={(x) => set("mode", x)} />
      </>}
      note={<p>Local variables and method frames live on the <b>stack</b>; every object made with <code>new</code> lives on the <b>heap</b> and variables only hold <i>references</i> to it. Copying a reference does not copy the object. When no reference can reach an object it is <b>garbage</b> (red) and the garbage collector frees its memory automatically; Java has no free(). String literals are shared in the <b>string pool</b> (orange), <code>new String()</code> always creates a separate heap object, and Strings are <b>immutable</b>: s.concat() builds a new object. A <b>StringBuffer</b> is mutable and appends in place, which is faster in loops (PYQ Q7.2).</p>}
    />
  );
}
