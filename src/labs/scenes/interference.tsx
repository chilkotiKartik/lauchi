"use client";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { waveField } from "../math";
import { Tick, useQuality } from "../Stage";
import { LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { CORE_SPECS } from "../meta/core.specs";

const HALF = 4;
function paintWave(geo: THREE.PlaneGeometry, sources: { x: number; y: number }[], k: number, t: number, amp: number) {
  const p = geo.attributes.position;
  let col = geo.attributes.color as THREE.BufferAttribute | undefined;
  if (!col) { col = new THREE.BufferAttribute(new Float32Array(p.count * 3), 3); geo.setAttribute("color", col); }
  const c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    const h = waveField(sources, k, t, p.getX(i), p.getY(i)) * amp;
    p.setZ(i, h * 0.9);
    c.setHSL(0.58, 0.75, 0.42 + 0.3 * Math.max(-1, Math.min(1, h * 1.5)));
    col.setXYZ(i, c.r, c.g, c.b);
  }
  p.needsUpdate = true; col.needsUpdate = true; geo.computeVertexNormals();
}
export default function InterferenceLab() {
  const quality = useQuality();
  const [P, set, reset] = useLabParams(CORE_SPECS.interference);
  const { n, lambda, sep } = P;
  const setN = (x: (typeof P)["n"]) => set("n", x), setLambda = (x: (typeof P)["lambda"]) => set("lambda", x), setSep = (x: (typeof P)["sep"]) => set("sep", x);
  const seg = quality === "low" ? 50 : 100;
  const sources = useMemo(() => Array.from({ length: n }, (_, i) => ({ x: -HALF + 0.3, y: (i - (n - 1) / 2) * sep })), [n, sep]);
  const k = (2 * Math.PI) / lambda;
  const geo = useMemo(() => new THREE.PlaneGeometry(2 * HALF, 2 * HALF, seg, seg), [seg]);
  const t = useRef(0);
  useLayoutEffect(() => { paintWave(geo, sources, k, t.current, 1 / n); }, [geo, sources, k, n]);
  const tick = (dt: number) => { t.current += Math.min(dt, 0.05) * 3; paintWave(geo, sources, k, t.current, 1 / n); };
  const sinTheta = lambda / sep;
  return (
    <LabFrame
      label="Live water-wave interference from coherent point sources"
      camera={[6, 5, 6]}
      onReset={reset}
      scene={() => (<group><Tick fn={tick} />
        <mesh geometry={geo} rotation={[-Math.PI / 2, 0, 0]}><meshStandardMaterial vertexColors side={THREE.DoubleSide} roughness={0.4} metalness={0.1} /></mesh>
        {sources.map((s, i) => (<mesh key={i} position={[s.x, 0.15, -s.y]}><sphereGeometry args={[0.12, 16, 16]} /><meshStandardMaterial color="#ffc83d" emissive="#ffc83d" emissiveIntensity={0.6} /></mesh>))}
      </group>)}
      readouts={[["Sources", String(n)], ["Wavelength λ", lambda.toFixed(2)], ["Spacing d", sep.toFixed(2)], ["1st max angle", sinTheta <= 1 ? `${((Math.asin(sinTheta) * 180) / Math.PI).toFixed(1)}°` : "none (λ > d)"]]}
      controls={<>
        <Slider label="Number of sources" value={n} min={2} max={5} step={1} digits={0} onChange={setN} />
        <Slider label="Wavelength λ" value={lambda} min={0.4} max={2} onChange={setLambda} />
        <Slider label="Source spacing d" value={sep} min={0.6} max={3} onChange={setSep} />
      </>}
      note={<p>Every source sends out circular waves; the surface height is their sum at each point, recomputed every frame. Where crests meet crests the height doubles (constructive); crest meets trough and it cancels (destructive). Bright fringes fall where the path difference is a whole number of wavelengths: d sin θ = mλ. Shrink λ or widen d and the fringes squeeze together; add sources and the maxima sharpen.</p>}
    />
  );
}
