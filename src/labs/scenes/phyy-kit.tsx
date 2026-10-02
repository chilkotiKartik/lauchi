"use client";
/** Shared pieces for the phyy labs: oscillating field sticks and circles. Plain geometry only. */
import { Line } from "@react-three/drei";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Tick } from "../Stage";
import type { V3 } from "../kit";

const _o = new THREE.Object3D(), _q = new THREE.Quaternion(), _y = new THREE.Vector3(0, 1, 0), _v = new THREE.Vector3();

export type StickWave = { o: V3; d: V3; vib: V3; len: number; amp: number; k: number; phase: number };
/** Paints n sticks along o + d·s, each pointing along `vib` with signed length amp·sin(k s − phase). */
function paintSticks(m: THREE.InstancedMesh, w: StickWave, n: number, t: number) {
  _q.setFromUnitVectors(_y, _v.set(w.vib[0], w.vib[1], w.vib[2]).normalize());
  for (let i = 0; i < n; i++) {
    const s = (w.len * i) / Math.max(1, n - 1), a = w.amp * Math.sin(w.k * s - t - w.phase);
    _o.position.set(w.o[0] + w.d[0] * s + (w.vib[0] * a) / 2, w.o[1] + w.d[1] * s + (w.vib[1] * a) / 2, w.o[2] + w.d[2] * s + (w.vib[2] * a) / 2);
    _o.quaternion.copy(_q);
    _o.scale.set(1, Math.max(0.001, Math.abs(a)), 1);
    _o.updateMatrix(); m.setMatrixAt(i, _o.matrix);
  }
  m.instanceMatrix.needsUpdate = true;
}

/** A travelling field wave drawn as sticks (like E or H vectors along a ray). `speed` in rad/s; pass playing=false to freeze. */
export function Sticks({ w, n = 36, color, speed = 3, r = 0.025, glow = 0.4 }: { w: StickWave; n?: number; color: string; speed?: number; r?: number; glow?: number }) {
  const ref = useRef<THREE.InstancedMesh>(null), t = useRef(0);
  useLayoutEffect(() => { if (ref.current) paintSticks(ref.current, w, n, t.current); }, [w, n]);
  const tick = (dt: number) => { t.current += Math.min(dt, 0.05) * speed; if (ref.current) paintSticks(ref.current, w, n, t.current); };
  return (<>
    <Tick fn={tick} />
    <instancedMesh ref={ref} args={[undefined, undefined, n]} frustumCulled={false}>
      <cylinderGeometry args={[r, r, 1, 6]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={glow} />
    </instancedMesh>
  </>);
}

/** A circle of radius r centred at p, in the plane perpendicular to `axis`. */
export function Circle({ p, r, axis = "x", color, w = 2, dashed = false, seg = 64 }: { p: V3; r: number; axis?: "x" | "y" | "z"; color: string; w?: number; dashed?: boolean; seg?: number }) {
  const pts = useMemo(() => Array.from({ length: seg + 1 }, (_, i) => {
    const a = (i / seg) * Math.PI * 2, c = Math.cos(a) * r, s = Math.sin(a) * r;
    return (axis === "x" ? [p[0], p[1] + c, p[2] + s] : axis === "y" ? [p[0] + c, p[1], p[2] + s] : [p[0] + c, p[1] + s, p[2]]) as V3;
  }), [p, r, axis, seg]);
  return <Line points={pts} color={color} lineWidth={w} dashed={dashed} dashSize={0.12} gapSize={0.08} />;
}
