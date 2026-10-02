"use client";
import { ATP_DG0, deltaG, qEq } from "../sim/extra";
import { Axes, Box, C, Floor, Panel, Poly } from "../kit";
import { Check, LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { EXTRA_SPECS } from "../meta/extra.specs";

const SC = 1.6 / 60; // scene units per kJ/mol
const kj = (v: number) => `${v > 0 ? "+" : ""}${v.toFixed(1)} kJ/mol`;

function Column({ x, v, c }: { x: number; v: number; c?: string }) {
  const h = Math.max(0.03, Math.abs(v) * SC), col = c ?? (v > 0 ? C.red : C.green);
  return <Box p={[x, (v > 0 ? 1 : -1) * (h / 2), 0]} s={[0.8, h, 0.8]} c={col} glow={0.25} />;
}

export default function BioenergyLab() {
  const [P, set, reset] = useLabParams(EXTRA_SPECS.bioenergy);
  const { dG0, logQ, T, logQatp, couple } = P;
  const dG = deltaG(dG0, T, logQ);
  const atp = deltaG(ATP_DG0, T, logQatp);
  const net = dG + atp;
  const shown = couple ? net : dG;
  const logEq = Math.log10(qEq(dG0, T));
  return (
    <LabFrame
      label="Columns rising above or falling below a zero line for the free energy change of a reaction, of ATP hydrolysis and of the coupled pair, red when positive and green when negative, with a balance that tips toward spontaneous"
      camera={[0, 0.5, 6.8]}
      animated={false}
      onReset={reset}
      scene={() => (
        <group>
          <Floor size={12} y={-1.9} divisions={12} />
          <Panel p={[-1.3, 0, -0.6]} w={5.4} h={3.9} />
          <Axes x0={-3.6} y0={0} w={4.6} h={0} c={C.light} />
          <Column x={-2.6} v={dG} />
          <Column x={-1.3} v={atp} c={couple ? C.blue : C.grey} />
          <Column x={0} v={net} c={couple ? undefined : C.grey} />
          <group position={[3.1, 0.4, 0]}>
            <mesh rotation={[0, 0, shown > 0 ? 0.28 : -0.28]}><boxGeometry args={[2.6, 0.1, 0.5]} /><meshStandardMaterial color={C.gold} /></mesh>
            <mesh position={[0, -0.55, 0]}><coneGeometry args={[0.3, 0.9, 4]} /><meshStandardMaterial color={C.grey} /></mesh>
            <Box p={[shown > 0 ? -1.15 : 1.15, shown > 0 ? 0.55 : 0.55, 0]} s={[0.5, 0.5, 0.5]} c={shown > 0 ? C.red : C.green} glow={0.4} />
            <Poly pts={[[-1.3, -1.2, 0], [1.3, -1.2, 0]]} c={C.purple} w={2} />
          </group>
        </group>
      )}
      readouts={[
        ["ΔG of the reaction", kj(dG)],
        ["ΔG of ATP hydrolysis", kj(atp)],
        ["Net ΔG if coupled", kj(net)],
        ["Runs by itself?", shown < 0 ? "Yes (ΔG < 0)" : "No (ΔG > 0)"],
        ["log₁₀ Q at equilibrium", logEq.toFixed(2)],
      ]}
      controls={<>
        <Slider label="Standard ΔG°′" value={dG0} min={-60} max={40} step={1} digits={1} unit=" kJ/mol" onChange={(x) => set("dG0", x)} />
        <Slider label="log₁₀ Q of the reaction" value={logQ} min={-6} max={6} step={0.1} digits={1} onChange={(x) => set("logQ", x)} />
        <Slider label="Temperature T" value={T} min={273} max={330} step={1} digits={0} unit=" K" onChange={(x) => set("T", x)} />
        <Slider label="log₁₀ ([ADP][Pi]/[ATP])" value={logQatp} min={-6} max={0} step={0.1} digits={1} onChange={(x) => set("logQatp", x)} />
        <Check label="Couple the reaction to ATP hydrolysis" checked={couple} onChange={(v) => set("couple", v)} />
      </>}
      note={<p>ΔG = ΔG°′ + RT ln Q. A reaction is spontaneous when ΔG is negative (green column below the line) and uphill when positive (red column above it). ATP hydrolysis has ΔG°′ = −30.5 kJ/mol, and in a cell, where [ADP][Pi]/[ATP] is small, it is even more negative. Turn on coupling and the two ΔG values add: a reaction with +13.8 kJ/mol becomes −16.7 kJ/mol overall at standard conditions, so it runs. The balance tips to the green side when the total is negative. Free energy says whether a reaction can run, not how fast; enzymes decide the speed.</p>}
    />
  );
}
