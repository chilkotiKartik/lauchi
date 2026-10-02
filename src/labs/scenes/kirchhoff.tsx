"use client";
import { Line } from "@react-three/drei";
import { useMemo } from "react";
import { eng, twoSource } from "../sim/elecy";
import { LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { ELECY_SPECS } from "../meta/elecy.specs";
import { C, Floor, type V3 } from "../kit";
import { Flow } from "../kit2";
import { Cell, Node, Resistor, Wire } from "./elecy-kit";

const len = (p: V3[]) => p.slice(1).reduce((s, q, i) => s + Math.hypot(q[0] - p[i][0], q[1] - p[i][1], q[2] - p[i][2]), 0);
const flat = (p: V3[]): V3[] => p.map((q) => [q[0], 0.005, q[2]]);

export default function KirchhoffLab() {
  const [P, set, reset] = useLabParams(ELECY_SPECS.kirchhoff);
  const { V1, R1, V2, R2, R3 } = P;
  const r = twoSource(V1, R1, V2, R2, R3);
  const k = 2.6 / Math.max(Math.abs(V1), Math.abs(V2), 1);
  const h1 = V1 * k, h2 = V2 * k, hA = r.VA * k;
  const g = useMemo(() => {
    const GL: V3 = [-3, 0, 1.5], GM: V3 = [0, 0, 1.5], GR: V3 = [3, 0, 1.5];
    const TL: V3 = [-3, h1, 1.5], TL2: V3 = [-3, h1, -1.5], TR: V3 = [3, h2, 1.5], TR2: V3 = [3, h2, -1.5], A: V3 = [0, hA, -1.5];
    const p1: V3[] = [GM, GL, TL, TL2, A], p2: V3[] = [GM, GR, TR, TR2, A], p3: V3[] = [A, GM];
    return { GL, GM, GR, TL, TL2, TR, TR2, A, p1, p2, p3, L1: len(p1), L2: len(p2), L3: len(p3) };
  }, [h1, h2, hA]);
  const Imax = Math.max(Math.abs(r.I1), Math.abs(r.I2), Math.abs(r.I3), 1e-9);
  const vel = (I: number) => (I / Imax) * 1.6;
  const pmax = Math.max(r.I1 ** 2 * R1, r.I2 ** 2 * R2, r.P3, 1e-9);
  return (
    <LabFrame
      label="A two-source circuit drawn as a potential landscape: each wire is raised to its voltage, batteries are vertical lifts, resistors are slopes, and gold charges flow along every branch at a speed set by its current"
      camera={[5.5, 4.2, 6.5]}
      onReset={reset}
      scene={() => (<group position={[0, -1, 0]}>
        <Floor size={9} divisions={18} />
        {/* floor shadow of the schematic */}
        <Line points={flat([g.GL, g.TL2, g.A, g.TR2, g.GR, g.GL])} color={C.grey} lineWidth={1.4} dashed dashSize={0.12} gapSize={0.08} />
        <Line points={flat([g.A, g.GM])} color={C.grey} lineWidth={1.4} dashed dashSize={0.12} gapSize={0.08} />
        {/* ground rail at 0 V */}
        <Wire pts={[g.GL, g.GR]} c={C.dark} r={0.05} />
        {/* batteries lift the potential */}
        {Math.abs(h1) > 0.05 ? <Cell a={g.GL} b={g.TL} color={C.green} /> : null}
        {Math.abs(h2) > 0.05 ? <Cell a={g.GR} b={g.TR} color={C.blue} /> : null}
        {/* level wires at the battery potential */}
        <Wire pts={[g.TL, g.TL2]} c={C.green} glow={0.3} />
        <Wire pts={[g.TR, g.TR2]} c={C.blue} glow={0.3} />
        {/* resistors: potential falls along them */}
        <Resistor a={g.TL2} b={g.A} glow={(r.I1 ** 2 * R1) / pmax} />
        <Resistor a={g.TR2} b={g.A} glow={(r.I2 ** 2 * R2) / pmax} />
        <Resistor a={g.A} b={g.GM} glow={r.P3 / pmax} />
        <Node p={g.A} c={C.purple} r={0.14} />
        <Node p={g.GM} c={C.light} />
        <Flow path={g.p1} n={Math.round(g.L1 * 2.4)} speed={vel(r.I1) / g.L1} color={C.gold} r={0.075} />
        <Flow path={g.p2} n={Math.round(g.L2 * 2.4)} speed={vel(r.I2) / g.L2} color={C.gold} r={0.075} />
        <Flow path={g.p3} n={Math.round(g.L3 * 2.4)} speed={vel(r.I3) / g.L3} color={C.orange} r={0.075} />
      </group>)}
      readouts={[
        ["Node voltage V_A", eng(r.VA, "V")],
        ["I₁ = mesh current 1", eng(r.I1, "A")],
        ["I₂ (from source 2)", eng(r.I2, "A")],
        ["I₃ = I₁ + I₂ (KCL)", eng(r.I3, "A")],
        ["Power given by V1 / V2", `${eng(r.P1, "W")} / ${eng(r.P2, "W")}`],
        ["Power in resistors", eng(r.Pr, "W")],
      ]}
      controls={<>
        <Slider label="Source 1 voltage V1" value={V1} min={0} max={50} step={0.5} digits={1} unit=" V" onChange={(x) => set("V1", x)} />
        <Slider label="Series resistor R1" value={R1} min={1} max={100} step={1} digits={0} unit=" Ω" onChange={(x) => set("R1", x)} />
        <Slider label="Source 2 voltage V2 (− = reversed)" value={V2} min={-50} max={50} step={0.5} digits={1} unit=" V" onChange={(x) => set("V2", x)} />
        <Slider label="Series resistor R2" value={R2} min={1} max={100} step={1} digits={0} unit=" Ω" onChange={(x) => set("R2", x)} />
        <Slider label="Shared resistor R3" value={R3} min={1} max={200} step={1} digits={0} unit=" Ω" onChange={(x) => set("R3", x)} />
      </>}
      note={<>
        <p><b>Read the picture as a hill.</b> Height is electric potential. The dark rail on the floor is the common node at 0 V. Each battery (green V1 on the left, blue V2 on the right) is a vertical lift; a wire keeps its height (no resistance, no drop); each resistor is a slope, and its colour glows with the power it turns into heat. The purple ball is node A. Gold dots are conventional current: they climb through a battery and slide down the resistors, faster where the current is larger. A dot that moves backwards through a battery means that battery is being charged.</p>
        <p><b>KVL:</b> walk any closed loop and you return to the same height: V1 − I₁R1 − I₃R3 = 0. <b>KCL:</b> what flows into A leaves it: I₁ + I₂ = I₃. <b>Node analysis</b> uses one unknown, V_A = (V1/R1 + V2/R2)/(1/R1 + 1/R2 + 1/R3). <b>Mesh analysis</b> uses loop currents I₁ and I₂′ = −I₂: (R1+R3)I₁ − R3I₂′ = V1 and −R3I₁ + (R2+R3)I₂′ = −V2. Both give the same answer, and the power the sources give equals the power in the resistors.</p>
        <p><b>Try:</b> make V2 equal to V_A so that source 2 delivers nothing; reverse V2; or make R3 very large and watch A rise towards the source voltages.</p>
      </>}
    />
  );
}
