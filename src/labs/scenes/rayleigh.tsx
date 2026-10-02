"use client";
import { Line } from "@react-three/drei";
import { useMemo } from "react";
import { doubletProfile, nmHex, rayleigh } from "../sim/phyx";
import { LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { PHYX_SPECS } from "../meta/phyx.specs";
import { C, Box, type V3 } from "../kit";
import { Flow, Graph, Pulse } from "../kit2";

export default function RayleighLab() {
  const [P, set, reset] = useLabParams(PHYX_SPECS.rayleigh);
  const { N, dlam, lam, lpm, m } = P;
  const r = rayleigh(lam, dlam, lpm, N, Math.round(m));
  const prof = useMemo(() => doubletProfile(lam, dlam, r.dNm, N, Math.round(m)), [lam, dlam, r.dNm, N, m]);
  const c1 = nmHex(lam), c2 = nmHex(lam + dlam);
  // on-screen spot spacing: separation measured in units of one peak half-width (Rayleigh limit = 1)
  const sep = Math.min(1.6, 0.35 * Math.max(0.05, r.sepSin / r.halfWidthSin));
  const beamIn = useMemo<V3[]>(() => [[-6, 0, 0], [-3.6, 0, 0]], []);
  const slits = Array.from({ length: 13 }, (_, i) => -1.2 + i * 0.2);
  return (
    <LabFrame
      label="Light enters a diffraction grating from the left; two close wavelengths leave at slightly different angles and land as two spots on a screen, while a graph shows whether their peaks are resolved"
      camera={[0, 0.6, 9.5]}
      onReset={reset}
      scene={() => (<group>
        <Flow path={beamIn} n={14} speed={0.6} color={C.gold} r={0.06} />
        <Line points={beamIn} color={C.gold} lineWidth={2} />
        {slits.map((y) => <Box key={y} p={[-3.5, y, 0]} s={[0.06, 0.12, 1]} c={C.light} />)}
        <Box p={[-3.5, 0, 0]} s={[0.03, 2.8, 1.2]} c={C.dark} o={0.5} />
        <Line points={[[-3.45, 0, 0], [-0.6, 0.9 - sep / 2, 0]]} color={c1} lineWidth={2.4} />
        <Line points={[[-3.45, 0, 0], [-0.6, 0.9 + sep / 2, 0]]} color={c2} lineWidth={2.4} />
        <Line points={[[-3.45, 0, 0], [-0.6, -0.9, 0]]} color={C.grey} lineWidth={1.2} dashed dashSize={0.1} gapSize={0.08} />
        <Box p={[-0.5, 0, 0]} s={[0.08, 3.4, 1.4]} c="#e8f1f5" o={0.9} />
        <Pulse p={[-0.42, 0.9 - sep / 2, 0]} color={c1} r={0.12} />
        <Pulse p={[-0.42, 0.9 + sep / 2, 0]} color={c2} r={0.12} />
        <Graph x0={0.4} y0={-1.6} w={4.4} h={3.2} xr={[-0.5, 0.5]} yr={[0, 1.05]}
          curves={[{ pts: prof, color: r.ratio >= 0.98 ? C.green : C.orange, w: 3 }]} vlines={[{ x: 0, color: C.light }]} />
      </group>)}
      readouts={[
        ["Needed λ/dλ", r.needed.toFixed(0)],
        ["Grating gives R = mN", `${Math.round(m)} × ${N.toFixed(0)} = ${r.have.toFixed(0)}`],
        ["Verdict", r.status],
        ["Angle of line 1", r.visible ? `${r.th1.toFixed(3)}°` : "—"],
        ["Angular separation Δθ", r.visible ? `${(r.dThetaDeg * 3600).toFixed(1)}″ (arc-seconds)` : "—"],
        ["Highest order that forms", String(r.maxOrder)],
      ]}
      controls={<>
        <Slider label="Lines illuminated N" value={N} min={50} max={3000} step={10} digits={0} onChange={(x) => set("N", x)} />
        <Slider label="Line separation dλ" value={dlam} min={0.05} max={5} step={0.05} digits={2} unit=" nm" onChange={(x) => set("dlam", x)} />
        <Slider label="Wavelength λ" value={lam} min={400} max={700} step={1} digits={0} unit=" nm" onChange={(x) => set("lam", x)} />
        <Slider label="Ruling density" value={lpm} min={100} max={1200} step={10} digits={0} unit=" lines/mm" onChange={(x) => set("lpm", x)} />
        <Slider label="Order m" value={m} min={1} max={3} step={1} digits={0} onChange={(x) => set("m", x)} />
      </>}
      note={<p>A grating with N illuminated lines makes principal maxima where d sin θ = mλ, each with a half-width (to its first zero) of Δ(sin θ) = λ/(Nd). Two lines λ and λ + dλ are <b>just resolved</b> (Rayleigh) when the maximum of one falls on the first minimum of the other, which happens when the resolving power λ/dλ equals mN. So more lines or a higher order separate closer lines; the ruling density changes the angles but not the resolving power. The graph shows the sum of the two patterns near order m (horizontal axis zoomed to the doublet); a dip between two peaks means you can see two lines. The spots on the screen are drawn with exaggerated spacing.</p>}
    />
  );
}
