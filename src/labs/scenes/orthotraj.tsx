"use client";
import { Line } from "@react-three/drei";
import { useMemo, useRef } from "react";
import type * as THREE from "three";
import { familyY, orthoInfo, orthoName, orthoY } from "../sim/mathii";
import { Tick } from "../Stage";
import { LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { MATHII_SPECS } from "../meta/mathii.specs";
import { pieces } from "../kit";
import { Arrow } from "../kit2";
import { C, Orb, Ribbon, Sway, fmt, type V3 } from "./mathii-kit";

const K = 1.15, X0 = 0.05, X1 = 3.2, YM = 3.2, OX = -1.9;
const P3 = (x: number, y: number, z = 0.02): V3 => [x * K + OX, z, -y * K];
const xs = Array.from({ length: 90 }, (_, i) => X0 + ((X1 - X0) * i) / 89);
function curve(f: (x: number) => number): V3[][] {
  return pieces(xs.map((x) => { const y = f(x); return Number.isFinite(y) && Math.abs(y) <= YM ? P3(x, y) : null; }));
}
function moveBead(m: THREE.Object3D | null, n: number, c: number, u: number) {
  if (!m) return;
  const x = X0 + (X1 - X0) * u, y = familyY(n, c, x);
  m.visible = Number.isFinite(y) && Math.abs(y) <= YM;
  if (m.visible) m.position.set(x * K + OX, 0.1, -y * K);
}
const CS = [-2.4, -1.8, -1.2, -0.6, 0.6, 1.2, 1.8, 2.4];

export default function OrthoTrajLab() {
  const [P, set, reset] = useLabParams(MATHII_SPECS.orthotraj);
  const { n, c, xi } = P;
  const nn = Math.abs(n) < 0.05 ? 0 : n;
  const o = orthoInfo(nn, c, xi);
  const fam = useMemo(() => CS.flatMap((cc) => curve((x) => familyY(nn, cc, x))), [nn]);
  const ortho = useMemo(() => {
    if (nn === 0) return [2.2, 1.4, 0.7].map((x) => [P3(x, -YM), P3(x, YM)]);
    const ks = [0.5, 1.5, 3, 5, 7.5, 10];
    return ks.flatMap((k) => [curve((x) => orthoY(nn, k, x)), curve((x) => { const v = orthoY(nn, k, x); return Number.isNaN(v) ? v : -v; })]).flat();
  }, [nn]);
  const selF = useMemo(() => curve((x) => familyY(nn, c, x)).flat(), [nn, c]);
  const selOu = useMemo(() => (nn === 0 ? [P3(xi, -YM), P3(xi, YM)] : curve((x) => orthoY(nn, o.k, x)).flat()), [nn, xi, o.k]);
  const selOl = useMemo(() => (nn === 0 ? [] : curve((x) => { const v = orthoY(nn, o.k, x); return Number.isNaN(v) ? v : -v; }).flat()), [nn, o.k]);
  const bead = useRef<THREE.Mesh>(null), tt = useRef(0);
  const tick = (dt: number) => { tt.current = (tt.current + Math.min(dt, 0.05) * 0.12) % 1; moveBead(bead.current, nn, c, tt.current); };
  const at = P3(xi, o.y, 0.08);
  const dirF: V3 = (() => { const m = Math.atan(o.m1); return [Math.cos(m), 0, -Math.sin(m)]; })();
  const dirO: V3 = (() => { const m = Number.isFinite(o.m2) ? Math.atan(o.m2) : Math.PI / 2; return [Math.cos(m), 0, -Math.sin(m)]; })();
  const arrow = (d: V3, s: number): [V3, V3] => [[at[0] - d[0] * s, at[1] + 0.06, at[2] - d[2] * s], [at[0] + d[0] * s, at[1] + 0.06, at[2] + d[2] * s]];
  const [fa, fb] = arrow(dirF, 0.8), [oa, ob] = arrow(dirO, 0.8);
  return (
    <LabFrame
      label="Two families of curves on a glowing floor crossing at right angles: blue curves y equals c times x to the power n and orange orthogonal trajectories, with two tangent arrows meeting at 90 degrees at a white point"
      camera={[0, 5.2, 6.4]}
      onReset={reset}
      scene={() => (<group>
        <Tick fn={tick} />
        <Sway amp={0.18}>
          <mesh position={[0, -0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[9, 8]} /><meshStandardMaterial color="#16303b" /></mesh>
          <gridHelper args={[9, 18, "#3d5560", "#26363d"]} position={[0, 0, 0]} />
          {fam.map((p, i) => <Line key={"f" + i} points={p} color={C.blue} lineWidth={1.6} />)}
          {ortho.map((p, i) => <Line key={"o" + i} points={p} color={C.orange} lineWidth={1.6} />)}
          <Ribbon pts={selF} h={0.45} color={C.blue} />
          <Ribbon pts={selOu} h={0.45} color={C.orange} />
          <Ribbon pts={selOl} h={0.45} color={C.orange} />
          {selF.length > 1 && <Line points={selF} color="#7fd0ff" lineWidth={4} />}
          {selOu.length > 1 && <Line points={selOu} color="#ffc47a" lineWidth={4} />}
          {selOl.length > 1 && <Line points={selOl} color="#ffc47a" lineWidth={4} />}
          <Orb p={at} r={0.13} c={C.white} />
          <Arrow from={fa} to={fb} color={C.blue} />
          <Arrow from={oa} to={ob} color={C.orange} />
          <mesh ref={bead}><sphereGeometry args={[0.09, 12, 10]} /><meshStandardMaterial color={C.gold} emissive={C.gold} emissiveIntensity={0.8} /></mesh>
        </Sway>
      </group>)}
      readouts={[
        ["Family ODE", nn === 0 ? "dy/dx = 0" : `dy/dx = ${fmt(nn, 1)}·y/x`],
        ["Slope of the family", fmt(o.m1, 3)],
        ["Slope of orthogonal curve", Number.isFinite(o.m2) ? fmt(o.m2, 3) : "vertical"],
        ["Product of slopes", Number.isFinite(o.product) ? fmt(o.product, 3) : "−1 (limit)"],
        ["Angle between tangents", `${fmt(o.angle, 1)}°`],
        ["Orthogonal family", orthoName(nn)],
      ]}
      controls={<>
        <Slider label="Exponent n in y = c·xⁿ" value={n} min={-3} max={3} step={0.1} digits={1} onChange={(v) => set("n", v)} />
        <Slider label="Constant c of the highlighted curve" value={c} min={0.2} max={3} step={0.05} digits={2} onChange={(v) => set("c", v)} />
        <Slider label="Meeting point x" value={xi} min={0.3} max={2.8} step={0.05} digits={2} onChange={(v) => set("xi", v)} />
      </>}
      note={<p>To find the <b>orthogonal trajectories</b> of a family f(x, y, c) = 0: (1) differentiate and eliminate c to get the family&apos;s ODE, here dy/dx = n y/x for y = c xⁿ; (2) replace dy/dx by −1/(dy/dx), giving dy/dx = −x/(n y); (3) solve it by separating variables: n y dy = −x dx, so x² + n y² = k. The tangents of the two families at any common point are perpendicular, so their slopes multiply to −1. Try n = 1 (lines meet circles), n = 2 (parabolas meet ellipses) and n = −1 (hyperbolas xy = c meet x² − y² = k). The same idea gives heat-flow lines perpendicular to isotherms. The gold bead rides along the blue curve.</p>}
    />
  );
}
