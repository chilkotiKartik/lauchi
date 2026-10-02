"use client";
import { Line } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { CURVES, fmt, type CurveId, type XY } from "../sim/mathi";
import { pieces } from "../kit";
import { Tick } from "../Stage";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { MATHI_SPECS } from "../meta/mathi.specs";
import { C, Dot, GeoMesh, Grid, P3, fanGeo, type V3 } from "./mathi-kit";

const S = 0.82, H = 0.55;
const TANG: Record<CurveId, XY[]> = { strophoid: [[1, 1], [1, -1]], folium: [[1, 0], [0, 1]], cissoid: [[1, 0]], astroid: [] };
/** A vertical wall under the curve: for each drawn piece, a strip from the floor up to H. */
function wallGeo(ps: V3[][]): THREE.BufferGeometry {
  const pos: number[] = [], idx: number[] = [];
  for (const pc of ps) {
    const base = pos.length / 3;
    pc.forEach((p) => { pos.push(p[0], 0, p[2], p[0], H, p[2]); });
    for (let i = 0; i < pc.length - 1; i++) { const a = base + 2 * i; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  }
  const g = new THREE.BufferGeometry();
  g.setIndex(idx); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}

export default function CurveTraceLab() {
  const [P, set, reset] = useLabParams(MATHI_SPECS.curvetrace);
  const { curve, a, show } = P;
  const C0 = CURVES[curve];
  const raw = C0.pts(a, 4.8);
  const upto = Math.max(2, Math.ceil(show * raw.length));
  const drawn = raw.slice(0, upto);
  const parts = pieces(drawn.map((p) => (p ? P3(p[0] * S, p[1] * S, 0.02) : null)));
  const wall = useMemo(() => wallGeo(parts), [curve, a, show]); // eslint-disable-line react-hooks/exhaustive-deps
  const loop = C0.loop(a);
  const fill = useMemo(() => (loop && show > 0.99 ? fanGeo(loop.map((p) => P3(p[0] * S, p[1] * S, 0.01))) : null), [curve, a, show]); // eslint-disable-line react-hooks/exhaustive-deps
  const trace: V3[] = parts.flat();
  const ball = useRef<THREE.Group>(null), t = useRef(0);
  const tick = (dt: number) => {
    t.current += Math.min(dt, 0.05) * 0.25;
    if (!trace.length || !ball.current) return;
    const p = trace[Math.floor((t.current % 1) * (trace.length - 1))];
    ball.current.position.set(p[0], p[1] + 0.06, p[2]);
  };
  const asy = C0.asymX ? C0.asymX(a).map((p) => P3(p[0] * S, p[1] * S, 0.03)) : null;
  return (
    <LabFrame
      label="A classic curve traced on the floor with a translucent wall under it, its asymptote, tangents at the origin and a moving tracer point"
      camera={[0, 6.6, 5.2]}
      onReset={reset}
      scene={() => (<group>
        <Tick fn={tick} />
        <Grid size={10} y={0} />
        <Line points={[[-4.6, 0.01, 0], [4.6, 0.01, 0]]} color={C.light} lineWidth={1.5} />
        <Line points={[[0, 0.01, 4.6], [0, 0.01, -4.6]]} color={C.light} lineWidth={1.5} />
        {fill && <GeoMesh geo={fill} vc={false} color={C.purple} o={0.45} />}
        <GeoMesh geo={wall} vc={false} color={C.blue} o={0.28} />
        {parts.map((pc, i) => <Line key={i} points={pc} color={C.gold} lineWidth={4} />)}
        {asy && <Line points={asy} color={C.red} lineWidth={2} dashed dashSize={0.18} gapSize={0.1} />}
        {TANG[curve].map(([dx, dy], i) => <Line key={i} points={[P3(-4.6 * dx, -4.6 * dy, 0.03), P3(4.6 * dx, 4.6 * dy, 0.03)]} color={C.green} lineWidth={1.6} dashed dashSize={0.14} gapSize={0.1} />)}
        <Dot p={[0, 0.03, 0]} r={0.08} c="#ffffff" />
        <group ref={ball}><Dot p={[0, 0, 0]} r={0.12} c={C.orange} glow={1} /></group>
      </group>)}
      readouts={[
        ["Curve", C0.eq],
        ["Symmetry", C0.sym],
        ["Tangents at the origin", C0.tangents],
        ["Asymptote", C0.asym(a)],
        [C0.areaLabel, fmt(C0.area(a), 4)],
        ["Scale a", fmt(a, 2)],
      ]}
      controls={<>
        <Slider label="Scale a" value={a} min={0.5} max={2.5} step={0.05} digits={2} onChange={(v) => set("a", v)} />
        <Pick label="Curve" value={curve} options={(Object.keys(CURVES) as CurveId[]).map((k) => ({ id: k, label: `${CURVES[k].label}: ${CURVES[k].eq}` }))} onChange={(v) => set("curve", v)} />
        <Slider label="Tracing progress" value={show} min={0.05} max={1} step={0.05} digits={2} onChange={(v) => set("show", v)} />
      </>}
      note={<>
        <p><b>Curve tracing checklist.</b> (1) Symmetry: x → −x, y → −y, or x ↔ y. (2) Does it pass through the origin, and what are the tangents there (equate the lowest-degree terms to zero)? (3) Intercepts with the axes. (4) Asymptotes (red dashed). (5) Region of existence — where y² or x² would be negative the curve is absent. (6) Loops and areas. Green dashed lines are the tangents at the origin; the purple patch is the loop.</p>
        <p className="mt-2"><b>Try.</b> PYQ: trace y²(a − x) = x²(a + x). It is symmetric about the x-axis, has a node at the origin with tangents y = ±x, the asymptote x = a, and a loop of area a²(2 − π/2) for −a ≤ x ≤ 0. Slide the tracing progress from 0.05 to 1 to watch the branches appear in order. Also try the folium x³ + y³ = 3axy (loop area 3a²/2, asymptote x + y + a = 0).</p>
      </>}
    />
  );
}
