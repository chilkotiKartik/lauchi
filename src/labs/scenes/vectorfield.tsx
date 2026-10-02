"use client";
import { Line } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { FIELDS, advect, fmt, greens, prng, type Field, type FieldId } from "../sim/mathsa";
import { Tick, useQuality } from "../Stage";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { MATHSA_SPECS } from "../meta/mathsa.specs";

const S = 1.3, W = 2.5; // world = maths × S; the view covers |x|, |y| ≤ W. Maths y runs along world −z.
const UP = new THREE.Vector3(0, 1, 0);
type Tracers = { p: Float32Array; life: Float32Array; pos: Float32Array; rnd: () => number };

function seedTracers(T: Tracers) {
  for (let i = 0; i < T.life.length; i++) {
    T.p[2 * i] = (T.rnd() * 2 - 1) * W; T.p[2 * i + 1] = (T.rnd() * 2 - 1) * W; T.life[i] = T.rnd() * 6;
  }
  writeTracers(T);
}
function writeTracers(T: Tracers) {
  for (let i = 0; i < T.life.length; i++) T.pos.set([T.p[2 * i] * S, 0.12, -T.p[2 * i + 1] * S], 3 * i);
}
function stepTracers(F: Field, T: Tracers, dt: number, pts: THREE.Points | null) {
  advect(F, T.p, T.life, Math.min(dt, 0.05) * 0.8, W, T.rnd);
  writeTracers(T);
  if (pts) pts.geometry.attributes.position.needsUpdate = true;
}

