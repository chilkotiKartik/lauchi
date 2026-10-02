"use client";
import { tankYear, MONSOON } from "../sim/extra";
import { Bars, Box, C, Floor, Panel } from "../kit";
import { LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { EXTRA_SPECS } from "../meta/extra.specs";

const kl = (l: number) => `${(l / 1000).toFixed(1)} kL`;

export default function RainwaterLab() {
  const [P, set, reset] = useLabParams(EXTRA_SPECS.rainwater);
  const { area, rain, coeff, tank, use } = P;
  const o = tankYear(area, rain, coeff, tank, use);
  const monthly = MONSOON.map((s) => (o.yearly * s) / 100);
  const top = Math.max(tank, ...monthly, 1);
  const peak = Math.max(...o.levels);
  const roof = 1.4 + Math.min(1.6, Math.sqrt(area / 1000) * 1.6);
  return (
    <LabFrame
      label="A sloping roof feeding a cylindrical tank, with twelve pairs of columns for the rain collected each month in blue and the water left in the tank in gold"
      camera={[0.4, 1.2, 7]}
      animated={false}
      onReset={reset}
      scene={() => (
        <group>
          <Floor size={12} y={-1.4} divisions={12} />
          <group position={[-4.1, -1.4, 0]}>
            <Box p={[0, 0.6, 0]} s={[1.6, 1.2, 1.4]} c={C.light} />
            <mesh position={[0, 1.45, 0]} rotation={[0, 0, 0.35]}><boxGeometry args={[roof * 0.6 + 0.8, 0.12, 1.7]} /><meshStandardMaterial color={C.orange} roughness={0.6} /></mesh>
            <mesh position={[1.9, 0.7, 0]}>
              <cylinderGeometry args={[0.55, 0.55, 1.4, 20, 1, true]} />
              <meshStandardMaterial color={C.light} transparent opacity={0.35} side={2} />
            </mesh>
            {peak > 0 && <mesh position={[1.9, (1.4 * Math.min(1, peak / tank)) / 2, 0]}>
              <cylinderGeometry args={[0.5, 0.5, Math.max(0.02, 1.4 * Math.min(1, peak / tank)), 20]} />
              <meshStandardMaterial color={C.blue} emissive={C.blue} emissiveIntensity={0.25} />
            </mesh>}
            <mesh position={[1.9, 1.45, 0]}><torusGeometry args={[0.55, 0.04, 8, 24]} /><meshStandardMaterial color={C.grey} /></mesh>
          </group>
          <Panel p={[1.25, 0.05, -0.5]} w={6.2} h={3.4} />
          <Bars values={monthly} max={top} colors={C.blue} x0={-1.3} y0={-1.4} w={0.19} gap={0.12} height={2.7} z={0.1} glow={0.25} />
          <Bars values={o.levels} max={top} colors={C.gold} x0={-1.07} y0={-1.4} w={0.19} gap={0.12} height={2.7} z={0.1} glow={0.25} />
        </group>
      )}
      readouts={[
        ["Water harvested a year", kl(o.yearly)],
        ["Overflow (wasted)", kl(o.overflow)],
        ["Shortfall (unmet)", kl(o.shortfall)],
        ["Demand met", `${o.met.toFixed(0)}%`],
        ["Days of use harvested", o.days.toFixed(0)],
        ["Fullest the tank gets", kl(peak)],
      ]}
      controls={<>
        <Slider label="Roof catchment area" value={area} min={10} max={1000} step={10} digits={0} unit=" m²" onChange={(x) => set("area", x)} />
        <Slider label="Yearly rainfall" value={rain} min={200} max={3000} step={50} digits={0} unit=" mm" onChange={(x) => set("rain", x)} />
        <Slider label="Runoff coefficient" value={coeff} min={0.3} max={0.95} step={0.05} digits={2} onChange={(x) => set("coeff", x)} />
        <Slider label="Tank size" value={tank} min={1000} max={100000} step={1000} digits={0} unit=" L" onChange={(x) => set("tank", x)} />
        <Slider label="Daily water use" value={use} min={50} max={2000} step={10} digits={0} unit=" L/day" onChange={(x) => set("use", x)} />
      </>}
      note={<p>Every millimetre of rain on one square metre gives one litre, so the yearly harvest is area × rainfall × runoff coefficient (0.8 for a tiled or concrete roof; less for soil or thatch). The twelve blue columns are each month&apos;s harvest (an assumed monsoon pattern: most rain falls June–September); the gold columns are the water still in the tank after that month&apos;s use. A small tank overflows in the monsoon and runs dry later, so a bigger tank turns overflow into stored water. First-flush losses and evaporation are ignored.</p>}
    />
  );
}
