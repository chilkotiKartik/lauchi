"use client";
import { Line } from "@react-three/drei";
import { useMemo, useRef } from "react";
import type * as THREE from "three";
import { CI_LABEL, cabs, cdiv, ciContour, ciDeriv, ciF, ciInside, cpow, type CiId } from "../sim/mathii";
import { Tick } from "../Stage";
import { LabFrame, Slider, Pick } from "../ui";
import { useLabParams } from "../params";
import { MATHII_SPECS } from "../meta/mathii.specs";
import { C, Orb, Surface, Sway, buildComplexSurface, cfmt, fmt, type V3 } from "./mathii-kit";

const HALF = 3.6, CAP = 4, HS = 0.55;
function moveBead(m: THREE.Object3D | null, ring: V3[], u: number) {
  if (!m || ring.length === 0) return;
  const p = ring[Math.floor(u * (ring.length - 1))];
  m.position.set(p[0], p[1] + 0.1, p[2]);
}

export default function CauchyIntLab() {
  const [P, set, reset] = useLabParams(MATHII_SPECS.cauchyint);
  const { ax, ay, R, n, fn } = P;
  const nn = Math.round(n), a: [number, number] = [ax, ay];
  const g = (x: number, y: number) => cdiv(ciF(fn, [x, y]), cpow([x - ax, y - ay], nn + 1));
  const geo = useMemo(() => buildComplexSurface((x, y) => cdiv(ciF(fn, [x, y]), cpow([x - ax, y - ay], nn + 1)), HALF, 73, CAP, HS), [fn, ax, ay, nn]);
  const ring = useMemo<V3[]>(() => Array.from({ length: 121 }, (_, i) => { const th = (2 * Math.PI * i) / 120, x = R * Math.cos(th), y = R * Math.sin(th); return [x, Math.min(CAP, cabs(cdiv(ciF(fn, [x, y]), cpow([x - ax, y - ay], nn + 1)))) * HS + 0.04, -y]; }), [fn, ax, ay, nn, R]);
  const drops = useMemo<V3[]>(() => ring.filter((_, i) => i % 3 === 0).flatMap((p) => [[p[0], 0, p[2]] as V3, p]), [ring]);
  const bead = useRef<THREE.Mesh>(null), tt = useRef(0);
  const tick = (dt: number) => { tt.current = (tt.current + Math.min(dt, 0.05) * 0.1) % 1; moveBead(bead.current, ring, tt.current); };
  const inside = ciInside(a, R), onC = Math.abs(Math.hypot(ax, ay) - R) < 0.03;
  const I = ciContour(fn, nn, a, R), exp = inside ? ciDeriv(fn, nn, a) : ([0, 0] as [number, number]);
  const err = Math.hypot(I[0] - exp[0], I[1] - exp[1]);
  void g;
  const ht = Math.min(CAP, cabs(cdiv(ciF(fn, [ax + 0.0001, ay]), cpow([0.0001, 0], nn + 1)))) * HS;
  return (
    <LabFrame
      label="A domain-coloured landscape of the function f(z) over (z minus a) to the power n plus one, rising to a spike at the pole a, with a glowing circular contour wall and a moving bead; inside the circle the integral equals the derivative of f at a, outside it is zero"
      camera={[0, 6, 7.4]}
      onReset={reset}
      scene={() => (<group>
        <Tick fn={tick} />
        <Sway amp={0.3}>
          <group position={[0, -0.9, 0]}>
            <Surface geo={geo} opacity={0.92} />
            <Line points={ring} color={C.white} lineWidth={4} />
            <Line segments points={drops} color={inside ? C.green : C.red} lineWidth={1.4} />
            <mesh position={[ax, ht / 2 + 0.05, -ay]}><cylinderGeometry args={[0.04, 0.04, ht + 0.1, 8]} /><meshStandardMaterial color={inside ? C.green : C.grey} emissive={inside ? C.green : C.grey} emissiveIntensity={0.6} /></mesh>
            <Orb p={[ax, 0.05, -ay]} r={0.14} c={inside ? C.green : C.red} />
            <mesh ref={bead}><sphereGeometry args={[0.12, 12, 10]} /><meshStandardMaterial color={C.gold} emissive={C.gold} emissiveIntensity={0.9} /></mesh>
            <gridHelper args={[8, 16, "#3d5560", "#26363d"]} position={[0, -0.02, 0]} />
          </group>
        </Sway>
      </group>)}
      readouts={[
        ["Contour integral", onC ? "pole on the contour: undefined" : cfmt(I, 4)],
        [nn === 0 ? "f(a) predicted" : `f${"′".repeat(Math.min(nn, 3))}(a) predicted`, cfmt(exp, 4)],
        ["Is the pole inside |z| = R?", onC ? "on the circle" : inside ? "Yes: integral = f⁽ⁿ⁾(a)" : "No: integral = 0 (Cauchy-Goursat)"],
        ["|a| compared with R", `${fmt(Math.hypot(ax, ay), 3)} vs ${fmt(R, 3)}`],
        ["Formula", nn === 0 ? "f(a) = (1/2πi)∮ f(z)/(z − a) dz" : `f⁽${nn}⁾(a) = ${nn}!/(2πi) ∮ f/(z − a)^${nn + 1} dz`],
        ["|integral − prediction|", onC ? "—" : err < 1e-6 ? "< 10⁻⁶ ✓" : fmt(err, 6)],
      ]}
      controls={<>
        <Slider label="Pole a, real part" value={ax} min={-3} max={3} step={0.05} digits={2} onChange={(v) => set("ax", v)} />
        <Slider label="Pole a, imaginary part" value={ay} min={-3} max={3} step={0.05} digits={2} onChange={(v) => set("ay", v)} />
        <Slider label="Circle radius R (centre 0)" value={R} min={0.5} max={3.5} step={0.05} digits={2} onChange={(v) => set("R", v)} />
        <Slider label="Derivative order n" value={n} min={0} max={3} step={1} digits={0} onChange={(v) => set("n", v)} />
        <Pick label="Function f(z)" value={fn} options={(Object.keys(CI_LABEL) as CiId[]).map((k) => ({ id: k, label: CI_LABEL[k] }))} onChange={(v) => set("fn", v)} />
      </>}
      note={<p><b>Cauchy-Goursat</b>: if f is analytic inside and on a simple closed curve C then ∮<sub>C</sub> f dz = 0. <b>Cauchy&apos;s integral formula</b>: if a lies inside C, f(a) = (1/2πi)∮<sub>C</sub> f(z)/(z − a) dz, and for derivatives f<sup>(n)</sup>(a) = (n!/2πi)∮<sub>C</sub> f(z)/(z − a)<sup>n+1</sup> dz. The landscape is the height |f(z)/(z − a)ⁿ⁺¹| with hue showing its argument; the pole at a is the spike. The program integrates numerically round the white circle (trapezoid rule) and compares with the formula: slide the pole across the circle and the answer jumps between f<sup>(n)</sup>(a) and 0. Green drop lines mean the pole is inside, red outside. The integral is undefined when a lies exactly on the contour. Exam use: ∮ e<sup>z</sup>/(z − a) dz = 2πi·e<sup>a</sup> for |a| &lt; R; ∮ sin z/(z − a)<sup>2</sup> dz = 2πi cos a. (The program prints the integral already divided by 2πi.)</p>}
    />
  );
}