function paintArrows(m: THREE.InstancedMesh, F: Field, G: number) {
  const o = new THREE.Object3D(), c = new THREE.Color(), dir = new THREE.Vector3();
  let k = 0;
  for (let i = 0; i < G; i++) for (let j = 0; j < G; j++) {
    const x = -W * 0.94 + (2 * W * 0.94 * i) / (G - 1), y = -W * 0.94 + (2 * W * 0.94 * j) / (G - 1);
    const u = F.P(x, y), v = F.Q(x, y), mag = Math.hypot(u, v);
    const len = mag < 1e-9 ? 0.001 : Math.min(0.42, 0.1 + 0.2 * Math.log1p(mag * 1.5));
    o.position.set(x * S, 0.08, -y * S);
    o.quaternion.setFromUnitVectors(UP, mag < 1e-9 ? UP : dir.set(u / mag, 0, -v / mag));
    o.scale.set(1, len, 1); o.updateMatrix();
    m.setMatrixAt(k, o.matrix);
    m.setColorAt(k, c.setHSL(0.58 - 0.58 * Math.min(1, mag / 4), 0.85, 0.58));
    k++;
  }
  m.count = k; m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true;
}
function Arrows({ F, G }: { F: Field; G: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const invalidate = useThree((s) => s.invalidate);
  useLayoutEffect(() => { if (ref.current) { paintArrows(ref.current, F, G); invalidate(); } }, [F, G, invalidate]);
  return <instancedMesh ref={ref} args={[undefined, undefined, 17 * 17]}><coneGeometry args={[0.07, 1, 8]} /><meshStandardMaterial roughness={0.5} /></instancedMesh>;
}

const K = 64;
/** A "fence" round the circle: bar height is the integrand F·T (circulation) or F·n (flux); green above zero, red below. */
function paintFence(m: THREE.InstancedMesh, F: Field, px: number, py: number, r: number, normal: boolean) {
  const o = new THREE.Object3D(), c = new THREE.Color();
  for (let k = 0; k < K; k++) {
    const t = (2 * Math.PI * k) / K, cs = Math.cos(t), sn = Math.sin(t), x = px + r * cs, y = py + r * sn;
    const val = normal ? F.P(x, y) * cs + F.Q(x, y) * sn : -F.P(x, y) * sn + F.Q(x, y) * cs;
    const h = Math.max(-1.6, Math.min(1.6, val * 0.35)), hh = Math.max(0.01, Math.abs(h));
    o.position.set(x * S, h / 2, -y * S); o.rotation.set(0, t, 0); o.scale.set(0.07, hh, 0.07); o.updateMatrix();
    m.setMatrixAt(k, o.matrix);
    m.setColorAt(k, c.set(val >= 0 ? "#44c95a" : "#ff5a5f"));
  }
  m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true;
}
function Fence({ F, px, py, r, normal }: { F: Field; px: number; py: number; r: number; normal: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const invalidate = useThree((s) => s.invalidate);
  useLayoutEffect(() => { if (ref.current) { paintFence(ref.current, F, px, py, r, normal); invalidate(); } }, [F, px, py, r, normal, invalidate]);
  return <instancedMesh ref={ref} args={[undefined, undefined, K]}><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial roughness={0.4} transparent opacity={0.9} /></instancedMesh>;
}

function makeFloor(F: Field) {
  const g = new THREE.PlaneGeometry(2 * W * S, 2 * W * S, 40, 40);
  g.rotateX(-Math.PI / 2);
  const p = g.attributes.position, col = new Float32Array(p.count * 3), base = new THREE.Color("#163039"), hot = new THREE.Color("#ff5a5f"), cold = new THREE.Color("#2ba6f5"), c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    const d = F.div(p.getX(i) / S, -p.getZ(i) / S), t = Math.tanh(d / 3) * 0.45;
    c.copy(base).lerp(t >= 0 ? hot : cold, Math.abs(t));
    col.set([c.r, c.g, c.b], 3 * i);
  }
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  return g;
}

export default function VectorFieldLab() {
  const quality = useQuality();
  const [P, set, reset] = useLabParams(MATHSA_SPECS.vectorfield);
  const { field, r, px, py, fence } = P;
  const setField = (x: (typeof P)["field"]) => set("field", x), setR = (x: (typeof P)["r"]) => set("r", x), setPx = (x: (typeof P)["px"]) => set("px", x), setPy = (x: (typeof P)["py"]) => set("py", x), setFence = (x: (typeof P)["fence"]) => set("fence", x);
  const F: Field = FIELDS[field];
  const g = greens(field, px, py, r);
  const G = quality === "low" ? 11 : 15, N = quality === "low" ? 160 : 360;

  const T = useMemo<Tracers>(() => ({ p: new Float32Array(2 * N), life: new Float32Array(N), pos: new Float32Array(3 * N), rnd: prng(20260930) }), [N]);
  const floor = useMemo(() => makeFloor(F), [F]);
  useLayoutEffect(() => () => { floor.dispose(); }, [floor]);
  useLayoutEffect(() => { seedTracers(T); }, [T, F]);
  const pts = useRef<THREE.Points>(null);
  const tick = (dt: number) => stepTracers(F, T, dt, pts.current);

  const circle = useMemo(() => Array.from({ length: 97 }, (_, k): [number, number, number] => {
    const t = (k / 96) * 2 * Math.PI; return [(px + r * Math.cos(t)) * S, 0.03, -(py + r * Math.sin(t)) * S];
  }), [px, py, r]);

  return (
    <LabFrame
      label="Arrows and flowing tracer particles of a 2D vector field, with a probe circle and a bar fence showing the circulation or flux integrand"
      camera={[0, 6.2, 5.6]}
      onReset={reset}
      scene={() => (<group>
        <Tick fn={tick} />
        <mesh geometry={floor} position={[0, -0.02, 0]}><meshBasicMaterial vertexColors /></mesh>
        <gridHelper args={[2 * W * S, 10, "#4a6570", "#2b3f48"]} position={[0, 0, 0]} />
        <Line points={[[-W * S, 0.01, 0], [W * S, 0.01, 0]]} color="#9db0ba" lineWidth={1.5} />
        <Line points={[[0, 0.01, -W * S], [0, 0.01, W * S]]} color="#9db0ba" lineWidth={1.5} />
        <Arrows F={F} G={G} />
        <points ref={pts}>
          <bufferGeometry><bufferAttribute attach="attributes-position" args={[T.pos, 3]} /></bufferGeometry>
          <pointsMaterial color="#ffc83d" size={0.085} sizeAttenuation />
        </points>
        <Line points={circle} color="#a970ff" lineWidth={3} />
        <Fence F={F} px={px} py={py} r={r} normal={fence === "norm"} />
        <mesh position={[px * S, 0.1, -py * S]}><sphereGeometry args={[0.1, 20, 20]} /><meshStandardMaterial color="#ffffff" emissive="#a970ff" emissiveIntensity={0.5} /></mesh>
      </group>)}
      readouts={[
        ["div F at probe", fmt(g.div, 3)],
        ["curl F · k at probe", fmt(g.curl, 3)],
        ["Circulation ∮F·dr", fmt(g.circ, 4)],
        ["∬ curl F dA", fmt(g.curlInt, 4)],
        ["Flux ∮F·n ds", fmt(g.flux, 4)],
        ["∬ div F dA", fmt(g.divInt, 4)],
      ]}
      controls={<>
        <Pick label="Field F = (P, Q)" value={field} options={(Object.keys(FIELDS) as FieldId[]).map((k) => ({ id: k, label: FIELDS[k].label }))} onChange={setField} />
        <Slider label="Circle radius r" value={r} min={0.2} max={2} step={0.05} digits={2} onChange={setR} />
        <Slider label="Probe x" value={px} min={-2} max={2} step={0.05} digits={2} onChange={setPx} />
        <Slider label="Probe y" value={py} min={-2} max={2} step={0.05} digits={2} onChange={setPy} />
        <Pick label="Fence shows" value={fence} options={[{ id: "tan", label: "F·T (tangential → circulation)" }, { id: "norm", label: "F·n (outward → flux)" }]} onChange={setFence} />
      </>}
      note={<>
        <p><b>What you see.</b> Each cone points along F = (P, Q) at its grid point, coloured blue (weak) to red (strong). Gold tracers are carried by the flow. The floor is tinted by divergence: red where div F = ∂P/∂x + ∂Q/∂y &gt; 0 (a source, flow spreading out), blue where it is negative (a sink). The scalar curl ∂Q/∂x − ∂P/∂y measures how much a tiny paddle wheel at a point would spin.</p>
        <p className="mt-2"><b>Green&apos;s theorem.</b> Around the purple circle, the bars show the integrand: F·T for circulation or F·n for flux (green up, red down). Adding them up gives ∮F·dr and ∮F·n ds, computed numerically round the circle. Green&apos;s theorem says ∮<sub>C</sub>(P dx + Q dy) = ∬<sub>D</sub>(∂Q/∂x − ∂P/∂y) dA, and its flux form says ∮F·n ds = ∬ div F dA — the pairs of readouts agree.</p>
        <p className="mt-2"><b>Try.</b> In the rotation field the circulation is 2 × (area πr²) wherever the circle sits. The shear field looks like straight lanes but still has curl −1. In the limit-cycle field, grow r through 1: the flux turns from positive to negative and is exactly zero at r = 1, where the tracers pile up.</p>
      </>}
    />
  );
}
