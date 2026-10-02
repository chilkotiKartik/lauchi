"use client";
import { Line } from "@react-three/drei";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { compton, toRad } from "../sim/physics";
import { Tick } from "../Stage";
import { LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { PHYSICS_SPECS } from "../meta/physics.specs";

const NB = 18, PACKET = 2.4, RMAX = 4.6, CYCLE = 4.2, T_HIT = 1.3;
const dummy = new THREE.Object3D();

interface Motion { th: number; phi: number; lv1: number; lv2: number; ve: number }

function hide(mesh: THREE.InstancedMesh, i: number) { dummy.position.set(0, 0, 0); dummy.scale.setScalar(0.0001); dummy.updateMatrix(); mesh.setMatrixAt(i, dummy.matrix); }

/** Wave-packet photons (a string of beads riding a sine) and the recoiling electron, at time t within a repeating cycle. */
function paintCompton(inM: THREE.InstancedMesh, outM: THREE.InstancedMesh, el: THREE.Mesh, m: Motion, t: number) {
  const ph = t % CYCLE, cth = Math.cos(m.th), sth = Math.sin(m.th);
  const headIn = -RMAX + (RMAX * ph) / T_HIT;
  const after = Math.max(0, ph - T_HIT);
  const headOut = after * 2.6;
  for (let j = 0; j < NB; j++) {
    const back = (j * PACKET) / (NB - 1);
    const xin = headIn - back;
    if (ph < T_HIT + 0.05 && xin <= 0 && xin >= -RMAX - PACKET) {
      dummy.position.set(xin, 0.16 * Math.sin((2 * Math.PI * xin) / m.lv1), 0); dummy.scale.setScalar(1); dummy.updateMatrix(); inM.setMatrixAt(j, dummy.matrix);
    } else hide(inM, j);
    const d = headOut - back;
    if (ph > T_HIT && d >= 0 && d <= RMAX) {
      const w = 0.16 * Math.sin((2 * Math.PI * d) / m.lv2);
      dummy.position.set(d * cth - w * sth, d * sth + w * cth, 0); dummy.scale.setScalar(1); dummy.updateMatrix(); outM.setMatrixAt(j, dummy.matrix);
    } else hide(outM, j);
  }
  const de = Math.min(after * m.ve, RMAX);
  el.position.set(de * Math.cos(m.phi), -de * Math.sin(m.phi), 0);
  inM.instanceMatrix.needsUpdate = true; outM.instanceMatrix.needsUpdate = true;
}

function Action({ m }: { m: Motion }) {
  const inM = useRef<THREE.InstancedMesh>(null), outM = useRef<THREE.InstancedMesh>(null), el = useRef<THREE.Mesh>(null), t = useRef(0);
  useLayoutEffect(() => { if (inM.current && outM.current && el.current) paintCompton(inM.current, outM.current, el.current, m, t.current); }, [m]);
  const tick = (dt: number) => { t.current += Math.min(dt, 0.05); if (inM.current && outM.current && el.current) paintCompton(inM.current, outM.current, el.current, m, t.current); };
  return (<>
    <Tick fn={tick} />
    <instancedMesh ref={inM} args={[undefined, undefined, NB]} frustumCulled={false}><sphereGeometry args={[0.09, 10, 8]} /><meshStandardMaterial color="#ffc83d" emissive="#ffc83d" emissiveIntensity={0.8} /></instancedMesh>
    <instancedMesh ref={outM} args={[undefined, undefined, NB]} frustumCulled={false}><sphereGeometry args={[0.09, 10, 8]} /><meshStandardMaterial color="#ff9a1f" emissive="#ff9a1f" emissiveIntensity={0.8} /></instancedMesh>
    <mesh ref={el}><sphereGeometry args={[0.3, 20, 16]} /><meshStandardMaterial color="#2ba6f5" emissive="#2ba6f5" emissiveIntensity={0.35} /></mesh>
  </>);
}

function arc(r: number, a0: number, a1: number, sign: number): [number, number, number][] {
  const pts: [number, number, number][] = [], n = 24, hi = Math.max(a1, 0.02);
  for (let i = 0; i <= n; i++) { const a = a0 + ((hi - a0) * i) / n; pts.push([r * Math.cos(a), sign * r * Math.sin(a), 0.02]); }
  return pts;
}

export default function ComptonLab() {
  const [P, set, reset] = useLabParams(PHYSICS_SPECS.compton);
  const { lam, th } = P;
  const setLam = (x: (typeof P)["lam"]) => set("lam", x), setTh = (x: (typeof P)["th"]) => set("th", x);
  const c = compton(lam, th);
  const thR = toRad(th), phiR = toRad(c.phiDeg);
  const m = useMemo<Motion>(() => ({ th: thR, phi: phiR, lv1: 0.35 + 0.03 * lam, lv2: 0.35 + 0.03 * c.lam2, ve: 0.8 + 3 * Math.sqrt(Math.max(0, c.Ke / c.E1)) }), [thR, phiR, lam, c.lam2, c.Ke, c.E1]);
  const thArc = useMemo(() => arc(1.3, 0, thR, 1), [thR]);
  const phiArc = useMemo(() => arc(1.8, 0, phiR, -1), [phiR]);
  return (
    <LabFrame
      label="An X-ray photon hitting a stationary electron: the scattered photon leaves at angle theta and the electron recoils at angle phi"
      camera={[0, 1.5, 12]}
      onReset={reset}
      scene={() => (<group>
        <Line points={[[-RMAX - 0.6, 0, 0], [RMAX + 0.4, 0, 0]]} color="#5b6d77" lineWidth={1} />
        <Line points={[[0, 0, 0], [RMAX * Math.cos(thR), RMAX * Math.sin(thR), 0]]} color="#ff9a1f" lineWidth={1} transparent opacity={0.4} />
        <Line points={[[0, 0, 0], [RMAX * Math.cos(phiR), -RMAX * Math.sin(phiR), 0]]} color="#2ba6f5" lineWidth={1} transparent opacity={0.4} />
        <Line points={thArc} color="#ff9a1f" lineWidth={2.5} />
        <Line points={phiArc} color="#2ba6f5" lineWidth={2.5} />
        <mesh position={[0, 0, -0.05]}><circleGeometry args={[0.55, 28]} /><meshBasicMaterial color="#2b3a43" /></mesh>
        <Action m={m} />
      </group>)}
      readouts={[
        ["Shift Δλ = λc(1 − cos θ)", `${c.dl.toFixed(3)} pm`],
        ["Scattered λ′", `${c.lam2.toFixed(2)} pm`],
        ["Photon energy before", `${c.E1.toFixed(2)} keV`],
        ["Photon energy after", `${c.E2.toFixed(2)} keV`],
        ["Electron kinetic energy", `${c.Ke.toFixed(2)} keV`],
        ["Electron recoil angle φ", `${c.phiDeg.toFixed(1)}°`],
      ]}
      controls={<>
        <Slider label="X-ray wavelength λ" value={lam} min={1} max={100} step={1} digits={0} unit=" pm" onChange={setLam} />
        <Slider label="Scattering angle θ" value={th} min={0} max={180} step={1} digits={0} unit="°" onChange={setTh} />
      </>}
      note={<p>A photon of wavelength λ hits an electron at rest and bounces off at angle θ (orange), giving the electron some of its energy and momentum (blue, recoiling at angle φ below the axis). Conserving energy and momentum gives the Compton shift Δλ = (h/mₑc)(1 − cos θ), where the electron&apos;s Compton wavelength is h/mₑc = 2.426 pm. The shift depends only on θ, not on λ, so it is only noticeable for X-rays and γ-rays (λ of a few pm to tens of pm). The recoil direction obeys tan φ = cot(θ/2) / (1 + λc/λ), and the electron takes K = hc/λ − hc/λ′. Classical wave theory predicts no shift, which is why this was evidence for photons carrying momentum h/λ. Wave-packet lengths and speeds on screen are schematic, not to scale.</p>}
    />
  );
}
