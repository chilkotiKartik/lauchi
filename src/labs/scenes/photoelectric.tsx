"use client";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { METALS, nmToRgb, photoelectric, prng } from "../sim/physics";
import { Tick, useQuality } from "../Stage";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { PHYSICS_SPECS } from "../meta/physics.specs";

const XE = -3, XC = 3, GAP = XC - XE, NE_MAX = 48, NP = 20;
const C1 = 2.2;                    // visual speed scale: v = C1·√K
const LAMP = new THREE.Vector3(-0.3, 4.3, 0), HIT = new THREE.Vector3(XE, 0.3, 0);
const dummy = new THREE.Object3D();

const rnd = prng(23);
const FRAC = Float32Array.from({ length: NE_MAX }, (_, i) => (i === 0 ? 1 : 0.12 + 0.88 * ((i * 0.6180339887) % 1)));
const Y0 = Float32Array.from({ length: NE_MAX }, () => (rnd() - 0.5) * 2.2);
const Z0 = Float32Array.from({ length: NE_MAX }, () => (rnd() - 0.5) * 1.8);
const VY = Float32Array.from({ length: NE_MAX }, () => (rnd() - 0.5) * 0.7);
const VZ = Float32Array.from({ length: NE_MAX }, () => (rnd() - 0.5) * 0.7);
const OFF = Float32Array.from({ length: NE_MAX }, () => rnd());
const PY = Float32Array.from({ length: NP }, () => (rnd() - 0.5) * 1.5);
const PZ = Float32Array.from({ length: NP }, () => (rnd() - 0.5) * 1.5);

/** Electrons leave the plate with kinetic energy K = Kmax·frac and climb the retarding potential V (eV per volt).
 *  Motion along x is uniformly decelerated (uniform field): those with K < V turn back, the rest reach the collector. */
