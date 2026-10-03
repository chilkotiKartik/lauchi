"use client";
import { Billboard, RoundedBox, Text } from "@react-three/drei";
import { useLabParams } from "../params";
import { BCAY_SPECS } from "../meta/bcay.specs";
import { LabFrame, Pick, Slider } from "../ui";
import { simulateCMemory } from "../sim/bcay";

export default function CPointer3DLab() {
  const [P, set, reset] = useLabParams(BCAY_SPECS.cpointer3d);
  const { mode, val } = P;
  const cells = simulateCMemory(mode, val);

  return (
    <LabFrame
      label="3D C Memory layout, stack and heap blocks, and pointer dereference rays"
      camera={[0, 1.5, 7.5]}
      onReset={reset}
      note={
        <p className="text-sm text-muted">
          Pointers store hexadecimal memory addresses that point to other memory cells in the stack or heap segment.
        </p>
      }
      scene={() => (
        <group position={[0, -0.2, 0]}>
          <Billboard position={[0, 2.5, 0]}>
            <Text fontSize={0.34} color="#58cc02" anchorX="center" anchorY="middle">
              {`${mode.toUpperCase()} MEMORY ARCHITECTURE`}
            </Text>
          </Billboard>

          {cells.map((cell, idx) => {
            const xPos = (idx - (cells.length - 1) / 2) * 2.3;
            const isStack = cell.segment === "stack";
            const color = isStack ? (cell.isPointer ? "#1cb0f6" : "#58cc02") : "#ff9a1f";

            return (
              <group key={idx} position={[xPos, 0, 0]}>
                <Billboard position={[0, 1.3, 0]}>
                  <Text fontSize={0.22} color="#94a3b8" anchorX="center" anchorY="middle">
                    {`0x${cell.address.toString(16).toUpperCase()}`}
                  </Text>
                </Billboard>

                <RoundedBox args={[1.9, 1.5, 1.2]} radius={0.14} smoothness={4}>
                  <meshStandardMaterial color={color} roughness={0.3} metalness={0.2} emissive={color} emissiveIntensity={0.25} />
                </RoundedBox>

                <Billboard position={[0, 0.25, 0.65]}>
                  <Text fontSize={0.28} color="#ffffff" anchorX="center" anchorY="middle">
                    {cell.name}
                  </Text>
                </Billboard>
                <Billboard position={[0, -0.25, 0.65]}>
                  <Text fontSize={0.24} color="#fef08a" anchorX="center" anchorY="middle">
                    {String(cell.value)}
                  </Text>
                </Billboard>

                <Billboard position={[0, -1.1, 0]}>
                  <Text fontSize={0.2} color={isStack ? "#60a5fa" : "#fbbf24"} anchorX="center" anchorY="middle">
                    {`[${cell.segment.toUpperCase()} · ${cell.bytes}B]`}
                  </Text>
                </Billboard>

                {cell.isPointer && (
                  <mesh position={[-1.15, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[0.04, 0.04, 1.9, 16]} />
                    <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={0.9} />
                  </mesh>
                )}
              </group>
            );
          })}
        </group>
      )}
      readouts={[
        ["Active Mode", mode.toUpperCase()],
        ["Primary Value", String(val)],
        ["Stack Base Address", "0x7FFD00"],
        ["Indirection Levels", mode === "double" ? "2 (**ptr)" : mode === "pointer" ? "1 (*ptr)" : "Direct"],
      ]}
      controls={
        <>
          <Pick
            label="Memory Pattern"
            value={mode}
            options={[
              { id: "pointer", label: "Single Pointer (*p)" },
              { id: "array", label: "Array Contiguous (arr[i])" },
              { id: "malloc", label: "Dynamic Heap (malloc)" },
              { id: "double", label: "Double Pointer (**ptr)" },
            ]}
            onChange={(v) => set("mode", v)}
          />
          <Slider label="Integer Value" value={val} min={1} max={999} step={1} onChange={(v) => set("val", v)} />
        </>
      }
    />
  );
}
