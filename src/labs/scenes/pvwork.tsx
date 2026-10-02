"use client";
import { useMemo, useLayoutEffect, useRef } from "react";
import * as THREE from "three";
import { pv, type Proc } from "../sim/mechx";
import { prng } from "../sim/physics";
import { Tick } from "../Stage";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { MECHX_SPECS } from "../meta/mechx.specs";
import { C, Box } from "../kit";
import { Graph, Rod, mix, type XY } from "../kit2";

const NM = 40, rnd = prng(7);
const MX = Float32Array.from({ length: NM }, () => rnd() * 2 - 1), MY = Float32Array.from({ length: NM }, () => rnd()), MZ = Float32Array.from({ length: NM }, () => rnd() * 2 - 1), MV = Float32Array.from({ length: NM }, () => rnd() * 6.28);
const _o = new THREE.Object3D();
/** Piston height (0..1 of the stroke) and gas molecules jiggling faster when hot. */
function paint(m: THREE.InstancedMesh, piston: THREE.Object3D | null, h: number, t: number, speed: number) {
  if (piston) piston.position.y = -1.6 + 3.2 * h + 0.12;
  for (let i = 0; i < NM; i++) {
    _o.position.set(MX[i] * 0.8 + 0.1 * Math.sin(t * speed + MV[i]), -1.55 + MY[i] * 3.2 * h + 0.05 * Math.cos(t * speed * 1.3 + MV[i]), MZ[i] * 0.8);
    _o.updateMatrix(); m.setMatrixAt(i, _o.matrix);
  }
  m.instanceMatrix.needsUpdate = true;
}
function Cylinder({ h1, h2, speed, hot }: { h1: number; h2: number; speed: number; hot: string }) {
  const mol = useRef<THREE.InstancedMesh>(null), pist = useRef<THREE.Group>(null), t = useRef(0);
  useLayoutEffect(() => { if (mol.current) paint(mol.current, pist.current, h1, 0, speed); }, [h1, speed]);
  const tick = (dt: number) => {
    t.current += Math.min(dt, 0.05);
    const ph = 0.5 - 0.5 * Math.cos(t.current * 0.9), h = h1 + (h2 - h1) * ph;
    if (mol.current) paint(mol.current, pist.current, h, t.current, speed);
  };
  return (<group>
    <Tick fn={tick} />
    <Rod a={[0, -1.7, 0]} b={[0, 1.8, 0]} r={1.0} color="#e8f1f5" o={0.18} />
    <group ref={pist}><Box p={[0, 0, 0]} s={[1.9, 0.22, 1.9]} c={C.grey} /><Rod a={[0, 0.1, 0]} b={[0, 2.4, 0]} r={0.08} color={C.light} /></group>
    <instancedMesh ref={mol} args={[undefined, undefined, NM]} frustumCulled={false}><sphereGeometry args={[0.07, 8, 8]} /><meshStandardMaterial color={hot} emissive={hot} emissiveIntensity={0.6} /></instancedMesh>
  </group>);
}

