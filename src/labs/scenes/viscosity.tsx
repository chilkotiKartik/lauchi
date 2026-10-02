"use client";
import { useMemo } from "react";
import { couette, shearStress, type FluidKind } from "../sim/mechy";
import { useQuality } from "../Stage";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { MECHY_SPECS } from "../meta/mechy.specs";
import { Box, type V3 } from "../kit";
import { Arrow, C, Flow, Graph, mix, type XY } from "../kit2";

const KINDS: { id: FluidKind; label: string; color: string }[] = [
  { id: "newtonian", label: "Newtonian (water, oil, air)", color: C.blue },
  { id: "thinning", label: "Shear-thinning, n = 0.5 (paint, blood)", color: C.green },
  { id: "thickening", label: "Shear-thickening, n = 1.5 (cornflour in water)", color: C.orange },
  { id: "bingham", label: "Bingham plastic, τ_y = 20 Pa (toothpaste)", color: C.purple },
];
const X0 = -4.6, X1 = -0.4, BOT = -1.6;

/** τ = f(du/dy) sampled until it leaves the graph. */
function rheo(kind: FluidKind, mu: number, xmax: number, ymax: number): XY[] {
  const out: XY[] = [];
  for (let i = 0; i <= 60; i++) {
    const x = (xmax * i) / 60, y = kind === "bingham" && i === 0 ? 0 : shearStress(kind, mu, x);
    if (kind === "bingham" && i === 1) out.push([0, shearStress(kind, mu, 1e-9)]);
    if (y > ymax) { if (out.length) out.push([x, ymax]); break; }
    out.push([x, y]);
  }
  return out;
}

