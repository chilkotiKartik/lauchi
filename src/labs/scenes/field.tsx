"use client";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Tick, useQuality } from "../Stage";
import { LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { CORE_SPECS } from "../meta/core.specs";

const K = 1;
function E(x: number, z: number, qs: { q: number; x: number }[]) {
  let ex = 0, ez = 0;
  for (const c of qs) {
    const dx = x - c.x, dz = z, d2 = dx * dx + dz * dz + 0.02, d = Math.sqrt(d2);
    ex += (K * c.q * dx) / (d2 * d); ez += (K * c.q * dz) / (d2 * d);
  }
  return [ex, ez];
}

type Ch = { q: number; x: number }[];
function spawn(p: Float32Array, life: Float32Array, i: number, qs: Ch) {
  const src = qs.find((c) => c.q > 0) ?? qs[0], a = Math.random() * 2 * Math.PI;
  p[i * 3] = src.x + 0.15 * Math.cos(a); p[i * 3 + 1] = 0; p[i * 3 + 2] = 0.15 * Math.sin(a); life[i] = 0;
}
function seedTracers(p: Float32Array, life: Float32Array, qs: Ch) {
  for (let i = 0; i < life.length; i++) { spawn(p, life, i, qs); life[i] = Math.random() * 400; }
}
function stepTracers(p: Float32Array, life: Float32Array, qs: Ch, dt: number) {
  const s = Math.min(dt, 0.05) * 2.2;
  for (let i = 0; i < life.length; i++) {
    const [ex, ez] = E(p[i * 3], p[i * 3 + 2], qs), m = Math.hypot(ex, ez) || 1;
    p[i * 3] += (ex / m) * s; p[i * 3 + 2] += (ez / m) * s; life[i] += 1;
    const nx = p[i * 3], nz = p[i * 3 + 2];
    if (life[i] > 500 || Math.abs(nx) > 5 || Math.abs(nz) > 4 || qs.some((c) => Math.hypot(nx - c.x, nz) < 0.12)) spawn(p, life, i, qs);
  }
}

export default function FieldLab() {
  const quality = useQuality();
  const [P, set, reset] = useLabParams(CORE_SPECS.field);
  const { q1, q2, d } = P;
  const setQ1 = (x: (typeof P)["q1"]) => set("q1", x), setQ2 = (x: (typeof P)["q2"]) => set("q2", x), setD = (x: (typeof P)["d"]) => set("d", x);
  const qs = useMemo(() => [{ q: q1, x: -d / 2 }, { q: q2, x: d / 2 }], [q1, q2, d]);
  const N = quality === "low" ? 120 : 320;
  const pts = useRef<THREE.Points>(null);
  const state = useMemo(() => ({ p: new Float32Array(N * 3), life: new Float32Array(N) }), [N]);
  useLayoutEffect(() => { seedTracers(state.p, state.life, qs); }, [state, qs]);
  const tick = (dt: number) => {
    stepTracers(state.p, state.life, qs, dt);
    if (pts.current) pts.current.geometry.attributes.position.needsUpdate = true;
  };

  const arrows = useMemo(() => {
    const out: { p: [number, number, number]; q: THREE.Quaternion; len: number; c: string }[] = [];
    for (let i = -6; i <= 6; i++) for (let j = -4; j <= 4; j++) {
      const x = i * 0.7, z = j * 0.7;
      if (qs.some((c) => Math.hypot(x - c.x, z) < 0.3)) continue;
      const [ex, ez] = E(x, z, qs), m = Math.hypot(ex, ez);
      out.push({ p: [x, 0, z], q: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(ex / (m || 1), 0, ez / (m || 1))), len: Math.min(0.55, 0.12 + 0.35 * Math.log10(1 + m * 3)), c: `hsl(${200 - Math.min(150, m * 30)},80%,60%)` });
    }
    return out;
  }, [qs]);

  const [e0x, e0z] = E(0, 0, qs);
  return (
    <LabFrame
      label="3D electric field of two point charges with animated field-line tracers"
      camera={[0, 6, 6]}
      onReset={reset}
      scene={() => (<group><Tick fn={tick} />
        <gridHelper args={[10, 20, "#3a4d57", "#26343c"]} position={[0, -0.05, 0]} />
        {qs.map((c, i) => (<mesh key={i} position={[c.x, 0, 0]}><sphereGeometry args={[0.1 + 0.04 * Math.abs(c.q), 24, 24]} /><meshStandardMaterial color={c.q >= 0 ? "#ff5a5f" : "#2ba6f5"} emissive={c.q >= 0 ? "#ff5a5f" : "#2ba6f5"} emissiveIntensity={0.4} /></mesh>))}
        {arrows.map((a, i) => (<mesh key={i} position={a.p} quaternion={a.q} scale={[1, a.len, 1]}><coneGeometry args={[0.05, 1, 6]} /><meshStandardMaterial color={a.c} /></mesh>))}
        <points ref={pts}><bufferGeometry><bufferAttribute attach="attributes-position" args={[state.p, 3]} /></bufferGeometry><pointsMaterial color="#ffc83d" size={0.07} sizeAttenuation /></points>
      </group>)}
      readouts={[["Net charge", (q1 + q2).toFixed(1)], ["|E| at origin", Math.hypot(e0x, e0z).toFixed(3)], ["Separation", d.toFixed(2)]]}
      controls={<>
        <Slider label="Charge on left (+ red, − blue)" value={q1} min={-4} max={4} step={0.1} digits={1} onChange={setQ1} />
        <Slider label="Charge on right" value={q2} min={-4} max={4} step={0.1} digits={1} onChange={setQ2} />
        <Slider label="Separation" value={d} min={1} max={5} onChange={setD} />
      </>}
      note={<p>Each cone points along the electric field E = Σ kq r̂ / r² (units chosen so k = 1) and is coloured by strength. The yellow tracers are released near the positive charge and follow E: they trace field lines, which start on positive charges and end on negative ones. Set both charges equal to see the field lines repel; unequal charges show some lines escaping to infinity.</p>}
    />
  );
}
