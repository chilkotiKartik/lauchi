"use client";
import { Line } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { diffraction, nmToRgb, slitIntensity } from "../sim/physics";
import { LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { PHYSICS_SPECS } from "../meta/physics.specs";

const D = 6;            // slit-to-screen distance, scene units (the screen shows |y| ≤ HALF)
const HALF = 3;
const XP = -3, XS = 3;  // plate and screen positions along the beam (x)
const TEX = 2048, CURVE = 480;

/** 1 × TEX colour strip: brightness follows I(θ) at each screen height, tinted with the light's colour. */
function makeScreenTexture(nm: number, a: number, d: number, N: number) {
  const lam = nm * 1e-3, col = nmToRgb(nm), data = new Uint8Array(TEX * 4);
  for (let i = 0; i < TEX; i++) {
    const y = (i / (TEX - 1) - 0.5) * 2 * HALF, sinT = y / Math.hypot(y, D);
    const I = slitIntensity(sinT, lam, a, d, N), v = Math.pow(I, 0.45), w = Math.pow(I, 3) * 0.3;
    for (let c = 0; c < 3; c++) data[i * 4 + c] = Math.round(255 * Math.min(1, 0.05 + col[c] * v * 0.95 + w));
    data[i * 4 + 3] = 255;
  }
  const tex = new THREE.DataTexture(data, 1, TEX, THREE.RGBAFormat);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

export default function DiffractionLab() {
  const [P, set, reset] = useLabParams(PHYSICS_SPECS.diffraction);
  const { nm, a, d, N } = P;
  const setNm = (x: (typeof P)["nm"]) => set("nm", x), setA = (x: (typeof P)["a"]) => set("a", x), setD = (x: (typeof P)["d"]) => set("d", x), setN = (x: (typeof P)["N"]) => set("N", x);
  const n = Math.round(N);
  const info = diffraction(nm, a, d, n);
  const lam = nm * 1e-3, dU = info.dUsed;
  const col = useMemo(() => { const c = nmToRgb(nm); return new THREE.Color(c[0], c[1], c[2]); }, [nm]);
  const tex = useMemo(() => makeScreenTexture(nm, a, dU, n), [nm, a, dU, n]);
  useEffect(() => () => tex.dispose(), [tex]);
  const curve = useMemo(() => {
    const pts: [number, number, number][] = [];
    for (let i = 0; i < CURVE; i++) {
      const y = (i / (CURVE - 1) - 0.5) * 2 * HALF, sinT = y / Math.hypot(y, D);
      pts.push([XS - 0.03 - 1.7 * slitIntensity(sinT, lam, a, dU, n), y, 0.02]);
    }
    return pts;
  }, [lam, a, dU, n]);
  // Slit plate (not to scale): n gaps, spacing and width follow d and a loosely.
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
  // Rays to the principal maxima that land on the screen.
  const rays = useMemo(() => {
    const pts: [number, number, number][] = [];
    const M = Math.min(info.maxOrder, 8);
    for (let m = -M; m <= M; m++) {
      const s = (m * lam) / dU, y = (D * s) / Math.sqrt(1 - s * s);
      if (Math.abs(y) > HALF) continue;
      pts.push([XP, 0, 0], [XS - 0.02, y, 0]);
    }
    return pts;
  }, [info.maxOrder, lam, dU]);
  const missingTxt = info.missing.length ? `${info.missing.slice(0, 3).join(", ")}${info.missing.length > 3 ? "…" : ""}` : "none";
  return (
    <LabFrame
      label="Coloured light passing through slits in a plate and forming a diffraction pattern on a screen, with its intensity curve in front"
      camera={[-7, 2.5, 10]}
      animated={false}
      onReset={reset}
      scene={() => (<group>
        <gridHelper args={[16, 16, "#3a4c56", "#22323b"]} position={[0, -HALF - 0.3, 0]} />
        <mesh position={[-6, 0, 0]}><sphereGeometry args={[0.35, 20, 16]} /><meshBasicMaterial color={col} /></mesh>
        <mesh position={[(-6 + XP) / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[2.3, 0.35, XP + 6, 24, 1, true]} /><meshBasicMaterial color={col} transparent opacity={0.16} side={THREE.DoubleSide} depthWrite={false} /></mesh>
        {plate.bars.map((b, i) => (b.h > 0.001 && <mesh key={i} position={[XP, b.y, 0]}><boxGeometry args={[0.14, b.h, 4.4]} /><meshStandardMaterial color="#5b6d77" roughness={0.6} /></mesh>))}
        {plate.centres.map((c, i) => (<mesh key={i} position={[XP + 0.09, c, 0]}><boxGeometry args={[0.02, 0.03, 4.4]} /><meshBasicMaterial color={col} /></mesh>))}
        <mesh position={[XS, 0, 0]} rotation={[0, -Math.PI / 2, 0]}><planeGeometry args={[4.4, 2 * HALF]} /><meshBasicMaterial map={tex} toneMapped={false} /></mesh>
        <mesh position={[XS + 0.03, 0, 0]} rotation={[0, -Math.PI / 2, 0]}><planeGeometry args={[4.6, 2 * HALF + 0.2]} /><meshStandardMaterial color="#2b3a43" /></mesh>
        {rays.length > 0 && <Line points={rays} segments color={col} lineWidth={1.2} transparent opacity={0.55} />}
        <Line points={curve} color="#ffffff" lineWidth={2} />
        <Line points={[[XS - 0.03, -HALF, 0.02], [XS - 0.03, HALF, 0.02]]} color="#9db0ba" lineWidth={1} />
      </group>)}
      readouts={[
        ["1st minimum sin⁻¹(λ/a)", info.firstMinDeg === null ? "none (λ > a)" : `${info.firstMinDeg.toFixed(1)}°`],
        ["1st order sin⁻¹(λ/d)", info.firstOrderDeg === null ? "none (λ > d)" : `${info.firstOrderDeg.toFixed(1)}°`],
        ["Maxima in central envelope", String(info.inEnvelope)],
        ["Resolving power R = mN (m = 1)", String(info.R)],
        ["Smallest Δλ = λ/R", `${info.dLambdaNm.toFixed(1)} nm`],
        ["Missing orders", n === 1 ? "n/a (one slit)" : missingTxt],
      ]}
      controls={<>
        <Slider label="Wavelength λ" value={nm} min={400} max={700} step={5} digits={0} unit=" nm" onChange={setNm} />
        <Slider label="Slit width a" value={a} min={0.5} max={10} step={0.1} digits={1} unit=" µm" onChange={setA} />
        <Slider label="Slit spacing d" value={d} min={1} max={30} step={0.5} digits={1} unit=" µm" onChange={setD} />
        <Slider label="Number of slits N" value={N} min={1} max={10} step={1} digits={0} onChange={setN} />
      </>}
      note={<p>Each slit spreads light by diffraction, and the N slits interfere. The screen intensity is I = I₀ (sin β / β)² · (sin Nγ / N sin γ)² with β = πa sin θ / λ and γ = πd sin θ / λ. The first factor is the single-slit envelope, with its first minimum where a sin θ = λ. The second gives sharp principal maxima at d sin θ = mλ, with N − 2 weak subsidiary maxima between them; more slits make them narrower, so the resolving power is R = mN. If d/a is a whole number, order m = d/a lands on an envelope minimum and vanishes (a missing order). Set N = 1 for a single slit. The screen brightness and the white curve come from this formula for the light&apos;s real colour; the plate is drawn not to scale, and d is never allowed to be smaller than a.</p>}
    />
  );
}
