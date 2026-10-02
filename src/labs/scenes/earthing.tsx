"use client";
import { useMemo } from "react";
import { battery, earthFault, pipeEarth, plateEarth } from "../sim/elecx";
import { LabFrame, Pick, Slider, Check } from "../ui";
import { useLabParams } from "../params";
import { ELECX_SPECS } from "../meta/elecx.specs";
import { C, Box, type V3 } from "../kit";
import { Flow, Rod, mix } from "../kit2";

export default function EarthingLab() {
  const [P, set, reset] = useLabParams(ELECX_SPECS.earthing);
  const { rho, L, d, side, mcb, Ah, I, soc, salt, mode } = P;
  const rhoEff = salt ? rho / 2 : rho;
  const Re = mode === "plate" ? plateEarth(rhoEff, side) : pipeEarth(rhoEff, L, d);
  const f = earthFault(Re, 230, 1, mcb);
  const b = battery(Ah, I, soc);
  const fault = useMemo<V3[]>(() => [[-2.4, 1.6, 0], [-1, 1.6, 0], [-1, -0.2, 0], [0, -0.2, 0], [0, -2.5, 0]], []);
  const soil = mix("#6b4f2a", "#3f2c16", Math.min(1, rho / 1000));
  if (mode === "battery") {
    const acid = mix("#3b6fb0", "#a9c6e6", 1 - soc / 100);
    return (
      <LabFrame
        label="A 12 V lead–acid battery in cut-away: six cells with lead plates in sulphuric acid whose colour fades as it discharges, with a hydrometer float"
        camera={[0, 1.4, 8]}
        onReset={reset}
        scene={() => (<group>
          <Box p={[0, 0, 0]} s={[5.2, 2.2, 1.8]} c={C.dark} o={0.35} />
          {Array.from({ length: 6 }, (_, i) => (<group key={i} position={[-2.15 + i * 0.86, 0, 0]}>
            <Box p={[0, -0.1, 0]} s={[0.78, 1.7 * (0.55 + 0.45 * soc / 100), 1.6]} c={acid} o={0.6} />
            <Box p={[-0.18, 0, 0]} s={[0.08, 1.6, 1.3]} c="#6b4a3a" />
            <Box p={[0.18, 0, 0]} s={[0.08, 1.6, 1.3]} c="#9aa8b0" />
          </group>))}
          <Box p={[-1.8, 1.25, 0]} s={[0.3, 0.3, 0.3]} c={C.red} />
          <Box p={[1.8, 1.25, 0]} s={[0.3, 0.3, 0.3]} c={C.grey} />
          <Rod a={[3.4, -0.6, 0]} b={[3.4, 1.6, 0]} r={0.2} color="#e8f1f5" o={0.3} />
          <Rod a={[3.4, -0.6 + b.sg * 0.8 - 0.8, 0]} b={[3.4, 0.2 + b.sg * 0.8 - 0.8, 0]} r={0.08} color={C.gold} />
        </group>)}
        readouts={[
          ["Run time (Peukert, k = 1.2)", `${b.hours.toFixed(1)} h`],
          ["Energy left", `${b.Wh.toFixed(0)} Wh`],
          ["Specific gravity of acid", b.sg.toFixed(3)],
          ["Open-circuit voltage", `${b.ocv.toFixed(2)} V`],
          ["Discharge rate", `C/${(Ah / I).toFixed(1)}`],
        ]}
        controls={<>
          <Slider label="Soil resistivity ρ" value={rho} min={10} max={1000} step={1} digits={0} unit=" Ω·m" onChange={(x) => set("rho", x)} />
          <Pick label="Station" value={mode} options={[{ id: "pipe", label: "Pipe earthing" }, { id: "plate", label: "Plate earthing" }, { id: "battery", label: "Lead–acid battery" }]} onChange={(x) => set("mode", x)} />
          <Slider label="Battery capacity" value={Ah} min={20} max={200} step={5} digits={0} unit=" Ah" onChange={(x) => set("Ah", x)} />
          <Slider label="Load current" value={I} min={0.5} max={50} step={0.5} digits={1} unit=" A" onChange={(x) => set("I", x)} />
          <Slider label="State of charge" value={soc} min={0} max={100} step={1} digits={0} unit=" %" onChange={(x) => set("soc", x)} />
        </>}
        note={<p>Discharge: Pb + PbO₂ + 2H₂SO₄ → 2PbSO₄ + 2H₂O. Acid is used up and water made, so the <b>specific gravity</b> falls from about 1.28 (full) to 1.12 (flat), which a hydrometer reads. Charging reverses it. Capacity is rated at the 20-hour rate; drawing faster gives less (Peukert: t = 20(C/20I)<sup>k</sup>). Open-circuit voltage is only a rough guide to charge.</p>}
      />
    );
  }
  return (
    <LabFrame
      label="A house wall with a faulty appliance, a fault current running through the earth wire into a pipe or plate electrode buried in soil, and a protective MCB"
      camera={[0.5, 0.5, 9]}
      onReset={reset}
      scene={() => (<group>
        <Box p={[0, -2.9, 0]} s={[9, 3, 3]} c={soil} o={0.85} />
        <Box p={[-2.6, 1.2, 0]} s={[1.4, 1.2, 1]} c="#c8d3d9" />
        <Box p={[-2.6, 0.45, 0]} s={[0.25, 0.25, 0.25]} c={f.safe ? C.green : C.red} glow={0.6} />
        {mode === "pipe"
          ? <Rod a={[0, -1.4, 0]} b={[0, -1.4 - L * 0.7, 0]} r={0.05 + d / 1000} color="#9aa8b0" />
          : <Box p={[0, -3.4, 0]} s={[side * 2, side * 2, 0.06]} c="#c58b3a" />}
        {salt && <Rod a={[0, -1.6, 0]} b={[0, -1.6 - (mode === "pipe" ? L * 0.7 : 2), 0]} r={0.4} color="#e8f1f5" o={0.2} />}
        <Box p={[2.2, 1.2, 0]} s={[0.5, 0.8, 0.4]} c={f.trips ? C.green : C.dark} />
        <Flow path={fault} n={12} speed={Math.min(1.5, 0.1 + f.If / 40)} color={C.gold} r={0.06} />
      </group>)}
      readouts={[
        ["Earth resistance", `${Re.toFixed(2)} Ω`],
        ["Fault current", `${f.If.toFixed(1)} A`],
        ["Touch voltage on the body", `${f.touch.toFixed(0)} V`],
        ["MCB trips?", f.trips ? `Yes (≥ ${(5 * mcb).toFixed(0)} A)` : "No: use an RCCB"],
        ["Verdict", f.safe ? "Safe" : "Dangerous (touch voltage > 50 V)"],
        ["Effective soil resistivity", `${rhoEff.toFixed(0)} Ω·m`],
      ]}
      controls={<>
        <Slider label="Soil resistivity ρ" value={rho} min={10} max={1000} step={1} digits={0} unit=" Ω·m" onChange={(x) => set("rho", x)} />
        <Pick label="Station" value={mode} options={[{ id: "pipe", label: "Pipe earthing" }, { id: "plate", label: "Plate earthing" }, { id: "battery", label: "Lead–acid battery" }]} onChange={(x) => set("mode", x)} />
        <Slider label="Pipe length" value={L} min={1} max={4} step={0.1} digits={1} unit=" m" onChange={(x) => set("L", x)} />
        <Slider label="Pipe diameter" value={d} min={25} max={50} step={1} digits={0} unit=" mm" onChange={(x) => set("d", x)} />
        <Slider label="Plate side" value={side} min={0.3} max={1.2} step={0.05} digits={2} unit=" m" onChange={(x) => set("side", x)} />
        <Slider label="MCB rating" value={mcb} min={6} max={63} step={1} digits={0} unit=" A" onChange={(x) => set("mcb", x)} />
        <Check label="Salt and charcoal treatment" checked={salt} onChange={(x) => set("salt", x)} />
      </>}
      note={<p>Earthing connects exposed metal to the ground so that a live wire touching the case makes a large <b>fault current</b> flow, tripping the MCB or blowing the fuse at once, and keeps the <b>touch voltage</b> low. Pipe electrode: R = (ρ/2πL) ln(4L/d); plate: R ≈ (ρ/4)√(π/A). Salt and charcoal around the electrode keep the soil moist and conductive (taken here as halving ρ). With a 1 Ω source-earth path, I<sub>f</sub> = 230/(R<sub>e</sub> + 1); a type-B MCB needs about 5 × its rating to trip magnetically. High-resistance soil cannot trip it, which is why houses also need an RCCB (30 mA).</p>}
    />
  );
}
