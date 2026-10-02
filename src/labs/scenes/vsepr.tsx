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
  const tick = (dt: number) => { if (g.current) g.current.rotation.y += Math.min(dt, 0.05) * 0.45; };
  const S = 1.7;

  return (
    <LabFrame
      label="VSEPR Molecular Geometry: Central atom, covalent bonding orbitals, and lone pair electron repulsion lobes"
      camera={[0, 1.8, 6.5]}
      onReset={reset}
      scene={() => (
        <group ref={g}>
          <Tick fn={tick} />

          {/* Central Atom Nucleus & Core Sphere */}
          <mesh>
            <sphereGeometry args={[0.42, 32, 32]} />
            <meshStandardMaterial color="#f1c40f" emissive="#f39c12" emissiveIntensity={0.25} roughness={0.2} metalness={0.3} />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.48, 16, 16]} />
            <meshStandardMaterial color="#ffffff" transparent opacity={0.15} roughness={0.1} />
          </mesh>

          {/* Covalent Bond Cylinders & Peripheral Ligand Atoms */}
          {v.bonded.map((d, i) => {
            const bx = d[0] * S, by = d[1] * S, bz = d[2] * S;
            return (
              <group key={i}>
                {/* Cylindrical Bond with Chrome/Covalent finish */}
                <Line points={[[0, 0, 0], [bx, by, bz]]} color="#bdc3c7" lineWidth={6} />
                
                {/* Ligand Atom Sphere with Specular Highlight */}
                <group position={[bx, by, bz]}>
                  <mesh>
                    <sphereGeometry args={[0.28, 28, 28]} />
                    <meshStandardMaterial color="#3498db" emissive="#2980b9" emissiveIntensity={0.3} roughness={0.2} metalness={0.4} />
                  </mesh>
                  {/* Outer Electron Shell Aura */}
                  <mesh>
                    <sphereGeometry args={[0.34, 16, 16]} />
                    <meshStandardMaterial color="#3498db" transparent opacity={0.2} />
                  </mesh>
                </group>
              </group>
            );
          })}

          {/* Non-Bonding Lone Pair Orbital Lobes (Teardrop Clouds) */}
          {v.pairs.map((d, i) => {
            const lx = d[0] * 0.9, ly = d[1] * 0.9, lz = d[2] * 0.9;
            return (
              <group key={i} position={[lx, ly, lz]}>
                {/* Electron Cloud Orbital Lobe */}
                <mesh scale={[0.5, 0.5, 0.85]}>
                  <sphereGeometry args={[0.55, 24, 24]} />
                  <meshStandardMaterial
                    color="#9b59b6"
                    emissive="#8e44ad"
                    emissiveIntensity={0.65}
                    transparent
                    opacity={0.6}
                    roughness={0.1}
                  />
                </mesh>
                {/* Paired Electron Dots */}
                {[-0.1, 0.1].map((ex, j) => (
                  <mesh key={j} position={[ex, 0, 0.2]}>
                    <sphereGeometry args={[0.045, 12, 12]} />
                    <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1.2} />
                  </mesh>
                ))}
              </group>
            );
          })}
        </group>
      )}
      readouts={[
        ["Electron domains (steric number)", String(dom)],
        ["Bonding electron pairs", String(dom - l)],
        ["Non-bonding lone pairs", String(l)],
        ["Molecular shape geometry", v.shape],
      ]}
      controls={<>
        <Slider label="Total electron domains" value={dom} min={2} max={6} step={1} digits={0} onChange={(x) => { setDom(x); setLone(Math.min(lone, maxLonePairs(x))); }} />
        <Slider label="Lone pairs on central atom" value={l} min={0} max={Math.max(1, maxLonePairs(dom))} step={1} digits={0} onChange={setLone} />
      </>}
      note={<p><b>Valence Shell Electron Pair Repulsion (VSEPR):</b> Valence electron pairs around the central atom position themselves as far apart as possible to minimize mutual electrostatic repulsion. Purple lobes represent non-bonding lone pair electron clouds; blue spheres represent bonded atoms. Lone pairs exert greater repulsive force than bonding pairs, compressing the bond angles.</p>}
    />
  );
}
