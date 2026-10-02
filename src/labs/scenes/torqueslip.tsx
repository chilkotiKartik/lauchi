"use client";
import { useMemo, useRef } from "react";
import type * as THREE from "three";
import { inductionTorque, torqueSlip } from "../sim/elecx";
import { Tick } from "../Stage";
import { LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { ELECX_SPECS } from "../meta/elecx.specs";
import { C, Box } from "../kit";
import { Arrow, Coil, Graph } from "../kit2";

function Machine({ slip }: { slip: number }) {
  const field = useRef<THREE.Group>(null), rotor = useRef<THREE.Group>(null);
  const tick = (dt: number) => { const d = Math.min(dt, 0.05) * 2; if (field.current) field.current.rotation.z -= d; if (rotor.current) rotor.current.rotation.z -= d * (1 - slip); };
  return (<group>
    <Tick fn={tick} />
    {[0, 1, 2].map((k) => (<group key={k} rotation={[0, 0, (k * 2 * Math.PI) / 3]}><group position={[0, 1.9, 0]} rotation={[0, 0, Math.PI / 2]}><Coil p={[0, 0, 0]} turns={6} r={0.32} len={0.9} color={[C.red, C.gold, C.blue][k]} /></group></group>))}
    <group ref={field}><Arrow from={[0, 0, 0.6]} to={[0, 1.5, 0.6]} color={C.purple} r={0.06} /></group>
    <group ref={rotor}>
      <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[1.05, 1.05, 1, 28, 1, true]} /><meshStandardMaterial color="#7a8a93" side={2} /></mesh>
      {Array.from({ length: 14 }, (_, i) => { const a = (i / 14) * Math.PI * 2; return <Box key={i} p={[Math.cos(a), Math.sin(a), 0]} s={[0.12, 0.12, 1.1]} c={C.orange} />; })}
    </group>
  </group>);
}

export default function TorqueSlipLab() {
  const [P, set, reset] = useLabParams(ELECX_SPECS.torqueslip);
  const { V, R2, X2, TL, f, poles } = P;
  const pp = Math.round(poles / 2) * 2;
  const r = torqueSlip(V, R2, X2, f, pp, TL);
  const Vph = (230 * V) / 100;
  const curve = useMemo(() => Array.from({ length: 121 }, (_, i) => { const s = Math.max(1e-4, 1 - i / 120); return [(1 - s) * 100, inductionTorque(s, Vph, R2, X2, f, pp)] as [number, number]; }), [Vph, R2, X2, f, pp]);
  const tTop = Math.max(TL * 1.2, r.Tmax * 1.15, 1);
  return (
    <LabFrame
      label="An induction motor: three stator coils create a magnetic field arrow that rotates at synchronous speed while the cage rotor turns slightly slower; a graph shows torque against speed with the load line and the operating point"
      camera={[1.8, 0.4, 9.5]}
      onReset={reset}
      scene={() => (<group>
        <group position={[-3, 0, 0]}><Machine slip={r.stalls ? 1 : (r.s ?? 1)} /></group>
        <Graph x0={-0.4} y0={-2} w={5} h={4} xr={[0, 100]} yr={[0, tTop]} curves={[{ pts: curve, color: C.green, w: 3 }, { pts: [[0, TL], [100, TL]], color: C.red, dashed: true }]}
          marker={r.s !== null ? [(1 - r.s) * 100, TL] : [0, inductionTorque(1, Vph, R2, X2, f, pp)]} vlines={[{ x: (1 - r.sm) * 100, color: C.gold }]} />
      </group>)}
      readouts={[
        ["Synchronous speed N_s = 120f/P", `${r.Ns.toFixed(0)} rpm`],
        ["Slip at maximum torque R₂/X₂", r.sm.toFixed(3)],
        ["Maximum torque", `${r.Tmax.toFixed(1)} N·m`],
        ["Starting torque", `${r.Tst.toFixed(1)} N·m`],
        ["Running point", r.stalls ? "Stalls: load exceeds T_max" : `s = ${(r.s! * 100).toFixed(2)} %, N = ${r.N.toFixed(0)} rpm`],
        ["Rotor current frequency sf", `${r.fr.toFixed(2)} Hz`],
      ]}
      controls={<>
        <Slider label="Supply voltage" value={V} min={50} max={110} step={1} digits={0} unit=" %" onChange={(x) => set("V", x)} />
        <Slider label="Rotor resistance R₂" value={R2} min={0.05} max={1} step={0.01} digits={2} unit=" Ω" onChange={(x) => set("R2", x)} />
        <Slider label="Rotor reactance X₂" value={X2} min={0.3} max={3} step={0.05} digits={2} unit=" Ω" onChange={(x) => set("X2", x)} />
        <Slider label="Load torque T_L" value={TL} min={0} max={800} step={5} digits={0} unit=" N·m" onChange={(x) => set("TL", x)} />
        <Slider label="Frequency f" value={f} min={25} max={60} step={1} digits={0} unit=" Hz" onChange={(x) => set("f", x)} />
        <Slider label="Poles P" value={poles} min={2} max={8} step={2} digits={0} onChange={(x) => set("poles", x)} />
      </>}
      note={<p>Three stator currents 120° apart produce a field of constant size that <b>rotates</b> at N<sub>s</sub> = 120f/P (purple arrow). It cuts the rotor bars, induces currents and drags the rotor round, but the rotor must lag (slip s = (N<sub>s</sub> − N)/N<sub>s</sub>) or nothing would be induced. With stator impedance neglected, T = 3V²R₂s/[ω<sub>s</sub>(R₂² + (sX₂)²)]: almost linear in s near synchronous speed, a peak <b>T<sub>max</sub> at s = R₂/X₂</b> (gold line) whose size does not depend on R₂, then falling to the starting torque at s = 1. Torque ∝ V², so voltage sags can stall a loaded motor. Per-phase voltage at 100 % is 230 V.</p>}
    />
  );
}
