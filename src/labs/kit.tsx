"use client";
/** Small building blocks shared by the newer labs. Everything here is plain geometry: no fonts, no textures, no network. */
import { Line } from "@react-three/drei";
import { useLayoutEffect, useMemo, useRef, type ReactNode } from "react";
import * as THREE from "three";
import { Tick, useQuality } from "./Stage";

export type V3 = [number, number, number];
/** The app palette (see AUTHORING.md). */
export const C = { green: "#44c95a", blue: "#2ba6f5", red: "#ff5a5f", gold: "#ffc83d", purple: "#a970ff", orange: "#ff9a1f", grey: "#5b6d77", light: "#9db0ba", dark: "#33454e", white: "#e8f1f5" } as const;

export function Box({ p, s, c, glow = 0, o = 1, metal = 0.2, rough = 0.35 }: { p: V3; s: V3; c: string; glow?: number; o?: number; metal?: number; rough?: number }) {
  return (
    <mesh position={p}>
      <boxGeometry args={s} />
      <meshStandardMaterial
        color={c}
        emissive={glow > 0 ? c : "#000000"}
        emissiveIntensity={glow}
        roughness={rough}
        metalness={metal}
        transparent={o < 1}
        opacity={o}
      />
    </mesh>
  );
}

export function Ball({ p, r, c, glow = 0, metal = 0.25, rough = 0.2 }: { p: V3; r: number; c: string; glow?: number; metal?: number; rough?: number }) {
  return (
    <mesh position={p}>
      <sphereGeometry args={[r, 32, 32]} />
      <meshStandardMaterial
        color={c}
        emissive={glow > 0 ? c : "#000000"}
        emissiveIntensity={glow}
        roughness={rough}
        metalness={metal}
      />
    </mesh>
  );
}

/** A polyline. */
export function Poly({ pts, c, w = 2.5 }: { pts: V3[]; c: string; w?: number }) {
  return pts.length > 1 ? <Line points={pts} color={c} lineWidth={w} /> : null;
}

/** Rotates its children slowly about the vertical axis. */
export function Spin({ speed = 0.25, children }: { speed?: number; children: ReactNode }) {
  const g = useRef<THREE.Group>(null);
  return (
    <group ref={g}>
      <Tick fn={(dt) => { if (g.current) g.current.rotation.y += Math.min(dt, 0.05) * speed; }} />
      {children}
    </group>
  );
}

/** Moves a marker back and forth between two points, or around a loop, at `speed` cycles per second. */
export function Shuttle({ from, to, speed = 0.4, r = 0.1, c = C.gold }: { from: V3; to: V3; speed?: number; r?: number; c?: string }) {
  const m = useRef<THREE.Mesh>(null), t = useRef(0);
  return (
    <mesh ref={m} position={from}>
      <Tick fn={(dt) => {
        t.current = (t.current + Math.min(dt, 0.05) * speed) % 1;
        const k = t.current;
        m.current?.position.set(from[0] + (to[0] - from[0]) * k, from[1] + (to[1] - from[1]) * k, from[2] + (to[2] - from[2]) * k);
      }} />
      <sphereGeometry args={[r, 16, 16]} />
      <meshStandardMaterial color={c} emissive={c} emissiveIntensity={0.7} roughness={0.2} metalness={0.4} />
    </mesh>
  );
}

