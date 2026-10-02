"use client";
import { useMemo } from "react";
import { partial } from "../sim/extra";
import { Axes, Ball, C, Panel, Poly, pieces, type V3 } from "../kit";
import { LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { EXTRA_SPECS } from "../meta/extra.specs";

const X0 = -3.2, XW = 6.4, CLIP = 3.5, YS = 0.55;
const sx = (x: number) => X0 + ((x + 4) / 8) * XW, sy = (y: number) => Math.max(-CLIP, Math.min(CLIP, y)) * YS;
function trace(f: (x: number) => number, roots: number[], z: number, c: string, w: number) {
  const pts: (V3 | null)[] = [];
  for (let i = 0; i <= 400; i++) {
    const x = -4 + (i / 400) * 8, y = f(x);
    pts.push(roots.some((r) => Math.abs(x - r) < 0.02) || !Number.isFinite(y) || Math.abs(y) > CLIP ? null : [sx(x), sy(y), z]);
  }
  return pieces(pts).map((p, i) => <Poly key={`${c}${i}`} pts={p} c={c} w={w} />);
}
const num2 = (v: number) => (Number.isFinite(v) ? v.toFixed(4) : "undefined");

export default function PartialFracLab() {
  const [P, set, reset] = useLabParams(EXTRA_SPECS.partialfrac);
  const { p, q, r1, x0 } = P;
  const r2 = P.r2 === r1 ? r1 + 0.5 : P.r2; // the two roots must differ
  const F = partial(p, q, r1, r2);
  const roots = [r1, r2];
  const curves = useMemo(() => (
    <>
      {trace((x) => F.whole(x), roots, 0.05, C.gold, 5)}
      {trace((x) => F.A / (x - r1), roots, 0.1, C.blue, 2.4)}
      {trace((x) => F.B / (x - r2), roots, 0.1, C.red, 2.4)}
      {trace((x) => F.sum(x), roots, 0.15, C.green, 2)}
    </>
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ), [p, q, r1, r2]);
  const w = F.whole(x0), s = F.sum(x0);
  return (
    <LabFrame
      label="A wide gold curve of a rational function, thinner blue and red curves for its two partial fractions, and a green curve of their sum lying exactly on the gold one, with a marker at the chosen x"
      camera={[0, 0.2, 6.3]}
      animated={false}
      onReset={reset}
      scene={() => (
        <group>
          <Panel p={[0, 0, -0.2]} w={7.2} h={4.6} />
          <Axes x0={X0} y0={0} w={XW} h={0} c={C.grey} />
          <Poly pts={[[sx(0), -2.2, 0], [sx(0), 2.2, 0]]} c={C.grey} w={1.2} />
          {roots.map((r, i) => <Poly key={i} pts={[[sx(r), -2.2, 0.02], [sx(r), 2.2, 0.02]]} c={C.purple} w={1.2} />)}
          {curves}
          {Number.isFinite(w) && Math.abs(w) <= CLIP && <Ball p={[sx(x0), sy(w), 0.2]} r={0.11} c={C.orange} glow={0.6} />}
        </group>
      )}
      readouts={[
        ["A (cover-up at r₁)", num2(F.A)],
        ["B (cover-up at r₂)", num2(F.B)],
        ["Root r₂ used", String(r2)],
        ["Original at x₀", num2(w)],
        ["A/(x₀−r₁) + B/(x₀−r₂)", num2(s)],
      ]}
      controls={<>
        <Slider label="Numerator coefficient p" value={p} min={-9} max={9} step={1} digits={0} onChange={(x) => set("p", x)} />
        <Slider label="Numerator constant q" value={q} min={-9} max={9} step={1} digits={0} onChange={(x) => set("q", x)} />
        <Slider label="Root r₁" value={r1} min={-5} max={5} step={0.5} digits={1} onChange={(x) => set("r1", x)} />
        <Slider label="Root r₂" value={P.r2} min={-5} max={5} step={0.5} digits={1} onChange={(x) => set("r2", x)} />
        <Slider label="Test point x₀" value={x0} min={-4} max={4} step={0.25} digits={2} onChange={(x) => set("x0", x)} />
      </>}
      note={<p>The original fraction (px + q)/((x − r₁)(x − r₂)) is drawn in thick gold. Split it as A/(x − r₁) + B/(x − r₂): blue and red. The cover-up rule gives A = (p·r₁ + q)/(r₁ − r₂), covering (x − r₁) and putting x = r₁ into the rest, and B = (p·r₂ + q)/(r₂ − r₁). The green curve, the sum of the two pieces, lies exactly on the gold one, and the last two readouts agree at any x₀ (unless x₀ is a root, where both are undefined). Purple lines are the vertical asymptotes. If you set the two roots equal, this lab moves r₂ up by 0.5, because equal roots need a different form. Curves clip at ±3.5.</p>}
    />
  );
}
