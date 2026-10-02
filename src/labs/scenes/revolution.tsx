"use client";
import { Line } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { REV_FUNCS, fmt, revolution, type RevId } from "../sim/mathsa";
import { Tick, useQuality } from "../Stage";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { MATHSA_SPECS } from "../meta/mathsa.specs";

const SX = 1.4, XC = 2; // world x = (x − 2)·1.4, so x ∈ [0, 4] spans −2.8…2.8
const wx = (x: number) => (x - XC) * SX;
type Profile = { xs: Float32Array; ys: Float32Array };

/** Lathe grid (nx + 1) × (nt + 1): vertex colour runs blue → purple → green along x, lighter mid-sweep. */
function makeLathe(nx: number, nt: number) {
  const g = new THREE.BufferGeometry(), n = (nx + 1) * (nt + 1);
  const col = new Float32Array(n * 3), c = new THREE.Color(), idx: number[] = [];
  for (let j = 0; j <= nt; j++) for (let i = 0; i <= nx; i++) {
    c.setHSL(0.56 + 0.3 * (i / nx), 0.75, 0.46 + 0.14 * Math.sin((j / nt) * Math.PI));
    col.set([c.r, c.g, c.b], (j * (nx + 1) + i) * 3);
  }
  for (let j = 0; j < nt; j++) for (let i = 0; i < nx; i++) {
    const a = j * (nx + 1) + i, b = a + 1, d = a + nx + 1, e = d + 1;
    idx.push(a, d, b, b, d, e);
  }
  g.setIndex(idx);
  g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  return g;
}
/** Revolve the profile about the x-axis through `angle` radians: (x, y) → (x, y cos φ, y sin φ). */
function paintLathe(geo: THREE.BufferGeometry, prof: Profile, nt: number, angle: number) {
  const p = geo.attributes.position as THREE.BufferAttribute, nx = prof.xs.length - 1;
  for (let j = 0; j <= nt; j++) {
    const phi = (j / nt) * angle, c = Math.cos(phi), s = Math.sin(phi);
    for (let i = 0; i <= nx; i++) p.setXYZ(j * (nx + 1) + i, prof.xs[i], prof.ys[i] * c, prof.ys[i] * s);
  }
  p.needsUpdate = true;
  geo.computeVertexNormals();
  geo.computeBoundingSphere();
}
/** Flat strip between the curve and the axis (the plane region that gets revolved). */
function makeRegion(prof: Profile) {
  const n = prof.xs.length, pos = new Float32Array(n * 2 * 3), idx: number[] = [];
  for (let i = 0; i < n; i++) { pos.set([prof.xs[i], 0, 0, prof.xs[i], prof.ys[i], 0], i * 6); }
  for (let i = 0; i < n - 1; i++) idx.push(2 * i, 2 * i + 2, 2 * i + 1, 2 * i + 1, 2 * i + 2, 2 * i + 3);
  const g = new THREE.BufferGeometry();
  g.setIndex(idx); g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  return g;
}

function Solid({ prof, sweep, playing, nt, curve, cx, cy }: { prof: Profile; sweep: number; playing: boolean; nt: number; curve: [number, number, number][]; cx: number; cy: number }) {
  const nx = prof.xs.length - 1;
  const geo = useMemo(() => makeLathe(nx, nt), [nx, nt]);
  const region = useMemo(() => makeRegion(prof), [prof]);
  const arm = useRef<THREE.Group>(null);
  const anim = useRef({ t: 0, last: -1 });
  const invalidate = useThree((s) => s.invalidate);
  useLayoutEffect(() => {
    // Static view (paused / reduced motion) shows the full sweep; while playing the tick takes over from 0.
    const a = anim.current;
    a.t = 0; a.last = playing ? 0 : sweep;
    paintLathe(geo, prof, nt, a.last);
    if (arm.current) arm.current.rotation.x = a.last;
    invalidate();
  }, [geo, prof, nt, sweep, playing, invalidate]);
  useLayoutEffect(() => () => { geo.dispose(); }, [geo]);
  useLayoutEffect(() => () => { region.dispose(); }, [region]);
  const tick = (dt: number) => {
    if (!playing) return;
    const a = anim.current, grow = Math.max(1.2, (5 * sweep) / (2 * Math.PI)), hold = 1.6;
    a.t += Math.min(dt, 0.05);
    if (a.t > grow + hold) a.t = 0;
    const ang = sweep * Math.min(1, a.t / grow);
    if (ang !== a.last) {
      a.last = ang;
      paintLathe(geo, prof, nt, ang);
      if (arm.current) arm.current.rotation.x = ang;
    }
  };
  const ring = useMemo(() => Array.from({ length: 65 }, (_, k): [number, number, number] => {
    const t = (k / 64) * 2 * Math.PI; return [cx, cy * Math.cos(t), cy * Math.sin(t)];
  }), [cx, cy]);
  return (<group>
    <Tick fn={tick} />
    <mesh geometry={geo}><meshStandardMaterial vertexColors side={THREE.DoubleSide} roughness={0.45} metalness={0.1} transparent opacity={0.88} /></mesh>
    {/* The region and its curve ride on the rotating "arm"; a ghost outline stays at φ = 0. */}
    <group ref={arm}>
      <mesh geometry={region}><meshBasicMaterial color="#ffc83d" side={THREE.DoubleSide} transparent opacity={0.55} /></mesh>
      <Line points={curve} color="#ffc83d" lineWidth={4} />
      {Number.isFinite(cy) && <mesh position={[cx, cy, 0]}><sphereGeometry args={[0.09, 16, 16]} /><meshStandardMaterial color="#a970ff" emissive="#a970ff" emissiveIntensity={0.6} /></mesh>}
    </group>
    <Line points={curve} color="#ff9a1f" lineWidth={1.5} dashed dashSize={0.12} gapSize={0.08} />
    {Number.isFinite(cy) && <Line points={ring} color="#a970ff" lineWidth={1.5} dashed dashSize={0.1} gapSize={0.07} />}
  </group>);
}

