"use client";
import { useMemo, useRef } from "react";
import type * as THREE from "three";
import { lubricant, viscAt } from "../sim/chemy";
import { Tick } from "../Stage";
import { LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { CHEMY_SPECS } from "../meta/chemy.specs";
import { C, Ball, Box, type V3 } from "../kit";
import { Graph, Rod, type XY } from "../kit2";

const TUBES = [{ x: -3.4, c: C.gold }, { x: -2.4, c: C.orange }, { x: -1.4, c: "#9a5a1c" }];
const TOP = 1.9, BOT = -1.9;
const SPECKS: V3[] = Array.from({ length: 14 }, (_, i) => [-2.4 + 0.17 * Math.sin(i * 2.3), BOT + 0.3 + (i * 0.26) % 3.4, 0.17 * Math.cos(i * 1.7)]);

export default function ViscosityIndexLab() {
  const [P, set, reset] = useLabParams(CHEMY_SPECS.visindex);
  const { U, H, L, T, flash, fire, cloud, pour } = P;
  const o = lubricant(U, H, L, T, flash, fire, cloud, pour);
  const solid = T < pour, cloudy = T < cloud, flashing = T >= flash && T < fire, burning = T >= fire;
  const speeds = [o.nuH, o.nu, o.nuL].map((v, i) => (i === 1 && solid ? 0 : Math.min(3, Math.max(0.03, 80 / v))));
  const balls = useRef<(THREE.Mesh | null)[]>([]), flame = useRef<THREE.Mesh>(null), y = useRef([TOP, TOP, TOP]), t = useRef(0);
  const tick = (dt: number) => {
    const d = Math.min(dt, 0.05); t.current += d;
    for (let i = 0; i < 3; i++) {
      y.current[i] -= speeds[i] * d;
      if (y.current[i] < BOT + 0.15) y.current[i] = TOP;
      balls.current[i]?.position.set(TUBES[i].x, y.current[i], 0);
    }
    if (flame.current) {
      const on = flashing ? (Math.sin(t.current * 3) > 0.6 ? 1 : 0.001) : burning ? 1 + 0.15 * Math.sin(t.current * 13) : 0.001;
      flame.current.scale.set(on, on * (burning ? 1.8 : 0.8), on);
    }
  };
  const curves = useMemo(() => [H, U, L].map((v, i) => ({ pts: Array.from({ length: 67 }, (_, k) => { const tc = -30 + k * 5; return [tc, Math.log10(viscAt(v, tc))] as XY; }), color: TUBES[i].c, w: i === 1 ? 3.2 : 2 })), [H, U, L]);
  const thermo = 0.1 + Math.max(0, Math.min(1, (T + 30) / 330)) * 3.4;
  return (
    <LabFrame
      label="Three glass tubes of oil (high-VI standard gold, test oil orange, low-VI standard brown) with steel balls falling at speeds set by viscosity at the chosen temperature; a thermometer, wax specks below the cloud point, a flash or flame above the flash and fire points, and a graph of log viscosity against temperature"
      camera={[0.2, 1.0, 10]}
      onReset={reset}
      scene={() => (<group rotation={[0.05, -0.15, 0]}>
        <Tick fn={tick} />
        {TUBES.map((tb, i) => (<group key={i}>
          <Rod a={[tb.x, BOT, 0]} b={[tb.x, TOP + 0.2, 0]} r={0.3} color={tb.c} o={i === 1 && cloudy ? 0.85 : 0.45} glow={0.15} />
          <mesh ref={(m) => { balls.current[i] = m; }} position={[tb.x, TOP, 0]}><sphereGeometry args={[0.15, 16, 16]} /><meshStandardMaterial color={C.white} metalness={0.6} roughness={0.25} /></mesh>
        </group>))}
        <Box p={[-2.4, BOT - 0.12, 0]} s={[3.2, 0.2, 1]} c={C.dark} />
        {cloudy && SPECKS.map((p, i) => <Ball key={i} p={p} r={0.05} c={C.white} />)}
        <mesh ref={flame} position={[-2.4, TOP + 0.55, 0]}><sphereGeometry args={[0.28, 16, 16]} /><meshStandardMaterial color={burning ? C.orange : C.blue} emissive={burning ? C.orange : C.blue} emissiveIntensity={1.3} transparent opacity={0.85} /></mesh>
        <Rod a={[-0.55, BOT, 0]} b={[-0.55, BOT + 3.6, 0]} r={0.09} color={C.white} o={0.35} />
        <Rod a={[-0.55, BOT, 0]} b={[-0.55, BOT + thermo, 0]} r={0.055} color={C.red} glow={0.5} />
        <Ball p={[-0.55, BOT, 0]} r={0.16} c={C.red} glow={0.5} />
        <Graph x0={0.5} y0={-1.9} w={4} h={3.8} xr={[-30, 300]} yr={[1, 5]} curves={curves} marker={[T, Math.log10(o.nu)]} markerColor={C.orange} vlines={[{ x: pour, color: C.blue }, { x: cloud, color: C.white }, { x: flash, color: C.gold }, { x: fire, color: C.red }]} />
      </group>)}
      readouts={[
        ["Viscosity index", Number.isFinite(o.VI) ? o.VI.toFixed(1) : "—"],
        ["Rating", o.rating],
        ["Test oil viscosity at T", solid ? "does not flow" : `≈ ${o.nu.toFixed(0)} SUS`],
        ["State at this temperature", o.state],
        ["Fire − flash point", o.gap >= 0 ? `${o.gap.toFixed(0)} °C` : "fire point must be ≥ flash point"],
        ["Usable range (pour → flash)", `${pour.toFixed(0)} to ${flash.toFixed(0)} °C`],
      ]}
      controls={<>
        <Slider label="Test oil U at 100 °F" value={U} min={100} max={1500} step={1} digits={0} unit=" s" onChange={(x) => set("U", x)} />
        <Slider label="High-VI standard H at 100 °F" value={H} min={100} max={1000} step={1} digits={0} unit=" s" onChange={(x) => set("H", x)} />
        <Slider label="Low-VI standard L at 100 °F" value={L} min={300} max={2000} step={1} digits={0} unit=" s" onChange={(x) => set("L", x)} />
        <Slider label="Oil temperature" value={T} min={-30} max={300} step={1} digits={0} unit=" °C" onChange={(x) => set("T", x)} />
        <Slider label="Flash point" value={flash} min={100} max={320} step={1} digits={0} unit=" °C" onChange={(x) => set("flash", x)} />
        <Slider label="Fire point" value={fire} min={100} max={350} step={1} digits={0} unit=" °C" onChange={(x) => set("fire", x)} />
        <Slider label="Cloud point" value={cloud} min={-40} max={30} step={1} digits={0} unit=" °C" onChange={(x) => set("cloud", x)} />
        <Slider label="Pour point" value={pour} min={-50} max={25} step={1} digits={0} unit=" °C" onChange={(x) => set("pour", x)} />
      </>}
      note={<>
        <p><b>Viscosity index</b> measures how little an oil thins on heating. Pick a high-VI standard (Pennsylvanian, VI = 100) and a low-VI standard (Gulf, VI = 0) that have the <i>same</i> viscosity as the test oil at 210 °F; compare all three at 100 °F (Saybolt seconds): <b>VI = (L − U)/(L − H) × 100</b>. A high VI keeps a lubricating film when the engine is hot and still flows when cold.</p>
        <p className="mt-2"><b>Flash point</b>: lowest temperature at which the vapours ignite for a moment when a flame is brought near; <b>fire point</b>: where they keep burning for at least 5 s (usually 5–40 °C higher). A lubricant must have a flash point above the working temperature. <b>Cloud point</b>: wax starts to crystallise and the oil turns hazy; <b>pour point</b>: the oil stops flowing — it must be below the lowest working temperature.</p>
        <p className="mt-2"><b>Try:</b> load the PYQ preset, then raise U towards L and watch the VI fall. Sweep the temperature from −30 to 260 °C and watch the balls, the wax and the flame. Simplified model: Saybolt values interpolated on a log–log viscosity chart.</p>
      </>}
    />
  );
}
