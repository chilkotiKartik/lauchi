"use client";
import { Line } from "@react-three/drei";
import { useMemo, useRef } from "react";
import type * as THREE from "three";
import { TAU, si, threePhase } from "../sim/elec";
import { Tick } from "../Stage";
import { Check, LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { ELEC_SPECS } from "../meta/elec.specs";

const COL = ["#ff5a5f", "#ffc83d", "#2ba6f5"];
const DEG = Math.PI / 180;

function Arrow({ len, color, thick }: { len: number; color: string; thick: number }) {
  return (<>
    <mesh position={[(len - 0.16) / 2, 0, 0]}><boxGeometry args={[len - 0.16, thick, thick]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.25} /></mesh>
    <mesh position={[len - 0.08, 0, 0]} rotation={[0, 0, -Math.PI / 2]}><coneGeometry args={[thick * 2, 0.2, 10]} /><meshStandardMaterial color={color} /></mesh>
  </>);
}

export default function ThreePhaseLab() {
  const [P, set, reset] = useLabParams(ELEC_SPECS.threephase);
  const { VL, Z, phi, conn, lead } = P;
  const Vph = conn === "star" ? VL / Math.sqrt(3) : VL;   // volts across each impedance (= VL/√3 in star)
  const R = threePhase(Vph, conn, Z, phi, lead);
  const shift = (lead ? 1 : -1) * phi * DEG;
  const waves = useMemo(() => {
    const mk = (off: number) => Array.from({ length: 121 }, (_, i) => { const a = (i / 120) * TAU; return [(a / TAU) * 4 - 2, 0.7 * Math.sin(a - off), 0] as [number, number, number]; });
    return { v: [0, 1, 2].map((k) => mk((k * TAU) / 3)), i: [0, 1, 2].map((k) => mk((k * TAU) / 3 - shift)) };
  }, [shift]);
  const vArr = [useRef<THREE.Group>(null), useRef<THREE.Group>(null), useRef<THREE.Group>(null)];
  const iArr = [useRef<THREE.Group>(null), useRef<THREE.Group>(null), useRef<THREE.Group>(null)];
  const dots = [useRef<THREE.Mesh>(null), useRef<THREE.Mesh>(null), useRef<THREE.Mesh>(null)];
  const t = useRef(0);
  const tick = (dt: number) => {
    t.current += Math.min(dt, 0.05) * 1.1;
    const wt = t.current;
    for (let k = 0; k < 3; k++) {
      const a = wt - (k * TAU) / 3;
      vArr[k].current?.rotation.set(0, 0, a);
      iArr[k].current?.rotation.set(0, 0, a + shift);
      const m = dots[k].current; if (m) m.position.set((((wt % TAU) / TAU) * 4) - 2, 0.7 * Math.sin(wt - (k * TAU) / 3), 0);
    }
  };
  return (
    <LabFrame
      label="Three coloured voltage phasors 120 degrees apart rotating with three thinner current phasors offset by the load angle, beside the six matching sine waves with moving dots"
      camera={[0.8, 0.8, 8]}
      onReset={reset}
      scene={() => (<group>
        <Tick fn={tick} />
        <group position={[-2.6, 0, 0]}>
          {[0, 1, 2].map((k) => (<group key={`v${k}`} ref={vArr[k]}><Arrow len={1.7} color={COL[k]} thick={0.07} /></group>))}
          {[0, 1, 2].map((k) => (<group key={`i${k}`} ref={iArr[k]}><Arrow len={1.1} color={COL[k]} thick={0.045} /></group>))}
          <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.09, 0.09, 0.2, 14]} /><meshStandardMaterial color="#9db0ba" /></mesh>
          <Line points={Array.from({ length: 65 }, (_, i) => [1.8 * Math.cos((i / 64) * TAU), 1.8 * Math.sin((i / 64) * TAU), -0.05] as [number, number, number])} color="#33454e" lineWidth={1} />
        </group>
        <group position={[2.4, 0.2, 0]}>
          {[0, 1, 2].map((k) => (<Line key={`w${k}`} points={waves.v[k]} color={COL[k]} lineWidth={2.6} />))}
          {[0, 1, 2].map((k) => (<Line key={`c${k}`} points={waves.i[k]} color={COL[k]} lineWidth={1.2} dashed dashSize={0.08} gapSize={0.06} />))}
          <Line points={[[-2, 0, 0], [2, 0, 0]]} color="#9db0ba" lineWidth={1} />
          {[0, 1, 2].map((k) => (<mesh key={`d${k}`} ref={dots[k]}><sphereGeometry args={[0.07, 10, 10]} /><meshBasicMaterial color={COL[k]} /></mesh>))}
        </group>
      </group>)}
      readouts={[
        ["Phase voltage V_ph", `${Vph.toFixed(1)} V`], ["Phase current I_ph", `${R.Iph.toFixed(2)} A`], ["Line current I_L", `${R.IL.toFixed(2)} A`],
        ["Real power P = √3 V_L I_L cos φ", si(R.P, "W")], ["Reactive power Q", si(R.Q, "var")], ["Apparent power S", `${si(R.S, "VA")} · pf ${R.pf.toFixed(2)}`],
      ]}
      controls={<>
        <Slider label="Supply line voltage V_L" value={VL} min={100} max={690} step={1} digits={0} unit=" V" onChange={(x) => set("VL", x)} />
        <Slider label="Impedance |Z| per phase" value={Z} min={2} max={100} step={0.5} digits={1} unit=" Ω" onChange={(x) => set("Z", x)} />
        <Slider label="Load angle φ" value={phi} min={0} max={89} step={1} digits={0} unit=" °" onChange={(x) => set("phi", x)} />
        <Pick label="Connection" value={conn} options={[{ id: "star", label: "Star (Y)" }, { id: "delta", label: "Delta (Δ)" }]} onChange={(x) => set("conn", x)} />
        <Check label="Leading (capacitive) load" checked={lead} onChange={(x) => set("lead", x)} />
      </>}
      note={<p>Bold arrows are the three phase voltages R (red), Y (gold) and B (blue), 120° apart; thin arrows are the currents, lagging by φ for an inductive load or leading for a capacitive one. The waves show the same thing against time, and the dots are the instantaneous voltages. On the same supply line voltage V_L, star puts V_ph = V_L/√3 across each impedance and I_L = I_ph; delta puts the full V_L across each and I_L = √3·I_ph. Either way the balanced load takes P = √3 V_L I_L cos φ, Q = √3 V_L I_L sin φ (positive when lagging) and S = √3 V_L I_L. Delta draws three times the power of star for the same phase impedance on the same supply. Balanced load only: the phasors here are the R, Y, B phase quantities.</p>}
    />
  );
}
