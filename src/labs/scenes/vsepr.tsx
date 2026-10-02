"use client";
import { Line } from "@react-three/drei";
import { useRef } from "react";
import type * as THREE from "three";
import { maxLonePairs, vsepr } from "../math";
import { Tick } from "../Stage";
import { LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { CORE_SPECS } from "../meta/core.specs";

export default function VseprLab() {
  const [P, set, reset] = useLabParams(CORE_SPECS.vsepr);
  const { dom, lone } = P;
  const setDom = (x: (typeof P)["dom"]) => set("dom", x), setLone = (x: (typeof P)["lone"]) => set("lone", x);
  const l = Math.min(lone, maxLonePairs(dom));
  const v = vsepr(dom, l);
  const g = useRef<THREE.Group>(null);
  const tick = (dt: number) => { if (g.current) g.current.rotation.y += Math.min(dt, 0.05) * 0.5; };
  const S = 1.6;
  return (
    <LabFrame
      label="Rotating 3D molecule built from VSEPR electron domains"
      camera={[0, 2, 6]}
      onReset={reset}
      scene={() => (<group ref={g}><Tick fn={tick} />
        <mesh><sphereGeometry args={[0.32, 32, 32]} /><meshStandardMaterial color="#ffc83d" /></mesh>
        {v.bonded.map((d, i) => (<group key={i}>
          <Line points={[[0, 0, 0], [d[0] * S, d[1] * S, d[2] * S]]} color="#cfd8dc" lineWidth={5} />
          <mesh position={[d[0] * S, d[1] * S, d[2] * S]}><sphereGeometry args={[0.24, 24, 24]} /><meshStandardMaterial color="#2ba6f5" /></mesh>
        </group>))}
        {v.pairs.map((d, i) => (<mesh key={i} position={[d[0] * 0.75, d[1] * 0.75, d[2] * 0.75]} scale={[0.4, 0.4, 0.7]} quaternion={undefined}>
          <sphereGeometry args={[0.5, 24, 24]} /><meshStandardMaterial color="#a970ff" transparent opacity={0.55} />
        </mesh>))}
      </group>)}
      readouts={[["Electron domains", String(dom)], ["Bonding pairs", String(dom - l)], ["Lone pairs", String(l)], ["Shape", v.shape]]}
      controls={<>
        <Slider label="Electron domains" value={dom} min={2} max={6} step={1} digits={0} onChange={(x) => { setDom(x); setLone(Math.min(lone, maxLonePairs(x))); }} />
        <Slider label="Lone pairs" value={l} min={0} max={Math.max(1, maxLonePairs(dom))} step={1} digits={0} onChange={setLone} />
      </>}
      note={<p>VSEPR says electron domains around a central atom spread as far apart as possible. Blue balls are bonded atoms and purple clouds are lone pairs. Lone pairs take up space, so the visible atoms form a different shape from the domain geometry: 4 domains with 1 lone pair give a trigonal pyramid (like NH₃), with 2 lone pairs a bent shape (like H₂O). In a trigonal bipyramid, lone pairs sit in the equatorial positions first. Real bond angles are slightly squeezed by lone-pair repulsion; the picture shows the ideal geometry.</p>}
    />
  );
}
