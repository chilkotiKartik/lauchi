"use client";
import { useMemo } from "react";
import { bjtCurrents, bjtRegion, cbInput, cbOutput, ceInput, ceOutput, si, vbeFor, vebFor, type BjtCfg } from "../sim/elexy";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { ELEXY_SPECS } from "../meta/elexy.specs";
import { C, Box, Panel, type V3 } from "../kit";
import { Arrow, Flow, Graph, Rod, type Curve, type XY } from "../kit2";
import { Ground } from "./elexy-kit";

const FAM = [0.1, 0.2, 0.3, 0.4, 0.5]; // base-current family (mA)
const FCOL = [C.grey, C.blue, C.green, C.orange, C.purple];
const NAMES: Record<BjtCfg, string> = { cb: "common base", ce: "common emitter", cc: "common collector (emitter follower)" };

function Transistor({ cfg, IC, IB, IE }: { cfg: BjtCfg; IC: number; IB: number; IE: number }) {
  const common = cfg === "cb" ? "B" : cfg === "ce" ? "E" : "C";
  const path = useMemo<V3[]>(() => [[-1.6, 0, 0], [1.6, 0, 0]], []);
  const basePath = useMemo<V3[]>(() => [[-0.6, 0, 0.1], [-0.05, 0.1, 0.2], [0, 1.4, 0.2]], []);
  const k = 1.5 / Math.max(IE, 1e-9), len = (i: number) => Math.max(0.25, Math.min(1.6, i * k));
  const gnd: Record<string, V3> = { E: [-2.4, -0.55, 0], B: [0, 1.95, 0], C: [2.4, -0.55, 0] };
  return (
    <group>
      <Box p={[-1, 0, 0]} s={[1.1, 1.3, 1.1]} c={C.blue} o={0.8} />
      <Box p={[0, 0, 0]} s={[0.22, 1.3, 1.1]} c={C.red} o={0.85} />
      <Box p={[1.15, 0, 0]} s={[1.6, 1.3, 1.1]} c={C.blue} o={0.6} />
      <Rod a={[-1.55, 0, 0]} b={[-2.4, 0, 0]} r={0.06} color={common === "E" ? C.green : C.light} />
      <Rod a={[0, 0.65, 0]} b={[0, 1.6, 0]} r={0.06} color={common === "B" ? C.green : C.light} />
      <Rod a={[1.95, 0, 0]} b={[2.4, 0, 0]} r={0.06} color={common === "C" ? C.green : C.light} />
      <Ground p={gnd[common]} />
      <Flow path={path} n={18} speed={Math.min(1.2, 0.15 + IC / 40)} color={C.gold} r={0.06} cap={20} />
      <Flow path={basePath} n={3} speed={0.3} color={C.purple} r={0.07} cap={4} />
      <Arrow from={[-2.4, -0.95, 0.6]} to={[-2.4 + len(IE), -0.95, 0.6]} color={C.blue} />
      <Arrow from={[2.4 - len(IC), -0.95, 0.6]} to={[2.4, -0.95, 0.6]} color={C.green} />
      <Arrow from={[0.35, 1.6, 0.4]} to={[0.35, 1.6 - len(IB), 0.4]} color={C.gold} />
    </group>
  );
}

