"use client";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Tick, useQuality } from "../Stage";
import { LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { CORE_SPECS } from "../meta/core.specs";

const HALF = 4;
function paintWave(geo: THREE.PlaneGeometry, sources: { x: number; y: number }[], k: number, t: number, amp: number) {
  const p = geo.attributes.position;
  let col = geo.attributes.color as THREE.BufferAttribute | undefined;
  if (!col) { col = new THREE.BufferAttribute(new Float32Array(p.count * 3), 3); geo.setAttribute("color", col); }
  const posArr = p.array as Float32Array;
  const colArr = col.array as Float32Array;
  const nSrc = sources.length;
  
  for (let i = 0, j = 0; i < p.count; i++, j += 3) {
    const x = posArr[j];
    const y = posArr[j + 1];
    let s = 0;
    for (let si = 0; si < nSrc; si++) {
      const dx = x - sources[si].x;
      const dy = y - sources[si].y;
      const d = Math.sqrt(dx * dx + dy * dy);
      s += Math.sin(k * d - t) / Math.sqrt(1 + d * 0.8);
    }
    const h = s * amp;
    posArr[j + 2] = h * 0.85;

    // Fast water shader coloring: deep indigo in troughs, aqua in crests, bright white peaks
    const norm = Math.max(-1, Math.min(1, h * 1.6));
    if (norm > 0) {
      colArr[j] = 0.05 + norm * 0.45;     // R
      colArr[j + 1] = 0.45 + norm * 0.55; // G
      colArr[j + 2] = 0.75 + norm * 0.25; // B
    } else {
      colArr[j] = 0.02 + (1 + norm) * 0.03;
      colArr[j + 1] = 0.15 + (1 + norm) * 0.3;
      colArr[j + 2] = 0.4 + (1 + norm) * 0.35;
    }
  }
  p.needsUpdate = true;
  col.needsUpdate = true;
  geo.computeVertexNormals();
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
