"use client";
import { useRef } from "react";
import type * as THREE from "three";
import { hydraulicLift } from "../sim/mechy";
import { Tick } from "../Stage";
import { LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { MECHY_SPECS } from "../meta/mechy.specs";
import { Box } from "../kit";
import { Arrow, C, Rod } from "../kit2";

const XS = -2.6, XB = 1.4, BASE = -1.9, TOP = 1.3, STROKE = 0.8;

/** Small plunger pumps down and up; the big ram rises by stroke·A₁/A₂ on every down-stroke, then is let down again. */
function Pistons({ rs, rb, playing }: { rs: number; rb: number; playing: boolean }) {
  const sm = useRef<THREE.Group>(null), big = useRef<THREE.Group>(null), oilS = useRef<THREE.Mesh>(null), oilB = useRef<THREE.Mesh>(null), t = useRef(0.25);
  const tick = (dt: number) => {
    if (playing) t.current += Math.min(dt, 0.05) * 0.7;
    const cyc = Math.floor(t.current), ph = t.current - cyc, down = ph < 0.5 ? ph * 2 : 1;
    const ys = TOP - STROKE * (ph < 0.5 ? ph * 2 : 2 - ph * 2);
    const per = (STROKE * rs * rs) / (rb * rb);
    const yb = 0.1 + ((((cyc % 8) + down) * per) % 1.4);
    sm.current?.position.set(XS, ys, 0);
    big.current?.position.set(XB, yb, 0);
    if (oilS.current) { const h = ys - BASE; oilS.current.position.y = BASE + h / 2; oilS.current.scale.y = h; }
    if (oilB.current) { const h = yb - BASE; oilB.current.position.y = BASE + h / 2; oilB.current.scale.y = h; }
  };
  return (<>
    <Tick fn={tick} />
    <mesh ref={oilS} position={[XS, 0, 0]}><cylinderGeometry args={[rs * 0.97, rs * 0.97, 1, 24]} /><meshStandardMaterial color={C.gold} emissive={C.gold} emissiveIntensity={0.2} transparent opacity={0.75} /></mesh>
    <mesh ref={oilB} position={[XB, 0, 0]}><cylinderGeometry args={[rb * 0.98, rb * 0.98, 1, 32]} /><meshStandardMaterial color={C.gold} emissive={C.gold} emissiveIntensity={0.2} transparent opacity={0.75} /></mesh>
    <group ref={sm}>
      <mesh position={[0, 0.08, 0]}><cylinderGeometry args={[rs * 0.97, rs * 0.97, 0.16, 24]} /><meshStandardMaterial color={C.light} metalness={0.5} roughness={0.3} /></mesh>
      <Rod a={[0, 0.16, 0]} b={[0, 1.1, 0]} r={0.05} color={C.light} />
      <Arrow from={[0, 2.0, 0]} to={[0, 1.15, 0]} color={C.orange} r={0.05} />
    </group>
    <group ref={big}>
      <mesh position={[0, 0.1, 0]}><cylinderGeometry args={[rb * 0.98, rb * 0.98, 0.2, 32]} /><meshStandardMaterial color={C.light} metalness={0.5} roughness={0.3} /></mesh>
      <Rod a={[0, 0.2, 0]} b={[0, 1.2, 0]} r={0.12} color={C.light} />
      <Box p={[0, 1.25, 0]} s={[2.4, 0.1, 1.3]} c={C.grey} />
      <Box p={[0, 1.6, 0]} s={[1.9, 0.45, 0.95]} c={C.red} glow={0.2} />
      <Box p={[0.05, 1.98, 0]} s={[1.05, 0.35, 0.85]} c={C.blue} glow={0.25} />
      {[-0.6, 0.6].map((x) => [-0.48, 0.48].map((z) => <mesh key={`${x}${z}`} position={[x, 1.38, z]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.18, 0.18, 0.1, 16]} /><meshStandardMaterial color="#1b262c" /></mesh>))}
    </group>
  </>);
}

