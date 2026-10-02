"use client";
import { useMemo } from "react";
import { buildPipeline, CODE_BASE, hexBytes, MEM_WORDS, PROG_NAME, STAGE_NAME, STAGES, type ProgId, type Stage } from "../sim/cstx";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { CSTX_SPECS } from "../meta/cstx.specs";
import { Instances, type Inst } from "../kit";
import { Bench, C, cyc, Glass, Led, Rail, Slab, Token, type V3 } from "./cstx-kit";

const CX = [-5.2, -2.6, 0, 2.6, 5.2], NAMES = ["Preprocess", "Compile", "Assemble", "Link", "Load and run"];
const PRODUCT: Record<Stage, string> = { preprocess: "lines of C", compile: "assembly lines", assemble: "machine bytes", link: "bytes relocated", run: "instructions run" };

export default function CPipelineLab() {
  const [P, set, reset] = useLabParams(CSTX_SPECS.cpipeline);
  const { prog, stage, step, a, b, n } = P;
  const pl = useMemo(() => buildPipeline(prog as ProgId, Math.round(a), Math.round(b), Math.round(n)), [prog, a, b, n]);
  const si = STAGES.indexOf(stage as Stage), total = pl.states.length - 1;
  const k = Math.min(Math.round(step), total), cs = stage === "run" ? pl.states[k] : pl.states[0];
  const product = [pl.pre.length, pl.asm.length, pl.obj.length, pl.exe.length, k][si];
  const pcIdx = Math.max(0, (cs.pc - CODE_BASE) / 3);

  const chamberItems = useMemo(() => CX.map((x, i) => {
    const sizes = [pl.pre.length, pl.asm.length, pl.obj.length / 3, pl.exe.length / 3, pl.states.length - 1];
    const m = Math.min(14, Math.max(1, Math.round(sizes[i])));
    return Array.from({ length: m }, (_, j): Inst => ({ p: [x - 0.7 + (j % 7) * 0.23, 0.2 + Math.floor(j / 7) * 0.18, -2 + 0.15], s: [0.19, 0.12, 0.5], c: cyc(i) }));
  }), [pl]);

  const scale = Math.max(1, ...cs.regs, ...cs.mem) / 1.5;
  const barH = (v: number) => 0.08 + Math.min(1.6, Math.max(0, v) / scale);
  const tgt: V3 = [CX[si], 1.35, -2];
  const code = pl.asm.length;

  const listing =
    stage === "preprocess" ? pl.pre :
    stage === "compile" ? pl.asm.map((x, i) => `${x.label ? x.label + ":  " : "          "}${x.text}${i === 0 ? "" : ""}`) :
    stage === "assemble" ? pl.asm.map((_, i) => `${(i * 3).toString(16).padStart(2, "0")}:  ${hexBytes(pl.obj.slice(i * 3, i * 3 + 3)).join(" ")}`) :
    stage === "link" ? pl.asm.map((_, i) => `${(CODE_BASE + i * 3).toString(16).padStart(2, "0")}:  ${hexBytes(pl.exe.slice(i * 3, i * 3 + 3)).join(" ")}${pl.exe[i * 3 + 2] !== pl.obj[i * 3 + 2] ? "   (jump target relocated +0x40)" : ""}`) :
    pl.asm.map((x, i) => `${i === pcIdx && !cs.done ? "▶" : " "} ${(CODE_BASE + i * 3).toString(16)}:  ${x.text}`);

  return (
    <LabFrame
      label="A steel bench with five glass chambers (preprocess, compile, assemble, link, load and run) joined by glowing bus tracks with a token at the active stage; in front a CPU with a control unit, an ALU, four register bars, RAM cells and a strip of instruction cells showing the program counter"
      camera={[0, 6.2, 10.5]}
      onReset={reset}
      scene={(playing) => (<group position={[0, -0.6, 0]}>
        <Bench w={15} d={11} cz={1.2} />
        {CX.map((x, i) => (<group key={i}>
          <Glass p={[x, 0.75, -2]} s={[2.1, 1.5, 1.3]} c={cyc(i)} on={i === si} />
          <Led p={[x, 1.62, -2.55]} c={i < si ? C.green : i === si ? C.gold : C.grey} on={i <= si} />
          {i < 4 && <Rail a={[x + 1.05, 0.25, -2]} b={[CX[i + 1] - 1.05, 0.25, -2]} c={C.blue} on={i < si} />}
        </group>))}
        {chamberItems.map((it, i) => <Instances key={i} items={it} cap={14} />)}
        <Token target={tgt} playing={playing} />
        <Rail a={[CX[si], 0.1, -1.4]} b={[CX[si], 0.1, 0.4]} c={C.gold} on />
        {/* CPU block */}
        <Slab p={[-4.4, 0.45, 1.5]} s={[1.9, 0.9, 1.4]} c={C.purple} glow={cs.count > 0 ? 0.25 : 0.1} />
        <Led p={[-4.4, 1.0, 1.5]} c={C.purple} on={!cs.done} />
        <Slab p={[-2.2, 0.35, 1.5]} s={[1.5, 0.7, 1.4]} c={C.orange} glow={cs.ir.startsWith("add") || cs.ir.startsWith("cmp") ? 0.7 : 0.12} />
        {cs.regs.map((v, i) => (<group key={i}>
          <Slab p={[-0.4 + i * 0.62, barH(v) / 2, 1.5]} s={[0.46, barH(v), 0.46]} c={cyc(i)} glow={0.3} />
          <Slab p={[-0.4 + i * 0.62, -0.02, 1.5]} s={[0.54, 0.05, 0.54]} c={C.light} />
        </group>))}
        {cs.mem.slice(0, MEM_WORDS).map((v, i) => (<group key={i}>
          <Slab p={[3.0 + (i % 4) * 0.55, barH(v) / 2, 1.0 + Math.floor(i / 4) * 1.0]} s={[0.4, barH(v), 0.4]} c={cs.touched === i ? C.gold : C.blue} glow={cs.touched === i ? 0.9 : 0.18} />
        </group>))}
        {Array.from({ length: code }, (_, i) => (
          <Slab key={i} p={[-5.2 + (i * 10.4) / Math.max(1, code - 1), 0.08, 3.6]} s={[0.4, 0.14, 0.5]} c={i === pcIdx && stage === "run" ? C.gold : STAGE_CODE} glow={i === pcIdx && stage === "run" ? 1 : 0} />
        ))}
      </group>)}
      readouts={[
        ["Stage", `${si + 1} of 5 · ${NAMES[si]}`],
        [`Product (${PRODUCT[stage as Stage]})`, String(product)],
        ["Instructions executed", `${cs.count} of ${total}`],
        ["Program counter PC", `0x${cs.pc.toString(16)}`],
        ["Accumulator eax", String(cs.regs[0])],
        ["Output so far", cs.out === "" ? "(nothing yet)" : `"${cs.out}"`],
      ]}
      controls={<>
        <Slider label="Instruction step (run stage)" value={step} min={0} max={160} step={1} digits={0} onChange={(x) => set("step", Math.round(x))} />
        <Pick label="Stage" value={stage as Stage} options={STAGES.map((id) => ({ id, label: STAGE_NAME[id] }))} onChange={(x) => set("stage", x)} />
        <Pick label="C program" value={prog as ProgId} options={(Object.keys(PROG_NAME) as ProgId[]).map((id) => ({ id, label: PROG_NAME[id] }))} onChange={(x) => set("prog", x)} />
        {prog === "sum" && <Slider label="Value of a" value={a} min={0} max={100} step={1} digits={0} onChange={(x) => set("a", Math.round(x))} />}
        {prog === "sum" && <Slider label="Value of b" value={b} min={0} max={100} step={1} digits={0} onChange={(x) => set("b", Math.round(x))} />}
        {prog === "loop" && <Slider label="Loop bound n" value={n} min={1} max={10} step={1} digits={0} onChange={(x) => set("n", Math.round(x))} />}
      </>}
      note={<div className="grid gap-3">
        <p>The gold token shows the stage. <b>{STAGE_NAME[stage as Stage]}</b> turns the previous file into the next one; every earlier chamber has a green LED. In the run stage the CPU repeats <b>fetch</b> (read the 3 bytes at PC), <b>decode</b> (opcode and operands), <b>execute</b> (the ALU or a register or RAM changes) and moves PC on by 3, or jumps. Register bars (eax, ebx, ecx, edx) and RAM cells grow with their values; the strip at the front is the instruction memory with the PC cell in gold.</p>
        <pre className="max-h-56 overflow-auto rounded-xl bg-soft p-3 text-xs leading-relaxed text-head" aria-label="What this stage produces">{listing.join("\n")}</pre>
        <p className="text-sm">This is a toy 3-byte instruction set made for the lab (not x86 machine code), but the five stages and the fetch-decode-execute cycle are exactly the ones in the syllabus.</p>
      </div>}
    />
  );
}
const STAGE_CODE = "#4d6574";
