"use client";
import { useMemo, useRef } from "react";
import { fmaxSlew, opReal, si, slewTrace } from "../sim/elexy";
import { Tick } from "../Stage";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { ELEXY_SPECS } from "../meta/elexy.specs";
import { C, Ball, Box, type V3 } from "../kit";
import { Flow, Graph, type XY } from "../kit2";
import { AcSource, Ground, OpAmpBody, Res, Tracer, Wire } from "./elexy-kit";

const VSAT = 13;
/* Op-amp centred at (0.6, 1.2): inverting input (−) at the upper left, non-inverting (+) at the lower left, output on the right. */
const NM: V3 = [0, 1.55, 0], NP: V3 = [0, 0.85, 0], OUT: V3 = [1.75, 1.2, 0];

export default function OpRealLab() {
  const [P, set, reset] = useLabParams(ELEXY_SPECS.opreal);
  const { Rf, cfg, R1, logA, vin, f, SR } = P;
  const A = 10 ** logA;
  const r = opReal(cfg, Rf, R1, A);
  const Vom = Math.min(VSAT, Math.abs(r.actual) * vin);
  const fmax = fmaxSlew(SR, Vom), slewed = f * 1000 > fmax;
  const vminus = Vom / A; // differential input needed to drive the output: v+ − v− = v_o/A
  const tr = useMemo(() => slewTrace(Math.abs(r.actual) * vin, f * 1000, SR, VSAT, 200), [r.actual, vin, f, SR]);
  const sign = r.actual < 0 ? -1 : 1;
  const curves = useMemo(() => {
    const vi: XY[] = [], id: XY[] = [], re: XY[] = [];
    for (let i = 0; i <= 200; i++) { const t = (2 * i) / 200; vi.push([t, vin * Math.sin(2 * Math.PI * t)]); id.push([t, sign * tr.ideal[i]]); re.push([t, sign * tr.real[i]]); }
    return { vi, id, re };
  }, [vin, tr, sign]);
  const ymax = Math.max(vin, Vom, 0.1) * 1.15;
  const phase = useRef(0);
  const tick = (dt: number) => { phase.current = (phase.current + Math.min(dt, 0.05) * 0.25) % 1; };
  const tracer = useMemo<V3[]>(() => curves.re.map(([t, v]) => [-4.6 + (t / 2) * 9.2, -4.4 + 2.6 * ((v + ymax) / (2 * ymax)), 0.05]), [curves.re, ymax]);
  const inv = cfg === "inv";
  const dGlow = Math.min(1, Math.max(0.05, (Math.log10(vminus * 1e6 + 1)) / 6));
  return (
    <LabFrame
      label="A 3-D op-amp (triangular prism) wired as an inverting or non-inverting amplifier with input resistor R1, feedback resistor Rf and a glowing inverting-input node whose brightness shows the tiny virtual-ground voltage; below, a graph of the input sine, the ideal output and the real output, which turns into a triangle when the slew rate limits it"
      camera={[0, -0.6, 11.5]}
      onReset={reset}
      scene={() => (<group>
        <Tick fn={tick} />
        <OpAmpBody p={[0.6, 1.2, 0]} s={1.2} />
        <Wire pts={[NM, [-0.95, 1.55, 0], [-0.95, 2.9, 0], [0.2, 2.9, 0]]} />
        <Res a={[0.2, 2.9, 0]} b={[1.6, 2.9, 0]} glow={0.25} />
        <Wire pts={[[1.6, 2.9, 0], [2.3, 2.9, 0], [2.3, 1.2, 0], OUT]} c={C.gold} />
        <Wire pts={[OUT, [3.6, 1.2, 0]]} c={C.gold} w={3} />
        <Ball p={[3.6, 1.2, 0]} r={0.14} c={C.gold} glow={0.8} />
        <Ball p={[-0.95, 1.55, 0]} r={0.12} c={C.red} glow={dGlow} />
        <Box p={[-0.95, 1.55 + 0.1 + dGlow * 0.6, 0]} s={[0.08, 0.2 + dGlow * 1.2, 0.08]} c={C.red} glow={0.6} />
        {inv ? (<>
          <Res a={[-3.0, 1.55, 0]} b={[-1.4, 1.55, 0]} glow={0.25} />
          <Wire pts={[[-1.4, 1.55, 0], [-0.95, 1.55, 0]]} />
          <AcSource p={[-3.6, 0.6, 0]} />
          <Wire pts={[[-3.6, 0.98, 0], [-3.6, 1.55, 0], [-3.0, 1.55, 0]]} c={C.blue} />
          <Wire pts={[[-3.6, 0.22, 0], [-3.6, -0.2, 0]]} />
          <Ground p={[-3.6, -0.25, 0]} />
          <Wire pts={[NP, [-1.2, 0.85, 0], [-1.2, 0.0, 0]]} />
          <Ground p={[-1.2, -0.05, 0]} />
          <Flow path={[[-3.6, 1.0, 0], [-3.6, 1.55, 0], [-0.95, 1.55, 0], [-0.95, 2.9, 0], [2.3, 2.9, 0], [2.3, 1.2, 0]]} n={14} speed={0.25} color={C.gold} r={0.06} cap={16} />
        </>) : (<>
          <AcSource p={[-3.0, 0.2, 0]} />
          <Wire pts={[[-3.0, 0.58, 0], [-3.0, 0.85, 0], NP]} c={C.blue} />
          <Wire pts={[[-3.0, -0.18, 0], [-3.0, -0.6, 0]]} />
          <Ground p={[-3.0, -0.65, 0]} />
          <Res a={[-0.95, 1.55, 0]} b={[-0.95, -0.1, 0]} glow={0.25} />
          <Ground p={[-0.95, -0.15, 0]} />
          <Flow path={[[2.3, 1.2, 0], [2.3, 2.9, 0], [-0.95, 2.9, 0], [-0.95, -0.1, 0]]} n={12} speed={0.25} color={C.gold} r={0.06} cap={14} />
        </>)}
        <Graph x0={-4.6} y0={-4.4} w={9.2} h={2.6} xr={[0, 2]} yr={[-ymax, ymax]} curves={[{ pts: curves.vi, color: C.blue, w: 2 }, { pts: curves.id, color: C.light, w: 1.6, dashed: true }, { pts: curves.re, color: slewed ? C.orange : C.gold, w: 3 }]} />
        <Tracer pts={tracer} phase={phase} color={C.red} r={0.1} />
      </group>)}
      readouts={[
        ["Ideal gain", `${r.ideal.toFixed(3)} (${inv ? "−R_f/R_1" : "1 + R_f/R_1"})`],
        ["Actual gain A_CL = A_ideal·Aβ/(1 + Aβ)", r.actual.toFixed(5)],
        ["Gain error 1/(1 + Aβ)", `${r.errPct.toPrecision(3)} %`],
        ["Input differential v_d = v_o/A (virtual short)", si(vminus, "V")],
        ["Output peak", `${Vom.toFixed(2)} V${Math.abs(r.actual) * vin > VSAT ? " (clipped at ±13 V)" : ""}`],
        ["Full-power bandwidth f_max = SR/2πV_m", `${si(fmax, "Hz")}${slewed ? " (slew-limited!)" : ""}`],
      ]}
      controls={<>
        <Slider label="Feedback resistor R_f" value={Rf} min={0} max={200} step={1} digits={0} unit=" kΩ" onChange={(x) => set("Rf", x)} />
        <Pick label="Circuit" value={cfg} options={[{ id: "inv", label: "Inverting amplifier" }, { id: "noninv", label: "Non-inverting (R_f = 0: voltage follower)" }]} onChange={(x) => set("cfg", x)} />
        <Slider label="Input resistor R_1" value={R1} min={1} max={100} step={1} digits={0} unit=" kΩ" onChange={(x) => set("R1", x)} />
        <Slider label="Open-loop gain log₁₀A" value={logA} min={1} max={6} step={0.1} digits={1} onChange={(x) => set("logA", x)} />
        <Slider label="Input peak v_in" value={vin} min={0.01} max={5} step={0.01} digits={2} unit=" V" onChange={(x) => set("vin", x)} />
        <Slider label="Frequency f" value={f} min={0.1} max={100} step={0.1} digits={1} unit=" kHz" onChange={(x) => set("f", x)} />
        <Slider label="Slew rate SR" value={SR} min={0.1} max={20} step={0.1} digits={1} unit=" V/µs" onChange={(x) => set("SR", x)} />
      </>}
      note={<>
        <p>An <b>ideal op-amp</b> has infinite open-loop gain A, infinite input resistance, zero output resistance, infinite bandwidth and CMRR, and infinite slew rate. With negative feedback the output then settles wherever v<sub>+</sub> − v<sub>−</sub> = v<sub>o</sub>/A ≈ 0: the <b>virtual short</b>. In the inverting circuit v<sub>+</sub> is earthed, so the − input sits at almost 0 V without being connected to ground: the <b>virtual ground</b>. No current enters the input, so v<sub>in</sub>/R<sub>1</sub> = −v<sub>o</sub>/R<sub>f</sub> → <b>A<sub>v</sub> = −R<sub>f</sub>/R<sub>1</sub></b>; non-inverting: <b>A<sub>v</sub> = 1 + R<sub>f</sub>/R<sub>1</sub></b> (R<sub>f</sub> = 0 gives the unity-gain voltage follower).</p>
        <p>A real op-amp (741: A ≈ 2×10⁵, SR ≈ 0.5 V/µs) differs in two ways. A finite A makes the gain A<sub>ideal</sub>·Aβ/(1 + Aβ), with feedback fraction β = R<sub>1</sub>/(R<sub>1</sub> + R<sub>f</sub>), so the error is 1/(1 + Aβ), tiny unless A is small. The red node and bar show the microvolt-level v<sub>d</sub>. The <b>slew rate</b> caps how fast the output can change: a sine of peak V<sub>m</sub> needs 2πfV<sub>m</sub>, so above <b>f<sub>max</sub> = SR/(2πV<sub>m</sub>)</b> the output turns into a smaller triangle (orange).</p>
        <p><b>Try:</b> the 741 preset (10 V peak out, SR = 0.5 V/µs → f<sub>max</sub> ≈ 7.96 kHz) at 20 kHz; then drop log₁₀A to 2 and watch the gain error grow. Simplified model: single-pole effects other than slewing are ignored; output limits at ±13 V.</p>
      </>}
    />
  );
}
