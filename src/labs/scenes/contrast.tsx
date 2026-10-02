"use client";
import { contrast } from "../sim/webb";
import { Box, C, Floor, Panel, Poly } from "../kit";
import { LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { WEBB_SPECS } from "../meta/webb.specs";

const rgb = (r: number, g: number, b: number) => `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`;
const hex = (r: number, g: number, b: number) => "#" + [r, g, b].map((x) => Math.round(x).toString(16).padStart(2, "0")).join("");
const yes = (b: boolean) => (b ? "Pass" : "Fail");
const yOf = (r: number) => -1.5 + (Math.min(r, 21) / 21) * 3;

export default function ContrastLab() {
  const [P, set, reset] = useLabParams(WEBB_SPECS.contrast);
  const fg: [number, number, number] = [Math.round(P.fr), Math.round(P.fg), Math.round(P.fb)], bg: [number, number, number] = [Math.round(P.br), Math.round(P.bg), Math.round(P.bb)];
  const c = contrast(fg, bg);
  const col = c.aaa ? C.green : c.aa ? C.blue : c.aaLarge ? C.orange : C.red;
  return (
    <LabFrame
      label="A large slab in the background colour with a smaller block in the text colour standing in front of it, and a tall ratio column beside coloured lines marking the 3, 4.5 and 7 pass levels"
      camera={[0, 0.4, 6.4]}
      animated={false}
      onReset={reset}
      scene={() => (
        <group>
          <Floor size={12} y={-1.55} divisions={12} />
          <Panel p={[-1.4, 0.05, -0.6]} w={5} h={3.6} c="#23404c" />
          <mesh position={[-1.4, 0.05, -0.2]}><boxGeometry args={[4.2, 3, 0.2]} /><meshBasicMaterial color={rgb(...bg)} /></mesh>
          <mesh position={[-1.4, 0.05, 0.1]}><boxGeometry args={[2.4, 1.4, 0.3]} /><meshBasicMaterial color={rgb(...fg)} /></mesh>
          <Panel p={[3, 0, -0.6]} w={2.2} h={3.8} c="#23404c" />
          <Box p={[3, (yOf(c.ratio) - 1.5) / 2 - 0.75 + 0.0, 0]} s={[0.7, Math.max(0.03, yOf(c.ratio) + 1.5), 0.7]} c={col} glow={0.35} />
          {([[3, C.orange], [4.5, C.blue], [7, C.green]] as const).map(([r, cc]) => <Poly key={r} pts={[[2.1, yOf(r), 0.5], [3.9, yOf(r), 0.5]]} c={cc} w={2.5} />)}
        </group>
      )}
      readouts={[
        ["Text colour", hex(...fg)],
        ["Background", hex(...bg)],
        ["Contrast ratio", `${c.ratio.toFixed(2)} : 1`],
        ["AA normal text (4.5)", yes(c.aa)],
        ["AA large text (3)", yes(c.aaLarge)],
        ["AAA normal / large (7 / 4.5)", `${yes(c.aaa)} / ${yes(c.aaaLarge)}`],
      ]}
      controls={<>
        <Slider label="Text red" value={P.fr} min={0} max={255} step={5} digits={0} onChange={(x) => set("fr", Math.round(x))} />
        <Slider label="Text green" value={P.fg} min={0} max={255} step={5} digits={0} onChange={(x) => set("fg", Math.round(x))} />
        <Slider label="Text blue" value={P.fb} min={0} max={255} step={5} digits={0} onChange={(x) => set("fb", Math.round(x))} />
        <Slider label="Background red" value={P.br} min={0} max={255} step={5} digits={0} onChange={(x) => set("br", Math.round(x))} />
        <Slider label="Background green" value={P.bg} min={0} max={255} step={5} digits={0} onChange={(x) => set("bg", Math.round(x))} />
        <Slider label="Background blue" value={P.bb} min={0} max={255} step={5} digits={0} onChange={(x) => set("bb", Math.round(x))} />
      </>}
      note={<p>WCAG measures readability as a ratio between the relative luminances of two colours: (L₁ + 0.05)/(L₂ + 0.05), where L = 0.2126 R + 0.7152 G + 0.0722 B after converting each channel from sRGB to linear light. The big slab is the background and the block in front is the text colour. Level AA needs 4.5:1 for normal text and 3:1 for large text (18 pt, or 14 pt bold); level AAA needs 7:1 and 4.5:1. The tall column is the ratio (capped at 21) against the orange (3), blue (4.5) and green (7) lines. Contrast is one part of accessibility; ARIA roles and keyboard support matter too.</p>}
    />
  );
}
