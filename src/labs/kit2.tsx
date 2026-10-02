"use client";
/** Extra building blocks for the core-subject labs: arrows, live graphs, flowing charges, dials and coils. Plain geometry only. */
import { Line } from "@react-three/drei";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Tick } from "./Stage";
import { C, Panel, type V3 } from "./kit";

export { C };
export type XY = [number, number];

/** A solid arrow from `from` to `to`. */
export function Arrow({ from, to, color, r = 0.04, head = 0.24 }: { from: V3; to: V3; color: string; r?: number; head?: number }) {
  const { pos, quat, len } = useMemo(() => {
    const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to), d = b.clone().sub(a), l = Math.max(1e-4, d.length());
    return { pos: a.clone().add(b).multiplyScalar(0.5), quat: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()), len: l };
  }, [from, to]);
  const h = Math.min(head, len * 0.6);
  return (
    <group position={pos} quaternion={quat}>
      <mesh position={[0, -h / 2, 0]}><cylinderGeometry args={[r, r, Math.max(0.001, len - h), 8]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.25} /></mesh>
      <mesh position={[0, len / 2 - h / 2, 0]}><coneGeometry args={[r * 2.8, h, 12]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.25} /></mesh>
    </group>
  );
}

export type Curve = { pts: XY[]; color: string; w?: number; dashed?: boolean };
/**
 * A 2-D graph standing in the 3-D scene. Data coordinates in `xr` × `yr` map onto a w × h panel whose lower-left corner is (x0, y0).
 * Points outside the range are clamped to the frame.
 */
export function Graph({ x0, y0, w, h, z = 0, xr, yr, curves, marker, grid = 4, bg = "#16303b", markerColor = C.red, vlines = [] }: {
  x0: number; y0: number; w: number; h: number; z?: number; xr: XY; yr: XY; curves: Curve[]; marker?: XY | null; grid?: number; bg?: string; markerColor?: string; vlines?: { x: number; color: string }[];
}) {
  const map = (p: XY): V3 => {
    const fx = (p[0] - xr[0]) / (xr[1] - xr[0] || 1), fy = (p[1] - yr[0]) / (yr[1] - yr[0] || 1);
    return [x0 + w * Math.min(1, Math.max(0, fx)), y0 + h * Math.min(1, Math.max(0, fy)), z + 0.01];
  };
  const gridPts = useMemo(() => {
    const pts: number[] = [];
    for (let i = 1; i < grid; i++) {
      const gx = x0 + (w * i) / grid, gy = y0 + (h * i) / grid;
      pts.push(gx, y0, z + 0.005, gx, y0 + h, z + 0.005, x0, gy, z + 0.005, x0 + w, gy, z + 0.005);
    }
    return new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  }, [x0, y0, w, h, z, grid]);
  const zeroY = yr[0] < 0 && yr[1] > 0 ? y0 + h * (-yr[0] / (yr[1] - yr[0])) : null;
  const zeroX = xr[0] < 0 && xr[1] > 0 ? x0 + w * (-xr[0] / (xr[1] - xr[0])) : null;
  return (
    <group>
      <Panel p={[x0 + w / 2, y0 + h / 2, z - 0.01]} w={w + 0.3} h={h + 0.3} c={bg} />
      <lineSegments geometry={gridPts}><lineBasicMaterial color="#2c4b57" /></lineSegments>
      <Line points={[[x0, zeroY ?? y0, z], [x0 + w, zeroY ?? y0, z]]} color={C.light} lineWidth={1.6} />
      <Line points={[[zeroX ?? x0, y0, z], [zeroX ?? x0, y0 + h, z]]} color={C.light} lineWidth={1.6} />
      {vlines.map((v, i) => <Line key={i} points={[map([v.x, yr[0]]), map([v.x, yr[1]])]} color={v.color} lineWidth={1.2} dashed dashSize={0.08} gapSize={0.06} />)}
      {curves.map((c, i) => c.pts.length > 1 ? <Line key={i} points={c.pts.map(map)} color={c.color} lineWidth={c.w ?? 2.6} dashed={c.dashed} dashSize={0.1} gapSize={0.07} /> : null)}
      {marker && <Pulse p={map(marker)} color={markerColor} />}
    </group>
  );
}

/** A glowing dot that gently pulses (operating point, probe, etc.). */
export function Pulse({ p, color = C.red, r = 0.11 }: { p: V3; color?: string; r?: number }) {
  const m = useRef<THREE.Mesh>(null), t = useRef(0);
  return (
    <mesh ref={m} position={p}>
      <Tick fn={(dt) => { t.current += Math.min(dt, 0.05); m.current?.scale.setScalar(1 + 0.2 * Math.sin(t.current * 4)); }} />
      <sphereGeometry args={[r, 16, 16]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} />
    </mesh>
  );
}

