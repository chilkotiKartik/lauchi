"use client";
import { Line } from "@react-three/drei";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { MONOMERS, chainLengths, molarMasses, mulberry32, type MonomerId } from "../sim/chem";
import { Tick, useQuality } from "../Stage";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { CHEM_SPECS } from "../meta/chem.specs";

const BINS = 22, BAR_W = 0.16, HIST_H = 2.6, dummy = new THREE.Object3D();

/** Histogram of the sampled chain lengths (fraction of chains per bin) over 0 … 3n, the last bin also catching longer chains. */
function histogram(lengths: Int32Array, n: number): { frac: number[]; top: number } {
  const top = Math.max(3 * n, 10), frac = new Array<number>(BINS).fill(0);
  for (let i = 0; i < lengths.length; i++) frac[Math.min(BINS - 1, Math.floor((lengths[i] / top) * BINS))]++;
  return { frac: frac.map((c) => c / lengths.length), top };
}

/** A random-coil chain: a persistent random walk scaled to a fixed radius so the coil always fits the view. */
function coilPoints(count: number): THREE.Vector3[] {
  const r = mulberry32(7), pts: THREE.Vector3[] = [], d = new THREE.Vector3(1, 0, 0), p = new THREE.Vector3();
  for (let i = 0; i < count; i++) {
    pts.push(p.clone());
    d.add(new THREE.Vector3(r() - 0.5, r() - 0.5, r() - 0.5).multiplyScalar(1.6)).normalize();
    p.addScaledVector(d, 1);
  }
  const c = new THREE.Vector3(); pts.forEach((q) => c.add(q)); c.divideScalar(count);
  let far = 0; pts.forEach((q) => { q.sub(c); far = Math.max(far, q.length()); });
  const k = 1.5 / Math.max(far, 1e-6);
  pts.forEach((q) => q.multiplyScalar(k));
  return pts;
}

function Bars({ frac }: { frac: number[] }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = ref.current; if (!m) return;
    const peak = Math.max(...frac, 1e-6);
    for (let i = 0; i < BINS; i++) {
      const h = Math.max(0.02, (frac[i] / peak) * HIST_H);
      dummy.position.set(i * BAR_W * 1.08, h / 2, 0); dummy.scale.set(BAR_W, h, BAR_W); dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix); m.setColorAt(i, new THREE.Color().setHSL(0.58 - (i / BINS) * 0.22, 0.85, 0.55));
    }
    m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [frac]);
  return <instancedMesh ref={ref} args={[undefined, undefined, BINS]}><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial roughness={0.5} /></instancedMesh>;
}

function Beads({ pts, color, low }: { pts: THREE.Vector3[]; color: string; low: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = ref.current; if (!m) return;
    pts.forEach((q, i) => { dummy.position.copy(q); dummy.scale.setScalar(1); dummy.updateMatrix(); m.setMatrixAt(i, dummy.matrix); });
    m.count = pts.length; m.instanceMatrix.needsUpdate = true;
  }, [pts]);
  return <instancedMesh ref={ref} args={[undefined, undefined, 300]}><sphereGeometry args={[0.075, low ? 8 : 12, low ? 8 : 12]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.25} roughness={0.4} /></instancedMesh>;
}

