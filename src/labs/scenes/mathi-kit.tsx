"use client";
/** Building blocks shared by the Maths I labs: surfaces from z = f(x, y), instanced arrow glyphs, filled polygons. Plain geometry only. */
import { Line } from "@react-three/drei";
import { useLayoutEffect, useRef, useState } from "react";
import * as THREE from "three";
import { C, type V3 } from "../kit";

export { C };
export { Spin, Instances, Segs, Poly } from "../kit";
export type { V3, Inst } from "../kit";
/** Maths axes (x, y, z with z up) to scene axes (x right, y up, z towards the viewer): (x, y, z) → (x, z, −y). */
export const P3 = (x: number, y: number, z: number): V3 => [x, z, -y];
export const lerp3 = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
export const hexOf = (c: THREE.Color) => "#" + c.getHexString();

/** Geometry of the surface z = f(x, y) over xr × yr, drawn as an n × n grid with a colour per vertex. */
export function surfaceGeo(zf: (x: number, y: number) => number, xr: [number, number], yr: [number, number], n: number, color: (x: number, y: number, z: number) => string, zs = 1, zcap = 6): THREE.BufferGeometry {
  const pos = new Float32Array((n + 1) * (n + 1) * 3), col = new Float32Array((n + 1) * (n + 1) * 3), idx: number[] = [], c = new THREE.Color();
  for (let i = 0; i <= n; i++) for (let j = 0; j <= n; j++) {
    const x = xr[0] + ((xr[1] - xr[0]) * i) / n, y = yr[0] + ((yr[1] - yr[0]) * j) / n, raw = zf(x, y), z = Math.max(-zcap, Math.min(zcap, Number.isFinite(raw) ? raw : 0));
    const k = (i * (n + 1) + j) * 3, p = P3(x, y, z * zs);
    pos[k] = p[0]; pos[k + 1] = p[1]; pos[k + 2] = p[2];
    c.set(color(x, y, z)); col[k] = c.r; col[k + 1] = c.g; col[k + 2] = c.b;
  }
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const a = i * (n + 1) + j, b = a + 1, d = a + n + 1, e = d + 1;
    idx.push(a, d, b, b, d, e);
  }
  const g = new THREE.BufferGeometry();
  g.setIndex(idx); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  g.computeVertexNormals();
  return g;
}

/** A mesh from a geometry that this component owns: it is disposed when the geometry is replaced. */
export function GeoMesh({ geo, o = 1, vc = true, color = "#ffffff", wire = false, glow = 0 }: { geo: THREE.BufferGeometry; o?: number; vc?: boolean; color?: string; wire?: boolean; glow?: number }) {
  useLayoutEffect(() => () => { geo.dispose(); }, [geo]);
  return (
    <mesh geometry={geo}>
      <meshStandardMaterial vertexColors={vc} color={color} side={THREE.DoubleSide} transparent={o < 1} opacity={o} wireframe={wire} roughness={0.55} emissive={glow > 0 ? color : "#000000"} emissiveIntensity={glow} depthWrite={o >= 1} />
    </mesh>
  );
}

/** Triangle fan from a list of coplanar vertices (convex or star-shaped around their mean). */
export function fanGeo(pts: V3[]): THREE.BufferGeometry {
  const n = pts.length, pos = new Float32Array((n + 1) * 3), idx: number[] = [];
  let cx = 0, cy = 0, cz = 0;
  pts.forEach((p, i) => { pos.set(p, i * 3); cx += p[0] / n; cy += p[1] / n; cz += p[2] / n; });
  pos.set([cx, cy, cz], n * 3);
  for (let i = 0; i < n; i++) idx.push(n, i, (i + 1) % n);
  const g = new THREE.BufferGeometry();
  g.setIndex(idx); g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}

