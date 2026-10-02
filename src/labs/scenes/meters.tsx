"use client";
import { Line } from "@react-three/drei";
import { useMemo, useRef } from "react";
import type * as THREE from "three";
import { meter, multiplier, shunt } from "../sim/elecx";
import { Tick } from "../Stage";
import { LabFrame, Pick, Slider, Check } from "../ui";
import { useLabParams } from "../params";
import { ELECX_SPECS } from "../meta/elecx.specs";
import { C, Box, type V3 } from "../kit";

function Movement({ defl, ac, pmmc }: { defl: number; ac: boolean; pmmc: boolean }) {
  const g = useRef<THREE.Group>(null), t = useRef(0);
  const target = ((45 - defl) * Math.PI) / 180;
  const tick = (dt: number) => {
    t.current += Math.min(dt, 0.05);
    const jitter = ac && pmmc ? 0.06 * Math.sin(t.current * 40) : 0;
    if (g.current) g.current.rotation.z = target + jitter;
  };
  return (<group ref={g}>
    <Tick fn={tick} />
    {pmmc
      ? <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.55, 0.55, 0.9, 20, 1, true]} /><meshStandardMaterial color={C.orange} side={2} /></mesh>
      : <Box p={[0.35, 0, 0]} s={[0.7, 0.08, 0.6]} c="#9aa8b0" />}
    <Line points={[[0, 0, 0.5], [0, 2.4, 0.5]]} color={C.red} lineWidth={3} />
  </group>);
}

export default function MetersLab() {
  const [P, set, reset] = useLabParams(ELECX_SPECS.meters);
  const { I, fsd, Rm, range, ac, kind } = P;
  const m = meter(kind, I, fsd, ac);
  const pmmc = kind === "pmmc";
  const scale = useMemo<V3[]>(() => Array.from({ length: 31 }, (_, i) => { const a = ((45 - i * 3) * Math.PI) / 180; return [Math.sin(-a) * -2.5, Math.cos(a) * 2.5, 0.5]; }), []);
  const ticks = useMemo(() => Array.from({ length: 11 }, (_, k) => { const f = k / 10, d = pmmc ? 90 * f : 90 * f * f, a = ((45 - d) * Math.PI) / 180; return [[-Math.sin(a) * 2.3, Math.cos(a) * 2.3, 0.5], [-Math.sin(a) * 2.6, Math.cos(a) * 2.6, 0.5]] as V3[]; }), [pmmc]);
  const sh = shunt(Rm, fsd, range);
  return (
    <LabFrame
      label="A meter movement in cut-away: a permanent magnet and moving coil (or a moving iron vane), a pointer and a scale whose tick marks are evenly spaced for PMMC and crowded at the start for moving iron"
      camera={[0, 1.2, 8]}
      onReset={reset}
      scene={() => (<group position={[0, -1, 0]}>
        {pmmc ? (<>
          <Box p={[-1.1, 0, 0]} s={[0.7, 1.6, 0.9]} c={C.red} />
          <Box p={[1.1, 0, 0]} s={[0.7, 1.6, 0.9]} c={C.blue} />
          <Box p={[0, -1.1, 0]} s={[2.9, 0.6, 0.9]} c={C.dark} />
          <mesh><cylinderGeometry args={[0.3, 0.3, 0.92, 16]} /><meshStandardMaterial color="#c8d3d9" /></mesh>
        </>) : (<>
          <mesh rotation={[0, 0, 0]}><torusGeometry args={[0.9, 0.22, 12, 30]} /><meshStandardMaterial color={C.orange} /></mesh>
          <Box p={[-0.5, 0, 0]} s={[0.1, 0.9, 0.6]} c="#7a8a93" />
        </>)}
        <Movement defl={m.defl} ac={ac} pmmc={pmmc} />
        <Line points={scale} color={C.light} lineWidth={2} />
        {ticks.map((p, k) => <Line key={k} points={p} color={k === 10 ? C.red : C.white} lineWidth={2} />)}
      </group>)}
      readouts={[
        ["Deflection", `${m.defl.toFixed(1)}° of 90°`],
        ["Meter reads", `${m.reads.toFixed(2)} mA${ac && pmmc ? " (average of AC = 0)" : ac ? " RMS" : ""}`],
        ["Scale", m.scale],
        ["Works on AC?", m.worksAC ? "Yes (torque ∝ I²)" : "No: DC only"],
        ["Shunt for this range", Number.isFinite(sh) ? `${(sh * 1000).toFixed(2)} mΩ` : "range below FSD"],
        ["Multiplier for 10 V", `${multiplier(Rm, fsd, 10).toFixed(0)} Ω`],
      ]}
      controls={<>
        <Slider label="Current through the meter" value={I} min={-20} max={20} step={0.1} digits={1} unit=" mA" onChange={(x) => set("I", x)} />
        <Slider label="Full-scale current" value={fsd} min={5} max={100} step={1} digits={0} unit=" mA" onChange={(x) => set("fsd", x)} />
        <Pick label="Instrument" value={kind} options={[{ id: "pmmc", label: "PMMC (moving coil)" }, { id: "mi", label: "Moving iron (attraction type)" }]} onChange={(x) => set("kind", x)} />
        <Check label="Alternating current (50 Hz)" checked={ac} onChange={(x) => set("ac", x)} />
        <Slider label="Meter resistance R_m" value={Rm} min={1} max={100} step={1} digits={0} unit=" Ω" onChange={(x) => set("Rm", x)} />
        <Slider label="Extend to (ammeter range)" value={range} min={0.1} max={10} step={0.1} digits={1} unit=" A" onChange={(x) => set("range", x)} />
      </>}
      note={<p><b>PMMC:</b> a light coil sits in the radial field of a permanent magnet; torque = NBAI, balanced by a spring, so deflection ∝ I and the scale is <b>uniform</b>. Reverse the current and it deflects backwards; on AC the torque averages to zero (the pointer only trembles). Eddy currents in the aluminium former give damping. <b>Moving iron:</b> the coil’s field pulls a soft-iron vane; torque ∝ I² whichever way the current flows, so it works on AC (reading RMS) but its scale is <b>crowded at the start</b>. To extend an ammeter put a small <b>shunt</b> R<sub>sh</sub> = R<sub>m</sub>I<sub>m</sub>/(I − I<sub>m</sub>) in parallel; for a voltmeter add a series <b>multiplier</b> R = V/I<sub>m</sub> − R<sub>m</sub>.</p>}
    />
  );
}
