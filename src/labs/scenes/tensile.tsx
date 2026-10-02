"use client";
import { Line } from "@react-three/drei";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { MATERIALS, sci, tensile, tensileCurve, type Material } from "../sim/mech";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { MECH_SPECS } from "../meta/mech.specs";

const SL = 44, dummy = new THREE.Object3D();
const REG_COL: Record<string, string> = { elastic: "#2ba6f5", "elastic, brittle": "#9db0ba", "yield plateau": "#ffc83d", "strain hardening": "#ff9a1f", necking: "#ff5a5f", fractured: "#ff5a5f" };

function Bar({ eps, eu, ef, color }: { eps: number; eu: number; ef: number; color: string }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = ref.current; if (!m) return;
    const L = 3.0 * (1 + Math.min(eps, ef)), c = 1 / Math.sqrt(1 + eps), broke = eps > ef + 1e-12;
    const x = eps > eu ? Math.min(1, (Math.min(eps, ef) - eu) / Math.max(ef - eu, 1e-9)) : 0;
    for (let i = 0; i < SL; i++) {
      const z = (i + 0.5) / SL - 0.5;
      let r = 0.42 * c * (1 - 0.6 * x * Math.exp(-((z / 0.09) ** 2)));
      let y = z * L;
      if (broke) { const away = Math.abs(z); y += Math.sign(z) * 0.28; r *= 1 - 0.35 * Math.exp(-away * 22); }
      dummy.position.set(0, y, 0); dummy.scale.set(Math.max(r, 0.02), (L / SL) * 1.03, Math.max(r, 0.02)); dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  }, [eps, eu, ef]);
  return <instancedMesh ref={ref} args={[undefined, undefined, SL]}><cylinderGeometry args={[1, 1, 1, 20]} /><meshStandardMaterial color={color} metalness={0.5} roughness={0.35} /></instancedMesh>;
}

export default function TensileLab() {
  const [P, set, reset] = useLabParams(MECH_SPECS.tensile);
  const { eps: pct, L0, d0, mat } = P;
  const T = tensile(mat, pct, L0, d0);
  const M = MATERIALS[mat];
  const eps = T.eps;
  const curve = useMemo(() => tensileCurve(mat).map(([e, s]) => [(e / (M.ef * 1.05)) * 3, (s / (M.su * 1.12)) * 2.5, 0] as [number, number, number]), [mat, M.ef, M.su]);
  const dot: [number, number, number] = [(Math.min(eps, M.ef) / (M.ef * 1.05)) * 3, (T.sigma / (M.su * 1.12)) * 2.5, 0.05];
  const L = 3.0 * (1 + Math.min(eps, M.ef));
  const col = REG_COL[T.region] ?? "#2ba6f5";
  return (
    <LabFrame
      label="Left, a vertical metal bar between two grips that stretches, thins and then necks and breaks; right, the stress–strain curve of the material with a red dot at the current strain"
      camera={[0, 0.2, 9.4]}
      animated={false}
      onReset={reset}
      scene={() => (<group>
        <group position={[-3, 0, 0]}>
          <Bar eps={eps} eu={M.eu} ef={M.ef} color={col} />
          <mesh position={[0, L / 2 + (T.fractured ? 0.28 : 0) + 0.25, 0]}><boxGeometry args={[1.3, 0.4, 1.0]} /><meshStandardMaterial color="#5b6d77" metalness={0.4} /></mesh>
          <mesh position={[0, -L / 2 - (T.fractured ? 0.28 : 0) - 0.25, 0]}><boxGeometry args={[1.3, 0.4, 1.0]} /><meshStandardMaterial color="#5b6d77" metalness={0.4} /></mesh>
        </group>
        <group position={[0.4, -1.2, 0]}>
          <Line points={[[0, 0, 0], [3.3, 0, 0]]} color="#9db0ba" lineWidth={1.5} />
          <Line points={[[0, 0, 0], [0, 2.8, 0]]} color="#9db0ba" lineWidth={1.5} />
          <Line points={curve} color="#44c95a" lineWidth={3} />
          <mesh position={dot}><sphereGeometry args={[0.13, 14, 14]} /><meshStandardMaterial color="#ff5a5f" emissive="#ff5a5f" emissiveIntensity={0.5} /></mesh>
          <Line points={[[dot[0], 0, 0.02], [dot[0], dot[1], 0.02]]} color="#ffc83d" lineWidth={1.2} />
        </group>
      </group>)}
      readouts={[
        ["Stress σ = F/A₀", `${T.sigma.toFixed(1)} MPa`], ["Force F", `${(T.F / 1000).toFixed(2)} kN`], ["Extension ΔL", `${T.dL.toFixed(2)} mm`],
        ["Region", T.region], ["Young's modulus E", `${(M.E / 1000).toFixed(0)} GPa`], [M.brittle ? "Ultimate stress" : "Yield / ultimate", M.brittle ? `${M.su} MPa` : `${M.sy} / ${M.su} MPa`],
      ]}
      controls={<>
        <Slider label="Strain ε" value={pct} min={0} max={50} step={0.05} digits={2} unit=" %" onChange={(x) => set("eps", x)} />
        <Slider label="Gauge length L₀" value={L0} min={20} max={300} step={1} digits={0} unit=" mm" onChange={(x) => set("L0", x)} />
        <Slider label="Bar diameter d₀" value={d0} min={5} max={25} step={0.5} digits={1} unit=" mm" onChange={(x) => set("d0", x)} />
        <Pick<Material> label="Material" value={mat} options={(Object.keys(MATERIALS) as Material[]).map((id) => ({ id, label: MATERIALS[id].name }))} onChange={(x) => set("mat", x)} />
      </>}
      note={<p>Pull the bar and the stress σ = F/A₀ rises with strain ε = ΔL/L₀. In the elastic part Hooke&apos;s law σ = Eε holds and the bar returns to length when released; at the yield stress it starts to deform permanently (mild steel shows a flat yield plateau), strain hardening then raises the stress to the ultimate stress σ_u, after which the bar necks and the engineering stress falls until fracture. The blue, gold, orange and red bar colours mark elastic, yield, hardening and necking. Cast iron is brittle: it stays elastic until it snaps at 0.5 % strain, with no necking. Typical textbook values (E = {sci(M.E)} MPa for {M.name.toLowerCase()}); engineering stress uses the original area A₀ = {sci(T.A0)} mm². The bar&apos;s neck is drawn schematically.</p>}
    />
  );
}
