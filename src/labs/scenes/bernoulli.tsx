"use client";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { G, RHO_W, prng, venturi } from "../sim/mech";
import { Tick, useQuality } from "../Stage";
import { LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { MECH_SPECS } from "../meta/mech.specs";

const DOTS = 52, TS = 64, X0 = -3.4, X1 = 3.4, dummy = new THREE.Object3D();

/** Tube radius profile: inlet, convergent cone, throat, divergent diffuser, outlet */
function radiusAt(x: number, rt: number): number {
  if (x < -1.7) return 1;
  if (x < -0.45) return 1 + (rt - 1) * ((x + 1.7) / 1.25);
  if (x < 0.45) return rt;
  if (x < 2.2) return rt + (1 - rt) * ((x - 0.45) / 1.75);
  return 1;
}

function volumeTable(rt: number): Float32Array {
  const F = new Float32Array(TS + 1);
  for (let i = 1; i <= TS; i++) {
    const x = X0 + ((i - 0.5) / TS) * (X1 - X0),
      r = radiusAt(x, rt);
    F[i] = F[i - 1] + r * r;
  }
  for (let i = 0; i <= TS; i++) F[i] /= F[TS];
  return F;
}

function xFromVolume(F: Float32Array, u: number): number {
  let k = 0;
  while (k < TS - 1 && F[k + 1] < u) k++;
  const f = (u - F[k]) / Math.max(F[k + 1] - F[k], 1e-9);
  return X0 + ((k + Math.min(1, Math.max(0, f))) / TS) * (X1 - X0);
}

function paintDots(m: THREE.InstancedMesh, F: Float32Array, off: Float32Array, rt: number, t: number, active: number) {
  for (let i = 0; i < DOTS; i++) {
    const u = (i / DOTS + t) % 1,
      x = xFromVolume(F, u),
      r = radiusAt(x, rt);
    dummy.position.set(x, off[i * 2] * r * 0.78, off[i * 2 + 1] * r * 0.78);
    dummy.scale.setScalar(i < active ? 1 : 0.001);
    dummy.updateMatrix();
    m.setMatrixAt(i, dummy.matrix);
  }
  m.instanceMatrix.needsUpdate = true;
}

function Flow({ rt, speed, active }: { rt: number; speed: number; active: number }) {
  const ref = useRef<THREE.InstancedMesh>(null),
    t = useRef(0);
  const F = useMemo(() => volumeTable(rt), [rt]);
  const off = useMemo(() => {
    const r = prng(11),
      o = new Float32Array(DOTS * 2);
    for (let i = 0; i < DOTS; i++) {
      const a = r() * 6.283,
        d = Math.sqrt(r());
      o[i * 2] = Math.cos(a) * d;
      o[i * 2 + 1] = Math.sin(a) * d;
    }
    return o;
  }, []);

  const tick = (dt: number) => {
    t.current += Math.min(dt, 0.05) * speed;
    if (ref.current) paintDots(ref.current, F, off, rt, t.current, active);
  };

  return (
    <>
      <Tick fn={tick} />
      <instancedMesh ref={ref} args={[undefined, undefined, DOTS]} frustumCulled={false}>
        <sphereGeometry args={[0.08, 10, 10]} />
        <meshStandardMaterial color="#facc15" emissive="#eab308" emissiveIntensity={0.8} />
      </instancedMesh>
    </>
  );
}

function Pipe({ rt }: { rt: number }) {
  const geo = useMemo(() => {
    const pts: THREE.Vector2[] = [];
    for (let i = 0; i <= 80; i++) {
      const x = X0 + (i / 80) * (X1 - X0);
      pts.push(new THREE.Vector2(radiusAt(x, rt), x));
    }
    const g = new THREE.LatheGeometry(pts, 36);
    g.rotateZ(-Math.PI / 2);
    return g;
  }, [rt]);

  return (
    <mesh geometry={geo}>
      <meshPhysicalMaterial
        color="#bae6fd"
        transparent
        opacity={0.35}
        roughness={0.08}
        transmission={0.65}
        ior={1.4}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function PiezometerColumn({ x, top, h }: { x: number; top: number; h: number }) {
  return (
    <group position={[x, top, 0]}>
      {/* Outer Pyrex Glass Column Tube */}
      <mesh position={[0, 1.25, 0]}>
        <cylinderGeometry args={[0.11, 0.11, 2.5, 16, 1, true]} />
        <meshStandardMaterial color="#e0f2fe" transparent opacity={0.3} side={THREE.DoubleSide} roughness={0.1} />
      </mesh>
      {/* Acrylic Backing Board with scale ruler */}
      <mesh position={[0, 1.25, -0.14]}>
        <boxGeometry args={[0.35, 2.55, 0.04]} />
        <meshStandardMaterial color="#1e293b" metalness={0.7} />
      </mesh>
      {/* Liquid Water Column with emissive meniscus */}
      <mesh position={[0, h / 2, 0]}>
        <cylinderGeometry args={[0.095, 0.095, Math.max(0.04, h), 16]} />
        <meshStandardMaterial color="#0284c7" emissive="#0369a1" emissiveIntensity={0.4} />
      </mesh>
      {/* Pressure Tap Brass Fitting */}
      <mesh position={[0, -0.2, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.4, 16]} />
        <meshStandardMaterial color="#ca8a04" metalness={0.9} roughness={0.2} />
      </mesh>
    </group>
  );
}

export default function BernoulliLab() {
  const quality = useQuality();
  const [P, set, reset] = useLabParams(MECH_SPECS.bernoulli);
  const { Q, D1, D2, Cd } = P;
  const V = venturi(Q, D1, D2, Cd);
  const rt = V.D2mm / D1;
  const headM = V.dp / (RHO_W * G);
  const h1 = 1.9,
    h2 = Math.max(0.05, h1 - Math.min(1.8, headM * 2));
  const speed = 0.06 + Math.min(0.5, V.v1 * 0.06);
  const active = quality === "low" ? 28 : DOTS;

  return (
    <LabFrame
      label="Venturimeter Flow Bench: converging-diverging glass passage, throat velocity acceleration, piezometric head differential, and Bernoulli pressure conservation"
      camera={[0, 1.2, 8.4]}
      onReset={reset}
      note={
        <p>
          Bernoulli&apos;s Theorem states that for steady, incompressible fluid flow along a streamline, total energy remains constant: <b>P/ρg + v²/2g + z = Constant</b>. As fluid approaches the constricted throat, cross-sectional area decreases and fluid velocity increases by continuity (<b>A₁v₁ = A₂v₂</b>), resulting in a corresponding hydrostatic pressure drop measured by the piezometer columns.
        </p>
      }
      scene={() => (
        <group position={[0, -1.4, 0]}>
          {/* Heavy Lab Workbench Floor Support */}
          <mesh position={[0, -1.25, 0]}>
            <boxGeometry args={[8.2, 0.18, 2.4]} />
            <meshStandardMaterial color="#0f172a" metalness={0.85} roughness={0.3} />
          </mesh>

          {/* Upright Support Posts & Clamps */}
          {[-2.6, 0, 2.6].map((sx, i) => (
            <group key={i} position={[sx, -0.5, 0]}>
              <mesh position={[0, -0.3, -0.6]}>
                <cylinderGeometry args={[0.06, 0.06, 1.2, 16]} />
                <meshStandardMaterial color="#94a3b8" metalness={0.9} />
              </mesh>
              <mesh position={[0, 0.2, -0.3]}>
                <boxGeometry args={[0.2, 0.12, 0.6]} />
                <meshStandardMaterial color="#334155" />
              </mesh>
            </group>
          ))}

          {/* Flanged Metallic Inlet and Outlet Collars */}
          {[-3.4, 3.4].map((fx, i) => (
            <mesh key={i} position={[fx, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[1.18, 1.18, 0.16, 32]} />
              <meshStandardMaterial color="#475569" metalness={0.9} roughness={0.2} />
            </mesh>
          ))}

          {/* Transparent Venturi Pyrex Tube */}
          <Pipe rt={rt} />

          {/* Dynamic Velocity Flow Tracers */}
          <Flow rt={rt} speed={speed} active={active} />

          {/* Dual Piezometer Columns (Inlet vs Throat) */}
          <PiezometerColumn x={-2.6} top={1.05} h={h1} /> {/* inlet head h₁ */}
          <PiezometerColumn x={0} top={rt + 0.05} h={h2} /> {/* throat head h₂ */}
        </group>
      )}
      readouts={[
        ["Inlet velocity v₁", `${V.v1.toFixed(3)} m/s`],
        ["Throat velocity v₂", `${V.v2.toFixed(3)} m/s`],
        ["Pressure drop ΔP", `${(V.dp / 1000).toFixed(2)} kPa`],
        ["Piezometric head difference h", `${(headM * 100).toFixed(1)} cm`],
        ["Theoretical discharge Q_th", `${((Q / Cd) * 1000).toFixed(2)} L/s`],
        ["Actual discharge Q_act", `${(Q * 1000).toFixed(2)} L/s`],
      ]}
      controls={
        <>
          <Slider label="Discharge flow rate Q" value={Q} min={0.0005} max={0.01} step={0.0001} digits={4} unit=" m³/s" onChange={(x) => set("Q", x)} />
          <Slider label="Inlet pipe diameter D₁" value={D1} min={40} max={150} step={1} digits={0} unit=" mm" onChange={(x) => set("D1", x)} />
          <Slider label="Throat diameter D₂" value={D2} min={20} max={80} step={1} digits={0} unit=" mm" onChange={(x) => set("D2", x)} />
          <Slider label="Coefficient of discharge C_d" value={Cd} min={0.9} max={0.99} step={0.005} digits={3} onChange={(x) => set("Cd", x)} />
        </>
      }
    />
  );
}
