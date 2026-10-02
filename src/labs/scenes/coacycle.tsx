"use client";
import { COA_PROGS, OPN, cycleFrames } from "../sim/bcax";
import { Check, LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { BCAX_SPECS } from "../meta/bcax.specs";
import { Bench, C, Cell, Halo, Packet, Rail, Slab, Txt, type V3 } from "./bcax-kit";

const REG: Record<string, V3> = { PC: [-4.6, 3.0, 0], AR: [-2.3, 3.0, 0], IR: [0, 3.0, 0], DR: [2.3, 3.0, 0], AC: [4.6, 3.0, 0], MEM: [0, 0.4, 0], ALU: [4.6, 1.2, 0] };
const PHASE_C = { fetch: C.blue, decode: C.purple, exec: C.orange, int: C.red, halt: C.green } as const;
export default function CoaCycleLab() {
  const [P, set, reset] = useLabParams(BCAX_SPECS.coacycle);
  const { prog, irq, step } = P;
  const fr = cycleFrames(prog, irq), k = Math.min(step, fr.length - 1), f = fr[k];
  const busY = 1.7;
  const to = (r: string): V3 => (r === "MEM" ? [REG.MEM[0], 0.9, 0] : r === "ALU" ? [REG.ALU[0], 2.4, 0] : REG[r] ? [REG[r][0], 2.4, 0] : [0, busY, 0]);
  const path: V3[] = f.src && f.dst ? [to(f.src), [to(f.src)[0], busY, 0], [to(f.dst)[0], busY, 0], to(f.dst)] : [];
  const op = f.ir >> 4;
  return (
    <LabFrame
      label="A small computer drawn as registers PC, AR, IR, DR and AC along the top, a shared bus below them and memory at the bottom: at every clock step a gold packet carries a value from its source register along the bus into the destination register"
      camera={[0, 3.4, 11]}
      onReset={reset}
      scene={() => (<group position={[0, -0.6, 0]}>
        <Bench w={15} d={5} />
        <Rail a={[-5.4, busY, 0]} b={[5.4, busY, 0]} c={PHASE_C[f.phase]} on={path.length > 0} r={0.09} />
        {(["PC", "AR", "IR", "DR", "AC"] as const).map((r) => {
          const val = r === "PC" ? f.pc : r === "AR" ? f.ar : r === "IR" ? `${OPN[op] ?? "?"}${f.ir & 15}` : r === "DR" ? f.dr : f.ac;
          const act = f.src === r || f.dst === r;
          return (<group key={r}>
            <Cell p={REG[r]} s={[1.8, 1.0, 0.6]} c={act ? PHASE_C[f.phase] : "#35566e"} glow={act ? 0.8 : 0.15} v={val} th={0.44} />
            <Txt p={[REG[r][0], 3.75, 0]} s={r} h={0.28} c={C.light} glow={0.6} />
            <Rail a={[REG[r][0], 2.5, 0]} b={[REG[r][0], busY, 0]} c={C.light} on={act} r={0.04} />
          </group>);
        })}
        <Slab p={REG.MEM} s={[6.4, 0.9, 0.6]} c={f.src === "MEM" || f.dst === "MEM" ? PHASE_C[f.phase] : "#2a3a44"} glow={f.src === "MEM" || f.dst === "MEM" ? 0.6 : 0.05} />
        {f.mem.map((v, i) => <Txt key={i} p={[-3.0 + (i % 8) * 0.86, i < 8 ? 0.6 : 0.25, 0.35]} s={v.toString(16).toUpperCase()} h={0.22} c={i === f.ar ? C.gold : "#ffffff"} />)}
        <Slab p={REG.ALU} s={[1.4, 0.7, 0.5]} c={f.src === "ALU" ? C.orange : "#4a3a1a"} glow={f.src === "ALU" ? 0.9 : 0.1} />
        <Txt p={[REG.ALU[0], 1.2, 0.3]} s="ALU" h={0.25} c="#ffffff" />
        <Rail a={[REG.ALU[0], 1.55, 0]} b={[REG.ALU[0], busY, 0]} c={C.orange} on={f.src === "ALU"} r={0.04} />
        <Rail a={[0, 0.9, 0]} b={[0, busY, 0]} c={C.light} on={f.src === "MEM" || f.dst === "MEM"} r={0.04} />
        {path.length > 0 && <Packet path={path} c={C.gold} speed={0.5} r={0.16} />}
        {k > 0 && <Halo p={[-5.8, 1.0, 0]} r={0.35} c={PHASE_C[f.phase]} />}
      </group>)}
      readouts={[
        ["Phase", f.phase === "int" ? "INTERRUPT" : f.phase.toUpperCase()], ["Register transfer", f.rtl], ["PC / AR / AC", `${f.pc} / ${f.ar} / ${f.ac}`],
        ["IR", k === 0 ? "-" : `${OPN[op] ?? "?"} ${f.ir & 15}`], ["Meaning", f.note],
      ]}
      controls={<>
        <Slider label="Clock step" value={step} min={0} max={45} step={1} digits={0} onChange={(x) => set("step", Math.round(x))} />
        <Pick label="Program" value={prog} options={(Object.keys(COA_PROGS) as (keyof typeof COA_PROGS)[]).map((id) => ({ id, label: COA_PROGS[id].name }))} onChange={(x) => set("prog", x)} />
        <Check label="Raise an interrupt after the first instruction" checked={irq} onChange={(x) => set("irq", x)} />
      </>}
      note={<p>Every instruction goes through the <b>instruction cycle</b>. <b>Fetch</b>: T0: AR ← PC; T1: IR ← M[AR], PC ← PC + 1. <b>Decode</b>: the opcode in IR selects the operation and AR ← IR(address). <b>Execute</b> (for LDA): DR ← M[AR]; AC ← DR. If the interrupt flag is set at the end of an instruction, the <b>interrupt cycle</b> saves the return address (M[0] ← PC) and sets PC ← 1, where the service routine (here just a jump-indirect back through M[0]) lives (PYQ Q6.5). All the register transfers share one <b>common bus</b>, so only one source drives it at a time: the gold packet. Tiny simplified computer: 16 words, one accumulator, opcodes HLT, LDA, ADD, STA, JMP, JMPI.</p>}
    />
  );
}
