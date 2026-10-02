"use client";
import { Line } from "@react-three/drei";
import { useMemo, useRef } from "react";
import type * as THREE from "three";
import { squareWave } from "../math";
import { Tick } from "../Stage";
import { LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { CORE_SPECS } from "../meta/core.specs";

const X = 2 * Math.PI, SC = 5.2 / X;
export default function FourierLab() {
  const [P, set, reset] = useLabParams(CORE_SPECS.fourier);
  const { n } = P;
  const setN = (x: (typeof P)["n"]) => set("n", x);
  const sum = useMemo(() => Array.from({ length: 400 }, (_, i) => { const x = (i / 399) * X; return [x * SC - X * SC / 2, squareWave(x, n) * 1.2, 0] as [number, number, number]; }), [n]);
  const parts = useMemo(() => Array.from({ length: Math.min(n, 8) }, (_, k) => { const m = 2 * k + 1; return Array.from({ length: 300 }, (_, i) => { const x = (i / 299) * X; return [x * SC - X * SC / 2, ((4 / Math.PI) * Math.sin(m * x)) / m * 1.2, -(k + 1) * 0.5] as [number, number, number]; }); }), [n]);
  const target: [number, number, number][] = [[-X * SC / 2, 1.2, 0], [0, 1.2, 0], [0, -1.2, 0], [X * SC / 2, -1.2, 0]];
  const scan = useRef<THREE.Mesh>(null), t = useRef(0);
  const tick = (dt: number) => { t.current = (t.current + Math.min(dt, 0.05) * 0.5) % X; scan.current?.position.set(t.current * SC - X * SC / 2, squareWave(t.current, n) * 1.2, 0); };
  let peak = 0; for (let i = 1; i < 2000; i++) peak = Math.max(peak, squareWave((i / 2000) * Math.PI, n));
  return (
    <LabFrame
      label="Fourier series of a square wave built from harmonics, live"
      camera={[0, 1.5, 8]}
      onReset={reset}
      scene={() => (<group><Tick fn={tick} />
        <Line points={target} color="#5b6d77" lineWidth={1.5} />
        {parts.map((p, i) => (<Line key={i} points={p} color="#2ba6f5" lineWidth={1} transparent opacity={0.7} />))}
        <Line points={sum} color="#44c95a" lineWidth={3.5} />
        <mesh ref={scan}><sphereGeometry args={[0.09, 16, 16]} /><meshStandardMaterial color="#ffc83d" emissive="#ffc83d" emissiveIntensity={0.6} /></mesh>
      </group>)}
      readouts={[["Odd harmonics", String(n)], ["Highest harmonic", String(2 * n - 1)], ["Peak value", peak.toFixed(3)], ["Overshoot", `${((peak - 1) * 100).toFixed(1)}%`]]}
      controls={<Slider label="Number of harmonics" value={n} min={1} max={40} step={1} digits={0} onChange={setN} />}
      note={<p>A square wave equals (4/π)[sin x + sin 3x / 3 + sin 5x / 5 + …]. Blue curves (up to the first eight) are the individual harmonics stacked back in depth; the green curve is their sum, which hugs the grey target more tightly as you add terms. Near each jump the sum overshoots by about 9% no matter how many terms you add — the Gibbs phenomenon; only the width of the overshoot shrinks.</p>}
    />
  );
}
