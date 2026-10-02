"use client";
import { Line } from "@react-three/drei";
import { useMemo, useRef } from "react";
import type * as THREE from "three";
import { projectile } from "../math";
import { Tick } from "../Stage";
import { LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { CORE_SPECS } from "../meta/core.specs";

export default function ProjectileLab() {
  const [P, set, reset] = useLabParams(CORE_SPECS.projectile);
  const { v, ang, g, k } = P;
  const setV = (x: (typeof P)["v"]) => set("v", x), setAng = (x: (typeof P)["ang"]) => set("ang", x), setG = (x: (typeof P)["g"]) => set("g", x), setK = (x: (typeof P)["k"]) => set("k", x);
  const r = useMemo(() => projectile(v, ang, g, k), [v, ang, g, k]);
  const vac = useMemo(() => projectile(v, ang, g, 0), [v, ang, g]);
  const S = 6 / Math.max(vac.range, 1, r.range), toP = (p: [number, number, number]): [number, number, number] => [p[0] * S - 3, p[1] * S, 0];
  const pts = useMemo(() => r.path.map(toP), [r, S]); // eslint-disable-line react-hooks/exhaustive-deps
  const vacPts = useMemo(() => vac.path.map(toP), [vac, S]); // eslint-disable-line react-hooks/exhaustive-deps
  const ball = useRef<THREE.Mesh>(null), t = useRef(0);
  const tick = (dt: number) => {
    t.current = (t.current + Math.min(dt, 0.05)) % (r.time + 0.8);
    const tt = Math.min(t.current, r.time);
    let i = r.path.findIndex((p) => p[2] >= tt); if (i < 0) i = r.path.length - 1;
    const p = r.path[i]; ball.current?.position.set(p[0] * S - 3, p[1] * S, 0);
  };
  return (
    <LabFrame
      label="Projectile motion with optional air drag, animated live"
      camera={[0, 2, 9]}
      onReset={reset}
      scene={() => (<group>
        <Tick fn={tick} />
        <Line points={[[-3.2, 0, 0], [3.4, 0, 0]]} color="#5b6d77" lineWidth={2} />
        <Line points={vacPts} color="#5b6d77" lineWidth={2} dashed dashSize={0.12} gapSize={0.08} />
        <Line points={pts} color="#ffc83d" lineWidth={3.5} />
        <mesh ref={ball}><sphereGeometry args={[0.12, 20, 20]} /><meshStandardMaterial color="#ff5a5f" emissive="#ff5a5f" emissiveIntensity={0.4} /></mesh>
      </group>)}
      readouts={[["Range", `${r.range.toFixed(2)} m`], ["Max height", `${r.maxH.toFixed(2)} m`], ["Flight time", `${r.time.toFixed(2)} s`], ["Vacuum range v²sin2θ/g", `${((v * v * Math.sin((2 * ang * Math.PI) / 180)) / g).toFixed(2)} m`]]}
      controls={<>
        <Slider label="Launch speed" value={v} min={5} max={40} step={0.5} digits={1} unit=" m/s" onChange={setV} />
        <Slider label="Launch angle" value={ang} min={5} max={85} step={1} digits={0} unit="°" onChange={setAng} />
        <Slider label="Gravity g" value={g} min={1.6} max={25} step={0.01} unit=" m/s²" onChange={setG} />
        <Slider label="Air drag k (per second)" value={k} min={0} max={1} step={0.01} onChange={setK} />
      </>}
      note={<p>With no drag the path is a parabola: range = v² sin 2θ / g, maximum at 45°, and complementary angles (say 30° and 60°) land at the same spot. The dashed grey curve is that vacuum path; the yellow path adds linear drag (deceleration k·v), integrated numerically. With drag the path is no longer symmetric — it falls more steeply than it rises and the best angle drops below 45°. Try g = 1.62 for the Moon or 3.71 for Mars.</p>}
    />
  );
}
