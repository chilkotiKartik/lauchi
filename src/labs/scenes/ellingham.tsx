"use client";
import { useMemo } from "react";
import { dG, ellingham, OXIDES, REDUCERS, type OxideId, type ReducerId } from "../sim/chemx";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { CHEMX_SPECS } from "../meta/chemx.specs";
import { C, Box, type V3 } from "../kit";
import { Flow, Graph, Rod, mix, sample } from "../kit2";

const OX_COL: Record<OxideId, string> = { feo: C.red, zno: C.purple, al2o3: C.blue, mgo: C.green, cu2o: C.orange, nio: C.light };

export default function EllinghamLab() {
  const [P, set, reset] = useLabParams(CHEMX_SPECS.ellingham);
  const { T, ox, red } = P;
  const e = ellingham(ox, red, T);
  const curves = useMemo(() => [
    ...(Object.keys(OXIDES) as OxideId[]).filter((k) => k !== ox).map((k) => ({ pts: sample((t) => dG(OXIDES[k], t), 300, 2200, 60), color: "#3d5560", w: 1.2 })),
    { pts: sample((t) => dG(OXIDES[ox], t), 300, 2200, 80), color: OX_COL[ox], w: 3.4 },
    { pts: sample((t) => dG(REDUCERS[red], t), 300, 2200, 40), color: C.gold, w: 3 },
  ], [ox, red]);
  const heat = (T - 300) / 1900;
  const flame = useMemo<V3[]>(() => [[-4.6, -1.6, 0], [-4.6, 1.4, 0]], []);
  return (
    <LabFrame
      label="An Ellingham diagram of standard Gibbs energy of oxide formation against temperature, with the chosen metal-oxide line, the carbon line and a vertical temperature marker, beside a furnace that glows hotter as temperature rises"
      camera={[0, 0, 9.6]}
      onReset={reset}
      scene={() => (<group>
        <group>
          <Rod a={[-4.6, -2.1, 0]} b={[-4.6, 1.9, 0]} r={0.75} color={C.dark} o={0.55} />
          <Rod a={[-4.6, -2, 0]} b={[-4.6, 1.2, 0]} r={0.55} color={mix("#5a1a0a", "#fff1a0", heat)} glow={0.3 + heat} o={0.85} />
          <Flow path={flame} n={10} speed={0.3 + heat} color={mix(C.orange, C.gold, heat)} r={0.08} />
          {e.feasible && <Box p={[-4.6, -1.85, 0]} s={[0.9, 0.25, 0.9]} c="#c8d3d9" glow={0.6} />}
        </group>
        <Graph x0={-3} y0={-2.3} w={7.2} h={4.6} xr={[300, 2200]} yr={[-1300, 0]} curves={curves}
          vlines={[{ x: T, color: C.white }, ...(e.cross ? [{ x: e.cross, color: C.green }] : [])]} marker={[T, dG(OXIDES[ox], T)]} markerColor={OX_COL[ox]} />
      </group>)}
      readouts={[
        ["ΔG° of oxide line", `${e.gOx.toFixed(0)} kJ/mol O₂`],
        ["ΔG° of reducer line", `${e.gRed.toFixed(0)} kJ/mol O₂`],
        ["ΔG° of reduction", `${e.gReduction.toFixed(0)} kJ/mol O₂`],
        ["Reduction possible?", e.feasible ? "Yes (ΔG° < 0)" : "No at this temperature"],
        ["Crossover temperature", e.cross ? `${e.cross} K` : "not below 2500 K"],
        ["Temperature", `${T.toFixed(0)} K (${(T - 273).toFixed(0)} °C)`],
      ]}
      controls={<>
        <Slider label="Temperature T" value={T} min={300} max={2200} step={10} digits={0} unit=" K" onChange={(x) => set("T", x)} />
        <Pick label="Metal oxide" value={ox} options={(Object.keys(OXIDES) as OxideId[]).map((k) => ({ id: k, label: OXIDES[k].name }))} onChange={(x) => set("ox", x)} />
        <Pick label="Reducing agent" value={red} options={(Object.keys(REDUCERS) as ReducerId[]).map((k) => ({ id: k, label: REDUCERS[k].name }))} onChange={(x) => set("red", x)} />
      </>}
      note={<p>Each line is ΔG° = ΔH° − TΔS° for forming an oxide from one mole of O₂. Most metal lines slope <b>up</b> because a gas (O₂) is used up (ΔS &lt; 0); the 2C + O₂ → 2CO line slopes <b>down</b> because it makes more gas. A reducing agent can reduce a metal oxide where its line lies <b>below</b> the oxide’s line: then ΔG° for the coupled reaction (reducer oxidised, metal oxide reduced) is negative. That is why coke reduces iron oxide in a blast furnace above ~1000 K, while Al₂O₃ and MgO need electrolysis. Kinks appear where a metal melts or boils and ΔS changes (the Zn and Mg lines bend up). Lines are straight-line fits to textbook data, so read them to about ±20 kJ.</p>}
    />
  );
}