const _o = new THREE.Object3D();
function pathLength(path: V3[]) {
  const seg: number[] = [0];
  for (let i = 1; i < path.length; i++) seg.push(seg[i - 1] + Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1], path[i][2] - path[i - 1][2]));
  return seg;
}
function paintFlow(mesh: THREE.InstancedMesh, path: V3[], cum: number[], n: number, phase: number) {
  const L = cum[cum.length - 1] || 1;
  for (let k = 0; k < mesh.count; k++) {
    if (k >= n) { _o.position.set(0, -999, 0); _o.scale.setScalar(0.0001); _o.updateMatrix(); mesh.setMatrixAt(k, _o.matrix); continue; }
    let s = (((k / n + phase) % 1) + 1) % 1 * L, i = 1;
    while (i < cum.length - 1 && cum[i] < s) i++;
    const a = path[i - 1], b = path[i], f = (s - cum[i - 1]) / (cum[i] - cum[i - 1] || 1);
    _o.position.set(a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f);
    _o.scale.setScalar(1); _o.updateMatrix(); mesh.setMatrixAt(k, _o.matrix);
    s = 0;
  }
  mesh.instanceMatrix.needsUpdate = true;
}
/** Dots (charges, particles, fluid) moving along a polyline; `speed` in loops per second, negative reverses. */
export function Flow({ path, n = 16, speed = 0.25, color = C.gold, r = 0.07, cap = 48 }: { path: V3[]; n?: number; speed?: number; color?: string; r?: number; cap?: number }) {
  const ref = useRef<THREE.InstancedMesh>(null), phase = useRef(0);
  const cum = useMemo(() => pathLength(path), [path]);
  const count = Math.min(cap, Math.max(0, Math.round(n)));
  useLayoutEffect(() => { if (ref.current) paintFlow(ref.current, path, cum, count, phase.current); }, [path, cum, count]);
  const tick = (dt: number) => { phase.current += Math.min(dt, 0.05) * speed; if (ref.current) paintFlow(ref.current, path, cum, count, phase.current); };
  return (
    <>
      <Tick fn={tick} />
      <instancedMesh ref={ref} args={[undefined, undefined, cap]} frustumCulled={false}>
        <sphereGeometry args={[r, 10, 10]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.7} />
      </instancedMesh>
    </>
  );
}

/** An analogue meter: arc scale plus a needle at `f` (0 … 1 of full scale). */
export function Dial({ p, f, color = C.gold, size = 0.8, face = "#e8f1f5" }: { p: V3; f: number; color?: string; size?: number; face?: string }) {
  const ang = Math.PI * (0.85 - 0.7 * Math.min(1, Math.max(0, f)));
  const arc = useMemo(() => Array.from({ length: 25 }, (_, i) => { const a = Math.PI * (0.85 - 0.7 * (i / 24)); return [Math.cos(a) * size * 0.8, Math.sin(a) * size * 0.8 - size * 0.25, 0.03] as V3; }), [size]);
  return (
    <group position={p}>
      <mesh><boxGeometry args={[size * 2.1, size * 1.5, 0.12]} /><meshStandardMaterial color="#33454e" /></mesh>
      <mesh position={[0, 0.05, 0.065]}><planeGeometry args={[size * 1.9, size * 1.2]} /><meshBasicMaterial color={face} /></mesh>
      <group position={[0, 0.05, 0.07]}>
        <Line points={arc} color="#5b6d77" lineWidth={2} />
        <Line points={[[0, -size * 0.25, 0.01], [Math.cos(ang) * size * 0.85, Math.sin(ang) * size * 0.85 - size * 0.25, 0.01]]} color={color} lineWidth={3} />
        <mesh position={[0, -size * 0.25, 0.01]}><circleGeometry args={[0.05, 12]} /><meshBasicMaterial color="#1f2d33" /></mesh>
      </group>
    </group>
  );
}

/** A helical coil along the x axis. */
export function Coil({ p, turns = 8, r = 0.35, len = 1.6, color = C.orange, w = 2.4 }: { p: V3; turns?: number; r?: number; len?: number; color?: string; w?: number }) {
  const pts = useMemo(() => Array.from({ length: turns * 24 + 1 }, (_, i) => { const t = i / 24; return [p[0] - len / 2 + (len * i) / (turns * 24), p[1] + r * Math.cos(t * 2 * Math.PI), p[2] + r * Math.sin(t * 2 * Math.PI)] as V3; }), [p, turns, r, len]);
  return <Line points={pts} color={color} lineWidth={w} />;
}

/** A cylinder between two points (pipes, rods, members). */
export function Rod({ a, b, r = 0.06, color = C.light, glow = 0, o = 1 }: { a: V3; b: V3; r?: number; color?: string; glow?: number; o?: number }) {
  const { pos, quat, len } = useMemo(() => {
    const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A);
    return { pos: A.clone().add(B).multiplyScalar(0.5), quat: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize()), len: Math.max(1e-4, d.length()) };
  }, [a, b]);
  return (
    <mesh position={pos} quaternion={quat}>
      <cylinderGeometry args={[r, r, len, 12]} />
      <meshStandardMaterial color={color} emissive={glow > 0 ? color : "#000000"} emissiveIntensity={glow} transparent={o < 1} opacity={o} roughness={0.45} />
    </mesh>
  );
}

/** Interpolates between two hex colours (0 → a, 1 → b). */
export function mix(a: string, b: string, t: number) {
  return "#" + new THREE.Color(a).lerp(new THREE.Color(b), Math.min(1, Math.max(0, t))).getHexString();
}

/** Samples y = f(x) on [a, b]. */
export function sample(f: (x: number) => number, a: number, b: number, n = 120): XY[] {
  const out: XY[] = [];
  for (let i = 0; i <= n; i++) { const x = a + ((b - a) * i) / n, y = f(x); if (Number.isFinite(y)) out.push([x, y]); }
  return out;
}