export default function RevolutionLab() {
  const quality = useQuality();
  const [P, set, reset] = useLabParams(MATHSA_SPECS.revolution);
  const { fn, a, b, sweep } = P;
  const setFn = (x: (typeof P)["fn"]) => set("fn", x), setA = (x: (typeof P)["a"]) => set("a", x), setB = (x: (typeof P)["b"]) => set("b", x), setSweep = (x: (typeof P)["sweep"]) => set("sweep", x);
  const R = revolution(fn, a, b);
  const sy = R.maxAbs > 1e-9 ? Math.min(1.4, 2.2 / R.maxAbs) : 1.4;
  const nx = quality === "low" ? 40 : 80, nt = quality === "low" ? 36 : 72;
  const prof = useMemo<Profile>(() => {
    const f = REV_FUNCS[fn].f, xs = new Float32Array(nx + 1), ys = new Float32Array(nx + 1);
    for (let i = 0; i <= nx; i++) { const x = R.lo + ((R.hi - R.lo) * i) / nx; xs[i] = wx(x); ys[i] = f(x) * sy; }
    return { xs, ys };
  }, [fn, R.lo, R.hi, sy, nx]);
  const curve = useMemo(() => Array.from(prof.xs, (x, i): [number, number, number] => [x, prof.ys[i], 0]), [prof]);
  const mid = (R.lo + R.hi) / 2, rMid = Math.abs(REV_FUNCS[fn].f(mid)) * sy;
  const turns = sweep / 360;

  return (
    <LabFrame
      label="A plane region under a curve revolving about the x-axis into a 3D solid of revolution"
      camera={[1.2, 2.6, 8.2]}
      onReset={reset}
      scene={(playing) => (<group>
        <Line points={[[-3.4, 0, 0], [3.4, 0, 0]]} color="#e8f1f5" lineWidth={2} />
        <mesh position={[3.5, 0, 0]} rotation={[0, 0, -Math.PI / 2]}><coneGeometry args={[0.08, 0.22, 12]} /><meshStandardMaterial color="#e8f1f5" /></mesh>
        <gridHelper args={[8, 16, "#3a4d57", "#26343c"]} position={[0, -2.4, 0]} />
        <Solid prof={prof} sweep={(sweep * Math.PI) / 180} playing={playing} nt={nt} curve={curve} cx={wx(R.xbar)} cy={R.ybar * sy} />
        {rMid > 0.01 && (
          <mesh position={[wx(mid), 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[rMid, rMid, 0.06, 40, 1, true]} />
            <meshStandardMaterial color="#44c95a" side={THREE.DoubleSide} transparent opacity={0.8} emissive="#44c95a" emissiveIntensity={0.25} />
          </mesh>
        )}
      </group>)}
      readouts={[
        ["Volume V = π∫f² dx", fmt(R.V, 4)],
        ["Curved surface S", fmt(R.S, 4)],
        ["Region area A = ∫|f| dx", fmt(R.A, 4)],
        ["Centroid x̄ of region", fmt(R.xbar, 3)],
        ["Turns shown", `${fmt(turns, 3)} (${fmt(sweep, 0)}°)`],
      ]}
      controls={<>
        <Pick label="Curve y = f(x)" value={fn} options={(Object.keys(REV_FUNCS) as RevId[]).map((k) => ({ id: k, label: REV_FUNCS[k].label }))} onChange={setFn} />
        <Slider label="Lower limit a" value={a} min={0} max={4} step={0.05} digits={2} onChange={setA} />
        <Slider label="Upper limit b" value={b} min={0} max={4} step={0.05} digits={2} onChange={setB} />
        <Slider label="Sweep angle" value={sweep} min={0} max={360} step={5} digits={0} unit="°" onChange={setSweep} />
      </>}
      note={<>
        <p><b>What you see.</b> The gold region lies between y = f(x) and the x-axis from a to b. It swings about the x-axis (white) and leaves behind the solid of revolution; press Play to watch it sweep, or set the sweep angle to cut the solid open. The green disc is one slice of thickness dx and radius f(x): its volume is π f(x)² dx, and adding every slice gives the <b>disc method</b> V = π∫ₐᵇ f(x)² dx.</p>
        <p className="mt-2"><b>Surface.</b> Each thin band of the skin has radius |f| and slant length ds = √(1 + f′²) dx, so S = 2π∫ₐᵇ |f| √(1 + f′²) dx (curved surface only, no end caps). Integrals are evaluated with Simpson&apos;s rule; the vertical scale shrinks to fit tall curves.</p>
        <p className="mt-2"><b>Try.</b> Cone preset: V = πr²h/3. Paraboloid: exactly half its cylinder. The purple dot is the centroid (x̄, ȳ) of the region; the dashed ring is the path it travels, and Pappus&apos;s theorem says V = 2π ȳ × A for a region on one side of the axis.</p>
      </>}
    />
  );
}
