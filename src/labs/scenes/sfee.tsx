"use client";
import { useMemo } from "react";
import { sfee, type FlowDevice } from "../sim/mechy";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { MECHY_SPECS } from "../meta/mechy.specs";
import { Box, type V3 } from "../kit";
import { Arrow, C, Flow, Rod } from "../kit2";
import { Flame, Spinner } from "./mechy-kit";

const DEVS: { id: FlowDevice; label: string }[] = [
  { id: "nozzle", label: "Nozzle (find exit velocity)" },
  { id: "turbine", label: "Steam/gas turbine (find work)" },
  { id: "compressor", label: "Compressor or pump (find work)" },
  { id: "boiler", label: "Boiler or heat exchanger (find heat)" },
];

function Rotor({ n, r, color }: { n: number; r: number; color: string }) {
  return (<>
    {Array.from({ length: n }, (_, i) => (
      <group key={i} rotation={[(i / n) * Math.PI * 2, 0, 0]}>
        <mesh position={[0, r / 2 + 0.12, 0]} rotation={[0, 0.5, 0]}><boxGeometry args={[0.35, r, 0.05]} /><meshStandardMaterial color={color} metalness={0.4} roughness={0.35} /></mesh>
      </group>
    ))}
  </>);
}

function Device({ dev, spin }: { dev: FlowDevice; spin: number }) {
  if (dev === "nozzle") return (<group rotation={[0, 0, Math.PI / 2]}>
    <mesh><cylinderGeometry args={[0.35, 0.9, 2.6, 32, 1, true]} /><meshStandardMaterial color={C.light} metalness={0.5} roughness={0.3} side={2} transparent opacity={0.6} /></mesh>
  </group>);
  if (dev === "boiler") return (<group>
    <mesh rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.95, 0.95, 2.6, 32]} /><meshStandardMaterial color={C.grey} metalness={0.3} roughness={0.4} transparent opacity={0.85} /></mesh>
    {[-0.9, -0.3, 0.3, 0.9].map((x) => <Flame key={x} p={[x, -1.55, 0]} s={1.3} />)}
    <Box p={[0, -1.65, 0]} s={[2.8, 0.1, 1.2]} c={C.dark} />
  </group>);
  const comp = dev === "compressor";
  return (<group>
    <mesh rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={comp ? [0.6, 1.0, 2.6, 32, 1, true] : [1.0, 0.6, 2.6, 32, 1, true]} /><meshStandardMaterial color={C.light} transparent opacity={0.28} side={2} /></mesh>
    <Spinner speed={spin} axis="x">
      <Rod a={[-1.3, 0, 0]} b={[1.3, 0, 0]} r={0.12} color={C.dark} />
      {[-0.8, -0.25, 0.3, 0.85].map((x, i) => <group key={x} position={[x, 0, 0]}><Rotor n={10} r={comp ? 0.75 - i * 0.1 : 0.45 + i * 0.1} color={comp ? C.blue : C.orange} /></group>)}
    </Spinner>
  </group>);
}

