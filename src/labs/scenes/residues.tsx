"use client";
import { Line } from "@react-three/drei";
import { useMemo, useRef } from "react";
import type * as THREE from "three";
import { cabs, contourOver2pi, resFn, resInside, resPoles, type ResMode } from "../sim/mathii";
import { Tick } from "../Stage";
import { LabFrame, Slider, Pick } from "../ui";
import { useLabParams } from "../params";
import { MATHII_SPECS } from "../meta/mathii.specs";
import { C, Orb, Pillar, Surface, Sway, buildComplexSurface, cfmt, fmt, type V3 } from "./mathii-kit";

const HALF = 5.5, CAP = 4, HS = 0.5;
function moveBead(m: THREE.Object3D | null, ring: V3[], u: number) {
  if (!m || ring.length === 0) return;
  const p = ring[Math.floor(u * (ring.length - 1))];
  m.position.set(p[0], p[1] + 0.1, p[2]);
}

export default function ResiduesLab() {
  const [P, set, reset] = useLabParams(MATHII_SPECS.residues);
  const { n2, n1, n0, p1, p2, p3, R, mode } = P;
  const poles = resPoles(mode as ResMode, n2, n1, n0, p1, p2, p3);
  const geo = useMemo(() => buildComplexSurface((x, y) => resFn(mode as ResMode, n2, n1, n0, p1, p2, p3, [x, y]), HALF, 81, CAP, HS), [mode, n2, n1, n0, p1, p2, p3]);
  const ring = useMemo<V3[]>(() => Array.from({ length: 121 }, (_, i) => { const th = (2 * Math.PI * i) / 120, x = R * Math.cos(th), y = R * Math.sin(th); return [x, Math.min(CAP, cabs(resFn(mode as ResMode, n2, n1, n0, p1, p2, p3, [x, y]))) * HS + 0.04, -y]; }), [mode, n2, n1, n0, p1, p2, p3, R]);
  const bead = useRef<THREE.Mesh>(null), tt = useRef(0);
  const tick = (dt: number) => { tt.current = (tt.current + Math.min(dt, 0.05) * 0.1) % 1; moveBead(bead.current, ring, tt.current); };
  const onC = poles ? poles.some((p) => Math.abs(Math.abs(p.z) - R) < 0.03) : false;
  const sum = poles ? resInside(poles, R) : 0;
  const num = poles && !onC ? contourOver2pi((z) => resFn(mode as ResMode, n2, n1, n0, p1, p2, p3, z), R) : ([NaN, NaN] as [number, number]);
  const inN = poles ? poles.filter((p) => Math.abs(p.z) < R).length : 0;
  const err = Math.hypot(num[0] - sum, num[1]);
  return (
    <LabFrame
      label="A domain-coloured landscape of a rational function with tall spikes at its poles on the real axis, a glowing circular contour of radius R with a moving bead, and green or red markers for poles inside or outside the circle; the contour integral equals 2 pi i times the sum of the residues inside"
      camera={[0, 7.5, 9.5]}
      onReset={reset}
      scene={() => (<group>
        <Tick fn={tick} />
        <Sway amp={0.3}>
          <group position={[0, -0.9, 0]}>
            <Surface geo={geo} opacity={0.92} />
            <Line points={ring} color={C.white} lineWidth={4} />
            {poles?.map((p, i) => {
              const inside = Math.abs(p.z) < R, h = Math.min(CAP, 3) * HS;
              return (<group key={i}>
                <Pillar x={p.z} z={0} h={h} c={inside ? C.green : C.red} />
                <Orb p={[p.z, h + 0.1, 0]} r={0.12 + 0.05 * (p.order - 1)} c={inside ? C.green : C.red} />
              </group>);
            })}
            <mesh ref={bead}><sphereGeometry args={[0.13, 12, 10]} /><meshStandardMaterial color={C.gold} emissive={C.gold} emissiveIntensity={0.9} /></mesh>
            <gridHelper args={[11, 22, "#3d5560", "#26363d"]} position={[0, -0.02, 0]} />
          </group>
        </Sway>
      </group>)}
      readouts={[
        ["Poles and residues", poles ? poles.map((p) => `z=${fmt(p.z, 2)}${p.order > 1 ? " (double)" : ""}: ${fmt(p.res, 3)}`).join(",  ") : "poles must be distinct (≥ 0.05 apart)"],
        ["Poles inside |z| = R", poles ? `${inN} of ${poles.length}` : "—"],
        ["Σ Res inside", poles ? fmt(sum, 4) : "—"],
        ["∮ f dz = 2πi Σ Res", poles ? (onC ? "pole on the contour: undefined" : `${fmt(2 * Math.PI * sum, 4)} i`) : "—"],
        ["Numeric ∮ f dz / 2πi", poles && !onC ? cfmt(num, 4) : "—"],
        ["|numeric − ΣRes|", poles && !onC ? (err < 1e-6 ? "< 10⁻⁶ ✓" : fmt(err, 6)) : "—"],
      ]}
      controls={<>
        <Slider label="Numerator z² coefficient" value={n2} min={-5} max={5} step={1} digits={0} onChange={(v) => set("n2", v)} />
        <Slider label="Numerator z coefficient" value={n1} min={-5} max={5} step={1} digits={0} onChange={(v) => set("n1", v)} />
        <Slider label="Numerator constant" value={n0} min={-5} max={5} step={1} digits={0} onChange={(v) => set("n0", v)} />
        <Slider label="Pole z₁" value={p1} min={-4} max={4} step={0.1} digits={1} onChange={(v) => set("p1", v)} />
        <Slider label="Pole z₂" value={p2} min={-4} max={4} step={0.1} digits={1} onChange={(v) => set("p2", v)} />
        {mode === "simple" && <Slider label="Pole z₃" value={p3} min={-4} max={4} step={0.1} digits={1} onChange={(v) => set("p3", v)} />}
        <Slider label="Circle radius R (centre 0)" value={R} min={0.5} max={5} step={0.05} digits={2} onChange={(v) => set("R", v)} />
        <Pick label="Poles" value={mode} options={[{ id: "simple", label: "N/((z−z₁)(z−z₂)(z−z₃)) simple" }, { id: "double", label: "N/((z−z₁)²(z−z₂)) double at z₁" }]} onChange={(v) => set("mode", v)} />
      </>}
      note={<p><b>Residue theorem</b>: ∮<sub>C</sub> f dz = 2πi Σ Res f over the poles inside C. At a simple pole Res = lim (z − a) f(z), or φ(a)/ψ′(a) for f = φ/ψ; at a pole of order m, Res = 1/(m − 1)! · lim d<sup>m−1</sup>/dz<sup>m−1</sup> [(z − a)<sup>m</sup> f(z)]. The tall spikes are the poles, hue is arg f. Green markers lie inside the white circle and count, red ones lie outside and add nothing; the program also integrates numerically round the circle and compares. <b>PYQ</b> Q5.5: z²/((z−1)(z−2)(z−3)) on |z| = 3.5 has residues 1/2, −4, 9/2 giving 2πi; z²/((z−1)²(z+2)) on |z| = 3 has residues 5/9 (double pole) and 4/9. Try shrinking R so poles drop out one by one.</p>}
    />
  );
}
