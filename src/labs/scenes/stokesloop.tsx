"use client";
import { Line } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { SFIELDS, curlAt, fmt, stokes, type SFieldId, type V3 as VV } from "../sim/mathi";
import { Tick } from "../Stage";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { MATHI_SPECS } from "../meta/mathi.specs";
import { C, Dot, GeoMesh, Glyphs, Grid, P3, fanGeo, type Glyph, type V3 } from "./mathi-kit";

const col = (v: number) => (Math.abs(v) < 1e-9 ? C.light : v > 0 ? C.green : C.red);

export default function StokesLoopLab() {
  const [P, set, reset] = useLabParams(MATHI_SPECS.stokesloop);
  const { field, a, b, tilt } = P;
  const r = stokes(field, a, b, tilt);
  const s = 2.3 / Math.max(a, b, 1), t = (tilt * Math.PI) / 180, cs = Math.cos(t), sn = Math.sin(t);
  const pt = (x: number, sv: number, lift = 0): V3 => { const q = P3(x * s, sv * cs * s, sv * sn * s); return [q[0] + 0 * lift, q[1] + lift, q[2]]; };
  const corners: V3[] = [pt(-a, 0), pt(a, 0), pt(a, b), pt(-a, b)];
  const patch = useMemo(() => fanGeo([P3(-a * s, 0, 0), P3(a * s, 0, 0), P3(a * s, b * cs * s, b * sn * s), P3(-a * s, b * cs * s, b * sn * s)]), [a, b, tilt]); // eslint-disable-line react-hooks/exhaustive-deps
  const loopPts: V3[] = [];
  const seg = (p: V3, q: V3, n = 12) => { for (let i = 0; i < n; i++) loopPts.push([p[0] + ((q[0] - p[0]) * i) / n, p[1] + ((q[1] - p[1]) * i) / n, p[2] + ((q[2] - p[2]) * i) / n]); };
  seg(corners[0], corners[1]); seg(corners[1], corners[2]); seg(corners[2], corners[3]); seg(corners[3], corners[0]);
  const edges: { p: V3; q: V3; w: number }[] = [
    { p: corners[0], q: corners[1], w: r.edges.bottom }, { p: corners[1], q: corners[2], w: r.edges.right },
    { p: corners[2], q: corners[3], w: r.edges.top }, { p: corners[3], q: corners[0], w: r.edges.left },
  ];
  const n3 = P3(r.normal[0], r.normal[1], r.normal[2]);
  const glyphs: Glyph[] = [];
  edges.forEach((e) => { const m: V3 = [(e.p[0] + e.q[0]) / 2, (e.p[1] + e.q[1]) / 2, (e.p[2] + e.q[2]) / 2], d: V3 = [e.q[0] - e.p[0], e.q[1] - e.p[1], e.q[2] - e.p[2]], L = Math.hypot(...d) || 1; glyphs.push({ p: [m[0] - (d[0] / L) * 0.2, m[1] - (d[1] / L) * 0.2, m[2] - (d[2] / L) * 0.2], d: [(d[0] / L) * 0.4, (d[1] / L) * 0.4, (d[2] / L) * 0.4], c: col(e.w), w: 0.16 }); });
  for (let i = 0; i < 5; i++) for (let j = 0; j < 3; j++) {
    const x = -a + (2 * a * (i + 0.5)) / 5, sv = (b * (j + 0.5)) / 3, q: VV = [x, sv * cs, sv * sn], cu = curlAt(field, q), m = Math.hypot(...cu);
    if (m < 1e-9) continue;
    const d = P3(cu[0], cu[1], cu[2]), len = 0.25 + 0.5 * Math.tanh(m / 4), dn = cu[0] * r.normal[0] + cu[1] * r.normal[1] + cu[2] * r.normal[2];
    glyphs.push({ p: pt(x, sv, 0.02), d: [(d[0] / m) * len, (d[1] / m) * len, (d[2] / m) * len], c: dn >= 0 ? C.red : C.blue, w: 0.12 });
  }
  glyphs.push({ p: pt(0, b / 2, 0.02), d: [n3[0] * 0.9, n3[1] * 0.9, n3[2] * 0.9], c: C.gold, w: 0.14 });
  const ball = useRef<THREE.Group>(null), tm = useRef(0);
  const tick = (dt: number) => { tm.current = (tm.current + Math.min(dt, 0.05) * 0.2) % 1; const p = loopPts[Math.floor(tm.current * loopPts.length)]; ball.current?.position.set(p[0], p[1], p[2]); };
  return (
    <LabFrame
      label="A tilted rectangle with its boundary loop coloured by the work done on each edge and cones showing the curl of the field over the surface"
      camera={[3.8, 3.8, 6.4]}
      onReset={reset}
      scene={() => (<group position={[0, -0.6, 0.6]}>
        <Tick fn={tick} />
        <Grid size={8} y={0} />
        <GeoMesh geo={patch} vc={false} color={C.purple} o={0.32} />
        {edges.map((e, i) => <Line key={i} points={[e.p, e.q]} color={col(e.w)} lineWidth={5} />)}
        <Glyphs items={glyphs} cap={24} />
        {corners.map((p, i) => <Dot key={i} p={p} r={0.07} c="#ffffff" />)}
        <group ref={ball}><Dot p={[0, 0, 0]} r={0.12} c={C.orange} glow={1} /></group>
      </group>)}
      readouts={[
        ["Circulation ∮F·dr", fmt(r.circulation, 5)],
        ["Surface integral ∬(∇×F)·n̂ dS", fmt(r.flux, 5)],
        ["Difference", fmt(r.diff, 8)],
        ["Unit normal n̂", `(${fmt(r.normal[0], 3)}, ${fmt(r.normal[1], 3)}, ${fmt(r.normal[2], 3)})`],
        ["Work on bottom | right edge", `${fmt(r.edges.bottom, 3)} | ${fmt(r.edges.right, 3)}`],
        ["Work on top | left edge", `${fmt(r.edges.top, 3)} | ${fmt(r.edges.left, 3)}`],
      ]}
      controls={<>
        <Slider label="Half-width a (x from −a to a)" value={a} min={0.5} max={3} step={0.1} digits={1} onChange={(v) => set("a", v)} />
        <Slider label="Height b (y from 0 to b)" value={b} min={0.5} max={3} step={0.1} digits={1} onChange={(v) => set("b", v)} />
        <Slider label="Tilt of the plane about the x-axis" value={tilt} min={0} max={80} step={1} digits={0} unit="°" onChange={(v) => set("tilt", v)} />
        <Pick label="Vector field F" value={field} options={(Object.keys(SFIELDS) as SFieldId[]).map((k) => ({ id: k, label: SFIELDS[k].label }))} onChange={(v) => set("field", v)} />
      </>}
      note={<>
        <p><b>Stokes&apos; theorem.</b> ∮<sub>C</sub> F·dr = ∬<sub>S</sub> (∇×F)·n̂ dS: the circulation round the boundary equals the flux of the curl through any surface it bounds. The direction round the loop (anticlockwise seen from the tip of n̂, the gold cone) fixes the sign of n̂. Edge colours show the sign of the work on each edge (green positive, red negative); curl cones are red where ∇×F points along n̂ and blue where it points against it.</p>
        <p className="mt-2"><b>Try.</b> PYQ: F = (x² + y²) i − 2xy j round the rectangle x = ±a, y = 0 to b. With a = 1, b = 2 and no tilt, ∇×F = −4y k, so both sides equal −4ab² = −16. Tilt the plane: the circulation changes (the same loop is now in 3D) but still matches the surface integral. A gradient field such as ∇(xyz) has curl 0 and zero circulation for every tilt.</p>
      </>}
    />
  );
}
