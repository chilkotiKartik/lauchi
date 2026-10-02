"use client";
import { Line } from "@react-three/drei";
import { useMemo } from "react";
import { pdeResidual, pdeRoots, pdeZ } from "../sim/mathii";
import { LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { MATHII_SPECS } from "../meta/mathii.specs";
import { C, Orb, Pillar, Surface, Sway, buildSurface, fmt, ramp, type V3 } from "./mathii-kit";

const XH = 2, YH = 3, SX = 1.5, SY = 1, HT = 1.7;

export default function HomoPdeLab() {
  const [P, set, reset] = useLabParams(MATHII_SPECS.homopde);
  const { A, B, C: Cc, px, py } = P;
  const r = pdeRoots(A, B, Cc);
  const zmax = useMemo(() => {
    let m = 1e-9;
    for (let i = 0; i <= 24; i++) for (let j = 0; j <= 24; j++) m = Math.max(m, Math.abs(pdeZ(A, B, Cc, -XH + (2 * XH * i) / 24, -YH + (2 * YH * j) / 24)));
    return m;
  }, [A, B, Cc]);
  const geo = useMemo(() => buildSurface({
    n: 57, x0: -XH, x1: XH, y0: -YH, y1: YH, sx: SX, sy: SY,
    h: (x, y) => (pdeZ(A, B, Cc, x, y) / zmax) * HT,
    col: (x, y) => ramp(0.5 + (0.5 * pdeZ(A, B, Cc, x, y)) / zmax),
  }), [A, B, Cc, zmax]);
  const lines = useMemo(() => {
    if (r.kind === "elliptic") return [] as { p: V3[]; c: string }[];
    const ms: [number, string][] = r.kind === "hyperbolic" ? [[r.m1[0], C.gold], [r.m2[0], C.white]] : [[r.m1[0], C.gold]];
    const out: { p: V3[]; c: string }[] = [];
    for (const [m, col] of ms) for (let k = -8; k <= 8; k += 1.5) {
      const pts: V3[] = [];
      for (let i = 0; i <= 40; i++) { const x = -XH + (2 * XH * i) / 40, y = k - m * x; if (Math.abs(y) <= YH) pts.push([x * SX, 0.03, -y * SY]); }
      if (pts.length > 1) out.push({ p: pts, c: col });
    }
    return out;
  }, [r.kind, r.m1, r.m2]);
  const z = pdeZ(A, B, Cc, px, py), res = pdeResidual(A, B, Cc, px, py);
  const cn = (c: [number, number]) => (Math.abs(c[1]) < 1e-9 ? fmt(c[0], 3) : `${fmt(c[0], 3)} ${c[1] < 0 ? "−" : "+"} ${Math.abs(c[1]).toFixed(3)}i`);
  const kindTxt = r.kind === "hyperbolic" ? "Hyperbolic (B² − 4AC > 0): real distinct roots" : r.kind === "parabolic" ? "Parabolic (B² − 4AC = 0): equal roots" : "Elliptic (B² − 4AC < 0): complex roots";
  const cf = r.kind === "hyperbolic" ? "φ₁(y + m₁x) + φ₂(y + m₂x)" : r.kind === "parabolic" ? "φ₁(y + mx) + x·φ₂(y + mx)" : "φ₁(y + (α + iβ)x) + φ₂(y + (α − iβ)x)";
  return (
    <LabFrame
      label="A coloured wavy surface that is the complementary function of a homogeneous linear partial differential equation, with gold and white characteristic lines on the floor along which it is constant, and a probe pillar"
      camera={[0, 5.2, 8.4]}
      onReset={reset}
      scene={() => (<group>
        <Sway amp={0.3}>
          <group position={[0, -0.6, 0]}>
            <Surface geo={geo} opacity={0.95} />
            {lines.map((l, i) => <Line key={i} points={l.p} color={l.c} lineWidth={1.8} />)}
            <Pillar x={px * SX} z={-py * SY} h={(z / zmax) * HT} c={C.white} />
            <Orb p={[px * SX, (z / zmax) * HT, -py * SY]} r={0.13} c={C.gold} />
            <gridHelper args={[10, 20, "#3d5560", "#26363d"]} position={[0, -0.02, 0]} />
          </group>
        </Sway>
      </group>)}
      readouts={[
        ["Auxiliary equation", `${fmt(A, 2)}m² ${B < 0 ? "−" : "+"} ${Math.abs(B).toFixed(2)}m ${Cc < 0 ? "−" : "+"} ${Math.abs(Cc).toFixed(2)} = 0`],
        ["Discriminant B² − 4AC", fmt(r.disc, 3)],
        ["Type", kindTxt],
        ["Roots m₁, m₂", `${cn(r.m1)} ; ${cn(r.m2)}`],
        ["Complementary function", cf],
        ["A zxx + B zxy + C zyy at the probe", Math.abs(res) < 5e-3 * (1 + Math.abs(z)) ? "≈ 0 ✓" : fmt(res, 5)],
      ]}
      controls={<>
        <Slider label="A (coefficient of D², i.e. ∂²z/∂x²)" value={A} min={0.5} max={3} step={0.1} digits={1} onChange={(v) => set("A", v)} />
        <Slider label="B (coefficient of DD′, i.e. ∂²z/∂x∂y)" value={B} min={-8} max={8} step={0.1} digits={1} onChange={(v) => set("B", v)} />
        <Slider label="C (coefficient of D′², i.e. ∂²z/∂y²)" value={Cc} min={-9} max={9} step={0.1} digits={1} onChange={(v) => set("C", v)} />
        <Slider label="Probe x" value={px} min={-2} max={2} step={0.05} digits={2} onChange={(v) => set("px", v)} />
        <Slider label="Probe y" value={py} min={-3} max={3} step={0.05} digits={2} onChange={(v) => set("py", v)} />
      </>}
      note={<p>For a <b>homogeneous linear PDE with constant coefficients</b>, (AD² + BDD′ + CD′²)z = 0 with D = ∂/∂x, D′ = ∂/∂y, try z = φ(y + mx). Each D becomes m and each D′ becomes 1, so m must satisfy <b>Am² + Bm + C = 0</b>. Distinct roots give z = φ₁(y + m₁x) + φ₂(y + m₂x); equal roots give φ₁(y + mx) + xφ₂(y + mx); complex roots give complex arguments (use real and imaginary parts, as the surface does). The surface here uses φ = sin: it is constant along the gold and white lines y + mx = const, which are the <b>characteristics</b> (they exist only in the hyperbolic case). B² − 4AC &gt; 0, = 0, &lt; 0 classify the equation as hyperbolic (wave), parabolic (heat) or elliptic (Laplace). PYQ Q4.4: ∂²z/∂x² − 3∂²z/∂x∂y + 2∂²z/∂y² has m = 1, 2; (D² − 6DD′ + 9D′²) has the double root 3. PYQ Q4.1 runs the other way: z = f₁(y + 2x) + f₂(y − 3x) comes from m² + m − 6 = 0, i.e. r + s − 6t = 0.</p>}
    />
  );
}
