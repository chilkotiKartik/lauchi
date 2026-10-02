"use client";
import { Line } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { LFIELDS, fmt, lineWork, type LFieldId } from "../sim/mathi";
import { Tick } from "../Stage";
import { LabFrame, Check, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { MATHI_SPECS } from "../meta/mathi.specs";
import { mix } from "../kit2";
import { C, Dot, GeoMesh, Glyphs, Grid, P3, fanGeo, type Glyph, type V3 } from "./mathi-kit";

const SC = 1.7, N = 60, H = 0.45;
const yAt = (x: number, bx: number, by: number, k: number) => by * Math.pow(x / bx, k);
function curtainGeo(f: LFieldId, bx: number, by: number, k: number): THREE.BufferGeometry {
  const F = LFIELDS[f].F, pos = new Float32Array((N + 1) * 6), col = new Float32Array((N + 1) * 6), idx: number[] = [], c = new THREE.Color();
  for (let i = 0; i <= N; i++) {
    const x = Math.max(1e-6, (bx * i) / N), y = yAt(x, bx, by, k), dy = (by * k * Math.pow(x / bx, k - 1)) / bx, v = F(x, y), len = Math.hypot(1, dy);
    const h = Math.max(-1.6, Math.min(1.6, (H * (v[0] + v[1] * dy)) / len));
    const p = P3(x * SC, y * SC, 0.02), q = P3(x * SC, y * SC, 0.02 + h);
    pos.set([p[0], p[1], p[2], q[0], q[1], q[2]], i * 6);
    c.set(h >= 0 ? C.green : C.red);
    col.set([c.r, c.g, c.b, c.r, c.g, c.b], i * 6);
  }
  for (let i = 0; i < N; i++) idx.push(2 * i, 2 * i + 2, 2 * i + 1, 2 * i + 1, 2 * i + 2, 2 * i + 3);
  const g = new THREE.BufferGeometry();
  g.setIndex(idx); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  return g;
}

export default function LineIntegralLab() {
  const [P, set, reset] = useLabParams(MATHI_SPECS.lineintegral);
  const { field, bx, by, k, loop } = P;
  const F = LFIELDS[field], w = lineWork(field, bx, by, k);
  const curtain = useMemo(() => curtainGeo(field, bx, by, k), [field, bx, by, k]);
  const arrows: Glyph[] = [];
  for (let i = 0; i <= 7; i++) for (let j = 0; j <= 7; j++) {
    const x = (i * 2.4) / 7, y = (j * 2.4) / 7, v = F.F(x, y), m = Math.hypot(v[0], v[1]);
    if (m < 1e-9) continue;
    const len = 0.12 + 0.3 * (m / (m + 1)), d = P3(v[0], v[1], 0);
    arrows.push({ p: P3(x * SC, y * SC, 0.03), d: [(d[0] / m) * len, 0, (d[2] / m) * len], c: mix(C.blue, C.orange, m / (m + 2)), w: 0.07 });
  }
  const path: V3[] = Array.from({ length: N + 1 }, (_, i) => { const x = (bx * i) / N; return P3(x * SC, yAt(x, bx, by, k) * SC, 0.06); });
  const line: V3[] = [P3(0, 0, 0.06), P3(bx * SC, by * SC, 0.06)];
  const fill = useMemo(() => {
    if (!loop || k === 1) return null;
    const pts = Array.from({ length: N + 1 }, (_, i) => { const x = (bx * i) / N; return P3(x * SC, yAt(x, bx, by, k) * SC, 0.04); });
    return fanGeo(pts.concat([P3(0, 0, 0.04)]));
  }, [loop, bx, by, k]);
  const ball = useRef<THREE.Group>(null), t = useRef(0);
  const tick = (dt: number) => {
    t.current = (t.current + Math.min(dt, 0.05) * 0.22) % 1;
    const i = Math.floor(t.current * N), p = path[i];
    ball.current?.position.set(p[0], p[1] + 0.05, p[2]);
  };
  return (
    <LabFrame
      label="A vector field drawn as arrows on a plane, a path from the origin to a point B, and a coloured curtain whose height is the force component along the path"
      camera={[0, 5.6, 5.6]}
      onReset={reset}
      scene={() => (<group position={[-2, 0, 2]}>
        <Tick fn={tick} />
        <group position={[2, -0.01, -2]}><Grid size={8} /></group>
        <Glyphs items={arrows} cap={70} />
        {fill && <GeoMesh geo={fill} vc={false} color={C.purple} o={0.4} />}
        <GeoMesh geo={curtain} o={0.55} />
        <Line points={line} color={C.purple} lineWidth={3} dashed dashSize={0.12} gapSize={0.08} />
        <Line points={path} color={C.gold} lineWidth={5} />
        <Dot p={P3(0, 0, 0.06)} r={0.1} c="#ffffff" />
        <Dot p={P3(bx * SC, by * SC, 0.06)} r={0.13} c={C.green} />
        <group ref={ball}><Dot p={[0, 0, 0]} r={0.1} c={C.orange} glow={1} /></group>
      </group>)}
      readouts={[
        ["Work along the path ∫F·dr", fmt(w.path, 5)],
        ["Work along the straight line", fmt(w.line, 5)],
        ["Difference (path − line)", fmt(w.diff, 5)],
        ["Potential φ(B) − φ(A)", w.potential === null ? "none: F is not a gradient" : fmt(w.potential, 5)],
        ["Round trip: out by the path, back by the line", fmt(w.loop, 5)],
        ["Field", F.label],
      ]}
      controls={<>
        <Slider label="End point B, x" value={bx} min={0.5} max={2} step={0.05} digits={2} onChange={(v) => set("bx", v)} />
        <Slider label="End point B, y" value={by} min={0.5} max={2} step={0.05} digits={2} onChange={(v) => set("by", v)} />
        <Pick label="Force field F" value={field} options={(Object.keys(LFIELDS) as LFieldId[]).map((kk) => ({ id: kk, label: LFIELDS[kk].label }))} onChange={(v) => set("field", v)} />
        <Slider label="Path exponent k (y = By (x/Bx)^k)" value={k} min={1} max={3} step={0.1} digits={1} onChange={(v) => set("k", v)} />
        <Check label="Shade the loop between path and straight line" checked={loop} onChange={(v) => set("loop", v)} />
      </>}
      note={<>
        <p><b>Line integral and work.</b> W = ∫<sub>C</sub> F·dr = ∫(F₁ dx + F₂ dy). The curtain above the gold path has height equal to the component of F along the path (green where F helps, red where it opposes); its area is the work. A field is <i>conservative</i> if curl F = 0, then F = ∇φ, the work depends only on the end points: W = φ(B) − φ(A), and the work round any closed loop is 0.</p>
        <p className="mt-2"><b>Try.</b> With F = (2xy, x²) = ∇(x²y), changing the path exponent k leaves the work at x²y|<sub>B</sub> (1 for B = (1, 1)) and the round trip is 0. For F = (−y, x) the straight line y = x gives 0 but the parabola y = x² gives 1/3, and the round trip equals ∬(curl F) dA = 2 × the enclosed area (Green&apos;s theorem). Tick the shading box to see the enclosed region.</p>
      </>}
    />
  );
}
