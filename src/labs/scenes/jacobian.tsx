"use client";
import { Line } from "@react-three/drei";
import { useMemo, useRef } from "react";
import type * as THREE from "three";
import { MAPS, cellImage, fmt, jacobian, type MapId, type XY } from "../sim/mathi";
import { Tick } from "../Stage";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { MATHI_SPECS } from "../meta/mathi.specs";
import { C, Dot, GeoMesh, Grid, P3, Segs, fanGeo, type V3 } from "./mathi-kit";

const CX = 3.1;
/** Lines u = const and v = const (every 0.5) around the cell centre, as flat segment pairs, pushed through f then toS. */
function gridLines(f: (u: number, v: number) => XY, cu: XY, W: number, toS: (p: XY) => V3 | null): number[] {
  const out: number[] = [], u0 = Math.floor(cu[0] - W), v0 = Math.floor(cu[1] - W), span = 2 * W + 1;
  for (const horizontal of [true, false]) for (let k = 0; k <= 2 * span; k++) {
    const c0 = (horizontal ? v0 : u0) + k * 0.5;
    let prev: V3 | null = null;
    for (let i = 0; i <= 50; i++) {
      const s = (horizontal ? u0 : v0) + (i * span) / 50;
      const q = toS(horizontal ? f(s, c0) : f(c0, s));
      if (prev && q) out.push(...prev, ...q);
      prev = q;
    }
  }
  return out;
}

