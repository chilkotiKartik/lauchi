"use client";
import { useMemo, useRef } from "react";
import type * as THREE from "three";
import { twoStroke, twoStrokePhase } from "../sim/mechy";
import { Tick } from "../Stage";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { MECHY_SPECS } from "../meta/mechy.specs";
import { Box, Poly, type V3 } from "../kit";
import { C, Flow, Rod } from "../kit2";

const RR = 0.7, LL = 2.8, CROWN = 0.45, BDC = LL - RR + CROWN, ST = 2 * RR, HEAD = LL + RR + CROWN + 0.45, BW = 1.1;
const D2R = Math.PI / 180;

function arcPts(a0: number, a1: number, r: number, cx: number, cy: number): V3[] {
  const n = 40, out: V3[] = [];
  for (let i = 0; i <= n; i++) { const a = (a0 + ((a1 - a0) * i) / n) * D2R; out.push([cx + r * Math.sin(a), cy + r * Math.cos(a), 0]); }
  return out;
}

function Engine({ crank0, rpm, playing, ci, eo, to, exTop, trTop }: { crank0: number; rpm: number; playing: boolean; ci: boolean; eo: number; to: number; exTop: number; trTop: number }) {
  const crank = useRef<THREE.Group>(null), rod = useRef<THREE.Group>(null), piston = useRef<THREE.Group>(null), mark = useRef<THREE.Mesh>(null);
  const exF = useRef<THREE.Group>(null), trF = useRef<THREE.Group>(null), inF = useRef<THREE.Group>(null), flame = useRef<THREE.Mesh>(null), ang = useRef(crank0);
  const tick = (dt: number) => {
    if (playing) ang.current = (ang.current + Math.min(dt, 0.05) * (rpm / 60) * 360 * 0.12) % 360;
    else ang.current = crank0;
    const a = ang.current, th = a * D2R, s = Math.sin(th), c = Math.cos(th);
    const pinY = RR * c + Math.sqrt(LL * LL - RR * RR * s * s);
    if (crank.current) crank.current.rotation.z = -th;
    if (piston.current) piston.current.position.y = pinY;
    if (rod.current) { rod.current.position.set((RR * s) / 2, (RR * c + pinY) / 2, 0); rod.current.rotation.z = Math.atan2(RR * s, pinY - RR * c); }
    if (exF.current) exF.current.visible = a >= eo && a <= 360 - eo;
    if (trF.current) trF.current.visible = a >= to && a <= 360 - to;
    if (inF.current) inF.current.visible = a > 200 && a < 345;
    if (flame.current) { const on = a < 30 || a > 350; flame.current.scale.setScalar(on ? 1 + 0.3 * Math.sin(a) : 0.001); }
    mark.current?.position.set(3.4 + 1.25 * s, 1.6 + 1.25 * c, 0.05);
  };
  const exPath = useMemo<V3[]>(() => [[BW / 2, BDC + exTop / 2, 0], [2.2, BDC + exTop / 2, 0], [2.2, BDC + exTop / 2 - 1.2, 0]], [exTop]);
  const trPath = useMemo<V3[]>(() => [[-0.7, 0.4, 0], [-0.95, 1.2, 0], [-0.95, BDC + trTop / 2, 0], [-0.1, BDC + trTop / 2 + 0.6, 0]], [trTop]);
  const inPath = useMemo<V3[]>(() => [[-2.6, -0.4, 0.2], [-1.1, -0.4, 0.2], [-0.4, -0.2, 0.2]], []);
  return (<group>
    <Tick fn={tick} />
    <Rod a={[0, BDC - 0.8, 0]} b={[0, HEAD, 0]} r={BW / 2 + 0.05} color="#e8f1f5" o={0.14} />
    <Box p={[0, HEAD + 0.08, 0]} s={[BW + 0.3, 0.16, BW + 0.3]} c={C.grey} />
    <Box p={[0, HEAD + 0.28, 0]} s={[0.12, 0.25, 0.12]} c={ci ? C.purple : C.gold} glow={0.4} />
    <mesh ref={flame} position={[0, HEAD - 0.25, 0]}><sphereGeometry args={[0.32, 16, 12]} /><meshStandardMaterial color={C.orange} emissive={C.orange} emissiveIntensity={1.3} transparent opacity={0.85} /></mesh>
    <Box p={[BW / 2 + 0.02, BDC + exTop / 2, 0]} s={[0.1, exTop, 0.6]} c={C.red} glow={0.4} />
    <Box p={[-BW / 2 - 0.02, BDC + trTop / 2, 0]} s={[0.1, trTop, 0.6]} c={C.blue} glow={0.4} />
    <Rod a={[BW / 2, BDC + exTop / 2, 0]} b={[2.2, BDC + exTop / 2, 0]} r={Math.min(0.28, exTop / 2)} color={C.red} o={0.25} />
    <Rod a={[-0.95, 0.9, 0]} b={[-0.95, BDC + trTop / 2, 0]} r={0.18} color={C.blue} o={0.25} />
    <mesh position={[0, 0, 0]}><boxGeometry args={[2.3, 2.0, 1.3]} /><meshStandardMaterial color={C.light} transparent opacity={0.12} /></mesh>
    <Rod a={[-2.6, -0.4, 0.2]} b={[-1.15, -0.4, 0.2]} r={0.16} color={C.green} o={0.3} />
    <group ref={exF}><Flow path={exPath} n={10} speed={0.9} color={C.orange} r={0.07} /></group>
    <group ref={trF}><Flow path={trPath} n={10} speed={0.9} color={C.blue} r={0.07} /></group>
    <group ref={inF}><Flow path={inPath} n={8} speed={0.7} color={C.green} r={0.07} /></group>
    <group ref={crank}><Rod a={[0, 0, 0]} b={[0, RR, 0]} r={0.12} color={C.grey} /><mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.55, 0.55, 0.25, 28]} /><meshStandardMaterial color={C.dark} /></mesh></group>
    <group ref={rod}><Rod a={[0, -LL / 2, 0]} b={[0, LL / 2, 0]} r={0.08} color={C.light} /></group>
    <group ref={piston}><Box p={[0, CROWN - 0.35, 0]} s={[BW, 0.7, BW]} c="#9aa8b0" /><Box p={[0, CROWN - 0.02, 0]} s={[BW + 0.02, 0.04, BW + 0.02]} c={C.dark} /></group>
    <mesh ref={mark} position={[3.4, 2.85, 0.05]}><sphereGeometry args={[0.12, 16, 12]} /><meshStandardMaterial color={C.gold} emissive={C.gold} emissiveIntensity={0.8} /></mesh>
  </group>);
}

