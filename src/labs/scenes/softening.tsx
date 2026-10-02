"use client";
import { useMemo } from "react";
import { breakthrough, ionExchange, limeSoda } from "../sim/chemx";
import { useQuality } from "../Stage";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { CHEMX_SPECS } from "../meta/chemx.specs";
import { C, Bars, Box, Instances, type Inst, type V3 } from "../kit";
import { Flow, Graph, Rod, sample } from "../kit2";
import { prng } from "../sim/physics";

function beads(x: number, col: string, used: number, n: number): Inst[] {
  const r = prng(Math.round(x * 10) + 5), out: Inst[] = [];
  for (let i = 0; i < n; i++) {
    const y = 1.6 - (i / n) * 3.2, a = r() * 6.28, rr = Math.sqrt(r()) * 0.5;
    out.push({ p: [x + Math.cos(a) * rr, y + (r() - 0.5) * 0.08, Math.sin(a) * rr], s: [0.16, 0.16, 0.16], c: i / n < used ? "#7a8c95" : col });
  }
  return out;
}

export default function SofteningLab() {
  const q = useQuality();
  const [P, set, reset] = useLabParams(CHEMX_SPECS.softening);
  const { ca, mg, pca, pmg, vol, resin, cap, m3, mode } = P;
  const ix = ionExchange(ca + pca, mg + pmg, resin, cap);
  const ls = limeSoda(ca, mg, pca, pmg, 0, m3);
  const used = Math.min(1, vol / Math.max(1, ix.breakthroughL));
  const out = breakthrough(vol, ix.breakthroughL) * ix.hard;
  const n = q === "low" ? 70 : 140;
  const cation = useMemo(() => beads(-2.6, C.blue, used, n), [used, n]);
  const anion = useMemo(() => beads(-0.6, C.gold, used, n), [used, n]);
  const pipe = useMemo<V3[]>(() => [[-2.6, 3, 0], [-2.6, -2.2, 0], [-1.6, -2.2, 0], [-0.6, -2.2, 0], [-0.6, 2.2, 0], [0.4, 2.2, 0]], []);
  const curve = sample((v) => breakthrough(v, ix.breakthroughL) * 100, 0, 40000, 120);
  const ion = mode === "ion";
  return (
    <LabFrame
      label={ion ? "Two ion-exchange columns full of resin beads; water flows down the cation column and up the anion column, beads turn grey from the top as the resin is used up, and a graph shows the breakthrough curve" : "A lime–soda reactor with bars comparing the lime and soda needed"}
      camera={[0.6, 0.6, 9.5]}
      onReset={reset}
      scene={() => (<group>
        {ion ? (<>
          <Rod a={[-2.6, -1.9, 0]} b={[-2.6, 1.9, 0]} r={0.65} color="#e8f1f5" o={0.18} />
          <Rod a={[-0.6, -1.9, 0]} b={[-0.6, 1.9, 0]} r={0.65} color="#e8f1f5" o={0.18} />
          <Instances items={cation} cap={140} shape="sphere" />
          <Instances items={anion} cap={140} shape="sphere" />
          <Flow path={pipe} n={22} speed={0.18} color={out > ix.hard * 0.1 ? C.orange : "#7fc8f8"} r={0.07} />
          <Graph x0={1.2} y0={-2} w={3.8} h={3.6} xr={[0, 40000]} yr={[0, 105]} curves={[{ pts: curve, color: C.orange, w: 3 }]} marker={[vol, breakthrough(vol, ix.breakthroughL) * 100]} vlines={[{ x: Math.min(40000, ix.breakthroughL), color: C.red }]} />
        </>) : (<>
          <Rod a={[-2, -1.6, 0]} b={[-2, 1.8, 0]} r={1.3} color="#7fc8f8" o={0.3} />
          <Instances items={beads(-2, "#e8f1f5", 0, Math.min(140, Math.round(20 + ls.total / 2)))} cap={140} shape="sphere" />
          <Box p={[-2, 2.2, 0]} s={[0.12, 1.2, 0.12]} c={C.light} />
          <Bars values={[ls.limeKg, ls.sodaKg]} max={Math.max(0.5, ls.limeKg, ls.sodaKg)} colors={[C.green, C.purple]} x0={1} y0={-1.6} w={0.9} gap={0.6} height={3.2} />
        </>)}
      </group>)}
      readouts={ion ? [
        ["Total hardness (as CaCO₃)", `${ix.hard.toFixed(0)} mg/L`],
        ["Resin capacity", `${(ix.capacityG / 1000).toFixed(2)} kg CaCO₃`],
        ["Breakthrough after", `${ix.breakthroughL.toFixed(0)} L`],
        ["Resin used", `${(used * 100).toFixed(0)} %`],
        ["Outlet hardness now", `${out.toFixed(1)} mg/L`],
        ["HCl to regenerate (ideal)", `${ix.hclKg.toFixed(2)} kg`],
      ] : [
        ["Temporary hardness", `${ls.temp.toFixed(0)} mg/L`],
        ["Permanent hardness", `${ls.perm.toFixed(0)} mg/L`],
        ["Lime per litre (pure)", `${ls.lime.toFixed(1)} mg`],
        ["Soda per litre (pure)", `${ls.soda.toFixed(1)} mg`],
        ["Lime for the batch (90 %)", `${ls.limeKg.toFixed(3)} kg`],
        ["Soda for the batch (95 %)", `${ls.sodaKg.toFixed(3)} kg`],
      ]}
      controls={<>
        <Slider label="Ca²⁺ hardness (temporary)" value={ca} min={0} max={500} step={1} digits={0} unit=" ppm" onChange={(x) => set("ca", x)} />
        <Slider label="Mg²⁺ hardness (temporary)" value={mg} min={0} max={400} step={1} digits={0} unit=" ppm" onChange={(x) => set("mg", x)} />
        <Slider label="Ca²⁺ hardness (permanent)" value={pca} min={0} max={400} step={1} digits={0} unit=" ppm" onChange={(x) => set("pca", x)} />
        <Slider label="Mg²⁺ hardness (permanent)" value={pmg} min={0} max={300} step={1} digits={0} unit=" ppm" onChange={(x) => set("pmg", x)} />
        <Pick label="Process" value={mode} options={[{ id: "ion", label: "Ion exchange (demineraliser)" }, { id: "lime", label: "Lime–soda (cold)" }]} onChange={(x) => set("mode", x)} />
        <Slider label="Water passed" value={vol} min={0} max={40000} step={100} digits={0} unit=" L" onChange={(x) => set("vol", x)} />
        <Slider label="Resin volume" value={resin} min={10} max={500} step={5} digits={0} unit=" L" onChange={(x) => set("resin", x)} />
        <Slider label="Resin capacity" value={cap} min={20} max={80} step={1} digits={0} unit=" g/L" onChange={(x) => set("cap", x)} />
        <Slider label="Batch for lime–soda" value={m3} min={1} max={500} step={1} digits={0} unit=" m³" onChange={(x) => set("m3", x)} />
      </>}
      note={<p>All hardness is expressed as mg/L of CaCO₃. <b>Ion exchange:</b> the cation resin swaps H⁺ for Ca²⁺/Mg²⁺ (2R–H + Ca²⁺ → R₂Ca + 2H⁺) and the anion resin swaps OH⁻ for Cl⁻/SO₄²⁻/HCO₃⁻, so H⁺ + OH⁻ → H₂O. Beads turn grey from the top as they fill; when the exchange front reaches the bottom, hardness <b>breaks through</b> (orange water) and the beds are regenerated with dilute HCl and NaOH. <b>Lime–soda:</b> lime = 74/100 × (temp. Ca + 2 × temp. Mg + perm. Mg) and soda = 106/100 × (perm. Ca + perm. Mg), per litre, scaled for purity. The breakthrough curve shape is schematic.</p>}
    />
  );
}
