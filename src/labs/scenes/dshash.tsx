"use client";
import { HKEYS, hashFrames, type HScheme } from "../sim/bcax";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { BCAX_SPECS } from "../meta/bcax.specs";
import { Bench, C, Cell, Halo, Packet, Slab, Txt, cyc, type V3 } from "./bcax-kit";

export default function DsHashLab() {
  const [P, set, reset] = useLabParams(BCAX_SPECS.dshash);
  const { scheme, m, kset, step } = P;
  const keys = HKEYS[kset], fr = hashFrames(scheme as HScheme, m, keys);
  const k = Math.min(step, fr.length - 1), f = fr[k];
  const sp = Math.min(1.35, 11 / m), X = (i: number) => (i - (m - 1) / 2) * sp;
  const hops: V3[] = f.seq.map((s) => [X(s), 1.9, 0.3]);
  const chain = scheme === "chain";
  return (
    <LabFrame
      label="A row of numbered hash-table buckets on a bench: each new key drops in at its hash slot, a gold packet hops along the probe sequence when the slot is taken, and chained keys stack up in a tower on their bucket"
      camera={[0, 3.8, 10.5]}
      onReset={reset}
      scene={() => (<group position={[0, -0.6, 0]}>
        <Bench w={14} d={5} />
        {Array.from({ length: m }, (_, i) => (
          <group key={i}>
            <Slab p={[X(i), 0.15, 0]} s={[sp * 0.85, 0.3, 1.0]} c={f.seq.includes(i) && f.last !== null ? C.gold : "#3b4d57"} glow={f.seq.includes(i) && f.last !== null ? 0.5 : 0.05} />
            <Txt p={[X(i), -0.2, 0.7]} s={String(i)} h={0.3} c={C.light} glow={0.5} />
            {!chain && f.slots[i] !== null && <Cell p={[X(i), 0.75, 0]} s={[sp * 0.8, 0.7, 0.8]} c={f.slots[i] === f.last ? (f.failed ? C.red : C.green) : cyc(i)} glow={f.slots[i] === f.last ? 0.8 : 0.2} v={f.slots[i] as number} th={0.3} />}
            {chain && f.chains[i].map((v, c) => <Cell key={c} p={[X(i), 0.75 + c * 0.72, 0]} s={[sp * 0.8, 0.62, 0.8]} c={v === f.last ? C.green : cyc(i + c)} glow={v === f.last ? 0.8 : 0.2} v={v} th={0.28} />)}
          </group>
        ))}
        {f.last !== null && <Cell p={[-6.2, 3.3, 0]} s={[1.5, 0.9, 0.5]} c={C.orange} glow={0.7} v={f.last} th={0.5} />}
        {hops.length > 0 && <Packet path={hops.length > 1 ? hops : [hops[0], [hops[0][0] + 0.01, 1.9, 0.3]]} c={C.gold} speed={0.25} />}
        {f.seq.length > 0 && <Halo p={[X(f.seq[f.seq.length - 1]), 0.3, 0]} r={0.7} c={f.failed ? C.red : C.green} />}
      </group>)}
      readouts={[
        ["Keys inserted", `${k} of ${keys.length}`], ["Last key / h(k)", f.last === null ? "-" : `${f.last}  /  ${f.last} mod ${m} = ${f.h}`], ["Probe sequence", f.seq.length ? f.seq.join(" → ") : "-"],
        ["Probes for it / total", `${f.probes} / ${f.total}`], ["Load factor", (k / m).toFixed(2)], ["Result", f.failed ? "FAILED: no free slot found" : f.last === null ? "-" : "stored"],
      ]}
      controls={<>
        <Slider label="Keys inserted" value={step} min={0} max={8} step={1} digits={0} onChange={(x) => set("step", Math.round(x))} />
        <Pick label="Collision resolution" value={scheme} options={[{ id: "chain", label: "Separate chaining" }, { id: "linear", label: "Linear probing" }, { id: "quad", label: "Quadratic probing" }, { id: "double", label: "Double hashing" }]} onChange={(x) => set("scheme", x)} />
        <Slider label="Table size m" value={m} min={5} max={13} step={1} digits={0} onChange={(x) => set("m", Math.round(x))} />
        <Pick label="Keys" value={kset} options={[{ id: "k1", label: "50 700 76 85 92 73 101" }, { id: "k2", label: "12 44 13 88 23 94 11 39" }]} onChange={(x) => set("kset", x)} />
      </>}
      note={<p>A <b>hash function</b> h(k) = k mod m maps a key to a slot. When two keys want the same slot (a <b>collision</b>) there are two families of cures. <b>Separate chaining</b> hangs the keys in a list on the bucket (tower). <b>Open addressing</b> probes for another slot: linear (h + i), quadratic (h + i²) and double hashing (h + i·h₂(k), with h₂ = 1 + k mod (m−1)). Linear probing causes clusters; quadratic probing may miss free slots; open addressing fails when the table is full (load factor 1). Try the PYQ keys with m = 7.</p>}
    />
  );
}
