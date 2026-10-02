"use client";
import { PAGE_SEQS, pageRun, type Repl } from "../sim/bcax";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { BCAX_SPECS } from "../meta/bcax.specs";
import { Bench, C, Cell, Halo, Led, Slab, Txt, cyc } from "./bcax-kit";

export default function CoaVmemLab() {
  const [P, set, reset] = useLabParams(BCAX_SPECS.coavmem);
  const { alg, nf, seq, step } = P;
  const s = PAGE_SEQS[seq], fr = pageRun(alg as Repl, nf, s), k = Math.min(step, fr.length - 1), f = fr[k];
  const all = { fifo: pageRun("fifo", nf, s).at(-1)!.faults, lru: pageRun("lru", nf, s).at(-1)!.faults, opt: pageRun("opt", nf, s).at(-1)!.faults };
  const N = s.length, X = (i: number) => (i - (N - 1) / 2) * Math.min(0.62, 11 / N);
  return (
    <LabFrame
      label="A reference string of page numbers along the back of a bench and a stack of physical frames in front: each page fault flashes red and loads the page into a frame, evicting one chosen by FIFO, LRU or the optimal rule"
      camera={[0, 3.4, 10.5]}
      onReset={reset}
      scene={() => (<group position={[0, -0.6, 0]}>
        <Bench w={14} d={6} />
        {s.map((p, i) => (<group key={i}>
          <Cell p={[X(i), 3.6, -0.6]} s={[0.5, 0.5, 0.3]} c={i === k - 1 ? C.gold : i < k ? (fr[i + 1].fault ? C.red : C.green) : "#3b4d57"} glow={i === k - 1 ? 0.9 : i < k ? 0.35 : 0} v={p} tc={i === k - 1 ? "#2a1d00" : "#ffffff"} th={0.3} />
          {i < k && Array.from({ length: nf }, (_, r) => fr[i + 1].frames[r] !== null && <Slab key={r} p={[X(i), 2.6 - r * 0.6, -0.6]} s={[0.45, 0.45, 0.2]} c={cyc(fr[i + 1].frames[r] as number)} glow={fr[i + 1].fault && fr[i + 1].frames[r] === p ? 0.8 : 0.1} />)}
        </group>))}
        {Array.from({ length: nf }, (_, r) => (<group key={r}>
          <Slab p={[0, 0.3 + r * 0.8, 1.2]} s={[2.4, 0.7, 1.2]} c="#2a3a44" glow={0.05} />
          {f.frames[r] !== null && <Cell p={[0, 0.3 + r * 0.8, 1.9]} s={[2.0, 0.55, 0.3]} c={cyc(f.frames[r] as number)} glow={k > 0 && f.fault && f.frames[r] === f.page ? 0.9 : 0.2} v={f.frames[r] as number} th={0.4} />}
          <Txt p={[-1.7, 0.3 + r * 0.8, 1.9]} s={String(r)} h={0.3} c={C.light} glow={0.5} />
        </group>))}
        {k > 0 && <Halo p={[X(k - 1), 3.6, -0.3]} r={0.45} c={f.fault ? C.red : C.green} />}
        <Led p={[3.6, 1.2, 1.4]} c={k === 0 ? C.grey : f.fault ? C.red : C.green} r={0.4} />
        <Txt p={[3.6, 2.4, 1.4]} s={String(f.faults)} h={0.9} c={C.red} />
      </group>)}
      readouts={[
        ["Reference", k === 0 ? "none yet" : `page ${f.page}`], ["Result", k === 0 ? "-" : f.fault ? (f.evicted !== null ? `FAULT (evicts page ${f.evicted})` : "FAULT (free frame)") : "hit"],
        ["Page faults so far", String(f.faults)], ["Faults on the full string", `FIFO ${all.fifo}, LRU ${all.lru}, OPT ${all.opt}`], ["Fault rate", k ? `${((100 * f.faults) / k).toFixed(0)} %` : "-"],
      ]}
      controls={<>
        <Slider label="References processed" value={step} min={0} max={20} step={1} digits={0} onChange={(x) => set("step", Math.round(x))} />
        <Pick label="Replacement policy" value={alg} options={[{ id: "fifo", label: "FIFO (oldest page out)" }, { id: "lru", label: "LRU (least recently used)" }, { id: "opt", label: "Optimal (used farthest in the future)" }]} onChange={(x) => set("alg", x)} />
        <Slider label="Number of frames" value={nf} min={1} max={7} step={1} digits={0} onChange={(x) => set("nf", Math.round(x))} />
        <Pick label="Reference string" value={seq} options={[{ id: "classic", label: "7 0 1 2 0 3 0 4 2 3 0 3 2 1 2 0 1 7 0 1" }, { id: "belady", label: "1 2 3 4 1 2 5 1 2 3 4 5 (Belady)" }]} onChange={(x) => set("seq", x)} />
      </>}
      note={<p>Virtual memory lets a program use more pages than there are physical frames; a reference to a page that is not in a frame is a <b>page fault</b> (red). The address is split into page number and offset; the page table gives the frame. On a fault with all frames full the OS must evict a page: <b>FIFO</b> removes the oldest, <b>LRU</b> the one unused for longest, <b>OPT</b> the one needed farthest ahead (best possible, but needs the future). With 3 frames the classic string gives 15 (FIFO), 12 (LRU), 9 (OPT) faults. Try the second string with FIFO: 3 frames give 9 faults, 4 frames give 10 — Belady&apos;s anomaly; LRU and OPT never do that.</p>}
    />
  );
}
