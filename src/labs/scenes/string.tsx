"use client";
import { Line } from "@react-three/drei";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { fundamental, heatHalfLife, pluckCoeff } from "../sim/mathsb";
import { Tick, useQuality } from "../Stage";
import { LabFrame, Slider, Pick } from "../ui";
import { useLabParams } from "../params";
import { MATHSB_SPECS } from "../meta/mathsb.specs";

const HALF = 4, SY = 2.2, TRAIL = 7;
type Mode = "wave" | "heat";
interface Sim { mode: Mode; N: number; L: number; c: number; alpha: number; NX: number; tbl: Float32Array; b: Float64Array; coef: Float64Array; y: Float32Array }
interface Clock { t: number; snap: number }

const makeTable = (NX: number, N: number, L: number) => {
  const tb = new Float32Array(NX * N);
  for (let j = 0; j < NX; j++) for (let n = 1; n <= N; n++) tb[j * N + n - 1] = Math.sin((n * Math.PI * ((j / (NX - 1)) * L)) / L);
  return tb;
};
const makeTrail = (NX: number, k: number) => {
  const g = new THREE.BufferGeometry(), a = new Float32Array(NX * 3);
  for (let j = 0; j < NX; j++) { a[3 * j] = -HALF + (2 * HALF * j) / (NX - 1); a[3 * j + 2] = -0.16 * (k + 1); }
  g.setAttribute("position", new THREE.BufferAttribute(a, 3));
  return g;
};

/** Physical time of a display clock: one period per 4 s (wave) or four half-lives per 8 s (heat). */
function physTime(s: Sim, clock: number) {
  return s.mode === "wave" ? ((clock % 4) / 4) * ((2 * s.L) / s.c) : ((clock % 8) / 8) * 4 * heatHalfLife(s.L, s.alpha);
}
/** u(xⱼ, t) for every sample point: Σ bₙ·f(n, t)·sin(nπxⱼ/L). */
function computeShape(s: Sim, t: number) {
  const { N, L, c, alpha, coef, b, tbl, y, NX, mode } = s;
  for (let n = 1; n <= N; n++) coef[n - 1] = b[n - 1] * (mode === "wave" ? Math.cos((n * Math.PI * c * t) / L) : Math.exp(-Math.pow((n * Math.PI) / L, 2) * alpha * t));
  for (let j = 0; j < NX; j++) { let u = 0; const o = j * N; for (let n = 0; n < N; n++) u += coef[n] * tbl[o + n]; y[j] = u; }
}
function paintBeads(m: THREE.InstancedMesh | null, o: THREE.Object3D, s: Sim) {
  if (!m) return;
  for (let j = 0; j < s.NX; j++) { o.position.set(-HALF + (2 * HALF * j) / (s.NX - 1), s.y[j] * SY, 0); o.updateMatrix(); m.setMatrixAt(j, o.matrix); }
  m.instanceMatrix.needsUpdate = true;
}
/** Pushes the current shape onto the trail (newest first), shifting older ones back. */
function pushTrail(geos: THREE.BufferGeometry[], s: Sim) {
  for (let k = TRAIL - 1; k >= 0; k--) {
    const dst = geos[k].attributes.position;
    for (let j = 0; j < s.NX; j++) dst.setY(j, k === 0 ? s.y[j] * SY : geos[k - 1].attributes.position.getY(j));
    dst.needsUpdate = true;
  }
}
function clearTrail(geos: THREE.BufferGeometry[]) {
  for (const g of geos) { const p = g.attributes.position; for (let j = 0; j < p.count; j++) p.setY(j, 0); p.needsUpdate = true; }
}

function Shapes({ mode, N, h, a, L, c, alpha, low }: { mode: Mode; N: number; h: number; a: number; L: number; c: number; alpha: number; low: boolean }) {
  const NX = low ? 41 : 81;
  const tbl = useMemo(() => makeTable(NX, N, L), [NX, N, L]);
  const b = useMemo(() => Float64Array.from({ length: N }, (_, i) => pluckCoeff(i + 1, h, a, L)), [N, h, a, L]);
  const coef = useMemo(() => new Float64Array(N), [N]);
  const y = useMemo(() => new Float32Array(NX), [NX]);
  const sim: Sim = { mode, N, L, c, alpha, NX, tbl, b, coef, y };
  const beads = useRef<THREE.InstancedMesh>(null), clk = useRef<Clock>({ t: 0, snap: 0 });
  const o = useMemo(() => new THREE.Object3D(), []);
  const geos = useMemo(() => Array.from({ length: TRAIL }, (_, k) => makeTrail(NX, k)), [NX]);
  const lines = useMemo(() => geos.map((g, k) => new THREE.Line(g, new THREE.LineBasicMaterial({ color: mode === "wave" ? "#2ba6f5" : "#ff9a1f", transparent: true, opacity: 0.6 * (1 - k / (TRAIL + 1)) }))), [geos, mode]);
  useLayoutEffect(() => {
    const m = beads.current; if (m) m.count = NX;
    const s: Sim = { mode, N, L, c, alpha, NX, tbl, b, coef, y };
    computeShape(s, physTime(s, clk.current.t));
    paintBeads(m, o, s);
    clearTrail(geos);
  }, [mode, N, L, c, alpha, NX, tbl, b, coef, y, o, geos]);
  const tick = (dt: number) => {
    const k = clk.current;
    k.t += Math.min(dt, 0.05); k.snap += Math.min(dt, 0.05);
    computeShape(sim, physTime(sim, k.t));
    if (k.snap > (mode === "wave" ? 0.12 : 0.4)) { k.snap = 0; pushTrail(geos, sim); }
    paintBeads(beads.current, o, sim);
  };
  const col = mode === "wave" ? "#ffc83d" : "#ff7a3d";
  return (<group>
    <Tick fn={tick} />
    {lines.map((l, i) => <primitive key={i} object={l} />)}
    <instancedMesh key={NX} ref={beads} args={[undefined, undefined, 81]} frustumCulled={false}><sphereGeometry args={[0.075, 10, 8]} /><meshStandardMaterial color={col} emissive={col} emissiveIntensity={0.35} roughness={0.4} /></instancedMesh>
  </group>);
}

