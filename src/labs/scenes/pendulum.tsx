"use client";
import { Line } from "@react-three/drei";
import { useMemo, useRef } from "react";
import type * as THREE from "three";
import { pendulum } from "../math";
import { Tick } from "../Stage";
import { LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { CORE_SPECS } from "../meta/core.specs";

const SECONDS = 20;
export default function PendulumLab() {
  const [P, set, reset] = useLabParams(CORE_SPECS.pendulum);
  const { L, g, th0, damp } = P;
  const setL = (x: (typeof P)["L"]) => set("L", x), setG = (x: (typeof P)["g"]) => set("g", x), setTh = (x: (typeof P)["th0"]) => set("th0", x), setD = (x: (typeof P)["damp"]) => set("damp", x);
  const sim = useMemo(() => pendulum(L, g, th0, damp, SECONDS, 0.005), [L, g, th0, damp]);
  const Lv = L * 1.4;
  const rod = useRef<THREE.Group>(null), t = useRef(0), mark = useRef<THREE.Mesh>(null);
  const step = Math.round(0.05 / sim.dt);
  const graph = useMemo(() => { const pts: [number, number, number][] = []; for (let i = 0; i < sim.theta.length; i += step) pts.push([3 + (i * sim.dt) / SECONDS * 3.2, sim.theta[i] * 1.2 - 1.6, 0]); return pts; }, [sim, step]);
  const tick = (dt: number) => {
    t.current = (t.current + Math.min(dt, 0.05)) % SECONDS;
    const i = Math.min(sim.theta.length - 1, Math.floor(t.current / sim.dt)), a = sim.theta[i];
    if (rod.current) rod.current.rotation.z = a;
    mark.current?.position.set(3 + (t.current / SECONDS) * 3.2, a * 1.2 - 1.6, 0.02);
  };
  const diff = Number.isFinite(sim.period) ? ((sim.period - sim.small) / sim.small) * 100 : NaN;
  return (
    <LabFrame
      label="Damped pendulum swinging in 3D with its angle-versus-time graph"
      camera={[1.5, -0.5, 10]}
      onReset={reset}
      scene={() => (<group>
        <Tick fn={tick} />
        <mesh position={[-2.2, 2.6, 0]}><boxGeometry args={[1.6, 0.16, 0.6]} /><meshStandardMaterial color="#5b6d77" /></mesh>
        <group position={[-2.2, 2.6, 0]}>
          <group ref={rod}>
            <mesh position={[0, -Lv / 2, 0]}><cylinderGeometry args={[0.025, 0.025, Lv, 8]} /><meshStandardMaterial color="#9db0ba" /></mesh>
            <mesh position={[0, -Lv, 0]}><sphereGeometry args={[0.28, 32, 24]} /><meshStandardMaterial color="#ff9a1f" metalness={0.4} roughness={0.35} /></mesh>
          </group>
        </group>
        <Line points={[[3, -1.6, 0], [6.2, -1.6, 0]]} color="#33454e" lineWidth={1} />
        <Line points={graph} color="#44c95a" lineWidth={2.5} />
        <mesh ref={mark}><sphereGeometry args={[0.09, 12, 12]} /><meshBasicMaterial color="#ffc83d" /></mesh>
      </group>)}
      readouts={[["Measured period", Number.isFinite(sim.period) ? `${sim.period.toFixed(3)} s` : "—"], ["Small-angle 2π√(L/g)", `${sim.small.toFixed(3)} s`], ["Difference", Number.isNaN(diff) ? "—" : `${diff.toFixed(1)}%`], ["Start angle θ₀", `${th0}°`]]}
      controls={<>
        <Slider label="Length L" value={L} min={0.5} max={3} step={0.05} digits={2} unit=" m" onChange={setL} />
        <Slider label="Gravity g" value={g} min={1.6} max={24.8} step={0.1} digits={1} unit=" m/s²" onChange={setG} />
        <Slider label="Start angle θ₀" value={th0} min={5} max={170} step={1} digits={0} unit="°" onChange={setTh} />
        <Slider label="Damping" value={damp} min={0} max={0.5} step={0.01} digits={2} onChange={setD} />
      </>}
      note={<p>The equation θ″ = −(g/L) sin θ − bθ′ is integrated live with a fourth-order Runge–Kutta solver, not the small-angle shortcut sin θ ≈ θ. For small swings the period is T = 2π√(L/g), independent of amplitude and mass. Raise the start angle and the measured period grows longer than the formula says — at 170° it is several times longer. Turn damping up and the swings die away exponentially. Try 1.6 m/s² (the Moon) and 24.8 (Jupiter) to see g matter.</p>}
    />
  );
}
