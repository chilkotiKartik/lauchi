"use client";
/** Small helpers shared by the chemy labs: per-frame placement of rods/arrows through refs (no allocation per frame). */
import * as THREE from "three";

const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _d = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0);

/** Stretches a unit cylinder mesh (height 1, along y) between two points with radius scale r. */
export function placeRod(m: THREE.Object3D | null, ax: number, ay: number, az: number, bx: number, by: number, bz: number, r = 1) {
  if (!m) return;
  _a.set(ax, ay, az); _b.set(bx, by, bz); _d.subVectors(_b, _a);
  const len = Math.max(1e-4, _d.length());
  m.position.addVectors(_a, _b).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(_up, _d.multiplyScalar(1 / len));
  m.scale.set(r, len, r);
}

/** Aims a two-mesh arrow (unit cylinder shaft + unit cone head) from (x, y, z) along (vx, vy, vz). Hidden when tiny. */
export function aimArrow(shaft: THREE.Object3D | null, head: THREE.Object3D | null, x: number, y: number, z: number, vx: number, vy: number, vz: number, r = 0.05) {
  if (!shaft || !head) return;
  const len = Math.hypot(vx, vy, vz);
  const vis = len > 0.04;
  shaft.visible = vis; head.visible = vis;
  if (!vis) return;
  const h = Math.min(0.28, len * 0.45), ux = vx / len, uy = vy / len, uz = vz / len;
  placeRod(shaft, x, y, z, x + ux * (len - h), y + uy * (len - h), z + uz * (len - h), r);
  placeRod(head, x + ux * (len - h), y + uy * (len - h), z + uz * (len - h), x + vx, y + vy, z + vz, r * 2.8);
}

/** A unit cylinder mesh (radius 1, height 1) for placeRod. */
export function RodMesh({ color, glow = 0, o = 1, refCb }: { color: string; glow?: number; o?: number; refCb: (m: THREE.Mesh | null) => void }) {
  return (
    <mesh ref={refCb}>
      <cylinderGeometry args={[1, 1, 1, 12]} />
      <meshStandardMaterial color={color} emissive={glow > 0 ? color : "#000000"} emissiveIntensity={glow} transparent={o < 1} opacity={o} roughness={0.4} />
    </mesh>
  );
}

/** An arrow made of a unit shaft and a unit cone, aimed each frame with aimArrow. */
export function LiveArrow({ color, shaftRef, headRef }: { color: string; shaftRef: (m: THREE.Mesh | null) => void; headRef: (m: THREE.Mesh | null) => void }) {
  return (
    <>
      <mesh ref={shaftRef} visible={false}><cylinderGeometry args={[1, 1, 1, 10]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.45} /></mesh>
      <mesh ref={headRef} visible={false}><coneGeometry args={[1, 1, 14]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.45} /></mesh>
    </>
  );
}

/** Element colours (CPK-like, tuned to the app palette). */
export const EL: Record<string, string> = { H: "#e8f1f5", C: "#5b6d77", O: "#ff5a5f", N: "#2ba6f5", S: "#ffc83d", Cl: "#44c95a" };
