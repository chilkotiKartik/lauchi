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
  return (
    <group ref={g}>
      <Tick fn={(dt) => {
        if (g.current) g.current.rotation.z -= Math.min(dt, 0.05) * Math.min(12, rpm / 120);
      }} />

      {/* Laminated Silicon Steel Armature Core */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.12, 1.12, 2.3, 36]} />
        <meshStandardMaterial color="#475569" metalness={0.7} roughness={0.35} />
      </mesh>

      {/* Copper Windings in Armature Slots */}
      {Array.from({ length: conductors }, (_, i) => {
        const a = (i / conductors) * Math.PI * 2;
        return (
          <group key={i} rotation={[0, 0, a]}>
            <mesh position={[1.14, 0, 0]}>
              <boxGeometry args={[0.08, 0.12, 2.35]} />
              <meshStandardMaterial color="#ea580c" metalness={0.85} roughness={0.2} />
            </mesh>
            {/* End turn loop overhangs */}
            <mesh position={[1.05, 0, 1.2]} rotation={[0, Math.PI / 4, 0]}>
              <boxGeometry args={[0.1, 0.1, 0.2]} />
              <meshStandardMaterial color="#ea580c" metalness={0.8} />
            </mesh>
            <mesh position={[1.05, 0, -1.2]} rotation={[0, -Math.PI / 4, 0]}>
              <boxGeometry args={[0.1, 0.1, 0.2]} />
              <meshStandardMaterial color="#ea580c" metalness={0.8} />
            </mesh>
          </group>
        );
      })}

      {/* Hard-drawn Copper Segmented Commutator */}
      <mesh position={[0, 0, 1.55]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.55, 0.55, 0.65, 32]} />
        <meshStandardMaterial color="#d97706" metalness={0.9} roughness={0.15} />
      </mesh>
      {Array.from({ length: 16 }, (_, i) => {
        const a = (i / 16) * Math.PI * 2;
        return (
          <mesh key={`seg-${i}`} position={[Math.cos(a) * 0.56, Math.sin(a) * 0.56, 1.55]} rotation={[0, 0, a]}>
            <boxGeometry args={[0.02, 0.08, 0.64]} />
            <meshStandardMaterial color="#0f172a" roughness={0.9} />
          </mesh>
        );
      })}
    </group>
  );
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
      label="Heavy-duty DC Machine: cast steel stator yoke, copper field coils, laminated armature, commutator, carbon brushes, and electrical load loop"
      camera={[2.5, 1.6, 8]}
      onReset={reset}
      note={
        <p>
          Armature conductors rotating across the pole magnetic flux cut field lines to induce EMF (Faraday&apos;s Law): <b>E = PΦZN / (60A)</b>, where A is the number of parallel paths (A = P for lap winding, 2 for wave). In motor mode, back EMF opposes supply voltage: <b>E<sub>b</sub> = V − I<sub>a</sub>R<sub>a</sub></b>.
        </p>
      }
      scene={() => (
        <group>
          {/* Outer Stator Cylindrical Yoke */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[2.35, 2.35, 2.4, 48, 1, true]} />
            <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.3} side={2} />
          </mesh>

          {/* Stator Base Mounting Feet */}
          {[-1.2, 1.2].map((x, i) => (
            <mesh key={i} position={[x, -2.4, 0]}>
              <boxGeometry args={[0.5, 0.2, 2.4]} />
              <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.3} />
            </mesh>
          ))}

          {/* Terminal Box on top */}
          <group position={[0, 2.5, 0]}>
            <boxGeometry args={[0.8, 0.4, 0.8]} />
            <meshStandardMaterial color="#334155" metalness={0.6} />
          </group>

          {/* Salient Pole Shoes with Copper Field Coils */}
          {polesPos.map((a, i) => (
            <group key={i} rotation={[0, 0, a]}>
              {/* Pole Shoe */}
              <Box p={[0, 1.65, 0]} s={[0.95, 0.65, 2.1]} c={i % 2 ? C.blue : C.red} glow={0.15 * (phi / 25)} />
              {/* Copper Field Coil */}
              <mesh position={[0, 1.75, 0]}>
                <boxGeometry args={[1.05, 0.35, 1.7]} />
                <meshStandardMaterial color="#b45309" metalness={0.8} roughness={0.25} />
              </mesh>
            </group>
          ))}

          {/* Rotating Armature & Commutator */}
          <Armature rpm={Math.max(0, r.N)} conductors={q === "low" ? 16 : 28} />

          {/* Drive Shaft & Heavy Bearings */}
          <Rod a={[0, 0, -1.8]} b={[0, 0, 2.4]} r={0.14} color="#cbd5e1" />
          <mesh position={[0, 0, 2.1]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.4, 0.4, 0.25, 24]} />
            <meshStandardMaterial color="#475569" metalness={0.9} />
          </mesh>

          {/* Carbon Brushes & Brass Brush Holders */}
          <group position={[0.58, 0, 1.55]}>
            <Box p={[0, 0, 0]} s={[0.22, 0.18, 0.28]} c="#1e293b" />
            <mesh position={[0.16, 0, 0]}>
              <boxGeometry args={[0.1, 0.22, 0.32]} />
              <meshStandardMaterial color="#ca8a04" metalness={0.9} />
            </mesh>
          </group>
          <group position={[-0.58, 0, 1.55]}>
            <Box p={[0, 0, 0]} s={[0.22, 0.18, 0.28]} c="#1e293b" />
            <mesh position={[-0.16, 0, 0]}>
              <boxGeometry args={[0.1, 0.22, 0.32]} />
              <meshStandardMaterial color="#ca8a04" metalness={0.9} />
            </mesh>
          </group>

          {/* Dynamic Electrical Current Loop */}
          {Ia > 0 && <Flow path={gen ? lead : [...lead].reverse()} n={12} speed={0.1 + Ia / 120} color={C.gold} r={0.06} />}
        </group>
      )}
      readouts={
        gen
          ? [
              ["Generated EMF E", `${r.E.toFixed(1)} V`],
              ["Parallel paths A", `${r.A} (${lap ? "lap" : "wave"})`],
              ["Terminal voltage V", `${r.Vt.toFixed(1)} V`],
              ["Electrical output", `${(r.power / 1000).toFixed(2)} kW`],
              ["Counter-torque", `${r.torque.toFixed(1)} N·m`],
              ["Shaft Speed", `${N.toFixed(0)} rpm`],
            ]
          : [
              ["Back EMF E_b", `${r.E.toFixed(1)} V`],
              ["Rotor Speed N", `${r.N.toFixed(0)} rpm`],
              ["Developed Torque T", `${r.torque.toFixed(1)} N·m`],
              ["Mechanical power", `${(r.power / 1000).toFixed(2)} kW`],
              ["Parallel paths A", `${r.A} (${lap ? "lap" : "wave"})`],
              ["Copper loss (I²R)", `${(Ia * Ia * Ra).toFixed(0)} W`],
            ]
      }
      controls={
        <>
          <Slider label="Flux per pole Φ" value={phi} min={5} max={50} step={0.5} digits={1} unit=" mWb" onChange={(x) => set("phi", x)} />
          <Pick
            label="Machine Mode"
            value={mode}
            options={[
              { id: "gen", label: "DC Generator (Mechanical $\\rightarrow$ Electrical)" },
              { id: "motor", label: "DC Motor (Electrical $\\rightarrow$ Mechanical)" },
            ]}
            onChange={(x) => set("mode", x)}
          />
          <Slider label="Speed N (generator)" value={N} min={100} max={2000} step={10} digits={0} unit=" rpm" onChange={(x) => set("N", x)} />
          <Slider label="Supply V (motor)" value={V} min={100} max={460} step={1} digits={0} unit=" V" onChange={(x) => set("V", x)} />
          <Slider label="Armature current I_a" value={Ia} min={0} max={100} step={1} digits={0} unit=" A" onChange={(x) => set("Ia", x)} />
          <Slider label="Armature resistance R_a" value={Ra} min={0.05} max={2} step={0.05} digits={2} unit=" Ω" onChange={(x) => set("Ra", x)} />
          <Slider label="Poles P" value={poles} min={2} max={8} step={2} digits={0} onChange={(x) => set("P", x)} />
          <Slider label="Conductors Z" value={Z} min={100} max={1200} step={10} digits={0} onChange={(x) => set("Z", x)} />
          <Check label="Lap winding (A = P); untick for wave (A = 2)" checked={lap} onChange={(x) => set("lap", x)} />
        </>
      }
    />
  );
}
