"use client";
import { useRef } from "react";
import type * as THREE from "three";
import { boxModel, type BoxSizing } from "../sim/life";
import { Tick } from "../Stage";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { LIFE_SPECS } from "../meta/life.specs";

export default function BoxModelLab() {
  const [P, set, reset] = useLabParams(LIFE_SPECS.boxmodel);
  const { w, h, pad, bor, mar, sizing } = P;
  const B = boxModel(w, h, pad, bor, mar, sizing);
  const s = Math.min(5 / B.outerW, 3.1 / B.outerH);
  const grp = useRef<THREE.Group>(null), t = useRef(0);
  const tick = (dt: number) => { t.current += Math.min(dt, 0.05); grp.current?.rotation.set(-0.45, 0.5 * Math.sin(t.current * 0.6), 0); };
  const layers: { w: number; h: number; d: number; c: string; o: number }[] = [
    { w: B.outerW, h: B.outerH, d: 0.1, c: "#ff9a1f", o: 0.35 }, { w: B.borderW, h: B.borderH, d: 0.3, c: "#ffc83d", o: 1 },
    { w: B.paddingW, h: B.paddingH, d: 0.5, c: "#44c95a", o: 1 }, { w: Math.max(B.contentW, 1), h: Math.max(B.contentH, 1), d: 0.7, c: "#2ba6f5", o: 1 },
  ];
  return (
    <LabFrame
      label="A slowly swaying stack of four nested slabs: the blue content in the middle, then green padding, a gold border and a translucent orange margin, each one wider and lower than the one inside"
      camera={[0, 0.6, 8]}
      onReset={reset}
      scene={() => (<group>
        <Tick fn={tick} />
        <group ref={grp}>
          {layers.map((l, i) => (<mesh key={i} position={[0, 0, l.d / 2 - 0.35 + (i === 0 ? -0.05 : 0)]}><boxGeometry args={[l.w * s, l.h * s, l.d]} /><meshStandardMaterial color={l.c} transparent={l.o < 1} opacity={l.o} roughness={0.5} depthWrite={l.o === 1} /></mesh>))}
        </group>
      </group>)}
      readouts={[
        ["Content box", `${B.contentW} × ${B.contentH} px`], ["Padding box", `${B.paddingW} × ${B.paddingH} px`], ["Border box (rendered size)", `${B.borderW} × ${B.borderH} px`],
        ["Margin box (space taken)", `${B.outerW} × ${B.outerH} px`], ["Padding + border added", `${B.extra} px on each axis`], ["CSS", B.css],
      ]}
      controls={<>
        <Slider label="width" value={w} min={40} max={400} step={1} digits={0} unit=" px" onChange={(x) => set("w", x)} />
        <Slider label="height" value={h} min={40} max={300} step={1} digits={0} unit=" px" onChange={(x) => set("h", x)} />
        <Slider label="padding" value={pad} min={0} max={60} step={1} digits={0} unit=" px" onChange={(x) => set("pad", x)} />
        <Slider label="border-width" value={bor} min={0} max={30} step={1} digits={0} unit=" px" onChange={(x) => set("bor", x)} />
        <Slider label="margin" value={mar} min={0} max={60} step={1} digits={0} unit=" px" onChange={(x) => set("mar", x)} />
        <Pick<BoxSizing> label="box-sizing" value={sizing} options={[{ id: "content", label: "content-box (default)" }, { id: "border", label: "border-box" }]} onChange={(x) => set("sizing", x)} />
      </>}
      note={<p>Every HTML element is a stack of boxes: the blue content, then green padding, then the gold border, then the orange margin that keeps neighbours away. With box-sizing: content-box (the default) the width and height you write are the content only, so padding and border make the element bigger than you asked for; with border-box, width and height include the padding and border, and the content shrinks instead. That is why many stylesheets start with * &#123; box-sizing: border-box; &#125;. The margin is outside the element&apos;s own box, so it never changes its rendered size. The slabs are drawn to scale relative to each other (the picture is scaled down to fit) and the CSS line is what would produce this box. Vertical margins between neighbouring blocks can collapse in real pages; that is not modelled here.</p>}
    />
  );
}
