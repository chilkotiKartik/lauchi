"use client";
import { Line } from "@react-three/drei";
import { useMemo, useRef } from "react";
import type * as THREE from "three";
import { diesel } from "../sim/mech";
import { Tick } from "../Stage";
import { LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { MECH_SPECS } from "../meta/mech.specs";

const GW = 3.0, GH = 3.0;

export default function DieselLab() {
  const [P, set, reset] = useLabParams(MECH_SPECS.diesel);
  const { r, rho, g } = P;
  const D = useMemo(() => diesel(r, rho, g), [r, rho, g]);
  const pmax = Math.max(D.p3o, D.p2, 1) * 1.05;
  const px = (v: number) => ((v - 1) / (r - 1)) * GW, py = (p: number) => (p / pmax) * GH;
  const dpts = useMemo(() => D.path.map(([v, p]) => [px(v), py(p), 0] as [number, number, number]), [D, r, pmax]); // eslint-disable-line react-hooks/exhaustive-deps
  const opts = useMemo(() => D.ottoPath.map(([v, p]) => [px(v), py(p), -0.02] as [number, number, number]), [D, r, pmax]); // eslint-disable-line react-hooks/exhaustive-deps
  const dot = useRef<THREE.Mesh>(null), piston = useRef<THREE.Mesh>(null), glow = useRef<THREE.Mesh>(null), t = useRef(0);
  const tick = (dt: number) => {
    t.current += Math.min(dt, 0.05) * 0.18;
    const i = Math.floor((t.current % 1) * (D.path.length - 1)), [v, p] = D.path[i];
    dot.current?.position.set(px(v), py(p), 0.05);
    const y = 0.2 + ((v - 1) / (r - 1)) * 2.0;
    piston.current?.position.set(0, y, 0);
    if (glow.current) { glow.current.scale.set(1, Math.max(0.05, y - 0.1), 1); glow.current.position.set(0, (y + 0.1) / 2, 0); }
  };
  const pct = (x: number) => `${(x * 100).toFixed(1)} %`;
  return (
    <LabFrame
      label="Left, a piston in a cylinder rising and falling; right, the pressure–volume loop of the air-standard Diesel cycle in gold with the Otto cycle dashed for comparison and a red dot travelling around the loop"
      camera={[0, 0.2, 9.4]}
      onReset={reset}
      scene={() => (<group>
        <Tick fn={tick} />
        <group position={[-3.6, -1.6, 0]}>
          <mesh position={[0, 1.2, 0]}><cylinderGeometry args={[0.7, 0.7, 2.6, 24, 1, true]} /><meshStandardMaterial color="#b6c6cf" transparent opacity={0.28} side={2} /></mesh>
          <mesh ref={glow} position={[0, 1, 0]}><cylinderGeometry args={[0.66, 0.66, 1, 24]} /><meshStandardMaterial color="#ff9a1f" transparent opacity={0.4} emissive="#ff5a5f" emissiveIntensity={0.25} /></mesh>
          <mesh ref={piston} position={[0, 1, 0]}><cylinderGeometry args={[0.68, 0.68, 0.2, 24]} /><meshStandardMaterial color="#7c8d97" metalness={0.6} roughness={0.3} /></mesh>
          <mesh position={[0, 2.6, 0]}><cylinderGeometry args={[0.72, 0.72, 0.16, 24]} /><meshStandardMaterial color="#5b6d77" /></mesh>
        </group>
        <group position={[-0.6, -1.5, 0]}>
          <Line points={[[0, 0, 0], [GW + 0.3, 0, 0]]} color="#9db0ba" lineWidth={1.5} />
          <Line points={[[0, 0, 0], [0, GH + 0.2, 0]]} color="#9db0ba" lineWidth={1.5} />
          <Line points={opts} color="#5b6d77" lineWidth={1.6} dashed dashSize={0.1} gapSize={0.07} />
          <Line points={dpts} color="#ffc83d" lineWidth={3.2} />
          {[0, 1, 2, 3].map((k) => { const s = [D.path[0], D.path[40], D.path[81], D.path[122]][k]; return (<mesh key={k} position={[px(s[0]), py(s[1]), 0.03]}><sphereGeometry args={[0.07, 10, 10]} /><meshBasicMaterial color={["#44c95a", "#2ba6f5", "#ff5a5f", "#a970ff"][k]} /></mesh>); })}
          <mesh ref={dot}><sphereGeometry args={[0.13, 14, 14]} /><meshStandardMaterial color="#ff5a5f" emissive="#ff5a5f" emissiveIntensity={0.5} /></mesh>
        </group>
      </group>)}
      readouts={[
        ["Diesel efficiency", pct(D.eff)], ["Otto efficiency (same r)", pct(D.otto)], ["Mean effective pressure", `${D.mep.toFixed(2)} p₁`],
        ["Otto m.e.p. (same heat in)", `${D.ottoMep.toFixed(2)} p₁`], ["Net work per cycle", `${D.work.toFixed(2)} p₁V₁`], ["Peak temperature T₃/T₁", D.T3.toFixed(2)],
      ]}
      controls={<>
        <Slider label="Compression ratio r" value={r} min={6} max={25} step={0.5} digits={1} onChange={(x) => set("r", x)} />
        <Slider label="Cut-off ratio ρ = V₃/V₂" value={rho} min={1.2} max={4} step={0.05} digits={2} onChange={(x) => set("rho", x)} />
        <Slider label="Heat-capacity ratio γ" value={g} min={1.3} max={1.67} step={0.01} digits={2} onChange={(x) => set("g", x)} />
      </>}
      note={<p>The gold loop is the ideal air-standard Diesel cycle: 1→2 (green to blue) isentropic compression of air until it is hot enough to ignite fuel by compression alone, 2→3 fuel burns at constant pressure while the piston moves out (the cut-off ratio ρ = V₃/V₂), 3→4 (red to purple) isentropic expansion, and 4→1 heat rejection at constant volume. Its efficiency is η = 1 − r^(1−γ)(ρ^γ − 1)/(γ(ρ − 1)); the mean effective pressure is net work over the swept volume. The dashed grey loop is an Otto cycle with the same r and the same heat input (heat added at constant volume). At the same compression ratio Otto is more efficient, but a diesel can use a much higher r because it compresses only air, which is why real diesel engines are more efficient. Pressures are in units of p₁ and volumes in units of the clearance volume; ideal gas, constant specific heats.</p>}
    />
  );
}
