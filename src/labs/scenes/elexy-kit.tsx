"use client";
/** Shared parts for the elexy labs: circuit components, a per-frame tracer dot and a bead wave. Plain geometry only. */
import { Line } from "@react-three/drei";
import { useLayoutEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { Tick } from "../Stage";
import { C, type V3 } from "../kit";

const Y = new THREE.Vector3(0, 1, 0);
function orient(a: V3, b: V3) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A), len = Math.max(1e-4, d.length());
  return { pos: A.clone().add(B).multiplyScalar(0.5), quat: new THREE.Quaternion().setFromUnitVectors(Y, d.normalize()), len };
}

/** A wire through the given points. */
export function Wire({ pts, c = C.light, w = 2 }: { pts: V3[]; c?: string; w?: number }) {
  return <Line points={pts} color={c} lineWidth={w} />;
}

/** A resistor between a and b: grey leads and a tan body with colour bands. `glow` (0…1) shows power. */
export function Res({ a, b, glow = 0, body = 0.55, r = 0.12 }: { a: V3; b: V3; glow?: number; body?: number; r?: number }) {
  const { pos, quat, len } = useMemo(() => orient(a, b), [a, b]);
  const L = Math.max(0.25, len * body);
  return (
    <group position={pos} quaternion={quat}>
      <mesh><cylinderGeometry args={[0.03, 0.03, len, 8]} /><meshStandardMaterial color={C.light} /></mesh>
      <mesh><cylinderGeometry args={[r, r, L, 16]} /><meshStandardMaterial color="#d9b98a" emissive={glow > 0.02 ? C.orange : "#000000"} emissiveIntensity={Math.min(1.2, glow)} roughness={0.5} /></mesh>
      {[-0.3, -0.12, 0.06].map((k, i) => (
        <mesh key={i} position={[0, k * L, 0]}><cylinderGeometry args={[r * 1.05, r * 1.05, L * 0.09, 16]} /><meshStandardMaterial color={[C.red, C.purple, C.gold][i]} /></mesh>
      ))}
    </group>
  );
}

/** A diode from anode a to cathode b (silver band at the cathode). `on` makes it glow. */
export function Diode({ a, b, on = false, c = "#2a2f33", glowColor = C.gold }: { a: V3; b: V3; on?: boolean; c?: string; glowColor?: string }) {
  const { pos, quat, len } = useMemo(() => orient(a, b), [a, b]);
  const L = Math.min(len * 0.6, 0.8);
  return (
    <group position={pos} quaternion={quat}>
      <mesh><cylinderGeometry args={[0.03, 0.03, len, 8]} /><meshStandardMaterial color={C.light} /></mesh>
      <mesh><cylinderGeometry args={[0.14, 0.14, L, 16]} /><meshStandardMaterial color={c} emissive={on ? glowColor : "#000000"} emissiveIntensity={on ? 0.8 : 0} roughness={0.4} /></mesh>
      <mesh position={[0, L * 0.36, 0]}><cylinderGeometry args={[0.145, 0.145, L * 0.12, 16]} /><meshStandardMaterial color={C.white} /></mesh>
      <mesh position={[0, -L * 0.08, 0]}><coneGeometry args={[0.1, L * 0.3, 3]} /><meshStandardMaterial color={on ? glowColor : C.grey} emissive={on ? glowColor : "#000000"} emissiveIntensity={on ? 0.6 : 0} /></mesh>
    </group>
  );
}

/** A capacitor centred at p with its plates across the a→b direction. `q` (0…1) lights the plates. */
export function Cap({ a, b, q = 0.5, c = C.blue }: { a: V3; b: V3; q?: number; c?: string }) {
  const { pos, quat, len } = useMemo(() => orient(a, b), [a, b]);
  const gap = 0.14, lead = Math.max(0, len / 2 - gap);
  return (
    <group position={pos} quaternion={quat}>
      <mesh position={[0, -(gap + lead / 2), 0]}><cylinderGeometry args={[0.03, 0.03, lead, 8]} /><meshStandardMaterial color={C.light} /></mesh>
      <mesh position={[0, gap + lead / 2, 0]}><cylinderGeometry args={[0.03, 0.03, lead, 8]} /><meshStandardMaterial color={C.light} /></mesh>
      <mesh position={[0, -gap / 2, 0]}><cylinderGeometry args={[0.32, 0.32, 0.05, 20]} /><meshStandardMaterial color={c} emissive={c} emissiveIntensity={0.15 + 0.8 * q} /></mesh>
      <mesh position={[0, gap / 2, 0]}><cylinderGeometry args={[0.32, 0.32, 0.05, 20]} /><meshStandardMaterial color={C.red} emissive={C.red} emissiveIntensity={0.15 + 0.8 * q} /></mesh>
    </group>
  );
}

