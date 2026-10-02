"use client";
import { famMetrics, famLevels, type Fam } from "../sim/bcax";
import { Instances, type Inst } from "../kit";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { BCAX_SPECS } from "../meta/bcax.specs";
import { Bench, C, Led, Rail, Slab, Txt } from "./bcax-kit";

export default function LogicFamLab() {
  const [P, set, reset] = useLabParams(BCAX_SPECS.logicfam);
  const { fam, n, vdd, mhz, cl } = P;
  const f = fam as Fam, m = famMetrics(f, vdd, n, mhz, cl), lv = famLevels(f, vdd);
  const Y = (v: number) => ((v - lv.lo) / (lv.hi - lv.lo)) * 4;
  const loads: Inst[] = Array.from({ length: n }, (_, i) => ({ p: [-3.2 + (i % 20) * 0.34, 0.2, 2.2 + Math.floor(i / 20) * 0.4], s: [0.26, 0.26, 0.26], c: i >= m.limit ? C.red : C.blue }));
  const glow = Math.min(2, m.power / 15);
  return (
    <LabFrame
      label="A voltage ladder with the output levels VOH and VOL on the left plank, the input thresholds VIH and VIL on the right plank and gold noise-margin blocks between them, with a row of load gates in front that turn red beyond the fan-out limit"
      camera={[0, 3.4, 9.8]}
      onReset={reset}
      scene={() => (<group position={[0, -0.8, 0]}>
        <Bench w={13} d={6} />
        <Slab p={[-3.2, Y(lv.hi) / 2 + 0.1, 0]} s={[0.12, Y(lv.hi) + 0.1, 0.12]} c="#8aa0ab" />
        <Slab p={[-1.6, (Y(m.voh) + 0.1 + Y(lv.hi)) / 2 + 0.1, 0]} s={[1.5, Math.max(0.05, Y(lv.hi) - Y(m.voh)), 0.5]} c="#33505e" glow={0.05} o={0.6} />
        <Slab p={[-1.6, Y(m.voh) + 0.12, 0]} s={[1.5, 0.12, 0.6]} c={C.green} glow={0.9} />
        <Slab p={[-1.6, Y(m.vol) + 0.12, 0]} s={[1.5, 0.12, 0.6]} c={C.green} glow={0.9} />
        <Slab p={[1.6, Y(m.vih) + 0.12, 0]} s={[1.5, 0.12, 0.6]} c={C.blue} glow={0.9} />
        <Slab p={[1.6, Y(m.vil) + 0.12, 0]} s={[1.5, 0.12, 0.6]} c={C.blue} glow={0.9} />
        <Slab p={[0, (Y(m.voh) + Y(m.vih)) / 2 + 0.12, 0]} s={[1.0, Math.max(0.04, Y(m.voh) - Y(m.vih)), 0.5]} c={C.gold} glow={0.7} />
        <Slab p={[0, (Y(m.vil) + Y(m.vol)) / 2 + 0.12, 0]} s={[1.0, Math.max(0.04, Y(m.vil) - Y(m.vol)), 0.5]} c={C.gold} glow={0.7} />
        <Slab p={[-1.6, (Y(m.voh) + Y(m.vol)) / 2 + 0.12, -0.4]} s={[0.1, Y(m.voh) - Y(m.vol), 0.1]} c={C.green} glow={0.4} />
        <Slab p={[1.6, (Y(m.vih) + Y(m.vil)) / 2 + 0.12, -0.4]} s={[0.1, Math.max(0.02, Y(m.vih) - Y(m.vil)), 0.1]} c={C.blue} glow={0.4} />
        <Txt p={[-1.6, -0.0, 0.7]} s="out" h={0.3} c={C.green} />
        <Txt p={[1.6, -0.0, 0.7]} s="In" h={0.3} c={C.blue} />
        <Slab p={[4.4, 0.9, 0]} s={[1.2, 1.0, 1.0]} c="#3a2d66" glow={0.1} />
        <mesh position={[4.4, 1.9, 0]}><sphereGeometry args={[0.35 + glow * 0.15, 16, 16]} /><meshStandardMaterial color={C.orange} emissive={C.red} emissiveIntensity={0.3 + glow} /></mesh>
        <Rail a={[3.8, 0.5, 0.3]} b={[-3.0, 0.2, 2.0]} c={C.gold} on={true} r={0.04} />
        <Instances items={loads} cap={64} shape="box" />
        <Led p={[5.6, 0.3, 0]} c={m.overloaded ? C.red : C.green} r={0.25} />
      </group>)}
      readouts={[
        ["Noise margin high NMH", `${m.nmh.toFixed(2)} V`], ["Noise margin low NML", `${m.nml.toFixed(2)} V`],
        ["Fan-out limit", `${m.limit} gates${m.overloaded ? " (overloaded!)" : ""}`], ["Propagation delay", `${m.tpd.toFixed(1)} ns`], ["Power per gate", m.power < 1 ? `${(m.power * 1000).toFixed(0)} µW` : `${m.power.toFixed(1)} mW`],
      ]}
      controls={<>
        <Slider label="Gates driven (load N)" value={n} min={1} max={40} step={1} digits={0} onChange={(x) => set("n", Math.round(x))} />
        <Pick label="Logic family" value={fam} options={[{ id: "TTL", label: "TTL (74 series, 5 V)" }, { id: "CMOS", label: "CMOS" }, { id: "ECL", label: "ECL (-5.2 V)" }]} onChange={(x) => set("fam", x)} />
        {fam === "CMOS" && <Slider label="CMOS supply VDD" value={vdd} min={3} max={15} step={0.5} digits={1} unit=" V" onChange={(x) => set("vdd", x)} />}
        {fam === "CMOS" && <Slider label="Clock frequency" value={mhz} min={0.1} max={100} step={0.1} digits={1} unit=" MHz" onChange={(x) => set("mhz", x)} />}
        {fam === "CMOS" && <Slider label="Wiring capacitance" value={cl} min={1} max={100} step={1} digits={0} unit=" pF" onChange={(x) => set("cl", Math.round(x))} />}
      </>}
      note={<p><b>Noise margin</b>: NM<sub>H</sub> = V<sub>OH</sub> − V<sub>IH</sub> and NM<sub>L</sub> = V<sub>IL</sub> − V<sub>OL</sub> (gold blocks): how much noise a signal can pick up and still be read correctly. TTL: 2.4 − 2.0 = 0.4 V both ways. CMOS: V<sub>IH</sub> = 0.7 V<sub>DD</sub>, V<sub>IL</sub> = 0.3 V<sub>DD</sub>, so about 30% of the supply. <b>Fan-out</b> = the number of gates one output can drive: for TTL min(I<sub>OL</sub>/I<sub>IL</sub>, I<sub>OH</sub>/I<sub>IH</sub>) = 16/1.6 = 10; extra loads turn red. Each load also slows the gate. CMOS draws almost no static current; its power is dynamic: P = C·V<sub>DD</sub>²·f. TTL totem-pole outputs actively pull both ways; open-collector outputs need a pull-up and can be wired together. (Simplified typical datasheet values.)</p>}
    />
  );
}
