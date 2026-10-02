"use client";
import { useMemo, useRef } from "react";
import type * as THREE from "three";
import { fieldTorque, revolvingFields, singlePhaseIM, SPIM_R, START, type Start } from "../sim/elecy";
import { Tick } from "../Stage";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { ELECY_SPECS } from "../meta/elecy.specs";
import { Box, C } from "../kit";
import { Graph, Rod, type XY } from "../kit2";
import { LiveArrow, type ArrowState } from "./elecy-kit";

const SX = -2.1, RS = 2.0, LEN = 1.55;
const BARS = Array.from({ length: 12 }, (_, i) => (i / 12) * 2 * Math.PI);

function Machine({ start, s, auxIn, playing }: { start: Start; s: number; auxIn: boolean; playing: boolean }) {
  const th = useRef(0), rotor = useRef<THREE.Group>(null);
  const st = START[start], rf = revolvingFields(auxIn ? st.a : 0, st.alpha);
  const af = Math.atan2(rf.fwd.im, rf.fwd.re), ab = Math.atan2(rf.bwd.im, rf.bwd.re);
  const tick = (dt: number) => {
    if (!playing) return;
    const d = Math.min(dt, 0.05) * 1.6;
    th.current += d;
    if (rotor.current) rotor.current.rotation.z += d * (1 - s);
  };
  const getF = (o: ArrowState) => { o.a = af + th.current; o.l = rf.F * LEN; };
  const getB = (o: ArrowState) => { o.a = ab - th.current; o.l = rf.B * LEN; };
  const getR = (o: ArrowState) => {
    const x = rf.F * Math.cos(af + th.current) + rf.B * Math.cos(ab - th.current), y = rf.F * Math.sin(af + th.current) + rf.B * Math.sin(ab - th.current);
    o.a = Math.atan2(y, x); o.l = Math.hypot(x, y) * LEN;
  };
  const auxOn = st.a > 0 && auxIn;
  return (
    <group position={[SX, 0, 0]}>
      <Tick fn={tick} />
      <mesh><torusGeometry args={[RS, 0.28, 12, 48]} /><meshStandardMaterial color={C.grey} roughness={0.5} /></mesh>
      {/* main winding on the horizontal axis, auxiliary on the vertical axis */}
      {[-1, 1].map((k) => <Box key={`m${k}`} p={[k * (RS - 0.38), 0, 0]} s={[0.32, 0.9, 0.9]} c={C.orange} glow={0.35} />)}
      {[-1, 1].map((k) => <Box key={`a${k}`} p={[0, k * (RS - 0.38), 0]} s={[0.9, 0.32, 0.9]} c={auxOn ? C.blue : C.dark} glow={auxOn ? 0.35 : 0} />)}
      <group ref={rotor}>
        <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[1.15, 1.15, 0.9, 32]} /><meshStandardMaterial color="#3c4f58" roughness={0.4} metalness={0.3} /></mesh>
        {BARS.map((a, i) => <Rod key={i} a={[Math.cos(a) * 1.08, Math.sin(a) * 1.08, -0.5]} b={[Math.cos(a) * 1.08, Math.sin(a) * 1.08, 0.5]} r={0.05} color={i === 0 ? C.gold : C.light} glow={i === 0 ? 0.4 : 0} />)}
      </group>
      <group position={[0, 0, 0.6]}>
        <LiveArrow get={getF} color={C.green} r={0.05} />
        <LiveArrow get={getB} color={C.purple} r={0.05} />
        <group position={[0, 0, 0.1]}><LiveArrow get={getR} color={C.red} r={0.07} /></group>
      </group>
    </group>
  );
}