export default function BjtConfigLab() {
  const [P, set, reset] = useLabParams(ELEXY_SPECS.bjtconfig);
  const { beta, cfg, IB, ICEO, Vout } = P;
  const cur = bjtCurrents(beta, IB, ICEO / 1000);
  const a = cur.alpha, ICBO = cur.ICBO;
  const vo = cfg === "cb" ? Vout : Math.max(0, Vout);
  const region = bjtRegion(cfg, vo, IB);
  const gain = cfg === "cb" ? `α = ${a.toFixed(4)}` : cfg === "ce" ? `β = ${beta.toFixed(0)}` : `γ = 1 + β = ${(1 + beta).toFixed(0)}`;
  const G = useMemo(() => {
    const inp: Curve[] = [], out: Curve[] = [];
    const icMax = (beta * 0.5 + ICEO / 1000) * 1.25 * (cfg === "ce" ? 1 : (1 + beta) / beta);
    // input characteristics
    if (cfg === "ce") [0, 1, 10].forEach((vce, j) => inp.push({ pts: Array.from({ length: 81 }, (_, i) => { const v = 0.4 + 0.45 * (i / 80); return [v, ceInput(v, vce, beta)] as XY; }), color: [C.orange, C.blue, C.green][j], w: 2.2 }));
    else if (cfg === "cb") [0, 5, 10].forEach((vcb, j) => inp.push({ pts: Array.from({ length: 81 }, (_, i) => { const v = 0.4 + 0.45 * (i / 80); return [v, cbInput(v, vcb, a)] as XY; }), color: [C.orange, C.blue, C.green][j], w: 2.2 }));
    else [2, 4].forEach((vce, j) => inp.push({ pts: Array.from({ length: 81 }, (_, i) => { const v = (vce * i) / 80; return [v, ceInput(vce - v, vce, beta)] as XY; }), color: [C.blue, C.green][j], w: 2.2 }));
    // output characteristics
    const x0 = cfg === "cb" ? -1 : 0;
    FAM.forEach((ib, j) => out.push({ pts: Array.from({ length: 121 }, (_, i) => { const v = x0 + ((15 - x0) * i) / 120; return [v, cfg === "cb" ? cbOutput(v, (1 + beta) * ib + ICEO / 1000, a, ICBO) : ceOutput(v, ib, beta, ICEO / 1000) + (cfg === "cc" ? ib : 0)] as XY; }), color: FCOL[j], w: 1.6 }));
    out.push({ pts: Array.from({ length: 121 }, (_, i) => { const v = x0 + ((15 - x0) * i) / 120; return [v, cfg === "cb" ? cbOutput(v, cur.IE, a, ICBO) : ceOutput(v, IB, beta, ICEO / 1000) + (cfg === "cc" ? IB : 0)] as XY; }), color: C.gold, w: 3.2 });
    return { inp, out, icMax, x0 };
  }, [cfg, beta, a, ICBO, ICEO, IB, cur.IE]);
  const inMarker: XY | null = cfg === "ce" ? (IB > 0 ? [vbeFor(IB, Math.max(0, vo), beta), IB] : null) : cfg === "cb" ? (cur.IE > 0 ? [vebFor(cur.IE, Math.max(0, vo), a), cur.IE] : null) : null;
  const outY = cfg === "cb" ? cbOutput(vo, cur.IE, a, ICBO) : ceOutput(vo, IB, beta, ICEO / 1000) + (cfg === "cc" ? IB : 0);
  const [sLo, sHi] = cfg === "cb" ? [-1, 0] : [0, 0.2];
  const OX = 0.4, OW = 4.6, OY = -3.3, OH = 3.0;
  return (
    <LabFrame
      label="A 3-D npn transistor slab (blue emitter, thin red base, blue collector) with the common terminal earthed in green, electrons streaming emitter to collector and arrows sized by the three currents; beside it the input characteristic on top and the output characteristic family below, with the saturation strip shaded purple and the cut-off strip grey"
      camera={[0.4, 0.2, 11]}
      onReset={reset}
      scene={() => (<group>
        <group position={[-3.4, 0.2, 0]} rotation={[0.15, 0.35, 0]}><Transistor cfg={cfg} IC={cur.IC} IB={IB} IE={cur.IE} /></group>
        <Graph x0={OX} y0={0.9} w={OW} h={2.3} xr={cfg === "cc" ? [0, 4] : [0.4, 0.85]} yr={[0, cfg === "cb" ? Math.max(1, cur.IE * 1.6) : 0.6]} curves={G.inp} marker={inMarker} markerColor={C.red} />
        <Graph x0={OX} y0={OY} w={OW} h={OH} xr={[G.x0, 15]} yr={[0, G.icMax]} curves={G.out} marker={IB > 0 ? [vo, outY] : null} markerColor={C.red} />
        <Panel p={[OX + (OW * ((sLo + sHi) / 2 - G.x0)) / (15 - G.x0), OY + OH / 2, 0.005]} w={(OW * (sHi - sLo)) / (15 - G.x0)} h={OH} c={C.purple} o={0.35} />
        <Panel p={[OX + OW / 2, OY + 0.08, 0.006]} w={OW} h={0.16} c={C.grey} o={0.6} />
      </group>)}
      readouts={[
        ["α = β/(1 + β)", a.toFixed(4)],
        ["γ = I_E/I_B = 1 + β", (1 + beta).toFixed(0)],
        ["I_C = βI_B + I_CEO", si(cur.IC / 1000, "A")],
        ["I_E = I_C + I_B", si(cur.IE / 1000, "A")],
        ["Region at this output voltage", region],
        [`Current gain (${cfg.toUpperCase()})`, gain],
      ]}
      controls={<>
        <Slider label="Current gain β" value={beta} min={20} max={400} step={1} digits={0} onChange={(x) => set("beta", x)} />
        <Pick label="Configuration" value={cfg} options={[{ id: "cb", label: "Common base (CB)" }, { id: "ce", label: "Common emitter (CE)" }, { id: "cc", label: "Common collector (CC)" }]} onChange={(x) => set("cfg", x)} />
        <Slider label="Base current I_B" value={IB} min={0} max={0.5} step={0.01} digits={2} unit=" mA" onChange={(x) => set("IB", x)} />
        <Slider label="Leakage I_CEO" value={ICEO} min={0} max={100} step={1} digits={0} unit=" µA" onChange={(x) => set("ICEO", x)} />
        <Slider label={cfg === "cb" ? "Output voltage V_CB" : "Output voltage V_CE"} value={Vout} min={-1} max={15} step={0.1} digits={1} unit=" V" onChange={(x) => set("Vout", x)} />
      </>}
      note={<>
        <p>In an npn transistor electrons from the heavily doped <b>emitter</b> cross the thin, lightly doped <b>base</b>; a few recombine there (that is the base current) and the rest are swept into the <b>collector</b>. So I<sub>E</sub> = I<sub>B</sub> + I<sub>C</sub>, α = I<sub>C</sub>/I<sub>E</sub> (just below 1), β = I<sub>C</sub>/I<sub>B</sub> = α/(1 − α), γ = I<sub>E</sub>/I<sub>B</sub> = 1 + β, and with leakage I<sub>C</sub> = βI<sub>B</sub> + I<sub>CEO</sub>, I<sub>CEO</sub> = (1 + β)I<sub>CBO</sub>.</p>
        <p>You are viewing the <b>{NAMES[cfg]}</b> connection (green lead is common). <b>CB:</b> input I<sub>E</sub> vs V<sub>EB</sub> (curves move left as V<sub>CB</sub> rises, Early effect); output I<sub>C</sub> ≈ αI<sub>E</sub>, flat even at V<sub>CB</sub> = 0, falling only when V<sub>CB</sub> goes about −0.6 V negative (saturation, purple). Low R<sub>i</sub>, very high R<sub>o</sub>, A<sub>i</sub> = α. <b>CE:</b> input I<sub>B</sub> vs V<sub>BE</sub> (curves for V<sub>CE</sub> = 0, 1, 10 V move right); output I<sub>C</sub> vs V<sub>CE</sub> for I<sub>B</sub> = 0.1…0.5 mA (gold = yours) with saturation below ≈ 0.2 V and cut-off along the bottom (I<sub>B</sub> = 0, I<sub>C</sub> = I<sub>CEO</sub>). A<sub>i</sub> = β, 180° phase shift: the usual amplifier. <b>CC:</b> input I<sub>B</sub> vs V<sub>BC</sub> for V<sub>CE</sub> = 2 and 4 V; output I<sub>E</sub> vs V<sub>CE</sub>; A<sub>i</sub> = 1 + β, A<sub>v</sub> ≈ 1, high R<sub>i</sub> and low R<sub>o</sub>: a buffer.</p>
        <p><b>Try:</b> the PYQ preset (β = 98, I<sub>CEO</sub> = 40 µA, I<sub>B</sub> = 0.3 mA gives I<sub>C</sub> = 29.44 mA). Drag V<sub>CE</sub> below 0.2 V to saturate. Simplified model: Ebers–Moll-style curves with the Early slopes exaggerated so you can see them.</p>
      </>}
    />
  );
}
