"use client";
import { useMemo } from "react";
import { chainPopulation, polyGrowth, rng, stepGrowth } from "../sim/chemy";
import { useQuality } from "../Stage";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { CHEMY_SPECS } from "../meta/chemy.specs";
import { C, Instances, Segs, Spin, type Inst } from "../kit";
import { Graph, type XY } from "../kit2";

const PAL = [C.green, C.blue, C.purple, C.orange, C.gold, C.red];
const B = 1.7;

function build(lengths: number[]) {
  const r = rng(11), items: Inst[] = [], segs: number[] = [];
  const refl = (x: number) => (x > B ? 2 * B - x : x < -B ? -2 * B - x : x);
  lengths.forEach((L, ci) => {
    let x = (r() - 0.5) * 2 * B, y = (r() - 0.5) * 2 * B, z = (r() - 0.5) * 2 * B;
    const col = L === 1 ? C.light : PAL[ci % PAL.length], s = L === 1 ? 0.17 : 0.2;
    for (let k = 0; k < L; k++) {
      if (k > 0) {
        const th = r() * Math.PI * 2, u = r() * 2 - 1, q = Math.sqrt(1 - u * u), px = x, py = y, pz = z;
        x = refl(x + 0.3 * q * Math.cos(th)); y = refl(y + 0.3 * u); z = refl(z + 0.3 * q * Math.sin(th));
        segs.push(px, py, pz, x, y, z);
      }
      items.push({ p: [x, y, z], s: [s, s, s], c: col });
    }
  });
  return { items, segs };
}

export default function PolyGrowthLab() {
  const [P, set, reset] = useLabParams(CHEMY_SPECS.polygrowth);
  const { p, r, M0, dpc, mode } = P;
  const q = useQuality();
  const total = q === "low" ? 150 : 240;
  const g = polyGrowth(p, r, M0, dpc);
  const pop = useMemo(() => build(chainPopulation(mode, p, total)), [mode, p, total]);
  const stepCurve = useMemo<XY[]>(() => Array.from({ length: 121 }, (_, i) => { const pp = 0.5 + (0.499 * i) / 120; return [pp, Math.log10(stepGrowth(pp, r).Xn)] as XY; }), [r]);
  const chainCurve: XY[] = [[0.5, Math.log10(dpc)], [1, Math.log10(dpc)]];
  const step = mode === "step";
  const Xn = step ? g.Xn : g.chainXn;
  return (
    <LabFrame
      label="A box of repeat units: coloured chains of beads linked by bonds and grey unreacted monomers, slowly turning; a graph of log degree of polymerisation against conversion compares step growth (rising steeply near 100 %) with chain growth (flat and high)"
      camera={[0.8, 1.4, 10]}
      onReset={reset}
      scene={() => (<group>
        <group position={[-2.3, 0.1, 0]}>
          <Spin speed={0.18}>
            <Instances items={pop.items} cap={240} shape="sphere" />
            <Segs pts={pop.segs} c={C.white} />
            <mesh><boxGeometry args={[2 * B + 0.4, 2 * B + 0.4, 2 * B + 0.4]} /><meshStandardMaterial color={C.blue} transparent opacity={0.06} /></mesh>
          </Spin>
        </group>
        <Graph x0={0.9} y0={-1.9} w={3.6} h={3.8} xr={[0.5, 1]} yr={[0, 4]} curves={[{ pts: stepCurve, color: C.gold, w: 3 }, { pts: chainCurve, color: C.purple, w: 2.5, dashed: true }]} marker={[p, Math.log10(Xn)]} markerColor={step ? C.gold : C.purple} />
      </group>)}
      readouts={[
        ["Degree of polymerisation X̄n", step ? g.Xn.toFixed(1) : `${dpc.toFixed(0)} (set by kinetics)`],
        ["Mn = X̄n × M₀", `${(Xn * M0).toFixed(0)} g/mol`],
        ["Polydispersity Mw/Mn", step ? g.PDI.toFixed(3) : "≈ 1.5–2"],
        ["Monomer left (by mass)", `${((step ? g.monomerLeft : g.chainMonomerLeft) * 100).toFixed(2)} %`],
        ["Step growth at this p", `X̄n = ${g.Xn.toFixed(1)}`],
        ["Chain growth at this p", `X̄n ≈ ${dpc.toFixed(0)}`],
      ]}
      controls={<>
        <Slider label="Extent of reaction p" value={p} min={0.5} max={0.999} step={0.001} digits={3} onChange={(x) => set("p", x)} />
        <Pick label="Mechanism shown" value={mode} options={[{ id: "step", label: "Step growth (condensation)" }, { id: "chain", label: "Chain growth (addition)" }] as { id: "step" | "chain"; label: string }[]} onChange={(x) => set("mode", x)} />
        <Slider label="Stoichiometric ratio r" value={r} min={0.9} max={1} step={0.001} digits={3} onChange={(x) => set("r", x)} />
        <Slider label="Mass per repeat unit M₀" value={M0} min={14} max={300} step={1} digits={0} unit=" g/mol" onChange={(x) => set("M0", x)} />
        <Slider label="Chain-growth chain length" value={dpc} min={50} max={5000} step={10} digits={0} onChange={(x) => set("dpc", x)} />
      </>}
      note={<>
        <p><b>Step growth (condensation)</b>: any two molecules with reactive end groups can join (–COOH + –NH₂ → –CONH– + H₂O for nylon-6,6). Monomers vanish early, dimers and oligomers build up, and long chains appear only at the very end. Carothers&apos; equation: X̄n = 1/(1 − p), or (1 + r)/(1 + r − 2rp) with a stoichiometric imbalance r; PDI = 1 + p → 2.</p>
        <p className="mt-2"><b>Chain growth (addition)</b>: an initiator makes an active centre (free radical, cation or anion) that adds monomer after monomer in milliseconds (initiation → propagation → termination). Long chains exist from the first moment; conversion only changes how many there are, and unreacted monomer remains (e.g. polyethylene, PVC, PMMA, PAN).</p>
        <p className="mt-2"><b>Try:</b> step growth at p = 0.90, 0.99 and 0.999 gives 10, 100 and 1000 units. Then set r = 0.98: even complete reaction stops at 99. Functionality must be ≥ 2 for a chain to grow, which is why methanol (f = 1) cannot polymerise. The picture is a sample of a few hundred repeat units.</p>
      </>}
    />
  );
}
