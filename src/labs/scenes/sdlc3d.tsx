"use client";
import { Line } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useLabParams } from "../params";
import { BCAY_SPECS } from "../meta/bcay.specs";
import { LabFrame, Pick, Slider } from "../ui";
import { Bars, type V3 } from "../kit";
import { Flow } from "../kit2";
import { Tick } from "../Stage";
import { AGILE_BACKLOG, burndown, FIX_COST, sdlc, SPIRAL_QUADRANTS, WATERFALL, type SdlcModel } from "../sim/bcay";

const DONE = "#44c95a", NOW = "#ffc83d", TODO = "#3a4a54", QUAD = ["#2ba6f5", "#ff5a5f", "#44c95a", "#a970ff"];

function Block({ p, s, state }: { p: V3; s: V3; state: "done" | "now" | "todo" }) {
  const c = state === "done" ? DONE : state === "now" ? NOW : TODO;
  return (
    <mesh position={p}>
      <boxGeometry args={s} />
      <meshStandardMaterial color={c} emissive={state === "now" ? c : "#000000"} emissiveIntensity={state === "now" ? 0.45 : 0} roughness={0.45} metalness={0.1}
        transparent={state === "todo"} opacity={state === "todo" ? 0.45 : 1} />
    </mesh>
  );
}

const stepAt = (i: number): V3 => [-2.75 + i * 1.1, 1.0 - i * 0.48, 0];
function waterPath(at: number): V3[] {
  const out: V3[] = [];
  for (let i = 0; i <= at; i++) { const p = stepAt(i); out.push([p[0] - 0.45, p[1] + 0.2, 0.15], [p[0] + 0.5, p[1] + 0.2, 0.15]); }
  return out;
}

/** Waterfall: six phases as a one-way cascade. Work only flows down; behind it, the cost of fixing a requirement found in each phase. */
function Waterfall({ at, shipped }: { at: number; shipped: boolean }) {
  const steps = WATERFALL.map((_, i) => stepAt(i));
  // the work "water" runs along the tops of the phases reached so far and drops to the next one
  const path = waterPath(at); // cheap: at most 12 points
  return (
    <group>
      {steps.map((p, i) => <Block key={i} p={p} s={[1.0, 0.36, 0.9]} state={i < at ? "done" : i === at ? "now" : "todo"} />)}
      {path.length > 1 && <Flow path={path} n={4 + at * 3} speed={0.25} color="#7fd3ff" r={0.06} />}
      <Bars values={[...FIX_COST]} max={100} colors={FIX_COST.map((_, i) => (i === at ? NOW : i < at ? "#ff8a8d" : "#5b3a3e"))} x0={-2.75} z={-1.3} w={0.5} gap={0.6} height={2.6} y0={-1.6} glow={0.15} />
      {shipped && <Block p={[2.9, -2.0, 0.9]} s={[0.6, 0.6, 0.6]} state="done" />}
    </group>
  );
}

/** Spiral (Boehm): an Archimedean spiral over four quadrants; the radius is cumulative cost, the column is the risk still open. */
function Spiral({ k, risk }: { k: number; risk: number }) {
  const full = useMemo(() => Array.from({ length: 161 }, (_, i) => { const th = (i / 160) * 4 * Math.PI, r = 0.35 + (th / (2 * Math.PI)) * 1.2; return [r * Math.cos(th), 0.02, -r * Math.sin(th)] as V3; }), []);
  const upto = full.slice(0, Math.round((k / 8) * 160) + 1);
  const end = upto[upto.length - 1];
  return (
    <group position={[0, -1.4, 0]}>
      {QUAD.map((c, q) => (
        <mesh key={q} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[3.0, 32, (q * Math.PI) / 2, Math.PI / 2]} />
          <meshStandardMaterial color={c} transparent opacity={k % 4 === (q + 1) % 4 || (k % 4 === 0 && q === 3) ? 0.32 : 0.1} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      ))}
      <Line points={full} color="#4d6170" lineWidth={1.5} />
      <Line points={upto} color={NOW} lineWidth={4} />
      <mesh position={[end[0], 0.15, end[2]]}><sphereGeometry args={[0.14, 20, 20]} /><meshStandardMaterial color={NOW} emissive={NOW} emissiveIntensity={0.6} /></mesh>
      <mesh position={[0, (risk / 100) * 1.25, 0]}><cylinderGeometry args={[0.16, 0.16, Math.max(0.02, (risk / 100) * 2.5), 24]} /><meshStandardMaterial color="#ff5a5f" emissive="#ff5a5f" emissiveIntensity={0.3} roughness={0.4} /></mesh>
    </group>
  );
}

