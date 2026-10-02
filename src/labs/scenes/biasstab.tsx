"use client";
import { useMemo } from "react";
import { biasStab } from "../sim/elexx";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { ELEXX_SPECS } from "../meta/elexx.specs";
import { C, Box } from "../kit";
import { Graph, mix } from "../kit2";

export default function BiasStabLab() {
  const [P, set, reset] = useLabParams(ELEXX_SPECS.biasstab);
  const { T, VCC, RC, RE, R1, R2, RB, beta, vin, kind } = P;
  const b = biasStab(kind, T, VCC, RC, RE, R1, R2, RB, beta);
  const ref = biasStab(kind, 25, VCC, RC, RE, R1, R2, RB, beta);
  const Rtot = RC + (kind === "divider" ? RE : 0);
  const icMax = VCC / Rtot;
  const loadLine: [number, number][] = [[0, icMax], [VCC, 0]];
  const family = useMemo(() => [0.25, 0.5, 0.75, 1].map((f) => ({ pts: [[0, 0], [0.3, f * icMax * 0.9], [VCC, f * icMax * 0.98]] as [number, number][], color: "#3d5560", w: 1.2 })), [VCC, icMax]);
  const vout = Math.min(Math.abs(b.Av) * vin / 1000, 2 * Math.min(b.VCE - 0.2, VCC - b.VCE));
  const heat = Math.min(1, (T + 20) / 170);
  return (
    <LabFrame
      label="A transistor amplifier board that glows warmer with temperature, beside the DC load line with the Q-point at today's temperature and a faint marker where it was at 25 °C"
      camera={[0.6, 0.4, 9.5]}
      onReset={reset}
      scene={() => (<group>
        <group position={[-3.2, 0, 0]}>
          <Box p={[0, 0, -0.1]} s={[3, 3.6, 0.12]} c="#1f6b45" />
          <Box p={[0, 0.2, 0.2]} s={[0.6, 0.6, 0.5]} c={mix("#2b2b2b", C.red, heat)} glow={heat * 0.8} />
          {[[-0.9, 1.2], [0.9, 1.2], [-0.9, -1.1], [0.9, -1.1]].map(([x, y], i) => <Box key={i} p={[x, y, 0.05]} s={[0.5, 0.18, 0.18]} c={[C.orange, C.gold, C.blue, C.purple][i]} />)}
          <mesh position={[0, -0.6, 0.12]}><cylinderGeometry args={[0.2, 0.2, 0.4, 16]} /><meshStandardMaterial color={C.blue} /></mesh>
        </group>
        <Graph x0={-1} y0={-2} w={5.4} h={4} xr={[0, VCC]} yr={[0, icMax * 1.1 * 1000]} curves={[...family.map((c) => ({ ...c, pts: c.pts.map(([x, y]) => [x, y * 1000] as [number, number]) })), { pts: loadLine.map(([x, y]) => [x, y * 1000] as [number, number]), color: C.blue, w: 2.4 }]}
          marker={[b.VCE, b.IC * 1000]} markerColor={b.sat ? C.red : C.green} vlines={[{ x: ref.VCE, color: C.gold }]} />
      </group>)}
      readouts={[
        ["Collector current I_C", `${(b.IC * 1000).toFixed(3)} mA`],
        ["V_CE", `${b.VCE.toFixed(2)} V`],
        ["Region", b.region],
        ["Change since 25 °C", `${(((b.IC - ref.IC) / ref.IC) * 100).toFixed(1)} %`],
        ["Stability factor S", b.S.toFixed(2)],
        ["Small-signal gain A_v", `${b.Av.toFixed(0)} (out ≈ ${vout.toFixed(2)} V p)`],
      ]}
      controls={<>
        <Slider label="Junction temperature" value={T} min={-20} max={150} step={1} digits={0} unit=" °C" onChange={(x) => set("T", x)} />
        <Pick label="Bias circuit" value={kind} options={[{ id: "divider", label: "Voltage divider (with R_E)" }, { id: "fixed", label: "Fixed bias (R_B only)" }]} onChange={(x) => set("kind", x)} />
        <Slider label="Supply V_CC" value={VCC} min={5} max={24} step={0.5} digits={1} unit=" V" onChange={(x) => set("VCC", x)} />
        <Slider label="Collector resistor R_C" value={RC} min={0.5} max={10} step={0.1} digits={1} unit=" kΩ" onChange={(x) => set("RC", x)} />
        <Slider label="Emitter resistor R_E" value={RE} min={0.1} max={5} step={0.1} digits={1} unit=" kΩ" onChange={(x) => set("RE", x)} />
        <Slider label="R₁ (divider top)" value={R1} min={5} max={200} step={1} digits={0} unit=" kΩ" onChange={(x) => set("R1", x)} />
        <Slider label="R₂ (divider bottom)" value={R2} min={1} max={100} step={1} digits={0} unit=" kΩ" onChange={(x) => set("R2", x)} />
        <Slider label="Base resistor R_B (fixed bias)" value={RB} min={50} max={2000} step={10} digits={0} unit=" kΩ" onChange={(x) => set("RB", x)} />
        <Slider label="β at 25 °C" value={beta} min={30} max={300} step={1} digits={0} onChange={(x) => set("beta", x)} />
        <Slider label="Input signal" value={vin} min={1} max={50} step={1} digits={0} unit=" mV" onChange={(x) => set("vin", x)} />
      </>}
      note={<p>Heat raises β (≈ 0.8 %/°C), doubles the leakage current I<sub>CBO</sub> every 10 °C and lowers V<sub>BE</sub> by about 2.2 mV/°C. With <b>fixed bias</b>, I<sub>C</sub> = βI<sub>B</sub> + (β + 1)I<sub>CBO</sub> follows all of that, so the Q-point creeps up the load line towards saturation and, with more heating, thermal runaway. In <b>voltage-divider bias</b> the emitter resistor gives negative feedback: if I<sub>C</sub> rises, V<sub>E</sub> rises and V<sub>BE</sub> falls, pulling I<sub>C</sub> back, so I<sub>C</sub> ≈ (V<sub>Th</sub> − V<sub>BE</sub>)/R<sub>E</sub>. The stability factor S = ∂I<sub>C</sub>/∂I<sub>CBO</sub> is β + 1 for fixed bias but small for divider bias. Gain uses A<sub>v</sub> ≈ −R<sub>C</sub>/r<sub>e</sub> with R<sub>E</sub> bypassed, r<sub>e</sub> = 26 mV/I<sub>E</sub>. The gold line marks V<sub>CE</sub> at 25 °C; grey curves are schematic output characteristics.</p>}
    />
  );
}
