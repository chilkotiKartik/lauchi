"use client";
import { loadBill, MCB_SIZES } from "../sim/extra";
import { Bars, Box, C, Floor, Panel } from "../kit";
import { Check, LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { EXTRA_SPECS } from "../meta/extra.specs";

export default function LoadBillLab() {
  const [P, set, reset] = useLabParams(EXTRA_SPECS.loadbill);
  const { bulbs, fans, acs, acHours, fridge, tariff, fixed } = P;
  const o = loadBill({ bulbs, fans, acs, acHours, fridge, tariff, fixed, volts: 230 });
  const maxKwh = Math.max(50, ...o.kwh);
  const wr = 0.05 + Math.sqrt(o.wire) * 0.045;
  return (
    <LabFrame
      label="Columns of monthly energy for bulbs, fans, air conditioners and a fridge, a row of nine miniature circuit breakers with the chosen one lit green, a copper wire whose thickness follows the wire size, and a gold bill column"
      camera={[0.3, 1, 7]}
      animated={false}
      onReset={reset}
      scene={() => (
        <group>
          <Floor size={12} y={-1.4} divisions={12} />
          <Panel p={[-3.2, 0.05, -0.5]} w={3.1} h={3.4} />
          <Bars values={o.kwh} max={maxKwh} colors={[C.gold, C.blue, C.red, C.green]} x0={-4.4} y0={-1.4} w={0.45} gap={0.2} height={2.8} z={0.1} glow={0.25} />
          <Panel p={[1.1, 0.5, -0.5]} w={3.6} h={2.4} c="#22343d" />
          {MCB_SIZES.map((s, i) => {
            const on = s === o.mcb;
            return <Box key={s} p={[-0.45 + i * 0.36, 0.5, 0]} s={[0.28, on ? 0.95 : 0.7, 0.3]} c={on ? C.green : C.grey} glow={on ? 0.6 : 0} />;
          })}
          <mesh position={[1.1, -0.5, 0.1]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[wr, wr, 3.2, 16]} />
            <meshStandardMaterial color={C.orange} metalness={0.5} roughness={0.35} />
          </mesh>
          <Box p={[3.7, -1.4 + Math.min(2.8, (o.bill / 3000) * 2.8) / 2, 0]} s={[0.7, Math.max(0.03, Math.min(2.8, (o.bill / 3000) * 2.8)), 0.7]} c={C.purple} glow={0.3} />
        </group>
      )}
      readouts={[
        ["Connected load", `${(o.connected / 1000).toFixed(2)} kW`],
        ["Current at 230 V", `${o.amps.toFixed(1)} A`],
        ["MCB to choose", `${o.mcb} A`],
        ["Copper wire", `${o.wire} mm²`],
        ["Energy a month", `${o.energy.toFixed(0)} kWh`],
        ["Monthly bill", `₹ ${o.bill.toFixed(0)}`],
      ]}
      controls={<>
        <Slider label="LED bulbs (9 W each)" value={bulbs} min={0} max={40} step={1} digits={0} onChange={(x) => set("bulbs", x)} />
        <Slider label="Ceiling fans (75 W each)" value={fans} min={0} max={15} step={1} digits={0} onChange={(x) => set("fans", x)} />
        <Slider label="Air conditioners (1.5 kW each)" value={acs} min={0} max={4} step={1} digits={0} onChange={(x) => set("acs", x)} />
        <Slider label="AC hours per day" value={acHours} min={0} max={24} step={1} digits={0} unit=" h" onChange={(x) => set("acHours", x)} />
        <Check label="Refrigerator (150 W, runs 40% of the day)" checked={fridge} onChange={(v) => set("fridge", v)} />
        <Slider label="Tariff per unit" value={tariff} min={2} max={12} step={0.5} digits={1} unit=" ₹/kWh" onChange={(x) => set("tariff", x)} />
        <Slider label="Fixed monthly charge" value={fixed} min={0} max={500} step={10} digits={0} unit=" ₹" onChange={(x) => set("fixed", x)} />
      </>}
      note={<p>The columns are the energy each group of appliances uses in 30 days (kWh = watts × hours × 30 / 1000): gold bulbs, blue fans, red air conditioners, green fridge. Total current is connected watts ÷ 230 V; the MCB is the next standard size above 125% of it, and the copper wire is a typical guide size for that MCB (a real installation must follow the electrical code and an electrician). The purple column is the bill, energy × tariff plus the fixed charge. Bulb, fan and AC wattages and the hours shown are typical assumptions.</p>}
    />
  );
}
