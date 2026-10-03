"use client";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Guard } from "@/labs/Stage";
import { towerHeights } from "./data";

export interface SceneData {
  /** XP for each of the last 7 days, oldest first (today is last). */
  week: number[];
  lit: number;
  slots: number;
  /** 0..1 progress through the current level. */
  levelPct: number;
}

const DARK = "#2b3236";

function Lock({ levelPct, quality }: { levelPct: number; quality: number }) {
  const seg = quality > 0 ? 24 : 14;
  const dark = <meshStandardMaterial color={DARK} metalness={0.35} roughness={0.3} />;
  const bob = useRef<THREE.Group>(null);
  useFrame(({ clock }) => { if (bob.current) bob.current.position.y = Math.sin(clock.elapsedTime * 1.4) * 0.06; });
  return (
    <group ref={bob}>
      {/* soft halo behind the lock */}
      <mesh position={[0, 0, -0.9]}><circleGeometry args={[1.7, 40]} /><meshBasicMaterial color="#44c95a" transparent opacity={0.13} /></mesh>
      {/* level ring: dim track + bright arc that starts at the top */}
      <group position={[0, 0.05, -0.5]} rotation={[0, 0, Math.PI / 2]}>
        <mesh><torusGeometry args={[1.38, 0.045, 10, 64]} /><meshBasicMaterial color="#5b7380" transparent opacity={0.55} /></mesh>
        {levelPct > 0.005 && <mesh><torusGeometry args={[1.38, 0.09, 12, 64, Math.PI * 2 * Math.min(1, levelPct)]} /><meshBasicMaterial color="#6cc4ff" /></mesh>}
      </group>
      <RoundedBox args={[1.5, 1.2, 0.9]} radius={0.26} smoothness={4} position={[0, -0.2, 0]}>
        <meshStandardMaterial color="#44c95a" emissive="#2fa046" emissiveIntensity={0.55} roughness={0.32} />
      </RoundedBox>
      <mesh position={[0, 0.42, 0]}><torusGeometry args={[0.46, 0.13, 14, 36, Math.PI]} />{dark}</mesh>
      {[-0.46, 0.46].map((x) => (<mesh key={x} position={[x, 0.32, 0]}><cylinderGeometry args={[0.13, 0.13, 0.2, 14]} />{dark}</mesh>))}
      {[-0.31, 0.31].map((x) => (
        <group key={x} position={[x, -0.02, 0.45]}>
          <mesh scale={[1, 1, 0.5]}><sphereGeometry args={[0.22, seg, seg]} /><meshStandardMaterial color="#ffffff" roughness={0.2} /></mesh>
          <mesh position={[0.02, -0.01, 0.09]}><sphereGeometry args={[0.1, 14, 14]} /><meshStandardMaterial color="#1f2d33" roughness={0.15} /></mesh>
        </group>
      ))}
      <mesh position={[0, -0.36, 0.45]} rotation={[0, 0, Math.PI]}><torusGeometry args={[0.22, 0.045, 10, 22, Math.PI]} />{dark}</mesh>
    </group>
  );
}

/** Ring of XP orbs: `lit` of them glow gold (today's share of the daily goal), the rest are dim. */
function Orbs({ lit, slots, quality }: { lit: number; slots: number; quality: number }) {
  const ring = useRef<THREE.Group>(null);
  useFrame((_, dt) => { if (ring.current) ring.current.rotation.y += dt * 0.45; });
  const seg = quality > 0 ? 20 : 10;
  return (
    <group rotation={[1.15, 0, 0.3]}>
      <group ref={ring}>
        {Array.from({ length: slots }, (_, i) => {
          const a = (i / slots) * Math.PI * 2;
          const on = i < lit;
          return (
            <mesh key={i} position={[Math.cos(a) * 1.95, 0, Math.sin(a) * 1.95]} scale={on ? 1.15 : 0.8}>
              <sphereGeometry args={[0.15, seg, seg]} />
              {on ? <meshStandardMaterial color="#ffd24d" emissive="#ffb300" emissiveIntensity={1.1} roughness={0.25} /> : <meshStandardMaterial color="#6e8693" transparent opacity={0.55} roughness={0.6} />}
            </mesh>
          );
        })}
      </group>
    </group>
  );
}