export default function SfeeLab() {
  const [P, set, reset] = useLabParams(MECHY_SPECS.sfee);
  const { h1, h2, V1, V2, dz, q, mdot, dev } = P;
  const r = sfee(dev, h1, h2, V1, V2, dz, q, mdot);
  const vOut = dev === "nozzle" ? (Number.isFinite(r.V2) ? r.V2 : 0) : V2;
  const inPath = useMemo<V3[]>(() => [[-5, 0, 0], [-1.3, 0, 0]], []);
  const outPath = useMemo<V3[]>(() => [[1.3, 0, 0], [5, 0, 0]], []);
  const terms: [number, string][] = [[h1 - h2, C.gold], [-(Number.isFinite(r.dke) ? r.dke : 0), C.blue], [r.dpe, C.green], [r.q, C.red], [-r.w, C.purple]];
  const tmax = Math.max(1e-6, ...terms.map(([v]) => Math.abs(v)));
  const result = dev === "nozzle" ? ["Exit velocity V₂", r.possible ? `${r.V2.toFixed(1)} m/s` : "impossible (h₂ too high for a nozzle)"]
    : dev === "boiler" ? ["Heat added q", `${r.q.toFixed(2)} kJ/kg`]
    : ["Shaft work w", `${r.w.toFixed(2)} kJ/kg ${r.w >= 0 ? "(out)" : "(in)"}${r.possible ? "" : " — check: wrong sign for this device"}`];
  const wSpin = dev === "turbine" ? 5 : -5;
  return (
    <LabFrame
      label="A steady-flow device (nozzle, turbine, compressor or boiler) with fluid streaming in on the left and out on the right at speeds set by the energy equation, heat and work arrows, and a bar for each term of the steady flow energy equation"
      camera={[0, 1.2, 10]}
      onReset={reset}
      scene={() => (<group>
        <group position={[0, 0.9, 0]} rotation={[0.15, -0.3, 0]}>
          <Rod a={[-5, 0, 0]} b={[-1.3, 0, 0]} r={dev === "nozzle" ? 0.9 : 0.6} color={C.blue} o={0.2} />
          <Rod a={[1.3, 0, 0]} b={[5, 0, 0]} r={dev === "nozzle" ? 0.35 : dev === "compressor" ? 0.6 : 0.6} color={C.orange} o={0.2} />
          <Flow path={inPath} n={14} speed={Math.min(2.5, 0.06 + V1 / 120)} color={C.blue} r={0.08} />
          <Flow path={outPath} n={14} speed={Math.min(2.5, 0.06 + vOut / 120)} color={C.orange} r={0.08} />
          <Device dev={dev} spin={wSpin} />
          {dev !== "nozzle" && dev !== "boiler" && (dev === "turbine"
            ? <Arrow from={[0, 1.2, 0]} to={[0, 2.4, 0]} color={C.purple} r={0.06} />
            : <Arrow from={[0, 2.4, 0]} to={[0, 1.2, 0]} color={C.purple} r={0.06} />)}
          {Math.abs(r.q) > 1e-6 && dev !== "nozzle" && (r.q > 0
            ? <Arrow from={[0, -2.9, 0.8]} to={[0, -1.9, 0.8]} color={C.red} r={0.06} />
            : <Arrow from={[0.6, -1.2, 0.8]} to={[0.6, -2.3, 0.8]} color={C.red} r={0.06} />)}
        </group>
        <group position={[2.2, -2.7, 0]}>
          <Box p={[0.9, 0, 0]} s={[3.2, 0.03, 0.6]} c={C.light} />
          {terms.map(([v, col], i) => { const h = Math.max(0.03, (Math.abs(v) / tmax) * 1.3); return <Box key={i} p={[i * 0.45 - 0.0, v >= 0 ? h / 2 : -h / 2, 0]} s={[0.32, h, 0.32]} c={col} glow={0.3} />; })}
        </group>
      </group>)}
      readouts={[
        [result[0], result[1]],
        ["Power ṁ × (w or q)", dev === "nozzle" ? `KE gained ${(Number.isFinite(r.dke) ? r.dke * mdot : 0).toFixed(1)} kW` : `${r.power.toFixed(1)} kW`],
        ["Enthalpy drop h₁ − h₂", `${(h1 - h2).toFixed(1)} kJ/kg`],
        ["KE change (V₂² − V₁²)/2", Number.isFinite(r.dke) ? `${r.dke.toFixed(2)} kJ/kg` : "—"],
        ["PE released g(z₁ − z₂)", `${r.dpe.toFixed(3)} kJ/kg`],
      ]}
      controls={<>
        <Slider label="Inlet enthalpy h₁" value={h1} min={0} max={4000} step={1} digits={0} unit=" kJ/kg" onChange={(x) => set("h1", x)} />
        <Pick label="Device" value={dev} options={DEVS} onChange={(x) => set("dev", x)} />
        <Slider label="Exit enthalpy h₂" value={h2} min={0} max={4000} step={1} digits={0} unit=" kJ/kg" onChange={(x) => set("h2", x)} />
        <Slider label="Inlet velocity V₁" value={V1} min={0} max={300} step={1} digits={0} unit=" m/s" onChange={(x) => set("V1", x)} />
        {dev !== "nozzle" && <Slider label="Exit velocity V₂" value={V2} min={0} max={300} step={1} digits={0} unit=" m/s" onChange={(x) => set("V2", x)} />}
        {(dev === "turbine" || dev === "compressor") && <Slider label="Heat added q (− = heat loss)" value={q} min={-500} max={500} step={0.5} digits={1} unit=" kJ/kg" onChange={(x) => set("q", x)} />}
        <Slider label="Height drop z₁ − z₂" value={dz} min={-100} max={100} step={1} digits={0} unit=" m" onChange={(x) => set("dz", x)} />
        <Slider label="Mass flow rate ṁ" value={mdot} min={0.1} max={100} step={0.1} digits={1} unit=" kg/s" onChange={(x) => set("mdot", x)} />
      </>}
      note={<>
        <p>For a <b>control volume</b> with steady flow (nothing changes with time inside, mass in = mass out), the first law per kilogram is the <b>steady flow energy equation</b>: <b>h₁ + V₁²/2 + gz₁ + q = h₂ + V₂²/2 + gz₂ + w</b>. Enthalpy h = u + pv already includes the <b>flow work</b> pv needed to push the fluid in and out. Bars: enthalpy drop (gold), kinetic energy taken from the flow (blue), potential energy released (green), heat in (red) and work out (purple); up means energy available, down means energy used.</p>
        <p className="mt-2">Drop the small terms for each device: <b>nozzle</b> q = w = 0, so V₂ = √(V₁² + 2(h₁ − h₂)); <b>turbine</b> (adiabatic) w = h₁ − h₂; <b>compressor/pump</b> w = h₁ − h₂ &lt; 0 (work is put in); <b>boiler</b> w = 0, q = h₂ − h₁. Try the textbook nozzle (P.K. Nag): steam from 3000 to 2762 kJ/kg entering at 60 m/s leaves at 692 m/s. Note how small ΔKE and ΔPE are next to Δh in turbines and boilers.</p>
      </>}
    />
  );
}
