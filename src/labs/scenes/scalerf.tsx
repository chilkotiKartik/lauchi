"use client";
import { SCALES, SCALE_TEXT, SHEETS, scaleFit, type ScaleId, type SheetId } from "../sim/gfx";
import { Box, C, Floor, Panel } from "../kit";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { GFX_SPECS } from "../meta/gfx.specs";

const K = 0.0105; // scene units per millimetre of sheet
const SHEET_H = { a4: 210, a3: 297, a2: 420 } as const;

export default function ScaleRfLab() {
  const [P, set, reset] = useLabParams(GFX_SPECS.scalerf);
  const scale = P.scale as ScaleId, sheet = P.sheet as SheetId;
  const o = scaleFit(P.len, scale, sheet);
  const W = SHEETS[sheet] * K, H = SHEET_H[sheet] * K, bar = Math.min(o.drawn * K, W * 1.3);
  return (
    <LabFrame
      label="A white drawing sheet with a dark border on a table and a coloured bar across it for the drawn length, green when it fits inside the border and red when it runs off the sheet"
      camera={[0, 3.2, 5.6]}
      animated={false}
      onReset={reset}
      scene={() => (
        <group>
          <Floor size={12} y={-0.06} divisions={12} />
          <Box p={[0, 0, 0]} s={[W, 0.06, H]} c={C.white} />
          <Box p={[0, 0.035, 0]} s={[W - 0.21, 0.02, H - 0.21]} c="#c9d8df" />
          <Box p={[-W / 2 + 0.105 + bar / 2, 0.14, 0]} s={[bar, 0.14, 0.24]} c={o.fits ? C.green : C.red} glow={0.3} />
          <Panel p={[0, 1.1, -H / 2 - 0.1]} w={W + 0.6} h={2} c="#23404c" />
        </group>
      )}
      readouts={[
        ["Scale", `${SCALE_TEXT[scale]}, RF = ${o.rf}`],
        ["Length on the drawing", `${o.drawn.toFixed(1)} mm`],
        ["Usable width on the sheet", `${o.usable} mm`],
        ["Fits?", o.fits ? "Yes" : "No, too long"],
        ["Best standard scale", `${o.bestText} (${o.bestDrawn.toFixed(0)} mm)`],
      ]}
      controls={<>
        <Slider label="Real length" value={P.len} min={1} max={50000} step={100} digits={0} unit=" mm" onChange={(x) => set("len", x)} />
        <Pick label="Drawing scale" value={scale} options={(Object.keys(SCALES) as ScaleId[]).map((k) => ({ id: k, label: SCALE_TEXT[k] }))} onChange={(v) => set("scale", v)} />
        <Pick label="Sheet size" value={sheet} options={[{ id: "a4", label: "A4 (210 × 297 mm)" }, { id: "a3", label: "A3 (297 × 420 mm)" }, { id: "a2", label: "A2 (420 × 594 mm)" }]} onChange={(v) => set("sheet", v)} />
      </>}
      note={<p>The representative fraction RF = length on the drawing ÷ real length. At 1:10 (RF = 0.1) a 2400 mm wall is drawn 240 mm long; at 5:1 (RF = 5) a small part is drawn five times bigger. Standard reduction scales are 1:2, 1:5, 1:10, 1:20, 1:50, 1:100 and so on, and enlargement scales 2:1, 5:1, 10:1. The bar runs across the sheet along its long side; the border is assumed to be 10 mm on each side, so the usable width is the sheet length minus 20 mm. The best standard scale is the largest one that still fits. If the bar is too long the picture cuts it off.</p>}
    />
  );
}
