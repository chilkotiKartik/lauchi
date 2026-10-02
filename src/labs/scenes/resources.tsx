"use client";
import { useMemo } from "react";
import { resources, reserveAt } from "../sim/extra";
import { Bars, C, Floor, Panel, Poly, type V3 } from "../kit";
import { LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { EXTRA_SPECS } from "../meta/extra.specs";

const W = 0.4, GAP = 0.12, H = 2.4, X0 = -2.9, Y0 = -1.3;
const shade = (f: number) => (f > 0.66 ? C.green : f > 0.33 ? C.gold : f > 0 ? C.orange : C.red);
const yrs = (y: number) => (Number.isFinite(y) ? `${y.toFixed(1)} years` : "never");

export default function ResourcesLab() {
  const [P, set, reset] = useLabParams(EXTRA_SPECS.resources);
  const { R, c0, g, rec } = P;
  const out = resources(R, c0, g, rec);
  const c = c0 * (1 - rec / 100);
  const colors = out.years.map((v) => shade(v / R));
  const steady = useMemo<V3[]>(() => Array.from({ length: 11 }, (_, i) => [X0 + i * (W + GAP), Y0 + (Math.max(0, R - c0 * i * 10) / R) * H, 0.35] as V3), [R, c0]);
  const grown = useMemo<V3[]>(() => Array.from({ length: 11 }, (_, i) => [X0 + i * (W + GAP), Y0 + (reserveAt(R, c0, g / 100, i * 10) / R) * H, 0.5] as V3), [R, c0, g]);
  return (
    <LabFrame
      label="Eleven columns showing how much of a resource is left every ten years for a hundred years, colour-coded green to red, with a gold line for steady use and a blue line for growing use"
      camera={[0.5, 0.8, 6.2]}
      animated={false}
      onReset={reset}
      scene={() => (
        <group>
          <Panel p={[0, 0.1, -0.6]} w={7.4} h={3.9} />
          <Floor size={8} y={Y0} divisions={8} />
          <Bars values={out.years} max={R} colors={colors} x0={X0} y0={Y0} w={W} gap={GAP} height={H} glow={0.25} />
          <Poly pts={steady} c={C.gold} w={3} />
          <Poly pts={grown} c={C.blue} w={3} />
          <Poly pts={[[X0 - 0.3, Y0 + H, 0], [X0 + 10 * (W + GAP) + 0.3, Y0 + H, 0]]} c={C.grey} w={1.2} />
        </group>
      )}
      readouts={[
        ["Lasts at steady use", yrs(out.steady)],
        ["Lasts as use grows", yrs(out.grow)],
        ["With recycling too", yrs(out.grownRecycled)],
        ["Used up in 50 years", `${(out.used50 * 100).toFixed(0)}%`],
        ["Fresh use now", `${c.toFixed(1)} per year`],
      ]}
      controls={<>
        <Slider label="Known reserve R" value={R} min={100} max={10000} step={50} digits={0} unit=" Mt" onChange={(x) => set("R", x)} />
        <Slider label="Use per year now c₀" value={c0} min={1} max={200} step={1} digits={0} unit=" Mt/yr" onChange={(x) => set("c0", x)} />
        <Slider label="Yearly growth of use g" value={g} min={0} max={10} step={0.5} digits={1} unit=" %/yr" onChange={(x) => set("g", x)} />
        <Slider label="Recycled share" value={rec} min={0} max={80} step={5} digits={0} unit=" %" onChange={(x) => set("rec", x)} />
      </>}
      note={<p>Each column is the reserve left every 10 years, from now (left) to 100 years (right); green means plenty, gold half, orange little, red none. The gold line is the simple estimate R / c with use fixed. The blue line is the truth when use grows by g per year: the amount used in t years is c(e^(gt) − 1)/g, so the reserve is gone after ln(1 + Rg/c)/g years, much sooner. Recycling lowers the fresh material needed each year and buys time. Units are generic (Mt = million tonnes); the model ignores new discoveries and price effects.</p>}
    />
  );
}