function paintElectrons(mesh: THREE.InstancedMesh, count: number, kmax: number, V: number, active: number, t: number) {
  for (let i = 0; i < count; i++) {
    let x = 0, y = 0, z = 0, sc = 0.0001;
    if (i < active) {
      const K = Math.max(kmax * FRAC[i], 0.02), v0 = C1 * Math.sqrt(K), a = (-C1 * C1 * V) / (2 * GAP);
      let life: number;
      if (Math.abs(a) < 1e-9) life = GAP / v0;
      else {
        const disc = v0 * v0 + 2 * a * GAP;
        life = disc >= 0 ? (-v0 + Math.sqrt(disc)) / a : (-2 * v0) / a;
      }
      const cycle = life + 0.25, tau = (t + OFF[i] * cycle) % cycle;
      if (tau < life) {
        x = v0 * tau + 0.5 * a * tau * tau;
        y = Y0[i] + VY[i] * v0 * tau * 0.5; z = Z0[i] + VZ[i] * v0 * tau * 0.5;
        sc = 1;
      }
    }
    dummy.position.set(XE + 0.06 + x, y, z); dummy.scale.setScalar(sc); dummy.updateMatrix(); mesh.setMatrixAt(i, dummy.matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
}

function paintPhotons(mesh: THREE.InstancedMesh, active: number, t: number) {
  for (let i = 0; i < NP; i++) {
    const u = (t * 0.7 + i / NP) % 1;
    dummy.position.set(LAMP.x + (XE + 0.05 - LAMP.x) * u, LAMP.y + (HIT.y + PY[i] - LAMP.y) * u, (PZ[i]) * u);
    dummy.scale.setScalar(i < active ? 1 : 0.0001); dummy.updateMatrix(); mesh.setMatrixAt(i, dummy.matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
}

function Particles({ count, kmax, V, active, photons, color }: { count: number; kmax: number; V: number; active: number; photons: number; color: THREE.Color }) {
  const el = useRef<THREE.InstancedMesh>(null), ph = useRef<THREE.InstancedMesh>(null), t = useRef(0);
  useLayoutEffect(() => {
    if (el.current) paintElectrons(el.current, count, kmax, V, active, t.current);
    if (ph.current) paintPhotons(ph.current, photons, t.current);
  }, [count, kmax, V, active, photons]);
  const tick = (dt: number) => {
    t.current += Math.min(dt, 0.05);
    if (el.current) paintElectrons(el.current, count, kmax, V, active, t.current);
    if (ph.current) paintPhotons(ph.current, photons, t.current);
  };
  return (<>
    <Tick fn={tick} />
    <instancedMesh ref={el} args={[undefined, undefined, count]} frustumCulled={false}><sphereGeometry args={[0.1, 12, 10]} /><meshStandardMaterial color="#2ba6f5" emissive="#2ba6f5" emissiveIntensity={0.7} /></instancedMesh>
    <instancedMesh ref={ph} args={[undefined, undefined, NP]} frustumCulled={false}><sphereGeometry args={[0.075, 10, 8]} /><meshBasicMaterial color={color} /></instancedMesh>
  </>);
}

export default function PhotoelectricLab() {
  const quality = useQuality();
  const [P, set, reset] = useLabParams(PHYSICS_SPECS.photoelectric);
  const { nm, I, V, metal } = P;
  const setNm = (x: (typeof P)["nm"]) => set("nm", x), setI = (x: (typeof P)["I"]) => set("I", x), setV = (x: (typeof P)["V"]) => set("V", x), setMetal = (x: (typeof P)["metal"]) => set("metal", x);
  const m = METALS[metal];
  const r = photoelectric(nm, m.phi, V);
  const count = quality === "low" ? NE_MAX / 2 : NE_MAX;
  const active = r.emits ? Math.max(1, Math.round((count * I) / 100)) : 0;
  const photons = Math.max(2, Math.round((NP * I) / 100));
  const col = useMemo(() => { const c = nmToRgb(nm); return new THREE.Color(c[0], c[1], c[2]); }, [nm]);
  const beamQ = useMemo(() => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), LAMP.clone().sub(HIT).normalize()), []);
  const beamLen = LAMP.distanceTo(HIT), mid = LAMP.clone().add(HIT).multiplyScalar(0.5);
  const collector = V > 0.005 ? "#2ba6f5" : V < -0.005 ? "#ff5a5f" : "#9db0ba";
  const reach = !r.emits ? "No emission" : V <= 0 ? "Yes (all of them)" : r.kmax > V ? "Yes (fastest only)" : "No, all turned back";
  return (
    <LabFrame
      label="Light of chosen colour striking a metal plate and ejecting photoelectrons toward a collector plate held at a retarding voltage"
      camera={[0, 2, 11]}
      onReset={reset}
      scene={() => (<group>
        <mesh position={[XE - 0.1, 0, 0]}><boxGeometry args={[0.2, 3.2, 2.6]} /><meshStandardMaterial color={m.color} metalness={0.6} roughness={0.35} /></mesh>
        <mesh position={[XC + 0.1, 0, 0]}><boxGeometry args={[0.2, 3.2, 2.6]} /><meshStandardMaterial color={collector} emissive={collector} emissiveIntensity={0.25} metalness={0.4} roughness={0.5} /></mesh>
        <mesh position={[0, -1.8, 0]}><boxGeometry args={[7.2, 0.08, 2.6]} /><meshStandardMaterial color="#2b3a43" /></mesh>
        <mesh position={[LAMP.x, LAMP.y + 0.3, 0]}><cylinderGeometry args={[0.3, 0.45, 0.6, 20]} /><meshStandardMaterial color="#5b6d77" /></mesh>
        <mesh position={mid} quaternion={beamQ}><coneGeometry args={[0.95, beamLen, 24, 1, true]} /><meshBasicMaterial color={col} transparent opacity={0.2} side={THREE.DoubleSide} depthWrite={false} /></mesh>
        <mesh position={[XE + 0.02, HIT.y, 0]} rotation={[0, Math.PI / 2, 0]}><circleGeometry args={[0.95, 32]} /><meshBasicMaterial color={col} transparent opacity={0.55} /></mesh>
        <Particles count={count} kmax={r.kmax} V={V} active={active} photons={photons} color={col} />
      </group>)}
      readouts={[
        ["Photon energy hc/λ", `${r.E.toFixed(2)} eV`],
        [`Work function φ (${m.name})`, `${m.phi.toFixed(2)} eV`],
        ["Threshold λ₀ = hc/φ", `${r.lambda0.toFixed(0)} nm`],
        ["Max KE = hν − φ", r.emits ? `${r.kmax.toFixed(2)} eV` : "no emission"],
        ["Stopping potential V₀", r.emits ? `${r.V0.toFixed(2)} V` : "—"],
        ["Reach the collector?", reach],
      ]}
      controls={<>
        <Slider label="Wavelength λ" value={nm} min={150} max={700} step={5} digits={0} unit=" nm" onChange={setNm} />
        <Slider label="Light intensity" value={I} min={5} max={100} step={5} digits={0} unit=" %" onChange={setI} />
        <Slider label="Retarding voltage V" value={V} min={-2} max={7} step={0.05} digits={2} unit=" V" onChange={setV} />
        <Pick label="Metal plate" value={metal} options={(Object.keys(METALS) as (keyof typeof METALS)[]).map((k) => ({ id: k, label: `${METALS[k].name} (φ = ${METALS[k].phi} eV)` }))} onChange={setMetal} />
      </>}
      note={<p>Each photon carries E = hc/λ = 1240 eV·nm / λ. It frees an electron only if E exceeds the metal&apos;s work function φ, so there is a threshold wavelength λ₀ = hc/φ: below that frequency no electrons come out at any intensity. Above it, Einstein&apos;s equation gives the fastest electron K_max = hν − φ, independent of intensity; a brighter light just ejects more of them. A retarding voltage V on the collector stops electrons with K &lt; eV, and the stopping potential V₀ = K_max/e is where the current reaches zero (blue electrons in the picture turn back). Work functions are typical textbook values (Cs 2.1, Na 2.28, K 2.3, Zn 4.3, Cu 4.7 eV); real surfaces vary. In the animation each electron has its own fixed energy up to K_max; it is a simplified picture.</p>}
    />
  );
}
