"use client";
import { useMemo } from "react";
import { cycles, cyclePath } from "../sim/mechx";
import { LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { MECHX_SPECS } from "../meta/mechx.specs";
import { C, Bars } from "../kit";
import { Graph } from "../kit2";

export default function DualCycleLab() {
  const [P, set, reset] = useLabParams(MECHX_SPECS.dualcycle);
  const { r, q, rp, T1 } = P;
  const c = cycles(r, q, rp, T1);
  const paths = useMemo(() => ({ o: cyclePath("Otto", r, q, rp, T1), di: cyclePath("Diesel", r, q, rp, T1), du: cyclePath("Dual", r, q, rp, T1) }), [r, q, rp, T1]);
  const pmax = Math.max(...paths.o.map((p) => p[1])) * 1.08;
  return (
    <LabFrame
      label="Three air-standard cycles drawn on one pressure–volume diagram (Otto gold, Dual purple, Diesel blue), with bars comparing their efficiencies"
      camera={[0.4, 0.3, 10]}
      animated={false}
      onReset={reset}
      scene={() => (<group>
        <Graph x0={-4.8} y0={-2.2} w={6.4} h={4.4} xr={[0, 1.05]} yr={[0, pmax]} curves={[{ pts: paths.di, color: C.blue, w: 2.6 }, { pts: paths.du, color: C.purple, w: 2.6 }, { pts: paths.o, color: C.gold, w: 2.6 }]} />
        <Bars values={[c.otto.eta, c.dual.eta, c.diesel.eta]} max={80} colors={[C.gold, C.purple, C.blue]} x0={2.4} y0={-2.2} w={0.6} gap={0.35} height={4.2} />
      </group>)}
      readouts={[
        ["Otto efficiency", `${c.otto.eta.toFixed(2)} %`],
        ["Dual efficiency", `${c.dual.eta.toFixed(2)} %`],
        ["Diesel efficiency", `${c.diesel.eta.toFixed(2)} %`],
        ["Peak pressure (Otto / Dual / Diesel)", `${(c.otto.pmax / 1000).toFixed(1)} / ${(c.dual.pmax / 1000).toFixed(1)} / ${(c.diesel.pmax / 1000).toFixed(1)} MPa`],
        ["MEP (Otto / Dual / Diesel)", `${c.otto.mep.toFixed(0)} / ${c.dual.mep.toFixed(0)} / ${c.diesel.mep.toFixed(0)} kPa`],
        ["Ranking", [c.otto, c.dual, c.diesel].sort((a, b) => b.eta - a.eta).map((x) => x.name).join(" > ")],
      ]}
      controls={<>
        <Slider label="Compression ratio r" value={r} min={5} max={22} step={0.1} digits={1} onChange={(x) => set("r", x)} />
        <Slider label="Heat added per kg q" value={q} min={300} max={2500} step={10} digits={0} unit=" kJ/kg" onChange={(x) => set("q", x)} />
        <Slider label="Dual: pressure ratio at constant volume" value={rp} min={1} max={3} step={0.05} digits={2} onChange={(x) => set("rp", x)} />
        <Slider label="Intake temperature T₁" value={T1} min={250} max={350} step={1} digits={0} unit=" K" onChange={(x) => set("T1", x)} />
      </>}
      note={<p>All three cycles share isentropic compression, isentropic expansion and constant-volume heat rejection; they differ in how heat is added. <b>Otto</b>: all at constant volume (η = 1 − 1/r<sup>γ−1</sup>). <b>Diesel</b>: all at constant pressure (η = 1 − [1/(γr<sup>γ−1</sup>)](ρ<sup>γ</sup> − 1)/(ρ − 1)). <b>Dual</b>: part at constant volume (pressure ratio set by the slider), the rest at constant pressure. For the <b>same r and heat input</b>, Otto rejects the least heat, so Otto &gt; Dual &gt; Diesel. For the same peak pressure and temperature the order reverses, which is why real diesel engines, running at much higher r, are more efficient. Air-standard: γ = 1.4, c<sub>v</sub> = 0.718 kJ/kg·K, p₁ = 100 kPa; volume is shown as a fraction of V₁.</p>}
    />
  );
}
