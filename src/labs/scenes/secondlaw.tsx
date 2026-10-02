"use client";
import { useMemo } from "react";
import { secondLaw, type SecondMode } from "../sim/mechy";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { MECHY_SPECS } from "../meta/mechy.specs";
import { Box, Poly, type V3 } from "../kit";
import { Arrow, C, Flow, Rod } from "../kit2";
import { Spinner } from "./mechy-kit";

const YH = 2.5, YC = -2.5, XE = -1.7, XR = 1.7;
type Stream = { from: V3; to: V3; q: number; color: string };

function HeatArrow({ s, scale }: { s: Stream; scale: number }) {
  const path = useMemo<V3[]>(() => [s.from, s.to], [s.from, s.to]);
  if (s.q <= 1e-9) return null;
  const r = 0.03 + 0.09 * Math.min(1, s.q / scale);
  return (<>
    <Arrow from={s.from} to={s.to} color={s.color} r={r} head={0.3} />
    <Flow path={path} n={Math.max(2, Math.round(10 * Math.min(1, s.q / scale)))} speed={0.5} color={s.color === C.purple ? C.gold : "#ffd0c0"} r={0.06} />
  </>);
}

function Machine({ x, color, label }: { x: number; color: string; label: "E" | "R" }) {
  return (<group position={[x, 0, 0]}>
    <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.75, 0.75, 0.6, 32]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} metalness={0.3} roughness={0.35} /></mesh>
    <Spinner speed={label === "E" ? 1.5 : -1.5}>
      {[0, 1, 2].map((i) => <mesh key={i} position={[0, 0, 0.32]} rotation={[0, 0, (i * Math.PI) / 3]}><boxGeometry args={[1.2, 0.12, 0.05]} /><meshStandardMaterial color={C.white} /></mesh>)}
    </Spinner>
  </group>);
}

