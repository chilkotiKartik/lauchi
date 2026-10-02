"use client";
import { Line } from "@react-three/drei";
import { useMemo } from "react";
import { transient } from "../sim/elecx";
import { fmtSI } from "../sim/physics";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { ELECX_SPECS } from "../meta/elecx.specs";
import { C, Box, type V3 } from "../kit";
import { Coil, Flow, Graph, sample } from "../kit2";

export default function TransientLab() {
  const [P, set, reset] = useLabParams(ELECX_SPECS.transient);
  const { V, R, C: Cu, L, t, mode } = P;
  const s = transient(mode, V, R, Cu, L, t);
  const tauMs = s.tau * 1000, tMax = Math.max(5 * tauMs, t * 1.1, 1);
  const curve = useMemo(() => sample((ms) => transient(mode, V, R, Cu, L, ms)[mode === "rc" ? "vX" : "i"], 0, tMax, 120), [mode, V, R, Cu, L, tMax]);
  const loop = useMemo<V3[]>(() => [[-3, -1.4, 0], [-3, 1.4, 0], [0, 1.4, 0], [3, 1.4, 0], [3, -1.4, 0], [-3, -1.4, 0]], []);
  const frac = mode === "rc" ? s.vX / V : s.i / (V / R);
  return (
    <LabFrame
      label="A DC source, switch, resistor and a capacitor or inductor in a loop, with charges flowing at a speed set by the current at the chosen instant, beside the charging curve with a marker at that time"
      camera={[1.5, 0.4, 10]}
      onReset={reset}
      scene={() => (<group position={[-2.2, 0.2, 0]}>
        <Line points={loop} color={C.light} lineWidth={2.2} />
        <Box p={[-3, 0, 0]} s={[0.5, 0.9, 0.5]} c={C.green} />
        <Box p={[-3, 0.55, 0]} s={[0.25, 0.12, 0.25]} c={C.red} />
        <Box p={[0, 1.4, 0]} s={[1.1, 0.35, 0.35]} c={C.orange} />
        {mode === "rc" ? (<>
          <Box p={[3, 0.15, 0]} s={[0.9, 0.08, 0.9]} c={C.blue} glow={frac} />
          <Box p={[3, -0.15, 0]} s={[0.9, 0.08, 0.9]} c={C.red} glow={frac} />
        </>) : <Coil p={[3, 0, 0]} turns={7} r={0.35} len={1.6} color={C.purple} />}
        <Flow path={loop} n={18} speed={Math.max(0.02, 0.9 * (s.i / (V / R)))} color={C.gold} r={0.07} />
        <Graph x0={4.2} y0={-1.8} w={4.4} h={3.4} xr={[0, tMax]} yr={[0, (mode === "rc" ? V : V / R) * 1.08]} curves={[{ pts: curve, color: mode === "rc" ? C.blue : C.purple, w: 3 }]} marker={[t, mode === "rc" ? s.vX : s.i]} vlines={[{ x: tauMs, color: C.gold }]} />
      </group>)}
      readouts={[
        ["Time constant τ", fmtSI(s.tau, "s")],
        [mode === "rc" ? "Capacitor voltage v_C" : "Inductor voltage v_L", fmtSI(s.vX, "V")],
        ["Current i", fmtSI(s.i, "A")],
        ["Progress to final value", `${s.pct.toFixed(1)} %`],
        ["Energy stored", fmtSI(s.energy, "J")],
        ["Settled after 5τ", fmtSI(s.settle, "s")],
      ]}
      controls={<>
        <Slider label="Supply V" value={V} min={1} max={24} step={0.1} digits={1} unit=" V" onChange={(x) => set("V", x)} />
        <Slider label="Resistance R" value={R} min={10} max={10000} step={10} digits={0} unit=" Ω" onChange={(x) => set("R", x)} />
        <Pick label="Circuit" value={mode} options={[{ id: "rc", label: "R–C (capacitor charging)" }, { id: "rl", label: "R–L (inductor current rising)" }]} onChange={(x) => set("mode", x)} />
        <Slider label="Capacitance C" value={Cu} min={1} max={1000} step={1} digits={0} unit=" μF" onChange={(x) => set("C", x)} />
        <Slider label="Inductance L" value={L} min={10} max={5000} step={10} digits={0} unit=" mH" onChange={(x) => set("L", x)} />
        <Slider label="Time after switching t" value={t} min={0} max={2000} step={1} digits={0} unit=" ms" onChange={(x) => set("t", x)} />
      </>}
      note={<p>When the switch closes, a capacitor cannot change its voltage instantly and an inductor cannot change its current instantly, so both approach their final values exponentially. <b>RC:</b> v<sub>C</sub> = V(1 − e<sup>−t/RC</sup>), i = (V/R)e<sup>−t/RC</sup>. <b>RL:</b> i = (V/R)(1 − e<sup>−tR/L</sup>), v<sub>L</sub> = Ve<sup>−tR/L</sup>. After one time constant τ (gold line) the change is 63.2 % complete; after 5τ it is over 99 %, and in DC steady state a capacitor acts as an open circuit and an inductor as a short circuit. The charges move at a speed proportional to the current at time t.</p>}
    />
  );
}
