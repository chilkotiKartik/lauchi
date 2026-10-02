"use client";
import { Line } from "@react-three/drei";
import { useMemo, useRef } from "react";
import type * as THREE from "three";
import { loadPower, si, thevenin } from "../sim/elec";
import { Tick } from "../Stage";
import { LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { ELEC_SPECS } from "../meta/elec.specs";

const LO = Math.log10(0.5), HI = Math.log10(200), W = 6, H = 2.6;
const xOfR = (R: number) => ((Math.log10(R) - LO) / (HI - LO) - 0.5) * W;

function Bar({ x, h, color }: { x: number; h: number; color: string }) {
  const hh = Math.max(0.03, h);
  return <mesh position={[x, hh / 2, 0]}><boxGeometry args={[0.42, hh, 0.42]} /><meshStandardMaterial color={color} roughness={0.45} /></mesh>;
}

export default function TheveninLab() {
  const [P, set, reset] = useLabParams(ELEC_SPECS.thevenin);
  const { V, R1, R2, RL } = P;
  const T = thevenin(V, R1, R2, RL);
  const curve = useMemo(() => {
    const pts: [number, number, number][] = [];
    for (let i = 0; i <= 120; i++) { const R = 10 ** (LO + ((HI - LO) * i) / 120); pts.push([xOfR(R), (loadPower(T.Vth, T.Rth, R) / T.Pmax) * H, 0]); }
    return pts;
  }, [T.Vth, T.Rth, T.Pmax]);
  const mark = useRef<THREE.Mesh>(null), t = useRef(0);
  const tick = (dt: number) => { t.current += Math.min(dt, 0.05); mark.current?.scale.setScalar(1 + 0.15 * Math.sin(t.current * 4)); };
  const yNow = (T.PL / T.Pmax) * H;
  const iMax = Math.max(T.I1, 1e-9), vScale = 2.2 / Math.max(V, 1e-9);
  return (
    <LabFrame
      label="A curve of load power against load resistance on a log axis with a moving marker at the chosen load and a gold marker at the maximum, above coloured bars for the source voltage, load voltage and currents"
      camera={[0, 0.8, 8.5]}
      onReset={reset}
      scene={() => (<group>
        <Tick fn={tick} />
        <group position={[0, -0.2, 0]}>
          <Line points={curve} color="#44c95a" lineWidth={3} />
          <Line points={[[-W / 2, 0, 0], [W / 2, 0, 0]]} color="#9db0ba" lineWidth={1.5} />
          <Line points={[[xOfR(T.RLopt), 0, 0], [xOfR(T.RLopt), H + 0.2, 0]]} color="#ffc83d" lineWidth={1.5} />
          <mesh position={[xOfR(T.RLopt), H, 0]}><sphereGeometry args={[0.12, 14, 14]} /><meshStandardMaterial color="#ffc83d" emissive="#ffc83d" emissiveIntensity={0.4} /></mesh>
          <mesh ref={mark} position={[xOfR(RL), yNow, 0]}><sphereGeometry args={[0.16, 16, 16]} /><meshStandardMaterial color="#ff5a5f" emissive="#ff5a5f" emissiveIntensity={0.35} /></mesh>
          <Line points={[[xOfR(RL), 0, 0], [xOfR(RL), yNow, 0]]} color="#ff5a5f" lineWidth={1.5} />
        </group>
        <group position={[-2.2, -2.9, 1.4]}>
          <Bar x={0} h={V * vScale} color="#44c95a" />
          <Bar x={0.7} h={T.VL * vScale} color="#2ba6f5" />
          <Bar x={1.6} h={(T.I1 / iMax) * 1.6} color="#ffc83d" />
          <Bar x={2.3} h={(T.I2 / iMax) * 1.6} color="#a970ff" />
          <Bar x={3.0} h={(T.IL / iMax) * 1.6} color="#ff9a1f" />
          <mesh position={[1.5, -0.03, 0]}><boxGeometry args={[3.8, 0.05, 0.7]} /><meshStandardMaterial color="#5b6d77" /></mesh>
        </group>
      </group>)}
      readouts={[
        ["V_th = V·R2/(R1+R2)", `${T.Vth.toFixed(2)} V`], ["R_th = R1‖R2", `${T.Rth.toFixed(2)} Ω`], ["Load current I_L", si(T.IL, "A")],
        ["Load power P_L", si(T.PL, "W")], ["Maximum P = V_th²/4R_th", si(T.Pmax, "W")], ["Efficiency P_L / P_source", `${(T.eff * 100).toFixed(1)} %`],
      ]}
      controls={<>
        <Slider label="Battery V" value={V} min={1} max={48} step={0.5} digits={1} unit=" V" onChange={(x) => set("V", x)} />
        <Slider label="Series resistor R1" value={R1} min={1} max={100} step={0.5} digits={1} unit=" Ω" onChange={(x) => set("R1", x)} />
        <Slider label="Shunt resistor R2" value={R2} min={1} max={100} step={0.5} digits={1} unit=" Ω" onChange={(x) => set("R2", x)} />
        <Slider label="Load R_L" value={RL} min={1} max={200} step={0.5} digits={2} unit=" Ω" onChange={(x) => set("RL", x)} />
      </>}
      note={<p>The battery feeds R1 in series, R2 is across the output terminals and R_L is the load. Seen from the load the network is a single source V_th = V·R2/(R1+R2) behind R_th = R1‖R2. The green curve is P_L = V_th²R_L/(R_th+R_L)² against R_L on a logarithmic axis; the red marker is your load and the gold marker is the peak at R_L = R_th, where P_max = V_th²/(4R_th). Bars at the front, from the left: battery V (green), load voltage (blue), and the currents I₁ through R1 (gold), I₂ through R2 (purple) and I_L (orange); by KCL I₁ = I₂ + I_L. At the matched load the efficiency measured from the battery is below 50 %, so power lines are never run at maximum-power transfer.</p>}
    />
  );
}