export default function SecondLawLab() {
  const [P, set, reset] = useLabParams(MECHY_SPECS.secondlaw);
  const { Q1, TH, TC, frac, mode } = P;
  const tc = Math.min(TC, TH - 1);
  const s = secondLaw(mode, Q1, TH, tc, frac);
  const scale = Math.max(Q1, s.QL + s.W, s.pumped, 1);
  const streams: Stream[] = mode === "clausius" ? [
    { from: [XE, YH - 0.45, 0], to: [XE, 0.85, 0], q: Q1, color: C.red },
    { from: [XE, -0.85, 0], to: [XE, YC + 0.45, 0], q: s.pumped, color: C.blue },
    { from: [XR, YC + 0.45, 0], to: [XR, -0.85, 0], q: s.pumped, color: C.blue },
    { from: [XR, 0.85, 0], to: [XR, YH - 0.45, 0], q: s.pumped, color: C.red },
  ] : [
    { from: [XE, YH - 0.45, 0], to: [XE, 0.85, 0], q: Q1, color: C.red },
    { from: [XE, -0.85, 0], to: [XE, YC + 0.45, 0], q: Q1 - s.W, color: C.blue },
    { from: [XR, YC + 0.45, 0], to: [XR, -0.85, 0], q: s.QL, color: C.blue },
    { from: [XR, 0.85, 0], to: [XR, YH - 0.45, 0], q: s.QL + s.W, color: C.red },
  ];
  const outline: V3[] = [[-2.8, -1.25, 0.5], [2.8, -1.25, 0.5], [2.8, 1.25, 0.5], [-2.8, 1.25, 0.5], [-2.8, -1.25, 0.5]];
  const netHot = -s.hot, netCold = -s.cold;
  const verdict = s.ok ? (Math.abs(s.dS) < 1e-9 ? "Reversible: ΔS = 0 (allowed)" : "Allowed: ΔS > 0") : mode === "clausius" ? "Impossible — a PMM2 (breaks Kelvin–Planck)" : "Impossible — breaks Clausius";
  return (
    <LabFrame
      label="A hot reservoir above and a cold reservoir below; an engine on the left and a refrigerator or Clausius-violating heat pump on the right exchange heat (arrows) and work (gold shaft); a dashed box marks the composite device whose net effect is checked"
      camera={[0, 0, 10.5]}
      onReset={reset}
      scene={() => (<group rotation={[0.18, -0.25, 0]}>
        <Box p={[0, YH, 0]} s={[6.4, 0.6, 2]} c={C.red} glow={0.35} />
        <Box p={[0, YC, 0]} s={[6.4, 0.6, 2]} c={C.blue} glow={0.35} />
        <Machine x={XE} color={mode === "kp" ? C.orange : C.gold} label="E" />
        <Machine x={XR} color={mode === "clausius" ? C.orange : C.purple} label="R" />
        {streams.map((st, i) => <HeatArrow key={i} s={st} scale={scale} />)}
        {mode !== "clausius" && s.W > 1e-9 && <Rod a={[XE + 0.75, 0, 0]} b={[XR - 0.75, 0, 0]} r={0.08} color={C.gold} glow={0.4} />}
        {mode === "clausius" && s.W > 1e-9 && <Arrow from={[XE + 0.75, 0, 0]} to={[XE + 2.1, 0, 0]} color={C.gold} r={0.07} />}
        <Poly pts={outline} c={s.ok ? C.green : C.orange} w={2} />
        <group position={[3.6, 0, 0]}>
          {netHot > 1e-9 && <Arrow from={[0, YH - 0.4, 0]} to={[0, YH - 0.4 - 0.4 - 1.2 * Math.min(1, netHot / scale), 0]} color={C.red} r={0.07} />}
          {netHot < -1e-9 && <Arrow from={[0, YH - 1.9, 0]} to={[0, YH - 0.4, 0]} color={C.red} r={0.07} />}
          {netCold > 1e-9 && <Arrow from={[0.5, YC + 0.4, 0]} to={[0.5, YC + 0.8 + 1.2 * Math.min(1, netCold / scale), 0]} color={C.blue} r={0.07} />}
          {netCold < -1e-9 && <Arrow from={[0.5, YC + 1.9, 0]} to={[0.5, YC + 0.4, 0]} color={C.blue} r={0.07} />}
          {s.Wnet > 1e-9 && <Arrow from={[0, 0, 0]} to={[1.2, 0, 0]} color={C.gold} r={0.07} />}
        </group>
      </group>)}
      readouts={[
        [mode === "kp" ? "Engine work W (η = 100 %!)" : "Engine work W = ηQ₁", `${s.W.toFixed(1)} kJ (η = ${(s.eta * 100).toFixed(1)} %)`],
        [mode === "clausius" ? "Heat pumped up with no work" : "Fridge lifts Q_L from cold", `${(mode === "clausius" ? s.pumped : s.QL).toFixed(1)} kJ`],
        ["Net heat from hot reservoir", `${netHot.toFixed(1)} kJ`],
        ["Net heat from cold reservoir", `${netCold.toFixed(1)} kJ`],
        ["Net work out of the box", `${s.Wnet.toFixed(1)} kJ`],
        ["ΔS of the reservoirs", `${s.dS.toFixed(4)} kJ/K — ${verdict}`],
      ]}
      controls={<>
        <Slider label="Heat into the engine Q₁" value={Q1} min={10} max={1000} step={1} digits={0} unit=" kJ" onChange={(x) => set("Q1", x)} />
        <Pick label="Thought experiment" value={mode} options={[
          { id: "clausius", label: "Suppose Clausius is violated (free heat pump)" },
          { id: "kp", label: "Suppose Kelvin–Planck is violated (100 % engine)" },
          { id: "legal", label: "Real engine drives a real refrigerator" },
        ] as { id: SecondMode; label: string }[]} onChange={(x) => set("mode", x)} />
        <Slider label="Hot reservoir T_H" value={TH} min={300} max={1500} step={1} digits={0} unit=" K" onChange={(x) => set("TH", x)} />
        <Slider label="Cold reservoir T_C" value={TC} min={200} max={400} step={1} digits={0} unit=" K" onChange={(x) => set("TC", x)} />
        <Slider label="Real machines reach this fraction of Carnot" value={frac} min={0.1} max={1} step={0.01} digits={2} onChange={(x) => set("frac", x)} />
      </>}
      note={<>
        <p><b>Kelvin–Planck:</b> no device working in a cycle can take heat from a single reservoir and turn all of it into work (no 100 % engine, no <b>PMM2</b>). <b>Clausius:</b> no device working in a cycle can move heat from a colder to a hotter body without work being put in. The two say the same thing, because breaking one lets you break the other:</p>
        <p className="mt-2"><b>Clausius violated:</b> let an ordinary engine reject Q₁ − W to the cold reservoir and let the &quot;free heat pump&quot; carry exactly that back up. The cold reservoir is unchanged, and the box takes Q₁ − (Q₁ − W) = W from the hot reservoir and turns it all into work: a Kelvin–Planck violation. <b>Kelvin–Planck violated:</b> let the 100 % engine drive an ordinary refrigerator. The box needs no work, yet heat Q_L flows from cold to hot: a Clausius violation. Both give ΔS &lt; 0 for the reservoirs, which the second law forbids. A real engine driving a real fridge always gives ΔS ≥ 0 (= 0 only when both are reversible, fraction = 1).</p>
      </>}
    />
  );
}
