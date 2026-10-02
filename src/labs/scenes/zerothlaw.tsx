"use client";
import { useRef } from "react";
import type * as THREE from "three";
import { equilibrium, mercury, rtd, SPECIFIC_HEAT, thermocouple, type Mat } from "../sim/mechy";
import { Tick } from "../Stage";
import { Check, LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { MECHY_SPECS } from "../meta/mechy.specs";
import { Box } from "../kit";
import { C, Coil, Rod } from "../kit2";
import { tempColor } from "./mechy-kit";

const MATS: { id: Mat; label: string }[] = [
  { id: "water", label: "Water (c = 4.19 kJ/kg·K)" }, { id: "al", label: "Aluminium (0.90)" }, { id: "cu", label: "Copper (0.385)" }, { id: "fe", label: "Iron (0.45)" },
];
type Sensor = "rtd" | "tc" | "hg";
const LO = -20, HI = 300;

/** Thermometer C dips into A, then into B, again and again; its tip glows with the temperature it reads. */
function Probe({ xa, xb, ta, tb, sensor, playing }: { xa: number; xb: number; ta: number; tb: number; sensor: Sensor; playing: boolean }) {
  const g = useRef<THREE.Group>(null), tip = useRef<THREE.MeshStandardMaterial>(null), hg = useRef<THREE.Mesh>(null), t = useRef(0);
  const la = 0.25 + 1.9 * (mercury(ta) / 200), lb = 0.25 + 1.9 * (mercury(tb) / 200);
  const ca = tempColor(ta, LO, HI), cb = tempColor(tb, LO, HI);
  const tick = (dt: number) => {
    if (playing) t.current += Math.min(dt, 0.05) * 0.35;
    const ph = t.current % 1, onA = ph < 0.5, local = (ph % 0.5) * 2;
    const x = onA ? xa : xb, lift = local < 0.15 ? 1 - local / 0.15 : local > 0.85 ? (local - 0.85) / 0.15 : 0;
    const prevX = onA ? xb : xa, moveX = local < 0.15 ? prevX + (x - prevX) * (local / 0.15) : x;
    g.current?.position.set(moveX, 0.95 + lift * 1.1, 0.1);
    tip.current?.color.set(onA ? ca : cb);
    tip.current?.emissive.set(onA ? ca : cb);
    if (hg.current) { const l = onA ? la : lb; hg.current.scale.y = l; hg.current.position.y = 0.05 + l / 2; }
  };
  return (<group ref={g} position={[xa, 0.95, 0.1]}>
    <Tick fn={tick} />
    <Rod a={[0, 0, 0]} b={[0, 2.4, 0]} r={0.08} color={C.white} o={0.55} />
    <mesh position={[0, 0.02, 0]}><sphereGeometry args={[0.15, 16, 12]} /><meshStandardMaterial ref={tip} color={ca} emissive={ca} emissiveIntensity={0.6} /></mesh>
    {sensor === "rtd" && <group rotation={[0, 0, Math.PI / 2]}><Coil p={[0.45, 0, 0]} turns={6} r={0.11} len={0.6} color={C.orange} w={2} /></group>}
    {sensor === "tc" && <><Rod a={[-0.05, 0.05, 0.05]} b={[-0.05, 2.4, 0.05]} r={0.025} color={C.gold} /><Rod a={[0.05, 0.05, 0.05]} b={[0.05, 2.4, 0.05]} r={0.025} color={C.red} /></>}
    {sensor === "hg" && <mesh ref={hg} position={[0, 0.05 + la / 2, 0]} scale={[1, la, 1]}><cylinderGeometry args={[0.035, 0.035, 1, 10]} /><meshStandardMaterial color={C.light} emissive={C.light} emissiveIntensity={0.3} /></mesh>}
    <Box p={[0, 2.55, 0]} s={[0.32, 0.3, 0.32]} c={C.dark} />
  </group>);
}

export default function ZerothLawLab() {
  const [P, set, reset] = useLabParams(MECHY_SPECS.zerothlaw);
  const { TA, TB, mA, mB, matA, matB, sensor, contact } = P;
  const eq = equilibrium(TA, mA, SPECIFIC_HEAT[matA], TB, mB, SPECIFIC_HEAT[matB]);
  const ta = contact ? eq.T : TA, tb = contact ? eq.T : TB;
  const same = Math.abs(ta - tb) < 0.05;
  const read = (T: number) => sensor === "rtd" ? `${rtd(T).toFixed(2)} Ω → ${T.toFixed(1)} °C` : sensor === "tc" ? `${thermocouple(T).toFixed(3)} mV → ${T.toFixed(1)} °C` : `${mercury(T).toFixed(1)} mm → ${T.toFixed(1)} °C`;
  const sa = 0.7 + 0.35 * Math.cbrt(mA), sb = 0.7 + 0.35 * Math.cbrt(mB);
  const xa = contact ? -sa / 2 : -1.9, xb = contact ? sb / 2 : 1.9;
  return (
    <LabFrame
      label="Two blocks A and B inside an insulated box, coloured by temperature from blue (cold) to red (hot); a thermometer probe C dips into one block and then the other, its tip glowing with the reading; when the blocks are put in contact they share one temperature"
      camera={[0, 1.6, 8.5]}
      onReset={reset}
      scene={(playing) => (<group rotation={[0.1, -0.3, 0]}>
        <Box p={[0, -0.05 - 1, 0]} s={[6.6, 0.1, 3]} c={C.dark} />
        <mesh position={[0, 0.4, 0]}><boxGeometry args={[6.6, 3, 3]} /><meshStandardMaterial color={C.light} transparent opacity={0.08} /></mesh>
        <Box p={[xa, -1 + sa / 2, 0]} s={[sa, sa, sa]} c={tempColor(ta, LO, HI)} glow={0.35} />
        <Box p={[xb, -1 + sb / 2, 0]} s={[sb, sb, sb]} c={tempColor(tb, LO, HI)} glow={0.35} />
        <Probe xa={xa} xb={xb} ta={ta} tb={tb} sensor={sensor} playing={playing} />
        <group position={[3.8, -1, 0]}>
          {[ta, tb].map((T, i) => { const h = 0.1 + 2.6 * Math.max(0, (T - LO) / (HI - LO)); return <Box key={i} p={[i * 0.5, h / 2, 0]} s={[0.3, h, 0.3]} c={tempColor(T, LO, HI)} glow={0.4} />; })}
          <Box p={[0.25, 1.4, -0.2]} s={[1, 2.9, 0.05]} c={C.grey} />
        </group>
      </group>)}
      readouts={[
        ["Thermometer C in A", read(ta)],
        ["Thermometer C in B", read(tb)],
        ["Are A and B in equilibrium?", same ? "Yes: C agrees with both (zeroth law)" : "No: heat will flow if they touch"],
        ["Common temperature after contact", `${eq.T.toFixed(2)} °C`],
        ["Heat passing A → B to get there", `${eq.Q.toFixed(2)} kJ`],
      ]}
      controls={<>
        <Slider label="Temperature of A" value={TA} min={-20} max={300} step={1} digits={0} unit=" °C" onChange={(x) => set("TA", x)} />
        <Slider label="Temperature of B" value={TB} min={-20} max={300} step={1} digits={0} unit=" °C" onChange={(x) => set("TB", x)} />
        <Check label="Put A and B in contact (wait for equilibrium)" checked={contact} onChange={(x) => set("contact", x)} />
        <Pick label="Thermometer C" value={sensor} options={[{ id: "rtd", label: "Pt100 resistance thermometer (RTD)" }, { id: "tc", label: "Type-K thermocouple (cold junction 0 °C)" }, { id: "hg", label: "Mercury-in-glass" }]} onChange={(x) => set("sensor", x)} />
        <Pick label="Material of A" value={matA} options={MATS} onChange={(x) => set("matA", x)} />
        <Slider label="Mass of A" value={mA} min={0.1} max={10} step={0.1} digits={1} unit=" kg" onChange={(x) => set("mA", x)} />
        <Pick label="Material of B" value={matB} options={MATS} onChange={(x) => set("matB", x)} />
        <Slider label="Mass of B" value={mB} min={0.1} max={10} step={0.1} digits={1} unit=" kg" onChange={(x) => set("mB", x)} />
      </>}
      note={<>
        <p><b>Zeroth law:</b> if bodies A and B are each in thermal equilibrium with a third body C, they are in thermal equilibrium with each other. It is called &quot;zeroth&quot; because it was recognised after the first and second laws but is more basic: it is what makes <b>temperature</b> a property and lets a thermometer (C) compare bodies that never touch. Tick &quot;contact&quot; and both blocks settle at T = (m<sub>A</sub>c<sub>A</sub>T<sub>A</sub> + m<sub>B</sub>c<sub>B</sub>T<sub>B</sub>)/(m<sub>A</sub>c<sub>A</sub> + m<sub>B</sub>c<sub>B</sub>); then C reads the same in both.</p>
        <p className="mt-2">Thermometers use a property that changes with temperature: a <b>resistance thermometer (RTD)</b>, R = R₀(1 + αT) with α = 0.00385/°C for platinum Pt100; a <b>thermocouple</b>, an EMF of about 41 µV/°C between the hot and cold junctions of two different metals (type K, Seebeck effect); a <b>liquid-in-glass</b> thermometer, by thermal expansion. Linear sensor laws, no heat losses and no phase change: a simplified model (keep water between 0 and 100 °C).</p>
      </>}
    />
  );
}
