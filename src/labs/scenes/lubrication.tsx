"use client";
import { useMemo, useRef } from "react";
import type * as THREE from "three";
import { stribeck, stribeckF } from "../sim/chemx";
import { Tick } from "../Stage";
import { LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { CHEMX_SPECS } from "../meta/chemx.specs";
import { C } from "../kit";
import { Graph, Pulse, Rod, sample } from "../kit2";

function Shaft({ speed, off }: { speed: number; off: number }) {
  const g = useRef<THREE.Group>(null);
  return (<group ref={g} position={[0, -off, 0]}>
    <Tick fn={(dt) => { if (g.current) g.current.rotation.z -= Math.min(dt, 0.05) * speed; }} />
    <Rod a={[0, 0, -1.6]} b={[0, 0, 1.6]} r={0.9} color="#9aa8b0" />
    {[0, 1, 2, 3].map((i) => <Rod key={i} a={[Math.cos(i * 1.57) * 0.92, Math.sin(i * 1.57) * 0.92, -1.2]} b={[Math.cos(i * 1.57) * 0.92, Math.sin(i * 1.57) * 0.92, 1.2]} r={0.03} color={C.dark} />)}
  </group>);
}

export default function LubricationLab() {
  const [P, set, reset] = useLabParams(CHEMX_SPECS.lubrication);
  const { nu40, VI, T, rpm, load } = P;
  const s = stribeck(nu40, VI, T, rpm, load);
  const lx = Math.log10(Math.max(1e-3, s.x));
  const curve = useMemo(() => sample((u) => stribeckF(10 ** u), -2, 2, 120), []);
  const film = Math.min(0.32, 0.03 + s.filmUm * 0.08);
  const off = 0.34 - film;
  return (
    <LabFrame
      label="A journal bearing seen end-on: a shaft turns inside a sleeve on an oil film whose thickness changes with the conditions; sparks show metal contact; a Stribeck curve plots friction against the bearing number"
      camera={[1.2, 0.8, 8.6]}
      onReset={reset}
      scene={() => (<group>
        <group position={[-2.4, 0.2, 0]}>
          <Rod a={[0, 0, -1.5]} b={[0, 0, 1.5]} r={1.34} color="#d6b04a" o={0.35} />
          <Rod a={[0, 0, -1.5]} b={[0, 0, 1.5]} r={1.42} color="#5b6d77" o={0.35} />
          <Shaft speed={Math.min(8, 0.4 + rpm / 400)} off={off} />
          {s.regime === "boundary" && [0, 1, 2].map((i) => <Pulse key={i} p={[-0.25 + i * 0.25, -1.28, 1.52]} color={C.red} r={0.07} />)}
        </group>
        <Graph x0={0.4} y0={-1.8} w={4.4} h={3.6} xr={[-2, 2]} yr={[0, 0.13]} curves={[{ pts: curve, color: C.gold, w: 3 }]} marker={[Math.max(-2, Math.min(2, lx)), s.f]}
          vlines={[{ x: Math.log10(0.35), color: C.red }, { x: Math.log10(1.6), color: C.green }]} />
      </group>)}
      readouts={[
        ["Oil viscosity at T", `${s.nu.toFixed(1)} cSt`],
        ["Regime", s.regime],
        ["Coefficient of friction", s.f.toFixed(4)],
        ["Oil film (schematic)", `${s.filmUm.toFixed(2)} μm`],
        ["Bearing number μN/P", s.hersey.toExponential(2)],
        ["Heat from friction", `${s.heatW.toFixed(1)} W`],
      ]}
      controls={<>
        <Slider label="Oil grade (viscosity at 40 °C)" value={nu40} min={10} max={320} step={1} digits={0} unit=" cSt" onChange={(x) => set("nu40", x)} />
        <Slider label="Viscosity index" value={VI} min={0} max={150} step={1} digits={0} onChange={(x) => set("VI", x)} />
        <Slider label="Oil temperature" value={T} min={0} max={150} step={1} digits={0} unit=" °C" onChange={(x) => set("T", x)} />
        <Slider label="Shaft speed" value={rpm} min={10} max={3000} step={10} digits={0} unit=" rpm" onChange={(x) => set("rpm", x)} />
        <Slider label="Load" value={load} min={100} max={10000} step={50} digits={0} unit=" N" onChange={(x) => set("load", x)} />
      </>}
      note={<p>The <b>Stribeck curve</b> plots friction against the bearing number μN/P (viscosity × speed ÷ pressure, log scale). At low values the film is squeezed out and asperities touch: <b>boundary</b> lubrication, high friction and wear (red sparks), where oiliness additives and solid lubricants help. In the middle is <b>mixed</b> lubrication with the lowest friction. To the right the shaft floats on a full pressurised film (<b>hydrodynamic</b>), and friction rises slowly from viscous drag. Heating thins the oil; a high viscosity index means it thins less. Bearing size is fixed (50 mm × 50 mm); the friction and film formulas are schematic but follow the textbook trends.</p>}
    />
  );
}
