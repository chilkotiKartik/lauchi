"use client";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { brewsterDeg, polarization, prng, toRad, type PolarInfo } from "../sim/physics";
import { Tick } from "../Stage";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { PHYSICS_SPECS } from "../meta/physics.specs";

const X_SRC = -4.8, X_POL = -3, X_PLATE = 0, X_ANA = 3, K = (2 * Math.PI) / 1.7;
// Field samples along the beam: unpolarised, after polariser, after plate, after analyser.
const ZONES = [
  { x0: -4.5, x1: -3.3, n: 12 },
  { x0: -2.7, x1: -0.3, n: 26 },
  { x0: 0.3, x1: 2.7, n: 26 },
  { x0: 3.3, x1: 5.2, n: 20 },
] as const;
const TOTAL = ZONES.reduce((s, z) => s + z.n, 0);
const ZONE_COL = ["#dfe8ec", "#ffc83d", "#a970ff", "#ff9a1f"];
const dummy = new THREE.Object3D();
const rnd = prng(11);
const RBASE = Float32Array.from({ length: ZONES[0].n }, () => rnd() * Math.PI);
const RRATE = Float32Array.from({ length: ZONES[0].n }, () => (rnd() - 0.5) * 3);

interface Field { info: PolarInfo; th: number }

function placeRod(rods: THREE.InstancedMesh, tips: THREE.InstancedMesh, k: number, x: number, py: number, pz: number) {
  const len = Math.hypot(py, pz);
  dummy.position.set(x, py / 2, pz / 2); dummy.rotation.set(Math.atan2(pz, py), 0, 0); dummy.scale.set(1, Math.max(len, 1e-4), 1);
  dummy.updateMatrix(); rods.setMatrixAt(k, dummy.matrix);
  dummy.position.set(x, py, pz); dummy.rotation.set(0, 0, 0); dummy.scale.setScalar(len < 0.02 ? 0.001 : 1);
  dummy.updateMatrix(); tips.setMatrixAt(k, dummy.matrix);
}

/** Rewrites every E-field rod for time t. Module-level so the render function never mutates hook values. */
function paintBeam(rods: THREE.InstancedMesh, tips: THREE.InstancedMesh, f: Field, t: number) {
  const { Eu, Ev, A } = f.info, ct = Math.cos(f.th), st = Math.sin(f.th);
  let k = 0;
  for (let z = 0; z < ZONES.length; z++) {
    const { x0, x1, n } = ZONES[z];
    for (let i = 0; i < n; i++, k++) {
      const x = x0 + ((x1 - x0) * i) / (n - 1), ph = K * x - t, c = Math.cos(ph), s = Math.sin(ph);
      let py: number, pz: number;
      if (z === 0) { const psi = RBASE[i] + RRATE[i] * t * 0.35, e = 0.7 * c; py = e * Math.cos(psi); pz = e * Math.sin(psi); }
      else if (z === 1) { py = c; pz = 0; }
      else if (z === 2) { py = Eu[0] * c - Eu[1] * s; pz = Ev[0] * c - Ev[1] * s; }
      else { const e = A[0] * c - A[1] * s; py = e * ct; pz = e * st; }
      placeRod(rods, tips, k, x, py, pz);
    }
  }
  rods.instanceMatrix.needsUpdate = true; tips.instanceMatrix.needsUpdate = true;
}

function paintColours(rods: THREE.InstancedMesh, tips: THREE.InstancedMesh) {
  const c = new THREE.Color();
  let k = 0;
  for (let z = 0; z < ZONES.length; z++) for (let i = 0; i < ZONES[z].n; i++, k++) { c.set(ZONE_COL[z]); rods.setColorAt(k, c); tips.setColorAt(k, c); }
  if (rods.instanceColor) rods.instanceColor.needsUpdate = true;
  if (tips.instanceColor) tips.instanceColor.needsUpdate = true;
}

function Beam({ info, th }: { info: PolarInfo; th: number }) {
  const rods = useRef<THREE.InstancedMesh>(null), tips = useRef<THREE.InstancedMesh>(null), t = useRef(0);
  const f: Field = { info, th };
  useLayoutEffect(() => {
    if (rods.current && tips.current) { paintColours(rods.current, tips.current); paintBeam(rods.current, tips.current, { info, th }, t.current); }
  }, [info, th]);
  const tick = (dt: number) => {
    t.current += Math.min(dt, 0.05) * 3;
    if (rods.current && tips.current) paintBeam(rods.current, tips.current, f, t.current);
  };
  return (<>
    <Tick fn={tick} />
    <instancedMesh ref={rods} args={[undefined, undefined, TOTAL]} frustumCulled={false}><cylinderGeometry args={[0.028, 0.028, 1, 6]} /><meshStandardMaterial color="#ffffff" roughness={0.5} /></instancedMesh>
    <instancedMesh ref={tips} args={[undefined, undefined, TOTAL]} frustumCulled={false}><sphereGeometry args={[0.06, 10, 8]} /><meshStandardMaterial color="#ffffff" roughness={0.4} /></instancedMesh>
  </>);
}