export default function SinglePhaseImLab() {
  const [P, set, reset] = useLabParams(ELECY_SPECS.singlephaseim);
  const { f, poles, s, start } = P;
  const m = singlePhaseIM(f, poles, s, start);
  const curves = useMemo(() => {
    const st = START[start], net: XY[] = [], fw: XY[] = [], bw: XY[] = [];
    for (let i = 0; i <= 160; i++) {
      const sl = 1 - i / 160, a = st.a > 0 && (!st.cutout || sl > 0.25) ? st.a : 0, rf = revolvingFields(a, st.alpha);
      const tf = rf.F ** 2 * fieldTorque(sl, SPIM_R), tb = rf.B ** 2 * fieldTorque(2 - sl, SPIM_R);
      fw.push([1 - sl, tf]); bw.push([1 - sl, -tb]); net.push([1 - sl, tf - tb]);
    }
    return { net, fw, bw };
  }, [start]);
  const auxText = START[start].a === 0 ? "none (main winding only)" : m.auxIn ? `in circuit, α = ${START[start].alpha}°` : "switched out (centrifugal switch)";
  return (
    <LabFrame
      label="A single-phase induction motor: grey stator with orange main coils and blue auxiliary coils, a caged rotor, and three field arrows: the resultant field in red and its forward (green) and backward (purple) rotating halves; beside it a torque–speed graph with the operating point"
      camera={[0, 0.3, 9.4]}
      onReset={reset}
      scene={(playing) => (<group>
        <Machine start={start} s={s} auxIn={m.auxIn} playing={playing} />
        <Graph x0={0.9} y0={-1.7} w={3.8} h={3.4} xr={[0, 1]} yr={[-0.9, 1.1]} grid={4}
          curves={[{ pts: curves.fw, color: C.green, w: 1.8, dashed: true }, { pts: curves.bw, color: C.purple, w: 1.8, dashed: true }, { pts: curves.net, color: C.gold, w: 3.2 }]}
          marker={[1 - s, m.T]} vlines={START[start].cutout ? [{ x: 0.75, color: C.blue }] : []} />
      </group>)}
      readouts={[
        ["Synchronous speed N_s = 120f/P", `${m.Ns.toFixed(0)} rpm`],
        ["Rotor speed N = N_s(1 − s)", `${m.N.toFixed(0)} rpm`],
        ["Auxiliary winding", auxText],
        ["Forward : backward field", `${m.F.toFixed(2)} : ${m.B.toFixed(2)}`],
        ["Starting torque (× rotating field)", `${(m.Tstart * 100).toFixed(0)} %`],
        ["Net torque at this slip", `${m.T.toFixed(3)} p.u.`],
      ]}
      controls={<>
        <Slider label="Supply frequency f" value={f} min={25} max={60} step={0.5} digits={1} unit=" Hz" onChange={(x) => set("f", x)} />
        <Slider label="Poles P" value={poles} min={2} max={8} step={2} digits={0} onChange={(x) => set("poles", x)} />
        <Slider label="Slip s (1 = standstill)" value={s} min={0} max={1} step={0.01} digits={2} onChange={(x) => set("s", x)} />
        <Pick label="Starting method" value={start} options={[{ id: "none", label: "None: main winding only" }, { id: "split", label: "Split phase (resistive auxiliary)" }, { id: "capstart", label: "Capacitor start" }, { id: "caprun", label: "Capacitor start, capacitor run" }]} onChange={(x) => set("start", x)} />
      </>}
      note={<>
        <p><b>Why it will not start by itself:</b> one winding (orange) carrying AC makes a field that only <i>pulsates</i> along its own axis (red arrow, growing and shrinking). <b>Double-revolving-field theory:</b> that pulsating field equals two fields of half the size turning in opposite directions at synchronous speed (green forward, purple backward). At standstill both produce equal and opposite torques, so the net starting torque is zero: the motor hums. Once spinning, the field turning the same way as the rotor wins (gold net curve), so a pushed motor keeps running in whichever direction it was pushed.</p>
        <p><b>Starting methods:</b> an auxiliary winding (blue) 90° away in space carries a current shifted in time by α. <b>Split phase:</b> a high-R auxiliary gives α ≈ 25°; <b>capacitor start:</b> a series capacitor gives α ≈ 80°; the forward field grows and the backward one shrinks, and the starting torque is a·sin α of a true rotating field. A centrifugal switch opens the auxiliary near 75 % speed (dashed blue line); <b>capacitor run</b> keeps it in. Simplified model: equal winding strengths, rotor R₂/X₂ = 0.2, torque in per-unit of one full rotating field.</p>
        <p><b>Try:</b> pick “None” at s = 1 (zero torque), then capacitor start; drag the slip down through 0.25 to watch the auxiliary drop out.</p>
      </>}
    />
  );
}
