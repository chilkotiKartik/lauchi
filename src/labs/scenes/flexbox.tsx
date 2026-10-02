"use client";
import { flexLayout } from "../sim/weba";
import { Box, C, Floor, Panel, Poly } from "../kit";
import { Check, LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { WEBA_SPECS } from "../meta/weba.specs";

const PAL = [C.blue, C.green, C.gold, C.purple, C.orange, C.red, C.light, C.blue];
const S = 6.4 / 800;

export default function FlexboxLab() {
  const [P, set, reset] = useLabParams(WEBA_SPECS.flexbox);
  const n = Math.round(P.n), o = flexLayout(P.W, n, P.basis, P.grow, P.shrink, P.gap, P.wrap);
  const left = -(P.W * S) / 2, gapS = P.gap * S;
  let idx = 0;
  const rows = o.lines.map((line, r) => {
    let x = left;
    return line.map((w) => {
      const item = { i: idx++, x: x + (w * S) / 2, y: 0.9 - r * 0.72, w, over: x + w * S > left + P.W * S + 1e-6 };
      x += w * S + gapS;
      return item;
    });
  });
  const H = 0.75 + (o.lines.length - 1) * 0.72;
  return (
    <LabFrame
      label="A thin outlined flex container with coloured item blocks laid out to scale in one or more rows; blocks that poke out past the container edge are red"
      camera={[0, 0.5, 6.6]}
      animated={false}
      onReset={reset}
      scene={() => (
        <group>
          <Floor size={12} y={-1.4} divisions={12} />
          <Panel p={[0, 0.5, -0.6]} w={7.4} h={3.8} />
          <Poly pts={[[left, 1.35, 0.35], [-left, 1.35, 0.35], [-left, 1.35 - H, 0.35], [left, 1.35 - H, 0.35], [left, 1.35, 0.35]]} c={C.light} w={2} />
          {rows.flat().map((it) => <Box key={it.i} p={[it.x, it.y, 0]} s={[Math.max(0.02, it.w * S), 0.55, 0.5]} c={it.over ? C.red : PAL[it.i % PAL.length]} glow={0.25} />)}
        </group>
      )}
      readouts={[
        ["Width of the first item", `${o.lines[0][0].toFixed(1)} px`],
        ["Free space before flex", `${o.free.toFixed(0)} px`],
        ["Rows (lines)", String(o.lines.length)],
        ["Overflow past container", `${o.overflow.toFixed(1)} px`],
        ["Items on first row", String(o.lines[0].length)],
      ]}
      controls={<>
        <Slider label="Container width" value={P.W} min={100} max={800} step={10} digits={0} unit=" px" onChange={(x) => set("W", x)} />
        <Slider label="Number of items" value={n} min={1} max={8} step={1} digits={0} onChange={(x) => set("n", Math.round(x))} />
        <Slider label="flex-basis" value={P.basis} min={0} max={300} step={10} digits={0} unit=" px" onChange={(x) => set("basis", x)} />
        <Slider label="flex-grow" value={P.grow} min={0} max={3} step={1} digits={0} onChange={(x) => set("grow", Math.round(x))} />
        <Slider label="flex-shrink" value={P.shrink} min={0} max={3} step={1} digits={0} onChange={(x) => set("shrink", Math.round(x))} />
        <Slider label="gap" value={P.gap} min={0} max={40} step={2} digits={0} unit=" px" onChange={(x) => set("gap", x)} />
        <Check label="flex-wrap: wrap" checked={P.wrap} onChange={(v) => set("wrap", v)} />
      </>}
      note={<p>All items are equal, so the maths is clean. The free space is the container width minus the items&apos; flex-basis and the gaps. If it is positive and flex-grow is above 0, the free space is shared out, so each item gets basis + free/n. If it is negative and flex-shrink is above 0 each item shrinks by an equal share (shrink is weighted by basis, which is equal here); with shrink 0 the row overflows the container (red). With wrap, each row holds as many items as fit and grows on its own. Content sizes and min-width are ignored, and growing with different factors is not modelled.</p>}
    />
  );
}
