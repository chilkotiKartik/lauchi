"use client";
import { useMemo } from "react";
import { dur, fuseTime, MAG, mcbTime, protection, type Curve } from "../sim/elecy";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { ELECY_SPECS } from "../meta/elecy.specs";
import { Box, C, type V3 } from "../kit";
import { Flow, Graph, mix, Rod, type XY } from "../kit2";

const TMIN = -2.3, TMAX = 4;
const lt = (t: number) => Math.min(TMAX, Math.max(TMIN, Math.log10(t)));
const SOON = 3600;   // shown as tripped / blown when it acts within an hour

function Lever({ p, on }: { p: V3; on: boolean }) {
  return (
    <group position={p}>
      <Box p={[0, 0, 0]} s={[0.36, 0.5, 0.1]} c={C.dark} />
      <Box p={[0, on ? 0.13 : -0.13, 0.12]} s={[0.22, 0.22, 0.2]} c={on ? C.green : C.red} glow={0.5} />
    </group>
  );
}

export default function SwitchgearLab() {
  const [P, set, reset] = useLabParams(ELECY_SPECS.switchgear);
  const { I, In, curve, leak, rcd } = P;
  const rmA = Number(rcd);
  const pr = protection(I, In, curve as Curve, leak, rmA);
  const curves = useMemo(() => {
    const mcb: XY[] = [], fuse: XY[] = [];
    for (let i = 0; i <= 200; i++) {
      const k = 10 ** ((i / 200) * 2);
      const tm = mcbTime(k, curve), tf = fuseTime(k);
      if (Number.isFinite(tm)) mcb.push([Math.log10(k), lt(tm)]);
      if (Number.isFinite(tf)) fuse.push([Math.log10(k), lt(tf)]);
    }
    return { mcb, fuse };
  }, [curve]);
  const mcbOut = pr.tm < SOON, fuseOut = pr.tf < SOON, rcdOut = pr.tr < SOON;
  const live = !(mcbOut || fuseOut || rcdOut);
  const heat = Math.min(1, Math.max(0, (pr.k - 0.5) / 2));
  const kx = Math.log10(Math.max(1, Math.min(100, pr.k)));
  const marker: XY | null = Number.isFinite(pr.tFirst) && pr.first !== "RCD" ? [kx, lt(pr.tFirst)] : null;
  const vel = live ? 0.25 + Math.min(1.2, Math.log10(1 + I) * 0.4) : 0;
  return (
    <LabFrame
      label="A distribution board with an HRC fuse, an MCB and an RCD feeding a heater, with current dots flowing and levers that drop when a device trips; beside it a log–log time–current graph with the MCB curve in green, the fuse curve in orange and the present current as a red line"
      camera={[0, 0.3, 9.6]}
      onReset={reset}
      scene={() => (<group>
        {/* board */}
        <group position={[-2.3, 0, 0]}>
          <Box p={[0, 0, -0.25]} s={[3.6, 4.0, 0.3]} c="#203740" />
          <Rod a={[-1.6, 1.0, -0.05]} b={[1.6, 1.0, -0.05]} r={0.05} color={C.light} />
          {/* fuse carrier */}
          <Box p={[-1.1, 1.0, 0.05]} s={[0.7, 1.3, 0.35]} c="#e2e6e8" />
          <Rod a={[-1.1, 0.5, 0.3]} b={[-1.1, 1.5, 0.3]} r={0.15} color="#f2efe6" />
          {fuseOut ? <>
            <Rod a={[-1.1, 0.6, 0.47]} b={[-1.1, 0.9, 0.47]} r={0.03} color={C.dark} />
            <Rod a={[-1.1, 1.1, 0.47]} b={[-1.1, 1.4, 0.47]} r={0.03} color={C.dark} />
          </> : <Rod a={[-1.1, 0.6, 0.47]} b={[-1.1, 1.4, 0.47]} r={0.03} color={mix(C.gold, C.red, heat)} glow={0.3 + heat} />}
          {/* MCB */}
          <Box p={[0, 1.0, 0.05]} s={[0.6, 1.3, 0.4]} c="#eef2f4" />
          <Lever p={[0, 1.05, 0.3]} on={!mcbOut} />
          <Box p={[0, 0.5, 0.27]} s={[0.4, 0.08, 0.02]} c={curve === "B" ? C.green : curve === "C" ? C.blue : C.purple} />
          {/* RCD */}
          <Box p={[1.05, 1.0, 0.05]} s={[1.0, 1.3, 0.4]} c="#eef2f4" />
          <Lever p={[0.9, 1.05, 0.3]} on={!rcdOut} />
          <mesh position={[1.3, 1.3, 0.3]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.09, 0.09, 0.1, 14]} /><meshStandardMaterial color={C.blue} emissive={C.blue} emissiveIntensity={0.4} /></mesh>
          {/* supply and load wiring */}
          <Rod a={[-1.1, 2.2, 0.3]} b={[-1.1, 1.65, 0.3]} r={0.05} color={C.red} />
          <Rod a={[1.05, 0.35, 0.3]} b={[1.05, -0.9, 0.3]} r={0.05} color={C.red} />
          {/* heater load */}
          <Box p={[0.2, -1.3, 0.2]} s={[2.4, 0.6, 0.5]} c={C.dark} />
          {[-0.8, -0.3, 0.2, 0.7, 1.2].map((x, i) => <Rod key={i} a={[x - 0.2, -1.3, 0.48]} b={[x + 0.2, -1.3, 0.48]} r={0.06} color={live ? C.orange : C.grey} glow={live ? 0.4 + heat * 0.8 : 0} />)}
          <Flow path={[[-1.1, 2.2, 0.45], [-1.1, 0.5, 0.5], [0, 0.4, 0.5], [1.05, 0.35, 0.5], [1.05, -1.0, 0.5], [-0.8, -1.0, 0.5]]} n={18} speed={vel / 6} color={C.gold} r={0.065} />
          {/* earth leakage path */}
          {leak > 0 ? <>
            <Rod a={[-1.0, -1.6, 0.2]} b={[-1.0, -2.1, 0.2]} r={0.035} color={C.green} />
            <Box p={[-1.0, -2.2, 0.2]} s={[1.0, 0.08, 0.6]} c={C.green} glow={0.3} />
            <Flow path={[[-1.0, -1.55, 0.35], [-1.0, -2.15, 0.35]]} n={4} speed={rcdOut ? 0 : 0.4 + Math.min(1, leak / 100)} color={C.purple} r={0.06} />
          </> : null}
        </group>
        <Graph x0={0.7} y0={-1.8} w={3.9} h={3.6} xr={[0, 2]} yr={[TMIN, TMAX]} grid={4}
          curves={[{ pts: curves.fuse, color: C.orange, w: 3 }, { pts: curves.mcb, color: C.green, w: 3.2 }]}
          vlines={[{ x: kx, color: C.red }, { x: Math.log10(MAG[curve]), color: C.purple }]} marker={marker} />
      </group>)}
      readouts={[
        ["Current ÷ rating (k = I/I_n)", `${pr.k.toFixed(2)} × (${pr.region})`],
        ["MCB trips after", dur(pr.tm)],
        ["HRC fuse melts after", dur(pr.tf)],
        [`RCD (${rmA} mA) trips after`, dur(pr.tr)],
        ["Acts first", Number.isFinite(pr.tFirst) ? `${pr.first} (${dur(pr.tFirst)})` : pr.first],
      ]}
      controls={<>
        <Slider label="Circuit current I" value={I} min={1} max={1000} step={1} digits={1} unit=" A" onChange={(x) => set("I", x)} />
        <Slider label="Rating I_n (MCB and fuse)" value={In} min={6} max={63} step={1} digits={0} unit=" A" onChange={(x) => set("In", x)} />
        <Pick label="MCB curve" value={curve} options={[{ id: "B", label: "B: trips at 3–5 × I_n (homes, lighting)" }, { id: "C", label: "C: 5–10 × I_n (motors, ACs)" }, { id: "D", label: "D: 10–20 × I_n (transformers, welders)" }]} onChange={(x) => set("curve", x)} />
        <Slider label="Earth leakage current" value={leak} min={0} max={300} step={1} digits={0} unit=" mA" onChange={(x) => set("leak", x)} />
        <Pick label="RCD / ELCB sensitivity" value={rcd} options={[{ id: "10", label: "10 mA (bathrooms)" }, { id: "30", label: "30 mA (personal protection)" }, { id: "100", label: "100 mA" }, { id: "300", label: "300 mA (fire protection)" }]} onChange={(x) => set("rcd", x)} />
      </>}
      note={<>
        <p><b>The board:</b> supply (red wire) → <b>HRC fuse</b> (white cartridge; its element glows and breaks when it melts) → <b>MCB</b> (lever drops to red when it trips; the coloured strip marks the curve) → <b>RCD/ELCB</b> (with its blue test button) → heater. Purple dots run to earth when there is leakage. The graph is the <b>time–current characteristic</b> on log scales: x = I/I_n from 1 to 100, y = trip time from 5 ms to about 3 h. Green = MCB, orange = fuse, red line = your current, purple line = the magnetic threshold of the chosen curve.</p>
        <p><b>MCB</b> (miniature circuit breaker): a bimetal strip bends with I²R heating and trips on overload (inverse time: no trip at 1.13 I_n, trip within 1 h at 1.45 I_n), and a solenoid trips it in ~10 ms on short circuit. It is reset, not replaced. <b>Fuse / SFU</b> (switch fuse unit): a switch plus an HRC fuse whose element melts; it must be replaced. <b>MCCB</b>: the same idea as an MCB for 100–1600 A with adjustable trip settings. <b>ELCB/RCD</b>: compares phase and neutral current; any difference (current leaking to earth, maybe through a person) above 30 mA trips it within 0.3 s, which overload devices can never do. Simplified model curves (shapes from IEC 60898/60269; real products vary).</p>
        <p><b>Try:</b> 160 A on a 16 A B-curve trips magnetically, but on a D-curve it waits seconds. Then set 40 mA leakage with a normal 10 A load.</p>
      </>}
    />
  );
}
