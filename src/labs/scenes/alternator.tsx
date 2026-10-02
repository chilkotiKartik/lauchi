"use client";
import { useMemo, useRef } from "react";
import type * as THREE from "three";
import { alternator, eng } from "../sim/elecy";
import { Tick } from "../Stage";
import { LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { ELECY_SPECS } from "../meta/elecy.specs";
import { Box, C } from "../kit";
import { Graph, type XY } from "../kit2";

const PH = [C.red, C.gold, C.blue], SX = -2.2, GX = 0.9, GW = 3.9, GY = -1.6, GH = 3.2;

/** Per-frame update of the phase-coil glow and the rotor (module-level so nothing in render is mutated). */
function paint(mats: (THREE.MeshStandardMaterial | null)[], phaseOf: number[], th: number) {
  for (let i = 0; i < mats.length; i++) {
    const m = mats[i];
    if (m) m.emissiveIntensity = 0.1 + 0.9 * Math.abs(Math.sin(th - (phaseOf[i] * 2 * Math.PI) / 3));
  }
}

function Machine({ P, N, amp, playing }: { P: number; N: number; amp: number; playing: boolean }) {
  const rotor = useRef<THREE.Group>(null), mats = useRef<(THREE.MeshStandardMaterial | null)[]>([]), mark = useRef<THREE.Mesh>(null), mech = useRef(0);
  const nc = (3 * P) / 2;
  const coils = useMemo(() => Array.from({ length: nc }, (_, k) => ({ a: (k / nc) * 2 * Math.PI, ph: k % 3 })), [nc]);
  const phaseOf = useMemo(() => coils.map((c) => c.ph), [coils]);
  const poles = useMemo(() => Array.from({ length: P }, (_, k) => (k / P) * 2 * Math.PI), [P]);
  const salient = P > 4;
  const tick = (dt: number) => {
    if (playing) mech.current += Math.min(dt, 0.05) * (0.25 + (N / 3600) * 1.5);
    if (rotor.current) rotor.current.rotation.z = mech.current;
    // phase-a coil sits at angle 0; a north pole facing it gives maximum flux, i.e. zero emf: e_a ∝ sin(electrical angle)
    const th = (P / 2) * mech.current;
    paint(mats.current, phaseOf, th);
    if (mark.current) mark.current.position.x = GX + (((th * 180) / Math.PI) % 720) / 720 * GW;
  };
  const tw = Math.min(0.5, ((2 * Math.PI * 1.7) / nc) * 0.55), pw = Math.min(0.7, ((2 * Math.PI * 0.95) / P) * 0.6);
  return (<>
    <Tick fn={tick} />
    <mesh ref={mark} position={[GX, GY + GH / 2, 0.06]}><boxGeometry args={[0.04, GH * amp, 0.04]} /><meshBasicMaterial color={C.white} /></mesh>
    <group position={[SX, 0, 0]}>
      <mesh><torusGeometry args={[2.15, 0.32, 12, 56]} /><meshStandardMaterial color={C.grey} roughness={0.5} /></mesh>
      {coils.map((c, i) => (
        <mesh key={i} position={[Math.cos(c.a) * 1.68, Math.sin(c.a) * 1.68, 0]} rotation={[0, 0, c.a]}>
          <boxGeometry args={[0.26, tw, 0.8]} />
          <meshStandardMaterial ref={(el) => { mats.current[i] = el; }} color={PH[c.ph]} emissive={PH[c.ph]} emissiveIntensity={0.3} />
        </mesh>
      ))}
      <group ref={rotor}>
        {salient ? <>
          <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.7, 0.7, 0.7, 24]} /><meshStandardMaterial color={C.dark} metalness={0.3} /></mesh>
          {poles.map((a, k) => (
            <group key={k} rotation={[0, 0, a]}>
              <Box p={[1.02, 0, 0]} s={[0.55, pw, 0.68]} c={k % 2 ? C.blue : C.red} glow={0.25} />
              <Box p={[1.33, 0, 0]} s={[0.1, pw * 1.35, 0.7]} c={C.light} />
            </group>
          ))}
        </> : <>
          <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[1.35, 1.35, 0.75, 40]} /><meshStandardMaterial color="#45565f" metalness={0.35} roughness={0.35} /></mesh>
          {poles.map((a, k) => (
            <group key={k} rotation={[0, 0, a]}><Box p={[1.33, 0, 0]} s={[0.08, 0.7, 0.78]} c={k % 2 ? C.blue : C.red} glow={0.4} /></group>
          ))}
        </>}
        <mesh position={[0, 0, 0.5]}><cylinderGeometry args={[0.16, 0.16, 0.5, 12]} /><meshStandardMaterial color={C.light} /></mesh>
      </group>
    </group>
  </>);
}