export default function ViscosityLab() {
  const quality = useQuality();
  const [P, set, reset] = useLabParams(MECHY_SPECS.viscosity);
  const { u, y, mu, A, rho, kind } = P;
  const c = couette(kind, mu, u, y, A, rho);
  const gap = 0.7 + 2.1 * Math.sqrt(y / 10), top = BOT + gap;
  const layers = quality === "low" ? 5 : 8;
  const paths = useMemo(() => Array.from({ length: layers }, (_, i) => { const yy = BOT + ((i + 0.5) / layers) * gap; return [[X0, yy, 0], [X1, yy, 0]] as V3[]; }), [layers, gap]);
  const xmax = 2 * c.rate, ymax = 2.2 * c.tau;
  const curves = useMemo(() => KINDS.map((k) => ({ pts: rheo(k.id, mu, xmax, ymax), color: k.color, w: k.id === kind ? 3.4 : 1.6, dashed: k.id !== kind })), [mu, xmax, ymax, kind]);
  const spd = Math.min(1.2, 0.08 + u * 0.25);
  const col = KINDS.find((k) => k.id === kind)?.color ?? C.blue;
  return (
    <LabFrame
      label="A thin fluid film between a fixed bottom plate and a top plate dragged sideways: fluid layers slide faster the higher they are, giving a straight-line velocity profile, beside a graph of shear stress against velocity gradient for Newtonian and non-Newtonian fluids"
      camera={[-0.4, 0.4, 9.6]}
      onReset={reset}
      scene={() => (<group>
        <group rotation={[0.25, 0.15, 0]}>
          <Box p={[(X0 + X1) / 2, BOT - 0.12, 0]} s={[X1 - X0 + 0.6, 0.24, 1.6]} c={C.dark} />
          {Array.from({ length: 9 }, (_, i) => <Box key={i} p={[X0 + 0.1 + i * 0.5, BOT - 0.26, 0.82]} s={[0.05, 0.12, 0.05]} c={C.grey} />)}
          <Box p={[(X0 + X1) / 2, top + 0.09, 0]} s={[X1 - X0 + 0.2, 0.18, 1.5]} c={C.gold} glow={0.25} />
          <Box p={[(X0 + X1) / 2, (BOT + top) / 2, 0]} s={[X1 - X0, gap, 1.4]} c={col} o={0.18} />
          {paths.map((p, i) => <Flow key={i} path={p} n={10} speed={spd * ((i + 0.5) / layers)} color={mix(C.blue, C.white, (i + 0.5) / layers)} r={0.07} />)}
          <Flow path={[[X0, top + 0.2, 0.76], [X1, top + 0.2, 0.76]]} n={8} speed={spd} color={C.orange} r={0.06} />
          {paths.map((p, i) => { const f = (i + 0.5) / layers; return f * 1.4 > 0.12 ? <Arrow key={i} from={[X0 - 0.05, p[0][1], 0.75]} to={[X0 - 0.05 + 1.4 * f, p[0][1], 0.75]} color={C.green} r={0.025} head={0.12} /> : null; })}
          <Arrow from={[X1 - 0.2, top + 0.5, 0]} to={[X1 + 0.7, top + 0.5, 0]} color={C.red} r={0.05} />
        </group>
        <Graph x0={0.6} y0={-1.9} w={4.2} h={3.8} xr={[0, xmax]} yr={[0, ymax]} curves={curves} marker={[c.rate, c.tau]} markerColor={C.red} />
      </group>)}
      readouts={[
        ["Velocity gradient du/dy", `${c.rate.toFixed(1)} s⁻¹`],
        ["Shear stress τ", `${c.tau.toFixed(3)} Pa`],
        ["Force to drag the plate F = τA", `${c.F.toFixed(3)} N`],
        ["Power F·u", `${(c.F * u).toFixed(3)} W`],
        ["Apparent viscosity τ/(du/dy)", `${c.apparent.toFixed(4)} Pa·s`],
        ["Kinematic viscosity ν = μ/ρ", `${(c.nu * 1e4).toFixed(4)} stokes (${c.nu.toExponential(2)} m²/s)`],
      ]}
      controls={<>
        <Slider label="Plate speed u" value={u} min={0.05} max={5} step={0.01} digits={2} unit=" m/s" onChange={(x) => set("u", x)} />
        <Slider label="Film thickness y" value={y} min={0.05} max={10} step={0.01} digits={2} unit=" mm" onChange={(x) => set("y", x)} />
        <Slider label="Viscosity μ (or consistency K)" value={mu} min={0.001} max={2} step={0.001} digits={3} unit=" Pa·s" onChange={(x) => set("mu", x)} />
        <Slider label="Plate area A" value={A} min={0.01} max={2} step={0.01} digits={2} unit=" m²" onChange={(x) => set("A", x)} />
        <Slider label="Fluid density ρ" value={rho} min={700} max={1300} step={1} digits={0} unit=" kg/m³" onChange={(x) => set("rho", x)} />
        <Pick label="Type of fluid" value={kind} options={KINDS.map((k) => ({ id: k.id, label: k.label }))} onChange={(x) => set("kind", x)} />
      </>}
      note={<>
        <p>The fluid touching each plate sticks to it (no-slip), so the bottom layer is still and the top layer moves at u. In between, each layer slides over the one below, and the fluid resists with a shear stress. <b>Newton&apos;s law of viscosity:</b> <b>τ = μ·du/dy</b>; for a thin film the velocity profile is a straight line (green arrows) and du/dy = u/y. Kinematic viscosity ν = μ/ρ (1 stoke = 10⁻⁴ m²/s).</p>
        <p className="mt-2">Fluids that obey this (straight line through the origin, blue) are <b>Newtonian</b>. <b>Non-Newtonian</b> fluids do not: shear-thinning ones (τ = K(du/dy)ⁿ, n &lt; 1) get runnier as you stir faster, shear-thickening ones (n &gt; 1) stiffen, and a <b>Bingham plastic</b> will not flow at all until τ exceeds its yield stress. An <b>ideal fluid</b> would have μ = 0 (no line at all). Textbook check (R.K. Bansal): an 0.8 m × 0.8 m plate sliding at 0.3 m/s on a 1.5 mm oil film with 150 N driving it has μ ≈ 1.17 Pa·s.</p>
      </>}
    />
  );
}
