"use client";
import { Line } from "@react-three/drei";
import { Graph, mix, sample } from "../kit2";
import { beta, betaIntegrand, betaNumeric, fmt, gamma, sinCosInt } from "../sim/mathi";
import { Tick } from "../Stage";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { MATHI_SPECS } from "../meta/mathi.specs";
import { C, Instances, type Inst } from "./mathi-kit";
import { useRef } from "react";
import type * as THREE from "three";

const NB = 48;
export default function BetaGammaLab() {
  const [P, set, reset] = useLabParams(MATHI_SPECS.betagamma);
  const { view, m, n } = P;
  const B = beta(m, n), p = 2 * m - 1, q = 2 * n - 1;
  const g = betaIntegrand(m, n, view), x1 = view === "beta" ? 1 : Math.PI / 2;
  const raw = Array.from({ length: NB }, (_, i) => Math.min(3.5, g(((i + 0.5) / NB) * x1)));
  const hs = 2.4 / Math.max(...raw, 0.2), bw = 4 / NB;
  const items: Inst[] = raw.map((v, i) => ({ p: [-4.4 + bw * (i + 0.5), (v * hs) / 2, 0], s: [bw * 0.92, Math.max(0.02, v * hs), 0.45], c: mix(C.blue, C.green, i / NB) }));
  const gammaPts = sample(gamma, 0.5, 5.5, 80);
  const cur = useRef<THREE.Mesh>(null), t = useRef(0);
  const tick = (dt: number) => { t.current = (t.current + Math.min(dt, 0.05) * 0.25) % 1; cur.current?.position.set(-4.4 + 4 * t.current, 1.4, 0); };
  const num = view === "beta" ? betaNumeric(m, n) : 2 * sinCosInt(p, q);
  const gx = (v: number) => Math.min(5.5, v);
  return (
    <LabFrame
      label="Left: the Beta integrand drawn as bars whose total area is B(m, n). Right: the Gamma function curve with m, n and m + n marked"
      camera={[0, 2.6, 9.2]}
      onReset={reset}
      scene={() => (<group>
        <Tick fn={tick} />
        <Line points={[[-4.4, 0, 0.3], [-0.4, 0, 0.3]]} color={C.light} lineWidth={2} />
        <Instances items={items} cap={64} />
        <Line points={[[-4.4, 0, 0.3], [-4.4, 2.8, 0.3]]} color={C.light} lineWidth={2} />
        <Graph x0={0.6} y0={0} w={4} h={3} xr={[0.5, 5.5]} yr={[0, 30]} curves={[{ pts: gammaPts, color: C.gold, w: 3 }]} vlines={[{ x: gx(m), color: C.blue }, { x: gx(n), color: C.green }, { x: gx(m + n), color: C.red }]} />
        <mesh ref={cur}><boxGeometry args={[0.04, 2.8, 0.6]} /><meshStandardMaterial color={C.red} emissive={C.red} emissiveIntensity={0.7} transparent opacity={0.5} /></mesh>
      </group>)}
      readouts={[
        ["B(m, n)", fmt(B, 6)],
        ["Γ(m)Γ(n) / Γ(m + n)", fmt((gamma(m) * gamma(n)) / gamma(m + n), 6)],
        ["Numerical integral", fmt(num, 6)],
        ["Γ(m), Γ(n)", `${fmt(gamma(m), 4)}, ${fmt(gamma(n), 4)}`],
        ["Γ(m + n)", fmt(gamma(m + n), 4)],
        [view === "beta" ? "B(n, m) (symmetry)" : `½B = ∫ sin^${fmt(p, 1)} cos^${fmt(q, 1)}`, view === "beta" ? fmt(beta(n, m), 6) : fmt(sinCosInt(p, q), 6)],
      ]}
      controls={<>
        <Slider label="Parameter m" value={m} min={0.5} max={6} step={0.5} digits={1} onChange={(v) => set("m", v)} />
        <Slider label="Parameter n" value={n} min={0.5} max={6} step={0.5} digits={1} onChange={(v) => set("n", v)} />
        <Pick label="Integrand shown" value={view} options={[{ id: "beta", label: "x^(m−1) (1−x)^(n−1) on [0, 1]" }, { id: "sincos", label: "2 sin^(2m−1)θ cos^(2n−1)θ on [0, π/2]" }]} onChange={(v) => set("view", v)} />
      </>}
      note={<>
        <p><b>Beta and Gamma.</b> Γ(n) = ∫₀^∞ e<sup>−x</sup>x<sup>n−1</sup>dx, with Γ(n + 1) = nΓ(n), Γ(n + 1) = n! and Γ(½) = √π. B(m, n) = ∫₀¹ x<sup>m−1</sup>(1 − x)<sup>n−1</sup>dx = Γ(m)Γ(n)/Γ(m + n) = B(n, m). Putting x = sin²θ gives B(m, n) = 2∫₀^(π/2) sin<sup>2m−1</sup>θ cos<sup>2n−1</sup>θ dθ, so ∫₀^(π/2) sin<sup>p</sup>θ cos<sup>q</sup>θ dθ = ½ B((p+1)/2, (q+1)/2). Bar heights are clipped at 3.5 when the integrand blows up (m or n &lt; 1).</p>
        <p className="mt-2"><b>Try.</b> m = n = ½ gives B = π, hence Γ(½)² = π. For the PYQ ∫₀^(2π) sin⁴θ cos²θ dθ use m = 2.5, n = 1.5 in the second view: ½B(5/2, 3/2) = π/32, and four quarter-periods make 4 × π/32 = π/8. Swap m and n: B does not change.</p>
      </>}
    />
  );
}
