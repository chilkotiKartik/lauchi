"use client";
import { Billboard, RoundedBox, Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { useParam, useParamSelect } from "../params";
import { simulateSDLC } from "../sim/bcay";

export default function SDLC3DScene() {
  const model = useParamSelect("model", ["waterfall", "spiral", "agile"] as const, "agile");
  const phase = useParam("phase", 2);

  const state = simulateSDLC(model, phase);
  const ringRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (ringRef.current && model === "spiral") {
      ringRef.current.rotation.y = clock.elapsedTime * 0.5;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Title */}
      <Billboard position={[0, 2.3, 0]}>
        <Text fontSize={0.3} color="#38bdf8" font="/fonts/inter.woff" anchorX="center" anchorY="middle">
          {model.toUpperCase()} MODEL LIFECYCLE
        </Text>
      </Billboard>

      {/* Model Phase Cylinders & Steps */}
      {model === "waterfall" ? (
        <group position={[-2.4, 0, 0]}>
          {["Reqs", "Design", "Code", "Test", "Deploy"].map((name, i) => {
            const active = i === Math.min(phase, 4);
            return (
              <group key={name} position={[i * 1.2, -i * 0.35, 0]}>
                <RoundedBox args={[1.0, 0.45, 0.8]} radius={0.06} smoothness={3}>
                  <meshStandardMaterial
                    color={active ? "#58cc02" : i < phase ? "#1cb0f6" : "#64748b"}
                    emissive={active ? "#22c55e" : "#000000"}
                    emissiveIntensity={active ? 0.6 : 0}
                  />
                </RoundedBox>
                <Billboard position={[0, 0.4, 0]}>
                  <Text fontSize={0.18} color="#f8fafc" anchorX="center" anchorY="middle">
                    {name}
                  </Text>
                </Billboard>
              </group>
            );
          })}
        </group>
      ) : (
        <group ref={ringRef} position={[0, 0, 0]}>
          {/* Spiral / Scrum Circular Sprint Track */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[1.8, 0.12, 16, 64]} />
            <meshStandardMaterial color="#6366f1" emissive="#4f46e5" emissiveIntensity={0.5} roughness={0.3} />
          </mesh>

          {/* Active Sprint Milestone Flag */}
          <group position={[1.8, 0.4, 0]}>
            <RoundedBox args={[0.8, 0.8, 0.8]} radius={0.1} smoothness={4}>
              <meshStandardMaterial color="#58cc02" emissive="#22c55e" emissiveIntensity={0.8} />
            </RoundedBox>
            <Billboard position={[0, 0.7, 0]}>
              <Text fontSize={0.22} color="#ffffff" font="/fonts/inter.woff" anchorX="center" anchorY="middle">
                Sprint #{phase}
              </Text>
            </Billboard>
          </group>
        </group>
      )}

      {/* Metrics Banner */}
      <Billboard position={[0, -1.6, 0]}>
        <Text fontSize={0.22} color="#fef08a" anchorX="center" anchorY="middle">
          {`Status: ${state.currentPhase} (${state.progressPct}%)`}
        </Text>
      </Billboard>
      <Billboard position={[0, -2.0, 0]}>
        <Text fontSize={0.18} color="#94a3b8" anchorX="center" anchorY="middle">
          {state.flexibility}
        </Text>
      </Billboard>
    </group>
  );
}