export default function HydroLiftLab() {
  const [P, set, reset] = useLabParams(MECHY_SPECS.hydrolift);
  const { W, A1, A2, lift, eta } = P;
  const r = hydraulicLift(W, A1, A2, lift, eta);
  const Amax = Math.max(A1, A2), rs = Math.max(0.12, 1.2 * Math.sqrt(A1 / Amax)), rb = Math.max(0.12, 1.2 * Math.sqrt(A2 / Amax));
  return (
    <LabFrame
      label="A hydraulic lift: a narrow plunger on the left pumps oil into a wide ram on the right that raises a car; pressure arrows push up equally on every part of the ram"
      camera={[0, 1.2, 10]}
      onReset={reset}
      scene={(playing) => (<group rotation={[0.12, -0.25, 0]}>
        <Rod a={[XS, BASE - 0.1, 0]} b={[XS, TOP + 0.3, 0]} r={rs + 0.05} color="#e8f1f5" o={0.15} />
        <Rod a={[XB, BASE - 0.1, 0]} b={[XB, TOP + 0.6, 0]} r={rb + 0.05} color="#e8f1f5" o={0.15} />
        <Rod a={[XS, BASE - 0.25, 0]} b={[XB, BASE - 0.25, 0]} r={0.2} color={C.gold} o={0.8} />
        <Box p={[(XS + XB) / 2, BASE - 0.55, 0]} s={[7, 0.12, 2.6]} c={C.dark} />
        <Pistons rs={rs} rb={rb} playing={playing} />
        {[-0.5, 0, 0.5].map((dx) => <Arrow key={dx} from={[XB + dx * rb, BASE + 0.05, 0]} to={[XB + dx * rb, BASE + 0.6, 0]} color={C.purple} r={0.035} head={0.16} />)}
        <Arrow from={[XS, BASE + 0.6, 0]} to={[XS, BASE + 0.05, 0]} color={C.purple} r={0.035} head={0.16} />
        <Arrow from={[(XS + XB) / 2 - 0.4, BASE - 0.25, 0.35]} to={[(XS + XB) / 2 + 0.4, BASE - 0.25, 0.35]} color={C.green} r={0.03} head={0.14} />
      </group>)}
      readouts={[
        ["Oil pressure p = W/A₂", `${(r.p / 1000).toFixed(2)} kPa`],
        ["Effort on plunger F₁", `${r.F1.toFixed(1)} N`],
        ["Mechanical advantage W/F₁", `${r.MA.toFixed(2)} (area ratio ${r.ratio.toFixed(2)})`],
        ["Plunger travel for the lift", `${r.travel.toFixed(3)} m`],
        ["Work in / work out", `${(r.workIn / 1000).toFixed(3)} / ${(r.workOut / 1000).toFixed(3)} kJ`],
      ]}
      controls={<>
        <Slider label="Load on the ram W" value={W} min={0.5} max={50} step={0.1} digits={1} unit=" kN" onChange={(x) => set("W", x)} />
        <Slider label="Plunger area A₁" value={A1} min={0.005} max={1} step={0.005} digits={3} unit=" m²" onChange={(x) => set("A1", x)} />
        <Slider label="Ram area A₂" value={A2} min={0.05} max={5} step={0.01} digits={2} unit=" m²" onChange={(x) => set("A2", x)} />
        <Slider label="Height to lift the load" value={lift} min={1} max={100} step={1} digits={0} unit=" cm" onChange={(x) => set("lift", x)} />
        <Slider label="Efficiency (friction losses)" value={eta} min={50} max={100} step={1} digits={0} unit=" %" onChange={(x) => set("eta", x)} />
      </>}
      note={<>
        <p><b>Pascal&apos;s law:</b> pressure applied to an enclosed fluid at rest is transmitted equally, undiminished, in all directions (purple arrows). So the small force F₁ on the plunger makes the same pressure p = F₁/A₁ that pushes up on the big ram: <b>F₁/A₁ = W/A₂</b>, and the force is multiplied by the area ratio A₂/A₁.</p>
        <p className="mt-2">Nothing is free: oil is incompressible, so the volume pushed out by the plunger, A₁·s₁, equals the volume entering the ram, A₂·s₂. The plunger travels A₂/A₁ times further than the load rises, and work in = work out when friction is ignored. With losses the effort rises by 1/η. A non-return valve lets the plunger refill on its up-stroke, so the car rises in steps. Try the PYQ: a 1.2 × 10⁴ N car on a 0.90 m² ram with a 0.20 m² plunger needs only 2667 N.</p>
      </>}
    />
  );
}
