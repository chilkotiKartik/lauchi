"use client";
import { Line } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { CALC_FUNCS, calculus, diffQuotient, fmt, type CalcId, type Rule } from "../sim/mathsa";
import { Tick, useQuality } from "../Stage";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { MATHSA_SPECS } from "../meta/mathsa.specs";

type V3 = [number, number, number];
type View = { x0: number; x1: number; xm: number; ym: number; sx: number; sy: number };
const wx = (v: View, x: number) => (x - v.xm) * v.sx;
const wy = (v: View, y: number) => (y - v.ym) * v.sy;
const MAXN = 50, DEPTH = 0.3;

function paintRects(m: THREE.InstancedMesh, f: (x: number) => number, a: number, b: number, n: number, rule: Rule, v: View) {
  const o = new THREE.Object3D(), c = new THREE.Color(), dx = (b - a) / n, off = rule === "left" ? 0 : rule === "mid" ? 0.5 : 1;
  for (let i = 0; i < n; i++) {
    const xl = a + i * dx, xr = xl + dx, y = f(a + (i + off) * dx);
    const w = Math.abs(wx(v, xr) - wx(v, xl)), h = wy(v, y) - wy(v, 0);
    o.position.set((wx(v, xl) + wx(v, xr)) / 2, (wy(v, 0) + wy(v, y)) / 2, 0);
    o.scale.set(Math.max(w * 0.94, 0.004), Math.max(Math.abs(h), 0.004), DEPTH); o.updateMatrix();
    m.setMatrixAt(i, o.matrix);
    // signed contribution y·dx: positive → blue/purple, negative → red/orange
    m.setColorAt(i, y * dx >= 0 ? c.setHSL(0.56 + 0.16 * (i % 2), 0.75, 0.55) : c.setHSL(0.02 + 0.06 * (i % 2), 0.85, 0.58));
  }
  m.count = n; m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true;
}
function Rects({ f, a, b, n, rule, v }: { f: (x: number) => number; a: number; b: number; n: number; rule: Rule; v: View }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const invalidate = useThree((s) => s.invalidate);
  useLayoutEffect(() => { if (ref.current) { paintRects(ref.current, f, a, b, n, rule, v); invalidate(); } }, [f, a, b, n, rule, v, invalidate]);
  return <instancedMesh ref={ref} args={[undefined, undefined, MAXN]}><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial roughness={0.5} transparent opacity={0.85} /></instancedMesh>;
}

/** Exact area between the curve and the axis on [a, b], drawn as a flat gold sheet behind the rectangles. */
function makeArea(f: (x: number) => number, a: number, b: number, v: View, n: number) {
  const pos = new Float32Array((n + 1) * 6), idx: number[] = [];
  for (let i = 0; i <= n; i++) { const x = a + ((b - a) * i) / n; pos.set([wx(v, x), wy(v, 0), -DEPTH / 2 - 0.02, wx(v, x), wy(v, f(x)), -DEPTH / 2 - 0.02], i * 6); }
  for (let i = 0; i < n; i++) idx.push(2 * i, 2 * i + 2, 2 * i + 1, 2 * i + 1, 2 * i + 2, 2 * i + 3);
  const g = new THREE.BufferGeometry();
  g.setIndex(idx); g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  return g;
}

/** A ghost secant whose step shrinks from h to 0 and back — shows the secant turning into the tangent. Visual only. */
function placeGhost(grp: THREE.Group, dot: THREE.Mesh, f: (x: number) => number, x0: number, h: number, v: View, t: number) {
  const ht = h * (0.52 + 0.48 * Math.cos(t * 1.1)), q = diffQuotient(f, x0, ht);
  grp.position.set(wx(v, x0), wy(v, f(x0)), DEPTH / 2 + 0.05);
  grp.rotation.z = Math.atan2(q * v.sy, v.sx);
  dot.position.set(wx(v, x0 + ht), wy(v, f(x0 + ht)), DEPTH / 2 + 0.07);
}

