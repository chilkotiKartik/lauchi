"use client";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { dispCurrent, sci } from "../sim/phyy";
import { Tick } from "../Stage";
import { LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { PHYY_SPECS } from "../meta/phyy.specs";
import { C, Box } from "../kit";
import { Rod } from "../kit2";
import { Circle } from "./phyy-kit";

const NE = 13, BPR = 6, NWB = 9, WIRE_END = 5, F_VIS = 0.35;
type Ring = { x: number; R: number; f: number };
type Dyn = { gV: number; aV: number; rings: Ring[] };
const _o = new THREE.Object3D(), _qx = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -Math.PI / 2), _qnx = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2);
const _red = new THREE.Color(C.red), _blue = new THREE.Color(C.blue), _grey = new THREE.Color(C.light), _c = new THREE.Color();
const SEED = Array.from({ length: NE }, (_, i) => (i === 0 ? [0, 0] : [Math.cos((i * 2 * Math.PI) / (NE - 1)) * (i % 2 ? 0.45 : 0.85), Math.sin((i * 2 * Math.PI) / (NE - 1)) * (i % 2 ? 0.45 : 0.85)]));

/** One frame of the AC cycle at time t: E arrows ∝ charge (−cos), B beads and current beads ∝ current (sin). */
function paint(m: { sh: THREE.InstancedMesh; hd: THREE.InstancedMesh; bb: THREE.InstancedMesh; wb: THREE.InstancedMesh; pl: THREE.MeshStandardMaterial; pr: THREE.MeshStandardMaterial }, d: Dyn, t: number, ang: Float32Array) {
  const ph = 2 * Math.PI * F_VIS * t, q = -Math.cos(ph), I = Math.sin(ph);
  for (let i = 0; i < NE; i++) {
    const y = SEED[i][0] * d.aV, z = SEED[i][1] * d.aV, L = Math.max(0.001, Math.abs(q) * (d.gV - 0.16));
    _o.position.set(0, y, z); _o.quaternion.copy(q >= 0 ? _qx : _qnx); _o.scale.set(1, L, 1); _o.updateMatrix(); m.sh.setMatrixAt(i, _o.matrix);
    _o.position.set((q >= 0 ? 1 : -1) * (L / 2), y, z); _o.scale.setScalar(Math.abs(q) > 0.15 ? 1 : 0.001); _o.updateMatrix(); m.hd.setMatrixAt(i, _o.matrix);
  }
  m.sh.instanceMatrix.needsUpdate = true; m.hd.instanceMatrix.needsUpdate = true;
  _o.quaternion.identity(); _o.scale.setScalar(1);
  let k = 0;
  for (let j = 0; j < d.rings.length; j++) {
    const g = d.rings[j];
    for (let b = 0; b < BPR; b++, k++) {
      const a = ang[j] + (b * 2 * Math.PI) / BPR;
      _o.position.set(g.x, g.R * Math.cos(a), g.R * Math.sin(a)); _o.updateMatrix(); m.bb.setMatrixAt(k, _o.matrix);
    }
  }
  for (; k < m.bb.count; k++) { _o.position.set(0, -99, 0); _o.updateMatrix(); m.bb.setMatrixAt(k, _o.matrix); }
  m.bb.instanceMatrix.needsUpdate = true;
  const span = WIRE_END - d.gV / 2, off = ((-Math.cos(ph) / (2 * Math.PI * F_VIS)) * 0.9) % (span / NWB);
  for (let i = 0; i < NWB * 2; i++) {
    const side = i < NWB ? -1 : 1, s = ((i % NWB) * span) / NWB + off;
    const u = ((s % span) + span) % span;
    _o.position.set(side * (d.gV / 2 + u), 0, 0); _o.updateMatrix(); m.wb.setMatrixAt(i, _o.matrix);
  }
  m.wb.instanceMatrix.needsUpdate = true;
  m.pl.emissive.copy(_c.copy(_grey).lerp(q > 0 ? _red : _blue, Math.abs(q))); m.pl.emissiveIntensity = 0.2 + 0.6 * Math.abs(q);
  m.pr.emissive.copy(_c.copy(_grey).lerp(q > 0 ? _blue : _red, Math.abs(q))); m.pr.emissiveIntensity = 0.2 + 0.6 * Math.abs(q);
  return I;
}

