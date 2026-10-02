"use client";
import { useMemo, useRef } from "react";
import type * as THREE from "three";
import { cylVolume, engine, slider, strokeOf } from "../sim/mechx";
import { Tick } from "../Stage";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { MECHX_SPECS } from "../meta/mechx.specs";
import { C, Box } from "../kit";
import { Graph, Rod, type XY } from "../kit2";

const RR = 0.7, LL = 2.1;
/** Pressure (schematic, relative) inside the cylinder at a crank angle, for the indicator dot. */
function pressure(crank: number, r: number, ci: boolean) {
  const a = ((crank % 720) + 720) % 720, v = cylVolume(a, r), v1 = 1 + 1 / (r - 1);
  if (a < 180) return 1;
  if (a < 360) return (v1 / v) ** 1.4;
  if (a < 540) { const peak = (r ** 1.4) * (ci ? 1.6 : 2.8); const vc = 1 / (r - 1); return ci && a < 400 ? r ** 1.4 * 1.6 : peak * (vc / v) ** 1.4 * (ci ? 1 : 1); }
  return 1.05;
}

function Mechanism({ crank0, rpm, playing, ci }: { crank0: number; rpm: number; playing: boolean; ci: boolean }) {
  const crank = useRef<THREE.Group>(null), rod = useRef<THREE.Group>(null), piston = useRef<THREE.Group>(null), inV = useRef<THREE.Mesh>(null), exV = useRef<THREE.Mesh>(null), flame = useRef<THREE.Mesh>(null), ang = useRef(crank0);
  const tick = (dt: number) => {
    if (playing) ang.current = (ang.current + Math.min(dt, 0.05) * (rpm / 60) * 360 * 0.25) % 720;
    else ang.current = crank0;
    const a = ang.current, th = (a * Math.PI) / 180, x = slider(a, RR, LL), py = x;
    if (crank.current) crank.current.rotation.z = -th;
    const pinX = RR * Math.sin(th), pinY = RR * Math.cos(th);
    if (piston.current) piston.current.position.y = py;
    if (rod.current) { rod.current.position.set(pinX / 2, (pinY + py) / 2, 0); rod.current.rotation.z = Math.atan2(pinX, py - pinY); }
    const s = strokeOf(a), lift = (open: boolean) => (open ? -0.18 : 0);
    if (inV.current) inV.current.position.y = RR + LL + 0.95 + lift(s === "suction");
    if (exV.current) exV.current.position.y = RR + LL + 0.95 + lift(s === "exhaust");
    if (flame.current) { const on = s === "power" && a < 420; flame.current.scale.setScalar(on ? 1 + 0.4 * Math.sin(a) : 0.001); }
  };
  return (<group>
    <Tick fn={tick} />
    <Rod a={[0, LL - RR + 0.2, 0]} b={[0, RR + LL + 1.0, 0]} r={0.62} color="#e8f1f5" o={0.16} />
    <group ref={crank}><Rod a={[0, 0, 0]} b={[0, RR, 0]} r={0.12} color={C.grey} /><mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.45, 0.45, 0.25, 24]} /><meshStandardMaterial color={C.dark} /></mesh></group>
    <group ref={rod}><Rod a={[0, -LL / 2, 0]} b={[0, LL / 2, 0]} r={0.08} color={C.light} /></group>
    <group ref={piston}><Box p={[0, 0.25, 0]} s={[1.1, 0.5, 1.1]} c="#9aa8b0" /><Box p={[0, 0.42, 0]} s={[1.12, 0.05, 1.12]} c={C.dark} /></group>
    <mesh ref={inV} position={[-0.3, RR + LL + 0.95, 0]}><cylinderGeometry args={[0.18, 0.05, 0.12, 16]} /><meshStandardMaterial color={C.blue} /></mesh>
    <mesh ref={exV} position={[0.3, RR + LL + 0.95, 0]}><cylinderGeometry args={[0.18, 0.05, 0.12, 16]} /><meshStandardMaterial color={C.red} /></mesh>
    <Box p={[0, RR + LL + 1.12, 0]} s={[0.12, 0.2, 0.12]} c={ci ? C.purple : C.gold} />
    <mesh ref={flame} position={[0, RR + LL + 0.75, 0]}><sphereGeometry args={[0.35, 16, 16]} /><meshStandardMaterial color={C.orange} emissive={C.orange} emissiveIntensity={1.2} transparent opacity={0.8} /></mesh>
  </group>);
}

