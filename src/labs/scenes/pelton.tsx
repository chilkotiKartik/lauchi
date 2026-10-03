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
  return (
    <group ref={g}>
      <Tick fn={(dt) => {
        if (g.current) g.current.rotation.z -= Math.min(dt, 0.05) * Math.min(14, rpm / 50);
      }} />

      {/* Runner Disc Hub with Machined Rim */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.35, 1.35, 0.35, 36]} />
        <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.25} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.5, 0.5, 0.42, 24]} />
        <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Split Double-Hemispherical Buckets with Center Splitter Edge */}
      {Array.from({ length: 16 }, (_, i) => {
        const a = (i / 16) * Math.PI * 2;
        return (
          <group key={i} position={[Math.cos(a) * 1.6, Math.sin(a) * 1.6, 0]} rotation={[0, 0, a]}>
            {/* Bucket Stem / Root */}
            <mesh position={[-0.15, 0, 0]}>
              <boxGeometry args={[0.25, 0.16, 0.3]} />
              <meshStandardMaterial color="#64748b" metalness={0.85} roughness={0.3} />
            </mesh>
            {/* Left Bowl */}
            <mesh position={[0, 0, 0.18]} rotation={[0, 0, 0]}>
              <sphereGeometry args={[0.28, 16, 12, 0, Math.PI]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.15} side={2} />
            </mesh>
            {/* Right Bowl */}
            <mesh position={[0, 0, -0.18]} rotation={[Math.PI, 0, 0]}>
              <sphereGeometry args={[0.28, 16, 12, 0, Math.PI]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.15} side={2} />
            </mesh>
            {/* Central Knife Splitter Ridge */}
            <mesh position={[0.02, 0, 0]}>
              <boxGeometry args={[0.18, 0.04, 0.38]} />
              <meshStandardMaterial color="#f8fafc" metalness={0.95} roughness={0.1} />
            </mesh>
          </group>
        );
      })}

      {/* Main Heavy Turbine Shaft */}
      <Rod a={[0, 0, -1.2]} b={[0, 0, 1.2]} r={0.14} color="#94a3b8" />
    </group>
  );
}

export default function PeltonLab() {
  const [P, set, reset] = useLabParams(MECHX_SPECS.pelton);
  const { H, d, D, rpm } = P;
  const p = pelton(H, d, D, rpm);
  const jet = useMemo<V3[]>(() => [[-5, 1.75, 0], [-0.4, 1.75, 0]], []);
  const splashA = useMemo<V3[]>(() => [[-0.3, 1.75, 0.2], [0.4, 2.7, 1.4]], []);
  const splashB = useMemo<V3[]>(() => [[-0.3, 1.75, -0.2], [0.4, 2.7, -1.4]], []);
  const curve = useMemo(() => sample((x) => peltonEta(x) * 100, 0, 1, 80), []);

  return (
    <LabFrame
      label="Pelton Impulse Turbine: aerodynamic needle nozzle, high-speed supersonic water jet, split ellipsoidal buckets, and hydraulic efficiency curve"
      camera={[0.6, 1, 9.5]}
      onReset={reset}
      note={
        <p>
          A Pelton wheel is an <b>impulse turbine</b> where total available head is converted into pure kinetic energy through a contracting nozzle: <b>V = C<sub>v</sub>√(2gH)</b> (with C<sub>v</sub> ≈ 0.98). The central splitter ridge splits the incoming jet evenly, smoothly turning the water back by ~165° to maximize momentum transfer. Maximum theoretical efficiency occurs when bucket tangential speed equals half the jet speed: <b>u = V / 2</b>.
        </p>
      }
      scene={() => (
        <group>
          <group position={[-1.2, 0, 0]}>
            <Wheel rpm={rpm} />

            {/* Spear Needle Nozzle Casing */}
            <mesh position={[-5.2, 1.75, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.35, 0.45, 1.6, 24]} />
              <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.3} />
            </mesh>
            <mesh position={[-4.2, 1.75, 0]} rotation={[0, 0, -Math.PI / 2]}>
              <coneGeometry args={[0.35, 0.8, 24]} />
              <meshStandardMaterial color="#334155" metalness={0.85} roughness={0.2} />
            </mesh>

            {/* High-Speed Translucent Pressurized Water Jet */}
            <Rod a={[-5, 1.75, 0]} b={[-0.35, 1.75, 0]} r={0.07 + d / 1400} color="#38bdf8" o={0.85} />
            <Flow path={jet} n={16} speed={Math.min(3.5, 0.5 + p.V / 50)} color="#e0f2fe" r={0.08} />

            {/* Deflected Lateral Water Splash Plumes */}
            <Flow path={splashA} n={8} speed={1.2} color="#bae6fd" r={0.06} />
            <Flow path={splashB} n={8} speed={1.2} color="#bae6fd" r={0.06} />
          </group>

          {/* Efficiency Graph Indicator */}
          <Graph
            x0={1.8}
            y0={-2}
            w={4}
            h={3.6}
            xr={[0, 1]}
            yr={[0, 105]}
            curves={[{ pts: curve, color: C.blue, w: 3 }]}
            marker={[Math.min(1, p.ratio), p.etaH * 100]}
            vlines={[{ x: 0.5, color: C.gold }]}
          />
        </group>
      )}
      readouts={[
        ["Jet velocity V = C_v√(2gH)", `${p.V.toFixed(2)} m/s`],
        ["Discharge flow rate Q", `${p.Q.toFixed(4)} m³/s`],
        ["Bucket tangential speed u", `${p.u.toFixed(2)} m/s (u/V = ${p.ratio.toFixed(2)})`],
        ["Hydraulic efficiency η_h", `${(p.etaH * 100).toFixed(1)} %`],
        ["Power developed", `${(p.P / 1000).toFixed(1)} kW of ${(p.Pin / 1000).toFixed(1)} kW`],
        ["Optimal wheel speed (u = V/2)", `${p.rpmBest.toFixed(0)} rpm`],
      ]}
      controls={
        <>
          <Slider label="Gross Head H" value={H} min={50} max={1000} step={1} digits={0} unit=" m" onChange={(x) => set("H", x)} />
          <Slider label="Nozzle orifice diameter d" value={d} min={20} max={300} step={1} digits={0} unit=" mm" onChange={(x) => set("d", x)} />
          <Slider label="Runner pitch diameter D" value={D} min={0.5} max={4} step={0.05} digits={2} unit=" m" onChange={(x) => set("D", x)} />
          <Slider label="Runner speed N" value={rpm} min={50} max={1500} step={5} digits={0} unit=" rpm" onChange={(x) => set("rpm", x)} />
        </>
      }
    />
  );
}
