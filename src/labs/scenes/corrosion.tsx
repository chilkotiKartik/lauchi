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
  const r = prng(31),
    out: Inst[] = [];
  for (let i = 0; i < 90; i++) {
    const x = -2.8 + r() * 5.6,
      a = r() * 6.28,
      s = 0.08 + r() * 0.16;
    if (i < n) {
      out.push({
        p: [x, Math.cos(a) * 0.38, Math.sin(a) * 0.38],
        s: [s * 1.6, s, s * 1.6],
        c: i % 3 ? "#9a3412" : "#c2410c",
      });
    }
  }
  return out;
}

export default function CorrosionLab() {
  const [P, set, reset] = useLabParams(CHEMX_SPECS.corrosion);
  const { o2, pH, area, I, prot } = P;
  const c = corrosion(pH, o2, area, prot, I);
  const spots = useMemo(() => rustSpots(Math.round(Math.min(90, c.rate * 70))), [c.rate]);
  const bubbles = useMemo<V3[]>(() => [[-1.5, 0.4, 0.3], [-1.3, 2.2, 0.3]], []);
  const bubbles2 = useMemo<V3[]>(() => [[1.2, 0.4, -0.3], [1.4, 2.2, -0.3]], []);
  const oxy = useMemo<V3[]>(() => [[-3.5, 1.8, 0.9], [3.5, 1.4, 0.9]], []);
  const wire = useMemo<V3[]>(() => [[0, 0.4, 0], [0, 2.6, 0], [2.6, 2.6, 0], [2.6, -0.4, 1.4]], []);
  const water = mix("#1e3a8a", "#15803d", Math.max(0, (7 - pH) / 5) * 0.4);

  return (
    <LabFrame
      label="Electrochemical Corrosion & Cathodic Protection: steel pipe immersion, anodic oxidation pits, hydrogen effervescence, and sacrificial anode / ICCP protection"
      camera={[0.5, 2.6, 8.5]}
      onReset={reset}
      note={
        <p>
          Wet corrosion operates as an electrochemical cell on the metal surface: at anodic sites, iron dissolves (<b>Fe $\rightarrow$ Fe²⁺ + 2e⁻</b>), while electrons are consumed at cathodic sites via <b>hydrogen reduction</b> (in acidic media: 2H⁺ + 2e⁻ $\rightarrow$ H₂) or <b>oxygen absorption</b> (neutral water: O₂ + 2H₂O + 4e⁻ $\rightarrow$ 4OH⁻). Cathodic protection supplies excess electrons from a <b>sacrificial anode (Zn/Mg)</b> or an <b>impressed current DC rectifier (ICCP)</b> to polarize the steel structure into the immune thermodynamic domain.
        </p>
      }
      scene={() => (
        <group>
          {/* Glass Electrolyte Tank */}
          <Box p={[0, -0.2, 0]} s={[7.6, 2.8, 3.4]} c={water} o={0.25} />

          {/* Submerged Flanged Steel Pipeline */}
          <Rod a={[-3.2, 0, 0]} b={[3.2, 0, 0]} r={0.38} color="#64748b" />
          {[-3.2, 3.2].map((fx, i) => (
            <mesh key={i} position={[fx, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.52, 0.52, 0.1, 24]} />
              <meshStandardMaterial color="#334155" metalness={0.9} />
            </mesh>
          ))}

          {/* Rust Spots (Iron Oxide Pitting) */}
          <Instances items={spots} cap={90} shape="box" />

          {/* Dissolved Oxygen Diffusion Stream */}
          {o2 > 0 && <Flow path={oxy} n={Math.round(o2)} speed={0.15} color="#e0f2fe" r={0.05} />}

          {/* Acid Hydrogen Gas Effervescence Bubbles */}
          {pH < 4.5 && (
            <>
              <Flow path={bubbles} n={8} speed={0.55} color="#f8fafc" r={0.07} />
              <Flow path={bubbles2} n={8} speed={0.5} color="#f8fafc" r={0.07} />
            </>
          )}

          {/* Cathodic Protection System (Anode & Conductor Wire) */}
          {prot !== "none" && (
            <>
              <Line points={wire} color="#e2e8f0" lineWidth={2.5} />
              <Flow path={[...wire].reverse()} n={12} speed={0.25 + c.supplyA / 4} color="#38bdf8" r={0.06} />

              {prot === "iccp" ? (
                <>
                  {/* ICCP DC Rectifier Unit on Top Rail */}
                  <group position={[1.3, 2.6, 0]}>
                    <Box p={[0, 0, 0]} s={[1.0, 0.7, 0.7]} c="#0f172a" />
                    {/* Glowing LED Power Indicator */}
                    <mesh position={[0, 0, 0.36]}>
                      <boxGeometry args={[0.4, 0.2, 0.02]} />
                      <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={1.2} />
                    </mesh>
                  </group>
                  {/* Inert MMO Titanium/Carbon Anode */}
                  <Box p={[2.6, -0.6, 1.4]} s={[0.28, 1.0, 0.28]} c="#1e293b" glow={0.3} />
                </>
              ) : (
                /* Sacrificial Galvanic Anode Ingot (Zinc / Magnesium) */
                <Box
                  p={[2.6, -0.6, 1.4]}
                  s={[0.65, 0.65, 0.65]}
                  c={prot === "zinc" ? "#94a3b8" : "#cbd5e1"}
                  glow={0.2}
                />
              )}
            </>
          )}
        </group>
      )}
      readouts={[
        ["Corrosion Current Density", `${c.icorr.toFixed(1)} μA/cm²`],
        ["Reaction Mechanism", c.mech],
        ["Corrosion Penetration Rate", `${c.rate.toFixed(3)} mm/year`],
        ["Required Protection Current", `${c.needA.toFixed(2)} A`],
        [
          "Cathodic Protection Level",
          `${(c.frac * 100).toFixed(0)} %${c.overprotect ? " (Over-protected)" : ""}`,
        ],
        ["Anode Consumption Rate", c.anodeKgPerYear > 0 ? `${c.anodeKgPerYear.toFixed(1)} kg/year` : "N/A"],
      ]}
      controls={
        <>
          <Slider label="Dissolved Oxygen (DO)" value={o2} min={0} max={15} step={0.1} digits={1} unit=" ppm" onChange={(x) => set("o2", x)} />
          <Slider label="Electrolyte pH" value={pH} min={2} max={12} step={0.1} digits={1} onChange={(x) => set("pH", x)} />
          <Slider label="Exposed Pipe Area" value={area} min={0.1} max={10} step={0.1} digits={1} unit=" m²" onChange={(x) => set("area", x)} />
          <Pick
            label="Cathodic Protection System"
            value={prot}
            options={[
              { id: "none", label: "None (Unprotected Steel)" },
              { id: "zinc", label: "Sacrificial Zinc Anode (Zn)" },
              { id: "magnesium", label: "Sacrificial Magnesium Ingot (Mg)" },
              { id: "iccp", label: "Impressed Current Cathodic Protection (ICCP)" },
            ] as { id: Protect; label: string }[]}
            onChange={(x) => set("prot", x)}
          />
          <Slider label="ICCP Rectifier Current" value={I} min={0} max={5} step={0.05} digits={2} unit=" A" onChange={(x) => set("I", x)} />
        </>
      }
    />
  );
}
