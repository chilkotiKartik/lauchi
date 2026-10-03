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
      label="3D Computer Motherboard Architecture, PCIe lanes, RAM Bus, and CPU socket clock pulse"
      camera={[0, 4, 7]}
      onReset={reset}
      note={
        <p className="text-sm text-muted">
          Motherboard chipsets route high-speed digital buses between CPU cores, DDR memory controllers, and PCIe lanes.
        </p>
      }
      scene={() => (
        <group position={[0, -0.5, 0]}>
          {/* Motherboard PCB substrate */}
          <RoundedBox args={[6.5, 0.2, 5.0]} radius={0.1} smoothness={4} position={[0, -0.1, 0]}>
            <meshStandardMaterial color="#064e3b" roughness={0.6} metalness={0.1} />
          </RoundedBox>

          {/* CPU Socket & Heatspreader */}
          <group position={[-1.5, 0.2, 0]}>
            <RoundedBox args={[1.6, 0.35, 1.6]} radius={0.08} smoothness={4}>
              <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
            </RoundedBox>
            <Billboard position={[0, 0.6, 0]}>
              <Text fontSize={0.22} color="#f8fafc" anchorX="center" anchorY="middle">
                {`CPU Socket (${cpuGhz.toFixed(1)} GHz)`}
              </Text>
            </Billboard>
          </group>

          {/* RAM DIMM Slots */}
          <group position={[1.4, 0.4, -0.8]}>
            {[-0.3, 0, 0.3].map((zOffset, i) => (
              <RoundedBox key={i} args={[0.15, 0.7, 1.8]} radius={0.02} smoothness={2} position={[i * 0.35, 0, 0]}>
                <meshStandardMaterial color="#3b82f6" roughness={0.4} />
              </RoundedBox>
            ))}
            <Billboard position={[0.35, 0.75, 0]}>
              <Text fontSize={0.2} color="#60a5fa" anchorX="center" anchorY="middle">
                {`DDR${ddrGen} Slots (${metrics.ramBandwidthGbs} GB/s)`}
              </Text>
            </Billboard>
          </group>

          {/* PCIe Expansion Slot */}
          <group position={[0.2, 0.2, 1.4]}>
            <RoundedBox args={[4.2, 0.25, 0.3]} radius={0.02} smoothness={2}>
              <meshStandardMaterial color="#1e293b" />
            </RoundedBox>
            <Billboard position={[0, 0.5, 0]}>
              <Text fontSize={0.2} color="#fbbf24" anchorX="center" anchorY="middle">
                {`PCIe x${pcieLanes} (${metrics.pcieBandwidthGbs} GB/s)`}
              </Text>
            </Billboard>
          </group>

          {/* Bus Traces / Lasers */}
          <mesh position={[-0.1, 0.05, -0.4]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.03, 0.03, 2.4, 16]} />
            <meshStandardMaterial color="#22c55e" emissive="#4ade80" emissiveIntensity={0.8} />
          </mesh>
        </group>
      )}
      readouts={[
        ["CPU Clock Freq", `${cpuGhz.toFixed(1)} GHz`],
        ["Cycle Time", `${metrics.cpuCycleTimeNs} ns`],
        ["RAM Bandwidth", `${metrics.ramBandwidthGbs} GB/s`],
        ["PCIe Bandwidth", `${metrics.pcieBandwidthGbs} GB/s`],
      ]}
      controls={
        <>
          <Slider label="CPU Clock Frequency" value={cpuGhz} min={1.0} max={5.5} step={0.1} unit=" GHz" onChange={(v) => set("cpuGhz", v)} />
          <Pick
            label="DDR Memory Generation"
            value={ddrGen}
            options={[
              { id: "3", label: "DDR3 (12.8 GB/s)" },
              { id: "4", label: "DDR4 (25.6 GB/s)" },
              { id: "5", label: "DDR5 (51.2 GB/s)" },
            ]}
            onChange={(v) => set("ddrGen", v)}
          />
          <Slider label="PCIe Lanes" value={pcieLanes} min={1} max={16} step={1} unit=" Lanes" onChange={(v) => set("pcieLanes", v)} />
        </>
      }
    />
  );
}
