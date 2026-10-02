"use client";
import { useRef } from "react";
import type * as THREE from "three";
import { ladder } from "../sim/mechx";
import { Tick } from "../Stage";
import { LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { MECHX_SPECS } from "../meta/mechx.specs";
import { C, Box } from "../kit";
import { Arrow, Rod } from "../kit2";

const LEN = 5;
function Ladder({ th, k, slips, man }: { th: number; k: number; slips: boolean; man: boolean }) {
  const g = useRef<THREE.Group>(null), t = useRef(0);
  const tick = (dt: number) => {
    t.current = (t.current + Math.min(dt, 0.05)) % 3.5;
    const a0 = (th * Math.PI) / 180;
    // if it slips, the ladder slides down to the floor, rests a moment, then the clip restarts
    const fall = slips ? Math.min(1, Math.max(0, (t.current - 0.6) / 1.4)) : 0;
    const a = a0 * (1 - fall * fall) + 0.08 * fall * fall;
    if (g.current) { g.current.rotation.z = a; g.current.position.x = -LEN * Math.cos(a); }
  };
  return (<group ref={g}>
    <Tick fn={tick} />
    <Rod a={[0, 0, -0.4]} b={[LEN, 0, -0.4]} r={0.06} color={C.orange} />
    <Rod a={[0, 0, 0.4]} b={[LEN, 0, 0.4]} r={0.06} color={C.orange} />
    {Array.from({ length: 11 }, (_, i) => <Rod key={i} a={[0.3 + i * 0.44, 0, -0.4]} b={[0.3 + i * 0.44, 0, 0.4]} r={0.03} color={C.gold} />)}
    {man && <group position={[k * LEN, 0.55, 0]}>
      <mesh><capsuleGeometry args={[0.22, 0.6, 6, 12]} /><meshStandardMaterial color={C.purple} /></mesh>
      <mesh position={[0, 0.6, 0]}><sphereGeometry args={[0.2, 16, 16]} /><meshStandardMaterial color="#f2c29b" /></mesh>
    </group>}
  </group>);
}

export default function LadderLab() {
  const [P, set, reset] = useLabParams(MECHX_SPECS.ladder);
  const { th, k, muf, muw, W, Wm, L } = P;
  const r = ladder(th, L, W, Wm, k, muf, muw);
  const a = (th * Math.PI) / 180;
  const top: [number, number, number] = [0, LEN * Math.sin(a), 0], foot: [number, number, number] = [-LEN * Math.cos(a), 0, 0];
  const sc = 1.6 / Math.max(r.Nf, 1);
  return (
    <LabFrame
      label="A ladder leaning on a wall with a person on it; arrows show the wall reaction, the floor reaction and the friction needed; if friction cannot hold it, the ladder slides down"
      camera={[-2.2, 2.6, 9]}
      onReset={reset}
      scene={() => (<group position={[2, -1.8, 0]}>
        <Box p={[0.15, 2.6, 0]} s={[0.3, 5.6, 3]} c={C.light} o={0.8} />
        <Box p={[-3, -0.08, 0]} s={[7, 0.16, 3]} c="#6b4f2a" />
        <group position={[0, 0, 0]}><Ladder th={th} k={k} slips={r.slips} man={Wm > 0} /></group>
        <Arrow from={[top[0] - 0.05, top[1], 0.9]} to={[top[0] - 0.05 - Math.max(0.3, r.Nw * sc), top[1], 0.9]} color={C.blue} />
        <Arrow from={[foot[0], foot[1], 0.9]} to={[foot[0], foot[1] + Math.max(0.4, r.Nf * sc), 0.9]} color={C.green} />
        <Arrow from={[foot[0] - Math.max(0.3, r.Ff * sc), 0.1, 0.9]} to={[foot[0], 0.1, 0.9]} color={r.slips ? C.red : C.gold} />
      </group>)}
      readouts={[
        ["Wall reaction N_w", `${r.Nw.toFixed(1)} N`],
        ["Friction the floor must give", `${r.Ff.toFixed(1)} N`],
        ["Friction the floor can give μN_f", `${r.avail.toFixed(1)} N`],
        ["Safety factor", Number.isFinite(r.safety) ? r.safety.toFixed(2) : "∞"],
        ["Verdict", r.slips ? "SLIPS" : "Holds"],
        ["Minimum safe angle", `${r.thMin.toFixed(2)}°`],
      ]}
      controls={<>
        <Slider label="Ladder angle θ" value={th} min={10} max={89} step={0.5} digits={1} unit="°" onChange={(x) => set("th", x)} />
        <Slider label="Climber position (fraction up)" value={k} min={0} max={1} step={0.01} digits={2} onChange={(x) => set("k", x)} />
        <Slider label="Floor friction μ_f" value={muf} min={0.05} max={0.8} step={0.01} digits={2} onChange={(x) => set("muf", x)} />
        <Slider label="Wall friction μ_w" value={muw} min={0} max={0.6} step={0.01} digits={2} onChange={(x) => set("muw", x)} />
        <Slider label="Ladder weight W" value={W} min={50} max={500} step={5} digits={0} unit=" N" onChange={(x) => set("W", x)} />
        <Slider label="Climber weight" value={Wm} min={0} max={1200} step={10} digits={0} unit=" N" onChange={(x) => set("Wm", x)} />
        <Slider label="Ladder length L" value={L} min={2} max={10} step={0.5} digits={1} unit=" m" onChange={(x) => set("L", x)} />
      </>}
      note={<p>Free body diagram: weight W at the middle, the climber’s weight at kL, the wall’s normal reaction N<sub>w</sub> and friction μ<sub>w</sub>N<sub>w</sub> (acting up, since the top tends to slide down), and at the floor N<sub>f</sub> and friction F<sub>f</sub> (acting towards the wall). Horizontal balance: F<sub>f</sub> = N<sub>w</sub>. Vertical: N<sub>f</sub> + μ<sub>w</sub>N<sub>w</sub> = W + W<sub>m</sub>. Moments about the foot: N<sub>w</sub>L sin θ + μ<sub>w</sub>N<sub>w</sub>L cos θ = (W/2 + kW<sub>m</sub>)L cos θ. The ladder holds if F<sub>f</sub> ≤ μ<sub>f</sub>N<sub>f</sub>. For a smooth wall with no climber this gives tan θ<sub>min</sub> = 1/(2μ<sub>f</sub>). The answer does not depend on the length L. Climbing higher always makes it worse.</p>}
    />
  );
}
