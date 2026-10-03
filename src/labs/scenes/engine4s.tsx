"use client";
import { useMemo, useRef } from "react";
import type * as THREE from "three";
import { cylVolume, engine, slider, strokeOf } from "../sim/mechx";
import { Tick } from "../Stage";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { MECHX_SPECS } from "../meta/mechx.specs";
import { C } from "../kit";
import { Graph, Rod, type XY } from "../kit2";

const RR = 0.7, LL = 2.1;

/** Pressure inside the cylinder for indicator dot telemetry */
function pressure(crank: number, r: number, ci: boolean) {
  const a = ((crank % 720) + 720) % 720, v = cylVolume(a, r), v1 = 1 + 1 / (r - 1);
  if (a < 180) return 1;
  if (a < 360) return (v1 / v) ** 1.4;
  if (a < 540) {
    const peak = (r ** 1.4) * (ci ? 1.6 : 2.8);
    const vc = 1 / (r - 1);
    return ci && a < 400 ? r ** 1.4 * 1.6 : peak * (vc / v) ** 1.4;
  }
  return 1.05;
}

function Mechanism({ crank0, rpm, playing, ci }: { crank0: number; rpm: number; playing: boolean; ci: boolean }) {
  const crank = useRef<THREE.Group>(null);
  const rod = useRef<THREE.Group>(null);
  const piston = useRef<THREE.Group>(null);
  const inV = useRef<THREE.Mesh>(null);
  const exV = useRef<THREE.Mesh>(null);
  const flame = useRef<THREE.Mesh>(null);
  const ang = useRef(crank0);

  const tick = (dt: number) => {
    if (playing) ang.current = (ang.current + Math.min(dt, 0.05) * (rpm / 60) * 360 * 0.25) % 720;
    else ang.current = crank0;

    const a = ang.current, th = (a * Math.PI) / 180, py = slider(a, RR, LL);
    if (crank.current) crank.current.rotation.z = -th;

    const pinX = RR * Math.sin(th), pinY = RR * Math.cos(th);
    if (piston.current) piston.current.position.y = py;
    if (rod.current) {
      rod.current.position.set(pinX / 2, (pinY + py) / 2, 0);
      rod.current.rotation.z = Math.atan2(pinX, py - pinY);
    }

    const s = strokeOf(a), lift = (open: boolean) => (open ? -0.22 : 0);
    if (inV.current) inV.current.position.y = RR + LL + 0.95 + lift(s === "suction");
    if (exV.current) exV.current.position.y = RR + LL + 0.95 + lift(s === "exhaust");
    if (flame.current) {
      const on = s === "power" && a < 450;
      flame.current.scale.setScalar(on ? 1 + 0.5 * Math.sin(a * 2) : 0.0001);
    }
  };

  return (
    <group>
      <Tick fn={tick} />

      {/* Engine Crankcase & Cylinder Block with cooling fins */}
      <group position={[0, RR + LL + 0.1, 0]}>
        {[-0.8, -0.4, 0, 0.4, 0.8].map((finY, i) => (
          <mesh key={i} position={[0, finY, 0]}>
            <cylinderGeometry args={[0.9, 0.9, 0.06, 32]} />
            <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
          </mesh>
        ))}
      </group>

      {/* Translucent Glass Cylinder Liner */}
      <mesh position={[0, (LL - RR + 0.2 + RR + LL + 1.0) / 2, 0]}>
        <cylinderGeometry args={[0.66, 0.66, RR * 2 + 1.6, 32, 1, true]} />
        <meshStandardMaterial color="#93c5fd" transparent opacity={0.25} roughness={0.1} metalness={0.9} />
      </mesh>

      {/* Crankshaft with heavy counterweights */}
      <group ref={crank}>
        <Rod a={[0, 0, 0]} b={[0, RR, 0]} r={0.14} color="#94a3b8" />
        {/* Flywheel disc */}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.25]}>
          <cylinderGeometry args={[0.65, 0.65, 0.22, 32]} />
          <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.2} />
        </mesh>
        {/* Crank pin */}
        <mesh position={[0, RR, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 0.35, 24]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.1} />
        </mesh>
      </group>

      {/* Forged Steel Connecting Rod (H-Beam Profile) */}
      <group ref={rod}>
        <Rod a={[0, -LL / 2, 0]} b={[0, LL / 2, 0]} r={0.1} color="#cbd5e1" />
        <mesh position={[0, -LL / 2, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.18, 0.18, 0.22, 24]} />
          <meshStandardMaterial color="#64748b" metalness={0.85} roughness={0.25} />
        </mesh>
        <mesh position={[0, LL / 2, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.15, 0.15, 0.2, 24]} />
          <meshStandardMaterial color="#64748b" metalness={0.85} roughness={0.25} />
        </mesh>
      </group>

      {/* High-Performance Piston with 3 Compression Rings */}
      <group ref={piston}>
        <mesh position={[0, 0.25, 0]}>
          <cylinderGeometry args={[0.62, 0.62, 0.65, 32]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.15} />
        </mesh>
        {/* Compression Rings */}
        {[0.12, 0.26, 0.4].map((ringY, i) => (
          <mesh key={i} position={[0, ringY, 0]}>
            <cylinderGeometry args={[0.635, 0.635, 0.04, 32]} />
            <meshStandardMaterial color="#0f172a" metalness={0.95} roughness={0.1} />
          </mesh>
        ))}
        {/* Gudgeon Pin */}
        <mesh position={[0, 0.18, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 0.8, 20]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.1} />
        </mesh>
      </group>

      {/* Intake Poppet Valve (Blue Glow) */}
      <group ref={inV} position={[-0.32, RR + LL + 0.95, 0]}>
        <mesh rotation={[Math.PI, 0, 0]}>
          <cylinderGeometry args={[0.22, 0.05, 0.15, 24]} />
          <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={0.4} metalness={0.7} />
        </mesh>
        <mesh position={[0, 0.25, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.4, 16]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.9} />
        </mesh>
      </group>

      {/* Exhaust Poppet Valve (Red Glow) */}
      <group ref={exV} position={[0.32, RR + LL + 0.95, 0]}>
        <mesh rotation={[Math.PI, 0, 0]}>
          <cylinderGeometry args={[0.22, 0.05, 0.15, 24]} />
          <meshStandardMaterial color="#f87171" emissive="#dc2626" emissiveIntensity={0.4} metalness={0.7} />
        </mesh>
        <mesh position={[0, 0.25, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.4, 16]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.9} />
        </mesh>
      </group>

      {/* Spark Plug / Diesel Injector */}
      <group position={[0, RR + LL + 1.15, 0]}>
        <mesh>
          <cylinderGeometry args={[0.08, 0.1, 0.35, 16]} />
          <meshStandardMaterial color={ci ? "#a855f7" : "#eab308"} metalness={0.8} roughness={0.2} />
        </mesh>
      </group>

      {/* Dynamic Volumetric Combustion Flame */}
      <mesh ref={flame} position={[0, RR + LL + 0.72, 0]}>
        <sphereGeometry args={[0.42, 24, 24]} />
        <meshStandardMaterial
          color="#ff7a00"
          emissive="#ff3d00"
          emissiveIntensity={2.5}
          transparent
          opacity={0.85}
          roughness={0.1}
        />
      </mesh>
    </group>
  );
}

