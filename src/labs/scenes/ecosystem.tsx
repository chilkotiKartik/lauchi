"use client";
import { useRef } from "react";
import type * as THREE from "three";
import { NUMBERS, TROPHIC_NAMES, energyFlow, fmtNum, layerSides, pyramidValues, type PyramidKind } from "../sim/life";
import { Tick } from "../Stage";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { LIFE_SPECS } from "../meta/life.specs";

const COL = ["#44c95a", "#9be04a", "#ffc83d", "#ff9a1f", "#ff5a5f"];

export default function EcosystemLab() {
  const [P, set, reset] = useLabParams(LIFE_SPECS.ecosystem);
  const { E0, eff, levels, kind } = P;
  const n = Math.round(levels);
  const F = energyFlow(E0, eff, n);
  const vals = pyramidValues(kind, E0, eff, n), sides = layerSides(vals);
  const spin = useRef<THREE.Group>(null);
  const tick = (dt: number) => { if (spin.current) spin.current.rotation.y += Math.min(dt, 0.05) * 0.35; };
  const unit = kind === "energy" ? " kcal" : "";
  const chain = vals.map((v) => fmtNum(v)).join(" → ");
  const lostH = (i: number) => Math.min(2.4, (F.lost[i] / E0) * 2.4);
  return (
    <LabFrame
      label="A rotating stack of square layers for the trophic levels of an ecosystem, widest at the bottom for producers and shrinking upwards, with red bars beside them showing the energy lost as heat at each level"
      camera={[0, 1.6, 8.6]}
      onReset={reset}
      scene={() => (<group position={[0, -1.8, 0]}>
        <Tick fn={tick} />
        <group ref={spin}>
          {vals.map((v, i) => (<mesh key={i} position={[0, 0.3 + i * 0.66, 0]}><boxGeometry args={[sides[i] * 3.4, 0.6, sides[i] * 3.4]} /><meshStandardMaterial color={COL[i]} roughness={0.45} emissive={COL[i]} emissiveIntensity={0.12} /></mesh>))}
        </group>
        {kind === "energy" && F.lost.map((_, i) => (<mesh key={`h${i}`} position={[2.4 + Math.max(0.05, lostH(i)) / 2, 0.3 + i * 0.66, 0]}><boxGeometry args={[Math.max(0.05, lostH(i)), 0.4, 0.4]} /><meshStandardMaterial color="#ff5a5f" transparent opacity={0.8} /></mesh>))}
        <mesh position={[0, -0.03, 0]}><boxGeometry args={[7, 0.06, 4]} /><meshStandardMaterial color="#33454e" /></mesh>
      </group>)}
      readouts={[
        [kind === "energy" ? "Energy at each level" : "Number at each level", `${chain}${unit}`], ["Top level", `${TROPHIC_NAMES[n - 1]}`],
        ["Energy reaching the top", `${fmtNum(F.top)} kcal (${F.topPct < 0.1 ? F.topPct.toPrecision(2) : F.topPct.toFixed(2)} % of the producers)`], ["Energy lost before the top", `${fmtNum(F.lostBeforeTop)} kcal`],
        ["Transfer efficiency", `${eff} % per step`], ["Pyramid shown", kind === "energy" ? "energy (always upright)" : `numbers: ${NUMBERS[kind].who.slice(0, n).join(" → ")}`],
      ]}
      controls={<>
        <Slider label="Producer energy E₀" value={E0} min={1000} max={100000} step={500} digits={0} unit=" kcal" onChange={(x) => set("E0", x)} />
        <Slider label="Transfer efficiency" value={eff} min={1} max={30} step={0.5} digits={1} unit=" %" onChange={(x) => set("eff", x)} />
        <Slider label="Trophic levels" value={levels} min={2} max={5} step={1} digits={0} onChange={(x) => set("levels", Math.round(x))} />
        <Pick<PyramidKind> label="Pyramid" value={kind} options={[{ id: "energy", label: "Pyramid of energy" }, { id: "grass", label: "Pyramid of numbers: grassland" }, { id: "tree", label: "Pyramid of numbers: one tree (inverted)" }]} onChange={(x) => set("kind", x)} />
      </>}
      note={<p>Producers capture solar energy; each step up the food chain passes on only about 10 % (Lindeman&apos;s 10 % law) because the rest is lost as heat in respiration, as waste and as uneaten parts, so food chains rarely have more than four or five links. The area of each square layer is proportional to the value, so the energy pyramid is always upright, and the red bars beside it show the energy each level does not pass on. The numbers pyramids use illustrative counts: in a grassland the individuals are many small plants, but one big tree carries thousands of insects, so a pyramid of numbers can be inverted at the base while a pyramid of energy cannot. Energy values are per unit area per year; layers below 8 % of the width are drawn at a minimum size so the top stays visible.</p>}
    />
  );
}
