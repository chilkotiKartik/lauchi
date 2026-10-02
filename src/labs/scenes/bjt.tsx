"use client";
import { Line } from "@react-three/drei";
import { useMemo, useRef } from "react";
import type * as THREE from "three";
import { bjtOutputCurve, eng, fixedBias } from "../sim/elex";
import { Tick } from "../Stage";
import { Check, LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { ELEX_SPECS } from "../meta/elex.specs";

const W = 6, H = 3.4, VA = 100;
const MULT = [0.4, 0.7, 1, 1.4, 1.9];
const COLS = ["#5b6d77", "#2ba6f5", "#44c95a", "#ffc83d", "#a970ff"];

export default function BjtLab() {
  const [P, set, reset] = useLabParams(ELEC_SPECS.bjt);
  const { VCC, RB, RC, beta, early } = P;
  const va = early ? VA : Infinity;
  const B = fixedBias(VCC, RB * 1000, RC * 1000, beta, va);
  const icTop = Math.max(B.ICsat, 1e-6) * 1.25;
  const xs = (v: number) => (v / VCC) * W - W / 2, ys = (i: number) => Math.min(H, (i / icTop) * H);
  const curves = useMemo(() => MULT.map((m) => {
    const ib = Math.max(B.IB, (VCC - 0.7) / 2e6) * m, p: [number, number, number][] = [];
    for (let i = 0; i <= 60; i++) { const v = (VCC * i) / 60; p.push([xs(v), Math.min(H, ys(bjtOutputCurve(v, ib, beta, va))), 0]); }
    return p;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [VCC, RB, RC, beta, early]);
  const q = useRef<THREE.Mesh>(null), t = useRef(0);
  const tick = (dt: number) => { t.current += Math.min(dt, 0.05); q.current?.scale.setScalar(1 + 0.2 * Math.sin(t.current * 4)); };
  const bar = (v: number, max: number) => Math.max(0.04, (v / Math.max(max, 1e-12)) * 1.8);

  return (
    <LabFrame
      label="Bipolar Junction Transistor (BJT) curve tracer: output characteristics family, DC load line, and operating Q point"
      camera={[0, 0.8, 9.4]}
      onReset={reset}
      scene={() => (
        <group>
          <Tick fn={tick} />

          {/* Curve Tracer Oscilloscope Display */}
          <group position={[0.4, 0.2, 0]}>
            {/* Bezel Frame */}
            <mesh position={[0, H / 2, -0.04]}>
              <boxGeometry args={[W + 0.7, H + 0.7, 0.1]} />
              <meshStandardMaterial color="#16222a" roughness={0.4} metalness={0.6} />
            </mesh>
            <mesh position={[0, H / 2, -0.01]}>
              <planeGeometry args={[W + 0.45, H + 0.45]} />
              <meshBasicMaterial color="#0b171d" />
            </mesh>

            {/* Graticule Reticle Lines */}
            <Line points={[[-W / 2, 0, 0], [W / 2 + 0.2, 0, 0]]} color="#455a64" lineWidth={1.8} />
            <Line points={[[-W / 2, 0, 0], [-W / 2, H + 0.2, 0]]} color="#455a64" lineWidth={1.8} />

            {/* Characteristic Family of Curves */}
            {curves.map((c, k) => (
              <Line key={k} points={c} color={COLS[k]} lineWidth={k === 2 ? 3.8 : 2.2} />
            ))}

            {/* DC Load Line */}
            <Line points={[[xs(VCC), 0, 0.02], [xs(0), ys(B.ICsat), 0.02]]} color="#ff9a1f" lineWidth={3.2} />

            {/* Quiescent Operating Q-Point */}
            <mesh ref={q} position={[xs(B.VCE), ys(B.IC), 0.06]}>
              <sphereGeometry args={[0.16, 20, 20]} />
              <meshStandardMaterial color="#ff5a5f" emissive="#ff5a5f" emissiveIntensity={0.8} />
            </mesh>
          </group>

          {/* TO-220 Transistor Device on Left Breadboard */}
          <group position={[-3.8, -1.2, 0.6]}>
            {/* Breadboard Base */}
            <mesh position={[0, -0.4, 0]}>
              <boxGeometry args={[1.8, 0.18, 1.4]} />
              <meshStandardMaterial color="#e8f1f5" roughness={0.6} />
            </mesh>

            {/* Metal Heatsink Tab */}
            <mesh position={[0, 0.4, -0.06]}>
              <boxGeometry args={[0.8, 0.6, 0.08]} />
              <meshStandardMaterial color="#bdc3c7" metalness={0.9} roughness={0.15} />
            </mesh>
            {/* Transistor Epoxy Body */}
            <mesh position={[0, 0.1, 0]}>
              <boxGeometry args={[0.78, 0.6, 0.25]} />
              <meshStandardMaterial color="#1a252c" roughness={0.3} metalness={0.2} />
            </mesh>
            {/* Terminal Leads (Base, Collector, Emitter) */}
            {[-0.2, 0, 0.2].map((lx, i) => (
              <mesh key={i} position={[lx, -0.25, 0]}>
                <cylinderGeometry args={[0.025, 0.025, 0.35, 12]} />
                <meshStandardMaterial color="#cca43b" metalness={0.9} roughness={0.2} />
              </mesh>
            ))}
          </group>

          {/* Current Flow Column Meters (IB, IC, IE) */}
          <group position={[-1.8, -2.6, 0.8]}>
            <mesh position={[0.8, -0.1, 0]}>
              <boxGeometry args={[2.4, 0.12, 0.9]} />
              <meshStandardMaterial color="#1a252c" roughness={0.5} metalness={0.5} />
            </mesh>
            <mesh position={[0, bar(B.IB, B.IE) / 2, 0]}>
              <boxGeometry args={[0.42, bar(B.IB, B.IE), 0.42]} />
              <meshStandardMaterial color="#ffc83d" emissive="#ffc83d" emissiveIntensity={0.4} metalness={0.3} roughness={0.25} />
            </mesh>
            <mesh position={[0.75, bar(B.IC, B.IE) / 2, 0]}>
              <boxGeometry args={[0.42, bar(B.IC, B.IE), 0.42]} />
              <meshStandardMaterial color="#44c95a" emissive="#44c95a" emissiveIntensity={0.4} metalness={0.3} roughness={0.25} />
            </mesh>
            <mesh position={[1.5, bar(B.IE, B.IE) / 2, 0]}>
              <boxGeometry args={[0.42, bar(B.IE, B.IE), 0.42]} />
              <meshStandardMaterial color="#2ba6f5" emissive="#2ba6f5" emissiveIntensity={0.4} metalness={0.3} roughness={0.25} />
            </mesh>
          </group>
        </group>
      )}
      readouts={[
        ["Base current I_B", eng(B.IB, "A")], ["Collector current I_C", eng(B.IC, "A")], ["Emitter current I_E = I_B + I_C", eng(B.IE, "A")],
        ["V_CE at the Q point", `${B.VCE.toFixed(2)} V`], ["Region", B.region], ["Saturation current V_CC/R_C", eng(B.ICsat, "A")],
      ]}
      controls={<>
        <Slider label="Supply V_CC" value={VCC} min={1} max={30} step={0.5} digits={1} unit=" V" onChange={(x) => set("VCC", x)} />
        <Slider label="Base resistor R_B" value={RB} min={10} max={2000} step={10} digits={0} unit=" kΩ" onChange={(x) => set("RB", x)} />
        <Slider label="Collector resistor R_C" value={RC} min={0.1} max={10} step={0.1} digits={1} unit=" kΩ" onChange={(x) => set("RC", x)} />
        <Slider label="Current gain β" value={beta} min={20} max={400} step={5} digits={0} onChange={(x) => set("beta", x)} />
        <Check label="Early effect (V_A = 100 V)" checked={early} onChange={(x) => set("early", x)} />
      </>}
      note={<p>Each coloured curve is I_C against V_CE for a different base current; the green one is your actual I_B = (V_CC − 0.7 V)/R_B and the other four are 0.4×, 0.7×, 1.4× and 1.9× that. The orange DC load line joins the two extremes, V_CE = V_CC (cut-off) and I_C = V_CC/R_C (saturation); its crossing with your green curve is the Q point. In the active region I_C = βI_B; if βI_B would exceed the load-line limit the transistor saturates and V_CE drops to about 0.2 V, and with I_B = 0 it is cut off. The three bars at the front show I_B, I_C and I_E: the base current is tiny compared with the collector current. Fixed-bias circuit with V_BE = 0.7 V; the Early effect adds a slope of 1/V_A to the curves.</p>}
    />
  );
}
