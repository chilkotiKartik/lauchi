"use client";
import { useMemo } from "react";
import { beer, CHROMO, epsAt, nmToHex, type Chromo } from "../sim/chemy";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { CHEMY_SPECS } from "../meta/chemy.specs";
import { C, Ball, Box } from "../kit";
import { Dial, Flow, Graph, Rod, mix, type XY } from "../kit2";
import type { V3 } from "../kit";

const SEEN: Record<string, string> = { Colourless: "#cfe8f3", "Yellow-green": "#b5e61d", "Yellow-orange": "#ffa81f", Orange: "#ff8c00", Red: "#ff3030", Purple: "#a040c0", Violet: "#8a2be2", Blue: "#2b6fff", "Green-blue": "#20b2aa", "Blue-green": "#20c0a0" };
const IN: V3[] = [[-3.6, 0.6, 0], [-1.3, 0.6, 0]], OUT: V3[] = [[-0.5, 0.6, 0], [1.0, 0.6, 0]];

export default function BeerLambertLab() {
  const [P, set, reset] = useLabParams(CHEMY_SPECS.beerlambert);
  const { c, l, lam, ch } = P;
  const b = beer(ch, c, l, lam);
  const beam = nmToHex(lam);
  const peakA = epsAt(ch, CHROMO[ch].lmax) * (c / 1000) * l;
  const spec = useMemo<XY[]>(() => Array.from({ length: 146 }, (_, i) => { const x = 120 + i * 4; return [x, epsAt(ch, x) * (c / 1000) * l] as XY; }), [ch, c, l]);
  const yMax = Math.max(1, peakA * 1.1);
  const liquid = mix("#cfe8f3", SEEN[b.seen] ?? "#cfe8f3", Math.min(1, peakA));
  const nOut = Math.round(14 * b.T / 100);
  return (
    <LabFrame
      label="A UV–visible spectrophotometer: a glowing lamp, a prism selecting one wavelength, a coloured beam with photons passing through a cuvette of solution, a weaker beam reaching the detector meter, and the absorption spectrum of the compound with the chosen wavelength marked"
      camera={[0.6, 1.6, 10]}
      onReset={reset}
      scene={() => (<group rotation={[0.05, -0.22, 0]}>
        <Ball p={[-4.1, 0.6, 0]} r={0.35} c={C.gold} glow={1.2} />
        <mesh position={[-3.3, 0.6, 0]} rotation={[0, 0, Math.PI / 2]}><coneGeometry args={[0.35, 0.6, 3]} /><meshStandardMaterial color={C.purple} transparent opacity={0.7} emissive={C.purple} emissiveIntensity={0.3} /></mesh>
        <Rod a={[-3.0, 0.6, 0]} b={[-1.3, 0.6, 0]} r={0.08} color={beam} glow={0.9} o={0.9} />
        <Flow path={IN} n={14} speed={0.45} color={beam} r={0.07} />
        <Box p={[-0.9, 0.6, 0]} s={[0.15 + 0.12 * l, 1.4, 0.9]} c={liquid} o={0.75} glow={0.15} />
        <Box p={[-0.9, 0.6, 0]} s={[0.25 + 0.12 * l, 1.6, 1.0]} c="#e8f1f5" o={0.15} />
        <Rod a={[-0.5, 0.6, 0]} b={[1.0, 0.6, 0]} r={0.02 + 0.06 * b.T / 100} color={beam} glow={0.9} o={0.25 + 0.65 * b.T / 100} />
        {nOut > 0 && <Flow path={OUT} n={nOut} speed={0.45} color={beam} r={0.07} />}
        <Box p={[1.2, 0.6, 0]} s={[0.35, 0.9, 0.9]} c={C.dark} />
        <Dial p={[1.2, -0.9, 0.2]} f={b.T / 100} color={C.red} size={0.55} />
        <Box p={[-1.4, -0.15, 0]} s={[6.2, 0.12, 1.4]} c={C.grey} />
        <Graph x0={1.9} y0={-1.7} w={3} h={3.4} xr={[120, 700]} yr={[0, yMax]} curves={[{ pts: spec, color: C.green, w: 3 }]} marker={[lam, b.A]} markerColor={beam === "#000000" ? C.red : beam} vlines={[{ x: b.lmax, color: C.gold }, { x: 400, color: C.light }]} />
      </group>)}
      readouts={[
        ["λmax · transition", `${b.lmax} nm · ${b.tr}`],
        ["ε at chosen λ", `${b.eps.toFixed(b.eps < 100 ? 1 : 0)} L mol⁻¹ cm⁻¹`],
        ["Absorbance A = εcl", b.A.toFixed(3)],
        ["Transmittance %T", `${b.T.toFixed(1)} %`],
        ["Transition energy", `${b.eV.toFixed(2)} eV (${b.kJ.toFixed(0)} kJ/mol)`],
        ["Region · colour seen", `${b.region} · ${b.seen}`],
      ]}
      controls={<>
        <Slider label="Concentration c" value={c} min={0} max={50} step={0.001} digits={3} unit=" mmol/L" onChange={(x) => set("c", x)} />
        <Pick label="Compound (chromophore)" value={ch} options={(Object.keys(CHROMO) as Chromo[]).map((k) => ({ id: k, label: `${CHROMO[k].name} — ${CHROMO[k].tr}` }))} onChange={(x) => set("ch", x)} />
        <Slider label="Wavelength λ" value={lam} min={120} max={700} step={1} digits={0} unit=" nm" onChange={(x) => set("lam", x)} />
        <Slider label="Path length l" value={l} min={0.1} max={10} step={0.1} digits={1} unit=" cm" onChange={(x) => set("l", x)} />
      </>}
      note={<>
        <p><b>Electronic spectroscopy</b>: UV (200–400 nm) or visible (400–800 nm) light lifts an electron from a filled orbital to an empty antibonding one. In order of falling energy: <b>σ → σ*</b> (alkanes, &lt; 150 nm), <b>n → σ*</b> (O, N, halogen lone pairs, 150–250 nm), <b>π → π*</b> (C=C, C=O, aromatics; strong, ε ≈ 10³–10⁵) and <b>n → π*</b> (C=O; weak, &ldquo;forbidden&rdquo;, ε &lt; 100). Conjugation narrows the HOMO–LUMO gap, so λmax shifts to longer wavelength (<b>bathochromic / red shift</b>) and ε grows (<b>hyperchromic</b>): ethene 171 nm → butadiene 217 → hexatriene 258 → β-carotene 452 nm (coloured).</p>
        <p className="mt-2"><b>Beer–Lambert law</b>: A = log₁₀(I₀/I) = εcl, so absorbance is proportional to concentration and path length — the basis of quantitative analysis (keep A between about 0.1 and 1).</p>
        <p className="mt-2"><b>Try:</b> double c or l and watch A double while %T falls exponentially. Move λ off λmax and ε drops. Bands are drawn as simplified Gaussians; ε values are typical textbook figures.</p>
      </>}
    />
  );
}