const SLATS = [-1.2, -0.8, -0.4, 0, 0.4, 0.8, 1.2];
/** Disc with parallel slats along its transmission axis (angle measured from vertical, toward the camera side). */
function Disc({ x, deg, color, axisColor, opacity = 0.22 }: { x: number; deg: number; color: string; axisColor: string; opacity?: number }) {
  return (
    <group position={[x, 0, 0]} rotation={[toRad(deg), 0, 0]}>
      <mesh rotation={[0, Math.PI / 2, 0]}><circleGeometry args={[1.5, 48]} /><meshStandardMaterial color={color} transparent opacity={opacity} side={THREE.DoubleSide} depthWrite={false} /></mesh>
      <mesh rotation={[0, Math.PI / 2, 0]}><ringGeometry args={[1.5, 1.62, 48]} /><meshStandardMaterial color={axisColor} side={THREE.DoubleSide} /></mesh>
      {SLATS.map((z) => (<mesh key={z} position={[0, 0, z]}><boxGeometry args={[0.03, 2 * Math.sqrt(1.5 * 1.5 - z * z), 0.022]} /><meshStandardMaterial color={axisColor} /></mesh>))}
    </group>
  );
}

export default function PolarizationLab() {
  const [P, set, reset] = useLabParams(PHYSICS_SPECS.polarization);
  const { ang, plate, fast, n } = P;
  const setAng = (x: (typeof P)["ang"]) => set("ang", x), setPlate = (x: (typeof P)["plate"]) => set("plate", x), setFast = (x: (typeof P)["fast"]) => set("fast", x), setN = (x: (typeof P)["n"]) => set("n", x);
  const info = useMemo(() => polarization(ang, plate, fast), [ang, plate, fast]);
  const stateTxt = info.state === "linear" ? `linear, ${info.axisDeg.toFixed(0)}° from polariser` : info.state === "circular" ? "circular" : `elliptical (b/a = ${info.ratio.toFixed(2)})`;
  const th = toRad(ang);
  return (
    <LabFrame
      label="Unpolarised light passing a polariser, an optional wave plate and an analyser, with the electric field drawn as arrows along the beam"
      camera={[2, 3, 13]}
      onReset={reset}
      scene={() => (<group>
        <mesh position={[X_SRC - 0.3, 0, 0]}><sphereGeometry args={[0.32, 20, 16]} /><meshBasicMaterial color="#ffffff" /></mesh>
        <mesh position={[(X_SRC + 5.4) / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.02, 0.02, 5.4 - X_SRC, 6]} /><meshBasicMaterial color="#5b6d77" /></mesh>
        <Disc x={X_POL} deg={0} color="#ffc83d" axisColor="#ffc83d" />
        {plate !== "none" && <Disc x={X_PLATE} deg={fast} color="#a970ff" axisColor="#a970ff" opacity={0.3} />}
        <Disc x={X_ANA} deg={ang} color="#ff9a1f" axisColor="#ff9a1f" />
        <Beam info={info} th={th} />
      </group>)}
      readouts={[
        ["Transmitted I/I₀", info.frac.toFixed(3)],
        ["Malus cos²θ", info.malus.toFixed(3)],
        ["Light before analyser", stateTxt],
        ["Analyser angle θ", `${ang.toFixed(0)}°`],
        [`Brewster angle (n = ${n.toFixed(2)})`, `${brewsterDeg(n).toFixed(2)}°`],
      ]}
      controls={<>
        <Slider label="Analyser angle θ" value={ang} min={0} max={180} step={1} digits={0} unit="°" onChange={setAng} />
        <Pick label="Wave plate" value={plate} options={[{ id: "none", label: "None" }, { id: "quarter", label: "Quarter-wave (λ/4)" }, { id: "half", label: "Half-wave (λ/2)" }]} onChange={setPlate} />
        <Slider label="Plate fast-axis angle" value={fast} min={0} max={180} step={1} digits={0} unit="°" onChange={setFast} />
        <Slider label="Glass index n" value={n} min={1.3} max={2.5} step={0.01} digits={2} onChange={setN} />
      </>}
      note={<p>Unpolarised light (white, arrows in random directions) becomes linearly polarised along the gold polariser&apos;s axis, and its intensity halves: I₀/2. Sent straight to an analyser at angle θ, it passes Malus&apos;s law I = (I₀/2) cos²θ. A wave plate splits the field into a fast and a slow component and delays the slow one by a quarter (λ/4) or half (λ/2) of a wavelength. With a quarter-wave plate at 45° the two components are equal and 90° out of phase, so the arrow tips trace a helix: circular light, and any analyser passes I₀/4. At other plate angles the light is elliptical; a half-wave plate rotates linear light by twice the plate angle. Purple is after the plate, orange after the analyser. The Brewster angle for light going from air into glass of index n is tan⁻¹(n), where reflected light is completely polarised.</p>}
    />
  );
}
