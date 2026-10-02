"use client";
import { Line } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";
import { calcite } from "../sim/phyy";
import { LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { PHYY_SPECS } from "../meta/phyy.specs";
import { C, Ball, Box, type V3 } from "../kit";
import { Flow } from "../kit2";
import { Sticks, type StickWave } from "./phyy-kit";

const XIN = -5, XAN = 2.6, XSCR = 4.4, SIDE = 2.2, D2R = Math.PI / 180;

/** A calcite rhomb: a box sheared so its entry and exit faces slant. */
function rhomb(t: number) {
  const g = new THREE.BoxGeometry(t, SIDE, SIDE);
  g.applyMatrix4(new THREE.Matrix4().set(1, 0.35, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1));
  return g;
}

export default function CalciteLab() {
  const [P, set, reset] = useLabParams(PHYY_SPECS.calcite);
  const { th, psi, t, an } = P;
  const r = calcite(th, t, psi, an);
  const tv = 0.8 + t * 0.08, half = tv / 2;
  const sV = tv * Math.tan(Math.min(16, r.rho * 2.5) * D2R) + (r.rho > 0.01 ? 0.12 : 0);
  const geo = useMemo(() => rhomb(tv), [tv]);
  const edges = useMemo(() => new THREE.EdgesGeometry(geo), [geo]);
  const thR = th * D2R, anR = an * D2R;
  const axisPts = useMemo<V3[]>(() => [[-1.4 * Math.cos(thR), -1.4 * Math.sin(thR), 0], [1.4 * Math.cos(thR), 1.4 * Math.sin(thR), 0]], [thR]);
  const inc = useMemo<V3[]>(() => [[XIN, 0, 0], [-half, 0, 0]], [half]);
  const unY = useMemo<StickWave>(() => ({ o: [XIN, 0, 0], d: [1, 0, 0], vib: [0, 1, 0], len: XIN * -1 - half, amp: 0.45, k: 5, phase: 0 }), [half]);
  const unZ = useMemo<StickWave>(() => ({ o: [XIN, 0, 0], d: [1, 0, 0], vib: [0, 0, 1], len: XIN * -1 - half, amp: 0.45, k: 5, phase: 1.3 }), [half]);
  const oW = useMemo<StickWave>(() => ({ o: [half, 0, 0], d: [1, 0, 0], vib: [0, 0, 1], len: XAN - half, amp: 0.38, k: 5, phase: 0 }), [half]);
  const eW = useMemo<StickWave>(() => ({ o: [half, -sV, 0], d: [1, 0, 0], vib: [0, 1, 0], len: XAN - half, amp: 0.38, k: 5, phase: 0.6 }), [half, sV]);
  const IO = r.IO * 2, IE = r.IE * 2;
  return (
    <LabFrame
      label="An unpolarised beam enters a calcite rhomb and splits into an ordinary ray (red, vibrating perpendicular to the principal section) and an extraordinary ray (blue, vibrating in it) that walks off sideways; the two parallel beams pass an analyser and make two spots on a screen, and turning the crystal swings the E spot round the O spot"
      camera={[-1.2, 2.4, 8.8]}
      onReset={reset}
      scene={() => (<group>
        <Ball p={[XIN - 0.3, 0, 0]} r={0.25} c={C.gold} glow={1} />
        <Line points={inc} color={C.gold} lineWidth={2.5} />
        <Flow path={inc} n={8} speed={0.4} color={C.gold} r={0.06} />
        <Sticks w={unY} color={C.gold} n={24} />
        <Sticks w={unZ} color={C.orange} n={24} />
        <group rotation={[psi * D2R, 0, 0]}>
          <mesh geometry={geo}><meshPhysicalMaterial color="#e6f6ff" transparent opacity={0.22} roughness={0.05} side={THREE.DoubleSide} /></mesh>
          <lineSegments geometry={edges}><lineBasicMaterial color={C.light} /></lineSegments>
          <Line points={axisPts} color={C.purple} lineWidth={2} dashed dashSize={0.12} gapSize={0.08} />
          <Line points={[[-half, 0, 0], [half, 0, 0]]} color={C.red} lineWidth={3} />
          <Line points={[[-half, 0, 0], [half, -sV, 0]]} color={C.blue} lineWidth={3} />
          <Line points={[[half, 0, 0], [XSCR, 0, 0]]} color={C.red} lineWidth={2} transparent opacity={0.35 + 0.65 * Math.max(0.2, IO)} />
          <Line points={[[half, -sV, 0], [XSCR, -sV, 0]]} color={C.blue} lineWidth={2} transparent opacity={0.35 + 0.65 * Math.max(0.2, IE)} />
          <Sticks w={oW} color={C.red} n={20} />
          <Sticks w={eW} color={C.blue} n={20} />
          <mesh position={[XSCR - 0.05, -sV, 0]} rotation={[0, -Math.PI / 2, 0]}><circleGeometry args={[0.1 + 0.18 * IE, 24]} /><meshBasicMaterial color={C.blue} transparent opacity={0.15 + 0.85 * IE} /></mesh>
          <mesh position={[XSCR - 0.05, 0, 0]} rotation={[0, -Math.PI / 2, 0]}><circleGeometry args={[0.1 + 0.18 * IO, 24]} /><meshBasicMaterial color={C.red} transparent opacity={0.15 + 0.85 * IO} /></mesh>
        </group>
        <mesh position={[XAN, 0, 0]} rotation={[0, Math.PI / 2, 0]}><circleGeometry args={[1.3, 40]} /><meshStandardMaterial color={C.purple} transparent opacity={0.28} side={THREE.DoubleSide} /></mesh>
        <Line points={[[XAN, -1.25 * Math.cos(anR), -1.25 * Math.sin(anR)], [XAN, 1.25 * Math.cos(anR), 1.25 * Math.sin(anR)]]} color={C.green} lineWidth={3} />
        <Box p={[XSCR + 0.05, 0, 0]} s={[0.06, 3, 3]} c="#16242b" />
        <Box p={[0, -1.75, 0]} s={[10, 0.08, 1.6]} c={C.dark} />
      </group>)}
      readouts={[
        ["E-ray index n_e(θ)", `${r.neTh.toFixed(4)} (n_o = 1.6584)`],
        ["Walk-off angle ρ", `${r.rho.toFixed(2)}°`],
        ["O–E separation at exit", `${r.sep.toFixed(3)} mm`],
        ["After analyser: O / E", `${(r.IO * 100).toFixed(0)} % / ${(r.IE * 100).toFixed(0)} %`],
        ["Nicol: O-ray critical angle at balsam", `${r.critO.toFixed(1)}°`],
        ["Calcite half-wave plate (589 nm)", `${(r.halfWave * 1e6).toFixed(2)} µm`],
      ]}
      controls={<>
        <Slider label="Angle between ray and optic axis θ" value={th} min={0} max={90} step={1} digits={0} unit="°" onChange={(x) => set("th", x)} />
        <Slider label="Turn the crystal about the beam" value={psi} min={0} max={360} step={1} digits={0} unit="°" onChange={(x) => set("psi", x)} />
        <Slider label="Crystal thickness t" value={t} min={1} max={30} step={0.5} digits={1} unit=" mm" onChange={(x) => set("t", x)} />
        <Slider label="Analyser angle" value={an} min={0} max={180} step={1} digits={0} unit="°" onChange={(x) => set("an", x)} />
      </>}
      note={<>
        <p><b>Double refraction:</b> in calcite one beam splits in two. The <b>ordinary (O) ray</b> obeys Snell’s law with n<sub>o</sub> = 1.658 in every direction and vibrates perpendicular to the <b>principal section</b> (the plane holding the ray and the optic axis, dashed purple). The <b>extraordinary (E) ray</b> vibrates in the principal section; its index runs from n<sub>o</sub> along the optic axis to n<sub>e</sub> = 1.486 across it, 1/n² = cos²θ/n<sub>o</sub>² + sin²θ/n<sub>e</sub>², and its energy walks off by ρ (largest, about 6.2°, near θ = 42°). Along the optic axis (θ = 0) there is no splitting. The two emerging beams are plane-polarised at right angles: an analyser at angle α passes ½cos² of one and ½sin² of the other (Malus).</p>
        <p className="mt-2">A <b>Nicol prism</b> is a calcite rhomb cut and cemented with Canada balsam (n = 1.55). The O ray (1.658) meets the balsam beyond its critical angle of 69.2° and is totally reflected out of the side, while the E ray (index below 1.55 there) passes: one clean plane-polarised beam. <b>Try:</b> turn the crystal and watch the E spot circle the fixed O spot; set the analyser parallel, then perpendicular, to the principal section. Walk-off is drawn 2.5× larger than life.</p>
      </>}
    />
  );
}
