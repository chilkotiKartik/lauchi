"use client";
import { Line } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";
import { titrationPH } from "../math";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { CORE_SPECS } from "../meta/core.specs";

export default function TitrationLab() {
  const [P, set, reset] = useLabParams(CORE_SPECS.titration);
  const { kind, Vb, Cb } = P;
  const setKind = (x: (typeof P)["kind"]) => set("kind", x);
  const setVb = (x: (typeof P)["Vb"]) => set("Vb", x);
  const setCb = (x: (typeof P)["Cb"]) => set("Cb", x);

  const Ca = 0.1,
    Va = 25;
  const eq = (Ca * Va) / Cb;
  const ph = titrationPH(kind, Ca, Va, Cb, Vb);
  const vMax = eq * 2;

  const pts = useMemo(
    () =>
      Array.from({ length: 160 }, (_, i) => {
        const v = (i / 159) * vMax;
        return [
          (v / vMax) * 3.4 + 0.3,
          (titrationPH(kind, Ca, Va, Cb, v) / 14) * 3 - 1.5,
          0,
        ] as [number, number, number];
      }),
    [kind, Cb, vMax]
  );

  const pink = ph > 8.2;
  const flaskLiquidLevel = 0.5 + 0.7 * ((Va + Vb) / (Va + vMax));
  const buretteLiquidHeight = Math.max(0.1, 2.0 * (1 - Vb / vMax));

  // Dynamic chemical solution color: transparent clear in acid -> vibrant rose fuchsia in alkali
  const solColor = pink
    ? new THREE.Color("#ec4899").lerp(new THREE.Color("#f43f5e"), Math.min(1, (ph - 8.2) / 2))
    : new THREE.Color("#e0f2fe");

  return (
    <LabFrame
      label="Analytical Chemistry Titration Station: graduated burette with PTFE stopcock, conical Erlenmeyer flask, phenolphthalein endpoint, and live pH curve"
      animated={false}
      camera={[0, 0.5, 8.4]}
      onReset={reset}
      note={
        <p>
          In acid-base volumetric titration, standardized NaOH solution is delivered from the calibrated burette into an analyte acid. The equivalence point occurs when <b>C<sub>a</sub>V<sub>a</sub> = C<sub>b</sub>V<sub>b</sub></b>. Phenolphthalein indicator undergoes a structural quinonoid tautomerism around <b>pH 8.2</b>, shifting abruptly from colorless to vibrant pink to mark the reaction endpoint.
        </p>
      }
      scene={() => (
        <group>
          {/* Retort Stand with Heavy Cast Iron Base and Stainless Steel Rod */}
          <group position={[-2.9, -0.4, 0]}>
            {/* Base plate */}
            <mesh position={[0, -1.95, 0]}>
              <boxGeometry args={[2.2, 0.16, 1.8]} />
              <meshStandardMaterial color="#0f172a" metalness={0.85} roughness={0.3} />
            </mesh>
            {/* Vertical Chrome Rod */}
            <mesh position={[-0.8, 0.8, -0.6]}>
              <cylinderGeometry args={[0.06, 0.06, 5.2, 24]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.1} />
            </mesh>
            {/* Burette Clamp Arm */}
            <mesh position={[-0.4, 2.0, -0.3]} rotation={[0, 0, 0]}>
              <boxGeometry args={[0.9, 0.1, 0.12]} />
              <meshStandardMaterial color="#334155" metalness={0.8} />
            </mesh>
            <mesh position={[0, 2.0, 0]}>
              <cylinderGeometry args={[0.18, 0.18, 0.18, 16, 1, true]} />
              <meshStandardMaterial color="#475569" metalness={0.9} side={THREE.DoubleSide} />
            </mesh>

            {/* Graduated Glass Burette Tube */}
            <group position={[0, 2.1, 0]}>
              <mesh>
                <cylinderGeometry args={[0.12, 0.12, 2.6, 24, 1, true]} />
                <meshStandardMaterial color="#e0f2fe" transparent opacity={0.35} roughness={0.1} side={THREE.DoubleSide} />
              </mesh>
              {/* Liquid inside burette */}
              <mesh position={[0, -1.3 + buretteLiquidHeight / 2, 0]}>
                <cylinderGeometry args={[0.105, 0.105, buretteLiquidHeight, 20]} />
                <meshStandardMaterial color="#38bdf8" transparent opacity={0.65} />
              </mesh>
              {/* Teflon Stopcock Valve */}
              <mesh position={[0, -1.45, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.08, 0.08, 0.4, 16]} />
                <meshStandardMaterial color="#f8fafc" roughness={0.4} />
              </mesh>
              {/* Fine delivery jet tip */}
              <mesh position={[0, -1.75, 0]}>
                <cylinderGeometry args={[0.04, 0.015, 0.4, 16]} />
                <meshStandardMaterial color="#e0f2fe" transparent opacity={0.5} />
              </mesh>
            </group>

            {/* Falling Droplet when base added */}
            {Vb > 0 && (
              <mesh position={[0, -0.05, 0]}>
                <sphereGeometry args={[0.045, 12, 12]} />
                <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={0.6} />
              </mesh>
            )}

            {/* Magnetic Stirrer Base Plate */}
            <mesh position={[0, -1.65, 0]}>
              <boxGeometry args={[1.6, 0.35, 1.6]} />
              <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.25} />
            </mesh>

            {/* Glass Erlenmeyer Conical Flask */}
            <group position={[0, -0.85, 0]}>
              {/* Flask conical glass body */}
              <mesh position={[0, 0, 0]}>
                <coneGeometry args={[0.78, 1.2, 32, 1, true]} />
                <meshPhysicalMaterial
                  color="#e0f2fe"
                  transparent
                  opacity={0.35}
                  roughness={0.08}
                  transmission={0.75}
                  ior={1.48}
                  side={THREE.DoubleSide}
                />
              </mesh>
              {/* Flask neck */}
              <mesh position={[0, 0.75, 0]}>
                <cylinderGeometry args={[0.22, 0.22, 0.5, 24, 1, true]} />
                <meshStandardMaterial color="#e0f2fe" transparent opacity={0.35} side={THREE.DoubleSide} />
              </mesh>
              {/* Liquid Solution with pH Color Response */}
              <mesh position={[0, -0.6 + flaskLiquidLevel / 2, 0]}>
                <cylinderGeometry args={[0.72, 0.72, flaskLiquidLevel, 32]} />
                <meshStandardMaterial color={solColor} transparent opacity={0.88} roughness={0.15} />
              </mesh>
            </group>
          </group>

          {/* Calibrated Titration Graph Display Panel */}
          <group position={[0.4, 0, 0]}>
            {/* Background frame */}
            <mesh position={[2.0, 0, -0.05]}>
              <boxGeometry args={[4.0, 3.6, 0.04]} />
              <meshStandardMaterial color="#0f172a" metalness={0.8} />
            </mesh>

            {/* Coordinate axes */}
            <Line points={[[0.3, -1.5, 0], [3.7, -1.5, 0]]} color="#64748b" lineWidth={1.8} />
            <Line points={[[0.3, -1.5, 0], [0.3, 1.5, 0]]} color="#64748b" lineWidth={1.8} />

            {/* Neutral pH 7.0 dashed line */}
            <Line points={[[0.3, (7 / 14) * 3 - 1.5, 0], [3.7, (7 / 14) * 3 - 1.5, 0]]} color="#334155" lineWidth={1.2} dashed dashSize={0.1} gapSize={0.08} />

            {/* Equivalence volume vertical line */}
            <Line points={[[(eq / vMax) * 3.4 + 0.3, -1.5, 0], [(eq / vMax) * 3.4 + 0.3, 1.5, 0]]} color="#ec4899" lineWidth={1.2} dashed dashSize={0.1} gapSize={0.08} />

            {/* Continuous Sigmoidal Titration Curve */}
            <Line points={pts} color="#22c55e" lineWidth={3.5} />

            {/* Dynamic Cursor Marker */}
            <mesh position={[(Vb / vMax) * 3.4 + 0.3, (ph / 14) * 3 - 1.5, 0.06]}>
              <sphereGeometry args={[0.1, 20, 20]} />
              <meshStandardMaterial color="#facc15" emissive="#eab308" emissiveIntensity={1.2} />
            </mesh>
          </group>
        </group>
      )}
      readouts={[
        ["Current Solution pH", ph.toFixed(2)],
        ["Volume of NaOH titrant", `${Vb.toFixed(1)} mL`],
        ["Theoretical Equivalence V_eq", `${eq.toFixed(1)} mL`],
        ["Phenolphthalein state", pink ? "Pink / Fuchsia (Alkaline)" : "Colorless (Acidic)"],
      ]}
      controls={
        <>
          <Pick
            label="Analyte Acid (25 mL of 0.1 M)"
            value={kind}
            options={[
              { id: "strong", label: "Strong Acid (HCl)" },
              { id: "weak", label: "Weak Acid (CH₃COOH, Ka = 1.8×10⁻⁵)" },
            ]}
            onChange={setKind}
          />
          <Slider label="Volume of NaOH added" value={Vb} min={0} max={vMax} step={0.1} digits={1} unit=" mL" onChange={setVb} />
          <Slider
            label="NaOH Concentration"
            value={Cb}
            min={0.05}
            max={0.2}
            step={0.01}
            digits={2}
            unit=" M"
            onChange={(v) => {
              setCb(v);
              setVb(0);
            }}
          />
        </>
      }
    />
  );
}
