"use client";
import { Line } from "@react-three/drei";
import { useMemo } from "react";
import { led, LED_MATS, nmHex, solarCell, type LedMat } from "../sim/phyx";
import { fmtSI } from "../sim/physics";
import { LabFrame, Pick, Slider, Check } from "../ui";
import { useLabParams } from "../params";
import { PHYX_SPECS } from "../meta/phyx.specs";
import { C, Box, type V3 } from "../kit";
import { Flow, Graph, Pulse, sample } from "../kit2";

export default function SolarCellLab() {
  const [P, set, reset] = useLabParams(PHYX_SPECS.solarcell);
  const { G, A, T, R, V, mode, mat, cells } = P;
  const sc = solarCell(G, A, T, R);
  const le = led(mat, V);
  const solar = mode === "solar";
  const curve = useMemo(() => sample((v) => Math.max(-0.2, sc.curve(v)), 0, Math.max(0.05, sc.Voc * 1.02), 100), [sc]);
  const loadLine = useMemo(() => sample((v) => v / R, 0, Math.max(0.05, sc.Voc), 20), [R, sc.Voc]);
  const ledCurve = useMemo(() => sample((v) => led(mat, v).I * 1000, 0, 3.5, 140), [mat]);
  const sunRays = useMemo<V3[][]>(() => [-1.2, 0, 1.2].map((x) => [[x - 1, 3.4, 0], [x, 0.4, 0]]), []);
  const circuit = useMemo<V3[]>(() => [[-1.7, 0.1, 0], [-1.7, -1.4, 0], [1.7, -1.4, 0], [1.7, 0.1, 0]], []);
  const glow = nmHex(le.lambda);
  return (
    <LabFrame
      label={solar ? "A p–n junction slab under sunlight; photons free electron–hole pairs that flow round an external load, beside a graph of the illuminated I–V curve and the load line" : "A forward-biased p–n junction LED glowing at the colour set by its band gap, with its I–V curve"}
      camera={[0.5, 1.5, 9]}
      onReset={reset}
      scene={() => (<group position={[-1.6, 0, 0]}>
        <Box p={[0, 0.25, 0]} s={[3.2, 0.3, 1.6]} c={C.blue} />
        <Box p={[0, -0.12, 0]} s={[3.2, 0.44, 1.6]} c={C.red} />
        <Box p={[0, 0.05, 0]} s={[3.2, 0.08, 1.62]} c={C.light} o={0.6} />
        {solar ? (<>
          {G > 0 && sunRays.map((r, i) => <group key={i}><Line points={r} color={C.gold} lineWidth={2} /><Flow path={r} n={Math.round(3 + G / 250)} speed={1} color={C.gold} r={0.06} /></group>)}
          <mesh position={[-2.6, 3.8, 0]}><sphereGeometry args={[0.45, 20, 20]} /><meshStandardMaterial color={C.gold} emissive={C.gold} emissiveIntensity={0.4 + G / 1500} /></mesh>
          <Line points={circuit} color={C.light} lineWidth={2} />
          <Box p={[0, -1.4, 0]} s={[0.9, 0.3, 0.3]} c={C.orange} glow={Math.min(1, sc.Pop / 2)} />
          {sc.Iop > 0.001 && <Flow path={circuit} n={14} speed={Math.min(1.5, 0.2 + sc.Iop / 3)} color={C.blue} r={0.06} />}
          {cells && [0, 1, 2].map((i) => <Box key={i} p={[-1.1 + i * 1.1, 0.42, 0]} s={[0.02, 0.05, 1.6]} c={C.white} />)}
        </>) : (<>
          <mesh position={[0, 0.9, 0]}><sphereGeometry args={[0.5 + Math.min(0.6, le.I * 8), 24, 24]} /><meshStandardMaterial color={glow} emissive={glow} emissiveIntensity={le.on ? 1.2 : 0.05} transparent opacity={le.on ? 0.85 : 0.25} /></mesh>
          <Line points={circuit} color={C.light} lineWidth={2} />
          <Box p={[0, -1.4, 0]} s={[0.6, 0.6, 0.3]} c={C.dark} />
          {le.on && <Flow path={circuit} n={12} speed={-0.6} color={C.blue} r={0.06} />}
        </>)}
        {solar
          ? <Graph x0={2.3} y0={-1.8} w={4} h={3.4} xr={[0, Math.max(0.1, sc.Voc * 1.05)]} yr={[0, Math.max(0.01, sc.Isc * 1.15)]} curves={[{ pts: curve, color: C.green, w: 3 }, { pts: loadLine, color: C.blue }]} marker={[sc.Vop, sc.Iop]} />
          : <Graph x0={2.3} y0={-1.8} w={4} h={3.4} xr={[0, 3.5]} yr={[0, 100]} curves={[{ pts: ledCurve, color: glow, w: 3 }]} marker={[V, le.I * 1000]} />}
        {solar && <Pulse p={[0, 0.06, 0.82]} color={C.gold} r={0.06} />}
      </group>)}
      readouts={solar ? [
        ["Short-circuit current I_sc", fmtSI(sc.Isc, "A")],
        ["Open-circuit voltage V_oc", fmtSI(sc.Voc, "V")],
        ["Maximum power", fmtSI(sc.Pm, "W")],
        ["Fill factor", sc.FF.toFixed(3)],
        ["Efficiency", `${sc.eff.toFixed(2)} %`],
        ["Power into the load", fmtSI(sc.Pop, "W")],
      ] : [
        ["Band gap E_g", `${le.Eg.toFixed(2)} eV`],
        ["Emitted wavelength λ = hc/E_g", `${le.lambda.toFixed(0)} nm`],
        ["Forward current", fmtSI(le.I, "A")],
        ["State", le.on ? "Glowing" : "Off (below turn-on)"],
        ["Photons per second", le.on ? `${(le.photonsPerS / 1e15).toFixed(2)} ×10¹⁵` : "0"],
      ]}
      controls={<>
        <Slider label="Sunlight G" value={G} min={0} max={1500} step={10} digits={0} unit=" W/m²" onChange={(x) => set("G", x)} />
        <Slider label="Cell area" value={A} min={1} max={200} step={1} digits={0} unit=" cm²" onChange={(x) => set("A", x)} />
        <Slider label="Cell temperature" value={T} min={250} max={350} step={1} digits={0} unit=" K" onChange={(x) => set("T", x)} />
        <Slider label="Load resistance" value={R} min={0.01} max={5} step={0.01} digits={2} unit=" Ω" onChange={(x) => set("R", x)} />
        <Pick label="Device" value={mode} options={[{ id: "solar", label: "Solar cell (illuminated)" }, { id: "led", label: "LED (forward biased)" }]} onChange={(x) => set("mode", x)} />
        <Pick label="LED material" value={mat} options={(Object.keys(LED_MATS) as LedMat[]).map((k) => ({ id: k, label: `${LED_MATS[k].name} (${LED_MATS[k].Eg} eV)` }))} onChange={(x) => set("mat", x)} />
        <Slider label="LED bias voltage" value={V} min={0} max={3.5} step={0.01} digits={2} unit=" V" onChange={(x) => set("V", x)} />
        <Check label="Show contact fingers" checked={cells} onChange={(x) => set("cells", x)} />
      </>}
      note={<p><b>Solar cell:</b> photons with energy above the band gap create electron–hole pairs; the built-in field of the depletion layer sweeps electrons to the n side and holes to the p side, so current flows through the load. The illuminated curve I = I<sub>ph</sub> − I₀(e<sup>V/nV<sub>T</sub></sup> − 1) gives I<sub>sc</sub> at V = 0 and V<sub>oc</sub> at I = 0; the load line I = V/R crosses it at the operating point (red). The fill factor P<sub>max</sub>/(V<sub>oc</sub>I<sub>sc</sub>) measures how square the curve is. Heat raises I₀ and lowers V<sub>oc</sub>. <b>LED:</b> forward bias pushes electrons and holes into the junction, where they recombine and emit photons of energy ≈ E<sub>g</sub>, so λ = 1240/E<sub>g</sub> nm. Direct-gap materials (GaAs, GaAsP, InGaN) do this efficiently. Single-diode model with typical silicon values; the LED current model is simplified.</p>}
    />
  );
}
