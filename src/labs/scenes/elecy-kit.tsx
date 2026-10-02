"use client";
/** Small shared parts for the elecy labs: circuit components and a live (per-frame) arrow. Plain geometry only. */
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { Tick } from "../Stage";
import { C, type V3 } from "../kit";
import { Rod } from "../kit2";

const Y = new THREE.Vector3(0, 1, 0);
function orient(a: V3, b: V3) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A), len = Math.max(1e-4, d.length());
  return { pos: A.clone().add(B).multiplyScalar(0.5), quat: new THREE.Quaternion().setFromUnitVectors(Y, d.normalize()), len };
}

/** A resistor body between a and b (leads in grey, ceramic body with colour bands). `glow` 0…1 shows dissipation. */
export function Resistor({ a, b, glow = 0, r = 0.13, body = 0.6 }: { a: V3; b: V3; glow?: number; r?: number; body?: number }) {
  const { pos, quat, len } = useMemo(() => orient(a, b), [a, b]);
  const L = Math.min(len * 0.8, Math.max(0.3, len * body));
  const hot = glow > 0.02 ? C.orange : "#000000";
  return (
    <group position={pos} quaternion={quat}>
      <mesh><cylinderGeometry args={[0.035, 0.035, len, 8]} /><meshStandardMaterial color={C.light} /></mesh>
      <mesh><cylinderGeometry args={[r, r, L, 16]} /><meshStandardMaterial color="#d9b98a" emissive={hot} emissiveIntensity={Math.min(1.2, glow * 1.2)} roughness={0.5} /></mesh>
      {[-0.28, -0.1, 0.1].map((k, i) => (
        <mesh key={i} position={[0, k * L, 0]}><cylinderGeometry args={[r * 1.04, r * 1.04, L * 0.08, 16]} /><meshStandardMaterial color={[C.red, C.purple, C.gold][i]} /></mesh>
      ))}
    </group>
  );
}

/** A battery (cell) from its − end a to its + end b. */
export function Cell({ a, b, r = 0.22, color = C.green, glow = 0.15 }: { a: V3; b: V3; r?: number; color?: string; glow?: number }) {
  const { pos, quat, len } = useMemo(() => orient(a, b), [a, b]);
  return (
    <group position={pos} quaternion={quat}>
      <mesh position={[0, -len * 0.08, 0]}><cylinderGeometry args={[r, r, len * 0.84, 20]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={glow} roughness={0.35} /></mesh>
      <mesh position={[0, len * 0.4, 0]}><cylinderGeometry args={[r * 0.35, r * 0.35, len * 0.16, 12]} /><meshStandardMaterial color={C.gold} emissive={C.gold} emissiveIntensity={0.3} /></mesh>
      <mesh position={[0, len * 0.27, 0]}><cylinderGeometry args={[r * 1.02, r * 1.02, len * 0.08, 20]} /><meshStandardMaterial color={C.red} /></mesh>
    </group>
  );
}

/** A plain wire between points. */
export function Wire({ pts, c = C.light, r = 0.035, glow = 0 }: { pts: V3[]; c?: string; r?: number; glow?: number }) {
  return <>{pts.slice(1).map((p, i) => <Rod key={i} a={pts[i]} b={p} r={r} color={c} glow={glow} />)}</>;
}

/** Junction dot. */
export function Node({ p, c = C.white, r = 0.08 }: { p: V3; c?: string; r?: number }) {
  return <mesh position={p}><sphereGeometry args={[r, 12, 12]} /><meshStandardMaterial color={c} emissive={c} emissiveIntensity={0.4} /></mesh>;
}

/** Output of a LiveArrow getter: angle (rad, about +z from +x) and length. */
export type ArrowState = { a: number; l: number };
/**
 * An arrow in the x–y plane from the origin of its group, re-aimed every frame by `get` (which fills the given object).
 * Nothing is allocated per frame.
 */
export function LiveArrow({ get, color, r = 0.05, head = 0.22 }: { get: (o: ArrowState) => void; color: string; r?: number; head?: number }) {
  const g = useRef<THREE.Group>(null), shaft = useRef<THREE.Mesh>(null), tip = useRef<THREE.Mesh>(null), st = useRef<ArrowState>({ a: 0, l: 1 });
  const tick = () => {
    get(st.current);
    const l = Math.max(0, st.current.l), h = Math.min(head, l * 0.5), s = Math.max(1e-3, l - h);
    if (g.current) { g.current.rotation.z = st.current.a; g.current.visible = l > 0.02; }
    if (shaft.current) { shaft.current.scale.set(1, s, 1); shaft.current.position.x = s / 2; }
    if (tip.current) { tip.current.scale.set(h / head || 1e-3, h / head || 1e-3, h / head || 1e-3); tip.current.position.x = s + h / 2; }
  };
  return (
    <group ref={g}>
      <Tick fn={tick} />
      <mesh ref={shaft} rotation={[0, 0, -Math.PI / 2]}><cylinderGeometry args={[r, r, 1, 8]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.45} /></mesh>
      <mesh ref={tip} rotation={[0, 0, -Math.PI / 2]}><coneGeometry args={[r * 2.8, head, 12]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.45} /></mesh>
    </group>
  );
}

/** A flat triangle (or any convex polygon) in the x–y plane, extruded a little for depth. */
export function Slab({ pts, color, depth = 0.12, o = 0.85, z = 0 }: { pts: [number, number][]; color: string; depth?: number; o?: number; z?: number }) {
  const geo = useMemo(() => {
    const s = new THREE.Shape();
    pts.forEach(([x, y], i) => (i === 0 ? s.moveTo(x, y) : s.lineTo(x, y)));
    s.closePath();
    return new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false });
  }, [pts, depth]);
  return <mesh geometry={geo} position={[0, 0, z - depth / 2]}><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.25} transparent={o < 1} opacity={o} roughness={0.5} /></mesh>;
}

