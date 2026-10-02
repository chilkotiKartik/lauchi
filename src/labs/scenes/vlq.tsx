"use client";
import { useMemo } from "react";
import { vlqDecode, vlqEncode } from "../sim/webb";
import { C, Instances, Panel, type Inst } from "../kit";
import { LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { WEBB_SPECS } from "../meta/webb.specs";

export default function VlqLab() {
  const [P, set, reset] = useLabParams(WEBB_SPECS.vlq);
  const n = Math.round(P.n), o = vlqEncode(n);
  const items = useMemo<Inst[]>(() => vlqEncode(Math.round(P.n)).groups.flatMap((g, gi) => Array.from({ length: 6 }, (_, k) => {
    const bit = (g.bits >> (5 - k)) & 1, cont = k === 0, h = bit ? 1 : 0.15;
    return { p: [-2.6 + gi * 2.6 + k * 0.38, h / 2 - 0.4, 0], s: [0.3, h, 0.4], c: cont ? C.red : C.blue } as Inst;
  })), [P.n]);
  const bin = (v: number, w: number) => v.toString(2).padStart(w, "0");
  return (
    <LabFrame
      label="Groups of six blocks, one group per base64 character of the encoded number: tall blocks are 1 bits and short blocks are 0 bits, and the first block of each group is red for the continuation bit"
      camera={[0, 0.3, 6.4]}
      animated={false}
      onReset={reset}
      scene={() => (<group><Panel p={[0, 0.1, -0.5]} w={7.8} h={3} /><Instances items={items} cap={18} /></group>)}
      readouts={[
        ["Number", String(n)],
        ["Sign moved to the lowest bit", `${o.zigzag} = ${bin(o.zigzag, 1)}`],
        ["6-bit groups (continuation, then 5 bits)", o.groups.map((g) => bin(g.bits, 6)).join(" ")],
        ["Base64 VLQ text", o.text],
        ["Decodes back to", String(vlqDecode(o.text))],
      ]}
      controls={<Slider label="Number to encode" value={n} min={-1000} max={1000} step={1} digits={0} onChange={(x) => set("n", Math.round(x))} />}
      note={<p>Source maps let a browser show your TypeScript (or other compile-to-JS code) while running the compiled JavaScript. They record positions as small signed numbers in base64 VLQ (variable-length quantity). First the sign moves to the lowest bit (value × 2, plus 1 if negative). Then the number is cut into 5-bit pieces, lowest first; each piece gets a sixth bit, the red continuation bit, that says another piece follows. Each 6-bit group maps to one base64 letter. Small numbers take one character, which keeps map files short. Tall blocks are 1s and short blocks are 0s.</p>}
    />
  );
}
