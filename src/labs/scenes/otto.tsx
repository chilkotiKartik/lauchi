"use client";
import { Line } from "@react-three/drei";
import { useMemo, useRef } from "react";
import type * as THREE from "three";
import { otto } from "../math";
import { Tick } from "../Stage";
import { LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { CORE_SPECS } from "../meta/core.specs";

export default function OttoLab() {
  const [P, set, reset] = useLabParams(CORE_SPECS.otto);
  const { r, g, tau } = P;
  const setR = (x: (typeof P)["r"]) => set("r", x), setG = (x: (typeof P)["g"]) => set("g", x), setTau = (x: (typeof P)["tau"]) => set("tau", x);
  const o = useMemo(() => otto(r, g, tau), [r, g, tau]);
  const vmax = r, pmax = Math.max(...o.path.map((p) => p[1]));
  const X = (v: number) => ((v - 1) / (vmax - 1 || 1)) * 4.4 - 2.2, Y = (p: number) => (p / pmax) * 3 - 1.4;
  const pts = useMemo(() => o.path.map(([v, p]): [number, number, number] => [X(v), Y(p), 0]), [o]); // eslint-disable-line react-hooks/exhaustive-deps
  const ball = useRef<THREE.Mesh>(null), piston = useRef<THREE.Mesh>(null), t = useRef(0);
  const tick = (dt: number) => {
    t.current = (t.current + Math.min(dt, 0.05) * 0.18) % 1;
    const i = Math.floor(t.current * (pts.length - 1)), p = pts[i], v = o.path[i][0];
    ball.current?.position.set(p[0], p[1], 0.05);
    piston.current?.position.set(0, -1.8 + ((v - 1) / (vmax - 1 || 1)) * -0.0 + 0, 0);
    if (piston.current) piston.current.position.y = 0.6 + ((vmax - v) / (vmax - 1 || 1)) * 1.2;
  };
  const label = (n: number) => ["1", "2", "3", "4"][n];
  void label;
  return (
    <LabFrame
      label="Otto cycle P–V diagram with a moving state point and a piston"
      camera={[0, 0.5, 8]}
      onReset={reset}
      scene={() => (<group>
        <Tick fn={tick} />
        <group position={[-3.6, -1.2, 0]}>
          <mesh position={[0, 1.1, 0]}><cylinderGeometry args={[0.6, 0.6, 2.4, 24, 1, true]} /><meshStandardMaterial color="#9db0ba" transparent opacity={0.35} side={2} /></mesh>
          <mesh ref={piston}><cylinderGeometry args={[0.56, 0.56, 0.22, 24]} /><meshStandardMaterial color="#ff9a1f" /></mesh>
        </group>
        <Line points={[[-2.4, -1.4, 0], [2.6, -1.4, 0]]} color="#5b6d77" lineWidth={1.5} />
        <Line points={[[-2.4, -1.4, 0], [-2.4, 1.8, 0]]} color="#5b6d77" lineWidth={1.5} />
        <Line points={pts.slice(0, 41)} color="#2ba6f5" lineWidth={3.5} />
        <Line points={pts.slice(41, 82)} color="#ff5a5f" lineWidth={3.5} />
        <Line points={pts.slice(82, 123)} color="#a970ff" lineWidth={3.5} />
        <Line points={pts.slice(123)} color="#44c95a" lineWidth={3.5} />
        <mesh ref={ball}><sphereGeometry args={[0.1, 16, 16]} /><meshStandardMaterial color="#ffc83d" emissive="#ffc83d" emissiveIntensity={0.7} /></mesh>
      </group>)}
      readouts={[["Efficiency 1 − r^(1−γ)", `${(o.efficiency * 100).toFixed(1)}%`], ["Compression ratio r", r.toFixed(1)], ["Net work (units of nRT₁)", o.work.toFixed(2)], ["Heat in (units of nRT₁)", o.heatIn.toFixed(2)]]}
      controls={<>
        <Slider label="Compression ratio r" value={r} min={4} max={14} step={0.5} digits={1} onChange={setR} />
        <Slider label="Heat capacity ratio γ" value={g} min={1.3} max={1.67} step={0.01} onChange={setG} />
        <Slider label="Peak temperature T₃ / T₁" value={tau} min={3} max={10} step={0.5} digits={1} onChange={setTau} />
      </>}
      note={<p>Blue 1→2: adiabatic compression. Red 2→3: heat added at constant volume (the spark). Purple 3→4: adiabatic expansion, the power stroke. Green 4→1: heat rejected at constant volume. The area inside the loop is the net work. The air-standard efficiency depends only on the compression ratio and γ: η = 1 − r<sup>1−γ</sup> — raise r and the loop, and the efficiency, grow; the peak temperature changes the work but not η. Real engines are lower because of friction, heat loss and knock limits.</p>}
    />
  );
}
