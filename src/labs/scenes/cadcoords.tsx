"use client";
import { polarPath } from "../sim/gfx";
import { Ball, C, Panel, Poly, type V3 } from "../kit";
import { LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { GFX_SPECS } from "../meta/gfx.specs";

const f = (v: number) => (Math.abs(v) < 5e-7 ? 0 : v).toFixed(1);
export default function CadCoordsLab() {
  const [P, set, reset] = useLabParams(GFX_SPECS.cadcoords);
  const o = polarPath([[P.l1, P.a1], [P.l2, P.a2], [P.l3, P.a3]]);
  const ext = Math.max(1, ...o.pts.map((p) => Math.max(Math.abs(p[0]), Math.abs(p[1])))), k = Math.min(0.04, 1.6 / ext);
  const q: V3[] = o.pts.map((p) => [p[0] * k, p[1] * k, 0.05]);
  const grid: V3[][] = [];
  for (let i = -3; i <= 3; i++) { grid.push([[i * 0.6, -1.9, 0], [i * 0.6, 1.9, 0]]); grid.push([[-3.6, i * 0.6, 0], [3.6, i * 0.6, 0]]); }
  return (
    <LabFrame
      label="A flat drawing board with a grid, three blue lines entered by length and angle from the origin, numbered blue points, and an orange dashed line showing the closing segment back to the start"
      camera={[0, 0, 6.2]}
      animated={false}
      onReset={reset}
      scene={() => (
        <group>
          <Panel p={[0, 0, -0.1]} w={7.6} h={4.2} />
          {grid.map((g, i) => <Poly key={i} pts={g} c={i % 2 ? "#3a5866" : "#3a5866"} w={0.8} />)}
          <Poly pts={[[-3.6, 0, 0.01], [3.6, 0, 0.01]]} c={C.red} w={1.5} />
          <Poly pts={[[0, -1.9, 0.01], [0, 1.9, 0.01]]} c={C.green} w={1.5} />
          <Poly pts={q} c={C.blue} w={4} />
          <Poly pts={[q[q.length - 1], q[0]]} c={C.orange} w={2.5} />
          {q.map((p, i) => <Ball key={i} p={p} r={0.07} c={i === 0 ? C.gold : C.white} glow={0.5} />)}
        </group>
      )}
      readouts={[
        ["Point 2 (after @L1<A1)", `(${f(o.pts[1][0])}, ${f(o.pts[1][1])})`],
        ["Point 3", `(${f(o.pts[2][0])}, ${f(o.pts[2][1])})`],
        ["Point 4", `(${f(o.pts[3][0])}, ${f(o.pts[3][1])})`],
        ["Close: distance and angle back", `${o.back.toFixed(1)} < ${o.closeAngle.toFixed(1)}°`],
        ["Area of the closed shape", `${o.area.toFixed(0)} mm²`],
        ["Perimeter when closed", `${o.perimeter.toFixed(1)} mm`],
      ]}
      controls={<>
        <Slider label="Line 1 length" value={P.l1} min={10} max={200} step={5} digits={0} unit=" mm" onChange={(x) => set("l1", x)} />
        <Slider label="Line 1 angle" value={P.a1} min={0} max={360} step={5} digits={0} unit="°" onChange={(x) => set("a1", x)} />
        <Slider label="Line 2 length" value={P.l2} min={10} max={200} step={5} digits={0} unit=" mm" onChange={(x) => set("l2", x)} />
        <Slider label="Line 2 angle" value={P.a2} min={0} max={360} step={5} digits={0} unit="°" onChange={(x) => set("a2", x)} />
        <Slider label="Line 3 length" value={P.l3} min={10} max={200} step={5} digits={0} unit=" mm" onChange={(x) => set("l3", x)} />
        <Slider label="Line 3 angle" value={P.a3} min={0} max={360} step={5} digits={0} unit="°" onChange={(x) => set("a3", x)} />
      </>}
      note={<p>In a CAD program you can type a point in three ways: absolute (x,y) from the origin, relative (@dx,dy) from the last point, or relative polar (@length&lt;angle), where the angle is measured anticlockwise from the +x axis (red). This lab draws three polar lines from the origin (gold point); each new point is the last one plus L·cos A in x and L·sin A in y. The orange line is the last segment the Close option would add, its length and angle are shown. The area uses the shoelace formula on the four corners. The drawing scales itself to fit the board; it shows the geometry, not the toolbar or layers of a real CAD package.</p>}
    />
  );
}
