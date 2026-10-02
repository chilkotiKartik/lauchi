"use client";
import { useRef } from "react";
import type * as THREE from "three";
import { heatDevice, type Device } from "../sim/mech";
import { Tick } from "../Stage";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { MECH_SPECS } from "../meta/mech.specs";

const NAME: Record<Device, string> = { engine: "Heat engine", fridge: "Refrigerator", pump: "Heat pump" };

/** Vertical flow arrow: thickness ∝ heat rate; dir = +1 points up, −1 down. */
function VArrow({ x, y0, len, dir, w, color }: { x: number; y0: number; len: number; dir: 1 | -1; w: number; color: string }) {
  const t = Math.max(0.05, w);
  return (<group position={[x, y0, 0.3]}>
    <mesh position={[0, (dir * (len - 0.3)) / 2, 0]}><boxGeometry args={[t, len - 0.3, t]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.25} /></mesh>
    <mesh position={[0, dir * (len - 0.15), 0]} rotation={[0, 0, dir > 0 ? 0 : Math.PI]}><coneGeometry args={[t * 1.3 + 0.05, 0.3, 12]} /><meshStandardMaterial color={color} /></mesh>
  </group>);
}
function HArrow({ x0, y, len, dir, w, color }: { x0: number; y: number; len: number; dir: 1 | -1; w: number; color: string }) {
  const t = Math.max(0.05, w);
  return (<group position={[x0, y, 0.3]}>
    <mesh position={[(dir * (len - 0.3)) / 2, 0, 0]}><boxGeometry args={[len - 0.3, t, t]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.25} /></mesh>
    <mesh position={[dir * (len - 0.15), 0, 0]} rotation={[0, 0, dir > 0 ? -Math.PI / 2 : Math.PI / 2]}><coneGeometry args={[t * 1.3 + 0.05, 0.3, 12]} /><meshStandardMaterial color={color} /></mesh>
  </group>);
}

export default function CarnotLab() {
  const [P, set, reset] = useLabParams(MECH_SPECS.carnot);
  const { TH, TC, input, frac, dev } = P;
  const R = heatDevice(dev, TH, TC, input, frac);
  const wheel = useRef<THREE.Group>(null);
  const power = R.valid ? Math.abs(R.W) : 0;
  const tick = (dt: number) => { if (wheel.current) wheel.current.rotation.z += Math.min(dt, 0.05) * (dev === "engine" ? -1 : 1) * Math.min(4, 0.6 + power * 0.01); };
  const top = R.valid ? Math.max(R.QH, R.QC, R.W, 1e-9) : 1;
  const wd = (q: number) => Math.min(0.5, (q / top) * 0.5);
  const hotH = 0.6 + (TH / 1500) * 1.5, coldH = 0.6 + (TC / 1500) * 1.5;
  const eng = dev === "engine";
  const limitName = eng ? "Carnot limit η = 1 − T_C/T_H" : dev === "fridge" ? "Carnot limit COP = T_C/(T_H − T_C)" : "Carnot limit COP = T_H/(T_H − T_C)";
  const actName = eng ? "Actual efficiency η" : "Actual COP";
  const pct = (x: number) => (eng ? `${(x * 100).toFixed(1)} %` : x.toFixed(2));
  return (
    <LabFrame
      label="A hot red reservoir on top, a cold blue reservoir below, and a spinning flywheel between them with arrows whose thickness shows the heat flows and the work"
      camera={[0, 0.4, 9]}
      onReset={reset}
      scene={() => (<group>
        <Tick fn={tick} />
        <mesh position={[0, 2.1, 0]}><boxGeometry args={[3.6, hotH, 1.4]} /><meshStandardMaterial color="#ff5a5f" emissive="#ff5a5f" emissiveIntensity={0.25} /></mesh>
        <mesh position={[0, -2.1, 0]}><boxGeometry args={[3.6, coldH, 1.4]} /><meshStandardMaterial color="#2ba6f5" emissive="#2ba6f5" emissiveIntensity={0.2} /></mesh>
        <group ref={wheel} position={[0, 0, 0]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.85, 0.85, 0.5, 28]} /><meshStandardMaterial color="#7c8d97" metalness={0.6} roughness={0.35} /></mesh>
          <mesh position={[0.5, 0, 0.27]}><boxGeometry args={[0.3, 0.3, 0.06]} /><meshBasicMaterial color="#ffc83d" /></mesh>
          <mesh position={[-0.5, 0, 0.27]}><boxGeometry args={[0.3, 0.3, 0.06]} /><meshBasicMaterial color="#a970ff" /></mesh>
        </group>
        {R.valid && (<>
          <VArrow x={-0.8} y0={eng ? 1.3 : 0.9} len={eng ? 0.8 : 0.8} dir={eng ? -1 : 1} w={wd(R.QH)} color="#ff9a1f" />
          <VArrow x={0.8} y0={eng ? -0.9 : -1.3} len={0.8} dir={eng ? -1 : 1} w={wd(R.QC)} color="#5ec8ff" />
          <HArrow x0={eng ? 0.95 : 3.0} y={0} len={1.9} dir={eng ? 1 : -1} w={wd(R.W)} color="#44c95a" />
        </>)}
      </group>)}
      readouts={R.valid ? [
        [limitName, pct(R.limit)], [actName, pct(R.actual)], ["Heat at T_H  (Q_H)", `${R.QH.toFixed(2)} kW`],
        ["Heat at T_C  (Q_C)", `${R.QC.toFixed(2)} kW`], [eng ? "Work output W" : "Work input W", `${R.W.toFixed(2)} kW`], ["Entropy generated", `${R.dS.toFixed(4)} W/K`],
      ] : [["Problem", "T_H must be hotter than T_C"], ["Set", "raise T_H or lower T_C"], ["T_H", `${TH} K`], ["T_C", `${TC} K`], ["Device", NAME[dev]], ["Entropy generated", "—"]]}
      controls={<>
        <Slider label="Hot reservoir T_H" value={TH} min={300} max={1500} step={5} digits={0} unit=" K" onChange={(x) => set("TH", x)} />
        <Slider label="Cold reservoir T_C" value={TC} min={200} max={400} step={5} digits={0} unit=" K" onChange={(x) => set("TC", x)} />
        <Slider label={eng ? "Heat input Q_H" : "Work input W"} value={input} min={1} max={1000} step={1} digits={0} unit=" kW" onChange={(x) => set("input", x)} />
        <Slider label="Fraction of the Carnot limit" value={frac} min={0.1} max={1} step={0.01} digits={2} onChange={(x) => set("frac", x)} />
        <Pick<Device> label="Device" value={dev} options={(Object.keys(NAME) as Device[]).map((id) => ({ id, label: NAME[id] }))} onChange={(x) => set("dev", x)} />
      </>}
      note={<p>An engine takes heat Q_H from the hot reservoir, turns part of it into work W and rejects Q_C to the cold one (Kelvin–Planck: it cannot convert all of it). A refrigerator or heat pump does the reverse, taking work in to move heat from cold to hot (Clausius). The most any device can do between T_H and T_C is the reversible Carnot limit: η = 1 − T_C/T_H for an engine, COP = T_C/(T_H − T_C) for a refrigerator and COP = T_H/(T_H − T_C) for a heat pump; a real device reaches only a fraction of it and creates entropy S_gen = Q_C/T_C − Q_H/T_H (engine) that is zero only at the limit. Arrow thickness is proportional to the power. Temperatures are in kelvin; a heat pump&apos;s COP cannot fall below 1.</p>}
    />
  );
}
