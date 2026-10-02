"use client";
import { useMemo, useRef } from "react";
import type * as THREE from "three";
import { manometer } from "../sim/mechy";
import { Tick } from "../Stage";
import { LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { MECHY_SPECS } from "../meta/mechy.specs";
import { Box, type V3 } from "../kit";
import { Arrow, C, Dial, Flow, Rod, mix } from "../kit2";

const K = 0.012, XL = -0.9, XR = 0.7, Y0 = -0.6, BOT = -2.7, R = 0.13;

/** Liquid colour from specific gravity: oil (gold) → water (blue) → mercury (silver). */
const liquid = (s: number) => (s >= 6 ? "#cfd8de" : s >= 1 ? mix(C.blue, "#cfd8de", (s - 1) / 5) : mix(C.gold, C.blue, Math.max(0, (s - 0.7) / 0.3)));

/** The Bourdon tube: a C-shaped tube that uncurls a little as pressure rises (drawn exaggerated). */
function Bourdon({ f }: { f: number }) {
  const arc = Math.PI * 1.5 - 0.5 * Math.max(-0.2, Math.min(1, f));
  return (<group rotation={[0, 0, -Math.PI * 0.25]}>
    <mesh><torusGeometry args={[0.55, 0.07, 10, 40, arc]} /><meshStandardMaterial color={C.gold} metalness={0.6} roughness={0.3} emissive={C.gold} emissiveIntensity={0.15} /></mesh>
  </group>);
}

/** Menisci wobble slightly so the liquid looks alive (purely visual). */
function Column({ x, y0, y1, color }: { x: number; y0: number; y1: number; color: string }) {
  const m = useRef<THREE.Mesh>(null), t = useRef(x);
  return (<>
    <Rod a={[x, y0, 0]} b={[x, y1, 0]} r={R * 0.92} color={color} glow={0.15} />
    <mesh ref={m} position={[x, y1, 0]}>
      <Tick fn={(dt) => { t.current += Math.min(dt, 0.05); if (m.current) m.current.position.y = y1 + 0.015 * Math.sin(t.current * 3); }} />
      <sphereGeometry args={[R * 0.92, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.15} />
    </mesh>
  </>);
}

export default function ManometerLab() {
  const [P, set, reset] = useLabParams(MECHY_SPECS.manometer);
  const { h, s2, s1, y, patm } = P;
  const m = manometer(h, s2, s1, y, patm);
  const hd = h * K, yL = Y0 - hd / 2, yR = Y0 + hd / 2, yp = yL + Math.max(0.35, y * K);
  const pipeFluid = s1 <= 0.01 ? "#ffd9a8" : liquid(s1);
  const path = useMemo<V3[]>(() => [[-5.4, yp, 0], [XL + 0.6, yp, 0]], [yp]);
  const f = (m.bar + 1) / 6;
  return (
    <LabFrame
      label="A pipe carrying fluid with a U-tube manometer tapped into it: the heavy manometric liquid stands higher in the open limb by the deflection h, and a Bourdon-tube dial gauge on the same pipe reads the gauge pressure"
      camera={[-0.9, 0.3, 10]}
      onReset={reset}
      scene={() => (<group>
        <Rod a={[-5.6, yp, 0]} b={[XL + 0.45, yp, 0]} r={0.42} color={pipeFluid} o={0.35} />
        <Rod a={[-5.6, yp, 0]} b={[XL + 0.45, yp, 0]} r={0.45} color="#e8f1f5" o={0.12} />
        <Flow path={path} n={16} speed={0.35} color={s1 <= 0.01 ? C.orange : C.blue} r={0.06} />
        <Box p={[XL + 0.5, yp, 0]} s={[0.12, 1, 1]} c={C.grey} />
        <Rod a={[XL, BOT, 0]} b={[XL, yp, 0]} r={R} color="#e8f1f5" o={0.18} />
        <Rod a={[XR, BOT, 0]} b={[XR, 2.6, 0]} r={R} color="#e8f1f5" o={0.18} />
        <Rod a={[XL, BOT, 0]} b={[XR, BOT, 0]} r={R} color="#e8f1f5" o={0.18} />
        <Column x={XL} y0={BOT} y1={yL} color={liquid(s2)} />
        <Column x={XR} y0={BOT} y1={yR} color={liquid(s2)} />
        <Rod a={[XL - 0.065, BOT, 0]} b={[XR + 0.065, BOT, 0]} r={R * 0.92} color={liquid(s2)} />
        {s1 > 0.01 && <Rod a={[XL, yL, 0]} b={[XL, yp, 0]} r={R * 0.9} color={liquid(s1)} o={0.75} />}
        <Box p={[(XL + XR) / 2 + 0.75, yL, 0]} s={[2.3, 0.025, 0.02]} c={C.green} />
        <Box p={[XR + 0.35, yR, 0]} s={[0.4, 0.025, 0.02]} c={C.green} />
        {hd > 0.12 && <Arrow from={[XR + 0.45, yL, 0]} to={[XR + 0.45, yR, 0]} color={C.green} r={0.03} head={0.14} />}
        <Arrow from={[XR, 3.2, 0]} to={[XR, 2.65, 0]} color={C.light} r={0.03} head={0.15} />
        <group position={[-3.2, yp + 1.65, 0]}>
          <Rod a={[0, -1.25, 0]} b={[0, -0.75, 0]} r={0.07} color={C.grey} />
          <Dial p={[0, 0, 0]} f={f} color={m.vacuum ? C.blue : C.red} size={0.7} />
          <group position={[1.6, -0.1, 0]}><Bourdon f={f} /></group>
        </group>
      </group>)}
      readouts={[
        ["Gauge pressure in the pipe", `${(m.pg / 1000).toFixed(2)} kPa${m.vacuum ? " (vacuum)" : ""}`],
        ["Absolute pressure", `${(m.pabs / 1000).toFixed(2)} kPa = ${(m.pabs / 1e6).toFixed(4)} MPa`],
        ["Pressure head", `${m.headW.toFixed(3)} m of water`],
        ["Bourdon gauge reads", `${m.bar.toFixed(3)} bar`],
        ["Manometer equation", `p = ρg(${s2.toFixed(2)}·${(h / 100).toFixed(2)} − ${s1.toFixed(2)}·${(y / 100).toFixed(2)})`],
      ]}
      controls={<>
        <Slider label="Manometer deflection h" value={h} min={0} max={300} step={0.5} digits={1} unit=" cm" onChange={(x) => set("h", x)} />
        <Slider label="Manometric liquid SG (13.6 = mercury)" value={s2} min={0.8} max={13.6} step={0.05} digits={2} onChange={(x) => set("s2", x)} />
        <Slider label="Pipe fluid SG (0 = gas)" value={s1} min={0} max={1.5} step={0.01} digits={2} onChange={(x) => set("s1", x)} />
        <Slider label="Pipe centre above left meniscus y" value={y} min={0} max={200} step={0.5} digits={1} unit=" cm" onChange={(x) => set("y", x)} />
        <Slider label="Atmospheric pressure" value={patm} min={90} max={102} step={0.1} digits={1} unit=" kPa" onChange={(x) => set("patm", x)} />
      </>}
      note={<>
        <p>Pressure in a still liquid grows with depth, <b>p = ρgh</b>, and is the same at all points on one horizontal level of the same continuous liquid. In a <b>U-tube manometer</b> equate the pressures at the level of the left meniscus: p<sub>A</sub> + ρ₁g·y = ρ₂g·h, so the gauge pressure is <b>p<sub>A</sub> = ρ₂gh − ρ₁gy</b>. A dense manometric liquid (mercury, SG 13.6) keeps the tube short; for a gas in the pipe ρ₁gy is negligible. <b>Absolute = gauge + atmospheric</b>; a negative gauge pressure is a vacuum.</p>
        <p className="mt-2">The <b>Bourdon gauge</b> uses an oval C-shaped tube: pressure inside tries to straighten it, and its free end moves a needle through a lever and gear (motion exaggerated here). It reads gauge pressure directly. Try the PYQ: 250 cm of mercury on a gas tank gives 333.5 kPa gauge, 0.4345 MPa absolute with p<sub>atm</sub> = 101 kPa. The dial spans −1 to 5 bar.</p>
      </>}
    />
  );
}