export default function CalculusLab() {
  const quality = useQuality();
  const [P, set, reset] = useLabParams(MATHSA_SPECS.calculus);
  const { fn, x0, h, a, b, n, rule } = P;
  const setFn = (x: (typeof P)["fn"]) => set("fn", x), setX0 = (x: (typeof P)["x0"]) => set("x0", x), setH = (x: (typeof P)["h"]) => set("h", x), setA = (x: (typeof P)["a"]) => set("a", x), setB = (x: (typeof P)["b"]) => set("b", x), setN = (x: (typeof P)["n"]) => set("n", x), setRule = (x: (typeof P)["rule"]) => set("rule", x);
  const F = CALC_FUNCS[fn];
  const C = calculus(fn, x0, h, a, b, n, rule);
  const seg = quality === "low" ? 100 : 200;

  const view = useMemo<View>(() => {
    let x0w = Math.min(a, b, x0, x0 + h) - 0.4, x1w = Math.max(a, b, x0, x0 + h) + 0.4;
    if (F.pos) { x0w = Math.max(x0w, 0.12); x1w = Math.max(x1w, x0w + 1); }
    let y0 = 0, y1 = 0;
    for (let i = 0; i <= 200; i++) { const y = F.f(x0w + ((x1w - x0w) * i) / 200); if (Number.isFinite(y)) { y0 = Math.min(y0, y); y1 = Math.max(y1, y); } }
    y0 = Math.max(y0, -30); y1 = Math.min(y1, 30);
    return { x0: x0w, x1: x1w, xm: (x0w + x1w) / 2, ym: (y0 + y1) / 2, sx: 6.8 / (x1w - x0w), sy: 3.8 / Math.max(y1 - y0, 0.5) };
  }, [F, a, b, x0, h]);
  const curve = useMemo(() => Array.from({ length: seg + 1 }, (_, i): V3 => {
    const x = view.x0 + ((view.x1 - view.x0) * i) / seg, y = Math.max(-40, Math.min(40, F.f(x)));
    return [wx(view, x), wy(view, y), DEPTH / 2 + 0.02];
  }), [F, view, seg]);
  const area = useMemo(() => (C.ok ? makeArea(F.f, a, b, view, 120) : null), [C.ok, F, a, b, view]);
  useLayoutEffect(() => () => { area?.dispose(); }, [area]);

  const z = DEPTH / 2 + 0.04;
  const P0: V3 = [wx(view, x0), wy(view, C.fx0), z];
  const L = Math.hypot(view.sx, C.d * view.sy) || 1, ux = view.sx / L, uy = (C.d * view.sy) / L;
  const P1: V3 = [wx(view, x0 + h), wy(view, F.f(x0 + h)), z];
  const sdx = P1[0] - P0[0], sdy = P1[1] - P0[1], sl = Math.hypot(sdx, sdy) || 1, ext = 0.8 / sl;
  const secant: V3[] = [[P0[0] - sdx * ext, P0[1] - sdy * ext, z], [P1[0] + sdx * ext, P1[1] + sdy * ext, z]];

  const ghost = useRef<THREE.Group>(null), dot = useRef<THREE.Mesh>(null), t = useRef(0);
  const tick = (dt: number) => {
    t.current += Math.min(dt, 0.05);
    if (C.ok && ghost.current && dot.current) placeGhost(ghost.current, dot.current, F.f, x0, h, view, t.current);
  };

  const bad = "needs x > 0";
  return (
    <LabFrame
      label="A curve with its tangent and a secant from first principles, and Riemann rectangles filling the area under it"
      camera={[1.6, 1.2, 7.8]}
      onReset={reset}
      scene={() => (<group>
        <Tick fn={tick} />
        <gridHelper args={[8, 16, "#3a4d57", "#26343c"]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.5]} />
        <Line points={[[-3.7, wy(view, 0), 0], [3.7, wy(view, 0), 0]]} color="#9db0ba" lineWidth={1.5} />
        {area && <mesh geometry={area}><meshBasicMaterial color="#ffc83d" side={THREE.DoubleSide} transparent opacity={0.5} /></mesh>}
        {C.ok && <Rects f={F.f} a={a} b={b} n={n} rule={rule} v={view} />}
        <Line points={curve} color="#e8f1f5" lineWidth={3} />
        {C.ok && (<>
          <Line points={[[P0[0] - 1.7 * ux, P0[1] - 1.7 * uy, z], [P0[0] + 1.7 * ux, P0[1] + 1.7 * uy, z]]} color="#44c95a" lineWidth={3.5} />
          <Line points={secant} color="#ff9a1f" lineWidth={2.5} />
          <mesh position={P0}><sphereGeometry args={[0.1, 20, 20]} /><meshStandardMaterial color="#44c95a" emissive="#44c95a" emissiveIntensity={0.6} /></mesh>
          <mesh position={P1}><sphereGeometry args={[0.08, 16, 16]} /><meshStandardMaterial color="#ff9a1f" emissive="#ff9a1f" emissiveIntensity={0.6} /></mesh>
          <group ref={ghost}><Line points={[[-1.4, 0, 0], [1.4, 0, 0]]} color="#a970ff" lineWidth={1.5} dashed dashSize={0.1} gapSize={0.06} /></group>
          <mesh ref={dot}><sphereGeometry args={[0.06, 12, 12]} /><meshStandardMaterial color="#a970ff" emissive="#a970ff" emissiveIntensity={0.6} /></mesh>
        </>)}
      </group>)}
      readouts={[
        ["f′(x₀)", C.ok ? fmt(C.d, 4) : bad],
        ["(f(x₀ + h) − f(x₀)) / h", C.ok ? fmt(C.dq, 4) : bad],
        ["Riemann sum", C.ok ? fmt(C.sum, 4) : bad],
        ["Exact ∫ₐᵇ f dx", C.ok ? fmt(C.exact, 4) : bad],
        ["Error (sum − exact)", C.ok ? fmt(C.err, 4) : bad],
      ]}
      controls={<>
        <Pick label="Function f(x)" value={fn} options={(Object.keys(CALC_FUNCS) as CalcId[]).map((k) => ({ id: k, label: CALC_FUNCS[k].label }))} onChange={setFn} />
        <Slider label="Tangent point x₀" value={x0} min={-3} max={3} step={0.05} digits={2} onChange={setX0} />
        <Slider label="Step h" value={h} min={0.01} max={1.5} step={0.01} digits={2} onChange={setH} />
        <Slider label="Lower limit a" value={a} min={-3} max={3} step={0.05} digits={2} onChange={setA} />
        <Slider label="Upper limit b" value={b} min={-3} max={3.2} step={0.05} digits={2} onChange={setB} />
        <Slider label="Rectangles n" value={n} min={1} max={50} step={1} digits={0} onChange={setN} />
        <Pick label="Sample point" value={rule} options={[{ id: "left", label: "Left end" }, { id: "mid", label: "Midpoint" }, { id: "right", label: "Right end" }]} onChange={setRule} />
      </>}
      note={<>
        <p><b>Derivative.</b> The orange secant joins (x₀, f(x₀)) to (x₀ + h, f(x₀ + h)); its slope is the difference quotient (f(x₀ + h) − f(x₀))/h. As h → 0 it becomes the green tangent, whose slope is f′(x₀) = lim<sub>h→0</sub> (f(x₀ + h) − f(x₀))/h. The dashed purple secant keeps shrinking its step to show the limit. For x² the quotient is exactly 2x₀ + h, so the error equals h.</p>
        <p className="mt-2"><b>Integral.</b> The n rectangles have width Δx = (b − a)/n and height f at the left end, midpoint or right end of each strip; their total Σ f(xᵢ*) Δx is a Riemann sum. The gold sheet behind is the exact area ∫ₐᵇ f dx = F(b) − F(a) (e.g. ∫ sin x dx = −cos x). Strips below the axis (red) count as negative. Raise n: the error of left/right sums shrinks like 1/n, the midpoint&apos;s like 1/n².</p>
        <p className="mt-2"><b>Try.</b> 1/x is only defined for x &gt; 0, so its interval and x₀ must be positive; its area from 1 to b is ln b. The vertical scale adjusts to fit the curve.</p>
      </>}
    />
  );
}
