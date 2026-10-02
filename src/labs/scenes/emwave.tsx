"use client";
import { Line } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { Tick } from "../Stage";
import { LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { CORE_SPECS } from "../meta/core.specs";

const L = 6, N = 48;
function nmToColor(nm: number) {
  const h = 0.78 - ((nm - 400) / 300) * 0.78; // violet → red
  return new THREE.Color().setHSL(h, 1, 0.55);
}
export default function EmWaveLab() {
  const [P, set, reset] = useLabParams(CORE_SPECS.emwave);
  const { nm, pol, amp } = P;
  const setNm = (x: (typeof P)["nm"]) => set("nm", x), setPol = (x: (typeof P)["pol"]) => set("pol", x), setAmp = (x: (typeof P)["amp"]) => set("amp", x);
  const eRef = useRef<THREE.InstancedMesh>(null);
  const bRef = useRef<THREE.InstancedMesh>(null);
  const t = useRef(0);
  const cycles = 1 + ((700 - nm) / 300) * 2.5; // visual: shorter wavelength → more cycles on screen
  const d = useMemo(() => new THREE.Object3D(), []);
  const th = (pol * Math.PI) / 180;
  
  const update = () => {
    for (let i = 0; i < N; i++) {
      const x = -L / 2 + (L * i) / (N - 1), ph = Math.sin((2 * Math.PI * cycles * (x + L / 2)) / L - t.current) * amp;
      // E along direction (cosθ, sinθ) in the y–z plane; B perpendicular
      for (const [ref, ang] of [[eRef.current, th], [bRef.current, th + Math.PI / 2]] as const) {
        if (!ref) continue;
        d.position.set(x, (ph / 2) * Math.cos(ang), (ph / 2) * Math.sin(ang));
        d.rotation.set(0, 0, 0); d.lookAt(x, ph * Math.cos(ang), ph * Math.sin(ang));
        d.rotateX(Math.PI / 2); d.scale.set(1, Math.max(0.001, Math.abs(ph)), 1);
        d.updateMatrix(); ref.setMatrixAt(i, d.matrix);
        ref.instanceMatrix.needsUpdate = true;
      }
    }
  };
  const tick = (dt: number) => { t.current += Math.min(dt, 0.05) * 2.5; update(); };
  const color = nmToColor(nm);
  const colorHex = `#${color.getHexString()}`;
  const freqTHz = 299792458 / (nm * 1e-9) / 1e12, eV = 1239.84198 / nm;

  return (
    <LabFrame
      label="Live electromagnetic wave: orthogonal electric and magnetic field vectors on an optical rail apparatus"
      camera={[2.2, 3.2, 7.8]}
      onReset={reset}
      scene={() => (
        <group>
          <Tick fn={tick} />
          {/* Laboratory optical bench rail base */}
          <group position={[0, -2.2, 0]}>
            <mesh>
              <boxGeometry args={[L + 2.8, 0.24, 0.6]} />
              <meshStandardMaterial color="#1a252c" metalness={0.8} roughness={0.3} />
            </mesh>
            <mesh position={[0, 0.125, 0]}>
              <boxGeometry args={[L + 2.8, 0.02, 0.22]} />
              <meshStandardMaterial color="#7f939e" metalness={0.9} roughness={0.15} />
            </mesh>
            {[-L / 2 - 0.8, 0, L / 2 + 0.8].map((px, i) => (
              <mesh key={i} position={[px, -0.2, 0]}>
                <cylinderGeometry args={[0.22, 0.26, 0.16, 24]} />
                <meshStandardMaterial color="#2c3a42" metalness={0.6} roughness={0.4} />
              </mesh>
            ))}
          </group>

          {/* Transmitter / Laser Head on sliding post */}
          <group position={[-L / 2 - 0.8, 0, 0]}>
            <mesh position={[0, -1.1, 0]}>
              <cylinderGeometry args={[0.07, 0.07, 2.0, 16]} />
              <meshStandardMaterial color="#b4c6d0" metalness={0.85} roughness={0.2} />
            </mesh>
            <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.38, 0.44, 0.9, 24]} />
              <meshStandardMaterial color="#1e2c35" metalness={0.6} roughness={0.35} />
            </mesh>
            {/* Front gold emitter bezel */}
            <mesh position={[0.46, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.22, 0.26, 0.08, 24]} />
              <meshStandardMaterial color="#cca43b" metalness={0.85} roughness={0.25} />
            </mesh>
            {/* Laser power LED */}
            <mesh position={[-0.2, 0.42, 0]}>
              <sphereGeometry args={[0.05, 12, 12]} />
              <meshStandardMaterial color="#44c95a" emissive="#44c95a" emissiveIntensity={1.2} />
            </mesh>
          </group>

          {/* Receiver / Photodiode Detector Unit */}
          <group position={[L / 2 + 0.8, 0, 0]}>
            <mesh position={[0, -1.1, 0]}>
              <cylinderGeometry args={[0.07, 0.07, 2.0, 16]} />
              <meshStandardMaterial color="#b4c6d0" metalness={0.85} roughness={0.2} />
            </mesh>
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[0.6, 0.8, 0.6]} />
              <meshStandardMaterial color="#1e2c35" metalness={0.6} roughness={0.35} />
            </mesh>
            <mesh position={[-0.31, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.24, 0.24, 0.04, 24]} />
              <meshStandardMaterial color="#0d181e" roughness={0.2} />
            </mesh>
          </group>

          {/* Propagation Axis */}
          <Line points={[[-L / 2 - 0.3, 0, 0], [L / 2 + 0.4, 0, 0]]} color="#8aa0ab" lineWidth={2} />
          <mesh position={[L / 2 + 0.45, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
            <coneGeometry args={[0.1, 0.25, 16]} />
            <meshStandardMaterial color="#8aa0ab" metalness={0.6} roughness={0.3} />
          </mesh>

          {/* Polarizer Ring Collar */}
          <group position={[-L / 2 + 0.6, 0, 0]} rotation={[th, 0, 0]}>
            <mesh rotation={[0, Math.PI / 2, 0]}>
              <torusGeometry args={[0.9, 0.08, 16, 32]} />
              <meshStandardMaterial color="#cca43b" metalness={0.85} roughness={0.25} />
            </mesh>
            <Line points={[[0, -0.82, 0], [0, 0.82, 0]]} color="#ffffff" lineWidth={2.2} />
          </group>

          {/* Field Vector Arrays */}
          <instancedMesh ref={eRef} args={[undefined, undefined, N]} frustumCulled={false}>
            <cylinderGeometry args={[0.035, 0.035, 1, 12]} />
            <meshStandardMaterial color={colorHex} emissive={colorHex} emissiveIntensity={0.6} roughness={0.2} metalness={0.4} />
          </instancedMesh>
          <instancedMesh ref={bRef} args={[undefined, undefined, N]} frustumCulled={false}>
            <cylinderGeometry args={[0.035, 0.035, 1, 12]} />
            <meshStandardMaterial color="#ff9a1f" emissive="#ff9a1f" emissiveIntensity={0.5} roughness={0.2} metalness={0.4} />
          </instancedMesh>
        </group>
      )}
      readouts={[
        ["Wavelength λ", `${nm} nm`],
        ["Frequency f = c/λ", `${freqTHz.toFixed(1)} THz`],
        ["Photon energy hc/λ", `${eV.toFixed(2)} eV`],
        ["Polarisation angle", `${pol.toFixed(0)}°`],
        ["Speed of light c", "299 792 458 m/s"],
      ]}
      controls={<>
        <Slider label="Wavelength (visible spectrum)" value={nm} min={400} max={700} step={5} digits={0} unit=" nm" onChange={setNm} />
        <Slider label="Polarisation angle θ" value={pol} min={0} max={180} step={1} digits={0} unit="°" onChange={setPol} />
        <Slider label="Field amplitude" value={amp} min={0.3} max={1.6} step={0.05} onChange={setAmp} />
      </>}
      note={<p><b>Electromagnetic wave propagation:</b> The electric field <b>E</b> (coloured vectors) and magnetic field <b>B</b> (orange vectors) oscillate in phase and mutually perpendicular to each other and to the propagation axis. The Poynting vector <b>S</b> = (1/μ₀)(<b>E</b> × <b>B</b>) points along the direction of power flow. Rotating the polarizer ring turns the plane of vibration of <b>E</b>. The physical readouts calculate photon frequency and Planck quantum energy E = hc/λ.</p>}
    />
  );
}
