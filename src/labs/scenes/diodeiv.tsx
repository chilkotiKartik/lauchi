"use client";
import { Line } from "@react-three/drei";
import { useMemo, useRef } from "react";
import type * as THREE from "three";
import { diodeCurrent, diodeModel, diodeQ, eng } from "../sim/elex";
import { Tick } from "../Stage";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { ELEX_SPECS } from "../meta/elex.specs";

const YMAX = 2.3;        // scene units for ±YMAX
const IFULL = 0.02;      // 20 mA fills the height

export default function DiodeIvLab() {
  const [P, set, reset] = useLabParams(ELEX_SPECS.diodeiv);
  const { Vs, R, mat, T, n, Vz } = P;
  const d = diodeModel(mat, T, n, Vz);
  const Q = diodeQ(Vs, R, d);
  const vmin = -(Vz + 2);
  // broken axis: the forward side (0 … 1.2 V) gets 45 % of the width so the knee is visible, the reverse side (0 … −(Vz+2)) the rest
  const xOf = (V: number) => (V >= 0 ? (V / 1.2) * 2.7 : (V / -vmin) * -3.3);
  const yOf = (I: number) => Math.max(-YMAX, Math.min(YMAX, (I / IFULL) * YMAX));
  const curve = useMemo(() => {
    const p: [number, number, number][] = [];
    for (let i = 0; i <= 200; i++) { const V = vmin + ((1.2 - vmin) * i) / 200; p.push([xOf(V), yOf(diodeCurrent(V, d)), 0]); }
    return p;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mat, T, n, Vz]);
  const loadLine = useMemo(() => {
    const p: [number, number, number][] = [];
    for (let i = 0; i <= 120; i++) { const V = vmin + ((1.2 - vmin) * i) / 120, I = (Vs - V) / R; if (Math.abs(I) <= IFULL * 1.05) p.push([xOf(V), yOf(I), 0.02]); }
    return p.length > 1 ? p : ([[0, 0, 0.02], [0.001, 0, 0.02]] as [number, number, number][]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Vs, R, Vz]);
  const q = useRef<THREE.Mesh>(null), t = useRef(0);
  const tick = (dt: number) => { t.current += Math.min(dt, 0.05); q.current?.scale.setScalar(1 + 0.18 * Math.sin(t.current * 4)); };
  const shown = ["forward", "reverse", "breakdown", "unbiased"].includes(Q.region) ? Q.region : "";
  return (
    <LabFrame
      label="A diode current–voltage curve in 3D with a straight load line crossing it and a pulsing dot at the operating point; the horizontal axis is stretched near zero volts to show the forward knee"
      camera={[0, 0.3, 8]}
      onReset={reset}
      scene={() => (<group>
        <Tick fn={tick} />
        <Line points={[[-3.6, 0, 0], [3.1, 0, 0]]} color="#9db0ba" lineWidth={1.5} />
        <Line points={[[0, -YMAX - 0.1, 0], [0, YMAX + 0.1, 0]]} color="#9db0ba" lineWidth={1.5} />
        <Line points={[[xOf(-Vz), -YMAX, 0], [xOf(-Vz), YMAX, 0]]} color="#5b6d77" lineWidth={1} dashed dashSize={0.1} gapSize={0.08} />
        <Line points={curve} color="#44c95a" lineWidth={3.2} />
        <Line points={loadLine} color="#2ba6f5" lineWidth={2.4} />
        <mesh ref={q} position={[xOf(Q.V), yOf(Q.I), 0.05]}><sphereGeometry args={[0.15, 16, 16]} /><meshStandardMaterial color="#ff5a5f" emissive="#ff5a5f" emissiveIntensity={0.45} /></mesh>
        <mesh position={[xOf(Q.V), 0, 0.03]}><sphereGeometry args={[0.07, 10, 10]} /><meshBasicMaterial color="#ffc83d" /></mesh>
        <Line points={[[xOf(Q.V), 0, 0.03], [xOf(Q.V), yOf(Q.I), 0.03]]} color="#ffc83d" lineWidth={1.2} />
      </group>)}
      readouts={[
        ["Diode current I_D", eng(Q.I, "A")], ["Diode voltage V_D", eng(Q.V, "V")], ["Region", shown],
        ["Dynamic resistance r_d", eng(Q.rd, "Ω")], ["Diode power", eng(Q.P, "W")], ["Thermal voltage kT/q", eng(d.VT, "V")],
      ]}
      controls={<>
        <Slider label="Source voltage V_s" value={Vs} min={-25} max={25} step={0.1} digits={1} unit=" V" onChange={(x) => set("Vs", x)} />
        <Slider label="Series resistor R" value={R} min={10} max={10000} step={10} digits={0} unit=" Ω" onChange={(x) => set("R", x)} />
        <Pick label="Material" value={mat} options={[{ id: "si", label: "Silicon" }, { id: "ge", label: "Germanium" }]} onChange={(x) => set("mat", x)} />
        <Slider label="Temperature T" value={T} min={250} max={400} step={1} digits={0} unit=" K" onChange={(x) => set("T", x)} />
        <Slider label="Ideality factor n" value={n} min={1} max={2} step={0.05} digits={2} onChange={(x) => set("n", x)} />
        <Slider label="Zener breakdown V_z" value={Vz} min={2} max={20} step={0.1} digits={1} unit=" V" onChange={(x) => set("Vz", x)} />
      </>}
      note={<p>The green curve is the Shockley equation I = I_S(e^(V/nV_T) − 1) with a steep breakdown line below −V_z; the blue line is the load line I = (V_s − V)/R set by the source and resistor, and the red dot where they cross is the operating (Q) point. Forward, the current rises exponentially past a knee near 0.6 V for silicon and 0.2 V for germanium; reverse, only the tiny I_S flows until breakdown. Heating raises I_S (it roughly doubles per 10 K) and moves the knee to lower voltage. The dynamic resistance r_d = nV_T/I is the slope at the Q point. The horizontal axis is stretched around 0 V, and the current axis is clipped at ±20 mA. Ideal Shockley plus a 5 Ω breakdown line: no series bulk resistance.</p>}
    />
  );
}
