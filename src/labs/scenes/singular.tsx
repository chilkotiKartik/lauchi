"use client";
import { Line } from "@react-three/drei";
import { useMemo, useRef } from "react";
import type * as THREE from "three";
import { SING_LABEL, cabs, fact, singFn, singInfo, singResidueNumeric, taylorCoeff, type SingId } from "../sim/mathii";
import { Tick } from "../Stage";
import { LabFrame, Slider, Pick } from "../ui";
import { useLabParams } from "../params";
import { MATHII_SPECS } from "../meta/mathii.specs";
import { C, Pillar, Surface, Sway, buildComplexSurface, cfmt, fmt, type V3 } from "./mathii-kit";

const HALF = 2.2, CAP = 4, HS = 0.55;
function moveBead(m: THREE.Object3D | null, ring: V3[], u: number) {
  if (!m || ring.length === 0) return;
  const p = ring[Math.floor(u * (ring.length - 1))];
  m.position.set(p[0], p[1] + 0.1, p[2]);
}
/** Coefficient of z^p in the Laurent expansion about 0. */
const laurent = (id: SingId, m: number, p: number) => (id === "essen" ? (m - p >= 0 ? 1 / fact(m - p) : 0) : taylorCoeff(id, p + m));

export default function SingularLab() {
  const [P, set, reset] = useLabParams(MATHII_SPECS.singular);
  const { fn, rho } = P;
  const m = Math.round(P.m), id = fn as SingId;
  const geo = useMemo(() => buildComplexSurface((x, y) => singFn(id, m, [x, y]), HALF, 77, CAP, HS), [id, m]);
  const ring = useMemo<V3[]>(() => Array.from({ length: 121 }, (_, i) => { const th = (2 * Math.PI * i) / 120, x = rho * Math.cos(th), y = rho * Math.sin(th); return [x, Math.min(CAP, cabs(singFn(id, m, [x, y]))) * HS + 0.04, -y]; }), [id, m, rho]);
  const bead = useRef<THREE.Mesh>(null), tt = useRef(0);
  const tick = (dt: number) => { tt.current = (tt.current + Math.min(dt, 0.05) * 0.1) % 1; moveBead(bead.current, ring, tt.current); };
  const info = singInfo(id, m), num = singResidueNumeric(id, m, rho);
  const powers = [-4, -3, -2, -1, 0, 1, 2, 3];
  const principal = powers.filter((p) => p < 0 && laurent(id, m, p) !== 0).map((p) => `${fmt(laurent(id, m, p), 3)} z${p === -1 ? "⁻¹" : "⁻" + "²³⁴"[-p - 2]}`).join("  +  ");
  return (
    <LabFrame
      label="A domain-coloured landscape of a function with an isolated singularity at the origin showing a spike whose sharpness depends on the type of singularity, a glowing circle of radius rho with a moving bead, and a row of coloured bars in front giving the coefficients of the Laurent series from z to the minus four up to z cubed"
      camera={[0, 5.2, 6.4]}
      onReset={reset}
      scene={() => (<group>
        <Tick fn={tick} />
        <Sway amp={0.3}>
          <group position={[0, -0.7, 0]}>
            <Surface geo={geo} opacity={0.92} />
            <Line points={ring} color={C.white} lineWidth={4} />
            {powers.map((p, i) => {
              const c = laurent(id, m, p), h = Math.max(-1.2, Math.min(1.8, c * 1.6));
              return <Pillar key={i} x={(i - 3.5) * 0.5} z={2.7} h={h} r={0.1} c={p === -1 ? C.gold : p < 0 ? C.orange : C.green} />;
            })}
            <mesh ref={bead}><sphereGeometry args={[0.1, 12, 10]} /><meshStandardMaterial color={C.gold} emissive={C.gold} emissiveIntensity={0.9} /></mesh>
            <gridHelper args={[4.4, 11, "#3d5560", "#26363d"]} position={[0, -0.02, 0]} />
          </group>
        </Sway>
      </group>)}
      readouts={[
        ["Singularity at z = 0", info.kind],
        ["Principal part (z⁻ᵖ terms)", principal || "none"],
        ["Residue (coefficient of z⁻¹)", fmt(info.residue, 5)],
        ["Numeric ∮ f dz / 2πi", cfmt(num, 5)],
        ["Order of the pole", Number.isFinite(info.order) ? String(info.order) : "infinite (essential)"],
        ["Check", Math.abs(num[0] - info.residue) < 1e-6 && Math.abs(num[1]) < 1e-6 ? "numeric = residue ✓" : "mismatch"],
      ]}
      controls={<>
        <Slider label="Power m in the denominator" value={P.m} min={0} max={6} step={1} digits={0} onChange={(v) => set("m", v)} />
        <Pick label="Function f(z)" value={fn} options={(Object.keys(SING_LABEL) as SingId[]).map((k) => ({ id: k, label: SING_LABEL[k] }))} onChange={(v) => set("fn", v)} />
        <Slider label="Circle radius ρ" value={rho} min={0.1} max={1.5} step={0.05} digits={2} onChange={(v) => set("rho", v)} />
      </>}
      note={<p>An isolated singular point z = a is found from the Laurent series f = Σ aₙ(z − a)<sup>n</sup>. If no negative powers appear it is <b>removable</b> (sin z / z → 1); if the negative powers stop at (z − a)<sup>−m</sup> it is a <b>pole of order m</b>; if they never stop it is <b>essential</b> (e<sup>1/z</sup>). The coefficient a₋₁ is the <b>residue</b> and ∮ f dz = 2πi a₋₁. The bars in front are the Laurent coefficients of z<sup>−4</sup> … z<sup>3</sup>: orange = principal part, gold = the residue, green = analytic part. <b>Examples</b>: sin z / z⁴ has a pole of order 3 with residue −1/6; e<sup>z</sup>/z³ has residue 1/2; z² e<sup>1/z</sup> is essential with residue 1/6. The numeric integral round the circle agrees for any radius because there are no other singularities.</p>}
    />
  );
}