export default function Engine4sLab() {
  const [P, set, reset] = useLabParams(MECHX_SPECS.engine4s);
  const { r, rpm, bore, stroke, crank, fuel } = P;
  const ci = fuel === "ci";
  const e = engine(bore, stroke, r, rpm, ci);
  const loop = useMemo<XY[]>(
    () => Array.from({ length: 145 }, (_, i) => {
      const a = i * 5;
      return [cylVolume(a, r), pressure(a, r, ci)] as XY;
    }),
    [r, ci]
  );
  const pmax = Math.max(...loop.map((p) => p[1])) * 1.1;

  return (
    <LabFrame
      label="High-fidelity 4-Stroke IC Engine: cylinder block, forged crankshaft, dual valves, piston rings, and thermodynamic P-V indicator diagram"
      camera={[1.6, 1.4, 9.5]}
      onReset={reset}
      note={
        <p>
          Two crank revolutions (720°) make one full four-stroke cycle: <b>Suction</b> (intake valve open, fresh charge drawn in), <b>Compression</b> (both valves sealed, mixture compressed), <b>Power</b> (spark or diesel ignition drives piston with high expansion pressure), and <b>Exhaust</b> (exhaust valve opens to purge spent gases).
        </p>
      }
      scene={(playing) => (
        <group>
          <group position={[-2.6, -1.9, 0]}>
            <Mechanism crank0={crank} rpm={rpm} playing={playing} ci={ci} />
          </group>
          <Graph
            x0={0.2}
            y0={-2}
            w={4.6}
            h={4}
            xr={[0, 1 + 1 / (r - 1)]}
            yr={[0, pmax]}
            curves={[{ pts: loop, color: ci ? C.purple : C.gold, w: 3 }]}
            marker={[cylVolume(crank, r), pressure(crank, r, ci)]}
          />
        </group>
      )}
      readouts={[
        ["Stroke at this crank angle", `${strokeOf(crank)} (${crank.toFixed(0)}°)`],
        ["Swept volume", `${e.Vs.toFixed(0)} cm³`],
        ["Clearance volume", `${e.Vc.toFixed(1)} cm³`],
        ["Air-standard efficiency", `${e.eta.toFixed(1)} % (${ci ? "Diesel, ρ = 2" : "Otto"})`],
        ["Mean piston speed", `${e.pistonSpeed.toFixed(2)} m/s`],
        ["Power strokes per second", e.powerStrokesPerS.toFixed(1)],
      ]}
      controls={
        <>
          <Slider label="Compression ratio r" value={r} min={6} max={22} step={0.1} digits={1} onChange={(x) => set("r", x)} />
          <Pick
            label="Engine Cycle"
            value={fuel}
            options={[
              { id: "si", label: "Spark ignition (Petrol / Otto)" },
              { id: "ci", label: "Compression ignition (Diesel)" },
            ]}
            onChange={(x) => set("fuel", x)}
          />
          <Slider label="Engine speed (animation)" value={rpm} min={60} max={3000} step={10} digits={0} unit=" rpm" onChange={(x) => set("rpm", x)} />
          <Slider label="Crank angle (when paused)" value={crank} min={0} max={720} step={1} digits={0} unit="°" onChange={(x) => set("crank", x)} />
          <Slider label="Cylinder Bore" value={bore} min={50} max={150} step={1} digits={0} unit=" mm" onChange={(x) => set("bore", x)} />
          <Slider label="Piston Stroke" value={stroke} min={50} max={150} step={1} digits={0} unit=" mm" onChange={(x) => set("stroke", x)} />
        </>
      }
    />
  );
}
