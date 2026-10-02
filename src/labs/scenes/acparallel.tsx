"use client";
import { Line } from "@react-three/drei";
import { useRef } from "react";
import type * as THREE from "three";
import { cabs, cang, eng, parallelAC } from "../sim/elecy";
import { Tick } from "../Stage";
import { LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { ELECY_SPECS } from "../meta/elecy.specs";
import { Box, C, type V3 } from "../kit";
import { Arrow, Coil, Rod } from "../kit2";
import { AcFlow, Capacitor, Cell, Resistor, Slab, Wire } from "./elecy-kit";

const ang = (z: { re: number; im: number }) => `${cabs(z) < 1e-9 ? 0 : cang(z).toFixed(1)}°`;
// schematic (bottom): source on the left, coil branch, R–C branch
const ORIGIN: V3 = [0, 0, 0];
const TOP = -1.75, BOT = -3.25;
const SRC: V3[] = [[-3.6, BOT, 0], [-3.6, TOP, 0]];
const B1: V3[] = [[-3.6, TOP, 0], [-1.1, TOP, 0], [-1.1, BOT, 0], [-3.6, BOT, 0]];
const B2: V3[] = [[-3.6, TOP, 0], [0.6, TOP, 0], [0.6, BOT, 0], [-3.6, BOT, 0]];

export default function AcParallelLab() {
  const [P, set, reset] = useLabParams(ELECY_SPECS.acparallel);
  const { V, f, R1, L, R2, C: Cu } = P;
  const r = parallelAC(V, f, R1, L, R2, Cu);
  const imax = Math.max(cabs(r.I1), cabs(r.I2), r.Imag, 1e-9), ks = 1.9 / imax;
  const tip = (z: { re: number; im: number }): V3 => [z.re * ks, z.im * ks, 0];
  const t1 = tip(r.I1), t2 = tip(r.I2), tI = tip(r.I);
  const sk = 2.3 / Math.max(r.S, 1e-9), p = r.P * sk, q = r.Q * sk;
  const grp = useRef<THREE.Group>(null), th = useRef(0);
  const tick = (dt: number) => { th.current += Math.min(dt, 0.05) * 2.2; if (grp.current) grp.current.rotation.z = th.current * 0.08; };
  const lag = (z: { re: number; im: number }) => -Math.atan2(z.im, z.re);
  const amp = (z: { re: number; im: number }) => 0.06 + (0.12 * cabs(z)) / imax;
  const hasC = Cu > 0;
  return (
    <LabFrame
      label="A phasor diagram with the supply voltage in gold, the coil current in orange, the capacitor-branch current in blue and their sum in red, beside a 3D power triangle (P green, Q purple, S red), above a small circuit in which charges shuttle back and forth in each branch"
      camera={[0.2, 0.2, 9.6]}
      onReset={reset}
      scene={() => (<group position={[0, 0.5, 0]}>
        <Tick fn={tick} />
        {/* phasor diagram */}
        <group position={[-2.1, 0.4, 0]}>
          <mesh position={[0, 0, -0.05]}><circleGeometry args={[2.1, 48]} /><meshBasicMaterial color="#16303b" /></mesh>
          <group ref={grp}>
            <Arrow from={[0, 0, 0]} to={[2.05, 0, 0]} color={C.gold} r={0.04} />
            <Arrow from={[0, 0, 0.02]} to={t1} color={C.orange} r={0.045} />
            {hasC ? <Arrow from={[0, 0, 0.04]} to={t2} color={C.blue} r={0.045} /> : null}
            <Arrow from={[0, 0, 0.06]} to={tI} color={C.red} r={0.06} />
            {hasC ? <>
              <Line points={[t1, tI]} color={C.blue} lineWidth={1.2} dashed dashSize={0.08} gapSize={0.06} />
              <Line points={[t2, tI]} color={C.orange} lineWidth={1.2} dashed dashSize={0.08} gapSize={0.06} />
            </> : null}
          </group>
        </group>
        {/* power triangle */}
        <group position={[1.1, 0.4, 0]} rotation={[0, -0.35, 0]}>
          {Math.abs(q) > 0.03 && p > 0.03 ? <Slab pts={[[0, 0], [p, 0], [p, q]]} color={r.Q >= 0 ? C.purple : C.blue} depth={0.25} o={0.55} /> : null}
          <Rod a={[0, 0, 0]} b={[Math.max(p, 0.001), 0, 0]} r={0.06} color={C.green} glow={0.3} />
          <Rod a={[p, 0, 0]} b={[p, q || 0.001, 0]} r={0.06} color={C.purple} glow={0.3} />
          <Rod a={[0, 0, 0]} b={[p || 0.001, q || 0.001, 0]} r={0.06} color={C.red} glow={0.3} />
        </group>
        {/* circuit */}
        <Box p={[-1.5, -2.5, -0.25]} s={[4.9, 2.0, 0.08]} c="#17303a" o={0.9} />
        <Wire pts={[[-3.6, TOP, 0], [0.6, TOP, 0]]} />
        <Wire pts={[[-3.6, BOT, 0], [0.6, BOT, 0]]} />
        <Cell a={SRC[0]} b={SRC[1]} color={C.gold} r={0.2} />
        <Resistor a={[-1.1, TOP, 0]} b={[-1.1, -2.45, 0]} r={0.11} />
        <group position={[-1.1, -2.85, 0]} rotation={[0, 0, Math.PI / 2]}><Coil p={ORIGIN} turns={6} r={0.2} len={0.7} color={C.orange} /></group>
        <Wire pts={[[-1.1, -2.45, 0], [-1.1, -2.5, 0]]} />
        <Wire pts={[[-1.1, -3.2, 0], [-1.1, BOT, 0]]} />
        {hasC ? <>
          {R2 > 0 ? <Resistor a={[0.6, TOP, 0]} b={[0.6, -2.45, 0]} r={0.11} /> : <Wire pts={[[0.6, TOP, 0], [0.6, -2.45, 0]]} />}
          <Capacitor a={[0.6, -2.45, 0]} b={[0.6, BOT, 0]} c={C.blue} />
        </> : null}
        <AcFlow path={B1} n={18} amp={amp(r.I1)} lag={lag(r.I1)} theta={th} color={C.orange} />
        {hasC ? <AcFlow path={B2} n={22} amp={amp(r.I2)} lag={lag(r.I2)} theta={th} color={C.blue} /> : null}
      </group>)}
      readouts={[
        ["Coil current I₁", `${eng(cabs(r.I1), "A")} ∠${ang(r.I1)}`],
        ["R–C branch current I₂", `${eng(cabs(r.I2), "A")} ∠${ang(r.I2)}`],
        ["Supply current I = I₁ + I₂", `${eng(r.Imag, "A")} ∠${ang(r.I)}`],
        ["Power factor cos φ", `${r.pf.toFixed(3)} ${Math.abs(r.phi) < 0.05 ? "(unity)" : r.phi > 0 ? "lagging" : "leading"}`],
        ["Active power P = VI cos φ", eng(r.P, "W")],
        ["Reactive Q · apparent S", `${eng(r.Q, "VAr")} · ${eng(r.S, "VA")}`],
      ]}
      controls={<>
        <Slider label="Supply voltage V (rms)" value={V} min={50} max={440} step={1} digits={0} unit=" V" onChange={(x) => set("V", x)} />
        <Slider label="Frequency f" value={f} min={25} max={100} step={0.5} digits={1} unit=" Hz" onChange={(x) => set("f", x)} />
        <Slider label="Coil resistance R₁" value={R1} min={1} max={200} step={0.5} digits={1} unit=" Ω" onChange={(x) => set("R1", x)} />
        <Slider label="Coil inductance L" value={L} min={0} max={1000} step={0.1} digits={1} unit=" mH" onChange={(x) => set("L", x)} />
        <Slider label="Branch-2 resistance R₂" value={R2} min={0} max={200} step={0.5} digits={1} unit=" Ω" onChange={(x) => set("R2", x)} />
        <Slider label="Capacitance C (0 = no branch)" value={Cu} min={0} max={500} step={0.5} digits={1} unit=" µF" onChange={(x) => set("C", x)} />
      </>}
      note={<>
        <p><b>Two branches in parallel</b> share the same voltage V (gold phasor, the reference). The coil (R₁ + jX_L, X_L = 2πfL) draws I₁ lagging V (orange); the R–C branch (R₂ − jX_C, X_C = 1/2πfC) draws I₂ leading V (blue). The supply current is their <b>phasor</b> sum I = I₁ + I₂ (red, the diagonal of the dashed parallelogram), so it can be smaller than either branch current. The whole diagram turns slowly, as real phasors do at ω; in the circuit below, charges shuttle back and forth in each branch, the blue ones peaking before the orange ones.</p>
        <p><b>Power triangle:</b> P = VI cos φ (W, green), Q = VI sin φ (VAr, purple; up for lagging, down for leading), S = VI (VA, red), S² = P² + Q², pf = cos φ = P/S. <b>Power-factor correction:</b> a capacitor in parallel supplies the coil’s lagging VArs locally: P stays the same but the supply current and S fall (C = Q_c/(ωV²)). A low pf means bigger currents, bigger cables and bigger losses for the same useful power, which is why industries are penalised for it.</p>
        <p><b>Try:</b> load the “coil takes 2 A” preset, then raise C slowly: the supply current falls to a minimum at unity pf (about 27 µF) and rises again as the circuit turns leading.</p>
      </>}
    />
  );
}