const f4 = (x: number) => (Math.abs(x) < 5e-5 ? 0 : x).toFixed(4);

export default function StringLab() {
  const quality = useQuality();
  const [P, set, reset] = useLabParams(MATHSB_SPECS.string);
  const { mode, p, h, c, L, alpha } = P;
  const N = Math.round(P.N), a = p * L;
  const th = heatHalfLife(L, alpha);
  const initial = useMemo<[number, number, number][]>(() => [[-HALF, 0, -0.05], [-HALF + 2 * HALF * p, h * SY, -0.05], [HALF, 0, -0.05]], [p, h]);
  return (
    <LabFrame
      label="A plucked string vibrating as a sum of sine modes with a fading trail of earlier shapes, or the same shape cooling under the heat equation"
      camera={[0, 1.2, 11]}
      onReset={reset}
      scene={() => (<group>
        <mesh position={[-HALF - 0.15, 0, 0]}><boxGeometry args={[0.3, 1.2, 0.5]} /><meshStandardMaterial color="#5b6d77" /></mesh>
        <mesh position={[HALF + 0.15, 0, 0]}><boxGeometry args={[0.3, 1.2, 0.5]} /><meshStandardMaterial color="#5b6d77" /></mesh>
        <Line points={[[-HALF, 0, 0], [HALF, 0, 0]]} color="#3a4d57" lineWidth={1} />
        <Line points={initial} color="#44c95a" lineWidth={1.5} />
        <mesh position={[-HALF + 2 * HALF * p, h * SY, -0.05]}><sphereGeometry args={[0.12, 14, 12]} /><meshStandardMaterial color="#ff5a5f" emissive="#ff5a5f" emissiveIntensity={0.4} /></mesh>
        <Shapes mode={mode} N={N} h={h} a={a} L={L} c={c} alpha={alpha} low={quality === "low"} />
        <gridHelper args={[10, 20, "#3a4d57", "#26343c"]} position={[0, -SY - 0.2, -0.6]} />
      </group>)}
      readouts={[
        ["b₁", f4(pluckCoeff(1, h, a, L))],
        ["b₂", f4(pluckCoeff(2, h, a, L))],
        ["b₃", f4(pluckCoeff(3, h, a, L))],
        ["Fundamental f₁ = c/2L", `${fundamental(c, L).toFixed(3)} Hz`],
        ["Modes used", String(N)],
        mode === "wave" ? ["Pluck position", `x = ${a.toFixed(3)} m`] : ["First mode halves in", `${th.toFixed(3)} s`],
      ]}
      controls={<>
        <Pick label="Equation" value={mode} options={[{ id: "wave", label: "Wave equation uₜₜ = c² uₓₓ" }, { id: "heat", label: "Heat equation uₜ = α uₓₓ" }]} onChange={(v) => set("mode", v)} />
        <Slider label="Pluck position p (fraction of L)" value={p} min={0.05} max={0.95} step={0.01} digits={2} onChange={(v) => set("p", v)} />
        <Slider label="Pluck height h" value={h} min={0.1} max={1} step={0.05} digits={2} unit=" m" onChange={(v) => set("h", v)} />
        <Slider label="Modes N" value={P.N} min={1} max={50} step={1} digits={0} onChange={(v) => set("N", v)} />
        <Slider label="Wave speed c (wave)" value={c} min={0.5} max={4} step={0.1} digits={1} unit=" m/s" onChange={(v) => set("c", v)} />
        <Slider label="String length L" value={L} min={0.5} max={2} step={0.1} digits={1} unit=" m" onChange={(v) => set("L", v)} />
        <Slider label="Diffusivity α (heat)" value={alpha} min={0.01} max={0.2} step={0.01} digits={2} unit=" m²/s" onChange={(v) => set("alpha", v)} />
      </>}
      note={<p>A string of length L fixed at both ends and plucked at x = p·L to height h starts as the green triangle. Separation of variables gives u(x, t) = Σ bₙ sin(nπx/L) cos(nπct/L) with bₙ = 2h sin(nπp) / (n²π² p(1 − p)); for a mid-pluck b₁ = 8h/π² and the even modes vanish. Each mode n vibrates at n·c/2L, so the fundamental is c/2L. The gold beads add the first N modes live (blue trail: shapes a moment ago); with N = 1 you see a pure sine, with many the sharp corner appears. In heat mode the same shape is the initial temperature and mode n decays as e^(−(nπ/L)²αt): higher modes die n² times faster, the profile smooths into one sine and the first mode halves in ln 2 / ((π/L)²α). Motion is slowed for viewing.</p>}
    />
  );
}