/** Scrum: one loop per two-week sprint (the dot is the daily stand-up going round), increments stacking up, and the burndown chart. */
function Scrum({ k, playing }: { k: number; playing: boolean }) {
  const dot = useRef<THREE.Mesh>(null), t = useRef(0);
  const left = burndown();
  const xs = Array.from({ length: 8 }, (_, i) => -2.8 + i * 0.8);
  return (
    <group>
      {xs.map((x, i) => (
        <mesh key={i} position={[x, 0.9, 0]}>
          <torusGeometry args={[0.28, 0.06, 12, 40]} />
          <meshStandardMaterial color={i < k - 1 ? DONE : i === k - 1 ? NOW : TODO} emissive={i === k - 1 ? NOW : "#000000"} emissiveIntensity={i === k - 1 ? 0.5 : 0} transparent={i >= k} opacity={i >= k ? 0.5 : 1} />
        </mesh>
      ))}
      {playing && <Tick fn={(dt) => { t.current += Math.min(dt, 0.05) * 1.2; const x = xs[k - 1]; dot.current?.position.set(x + 0.28 * Math.cos(t.current * 2 * Math.PI), 0.9 + 0.28 * Math.sin(t.current * 2 * Math.PI), 0.07); }} />}
      <mesh ref={dot} position={[xs[k - 1] + 0.28, 0.9, 0.07]}><sphereGeometry args={[0.07, 12, 12]} /><meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.9} /></mesh>
      {/* shipped increments: one block per finished sprint */}
      {Array.from({ length: k }, (_, i) => <Block key={i} p={[xs[i], -0.05, 0.6]} s={[0.5, 0.3, 0.5]} state={i === k - 1 ? "now" : "done"} />)}
      <Bars values={left} max={AGILE_BACKLOG} colors={left.map((_, i) => (i < k - 1 ? "#5aa9e6" : i === k - 1 ? NOW : "#2a3b47"))} x0={-2.8} z={-1.2} w={0.42} gap={0.38} height={2.4} y0={-1.9} glow={0.1} />
    </group>
  );
}

export default function SDLC3DLab() {
  const [P, set, reset] = useLabParams(BCAY_SPECS.sdlc3d);
  const { model, phase } = P;
  const s = sdlc(model, phase);
  const k = Math.round(phase);
  const stepLabel = model === "waterfall" ? "Month" : model === "spiral" ? "Quadrant step" : "Sprint";

  return (
    <LabFrame
      label={`${model === "waterfall" ? "Waterfall cascade" : model === "spiral" ? "Boehm spiral" : "Scrum sprints and burndown"} at step ${k}: what is finished, what has shipped and what a requirement change costs now`}
      camera={model === "spiral" ? [0, 5.5, 5.5] : [0, 1.6, 7.6]}
      onReset={reset}
      scene={(playing) => (
        <group>
          {model === "waterfall" && <Waterfall at={s.index} shipped={s.shipped} />}
          {model === "spiral" && <Spiral k={k} risk={s.risk} />}
          {model === "agile" && <Scrum k={k} playing={playing} />}
        </group>
      )}
      readouts={[
        ["Now", s.stage],
        ["Working software in users' hands", s.shipped ? "Yes" : "Not yet"],
        ["Cost to fix a requirement change now", `${s.fixCost}× (vs. 1× at the start)`],
        model === "agile" ? ["Backlog left", `${s.backlog} of ${AGILE_BACKLOG} points`] : ["Open risk (rough)", `${s.risk}%`],
      ]}
      controls={
        <>
          <Slider label={`${stepLabel} (time step)`} value={phase} min={1} max={8} step={1} digits={0} onChange={(v) => set("phase", v)} />
          <Pick<SdlcModel> label="Process model" value={model} onChange={(v) => set("model", v)} options={[
            { id: "waterfall", label: "Waterfall" }, { id: "spiral", label: "Spiral (Boehm)" }, { id: "agile", label: "Agile: Scrum" },
          ]} />
        </>
      }
      note={
        model === "waterfall" ? (
          <p><b>Waterfall</b> runs {WATERFALL.join(" → ")} once, each phase signed off before the next. The blocks are the phases (green done, yellow now); the red bars behind them are the commonly quoted relative cost of fixing a requirements mistake found in each phase: 1×, 5×, 10×, 20×, 50×, 100×. Nothing usable ships until Deployment, so a misunderstanding is discovered late and expensively. It suits small, well-understood projects with fixed requirements.</p>
        ) : model === "spiral" ? (
          <p><b>Spiral</b> (Boehm, 1986) repeats four quadrants per loop: {SPIRAL_QUADRANTS.join(" → ")}. The spiral&apos;s growing radius is the money spent so far; the red column is the risk still open. Every loop starts by attacking the biggest risks (often with a prototype), so risk falls sharply each loop. It suits large, risky projects; its cost is the overhead of risk analysis.</p>
        ) : (
          <p><b>Scrum</b> builds the product in fixed two-week sprints. Each loop is a sprint (the dot goes round once per daily stand-up), each block is a working increment shipped at its end, and the bars are the <b>burndown</b>: story points left of a {AGILE_BACKLOG}-point backlog after each sprint. The team&apos;s velocity rises from 20 to about 30 points per sprint as it settles. Because users see software every two weeks, a changed requirement simply goes into the next sprint (about 2× cost, not 100×).</p>
        )
      }
      viva={[
        ["Why is a late change so expensive in Waterfall?", "By then the requirement is built into the design, code, tests and documents; all of them must be redone. Studies by Boehm and IBM put the cost 50–100× higher after release than during requirements."],
        ["What happens in each quadrant of the spiral model?", "1. Determine objectives and constraints; 2. Identify and resolve risks (prototypes, analysis); 3. Develop and test the next level of the product; 4. Review and plan the next loop."],
        ["What are velocity and a burndown chart in Scrum?", "Velocity is the number of story points a team finishes per sprint. A burndown chart plots the work remaining after each sprint; its slope is the velocity and it shows when the backlog will be done."],
        ["When would you still choose Waterfall?", "When requirements are fixed and well understood, the technology is familiar and the project is small or must follow a strict contract or regulation."],
      ]}
    />
  );
}