export default function Engine4sLab() {
  const [P, set, reset] = useLabParams(MECHX_SPECS.engine4s);
  const { r, rpm, bore, stroke, crank, fuel } = P;
  const ci = fuel === "ci";
  const e = engine(bore, stroke, r, rpm, ci);
  const loop = useMemo<XY[]>(() => Array.from({ length: 145 }, (_, i) => { const a = i * 5; return [cylVolume(a, r), pressure(a, r, ci)] as XY; }), [r, ci]);
  const pmax = Math.max(...loop.map((p) => p[1])) * 1.1;
  return (
    <LabFrame
      label="A cut-away single-cylinder four-stroke engine: crank, connecting rod and piston move, intake (blue) and exhaust (red) valves open in turn and a flame flashes on the power stroke; a P–V indicator diagram has a dot at the current crank angle"
      camera={[1.6, 1.4, 9.5]}
      onReset={reset}
      scene={(playing) => (<group>
        <group position={[-2.6, -1.9, 0]}><Mechanism crank0={crank} rpm={rpm} playing={playing} ci={ci} /></group>
        <Graph x0={0.2} y0={-2} w={4.6} h={4} xr={[0, 1 + 1 / (r - 1)]} yr={[0, pmax]} curves={[{ pts: loop, color: ci ? C.purple : C.gold, w: 3 }]} marker={[cylVolume(crank, r), pressure(crank, r, ci)]} />
      </group>)}
      readouts={[
        ["Stroke at this crank angle", `${strokeOf(crank)} (${crank.toFixed(0)}°)`],
        ["Swept volume", `${e.Vs.toFixed(0)} cm³`],
        ["Clearance volume", `${e.Vc.toFixed(1)} cm³`],
        ["Air-standard efficiency", `${e.eta.toFixed(1)} % (${ci ? "Diesel, ρ = 2" : "Otto"})`],
        ["Mean piston speed", `${e.pistonSpeed.toFixed(2)} m/s`],
        ["Power strokes per second", e.powerStrokesPerS.toFixed(1)],
      ]}
      controls={<>
        <Slider label="Compression ratio r" value={r} min={6} max={22} step={0.1} digits={1} onChange={(x) => set("r", x)} />
        <Pick label="Engine" value={fuel} options={[{ id: "si", label: "Spark ignition (petrol)" }, { id: "ci", label: "Compression ignition (diesel)" }]} onChange={(x) => set("fuel", x)} />
        <Slider label="Engine speed (animation)" value={rpm} min={60} max={3000} step={10} digits={0} unit=" rpm" onChange={(x) => set("rpm", x)} />
        <Slider label="Crank angle (when paused)" value={crank} min={0} max={720} step={1} digits={0} unit="°" onChange={(x) => set("crank", x)} />
        <Slider label="Bore" value={bore} min={50} max={150} step={1} digits={0} unit=" mm" onChange={(x) => set("bore", x)} />
        <Slider label="Stroke" value={stroke} min={50} max={150} step={1} digits={0} unit=" mm" onChange={(x) => set("stroke", x)} />
      </>}
      note={<p>Two crank revolutions (720°) make one cycle: <b>suction</b> (intake valve open, piston going down), <b>compression</b> (both valves shut), <b>power</b> (spark plug fires, or diesel is injected into air hot from compression, and burning gas drives the piston down) and <b>exhaust</b> (exhaust valve open, piston pushing gases out). Only one stroke in four does work, so a flywheel carries the engine through the others. Compression ratio r = (V<sub>s</sub> + V<sub>c</sub>)/V<sub>c</sub>; petrol engines are limited to about 6–10 by knock, diesels use 14–22. The indicator diagram and valve timing are idealised (valves open exactly at dead centres); press Pause and use the crank-angle slider to step through.</p>}
    />
  );
}
