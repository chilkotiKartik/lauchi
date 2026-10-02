"use client";
import { useMemo } from "react";
import { VP, vpSolve, vpU, vpX, type VpId } from "../sim/mathii";
import { LabFrame, Slider, Pick } from "../ui";
import { useLabParams } from "../params";
import { MATHII_SPECS } from "../meta/mathii.specs";
import { Graph, type XY } from "../kit2";
import { C, Sway, fmt } from "./mathii-kit";

const NP = 60;
const scale = (v: number[]) => { const m = Math.max(1e-9, ...v.filter(Number.isFinite).map(Math.abs)); return m; };
const toPts = (xs: number[], v: number[], m: number): XY[] => xs.flatMap((x, i) => (Number.isFinite(v[i]) ? [[x, v[i] / m] as XY] : []));

export default function VarParamLab() {
  const [P, set, reset] = useLabParams(MATHII_SPECS.varparam);
  const { s, eq, c1, c2 } = P;
  const e = VP[eq], x = vpX(eq, s);
  const d = useMemo(() => {
    const xs = Array.from({ length: NP + 1 }, (_, i) => e.xmin + ((e.xmax - e.xmin) * i) / NP);
    const y1 = xs.map(e.y1), y2 = xs.map(e.y2), R = xs.map(e.R);
    const yp = xs.map((q) => { const [u1, u2] = vpU(e, q); return u1 * e.y1(q) + u2 * e.y2(q); });
    return { xs, y1, y2, R, yp };
  }, [e]);
  const sol = vpSolve(eq, x, c1, c2);
  const tot = d.xs.map((_, i) => c1 * d.y1[i] + c2 * d.y2[i] + d.yp[i]);
  const m1 = scale(d.y1), m2 = scale(d.y2), mR = scale(d.R), mp = scale(d.yp), mt = scale(tot);
  const xr: [number, number] = [e.xmin, e.xmax], yr: [number, number] = [-1.15, 1.15];
  return (
    <LabFrame
      label="Four stacked graph panels standing one behind the other: the two homogeneous solutions, the forcing term, the particular solution found by variation of parameters and the complete solution, each with a marker at the chosen x"
      camera={[0, 2.6, 10]}
      onReset={reset}
      scene={() => (<group>
        <Sway amp={0.3}>
          <group rotation={[0, -0.62, 0]} position={[-0.6, -2.2, 0]}>
            <Graph x0={-2.4} y0={0} w={4.8} h={1.5} z={-3.3} xr={xr} yr={yr} grid={4} bg="#16303b"
              curves={[{ pts: toPts(d.xs, d.y1, m1), color: C.blue, w: 3 }, { pts: toPts(d.xs, d.y2, m2), color: C.purple, w: 3 }]} marker={[x, Math.max(-1.15, Math.min(1.15, e.y1(x) / m1))]} markerColor={C.blue} vlines={[{ x, color: C.light }]} />
            <Graph x0={-2.4} y0={1.9} w={4.8} h={1.5} z={-1.1} xr={xr} yr={yr} grid={4} bg="#2a2417"
              curves={[{ pts: toPts(d.xs, d.R, mR), color: C.orange, w: 3 }]} marker={[x, Math.max(-1.15, Math.min(1.15, e.R(x) / mR))]} markerColor={C.orange} vlines={[{ x, color: C.light }]} />
            <Graph x0={-2.4} y0={3.8} w={4.8} h={1.5} z={1.1} xr={xr} yr={yr} grid={4} bg="#2a2a17"
              curves={[{ pts: toPts(d.xs, d.yp, mp), color: C.gold, w: 3 }]} marker={[x, Math.max(-1.15, Math.min(1.15, sol.yp / mp))]} markerColor={C.gold} vlines={[{ x, color: C.light }]} />
            <Graph x0={-2.4} y0={5.7} w={4.8} h={1.5} z={3.3} xr={xr} yr={yr} grid={4} bg="#173023"
              curves={[{ pts: toPts(d.xs, tot, mt), color: C.green, w: 3.4 }]} marker={[x, Math.max(-1.15, Math.min(1.15, sol.y / mt))]} markerColor={C.green} vlines={[{ x, color: C.light }]} />
          </group>
        </Sway>
      </group>)}
      readouts={[
        ["Wronskian W(y₁, y₂)", fmt(sol.W, 4)],
        ["u₁ = −∫ y₂R/W dx", fmt(sol.u1, 4)],
        ["u₂ = ∫ y₁R/W dx", fmt(sol.u2, 4)],
        ["Particular yₚ = u₁y₁ + u₂y₂", fmt(sol.yp, 4)],
        ["General y = c₁y₁ + c₂y₂ + yₚ", fmt(sol.y, 4)],
        ["ODE residual yₚ″ + ayₚ′ + byₚ − R", Math.abs(sol.residual) < 5e-4 * (1 + Math.abs(e.R(x))) ? "≈ 0 ✓" : fmt(sol.residual, 5)],
      ]}
      controls={<>
        <Slider label="Position x along the interval" value={s} min={0} max={1} step={0.01} digits={2} onChange={(v) => set("s", v)} />
        <Pick label="Equation y″ + ay′ + by = R(x)" value={eq} options={(Object.keys(VP) as VpId[]).map((k) => ({ id: k, label: VP[k].label }))} onChange={(v) => set("eq", v)} />
        <Slider label="Constant c₁" value={c1} min={-2} max={2} step={0.05} digits={2} onChange={(v) => set("c1", v)} />
        <Slider label="Constant c₂" value={c2} min={-2} max={2} step={0.05} digits={2} onChange={(v) => set("c2", v)} />
      </>}
      note={<p>For y″ + ay′ + by = R(x) first find the complementary function y<sub>c</sub> = c₁y₁ + c₂y₂ ({e.cf} here, x = {fmt(x, 2)}). <b>Variation of parameters</b> then lets the constants vary: y<sub>p</sub> = u₁y₁ + u₂y₂ with u₁ = −∫ y₂R/W dx, u₂ = ∫ y₁R/W dx and W = y₁y₂′ − y₂y₁′ (the Wronskian, never zero for independent solutions). It works for any R, even tan x or sec x where undetermined coefficients fail (PYQ Q2.1, asked 7 times). The four panels, front to back: y₁ and y₂, the forcing R(x), the particular solution y<sub>p</sub> and the complete solution y = y<sub>c</sub> + y<sub>p</sub> (each curve scaled to fit its panel; real values in the readouts). The integrals here start at a base point, so y<sub>p</sub> differs from a textbook answer by a multiple of y<sub>c</sub>. The residual proves y<sub>p</sub> really solves the ODE.</p>}
    />
  );
}