export default function PolymerLab() {
  const quality = useQuality();
  const [P, set, reset] = useLabParams(CHEM_SPECS.polymer);
  const { n, spread, monomer } = P;
  const mono = MONOMERS[monomer];
  const lengths = useMemo(() => chainLengths(n, spread), [n, spread]);
  const M = molarMasses(lengths, mono.m0);
  const { frac, top } = useMemo(() => histogram(lengths, n), [lengths, n]);
  const count = Math.min(300, Math.round(n * (quality === "low" ? 0.6 : 1)));
  const pts = useMemo(() => coilPoints(Math.max(5, count)), [count]);
  const grp = useRef<THREE.Group>(null);
  const tick = (dt: number) => { if (grp.current) grp.current.rotation.y += Math.min(dt, 0.05) * 0.5; };
  const xOf = (len: number) => Math.min(BINS, (len / top) * BINS) * BAR_W * 1.08;
  const xMn = xOf(M.DPn), xMw = xOf(M.Mw / mono.m0);
  const k = (v: number) => (v >= 1e4 ? `${(v / 1000).toFixed(1)} kg/mol` : `${v.toFixed(0)} g/mol`);
  return (
    <LabFrame
      label="Left, a coloured histogram of polymer chain lengths with markers for the number-average and weight-average; right, a rotating random-coil chain of beads, one bead per monomer unit"
      camera={[0.4, 0.6, 8.6]}
      onReset={reset}
      scene={() => (<group>
        <Tick fn={tick} />
        <group position={[-4.1, -1.4, 0]}>
          <Bars frac={frac} />
          <mesh position={[xMn, HIST_H / 2 + 0.15, 0]}><boxGeometry args={[0.04, HIST_H + 0.3, 0.3]} /><meshBasicMaterial color="#ffc83d" /></mesh>
          <mesh position={[xMw, HIST_H / 2 + 0.15, 0]}><boxGeometry args={[0.04, HIST_H + 0.3, 0.3]} /><meshBasicMaterial color="#ff5a5f" /></mesh>
          <mesh position={[BINS * BAR_W * 0.54, -0.04, 0]}><boxGeometry args={[BINS * BAR_W * 1.1, 0.05, 0.4]} /><meshStandardMaterial color="#9db0ba" /></mesh>
        </group>
        <group ref={grp} position={[2.4, 0, 0]}>
          <Beads pts={pts} color="#44c95a" low={quality === "low"} />
          <Line points={pts} color="#2ba6f5" lineWidth={1.5} />
          <mesh position={pts[0]}><sphereGeometry args={[0.13, 12, 12]} /><meshStandardMaterial color="#ff9a1f" /></mesh>
          <mesh position={pts[pts.length - 1]}><sphereGeometry args={[0.13, 12, 12]} /><meshStandardMaterial color="#a970ff" /></mesh>
        </group>
      </group>)}
      readouts={[
        ["Polymer", `${mono.polymer} (${mono.abbr})`], ["Monomer mass M₀", `${mono.m0} g/mol`],
        ["Mn (number avg)", k(M.Mn)], ["Mw (weight avg)", k(M.Mw)], ["PDI = Mw/Mn", M.PDI.toFixed(3)], ["Mean chain length DPn", M.DPn.toFixed(1)],
      ]}
      controls={<>
        <Slider label="Average chain length n" value={n} min={5} max={300} step={1} digits={0} unit=" units" onChange={(x) => set("n", x)} />
        <Slider label="Spread of lengths σ" value={spread} min={0} max={1.2} step={0.01} digits={2} onChange={(x) => set("spread", x)} />
        <Pick<MonomerId> label="Monomer" value={monomer} options={(Object.keys(MONOMERS) as MonomerId[]).map((id) => ({ id, label: MONOMERS[id].label }))} onChange={(x) => set("monomer", x)} />
      </>}
      note={<p>Each green bead is one repeat unit joined by addition polymerisation (the C=C double bond opens and links to the next monomer); orange marks the start of the chain and purple the end. The histogram is a seeded sample of 4000 chains with log-normal lengths: gold marks the number-average length and red the weight-average, which is always at or to the right of it. Mn = ΣNᵢMᵢ/ΣNᵢ and Mw = ΣNᵢMᵢ²/ΣNᵢMᵢ, so PDI = Mw/Mn ≥ 1, and long chains count more in Mw. With σ = 0 all chains are equal and PDI = 1; free-radical polymers are typically 1.5–3. Only the coil shape is schematic: real chains are not drawn to scale.</p>}
    />
  );
}
