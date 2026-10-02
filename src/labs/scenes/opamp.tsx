"use client";
import { Line } from "@react-three/drei";
import { useMemo, useRef } from "react";
import type * as THREE from "three";
import { opamp, opampIdeal, opampIn, opampOut, type OpAmpCfg, type OpMode } from "../sim/elex";
import { Tick } from "../Stage";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { ELEX_SPECS } from "../meta/elex.specs";

const CYC = 2, TAU = Math.PI * 2, WID = 6, Y = 1.75;
const MODES: { id: OpMode; label: string }[] = [
  { id: "inv", label: "Inverting amplifier" }, { id: "noninv", label: "Non-inverting amplifier" }, { id: "follower", label: "Voltage follower" },
  { id: "summing", label: "Inverting summer (V₂ dc on 2nd input)" }, { id: "integrator", label: "Integrator" },
];

export default function OpAmpLab() {
  const [P, set, reset] = useLabParams(ELEX_SPECS.opamp);
  const { A, mode, Rin, Rf, C, f, V2, Vsat } = P;
  const cfg: OpAmpCfg = useMemo(() => ({ mode, A, f, Rin: Rin * 1e3, Rf: Rf * 1e3, C: C * 1e-6, V2, Vsat }), [mode, A, f, Rin, Rf, C, V2, Vsat]);
  const R = opamp(cfg);
  const ys = (v: number) => Math.max(-Y * 1.4, Math.min(Y * 1.4, (v / Vsat) * Y));
  const lines = useMemo(() => {
    const vin: [number, number, number][] = [], vout: [number, number, number][] = [], ideal: [number, number, number][] = [];
    for (let i = 0; i <= 240; i++) {
      const th = (i / 240) * CYC * TAU, x = (i / 240) * WID - WID / 2;
      vin.push([x, ys(opampIn(cfg, th)), 0]); vout.push([x, ys(opampOut(cfg, th)), 0.02]); ideal.push([x, ys(opampIdeal(cfg, th)), -0.02]);
    }
    return { vin, vout, ideal };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfg]);
  const din = useRef<THREE.Mesh>(null), dout = useRef<THREE.Mesh>(null), t = useRef(0);
  const tick = (dt: number) => {
    t.current += Math.min(dt, 0.05) * 2.2;
    const th = t.current % (CYC * TAU), x = (th / (CYC * TAU)) * WID - WID / 2;
    din.current?.position.set(x, ys(opampIn(cfg, th)), 0.05);
    dout.current?.position.set(x, ys(opampOut(cfg, th)), 0.05);
  };
  const g = R.gain;
  return (
    <LabFrame
      label="Two sine waves on a 3D scope: the blue input and the green output of an op-amp circuit, a grey dashed ideal output, and red rails that flatten the output when it clips, with a moving dot on each wave"
      camera={[0, 0.2, 8]}
      onReset={reset}
      scene={() => (<group>
        <Tick fn={tick} />
        <Line points={[[-WID / 2, 0, 0], [WID / 2, 0, 0]]} color="#5b6d77" lineWidth={1} />
        <mesh position={[0, Y, -0.05]}><boxGeometry args={[WID + 0.2, 0.03, 0.2]} /><meshBasicMaterial color="#ff5a5f" /></mesh>
        <mesh position={[0, -Y, -0.05]}><boxGeometry args={[WID + 0.2, 0.03, 0.2]} /><meshBasicMaterial color="#ff5a5f" /></mesh>
        <mesh position={[0, (Y * 1.4 + Y) / 2, -0.1]}><boxGeometry args={[WID + 0.2, Y * 0.4, 0.02]} /><meshBasicMaterial color="#ff5a5f" transparent opacity={0.13} /></mesh>
        <mesh position={[0, -(Y * 1.4 + Y) / 2, -0.1]}><boxGeometry args={[WID + 0.2, Y * 0.4, 0.02]} /><meshBasicMaterial color="#ff5a5f" transparent opacity={0.13} /></mesh>
        <Line points={lines.ideal} color="#9db0ba" lineWidth={1.4} dashed dashSize={0.1} gapSize={0.07} />
        <Line points={lines.vin} color="#2ba6f5" lineWidth={2.6} />
        <Line points={lines.vout} color="#44c95a" lineWidth={3.2} />
        <mesh ref={din}><sphereGeometry args={[0.1, 12, 12]} /><meshStandardMaterial color="#2ba6f5" emissive="#2ba6f5" emissiveIntensity={0.5} /></mesh>
        <mesh ref={dout}><sphereGeometry args={[0.1, 12, 12]} /><meshStandardMaterial color="#ffc83d" emissive="#ffc83d" emissiveIntensity={0.5} /></mesh>
      </group>)}
      readouts={[
        ["Closed-loop gain", mode === "integrator" ? `${g.toFixed(2)} at ${f} Hz` : g.toFixed(2)], ["Phase of output", `${R.phase}°`], ["Ideal output peak", `${R.idealPeak.toFixed(2)} V`],
        ["Actual output peak", `${R.outPeak.toFixed(2)} V`], ["Clipped at the rails?", R.clipped ? `Yes, at ±${Vsat} V` : "No"], ["Inverting input", R.virtualGround ? "virtual ground (0 V)" : "follows the input"],
      ]}
      controls={<>
        <Slider label="Input amplitude" value={A} min={0.1} max={5} step={0.1} digits={1} unit=" V" onChange={(x) => set("A", x)} />
        <Pick<OpMode> label="Circuit" value={mode} options={MODES} onChange={(x) => set("mode", x)} />
        <Slider label="Input resistor R_in" value={Rin} min={1} max={100} step={1} digits={0} unit=" kΩ" onChange={(x) => set("Rin", x)} />
        <Slider label="Feedback resistor R_f" value={Rf} min={1} max={1000} step={1} digits={0} unit=" kΩ" onChange={(x) => set("Rf", x)} />
        <Slider label="Integrator capacitor C" value={C} min={0.01} max={10} step={0.01} digits={2} unit=" µF" onChange={(x) => set("C", x)} />
        <Slider label="Signal frequency f" value={f} min={10} max={100000} step={10} digits={0} unit=" Hz" onChange={(x) => set("f", x)} />
        <Slider label="Second input V₂ (summer)" value={V2} min={-3} max={3} step={0.1} digits={1} unit=" V" onChange={(x) => set("V2", x)} />
        <Slider label="Supply rails ±V_sat" value={Vsat} min={5} max={15} step={0.5} digits={1} unit=" V" onChange={(x) => set("Vsat", x)} />
      </>}
      note={<p>With negative feedback an ideal op-amp forces the two inputs to the same voltage, which gives the classic gains: inverting −R_f/R_in, non-inverting 1 + R_f/R_in, follower 1, summer −(R_f/R_in)(v₁ + V₂) and integrator v_out = −(1/RC)∫v_in dt (a sine in gives a cosine out with amplitude A/2πfRC). Blue is the input, green the real output, and the grey dashed curve is what the ideal circuit would give; the red lines are the supply rails, and the output flat-tops there when the ideal output is larger (clipping). The vertical scale is fixed to the rail voltage, so a bigger rail shrinks the picture. Ideal op-amp: infinite gain, bandwidth and input resistance, zero output resistance; C, f and V₂ matter only for the circuits that use them.</p>}
    />
  );
}
