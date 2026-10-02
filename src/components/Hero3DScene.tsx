"use client";
import { Billboard, RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { Stage } from "@/labs/Stage";

/** A round badge with a maths symbol, drawn once into a small canvas (no network, no font files). */
function badge(symbol: string, color: string) {
  const c = document.createElement("canvas"); c.width = c.height = 128;
  const x = c.getContext("2d")!;
  x.fillStyle = color; x.beginPath(); x.arc(64, 64, 62, 0, Math.PI * 2); x.fill();
  x.fillStyle = "rgba(0,0,0,.16)"; x.beginPath(); x.arc(64, 64, 62, 0, Math.PI); x.fill(); // lower half a shade darker, like the reference
  x.fillStyle = "#fff"; x.font = "900 70px Nunito, Arial, sans-serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(symbol, 64, 70);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const ORBS = [["Σ", "#e5484d", 0], ["∫", "#2ba6f5", 1.26], ["∂", "#44c95a", 2.51], ["Ω", "#a970ff", 3.77], ["λ", "#ff9a1f", 5.03]] as const;

function Orbs() {
  const refs = useRef<(THREE.Group | null)[]>([]);
  const maps = useMemo(() => ORBS.map(([s, c]) => badge(s, c)), []);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime * 0.35;
    ORBS.forEach(([, , a], i) => {
      const g = refs.current[i]; if (!g) return;
      const ang = a + t;
      g.position.set(Math.cos(ang) * 2.15, Math.sin(ang * 1.7) * 0.55 + (i % 2 ? 0.35 : -0.25), Math.sin(ang) * 1.5 - 0.2);
    });
  });
  return (
    <>
      {ORBS.map(([s], i) => (
        <group key={s} ref={(el) => { refs.current[i] = el; }}>
          <Billboard><mesh><circleGeometry args={[0.34, 40]} /><meshBasicMaterial map={maps[i]} transparent /></mesh></Billboard>
        </group>
      ))}
    </>
  );
}

function Padlock() {
  const g = useRef<THREE.Group>(null);
  useFrame(({ clock, pointer }) => {
    const t = clock.elapsedTime;
    if (!g.current) return;
    g.current.rotation.y += ((Math.sin(t * 0.8) * 0.4 + pointer.x * 0.55) - g.current.rotation.y) * 0.08;
    g.current.rotation.x += ((-pointer.y * 0.25) - g.current.rotation.x) * 0.08;
    g.current.position.y = Math.sin(t * 1.5) * 0.07;
  });
  const dark = <meshStandardMaterial color="#2b3236" metalness={0.35} roughness={0.28} />;
  return (
    <group ref={g}>
      <RoundedBox args={[2, 1.6, 1.2]} radius={0.34} smoothness={5} position={[0, -0.25, 0]}>
        <meshStandardMaterial color="#44c95a" emissive="#2fa046" emissiveIntensity={0.45} roughness={0.32} metalness={0.05} />
      </RoundedBox>
      <mesh position={[0, 0.55, 0]}><torusGeometry args={[0.62, 0.17, 20, 48, Math.PI]} />{dark}</mesh>
      {[-0.62, 0.62].map((x) => (<mesh key={x} position={[x, 0.42, 0]}><cylinderGeometry args={[0.17, 0.17, 0.28, 20]} />{dark}</mesh>))}
      {[-0.42, 0.42].map((x) => (
        <group key={x} position={[x, -0.02, 0.6]}>
          <mesh scale={[1, 1, 0.5]}><sphereGeometry args={[0.3, 28, 28]} /><meshStandardMaterial color="#ffffff" roughness={0.2} /></mesh>
          <mesh position={[0.03, -0.02, 0.12]}><sphereGeometry args={[0.14, 20, 20]} /><meshStandardMaterial color="#1f2d33" roughness={0.15} /></mesh>
          <mesh position={[0.07, 0.04, 0.24]}><sphereGeometry args={[0.04, 10, 10]} /><meshBasicMaterial color="#ffffff" /></mesh>
        </group>
      ))}
      {[-0.82, 0.82].map((x) => (<mesh key={x} position={[x, -0.34, 0.58]} scale={[1, 0.7, 0.3]}><sphereGeometry args={[0.17, 16, 16]} /><meshStandardMaterial color="#ff8fa3" roughness={0.6} /></mesh>))}
      <mesh position={[0, -0.5, 0.6]} rotation={[0, 0, Math.PI]}><torusGeometry args={[0.3, 0.06, 12, 28, Math.PI]} />{dark}</mesh>
    </group>
  );
}

function Ground() {
  return (
    <>
      <mesh position={[0, -1.55, -0.2]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[1.7, 48]} /><meshBasicMaterial color="#000000" transparent opacity={0.16} /></mesh>
      <mesh position={[0, 0, -1.5]}><circleGeometry args={[2.6, 48]} /><meshBasicMaterial color="#44c95a" transparent opacity={0.1} /></mesh>
    </>
  );
}

export default function Hero3DScene({ big = false }: { big?: boolean }) {
  return (
    <Stage variant="hero" size={big ? "big" : "small"} label="Lochi, the lockin. padlock mascot, rotating in 3D with maths badges orbiting it" playing camera={[0, 0.2, big ? 6.4 : 5.2]}>
      <Ground />
      <Padlock />
      <Orbs />
    </Stage>
  );
}
