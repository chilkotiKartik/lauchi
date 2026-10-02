"use client";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { cooling, timeTo } from "../sim/mathii";
import { Tick } from "../Stage";
import { LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { MATHII_SPECS } from "../meta/mathii.specs";
import { Graph, sample } from "../kit2";
import { C, fmt, hsl } from "./mathii-kit";

const NS = 36, _o = new THREE.Object3D();
/** Steam puffs rise from the cup; `power` (0..1) sets how many are visible and how big. Module-level so the per-frame mutation stays outside render. */
function paintSteam(m: THREE.InstancedMesh | null, t: number, power: number) {
  if (!m) return;
  for (let i = 0; i < NS; i++) {
    const ph = (t * 0.35 + i / NS) % 1, k = i / NS, on = k < power;
    _o.position.set(-3.2 + 0.28 * Math.sin(i * 2.4 + t * 1.3) * (0.4 + ph), 0.95 + ph * 1.9, 0.28 * Math.cos(i * 1.7 + t));
    _o.scale.setScalar(on ? 0.05 + 0.2 * ph * power : 0.0001);
    _o.updateMatrix();
    m.setMatrixAt(i, _o.matrix);
  }
  m.instanceMatrix.needsUpdate = true;
}

export default function CoolingLab() {
  const [P, set, reset] = useLabParams(MATHII_SPECS.cooling);
  const { t, T0, Ts, k, Tt } = P;
  const o = cooling(T0, Ts, k, t);
  const tTarget = timeTo(T0, Ts, k, Tt);
  const span = Math.max(1, Math.abs(T0 - Ts)), frac = Math.min(1, Math.max(0, (o.T - Math.min(T0, Ts)) / span)), hot = T0 >= Ts ? frac : 1 - frac;
  const col = hsl(0.62 - 0.62 * hot, 0.85, 0.5), liquid = `#${new THREE.Color(col[0], col[1], col[2]).getHexString()}`;
  const steam = useRef<THREE.InstancedMesh>(null), tt = useRef(0), pw = Math.min(1, Math.max(0, (o.T - 35) / 65));
  const powRef = useRef(pw);
  useLayoutEffect(() => { powRef.current = pw; paintSteam(steam.current, tt.current, pw); }, [pw]);
  const tick = (dt: number) => { tt.current += Math.min(dt, 0.05); paintSteam(steam.current, tt.current, powRef.current); };
  const curve = useMemo(() => sample((x) => cooling(T0, Ts, k, x).T, 0, 60, 90), [T0, Ts, k]);
  const lo = Math.min(T0, Ts, Tt) - 5, hi = Math.max(T0, Ts, Tt) + 5;
  const colH = Math.max(0.05, Math.min(1, (o.T + 10) / 170)) * 2.2;
  return (
    <LabFrame
      label="A steaming cup whose liquid changes colour as it cools, a thermometer column that falls, and an exponential cooling curve with a marker at the chosen time"
      camera={[-0.4, 1.6, 8]}
      onReset={reset}
      scene={() => (<group>
        <Tick fn={tick} />
        <group position={[-3.2, 0, 0]}>
          <mesh position={[0, 0.45, 0]}><cylinderGeometry args={[0.8, 0.65, 1.1, 28, 1, true]} /><meshStandardMaterial color="#e8f1f5" side={THREE.DoubleSide} transparent opacity={0.55} /></mesh>
          <mesh position={[0, 0.0, 0]}><cylinderGeometry args={[0.65, 0.65, 0.06, 28]} /><meshStandardMaterial color="#9db0ba" /></mesh>
          <mesh position={[0, 0.42, 0]}><cylinderGeometry args={[0.76, 0.64, 0.9, 28]} /><meshStandardMaterial color={liquid} emissive={liquid} emissiveIntensity={0.25} /></mesh>
          <mesh position={[0.88, 0.45, 0]} rotation={[0, 0, 0]}><torusGeometry args={[0.28, 0.06, 10, 22]} /><meshStandardMaterial color="#e8f1f5" /></mesh>
          <mesh position={[0, -0.06, 0]}><cylinderGeometry args={[1.4, 1.4, 0.06, 32]} /><meshStandardMaterial color="#33454e" /></mesh>
        </group>
        <instancedMesh ref={steam} args={[undefined, undefined, NS]}><sphereGeometry args={[1, 10, 8]} /><meshStandardMaterial color="#dfeef5" transparent opacity={0.45} depthWrite={false} /></instancedMesh>
        <group position={[-1.5, 0, 0]}>
          <mesh position={[0, 1.2, 0]}><cylinderGeometry args={[0.1, 0.1, 2.4, 14]} /><meshStandardMaterial color="#e8f1f5" transparent opacity={0.4} /></mesh>
          <mesh position={[0, colH / 2 - 0.0, 0]}><cylinderGeometry args={[0.055, 0.055, colH, 12]} /><meshStandardMaterial color={C.red} emissive={C.red} emissiveIntensity={0.6} /></mesh>
          <mesh position={[0, -0.02, 0]}><sphereGeometry args={[0.2, 16, 14]} /><meshStandardMaterial color={C.red} emissive={C.red} emissiveIntensity={0.6} /></mesh>
        </group>
        <Graph x0={0.2} y0={0} w={4.6} h={2.4} xr={[0, 60]} yr={[lo, hi]} marker={[t, o.T]} markerColor={C.gold} grid={4}
          curves={[
            { pts: curve, color: C.orange, w: 3 },
            { pts: [[0, Ts], [60, Ts]], color: C.blue, w: 1.6, dashed: true },
            { pts: [[0, Tt], [60, Tt]], color: C.green, w: 1.6, dashed: true },
          ]}
          vlines={[{ x: t, color: C.gold }]} />
      </group>)}
      readouts={[
        ["Temperature T(t)", `${fmt(o.T, 2)} °C`],
        ["Cooling rate dT/dt", `${fmt(o.rate, 3)} °C/min`],
        ["Time to reach the target", Number.isNaN(tTarget) ? "never (target not between T₀ and Ts)" : tTarget < 0 ? "before t = 0" : `${fmt(tTarget, 2)} min`],
        ["Half-excess time ln2 / k", `${fmt(o.half, 2)} min`],
        ["Time constant τ = 1/k", `${fmt(o.tau, 2)} min`],
        ["Excess over surroundings", `${fmt(o.T - Ts, 2)} °C`],
      ]}
      controls={<>
        <Slider label="Time t" value={t} min={0} max={60} step={0.5} digits={1} unit=" min" onChange={(v) => set("t", v)} />
        <Slider label="Initial temperature T₀" value={T0} min={20} max={150} step={1} digits={0} unit=" °C" onChange={(v) => set("T0", v)} />
        <Slider label="Surroundings Ts" value={Ts} min={-10} max={40} step={1} digits={0} unit=" °C" onChange={(v) => set("Ts", v)} />
        <Slider label="Cooling constant k" value={k} min={0.005} max={0.4} step={0.001} digits={3} unit=" /min" onChange={(v) => set("k", v)} />
        <Slider label="Target temperature" value={Tt} min={0} max={120} step={1} digits={0} unit=" °C" onChange={(v) => set("Tt", v)} />
      </>}
      note={<p><b>Newton&apos;s law of cooling</b>: the rate of change of temperature is proportional to the excess over the surroundings, dT/dt = −k(T − Ts). It is a variable-separable (and linear) first-order ODE; separating gives ln(T − Ts) = −kt + const, so <b>T = Ts + (T₀ − Ts)e<sup>−kt</sup></b>. The excess falls by half every ln 2/k minutes. Exam style: a body at 100 °C cools to 80 °C in 10 min in a 30 °C room, so k = ln(70/50)/10 ≈ 0.034; what is T after 20 min? Set Ts = 0 and the same equation is radioactive decay or population decay; a negative k·t gives growth. The cup steams while it is hot, the liquid colour tracks T, and the dashed lines are Ts (blue) and your target (green).</p>}
    />
  );
}
