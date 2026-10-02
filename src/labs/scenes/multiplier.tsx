"use client";
import { useRef } from "react";
import type * as THREE from "three";
import { multiplier } from "../sim/elexy";
import { Tick } from "../Stage";
import { LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { ELEXY_SPECS } from "../meta/elexy.specs";
import { C, Ball, Box, type V3 } from "../kit";
import { Flow, Graph, Rod, type XY } from "../kit2";
import { AcSource, Cap, Diode, Ground, Tracer, Wire } from "./elexy-kit";

const TY = 1.1, BY = -1.1;
const T = (k: number): V3 => [-3.6 + 1.9 * k, TY, 0];
const B = (k: number): V3 => (k === 0 ? [-3.6, BY, 0] : [-3.6 + 1.9 * k + 0.95, BY, 0]);
/** Capacitor k (1-based) and diode k as [from, to] (diodes anode → cathode, current climbs the ladder). */
const capOf = (k: number): [V3, V3] => (k % 2 === 1 ? [T((k - 1) / 2), T((k + 1) / 2)] : [B(k / 2 - 1), B(k / 2)]);
const diodeOf = (k: number): [V3, V3] => (k % 2 === 1 ? [B((k - 1) / 2), T((k + 1) / 2)] : [T(k / 2), B(k / 2)]);
const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
function Glow({ a, b, color }: { a: V3; b: V3; color: string }) {
  return <><Rod a={lerp(a, b, 0.3)} b={lerp(a, b, 0.7)} r={0.22} color={color} glow={0.9} o={0.35} /><Flow path={[a, b]} n={6} speed={0.9} color={C.gold} r={0.06} cap={8} /></>;
}
/** Output terminals for order n: doubler across C2, tripler across C1 + C3, quadrupler across C2 + C4. */
const outOf = (n: number): [V3, V3] => (n === 3 ? [T(0), T(2)] : [B(0), B(n / 2)]);

export default function MultiplierLab() {
  const [P, set, reset] = useLabParams(ELEXY_SPECS.multiplier);
  const { Vm, n, C: Cu, IL, f, VD } = P;
  const N = Math.round(n);
  const m = multiplier(N, Vm, VD, f, Cu, IL);
  const phase = useRef(0), odd = useRef<THREE.Group>(null), even = useRef<THREE.Group>(null);
  const tick = (dt: number) => {
    phase.current = (phase.current + Math.min(dt, 0.05) * 0.35) % 1;
    const neg = Math.sin(2 * Math.PI * phase.current) < 0;
    if (odd.current) odd.current.visible = neg;
    if (even.current) even.current.visible = !neg;
  };
  const ks = Array.from({ length: N }, (_, i) => i + 1);
  const capV = (k: number) => (k === 1 ? Vm : 2 * Vm);
  const graph = (() => {
    const inp: XY[] = [], out: XY[] = [];
    for (let i = 0; i <= 160; i++) {
      const t = (2 * i) / 160, ph = t % 1;
      inp.push([t, Vm * Math.sin(2 * Math.PI * t)]);
      const since = (ph - 0.25 + 1) % 1; // recharged at each positive peak, sags linearly in between
      out.push([t, m.Vout + m.ripple / 2 - m.ripple * since]);
    }
    return { inp, out };
  })();
  const ymax = Math.max(N * Vm, Vm) * 1.15;
  const tracer: V3[] = graph.inp.map(([t, v]) => [-4.2 + (t / 2) * 8.4, -4.9 + 2.0 * ((v + Vm) / (ymax + Vm)), 0.05]);
  const [o1, o2] = outOf(N);
  return (
    <LabFrame
      label="A 3-D Cockcroft–Walton voltage-multiplier ladder: an AC source on the left, capacitors along the top and bottom rails and diodes zig-zagging between them; diodes light up and charges flow in alternate half-cycles, and a graph below compares the input sine with the multiplied DC output"
      camera={[0, -0.6, 11.5]}
      onReset={reset}
      scene={() => (<group>
        <Tick fn={tick} />
        <AcSource p={[-3.6, 0, 0]} />
        <Wire pts={[[-3.6, 0.38, 0], T(0)]} />
        <Wire pts={[[-3.6, -0.38, 0], B(0)]} />
        <Ground p={[-3.6, BY - 0.25, 0]} />
        {ks.map((k) => { const [a, b] = capOf(k); return <Cap key={`c${k}`} a={a} b={b} q={Math.min(1, capV(k) / Math.max(1, 2 * Vm))} c={k % 2 ? C.blue : C.purple} />; })}
        {ks.map((k) => { const [a, b] = diodeOf(k); return <Diode key={`d${k}`} a={a} b={b} />; })}
        <group ref={odd}>
          {ks.filter((k) => k % 2 === 1).map((k) => { const [a, b] = diodeOf(k); return <Glow key={k} a={a} b={b} color={C.orange} />; })}
        </group>
        <group ref={even}>
          {ks.filter((k) => k % 2 === 0).map((k) => { const [a, b] = diodeOf(k); return <Glow key={k} a={a} b={b} color={C.green} />; })}
        </group>
        <Ball p={o1} r={0.16} c={C.gold} glow={0.8} />
        <Ball p={o2} r={0.16} c={C.gold} glow={0.8} />
        <Wire pts={[[o1[0], o1[1], -0.6], [o2[0], o2[1], -0.6]]} c={C.gold} w={3} />
        <Wire pts={[o1, [o1[0], o1[1], -0.6]]} c={C.gold} />
        <Wire pts={[o2, [o2[0], o2[1], -0.6]]} c={C.gold} />
        <Box p={[4.1, -1.1 + (m.Vout / ymax) * 1.1, 0]} s={[0.5, Math.max(0.05, (m.Vout / ymax) * 2.2), 0.5]} c={C.gold} glow={0.5} />
        <Box p={[4.1, -1.1 + (m.Vnl / ymax) * 2.2, 0]} s={[0.62, 0.04, 0.62]} c={C.white} glow={0.4} />
        <Graph x0={-4.2} y0={-4.9} w={8.4} h={2.0} xr={[0, 2]} yr={[-Vm, ymax]} curves={[{ pts: graph.inp, color: C.blue, w: 2 }, { pts: graph.out, color: C.gold, w: 3 }]} />
        <Tracer pts={tracer} phase={phase} color={C.blue} r={0.09} />
      </group>)}
      readouts={[
        ["No-load output n(V_m − V_D)", `${m.Vnl.toFixed(1)} V (${m.name})`],
        ["Output with load", `${m.Vout.toFixed(1)} V`],
        ["Ripple (peak-to-peak)", `${m.ripple.toFixed(2)} V`],
        ["Voltage regulation", Number.isFinite(m.reg) ? `${m.reg.toFixed(1)} %` : "collapsed"],
        ["PIV of every diode", `${m.PIV.toFixed(0)} V = 2V_m`],
        ["Capacitor ratings", `C1: ${Vm.toFixed(0)} V, others ${(2 * Vm).toFixed(0)} V`],
      ]}
      controls={<>
        <Slider label="Input peak V_m" value={Vm} min={2} max={100} step={1} digits={0} unit=" V" onChange={(x) => set("Vm", x)} />
        <Slider label="Multiplication n (2 doubler, 3 tripler, 4 quadrupler)" value={n} min={2} max={4} step={1} digits={0} onChange={(x) => set("n", x)} />
        <Slider label="Each capacitor C" value={Cu} min={1} max={1000} step={1} digits={0} unit=" µF" onChange={(x) => set("C", x)} />
        <Slider label="Load current I_L" value={IL} min={0} max={50} step={0.5} digits={1} unit=" mA" onChange={(x) => set("IL", x)} />
        <Slider label="Supply frequency f" value={f} min={50} max={1000} step={10} digits={0} unit=" Hz" onChange={(x) => set("f", x)} />
        <Slider label="Diode drop V_D" value={VD} min={0} max={1} step={0.05} digits={2} unit=" V" onChange={(x) => set("VD", x)} />
      </>}
      note={<>
        <p>A <b>voltage multiplier</b> uses diodes and capacitors to build a DC voltage several times the input peak, without a step-up transformer. On one half-cycle the <b>odd</b> diodes (orange) conduct and on the other the <b>even</b> ones (green), so charge is pumped up the ladder: C1 charges to V<sub>m</sub>; then the source and C1 in series (2V<sub>m</sub>) charge C2 to 2V<sub>m</sub>; every later capacitor also holds 2V<sub>m</sub>. Taking the output across C2 gives a <b>doubler</b> (2V<sub>m</sub>), across C1 + C3 a <b>tripler</b> (3V<sub>m</sub>) and across C2 + C4 a <b>quadrupler</b> (4V<sub>m</sub>). Each diode must withstand PIV = 2V<sub>m</sub>.</p>
        <p>Multipliers only suit <b>small load currents</b>: a load drains the capacitors between recharges, so the output sags by (I/fC)(n³/12 + n²/8 − n/12) and ripples by (I/fC)·n(n + 2)/8 (both I/fC for a doubler). <b>Try:</b> raise I<sub>L</sub> on a quadrupler and watch the gold bar fall below its white no-load mark, then win it back with bigger C or higher f (as in CRT and photocopier HV supplies). Simplified model: ideal capacitors, steady state; the ripple wave is drawn schematically.</p>
      </>}
    />
  );
}
