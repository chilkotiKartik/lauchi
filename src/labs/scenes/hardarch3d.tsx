"use client";
import { Billboard, RoundedBox, Text } from "@react-three/drei";
import { useLabParams } from "../params";
import { BCAY_SPECS } from "../meta/bcay.specs";
import { LabFrame, Pick, Slider } from "../ui";
import { computeHardwareBusMetrics } from "../sim/bcay";

export default function HardArch3DLab() {
  const [P, set, reset] = useLabParams(BCAY_SPECS.hardarch3d);
  const { cpuGhz, ddrGen, pcieLanes } = P;
  const metrics = computeHardwareBusMetrics(cpuGhz, parseInt(ddrGen, 10), pcieLanes);

  return (
    <LabFrame
      label="3D Motherboard Architecture with CPU Socket, RAM DIMM slots, PCIe lanes, and live data highway"
      camera={[0, 2.5, 7.5]}
      onReset={reset}
      scene={() => (
        <group position={[0, -0.4, 0]}>
          {/* Motherboard PCB */}
          <RoundedBox args={[7.8, 0.2, 5.6]} radius={0.12} smoothness={4} position={[0, -0.6, 0]}>
            <meshStandardMaterial color="#064e3b" roughness={0.4} metalness={0.1} />
          </RoundedBox>

          {/* CPU Socket */}
          <group position={[-2.0, 0, 0]}>
            <RoundedBox args={[1.9, 0.45, 1.9]} radius={0.08} smoothness={4}>
              <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
            </RoundedBox>
            <Billboard position={[0, 0.45, 0]}>
              <Text fontSize={0.26} color="#f8fafc" anchorX="center" anchorY="middle">
                {`CPU (${cpuGhz.toFixed(1)} GHz)`}
              </Text>
            </Billboard>
          </group>

          {/* RAM DIMM Slots */}
          <group position={[0.6, 0, 1.3]}>
            {[-0.35, 0, 0.35].map((zOffset, i) => (
              <RoundedBox key={i} args={[2.4, 0.65, 0.14]} radius={0.03} smoothness={2} position={[0, 0.1, zOffset]}>
                <meshStandardMaterial color="#1e3a8a" roughness={0.3} metalness={0.3} />
              </RoundedBox>
            ))}
            <Billboard position={[0, 0.7, 0]}>
              <Text fontSize={0.22} color="#38bdf8" anchorX="center" anchorY="middle">
                {`DDR${ddrGen} RAM (${metrics.ramBandwidthGbs} GB/s)`}
              </Text>
            </Billboard>
          </group>

          {/* PCIe Expansion Slot */}
          <group position={[0.6, 0, -1.4]}>
            <RoundedBox args={[3.4, 0.38, 0.28]} radius={0.04} smoothness={2}>
              <meshStandardMaterial color="#1e293b" metalness={0.5} roughness={0.3} />
            </RoundedBox>
            <Billboard position={[0, 0.48, 0]}>
              <Text fontSize={0.22} color="#a855f7" anchorX="center" anchorY="middle">
                {`PCIe Gen4 x${pcieLanes} (${metrics.pcieBandwidthGbs} GB/s)`}
              </Text>
            </Billboard>
          </group>

          {/* Data Bus Highway */}
          <mesh position={[0, -0.45, 0]}>
            <boxGeometry args={[4.8, 0.06, 0.22]} />
            <meshStandardMaterial color="#eab308" emissive="#ca8a04" emissiveIntensity={0.6} />
          </mesh>
        </group>
      )}
      readouts={[
        ["CPU Clock Speed", `${cpuGhz.toFixed(1)} GHz`],
        ["CPU Cycle Period", `${metrics.cpuCycleTimeNs} ns`],
        ["RAM Bandwidth", `${metrics.ramBandwidthGbs} GB/s (DDR${ddrGen})`],
        ["PCIe Bandwidth", `${metrics.pcieBandwidthGbs} GB/s (x${pcieLanes})`],
      ]}
      controls={
        <>
          <Slider label="CPU Frequency (GHz)" value={cpuGhz} min={1.0} max={5.5} step={0.1} onChange={(v) => set("cpuGhz", v)} />
          <Pick label="RAM Generation" value={ddrGen} options={["3", "4", "5"] as const} onChange={(v) => set("ddrGen", v)} />
          <Slider label="PCIe Lanes" value={pcieLanes} min={1} max={16} step={1} onChange={(v) => set("pcieLanes", v)} />
        </>
      }
    />
  );
}
