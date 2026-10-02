"use client";
import { useMemo } from "react";
import { FLOW_NAME, flowTrace, type FlowId, type Role } from "../sim/cstx";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { CSTX_SPECS } from "../meta/cstx.specs";
import { Instances, type Inst } from "../kit";
import { Bench, C, cyc, Glass, Led, Rail, Slab, Token, type V3 } from "./cstx-kit";

const POS: Record<Role, [number, number]> = {
  start: [-5.8, -1.2], init: [-4.3, -1.2], test: [-2.7, -1.2], body: [-1.1, -1.2], branch: [0.5, -1.2], out: [2.3, -1.2], end: [5.0, -1.2],
  cont: [-3.6, 1.0], step: [-1.9, 1.0], test2: [-0.2, 1.0], step2: [1.5, 1.0], brk: [3.4, 1.0], skip: [5.0, 1.0],
};
const COL: Record<Role, string> = { start: C.light, init: C.blue, test: C.gold, body: C.green, branch: C.gold, out: C.purple, end: C.light, cont: C.orange, step: C.orange, test2: C.gold, step2: C.orange, brk: C.red, skip: C.red };
const LABEL: Record<Role, string> = { start: "Start", init: "Initialise / assign", test: "Loop test (gate)", body: "Loop body", branch: "if / operand gate", out: "printf output", end: "End", cont: "continue siding", step: "Loop step (i++)", test2: "Inner loop test", step2: "Inner loop step", brk: "break exit", skip: "Operand skipped" };
const at = (r: Role, y = 0.16): V3 => [POS[r][0], y, POS[r][1]];
const GATES: Role[] = ["test", "branch", "test2"];
const LANES: [Role, Role][] = [["start", "init"], ["init", "test"], ["test", "body"], ["body", "branch"], ["branch", "out"], ["out", "end"], ["cont", "step"], ["step", "test2"], ["test2", "step2"], ["step2", "brk"], ["brk", "skip"], ["test", "step"], ["branch", "brk"], ["body", "cont"]];

