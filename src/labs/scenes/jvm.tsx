"use client";
import { jvmFrames } from "../sim/bcax";
import { LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { BCAX_SPECS } from "../meta/bcax.specs";
import { Arrow, Bench, C, Cell, Halo, Packet, Slab, Txt, type V3 } from "./bcax-kit";

const STAGES = ["Java src", "javac", "bytecode", "JVM", "any OS"] as const;
export default function JvmLab() {
  const [P, set, reset] = useLabParams(BCAX_SPECS.jvm);
  const { a, b, k, step } = P;
  const fr = jvmFrames(a, b, k), s = Math.min(step, fr.length - 1), f = fr[s];
  const sx = (i: number) => -5.2 + i * 2.6;
  const pipe: V3[] = [[sx(0), 3.8, 0.3], [sx(4), 3.8, 0.3]];
  return (
    <LabFrame
      label="A compile-and-run pipeline across the back of the bench: source to javac to bytecode to the JVM to any operating system; in front an operand stack tower grows and shrinks and local variable slots fill up as each bytecode instruction runs"
      camera={[0, 3.6, 11]}
      onReset={reset}
      scene={() => (<group position={[0, -0.6, 0]}>
        <Bench w={14} d={7} />
        {STAGES.map((n, i) => (<group key={n}>
          <Slab p={[sx(i), 3.8, 0]} s={[2.0, 0.9, 0.8]} c={i === 3 ? C.green : i === 2 ? C.gold : i === 1 ? C.orange : "#2f5a7a"} glow={0.4} />
          <Txt p={[sx(i), 3.8, 0.45]} s={["SRC", "jAVAC", "bYtE", "JVM", "OS"][i]} h={0.3} c="#10202a" />
          {i < 4 && <Arrow a={[sx(i) + 1.05, 3.8, 0]} b={[sx(i + 1) - 1.05, 3.8, 0]} c={C.light} on={true} />}
        </group>))}
        <Packet path={pipe} c={C.gold} speed={0.15} />
        {Array.from({ length: 4 }, (_, i) => (<group key={i}>
          <Cell p={[-4.5, 0.4 + i * 0.7, 1.0]} s={[1.6, 0.6, 0.6]} c={f.locals[i] !== null ? C.blue : "#26363f"} glow={f.locals[i] !== null ? 0.35 : 0.03} v={f.locals[i] ?? ""} th={0.36} />
          <Txt p={[-5.7, 0.4 + i * 0.7, 1.0]} s={i === 0 ? "-" : String(i)} h={0.3} c={C.light} glow={0.5} />
        </group>))}
        {f.stack.map((v, i) => <Cell key={`${i}-${v}`} p={[3.2, 0.4 + i * 0.7, 1.0]} s={[1.6, 0.6, 0.6]} c={C.purple} glow={i === f.stack.length - 1 ? 0.8 : 0.2} v={v} th={0.36} />)}
        <Slab p={[3.2, 0.05, 1.0]} s={[2.0, 0.1, 1.0]} c="#4a5d68" />
        <Slab p={[-4.5, 0.05, 1.0]} s={[2.0, 0.1, 1.0]} c="#4a5d68" />
        {f.pc >= 0 && <Halo p={[3.2, 0.4 + Math.max(0, f.stack.length - 1) * 0.7, 1.4]} r={0.9} />}
        <Txt p={[-4.5, 3.3, 1.0]} s="LOCALS" h={0.25} c={C.blue} />
        <Txt p={[3.2, 3.3, 1.0]} s="StACH" h={0.25} c={C.purple} />
      </group>)}
      readouts={[
        ["Bytecode step", `${s} of ${fr.length - 1}`], ["Instruction", f.pc < 0 ? "none yet" : f.op], ["Operand stack (top last)", f.stack.length ? f.stack.join(" ") : "empty"],
        ["Locals a, b, c", `${f.locals[1] ?? "-"}, ${f.locals[2] ?? "-"}, ${f.locals[3] ?? "-"}`], ["What happened", f.note],
      ]}
      controls={<>
        <Slider label="Step through the bytecode" value={step} min={0} max={11} step={1} digits={0} onChange={(x) => set("step", Math.round(x))} />
        <Slider label="Value of a" value={a} min={1} max={20} step={1} digits={0} onChange={(x) => set("a", Math.round(x))} />
        <Slider label="Value of b" value={b} min={1} max={20} step={1} digits={0} onChange={(x) => set("b", Math.round(x))} />
        <Slider label="Multiplier k in c = a + b * k" value={k} min={1} max={9} step={1} digits={0} onChange={(x) => set("k", Math.round(x))} />
      </>}
      note={<p><b>javac</b> compiles Java source to platform-independent <b>bytecode</b> (.class); the <b>JVM</b> on each operating system interprets (or JIT-compiles) that same bytecode, which is how Java achieves &quot;write once, run anywhere&quot; (PYQ Q7.1). The JDK contains the compiler and tools, the JRE contains the JVM and libraries. Each method call gets a frame with local variable slots and an <b>operand stack</b>: iload pushes, imul pops two and pushes the product. Here c = a + b * k, so the multiplication happens before the addition because of the order the bytecode was generated in.</p>}
    />
  );
}
