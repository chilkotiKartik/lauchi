"use client";
import { useMemo, useRef } from "react";
import type * as THREE from "three";
import { dcMachine } from "../sim/elecx";
import { Tick, useQuality } from "../Stage";
import { LabFrame, Pick, Slider, Check } from "../ui";
import { useLabParams } from "../params";
import { ELECX_SPECS } from "../meta/elecx.specs";
import { C, Box, type V3 } from "../kit";
import { Flow, Rod } from "../kit2";

function Armature({ rpm, conductors }: { rpm: number; conductors: number }) {
  const g = useRef<THREE.Group>(null);
  return (<group ref={g}>
    <Tick fn={(dt) => { if (g.current) g.current.rotation.z -= Math.min(dt, 0.05) * Math.min(12, rpm / 120); }} />
    <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[1.05, 1.05, 2.2, 32]} /><meshStandardMaterial color="#7a8a93" /></mesh>
    {Array.from({ length: conductors }, (_, i) => { const a = (i / conductors) * Math.PI * 2; return <Box key={i} p={[Math.cos(a) * 1.08, Math.sin(a) * 1.08, 0]} s={[0.1, 0.1, 2.25]} c={C.orange} />; })}
    {Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * Math.PI * 2; return <Box key={`c${i}`} p={[Math.cos(a) * 0.45, Math.sin(a) * 0.45, 1.45]} s={[0.2, 0.2, 0.5]} c={i % 2 ? "#c58b3a" : "#e0a35a"} />; })}
  </group>);
}

export default function DcMachineLab() {
  const q = useQuality();
  const [P, set, reset] = useLabParams(ELECX_SPECS.dcmachine);
  const { phi, N, V, Ra, Ia, P: poles, Z, lap, mode } = P;
  const p = Math.round(poles / 2) * 2;
  const r = dcMachine(mode, p, Z, phi, lap, N, V, Ra, Ia);
  const gen = mode === "gen";
  const polesPos = useMemo(() => Array.from({ length: p }, (_, i) => (i / p) * Math.PI * 2 + Math.PI / 2), [p]);
  const lead = useMemo<V3[]>(() => [[0.6, 0, 1.7], [2.8, 0, 1.7], [2.8, -2.4, 1.7], [-2.8, -2.4, 1.7], [-2.8, 0, 1.7], [-0.6, 0, 1.7]], []);
  return (
    <LabFrame
      label="A DC machine end-on: alternate north (red) and south (blue) field poles around a rotating armature with copper conductors and a commutator; current flows out through the brushes"
      camera={[2.5, 1.6, 8]}
      onReset={reset}
      scene={() => (<group>
        <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[2.3, 2.3, 2.2, 40, 1, true]} /><meshStandardMaterial color={C.dark} side={2} /></mesh>
        {polesPos.map((a, i) => (<group key={i} rotation={[0, 0, a]}>
          <Box p={[0, 1.55, 0]} s={[0.9, 0.7, 2]} c={i % 2 ? C.blue : C.red} glow={0.12 * (phi / 25)} />
        </group>))}
        <Armature rpm={Math.max(0, r.N)} conductors={q === "low" ? 16 : 28} />
        <Rod a={[0, 0, -1.6]} b={[0, 0, 2.2]} r={0.12} color={C.light} />
        <Box p={[0.6, 0, 1.7]} s={[0.3, 0.2, 0.3]} c="#2b2b2b" />
        <Box p={[-0.6, 0, 1.7]} s={[0.3, 0.2, 0.3]} c="#2b2b2b" />
        {Ia > 0 && <Flow path={gen ? lead : [...lead].reverse()} n={12} speed={0.1 + Ia / 120} color={C.gold} r={0.06} />}
      </group>)}
      readouts={gen ? [
        ["Generated EMF E = PΦZN/60A", `${r.E.toFixed(1)} V`],
        ["Parallel paths A", `${r.A} (${lap ? "lap" : "wave"} winding)`],
        ["Terminal voltage V = E − I_aR_a", `${r.Vt.toFixed(1)} V`],
        ["Electrical output", `${(r.power / 1000).toFixed(2)} kW`],
        ["Counter-torque on the prime mover", `${r.torque.toFixed(1)} N·m`],
        ["Speed", `${N.toFixed(0)} rpm`],
      ] : [
        ["Back EMF E_b = V − I_aR_a", `${r.E.toFixed(1)} V`],
        ["Speed N = 60A·E_b/(PΦZ)", `${r.N.toFixed(0)} rpm`],
        ["Torque T = PΦZI_a/(2πA)", `${r.torque.toFixed(1)} N·m`],
        ["Mechanical power E_bI_a", `${(r.power / 1000).toFixed(2)} kW`],
        ["Parallel paths A", `${r.A} (${lap ? "lap" : "wave"} winding)`],
        ["Armature copper loss", `${(Ia * Ia * Ra).toFixed(0)} W`],
      ]}
      controls={<>
        <Slider label="Flux per pole Φ" value={phi} min={5} max={50} step={0.5} digits={1} unit=" mWb" onChange={(x) => set("phi", x)} />
        <Pick label="Machine" value={mode} options={[{ id: "gen", label: "Generator (driven at speed N)" }, { id: "motor", label: "Motor (supplied with V)" }]} onChange={(x) => set("mode", x)} />
        <Slider label="Speed N (generator)" value={N} min={100} max={2000} step={10} digits={0} unit=" rpm" onChange={(x) => set("N", x)} />
        <Slider label="Supply V (motor)" value={V} min={100} max={460} step={1} digits={0} unit=" V" onChange={(x) => set("V", x)} />
        <Slider label="Armature current I_a" value={Ia} min={0} max={100} step={1} digits={0} unit=" A" onChange={(x) => set("Ia", x)} />
        <Slider label="Armature resistance R_a" value={Ra} min={0.05} max={2} step={0.05} digits={2} unit=" Ω" onChange={(x) => set("Ra", x)} />
        <Slider label="Poles P" value={poles} min={2} max={8} step={2} digits={0} onChange={(x) => set("P", x)} />
        <Slider label="Conductors Z" value={Z} min={100} max={1200} step={10} digits={0} onChange={(x) => set("Z", x)} />
        <Check label="Lap winding (A = P); untick for wave (A = 2)" checked={lap} onChange={(x) => set("lap", x)} />
      </>}
      note={<p>Conductors moving through the pole flux cut it and an EMF is induced (Faraday); the <b>commutator</b> flips each coil’s connection as it passes the brushes so the output is DC. Averaging over the armature gives <b>E = PΦZN/(60A)</b>, where A is the number of parallel paths (A = P for lap, 2 for wave). Run as a <b>motor</b>, the same EMF opposes the supply as back EMF, E<sub>b</sub> = V − I<sub>a</sub>R<sub>a</sub>, which fixes the speed: N ∝ E<sub>b</sub>/Φ, so weakening the field speeds it up. Torque T = PΦZI<sub>a</sub>/(2πA) (= E<sub>b</sub>I<sub>a</sub>/ω). Brush drop and armature reaction are ignored.</p>}
    />
  );
}
