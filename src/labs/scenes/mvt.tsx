"use client";
import { Line } from "@react-three/drei";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { MVT_FUNCS, fmt, mvt, type MvtId } from "../sim/mathsa";
import { Tick, useQuality } from "../Stage";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { MATHSA_SPECS } from "../meta/mathsa.specs";

type V3 = [number, number, number];
type View = { x0: number; x1: number; xm: number; ym: number; sx: number; sy: number };
const wx = (v: View, x: number) => (x - v.xm) * v.sx;
const wy = (v: View, y: number) => (y - v.ym) * v.sy;

/** Band between the curve and the chord on [lo, hi]: green where the curve is above the chord, red below. */
function makeBand(f: (x: number) => number, lo: number, hi: number, fa: number, slope: number, v: View, n: number) {
  const pos = new Float32Array((n + 1) * 6), col = new Float32Array((n + 1) * 6), idx: number[] = [];
  const up = new THREE.Color("#44c95a"), dn = new THREE.Color("#ff5a5f");
  for (let i = 0; i <= n; i++) {
    const x = lo + ((hi - lo) * i) / n, y = f(x), yc = fa + slope * (x - lo), c = y >= yc ? up : dn;
    pos.set([wx(v, x), wy(v, yc), -0.02, wx(v, x), wy(v, y), -0.02], i * 6);
    col.set([c.r, c.g, c.b, c.r, c.g, c.b], i * 6);
  }
  for (let i = 0; i < n; i++) idx.push(2 * i, 2 * i + 2, 2 * i + 1, 2 * i + 1, 2 * i + 2, 2 * i + 3);
  const g = new THREE.BufferGeometry();
  g.setIndex(idx); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  return g;
}
/** Slide a probe tangent back and forth across (a, b); purely visual, the readouts never use it. */
function placeProbe(grp: THREE.Group, id: MvtId, lo: number, hi: number, v: View, t: number) {
  const F = MVT_FUNCS[id], x = lo + (hi - lo) * (0.5 - 0.5 * Math.cos(t * 0.7));
  grp.position.set(wx(v, x), wy(v, F.f(x)), 0.06);
  grp.rotation.z = Math.atan2(F.df(x) * v.sy, v.sx);
}

