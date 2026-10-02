"use client";
import { useMemo, useRef } from "react";
import { ceToCc, hAmp, si } from "../sim/elexy";
import { Tick } from "../Stage";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { ELEXY_SPECS } from "../meta/elexy.specs";
import { C, Ball, type V3 } from "../kit";
import { Flow, Graph, type XY } from "../kit2";
import { AcSource, Ground, Res, Tracer, Wire } from "./elexy-kit";

/** A dependent source: a diamond (rotated cube) with an arrow or ± marks. */
function Diamond({ p, c, glow }: { p: V3; c: string; glow: number }) {
  return (
    <group position={p}>
      <mesh rotation={[0, 0, Math.PI / 4]}><boxGeometry args={[0.6, 0.6, 0.3]} /><meshStandardMaterial color={c} emissive={c} emissiveIntensity={glow} /></mesh>
      <mesh position={[0, 0, 0.17]}><boxGeometry args={[0.05, 0.36, 0.02]} /><meshBasicMaterial color={C.white} /></mesh>
      <mesh position={[0, 0.2, 0.17]} rotation={[0, 0, 0]}><coneGeometry args={[0.09, 0.14, 8]} /><meshBasicMaterial color={C.white} /></mesh>
    </group>
  );
}

export default function HParamLab() {
  const [P, set, reset] = useLabParams(ELEXY_SPECS.hparam);
  const { hfe, cfg, hie, hre, hoe, RL, Rs } = P;
  const ce = { hi: hie * 1000, hr: hre * 1e-4, hf: hfe, ho: hoe * 1e-6 };
  const h = cfg === "ce" ? ce : ceToCc(ce);
  const a = hAmp(h, RL * 1000, Rs * 1000);
  const phase = useRef(0);
  const tick = (dt: number) => { phase.current = (phase.current + Math.min(dt, 0.05) * 0.25) % 1; };
  const waves = useMemo(() => {
    const vs: XY[] = [], vi: XY[] = [], vo: XY[] = [];
    const ki = a.Ri / (a.Ri + Rs * 1000);
    for (let i = 0; i <= 160; i++) { const t = (2 * i) / 160, s = Math.sin(2 * Math.PI * t); vs.push([t, s]); vi.push([t, ki * s]); vo.push([t, a.Avs * s]); }
    return { vs, vi, vo };
  }, [a.Ri, a.Avs, Rs]);
  const A = Math.max(1.05, Math.abs(a.Avs) * 1.1);
  const tr = useMemo<V3[]>(() => waves.vo.map(([t, v]) => [0.6 + (t / 2) * 4.2, -3.9 + 1.7 * ((v + A) / (2 * A)), 0.05]), [waves.vo, A]);
  const glow = Math.min(1, Math.log10(1 + Math.abs(a.Av)) / 3);
  return (
    <LabFrame
      label="The low-frequency h-parameter equivalent circuit of a transistor amplifier built in 3-D: a source with R_s, the input resistance h_i, a dependent voltage source h_r·v_o, a dependent current source h_f·i_b in parallel with 1/h_o and the load R_L, with charges flowing; graphs show the source and input voltages and the amplified output"
      camera={[0, -0.4, 11.5]}
      onReset={reset}
      scene={() => (<group>
        <Tick fn={tick} />
        <group position={[0, 1.4, 0]}>
          <AcSource p={[-5, 0, 0]} />
          <Wire pts={[[-5, 0.38, 0], [-5, 1.2, 0], [-4.4, 1.2, 0]]} />
          <Res a={[-4.4, 1.2, 0]} b={[-3.2, 1.2, 0]} />
          <Wire pts={[[-3.2, 1.2, 0], [-2.8, 1.2, 0]]} />
          <Ball p={[-3, 1.2, 0]} r={0.09} c={C.blue} glow={0.6} />
          <Res a={[-2.8, 1.2, 0]} b={[-1.6, 1.2, 0]} glow={0.3} />
          <Wire pts={[[-1.6, 1.2, 0], [-1.1, 1.2, 0], [-1.1, 0.4, 0]]} />
          <Diamond p={[-1.1, 0, 0]} c={C.purple} glow={Math.min(1, h.hr * 2)} />
          <Wire pts={[[-1.1, -0.4, 0], [-1.1, -1.2, 0], [-5, -1.2, 0], [-5, -0.38, 0]]} />
          <Diamond p={[0.8, 0, 0]} c={C.orange} glow={0.4 + 0.5 * glow} />
          <Wire pts={[[0.8, 0.4, 0], [0.8, 1.2, 0], [4.6, 1.2, 0], [4.6, 0.6, 0]]} />
          <Wire pts={[[0.8, -0.4, 0], [0.8, -1.2, 0], [4.6, -1.2, 0], [4.6, -0.6, 0]]} />
          <Res a={[2.4, 1.2, 0]} b={[2.4, -1.2, 0]} body={0.4} />
          <Res a={[4.6, 0.6, 0]} b={[4.6, -0.6, 0]} glow={glow} />
          <Ball p={[4.6, 1.2, 0]} r={0.12} c={C.gold} glow={0.8} />
          <Ground p={[-1.1, -1.45, 0]} />
          <Flow path={[[-5, 0.4, 0], [-5, 1.2, 0], [-1.1, 1.2, 0]]} n={8} speed={0.3} color={C.blue} r={0.06} cap={10} />
          <Flow path={[[0.8, 0.4, 0], [0.8, 1.2, 0], [4.6, 1.2, 0], [4.6, -1.2, 0], [0.8, -1.2, 0]]} n={20} speed={Math.min(1.2, 0.2 + glow)} color={C.gold} r={0.06} cap={22} />
        </group>
        <Graph x0={-4.8} y0={-3.9} w={4.2} h={1.7} xr={[0, 2]} yr={[-1.1, 1.1]} curves={[{ pts: waves.vs, color: C.light, w: 1.6, dashed: true }, { pts: waves.vi, color: C.blue, w: 2.8 }]} />
        <Graph x0={0.6} y0={-3.9} w={4.2} h={1.7} xr={[0, 2]} yr={[-A, A]} curves={[{ pts: waves.vs, color: C.light, w: 1.4, dashed: true }, { pts: waves.vo, color: C.gold, w: 3 }]} />
        <Tracer pts={tr} phase={phase} color={C.red} r={0.09} />
      </group>)}
      readouts={[
        ["Current gain A_i = −h_f/(1 + h_o R_L)", a.Ai.toFixed(2)],
        ["Input resistance R_i = h_i + h_r A_i R_L", si(a.Ri, "Ω")],
        ["Voltage gain A_v = A_i R_L/R_i", `${a.Av.toFixed(cfg === "cc" ? 4 : 1)} (${a.Av < 0 ? "180°" : "0°"})`],
        ["Overall gain A_vs = A_v R_i/(R_i + R_s)", a.Avs.toFixed(cfg === "cc" ? 4 : 1)],
        ["Output resistance R_o", si(a.Ro, "Ω")],
        ["Power gain A_p = |A_i A_v|", a.Ap.toFixed(0)],
      ]}
      controls={<>
        <Slider label="h_fe (forward current gain)" value={hfe} min={10} max={400} step={1} digits={0} onChange={(x) => set("hfe", x)} />
        <Pick label="Configuration" value={cfg} options={[{ id: "ce", label: "Common emitter (CE)" }, { id: "cc", label: "Common collector / emitter follower (CC)" }]} onChange={(x) => set("cfg", x)} />
        <Slider label="h_ie (input resistance)" value={hie} min={0.2} max={10} step={0.1} digits={1} unit=" kΩ" onChange={(x) => set("hie", x)} />
        <Slider label="h_re (× 10⁻⁴)" value={hre} min={0} max={20} step={0.1} digits={1} onChange={(x) => set("hre", x)} />
        <Slider label="h_oe (output conductance)" value={hoe} min={0} max={100} step={1} digits={0} unit=" µS" onChange={(x) => set("hoe", x)} />
        <Slider label="Load R_L" value={RL} min={0.1} max={50} step={0.1} digits={1} unit=" kΩ" onChange={(x) => set("RL", x)} />
        <Slider label="Source resistance R_s" value={Rs} min={0} max={20} step={0.1} digits={1} unit=" kΩ" onChange={(x) => set("Rs", x)} />
      </>}
      note={<>
        <p>For small signals at low frequency a transistor is a two-port: v<sub>i</sub> = h<sub>i</sub>i<sub>i</sub> + h<sub>r</sub>v<sub>o</sub> and i<sub>o</sub> = h<sub>f</sub>i<sub>i</sub> + h<sub>o</sub>v<sub>o</sub>. The 3-D circuit shows exactly that: h<sub>i</sub> in series with a dependent voltage source h<sub>r</sub>v<sub>o</sub> (purple) on the input, and a dependent current source h<sub>f</sub>i<sub>b</sub> (orange) with 1/h<sub>o</sub> on the output, driving R<sub>L</sub>. Solving it gives the four results asked in exams: <b>A<sub>i</sub> = −h<sub>f</sub>/(1 + h<sub>o</sub>R<sub>L</sub>)</b>, <b>R<sub>i</sub> = h<sub>i</sub> + h<sub>r</sub>A<sub>i</sub>R<sub>L</sub></b>, <b>A<sub>v</sub> = A<sub>i</sub>R<sub>L</sub>/R<sub>i</sub></b>, <b>R<sub>o</sub> = 1/(h<sub>o</sub> − h<sub>f</sub>h<sub>r</sub>/(h<sub>i</sub> + R<sub>s</sub>))</b>. Approximate CE: A<sub>i</sub> ≈ −h<sub>fe</sub>, A<sub>v</sub> ≈ −h<sub>fe</sub>R<sub>L</sub>/h<sub>ie</sub>.</p>
        <p>For the <b>emitter follower (CC)</b> the same formulas are used with h<sub>ic</sub> = h<sub>ie</sub>, h<sub>rc</sub> = 1 − h<sub>re</sub> ≈ 1, h<sub>fc</sub> = −(1 + h<sub>fe</sub>), h<sub>oc</sub> = h<sub>oe</sub>: A<sub>i</sub> ≈ 1 + h<sub>fe</sub>, A<sub>v</sub> just under 1 with no phase flip, R<sub>i</sub> ≈ h<sub>ie</sub> + (1 + h<sub>fe</sub>)R<sub>L</sub> (very high) and R<sub>o</sub> ≈ (h<sub>ie</sub> + R<sub>s</sub>)/(1 + h<sub>fe</sub>) (tens of ohms): a buffer.</p>
        <p><b>Try:</b> set h<sub>re</sub> and h<sub>oe</sub> to 0 and check the approximate formulas; switch to CC and watch the gold output wave shrink to the size of the input and stop inverting. Graphs: left, source (dashed) and base voltage; right, source (dashed) and output, both per 1 unit of source voltage.</p>
      </>}
    />
  );
}