function Dynamics({ d }: { d: Dyn }) {
  const sh = useRef<THREE.InstancedMesh>(null), hd = useRef<THREE.InstancedMesh>(null), bb = useRef<THREE.InstancedMesh>(null), wb = useRef<THREE.InstancedMesh>(null);
  const pl = useRef<THREE.MeshStandardMaterial>(null), pr = useRef<THREE.MeshStandardMaterial>(null), t = useRef(0);
  const ang = useRef(new Float32Array(8));
  const run = (dt: number) => {
    if (!sh.current || !hd.current || !bb.current || !wb.current || !pl.current || !pr.current) return;
    const I = paint({ sh: sh.current, hd: hd.current, bb: bb.current, wb: wb.current, pl: pl.current, pr: pr.current }, d, t.current, ang.current);
    for (let j = 0; j < d.rings.length; j++) ang.current[j] += dt * 2.2 * d.rings[j].f * I;
  };
  useLayoutEffect(() => { run(0); });
  return (<>
    <Tick fn={(dt) => { const s = Math.min(dt, 0.05); t.current += s; run(s); }} />
    <mesh position={[-d.gV / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[d.aV, d.aV, 0.08, 48]} /><meshStandardMaterial ref={pl} color="#c8d3d9" metalness={0.5} roughness={0.35} /></mesh>
    <mesh position={[d.gV / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[d.aV, d.aV, 0.08, 48]} /><meshStandardMaterial ref={pr} color="#c8d3d9" metalness={0.5} roughness={0.35} /></mesh>
    <instancedMesh ref={sh} args={[undefined, undefined, NE]} frustumCulled={false}><cylinderGeometry args={[0.025, 0.025, 1, 6]} /><meshStandardMaterial color={C.gold} emissive={C.gold} emissiveIntensity={0.5} /></instancedMesh>
    <instancedMesh ref={hd} args={[undefined, undefined, NE]} frustumCulled={false}><coneGeometry args={[0.07, 0.16, 10]} /><meshStandardMaterial color={C.gold} emissive={C.gold} emissiveIntensity={0.5} /></instancedMesh>
    <instancedMesh ref={bb} args={[undefined, undefined, 8 * BPR]} frustumCulled={false}><sphereGeometry args={[0.06, 10, 10]} /><meshStandardMaterial color={C.purple} emissive={C.purple} emissiveIntensity={0.7} /></instancedMesh>
    <instancedMesh ref={wb} args={[undefined, undefined, NWB * 2]} frustumCulled={false}><sphereGeometry args={[0.07, 10, 10]} /><meshStandardMaterial color={C.orange} emissive={C.orange} emissiveIntensity={0.7} /></instancedMesh>
  </>);
}

export default function DispCurrentLab() {
  const [P, set, reset] = useLabParams(PHYY_SPECS.dispcurrent);
  const { I, f, a, d, r } = P;
  const o = dispCurrent(I, f, a, d, r);
  const s = Math.min(0.2, 3.2 / Math.max(a, r)), aV = a * s, rV = r * s, gV = 0.3 + d * 0.05, xw = gV / 2 + 1.7;
  const dyn = useMemo<Dyn>(() => {
    const bf = (R: number) => (R <= aV ? R / aV : aV / R);
    const radii = [0.45 * aV, 0.9 * aV, 1.5 * aV].filter((R) => Math.abs(R - rV) > 0.12);
    return { gV, aV, rings: [...radii.map((R) => ({ x: 0, R, f: bf(R) })), { x: 0, R: rV, f: bf(rV) }, { x: -xw, R: rV, f: aV / rV }, { x: xw, R: rV, f: aV / rV }] };
  }, [aV, rV, gV, xw]);
  return (
    <LabFrame
      label="A parallel-plate capacitor in an AC circuit: charges (orange) slosh along the wires, the plates glow red and blue as they charge, gold electric-field arrows grow and shrink between them, and purple beads circle magnetic-field loops both between the plates and around the wires; a green Amperian loop marks the probe radius"
      camera={[1.2, 2.6, 9.6]}
      onReset={reset}
      scene={() => (<group>
        <Dynamics d={dyn} />
        <Rod a={[-WIRE_END, 0, 0]} b={[-gV / 2 - 0.04, 0, 0]} r={0.045} color={C.orange} o={0.6} />
        <Rod a={[gV / 2 + 0.04, 0, 0]} b={[WIRE_END, 0, 0]} r={0.045} color={C.orange} o={0.6} />
        {dyn.rings.map((g, i) => <Circle key={i} p={[g.x, 0, 0]} r={g.R} axis="x" color={i >= dyn.rings.length - 3 ? C.green : C.purple} w={i >= dyn.rings.length - 3 ? 3 : 1.6} dashed={i > dyn.rings.length - 3} />)}
        <Box p={[0, -Math.max(aV, rV) - 0.6, 0]} s={[2 * WIRE_END, 0.08, 1.6]} c={C.dark} />
      </group>)}
      readouts={[
        ["Displacement current density J_d = ε₀∂E/∂t", `${sci(o.Jd)} A/m² (peak)`],
        ["Peak field between plates E₀ = I₀/ε₀Aω", `${sci(o.E0)} V/m`],
        ["Peak plate voltage V₀ = I₀/ωC", `${sci(o.V0)} V`],
        ["Displacement current through the loop", `${sci(o.Id * 1000)} mA of ${sci(I)} mA`],
        ["B on the loop (between plates)", `${sci(o.B)} T`],
        ["B at the same r round the wire", `${sci(o.Bwire)} T`],
      ]}
      controls={<>
        <Slider label="Peak current I₀" value={I} min={1} max={500} step={1} digits={0} unit=" mA" onChange={(x) => set("I", x)} />
        <Slider label="Frequency f" value={f} min={1} max={1000} step={1} digits={0} unit=" kHz" onChange={(x) => set("f", x)} />
        <Slider label="Plate radius a" value={a} min={2} max={20} step={0.5} digits={1} unit=" cm" onChange={(x) => set("a", x)} />
        <Slider label="Plate gap d" value={d} min={0.5} max={20} step={0.1} digits={1} unit=" mm" onChange={(x) => set("d", x)} />
        <Slider label="Amperian loop radius r" value={r} min={0.5} max={30} step={0.5} digits={1} unit=" cm" onChange={(x) => set("r", x)} />
      </>}
      note={<>
        <p>Ampère’s law ∮B·dl = μ₀I fails for a charging capacitor: a loop round the wire encloses current, but a surface through the gap catches none, yet both must give the same B. Maxwell’s fix: a changing electric field acts like a current, the <b>displacement current</b> I<sub>d</sub> = ε₀ dΦ<sub>E</sub>/dt, density <b>J<sub>d</sub> = ∂D/∂t</b>. So <b>∮B·dl = μ₀(I + ε₀ dΦ<sub>E</sub>/dt)</b>, or ∇×H = J + ∂D/∂t. Between the plates E = q/ε₀A, so ε₀A dE/dt = dq/dt = I: the displacement current exactly continues the conduction current, which is also what the continuity equation ∇·J + ∂ρ/∂t = 0 demands.</p>
        <p className="mt-2">Inside the plates a loop of radius r encloses the fraction r²/a² of I<sub>d</sub>, so B = μ₀I<sub>d</sub>r/2πa² grows linearly; outside (r &gt; a) B = μ₀I/2πr, identical to the field round the wire (compare the two readouts). B depends only on the current, not on the gap or frequency, while E₀ falls as f rises. Note that B peaks when the current peaks, a quarter-cycle before the charge (and E) does. The animation runs at a slow fixed rate; fringe fields are ignored.</p>
      </>}
    />
  );
}
