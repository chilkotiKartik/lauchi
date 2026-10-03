"use client";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { Guard } from "@/labs/Stage";

export interface WaveControl { k: number; yaw: number }

const SIZE = 6;
const LOW = new THREE.Color("#1476b8"), MID = new THREE.Color("#44c95a"), HIGH = new THREE.Color("#ffd24d");

/** z = sin(k r - 2t) / (1 + 0.35 r): a ripple spreading from the centre. Heights are computed here every frame. */
export const rippleHeight = (r: number, k: number, t: number) => Math.sin(k * r - 2 * t) / (1 + 0.35 * r);

function Surface({ control, segs }: { control: RefObject<WaveControl>; segs: number }) {
  const mesh = useRef<THREE.Mesh>(null);
  const grp = useRef<THREE.Group>(null);
  const colors = useMemo(() => new Float32Array((segs + 1) * (segs + 1) * 3), [segs]);
  const c = useMemo(() => new THREE.Color(), []);
  useFrame(({ clock }) => {
    const m = mesh.current, g = grp.current;
    if (!m || !g) return;
    g.rotation.y += (control.current.yaw - g.rotation.y) * 0.12;
    const pos = m.geometry.attributes.position as THREE.BufferAttribute;
    const col = m.geometry.attributes.color as THREE.BufferAttribute;
    const t = clock.elapsedTime, k = control.current.k;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i);
      const h = rippleHeight(Math.hypot(x, y), k, t);
      pos.setZ(i, h * 0.9);
      const u = (h + 1) / 2;
      if (u < 0.5) c.copy(LOW).lerp(MID, u * 2); else c.copy(MID).lerp(HIGH, (u - 0.5) * 2);
      col.setXYZ(i, c.r, c.g, c.b);
    }
    pos.needsUpdate = true; col.needsUpdate = true;
    m.geometry.computeVertexNormals();
  });
  return (
    <group ref={grp} rotation={[0, 0.5, 0]}>
      <mesh ref={mesh} rotation={[-1.05, 0, 0]}>
        <planeGeometry args={[SIZE, SIZE, segs, segs]}>
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        </planeGeometry>
        <meshStandardMaterial vertexColors side={THREE.DoubleSide} roughness={0.45} metalness={0.05} flatShading />
      </mesh>
    </group>
  );
}

function Fit() {
  const { camera, size, invalidate } = useThree();
  const aspect = size.width / Math.max(1, size.height);
  const z = Math.min(16, Math.max(8.5, 7.5 / (0.73 * aspect)));
  useEffect(() => { camera.position.set(0, 2.2, z); camera.lookAt(0, -0.2, 0); invalidate(); }, [camera, z, invalidate]);
  return null;
}

export default function WaveSurface3D({ control, active, quality }: { control: RefObject<WaveControl>; active: boolean; quality: 0 | 1 }) {
  return (
    <Guard what="The formula and slider still work.">
      <Canvas dpr={quality ? [1, 1.25] : 1} frameloop={active ? "always" : "never"} camera={{ position: [0, 2.2, 9], fov: 40 }}
        gl={{ antialias: quality > 0, alpha: true, powerPreference: "high-performance", preserveDrawingBuffer: false }} style={{ touchAction: "pan-y" }}>
        <ambientLight intensity={1.1} />
        <directionalLight position={[3, 6, 4]} intensity={1.8} />
        <Fit />
        <Surface control={control} segs={quality ? 40 : 22} />
      </Canvas>
    </Guard>
  );
}
