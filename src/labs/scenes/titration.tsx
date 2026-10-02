"use client";
import { Line } from "@react-three/drei";
import { useMemo } from "react";
import { titrationPH } from "../math";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { CORE_SPECS } from "../meta/core.specs";

export default function TitrationLab() {
  const [P, set, reset] = useLabParams(CORE_SPECS.titration);
  const { kind, Vb, Cb } = P;
  const setKind = (x: (typeof P)["kind"]) => set("kind", x), setVb = (x: (typeof P)["Vb"]) => set("Vb", x), setCb = (x: (typeof P)["Cb"]) => set("Cb", x);
  const Ca = 0.1, Va = 25;
  const eq = (Ca * Va) / Cb;
  const ph = titrationPH(kind, Ca, Va, Cb, Vb);
  const vMax = eq * 2;
  const pts = useMemo(() => Array.from({ length: 160 }, (_, i) => { const v = (i / 159) * vMax; return [(v / vMax) * 3.4 + 0.3, (titrationPH(kind, Ca, Va, Cb, v) / 14) * 3 - 1.5, 0] as [number, number, number]; }), [kind, Cb, vMax]);
  const pink = ph > 8.2; // phenolphthalein turns pink from about pH 8.2
  const level = 0.35 + 1.3 * ((Va + Vb) / (Va + vMax));
  return (
    <LabFrame
      label="Acid–base titration curve with a flask that changes colour at the end point"
      animated={false}
      camera={[0, 0.5, 8]}
      onReset={reset}
      scene={() => (<group>
        <group position={[-2.6, -0.4, 0]}>
          <mesh position={[0, 0.5, 0]}><cylinderGeometry args={[0.7, 0.7, 2.2, 32, 1, true]} /><meshStandardMaterial color="#9fd8ff" transparent opacity={0.22} side={2} /></mesh>
          <mesh position={[0, -0.6 + level / 2, 0]}><cylinderGeometry args={[0.66, 0.66, level, 32]} /><meshStandardMaterial color={pink ? "#ff4fa3" : "#cfeaff"} transparent opacity={0.85} /></mesh>
          <mesh position={[0, 2.3, 0]}><cylinderGeometry args={[0.09, 0.09, 1.6, 12]} /><meshStandardMaterial color="#cfd8dc" /></mesh>
          {Vb > 0 && <mesh position={[0, 1.5, 0]}><sphereGeometry args={[0.06, 12, 12]} /><meshStandardMaterial color="#9fd8ff" /></mesh>}
        </group>
        <Line points={[[0.3, -1.5, 0], [3.7, -1.5, 0]]} color="#5b6d77" lineWidth={1.5} />
        <Line points={[[0.3, -1.5, 0], [0.3, 1.5, 0]]} color="#5b6d77" lineWidth={1.5} />
        <Line points={[[0.3, (7 / 14) * 3 - 1.5, 0], [3.7, (7 / 14) * 3 - 1.5, 0]]} color="#33454e" lineWidth={1} dashed dashSize={0.1} gapSize={0.08} />
        <Line points={[[(eq / vMax) * 3.4 + 0.3, -1.5, 0], [(eq / vMax) * 3.4 + 0.3, 1.5, 0]]} color="#33454e" lineWidth={1} dashed dashSize={0.1} gapSize={0.08} />
        <Line points={pts} color="#44c95a" lineWidth={3.5} />
        <mesh position={[(Vb / vMax) * 3.4 + 0.3, (ph / 14) * 3 - 1.5, 0.05]}><sphereGeometry args={[0.1, 16, 16]} /><meshStandardMaterial color="#ffc83d" emissive="#ffc83d" emissiveIntensity={0.6} /></mesh>
      </group>)}
      readouts={[["pH", ph.toFixed(2)], ["Base added", `${Vb.toFixed(1)} mL`], ["Equivalence at", `${eq.toFixed(1)} mL`], ["Indicator", pink ? "pink (basic)" : "colourless"]]}
      controls={<>
        <Pick label="Acid (25 mL of 0.1 M)" value={kind} options={[{ id: "strong", label: "Strong acid (HCl)" }, { id: "weak", label: "Weak acid (CH₃COOH, Ka = 1.8×10⁻⁵)" }]} onChange={setKind} />
        <Slider label="Volume of NaOH added" value={Vb} min={0} max={vMax} step={0.1} digits={1} unit=" mL" onChange={setVb} />
        <Slider label="NaOH concentration" value={Cb} min={0.05} max={0.2} step={0.01} digits={2} unit=" M" onChange={(v) => { setCb(v); setVb(0); }} />
      </>}
      note={<p>Drag the burette volume and the yellow dot walks along the titration curve. For a strong acid with a strong base the curve is nearly flat, then jumps through pH 7 at the equivalence point (V = C<sub>a</sub>V<sub>a</sub>/C<sub>b</sub>). For a weak acid the start pH is higher, the curve has a buffer region where pH = pKa at half-equivalence (4.74 here), and the equivalence point lies above pH 7 because the conjugate base hydrolyses. Phenolphthalein turns pink around pH 8.2, so it marks the end point for both.</p>}
    />
  );
}
