"use client";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { SPEC_MOLS, diatomicSpectrum, rotPopulation, type SpecMol } from "../sim/chem";
import { Tick } from "../Stage";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { CHEM_SPECS } from "../meta/chem.specs";

const CAP = 120, SPAN = 150, W = 3.4, dummy = new THREE.Object3D();
const atomR = (m: number) => Math.min(0.5, 0.16 + Math.cbrt(m) * 0.1);

/** Rotational fine-structure lines around the band origin: P branch left, R branch right, height ∝ population of the lower level. */
function lines(B: number, T: number, active: boolean): { x: number; h: number }[] {
  const out: { x: number; h: number }[] = [];
  if (!active) return out;
  const pops: number[] = []; let peak = 0;
  for (let J = 0; J < 60; J++) { const p = rotPopulation(B, J, T); pops.push(p); peak = Math.max(peak, p); }
  for (let m = 1; m <= 60; m++) {
    const d = 2 * B * m; if (d > SPAN) break;
    out.push({ x: (d / SPAN) * W, h: pops[m - 1] / peak });      // R(J = m − 1)
    if (m <= 59) out.push({ x: -(d / SPAN) * W, h: pops[m] / peak }); // P(J = m)
  }
  return out;
}

function Spectrum({ set }: { set: { x: number; h: number }[] }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = ref.current; if (!m) return;
    set.slice(0, CAP).forEach((l, i) => {
      const h = Math.max(0.04, l.h * 1.5);
      dummy.position.set(l.x, h / 2, 0); dummy.scale.set(0.035, h, 0.12); dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    });
    m.count = Math.min(CAP, set.length); m.instanceMatrix.needsUpdate = true;
  }, [set]);
  return <instancedMesh ref={ref} args={[undefined, undefined, CAP]}><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color="#ffc83d" emissive="#ffc83d" emissiveIntensity={0.35} /></instancedMesh>;
}

export default function SpectroLab() {
  const [P, set, reset] = useLabParams(CHEM_SPECS.spectro);
  const { k, r, mol } = P;
  const M = SPEC_MOLS[mol];
  const S = diatomicSpectrum(M.m1, M.m2, k, r);
  const active = !M.homo;
  const ls = useMemo(() => lines(S.B, 298, active), [S.B, active]);
  const tot = M.m1 + M.m2, bond = (r / 100) * 1.1;
  const xa = (-bond * M.m2) / tot, xb = (bond * M.m1) / tot;
  const spin = useRef<THREE.Group>(null), a = useRef<THREE.Mesh>(null), b = useRef<THREE.Mesh>(null), spring = useRef<THREE.Mesh>(null), t = useRef(0);
  const visNu = Math.min(3, Math.max(0.6, S.nu / 1200));
  const tick = (dt: number) => {
    t.current += Math.min(dt, 0.05);
    const q = 0.14 * Math.sin(t.current * visNu * Math.PI * 2);
    if (a.current) a.current.position.x = xa - q * (M.m2 / tot);
    if (b.current) b.current.position.x = xb + q * (M.m1 / tot);
    if (spring.current) { spring.current.position.x = ((xa + xb) / 2) + (q * (M.m1 - M.m2)) / (2 * tot); spring.current.scale.y = bond + 2 * q; }
    if (spin.current) spin.current.rotation.z += Math.min(dt, 0.05) * Math.min(3, Math.max(0.4, S.B / 6));
  };
  return (
    <LabFrame
      label="A diatomic molecule of two coloured atoms joined by a spring, vibrating and rotating about its centre of mass, above a comb of infrared absorption lines"
      camera={[0, 0.4, 8]}
      onReset={reset}
      scene={() => (<group>
        <Tick fn={tick} />
        <group position={[0, 1.4, 0]}>
          <group ref={spin}>
            <mesh ref={a} position={[xa, 0, 0]}><sphereGeometry args={[atomR(M.m1), 20, 20]} /><meshStandardMaterial color="#2ba6f5" roughness={0.4} /></mesh>
            <mesh ref={b} position={[xb, 0, 0]}><sphereGeometry args={[atomR(M.m2), 20, 20]} /><meshStandardMaterial color="#ff5a5f" roughness={0.4} /></mesh>
            <mesh ref={spring} position={[(xa + xb) / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]} scale={[1, bond, 1]}><cylinderGeometry args={[0.05, 0.05, 1, 10]} /><meshStandardMaterial color="#44c95a" /></mesh>
          </group>
        </group>
        <group position={[0, -2.2, 0]}>
          <mesh position={[0, -0.03, 0]}><boxGeometry args={[W * 2 + 0.3, 0.05, 0.3]} /><meshStandardMaterial color="#9db0ba" /></mesh>
          <mesh position={[0, 0.85, 0]}><boxGeometry args={[0.03, 1.7, 0.05]} /><meshBasicMaterial color="#a970ff" /></mesh>
          <Spectrum set={ls} />
        </group>
      </group>)}
      readouts={[
        ["Reduced mass μ", `${S.mu.toFixed(3)} amu`], ["Vibration ν̃ = √(k/μ)/2πc", `${S.nu.toFixed(0)} cm⁻¹`],
        ["Rotational constant B", `${S.B.toFixed(2)} cm⁻¹`], ["Line spacing 2B", `${S.spacing.toFixed(2)} cm⁻¹`],
        ["Zero-point energy", `${S.zpeKJ.toFixed(2)} kJ/mol`], ["IR active?", active ? "Yes (dipole changes)" : "No (no dipole)"],
      ]}
      controls={<>
        <Slider label="Force constant k" value={k} min={100} max={3000} step={10} digits={0} unit=" N/m" onChange={(x) => set("k", x)} />
        <Slider label="Bond length r" value={r} min={60} max={200} step={0.5} digits={1} unit=" pm" onChange={(x) => set("r", x)} />
        <Pick<SpecMol> label="Molecule" value={mol} options={(Object.keys(SPEC_MOLS) as SpecMol[]).map((id) => ({ id, label: SPEC_MOLS[id].label }))} onChange={(x) => set("mol", x)} />
      </>}
      note={<p>The bond acts as a spring: ν̃ = (1/2πc)·√(k/μ) with μ = m₁m₂/(m₁+m₂), so stiffer bonds and lighter atoms vibrate faster (the picture slows the real ~10¹⁴ Hz down). Rotation follows the rigid rotor with B = h/(8π²cI), I = μr²; rovibrational lines are spaced by 2B, the P branch (ΔJ = −1) to the left of the gap at the band origin and the R branch (ΔJ = +1) to the right, and their heights follow the Boltzmann population (2J+1)e^(−hcBJ(J+1)/kT) at 298 K. Infrared absorption needs a changing dipole moment, so homonuclear H₂ and N₂ show no lines. The line axis spans ±150 cm⁻¹ around the band origin. Harmonic oscillator and rigid rotor only: anharmonicity and centrifugal stretching are ignored.</p>}
    />
  );
}
