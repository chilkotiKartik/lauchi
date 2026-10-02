"use client";
import { useMemo } from "react";
import { beam, bendStress } from "../sim/mechx";
import { LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { MECHX_SPECS } from "../meta/mechx.specs";
import { C, Box, type V3 } from "../kit";
import { Arrow, Graph, Rod } from "../kit2";

export default function BeamLab() {
  const [P, set, reset] = useLabParams(MECHX_SPECS.beam);
  const { w, u1, u2, W, a, L, b, d } = P;
  const aa = Math.min(a, L), lo = Math.min(Math.min(u1, u2), L), hi = Math.min(Math.max(u1, u2), L);
  const r = useMemo(() => beam(L, W, aa, w, lo, hi), [L, W, aa, w, lo, hi]);
  const X = (x: number) => -4 + (8 * x) / L;
  const sfd = useMemo(() => Array.from({ length: 241 }, (_, i) => { const x = (L * i) / 240; return [x, r.V(x)] as [number, number]; }), [r, L]);
  const bmd = useMemo(() => Array.from({ length: 241 }, (_, i) => { const x = (L * i) / 240; return [x, r.M(x)] as [number, number]; }), [r, L]);
  const shape = useMemo<V3[]>(() => r.defl.map((y, i) => [-4 + (8 * i) / r.n, 1.4 + 0.45 * y, 0] as V3), [r]);
  const vmax = Math.max(1, r.Vmax) * 1.15, mmax = Math.max(1, Math.abs(r.Mmax)) * 1.15;
  const udlArrows = useMemo(() => { const out: number[] = []; if (w > 0 && hi > lo) for (let x = lo; x <= hi + 1e-9; x += Math.max(0.25, (hi - lo) / 10)) out.push(x); return out; }, [w, lo, hi]);
  return (
    <LabFrame
      label="A simply supported beam drawn as its exaggerated deflected shape with load arrows, and below it the shear force diagram and bending moment diagram"
      camera={[0, 0, 11]}
      animated={false}
      onReset={reset}
      scene={() => (<group>
        <Rod a={[-4, 1.4, 0]} b={[4, 1.4, 0]} r={0.02} color={C.grey} />
        {shape.slice(1).map((p, i) => <Rod key={i} a={shape[i]} b={p} r={0.12} color={C.light} />)}
        <mesh position={[-4, 1.05, 0]}><coneGeometry args={[0.25, 0.4, 3]} /><meshStandardMaterial color={C.green} /></mesh>
        <mesh position={[4, 1.1, 0]}><sphereGeometry args={[0.18, 16, 16]} /><meshStandardMaterial color={C.green} /></mesh>
        {W > 0 && <Arrow from={[X(aa), 3.2, 0]} to={[X(aa), 1.6, 0]} color={C.red} />}
        {udlArrows.map((x) => <Arrow key={x} from={[X(x), 2.4, 0]} to={[X(x), 1.6, 0]} color={C.gold} r={0.025} head={0.16} />)}
        {w > 0 && hi > lo && <Box p={[(X(lo) + X(hi)) / 2, 2.45, 0]} s={[X(hi) - X(lo), 0.05, 0.05]} c={C.gold} />}
        <Graph x0={-4} y0={-1.3} w={8} h={1.6} xr={[0, L]} yr={[-vmax, vmax]} curves={[{ pts: sfd, color: C.blue, w: 3 }]} />
        <Graph x0={-4} y0={-3.6} w={8} h={1.6} xr={[0, L]} yr={[Math.min(0, -mmax * 0.1), mmax]} curves={[{ pts: bmd, color: C.purple, w: 3 }]} marker={[r.xM, r.Mmax]} />
      </group>)}
      readouts={[
        ["Reaction R_A", `${r.RA.toFixed(2)} kN`],
        ["Reaction R_B", `${r.RB.toFixed(2)} kN`],
        ["Maximum bending moment", `${r.Mmax.toFixed(2)} kN·m`],
        ["…at x (zero shear)", `${r.xM.toFixed(2)} m`],
        ["Maximum shear force", `${r.Vmax.toFixed(2)} kN`],
        ["Max bending stress (b × d section)", `${bendStress(r.Mmax, b, d).toFixed(2)} N/mm²`],
      ]}
      controls={<>
        <Slider label="UDL intensity w" value={w} min={0} max={50} step={0.5} digits={1} unit=" kN/m" onChange={(x) => set("w", x)} />
        <Slider label="UDL starts at" value={u1} min={0} max={20} step={0.1} digits={1} unit=" m" onChange={(x) => set("u1", x)} />
        <Slider label="UDL ends at" value={u2} min={0} max={20} step={0.1} digits={1} unit=" m" onChange={(x) => set("u2", x)} />
        <Slider label="Point load W" value={W} min={0} max={200} step={1} digits={0} unit=" kN" onChange={(x) => set("W", x)} />
        <Slider label="Point load position a" value={a} min={0} max={20} step={0.1} digits={1} unit=" m" onChange={(x) => set("a", x)} />
        <Slider label="Span L" value={L} min={2} max={20} step={0.5} digits={1} unit=" m" onChange={(x) => set("L", x)} />
        <Slider label="Section width b" value={b} min={50} max={500} step={10} digits={0} unit=" mm" onChange={(x) => set("b", x)} />
        <Slider label="Section depth d" value={d} min={100} max={1000} step={10} digits={0} unit=" mm" onChange={(x) => set("d", x)} />
      </>}
      note={<p>Reactions come from ΣM = 0 about each support. The <b>shear force</b> at a section is the sum of vertical forces on one side: it drops by W at a point load and falls linearly (slope −w) under a UDL. The <b>bending moment</b> is the sum of moments on one side; since dM/dx = V, M is greatest where the shear crosses zero (marked). Point loads give straight-line BMDs and UDLs give parabolas (wL²/8 for a full span). Bending stress σ = My/I with I = bd³/12. The deflected shape (top) comes from integrating EI y″ = M twice and is exaggerated. Positions beyond the span are clipped to it.</p>}
    />
  );
}
