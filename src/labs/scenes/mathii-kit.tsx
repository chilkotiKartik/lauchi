"use client";
/** Shared 3D helpers for the Maths II labs: coloured height-field surfaces, domain-coloured complex surfaces, sway and tiny utilities. */
import { Line } from "@react-three/drei";
import { useMemo, useRef, type ReactNode } from "react";
import * as THREE from "three";
import { Tick } from "../Stage";
import type { C2 } from "../sim/mathii";

export type V3 = [number, number, number];
export type RGB = [number, number, number];
export { C } from "../kit";

/** Blue → teal → green → gold → red colour ramp, t in 0..1. */
export function ramp(t: number): RGB {
  const stops: RGB[] = [[0.17, 0.45, 0.95], [0.1, 0.78, 0.85], [0.27, 0.8, 0.35], [1, 0.78, 0.24], [1, 0.35, 0.37]];
  const u = Math.min(1, Math.max(0, t)) * (stops.length - 1), i = Math.min(stops.length - 2, Math.floor(u)), f = u - i;
  return [stops[i][0] + (stops[i + 1][0] - stops[i][0]) * f, stops[i][1] + (stops[i + 1][1] - stops[i][1]) * f, stops[i][2] + (stops[i + 1][2] - stops[i][2]) * f];
}
const _c = new THREE.Color();
export function hsl(h: number, s: number, l: number): RGB { _c.setHSL(((h % 1) + 1) % 1, s, l); return [_c.r, _c.g, _c.b]; }

export interface SurfaceSpec {
  n: number; x0: number; x1: number; y0: number; y1: number;
  /** height of the surface (scene units) at math point (x, y); NaN gives a hole (flat at 0) */
  h: (x: number, y: number) => number;
  /** colour at the point */
  col: (x: number, y: number, h: number) => RGB;
  /** scene units per math unit in x and y */
  sx?: number; sy?: number;
}
/** Math (x, y) → scene (x·sx, height, −y·sy). Heights should already be in scene units. */
export function buildSurface(s: SurfaceSpec): THREE.BufferGeometry {
  const { n, x0, x1, y0, y1 } = s, sx = s.sx ?? 1, sy = s.sy ?? 1;
  const pos = new Float32Array(n * n * 3), col = new Float32Array(n * n * 3), idx: number[] = [];
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const x = x0 + ((x1 - x0) * i) / (n - 1), y = y0 + ((y1 - y0) * j) / (n - 1);
    let h = s.h(x, y);
    if (!Number.isFinite(h)) h = 0;
    const k = (j * n + i) * 3, c = s.col(x, y, h);
    pos[k] = x * sx; pos[k + 1] = h; pos[k + 2] = -y * sy;
    col[k] = c[0]; col[k + 1] = c[1]; col[k + 2] = c[2];
  }
  for (let j = 0; j < n - 1; j++) for (let i = 0; i < n - 1; i++) {
    const a = j * n + i, b = a + 1, c = a + n, d = c + 1;
    idx.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
export function Surface({ geo, opacity = 1 }: { geo: THREE.BufferGeometry; opacity?: number }) {
  return (
    <mesh geometry={geo}>
      <meshStandardMaterial vertexColors side={THREE.DoubleSide} roughness={0.55} metalness={0.05} transparent={opacity < 1} opacity={opacity} />
    </mesh>
  );
}

/** Domain colouring: hue = arg w, brightness fades with |w|, height = min(|w|, cap). */
export function buildComplexSurface(fn: (x: number, y: number) => C2, half: number, n: number, cap: number, hs: number): THREE.BufferGeometry {
  return buildSurface({
    n, x0: -half, x1: half, y0: -half, y1: half,
    h: (x, y) => { const w = fn(x, y); const m = Math.hypot(w[0], w[1]); return Number.isFinite(m) ? Math.min(cap, m) * hs : cap * hs; },
    col: (x, y) => { const w = fn(x, y), m = Math.hypot(w[0], w[1]); return hsl(Math.atan2(w[1], w[0]) / (2 * Math.PI), 0.8, Number.isFinite(m) ? 0.34 + 0.3 * (1 - Math.exp(-m / 2)) : 0.8); },
  });
}

/** Gently sways its children left and right so the 3D shape reads even when nothing else moves. */
export function Sway({ amp = 0.35, speed = 0.22, children }: { amp?: number; speed?: number; children: ReactNode }) {
  const g = useRef<THREE.Group>(null), t = useRef(0);
  return (
    <group ref={g}>
      <Tick fn={(dt) => { t.current += Math.min(dt, 0.05); if (g.current) g.current.rotation.y = amp * Math.sin(t.current * speed * 6.28318); }} />
      {children}
    </group>
  );
}

/** Flat list x1,y1,x2,y2,… (e.g. from contourSegs) → pairs of points for a <Line segments>, lifted by `z(x, y)` and scaled. */
export function segPoints(flat: number[], z: (x: number, y: number) => number, sx = 1, sy = 1): V3[] {
  const out: V3[] = [];
  for (let i = 0; i + 3 < flat.length; i += 4) {
    out.push([flat[i] * sx, z(flat[i], flat[i + 1]), -flat[i + 1] * sy], [flat[i + 2] * sx, z(flat[i + 2], flat[i + 3]), -flat[i + 3] * sy]);
  }
  return out;
}
export function Segments({ pts, color, width = 2 }: { pts: V3[]; color: string; width?: number }) {
  return pts.length >= 2 ? <Line segments points={pts} color={color} lineWidth={width} /> : null;
}

/** A glowing ball. */
export function Orb({ p, r = 0.12, c, glow = 0.7 }: { p: V3; r?: number; c: string; glow?: number }) {
  return (
    <mesh position={p}>
      <sphereGeometry args={[r, 16, 14]} />
      <meshStandardMaterial color={c} emissive={c} emissiveIntensity={glow} roughness={0.35} />
    </mesh>
  );
}

/** Vertical beam from the floor to a height (probe pillar). */
export function Pillar({ x, z, h, c, r = 0.04 }: { x: number; z: number; h: number; c: string; r?: number }) {
  const hh = Math.max(0.02, Math.abs(h));
  return (
    <mesh position={[x, h / 2, z]}>
      <cylinderGeometry args={[r, r, hh, 8]} />
      <meshStandardMaterial color={c} emissive={c} emissiveIntensity={0.5} />
    </mesh>
  );
}

export const fmt = (v: number, d = 3) => (Number.isFinite(v) ? v.toFixed(d).replace("-", "−") : "undefined");
export const cfmt = (z: C2, d = 3) => (Number.isFinite(z[0]) && Number.isFinite(z[1]) ? `${fmt(z[0], d)} ${z[1] < 0 ? "−" : "+"} ${Math.abs(z[1]).toFixed(d)}i` : "undefined");

/** A translucent vertical wall standing on a polyline (scene points), `h` tall: gives flat curves real depth. */
export function buildRibbon(pts: V3[], h: number): THREE.BufferGeometry {
  const n = pts.length, pos = new Float32Array(n * 6), idx: number[] = [];
  pts.forEach((p, i) => { pos.set([p[0], p[1], p[2], p[0], p[1] + h, p[2]], i * 6); });
  for (let i = 0; i < n - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
export function Ribbon({ pts, h = 0.5, color, opacity = 0.35 }: { pts: V3[]; h?: number; color: string; opacity?: number }) {
  const geo = useMemo(() => buildRibbon(pts, h), [pts, h]);
  if (pts.length < 2) return null;
  return <mesh geometry={geo}><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} transparent opacity={opacity} side={THREE.DoubleSide} depthWrite={false} /></mesh>;
}
