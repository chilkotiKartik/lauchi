"use client";
import { Line } from "@react-three/drei";
import { useMemo } from "react";
import { grid } from "../sim/elecx";
import { useQuality } from "../Stage";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { ELECX_SPECS } from "../meta/elecx.specs";
import { C, Box, type V3 } from "../kit";
import { Coil, Flow, Rod, mix } from "../kit2";

function Tower({ x }: { x: number }) {
  return (<group position={[x, 0, 0]}>
    <Rod a={[-0.25, -1.5, 0]} b={[0, 1.2, 0]} r={0.03} color={C.light} />
    <Rod a={[0.25, -1.5, 0]} b={[0, 1.2, 0]} r={0.03} color={C.light} />
    <Rod a={[-0.5, 0.9, 0]} b={[0.5, 0.9, 0]} r={0.03} color={C.light} />
    <Rod a={[-0.35, 0.4, 0]} b={[0.35, 0.4, 0]} r={0.03} color={C.light} />
  </group>);
}

export default function PowerGridLab() {
  const q = useQuality();
  const [P, set, reset] = useLabParams(ELECX_SPECS.powergrid);
  const { P: MW, km, r, pf, kV } = P;
  const g = grid(MW, Number(kV), km, r, pf);
  const towers = useMemo(() => Array.from({ length: q === "low" ? 4 : 6 }, (_, i) => -2.4 + i * 1.3), [q]);
  const wire = (y: number): V3[] => [[-4.1, y, 0], ...towers.map((x) => [x, y, 0] as V3), [4.3, y, 0]];
  const hot = mix(C.blue, C.red, Math.min(1, g.lossMW / Math.max(1, MW) / 0.08));
  const flowSpeed = Math.min(2, 0.15 + g.I / 600);
  return (
    <LabFrame
      label="A power station with a step-up transformer, a line of transmission towers carrying three conductors that glow redder as losses rise, a step-down substation and a row of houses"
      camera={[0, 1.6, 10]}
      onReset={reset}
      scene={() => (<group>
        <Box p={[-5.4, -0.8, 0]} s={[1.4, 1.4, 1.2]} c={C.dark} />
        <Rod a={[-5.6, -0.1, 0]} b={[-5.6, 1.3, 0]} r={0.18} color={C.grey} />
        <group position={[-4.3, -0.9, 0]} rotation={[0, 0, Math.PI / 2]}><Coil p={[0, 0, 0]} turns={6} r={0.3} len={0.9} color={C.orange} /></group>
        {towers.map((x) => <Tower key={x} x={x} />)}
        {[0.9, 0.4].map((y) => (<group key={y}><Line points={wire(y)} color={hot} lineWidth={2.4} /><Flow path={wire(y)} n={10} speed={flowSpeed} color={C.gold} r={0.05} /></group>))}
        <group position={[4.3, -0.9, 0]} rotation={[0, 0, Math.PI / 2]}><Coil p={[0, 0, 0]} turns={6} r={0.3} len={0.9} color={C.green} /></group>
        {[0, 1, 2].map((i) => (<group key={i} position={[5.1 + i * 0.75, -1.2, 0]}>
          <Box p={[0, 0, 0]} s={[0.55, 0.5, 0.5]} c="#e8f1f5" />
          <Box p={[0, 0.02, 0.26]} s={[0.18, 0.18, 0.02]} c={C.gold} glow={0.8} />
        </group>))}
      </group>)}
      readouts={[
        ["Line current I = P/(√3 V cos φ)", `${g.I.toFixed(0)} A`],
        ["Resistance per conductor", `${g.R.toFixed(2)} Ω`],
        ["Line loss 3I²R", `${g.lossMW.toFixed(2)} MW`],
        ["Transmission efficiency", `${g.eff.toFixed(2)} %`],
        ["Resistive voltage drop", `${g.dropPct.toFixed(2)} %`],
        ["Cost of losses (₹5/unit, 50 % load)", `₹${g.lossCrPerYear.toFixed(2)} crore/year`],
      ]}
      controls={<>
        <Slider label="Power sent P" value={MW} min={10} max={500} step={1} digits={0} unit=" MW" onChange={(x) => set("P", x)} />
        <Pick label="Transmission voltage" value={kV} options={(["66", "132", "220", "400", "765"] as const).map((v) => ({ id: v, label: `${v} kV` }))} onChange={(x) => set("kV", x)} />
        <Slider label="Line length" value={km} min={10} max={500} step={5} digits={0} unit=" km" onChange={(x) => set("km", x)} />
        <Slider label="Conductor resistance" value={r} min={0.02} max={0.2} step={0.005} digits={3} unit=" Ω/km" onChange={(x) => set("r", x)} />
        <Slider label="Power factor" value={pf} min={0.7} max={1} step={0.01} digits={2} onChange={(x) => set("pf", x)} />
      </>}
      note={<p>Power stations generate at around 11–25 kV; a step-up transformer raises it to 132–765 kV for transmission, substations step it down to 33 kV and 11 kV, and distribution transformers give 415 V three-phase / 230 V single-phase for homes. For the same power P = √3VI cos φ, a higher voltage means a <b>smaller current</b>, and since the line loss is 3I²R, doubling the voltage cuts the loss to a quarter. That is why long lines run at very high voltage. A poor power factor also raises the current. The model counts only conductor resistance (no corona or reactance).</p>}
    />
  );
}
