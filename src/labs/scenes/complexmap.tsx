"use client";
import { Line } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { MAPS, cderiv, cmap, cmapTo, crCheck, type C2, type MapId } from "../sim/mathsb";
import { Tick } from "../Stage";
import { LabFrame, Slider, Pick } from "../ui";
import { useLabParams } from "../params";
import { MATHSB_SPECS } from "../meta/mathsb.specs";

type V3 = [number, number, number];
const HALFZ = 2, PANEL = 2.5, ZS = PANEL / HALFZ, NS = 48;
/** Half-width of the w-plane window for each map (the image is clipped to it). */
const WIN: Record<MapId, number> = { sq: 4, inv: 3, exp: 5, sin: 4, mobius: 3 };
const GRID = [-2, -1.5, -1, -0.5, 0, 0.5, 1, 1.5, 2];

interface Segs { pts: V3[]; cols: V3[] }
/** Segments of the image of the straight line (xa, ya) → (xb, yb) under the map, dropping any piece outside the window. */
function addLine(out: Segs, id: MapId | null, xa: number, ya: number, xb: number, yb: number, rgb: V3, W: number) {
  const S = PANEL / W, tmp: C2 = [0, 0];
  let px = 0, py = 0, ok = false;
  for (let i = 0; i <= NS; i++) {
    const t = i / NS, x = xa + (xb - xa) * t, y = ya + (yb - ya) * t;
    let u = x * ZS, v = y * ZS, good = true;
    if (id) { cmapTo(id, x, y, tmp); good = Number.isFinite(tmp[0]) && Number.isFinite(tmp[1]) && Math.abs(tmp[0]) <= W && Math.abs(tmp[1]) <= W; u = tmp[0] * S; v = tmp[1] * S; }
    if (good && ok) { out.pts.push([px, py, 0], [u, v, 0]); out.cols.push(rgb, rgb); }
    px = u; py = v; ok = good;
  }
}
/** The grid lines x = const (cool colours) and y = const (warm colours), in the z-plane (id = null) or their images. */
function gridSegs(id: MapId | null): Segs {
  const out: Segs = { pts: [], cols: [] }, W = id ? WIN[id] : 1, c = new THREE.Color();
  GRID.forEach((g, i) => {
    c.setHSL(0.5 + 0.13 * (i / 8), 0.85, 0.58); const cool: V3 = [c.r, c.g, c.b];
    c.setHSL(0.0 + 0.13 * (i / 8), 0.9, 0.6); const warm: V3 = [c.r, c.g, c.b];
    addLine(out, id, g, -HALFZ, g, HALFZ, cool, W);
    addLine(out, id, -HALFZ, g, HALFZ, g, warm, W);
  });
  return out;
}
function highlight(id: MapId | null, px: number, py: number): { h: Segs; v: Segs } {
  const W = id ? WIN[id] : 1, h: Segs = { pts: [], cols: [] }, v: Segs = { pts: [], cols: [] };
  addLine(h, id, -HALFZ, py, HALFZ, py, [1, 0.78, 0.24], W);
  addLine(v, id, px, -HALFZ, px, HALFZ, [0.66, 0.44, 1], W);
  return { h, v };
}
function moveDots(zd: THREE.Object3D | null, wd: THREE.Object3D | null, id: MapId, py: number, u: number, tmp: C2) {
  const x = -HALFZ + 2 * HALFZ * u;
  zd?.position.set(x * ZS, py * ZS, 0.08);
  cmapTo(id, x, py, tmp);
  const W = WIN[id], ok = Number.isFinite(tmp[0]) && Math.abs(tmp[0]) <= W && Math.abs(tmp[1]) <= W;
  if (wd) { wd.visible = ok; if (ok) wd.position.set((tmp[0] * PANEL) / W, (tmp[1] * PANEL) / W, 0.08); }
}

function SegLine({ s, width }: { s: Segs; width: number }) {
  if (s.pts.length < 2) return null;
  return <Line segments points={s.pts} vertexColors={s.cols} lineWidth={width} />;
}
const frame: V3[] = [[-PANEL, -PANEL, 0], [PANEL, -PANEL, 0], [PANEL, PANEL, 0], [-PANEL, PANEL, 0], [-PANEL, -PANEL, 0]];
const axisX: V3[] = [[-PANEL, 0, 0.01], [PANEL, 0, 0.01]], axisY: V3[] = [[0, -PANEL, 0.01], [0, PANEL, 0.01]];

function Backdrop() {
  return (<>
    <mesh position={[0, 0, -0.04]}><planeGeometry args={[2 * PANEL + 0.2, 2 * PANEL + 0.2]} /><meshStandardMaterial color="#16262e" /></mesh>
    <Line points={frame} color="#5b6d77" lineWidth={1.5} />
    <Line points={axisX} color="#5b6d77" lineWidth={1} />
    <Line points={axisY} color="#5b6d77" lineWidth={1} />
  </>);
}

const cx = (re: number, im: number) => (Number.isFinite(re) && Number.isFinite(im) ? `${re.toFixed(3)} ${im < 0 ? "−" : "+"} ${Math.abs(im).toFixed(3)}i` : "∞ (pole)");

