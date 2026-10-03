"use client";
import { Line } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { diffraction, nmToRgb, slitIntensity } from "../sim/physics";
import { LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { PHYSICS_SPECS } from "../meta/physics.specs";

const D = 6;
const HALF = 3;
const XP = -2.8, XS = 3.2;
const TEX = 2048, CURVE = 480;

/** High-resolution spectral diffraction fringe texture */
function makeScreenTexture(nm: number, a: number, d: number, N: number) {
  const lam = nm * 1e-3, col = nmToRgb(nm), data = new Uint8Array(TEX * 4);
  for (let i = 0; i < TEX; i++) {
    const y = (i / (TEX - 1) - 0.5) * 2 * HALF, sinT = y / Math.hypot(y, D);
    const I = slitIntensity(sinT, lam, a, d, N), v = Math.pow(I, 0.42), w = Math.pow(I, 3) * 0.4;
    for (let c = 0; c < 3; c++) data[i * 4 + c] = Math.round(255 * Math.min(1, 0.04 + col[c] * v * 0.96 + w));
    data[i * 4 + 3] = 255;
  }
  const tex = new THREE.DataTexture(data, 1, TEX, THREE.RGBAFormat);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

export default function DiffractionLab() {
  const [P, set, reset] = useLabParams(PHYSICS_SPECS.diffraction);
  const { nm, a, d, N } = P;
  const setNm = (x: (typeof P)["nm"]) => set("nm", x);
  const setA = (x: (typeof P)["a"]) => set("a", x);
  const setD = (x: (typeof P)["d"]) => set("d", x);
  const setN = (x: (typeof P)["N"]) => set("N", x);

  const n = Math.round(N);
  const info = diffraction(nm, a, d, n);
  const lam = nm * 1e-3, dU = info.dUsed;
  const col = useMemo(() => {
    const c = nmToRgb(nm);
    return new THREE.Color(c[0], c[1], c[2]);
  }, [nm]);
  const tex = useMemo(() => makeScreenTexture(nm, a, dU, n), [nm, a, dU, n]);
  useEffect(() => () => tex.dispose(), [tex]);

  const curve = useMemo(() => {
    const pts: [number, number, number][] = [];
    for (let i = 0; i < CURVE; i++) {
      const y = (i / (CURVE - 1) - 0.5) * 2 * HALF, sinT = y / Math.hypot(y, D);
      pts.push([XS - 0.04 - 1.8 * slitIntensity(sinT, lam, a, dU, n), y, 0.04]);
    }
    return pts;
  }, [lam, a, dU, n]);

  const plate = useMemo(() => {
    const pitch = n > 1 ? Math.min(Math.max(0.12 * dU, 0.3), 5 / (n - 1), 0.6) : 0;
    const w = Math.min(n > 1 ? pitch * 0.7 : 1, 0.06 + 0.07 * a);
    const bars: { y: number; h: number }[] = [];
    let lo = -HALF;
    for (let i = 0; i < n; i++) {
      const c = (i - (n - 1) / 2) * pitch;
      bars.push({ y: (lo + (c - w / 2)) / 2, h: c - w / 2 - lo });
      lo = c + w / 2;
    }
    bars.push({ y: (lo + HALF) / 2, h: HALF - lo });
    const centres = Array.from({ length: n }, (_, i) => (i - (n - 1) / 2) * pitch);
    return { bars, centres };
  }, [n, dU, a]);

  const rays = useMemo(() => {
    const pts: [number, number, number][] = [];
    const M = Math.min(info.maxOrder, 8);
    for (let m = -M; m <= M; m++) {
      const s = (m * lam) / dU, y = (D * s) / Math.sqrt(Math.max(0.001, 1 - s * s));
      if (Math.abs(y) > HALF) continue;
      pts.push([XP, 0, 0], [XS - 0.03, y, 0]);
    }
    return pts;
  }, [info.maxOrder, lam, dU]);

  const missingTxt = info.missing.length
    ? `${info.missing.slice(0, 3).join(", ")}${info.missing.length > 3 ? "…" : ""}`
    : "none";

  return (
    <LabFrame
      label="Precision Optical Bench: laser diode emitter, micrometric aperture slide, coherent diffracted rays, and real-time intensity curve on detector screen"
      camera={[-7.5, 2.8, 10.5]}
      animated={false}
      onReset={reset}
      note={
        <p>
          Diffraction occurs when coherent light waves bend around narrow apertures. For an aperture width <b>a</b> and slit spacing <b>d</b>, the resulting intensity pattern is modulated by both single-slit diffraction envelope <b>sinc²(β)</b> and multiple-beam interference grating equation <b>d · sin(θ) = m · λ</b>.
        </p>
      }
      scene={() => (
        <group>
          {/* Heavy Black Anodized Optical Breadboard Rail */}
          <mesh position={[0, -HALF - 0.28, 0]}>
            <boxGeometry args={[14.5, 0.28, 3.2]} />
            <meshStandardMaterial color="#0b0f17" metalness={0.85} roughness={0.25} />
          </mesh>
          {/* Rail Center Guide Track */}
          <mesh position={[0, -HALF - 0.12, 0]}>
            <boxGeometry args={[14.2, 0.05, 0.4]} />
            <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.15} />
          </mesh>

          {/* Precision Laser Head Mount & Tube */}
          <group position={[-6.0, 0, 0]}>
            {/* Base carrier slide */}
            <mesh position={[0, -HALF + 0.1, 0]}>
              <boxGeometry args={[1.4, 0.45, 1.2]} />
              <meshStandardMaterial color="#1e293b" metalness={0.8} />
            </mesh>
            {/* Stainless post */}
            <mesh position={[0, -HALF / 2, 0]}>
              <cylinderGeometry args={[0.12, 0.12, HALF, 24]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.1} />
            </mesh>
            {/* Cylindrical Laser Diode Casing */}
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.38, 0.38, 1.6, 32]} />
              <meshStandardMaterial color="#1e1b18" metalness={0.9} roughness={0.2} />
            </mesh>
            {/* Laser Heatsink Ribs */}
            {[-0.4, -0.2, 0, 0.2, 0.4].map((rx, i) => (
              <mesh key={i} position={[rx, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.44, 0.44, 0.04, 32]} />
                <meshStandardMaterial color="#334155" metalness={0.8} />
              </mesh>
            ))}
            {/* Glowing Laser Output Aperture */}
            <mesh position={[0.82, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.12, 0.12, 0.05, 24]} />
              <meshStandardMaterial color={col} emissive={col} emissiveIntensity={2.5} />
            </mesh>
          </group>

          {/* Expanding Coherent Incident Light Cone */}
          <mesh position={[(-5.2 + XP) / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[2.2, 0.15, XP + 5.2, 32, 1, true]} />
            <meshBasicMaterial color={col} transparent opacity={0.18} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>

          {/* Aperture Slit Plate Optical Carrier */}
          <group position={[XP, 0, 0]}>
            {/* Base carrier */}
            <mesh position={[0, -HALF + 0.1, 0]}>
              <boxGeometry args={[1.1, 0.45, 1.2]} />
              <meshStandardMaterial color="#1e293b" metalness={0.8} />
            </mesh>
            {/* Stainless post */}
            <mesh position={[0, -HALF / 2, 0]}>
              <cylinderGeometry args={[0.12, 0.12, HALF, 24]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.1} />
            </mesh>
            {/* Outer Slide Frame */}
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[0.22, 2 * HALF + 0.2, 4.4]} />
              <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
            </mesh>
            {/* Aperture Bars */}
            {plate.bars.map(
              (b, i) =>
                b.h > 0.001 && (
                  <mesh key={i} position={[0, b.y, 0]}>
                    <boxGeometry args={[0.24, b.h, 4.1]} />
                    <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
                  </mesh>
                )
            )}
            {/* Glowing Slit Center Gaps */}
            {plate.centres.map((c, i) => (
              <mesh key={i} position={[0.13, c, 0]}>
                <boxGeometry args={[0.03, 0.04, 4.1]} />
                <meshStandardMaterial color={col} emissive={col} emissiveIntensity={1.8} />
              </mesh>
            ))}
          </group>

          {/* Observation Screen & High-Res Detector Plane */}
          <group position={[XS, 0, 0]}>
            {/* Base carrier */}
            <mesh position={[0, -HALF + 0.1, 0]}>
              <boxGeometry args={[1.2, 0.45, 1.4]} />
              <meshStandardMaterial color="#1e293b" metalness={0.8} />
            </mesh>
            {/* Stainless post */}
            <mesh position={[0, -HALF / 2, 0]}>
              <cylinderGeometry args={[0.14, 0.14, HALF, 24]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.95} />
            </mesh>
            {/* Screen Front Fringe Canvas */}
            <mesh position={[0, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
              <planeGeometry args={[4.4, 2 * HALF]} />
              <meshBasicMaterial map={tex} toneMapped={false} />
            </mesh>
            {/* Screen Bevel Housing */}
            <mesh position={[0.04, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
              <boxGeometry args={[4.6, 2 * HALF + 0.2, 0.08]} />
              <meshStandardMaterial color="#0f172a" metalness={0.8} />
            </mesh>
          </group>

          {/* Coherent Diffracted Laser Rays */}
          {rays.length > 0 && <Line points={rays} segments color={col} lineWidth={1.5} transparent opacity={0.65} />}

          {/* 3D Intensity Profile Oscilloscope Curve */}
          <Line points={curve} color="#ffffff" lineWidth={2.5} />
          <Line points={[[XS - 0.04, -HALF, 0.04], [XS - 0.04, HALF, 0.04]]} color="#38bdf8" lineWidth={1.2} />
        </group>
      )}
      readouts={[
        ["Laser Wavelength λ", `${nm} nm`],
        ["1st minimum angle", info.firstMinDeg === null ? "none (λ > a)" : `${info.firstMinDeg.toFixed(2)}°`],
        ["1st order fringe angle", info.firstOrderDeg === null ? "none (λ > d)" : `${info.firstOrderDeg.toFixed(2)}°`],
        ["Central envelope maxima count", String(info.inEnvelope)],
        ["Spectral resolving power R = mN", String(info.R)],
        ["Missing spectral orders", n === 1 ? "n/a (single slit)" : missingTxt],
      ]}
      controls={
        <>
          <Slider label="Light wavelength λ" value={nm} min={380} max={750} step={5} digits={0} unit=" nm" onChange={setNm} />
          <Slider label="Slit width a" value={a} min={0.5} max={10} step={0.1} digits={1} unit=" μm" onChange={setA} />
          <Slider label="Slit separation d" value={d} min={1} max={25} step={0.2} digits={1} unit=" μm" onChange={setD} />
          <Slider label="Number of slits N" value={N} min={1} max={12} step={1} digits={0} onChange={setN} />
        </>
      }
    />
  );
}
