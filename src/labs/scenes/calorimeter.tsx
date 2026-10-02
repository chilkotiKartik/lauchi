"use client";
import { useMemo, useRef } from "react";
import type * as THREE from "three";
import { calorimeter, calTrace } from "../sim/chemx";
import { Tick } from "../Stage";
import { LabFrame, Slider, Check } from "../ui";
import { useLabParams } from "../params";
import { CHEMX_SPECS } from "../meta/chemx.specs";
import { C, Box } from "../kit";
import { Graph, Pulse, Rod, sample } from "../kit2";

function Stirrer() {
  const g = useRef<THREE.Group>(null);
  return (<group ref={g} position={[0.9, 0.4, 0]}>
    <Tick fn={(dt) => { if (g.current) g.current.rotation.y += Math.min(dt, 0.05) * 6; }} />
    <Rod a={[0, 0.3, 0]} b={[0, 2.4, 0]} r={0.04} color={C.light} />
    <Box p={[0, 0.3, 0]} s={[0.5, 0.06, 0.12]} c={C.light} />
  </group>);
}

export default function CalorimeterLab() {
  const [P, set, reset] = useLabParams(CHEMX_SPECS.calorimeter);
  const { m, C: cPct, H, W, w, latent } = P;
  const r = calorimeter(m, cPct, H, W, w, 10, 50, 0.02, latent ? 587 : 580);
  const trace = useMemo(() => sample((t) => calTrace(t, r.dT, 0.02), 0, 360, 120), [r.dT]);
  const col = Math.min(2.6, 0.3 + r.dT * 0.45);
  return (
    <LabFrame
      label="A bomb calorimeter in cut-away: a steel bomb with a glowing burning pellet inside a bucket of water, a turning stirrer and a thermometer whose column rises, beside a temperature–time graph"
      camera={[0.6, 1.6, 9]}
      onReset={reset}
      scene={() => (<group position={[-1.8, -0.6, 0]}>
        <Rod a={[0, -1.6, 0]} b={[0, 2.2, 0]} r={1.9} color="#9db0ba" o={0.15} />
        <Rod a={[0, -1.5, 0]} b={[0, 1.4, 0]} r={1.6} color="#2b8fd6" o={0.3} />
        <Rod a={[-0.3, -1.3, 0]} b={[-0.3, 0.8, 0]} r={0.55} color="#7a8a93" />
        <Rod a={[-0.3, 0.8, 0]} b={[-0.3, 1.2, 0]} r={0.2} color={C.dark} />
        <Pulse p={[-0.3, -0.5, 0.56]} color={C.orange} r={0.14} />
        <Stirrer />
        <Rod a={[-1.2, -1, 0.6]} b={[-1.2, 2.8, 0.6]} r={0.07} color="#e8f1f5" o={0.6} />
        <Rod a={[-1.2, -1, 0.6]} b={[-1.2, -1 + col, 0.6]} r={0.05} color={C.red} glow={0.4} />
        <Graph x0={2.6} y0={-1.4} w={4} h={3.4} xr={[0, 360]} yr={[0, Math.max(1, r.dT * 1.2)]} curves={[{ pts: trace, color: C.red, w: 3 }]} marker={[300, calTrace(300, r.dT, 0.02)]} />
      </group>)}
      readouts={[
        ["Temperature rise ΔT", `${r.dT.toFixed(2)} °C`],
        ["Gross calorific value (GCV)", `${r.gcv.toFixed(0)} cal/g`],
        ["Net calorific value (NCV)", `${r.ncv.toFixed(0)} cal/g`],
        ["GCV in kJ/kg", `${r.kJperKg.toFixed(0)} kJ/kg`],
        ["Heat released", `${r.heatKcal.toFixed(2)} kcal`],
        ["Dulong estimate", `${r.gcvTrue.toFixed(0)} cal/g`],
      ]}
      controls={<>
        <Slider label="Mass of coal m" value={m} min={0.5} max={2} step={0.01} digits={2} unit=" g" onChange={(x) => set("m", x)} />
        <Slider label="Carbon" value={cPct} min={60} max={95} step={0.5} digits={1} unit=" %" onChange={(x) => set("C", x)} />
        <Slider label="Hydrogen" value={H} min={1} max={15} step={0.1} digits={1} unit=" %" onChange={(x) => set("H", x)} />
        <Slider label="Water taken W" value={W} min={500} max={3000} step={10} digits={0} unit=" g" onChange={(x) => set("W", x)} />
        <Slider label="Water equivalent w" value={w} min={100} max={3000} step={10} digits={0} unit=" g" onChange={(x) => set("w", x)} />
        <Check label="Latent heat 587 cal/g (untick for 580)" checked={latent} onChange={(x) => set("latent", x)} />
      </>}
      note={<p>The weighed pellet burns in oxygen at about 25 atm inside the steel bomb, and all the heat goes into the water and the calorimeter (water equivalent w). From the corrected temperature rise, <b>GCV = [(W + w)(ΔT + t<sub>c</sub>) − (fuse + acid corrections)]/m</b>. Here the cooling correction t<sub>c</sub> = 0.02 °C, fuse-wire 10 cal and acid 50 cal are fixed. The steam formed from the hydrogen condenses in the bomb, so the bomb measures the <b>gross</b> value; in a furnace that steam escapes, so <b>NCV = GCV − 0.09 × H% × latent heat</b> (9 g of water per g of hydrogen). The fuel’s true heat value is taken from Dulong’s formula, so the “measurement” always recovers it.</p>}
    />
  );
}