/** Seven blocks for the last seven days; heights are real daily XP, today is gold. */
function Tower({ week }: { week: number[] }) {
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const target = useMemo(() => towerHeights(week).map((h) => (h === 0 ? 0.06 : 0.14 + h * 2.1)), [week]);
  useFrame((_, dt) => {
    refs.current.forEach((m, i) => {
      if (!m) return;
      const s = m.scale.y + (target[i] - m.scale.y) * Math.min(1, dt * 4);
      m.scale.y = s; m.position.y = s / 2;
    });
  });
  return (
    <group position={[1.15, -1.2, 0]}>
      <mesh position={[1.25, -0.05, 0]}><boxGeometry args={[3, 0.1, 0.9]} /><meshStandardMaterial color="#cbd5e1" roughness={0.4} metalness={0.1} /></mesh>
      {week.map((v, i) => {
        const today = i === week.length - 1;
        return (
          <mesh key={i} ref={(el) => { refs.current[i] = el; }} position={[i * 0.41, 0.03, 0]} scale={[1, 0.06, 1]}>
            <boxGeometry args={[0.32, 1, 0.5]} />
            <meshStandardMaterial color={today ? "#ffc83d" : v > 0 ? "#2ba6f5" : "#94a3b8"} emissive={today ? "#ffb300" : v > 0 ? "#1476b8" : "#64748b"} emissiveIntensity={today ? 0.6 : v > 0 ? 0.4 : 0.1} roughness={0.3} />
          </mesh>
        );
      })}
    </group>
  );
}

function Rig({ children }: { children: React.ReactNode }) {
  const g = useRef<THREE.Group>(null);
  useFrame(({ pointer }) => {
    if (!g.current) return;
    g.current.rotation.y += (pointer.x * 0.28 - g.current.rotation.y) * 0.06;
    g.current.rotation.x += (-pointer.y * 0.12 - g.current.rotation.x) * 0.06;
  });
  return <group ref={g}>{children}</group>;
}

/** Phones are portrait: pull the camera back until the whole scene fits. */
function Fit() {
  const { camera, size, invalidate } = useThree();
  const aspect = size.width / Math.max(1, size.height);
  const z = Math.min(14, Math.max(8, 7.6 / (0.73 * aspect)));
  useEffect(() => { camera.position.set(0, 0.5, z); camera.lookAt(0, -0.1, 0); invalidate(); }, [camera, z, invalidate]);
  return null;
}

export default function HomeScene3D({ data, active, quality }: { data: SceneData; active: boolean; quality: 0 | 1 }) {
  return (
    <Guard what="Your numbers are still shown in the page.">
      <Canvas
        dpr={quality ? [1, 1.5] : 1}
        frameloop={active ? "always" : "never"}
        camera={{ position: [0, 0.5, 9], fov: 40 }}
        gl={{ antialias: quality > 0, alpha: true, powerPreference: "default", preserveDrawingBuffer: true }}
        style={{ touchAction: "pan-y" }}
      >
        <ambientLight intensity={1.2} color="#ffffff" />
        <directionalLight position={[4, 6, 5]} intensity={1.8} color="#ffffff" />
        <directionalLight position={[-4, 3, -3]} intensity={0.6} color="#9ec5db" />
        <pointLight position={[-3, 1, 3]} intensity={14} color="#44c95a" distance={10} />
        <Fit />
        <Rig>
          <group position={[-1.75, 0, 0]}><Lock levelPct={data.levelPct} quality={quality} /><Orbs lit={data.lit} slots={data.slots} quality={quality} /></group>
          <Tower week={data.week} />
        </Rig>
      </Canvas>
    </Guard>
  );
}
