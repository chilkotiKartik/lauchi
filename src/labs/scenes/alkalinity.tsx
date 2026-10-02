"use client";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { alkalinity, alkPH } from "../sim/chemy";
import { Tick } from "../Stage";
import { LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { CHEMY_SPECS } from "../meta/chemy.specs";
import { C, Bars, Box } from "../kit";
import { Graph, Rod, type XY } from "../kit2";

const GX = 0.6, GY = -2.0, GW = 3.8, GH = 3.8, N_PTS = 140;
const PINK = new THREE.Color("#ff4fa3"), CLEAR = new THREE.Color("#cfe8f3"), YEL = new THREE.Color("#ffd23d"), ORA = new THREE.Color("#ff9a1f"), RED = new THREE.Color("#ff3b3b");

/** Indicator colour: phenolphthalein pink above pH 8.3, then methyl orange yellow → orange → red. */
function indicator(out: THREE.Color, pH: number) {
  if (pH > 8.2) return out.copy(CLEAR).lerp(PINK, Math.min(1, (pH - 8.2) / 1.6));
  if (pH > 4.4) return out.copy(YEL);
  if (pH > 3.1) return out.copy(RED).lerp(ORA, (pH - 3.1) / 1.3);
  return out.copy(RED);
}

export default function AlkalinityLab() {
  const [P, set, reset] = useLabParams(CHEMY_SPECS.alkalinity);
  const { P: Pml, M: Mml, V, N } = P;
  const a = alkalinity(Pml, Mml, N, V);
  const vEnd = Math.max(2, Mml * 1.3);
  const pts = useMemo<XY[]>(() => Array.from({ length: N_PTS + 1 }, (_, i) => { const v = (vEnd * i) / N_PTS; return [v, alkPH(v, a.OH, a.CO3, a.HCO3, N, V)] as XY; }), [vEnd, a.OH, a.CO3, a.HCO3, N, V]);
  const liquid = useRef<THREE.MeshStandardMaterial>(null), drop = useRef<THREE.Mesh>(null), fill = useRef<THREE.Mesh>(null), dot = useRef<THREE.Mesh>(null);
  const t = useRef(0), col = useRef(new THREE.Color());
  const tick = (dt: number) => {
    t.current = (t.current + Math.min(dt, 0.05)) % 10;
    const f = Math.min(1, t.current / 8.5), v = f * vEnd, i = Math.min(N_PTS, Math.round(f * N_PTS)), pH = pts[i][1];
    if (liquid.current) liquid.current.color.copy(indicator(col.current, pH));
    if (fill.current) { const h = 2.6 * (1 - f * 0.8); fill.current.scale.y = h; fill.current.position.y = 0.6 + h / 2; }
    if (drop.current) { const k = (t.current * 2.2) % 1; drop.current.position.y = 0.45 - k * 1.3; drop.current.visible = f < 1; }
    if (dot.current) dot.current.position.set(GX + GW * (v / vEnd), GY + GH * (Math.min(14, Math.max(0, pH)) / 14), 0.05);
  };
  const shown = a.OH + a.CO3 + a.HCO3;
  return (
    <LabFrame
      label="A burette drips acid into a conical flask of water; the flask turns pink with phenolphthalein, then colourless, then yellow and orange-red with methyl orange, while a dot runs along the pH titration curve with the P and M end points marked; three bars show OH⁻, CO₃²⁻ and HCO₃⁻"
      camera={[0.3, 1.2, 10]}
      onReset={reset}
      scene={() => (<group rotation={[0.04, -0.2, 0]}>
        <Tick fn={tick} />
        <Rod a={[-2.6, 0.5, 0]} b={[-2.6, 3.4, 0]} r={0.14} color="#e8f1f5" o={0.25} />
        <mesh ref={fill} position={[-2.6, 1.9, 0]}><cylinderGeometry args={[0.1, 0.1, 1, 12]} /><meshStandardMaterial color={C.blue} emissive={C.blue} emissiveIntensity={0.3} /></mesh>
        <Box p={[-2.6, 2.0, 0.18]} s={[0.25, 0.08, 0.05]} c={C.gold} />
        <mesh ref={drop} position={[-2.6, 0.3, 0]}><sphereGeometry args={[0.07, 12, 12]} /><meshStandardMaterial color={C.blue} emissive={C.blue} emissiveIntensity={0.6} /></mesh>
        <mesh position={[-2.6, -1.1, 0]}><cylinderGeometry args={[0.32, 1.15, 1.7, 24, 1, true]} /><meshStandardMaterial color="#e8f1f5" transparent opacity={0.22} side={THREE.DoubleSide} /></mesh>
        <mesh position={[-2.6, -1.5, 0]}><cylinderGeometry args={[0.73, 1.08, 0.85, 24]} /><meshStandardMaterial ref={liquid} color={PINK} emissive="#301020" transparent opacity={0.9} /></mesh>
        <Box p={[-2.6, -2.0, 0]} s={[2.8, 0.1, 1.6]} c={C.dark} />
        <Bars values={[a.OH, a.CO3, a.HCO3]} max={Math.max(50, shown)} colors={[C.red, C.purple, C.green]} x0={-1.1} y0={-2.0} z={0.2} w={0.32} gap={0.14} height={2.4} glow={0.3} />
        <Graph x0={GX} y0={GY} w={GW} h={GH} xr={[0, vEnd]} yr={[0, 14]} curves={[{ pts, color: C.blue, w: 3 }]} vlines={[{ x: Math.min(Pml, Mml), color: "#ff4fa3" }, { x: Mml, color: C.orange }]} />
        <mesh ref={dot} position={[GX, GY, 0.05]}><sphereGeometry args={[0.11, 16, 16]} /><meshStandardMaterial color={C.gold} emissive={C.gold} emissiveIntensity={0.8} /></mesh>
      </group>)}
      readouts={[
        ["P alkalinity", `${a.P.toFixed(1)} ppm`],
        ["M (total) alkalinity", `${a.M.toFixed(1)} ppm`],
        ["OH⁻", `${a.OH.toFixed(1)} ppm`],
        ["CO₃²⁻", `${a.CO3.toFixed(1)} ppm`],
        ["HCO₃⁻", `${a.HCO3.toFixed(1)} ppm`],
        ["Case", a.clipped ? "P cannot exceed M (set P = M)" : a.rule],
      ]}
      controls={<>
        <Slider label="Acid to phenolphthalein end point (P)" value={Pml} min={0} max={50} step={0.1} digits={1} unit=" mL" onChange={(x) => set("P", x)} />
        <Slider label="Acid to methyl orange end point (M, total)" value={Mml} min={0} max={60} step={0.1} digits={1} unit=" mL" onChange={(x) => set("M", x)} />
        <Slider label="Volume of water sample" value={V} min={25} max={250} step={5} digits={0} unit=" mL" onChange={(x) => set("V", x)} />
        <Slider label="Normality of acid" value={N} min={0.005} max={0.1} step={0.001} digits={3} unit=" N" onChange={(x) => set("N", x)} />
      </>}
      note={<>
        <p><b>Alkalinity</b> is the acid-neutralising power of water, due to OH⁻, CO₃²⁻ and HCO₃⁻ (all expressed as ppm CaCO₃: V<sub>acid</sub> × N × 50 × 1000 / V<sub>sample</sub>). Titrate with standard acid: first to the <b>phenolphthalein</b> end point (pink → colourless, pH ≈ 8.3), where OH⁻ is neutralised and CO₃²⁻ has become HCO₃⁻ (<b>P</b>); then on to the <b>methyl orange</b> end point (yellow → red, pH ≈ 4.3), where all HCO₃⁻ is gone (<b>M</b>, total).</p>
        <p className="mt-2">Because OH⁻ and HCO₃⁻ cannot coexist: P = 0 → only HCO₃⁻ = M; P = ½M → only CO₃²⁻ = 2P; P &lt; ½M → CO₃²⁻ = 2P, HCO₃⁻ = M − 2P; P &gt; ½M → OH⁻ = 2P − M, CO₃²⁻ = 2(M − P); P = M → only OH⁻. Highly alkaline boiler water causes caustic embrittlement, so alkalinity is checked before softening.</p>
        <p className="mt-2"><b>Try:</b> slide P from 0 up to M and watch the bars swap from bicarbonate to carbonate to hydroxide. The pH curve is computed from the carbonate equilibria (pK<sub>a</sub> 6.35 and 10.33).</p>
      </>}
    />
  );
}