export default function ComplexMapLab() {
  const [P, set, reset] = useLabParams(MATHSB_SPECS.complexmap);
  const { id, px, py } = P;
  const zGrid = useMemo(() => gridSegs(null), []);
  const wGrid = useMemo(() => gridSegs(id), [id]);
  const zHi = useMemo(() => highlight(null, px, py), [px, py]);
  const wHi = useMemo(() => highlight(id, px, py), [id, px, py]);
  const zProbe = useRef<THREE.Mesh>(null), wProbe = useRef<THREE.Mesh>(null), zDot = useRef<THREE.Mesh>(null), wDot = useRef<THREE.Mesh>(null);
  const tmp = useRef<C2>([0, 0]), prog = useRef(0);
  const tick = (dt: number) => { prog.current = (prog.current + Math.min(dt, 0.05) * 0.18) % 1; moveDots(zDot.current, wDot.current, id, py, prog.current, tmp.current); };
  const w = cmap(id, px, py), d = cderiv(id, px, py), atPole = !Number.isFinite(w[0]), cr = atPole ? null : crCheck(id, px, py);
  const W = WIN[id], wOk = !atPole && Math.abs(w[0]) <= W && Math.abs(w[1]) <= W;
  const crTxt = (a: number, b: number, ok: boolean) => `${a.toFixed(3)} vs ${b.toFixed(3)} ${ok ? "✓" : "✗"}`;
  return (
    <LabFrame
      label="A grid in the complex z-plane on the left and its image under an analytic map on the right, coloured lines crossing at right angles in both"
      camera={[0, 0.3, 15]}
      onReset={reset}
      scene={() => (<group>
        <Tick fn={tick} />
        <group position={[-3.15, 0, 0]} rotation={[0, 0.2, 0]}>
          <Backdrop />
          <SegLine s={zGrid} width={1.3} />
          <SegLine s={zHi.h} width={3} />
          <SegLine s={zHi.v} width={3} />
          <mesh ref={zProbe} position={[px * ZS, py * ZS, 0.1]}><sphereGeometry args={[0.13, 14, 12]} /><meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} /></mesh>
          <mesh ref={zDot} position={[0, 0, 0.08]}><sphereGeometry args={[0.1, 12, 10]} /><meshBasicMaterial color="#ffc83d" /></mesh>
        </group>
        <group position={[3.15, 0, 0]} rotation={[0, -0.2, 0]}>
          <Backdrop />
          <SegLine s={wGrid} width={1.3} />
          <SegLine s={wHi.h} width={3} />
          <SegLine s={wHi.v} width={3} />
          {wOk && <mesh ref={wProbe} position={[(w[0] * PANEL) / W, (w[1] * PANEL) / W, 0.1]}><sphereGeometry args={[0.13, 14, 12]} /><meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} /></mesh>}
          <mesh ref={wDot} position={[0, 0, 0.08]}><sphereGeometry args={[0.1, 12, 10]} /><meshBasicMaterial color="#ffc83d" /></mesh>
        </group>
      </group>)}
      readouts={[
        ["f(z) at the probe", cx(w[0], w[1])],
        ["|f′(z)| (magnification)", Number.isFinite(d[0]) ? Math.hypot(d[0], d[1]).toFixed(4) : "∞ (pole)"],
        ["arg f′(z) (rotation)", Number.isFinite(d[0]) && Math.hypot(d[0], d[1]) > 1e-12 ? `${((Math.atan2(d[1], d[0]) * 180) / Math.PI).toFixed(1)}°` : "undefined"],
        ["CR: uₓ vs v_y", cr ? crTxt(cr.ux, cr.vy, Math.abs(cr.ux - cr.vy) < 1e-4 * Math.max(1, Math.abs(cr.ux))) : "undefined at the pole"],
        ["CR: u_y vs −vₓ", cr ? crTxt(cr.uy, -cr.vx, Math.abs(cr.uy + cr.vx) < 1e-4 * Math.max(1, Math.abs(cr.uy))) : "undefined at the pole"],
        ["Pole / residue", MAPS[id].pole],
      ]}
      controls={<>
        <Slider label="Probe x (real part)" value={px} min={-2} max={2} step={0.05} digits={2} onChange={(v) => set("px", v)} />
        <Slider label="Probe y (imaginary part)" value={py} min={-2} max={2} step={0.05} digits={2} onChange={(v) => set("py", v)} />
        <Pick label="Map w = f(z)" value={id} options={(Object.keys(MAPS) as MapId[]).map((k) => ({ id: k, label: MAPS[k].label }))} onChange={(v) => set("id", v)} />
      </>}
      note={<p>Left: the z-plane grid, with vertical lines x = const in cool colours and horizontal lines y = const in warm colours; right: the image of every line under w = f(z), keeping its colour (parts that leave the window are clipped). Wherever f′(z) ≠ 0 the map is conformal, so the lines still cross at right angles and a tiny square is only rotated by arg f′(z) and scaled by |f′(z)|. The gold and purple lines through the white probe, and their images through f(z), show this; the gold dot rides the horizontal line. f = u + iv is analytic exactly when the Cauchy–Riemann equations uₓ = v_y and u_y = −vₓ hold; they are checked here by numerical differences. Try z² at the origin (f′ = 0, angles double), 1/z near 0 (pole, residue 1) and (z − i)/(z + i), which folds the upper half-plane into the unit disc.</p>}
    />
  );
}