export default function CtrlFlowLab() {
  const [P, set, reset] = useLabParams(CSTX_SPECS.ctrlflow);
  const { prog, step, n, vi, vj, vk } = P;
  const nn = Math.round(n), id = prog as FlowId;
  const run = useMemo(() => flowTrace(id, id === "pattern" ? Math.min(nn, 8) : nn, Math.round(vi), Math.round(vj), Math.round(vk)), [id, nn, vi, vj, vk]);
  const total = run.events.length - 1, k = Math.min(Math.round(step), total), ev = run.events[k];
  const vars = Object.entries(ev.vars);
  const outItems = useMemo(() => {
    const items: Inst[] = [];
    let col = 0, row = 0;
    for (const ch of ev.out) {
      if (ch === "\n") { row++; col = 0; continue; }
      if (ch !== " " && items.length < 70) items.push({ p: [-5.6 + col * 0.34, 0.12, 3.2 + row * 0.34], s: [0.26, 0.2, 0.26], c: cyc(ch.charCodeAt(0)) });
      col++;
    }
    return items;
  }, [ev.out]);
  const laps = useMemo(() => Array.from({ length: Math.min(ev.iter, 16) }, (_, i): Inst => ({ p: [-2.7 + (i % 8) * 0.17 - 0.6, 0.12 + Math.floor(i / 8) * 0.16, -2.3], s: [0.13, 0.12, 0.13], c: C.gold })), [ev.iter]);
  const gate = (r: Role) => (ev.role === r ? (ev.gate === null ? C.gold : ev.gate ? C.green : C.red) : "#6c5a2a");

  const src = run.source.map((l, i) => `${i + 1 === ev.line ? "▶" : " "} ${l}`);
  const nLabel = id === "primes" ? "Upper limit N" : id === "pattern" ? "Rows (max 8)" : "Loop bound n";
  return (
    <LabFrame
      label="A steel railway map: a glowing token moves between stations for initialise, loop test, body, if gate, print, step, break and continue; diamond gates flash green for true and red for false, discs pile up for each loop lap, bars show variable values and cubes at the front spell the program output"
      camera={[0, 7.2, 8.6]}
      onReset={reset}
      scene={(playing) => (<group position={[0, -0.4, 0]}>
        <Bench w={15} d={9} cz={0.4} />
        {LANES.map(([a, b], i) => <Rail key={i} a={at(a, 0.08)} b={at(b, 0.08)} c={C.blue} on={ev.role === a || ev.role === b} />)}
        {(Object.keys(POS) as Role[]).map((r) => GATES.includes(r)
          ? <group key={r} position={at(r, 0.28)} rotation={[0, Math.PI / 4, 0]}><Slab p={[0, 0, 0]} s={[0.78, 0.36, 0.78]} c={gate(r)} glow={ev.role === r ? 1.1 : 0.2} /></group>
          : <Slab key={r} p={at(r, 0.1)} s={[0.62, 0.2, 0.62]} c={COL[r]} glow={ev.role === r ? 1 : 0.15} />)}
        <Glass p={[-2.7, 0.45, -1.2]} s={[1.2, 0.9, 1.2]} c={C.gold} on={ev.role === "test"} />
        <group position={[-2.7, 0.3, -1.2]} rotation={[0, ev.iter * 0.7, 0]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.95, 0.04, 8, 28, Math.PI * 1.6]} /><meshStandardMaterial color={C.gold} emissive={C.gold} emissiveIntensity={0.6} /></mesh>
        </group>
        <Instances items={laps} cap={16} />
        <Token target={at(ev.role, 0.85)} playing={playing} c={ev.gate === false ? C.red : C.gold} />
        <Led p={[5.6, 0.2, -2.4]} c={run.truncated ? C.red : ev.role === "end" ? C.green : C.gold} />
        {/* variable pillars */}
        {vars.slice(0, 5).map(([name, v], i) => { const h = 0.1 + Math.min(1.6, Math.abs(v) / 8); return <Slab key={name} p={[3.4 + i * 0.6, h / 2, -3.3]} s={[0.4, h, 0.4]} c={v < 0 ? C.red : cyc(i)} glow={0.3} />; })}
        <Instances items={outItems} cap={70} />
        <Slab p={[-3.3, 0.02, 3.5]} s={[5.4, 0.06, 1.2]} c="#14202a" />
      </group>)}
      readouts={[
        ["Step", `${k} of ${total}`],
        ["Station", LABEL[ev.role]],
        ["What just happened", ev.note],
        ["Variables", vars.length ? vars.map(([a, b]) => `${a}=${b}`).join("  ") : "(none)"],
        ["Loop laps", String(ev.iter)],
        ["Output", ev.out === "" ? "(empty)" : `"${ev.out.replace(/\n/g, "↵")}"`],
      ]}
      controls={<>
        <Slider label="Program step" value={step} min={0} max={900} step={1} digits={0} onChange={(x) => set("step", Math.round(x))} />
        <Pick label="Program" value={id} options={(Object.keys(FLOW_NAME) as FlowId[]).map((x) => ({ id: x, label: FLOW_NAME[x] }))} onChange={(x) => set("prog", x)} />
        {(id === "primes" || id === "pattern" || id === "semicolon") && <Slider label={nLabel} value={n} min={1} max={30} step={1} digits={0} onChange={(x) => set("n", Math.round(x))} />}
        {id === "shortcirc" && <Slider label="Value of i" value={vi} min={-5} max={9} step={1} digits={0} onChange={(x) => set("vi", Math.round(x))} />}
        {id === "shortcirc" && <Slider label="Value of j" value={vj} min={-5} max={9} step={1} digits={0} onChange={(x) => set("vj", Math.round(x))} />}
        {id === "shortcirc" && <Slider label="Value of k" value={vk} min={-5} max={9} step={1} digits={0} onChange={(x) => set("vk", Math.round(x))} />}
      </>}
      note={<div className="grid gap-3">
        <p>A small C interpreter runs the program with real C rules (short-circuit <code>&amp;&amp;</code> and <code>||</code>, pre and post increment, <code>%</code>, <code>break</code>, <code>continue</code>) and records one event per statement, test and operand. The token stands on the station of the current event. <b>Diamond gates</b> flash green when the test is true and red when false; gold discs stack up once per loop lap; the pillars are the variables (red if negative) and the cubes at the front spell the printed output. Orange stations are the loop step and <code>continue</code>, red is <code>break</code> or an operand skipped by short-circuit.</p>
        <pre className="overflow-auto rounded-xl bg-soft p-3 text-xs leading-relaxed text-head" aria-label="Program source">{src.join("\n")}</pre>
        {run.truncated && <p role="note" className="text-sm font-bold text-head">This run is longer than the 900 events the lab records, so the end of the trace is cut off.</p>}
      </div>}
    />
  );
}
