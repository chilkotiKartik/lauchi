"use client";
import { useMemo } from "react";
import { etaAt, transformerTest } from "../sim/elecx";
import { LabFrame, Pick, Slider, Check } from "../ui";
import { useLabParams } from "../params";
import { ELECX_SPECS } from "../meta/elecx.specs";
import { C, Box, type V3 } from "../kit";
import { Coil, Dial, Flow, Graph, sample } from "../kit2";

export default function TransformerTestLab() {
  const [P, set, reset] = useLabParams(ELECX_SPECS.trtest);
  const { x, kva, Pi, Pcu, pf, R, X, lead, mode } = P;
  const t = transformerTest(kva, Pi, Pcu, x, pf, R, X, lead);
  const curve = useMemo(() => sample((u) => etaAt(u, kva, Pi, Pcu, pf), 0.02, 1.25, 100), [kva, Pi, Pcu, pf]);
  const core = useMemo<V3[]>(() => [[-1.5, 1.5, 0], [1.5, 1.5, 0], [1.5, -1.5, 0], [-1.5, -1.5, 0], [-1.5, 1.5, 0]], []);
  const fluxN = mode === "sc" ? 4 : 14;
  const meterF = mode === "oc" ? Pi / 2 : mode === "sc" ? Pcu / 5 : t.loss / 6;
  return (
    <LabFrame
      label="A two-limb transformer core with primary and secondary coils and flux circulating round the core; a wattmeter dial shows the measured loss, a lamp shows the load, and a graph plots efficiency against load"
      camera={[1.4, 0.8, 10]}
      onReset={reset}
      scene={() => (<group position={[-2.2, 0, 0]}>
        <Box p={[0, 1.5, 0]} s={[3.6, 0.6, 0.6]} c="#5b6d77" />
        <Box p={[0, -1.5, 0]} s={[3.6, 0.6, 0.6]} c="#5b6d77" />
        <Box p={[-1.5, 0, 0]} s={[0.6, 3.6, 0.6]} c="#5b6d77" />
        <Box p={[1.5, 0, 0]} s={[0.6, 3.6, 0.6]} c="#5b6d77" />
        <group rotation={[0, 0, Math.PI / 2]}><Coil p={[0, 1.5, 0]} turns={9} r={0.48} len={2} color={C.orange} /><Coil p={[0, -1.5, 0]} turns={5} r={0.48} len={2} color={C.green} /></group>
        <Flow path={core} n={fluxN} speed={0.3} color={C.purple} r={0.08} />
        <Dial p={[-2.2, 2.9, 0]} f={Math.min(1, meterF)} color={C.red} size={0.6} />
        <mesh position={[3.2, 0, 0]}><sphereGeometry args={[0.45, 20, 20]} /><meshStandardMaterial color={C.gold} emissive={C.gold} emissiveIntensity={mode === "load" ? Math.min(1.5, x) : 0.02} /></mesh>
        <Graph x0={4.4} y0={-1.8} w={4.2} h={3.6} xr={[0, 1.25]} yr={[80, 100]} curves={[{ pts: curve, color: C.green, w: 3 }]} marker={[x, t.eta]} vlines={[{ x: Math.min(1.25, t.xMax), color: C.gold }]} />
      </group>)}
      readouts={mode === "oc" ? [
        ["Test", "Open circuit (secondary open)"],
        ["Wattmeter reads", `${Pi.toFixed(3)} kW = iron loss`],
        ["Why", "Current is only the small no-load current, so copper loss ≈ 0"],
        ["Max efficiency at", `${(t.xMax * 100).toFixed(0)} % load`],
      ] : mode === "sc" ? [
        ["Test", "Short circuit at rated current"],
        ["Wattmeter reads", `${Pcu.toFixed(3)} kW = full-load copper loss`],
        ["Why", "Low voltage, so the core flux and iron loss are tiny"],
        ["Max efficiency at", `${(t.xMax * 100).toFixed(0)} % load`],
      ] : [
        ["Efficiency η", `${t.eta.toFixed(2)} %`],
        ["Output power", `${t.out.toFixed(2)} kW`],
        ["Copper loss x²P_cu", `${t.cu.toFixed(3)} kW`],
        ["Voltage regulation", `${t.reg.toFixed(2)} %`],
        ["Max efficiency", `${t.etaMax.toFixed(2)} % at x = ${t.xMax.toFixed(2)}`],
        ["Total losses", `${t.loss.toFixed(3)} kW`],
      ]}
      controls={<>
        <Slider label="Load fraction x" value={x} min={0} max={1.25} step={0.01} digits={2} onChange={(v) => set("x", v)} />
        <Slider label="Rating" value={kva} min={1} max={100} step={1} digits={0} unit=" kVA" onChange={(v) => set("kva", v)} />
        <Slider label="Iron loss P_i (OC test)" value={Pi} min={0.05} max={2} step={0.01} digits={2} unit=" kW" onChange={(v) => set("Pi", v)} />
        <Slider label="Full-load copper loss (SC test)" value={Pcu} min={0.1} max={5} step={0.01} digits={2} unit=" kW" onChange={(v) => set("Pcu", v)} />
        <Slider label="Power factor" value={pf} min={0.2} max={1} step={0.01} digits={2} onChange={(v) => set("pf", v)} />
        <Slider label="Percentage resistance" value={R} min={0.5} max={5} step={0.1} digits={1} unit=" %" onChange={(v) => set("R", v)} />
        <Slider label="Percentage reactance" value={X} min={1} max={10} step={0.1} digits={1} unit=" %" onChange={(v) => set("X", v)} />
        <Check label="Leading (capacitive) load" checked={lead} onChange={(v) => set("lead", v)} />
        <Pick label="Bench" value={mode} options={[{ id: "load", label: "Loaded transformer" }, { id: "oc", label: "Open-circuit test" }, { id: "sc", label: "Short-circuit test" }]} onChange={(v) => set("mode", v)} />
      </>}
      note={<p>The <b>open-circuit test</b> (rated voltage, secondary open) draws only the magnetising current, so the wattmeter reads the iron loss P<sub>i</sub>, which stays fixed at all loads. The <b>short-circuit test</b> (secondary shorted, reduced voltage, rated current) reads the full-load copper loss P<sub>cu</sub>, which varies as the square of the load fraction x. Efficiency η = xS cos φ/(xS cos φ + P<sub>i</sub> + x²P<sub>cu</sub>) is maximum where copper loss = iron loss, at x = √(P<sub>i</sub>/P<sub>cu</sub>) (gold line). Regulation ≈ x(%R cos φ ± %X sin φ): + for lagging, − for leading loads.</p>}
    />
  );
}
