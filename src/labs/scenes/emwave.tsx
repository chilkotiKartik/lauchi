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
  const freqTHz = 299792458 / (nm * 1e-9) / 1e12, eV = 1239.84198 / nm;
  const rank = (a: number) => Math.cos(a);
  void rank;
  return (
    <LabFrame
      label="Live electromagnetic wave: perpendicular electric and magnetic fields travelling together"
      camera={[2, 3, 7]}
      onReset={reset}
      scene={() => (<group><Tick fn={tick} />
        <Line points={[[-L / 2, 0, 0], [L / 2 + 0.4, 0, 0]]} color="#8aa0ab" lineWidth={2} />
        <mesh position={[L / 2 + 0.5, 0, 0]} rotation={[0, 0, -Math.PI / 2]}><coneGeometry args={[0.12, 0.3, 12]} /><meshStandardMaterial color="#8aa0ab" /></mesh>
        <instancedMesh ref={eRef} args={[undefined, undefined, N]} frustumCulled={false}><cylinderGeometry args={[0.03, 0.03, 1, 6]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.35} /></instancedMesh>
        <instancedMesh ref={bRef} args={[undefined, undefined, N]} frustumCulled={false}><cylinderGeometry args={[0.03, 0.03, 1, 6]} /><meshStandardMaterial color="#ff9a1f" /></instancedMesh>
      </group>)}
      readouts={[["Wavelength", `${nm} nm`], ["Frequency f = c/λ", `${freqTHz.toFixed(0)} THz`], ["Photon energy hc/λ", `${eV.toFixed(2)} eV`], ["Speed c", "299 792 458 m/s"]]}
      controls={<>
        <Slider label="Wavelength (visible light)" value={nm} min={400} max={700} step={5} digits={0} unit=" nm" onChange={setNm} />
        <Slider label="Polarisation angle" value={pol} min={0} max={180} step={1} digits={0} unit="°" onChange={setPol} />
        <Slider label="Amplitude" value={amp} min={0.3} max={1.5} onChange={setAmp} />
      </>}
      note={<p>Coloured rods are the electric field E, orange rods the magnetic field B. They oscillate in phase, at right angles to each other and to the direction of travel (the grey axis), so E × B points along the propagation direction. On screen the wave is drawn at a visual scale — but the readouts are real: f = c/λ and photon energy E = hc/λ = 1239.84 eV·nm / λ. Rotating the polarisation angle turns the plane in which E oscillates.</p>}
    />
  );
}
