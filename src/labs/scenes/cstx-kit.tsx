"use client";
/** Shared "scientific bench" look for the cstx labs: brushed-steel plate, glass covers, emissive LEDs and a travelling token. */
import { useLayoutEffect, useMemo, useState } from "react";
import { useRef } from "react";
import * as THREE from "three";
import { Tick } from "../Stage";
import { C, type V3 } from "../kit";

export { C };
export type { V3 };
export const STEEL = "#2c3a44", STEEL_DARK = "#1c262d", GLASS = "#8fd3ff";

/** Brushed-steel bench plate with a subtle grid and a dark trim. */
export function Bench({ w = 14, d = 9, y = 0, cx = 0, cz = 0 }: { w?: number; d?: number; y?: number; cx?: number; cz?: number }) {
  return (
    <group position={[cx, y, cz]}>
      <mesh position={[0, -0.16, 0]}><boxGeometry args={[w, 0.3, d]} /><meshStandardMaterial color={STEEL} metalness={0.55} roughness={0.38} /></mesh>
      <mesh position={[0, -0.34, 0]}><boxGeometry args={[w + 0.3, 0.08, d + 0.3]} /><meshStandardMaterial color={STEEL_DARK} metalness={0.4} roughness={0.6} /></mesh>
      <gridHelper args={[Math.max(w, d), Math.round(Math.max(w, d) * 1.5), "#4a6270", "#34464f"]} position={[0, 0.003, 0]} />
    </group>
  );
}

/** A glass cover over a box-shaped region, with a thin frame. `on` makes the frame glow in `c`. */
export function Glass({ p, s, c = GLASS, on = false, o = 0.16 }: { p: V3; s: V3; c?: string; on?: boolean; o?: number }) {
  const edges = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(s[0], s[1], s[2])), [s]);
  return (
    <group position={p}>
      <mesh><boxGeometry args={s} /><meshStandardMaterial color={c} transparent opacity={on ? o + 0.1 : o} roughness={0.1} metalness={0.2} emissive={c} emissiveIntensity={on ? 0.35 : 0.04} depthWrite={false} /></mesh>
      <lineSegments geometry={edges}><lineBasicMaterial color={on ? c : "#6f8794"} /></lineSegments>
    </group>
  );
}

/** Emissive status LED. */
export function Led({ p, c, on = true, r = 0.09 }: { p: V3; c: string; on?: boolean; r?: number }) {
  return (
    <mesh position={p}>
      <sphereGeometry args={[r, 12, 12]} />
      <meshStandardMaterial color={on ? c : "#3a4a52"} emissive={c} emissiveIntensity={on ? 1.8 : 0.05} roughness={0.3} />
    </mesh>
  );
}

/** A flat slab (steel by default) with optional glow. */
export function Slab({ p, s, c = STEEL, glow = 0, o = 1, metal = 0.35 }: { p: V3; s: V3; c?: string; glow?: number; o?: number; metal?: number }) {
  return (
    <mesh position={p}>
      <boxGeometry args={s} />
      <meshStandardMaterial color={c} metalness={metal} roughness={0.45} emissive={glow > 0 ? c : "#000000"} emissiveIntensity={glow} transparent={o < 1} opacity={o} />
    </mesh>
  );
}

/** A glowing rail between two points (a bus track). */
export function Rail({ a, b, c = C.blue, on = false, r = 0.045 }: { a: V3; b: V3; c?: string; on?: boolean; r?: number }) {
  const { pos, quat, len } = useMemo(() => {
    const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A);
    return { pos: A.clone().add(B).multiplyScalar(0.5), quat: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize()), len: Math.max(1e-4, d.length()) };
  }, [a, b]);
  return (
    <mesh position={pos} quaternion={quat}>
      <cylinderGeometry args={[r, r, len, 8]} />
      <meshStandardMaterial color={on ? c : "#4a5d68"} emissive={c} emissiveIntensity={on ? 1.1 : 0.04} roughness={0.35} metalness={0.3} />
    </mesh>
  );
}

/** The glowing token. It glides to `target` while the scene plays, and jumps there when paused. */
export function Token({ target, playing, c = C.gold, r = 0.17, rate = 7 }: { target: V3; playing: boolean; c?: string; r?: number; rate?: number }) {
  const g = useRef<THREE.Group>(null), ring = useRef<THREE.Mesh>(null);
  const [start] = useState<V3>(target);
  useLayoutEffect(() => { if (!playing) g.current?.position.set(target[0], target[1], target[2]); }, [target, playing]);
  return (
    <group ref={g} position={start}>
      <Tick fn={(dt) => {
        const k = 1 - Math.exp(-Math.min(dt, 0.05) * rate), o = g.current;
        if (o) o.position.set(o.position.x + (target[0] - o.position.x) * k, o.position.y + (target[1] - o.position.y) * k, o.position.z + (target[2] - o.position.z) * k);
        if (ring.current) ring.current.rotation.z += Math.min(dt, 0.05) * 3;
      }} />
      <mesh><sphereGeometry args={[r, 16, 16]} /><meshStandardMaterial color={c} emissive={c} emissiveIntensity={1.2} /></mesh>
      <mesh ref={ring} rotation={[Math.PI / 2.4, 0, 0]}><torusGeometry args={[r * 1.7, r * 0.12, 8, 24]} /><meshStandardMaterial color={C.white} emissive={c} emissiveIntensity={0.6} /></mesh>
    </group>
  );
}

/** Mixes the palette: returns colour i of the 7-colour cycle used for blocks, members and frames. */
export const CYCLE = [C.blue, C.green, C.gold, C.purple, C.orange, C.red, "#3fd0c9"] as const;
export const cyc = (i: number) => CYCLE[((i % CYCLE.length) + CYCLE.length) % CYCLE.length];