/** Op-amp body: a triangular prism pointing along +x, centred at p. */
export function OpAmpBody({ p, s = 1, c = "#3a5562" }: { p: V3; s?: number; c?: string }) {
  return (
    <group position={p}>
      <group rotation={[0, 0, Math.PI / 2]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[s, s, 0.5, 3]} />
          <meshStandardMaterial color={c} roughness={0.35} metalness={0.2} />
        </mesh>
      </group>
      <mesh position={[-s * 0.25, s * 0.35, 0.27]}><boxGeometry args={[0.22, 0.05, 0.02]} /><meshBasicMaterial color={C.red} /></mesh>
      <mesh position={[-s * 0.25, -s * 0.35, 0.27]}><boxGeometry args={[0.22, 0.05, 0.02]} /><meshBasicMaterial color={C.green} /></mesh>
      <mesh position={[-s * 0.25, -s * 0.35, 0.28]}><boxGeometry args={[0.05, 0.22, 0.02]} /><meshBasicMaterial color={C.green} /></mesh>
    </group>
  );
}

/** A ground symbol (three bars) at p. */
export function Ground({ p, c = C.green }: { p: V3; c?: string }) {
  return (
    <group position={p}>
      {[0.36, 0.24, 0.12].map((w, i) => <mesh key={i} position={[0, -i * 0.09, 0]}><boxGeometry args={[w, 0.04, 0.12]} /><meshStandardMaterial color={c} emissive={c} emissiveIntensity={0.3} /></mesh>)}
    </group>
  );
}

/** An AC source (ring with a sine squiggle) at p. */
export function AcSource({ p, r = 0.38, c = C.blue }: { p: V3; r?: number; c?: string }) {
  const sine = useMemo<V3[]>(() => Array.from({ length: 25 }, (_, i) => { const x = -r * 0.6 + (1.2 * r * i) / 24; return [x, 0.18 * r * 1.6 * Math.sin((i / 24) * 2 * Math.PI), 0.06]; }), [r]);
  return (
    <group position={p}>
      <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[r, r, 0.1, 28]} /><meshStandardMaterial color="#1d3440" /></mesh>
      <mesh><torusGeometry args={[r, 0.04, 8, 32]} /><meshStandardMaterial color={c} emissive={c} emissiveIntensity={0.4} /></mesh>
      <Line points={sine} color={C.gold} lineWidth={2.4} />
    </group>
  );
}

/** A dot that follows a sampled path every frame; `phase` (cycles) is read from a shared ref. */
export function Tracer({ pts, phase, color = C.gold, r = 0.1 }: { pts: V3[]; phase: RefObject<number>; color?: string; r?: number }) {
  const m = useRef<THREE.Mesh>(null);
  const tick = () => {
    if (!m.current || pts.length === 0) return;
    const f = ((phase.current % 1) + 1) % 1, i = Math.min(pts.length - 1, Math.floor(f * (pts.length - 1)));
    m.current.position.set(pts[i][0], pts[i][1], pts[i][2]);
  };
  return (
    <mesh ref={m} position={pts[0] ?? [0, 0, 0]}>
      <Tick fn={tick} />
      <sphereGeometry args={[r, 14, 14]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} />
    </mesh>
  );
}

const _o = new THREE.Object3D();
function paintBeads(m: THREE.InstancedMesh, n: number, len: number, amp: number, k: number, ph: number, sign: number) {
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1);
    _o.position.set(-len / 2 + len * u, sign * amp * Math.sin(2 * Math.PI * (k * u - ph)), 0);
    _o.updateMatrix(); m.setMatrixAt(i, _o.matrix);
  }
  m.instanceMatrix.needsUpdate = true;
}
/** A travelling sine drawn as glowing beads along x (centred at p). `sign` −1 shows a 180° phase flip. */
export function BeadWave({ p, len = 3, amp = 0.5, cycles = 1.5, color = C.blue, sign = 1, speed = 0.5, n = 36, r = 0.06 }: { p: V3; len?: number; amp?: number; cycles?: number; color?: string; sign?: number; speed?: number; n?: number; r?: number }) {
  const ref = useRef<THREE.InstancedMesh>(null), ph = useRef(0);
  useLayoutEffect(() => { if (ref.current) paintBeads(ref.current, n, len, amp, cycles, ph.current, sign); }, [n, len, amp, cycles, sign]);
  const tick = (dt: number) => { ph.current += Math.min(dt, 0.05) * speed; if (ref.current) paintBeads(ref.current, n, len, amp, cycles, ph.current, sign); };
  return (
    <group position={p}>
      <Tick fn={tick} />
      <instancedMesh ref={ref} args={[undefined, undefined, n]} frustumCulled={false}>
        <sphereGeometry args={[r, 10, 10]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.7} />
      </instancedMesh>
      <Line points={[[-len / 2, 0, -0.02], [len / 2, 0, -0.02]]} color={C.grey} lineWidth={1} />
    </group>
  );
}
