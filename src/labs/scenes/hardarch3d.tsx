"use client";
import { Billboard, RoundedBox, Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { useParam, useParamSelect } from "../params";
import { computeHardwareBusMetrics } from "../sim/bcay";

export default function HardArch3DScene() {
  const cpuGhz = useParam("cpuGhz", 3.6);
  const ddrGen = useParamSelect("ddrGen", ["3", "4", "5"] as const, "4");
  const pcieLanes = useParam("pcieLanes", 16);

  const metrics = computeHardwareBusMetrics(cpuGhz, parseInt(ddrGen, 10), pcieLanes);

  const packetRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (packetRef.current) {
      const t = (clock.elapsedTime * 2.5) % 4;
      packetRef.current.position.x = -2 + t;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Motherboard PCB Substrate */}
      <RoundedBox args={[7.5, 0.2, 5.5]} radius={0.1} smoothness={4} position={[0, -0.6, 0]}>
        <meshStandardMaterial color="#064e3b" roughness={0.4} metalness={0.1} />
      </RoundedBox>

      {/* CPU Socket & Heatspreader */}
      <group position={[-1.8, 0, 0]}>
        <RoundedBox args={[1.8, 0.4, 1.8]} radius={0.08} smoothness={4}>
          <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
        </RoundedBox>
        <Billboard position={[0, 0.4, 0]}>
          <Text fontSize={0.24} color="#f8fafc" font="/fonts/inter.woff" anchorX="center" anchorY="middle">
            CPU ({cpuGhz} GHz)
          </Text>
        </Billboard>
      </group>

      {/* RAM DIMM Slots */}
      <group position={[0.4, 0, 1.2]}>
        {[-0.3, 0, 0.3].map((zOffset, i) => (
          <RoundedBox key={i} args={[2.2, 0.6, 0.12]} radius={0.02} smoothness={2} position={[0, 0.1, zOffset]}>
            <meshStandardMaterial color="#1e3a8a" roughness={0.3} metalness={0.3} />
          </RoundedBox>
        ))}
        <Billboard position={[0, 0.65, 0]}>
          <Text fontSize={0.2} color="#38bdf8" anchorX="center" anchorY="middle">
            DDR{ddrGen} RAM ({metrics.ramBandwidthGbs} GB/s)
          </Text>
        </Billboard>
      </group>

      {/* PCIe x16 Slot */}
      <group position={[0.4, 0, -1.4]}>
        <RoundedBox args={[3.2, 0.35, 0.25]} radius={0.04} smoothness={2}>
          <meshStandardMaterial color="#1e293b" metalness={0.5} roughness={0.3} />
        </RoundedBox>
        <Billboard position={[0, 0.45, 0]}>
          <Text fontSize={0.2} color="#a855f7" anchorX="center" anchorY="middle">
            PCIe Gen4 x{pcieLanes} ({metrics.pcieBandwidthGbs} GB/s)
          </Text>
        </Billboard>
      </group>

      {/* Active High-Speed Data Highway Bus */}
      <mesh position={[0, -0.45, 0]}>
        <boxGeometry args={[4.5, 0.05, 0.2]} />
        <meshStandardMaterial color="#eab308" emissive="#ca8a04" emissiveIntensity={0.6} />
      </mesh>

      {/* Live Data Pulse Packet */}
      <mesh ref={packetRef} position={[-2, -0.38, 0]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color="#58cc02" emissive="#22c55e" emissiveIntensity={1.2} />
      </mesh>
    </group>
  );
}
