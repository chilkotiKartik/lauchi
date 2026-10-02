"use client";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { newtonRing } from "../math";
import { LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { CORE_SPECS } from "../meta/core.specs";

/** Visible light colour for a wavelength in nm (piecewise approximation). */
function nmColor(nm: number) {
  let r = 0, g = 0, b = 0;
  if (nm < 440) { r = (440 - nm) / 60; b = 1; } else if (nm < 490) { g = (nm - 440) / 50; b = 1; }
  else if (nm < 510) { g = 1; b = (510 - nm) / 20; } else if (nm < 580) { r = (nm - 510) / 70; g = 1; }
  else if (nm < 645) { r = 1; g = (645 - nm) / 65; } else { r = 1; }
  return new THREE.Color(r, g, b);
}

const MM_PER_UNIT = 0.35;
const DISC = 4.0;

function RingPattern({ lambdaMm, Rmm, color }: { lambdaMm: number; Rmm: number; color: THREE.Color }) {
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(() => ({
    uLambda: { value: lambdaMm },
    uR: { value: Rmm },
    uColor: { value: color },
    uScale: { value: MM_PER_UNIT },
    uRadius: { value: DISC },
  }), [lambdaMm, Rmm, color]);

  useFrame(() => {
    if (matRef.current) {
      matRef.current.uniforms.uLambda.value = lambdaMm;
      matRef.current.uniforms.uR.value = Rmm;
      matRef.current.uniforms.uColor.value = color;
    }
  });

  const vertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    uniform float uLambda;
    uniform float uR;
    uniform vec3 uColor;
    uniform float uScale;
    uniform float uRadius;
    varying vec2 vUv;

    void main() {
      vec2 center = vec2(0.5, 0.5);
      float distNorm = length(vUv - center) * 2.0; // 0 at center, 1 at disc edge
      if (distNorm > 1.0) discard;

      float r_world = distNorm * uRadius;
      float r_mm = r_world * uScale; // radius in mm

      // Exact reflected wave interference:
      // Film thickness t = r^2 / (2R)
      // Phase difference delta = (4*pi*t / lambda) + pi
      // I = I0 * sin^2(pi * r^2 / (lambda * R))
      float phase = 3.14159265359 * (r_mm * r_mm) / (uLambda * uR);
      float intensity = sin(phase) * sin(phase);

      // Contrast falloff with spatial coherence / distance
      float coherence = clamp(1.0 - (distNorm * 0.22), 0.45, 1.0);
      intensity = 0.5 * (1.0 - coherence) + intensity * coherence;

      // Dark fringes are deep ink black; bright fringes glow with monochromatic laser color
      vec3 col = uColor * (intensity * 1.15);
      // Subtle ambient glass sheen
      col += vec3(0.02, 0.03, 0.04) * (1.0 - intensity * 0.4);

      // Smooth anti-aliased edge
      float edgeAlpha = smoothstep(1.0, 0.985, distNorm);

      gl_FragColor = vec4(col, edgeAlpha);
    }
  `;

  return (
    <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[DISC * 2, DISC * 2, 1, 1]} />
      <shaderMaterial
        ref={matRef}
        transparent
        depthWrite={false}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
      />
    </mesh>
  );
}

export default function RingsLab() {
  const [P, set, reset] = useLabParams(CORE_SPECS.rings);
  const { nm, R: Rcm } = P;
  const setNm = (x: (typeof P)["nm"]) => set("nm", x), setR = (x: (typeof P)["R"]) => set("R", x);
  const lambdaMm = nm * 1e-6, Rmm = Rcm * 10;
  const col = nmColor(nm);

  const r1 = newtonRing(1, lambdaMm, Rmm);
  const r5 = newtonRing(5, lambdaMm, Rmm);
  const r10 = newtonRing(10, lambdaMm, Rmm);

  // Count rings within visible field of view
  const maxRmm = DISC * MM_PER_UNIT;
  const visibleRings = Math.floor((maxRmm * maxRmm) / (lambdaMm * Rmm));

  const thetaL = Math.asin(0.5);

  return (
    <LabFrame
      label="Newton's rings: optical interference fringes between a convex lens and an optical flat"
      camera={[0, 7.5, 5.5]}
      onReset={reset}
      scene={() => (
        <group>
          {/* Base optical flat glass plate */}
          <mesh position={[0, -0.15, 0]}>
            <cylinderGeometry args={[DISC + 0.35, DISC + 0.35, 0.3, 64]} />
            <meshStandardMaterial color="#0c161c" roughness={0.2} metalness={0.1} />
          </mesh>

          {/* Continuous Wave Interference Pattern */}
          <RingPattern lambdaMm={lambdaMm} Rmm={Rmm} color={col} />

          {/* Plano-Convex Lens Dome resting on the flat plate */}
          <mesh position={[0, 7.8, 0]}>
            <sphereGeometry args={[8, 64, 32, 0, Math.PI * 2, Math.PI - thetaL, thetaL]} />
            <meshPhysicalMaterial
              color="#d2efff"
              transparent
              opacity={0.28}
              roughness={0.03}
              transmission={0.9}
              thickness={1.2}
              ior={1.52}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      )}
      readouts={[
        ["Wavelength λ", `${nm} nm`],
        ["Lens radius R", `${Rcm} cm`],
        ["1st dark ring r₁", `${r1.toFixed(3)} mm`],
        ["5th dark ring r₅", `${r5.toFixed(3)} mm`],
        ["10th dark ring r₁₀", `${r10.toFixed(3)} mm`],
        ["Rings in view", String(visibleRings)],
        ["Air gap at ring 5", `${(((r5 * r5) / (2 * Rmm)) * 1e6).toFixed(0)} nm`],
      ]}
      controls={
        <>
          <Slider label="Wavelength λ" value={nm} min={400} max={700} step={5} digits={0} unit=" nm" onChange={setNm} />
          <Slider label="Lens radius of curvature R" value={Rcm} min={20} max={100} step={1} digits={0} unit=" cm" onChange={setR} />
        </>
      }
      note={
        <p>
          A plano-convex lens of large radius of curvature <b>R</b> rests on an optically plane glass plate, enclosing a thin wedge-shaped air film of thickness <b>t = r² / (2R)</b>.
          Light rays reflected from the upper and lower surfaces of the air film undergo interference. Because reflection at the bottom glass plate involves a phase reversal of <b>π (λ/2)</b>, the <b>centre is always dark</b> and the <i>n</i>-th dark ring satisfies <b>rₙ = √(n·λ·R)</b>.
          As <i>n</i> increases, consecutive rings get progressively closer together (<b>rₙ ∝ √n</b>).
        </p>
      }
    />
  );
}
