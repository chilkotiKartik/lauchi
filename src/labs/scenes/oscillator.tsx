"use client";
import { Line } from "@react-three/drei";
import { useMemo, useRef } from "react";
import type * as THREE from "three";
import { charRoots, oscillate, steadyState } from "../sim/mathsb";
import { Tick } from "../Stage";
import { LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { MATHSB_SPECS } from "../meta/mathsb.specs";

const T = 20, DT = 0.02, CEIL = 2.9, SX = -3.2, GX = -1.5, GW = 5.2;
/** One unit-long coil (10 turns), stretched vertically by scaling the Line object rather than rebuilding it. */
const HELIX: [number, number, number][] = (() => {
  const pts: [number, number, number][] = [[0, 0, 0]], n = 10 * 14;
  for (let i = 1; i < n; i++) { const a = (i / 14) * 2 * Math.PI; pts.push([0.24 * Math.cos(a), -0.06 - 0.88 * (i / n), 0.24 * Math.sin(a)]); }
  pts.push([0, -1, 0]);
  return pts;
})();

const clean = (x: number) => (Math.abs(x) < 5e-10 ? 0 : x).toFixed(3);

export default function OscillatorLab() {
  const [P, set, reset] = useLabParams(MATHSB_SPECS.oscillator);
  const { m, c, k, F0, w } = P;
  const roots = charRoots(m, c, k), ss = steadyState(m, c, k, F0, w), w0 = Math.sqrt(k / m);
  const ys = useMemo(() => oscillate(m, c, k, F0, w, 1, 0, T, DT), [m, c, k, F0, w]);
  const s = useMemo(() => { let a = 1; for (const y of ys) a = Math.max(a, Math.abs(y)); return 1.5 / a; }, [ys]);
  const graph = useMemo(() => { const p: [number, number, number][] = []; for (let i = 0; i < ys.length; i += 2) p.push([GX + ((i * DT) / T) * GW, ys[i] * s, 0]); return p; }, [ys, s]);
  const force = useMemo(() => { const p: [number, number, number][] = []; for (let i = 0; i < ys.length; i += 2) p.push([GX + ((i * DT) / T) * GW, 0.9 * (F0 / 3) * Math.cos(w * i * DT), -0.05]); return p; }, [ys, F0, w]);
  const sm = 0.4 + 0.12 * m;
  const y00 = ys[0] * s, len0 = CEIL - (y00 + sm / 2);
  const mass = useRef<THREE.Group>(null), spring = useRef<THREE.Group>(null), damper = useRef<THREE.Group>(null), mark = useRef<THREE.Mesh>(null), t = useRef(0);
  const tick = (dt: number) => {
    t.current = (t.current + Math.min(dt, 0.05) * 1.5) % T;
    const i = Math.min(ys.length - 1, Math.floor(t.current / DT)), y = ys[i] * s, len = CEIL - (y + sm / 2);
    mass.current?.position.set(SX, y, 0);
    spring.current?.scale.set(1, len, 1);
    damper.current?.scale.set(1, len, 1);
    mark.current?.position.set(GX + (t.current / T) * GW, y, 0.03);
  };
  const rootText = roots.kind === "real" ? `${clean(roots.r1)}, ${clean(roots.r2)}` : roots.kind === "repeated" ? `${clean(roots.re)} (double)` : `${clean(roots.re)} ± ${roots.im.toFixed(3)}i`;
  const resonant = !Number.isFinite(ss.amp);
  return (
    <LabFrame
      label="A mass hanging on a coil spring and dashpot, driven by a periodic force, next to its displacement-versus-time graph"
      camera={[0, 0.5, 13]}
      onReset={reset}
      scene={() => (<group>
        <Tick fn={tick} />
        <mesh position={[SX + 0.25, CEIL + 0.1, 0]}><boxGeometry args={[2.2, 0.2, 1]} /><meshStandardMaterial color="#5b6d77" /></mesh>
        <group ref={spring} position={[SX, CEIL, 0]} scale={[1, len0, 1]}><Line points={HELIX} color="#2ba6f5" lineWidth={1.5 + k / 8} /></group>
        <group ref={damper} position={[SX + 0.6, CEIL, 0]} scale={[1, len0, 1]}><mesh position={[0, -0.5, 0]}><cylinderGeometry args={[0.03 + 0.025 * c, 0.03 + 0.025 * c, 1, 10]} /><meshStandardMaterial color="#a970ff" transparent opacity={0.85} /></mesh></group>
        <group ref={mass} position={[SX, y00, 0]}>
          <mesh position={[0.3, 0, 0]}><boxGeometry args={[sm, sm, sm]} /><meshStandardMaterial color="#ff9a1f" metalness={0.3} roughness={0.4} /></mesh>
        </group>
        <Line points={[[GX, 0, 0], [GX + GW, 0, 0]]} color="#5b6d77" lineWidth={1.5} />
        <Line points={[[GX, -1.9, 0], [GX, 1.9, 0]]} color="#5b6d77" lineWidth={1.5} />
        <Line points={force} color="#a970ff" lineWidth={1.5} />
        <Line points={graph} color="#44c95a" lineWidth={2.5} />
        <mesh ref={mark} position={[GX, y00, 0.03]}><sphereGeometry args={[0.1, 14, 12]} /><meshBasicMaterial color="#ffc83d" /></mesh>
      </group>)}
      readouts={[
        ["Roots of m r² + c r + k = 0", rootText],
        ["Damping", `${roots.type} (ζ = ${roots.zeta.toFixed(3)})`],
        ["Natural ω₀ = √(k/m)", `${w0.toFixed(3)} rad/s`],
        ["Damped ω_d", roots.type === "Under-damped" ? `${roots.im.toFixed(3)} rad/s` : "— (no oscillation)"],
        ["Particular-integral amplitude", F0 === 0 ? "0 (no forcing)" : resonant ? "∞ (undamped resonance)" : ss.amp.toFixed(4)],
        ["Phase lag φ", resonant ? "—" : `${((ss.phase * 180) / Math.PI).toFixed(1)}°`],
      ]}
      controls={<>
        <Slider label="Mass m" value={m} min={0.2} max={5} step={0.1} digits={1} unit=" kg" onChange={(v) => set("m", v)} />
        <Slider label="Damping c" value={c} min={0} max={8} step={0.05} digits={2} unit=" N·s/m" onChange={(v) => set("c", v)} />
        <Slider label="Spring stiffness k" value={k} min={0.5} max={25} step={0.5} digits={1} unit=" N/m" onChange={(v) => set("k", v)} />
        <Slider label="Force amplitude F₀" value={F0} min={0} max={3} step={0.1} digits={1} unit=" N" onChange={(v) => set("F0", v)} />
        <Slider label="Drive frequency ω" value={w} min={0.1} max={6} step={0.05} digits={2} unit=" rad/s" onChange={(v) => set("w", v)} />
      </>}
      note={<p>The mass obeys m y″ + c y′ + k y = F₀ cos ωt, released from y(0) = 1 at rest (graph: green y(t), faint purple the driving force on an arbitrary scale; the coil is the spring, the purple cylinder the damper). The complementary function comes from the roots of m r² + c r + k = 0: complex a ± bi is under-damped (ζ &lt; 1), a double real root is critical damping (c = 2√(km), ζ = 1), two real roots is over-damped. That part dies out; what remains is the particular integral y<sub>p</sub> = A cos(ωt − φ) with A = F₀ / √((k − mω²)² + (cω)²). Sweep ω through ω₀ = √(k/m) and A peaks (sharply if c is small): resonance. The graph is scaled to fit, so read amplitudes from the numbers.</p>}
    />
  );
}