/** A row of vertical bars. `values` are scaled so that `max` is `height` tall. */
export function Bars({ values, max, colors, x0 = 0, z = 0, w = 0.4, gap = 0.12, height = 2.4, y0 = 0, glow = 0.2 }: {
  values: number[]; max: number; colors: string | string[]; x0?: number; z?: number; w?: number; gap?: number; height?: number; y0?: number; glow?: number;
}) {
  const m = max > 0 ? max : 1;
  return (
    <group position={[x0, y0, z]}>
      {values.map((v, i) => {
        const h = Math.max(0.03, (Math.max(0, v) / m) * height), col = Array.isArray(colors) ? colors[i % colors.length] : colors;
        return (
          <group key={i} position={[i * (w + gap), 0, 0]}>
            <mesh position={[0, h / 2, 0]}>
              <boxGeometry args={[w, h, w]} />
              <meshStandardMaterial color={col} emissive={glow > 0 ? col : "#000000"} emissiveIntensity={glow} roughness={0.25} metalness={0.3} />
            </mesh>
            <mesh position={[0, h + 0.01, 0]}>
              <boxGeometry args={[w * 0.9, 0.02, w * 0.9]} />
              <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.3} roughness={0.1} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

export function Floor({ size = 10, y = 0, divisions = 12 }: { size?: number; y?: number; divisions?: number }) {
  return (
    <group position={[0, y, 0]}>
      {/* Subtle dark workbench benchtop base */}
      <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[size * 0.55, 48]} />
        <meshStandardMaterial color="#0b1419" roughness={0.6} metalness={0.15} />
      </mesh>
      <gridHelper args={[size, divisions, "#4d6b79", "#1b2a32"]} position={[0, 0.001, 0]} />
    </group>
  );
}

/** Realistic laboratory optical rail with anodized rail profile, sliding post clamps, and leveling feet. */
export function OpticalRail({ len = 8, y = -1.8, z = 0 }: { len?: number; y?: number; z?: number }) {
  return (
    <group position={[0, y, z]}>
      {/* Heavy extruded aluminium optical rail */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[len, 0.22, 0.55]} />
        <meshStandardMaterial color="#1a242b" metalness={0.85} roughness={0.25} />
      </mesh>
      {/* Center dovetailed chrome guide track */}
      <mesh position={[0, 0.115, 0]}>
        <boxGeometry args={[len, 0.02, 0.2]} />
        <meshStandardMaterial color="#7f939e" metalness={0.9} roughness={0.15} />
      </mesh>
      {/* Rail support leveling feet */}
      {[-len / 2 + 0.4, len / 2 - 0.4].map((fx, i) => (
        <group key={i} position={[fx, -0.16, 0]}>
          <mesh>
            <cylinderGeometry args={[0.3, 0.35, 0.12, 24]} />
            <meshStandardMaterial color="#2d3b44" metalness={0.7} roughness={0.4} />
          </mesh>
          <mesh position={[0, -0.08, 0]}>
            <cylinderGeometry args={[0.12, 0.12, 0.08, 16]} />
            <meshStandardMaterial color="#cca43b" metalness={0.8} roughness={0.3} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Precision optical carrier post holder with knurled brass thumbscrew */
export function OpticalCarrier({ p, height = 1.2 }: { p: V3; height?: number }) {
  return (
    <group position={p}>
      {/* Sliding saddle base */}
      <mesh position={[0, 0.05, 0]}>
        <boxGeometry args={[0.45, 0.1, 0.58]} />
        <meshStandardMaterial color="#24313a" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Stainless steel vertical post */}
      <mesh position={[0, height / 2 + 0.1, 0]}>
        <cylinderGeometry args={[0.06, 0.06, height, 20]} />
        <meshStandardMaterial color="#b4c6d0" metalness={0.9} roughness={0.15} />
      </mesh>
      {/* Knurled brass locking collar */}
      <mesh position={[0, 0.16, 0]}>
        <cylinderGeometry args={[0.11, 0.11, 0.08, 20]} />
        <meshStandardMaterial color="#cca43b" metalness={0.8} roughness={0.35} />
      </mesh>
    </group>
  );
}

/** Time in seconds/minutes/hours/days/years as short text. */
export function human(sec: number): string {
  if (!Number.isFinite(sec)) return "never";
  if (sec < 1e-3) return "< 1 ms";
  if (sec < 1) return `${(sec * 1000).toFixed(0)} ms`;
  if (sec < 60) return `${sec.toFixed(1)} s`;
  if (sec < 3600) return `${(sec / 60).toFixed(1)} min`;
  if (sec < 86400) return `${(sec / 3600).toFixed(1)} h`;
  if (sec < 86400 * 365) return `${(sec / 86400).toFixed(1)} days`;
  const y = sec / (86400 * 365.25);
  if (y < 1e3) return `${y.toFixed(1)} years`;
  if (y < 1e6) return `${(y / 1e3).toFixed(1)} thousand years`;
  if (y < 1e9) return `${(y / 1e6).toFixed(1)} million years`;
  if (y < 1e12) return `${(y / 1e9).toFixed(1)} billion years`;
  return `${y.toExponential(1)} years`;
}

/** A flat, softly lit backing panel for a graph or diagram (side 2 = both faces). */
export function Panel({ p, w, h, c = "#23404c", o = 0.95 }: { p: V3; w: number; h: number; c?: string; o?: number }) {
  return (
    <mesh position={p}>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial color={c} transparent opacity={o} side={2} />
    </mesh>
  );
}

/** Two axes meeting at (x0, y0), w wide and h tall. */
export function Axes({ x0, y0, w, h, z = 0, c = C.light }: { x0: number; y0: number; w: number; h: number; z?: number; c?: string }) {
  return (
    <>
      <Poly pts={[[x0, y0, z], [x0 + w, y0, z]]} c={c} w={1.6} />
      <Poly pts={[[x0, y0, z], [x0, y0 + h, z]]} c={c} w={1.6} />
    </>
  );
}

/** Splits a sampled curve into drawable pieces wherever a sample is missing (null). */
export function pieces(pts: (V3 | null)[]): V3[][] {
  const out: V3[][] = [];
  let cur: V3[] = [];
  for (const p of pts) {
    if (p === null) { if (cur.length > 1) out.push(cur); cur = []; } else cur.push(p);
  }
  if (cur.length > 1) out.push(cur);
  return out;
}

/** Consecutive spans along one axis: widths in, start positions out. */
export function spans(ws: number[]): { x: number; w: number }[] {
  const out: { x: number; w: number }[] = [];
  let x = 0;
  for (const w of ws) { out.push({ x, w }); x += w; }
  return out;
}

/** Many line segments drawn in one call. `pts` is a flat list x1,y1,z1,x2,y2,z2,… */
export function Segs({ pts, c }: { pts: number[]; c: string }) {
  const geo = useMemo(() => new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute(pts, 3)), [pts]);
  return <lineSegments geometry={geo}><lineBasicMaterial color={c} /></lineSegments>;
}

export type Inst = { p: V3; s: V3; c: string };
const _m = new THREE.Object3D(), _c = new THREE.Color();
function paintInstances(m: THREE.InstancedMesh, items: Inst[]) {
  const n = Math.min(items.length, m.instanceMatrix.count);
  for (let i = 0; i < n; i++) {
    const it = items[i];
    _m.position.set(it.p[0], it.p[1], it.p[2]); _m.scale.set(it.s[0], it.s[1], it.s[2]); _m.updateMatrix();
    m.setMatrixAt(i, _m.matrix); m.setColorAt(i, _c.set(it.c));
  }
  m.count = n;
  m.instanceMatrix.needsUpdate = true;
  if (m.instanceColor) m.instanceColor.needsUpdate = true;
}
/** Up to `cap` boxes or spheres of unit size, each with its own position, scale and colour, drawn in one call. */
export function Instances({ items, cap, shape = "box" }: { items: Inst[]; cap: number; shape?: "box" | "sphere" }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  // sphere detail scales with how many there are and the device: hundreds of small atoms don't need 12×12 segments each
  const quality = useQuality();
  const seg: [number, number] = quality === "low" ? [7, 5] : cap > 120 ? [9, 7] : [12, 10];
  useLayoutEffect(() => { if (ref.current) paintInstances(ref.current, items); }, [items]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, cap]}>
      {shape === "box" ? <boxGeometry args={[1, 1, 1]} /> : <sphereGeometry key={seg.join("x")} args={[0.5, seg[0], seg[1]]} />}
      <meshStandardMaterial color="#ffffff" roughness={0.45} />
    </instancedMesh>
  );
}
