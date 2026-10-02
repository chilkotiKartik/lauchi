"use client";
import { Line } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { Tick } from "../Stage";
import { LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { CORE_SPECS } from "../meta/core.specs";

export default function PolarLab() {
  const [P, set, reset] = useLabParams(CORE_SPECS.polar);
  const { a, b, k } = P;
  const setA = (x: (typeof P)["a"]) => set("a", x), setB = (x: (typeof P)["b"]) => set("b", x), setK = (x: (typeof P)["k"]) => set("k", x);
  const r = (t: number) => a + b * Math.cos(k * t);
  const T = Number.isInteger(k) ? (a === 0 && k % 2 === 1 ? Math.PI : 2 * Math.PI) : 4 * Math.PI;
  const pts = useMemo(() => Array.from({ length: 721 }, (_, i) => { const t = (i / 720) * T; return [r(t) * Math.cos(t), 0, -r(t) * Math.sin(t)] as [number, number, number]; }), [a, b, k]); // eslint-disable-line react-hooks/exhaustive-deps
  // area swept = ½∫ r² dθ over one full trace
  const area = useMemo(() => { let s = 0; const n = 20000; for (let i = 0; i < n; i++) { const t = ((i + 0.5) / n) * T; s += 0.5 * r(t) ** 2 * (T / n); } return s; }, [a, b, k, T]); // eslint-disable-line react-hooks/exhaustive-deps
  const dot = useRef<THREE.Mesh>(null), rad = useRef<THREE.Group>(null), t = useRef(0);
  const tick = (dt: number) => {
    t.current = (t.current + Math.min(dt, 0.05) * 0.8) % T;
    const rr = r(t.current), x = rr * Math.cos(t.current), z = -rr * Math.sin(t.current);
    dot.current?.position.set(x, 0.05, z);
    if (rad.current) { rad.current.rotation.y = t.current; rad.current.scale.x = Math.abs(rr) || 0.001; }
  };
  return (
    <LabFrame
      label="Polar curve r = a + b cos(kθ) traced live with its enclosed area"
      camera={[0, 7, 4]}
      onReset={reset}
      scene={() => (<group><Tick fn={tick} />
        <gridHelper args={[8, 16, "#3a4d57", "#26343c"]} />
        <Line points={pts} color="#44c95a" lineWidth={3} />
        <group ref={rad}><Line points={[[0, 0.03, 0], [Math.sign(r(t.current) || 1), 0.03, 0]]} color="#ffc83d" lineWidth={2} /></group>
        <mesh ref={dot}><sphereGeometry args={[0.1, 16, 16]} /><meshStandardMaterial color="#ff5a5f" emissive="#ff5a5f" emissiveIntensity={0.5} /></mesh>
      </group>)}
      readouts={[["Curve", `r = ${a.toFixed(1)} + ${b.toFixed(1)} cos(${k.toFixed(1)}θ)`], ["Area ½∫r²dθ (one trace)", area.toFixed(4)], ["Full trace", `θ from 0 to ${(T / Math.PI).toFixed(0)}π`]]}
      controls={<>
        <Slider label="a (offset)" value={a} min={0} max={3} step={0.1} digits={1} onChange={setA} />
        <Slider label="b (amplitude)" value={b} min={0.5} max={3} step={0.1} digits={1} onChange={setB} />
        <Slider label="k (petal frequency)" value={k} min={1} max={8} step={0.5} digits={1} onChange={setK} />
      </>}
      note={<p>A point at angle θ sits at distance r(θ) from the origin. With a = 0 you get a rose with k petals (odd k) or 2k petals (even k); with a = b and k = 1 you get a cardioid; a &gt; b gives a limaçon with no loop. The area enclosed is A = ½∫ r² dθ, computed numerically over one full trace. For a = 0, k = 3 the answer is πb²/4 per full trace of θ from 0 to π — the readout matches when b = 2 (π).</p>}
    />
  );
}
