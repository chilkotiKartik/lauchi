"use client";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { G, RHO_W, prng, sci, venturi } from "../sim/mech";
import { Tick, useQuality } from "../Stage";
import { LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { MECH_SPECS } from "../meta/mech.specs";

const DOTS = 44, TS = 64, X0 = -3.4, X1 = 3.4, dummy = new THREE.Object3D();

/** Tube radius at x for inlet radius 1 and throat radius rt: straight, cone in, throat, cone out, straight. */
function radiusAt(x: number, rt: number): number {
  if (x < -1.7) return 1;
  if (x < -0.45) return 1 + (rt - 1) * ((x + 1.7) / 1.25);
  if (x < 0.45) return rt;
  if (x < 2.2) return rt + (1 - rt) * ((x - 0.45) / 1.75);
  return 1;
}
/** Volume coordinate F(x) = ∫ r² dx tabulated at TS+1 nodes, normalised to 0…1: equal steps of F are equal volumes of water. */
function volumeTable(rt: number): Float32Array {
  const F = new Float32Array(TS + 1);
  for (let i = 1; i <= TS; i++) { const x = X0 + ((i - 0.5) / TS) * (X1 - X0), r = radiusAt(x, rt); F[i] = F[i - 1] + r * r; }
  for (let i = 0; i <= TS; i++) F[i] /= F[TS];
  return F;
}
function xFromVolume(F: Float32Array, u: number): number {
  let k = 0; while (k < TS - 1 && F[k + 1] < u) k++;
  const f = (u - F[k]) / Math.max(F[k + 1] - F[k], 1e-9);
  return X0 + ((k + Math.min(1, Math.max(0, f))) / TS) * (X1 - X0);
}
function paintDots(m: THREE.InstancedMesh, F: Float32Array, off: Float32Array, rt: number, t: number, active: number) {
  for (let i = 0; i < DOTS; i++) {
    const u = ((i / DOTS) + t) % 1, x = xFromVolume(F, u), r = radiusAt(x, rt);
    dummy.position.set(x, off[i * 2] * r * 0.8, off[i * 2 + 1] * r * 0.8);
    dummy.scale.setScalar(i < active ? 1 : 0.001); dummy.updateMatrix(); m.setMatrixAt(i, dummy.matrix);
  }
  m.instanceMatrix.needsUpdate = true;
}

function Flow({ rt, speed, active }: { rt: number; speed: number; active: number }) {
  const ref = useRef<THREE.InstancedMesh>(null), t = useRef(0);
  const F = useMemo(() => volumeTable(rt), [rt]);
  const off = useMemo(() => { const r = prng(11), o = new Float32Array(DOTS * 2); for (let i = 0; i < DOTS; i++) { const a = r() * 6.283, d = Math.sqrt(r()); o[i * 2] = Math.cos(a) * d; o[i * 2 + 1] = Math.sin(a) * d; } return o; }, []);
  const tick = (dt: number) => { t.current += Math.min(dt, 0.05) * speed; if (ref.current) paintDots(ref.current, F, off, rt, t.current, active); };
  return (<>
    <Tick fn={tick} />
    <instancedMesh ref={ref} args={[undefined, undefined, DOTS]}><sphereGeometry args={[0.07, 8, 8]} /><meshBasicMaterial color="#ffc83d" /></instancedMesh>
  </>);
}

function Pipe({ rt }: { rt: number }) {
  const geo = useMemo(() => {
    const pts: THREE.Vector2[] = [];
    for (let i = 0; i <= 80; i++) { const x = X0 + (i / 80) * (X1 - X0); pts.push(new THREE.Vector2(radiusAt(x, rt), x)); }
    const g = new THREE.LatheGeometry(pts, 32); g.rotateZ(-Math.PI / 2); return g;
  }, [rt]);
  return <mesh geometry={geo}><meshStandardMaterial color="#9fd8ff" transparent opacity={0.28} side={THREE.DoubleSide} roughness={0.2} /></mesh>;
}

function Column({ x, top, h, color }: { x: number; top: number; h: number; color: string }) {
  return (<>
    <mesh position={[x, top + 1.2, 0]}><cylinderGeometry args={[0.09, 0.09, 2.4, 10, 1, true]} /><meshStandardMaterial color="#cfe7f5" transparent opacity={0.3} side={2} /></mesh>
    <mesh position={[x, top + h / 2, 0]}><cylinderGeometry args={[0.07, 0.07, Math.max(0.02, h), 10]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.25} /></mesh>
  </>);
}

export default function BernoulliLab() {
  const quality = useQuality();
  const [P, set, reset] = useLabParams(MECH_SPECS.bernoulli);
  const { Q, D1, D2, Cd } = P;
  const V = venturi(Q, D1, D2, Cd);
  const rt = V.D2mm / D1;
  const headM = V.dp / (RHO_W * G);
  const h1 = 1.9, h2 = Math.max(0.05, h1 - Math.min(1.8, headM * 2));
  const off = headM * 2 > 1.8;
  const speed = 0.06 + Math.min(0.5, V.v1 * 0.06);
  const active = quality === "low" ? 24 : DOTS;
  return (
    <LabFrame
      label="A transparent water pipe that narrows to a throat and widens again, with yellow particles that speed up in the throat, and two glass columns above whose blue water levels show the pressure dropping in the throat"
      camera={[0, 1.2, 8.4]}
      onReset={reset}
      scene={() => (<group position={[0, -1.4, 0]}>
        <Pipe rt={rt} />
        <Flow rt={rt} speed={speed} active={active} />
        <mesh position={[-2.6, 0.5, 0]}><cylinderGeometry args={[0.07, 0.07, 0.6, 8]} /><meshStandardMaterial color="#5b6d77" /></mesh>
        <mesh position={[0, 0.5 * rt + 0.05, 0]}><cylinderGeometry args={[0.07, 0.07, 0.6 * rt + 0.2, 8]} /><meshStandardMaterial color="#5b6d77" /></mesh>
        <Column x={-2.6} top={0.8} h={h1} color="#2ba6f5" />
        <Column x={0} top={0.8} h={h2} color="#2ba6f5" />
        <mesh position={[-2.6, 0.8 + h1 + 0.03, 0]}><sphereGeometry args={[0.1, 10, 10]} /><meshBasicMaterial color="#44c95a" /></mesh>
        <mesh position={[0, 0.8 + h2 + 0.03, 0]}><sphereGeometry args={[0.1, 10, 10]} /><meshBasicMaterial color="#ff5a5f" /></mesh>
        <mesh position={[-1.3, 0.8 + (h1 + h2) / 2, 0]}><boxGeometry args={[2.6, h1 - h2 + 0.03, 0.02]} /><meshBasicMaterial color="#ff9a1f" transparent opacity={0.16} /></mesh>
      </group>)}
      readouts={[
        ["Inlet velocity v₁ = Q/A₁", `${V.v1.toFixed(2)} m/s`], ["Throat velocity v₂ = Q/A₂", `${V.v2.toFixed(2)} m/s`], ["Pressure drop Δp", `${sci(V.dp / 1000)} kPa`],
        ["Water head Δp/ρg", `${sci(headM)} m${off ? " (off scale)" : ""}`], ["Hg manometer reading", `${sci(V.hm * 1000)} mm`], ["Throat Reynolds number", sci(V.Re, 3)],
      ]}
      controls={<>
        <Slider label="Flow rate Q" value={Q} min={0.5} max={30} step={0.5} digits={1} unit=" L/s" onChange={(x) => set("Q", x)} />
        <Slider label="Inlet diameter D₁" value={D1} min={30} max={200} step={1} digits={0} unit=" mm" onChange={(x) => set("D1", x)} />
        <Slider label="Throat diameter D₂" value={D2} min={15} max={180} step={1} digits={0} unit=" mm" onChange={(x) => set("D2", x)} />
        <Slider label="Discharge coefficient C_d" value={Cd} min={0.9} max={1} step={0.005} digits={3} onChange={(x) => set("Cd", x)} />
      </>}
      note={<p>Continuity says the same flow Q squeezes through a smaller area, so v = Q/A rises in the throat (the yellow particles speed up there). Bernoulli&apos;s equation for level flow, p + ½ρv² = constant, then says the pressure must fall: Δp = ½ρ(v₂² − v₁²), shown as the lower blue column at the throat (2 units of height = 1 m of water; the drop is capped at the top of the scale and the readout says so). For a real meter the same flow needs a larger Δp by 1/C_d². The reading of a mercury U-tube is h = Δp/((ρ_Hg − ρ_w)g). The throat cannot be wider than 0.9 D₁. Ideal, steady, incompressible water; the pipe is drawn to relative sizes only.</p>}
    />
  );
}
