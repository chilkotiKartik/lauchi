"use client";
import { PIPE_PROGS, pipeline, type PProg } from "../sim/bcax";
import { Check, LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { BCAX_SPECS } from "../meta/bcax.specs";
import { Bench, C, Slab, Txt } from "./bcax-kit";

const STAGE = [C.blue, C.purple, C.orange, C.gold, C.green] as const;
const SN = ["IF", "ID", "EX", "ME", "WB"] as const;
export default function CoaPipeLab() {
  const [P, set, reset] = useLabParams(BCAX_SPECS.coapipe);
  const { prog, fwd, bp, cyc } = P;
  const r = pipeline(prog as PProg, fwd, bp), ins = PIPE_PROGS[prog as PProg];
  const cw = Math.min(0.72, 10 / Math.max(10, r.cycles)), X = (c: number) => -5 + (c - 1) * cw, Y = (i: number) => 3.6 - i * 0.8;
  const done = Math.min(cyc, r.cycles);
  const instDone = r.rows.filter((x) => x.WB <= done).length;
  return (
    <LabFrame
      label="A pipeline diagram in 3D: each row is an instruction and each column a clock cycle; coloured blocks are the five stages, red blocks are stall bubbles, and a glowing clock plane sweeps across the cycles"
      camera={[0, 3.2, 10.5]}
      onReset={reset}
      scene={() => (<group position={[0, -0.6, 0]}>
        <Bench w={14} d={5} />
        {r.rows.map((row, i) => (<group key={i}>
          {[row.IF, row.ID, row.EX, row.MEM, row.WB].map((c, s) => c <= done && (
            <Slab key={s} p={[X(c) + cw / 2, Y(i), 0]} s={[cw * 0.9, 0.55, 0.5]} c={STAGE[s]} glow={c === done ? 0.9 : 0.25} />
          ))}
          {Array.from({ length: row.stalls }, (_, b) => row.IF + 1 + b).filter((c) => c <= done).map((c) => <Slab key={"s" + c} p={[X(c) + cw / 2, Y(i), 0.05]} s={[cw * 0.9, 0.55, 0.5]} c={C.red} glow={0.8} />)}
        </group>))}
        <Slab p={[X(Math.max(1, done)) + cw / 2, 2.0, -0.2]} s={[cw * 0.95, 4.4, 0.08]} c={C.white} glow={0.6} o={0.35} />
        {SN.map((n, s) => <group key={n + "k"}><Slab p={[3.2 + s * 0.75, 0.2, 2.2]} s={[0.6, 0.3, 0.3]} c={STAGE[s]} glow={0.6} /><Txt p={[3.2 + s * 0.75, 0.2, 2.4]} s={n} h={0.2} c="#10202a" /></group>)}
      </group>)}
      readouts={[
        ["Clock cycle shown", `${done} of ${r.cycles}`], ["Instructions finished", `${instDone} of ${ins.length}`], ["Stall / bubble cycles", String(r.stalls)],
        ["CPI (whole program)", r.cpi.toFixed(2)], ["Speed-up over no pipeline", `${r.speedup.toFixed(2)} ×`],
      ]}
      controls={<>
        <Slider label="Clock cycle" value={cyc} min={0} max={14} step={1} digits={0} onChange={(x) => set("cyc", Math.round(x))} />
        <Pick label="Program" value={prog} options={[{ id: "free", label: "Independent instructions" }, { id: "alu", label: "ALU results reused (RAW hazard)" }, { id: "load", label: "Load then use (load-use hazard)" }, { id: "branch", label: "Taken branch (control hazard)" }]} onChange={(x) => set("prog", x)} />
        <Check label="Data forwarding (bypassing) on" checked={fwd} onChange={(x) => set("fwd", x)} />
        <Slider label="Branch penalty (bubbles)" value={bp} min={0} max={3} step={1} digits={0} onChange={(x) => set("bp", Math.round(x))} />
      </>}
      note={<p>A 5-stage pipeline overlaps instructions: n instructions need 5 + (n − 1) cycles when nothing stalls, so CPI approaches 1. <b>Structural</b> hazards (shared hardware), <b>data</b> hazards (an instruction needs a result not yet written, RAW) and <b>control</b> hazards (a taken branch makes the fetched instructions wrong) insert red bubbles. Without forwarding a dependent neighbour waits 2 cycles for the write-back; with forwarding the ALU result is passed straight to EX, so only a load followed by its user still loses 1 cycle. Speed-up = 5n / cycles.</p>}
    />
  );
}
