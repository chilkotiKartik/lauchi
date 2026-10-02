"use client";
import { Line } from "@react-three/drei";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { expGrowth, fmtNum, hash01, logisticGrowth, population } from "../sim/life";
import { Tick, useQuality } from "../Stage";
import { LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { LIFE_SPECS } from "../meta/life.specs";

const TMAX = 300, GW = 4.2, GH = 2.8, CAP = 160, dummy = new THREE.Object3D();

/** Swarm of individuals inside a cube: count follows the logistic population; wobble per frame, no allocation. */
function paintSwarm(m: THREE.InstancedMesh, count: number, t: number) {
  for (let i = 0; i < CAP; i++) {
    const x = (hash01(i, 1) - 0.5) * 1.5 + 0.12 * Math.sin(t * 1.3 + i), y = (hash01(i, 2) - 0.5) * 1.5 + 0.12 * Math.sin(t * 1.7 + i * 2), z = (hash01(i, 3) - 0.5) * 1.5 + 0.12 * Math.sin(t * 1.1 + i * 3);
    dummy.position.set(x, y, z); dummy.scale.setScalar(i < count ? 1 : 0.001); dummy.updateMatrix(); m.setMatrixAt(i, dummy.matrix);
  }
  m.instanceMatrix.needsUpdate = true;
}
function Swarm({ count }: { count: number }) {
  const ref = useRef<THREE.InstancedMesh>(null), t = useRef(0);
  useLayoutEffect(() => { if (ref.current) paintSwarm(ref.current, count, 0); }, [count]);
  const tick = (dt: number) => { t.current += Math.min(dt, 0.05); if (ref.current) paintSwarm(ref.current, count, t.current); };
  return (<>
    <Tick fn={tick} />
    <instancedMesh ref={ref} args={[undefined, undefined, CAP]}><sphereGeometry args={[0.07, 8, 8]} /><meshStandardMaterial color="#44c95a" emissive="#44c95a" emissiveIntensity={0.3} /></instancedMesh>
  </>);
}

export default function PopulationLab() {
  const quality = useQuality();
  const [P, set, reset] = useLabParams(LIFE_SPECS.population);
  const { t, r, N0, K } = P;
  const R = population(r, N0, K, t);
  const top = K * 1.25;
  const xs = (tt: number) => (tt / TMAX) * GW, ys = (v: number) => Math.min(GH, (v / top) * GH);
  const curves = useMemo(() => {
    const e: [number, number, number][] = [], l: [number, number, number][] = [];
    for (let i = 0; i <= 150; i++) { const tt = (TMAX * i) / 150; e.push([xs(tt), ys(expGrowth(N0, r / 100, tt)), 0]); l.push([xs(tt), ys(logisticGrowth(N0, K, r / 100, tt)), 0.02]); }
    return { e, l };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [r, N0, K]);
  const count = Math.round(Math.min(1, R.Nlog / K) * (quality === "low" ? CAP / 2 : CAP));
  return (
    <LabFrame
      label="A graph in 3D of population against time with a red exponential curve shooting up and a green S-shaped logistic curve levelling at the gold carrying-capacity line, and a cube of green dots whose number follows the logistic population"
      camera={[0.6, 0.6, 8.6]}
      onReset={reset}
      scene={() => (<group>
        <group position={[-4.3, -1.5, 0]}>
          <Line points={[[0, 0, 0], [GW + 0.2, 0, 0]]} color="#9db0ba" lineWidth={1.5} />
          <Line points={[[0, 0, 0], [0, GH + 0.2, 0]]} color="#9db0ba" lineWidth={1.5} />
          <Line points={[[0, ys(K), 0], [GW, ys(K), 0]]} color="#ffc83d" lineWidth={1.6} dashed dashSize={0.12} gapSize={0.08} />
          <Line points={curves.e} color="#ff5a5f" lineWidth={2.8} />
          <Line points={curves.l} color="#44c95a" lineWidth={3.2} />
          <Line points={[[xs(t), 0, 0.03], [xs(t), GH, 0.03]]} color="#2ba6f5" lineWidth={1.4} />
          <mesh position={[xs(t), ys(R.Nexp), 0.05]}><sphereGeometry args={[0.1, 12, 12]} /><meshBasicMaterial color="#ff5a5f" /></mesh>
          <mesh position={[xs(t), ys(R.Nlog), 0.05]}><sphereGeometry args={[0.11, 12, 12]} /><meshBasicMaterial color="#44c95a" /></mesh>
        </group>
        <group position={[3.6, 0.2, 0]}>
          <Swarm count={count} />
          <mesh><boxGeometry args={[1.9, 1.9, 1.9]} /><meshBasicMaterial color="#5b6d77" wireframe /></mesh>
        </group>
      </group>)}
      readouts={[
        ["Exponential N = N₀eʳᵗ", fmtNum(R.Nexp)], ["Logistic N", fmtNum(R.Nlog)], ["Doubling time ln 2 / r", `${R.doubling.toFixed(1)} years (rule of 70: ${R.rule70.toFixed(1)})`],
        ["Growth rate dN/dt (logistic)", `${fmtNum(R.dNdtLog)} per year`], ["Logistic reaches K/2 at", Number.isFinite(R.tHalfK) ? `${R.tHalfK.toFixed(0)} years` : "already past K/2"], ["Carrying capacity K", fmtNum(K)],
      ]}
      controls={<>
        <Slider label="Time t" value={t} min={0} max={300} step={1} digits={0} unit=" years" onChange={(x) => set("t", x)} />
        <Slider label="Growth rate r" value={r} min={0.1} max={10} step={0.1} digits={1} unit=" %/yr" onChange={(x) => set("r", x)} />
        <Slider label="Starting population N₀" value={N0} min={1} max={2000} step={1} digits={0} onChange={(x) => set("N0", x)} />
        <Slider label="Carrying capacity K" value={K} min={500} max={100000} step={100} digits={0} onChange={(x) => set("K", x)} />
      </>}
      note={<p>Red: unlimited exponential growth, dN/dt = rN, so N = N₀e^(rt) and the population doubles every ln 2/r years (the &quot;rule of 70&quot; is 70 divided by r in percent). Green: logistic growth, dN/dt = rN(1 − N/K), where crowding, food and space limit growth as N nears the carrying capacity K (gold dashed line); the curve is S-shaped and growth is fastest at K/2. The cube shows the logistic population as green dots, filling up as it approaches K. Real populations also overshoot, crash or oscillate; this is the standard textbook model. The red curve is clipped at the top of the graph.</p>}
    />
  );
}
