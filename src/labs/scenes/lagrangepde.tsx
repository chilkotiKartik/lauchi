"use client";
import { Line } from "@react-three/drei";
import { useMemo, useRef } from "react";
import type * as THREE from "three";
import { coneRay, lagrangePQR, rotInvariants, rotateAbout, seedPoint, type V3 as P3 } from "../sim/mathii";
import { Tick } from "../Stage";
import { LabFrame, Slider, Pick } from "../ui";
import { useLabParams } from "../params";
import { MATHII_SPECS } from "../meta/mathii.specs";
import { Arrow } from "../kit2";
import { C, Orb, Sway, fmt, ramp, type RGB, type V3 } from "./mathii-kit";

const K = 1.15;
const sc = (p: P3): V3 => [p[0] * K, p[2] * K, -p[1] * K];
const SEEDS = Array.from({ length: 17 }, (_, i) => -1.6 + (3.2 * i) / 16);
function chars(mode: "rot" | "cone", axis: P3, k: number, h: number) {
  const pts: V3[] = [], cols: RGB[] = [];
  SEEDS.forEach((s, si) => {
    const r0 = seedPoint(s, k, h), col = ramp(si / (SEEDS.length - 1));
    let prev: V3 | null = null;
    for (let i = 0; i <= 64; i++) {
      const q = mode === "rot" ? sc(rotateAbout(axis, r0, (2 * Math.PI * i) / 64)) : sc(coneRay(r0, -2.2 + (3.2 * i) / 64));
      if (prev) { pts.push(prev, q); cols.push(col, col); }
      prev = q;
    }
  });
  return { pts, cols };
}
function moveBead(m: THREE.Object3D | null, ring: V3[], u: number) {
  if (!m || ring.length === 0) return;
  const p = ring[Math.floor(u * (ring.length - 1))];
  m.position.set(p[0], p[1], p[2]);
}

