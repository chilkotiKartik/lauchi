"use client";
import { Line } from "@react-three/drei";
import { useMemo, useRef } from "react";
import type * as THREE from "three";
import { REAL_LABEL, cabs, realExact, realF, realG, realNumeric, realPoles, type RealId } from "../sim/mathii";
import { Tick } from "../Stage";
import { LabFrame, Slider, Pick } from "../ui";
import { useLabParams } from "../params";
import { MATHII_SPECS } from "../meta/mathii.specs";
import { C, Orb, Surface, Sway, buildComplexSurface, fmt, type V3 } from "./mathii-kit";

const HALF = 3, CAP = 4, HS = 0.45;
function moveBead(m: THREE.Object3D | null, ring: V3[], u: number) {
  if (!m || ring.length === 0) return;
  const p = ring[Math.floor(u * (ring.length - 1))];
  m.position.set(p[0], p[1] + 0.1, p[2]);
}

export default function RealIntegralLab() {
  const [P, set, reset] = useLabParams(MATHII_SPECS.realintegral);
  const { a, b, mode } = P;
  const id = mode as RealId;
  const ok = a > Math.abs(b);
  const geo = useMemo(() => buildComplexSurface((x, y) => realG(id, a, b, [x, y]), HALF, 81, CAP, HS), [id, a, b]);
  // the real integrand F(theta) as a wall standing on the unit circle
  const wall = useMemo<V3[]>(() => {
    const s = Array.from({ length: 121 }, (_, i) => { const v = realF(id, a, b, (2 * Math.PI * i) / 120); return Number.isFinite(v) ? Math.max(-50, Math.min(50, v)) : 0; });
    const m = Math.max(1e-9, ...s.map(Math.abs));
    return s.map((v, i) => { const th = (2 * Math.PI * i) / 120; return [Math.cos(th), (v / m) * 1.6, -Math.sin(th)] as V3; });
  }, [id, a, b]);
  const base = useMemo<V3[]>(() => wall.map((p) => [p[0], 0.02, p[2]] as V3), [wall]);
  const bead = useRef<THREE.Mesh>(null), tt = useRef(0);
  const tick = (dt: number) => { tt.current = (tt.current + Math.min(dt, 0.05) * 0.1) % 1; moveBead(bead.current, wall, tt.current); };
  const poles = realPoles(a, b);
  const ex = realExact(id, a, b), nu = ok ? realNumeric(id, a, b) : NaN;
  const hz = poles ? Math.min(CAP, cabs(realG(id, a, b, [poles[0] + 0.0004, 0]))) * HS : 0;
  return (
    <LabFrame
      label="The unit circle in the complex plane under a domain-coloured landscape of the integrand after substituting z equal e to the i theta, with a pole spike inside the circle, and a coloured wall above the circle showing the real integrand as a function of theta; the real integral equals 2 pi i times the residue at the inside pole"
      camera={[0, 5.5, 6.5]}
      onReset={reset}
      scene={() => (<group>
        <Tick fn={tick} />
        <Sway amp={0.3}>
          <group position={[0, -0.6, 0]}>
            <Surface geo={geo} opacity={0.9} />
            <Line points={base} color={C.white} lineWidth={3.5} />
            <Line points={wall} color={ok ? C.gold : C.red} lineWidth={3} />
            <Line segments points={wall.filter((_, i) => i % 4 === 0).flatMap((p) => [[p[0], 0.02, p[2]] as V3, p])} color={ok ? C.green : C.red} lineWidth={1.2} />
            {poles && <Orb p={[poles[0], hz + 0.1, 0]} r={0.14} c={C.green} />}
            {poles && <Orb p={[poles[1], 0.1, 0]} r={0.12} c={C.red} />}
            <mesh ref={bead}><sphereGeometry args={[0.1, 12, 10]} /><meshStandardMaterial color={C.white} emissive={C.white} emissiveIntensity={0.8} /></mesh>
            <gridHelper args={[6, 12, "#3d5560", "#26363d"]} position={[0, -0.02, 0]} />
          </group>
        </Sway>
      </group>)}
      readouts={[
        ["Integrand", REAL_LABEL[id].replace("a", fmt(a, 2)).replace("b", fmt(b, 2))],
        ["Poles of 1/(a + b cos θ) in z", poles ? `z = ${fmt(poles[0], 3)} (inside),  ${fmt(poles[1], 3)} (outside)` : ok ? "none (b = 0)" : "a ≤ |b|: pole on or inside the circle"],
        ["∫₀^2π dθ by residues", ex === null ? "undefined (needs a > |b|)" : fmt(ex, 5)],
        ["∫ by numeric sum", ok ? fmt(nu, 5) : "diverges"],
        ["Difference", ex === null ? "—" : Math.abs(ex - nu) < 1e-6 ? "< 10⁻⁶ ✓" : fmt(Math.abs(ex - nu), 6)],
        ["Exact value ÷ π", ex === null ? "—" : fmt(ex / Math.PI, 5)],
      ]}
      controls={<>
        <Slider label="Constant a" value={a} min={1} max={10} step={0.1} digits={1} onChange={(v) => set("a", v)} />
        <Slider label="Coefficient b" value={b} min={-8} max={8} step={0.1} digits={1} onChange={(v) => set("b", v)} />
        <Pick label="Integrand" value={mode} options={(Object.keys(REAL_LABEL) as RealId[]).map((k) => ({ id: k, label: REAL_LABEL[k] }))} onChange={(v) => set("mode", v)} />
      </>}
      note={<p>To evaluate ∫<sub>0</sub><sup>2π</sup> F(cos θ, sin θ) dθ put z = e<sup>iθ</sup>, cos θ = (z + 1/z)/2, sin θ = (z − 1/z)/2i, dθ = dz/(iz); the integral becomes ∮<sub>|z|=1</sub> G(z) dz = 2πi Σ Res inside the unit circle. For 1/(a + b cos θ) the poles solve bz² + 2az + b = 0 and have product 1, so exactly one lies inside when a &gt; |b|; the answer is 2π/√(a² − b²). The landscape is |G(z)| with the pole spike in green (inside) and red (outside); the coloured wall above the circle is the real integrand F(θ) itself. <b>PYQ</b>: ∫dθ/(3 + cos θ) = π/√2; ∫cos 2θ/(5 + 4 cos θ) = π/6; ∫sin²θ/(5 − 4 cos θ) = π/4. When a ≤ |b| the denominator vanishes somewhere and the integral does not exist.</p>}
    />
  );
}
