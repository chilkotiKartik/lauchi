"use client";
import { Line } from "@react-three/drei";
import { useMemo } from "react";
import { corrosion, type Protect } from "../sim/chemx";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { CHEMX_SPECS } from "../meta/chemx.specs";
import { C, Box, Instances, type Inst, type V3 } from "../kit";
import { Flow, Rod, mix } from "../kit2";
import { prng } from "../sim/physics";

function rustSpots(n: number): Inst[] {
  const r = prng(31), out: Inst[] = [];
  for (let i = 0; i < 90; i++) {
    const x = -2.8 + r() * 5.6, a = r() * 6.28, s = 0.08 + r() * 0.16;
    if (i < n) out.push({ p: [x, Math.cos(a) * 0.36, Math.sin(a) * 0.36], s: [s * 1.6, s, s * 1.6], c: i % 3 ? "#a0522d" : "#c06a2b" });
  }
  return out;
}

export default function CorrosionLab() {
  const [P, set, reset] = useLabParams(CHEMX_SPECS.corrosion);
  const { o2, pH, area, I, prot } = P;
  const c = corrosion(pH, o2, area, prot, I);
  const spots = useMemo(() => rustSpots(Math.round(Math.min(90, c.rate * 70))), [c.rate]);
  const bubbles = useMemo<V3[]>(() => [[-1.5, 0.3, 0.3], [-1.3, 2.2, 0.3]], []);
  const bubbles2 = useMemo<V3[]>(() => [[1.2, 0.3, -0.3], [1.4, 2.2, -0.3]], []);
  const oxy = useMemo<V3[]>(() => [[-3.5, 1.8, 0.9], [3.5, 1.4, 0.9]], []);
  const wire = useMemo<V3[]>(() => [[0, 0.4, 0], [0, 2.6, 0], [2.6, 2.6, 0], [2.6, -0.4, 1.4]], []);
  const water = mix("#2b6f9e", "#7fb04a", Math.max(0, (7 - pH) / 5) * 0.4);
  return (
    <LabFrame
      label="A steel pipe lying in water; rust spots grow with the corrosion rate, hydrogen bubbles appear in acid, and a sacrificial anode or an impressed-current source is wired to the pipe with electrons flowing to protect it"
      camera={[0.5, 2.6, 8.5]}
      onReset={reset}
      scene={() => (<group>
        <Box p={[0, -0.2, 0]} s={[7.4, 2.6, 3.2]} c={water} o={0.22} />
        <Rod a={[-3, 0, 0]} b={[3, 0, 0]} r={0.36} color="#8d9aa1" />
        <Instances items={spots} cap={90} shape="box" />
        {o2 > 0 && <Flow path={oxy} n={Math.round(o2)} speed={0.15} color="#e8f1f5" r={0.05} />}
        {pH < 4.5 && <><Flow path={bubbles} n={6} speed={0.5} color="#e8f1f5" r={0.07} /><Flow path={bubbles2} n={6} speed={0.45} color="#e8f1f5" r={0.07} /></>}
        {prot !== "none" && (<>
          <Line points={wire} color={C.light} lineWidth={2} />
          <Flow path={[...wire].reverse()} n={10} speed={0.25 + c.supplyA / 4} color={C.blue} r={0.06} />
          {prot === "iccp" ? (<>
            <Box p={[1.3, 2.6, 0]} s={[0.9, 0.6, 0.6]} c={C.dark} />
            <Box p={[2.6, -0.6, 1.4]} s={[0.25, 0.9, 0.25]} c="#2b2b2b" />
          </>) : <Box p={[2.6, -0.6, 1.4]} s={[0.6, 0.6, 0.6]} c={prot === "zinc" ? "#b8c4cc" : "#e4e9ec"} glow={0.15} />}
        </>)}
      </group>)}
      readouts={[
        ["Corrosion current density", `${c.icorr.toFixed(1)} μA/cm²`],
        ["Mechanism", c.mech],
        ["Corrosion rate now", `${c.rate.toFixed(3)} mm/year`],
        ["Current to protect fully", `${c.needA.toFixed(2)} A`],
        ["Protection", `${(c.frac * 100).toFixed(0)} %${c.overprotect ? " (over-protected: wasteful, may blister coatings)" : ""}`],
        ["Anode used up", c.anodeKgPerYear > 0 ? `${c.anodeKgPerYear.toFixed(1)} kg/year` : "—"],
      ]}
      controls={<>
        <Slider label="Dissolved oxygen" value={o2} min={0} max={15} step={0.1} digits={1} unit=" ppm" onChange={(x) => set("o2", x)} />
        <Slider label="pH of the water" value={pH} min={2} max={12} step={0.1} digits={1} onChange={(x) => set("pH", x)} />
        <Slider label="Pipe surface area" value={area} min={0.1} max={10} step={0.1} digits={1} unit=" m²" onChange={(x) => set("area", x)} />
        <Pick label="Protection" value={prot} options={[{ id: "none", label: "None" }, { id: "zinc", label: "Sacrificial zinc anode" }, { id: "magnesium", label: "Sacrificial magnesium anode" }, { id: "iccp", label: "Impressed current (ICCP)" }] as { id: Protect; label: string }[]} onChange={(x) => set("prot", x)} />
        <Slider label="ICCP current" value={I} min={0} max={5} step={0.05} digits={2} unit=" A" onChange={(x) => set("I", x)} />
      </>}
      note={<p>Wet corrosion is an electrochemical cell on the metal surface. At anodic spots Fe → Fe²⁺ + 2e⁻; the electrons are used at cathodic spots by <b>hydrogen evolution</b> in acid (2H⁺ + 2e⁻ → H₂, bubbles) or <b>oxygen absorption</b> in neutral water (O₂ + 2H₂O + 4e⁻ → 4OH⁻). Fe²⁺ + OH⁻ then forms Fe(OH)₂ and rust, Fe₂O₃·xH₂O. Cathodic protection supplies those electrons from outside so the steel never has to dissolve: a more active <b>sacrificial anode</b> (Zn, Mg) corrodes instead, or a DC source drives current from an inert anode (<b>ICCP</b>). Rates use 1 μA/cm² ≈ 0.0116 mm/year for iron; the current-density model is simplified.</p>}
    />
  );
}
