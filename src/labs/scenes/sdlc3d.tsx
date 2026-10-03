"use client";
import { Billboard, RoundedBox, Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { useLabParams } from "../params";
import { BCAY_SPECS } from "../meta/bcay.specs";
import { LabFrame, Pick, Slider } from "../ui";
import { simulateSDLC } from "../sim/bcay";

export default function SDLC3DLab() {
  const [P, set, reset] = useLabParams(BCAY_SPECS.sdlc3d);
  const { model, phase } = P;
  const state = simulateSDLC(model, phase);
  const ringRef = useRef<THREE.Group>(null);

  return (
    <LabFrame
      label="3D Software Engineering lifecycle workflows, sprints, agile iterations, and waterfall stages"
      camera={[0, 1.5, 7.5]}
      onReset={reset}
      scene={() => (
        <group position={[0, 0, 0]}>
          <Billboard position={[0, 2.3, 0]}>
            <Text fontSize={0.32} color="#38bdf8" anchorX="center" anchorY="middle">
              {`${model.toUpperCase()} MODEL LIFECYCLE`}
            </Text>
          </Billboard>

          {model === "waterfall" ? (
            <group position={[-2.4, 0.4, 0]}>
              {["Reqs", "Design", "Code", "Test", "Deploy"].map((name, i) => {
                const active = i === Math.min(phase - 1, 4);
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
            <group ref={ringRef} position={[0, 0.2, 0]}>
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[1.8, 0.12, 16, 64]} />
                <meshStandardMaterial color="#6366f1" emissive="#4f46e5" emissiveIntensity={0.5} roughness={0.3} />
              </mesh>

              <group position={[1.8, 0.4, 0]}>
                <RoundedBox args={[0.8, 0.8, 0.8]} radius={0.1} smoothness={4}>
                  <meshStandardMaterial color="#58cc02" emissive="#22c55e" emissiveIntensity={0.8} />
                </RoundedBox>
                <Billboard position={[0, 0.7, 0]}>
                  <Text fontSize={0.22} color="#ffffff" anchorX="center" anchorY="middle">
                    {`Iteration #${phase}`}
                  </Text>
                </Billboard>
              </group>
            </group>
          )}

          <Billboard position={[0, -1.6, 0]}>
            <Text fontSize={0.24} color="#fef08a" anchorX="center" anchorY="middle">
              {`Phase: ${state.currentPhase} (${state.progressPct}%)`}
            </Text>
          </Billboard>
          <Billboard position={[0, -2.0, 0]}>
            <Text fontSize={0.18} color="#94a3b8" anchorX="center" anchorY="middle">
              {state.flexibility}
            </Text>
          </Billboard>
        </group>
      )}
      readouts={[
        ["SDLC Model", model.toUpperCase()],
        ["Current Phase", state.currentPhase],
        ["Progress", `${state.progressPct}%`],
        ["Risk Assessment", state.riskLevel.toUpperCase()],
      ]}
      controls={
        <>
          <Pick label="Lifecycle Model" value={model} options={["waterfall", "spiral", "agile"] as const} onChange={(v) => set("model", v)} />
          <Slider label="Sprint / Stage Phase" value={phase} min={1} max={8} step={1} onChange={(v) => set("phase", v)} />
        </>
      }
    />
  );
}
