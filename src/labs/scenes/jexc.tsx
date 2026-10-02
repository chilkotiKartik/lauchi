"use client";
import { EX_BLOCKS, excFlow, type ExKind } from "../sim/bcax";
import { Check, LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { BCAX_SPECS } from "../meta/bcax.specs";
import { Bench, C, Halo, Led, Packet, Slab, Txt, type V3 } from "./bcax-kit";

const KC = { run: C.green, throw: C.red, catch: C.gold, finally: C.purple, skip: "#3b4d57", out: C.blue } as const;
export default function JExcLab() {
  const [P, set, reset] = useLabParams(BCAX_SPECS.jexc);
  const { kind, all, early, step } = P;
  const fl = excFlow(kind as ExKind, all, early), k = Math.min(step, fl.steps.length), cur = k > 0 ? fl.steps[k - 1] : null;
  const state = new Map<number, (typeof fl.steps)[number]["kind"]>();
  fl.steps.slice(0, k).forEach((s) => { state.set(s.block, s.kind); });
  const Y = (b: number) => 4.0 - b * 0.62;
  const trail: V3[] = fl.steps.slice(0, k).map((s) => [-1.6, Y(s.block), 0.6] as V3);
  return (
    <LabFrame
      label="A column of code blocks try, stmt1, risky, stmt2, catch, catch, catch-all, finally and after: a gold token runs down them, a red bolt jumps from the throwing line to the matching catch block, and the finally block always lights up"
      camera={[0, 3.2, 9.5]}
      onReset={reset}
      scene={() => (<group position={[0, -0.6, 0]}>
        <Bench w={12} d={5} />
        {EX_BLOCKS.map((b, i) => {
          const st = state.get(i), active = cur?.block === i;
          return (<group key={i}>
            <Slab p={[0, Y(i), 0]} s={[4.2, 0.5, 0.6]} c={st ? KC[st] : "#26363f"} glow={active ? 1 : st ? 0.35 : 0.04} />
            <Txt p={[-1.8, Y(i), 0.35]} s={String(i)} h={0.26} c="#10202a" />
            {active && <Halo p={[0, Y(i), 0.35]} r={2.3} c={KC[st ?? "run"]} />}
            {(i === 4 || i === 5 || i === 6) && <Slab p={[2.4, Y(i), 0]} s={[0.4, 0.4, 0.4]} c={i === 6 && !all ? "#3b4d57" : C.gold} glow={i === 6 && !all ? 0 : 0.5} />}
          </group>);
        })}
        {trail.length > 1 && <Packet path={trail} c={C.white} speed={0.2} r={0.14} />}
        <Led p={[4.4, 3.4, 0]} c={fl.outcome === "propagates" ? C.red : fl.outcome === "caught" ? C.gold : C.green} r={0.4} />
        <Txt p={[4.4, 2.5, 0]} s={String(k)} h={0.7} c={C.gold} />
      </group>)}
      readouts={[
        ["Step", `${k} of ${fl.steps.length}`], ["Now", cur ? cur.line : "not started"], ["Console output", fl.steps.slice(0, k).length === fl.steps.length ? fl.output : "..."],
        ["Final outcome", fl.outcome === "normal" ? "completes normally" : fl.outcome === "caught" ? "exception caught and handled" : fl.outcome === "returned" ? "method returns (finally ran first)" : "exception propagates to the caller"],
      ]}
      controls={<>
        <Slider label="Step through the execution" value={step} min={0} max={9} step={1} digits={0} onChange={(x) => set("step", Math.round(x))} />
        <Pick label="What risky() does" value={kind} options={[{ id: "none", label: "Nothing wrong" }, { id: "arith", label: "Divides by zero (ArithmeticException)" }, { id: "index", label: "Bad array index (ArrayIndexOutOfBounds)" }, { id: "custom", label: "Throws custom checked exception" }]} onChange={(x) => set("kind", x)} />
        <Check label="Add catch (Exception e) as a last handler" checked={all} onChange={(x) => set("all", x)} />
        <Check label="Put return inside the try block" checked={early} onChange={(x) => set("early", x)} />
      </>}
      note={<p>When a statement in <code>try</code> throws, the rest of the try block is skipped and the JVM looks for the first <code>catch</code> whose type matches (the exception or a parent class); catch blocks must go from specific to general. The <code>finally</code> block runs <b>always</b>: after a normal finish, after a caught exception, and even before a <code>return</code>. A checked exception that no catch handles must be declared with <code>throws</code> and propagates to the caller after finally (PYQ Q7.6). <code>throw</code> raises an exception object; <code>throws</code> declares what a method may raise. Custom exceptions extend <code>Exception</code>.</p>}
    />
  );
}
