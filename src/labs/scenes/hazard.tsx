"use client";
import { glitchWidth, hazardWave, raceResult } from "../sim/bcax";
import { Poly } from "../kit";
import { LabFrame, Check, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { BCAX_SPECS } from "../meta/bcax.specs";
import { Arrow, Bench, C, Glass, Halo, Led, Node3, Packet, Slab, Txt, type V3 } from "./bcax-kit";

export default function HazardLab() {
  const [P, set, reset] = useLabParams(BCAX_SPECS.hazard);
  const { view, dinv, dand, cons, d1, d2, crit } = P;
  const w = hazardWave(dinv, dand, cons), gw = glitchWidth(dinv, cons), race = raceResult(crit, d1, d2);
  const sig: [string, number[], string][] = [["A", w.A, C.blue], ["An", w.An, C.purple], ["P1", w.P1, C.orange], ["P2", w.P2, C.orange], ["P3", w.P3, C.gold], ["F", w.F, w.F.some((f) => f === 0) ? C.red : C.green]];
  const line = (a: number[], row: number): V3[] => a.map((v, i) => [-4.8 + w.t[i] * 0.8, 5.0 - row * 0.95 + v * 0.55, row * -0.0]);
  const z0 = w.F.indexOf(0), z1 = w.F.lastIndexOf(0);
  const NP: Record<string, V3> = { "00": [-2.2, 1.2, 1.2], "01": [2.2, 1.2, 1.2], "10": [-2.2, 1.2, -1.4], "11": [2.2, 1.2, -1.4] };
  const route = [NP["00"], ...(race.mid === "11" ? [] : [NP[race.mid]]), NP[race.final]];
  return (
    <LabFrame
      label={view === "hazard" ? "Six glowing logic waveforms stacked above a bench: the output F dips to zero for a moment when A falls, a red glitch window the width of the inverter delay; adding the consensus term fills it in" : "Four state circles 00, 01, 10 and 11 on a bench with a gold packet racing from 00 to its final state along the path the faster variable chooses"}
      camera={[0, 3.6, 10]}
      onReset={reset}
      scene={() => (<group position={[0, -0.7, 0]}>
        <Bench w={13} d={6} />
        {view === "hazard" ? (<group>
          {sig.map(([n, a, c], row) => (<group key={n}>
            <Slab p={[0, 5.0 - row * 0.95 + 0.27, -0.2]} s={[9.8, 0.62, 0.05]} c="#1d2b33" metal={0.4} />
            <Poly pts={line(a, row)} c={c} w={row === 5 ? 4 : 2.5} />
            <Txt p={[-5.6, 5.0 - row * 0.95 + 0.27, 0]} s={n === "An" ? "A'" : n} h={0.4} c={c} />
          </group>))}
          {z0 >= 0 && <Glass p={[-4.8 + ((w.t[z0] + w.t[z1]) / 2) * 0.8, 5.0 - 5 * 0.95 + 0.27, 0.1]} s={[(w.t[z1] - w.t[z0]) * 0.8 + 0.3, 0.9, 0.6]} c={C.red} on={true} o={0.3} />}
          <Packet path={line(w.F, 5)} c={C.white} speed={0.12} r={0.11} />
          <Led p={[5.6, 0.3, 0]} c={gw > 0 ? C.red : C.green} r={0.25} />
        </group>) : (<group>
          {Object.entries(NP).map(([k, p]) => <Node3 key={k} p={p} r={0.5} c={k === race.final ? C.green : "#3b5b78"} glow={k === race.final ? 0.7 : 0.15} v={k} />)}
          <Halo p={NP[race.final]} r={0.8} c={C.green} />
          <Arrow a={[-2.2, 1.2, 0.6]} b={[-2.2, 1.2, -0.8]} c={C.blue} on={true} />
          <Arrow a={[-1.6, 1.2, 1.2]} b={[1.6, 1.2, 1.2]} c={C.orange} on={true} />
          <Arrow a={[-1.7, 1.2, 0.8]} b={[1.7, 1.2, -0.9]} c={C.gold} on={true} />
          <Arrow a={[-1.6, 1.2, -1.4]} b={[1.6, 1.2, -1.4]} c={crit ? "#566a75" : C.green} on={!crit} />
          <Arrow a={[2.2, 1.2, 0.6]} b={[2.2, 1.2, -0.8]} c={crit ? "#566a75" : C.green} on={!crit} />
          <Packet path={route} c={C.gold} speed={0.3} r={0.18} />
          <Slab p={[-3.6, 0.2, 2.3]} s={[Math.max(0.1, d1 / 9 * 2.5), 0.25, 0.4]} c={C.blue} glow={0.6} />
          <Slab p={[-3.6, 0.2, 2.9]} s={[Math.max(0.1, d2 / 9 * 2.5), 0.25, 0.4]} c={C.orange} glow={0.6} />
        </group>)}
      </group>)}
      readouts={view === "hazard" ? [
        ["Glitch width", gw > 0 ? `${gw.toFixed(1)} ns` : "none"], ["Output F during switch", gw > 0 ? "dips to 0 (static-1 hazard)" : "stays 1"],
        ["Consensus term BC", cons ? "added" : "missing"], ["Inverter delay", `${dinv.toFixed(1)} ns`], ["AND gate delay", `${dand.toFixed(1)} ns`],
      ] : [
        ["Faster variable", d1 === d2 ? "tie" : d1 < d2 ? "y1" : "y2"], ["Intermediate state", race.mid], ["Final stable state", race.final],
        ["Race type", crit ? (race.mid === "11" ? "critical table, tie" : "CRITICAL: end depends on speed") : "non-critical: always 11"],
      ]}
      controls={<>
        {view === "hazard" && <Slider label="Inverter delay" value={dinv} min={0} max={5} step={0.1} digits={1} unit=" ns" onChange={(x) => set("dinv", x)} />}
        {view === "race" && <Slider label="Delay of y1" value={d1} min={1} max={9} step={1} digits={0} unit=" ns" onChange={(x) => set("d1", Math.round(x))} />}
        {view === "hazard" && <Slider label="AND gate delay" value={dand} min={0} max={3} step={0.1} digits={1} unit=" ns" onChange={(x) => set("dand", x)} />}
        {view === "race" && <Slider label="Delay of y2" value={d2} min={1} max={9} step={1} digits={0} unit=" ns" onChange={(x) => set("d2", Math.round(x))} />}
        <Pick label="Experiment" value={view} options={[{ id: "hazard", label: "Static-1 hazard in F = AB + A'C" }, { id: "race", label: "Race in an asynchronous circuit" }]} onChange={(x) => set("view", x)} />
        {view === "hazard" && <Check label="Add the redundant consensus term BC" checked={cons} onChange={(x) => set("cons", x)} />}
        {view === "race" && <Check label="Critical race (flow table with two stable ends)" checked={crit} onChange={(x) => set("crit", x)} />}
      </>}
      note={view === "hazard" ? (
        <p>With B = C = 1 the function F = AB + A&apos;C should stay at 1 while A falls. But A&apos; only rises after the inverter delay, so for that short time both AND gates are 0 and F glitches to 0: a <b>static-1 hazard</b> (PYQ Q3.14). The glitch is as wide as the inverter delay. Adding the redundant <b>consensus term</b> BC keeps F = 1 all the time. In a K-map the hazard appears when two adjacent 1s are not covered by a common loop.</p>
      ) : (
        <p>A <b>race</b> happens when two state variables must change together but their delays differ. In a <b>non-critical</b> race (green arrows) both paths end in the same stable state 11. In a <b>critical</b> race the intermediate states 10 and 01 are both stable, so the final state depends on which variable is faster. Cures: race-free state assignment (change only one variable at a time), or adding extra states.</p>
      )}
    />
  );
}