export default function AlternatorLab() {
  const [Pm, set, reset] = useLabParams(ELECY_SPECS.alternator);
  const { P, N, phi, T, Kw } = Pm;
  const Pe = Math.max(2, 2 * Math.round(P / 2));
  const a = alternator(Pe, N, phi, T, Kw);
  const amp = Math.min(1, Math.max(0.2, Math.log10(Math.max(a.Eph, 1)) / 4.3));
  const waves = useMemo(() => [0, 1, 2].map((k) => {
    const pts: XY[] = [];
    for (let i = 0; i <= 240; i++) { const x = i * 3; pts.push([x, amp * Math.sin(((x - 120 * k) * Math.PI) / 180)]); }
    return pts;
  }), [amp]);
  return (
    <LabFrame
      label="A three-phase alternator: a rotor with alternating red north and blue south poles turns inside a grey stator whose red, gold and blue phase coils glow as their emf peaks, beside a graph of the three phase emfs 120° apart with a moving time marker"
      camera={[0, 0.2, 9.4]}
      onReset={reset}
      scene={(playing) => (<group>
        <Machine P={Pe} N={N} amp={amp} playing={playing} />
        <Graph x0={GX} y0={GY} w={GW} h={GH} xr={[0, 720]} yr={[-1.1, 1.1]} grid={8}
          curves={waves.map((w, k) => ({ pts: w, color: PH[k], w: 2.8 }))} />
      </group>)}
      readouts={[
        ["Frequency f = PN/120", `${a.f.toFixed(2)} Hz`],
        ["EMF per phase 4.44 fΦTK_w", eng(a.Eph, "V")],
        ["Line emf (star) √3·E_ph", eng(a.EL, "V")],
        ["Speed needed for 50 Hz", `${a.N50.toFixed(0)} rpm`],
        ["Rotor type for this many poles", a.rotor],
      ]}
      controls={<>
        <Slider label="Poles P" value={Pe} min={2} max={24} step={2} digits={0} onChange={(x) => set("P", x)} />
        <Slider label="Rotor speed N" value={N} min={100} max={3600} step={5} digits={0} unit=" rpm" onChange={(x) => set("N", x)} />
        <Slider label="Flux per pole Φ" value={phi} min={1} max={200} step={0.5} digits={1} unit=" mWb" onChange={(x) => set("phi", x)} />
        <Slider label="Turns per phase T" value={T} min={10} max={2000} step={1} digits={0} onChange={(x) => set("T", x)} />
        <Slider label="Winding factor K_w" value={Kw} min={0.7} max={1} step={0.01} digits={2} onChange={(x) => set("Kw", x)} />
      </>}
      note={<>
        <p><b>Construction:</b> the DC-excited field winding is on the <b>rotor</b> (red N and blue S poles), and the three-phase armature winding is on the <b>stationary stator</b> (red, gold and blue coil groups 120 electrical degrees apart), so the large output current needs no sliding contacts. As the rotor turns, each phase coil sees the flux change and glows when its emf peaks; the graph shows the three emfs 120° apart.</p>
        <p><b>Frequency:</b> one pair of poles passing a coil gives one cycle, so f = PN/120 (N in rpm). For 50 Hz: 2 poles → 3000 rpm, 4 → 1500, 6 → 1000. <b>EMF equation:</b> E_ph = 4.44 f Φ T K_w, with Φ the flux per pole (Wb), T the series turns per phase and K_w = K_p·K_d the winding (pitch × distribution) factor. Star connection gives E_L = √3 E_ph (open-circuit, so no armature reaction or synchronous reactance: simplified model). <b>Rotor types:</b> slow hydro and diesel sets need many poles and use a <b>salient-pole</b> rotor; fast steam/gas turbo-alternators use 2 or 4 poles on a long, smooth <b>cylindrical</b> rotor.</p>
        <p><b>Try:</b> keep 1200 rpm and change poles from 6 to 2: the frequency drops from 60 Hz to 20 Hz.</p>
      </>}
    />
  );
}
