"use client";
import { useMemo } from "react";
import { shape, shaperInfo, type Shaper } from "../sim/elexx";
import { LabFrame, Pick, Slider, Check } from "../ui";
import { useLabParams } from "../params";
import { ELEXX_SPECS } from "../meta/elexx.specs";
import { C, Box } from "../kit";
import { Graph, Rod } from "../kit2";

export default function ClipperLab() {
  const [P, set, reset] = useLabParams(ELEXX_SPECS.clipper);
  const { Vm, Vref, f, ideal, mode } = P;
  const Vd = ideal ? 0 : 0.7;
  const info = shaperInfo(mode, Vm, Vref, Vd);
  const span = Math.max(Vm, Math.abs(info.hi), Math.abs(info.lo)) * 1.15;
  const input = useMemo(() => Array.from({ length: 241 }, (_, i) => [i / 120, Vm * Math.sin(Math.PI * i / 60)] as [number, number]), [Vm]);
  const output = useMemo(() => input.map(([t, v]) => [t, shape(mode, v, Vm, Vref, Vd)] as [number, number]), [input, mode, Vm, Vref, Vd]);
  const transfer = useMemo(() => Array.from({ length: 81 }, (_, i) => { const v = -Vm + (2 * Vm * i) / 80; return [v, shape(mode, v, Vm, Vref, Vd)] as [number, number]; }), [mode, Vm, Vref, Vd]);
  const clamp = mode === "posclamp" || mode === "negclamp";
  return (
    <LabFrame
      label="A diode wave-shaping circuit with an input sine wave in blue and the clipped or clamped output in green on an oscilloscope screen, plus the transfer characteristic"
      camera={[0, 0.4, 10]}
      onReset={reset}
      scene={() => (<group>
        <Box p={[0, 0, -0.3]} s={[9.6, 5.2, 0.3]} c="#0b1418" />
        <Graph x0={-4.4} y0={-2.2} w={5.6} h={4.4} xr={[0, 2]} yr={[-span, span]} curves={[{ pts: input, color: C.blue, w: 2 }, { pts: output, color: C.green, w: 3.2 }]} bg="#0f2a21" />
        <Graph x0={1.9} y0={-0.4} w={2.6} h={2.6} xr={[-Vm, Vm]} yr={[-span, span]} curves={[{ pts: transfer, color: C.gold, w: 3 }]} />
        <group position={[3.2, -1.7, 0]}>
          <Box p={[-0.6, 0, 0]} s={[0.6, 0.18, 0.18]} c={C.orange} />
          <mesh position={[0.25, 0, 0]} rotation={[0, 0, clamp ? 0 : -Math.PI / 2]}><coneGeometry args={[0.18, 0.4, 3]} /><meshStandardMaterial color={C.red} /></mesh>
          {clamp && <><Box p={[-1.1, 0, 0]} s={[0.05, 0.4, 0.3]} c={C.light} /><Box p={[-1.2, 0, 0]} s={[0.05, 0.4, 0.3]} c={C.light} /></>}
          {Vref !== 0 && <Rod a={[0.25, -0.3, 0]} b={[0.25, -0.6, 0]} r={0.08} color={C.green} />}
        </group>
      </group>)}
      readouts={[
        ["Output maximum", `${info.hi.toFixed(2)} V`],
        ["Output minimum", `${info.lo.toFixed(2)} V`],
        ["Output peak-to-peak", `${info.pp.toFixed(2)} V`],
        ["DC level of output", `${info.dc.toFixed(2)} V`],
        ["Input", `${Vm.toFixed(1)} V peak, ${f.toFixed(0)} Hz`],
        ["Diode", ideal ? "ideal (0 V drop)" : "silicon (0.7 V drop)"],
      ]}
      controls={<>
        <Slider label="Input peak V_m" value={Vm} min={1} max={20} step={0.1} digits={1} unit=" V" onChange={(x) => set("Vm", x)} />
        <Slider label="Reference voltage V_ref" value={Vref} min={-5} max={5} step={0.1} digits={1} unit=" V" onChange={(x) => set("Vref", x)} />
        <Slider label="Input frequency" value={f} min={10} max={1000} step={10} digits={0} unit=" Hz" onChange={(x) => set("f", x)} />
        <Pick label="Circuit" value={mode} options={[{ id: "posclip", label: "Positive clipper (biased)" }, { id: "negclip", label: "Negative clipper (biased)" }, { id: "dualclip", label: "Two-level clipper" }, { id: "posclamp", label: "Positive clamper" }, { id: "negclamp", label: "Negative clamper" }] as { id: Shaper; label: string }[]} onChange={(x) => set("mode", x)} />
        <Check label="Ideal diode (no 0.7 V drop)" checked={ideal} onChange={(x) => set("ideal", x)} />
      </>}
      note={<p>A <b>clipper</b> (series resistor, shunt diode to a reference battery) lets the wave through until the diode turns on at V<sub>ref</sub> + 0.7 V, then holds the output there: the part beyond is cut off. Flip the diode to clip the negative side, or use two diodes to clip both. The gold transfer characteristic (v<sub>o</sub> against v<sub>i</sub>) bends flat at the clipping level. A <b>clamper</b> uses a capacitor: on the first peak the diode charges it to about V<sub>m</sub>, after which it acts as a battery in series, shifting the whole wave up or down so one peak sits at V<sub>ref</sub> ± 0.7 V while the peak-to-peak value stays the same (if 5RC ≫ T/2). Steady-state waveforms are shown.</p>}
    />
  );
}
