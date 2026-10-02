"use client";
import { useMemo } from "react";
import { biasLineI, jfetBias, si } from "../sim/elexy";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { ELEXY_SPECS } from "../meta/elexy.specs";
import { C, Box, spans, type V3 } from "../kit";
import { Flow, Graph, type XY } from "../kit2";

/** A stacked column: V_DD split into I_D R_D, V_DS and I_D R_S (heights in volts × s). */
function Stack({ VDD, VRD, VDS, VRS, s }: { VDD: number; VRD: number; VDS: number; VRS: number; s: number }) {
  const cols = [C.green, C.blue, C.orange];
  const sp = spans([VRS, Math.max(0, VDS), VRD].map((v) => Math.max(0.02, v * s)));
  return (
    <group>
      <Box p={[0, (VDD * s) / 2, -0.35]} s={[0.15, VDD * s, 0.15]} c={C.light} />
      {sp.map(({ x, w }, i) => <Box key={i} p={[0, x + w / 2, 0]} s={[0.7, w, 0.7]} c={cols[i]} glow={0.3} />)}
    </group>
  );
}

export default function JfetBiasLab() {
  const [P, set, reset] = useLabParams(ELEXY_SPECS.jfetbias);
  const { RS, mode, VDD, RD, VGG, R1, R2, IDSS, VP } = P;
  const q = jfetBias(mode, VDD, RD, RS, VGG, R1, R2, IDSS, VP);
  const x0 = VP * 1.08, x1 = Math.max(0.5, q.VG + 0.3);
  const curves = useMemo(() => {
    const shock: XY[] = [], line: XY[] = [];
    for (let i = 0; i <= 120; i++) { const v = VP + ((0 - VP) * i) / 120; shock.push([v, IDSS * (1 - v / VP) ** 2]); }
    if (mode !== "fixed" && RS > 0) for (let i = 0; i <= 60; i++) { const v = x1 - ((x1 - x0) * i) / 60, id = biasLineI(q.VG, RS, v); if (id >= 0 && id <= IDSS * 1.15) line.push([v, id]); }
    return [{ pts: shock, color: C.blue, w: 3.2 }, { pts: line, color: C.orange, w: 2.6 }];
  }, [VP, IDSS, mode, RS, q.VG, x0, x1]);
  const squeeze = q.ID > 0 ? Math.min(1, Math.max(0, q.VGS / VP)) : 1;
  const path = useMemo<V3[]>(() => [[-1.6, 0, 0], [1.6, 0, 0]], []);
  return (
    <LabFrame
      label="The JFET transfer curve (blue Shockley parabola) crossed by the orange bias line, with the Q point pulsing at their intersection; beside it a 3-D JFET bar whose red gates squeeze the blue channel according to V_GS, electrons flowing at the drain current, and a stacked column showing how V_DD divides between R_D, the transistor and R_S"
      camera={[0.6, 0.4, 11]}
      onReset={reset}
      scene={() => (<group>
        <Graph x0={-5.2} y0={-2.4} w={5.4} h={4.6} xr={[x0, x1]} yr={[0, IDSS * 1.15]} curves={curves} marker={[q.VGS, q.ID]} markerColor={C.red} vlines={[...(mode === "fixed" ? [{ x: -VGG, color: C.orange }] : []), { x: VP, color: C.purple }]} />
        <group position={[2.6, 0.9, 0]} rotation={[0.3, -0.4, 0]}>
          <Box p={[0, 0, 0]} s={[3.2, 1.0, 1]} c={C.blue} o={0.5} />
          <Box p={[0, 0.5 + 0.18 - 0.0, 0]} s={[1.8, 0.36, 1.02]} c={C.red} />
          <Box p={[0, -0.5 - 0.18, 0]} s={[1.8, 0.36, 1.02]} c={C.red} />
          <Box p={[0, 0.5 - (0.5 * squeeze) / 2, 0]} s={[1.8, 0.5 * squeeze + 0.01, 1.01]} c="#c8d3d9" o={0.7} />
          <Box p={[0, -0.5 + (0.5 * squeeze) / 2, 0]} s={[1.8, 0.5 * squeeze + 0.01, 1.01]} c="#c8d3d9" o={0.7} />
          <Box p={[-1.75, 0, 0]} s={[0.3, 1.0, 1.05]} c={C.light} />
          <Box p={[1.75, 0, 0]} s={[0.3, 1.0, 1.05]} c={C.light} />
          {q.ID > 1e-3 && <Flow path={path} n={14} speed={Math.min(1.4, 0.15 + q.ID / 8)} color={C.gold} r={0.06} cap={16} />}
        </group>
        <group position={[3.0, -3.0, 0]} rotation={[0.2, -0.4, 0]}><Stack VDD={VDD} VRD={q.ID * RD} VDS={q.VDS} VRS={q.VS} s={2.6 / 30} /></group>
      </group>)}
      readouts={[
        ["Gate–source voltage V_GSQ", `${q.VGS.toFixed(3)} V`],
        ["Drain current I_DQ", si(q.ID / 1000, "A")],
        ["Drain–source voltage V_DSQ", `${q.VDS.toFixed(2)} V`],
        ["V_G, V_S, V_D", `${q.VG.toFixed(2)} V, ${q.VS.toFixed(2)} V, ${q.VD.toFixed(2)} V`],
        ["Transconductance g_m = g_m0(1 − V_GS/V_P)", si(q.gm / 1000, "S")],
        ["Operating state", q.status],
      ]}
      controls={<>
        <Slider label="Source resistor R_S" value={RS} min={0} max={5} step={0.05} digits={2} unit=" kΩ" onChange={(x) => set("RS", x)} />
        <Pick label="Bias circuit" value={mode} options={[{ id: "fixed", label: "Fixed bias (V_GG)" }, { id: "self", label: "Self-bias (R_S)" }, { id: "divider", label: "Voltage-divider bias" }]} onChange={(x) => set("mode", x)} />
        <Slider label="Supply V_DD" value={VDD} min={5} max={30} step={0.5} digits={1} unit=" V" onChange={(x) => set("VDD", x)} />
        <Slider label="Drain resistor R_D" value={RD} min={0.5} max={20} step={0.1} digits={1} unit=" kΩ" onChange={(x) => set("RD", x)} />
        <Slider label="Gate battery V_GG (fixed bias)" value={VGG} min={0} max={8} step={0.1} digits={1} unit=" V" onChange={(x) => set("VGG", x)} />
        <Slider label="R1 (divider)" value={R1} min={0.1} max={20} step={0.05} digits={2} unit=" MΩ" onChange={(x) => set("R1", x)} />
        <Slider label="R2 (divider)" value={R2} min={0.05} max={10} step={0.01} digits={2} unit=" MΩ" onChange={(x) => set("R2", x)} />
        <Slider label="I_DSS" value={IDSS} min={2} max={20} step={0.5} digits={1} unit=" mA" onChange={(x) => set("IDSS", x)} />
        <Slider label="Pinch-off voltage V_P" value={VP} min={-8} max={-1} step={0.1} digits={1} unit=" V" onChange={(x) => set("VP", x)} />
      </>}
      note={<>
        <p>A JFET’s Q point lies where two curves meet: the device’s own <b>transfer characteristic</b> I<sub>D</sub> = I<sub>DSS</sub>(1 − V<sub>GS</sub>/V<sub>P</sub>)² (blue) and the circuit’s <b>bias line</b> (orange). <b>Fixed bias:</b> a battery sets V<sub>GS</sub> = −V<sub>GG</sub> (vertical line). <b>Self-bias:</b> the gate is at 0 V through R<sub>G</sub> (no gate current), and the drain current through R<sub>S</sub> lifts the source, so V<sub>GS</sub> = −I<sub>D</sub>R<sub>S</sub> (a line through the origin with slope −1/R<sub>S</sub>). <b>Voltage divider:</b> V<sub>G</sub> = V<sub>DD</sub>R<sub>2</sub>/(R<sub>1</sub> + R<sub>2</sub>) and V<sub>GS</sub> = V<sub>G</sub> − I<sub>D</sub>R<sub>S</sub>. Then V<sub>DS</sub> = V<sub>DD</sub> − I<sub>D</sub>(R<sub>D</sub> + R<sub>S</sub>), shown by the stacked column (orange I<sub>D</sub>R<sub>D</sub>, blue V<sub>DS</sub>, green I<sub>D</sub>R<sub>S</sub>).</p>
        <p>By hand, substituting the bias line into Shockley’s equation gives a quadratic with two roots; keep the one with V<sub>P</sub> ≤ V<sub>GS</sub> ≤ 0 (the other lies on the unused half of the parabola). <b>Try:</b> the default reproduces the PYQ (V<sub>DD</sub> = 20 V, R<sub>D</sub> = 6 kΩ, R<sub>S</sub> = 1 kΩ, I<sub>DSS</sub> = 10 mA, V<sub>P</sub> = −4 V → I<sub>D</sub> ≈ 2.15 mA, V<sub>GS</sub> ≈ −2.15 V, V<sub>DS</sub> ≈ 4.97 V). Raise R<sub>S</sub> and the line flattens, lowering I<sub>D</sub>; self-bias needs no second supply and steadies I<sub>D</sub> against device spread.</p>
      </>}
    />
  );
}