export default function MvtLab() {
  const quality = useQuality();
  const [P, set, reset] = useLabParams(MATHSA_SPECS.mvt);
  const { fn, a, b } = P;
  const setFn = (x: (typeof P)["fn"]) => set("fn", x), setA = (x: (typeof P)["a"]) => set("a", x), setB = (x: (typeof P)["b"]) => set("b", x);
  const F = MVT_FUNCS[fn];
  const M = mvt(fn, a, b);
  const { lo, hi, fa, fb, slope, cs } = M;
  const n = quality === "low" ? 90 : 180;

  const view = useMemo<View>(() => {
    const span = Math.max(hi - lo, 0.5), x0 = lo - 0.15 * span - 0.2, x1 = hi + 0.15 * span + 0.2;
    let y0 = Infinity, y1 = -Infinity;
    for (let i = 0; i <= 200; i++) { const y = F.f(x0 + ((x1 - x0) * i) / 200); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    return { x0, x1, xm: (x0 + x1) / 2, ym: (y0 + y1) / 2, sx: 6.4 / (x1 - x0), sy: 3.6 / Math.max(y1 - y0, 1e-3) };
  }, [F, lo, hi]);
  const curve = useMemo(() => Array.from({ length: n + 1 }, (_, i): V3 => {
    const x = view.x0 + ((view.x1 - view.x0) * i) / n; return [wx(view, x), wy(view, F.f(x)), 0];
  }), [F, view, n]);
  const band = useMemo(() => (Number.isFinite(slope) ? makeBand(F.f, lo, hi, fa, slope, view, n) : null), [F, lo, hi, fa, slope, view, n]);
  useLayoutEffect(() => () => { band?.dispose(); }, [band]);

  const ok = Number.isFinite(slope);
  const ext = 0.12 * (hi - lo);
  const chord: V3[] = [[wx(view, lo - ext), wy(view, fa - slope * ext), 0.02], [wx(view, hi + ext), wy(view, fb + slope * ext), 0.02]];
  const dir = (m: number) => { const dx = view.sx, dy = m * view.sy, L = Math.hypot(dx, dy); return [dx / L, dy / L] as const; };
  const [ux, uy] = ok ? dir(slope) : [1, 0];
  const yBase = wy(view, view.ym) - 1.95;

  const probe = useRef<THREE.Group>(null), t = useRef(0);
  const tick = (dt: number) => { t.current += Math.min(dt, 0.05); if (probe.current) placeProbe(probe.current, fn, lo, hi, view, t.current); };

  return (
    <LabFrame
      label="A curve with its chord from a to b and the tangent lines parallel to the chord at the mean value points c"
      camera={[1.2, 0.9, 7.6]}
      onReset={reset}
      scene={() => (<group>
        <Tick fn={tick} />
        <gridHelper args={[8, 16, "#3a4d57", "#26343c"]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.3]} />
        {view.ym - 1.8 / view.sy < 0 && 0 < view.ym + 1.8 / view.sy && <Line points={[[-3.6, wy(view, 0), -0.1], [3.6, wy(view, 0), -0.1]]} color="#9db0ba" lineWidth={1.5} />}
        {band && <mesh geometry={band}><meshBasicMaterial vertexColors side={THREE.DoubleSide} transparent opacity={0.45} /></mesh>}
        <Line points={curve} color="#2ba6f5" lineWidth={4} />
        {ok && <Line points={chord} color="#ffc83d" lineWidth={3} />}
        {[[lo, fa], [hi, fb]].map(([x, y], i) => (<group key={i}>
          <mesh position={[wx(view, x), wy(view, y), 0.05]}><sphereGeometry args={[0.1, 20, 20]} /><meshStandardMaterial color="#ffc83d" emissive="#ffc83d" emissiveIntensity={0.5} /></mesh>
          <Line points={[[wx(view, x), wy(view, y), 0], [wx(view, x), yBase, 0]]} color="#ffc83d" lineWidth={1} dashed dashSize={0.08} gapSize={0.06} />
        </group>))}
        {cs.map((c, i) => { const X = wx(view, c), Y = wy(view, F.f(c)); return (<group key={i}>
          <Line points={[[X - 1.5 * ux, Y - 1.5 * uy, 0.04], [X + 1.5 * ux, Y + 1.5 * uy, 0.04]]} color="#44c95a" lineWidth={3} />
          <Line points={[[X, Y, 0], [X, yBase, 0]]} color="#44c95a" lineWidth={1.2} dashed dashSize={0.08} gapSize={0.06} />
          <mesh position={[X, Y, 0.06]}><sphereGeometry args={[0.11, 20, 20]} /><meshStandardMaterial color="#44c95a" emissive="#44c95a" emissiveIntensity={0.6} /></mesh>
        </group>); })}
        <group ref={probe}>
          <Line points={[[-0.9, 0, 0], [0.9, 0, 0]]} color="#a970ff" lineWidth={2} />
          <mesh><sphereGeometry args={[0.07, 16, 16]} /><meshStandardMaterial color="#a970ff" emissive="#a970ff" emissiveIntensity={0.6} /></mesh>
        </group>
      </group>)}
      readouts={[
        ["Secant slope", ok ? fmt(slope, 4) : "— (a = b)"],
        ["c in (a, b)", cs.length ? cs.map((c) => fmt(c, 4)).join(", ") : "none"],
        ["f′(c)", cs.length ? cs.map((c) => fmt(F.df(c), 4)).join(", ") : "—"],
        ["f(a), f(b)", `${fmt(fa, 3)}, ${fmt(fb, 3)}`],
        ["Rolle's theorem", !ok ? "—" : M.rolle ? "applies: f(a) = f(b)" : "no: f(a) ≠ f(b)"],
      ]}
      controls={<>
        <Pick label="Function" value={fn} options={(Object.keys(MVT_FUNCS) as MvtId[]).map((k) => ({ id: k, label: MVT_FUNCS[k].label }))} onChange={setFn} />
        <Slider label="Left end a" value={a} min={-4} max={4} step={0.05} digits={2} onChange={setA} />
        <Slider label="Right end b" value={b} min={-4} max={4} step={0.05} digits={2} onChange={setB} />
      </>}
      note={<>
        <p><b>Lagrange&apos;s mean value theorem.</b> If f is continuous on [a, b] and differentiable on (a, b), there is at least one c in (a, b) with f′(c) = (f(b) − f(a)) / (b − a): somewhere the tangent (green) is parallel to the chord (gold). The purple tangent slides across the interval — watch it line up with the chord exactly as it passes each green point. All four functions here are smooth, so the theorem always applies; c is found from f′(c) = slope in closed form (e.g. 3c² − 3 = slope for x³ − 3x).</p>
        <p className="mt-2"><b>Rolle&apos;s theorem</b> is the special case f(a) = f(b): the chord is flat, so some c has f′(c) = 0 — a turning point. Green shading is where the curve lies above the chord, red below; the gap is widest exactly at a c.</p>
        <p className="mt-2"><b>Try.</b> The Rolle presets; x² on any interval (c is always the midpoint); a long interval on sin x to get several c values. If a &gt; b the two ends are swapped. The vertical scale is stretched to fit, which keeps parallel lines parallel.</p>
      </>}
    />
  );
}
