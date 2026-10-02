"use client";
import { Line } from "@react-three/drei";
import { useMemo, useRef } from "react";
import type * as THREE from "three";
import { sysInfo, sysPath } from "../sim/mathii";
import { Tick } from "../Stage";
import { LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { MATHII_SPECS } from "../meta/mathii.specs";
import { C, Orb, Sway, fmt, ramp, type RGB, type V3 } from "./mathii-kit";

const SC = 0.62, LIM = 3.4, TH = 0.32;
const clampv = (v: number) => Math.max(-LIM, Math.min(LIM, v * SC));
function floorPts(path: [number, number, number][]): V3[] { return path.map((p) => [clampv(p[1]), 0.02, -clampv(p[2])]); }
function helixPts(path: [number, number, number][]): V3[] { return path.map((p) => [clampv(p[1]), 0.02 + p[0] * TH, -clampv(p[2])]); }
function moveBead(m: THREE.Object3D | null, pts: V3[], u: number) {
  if (!m || pts.length === 0) return;
  const p = pts[Math.min(pts.length - 1, Math.floor(u * (pts.length - 1)))];
  m.position.set(p[0], p[1], p[2]);
}
function eigenDir(a: number, b: number, c: number, d: number, lam: number): [number, number] {
  // (A − λI) v = 0 → v = (b, λ − a) or (λ − d, c)
  let vx = b, vy = lam - a;
  if (Math.hypot(vx, vy) < 1e-9) { vx = lam - d; vy = c; }
  const n = Math.hypot(vx, vy);
  return n < 1e-9 ? [0, 0] : [vx / n, vy / n];
}

export default function CoupledOdeLab() {
  const [P, set, reset] = useLabParams(MATHII_SPECS.coupledode);
  const { a, b, c, d, x0, y0, T } = P;
  const info = sysInfo(a, b, c, d);
  const ring = useMemo(() => Array.from({ length: 8 }, (_, i) => { const th = (Math.PI * i) / 4 + 0.3; return sysPath(a, b, c, d, 2.2 * Math.cos(th), 2.2 * Math.sin(th), 5, 140, 6); }), [a, b, c, d]);
  const sel = useMemo(() => sysPath(a, b, c, d, x0, y0, T, 220, 12), [a, b, c, d, x0, y0, T]);
  const arrows = useMemo(() => {
    const pts: V3[] = [], cols: RGB[] = [];
    for (let i = -3; i <= 3; i++) for (let j = -3; j <= 3; j++) {
      const x = i * 1.0, y = j * 1.0, vx = a * x + b * y, vy = c * x + d * y, sp = Math.hypot(vx, vy);
      if (sp < 1e-6) continue;
      const L = 0.28, px = clampv(x), pz = -clampv(y), col = ramp(Math.min(1, sp / 8));
      pts.push([px, 0.03, pz], [px + (vx / sp) * L, 0.03, pz - (vy / sp) * L]); cols.push(col, col);
    }
    return { pts, cols };
  }, [a, b, c, d]);
  const eig = useMemo(() => {
    const out: { p: V3[]; col: string }[] = [];
    if (info.disc > 1e-9) [info.l1[0], info.l2[0]].forEach((lam, i) => { const v = eigenDir(a, b, c, d, lam); if (v[0] || v[1]) out.push({ p: [[-v[0] * 5.5, 0.04, v[1] * 5.5], [v[0] * 5.5, 0.04, -v[1] * 5.5]], col: i === 0 ? C.red : C.blue }); });
    return out;
  }, [a, b, c, d, info.disc, info.l1, info.l2]);
  const fp = useMemo(() => floorPts(sel), [sel]), hp = useMemo(() => helixPts(sel), [sel]);
  const bead = useRef<THREE.Mesh>(null), tt = useRef(0);
  const tick = (dt: number) => { tt.current = (tt.current + Math.min(dt, 0.05) * 0.18) % 1; moveBead(bead.current, hp, tt.current); };
  const end = sel[sel.length - 1];
  const ev = (l: [number, number]) => (Math.abs(l[1]) < 1e-9 ? fmt(l[0], 3) : `${fmt(l[0], 3)} ${l[1] < 0 ? "−" : "+"} ${Math.abs(l[1]).toFixed(3)}i`);
  return (
    <LabFrame
      label="A phase plane floor covered with small direction arrows and spiralling or straight trajectories, plus one gold solution curve rising through time as a 3D helix above the plane"
      camera={[0, 5.5, 8.5]}
      onReset={reset}
      scene={() => (<group>
        <Tick fn={tick} />
        <Sway amp={0.25}>
          <group position={[0, -1.4, 0]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[2 * LIM + 0.4, 2 * LIM + 0.4]} /><meshStandardMaterial color="#16303b" /></mesh>
            <gridHelper args={[2 * LIM, 14, "#3d5560", "#26363d"]} position={[0, 0.005, 0]} />
            <Line points={[[-LIM, 0.02, 0], [LIM, 0.02, 0]]} color={C.light} lineWidth={1.4} />
            <Line points={[[0, 0.02, -LIM], [0, 0.02, LIM]]} color={C.light} lineWidth={1.4} />
            <Line segments points={arrows.pts} vertexColors={arrows.cols} lineWidth={2} />
            {ring.map((r, i) => <Line key={i} points={floorPts(r)} color={`#${[ramp(i / 8)[0], ramp(i / 8)[1], ramp(i / 8)[2]].map((v) => Math.round(v * 255).toString(16).padStart(2, "0")).join("")}`} lineWidth={1.6} transparent opacity={0.8} />)}
            {eig.map((e, i) => <Line key={"e" + i} points={e.p} color={e.col} lineWidth={3} dashed dashSize={0.2} gapSize={0.1} />)}
            <Line points={fp} color={C.white} lineWidth={2.2} />
            {hp.length > 1 && <Line points={hp} color={C.gold} lineWidth={4} />}
            {hp.length > 1 && <Line points={[fp[0], hp[0]]} color={C.green} lineWidth={2} />}
            <Orb p={[clampv(x0), 0.06, -clampv(y0)]} r={0.14} c={C.green} />
            <mesh ref={bead}><sphereGeometry args={[0.12, 12, 10]} /><meshStandardMaterial color={C.red} emissive={C.red} emissiveIntensity={0.8} /></mesh>
            <Orb p={[0, 0.04, 0]} r={0.09} c={C.white} glow={0.3} />
          </group>
        </Sway>
      </group>)}
      readouts={[
        ["Trace τ = a + d", fmt(info.tr, 2)],
        ["Determinant Δ = ad − bc", fmt(info.det, 2)],
        ["Discriminant τ² − 4Δ", fmt(info.disc, 2)],
        ["Eigenvalues λ", `${ev(info.l1)} ; ${ev(info.l2)}`],
        ["Equilibrium at the origin", info.kind],
        [`(x, y) at t = ${T.toFixed(1)}`, end ? `(${fmt(end[1], 3)}, ${fmt(end[2], 3)})` : "—"],
      ]}
      controls={<>
        <Slider label="a in x′ = ax + by" value={a} min={-3} max={3} step={0.1} digits={1} onChange={(v) => set("a", v)} />
        <Slider label="b in x′ = ax + by" value={b} min={-3} max={3} step={0.1} digits={1} onChange={(v) => set("b", v)} />
        <Slider label="c in y′ = cx + dy" value={c} min={-3} max={3} step={0.1} digits={1} onChange={(v) => set("c", v)} />
        <Slider label="d in y′ = cx + dy" value={d} min={-3} max={3} step={0.1} digits={1} onChange={(v) => set("d", v)} />
        <Slider label="Start x(0)" value={x0} min={-3} max={3} step={0.1} digits={1} onChange={(v) => set("x0", v)} />
        <Slider label="Start y(0)" value={y0} min={-3} max={3} step={0.1} digits={1} onChange={(v) => set("y0", v)} />
        <Slider label="Time span T" value={T} min={1} max={10} step={0.5} digits={1} onChange={(v) => set("T", v)} />
      </>}
      note={<p>A pair of <b>simultaneous linear ODEs with constant coefficients</b>, x′ = ax + by, y′ = cx + dy, is solved by eliminating one unknown with the D operator: the characteristic equation is λ² − (a + d)λ + (ad − bc) = 0, i.e. λ² − τλ + Δ = 0. The signs of τ, Δ and τ² − 4Δ decide the picture: Δ &lt; 0 saddle; Δ &gt; 0 with real roots a node (stable if τ &lt; 0); complex roots a spiral (stable if τ &lt; 0) or, when τ = 0, closed orbits (a centre, like the spring-mass x′ = y, y′ = −x). Real eigenvalues give the straight dashed trajectories along the eigenvectors. The floor is the (x, y) phase plane with the direction field; the gold curve is your solution lifted by time t into the third dimension. PYQ Q2.3: dx/dt = 7x − y, dy/dt = 2x + 5y has τ = 12, Δ = 37, λ = 6 ± i, an unstable spiral.</p>}
    />
  );
}
