"use client";
import { bitsOf, detMachine, detector, reduceStates, RED_MACHINE, RED_STATES } from "../sim/bcax";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { BCAX_SPECS } from "../meta/bcax.specs";
import { Arrow, Bench, Bits, C, Glide, Halo, Led, Node3, Packet, Rail, Txt, cyc, type V3 } from "./bcax-kit";

export default function FsmLab() {
  const [P, set, reset] = useLabParams(BCAX_SPECS.fsm);
  const { view, model, pat, inp, step } = P;
  const stream = bitsOf(inp, 8);
  const det = detector(pat, model, stream), m = detMachine(pat, model);
  const k = Math.min(step, 8), cur = k === 0 ? 0 : det.steps[k - 1].to, lastS = k > 0 ? det.steps[k - 1] : null;
  const S = det.states, xS = (s: number) => (s - (S - 1) / 2) * 1.9, zS = (s: number) => (s % 2 === 0 ? 0.3 : -0.5);
  const rounds = reduceStates(), ri = Math.min(step, rounds.length - 1), part = rounds[ri];
  const gi = (s: string) => part.findIndex((g) => g.includes(s));
  const posR = (s: string): V3 => { const g = gi(s), idx = part[g].indexOf(s); return [(g - (part.length - 1) / 2) * 2.6, 1.3, idx * 0.95 - (part[g].length - 1) * 0.475]; };
  const edges: { from: number; to: number; b: number; out: number }[] = [];
  for (let s2 = 0; s2 < S; s2++) for (const b of [0, 1]) { const r = m.delta(s2, b); edges.push({ from: s2, to: r.to, b, out: r.out }); }
  const act = lastS ? edges.find((e) => e.from === lastS.from && e.b === lastS.b) : undefined;
  const pathAct: V3[] | null = act ? [[xS(act.from), 1.2, zS(act.from)], [xS(act.to), 1.2, zS(act.to)]] : null;
  return (
    <LabFrame
      label={view === "detect" ? "State circles on a steel bench joined by blue and orange arrows for input 0 and 1: a gold packet follows each input bit along its transition while an output lamp lights when the sequence has just been detected" : "Five state spheres that glide together into equivalence classes as partition refinement runs, until the 5-state machine collapses to 3 states"}
      camera={[0, 3.6, 9.5]}
      onReset={reset}
      scene={() => (<group position={[0, -0.7, 0]}>
        <Bench w={13} d={6} />
        {view === "detect" ? (<group>
          {edges.map((e, i) => {
            const a: V3 = [xS(e.from), 1.2 + (e.b ? 0.12 : -0.12), zS(e.from)], b2: V3 = [xS(e.to), 1.2 + (e.b ? 0.12 : -0.12), zS(e.to)];
            const on = act === e;
            if (e.to === e.from) return <mesh key={i} position={[xS(e.from), 1.95 + (e.b ? 0.25 : 0), zS(e.from)]}><torusGeometry args={[0.22, 0.03, 8, 16]} /><meshStandardMaterial color={e.b ? C.orange : C.blue} emissive={e.b ? C.orange : C.blue} emissiveIntensity={on ? 1.5 : 0.5} /></mesh>;
            if (e.to > e.from) return <Arrow key={i} a={[a[0] + 0.4, a[1], a[2]]} b={[b2[0] - 0.4, b2[1], b2[2]]} c={e.b ? C.orange : C.blue} on={true} r={on ? 0.06 : 0.03} />;
            const yb = 0.3 + e.b * 0.25 + (e.from - e.to) * 0.1;
            return (<group key={i}>
              <Rail a={[a[0], 0.8, a[2]]} b={[a[0], yb, a[2]]} c={e.b ? C.orange : C.blue} on={true} r={on ? 0.06 : 0.03} />
              <Rail a={[a[0], yb, a[2]]} b={[b2[0], yb, b2[2]]} c={e.b ? C.orange : C.blue} on={true} r={on ? 0.06 : 0.03} />
              <Arrow a={[b2[0], yb, b2[2]]} b={[b2[0], 0.8, b2[2]]} c={e.b ? C.orange : C.blue} on={true} r={on ? 0.06 : 0.03} />
            </group>);
          })}
          {Array.from({ length: S }, (_, s2) => (
            <group key={s2}>
              <Node3 p={[xS(s2), 1.2, zS(s2)]} r={0.45} c={model === "moore" && s2 === m.L ? C.green : s2 === cur ? C.gold : "#3b5b78"} glow={s2 === cur ? 0.8 : 0.2} v={`${s2}`} tc={s2 === cur ? "#2a1d00" : "#ffffff"} />
              {s2 === cur && <Halo p={[xS(s2), 1.2, zS(s2)]} r={0.7} />}
            </group>
          ))}
          {model === "mealy" && edges.filter((e) => e.out === 1).map((e, i) => <Led key={i} p={[(xS(e.from) + xS(e.to)) / 2, 1.5, (zS(e.from) + zS(e.to)) / 2]} c={C.green} r={0.12} />)}
          {pathAct && <Packet path={pathAct} c={C.gold} speed={0.5} />}
          {stream.map((b, i) => <Bits key={i} p={[-3.5 + i * 1.0, 0.25, 2.3]} bits={[b]} s={0.5} c={i === k - 1 ? C.gold : i < k ? "#4f6f85" : C.blue} hl={i === k ? 0 : -1} />)}
          <Led p={[5.2, 1.4, 1.5]} c={C.green} on={lastS?.out === 1} r={0.4} />
          <Txt p={[5.2, 2.3, 1.5]} s={String(lastS?.hits ?? 0)} h={0.6} c={C.green} />
        </group>) : (<group>
          {RED_STATES.map((s2) => {
            const p = posR(s2);
            return (<Glide key={s2} to={p} playing={true}>
              <Node3 p={[0, 0, 0]} r={0.5} c={cyc(gi(s2))} glow={0.45} v={s2.toUpperCase()} tc="#10202a" />
              <Bits p={[0, -0.95, 0]} bits={RED_MACHINE.out[s2]} s={0.3} c={C.gold} />
            </Glide>);
          })}
          <Led p={[5.0, 1.4, 0]} c={C.green} on={part.length === 3} r={0.3} />
        </group>)}
      </group>)}
      readouts={view === "detect" ? [
        ["Input bits applied", `${k} of 8`], ["Current state", `S${cur}`], ["Output now", lastS ? String(lastS.out) : "0"],
        ["Matches found", String(lastS?.hits ?? 0)], ["States needed", `${det.states} (${model === "mealy" ? "Mealy" : "Moore"})`], ["Input stream", stream.join("")],
      ] : [
        ["Refinement round", `${ri} of ${rounds.length - 1}`], ["Classes now", String(part.length)], ["Groups", part.map((g) => g.join("")).join(" | ")],
        ["States after reduction", String(rounds[rounds.length - 1].length)], ["Saved flip-flops", String(Math.ceil(Math.log2(5)) - Math.ceil(Math.log2(rounds[rounds.length - 1].length)))],
      ]}
      controls={<>
        <Slider label={view === "detect" ? "Input bits applied" : "Refinement round"} value={step} min={0} max={8} step={1} digits={0} onChange={(x) => set("step", Math.round(x))} />
        <Pick label="Experiment" value={view} options={[{ id: "detect", label: "Sequence detector" }, { id: "reduce", label: "State reduction (5 states)" }]} onChange={(x) => set("view", x)} />
        {view === "detect" && <Pick label="Machine model" value={model} options={[{ id: "mealy", label: "Mealy (output on the arrow)" }, { id: "moore", label: "Moore (output in the state)" }]} onChange={(x) => set("model", x)} />}
        {view === "detect" && <Pick label="Sequence to detect" value={pat} options={[{ id: "101", label: "101" }, { id: "110", label: "110" }, { id: "1011", label: "1011" }]} onChange={(x) => set("pat", x)} />}
        {view === "detect" && <Slider label="Input stream (8 bits as a number)" value={inp} min={0} max={255} step={1} digits={0} onChange={(x) => set("inp", Math.round(x))} />}
      </>}
      note={view === "detect" ? (
        <p>A synchronous sequential circuit moves between <b>states</b> on each clock edge. In a <b>Mealy</b> machine the output depends on state and input (green lamps sit on arrows) so it needs only L states for an L-bit pattern; in a <b>Moore</b> machine the output depends on the state alone (green state), so it needs L + 1 states and answers one clock later. Blue arrows are input 0, orange arrows input 1. The detector allows overlapping patterns: 1011011 contains 1011 twice.</p>
      ) : (
        <p>State reduction merges states that give the same outputs and lead to equivalent states. Round 0 splits the states by output (the gold bits under each sphere). Each later round splits states whose next states fall in different classes. When nothing changes, the classes are the reduced machine: here a, c and e are equivalent, so 5 states become 3 and 3 flip-flops become 2. This is the partition (implication-table) method of PYQ Q3.16.</p>
      )}
    />
  );
}
