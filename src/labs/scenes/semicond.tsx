"use client";
import { Line } from "@react-three/drei";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { MATS, semicond, type Mat } from "../sim/elexx";
import { fmtSci, prng } from "../sim/physics";
import { Tick, useQuality } from "../Stage";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { SEMI_LATTICE } from "./semicond-lattice";
import { ELEXX_SPECS } from "../meta/elexx.specs";
import { C, Instances, type Inst } from "../kit";

const NC = 40, rnd = prng(91);
const X0 = Float32Array.from({ length: NC }, () => rnd()), Y0 = Float32Array.from({ length: NC }, () => rnd() * 2 - 1), Z0 = Float32Array.from({ length: NC }, () => rnd() * 2 - 1), PH = Float32Array.from({ length: NC }, () => rnd() * 6.28);
const _o = new THREE.Object3D();
function paint(m: THREE.InstancedMesh, n: number, shift: number, t: number, sign: number) {
  for (let i = 0; i < NC; i++) {
    if (i >= n) { _o.position.set(0, -99, 0); _o.scale.setScalar(0.0001); }
    else {
      const x = (((X0[i] + sign * shift) % 1) + 1) % 1;
      _o.position.set(-2.4 + x * 4.8 + 0.08 * Math.sin(t * 7 + PH[i]), Y0[i] * 1.2 + 0.08 * Math.cos(t * 6 + PH[i]), Z0[i] * 1.2);
      _o.scale.setScalar(1);
    }
    _o.updateMatrix(); m.setMatrixAt(i, _o.matrix);
  }
  m.instanceMatrix.needsUpdate = true;
}
function Carriers({ n, speed, color, sign }: { n: number; speed: number; color: string; sign: number }) {
  const ref = useRef<THREE.InstancedMesh>(null), shift = useRef(0), t = useRef(0);
  useLayoutEffect(() => { if (ref.current) paint(ref.current, n, shift.current, t.current, sign); }, [n, sign]);
  const tick = (dt: number) => { const d = Math.min(dt, 0.05); t.current += d; shift.current += d * speed; if (ref.current) paint(ref.current, n, shift.current, t.current, sign); };
  return (<><Tick fn={tick} /><instancedMesh ref={ref} args={[undefined, undefined, NC]} frustumCulled={false}><sphereGeometry args={[0.09, 10, 10]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.7} /></instancedMesh></>);
}

export default function SemicondLab() {
  const q = useQuality();
  const [P, set, reset] = useLabParams(ELEXX_SPECS.semicond);
  const { T, logN, E, mat, type } = P;
  const s = semicond(mat, T, type, logN, E);
  // carrier counts on a log scale so 10¹⁰ and 10¹⁹ both show something
  const vis = (c: number) => Math.round(Math.max(0, Math.min(NC, (Math.log10(Math.max(1, c)) - 6) * 3.2)));
  const ne = vis(s.n), nh = vis(s.p);
  const atoms = useMemo<Inst[]>(() => SEMI_LATTICE.map((p, i) => ({ p, s: [0.22, 0.22, 0.22], c: type !== "intrinsic" && i % 9 === 4 ? (type === "n" ? C.green : C.purple) : "#8d9aa1" })), [type]);
  const sp = Math.min(1.2, E / 400);
  const band = 1.6, ef = Math.max(-0.75, Math.min(0.75, s.EF / s.Eg)) * band;
  return (
    <LabFrame
      label="A crystal lattice of atoms with dopant atoms highlighted; free electrons (blue) drift against the field and holes (red) drift with it; on the right an energy band diagram shows the conduction and valence bands and the Fermi level"
      camera={[1, 1.2, 8.6]}
      onReset={reset}
      scene={() => (<group>
        <group position={[-1.6, 0, 0]}>
          <Instances items={atoms} cap={SEMI_LATTICE.length} shape="sphere" />
          <Carriers n={q === "low" ? Math.ceil(ne / 2) : ne} speed={sp} color={C.blue} sign={-1} />
          <Carriers n={q === "low" ? Math.ceil(nh / 2) : nh} speed={sp * 0.5} color={C.red} sign={1} />
        </group>
        <group position={[3.4, 0, 0]}>
          <mesh position={[0, band + 0.5, 0]}><boxGeometry args={[1.6, 1, 0.2]} /><meshStandardMaterial color={C.blue} transparent opacity={0.45} /></mesh>
          <mesh position={[0, -band - 0.5, 0]}><boxGeometry args={[1.6, 1, 0.2]} /><meshStandardMaterial color={C.red} transparent opacity={0.45} /></mesh>
          <Line points={[[-0.9, 0, 0.12], [0.9, 0, 0.12]]} color={C.grey} lineWidth={1} dashed dashSize={0.08} gapSize={0.06} />
          <Line points={[[-0.9, ef, 0.15], [0.9, ef, 0.15]]} color={C.gold} lineWidth={3} />
        </group>
      </group>)}
      readouts={[
        ["Intrinsic n_i", `${fmtSci(s.ni)} cm⁻³`],
        ["Electrons n", `${fmtSci(s.n)} cm⁻³`],
        ["Holes p", `${fmtSci(s.p)} cm⁻³`],
        ["E_F − E_i", `${s.EF >= 0 ? "+" : "−"}${Math.abs(s.EF).toFixed(3)} eV`],
        ["Conductivity σ", `${fmtSci(s.sigma)} S/cm`],
        ["Drift current density J = σE", `${fmtSci(s.J)} A/cm²`],
      ]}
      controls={<>
        <Slider label="Temperature T" value={T} min={200} max={500} step={1} digits={0} unit=" K" onChange={(x) => set("T", x)} />
        <Pick label="Material" value={mat} options={(Object.keys(MATS) as Mat[]).map((k) => ({ id: k, label: `${MATS[k].name} (E_g ${MATS[k].Eg} eV)` }))} onChange={(x) => set("mat", x)} />
        <Pick label="Doping" value={type} options={[{ id: "intrinsic", label: "Intrinsic (pure)" }, { id: "n", label: "n-type (P, As donors)" }, { id: "p", label: "p-type (B acceptors)" }]} onChange={(x) => set("type", x)} />
        <Slider label="Doping level log₁₀ N (cm⁻³)" value={logN} min={14} max={19} step={0.1} digits={1} onChange={(x) => set("logN", x)} />
        <Slider label="Electric field E" value={E} min={0} max={1000} step={10} digits={0} unit=" V/cm" onChange={(x) => set("E", x)} />
      </>}
      note={<p>At any temperature above 0 K some covalent bonds break and free an electron into the conduction band, leaving a hole: n = p = n<sub>i</sub> ∝ T<sup>3/2</sup>e<sup>−E<sub>g</sub>/2kT</sup>. Doping with pentavalent donors (green) adds electrons, trivalent acceptors (purple) add holes, and the <b>law of mass action</b> np = n<sub>i</sub>² pushes the minority carrier down. The Fermi level moves from mid-gap towards the conduction band (n-type) or valence band (p-type): E<sub>F</sub> − E<sub>i</sub> = kT ln(n/n<sub>i</sub>). In a field, electrons drift against E and holes with it, giving σ = q(nμ<sub>n</sub> + pμ<sub>p</sub>) and J = σE. Carrier dots are on a log scale; mobilities fall as T<sup>−3/2</sup>.</p>}
    />
  );
}
