"use client";
import { Line } from "@react-three/drei";
import { useRef } from "react";
import type * as THREE from "three";
import { cft, complementName, LEVELS, type Geometry } from "../sim/chemx";
import { Tick } from "../Stage";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { CHEMX_SPECS } from "../meta/chemx.specs";
import { C, Ball, type V3 } from "../kit";
import { Rod, mix } from "../kit2";

const POS: Record<Geometry, V3[]> = {
  oct: [[1.6, 0, 0], [-1.6, 0, 0], [0, 1.6, 0], [0, -1.6, 0], [0, 0, 1.6], [0, 0, -1.6]],
  tet: [[0.95, 0.95, 0.95], [-0.95, -0.95, 0.95], [-0.95, 0.95, -0.95], [0.95, -0.95, -0.95]],
  sqp: [[1.6, 0, 0], [-1.6, 0, 0], [0, 0, 1.6], [0, 0, -1.6]],
};
const SUP = "⁰¹²³⁴⁵⁶⁷⁸⁹";
const sup = (n: number) => SUP[n] ?? String(n);

function Spin({ p, up }: { p: V3; up: boolean }) {
  return (<group position={p} rotation={[0, 0, up ? 0 : Math.PI]}>
    <mesh position={[0, 0.06, 0]}><coneGeometry args={[0.08, 0.2, 10]} /><meshStandardMaterial color={up ? C.gold : C.orange} emissive={up ? C.gold : C.orange} emissiveIntensity={0.5} /></mesh>
    <mesh position={[0, -0.08, 0]}><cylinderGeometry args={[0.025, 0.025, 0.18, 6]} /><meshStandardMaterial color={up ? C.gold : C.orange} /></mesh>
  </group>);
}

export default function CftLab() {
  const [P, set, reset] = useLabParams(CHEMX_SPECS.cft);
  const { d, D, P: pair, geo } = P;
  const n = Math.round(d);
  const r = cft(n, geo, D, pair);
  const lv = LEVELS[geo];
  const scale = 0.9 + (r.D / 40000) * 1.6;
  const ligCol = mix(C.blue, C.red, (D - 5000) / 35000);
  const g = useRef<THREE.Group>(null), t = useRef(0);
  const tick = (dt: number) => { t.current += Math.min(dt, 0.05); const s = 1 + 0.04 * Math.sin(t.current * 1.6); g.current?.scale.set(s, s, s); if (g.current) g.current.rotation.y = t.current * 0.25; };
  // x-offsets for degenerate orbitals within one energy level
  const groups: { e: number; idx: number[] }[] = [];
  lv.forEach((o, i) => { const gg = groups.find((x) => Math.abs(x.e - o.e) < 1e-9); if (gg) gg.idx.push(i); else groups.push({ e: o.e, idx: [i] }); });
  const config = geo === "oct" ? `t₂g${sup(r.occ[0] + r.occ[1] + r.occ[2])} e_g${sup(r.occ[3] + r.occ[4])}` : geo === "tet" ? `e${sup(r.occ[0] + r.occ[1])} t₂${sup(r.occ[2] + r.occ[3] + r.occ[4])}` : `(yz,zx)${sup(r.occ[0] + r.occ[1])} z²${sup(r.occ[2])} xy${sup(r.occ[3])} x²−y²${sup(r.occ[4])}`;
  return (
    <LabFrame
      label="A metal ion surrounded by ligands in the chosen geometry, next to an energy-level diagram of the five d-orbitals with electrons drawn as up and down arrows"
      camera={[1.2, 1.4, 9]}
      onReset={reset}
      scene={() => (<group>
        <group position={[-2.6, 0, 0]}>
          <Tick fn={tick} />
          <group ref={g}>
            <Ball p={[0, 0, 0]} r={0.5} c={C.purple} glow={0.3} />
            {POS[geo].map((p, i) => <group key={i}><Rod a={[0, 0, 0]} b={p} r={0.05} color={C.light} /><Ball p={p} r={0.32} c={ligCol} glow={0.15} /></group>)}
          </group>
        </group>
        <group position={[1.4, 0, 0]}>
          <Line points={[[0, -2.2, 0], [0, 2.4, 0]]} color={C.light} lineWidth={1.5} />
          <Line points={[[0.2, 0, 0], [3.8, 0, 0]]} color={C.grey} lineWidth={1} dashed dashSize={0.1} gapSize={0.08} />
          {groups.map((gr) => gr.idx.map((i, k) => {
            const x = 0.6 + (k - (gr.idx.length - 1) / 2) * 0.95 + 1.4, y = gr.e * scale;
            return (<group key={i}>
              <Line points={[[x - 0.38, y, 0], [x + 0.38, y, 0]]} color={r.occ[i] ? C.green : C.light} lineWidth={3} />
              {r.occ[i] >= 1 && <Spin p={[x - 0.1, y + 0.17, 0.02]} up />}
              {r.occ[i] === 2 && <Spin p={[x + 0.12, y + 0.17, 0.02]} up={false} />}
            </group>);
          }))}
        </group>
      </group>)}
      readouts={[
        ["Configuration", config],
        ["Unpaired electrons", String(r.unpaired)],
        ["Spin-only μ = √(n(n+2))", `${r.mu.toFixed(2)} BM (${r.magnetic})`],
        ["CFSE", `${r.cfse.toFixed(2)} Δ (${(r.cfseCm / 1000).toFixed(1)}×10³ cm⁻¹)`],
        ["Spin state", geo === "tet" ? "high spin (Δₜ small)" : r.lowSpin ? "low spin (Δ > P)" : "high spin"],
        ["Absorbs ≈ / looks", r.lambdaNm > 0 ? `${r.lambdaNm.toFixed(0)} nm / ${complementName(r.lambdaNm)}` : "—"],
      ]}
      controls={<>
        <Slider label="d-electron count" value={d} min={1} max={10} step={1} digits={0} onChange={(x) => set("d", x)} />
        <Slider label="Ligand field Δₒ" value={D} min={5000} max={40000} step={100} digits={0} unit=" cm⁻¹" onChange={(x) => set("D", x)} />
        <Slider label="Pairing energy P" value={pair} min={10000} max={30000} step={100} digits={0} unit=" cm⁻¹" onChange={(x) => set("P", x)} />
        <Pick label="Geometry" value={geo} options={[{ id: "oct", label: "Octahedral (6 ligands)" }, { id: "tet", label: "Tetrahedral (4)" }, { id: "sqp", label: "Square planar (4)" }]} onChange={(x) => set("geo", x)} />
      </>}
      note={<p>Negative ligands (coloured from weak field, blue, to strong field, red) repel the metal’s d-electrons. In an octahedron the d<sub>x²−y²</sub> and d<sub>z²</sub> orbitals point straight at the ligands and rise to e<sub>g</sub> (+0.6Δₒ), while d<sub>xy</sub>, d<sub>yz</sub>, d<sub>zx</sub> fall to t₂g (−0.4Δₒ). Each extra electron either pairs in a lower orbital (costing the pairing energy P) or climbs the gap Δ: <b>Δ &gt; P gives low spin</b>, Δ &lt; P high spin. Tetrahedral splitting is only about 4/9 Δₒ and inverted, so tetrahedral complexes are high spin; square-planar d⁸ leaves d<sub>x²−y²</sub> empty and is diamagnetic. Spin-only μ = √(n(n + 2)) BM. The absorbed wavelength ≈ 10⁷/Δ nm, and the colour you see is roughly its complement (one-electron estimate).</p>}
    />
  );
}
