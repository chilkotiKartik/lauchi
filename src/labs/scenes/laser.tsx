"use client";
import { Line } from "@react-three/drei";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { laser } from "../sim/phyx";
import { Tick, useQuality } from "../Stage";
import { LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { PHYX_SPECS } from "../meta/phyx.specs";
import { C, Box } from "../kit";
import { Flow, Graph, Rod } from "../kit2";
import { prng } from "../sim/physics";

const NA = 60, rnd = prng(17);
const AX = Float32Array.from({ length: NA }, () => rnd()), AY = Float32Array.from({ length: NA }, () => rnd() * 2 - 1), AZ = Float32Array.from({ length: NA }, () => rnd() * 2 - 1), PH = Float32Array.from({ length: NA }, () => rnd() * 6.28);
const _o = new THREE.Object3D(), _c = new THREE.Color();
function paintAtoms(m: THREE.InstancedMesh, len: number, t: number, excited: number, n: number) {
  for (let i = 0; i < NA; i++) {
    if (i >= n) { _o.position.set(0, -99, 0); _o.scale.setScalar(0.0001); _o.updateMatrix(); m.setMatrixAt(i, _o.matrix); continue; }
    const wob = 0.05 * Math.sin(t * 3 + PH[i]);
    _o.position.set(-len / 2 + AX[i] * len, AY[i] * 0.35 + wob, AZ[i] * 0.35);
    const on = (Math.sin(t * 2 + PH[i]) * 0.5 + 0.5) < excited;
    _o.scale.setScalar(on ? 1.25 : 0.8); _o.updateMatrix(); m.setMatrixAt(i, _o.matrix);
    m.setColorAt(i, _c.set(i % 7 === 0 ? (on ? "#ffc83d" : "#9db0ba") : on ? "#ff5a5f" : "#5b6d77"));
  }
  m.instanceMatrix.needsUpdate = true;
  if (m.instanceColor) m.instanceColor.needsUpdate = true;
}
function Atoms({ len, excited, n }: { len: number; excited: number; n: number }) {
  const ref = useRef<THREE.InstancedMesh>(null), t = useRef(0);
  useLayoutEffect(() => { if (ref.current) paintAtoms(ref.current, len, t.current, excited, n); }, [len, excited, n]);
  return (<>
    <Tick fn={(dt) => { t.current += Math.min(dt, 0.05); if (ref.current) paintAtoms(ref.current, len, t.current, excited, n); }} />
    <instancedMesh ref={ref} args={[undefined, undefined, NA]} frustumCulled={false}><sphereGeometry args={[0.06, 10, 10]} /><meshStandardMaterial color="#ffffff" emissive="#331111" /></instancedMesh>
  </>);
}

export default function LaserLab() {
  const q = useQuality();
  const [P, set, reset] = useLabParams(PHYX_SPECS.laser);
  const { I, mix, L, R2 } = P;
  const s = laser(I, mix, L, R2);
  const len = 2 + (L / 100) * 5;
  const excited = Math.min(0.95, 0.15 + 0.08 * I * (s.inversion > 0 ? Math.min(1.5, s.inversion) : 0));
  const axis = useMemo<[number, number, number][]>(() => [[-len / 2 + 0.1, 0, 0], [len / 2 - 0.1, 0, 0], [-len / 2 + 0.1, 0, 0.001]], [len]);
  const out = useMemo<[number, number, number][]>(() => [[len / 2 + 0.2, 0, 0], [len / 2 + 3, 0, 0]], [len]);
  const gainCurve = useMemo(() => Array.from({ length: 41 }, (_, i) => [i / 4, laser(i / 4, mix, L, R2).g0] as [number, number]), [mix, L, R2]);
  return (
    <LabFrame
      label="A glass He–Ne tube between two mirrors; atoms glow when excited, photons bounce along the axis and a red beam leaves the output mirror once gain exceeds the losses; a graph shows gain against current with the threshold line"
      camera={[0, 2.2, 9]}
      onReset={reset}
      scene={() => (
        <group position={[-0.8, 0.6, 0]}>
          {/* Glass discharge plasma tube with gas glow */}
          <Rod a={[-len / 2, 0, 0]} b={[len / 2, 0, 0]} r={0.58} color="#b4d7ea" o={0.35} metal={0.1} rough={0.05} />
          {/* Internal plasma glow column */}
          <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.38, 0.38, len - 0.2, 24]} />
            <meshStandardMaterial color={I > 0 ? (s.lasing ? "#ff4d4d" : "#ff8566") : "#3a4a52"} emissive={I > 0 ? (s.lasing ? "#ff2222" : "#ff6644") : "#000000"} emissiveIntensity={I > 0 ? Math.min(2.0, 0.3 + I * 0.18) : 0} transparent opacity={0.4} />
          </mesh>

          <Atoms len={len - 0.4} excited={excited} n={q === "low" ? 30 : NA} />

          {/* High Reflectivity Rear Mirror Mount (99.9% mirror) */}
          <group position={[-len / 2 - 0.18, 0, 0]}>
            <mesh>
              <cylinderGeometry args={[0.75, 0.75, 0.14, 32]} rotation={[0, 0, Math.PI / 2]} />
              <meshStandardMaterial color="#2d3748" metalness={0.8} roughness={0.3} />
            </mesh>
            <mesh position={[0.075, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <circleGeometry args={[0.55, 32]} />
              <meshStandardMaterial color="#e2e8f0" metalness={0.98} roughness={0.05} />
            </mesh>
          </group>

          {/* Output Coupler Mirror Mount */}
          <group position={[len / 2 + 0.18, 0, 0]}>
            <mesh>
              <cylinderGeometry args={[0.75, 0.75, 0.14, 32]} rotation={[0, 0, Math.PI / 2]} />
              <meshStandardMaterial color="#2d3748" metalness={0.8} roughness={0.3} />
            </mesh>
            <mesh position={[-0.075, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
              <circleGeometry args={[0.55, 32]} />
              <meshPhysicalMaterial color="#90cdf4" metalness={0.6} roughness={0.1} transparent opacity={0.6} />
            </mesh>
          </group>

          {/* Brewster angle windows at each end of the tube */}
          {[-len / 2 + 0.35, len / 2 - 0.35].map((x, idx) => (
            <mesh key={x} position={[x, 0, 0]} rotation={[0, 0, idx === 0 ? 0.98 : -0.98]}>
              <boxGeometry args={[0.04, 0.95, 0.95]} />
              <meshPhysicalMaterial color="#e2f1f8" transparent opacity={0.45} roughness={0.05} transmission={0.9} />
            </mesh>
          ))}

          {/* Laser Cavity Resonating Photons */}
          {s.lasing && <Flow path={axis} n={24} speed={1.8} color="#ff2222" r={0.05} />}

          {/* Output Laser Beam (632.8 nm Red Coherent Beam) */}
          {s.lasing && (
            <group>
              <mesh position={[len / 2 + 1.8, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.045, 0.045, 3.4, 16]} />
                <meshStandardMaterial color="#ff1111" emissive="#ff0000" emissiveIntensity={2.5} roughness={0.1} />
              </mesh>
              {/* Outer Beam Halo */}
              <mesh position={[len / 2 + 1.8, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.12, 0.12, 3.4, 16]} />
                <meshBasicMaterial color="#ff4444" transparent opacity={0.25} />
              </mesh>
              <Flow path={out} n={12} speed={1.5} color="#ffdddd" r={0.06} />
            </group>
          )}

          {/* High-Voltage Power Supply / Lab Bench Stand */}
          <group position={[0, -1.2, 0]}>
            <mesh>
              <boxGeometry args={[len + 0.8, 0.35, 1.4]} />
              <meshStandardMaterial color="#1a202c" metalness={0.7} roughness={0.4} />
            </mesh>
            {/* Anode & Cathode Power Terminals */}
            <mesh position={[-len / 2 + 0.8, 0.45, 0]}>
              <cylinderGeometry args={[0.08, 0.08, 0.6, 16]} />
              <meshStandardMaterial color="#e53e3e" metalness={0.8} roughness={0.3} />
            </mesh>
            <mesh position={[len / 2 - 0.8, 0.45, 0]}>
              <cylinderGeometry args={[0.08, 0.08, 0.6, 16]} />
              <meshStandardMaterial color="#2b6cb0" metalness={0.8} roughness={0.3} />
            </mesh>
          </group>

          <Graph x0={-2.2} y0={-4.4} w={4.4} h={2.2} xr={[0, 10]} yr={[0, 0.14]} curves={[{ pts: gainCurve, color: C.green, w: 3 }, { pts: [[0, s.gth], [10, s.gth]], color: C.red, dashed: true }]} marker={[I, s.g0]} />
        </group>
      )}
      readouts={[
        ["Small-signal gain g₀", `${(s.g0 * 100).toFixed(2)} %/m`],
        ["Threshold gain", `${(s.gth * 100).toFixed(2)} %/m`],
        ["Lasing?", s.lasing ? "Yes: 632.8 nm red beam" : "No (below threshold)"],
        ["Output power", s.lasing ? `${s.out.toFixed(2)} mW` : "0 mW"],
        ["Mode spacing c/2L", `${s.fsrMHz.toFixed(0)} MHz`],
        ["Photon energy", `${s.photonEv.toFixed(3)} eV`],
      ]}
      controls={<>
        <Slider label="Discharge current" value={I} min={0} max={10} step={0.1} digits={1} unit=" mA" onChange={(x) => set("I", x)} />
        <Slider label="He : Ne ratio" value={mix} min={1} max={15} step={0.5} digits={1} unit=" : 1" onChange={(x) => set("mix", x)} />
        <Slider label="Cavity length L" value={L} min={10} max={100} step={1} digits={0} unit=" cm" onChange={(x) => set("L", x)} />
        <Slider label="Output mirror reflectivity" value={R2} min={90} max={99.9} step={0.1} digits={1} unit=" %" onChange={(x) => set("R2", x)} />
      </>}
      note={<p>Electrons in the discharge excite <b>helium</b> atoms (gold) into long-lived metastable states. Because those levels almost match neon’s 3s level, collisions hand the energy to <b>neon</b> (red when excited), building a population inversion between Ne 3s and 2p. A photon at 632.8 nm then triggers stimulated emission of identical photons, which bounce between the mirrors and grow. Lasing starts when the gain per metre beats the losses: g<sub>th</sub> = (1/2L) ln(1/R₁R₂) + internal loss. The Brewster windows make the beam polarised. The gain model (how g₀ depends on current and He:Ne ratio) is simplified; the threshold and mode-spacing formulas are exact.</p>}
    />
  );
}
