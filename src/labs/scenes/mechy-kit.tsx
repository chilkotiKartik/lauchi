"use client";
/** Small shared pieces for the mechy labs. Plain geometry only. */
import { useRef, type ReactNode } from "react";
import type * as THREE from "three";
import { Tick } from "../Stage";
import { C, mix } from "../kit2";

/** Blue (cold) → green → gold → red (hot) for a temperature between lo and hi. */
export function tempColor(T: number, lo: number, hi: number) {
  const f = Math.min(1, Math.max(0, (T - lo) / (hi - lo || 1)));
  if (f < 0.33) return mix(C.blue, C.green, f / 0.33);
  if (f < 0.66) return mix(C.green, C.gold, (f - 0.33) / 0.33);
  return mix(C.gold, C.red, (f - 0.66) / 0.34);
}

/** Spins its children about one axis at `speed` rad/s while `on`. */
export function Spinner({ speed, axis = "z", on = true, children }: { speed: number; axis?: "x" | "y" | "z"; on?: boolean; children: ReactNode }) {
  const g = useRef<THREE.Group>(null);
  return (
    <group ref={g}>
      <Tick fn={(dt) => { if (on && g.current) g.current.rotation[axis] += Math.min(dt, 0.05) * speed; }} />
      {children}
    </group>
  );
}

/** A flickering flame (cone + glow) at p. */
export function Flame({ p, s = 1, color = C.orange }: { p: [number, number, number]; s?: number; color?: string }) {
  const m = useRef<THREE.Group>(null), t = useRef(p[0] * 3.1);
  return (
    <group ref={m} position={p}>
      <Tick fn={(dt) => { t.current += Math.min(dt, 0.05); m.current?.scale.set(s, s * (1 + 0.25 * Math.sin(t.current * 11) + 0.1 * Math.sin(t.current * 23)), s); }} />
      <mesh position={[0, 0.25, 0]}><coneGeometry args={[0.18, 0.5, 12]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.1} transparent opacity={0.85} /></mesh>
      <mesh position={[0, 0.16, 0]}><coneGeometry args={[0.09, 0.28, 10]} /><meshStandardMaterial color={C.gold} emissive={C.gold} emissiveIntensity={1.3} /></mesh>
    </group>
  );
}
