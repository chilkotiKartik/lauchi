"use client";
import { Line } from "@react-three/drei";
import { useRef } from "react";
import type * as THREE from "three";
import { twoWattmeter } from "../sim/elecx";
import { Tick } from "../Stage";
import { LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { ELECX_SPECS } from "../meta/elecx.specs";
import { C, Box } from "../kit";
import { Arrow, Dial, Flow } from "../kit2";

const PH = [C.red, C.gold, C.blue];
function Phasors({ phi }: { phi: number }) {
  const g = useRef<THREE.Group>(null);
  return (<group ref={g}>
    <Tick fn={(dt) => { if (g.current) g.current.rotation.z += Math.min(dt, 0.05) * 0.8; }} />
    {[0, 1, 2].map((k) => {
      const a = (k * 2 * Math.PI) / 3, b = a - (phi * Math.PI) / 180;
      return (<group key={k}>
        <Arrow from={[0, 0, 0]} to={[Math.cos(a) * 1.5, Math.sin(a) * 1.5, 0]} color={PH[k]} />
        <Arrow from={[0, 0, 0.02]} to={[Math.cos(b) * 0.95, Math.sin(b) * 0.95, 0.02]} color={PH[k]} r={0.025} />
      </group>);
    })}
  </group>);
}

export default function WattmeterLab() {
  const [P, set, reset] = useLabParams(ELECX_SPECS.wattmeter);
  const { VL, IL, phi } = P;
  const w = twoWattmeter(VL, IL, phi);
  const full = (Math.sqrt(3) * 440 * 50) / 1000 / 1.6;
  const lines = [1.2, 0.4, -0.4];
  return (
    <LabFrame
      label="Three supply lines run to a balanced star load; two wattmeters on lines R and B show their readings on dials, and rotating voltage and current phasors show the phase angle"
      camera={[0, 0.6, 10]}
      onReset={reset}
      scene={() => (<group>
        {lines.map((y, k) => (<group key={k}>
          <Line points={[[-4.6, y, 0], [1.2, y, 0]]} color={PH[k]} lineWidth={2.5} />
          <Flow path={[[-4.6, y, 0], [1.2, y, 0]]} n={8} speed={0.15 + IL / 100} color={PH[k]} r={0.05} />
        </group>))}
        <Box p={[1.8, 0.4, 0]} s={[1.1, 1.8, 0.8]} c={C.dark} />
        <Dial p={[-2.8, 2.6, 0]} f={0.5 + w.W1 / (2 * full)} color={C.red} size={0.7} />
        <Dial p={[-0.6, 2.6, 0]} f={0.5 + w.W2 / (2 * full)} color={w.negative ? C.red : C.blue} size={0.7} />
        <group position={[4, 0.4, 0]}><Phasors phi={phi} /></group>
      </group>)}
      readouts={[
        ["Wattmeter W₁", `${w.W1.toFixed(2)} kW`],
        ["Wattmeter W₂", `${w.W2.toFixed(2)} kW${w.negative ? " (reverse its coil, read as negative)" : ""}`],
        ["Total power W₁ + W₂", `${w.P.toFixed(2)} kW`],
        ["Reactive power √3(W₁ − W₂)", `${w.Q.toFixed(2)} kVAR`],
        ["Power factor cos φ", `${w.pf.toFixed(3)} ${phi > 0 ? "lagging" : phi < 0 ? "leading" : ""}`],
        ["φ from readings", `${w.phiBack.toFixed(1)}°`],
      ]}
      controls={<>
        <Slider label="Line voltage V_L" value={VL} min={100} max={440} step={1} digits={0} unit=" V" onChange={(x) => set("VL", x)} />
        <Slider label="Line current I_L" value={IL} min={1} max={50} step={0.5} digits={1} unit=" A" onChange={(x) => set("IL", x)} />
        <Slider label="Phase angle φ (+ lag)" value={phi} min={-90} max={90} step={1} digits={0} unit="°" onChange={(x) => set("phi", x)} />
      </>}
      note={<p>In a 3-wire system two wattmeters measure the total power of any load: their current coils go in two lines and their pressure coils from those lines to the third. For a balanced load, <b>W₁ = V<sub>L</sub>I<sub>L</sub> cos(30° − φ)</b> and <b>W₂ = V<sub>L</sub>I<sub>L</sub> cos(30° + φ)</b>, so W₁ + W₂ = √3V<sub>L</sub>I<sub>L</sub> cos φ and tan φ = √3(W₁ − W₂)/(W₁ + W₂). At unity pf they read equal; at 0.5 pf (φ = 60°) one reads zero; below that it reads negative. The dials are centre-zero so a negative reading swings left.</p>}
    />
  );
}
