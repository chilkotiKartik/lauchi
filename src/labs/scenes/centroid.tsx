"use client";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { LAMINAE, RHOS, fmt, lamina, type LaminaId, type RhoId } from "../sim/mathi";
import { Tick } from "../Stage";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { MATHI_SPECS } from "../meta/mathi.specs";
import { mix } from "../kit2";
import { C, Dot, Grid, Instances, P3, type Inst } from "./mathi-kit";

const TH = 0.14;
function plateGeo(poly: [number, number][]) {
  const sh = new THREE.Shape(poly.map(([x, y]) => new THREE.Vector2(x, y)));
  const g = new THREE.ExtrudeGeometry(sh, { depth: TH, bevelEnabled: false });
  g.rotateX(-Math.PI / 2);
  return g;
}

export default function CentroidLab() {
  const [P, set, reset] = useLabParams(MATHI_SPECS.centroid);
  const { shape, rho, px, py } = P;
  const L = LAMINAE[shape], rf = RHOS[rho].f;
  const r = lamina(shape, rho, px, py);
  const geo = useMemo(() => plateGeo(L.poly), [shape]); // eslint-disable-line react-hooks/exhaustive-deps
  const cells: Inst[] = [];
  const x0 = L.x[0], x1 = L.x[1], N = 12, dx = (x1 - x0) / N;
  const ytop = Math.max(...L.poly.map((p) => p[1])), dy = ytop / N;
  let rmax = 1e-9;
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) { const cx = x0 + (i + 0.5) * dx, cy = (j + 0.5) * dy; if (cy >= L.lo(cx) && cy <= L.hi(cx)) rmax = Math.max(rmax, rf(cx, cy)); }
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
    const cx = x0 + (i + 0.5) * dx, cy = (j + 0.5) * dy;
    if (cy < L.lo(cx) || cy > L.hi(cx)) continue;
    const v = rf(cx, cy), h = 0.12 + 0.55 * (v / rmax), p = P3(cx - px, cy - py, TH);
    cells.push({ p: [p[0], p[1] + h / 2, p[2]], s: [dx * 0.86, h, dy * 0.86], c: mix(C.blue, C.red, v / rmax) });
  }
  const plate = useRef<THREE.Group>(null), cur = useRef<[number, number]>([0, 0]);
  const tx = Math.max(-0.4, Math.min(0.4, 0.28 * (r.cx - px))), tz = Math.max(-0.4, Math.min(0.4, 0.28 * (r.cy - py)));
  const tick = (dt: number) => {
    const k = Math.min(1, Math.min(dt, 0.05) * 5);
    cur.current = [cur.current[0] + (-tz - cur.current[0]) * k, cur.current[1] + (-tx - cur.current[1]) * k];
    plate.current?.rotation.set(cur.current[0], 0, cur.current[1]);
  };
  const c3 = P3(r.cx - px, r.cy - py, TH);
  const balanced = r.off < 0.05;
  return (
    <LabFrame
      label="A flat plate of varying density balanced on a movable pivot: it tips towards its centre of mass unless the pivot is exactly below it"
      camera={[2.6, 4.2, 6.2]}
      onReset={reset}
      scene={() => (<group position={[-1.2, 0, 1.4]}>
        <Tick fn={tick} />
        <Grid size={8} y={-0.62} />
        <group position={P3(px, py, 0)}>
          <group ref={plate}>
            <mesh geometry={geo} position={P3(-px, -py, 0)}><meshStandardMaterial color={C.grey} roughness={0.6} /></mesh>
            <Instances items={cells} cap={160} />
            <Dot p={[c3[0], c3[1] + 0.95, c3[2]]} r={0.14} c={C.gold} glow={1} />
            <mesh position={[c3[0], c3[1] + 0.45, c3[2]]}><cylinderGeometry args={[0.012, 0.012, 1, 6]} /><meshBasicMaterial color={C.gold} /></mesh>
          </group>
          <mesh position={[0, -0.32, 0]}><coneGeometry args={[0.28, 0.6, 20]} /><meshStandardMaterial color={C.red} emissive={C.red} emissiveIntensity={0.3} /></mesh>
        </group>
      </group>)}
      readouts={[
        ["Mass M = ∬ρ dA", fmt(r.M, 4)],
        ["x̄ = ∬xρ dA / M", fmt(r.cx, 4)],
        ["ȳ = ∬yρ dA / M", fmt(r.cy, 4)],
        ["Moment M(x̄ − pivot x)", fmt(r.momX, 4)],
        ["Moment M(ȳ − pivot y)", fmt(r.momY, 4)],
        ["Balance", balanced ? "balanced" : `tips towards the centre of mass (${fmt(r.off, 2)} away)`],
      ]}
      controls={<>
        <Slider label="Pivot x" value={px} min={-1} max={4} step={0.05} digits={2} onChange={(v) => set("px", v)} />
        <Slider label="Pivot y" value={py} min={-1} max={4.5} step={0.05} digits={2} onChange={(v) => set("py", v)} />
        <Pick label="Plate" value={shape} options={(Object.keys(LAMINAE) as LaminaId[]).map((k) => ({ id: k, label: LAMINAE[k].label }))} onChange={(v) => set("shape", v)} />
        <Pick label="Density" value={rho} options={(Object.keys(RHOS) as RhoId[]).map((k) => ({ id: k, label: RHOS[k].label }))} onChange={(v) => set("rho", v)} />
      </>}
      note={<>
        <p><b>Centre of mass of a lamina.</b> M = ∬ρ dA, x̄ = ∬xρ dA / M, ȳ = ∬yρ dA / M. For uniform density this is the centroid (x̄ = ∬x dA / A). The coloured columns show ρ at each point (taller and redder means denser). The gold ball marks (x̄, ȳ); the plate rests on a red pivot and tips towards the side that carries more moment, so it is level only when the pivot is directly below the centre of mass.</p>
        <p className="mt-2"><b>Try.</b> PYQ: the triangle (0,0), (2,0), (2,4) with ρ = 1 + x + y has M = 44/3 ≈ 14.667 and (x̄, ȳ) = (16/11, 18/11). With uniform density the centroid is (4/3, 4/3). The uniform semicircle of radius 2 has ȳ = 4r/3π ≈ 0.849. Type the centroid coordinates into the pivot sliders and the plate sits level.</p>
      </>}
    />
  );
}
