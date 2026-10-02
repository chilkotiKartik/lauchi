"use client";
import { useMemo } from "react";
import { speciesArea, speciesLeft } from "../sim/extra";
import { Axes, Ball, Box, C, Floor, Panel, Poly, type V3 } from "../kit";
import { LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { EXTRA_SPECS } from "../meta/extra.specs";

export default function SpeciesAreaLab() {
  const [P, set, reset] = useLabParams(EXTRA_SPECS.speciesarea);
  const { hab, z, S0 } = P;
  const f = hab / 100, o = speciesArea(S0, hab, z), keep = speciesLeft(f, z);
  const curve = useMemo<V3[]>(() => Array.from({ length: 41 }, (_, i) => { const x = i / 40; return [-0.5 + x * 2.6, -1.3 + speciesLeft(x, z) * 2.4, 0.05] as V3; }), [z]);
  const kept = 3 * f, lost = 3 - kept;
  return (
    <LabFrame
      label="A green forest slab shrinking into a red cleared area, next to columns of species kept and lost, and a curve of species against area with a gold marker"
      camera={[0.4, 1.4, 6.8]}
      animated={false}
      onReset={reset}
      scene={() => (
        <group>
          <Floor size={12} y={-1.4} divisions={12} />
          <group position={[-3.5, -1.15, 0]}>
            {kept > 0.001 && <Box p={[-1.5 + kept / 2, 0.15, 0]} s={[kept, 0.3, 1.6]} c={C.green} glow={0.15} />}
            {lost > 0.001 && <Box p={[-1.5 + kept + lost / 2, 0.08, 0]} s={[lost, 0.16, 1.6]} c={C.red} o={0.85} />}
            {Array.from({ length: 7 }, (_, i) => { const x = -1.35 + i * 0.42; return x < -1.5 + kept ? <group key={i}><Box p={[x, 0.6, -0.3 + (i % 3) * 0.3]} s={[0.12, 0.6, 0.12]} c="#8a5a2b" /><Ball p={[x, 1.05, -0.3 + (i % 3) * 0.3]} r={0.28} c={C.green} glow={0.1} /></group> : null; })}
          </group>
          <group position={[-0.5, -1.4, 0]}>
            <Box p={[-0.35, (2.4 * keep) / 2, 0]} s={[0.5, Math.max(0.03, 2.4 * keep), 0.5]} c={C.blue} glow={0.2} />
            <Box p={[0.35, 2.4 * keep + (2.4 * (1 - keep)) / 2, 0]} s={[0.5, Math.max(0.03, 2.4 * (1 - keep)), 0.5]} c={C.red} glow={0.15} o={0.9} />
            <Box p={[0.35, (2.4 * keep) / 2, 0]} s={[0.5, Math.max(0.03, 2.4 * keep), 0.5]} c={C.blue} o={0.35} />
          </group>
          <group position={[1.5, 0, 0]}>
            <Panel p={[1.05, -0.1, -0.1]} w={3.1} h={2.9} />
            <Axes x0={-0.5} y0={-1.3} w={2.7} h={2.6} c={C.light} />
            <Poly pts={curve} c={C.green} w={3} />
            <Poly pts={[[-0.5, -1.3 + keep * 2.4, 0.08], [-0.5 + f * 2.6, -1.3 + keep * 2.4, 0.08], [-0.5 + f * 2.6, -1.3, 0.08]]} c={C.gold} w={1.6} />
            <Ball p={[-0.5 + f * 2.6, -1.3 + keep * 2.4, 0.1]} r={0.13} c={C.gold} glow={0.6} />
          </group>
        </group>
      )}
      readouts={[
        ["Species left", o.S.toFixed(0)],
        ["Species lost", o.lost.toFixed(0)],
        ["Species lost", `${o.lostPct.toFixed(1)}%`],
        ["Habitat lost", `${o.habitatLostPct.toFixed(0)}%`],
      ]}
      controls={<>
        <Slider label="Habitat remaining" value={hab} min={1} max={100} step={5} digits={0} unit=" %" onChange={(x) => set("hab", x)} />
        <Slider label="Exponent z" value={z} min={0.1} max={0.4} step={0.01} digits={2} onChange={(x) => set("z", x)} />
        <Slider label="Species originally S₀" value={S0} min={10} max={10000} step={10} digits={0} onChange={(x) => set("S0", x)} />
      </>}
      note={<p>The species–area law says S = S₀(A/A₀)^z, where A/A₀ is the fraction of habitat left. Green is forest still standing, red is cleared land. The blue column is species kept and the red column on top is species lost; the curve on the right shows S/S₀ against area. Because z is well below 1 the curve is steep at the left: the first losses of habitat cost few species, but as little habitat remains species vanish quickly. Typical z is 0.15–0.35 (islands are higher). This is a forecast for an average community, not for any one species.</p>}
    />
  );
}
