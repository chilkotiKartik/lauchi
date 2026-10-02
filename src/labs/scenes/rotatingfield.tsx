"use client";
import { useRef } from "react";
import * as THREE from "three";
import { TAU, gapField, induction, phaseCurrent } from "../sim/elec";
import { Tick, useQuality } from "../Stage";
import { Check, LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { ELEC_SPECS } from "../meta/elec.specs";

const COL = ["#ff5a5f", "#ffc83d", "#2ba6f5"], RING = 2.1, dummy = new THREE.Object3D();

/** Air-gap flux density as columns around the stator: north poles (blue) rise, south poles (red) drop. Module-level: no allocation per frame. */
function paintRing(n: THREE.InstancedMesh, s: THREE.InstancedMesh, count: number, pp: number, wt: number, seq: number) {
  for (let i = 0; i < count; i++) {
    const th = (i / count) * TAU, b = gapField(th, pp, wt, seq) / 1.5;
    const up = Math.max(b, 0) * 1.0 + 0.02, down = Math.max(-b, 0) * 1.0 + 0.02;
    dummy.rotation.set(0, -th, 0);
    dummy.position.set(RING * Math.cos(th), up / 2, RING * Math.sin(th)); dummy.scale.set(1, up, 1); dummy.updateMatrix(); n.setMatrixAt(i, dummy.matrix);
    dummy.position.set(RING * Math.cos(th), -down / 2, RING * Math.sin(th)); dummy.scale.set(1, down, 1); dummy.updateMatrix(); s.setMatrixAt(i, dummy.matrix);
  }
  n.count = count; s.count = count; n.instanceMatrix.needsUpdate = true; s.instanceMatrix.needsUpdate = true;
}

/** Phase-current bars: each child's height follows its phase current. */
function paintBars(g: THREE.Group, wt: number) {
  for (let k = 0; k < g.children.length; k++) { const m = g.children[k], i = phaseCurrent(k, wt); m.scale.y = Math.max(0.02, Math.abs(i)); m.position.y = i * 0.5; }
}

function Machine({ pp, seq, slow, slip, low }: { pp: number; seq: number; slow: number; slip: number; low: boolean }) {
  const N = useRef<THREE.InstancedMesh>(null), S = useRef<THREE.InstancedMesh>(null), rotor = useRef<THREE.Group>(null);
  const bars = useRef<THREE.Group>(null);
  const t = useRef(0), count = low ? 48 : 96;
  const tick = (dt: number) => {
    t.current += Math.min(dt, 0.05) * TAU * slow * 0.8;
    const wt = t.current;
    if (N.current && S.current) paintRing(N.current, S.current, count, pp, wt, seq);
    if (rotor.current) rotor.current.rotation.y = -(1 - slip) * seq * wt / pp;
    if (bars.current) paintBars(bars.current, wt);
  };
  return (<>
    <Tick fn={tick} />
    <instancedMesh ref={N} args={[undefined, undefined, 96]}><boxGeometry args={[0.13, 1, 0.13]} /><meshStandardMaterial color="#2ba6f5" emissive="#2ba6f5" emissiveIntensity={0.25} /></instancedMesh>
    <instancedMesh ref={S} args={[undefined, undefined, 96]}><boxGeometry args={[0.13, 1, 0.13]} /><meshStandardMaterial color="#ff5a5f" emissive="#ff5a5f" emissiveIntensity={0.25} /></instancedMesh>
    <mesh position={[0, -0.02, 0]}><torusGeometry args={[RING, 0.05, 8, 64]} /><meshStandardMaterial color="#5b6d77" /></mesh>
    <group ref={rotor}>
      <mesh><cylinderGeometry args={[1.5, 1.5, 0.6, 32]} /><meshStandardMaterial color="#7c8d97" metalness={0.5} roughness={0.4} /></mesh>
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (<mesh key={i} position={[1.5 * Math.cos((i / 8) * TAU), 0, 1.5 * Math.sin((i / 8) * TAU)]}><boxGeometry args={[0.2, 0.62, 0.2]} /><meshStandardMaterial color="#ff9a1f" /></mesh>))}
      <mesh position={[0, 0.38, 0]}><boxGeometry args={[2.6, 0.12, 0.12]} /><meshStandardMaterial color="#ffc83d" /></mesh>
    </group>
    <group position={[-4.1, 0, 0]}>
      <group ref={bars}>{[0, 1, 2].map((k) => (<mesh key={k} position={[k * 0.5, 0, 0]}><boxGeometry args={[0.32, 1, 0.32]} /><meshStandardMaterial color={COL[k]} /></mesh>))}</group>
      <mesh position={[0.5, -0.03, 0]}><boxGeometry args={[1.6, 0.04, 0.5]} /><meshStandardMaterial color="#9db0ba" /></mesh>
    </group>
  </>);
}

export default function RotatingFieldLab() {
  const quality = useQuality();
  const [P, set, reset] = useLabParams(ELEC_SPECS.rotatingfield);
  const { f, poles, slip, slow, reverse } = P;
  const pp = Math.max(1, Math.round(poles / 2)), P2 = pp * 2;
  const M = induction(f, P2, slip), seq = reverse ? -1 : 1;
  return (
    <LabFrame
      label="A ring of blue and red columns showing the rotating air-gap magnetic field of a three-phase stator, with a rotor inside that turns slightly slower, and three coloured bars for the phase currents"
      camera={[0, 4.4, 6.6]}
      onReset={reset}
      scene={() => (<group position={[0.6, 0, 0]}><Machine pp={pp} seq={seq} slow={slow} slip={slip} low={quality === "low"} /></group>)}
      readouts={[
        ["Poles P", `${P2} (${pp} pair${pp > 1 ? "s" : ""})`], ["Synchronous speed N_s = 120f/P", `${M.Ns.toFixed(0)} rpm`], ["Rotor speed N = N_s(1 − s)", `${M.N.toFixed(0)} rpm`],
        ["Slip speed N_s − N", `${M.slipRpm.toFixed(1)} rpm`], ["Rotor current frequency s·f", `${M.fr.toFixed(2)} Hz`], ["Field rotation", reverse ? "reversed (two phases swapped)" : "R → Y → B"],
      ]}
      controls={<>
        <Slider label="Supply frequency f" value={f} min={10} max={100} step={1} digits={0} unit=" Hz" onChange={(x) => set("f", x)} />
        <Slider label="Number of poles" value={poles} min={2} max={8} step={2} digits={0} onChange={(x) => set("poles", x)} />
        <Slider label="Slip s" value={slip} min={0} max={1} step={0.01} digits={2} onChange={(x) => set("slip", x)} />
        <Slider label="Animation speed" value={slow} min={0.05} max={1} step={0.05} digits={2} onChange={(x) => set("slow", x)} />
        <Check label="Swap two phases (reverse)" checked={reverse} onChange={(x) => set("reverse", x)} />
      </>}
      note={<p>Three coils 120° apart carry currents 120° apart in time (the three coloured bars). Their pulsating fields add up to one field of constant size that turns: the blue columns are north poles of the air-gap field and the red ones are south poles, and the pattern circles the stator at N_s = 120f/P revolutions per minute. The orange-slotted rotor cuts the field, so currents are induced in it and it turns, but always slower than the field; the difference is the slip s = (N_s − N)/N_s (0 at synchronous speed, 1 when the rotor is held still), and the rotor currents have frequency s·f. Swapping any two supply lines reverses the direction. Animation speed only slows the picture down; the readouts are the real values. Ideal machine, no load model.</p>}
    />
  );
}