export default function JacobianLab() {
  const [P, set, reset] = useLabParams(MATHI_SPECS.jacobian);
  const { map, u0, v0, du, dv } = P;
  const M = MAPS[map];
  const r = jacobian(map, u0, v0, du, dv);
  const img = cellImage(map, u0, v0, du, dv);
  const cu: XY = [u0 + du / 2, v0 + dv / 2], cxy = r.centre;
  const diam = Math.max(...img.map((p) => Math.hypot(p[0] - cxy[0], p[1] - cxy[1])), 0.05);
  const W = Math.max(diam * 3, 0.9), scR = 2.6 / W, Wl = 1.6, scL = 2.6 / Wl;
  const toL = (p: XY): V3 | null => { const x = (p[0] - cu[0]) * scL, y = (p[1] - cu[1]) * scL; return Math.abs(x) <= 2.8 && Math.abs(y) <= 2.8 ? P3(x - CX, y, 0.01) : null; };
  const toR = (p: XY): V3 | null => { const x = (p[0] - cxy[0]) * scR, y = (p[1] - cxy[1]) * scR; return Number.isFinite(x) && Number.isFinite(y) && Math.abs(x) <= 2.8 && Math.abs(y) <= 2.8 ? P3(x + CX, y, 0.01) : null; };
  const gl = useMemo(() => gridLines((u, v) => [u, v], cu, Wl, toL), [u0, v0, du, dv]); // eslint-disable-line react-hooks/exhaustive-deps
  const grR = useMemo(() => gridLines((u, v) => M.xy(u, v), cu, Wl, toR), [map, u0, v0, du, dv, scR]); // eslint-disable-line react-hooks/exhaustive-deps
  const cellL: V3[] = [[u0, v0], [u0 + du, v0], [u0 + du, v0 + dv], [u0, v0 + dv]].map(([u, v]) => P3((u - cu[0]) * scL - CX, (v - cu[1]) * scL, 0.04));
  const cellR: V3[] = img.map((p) => P3((p[0] - cxy[0]) * scR + CX, (p[1] - cxy[1]) * scR, 0.04));
  const fillL = useMemo(() => fanGeo(cellL), [u0, v0, du, dv]); // eslint-disable-line react-hooks/exhaustive-deps
  const fillR = useMemo(() => fanGeo(cellR), [map, u0, v0, du, dv, scR]); // eslint-disable-line react-hooks/exhaustive-deps
  const perimL: V3[] = useMemo(() => {
    const k = 12, o: V3[] = [];
    const q = (u: number, v: number) => P3((u - cu[0]) * scL - CX, (v - cu[1]) * scL, 0.1);
    for (let i = 0; i < k; i++) o.push(q(u0 + (du * i) / k, v0));
    for (let i = 0; i < k; i++) o.push(q(u0 + du, v0 + (dv * i) / k));
    for (let i = 0; i < k; i++) o.push(q(u0 + du - (du * i) / k, v0 + dv));
    for (let i = 0; i < k; i++) o.push(q(u0, v0 + dv - (dv * i) / k));
    return o;
  }, [u0, v0, du, dv]); // eslint-disable-line react-hooks/exhaustive-deps
  const b1 = useRef<THREE.Group>(null), b2 = useRef<THREE.Group>(null), t = useRef(0);
  const tick = (dt: number) => {
    t.current = (t.current + Math.min(dt, 0.05) * 0.2) % 1;
    const i = Math.floor(t.current * perimL.length);
    b1.current?.position.set(perimL[i][0], perimL[i][1], perimL[i][2]);
    b2.current?.position.set(cellR[i][0], cellR[i][1] + 0.06, cellR[i][2]);
  };
  return (
    <LabFrame
      label="Two planes side by side: a small rectangle in the uv-plane and its curved image in the xy-plane, with the grid lines u = const and v = const bent by the map"
      camera={[0, 6.4, 5.6]}
      onReset={reset}
      scene={() => (<group>
        <Tick fn={tick} />
        <group position={[-CX, -0.01, 0]}><Grid size={5.2} /></group>
        <group position={[CX, -0.01, 0]}><Grid size={5.2} /></group>
        <Segs pts={gl} c={C.light} />
        <Segs pts={grR} c={C.light} />
        <GeoMesh geo={fillL} vc={false} color={C.blue} o={0.7} />
        <GeoMesh geo={fillR} vc={false} color={C.orange} o={0.7} />
        <Line points={[...cellL, cellL[0]]} color={C.blue} lineWidth={3} />
        <Line points={[...cellR, cellR[0]]} color={C.orange} lineWidth={3} />
        <Line points={[P3(-CX + 0.9, 0, 0.3), P3(CX - 0.9, 0, 0.3)]} color={C.gold} lineWidth={3} dashed dashSize={0.2} gapSize={0.12} />
        <group ref={b1}><Dot p={[0, 0, 0]} r={0.09} c={C.green} /></group>
        <group ref={b2}><Dot p={[0, 0, 0]} r={0.09} c={C.green} /></group>
      </group>)}
      readouts={[
        ["Jacobian J = ∂(x, y)/∂(u, v)", fmt(r.J, 4)],
        ["|J| du dv (predicted area)", fmt(r.predicted, 5)],
        ["Image area (measured)", fmt(r.xyArea, 5)],
        ["Cell centre (x, y)", `${fmt(r.centre[0], 3)}, ${fmt(r.centre[1], 3)}`],
        ["J · J′ (J′ = ∂(u, v)/∂(x, y))", fmt(r.product, 4)],
        ["Cell area du dv", fmt(r.uvArea, 5)],
      ]}
      controls={<>
        <Slider label="Cell corner u₀" value={u0} min={0.5} max={3} step={0.05} digits={2} onChange={(v) => set("u0", v)} />
        <Slider label="Cell corner v₀" value={v0} min={0.2} max={3} step={0.05} digits={2} onChange={(v) => set("v0", v)} />
        <Pick label="Change of variables" value={map} options={(Object.keys(MAPS) as MapId[]).map((k) => ({ id: k, label: `${MAPS[k].label}: ${MAPS[k].eq}` }))} onChange={(v) => set("map", v)} />
        <Slider label="Cell width du" value={du} min={0.05} max={1} step={0.05} digits={2} onChange={(v) => set("du", v)} />
        <Slider label="Cell height dv" value={dv} min={0.05} max={1} step={0.05} digits={2} onChange={(v) => set("dv", v)} />
      </>}
      note={<>
        <p><b>Jacobian and change of variables.</b> A map x = x(u, v), y = y(u, v) bends the square grid of the uv-plane (left, blue cell) into curves in the xy-plane (right, orange). A tiny cell of area du dv becomes a patch of area |J| du dv, where J = ∂(x, y)/∂(u, v) = x<sub>u</sub>y<sub>v</sub> − x<sub>v</sub>y<sub>u</sub>. That is why dx dy = |J| du dv in a double integral, and J · J′ = 1 where J′ = ∂(u, v)/∂(x, y). Both views are re-centred on the cell, so each is drawn at its own scale.</p>
        <p className="mt-2"><b>Try.</b> Polar: J = u, so the same cell grows as u increases (area is u du dv, the familiar r dr dθ). Linear x = u + v, y = u − v: J = −2 everywhere and the image is an exact parallelogram. For x = u, y = uv (the usual exam substitution) J = u. Shrink the cell: measured and predicted areas agree better and better for curved maps.</p>
      </>}
    />
  );
}
