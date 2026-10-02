"use client";
import { CACHE_LINES, CACHE_SEQS, cacheRun, emat, type CMap } from "../sim/bcax";
import { Check, LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { BCAX_SPECS } from "../meta/bcax.specs";
import { Bench, Bits, C, Cell, Glass, Halo, Packet, Slab, Txt, cyc, type V3 } from "./bcax-kit";

const WAYS: Record<CMap, number> = { direct: 1, set2: 2, set4: 4, full: 8 };
export default function CoaCacheLab() {
  const [P, set, reset] = useLabParams(BCAX_SPECS.coacache);
  const { map, seq, step, hr, tc, tm, simul } = P;
  const s = CACHE_SEQS[seq].seq, fr = cacheRun(map as CMap, s), k = Math.min(step, fr.length - 1), f = fr[k];
  const ways = WAYS[map as CMap], sets = CACHE_LINES / ways;
  const ratio = k > 0 ? f.hits / k : 0, hDisp = hr / 100;
  const ys = (setI: number) => 3.6 - setI * (ways === 8 ? 0 : sets > 4 ? 0.75 : 1.2) - (ways === 8 ? 0 : 0);
  const slot = (si: number, w: number): V3 => [2.6 + w * 1.15, ways === 8 ? 3.0 - w * 0.0 - (w % 4) * 0.8 + 0 : 4.3 - si * (sets > 4 ? 0.8 : 1.7), ways === 8 ? 0.0 + Math.floor(w / 4) * 0 : 0];
  const slotP = (si: number, w: number): V3 => (ways === 8 ? [2.0 + Math.floor(w / 4) * 1.4, 4.3 - (w % 4) * 0.95, 0] : slot(si, w));
  void ys;
  const mem = Array.from({ length: 20 }, (_, b) => b);
  const memP = (b: number): V3 => [-5.6 + (b % 5) * 0.8, 3.9 - Math.floor(b / 5) * 0.75, 0];
  const path: V3[] = f.block >= 0 && !f.hit ? [memP(f.block), [-1.5, 4.2, 0.4], slotP(f.set, f.way)] : [];
  return (
    <LabFrame
      label="Main memory blocks on the left and cache lines on the right: each access sends a gold packet from the memory block to its cache set; a hit flashes green, a miss flashes red and may evict an old block"
      camera={[0, 2.8, 11]}
      onReset={reset}
      scene={() => (<group position={[0, -0.9, 0]}>
        <Bench w={15} d={4} />
        {mem.map((b) => <Cell key={b} p={memP(b)} s={[0.7, 0.6, 0.4]} c={b === f.block ? C.gold : "#35566e"} glow={b === f.block ? 0.9 : 0.1} v={b} tc={b === f.block ? "#2a1d00" : "#ffffff"} th={0.3} />)}
        {Array.from({ length: sets }, (_, si) => Array.from({ length: ways }, (_, w) => {
          const v = f.cache[si][w], p = slotP(si, w), cur = k > 0 && si === f.set && w === f.way;
          return (<group key={`${si}-${w}`}>
            <Slab p={[p[0], p[1], p[2] - 0.15]} s={[1.0, 0.65, 0.2]} c={cur ? (f.hit ? C.green : C.red) : "#26363f"} glow={cur ? 0.9 : 0.05} />
            {v !== null && <Cell p={p} s={[0.9, 0.55, 0.4]} c={cyc(v)} glow={cur ? 0.7 : 0.15} v={v} th={0.32} />}
            {w === 0 && ways < 8 && <Txt p={[1.4, p[1], 0.2]} s={String(si)} h={0.3} c={C.light} glow={0.5} />}
          </group>);
        }))}
        {ways === 8 && <Glass p={[2.7, 2.8, 0]} s={[3.3, 3.9, 0.9]} c={C.purple} on={true} o={0.07} />}
        {path.length > 0 && <Packet path={path} c={C.gold} speed={0.45} />}
        {k > 0 && <Halo p={slotP(f.set, f.way)} r={0.6} c={f.hit ? C.green : C.red} />}
        <Bits p={[-3.2, 0.2, 1.5]} bits={f.block >= 0 ? [(f.block >> 4) & 1, (f.block >> 3) & 1, (f.block >> 2) & 1, (f.block >> 1) & 1, f.block & 1] : [0, 0, 0, 0, 0]} s={0.35} c={C.orange} />
      </group>)}
      readouts={[
        ["Access", k === 0 ? "none yet" : `block ${f.block} → set ${f.set}`], ["Result", k === 0 ? "-" : f.hit ? "HIT" : f.evicted !== null ? `MISS (evicts block ${f.evicted})` : "MISS (empty line)"],
        ["Hits / misses", `${f.hits} / ${f.misses}`], ["Hit ratio so far", k ? ratio.toFixed(2) : "-"], [`EMAT at h = ${hDisp.toFixed(2)}`, `${emat(hDisp, tc, tm, simul).toFixed(1)} ns`],
      ]}
      controls={<>
        <Slider label="Memory accesses made" value={step} min={0} max={12} step={1} digits={0} onChange={(x) => set("step", Math.round(x))} />
        <Pick label="Cache mapping" value={map} options={[{ id: "direct", label: "Direct mapped (8 lines)" }, { id: "set2", label: "2-way set associative" }, { id: "set4", label: "4-way set associative" }, { id: "full", label: "Fully associative" }]} onChange={(x) => set("map", x)} />
        <Pick label="Access pattern" value={seq} options={(Object.keys(CACHE_SEQS) as (keyof typeof CACHE_SEQS)[]).map((id) => ({ id, label: CACHE_SEQS[id].name }))} onChange={(x) => set("seq", x)} />
        <Slider label="Hit ratio h (for the time formula)" value={hr} min={0} max={100} step={1} digits={0} unit=" %" onChange={(x) => set("hr", Math.round(x))} />
        <Slider label="Cache access time" value={tc} min={1} max={50} step={1} digits={0} unit=" ns" onChange={(x) => set("tc", Math.round(x))} />
        <Slider label="Main memory access time" value={tm} min={20} max={300} step={5} digits={0} unit=" ns" onChange={(x) => set("tm", Math.round(x))} />
        <Check label="Memory started at the same time as the cache" checked={simul} onChange={(x) => set("simul", x)} />
      </>}
      note={<p><b>Direct mapping</b>: block b can live only in line b mod 8 (the index bits, orange); two blocks with the same index keep evicting each other (try the conflict pattern). <b>Fully associative</b>: any block in any line, so no conflict misses but every tag must be compared. <b>Set associative</b>: block b maps to set b mod (sets) and may use any way inside it; LRU replaces the least recently used way. Effective access time EMAT = h·t<sub>c</sub> + (1 − h)(t<sub>c</sub> + t<sub>m</sub>). PYQ Q6.16: t<sub>c</sub> = 10 ns, t<sub>m</sub> = 100 ns, h = 90% gives 0.9×10 + 0.1×110 = 20 ns.</p>}
    />
  );
}