export default function LagrangePdeLab() {
  const [P, set, reset] = useLabParams(MATHII_SPECS.lagrangepde);
  const { l, m, n, mode, s0, k, h, th } = P;
  const axis: P3 = [l, m, n];
  const seed = seedPoint(s0, k, h);
  const web = useMemo(() => chars(mode, [l, m, n], k, h), [mode, l, m, n, k, h]);
  const seedCurve = useMemo(() => Array.from({ length: 41 }, (_, i) => sc(seedPoint(-1.6 + (3.2 * i) / 40, k, h))), [k, h]);
  const ring = useMemo(() => Array.from({ length: 97 }, (_, i) => sc(mode === "rot" ? rotateAbout([l, m, n], seedPoint(s0, k, h), (2 * Math.PI * i) / 96) : coneRay(seedPoint(s0, k, h), -2.2 + (3.2 * i) / 96))), [mode, l, m, n, s0, k, h]);
  const pos: P3 = mode === "rot" ? rotateAbout(axis, seed, (th * Math.PI) / 180) : coneRay(seed, -1.6 + (th / 360) * 2.4);
  const inv = rotInvariants(axis, seed), vel = mode === "rot" ? lagrangePQR(axis, pos) : pos;
  const vlen = Math.hypot(vel[0], vel[1], vel[2]) || 1;
  const bead = useRef<THREE.Mesh>(null), tt = useRef(0);
  const tick = (dt: number) => { tt.current = (tt.current + Math.min(dt, 0.05) * 0.15) % 1; moveBead(bead.current, ring, tt.current); };
  const alen = Math.hypot(l, m, n), ax: V3 = alen > 1e-9 ? [(l / alen) * 3.4, (n / alen) * 3.4, -(m / alen) * 3.4] : [0, 0, 0];
  const pp = sc(pos), vv = sc([pos[0] + (vel[0] / vlen) * 0.9, pos[1] + (vel[1] / vlen) * 0.9, pos[2] + (vel[2] / vlen) * 0.9]);
  return (
    <LabFrame
      label="Colourful circles stacked around a purple axis forming a surface of revolution, each circle a characteristic curve of Lagrange's partial differential equation, with a gold seed curve and a white point moving with its velocity arrow"
      camera={[0, 3.2, 8.5]}
      onReset={reset}
      scene={() => (<group>
        <Tick fn={tick} />
        <Sway amp={0.3}>
          <gridHelper args={[8, 16, "#3d5560", "#26363d"]} position={[0, -2.6, 0]} />
          <Line segments points={web.pts} vertexColors={web.cols} lineWidth={1.5} />
          <Line points={seedCurve} color={C.gold} lineWidth={4} />
          <Line points={ring} color={C.white} lineWidth={3} />
          {mode === "rot" && alen > 1e-9 && <Arrow from={[-ax[0], -ax[1], -ax[2]]} to={ax} color={C.purple} r={0.05} head={0.3} />}
          <Orb p={[0, 0, 0]} r={0.08} c={C.light} glow={0.3} />
          <Orb p={pp} r={0.15} c={C.white} />
          <Arrow from={pp} to={vv} color={C.orange} r={0.04} />
          <mesh ref={bead}><sphereGeometry args={[0.1, 12, 10]} /><meshStandardMaterial color={C.red} emissive={C.red} emissiveIntensity={0.8} /></mesh>
        </Sway>
      </group>)}
      readouts={mode === "rot" ? [
        ["u = x² + y² + z² (constant)", fmt(inv.u, 4)],
        ["v = lx + my + nz (constant)", fmt(inv.v, 4)],
        ["Circle radius", fmt(inv.radius, 4)],
        ["Height along the axis", fmt(inv.axial, 4)],
        ["Period of one turn 2π/|(l, m, n)|", Number.isFinite(inv.period) ? fmt(inv.period, 3) : "no rotation"],
        ["Point on the characteristic", `(${fmt(pos[0], 2)}, ${fmt(pos[1], 2)}, ${fmt(pos[2], 2)})`],
      ] : [
        ["First integral y/x", fmt(seed[1] / seed[0], 4)],
        ["Second integral z/x", fmt(seed[2] / seed[0], 4)],
        ["Ray direction (x, y, z)", `(${fmt(seed[0], 2)}, ${fmt(seed[1], 2)}, ${fmt(seed[2], 2)})`],
        ["z/x at the moving point", fmt(pos[2] / pos[0], 4)],
        ["y/x at the moving point", fmt(pos[1] / pos[0], 4)],
        ["Point on the ray", `(${fmt(pos[0], 2)}, ${fmt(pos[1], 2)}, ${fmt(pos[2], 2)})`],
      ]}
      controls={<>
        <Slider label="Axis component l" value={l} min={-2} max={2} step={0.1} digits={1} onChange={(v) => set("l", v)} />
        <Slider label="Axis component m" value={m} min={-2} max={2} step={0.1} digits={1} onChange={(v) => set("m", v)} />
        <Slider label="Axis component n" value={n} min={-2} max={2} step={0.1} digits={1} onChange={(v) => set("n", v)} />
        <Pick label="Equation" value={mode} options={[{ id: "rot", label: "(mz − ny)p + (nx − lz)q = ly − mx  (PYQ Q4.2)" }, { id: "cone", label: "x p + y q = z  (cone)" }]} onChange={(v) => set("mode", v)} />
        <Slider label="Seed point parameter s" value={s0} min={-1.5} max={1.5} step={0.05} digits={2} onChange={(v) => set("s0", v)} />
        <Slider label="Seed curve bend k (z = k s² + h)" value={k} min={-1} max={1} step={0.05} digits={2} onChange={(v) => set("k", v)} />
        <Slider label="Seed curve height h" value={h} min={-1} max={1} step={0.05} digits={2} onChange={(v) => set("h", v)} />
        <Slider label="Position along the characteristic" value={th} min={0} max={360} step={5} digits={0} unit="°" onChange={(v) => set("th", v)} />
      </>}
      note={<p><b>Lagrange&apos;s linear equation</b> Pp + Qq = R (p = ∂z/∂x, q = ∂z/∂y) is solved through the auxiliary equations dx/P = dy/Q = dz/R. Two independent integrals u(x, y, z) = c₁, v(x, y, z) = c₂ give the general solution f(u, v) = 0. In PYQ Q4.2, (mz − ny)p + (nx − lz)q = ly − mx, the auxiliary equations give l dx + m dy + n dz = 0 and x dx + y dy + z dz = 0, so the integrals are lx + my + nz = c₁ and x² + y² + z² = c₂: the characteristics are circles (a sphere cut by a plane perpendicular to the axis (l, m, n)). A solution surface is built from characteristic curves through a seed curve (gold): here a surface of revolution about the purple axis. The orange arrow is (P, Q, R) at the white point: it always points along the circle, which is why u and v never change. In cone mode, x p + y q = z has straight-ray characteristics and solution z = x φ(y/x).</p>}
    />
  );
}
