"use client";
import { Line } from "@react-three/drei";
import { useMemo } from "react";
import { polarimeter, SAMPLES, type SampleId } from "../sim/phyx";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { PHYX_SPECS } from "../meta/phyx.specs";
import { C, Box, type V3 } from "../kit";
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
  const tubeLen = 1 + (l / 40) * 3;
  const beam = useMemo<V3[]>(() => [[-5.4, 0, 0], [3.4, 0, 0]], []);
  const shade = (v: number) => mix("#0f1a20", "#ffe9a8", Math.pow(v, 0.6));
  return (
    <LabFrame
      label="An optical bench: a sodium lamp, a polariser, a half-shade plate, a tube of sugar solution and a rotating analyser; the eyepiece shows two half-fields whose brightness depends on the analyser angle"
      camera={[1, 2.2, 8.5]}
      onReset={reset}
      scene={() => (<group>
        <mesh position={[-5.6, 0, 0]}><sphereGeometry args={[0.35, 20, 20]} /><meshStandardMaterial color={C.gold} emissive={C.gold} emissiveIntensity={1} /></mesh>
        <Line points={beam} color={C.gold} lineWidth={1.5} />
        <Flow path={beam} n={16} speed={0.4} color={C.gold} r={0.05} />
        <Disc x={-4.3} angle={0} color={C.blue} />
        <group position={[-3.4, 0, 0]}>
          <mesh position={[0, 0.25, 0]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[1.1, 0.5]} /><meshStandardMaterial color={C.purple} transparent opacity={0.6} side={2} /></mesh>
          <mesh position={[0, -0.25, 0]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[1.1, 0.5]} /><meshStandardMaterial color={C.light} transparent opacity={0.35} side={2} /></mesh>
        </group>
        <group position={[-2.6 + tubeLen / 2, 0, 0]}>
          <Rod a={[-tubeLen / 2, 0, 0]} b={[tubeLen / 2, 0, 0]} r={0.42} color="#e8f1f5" o={0.25} />
          <Rod a={[-tubeLen / 2 + 0.05, 0, 0]} b={[tubeLen / 2 - 0.05, 0, 0]} r={0.36} color={sample === "water" ? "#7fc8f8" : c > 0 ? "#f6d58e" : "#7fc8f8"} o={0.55} />
        </group>
        <Line points={[[-2.6, 0, 0], [-2.6, 0.6, 0]]} color={C.red} lineWidth={2} />
        <Line points={[[-2.6 + tubeLen, 0, 0], [-2.6 + tubeLen, 0.6 * Math.cos((p.theta * Math.PI) / 180), 0.6 * Math.sin((p.theta * Math.PI) / 180)]]} color={C.red} lineWidth={2} />
        <Disc x={2.0} angle={an} color={C.green} />
        <Box p={[2.9, 0, 0]} s={[0.6, 0.5, 0.5]} c={C.dark} />
        <group position={[4.6, 0.4, 0]} rotation={[0, -0.5, 0]}>
          <mesh position={[-0.42, 0, 0]}><circleGeometry args={[0.85, 32, Math.PI / 2, Math.PI]} /><meshBasicMaterial color={shade(p.left)} /></mesh>
          <mesh position={[-0.38, 0, 0]}><circleGeometry args={[0.85, 32, -Math.PI / 2, Math.PI]} /><meshBasicMaterial color={shade(p.right)} /></mesh>
          <mesh position={[-0.4, 0, -0.01]}><ringGeometry args={[0.85, 1.0, 40]} /><meshBasicMaterial color={C.grey} /></mesh>
        </group>
      </group>)}
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
