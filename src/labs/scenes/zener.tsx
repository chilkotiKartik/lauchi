"use client";
import { Line } from "@react-three/drei";
import { useMemo } from "react";
import { zener } from "../sim/elexx";
import { LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { ELEXX_SPECS } from "../meta/elexx.specs";
import { C, Box, type V3 } from "../kit";
import { Flow, Graph, Rod, mix } from "../kit2";

export default function ZenerLab() {
  const [P, set, reset] = useLabParams(ELEXX_SPECS.zener);
  const { Vin, Rs, Vz, IL, Pz } = P;
  const z = zener(Vin, Rs, Vz, IL, Pz);
  const line = useMemo(() => Array.from({ length: 121 }, (_, i) => { const v = (30 * i) / 120; return [v, zener(v, Rs, Vz, IL, Pz).VL] as [number, number]; }), [Rs, Vz, IL, Pz]);
  const top = useMemo<V3[]>(() => [[-3.6, 1.4, 0], [0, 1.4, 0]], []);
  const zb = useMemo<V3[]>(() => [[0, 1.4, 0], [0, -1.4, 0]], []);
  const lb = useMemo<V3[]>(() => [[0, 1.4, 0], [2.2, 1.4, 0], [2.2, -1.4, 0]], []);
  const heat = Math.min(1, z.PZ / Pz);
  return (
    <LabFrame
      label="A Zener shunt regulator: a source, series resistor, a Zener diode to ground and a load; charges split between the Zener and load branches, the Zener glows hotter with power, and a graph shows output voltage against input voltage"
      camera={[1.4, 0.2, 10]}
      onReset={reset}
      scene={() => (<group position={[-1.8, 0.3, 0]}>
        <Line points={[[-3.6, 1.4, 0], [2.2, 1.4, 0]]} color={C.light} lineWidth={2} />
        <Line points={[[-3.6, -1.4, 0], [2.2, -1.4, 0]]} color={C.light} lineWidth={2} />
        <Line points={[[-3.6, -1.4, 0], [-3.6, 1.4, 0]]} color={C.light} lineWidth={2} />
        <Box p={[-3.6, 0, 0]} s={[0.5, 1, 0.5]} c={C.green} />
        <Box p={[-1.8, 1.4, 0]} s={[1, 0.3, 0.3]} c={C.orange} />
        <Rod a={[0, 0.6, 0]} b={[0, -0.6, 0]} r={0.22} color={mix("#6f7f88", C.red, heat)} glow={heat} />
        <Box p={[0, 0.62, 0]} s={[0.5, 0.06, 0.5]} c="#1f2d33" />
        <Box p={[2.2, 0, 0]} s={[0.5, 1.1, 0.5]} c={C.purple} glow={Math.min(0.6, IL / 250)} />
        <Flow path={top} n={10} speed={Math.min(1.5, 0.05 + z.IR * 8)} color={C.gold} r={0.06} />
        {z.IZ > 0 && <Flow path={zb} n={8} speed={Math.min(1.5, 0.05 + z.IZ * 12)} color={C.red} r={0.06} />}
        {IL > 0 && <Flow path={lb} n={8} speed={Math.min(1.5, 0.05 + (IL / 1000) * 12)} color={C.blue} r={0.06} />}
        <Graph x0={3.4} y0={-1.8} w={4} h={3.6} xr={[0, 30]} yr={[0, Math.max(Vz * 1.3, 5)]} curves={[{ pts: line, color: C.green, w: 3 }]} marker={[Vin, z.VL]} vlines={[{ x: Vin, color: C.light }]} />
      </group>)}
      readouts={[
        ["Load voltage V_L", `${z.VL.toFixed(2)} V`],
        ["Series current I_R", `${(z.IR * 1000).toFixed(2)} mA`],
        ["Zener current I_Z", `${(z.IZ * 1000).toFixed(2)} mA`],
        ["Zener power", `${z.PZ.toFixed(1)} mW of ${Pz.toFixed(0)} mW`],
        ["Status", z.status],
        ["Maximum Zener current", `${z.Izm.toFixed(1)} mA`],
      ]}
      controls={<>
        <Slider label="Input voltage V_in" value={Vin} min={0} max={30} step={0.1} digits={1} unit=" V" onChange={(x) => set("Vin", x)} />
        <Slider label="Series resistor R_s" value={Rs} min={50} max={2000} step={10} digits={0} unit=" Ω" onChange={(x) => set("Rs", x)} />
        <Slider label="Zener voltage V_Z" value={Vz} min={3} max={20} step={0.1} digits={1} unit=" V" onChange={(x) => set("Vz", x)} />
        <Slider label="Load current I_L" value={IL} min={0} max={250} step={1} digits={0} unit=" mA" onChange={(x) => set("IL", x)} />
        <Slider label="Zener power rating" value={Pz} min={250} max={5000} step={50} digits={0} unit=" mW" onChange={(x) => set("Pz", x)} />
      </>}
      note={<p>Reverse-biased past breakdown, a Zener holds its voltage almost constant over a wide range of current. In the shunt regulator the series resistor carries I<sub>R</sub> = (V<sub>in</sub> − V<sub>Z</sub>)/R<sub>s</sub>, which splits into the load current and the Zener current: <b>I<sub>Z</sub> = I<sub>R</sub> − I<sub>L</sub></b>. Raise V<sub>in</sub> (line regulation) or drop the load (load regulation) and the Zener simply soaks up the extra current, so V<sub>L</sub> stays at V<sub>Z</sub>. It fails if V<sub>in</sub> is too low or the load too heavy (the Zener turns off and V<sub>L</sub> sags), or if I<sub>Z</sub>V<sub>Z</sub> exceeds the power rating. A 2 Ω Zener resistance is included.</p>}
    />
  );
}