export type Glyph = { p: V3; d: V3; c: string; w?: number };
const _o = new THREE.Object3D(), _c = new THREE.Color(), _up = new THREE.Vector3(0, 1, 0), _d = new THREE.Vector3();
function paintGlyphs(m: THREE.InstancedMesh, items: Glyph[]) {
  const n = Math.min(items.length, m.instanceMatrix.count);
  for (let i = 0; i < n; i++) {
    const it = items[i], len = Math.hypot(it.d[0], it.d[1], it.d[2]);
    _o.position.set(it.p[0], it.p[1], it.p[2]);
    if (len < 1e-6) { _o.scale.set(0, 0, 0); } else { _d.set(it.d[0] / len, it.d[1] / len, it.d[2] / len); _o.quaternion.setFromUnitVectors(_up, _d); const w = it.w ?? 0.12; _o.scale.set(w, len, w); }
    _o.updateMatrix();
    m.setMatrixAt(i, _o.matrix); m.setColorAt(i, _c.set(it.c));
  }
  m.count = n;
  m.instanceMatrix.needsUpdate = true;
  if (m.instanceColor) m.instanceColor.needsUpdate = true;
}
/** Up to `cap` arrows (a cone from p along d, d.length = its length), drawn in one call. */
export function Glyphs({ items, cap }: { items: Glyph[]; cap: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const [geo] = useState(() => new THREE.ConeGeometry(0.5, 1, 8).translate(0, 0.5, 0));
  useLayoutEffect(() => { if (ref.current) paintGlyphs(ref.current, items); }, [items]);
  useLayoutEffect(() => () => { geo.dispose(); }, [geo]);
  return (
    <instancedMesh ref={ref} args={[geo, undefined, cap]}>
      <meshStandardMaterial color="#ffffff" roughness={0.4} emissive="#222222" />
    </instancedMesh>
  );
}

/** A glowing ball. */
export function Dot({ p, r = 0.1, c, glow = 0.7 }: { p: V3; r?: number; c: string; glow?: number }) {
  return (
    <mesh position={p}>
      <sphereGeometry args={[r, 16, 16]} />
      <meshStandardMaterial color={c} emissive={c} emissiveIntensity={glow} />
    </mesh>
  );
}

/** Dark floor grid in the XZ plane. */
export function Grid({ size = 8, y = 0 }: { size?: number; y?: number }) {
  return <gridHelper args={[size, size * 2, "#3a4d57", "#26343c"]} position={[0, y, 0]} />;
}

/** Axis lines through the origin in maths coordinates (x red, y green, z blue). */
export function Triad({ len = 3.4 }: { len?: number }) {
  return (
    <group>
      <Line points={[[0, 0, 0], [len, 0, 0]]} color={C.red} lineWidth={1.6} />
      <Line points={[[0, 0, 0], [0, 0, -len]]} color={C.green} lineWidth={1.6} />
      <Line points={[[0, 0, 0], [0, len, 0]]} color={C.blue} lineWidth={1.6} />
    </group>
  );
}

/** Bars for a matrix laid out on the floor: entry (i, j) is a box at (ox + j·pitch, ·, oz + i·pitch) whose height is its value (down for negatives); zero entries are flat grey tiles. */
export function matBars(M: number[][], ox: number, oz: number, pitch: number, sc: number, pick?: (i: number, j: number, v: number) => string | undefined, cap = 2.2): { p: V3; s: V3; c: string }[] {
  const out: { p: V3; s: V3; c: string }[] = [], w = pitch * 0.74;
  const R = M.length, Cn = M[0].length;
  for (let i = 0; i < R; i++) for (let j = 0; j < Cn; j++) {
    const v = M[i][j], x = ox + (j - (Cn - 1) / 2) * pitch, z = oz + (i - (R - 1) / 2) * pitch;
    if (Math.abs(v) < 1e-9) { out.push({ p: [x, 0.02, z], s: [w, 0.04, w], c: pick?.(i, j, 0) ?? C.grey }); continue; }
    const h = Math.max(-cap, Math.min(cap, v * sc)), a = Math.max(0.06, Math.abs(h));
    out.push({ p: [x, h >= 0 ? a / 2 : -a / 2, z], s: [w, a, w], c: pick?.(i, j, v) ?? (v > 0 ? C.blue : C.red) });
  }
  return out;
}