const _o = new THREE.Object3D();
function cumLen(path: V3[]) {
  const c = [0];
  for (let i = 1; i < path.length; i++) c.push(c[i - 1] + Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1], path[i][2] - path[i - 1][2]));
  return c;
}
function paintAc(m: THREE.InstancedMesh, path: V3[], cum: number[], n: number, off: number) {
  const L = cum[cum.length - 1] || 1;
  for (let k = 0; k < n; k++) {
    const s = ((((k + 0.5) / n + off) % 1) + 1) % 1 * L;
    let i = 1;
    while (i < cum.length - 1 && cum[i] < s) i++;
    const a = path[i - 1], b = path[i], f = (s - cum[i - 1]) / (cum[i] - cum[i - 1] || 1);
    _o.position.set(a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f);
    _o.updateMatrix(); m.setMatrixAt(k, _o.matrix);
  }
  m.count = n;
  m.instanceMatrix.needsUpdate = true;
}
/**
 * Charges that shuttle back and forth along a path like an alternating current: displacement = amp·sin(θ − lag),
 * where θ is read from `theta` (a ref the scene advances) and amp is in fractions of the path length.
 */
export function AcFlow({ path, n = 14, amp, lag = 0, theta, color = C.gold, r = 0.06 }: { path: V3[]; n?: number; amp: number; lag?: number; theta: { current: number }; color?: string; r?: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const cum = useMemo(() => cumLen(path), [path]);
  const count = Math.max(1, Math.min(40, Math.round(n)));
  const tick = () => { if (ref.current) paintAc(ref.current, path, cum, count, amp * Math.sin(theta.current - lag)); };
  return (
    <>
      <Tick fn={tick} />
      <instancedMesh ref={ref} args={[undefined, undefined, 40]} frustumCulled={false}>
        <sphereGeometry args={[r, 10, 10]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.7} />
      </instancedMesh>
    </>
  );
}

/** A parallel-plate capacitor between a and b (plates normal to a→b). */
export function Capacitor({ a, b, c = C.blue, size = 0.5 }: { a: V3; b: V3; c?: string; size?: number }) {
  const { pos, quat, len } = useMemo(() => orient(a, b), [a, b]);
  const gap = Math.min(0.16, len * 0.2);
  return (
    <group position={pos} quaternion={quat}>
      <mesh position={[0, -(len + gap) / 4, 0]}><cylinderGeometry args={[0.035, 0.035, (len - gap) / 2, 8]} /><meshStandardMaterial color={C.light} /></mesh>
      <mesh position={[0, (len + gap) / 4, 0]}><cylinderGeometry args={[0.035, 0.035, (len - gap) / 2, 8]} /><meshStandardMaterial color={C.light} /></mesh>
      <mesh position={[0, -gap / 2, 0]}><boxGeometry args={[size, 0.05, size]} /><meshStandardMaterial color={c} emissive={c} emissiveIntensity={0.35} /></mesh>
      <mesh position={[0, gap / 2, 0]}><boxGeometry args={[size, 0.05, size]} /><meshStandardMaterial color={c} emissive={c} emissiveIntensity={0.35} /></mesh>
    </group>
  );
}
