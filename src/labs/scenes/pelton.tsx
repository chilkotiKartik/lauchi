"use client";
import { useMemo, useRef } from "react";
import type * as THREE from "three";
import { pelton, peltonEta } from "../sim/mechx";
import { Tick } from "../Stage";
import { LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { MECHX_SPECS } from "../meta/mechx.specs";
import { C, type V3 } from "../kit";
import { Flow, Graph, Rod, sample } from "../kit2";

function Wheel({ rpm }: { rpm: number }) {
  const g = useRef<THREE.Group>(null);
  return (<group ref={g}>
    <Tick fn={(dt) => { if (g.current) g.current.rotation.z -= Math.min(dt, 0.05) * Math.min(14, rpm / 50); }} />
    <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[1.3, 1.3, 0.3, 32]} /><meshStandardMaterial color="#7a8a93" /></mesh>
    {Array.from({ length: 16 }, (_, i) => { const a = (i / 16) * Math.PI * 2; return (
      <group key={i} position={[Math.cos(a) * 1.55, Math.sin(a) * 1.55, 0]} rotation={[0, 0, a]}>
        <mesh position={[0, 0, 0.18]}><sphereGeometry args={[0.26, 12, 10, 0, Math.PI]} /><meshStandardMaterial color={C.light} side={2} /></mesh>
        <mesh position={[0, 0, -0.18]} rotation={[Math.PI, 0, 0]}><sphereGeometry args={[0.26, 12, 10, 0, Math.PI]} /><meshStandardMaterial color={C.light} side={2} /></mesh>
      </group>); })}
    <Rod a={[0, 0, -1]} b={[0, 0, 1]} r={0.12} color={C.dark} />
  </group>);
}

export default function PeltonLab() {
  const [P, set, reset] = useLabParams(MECHX_SPECS.pelton);
  const { H, d, D, rpm } = P;
  const p = pelton(H, d, D, rpm);
  const jet = useMemo<V3[]>(() => [[-5, 1.75, 0], [-0.4, 1.75, 0]], []);
  const splashA = useMemo<V3[]>(() => [[-0.3, 1.75, 0.2], [0.3, 2.6, 1.2]], []);
  const splashB = useMemo<V3[]>(() => [[-0.3, 1.75, -0.2], [0.3, 2.6, -1.2]], []);
  const curve = useMemo(() => sample((x) => peltonEta(x) * 100, 0, 1, 80), []);
  return (
    <LabFrame
      label="A Pelton wheel with split buckets turning as a high-speed water jet from a nozzle strikes them and splashes sideways, beside a graph of hydraulic efficiency against the bucket-to-jet speed ratio"
      camera={[0.6, 1, 9.5]}
      onReset={reset}
      scene={() => (<group>
        <group position={[-1.2, 0, 0]}>
          <Wheel rpm={rpm} />
          <Rod a={[-5.6, 1.75, 0]} b={[-4.8, 1.75, 0]} r={0.3} color={C.dark} />
          <Rod a={[-5, 1.75, 0]} b={[-0.4, 1.75, 0]} r={0.06 + d / 1500} color="#7fc8f8" o={0.7} />
          <Flow path={jet} n={14} speed={Math.min(3, 0.4 + p.V / 60)} color="#d8f1ff" r={0.07} />
          <Flow path={splashA} n={6} speed={1} color="#d8f1ff" r={0.05} />
          <Flow path={splashB} n={6} speed={1} color="#d8f1ff" r={0.05} />
        </group>
        <Graph x0={1.8} y0={-2} w={4} h={3.6} xr={[0, 1]} yr={[0, 105]} curves={[{ pts: curve, color: C.blue, w: 3 }]} marker={[Math.min(1, p.ratio), p.etaH * 100]} vlines={[{ x: 0.5, color: C.gold }]} />
      </group>)}
      readouts={[
        ["Jet velocity V = C_v√(2gH)", `${p.V.toFixed(2)} m/s`],
        ["Flow rate Q", `${p.Q.toFixed(4)} m³/s`],
        ["Bucket speed u = πDN/60", `${p.u.toFixed(2)} m/s (u/V = ${p.ratio.toFixed(2)})`],
        ["Hydraulic efficiency", `${(p.etaH * 100).toFixed(1)} %`],
        ["Power developed", `${(p.P / 1000).toFixed(1)} kW of ${(p.Pin / 1000).toFixed(1)} kW`],
        ["Best speed (u = V/2)", `${p.rpmBest.toFixed(0)} rpm`],
      ]}
      controls={<>
        <Slider label="Net head H" value={H} min={50} max={1000} step={1} digits={0} unit=" m" onChange={(x) => set("H", x)} />
        <Slider label="Jet (nozzle) diameter d" value={d} min={20} max={300} step={1} digits={0} unit=" mm" onChange={(x) => set("d", x)} />
        <Slider label="Wheel pitch diameter D" value={D} min={0.5} max={4} step={0.05} digits={2} unit=" m" onChange={(x) => set("D", x)} />
        <Slider label="Wheel speed N" value={rpm} min={50} max={1500} step={5} digits={0} unit=" rpm" onChange={(x) => set("rpm", x)} />
      </>}
      note={<p>A Pelton wheel is an <b>impulse turbine</b>: all the head is turned into the kinetic energy of a free jet, V = C<sub>v</sub>√(2gH) (C<sub>v</sub> = 0.98), at atmospheric pressure. The splitter ridge in each bucket divides the jet and turns it back through about 165°. The force on the buckets is ρQ(V − u)(1 + k cos β) with β = 15° and bucket friction factor k = 0.95, so the power is that force × u. The hydraulic efficiency 2(V − u)(1 + k cos β)u/V² is greatest at <b>u = V/2</b> (gold line). Pelton wheels suit high head and small flow; Francis and Kaplan reaction turbines suit medium and low heads.</p>}
    />
  );
}
