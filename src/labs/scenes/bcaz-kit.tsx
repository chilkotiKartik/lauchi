"use client";
/** Shared building blocks of the BCAZ labs (COA, Java, Software Engineering): instanced bit strips, bars, cylinders, towers and spinners. Plain geometry only. */
import { useLayoutEffect, useRef, type ReactNode } from "react";
import * as THREE from "three";
import { Tick } from "../Stage";
import { Arrow, Bench, Bits, C, Cell, cyc, Glass, Glide, Halo, Led, Node3, Packet, Pointer, Rail, Slab, Token, Txt, bitsOfN, type V3 } from "./bcax-kit";

export { Arrow, Bench, Bits, C, Cell, cyc, Glass, Glide, Halo, Led, Node3, Packet, Pointer, Rail, Slab, Token, Txt, bitsOfN };
export type { V3 };

/** A row of bits drawn with one instanced mesh: tall bright block for 1, short dim block for 0, coloured per field. */
export function BitStrip({ p, bits, cols, s = 0.3, gap = 0.05 }: { p: V3; bits: readonly number[]; cols: readonly string[]; s?: number; gap?: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = ref.current; if (!m) return;
    const o = new THREE.Object3D(), c = new THREE.Color(), n = bits.length;
    bits.forEach((b, i) => {
      const h = b ? s * 2.2 : s * 0.5;
      o.position.set((i - (n - 1) / 2) * (s + gap), h / 2, 0); o.scale.set(1, h / s, 1); o.updateMatrix(); m.setMatrixAt(i, o.matrix);
      c.set(cols[i] ?? C.blue); if (!b) c.multiplyScalar(0.3); m.setColorAt(i, c);
    });
    m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true;
  });
  return (
    <group position={p}>
      <instancedMesh key={bits.length} ref={ref} args={[undefined, undefined, bits.length]}>
        <boxGeometry args={[s, s, s]} /><meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.14} roughness={0.4} metalness={0.15} />
      </instancedMesh>
    </group>
  );
}

/** A vertical bar standing on y = 0 (height h). */
export function Bar({ x, z = 0, h, w = 0.5, d = 0.5, c, glow = 0.35, y = 0 }: { x: number; z?: number; h: number; w?: number; d?: number; c: string; glow?: number; y?: number }) {
  const hh = Math.max(0.02, h);
  return <Slab p={[x, y + hh / 2, z]} s={[w, hh, d]} c={c} glow={glow} />;
}

/** A glowing cylinder (disc, pillar or drum). */
export function Cyl({ p, r = 0.4, h = 0.3, c = C.blue, glow = 0.4, o = 1, axis = "y" }: { p: V3; r?: number; h?: number; c?: string; glow?: number; o?: number; axis?: "y" | "x" | "z" }) {
  return (
    <mesh position={p} rotation={axis === "x" ? [0, 0, Math.PI / 2] : axis === "z" ? [Math.PI / 2, 0, 0] : [0, 0, 0]}>
      <cylinderGeometry args={[r, r, h, 24]} />
      <meshStandardMaterial color={c} emissive={c} emissiveIntensity={glow} roughness={0.4} metalness={0.3} transparent={o < 1} opacity={o} />
    </mesh>
  );
}

/** A ring that spins about its axis while the scene plays. */
export function Spin({ p, r = 0.6, c = C.gold, speed = 1, tube = 0.05, tilt = 0 }: { p: V3; r?: number; c?: string; speed?: number; tube?: number; tilt?: number }) {
  const m = useRef<THREE.Mesh>(null);
  return (
    <mesh ref={m} position={p} rotation={[tilt, 0, 0]}>
      <Tick fn={(dt) => { if (m.current) m.current.rotation.z += Math.min(dt, 0.05) * speed; }} />
      <torusGeometry args={[r, tube, 8, 32]} /><meshStandardMaterial color={c} emissive={c} emissiveIntensity={0.9} />
    </mesh>
  );
}

/** A vertical tower of n slabs (a stack), the top one highlighted. */
export function Tower({ p, n, max, w = 1, hh = 0.32, c = C.blue, top = C.gold }: { p: V3; n: number; max: number; w?: number; hh?: number; c?: string; top?: string }) {
  return (
    <group position={p}>
      <Slab p={[0, -0.05, 0]} s={[w * 1.15, 0.1, w * 1.15]} c="#43555f" />
      {Array.from({ length: max }, (_, i) => (
        <Slab key={i} p={[0, hh * (i + 0.5), 0]} s={[w, hh * 0.86, w]} c={i < n ? (i === n - 1 ? top : c) : "#33444e"} glow={i < n ? (i === n - 1 ? 0.8 : 0.3) : 0.02} o={i < n ? 1 : 0.35} />
      ))}
    </group>
  );
}

/** A polyline as a glowing tube-less strip of small slabs along a path (used for timing waveforms): returns slabs for high spans. */
export function Wave({ p, spans, total, w = 6, c = C.green, y = 0.5, h = 0.3, d = 0.3, base = true }: { p: V3; spans: readonly [number, number][]; total: number; w?: number; c?: string; y?: number; h?: number; d?: number; base?: boolean }) {
  const k = w / Math.max(1, total);
  return (
    <group position={p}>
      {base && <Slab p={[w / 2, 0.04, 0]} s={[w, 0.06, d * 0.5]} c="#4a5d68" />}
      {spans.filter(([a, b]) => b > a).map(([a, b], i) => <Slab key={i} p={[((a + b) / 2) * k, y + h / 2, 0]} s={[(b - a) * k, h, d]} c={c} glow={0.8} />)}
    </group>
  );
}

/** Children that bob slowly up and down while the scene plays. */
export function Bob({ children, amp = 0.06, speed = 2 }: { children: ReactNode; amp?: number; speed?: number }) {
  const g = useRef<THREE.Group>(null), t = useRef(0);
  return (
    <group ref={g}>
      <Tick fn={(dt) => { t.current += Math.min(dt, 0.05) * speed; if (g.current) g.current.position.y = Math.sin(t.current) * amp; }} />
      {children}
    </group>
  );
}

/** Clamp helper for step-like params. */
export const clampI = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, Math.round(v)));
export const hex = (v: number, w = 2) => v.toString(16).toUpperCase().padStart(w, "0");
