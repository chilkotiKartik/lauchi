"use client";
import { Line } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";
import { polarimeter, SAMPLES, type SampleId } from "../sim/phyx";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { PHYX_SPECS } from "../meta/phyx.specs";
import { C, type V3 } from "../kit";
import { Flow, Rod, mix } from "../kit2";

const Disc = ({ x, angle, color, r = 0.8 }: { x: number; angle: number; color: string; r?: number }) => (
  <group position={[x, 0, 0]} rotation={[angle * (Math.PI / 180), 0, 0]}>
    <mesh rotation={[0, Math.PI / 2, 0]}><ringGeometry args={[r * 0.7, r, 32]} /><meshStandardMaterial color={C.dark} side={2} /></mesh>
    <mesh rotation={[0, Math.PI / 2, 0]}><circleGeometry args={[r * 0.7, 32]} /><meshStandardMaterial color={color} transparent opacity={0.55} side={2} /></mesh>
    <Line points={[[0, -r * 0.7, 0], [0, r * 0.7, 0]]} color="#ffffff" lineWidth={2} />
  </group>
);

export default function PolarimeterLab() {
  const [P, set, reset] = useLabParams(PHYX_SPECS.polarimeter);
  const { c, l, an, sample } = P;
  const p = polarimeter(sample, c, l, an);
  const tubeLen = 1.2 + (l / 40) * 2.8;
  const beam = useMemo<V3[]>(() => [[-5.6, 0, 0], [2.4, 0, 0]], []);
  const shade = (v: number) => mix("#070d10", "#ffdf7a", Math.pow(v, 0.65));

  return (
    <LabFrame
      label="Laurent half-shade polarimeter: sodium vapor lamp, Nicol polarizer, sample solution tube, and circular vernier analyser"
      camera={[0.5, 2.2, 9.2]}
      onReset={reset}
      scene={() => (
        <group>
          {/* Heavy Optical Bench Rail */}
          <group position={[-0.8, -1.8, 0]}>
            <mesh>
              <boxGeometry args={[9.6, 0.24, 0.7]} />
              <meshStandardMaterial color="#1a242b" metalness={0.8} roughness={0.3} />
            </mesh>
            <mesh position={[0, 0.125, 0]}>
              <boxGeometry args={[9.6, 0.02, 0.25]} />
              <meshStandardMaterial color="#cca43b" metalness={0.85} roughness={0.2} />
            </mesh>
            {[-4.2, -1.4, 1.4, 4.2].map((px, i) => (
              <mesh key={i} position={[px, -0.2, 0]}>
                <cylinderGeometry args={[0.24, 0.28, 0.18, 24]} />
                <meshStandardMaterial color="#2d3c46" metalness={0.7} roughness={0.4} />
              </mesh>
            ))}
          </group>

          {/* Sodium Vapor Lamp Housing on Stand */}
          <group position={[-5.6, 0, 0]}>
            <mesh position={[0, -0.9, 0]}>
              <cylinderGeometry args={[0.08, 0.08, 1.6, 16]} />
              <meshStandardMaterial color="#b4c6d0" metalness={0.85} roughness={0.2} />
            </mesh>
            <mesh>
              <cylinderGeometry args={[0.42, 0.48, 0.9, 24]} />
              <meshStandardMaterial color="#2d3c46" metalness={0.7} roughness={0.35} />
            </mesh>
            {/* Lamp yellow emission aperture */}
            <mesh position={[0.45, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.2, 0.2, 0.06, 24]} />
              <meshStandardMaterial color="#ffc83d" emissive="#ffc83d" emissiveIntensity={1.4} />
            </mesh>
          </group>

          {/* Collimated Light Beam */}
          <Line points={beam} color="#ffc83d" lineWidth={2} />
          <Flow path={beam} n={16} speed={0.4} color="#ffc83d" r={0.055} />

          {/* Nicol Polarizer Prism Mount */}
          <Disc x={-4.4} angle={0} color={C.blue} />

          {/* Laurent Half-Shade Quartz Plate Assembly */}
          <group position={[-3.5, 0, 0]}>
            <mesh position={[0, -0.9, 0]}>
              <cylinderGeometry args={[0.06, 0.06, 1.6, 16]} />
              <meshStandardMaterial color="#b4c6d0" metalness={0.85} roughness={0.2} />
            </mesh>
            <mesh rotation={[0, Math.PI / 2, 0]}>
              <torusGeometry args={[0.8, 0.07, 16, 32]} />
              <meshStandardMaterial color="#cca43b" metalness={0.85} roughness={0.25} />
            </mesh>
            <mesh position={[0, 0.35, 0]} rotation={[0, Math.PI / 2, 0]}>
              <planeGeometry args={[1.3, 0.7]} />
              <meshStandardMaterial color="#a970ff" transparent opacity={0.65} side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[0, -0.35, 0]} rotation={[0, Math.PI / 2, 0]}>
              <planeGeometry args={[1.3, 0.7]} />
              <meshStandardMaterial color="#e8f1f5" transparent opacity={0.35} side={THREE.DoubleSide} />
            </mesh>
          </group>

          {/* Glass Polarimeter Sample Tube with Brass Threaded End Caps */}
          <group position={[-2.4 + tubeLen / 2, 0, 0]}>
            {/* Cradle supports */}
            {[-tubeLen / 2 + 0.3, tubeLen / 2 - 0.3].map((cx, i) => (
              <mesh key={i} position={[cx, -0.85, 0]}>
                <boxGeometry args={[0.3, 1.5, 0.7]} />
                <meshStandardMaterial color="#24313a" metalness={0.7} roughness={0.35} />
              </mesh>
            ))}

            {/* Borosilicate Glass Outer Tube */}
            <Rod a={[-tubeLen / 2, 0, 0]} b={[tubeLen / 2, 0, 0]} r={0.44} color="#d0e4ee" o={0.25} metal={0.1} rough={0.1} />

            {/* Active Optically Rotating Liquid Solution */}
            <Rod
              a={[-tubeLen / 2 + 0.06, 0, 0]}
              b={[tubeLen / 2 - 0.06, 0, 0]}
              r={0.38}
              color={sample === "water" ? "#7fc8f8" : c > 0 ? "#f5d788" : "#7fc8f8"}
              o={0.6}
              glow={c > 0 ? 0.15 : 0}
            />

            {/* Brass End Caps */}
            <mesh position={[-tubeLen / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.5, 0.5, 0.14, 24]} />
              <meshStandardMaterial color="#cca43b" metalness={0.85} roughness={0.25} />
            </mesh>
            <mesh position={[tubeLen / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.5, 0.5, 0.14, 24]} />
              <meshStandardMaterial color="#cca43b" metalness={0.85} roughness={0.25} />
            </mesh>
          </group>

          {/* Polarisation Angle Vector Markers */}
          <Line points={[[-2.4, 0, 0], [-2.4, 0.65, 0]]} color="#ff5a5f" lineWidth={2.5} />
          <Line
            points={[
              [-2.4 + tubeLen, 0, 0],
              [-2.4 + tubeLen, 0.65 * Math.cos((p.theta * Math.PI) / 180), 0.65 * Math.sin((p.theta * Math.PI) / 180)],
            ]}
            color="#ff5a5f"
            lineWidth={2.5}
          />

          {/* Rotating Nicol Analyser with Graduated Vernier Collar */}
          <Disc x={1.8} angle={an} color={C.green} />

          {/* Eyepiece Telescope Mount */}
          <group position={[2.6, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <mesh>
              <cylinderGeometry args={[0.32, 0.42, 0.7, 24]} />
              <meshStandardMaterial color="#1a252c" metalness={0.7} roughness={0.35} />
            </mesh>
            <mesh position={[0, -0.4, 0]}>
              <cylinderGeometry args={[0.22, 0.22, 0.18, 20]} />
              <meshStandardMaterial color="#cca43b" metalness={0.85} roughness={0.25} />
            </mesh>
          </group>

          {/* High-Resolution Split-Field Eyepiece Viewport */}
          <group position={[4.6, 0.4, 0]} rotation={[0, -0.4, 0]}>
            {/* Bezel Ring */}
            <mesh position={[0, 0, -0.02]}>
              <cylinderGeometry args={[1.22, 1.22, 0.08, 48]} />
              <meshStandardMaterial color="#141d22" metalness={0.8} roughness={0.3} />
            </mesh>
            <mesh position={[0, 0, -0.01]}>
              <ringGeometry args={[1.05, 1.2, 48]} />
              <meshStandardMaterial color="#cca43b" metalness={0.85} roughness={0.2} />
            </mesh>

            {/* Left & Right Laurent Half-Shade Fields */}
            <mesh position={[-0.01, 0, 0.01]}>
              <circleGeometry args={[1.04, 48, Math.PI / 2, Math.PI]} />
              <meshBasicMaterial color={shade(p.left)} />
            </mesh>
            <mesh position={[0.01, 0, 0.01]}>
              <circleGeometry args={[1.04, 48, -Math.PI / 2, Math.PI]} />
              <meshBasicMaterial color={shade(p.right)} />
            </mesh>

            {/* Fine Reticle Dividing Hairline */}
            <Line points={[[0, -1.04, 0.02], [0, 1.04, 0.02]]} color="#000000" lineWidth={1.5} />
          </group>
        </group>
      )}
      readouts={[
        ["Rotation θ = S·l·c", `${p.theta.toFixed(2)}°`],
        ["Specific rotation S", `${p.S.toFixed(1)}° dm⁻¹(g/mL)⁻¹`],
        ["Left half brightness", `${(p.left * 100).toFixed(1)} %`],
        ["Right half brightness", `${(p.right * 100).toFixed(1)} %`],
        ["Equal-dark setting", `${p.matchDeg.toFixed(1)}°`],
        ["Field", p.balanced ? "Matched: read the scale" : p.left > p.right ? "Left brighter" : "Right brighter"],
      ]}
      controls={<>
        <Slider label="Concentration c" value={c} min={0} max={30} step={0.5} digits={1} unit=" g/100 mL" onChange={(x) => set("c", x)} />
        <Slider label="Tube length l" value={l} min={5} max={40} step={1} digits={0} unit=" cm" onChange={(x) => set("l", x)} />
        <Slider label="Analyser angle" value={an} min={0} max={180} step={0.1} digits={1} unit="°" onChange={(x) => set("an", x)} />
        <Pick label="Sample" value={sample} options={(Object.keys(SAMPLES) as SampleId[]).map((k) => ({ id: k, label: SAMPLES[k].name }))} onChange={(x) => set("sample", x)} />
      </>}
      note={<p>Sodium light is plane-polarised by the polariser. Laurent’s half-shade plate (a half-wave quartz plate covering half the field) makes the two halves vibrate at slightly different angles, so the eye can match two <b>equally dark</b> halves far more precisely than it can find a single darkest point. An optically active solution rotates the plane by θ = S·l·c (l in decimetres, c in g/mL). Turn the analyser until the halves match, subtract the zero reading taken with water (90°), and S = θ/(l c). Cane sugar turns the plane to the right (dextro-), fructose to the left (laevo-). The half-shade angle is taken as 8°.</p>}
    />
  );
}
