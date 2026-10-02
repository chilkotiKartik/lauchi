"use client";
import { Line } from "@react-three/drei";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { partialSums, seriesInfo, seriesTerm, seriesTerms, type SeriesId } from "../sim/mathsb";
import { Tick } from "../Stage";
import { LabFrame, Slider, Pick } from "../ui";
import { useLabParams } from "../params";
import { MATHSB_SPECS } from "../meta/mathsb.specs";

const LABELS: Record<SeriesId, string> = {
  geometric: "Geometric Σ rⁿ",
  pseries: "p-series Σ 1/nᵖ",
  altharm: "Alternating harmonic Σ (−1)ⁿ⁺¹/n",
  nfact: "Σ n!/nⁿ",
  invfact: "Σ 1/n!",
};
const HALF = 4, TOP = 3, VMAX = 40;
const clampH = (v: number, vt: number) => Math.max(-TOP, Math.min(TOP, (v / vt) * TOP));
const num = (x: number) => (Math.abs(x) >= 1e6 ? x.toExponential(3) : x.toFixed(6));

/** The terms aₙ as instanced 3D bars (blue positive, orange negative, red where clipped off the scale). */
function Bars({ terms, vt }: { terms: number[]; vt: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const o = useMemo(() => new THREE.Object3D(), []);
  useLayoutEffect(() => {
    const m = ref.current; if (!m) return;
    const n = terms.length, sp = (2 * HALF) / n, col = new THREE.Color();
    for (let i = 0; i < n; i++) {
      const a = terms[i], h = clampH(a, vt), ah = Math.max(0.012, Math.abs(h));
      o.position.set(-HALF + sp * (i + 0.5), (Math.sign(h) || 1) * ah / 2, 0); o.rotation.set(0, 0, 0);
      o.scale.set(sp * 0.72, ah, 0.55); o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
      m.setColorAt(i, col.set(Math.abs(a) > vt ? "#ff5a5f" : a >= 0 ? "#2ba6f5" : "#ff9a1f"));
    }
    m.count = n; m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [terms, vt, o]);
  return <instancedMesh ref={ref} args={[undefined, undefined, 60]}><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial roughness={0.45} /></instancedMesh>;
}

export default function SeriesLab() {
  const [P, set, reset] = useLabParams(MATHSB_SPECS.series);
  const { id, r, p } = P;
  const n = Math.round(P.N);
  const terms = useMemo(() => seriesTerms(id, n, r, p), [id, n, r, p]);
  const sums = useMemo(() => partialSums(terms), [terms]);
  const info = useMemo(() => seriesInfo(id, r, p), [id, r, p]);
  const vt = useMemo(() => {
    let v = 1e-9;
    for (let i = 0; i < n; i++) v = Math.max(v, Math.abs(sums[i]), Math.abs(terms[i]));
    if (info.limit !== null) v = Math.max(v, Math.abs(info.limit));
    return Math.min(v, VMAX);
  }, [terms, sums, n, info]);
  const line = useMemo(() => sums.map((s, i) => [-HALF + ((i + 0.5) * 2 * HALF) / n, clampH(s, vt), -1.6] as [number, number, number]), [sums, n, vt]);
  const mark = useRef<THREE.Mesh>(null), prog = useRef(0);
  const tick = (dt: number) => {
    prog.current = (prog.current + Math.min(dt, 0.05) * 0.2) % 1.25;
    const f = Math.min(1, prog.current) * (line.length - 1), i = Math.min(line.length - 2, Math.floor(f)), t = f - i, a = line[i], b = line[i + 1];
    mark.current?.position.set(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, -1.6);
  };
  const aN = seriesTerm(id, n, r, p), aN1 = seriesTerm(id, n + 1, r, p), ratioN = aN === 0 ? NaN : Math.abs(aN1 / aN);
  const L = info.ratio, rt = L < 1 - 1e-9 ? "converges" : L > 1 + 1e-9 ? "diverges" : "inconclusive";
  const SN = sums[n - 1], limY = info.limit === null ? 0 : clampH(info.limit, vt);
  return (
    <LabFrame
      label="Terms of an infinite series as 3D bars with the partial sums rising as a line towards a translucent limit plane"
      camera={[3.5, 2.5, 11]}
      onReset={reset}
      scene={() => (<group>
        <Tick fn={tick} />
        <Line points={[[-HALF - 0.2, 0, 0.3], [HALF + 0.2, 0, 0.3]]} color="#5b6d77" lineWidth={1.5} />
        <Bars terms={terms} vt={vt} />
        <Line points={line} color="#44c95a" lineWidth={3} />
        <mesh ref={mark}><sphereGeometry args={[0.13, 14, 12]} /><meshBasicMaterial color="#ffc83d" /></mesh>
        {info.limit !== null && (<>
          <mesh position={[0, limY, -0.8]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[2 * HALF + 0.4, 3.6]} /><meshBasicMaterial color="#ffc83d" transparent opacity={0.2} side={THREE.DoubleSide} depthWrite={false} /></mesh>
          <Line points={[[-HALF - 0.2, limY, -1.6], [HALF + 0.2, limY, -1.6]]} color="#ffc83d" lineWidth={2} />
        </>)}
        <gridHelper args={[9, 18, "#3a4d57", "#26343c"]} position={[0, -TOP - 0.05, -0.8]} />
      </group>)}
      readouts={[
        ["Partial sum S_N", num(SN)],
        ["Known limit", info.limitText],
        ["|S_N − limit|", info.limit === null ? "—" : Math.abs(SN - info.limit).toExponential(2)],
        ["Ratio |aₙ₊₁/aₙ| at n = N", Number.isFinite(ratioN) ? ratioN.toFixed(4) : "—"],
        ["Ratio test: L = lim |aₙ₊₁/aₙ|", `${L.toFixed(4)}, ${rt}`],
        ["Verdict", info.verdict],
      ]}
      controls={<>
        <Slider label="Terms N" value={P.N} min={2} max={60} step={1} digits={0} onChange={(v) => set("N", v)} />
        <Pick label="Series" value={id} options={(Object.keys(LABELS) as SeriesId[]).map((k) => ({ id: k, label: LABELS[k] }))} onChange={(v) => set("id", v)} />
        <Slider label="Ratio r (geometric only)" value={r} min={-1.5} max={1.5} step={0.05} digits={2} onChange={(v) => set("r", v)} />
        <Slider label="Exponent p (p-series only)" value={p} min={0.5} max={4} step={0.1} digits={1} onChange={(v) => set("p", v)} />
      </>}
      note={<p>Bars are the terms aₙ (blue positive, orange negative, red where a value runs off the vertical scale); the green line at the back is the partial sums S_N = a₁ + … + a_N, and the translucent gold plane is the limit when one is known: geometric Σ rⁿ → 1/(1 − r) for |r| &lt; 1, p-series Σ 1/nᵖ → ζ(p) (π²/6 for p = 2), alternating harmonic → ln 2, Σ 1/n! → e − 1. D&apos;Alembert&apos;s ratio test says Σ aₙ converges if L = lim |aₙ₊₁/aₙ| &lt; 1, diverges if L &gt; 1 and is inconclusive if L = 1: the p-series and the alternating harmonic series both have L = 1, so other tests decide (p-series test, Leibniz). Try p = 1 (harmonic, diverges), r = 1 (terms do not tend to 0) and Σ n!/nⁿ, whose ratio tends to 1/e.</p>}
    />
  );
}