export default function TwoStrokeLab() {
  const [P, set, reset] = useLabParams(MECHY_SPECS.twostroke);
  const { rpm, bore, stroke, pm, ex, tr, crank, fuel } = P;
  const ci = fuel === "ci";
  const e = twoStroke(bore, stroke, rpm, pm, ex, tr);
  const exTop = (ex / 100) * ST, trTop = (tr / 100) * ST;
  const exArc = useMemo(() => arcPts(e.eo, e.ec, 1.25, 3.4, 1.6), [e.eo, e.ec]);
  const trArc = useMemo(() => arcPts(e.to, e.tc, 1.0, 3.4, 1.6), [e.to, e.tc]);
  const ring = useMemo(() => arcPts(0, 360, 1.45, 3.4, 1.6), []);
  return (
    <LabFrame
      label="A cut-away crankcase-scavenged two-stroke engine: the piston uncovers a red exhaust port and a blue transfer port near the bottom of its stroke, fresh charge flows up the transfer duct from the crankcase while exhaust leaves, and a port-timing circle shows where each port is open with a gold dot at the current crank angle"
      camera={[1.4, 1.6, 10.5]}
      onReset={reset}
      scene={(playing) => (<group>
        <group position={[-1.6, -2.1, 0]}>
          <Engine crank0={crank} rpm={rpm} playing={playing} ci={ci} eo={e.eo} to={e.to} exTop={exTop} trTop={trTop} />
          <Poly pts={ring} c={C.grey} w={1.5} />
          <Poly pts={exArc} c={C.red} w={6} />
          <Poly pts={trArc} c={C.blue} w={6} />
          <Poly pts={[[3.4, 1.6 + 1.6, 0], [3.4, 1.6 + 1.3, 0]]} c={C.white} w={3} />
          <Poly pts={[[3.4, 1.6 - 1.6, 0], [3.4, 1.6 - 1.3, 0]]} c={C.white} w={3} />
          <mesh position={[3.4, 1.6, -0.05]}><circleGeometry args={[1.55, 40]} /><meshBasicMaterial color="#16303b" /></mesh>
        </group>
      </group>)}
      readouts={[
        ["At this crank angle", `${crank.toFixed(0)}° — ${twoStrokePhase(crank, e.eo, e.to)}`],
        ["Swept volume", `${e.Vs.toFixed(1)} cm³`],
        ["Power strokes", `${e.powerPerS.toFixed(1)} per second (one every revolution)`],
        ["Indicated power IP = p_m L A n/60", `${(e.ip2 / 1000).toFixed(2)} kW (four-stroke: ${(e.ip4 / 1000).toFixed(2)} kW)`],
        ["Exhaust port open", `${e.eo.toFixed(0)}° → ${e.ec.toFixed(0)}° (${e.exDur.toFixed(0)}°)`],
        ["Transfer port open", `${e.to.toFixed(0)}° → ${e.tc.toFixed(0)}° (${e.trDur.toFixed(0)}°)`],
      ]}
      controls={<>
        <Slider label="Engine speed N" value={rpm} min={300} max={6000} step={10} digits={0} unit=" rpm" onChange={(x) => set("rpm", x)} />
        <Pick label="Engine" value={fuel} options={[{ id: "si", label: "Two-stroke SI (petrol + oil mixture, spark plug)" }, { id: "ci", label: "Two-stroke CI (air only, diesel injector)" }]} onChange={(x) => set("fuel", x)} />
        <Slider label="Crank angle (when paused)" value={crank} min={0} max={360} step={1} digits={0} unit="°" onChange={(x) => set("crank", x)} />
        <Slider label="Mean effective pressure p_m" value={pm} min={2} max={12} step={0.1} digits={1} unit=" bar" onChange={(x) => set("pm", x)} />
        <Slider label="Bore" value={bore} min={40} max={150} step={1} digits={0} unit=" mm" onChange={(x) => set("bore", x)} />
        <Slider label="Stroke" value={stroke} min={40} max={150} step={1} digits={0} unit=" mm" onChange={(x) => set("stroke", x)} />
        <Slider label="Exhaust port height (% of stroke)" value={ex} min={15} max={45} step={1} digits={0} unit=" %" onChange={(x) => set("ex", x)} />
        <Slider label="Transfer port height (% of stroke)" value={tr} min={8} max={35} step={1} digits={0} unit=" %" onChange={(x) => set("tr", x)} />
      </>}
      note={<>
        <p>A <b>two-stroke</b> engine completes its cycle in one crank revolution, with <b>ports</b> in the cylinder wall instead of valves; the piston itself opens and shuts them. Going up, the piston compresses the charge above it while its underside draws fresh mixture (green) into the sealed <b>crankcase</b>. Near TDC the charge is fired. Going down (power), the piston first uncovers the higher <b>exhaust port</b> (red) so the burnt gas blows down, then the <b>transfer port</b> (blue) so the charge squeezed in the crankcase rushes up and pushes the rest of the exhaust out: <b>scavenging</b>. Some fresh charge escapes with it, which is why two-strokes use more fuel and pollute more.</p>
        <p className="mt-2">One power stroke every revolution gives nearly twice the power of a four-stroke of the same size and speed: IP = p<sub>m</sub>LAn/60 with n = N (n = N/2 for a four-stroke). They are lighter and simpler (no valve gear) but less efficient. The <b>SI</b> version mixes lubricating oil with petrol; the <b>CI</b> version scavenges with air only and injects diesel. Ports open and close symmetrically about BDC (port-timing circle, TDC at the top). Simplified model: rod length 2 × stroke, crankcase inlet drawn as a reed valve.</p>
      </>}
    />
  );
}
