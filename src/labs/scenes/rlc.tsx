"use client";
import { Line } from "@react-three/drei";
import { useMemo, useRef } from "react";
import type * as THREE from "three";
import { rlc } from "../math";
import { Tick } from "../Stage";
import { LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { CORE_SPECS } from "../meta/core.specs";

export default function RlcLab() {
  const [P, set, reset] = useLabParams(CORE_SPECS.rlc);
  const { R, L: Lm, C: Cu, f } = P;
  const setR = (x: (typeof P)["R"]) => set("R", x), setL = (x: (typeof P)["L"]) => set("L", x), setC = (x: (typeof P)["C"]) => set("C", x), setF = (x: (typeof P)["f"]) => set("f", x);
  const r = rlc(R, Lm / 1000, Cu * 1e-6, f);
  const I = 1 / r.Z; // 1 V source ⇒ amplitude of current in amperes
  const S = 2.2 / Math.max(R * I, r.XL * I, r.XC * I, 0.001, 1);
  const vr = R * I * S, vl = r.XL * I * S, vc = r.XC * I * S;
  const t = useRef(0), grp = useRef<THREE.Group>(null);
  const tick = (dt: number) => { t.current += Math.min(dt, 0.05) * 1.6; if (grp.current) grp.current.rotation.z = t.current; };
  const wave = useMemo(() => (k: number, amp: number) => Array.from({ length: 200 }, (_, i) => { const x = (i / 199) * 6 - 3; return [x, amp * Math.sin((x + 3) * 2.2 - k), -2.6] as [number, number, number]; }), []);
  const vLine = wave(0, 0.9), iLine = wave(r.phase, 0.9);
  return (
    <LabFrame
      label="Series RLC circuit phasor diagram rotating live, with voltage and current waves"
      camera={[0, 1, 8]}
      onReset={reset}
      scene={() => (<group>
        <Tick fn={tick} />
        <group ref={grp} position={[-1.6, 0.6, 0]}>
          <Line points={[[0, 0, 0], [vr, 0, 0]]} color="#44c95a" lineWidth={4} />
          <Line points={[[vr, 0, 0], [vr, vl, 0]]} color="#ff5a5f" lineWidth={4} />
          <Line points={[[vr, vl, 0], [vr, vl - vc, 0]]} color="#2ba6f5" lineWidth={4} />
          <Line points={[[0, 0, 0], [vr, vl - vc, 0]]} color="#ffc83d" lineWidth={5} />
        </group>
        <Line points={vLine} color="#ffc83d" lineWidth={2.5} />
        <Line points={iLine} color="#44c95a" lineWidth={2.5} />
        <Line points={[[-3, -2.6, -2.6], [3, -2.6, -2.6]]} color="#33454e" lineWidth={1} />
        <mesh position={[2.4, 0.6, 0]}><sphereGeometry args={[0.001]} /><meshBasicMaterial /></mesh>
      </group>)}
      readouts={[["Impedance Z", `${r.Z.toFixed(1)} Ω`], ["Phase (V leads I)", `${((r.phase * 180) / Math.PI).toFixed(1)}°`], ["Resonant f₀", `${r.f0.toFixed(1)} Hz`], ["Q factor", r.Q.toFixed(2)], ["Current (1 V)", `${(I * 1000).toFixed(1)} mA`], ["Power factor", r.pf.toFixed(3)]]}
      controls={<>
        <Slider label="Resistance R" value={R} min={1} max={200} step={1} digits={0} unit=" Ω" onChange={setR} />
        <Slider label="Inductance L" value={Lm} min={10} max={500} step={1} digits={0} unit=" mH" onChange={setL} />
        <Slider label="Capacitance C" value={Cu} min={1} max={100} step={1} digits={0} unit=" µF" onChange={setC} />
        <Slider label="Frequency f" value={f} min={20} max={1000} step={1} digits={0} unit=" Hz" onChange={setF} />
      </>}
      note={<p>The phasor diagram spins at the drive frequency. Green is the voltage across R (in phase with the current), red across L (leads by 90°), blue across C (lags by 90°), and yellow is their vector sum: the source voltage. Its length over the current is the impedance Z = √(R² + (X<sub>L</sub> − X<sub>C</sub>)²). The waves at the back show the source voltage (yellow) and current (green); slide f through f₀ = 1/(2π√LC) and the phase flips from capacitive (current leads) to inductive (voltage leads), with Z dipping to R exactly at resonance.</p>}
    />
  );
}
