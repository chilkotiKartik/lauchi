"use client";
import { Line } from "@react-three/drei";
import { useMemo, useRef } from "react";
import type * as THREE from "three";
import { otto } from "../math";
import { Tick } from "../Stage";
import { LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { CORE_SPECS } from "../meta/core.specs";

export default function OttoLab() {
  const [P, set, reset] = useLabParams(CORE_SPECS.otto);
  const { r, g, tau } = P;
  const setR = (x: (typeof P)["r"]) => set("r", x), setG = (x: (typeof P)["g"]) => set("g", x), setTau = (x: (typeof P)["tau"]) => set("tau", x);
  const o = useMemo(() => otto(r, g, tau), [r, g, tau]);
  const vmax = r, pmax = Math.max(...o.path.map((p) => p[1]));
  const X = (v: number) => ((v - 1) / (vmax - 1 || 1)) * 3.8 + 0.6, Y = (p: number) => (p / pmax) * 2.8 - 1.4;
  const pts = useMemo(() => o.path.map(([v, p]): [number, number, number] => [X(v), Y(p), 0]), [o, vmax, pmax]);

  const ball = useRef<THREE.Mesh>(null);
  const pistonGroup = useRef<THREE.Group>(null);
  const crank = useRef<THREE.Group>(null);
  const sparkRef = useRef<THREE.Mesh>(null);
  const t = useRef(0);

  const tick = (dt: number) => {
    t.current = (t.current + Math.min(dt, 0.05) * 0.2) % 1;
    const i = Math.floor(t.current * (pts.length - 1)), pt = pts[i], v = o.path[i][0];
    
    // Live indicator point on P-V diagram
    ball.current?.position.set(pt[0], pt[1], 0.06);

    // Crank rotation
    const theta = t.current * Math.PI * 2;
    if (crank.current) crank.current.rotation.z = -theta;

    if (pistonGroup.current) {
      pistonGroup.current.position.y = -0.4 + ((vmax - v) / (vmax - 1 || 1)) * 1.35;
    }

    // Spark ignition during phase 2->3
    const isSpark = t.current > 0.24 && t.current < 0.29;
    if (sparkRef.current) {
      sparkRef.current.scale.setScalar(isSpark ? 1.6 : 0.001);
    }
  };

  return (
    <LabFrame
      label="Four-stroke internal combustion engine cylinder cross-section with crankshaft linkage and synchronized P–V indicator diagram"
      camera={[0, 0.2, 8.8]}
      onReset={reset}
      scene={() => (
        <group>
          <Tick fn={tick} />

          {/* Engine Cylinder & Crankcase Assembly on Left */}
          <group position={[-2.8, -0.4, 0]}>
            {/* Cylinder Block Base & Cooling Fins */}
            {[-0.6, -0.2, 0.2, 0.6, 1.0, 1.4].map((fy, i) => (
              <mesh key={i} position={[0, fy, 0]}>
                <boxGeometry args={[2.1, 0.08, 1.6]} />
                <meshStandardMaterial color="#2d3c46" metalness={0.7} roughness={0.4} />
              </mesh>
            ))}

            {/* Cylinder Liner / Bore Wall */}
            <mesh position={[0, 0.5, 0]}>
              <cylinderGeometry args={[0.72, 0.72, 2.4, 32, 1, true]} />
              <meshStandardMaterial color="#8ca4b0" metalness={0.8} roughness={0.2} side={2} transparent opacity={0.35} />
            </mesh>

            {/* Cylinder Head on Top */}
            <mesh position={[0, 1.85, 0]}>
              <boxGeometry args={[1.9, 0.4, 1.5]} />
              <meshStandardMaterial color="#1a252c" metalness={0.7} roughness={0.3} />
            </mesh>

            {/* Spark Plug */}
            <group position={[0, 2.1, 0]}>
              <mesh>
                <cylinderGeometry args={[0.12, 0.12, 0.5, 16]} />
                <meshStandardMaterial color="#e8f1f5" roughness={0.1} />
              </mesh>
              <mesh position={[0, -0.32, 0]}>
                <cylinderGeometry args={[0.04, 0.04, 0.16, 12]} />
                <meshStandardMaterial color="#cca43b" metalness={0.9} roughness={0.2} />
              </mesh>
              <mesh ref={sparkRef} position={[0, -0.42, 0]}>
                <sphereGeometry args={[0.14, 12, 12]} />
                <meshBasicMaterial color="#ffea75" />
              </mesh>
            </group>

            {/* Intake & Exhaust Poppet Valves */}
            <mesh position={[-0.38, 1.7, 0]} rotation={[0, 0, 0.12]}>
              <cylinderGeometry args={[0.05, 0.18, 0.6, 16]} />
              <meshStandardMaterial color="#44c95a" metalness={0.8} roughness={0.2} />
            </mesh>
            <mesh position={[0.38, 1.7, 0]} rotation={[0, 0, -0.12]}>
              <cylinderGeometry args={[0.05, 0.18, 0.6, 16]} />
              <meshStandardMaterial color="#ff5a5f" metalness={0.8} roughness={0.2} />
            </mesh>

            {/* Reciprocating Piston with Ring Lands */}
            <group ref={pistonGroup} position={[0, 0.6, 0]}>
              <mesh>
                <cylinderGeometry args={[0.68, 0.68, 0.6, 32]} />
                <meshStandardMaterial color="#cca43b" metalness={0.65} roughness={0.25} />
              </mesh>
              {[-0.1, 0.05, 0.2].map((ry, i) => (
                <mesh key={i} position={[0, ry, 0]}>
                  <torusGeometry args={[0.685, 0.02, 8, 32]} />
                  <meshStandardMaterial color="#1a252c" metalness={0.9} roughness={0.1} />
                </mesh>
              ))}
              <mesh rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.1, 0.1, 1.2, 16]} />
                <meshStandardMaterial color="#b4c6d0" metalness={0.9} roughness={0.15} />
              </mesh>
            </group>

            {/* Crankshaft Web Disk */}
            <group ref={crank} position={[0, -1.8, 0]}>
              <mesh>
                <cylinderGeometry args={[0.75, 0.75, 0.18, 32]} />
                <meshStandardMaterial color="#4a5d68" metalness={0.8} roughness={0.3} />
              </mesh>
              <mesh position={[0, 0.55, 0.12]}>
                <cylinderGeometry args={[0.1, 0.1, 0.2, 16]} />
                <meshStandardMaterial color="#b4c6d0" metalness={0.9} roughness={0.15} />
              </mesh>
            </group>
          </group>

          {/* Indicator Card / P-V Graph on Right */}
          <group position={[0.2, 0, 0]}>
            <mesh position={[2.5, 0, -0.04]}>
              <boxGeometry args={[4.4, 3.8, 0.1]} />
              <meshStandardMaterial color="#141e24" roughness={0.5} metalness={0.5} />
            </mesh>
            <mesh position={[2.5, 0, -0.01]}>
              <planeGeometry args={[4.2, 3.6]} />
              <meshBasicMaterial color="#0b171d" />
            </mesh>

            {/* Grid & Axes */}
            <Line points={[[0.4, -1.4, 0], [4.6, -1.4, 0]]} color="#455a64" lineWidth={1.8} />
            <Line points={[[0.4, -1.4, 0], [0.4, 1.6, 0]]} color="#455a64" lineWidth={1.8} />

            {/* 4 Strokes of Otto Cycle */}
            <Line points={pts.slice(0, 41)} color="#2ba6f5" lineWidth={3.8} />
            <Line points={pts.slice(41, 82)} color="#ff5a5f" lineWidth={3.8} />
            <Line points={pts.slice(82, 123)} color="#a970ff" lineWidth={3.8} />
            <Line points={pts.slice(123)} color="#44c95a" lineWidth={3.8} />

            {/* Realtime Operating State Bead */}
            <mesh ref={ball}>
              <sphereGeometry args={[0.12, 16, 16]} />
              <meshStandardMaterial color="#ffc83d" emissive="#ffc83d" emissiveIntensity={0.8} />
            </mesh>
          </group>
        </group>
      )}
      readouts={[
        ["Thermal efficiency η = 1 − r^(1−γ)", `${(o.efficiency * 100).toFixed(1)} %`],
        ["Compression ratio r", r.toFixed(1)],
        ["Net indicated work W_net", `${o.work.toFixed(2)} nRT₁`],
        ["Heat input Q_in", `${o.heatIn.toFixed(2)} nRT₁`],
        ["Expansion ratio", r.toFixed(1)],
      ]}
      controls={<>
        <Slider label="Compression ratio r" value={r} min={4} max={14} step={0.5} digits={1} onChange={setR} />
        <Slider label="Specific heat ratio γ (Cp/Cv)" value={g} min={1.3} max={1.67} step={0.01} onChange={setG} />
        <Slider label="Peak temperature ratio T₃/T₁" value={tau} min={3} max={10} step={0.5} digits={1} onChange={setTau} />
      </>}
      note={<p><b>Otto Cycle (Spark-Ignition IC Engine):</b> State 1→2 (blue): Isentropic compression of fuel-air mixture. State 2→3 (red): Constant-volume combustion ignited by the spark plug. State 3→4 (purple): Isentropic power expansion stroke. State 4→1 (green): Constant-volume heat rejection blowdown. The enclosed area is the net mechanical work per cycle. Air-standard thermal efficiency η = 1 − (1/r)<sup>γ−1</sup> increases directly with higher compression ratio r.</p>}
    />
  );
}