export default function PvWorkLab() {
  const [P, set, reset] = useLabParams(MECHX_SPECS.pvwork);
  const { p1, V1, V2, n, T1, q, proc } = P;
  const r = pv(proc, p1, V1, V2, n, T1, q);
  const Vmax = Math.max(V1, r.V2) * 1.15, pmax = Math.max(p1, r.p2) * 1.2;
  const path = useMemo<XY[]>(() => proc === "isochoric" ? [[V1, p1], [V1, r.p2]] : Array.from({ length: 61 }, (_, i) => { const v = V1 + ((r.V2 - V1) * i) / 60; return [v, r.p(v)] as XY; }), [proc, V1, p1, r]);
  const shade = useMemo(() => proc === "isochoric" ? [] : Array.from({ length: 24 }, (_, i) => { const v = V1 + ((r.V2 - V1) * (i + 0.5)) / 24; return { pts: [[v, 0], [v, r.p(v)]] as XY[], color: r.W >= 0 ? "#2f6b3a" : "#6b2f3a", w: 4 }; }), [proc, V1, r]);
  const hot = mix(C.blue, C.red, Math.min(1, Math.max(0, (r.T2 - 250) / 900)));
  return (
    <LabFrame
      label="A transparent piston–cylinder whose piston moves between the start and end volumes with gas molecules jiggling inside, beside the P–V diagram of the process with the area under it shaded as the boundary work"
      camera={[0.6, 0.6, 9.2]}
      onReset={reset}
      scene={() => (<group>
        <group position={[-3.2, 0, 0]}><Cylinder h1={V1 / 0.5} h2={r.V2 / 0.5} speed={2 + r.T2 / 150} hot={hot} /></group>
        <Graph x0={-1} y0={-2} w={5.4} h={4} xr={[0, Vmax]} yr={[0, pmax]} curves={[...shade, { pts: path, color: C.gold, w: 3.2 }]} marker={[r.V2, r.p2]} />
      </group>)}
      readouts={[
        ["Boundary work W = ∫p dV", `${r.W.toFixed(2)} kJ`],
        ["Heat Q", `${r.Q.toFixed(2)} kJ`],
        ["Change in internal energy ΔU", `${r.dU.toFixed(2)} kJ`],
        ["Final pressure p₂", `${r.p2.toFixed(1)} kPa`],
        ["Final temperature T₂", `${r.T2.toFixed(1)} K`],
        ["Mass of air", `${(r.m * 1000).toFixed(1)} g`],
      ]}
      controls={<>
        <Slider label="Initial pressure p₁" value={p1} min={100} max={2000} step={1} digits={0} unit=" kPa" onChange={(x) => set("p1", x)} />
        <Pick label="Process" value={proc} options={[{ id: "isobaric", label: "Isobaric (p constant)" }, { id: "isochoric", label: "Isochoric (V constant)" }, { id: "isothermal", label: "Isothermal (T constant)" }, { id: "adiabatic", label: "Adiabatic (pV^γ constant)" }, { id: "polytropic", label: "Polytropic (pVⁿ constant)" }] as { id: Proc; label: string }[]} onChange={(x) => set("proc", x)} />
        <Slider label="Initial volume V₁" value={V1} min={0.01} max={0.5} step={0.005} digits={3} unit=" m³" onChange={(x) => set("V1", x)} />
        <Slider label="Final volume V₂" value={V2} min={0.01} max={0.5} step={0.005} digits={3} unit=" m³" onChange={(x) => set("V2", x)} />
        <Slider label="Polytropic index n" value={n} min={1.01} max={1.67} step={0.01} digits={2} onChange={(x) => set("n", x)} />
        <Slider label="Initial temperature T₁" value={T1} min={250} max={1000} step={1} digits={0} unit=" K" onChange={(x) => set("T1", x)} />
        <Slider label="Heat added (isochoric)" value={q} min={1} max={500} step={1} digits={0} unit=" kJ" onChange={(x) => set("q", x)} />
      </>}
      note={<p>Displacement work is the area under the path on a P–V diagram: W = ∫p dV (positive for expansion, negative for compression, shaded red). <b>Isobaric</b> W = p(V₂ − V₁); <b>isochoric</b> W = 0 so all the heat raises U; <b>isothermal</b> W = p₁V₁ ln(V₂/V₁) and Q = W; <b>adiabatic</b> pV<sup>γ</sup> = C with Q = 0, so W = −ΔU; <b>polytropic</b> W = (p₁V₁ − p₂V₂)/(n − 1). The first law ties them: Q = ΔU + W, with ΔU = mc<sub>v</sub>(T₂ − T₁) for air (c<sub>v</sub> = 0.718 kJ/kg·K, R = 0.287 kJ/kg·K). Work is a path function: same end states, different paths, different work.</p>}
    />
  );
}
