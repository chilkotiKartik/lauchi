"use client";
import { useMemo } from "react";
import { eng, superposition, type ladder } from "../sim/elecy";
import { LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { ELECY_SPECS } from "../meta/elecy.specs";
import { Box, C, type V3 } from "../kit";
import { Arrow, Flow } from "../kit2";
import { Cell, Node, Resistor, Wire } from "./elecy-kit";

type Branches = ReturnType<typeof ladder>;
const at = (x: number, z: number, y = 0.06): V3 => [x, y, z];
const P = {
  GL: at(-3, 1), TL: at(-3, -1), A: at(-1, -1), A0: at(-1, 1), B: at(1, -1), B0: at(1, 1), GR: at(3, 1), SR: at(3, -1),
};
const len = (p: V3[]) => p.slice(1).reduce((s, q, i) => s + Math.hypot(q[0] - p[i][0], q[1] - p[i][1], q[2] - p[i][2]), 0);
const PATHS: { key: keyof Branches; pts: V3[]; sign: number }[] = [
  { key: "i1", pts: [P.GL, P.TL, P.A], sign: 1 },
  { key: "i2", pts: [P.A, P.A0], sign: 1 },
  { key: "i3", pts: [P.A, P.B], sign: 1 },
  { key: "iL", pts: [P.B, P.B0], sign: 1 },
  { key: "i3", pts: [P.B0, P.A0], sign: 1 },
  { key: "i1", pts: [P.A0, P.GL], sign: 1 },
];
const LENS = PATHS.map((p) => len(p.pts));
const SRC_PATH: V3[] = [P.B0, P.GR, P.SR, P.B], SRC_LEN = len(SRC_PATH);

function Board({ y, br, Is, vOn, iOn, dot, imax, loadGlow }: { y: number; br: Branches; Is: number; vOn: boolean; iOn: boolean; dot: string; imax: number; loadGlow: number }) {
  const vel = (I: number, L: number) => ((I / imax) * 1.3) / L;
  return (
    <group position={[0, y, 0]}>
      <Box p={[0, -0.04, 0]} s={[7.2, 0.06, 2.8]} c="#1c3540" o={0.82} />
      <Wire pts={[P.GL, P.GR]} c={C.dark} r={0.04} />
      {vOn ? <Cell a={[P.GL[0], P.GL[1], 0.55]} b={[P.TL[0], P.TL[1], -0.55]} r={0.2} color={C.green} /> : null}
      <Wire pts={vOn ? [P.GL, [P.GL[0], P.GL[1], 0.55]] : [P.GL, P.TL]} c={vOn ? C.light : C.white} glow={vOn ? 0 : 0.4} />
      {vOn ? <Wire pts={[[P.TL[0], P.TL[1], -0.55], P.TL]} /> : null}
      <Resistor a={P.TL} b={P.A} r={0.11} />
      <Resistor a={P.A} b={P.A0} r={0.11} />
      <Resistor a={P.A} b={P.B} r={0.11} />
      <Resistor a={P.B} b={P.B0} r={0.13} glow={loadGlow} />
      <Node p={P.A} c={C.purple} /><Node p={P.B} c={C.blue} />
      {/* current source: a ring with an arrow, or an open gap when switched off */}
      <mesh position={[3, 0.06, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.42, 0.06, 10, 28]} /><meshStandardMaterial color={iOn ? C.purple : C.grey} emissive={iOn ? C.purple : "#000000"} emissiveIntensity={0.4} /></mesh>
      {iOn ? <Arrow from={[3, 0.06, 0.3]} to={[3, 0.06, -0.32]} color={C.purple} r={0.035} head={0.18} /> : null}
      <Wire pts={[P.GR, at(3, 0.42)]} c={iOn ? C.light : C.grey} />
      <Wire pts={[at(3, -0.42), P.SR, P.B]} c={iOn ? C.light : C.grey} />
      {PATHS.map((p, i) => <Flow key={i} path={p.pts} n={Math.round(LENS[i] * 3)} speed={vel(br[p.key] * p.sign, LENS[i])} color={dot} r={0.06} />)}
      {iOn && Is > 0 ? <Flow path={SRC_PATH} n={Math.round(SRC_LEN * 3)} speed={vel(Is, SRC_LEN)} color={dot} r={0.06} /> : null}
    </group>
  );
}

export default function SuperpositionLab() {
  const [Pm, set, reset] = useLabParams(ELECY_SPECS.superposition);
  const { V, Is, R1, R2, R3, RL } = Pm;
  const s = superposition(V, Is, R1, R2, R3, RL);
  const imax = Math.max(1e-9, ...[s.both, s.vOnly, s.iOnly].flatMap((b) => [b.i1, b.i2, b.i3, b.iL].map(Math.abs)), Is);
  const pl = (b: Branches) => b.iL * b.iL * RL, pmax = Math.max(1e-9, pl(s.both));
  const k = 2.2 / Math.max(1e-9, Math.abs(s.IL1) + Math.abs(s.IL2), Math.abs(s.IL));
  const bars = useMemo(() => ({ a: s.IL1 * k, b: s.IL2 * k, t: s.IL * k }), [s.IL1, s.IL2, s.IL, k]);
  return (
    <LabFrame
      label="Three stacked copies of a circuit with a voltage source, a current source and four resistors: the top layer has only the voltage source, the middle only the current source and the bottom both; charges flow in each, and bars on the right add the load currents"
      camera={[3.5, 5.5, 9]}
      onReset={reset}
      scene={() => (<group position={[-0.5, -0.4, 0]}>
        <Board y={2} br={s.vOnly} Is={Is} vOn iOn={false} dot={C.blue} imax={imax} loadGlow={pl(s.vOnly) / pmax} />
        <Board y={0.4} br={s.iOnly} Is={Is} vOn={false} iOn dot={C.purple} imax={imax} loadGlow={pl(s.iOnly) / pmax} />
        <Board y={-1.2} br={s.both} Is={Is} vOn iOn dot={C.gold} imax={imax} loadGlow={1} />
        {/* the sum: blue + purple stack equals the gold bar */}
        <group position={[4.4, -1.2, 0]}>
          <Box p={[0, Math.min(bars.a, 0) + Math.abs(bars.a) / 2, -0.3]} s={[0.35, Math.max(0.02, Math.abs(bars.a)), 0.35]} c={C.blue} glow={0.3} />
          <Box p={[0, bars.a + Math.min(bars.b, 0) + Math.abs(bars.b) / 2, -0.3]} s={[0.35, Math.max(0.02, Math.abs(bars.b)), 0.35]} c={C.purple} glow={0.3} />
          <Box p={[0, Math.min(bars.t, 0) + Math.abs(bars.t) / 2, 0.3]} s={[0.35, Math.max(0.02, Math.abs(bars.t)), 0.35]} c={C.gold} glow={0.3} />
          <Box p={[0, -0.03, 0]} s={[0.8, 0.05, 1.2]} c={C.grey} />
        </group>
      </group>)}
      readouts={[
        ["I_L from V alone (I′)", eng(s.IL1, "A")],
        ["I_L from I_s alone (I″)", eng(s.IL2, "A")],
        ["I_L with both = I′ + I″", eng(s.IL, "A")],
        ["P_L, but P′ + P″ is", `${eng(s.PL, "W")}, ${eng(s.Psum, "W")}`],
        ["Norton: I_N ‖ R_N", `${eng(s.IN, "A")} ‖ ${eng(s.RN, "Ω")}`],
        ["Thevenin V_th = I_N·R_N", eng(s.Vth, "V")],
      ]}
      controls={<>
        <Slider label="Voltage source V" value={V} min={0} max={100} step={0.5} digits={1} unit=" V" onChange={(x) => set("V", x)} />
        <Slider label="Current source I_s" value={Is} min={0} max={5} step={0.05} digits={2} unit=" A" onChange={(x) => set("Is", x)} />
        <Slider label="R1 (in series with V)" value={R1} min={1} max={200} step={1} digits={0} unit=" Ω" onChange={(x) => set("R1", x)} />
        <Slider label="R2 (node A to ground)" value={R2} min={1} max={200} step={1} digits={0} unit=" Ω" onChange={(x) => set("R2", x)} />
        <Slider label="R3 (node A to node B)" value={R3} min={1} max={200} step={1} digits={0} unit=" Ω" onChange={(x) => set("R3", x)} />
        <Slider label="Load R_L" value={RL} min={1} max={200} step={1} digits={0} unit=" Ω" onChange={(x) => set("RL", x)} />
      </>}
      note={<>
        <p><b>The circuit:</b> the battery V (green) drives R1 into node A (purple); R2 goes from A to ground, R3 from A to node B (blue); the load R_L hangs from B to ground and the current source I_s (purple ring) pumps current into B. <b>Top layer:</b> V alone, with the current source <i>opened</i> (grey). <b>Middle:</b> I_s alone, with the battery <i>shorted</i> (white wire). <b>Bottom:</b> both. The bars on the right show the load current from each layer: blue + purple stacked equals gold.</p>
        <p><b>Superposition theorem:</b> in a linear, bilateral network the current in any branch is the algebraic sum of the currents produced by each independent source acting alone, the others replaced by their internal resistance (ideal V → short, ideal I → open). It does <b>not</b> work for power, because P = I²R is not linear: compare P_L with P′ + P″.</p>
        <p><b>Norton’s theorem:</b> seen from R_L the whole network is a current source I_N (the short-circuit current at B) in parallel with R_N = R3 + R1‖R2 (all sources killed). Its dual, Thevenin, is V_th = I_N R_N in series with the same resistance, so I_L = I_N·R_N/(R_N + R_L). <b>Try:</b> set R_L = R_N for maximum power, or V = 0 to see the battery replaced by a short.</p>
      </>}
    />
  );
}
