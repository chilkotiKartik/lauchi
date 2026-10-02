"use client";
import { useMemo } from "react";
import { mm } from "../sim/extra";
import { Axes, Ball, C, Panel, Poly, type V3 } from "../kit";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { EXTRA_SPECS } from "../meta/extra.specs";

const GX = 6, GY = 3, SMAX = 200, X0 = -3.2, Y0 = -1.6, YTOP = 200;
const sx = (s: number) => X0 + (s / SMAX) * GX, sy = (v: number) => Y0 + Math.min(1, v / YTOP) * GY;

export default function EnzymeLab() {
  const [P, set, reset] = useLabParams(EXTRA_SPECS.enzyme);
  const { S, Vmax, Km, I, Ki, mode } = P;
  const o = mm(S, Vmax, Km, I, Ki, mode);
  const free = useMemo<V3[]>(() => Array.from({ length: 81 }, (_, i) => { const s = (i / 80) * SMAX; return [sx(s), sy(mm(s, Vmax, Km, 0, 1, "none").v), 0.05] as V3; }), [Vmax, Km]);
  const inh = useMemo<V3[]>(() => Array.from({ length: 81 }, (_, i) => { const s = (i / 80) * SMAX; return [sx(s), sy(mm(s, Vmax, Km, I, Ki, mode).v), 0.1] as V3; }), [Vmax, Km, I, Ki, mode]);
  const pct = o.free > 0 ? (1 - o.v / o.free) * 100 : 0;
  return (
    <LabFrame
      label="A graph of reaction rate against substrate concentration with a green uninhibited curve, a red inhibited curve, gold lines for Vmax and Km, and a marker at the chosen substrate concentration"
      camera={[0, 0.4, 6.4]}
      animated={false}
      onReset={reset}
      scene={() => (
        <group>
          <Panel p={[0, 0.1, -0.2]} w={7.4} h={4.2} />
          <Axes x0={X0} y0={Y0} w={GX + 0.2} h={GY + 0.2} />
          <Poly pts={[[X0, sy(Vmax), 0.02], [X0 + GX, sy(Vmax), 0.02]]} c={C.gold} w={1.5} />
          <Poly pts={[[X0, sy(o.vmaxApp), 0.03], [X0 + GX, sy(o.vmaxApp), 0.03]]} c={C.orange} w={1.5} />
          <Poly pts={[[sx(o.kmApp), Y0, 0.03], [sx(o.kmApp), sy(o.vmaxApp / 2), 0.03], [X0, sy(o.vmaxApp / 2), 0.03]]} c={C.purple} w={1.6} />
          <Poly pts={free} c={C.green} w={3} />
          <Poly pts={inh} c={C.red} w={3} />
          <Poly pts={[[sx(S), Y0, 0.08], [sx(S), sy(o.v), 0.08]]} c={C.blue} w={1.6} />
          <Ball p={[sx(S), sy(o.v), 0.12]} r={0.14} c={C.blue} glow={0.6} />
          <Ball p={[sx(S), sy(o.free), 0.12]} r={0.1} c={C.green} glow={0.4} />
        </group>
      )}
      readouts={[
        ["Rate v at this S", o.v.toFixed(1)],
        ["Rate with no inhibitor", o.free.toFixed(1)],
        ["Apparent Vmax", o.vmaxApp.toFixed(1)],
        ["Apparent Km", o.kmApp.toFixed(1)],
        ["Rate lost to inhibitor", `${pct.toFixed(0)}%`],
      ]}
      controls={<>
        <Slider label="Substrate [S]" value={S} min={0} max={200} step={5} digits={0} unit=" mM" onChange={(x) => set("S", x)} />
        <Slider label="Vmax" value={Vmax} min={10} max={200} step={5} digits={0} onChange={(x) => set("Vmax", x)} />
        <Slider label="Km" value={Km} min={1} max={100} step={1} digits={0} unit=" mM" onChange={(x) => set("Km", x)} />
        <Pick label="Inhibitor type" value={mode} options={[{ id: "none", label: "None" }, { id: "competitive", label: "Competitive" }, { id: "noncompetitive", label: "Non-competitive" }, { id: "uncompetitive", label: "Uncompetitive" }]} onChange={(v) => set("mode", v)} />
        <Slider label="Inhibitor [I]" value={I} min={0} max={100} step={1} digits={0} unit=" mM" onChange={(x) => set("I", x)} />
        <Slider label="Inhibition constant Ki" value={Ki} min={1} max={50} step={1} digits={0} unit=" mM" onChange={(x) => set("Ki", x)} />
      </>}
      note={<p>Michaelis–Menten: v = Vmax[S]/(Km + [S]). Green is the free enzyme, red is with the inhibitor; the gold line is Vmax, the orange line the apparent Vmax and the purple lines mark the apparent Km, the substrate level at half the apparent Vmax. With α = 1 + [I]/Ki, a competitive inhibitor multiplies Km by α and leaves Vmax; a non-competitive inhibitor divides Vmax by α and leaves Km; an uncompetitive inhibitor divides both Vmax and Km by α. Values are in arbitrary rate units; the plot is clipped at 200.</p>}
    />
  );
}
