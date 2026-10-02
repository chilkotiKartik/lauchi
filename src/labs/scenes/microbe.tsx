"use client";
import { Line } from "@react-three/drei";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { fmtNum, hash01, microbe, type MicrobePhase } from "../sim/life";
import { Tick } from "../Stage";
import { LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { LIFE_SPECS } from "../meta/life.specs";

const TMAX = 60, GW = 3.6, GH = 2.6, CAP = 140, dummy = new THREE.Object3D();
const PH: Record<MicrobePhase, string> = { Lag: "#9db0ba", "Exponential (log)": "#44c95a", Stationary: "#ffc83d", Death: "#ff5a5f" };

function Colonies({ count, color, wob }: { count: number; color: string; wob: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null), t = useRef(0);
  const paint = (m: THREE.InstancedMesh, tt: number) => {
    for (let i = 0; i < CAP; i++) {
      const a = hash01(i, 1) * 6.2832, d = Math.sqrt(hash01(i, 2)) * 1.15, s = 0.6 + hash01(i, 3) * 0.8;
      dummy.position.set(Math.cos(a) * d, 0.09, Math.sin(a) * d); dummy.scale.setScalar(i < count ? s * (wob ? 1 + 0.08 * Math.sin(tt * 3 + i) : 1) : 0.001); dummy.updateMatrix(); m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  };
  useLayoutEffect(() => { if (ref.current) paint(ref.current, 0); });
  const tick = (dt: number) => { t.current += Math.min(dt, 0.05); if (ref.current) paint(ref.current, t.current); };
  return (<>
    <Tick fn={tick} />
    <instancedMesh ref={ref} args={[undefined, undefined, CAP]}><sphereGeometry args={[0.07, 8, 8]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} /></instancedMesh>
  </>);
}

export default function MicrobeLab() {
  const [P, set, reset] = useLabParams(LIFE_SPECS.microbe);
  const { t, mu, lag, log0, logK, kd, stat } = P;
  const p = { mu, lag, log0, logK, kd, stat };
  const M = microbe(p, t);
  const segs = useMemo(() => {
    const out: { c: string; pts: [number, number, number][] }[] = [];
    let cur: { c: string; pts: [number, number, number][] } | null = null;
    for (let i = 0; i <= 240; i++) {
      const tt = (TMAX * i) / 240, s = microbe(p, tt), c = PH[s.phase], pt: [number, number, number] = [(tt / TMAX) * GW, Math.min(GH, (s.logN / 11) * GH), 0];
      if (!cur || cur.c !== c) { cur = { c, pts: cur ? [cur.pts[cur.pts.length - 1]] : [] }; out.push(cur); }
      cur.pts.push(pt);
    }
    return out.filter((s2) => s2.pts.length > 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mu, lag, log0, logK, kd, stat]);
  const colonies = Math.round(Math.min(1, M.logN / logK) * CAP);
  const col = PH[M.phase];
  return (
    <LabFrame
      label="Left, a Petri dish with green dots for bacterial colonies that multiply; right, a growth curve of log cell count against time drawn in four colours for the lag, exponential, stationary and death phases with a marker at the chosen time"
      camera={[0.4, 2.2, 8.2]}
      onReset={reset}
      scene={() => (<group>
        <group position={[-3.3, -0.6, 0]} rotation={[0.55, 0, 0]}>
          <mesh position={[0, -0.05, 0]}><cylinderGeometry args={[1.35, 1.35, 0.12, 40]} /><meshStandardMaterial color="#dfeaf0" transparent opacity={0.35} /></mesh>
          <mesh position={[0, 0.02, 0]}><cylinderGeometry args={[1.28, 1.28, 0.08, 40]} /><meshStandardMaterial color="#e8c46a" roughness={0.6} /></mesh>
          <Colonies count={colonies} color={col} wob={M.phase === "Exponential (log)"} />
        </group>
        <group position={[0.4, -1.4, 0]}>
          <Line points={[[0, 0, 0], [GW + 0.2, 0, 0]]} color="#9db0ba" lineWidth={1.5} />
          <Line points={[[0, 0, 0], [0, GH + 0.2, 0]]} color="#9db0ba" lineWidth={1.5} />
          {segs.map((s, k) => (<Line key={k} points={s.pts} color={s.c} lineWidth={3.4} />))}
          <Line points={[[(t / TMAX) * GW, 0, 0.03], [(t / TMAX) * GW, GH, 0.03]]} color="#2ba6f5" lineWidth={1.3} />
          <mesh position={[(t / TMAX) * GW, Math.min(GH, (M.logN / 11) * GH), 0.06]}><sphereGeometry args={[0.13, 14, 14]} /><meshStandardMaterial color="#ffffff" emissive={col} emissiveIntensity={0.6} /></mesh>
        </group>
      </group>)}
      readouts={[
        ["Growth phase", M.phase], ["log₁₀ of cells per mL", M.logN.toFixed(2)], ["Cells per mL", fmtNum(M.N)],
        ["Generation time ln 2/μ", `${(M.genTime * 60).toFixed(0)} min`], ["Generations so far", M.generations.toFixed(1)], ["Log phase ends / death begins", `${M.t90.toFixed(1)} h / ${M.tDeath.toFixed(1)} h`],
      ]}
      controls={<>
        <Slider label="Time t" value={t} min={0} max={60} step={0.5} digits={1} unit=" h" onChange={(x) => set("t", x)} />
        <Slider label="Growth rate μ" value={mu} min={0.1} max={2} step={0.05} digits={2} unit=" /h" onChange={(x) => set("mu", x)} />
        <Slider label="Lag time" value={lag} min={0} max={10} step={0.5} digits={1} unit=" h" onChange={(x) => set("lag", x)} />
        <Slider label="Starting count, log₁₀ N₀" value={log0} min={1} max={6} step={0.1} digits={1} onChange={(x) => set("log0", x)} />
        <Slider label="Carrying capacity, log₁₀ K" value={logK} min={6} max={11} step={0.1} digits={1} onChange={(x) => set("logK", x)} />
        <Slider label="Death rate k_d" value={kd} min={0} max={1} step={0.05} digits={2} unit=" /h" onChange={(x) => set("kd", x)} />
        <Slider label="Stationary phase length" value={stat} min={0} max={24} step={0.5} digits={1} unit=" h" onChange={(x) => set("stat", x)} />
      </>}
      note={<p>Grey: the lag phase, when cells adjust to the new medium and do not divide. Green: the exponential (log) phase, where the count doubles every generation time ln 2/μ, so log N is a straight line and the dish fills with colonies. Gold: the stationary phase, when nutrients run out and waste builds up, so growth and death balance at about the carrying capacity K. Red: the death phase, where the living count falls exponentially at rate k_d. Cell counts are per mL of broth and plotted on a log₁₀ scale (the vertical axis spans 10⁰ to 10¹¹). Simplified model: the logistic growth curve stands in for real nutrient limitation, and the dish only illustrates the trend, not exact colony counts.</p>}
    />
  );
}
