"use client";
import { Billboard, RoundedBox, Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { useParam, useParamSelect } from "../params";
import { simulateCMemory } from "../sim/bcay";

export default function CPointer3DScene() {
  const mode = useParamSelect("mode", ["pointer", "array", "malloc", "double"] as const, "pointer");
  const val = useParam("val", 42);
  const cells = simulateCMemory(mode, val);

  const groupRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(clock.elapsedTime * 0.4) * 0.15;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Memory Segment Title Tower */}
      <Billboard position={[0, 2.4, 0]}>
        <Text fontSize={0.32} color="#58cc02" font="/fonts/inter.woff" anchorX="center" anchorY="middle">
          {mode.toUpperCase()} ARCHITECTURE &amp; MEMORY LAYOUT
        </Text>
      </Billboard>

      {/* 3D Stack / Heap Memory Block Boxes */}
      {cells.map((cell, idx) => {
        const xPos = (idx - (cells.length - 1) / 2) * 2.2;
        const isStack = cell.segment === "stack";
        const color = isStack ? (cell.isPointer ? "#1cb0f6" : "#58cc02") : "#ff9a1f";

        return (
          <group key={idx} position={[xPos, 0, 0]}>
            {/* Memory Address Tag */}
            <Billboard position={[0, 1.3, 0]}>
              <Text fontSize={0.2} color="#94a3b8" anchorX="center" anchorY="middle">
                {`0x${cell.address.toString(16).toUpperCase()}`}
              </Text>
            </Billboard>

            {/* Silicon Memory Box */}
            <RoundedBox args={[1.8, 1.4, 1.2]} radius={0.12} smoothness={4}>
              <meshStandardMaterial color={color} roughness={0.3} metalness={0.2} emissive={color} emissiveIntensity={0.25} />
            </RoundedBox>

            {/* Variable Name and Value Label */}
            <Billboard position={[0, 0.2, 0.65]}>
              <Text fontSize={0.26} color="#ffffff" font="/fonts/inter.woff" anchorX="center" anchorY="middle">
                {cell.name}
              </Text>
            </Billboard>
            <Billboard position={[0, -0.3, 0.65]}>
              <Text fontSize={0.22} color="#fef08a" anchorX="center" anchorY="middle">
                {String(cell.value)}
              </Text>
            </Billboard>

            {/* Segment Badge */}
            <Billboard position={[0, -1.0, 0]}>
              <Text fontSize={0.18} color={isStack ? "#60a5fa" : "#fbbf24"} anchorX="center" anchorY="middle">
                [{cell.segment.toUpperCase()} · {cell.bytes}B]
              </Text>
            </Billboard>

            {/* Pointer Dereference Connector Ray */}
            {cell.isPointer && (
              <mesh position={[-1.1, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.04, 0.04, 1.8, 16]} />
                <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={0.8} />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
}
