"use client";
import { useMemo, useRef } from "react";
import type * as THREE from "three";
import { eng, motionalEmf } from "../sim/elecy";
import { Tick } from "../Stage";
import { LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { ELECY_SPECS } from "../meta/elecy.specs";
import { Box, C, type V3 } from "../kit";
import { Arrow, Flow, Rod } from "../kit2";
import { Resistor } from "./elecy-kit";

const D2R = Math.PI / 180, HALF = 2.2;

function Mover({ th, lv, v, I, F, playing }: { th: number; lv: number; v: number; I: number; F: number; playing: boolean }) {
  const bar = useRef<THREE.Group>(null), tri = useRef<THREE.Group>(null), s = useRef(0);
  const sn = Math.sin(th * D2R), cs = Math.cos(th * D2R);
  const tick = (dt: number) => {
    if (playing) s.current = ((s.current + Math.min(dt, 0.05) * (0.25 + v * 0.09) + HALF) % (2 * HALF)) - HALF;
    bar.current?.position.set(s.current, 0, 0);
    tri.current?.position.set(s.current * sn, -s.current * cs, 0);
  };
  const iLen = Math.min(1.3, 0.25 + I * 0.25), fLen = Math.min(1.3, 0.25 + F * 0.5);
  const barPath = useMemo<V3[]>(() => [[0, 0.09, lv / 2], [0, 0.09, -lv / 2]], [lv]);
  return (<>
    <Tick fn={tick} />
    <group rotation={[0, 0, th * D2R - Math.PI / 2]}>
      <group ref={bar}>
        <Rod a={[0, 0, lv / 2 + 0.15]} b={[0, 0, -lv / 2 - 0.15]} r={0.07} color={C.orange} glow={0.25} />
        {I > 1e-6 ? <Flow path={barPath} n={6} speed={Math.min(2, 0.2 + I * 0.3)} color={C.gold} r={0.06} /> : null}
      </group>
    </group>
    {/* Fleming's right-hand rule triad, riding with the conductor */}
    <group ref={tri}>
      <Arrow from={[0, 0.25, 0]} to={[sn * 1.1, 0.25 - cs * 1.1, 0]} color={C.green} r={0.035} head={0.18} />
      <Arrow from={[0, 1.15, 0.45]} to={[0, 0.35, 0.45]} color={C.purple} r={0.035} head={0.18} />
      {I > 1e-6 ? <Arrow from={[0.15, 0.25, 0]} to={[0.15, 0.25, -iLen]} color={C.gold} r={0.035} head={0.18} /> : null}
      {F > 1e-6 ? <Arrow from={[0, -0.1, 0]} to={[-fLen, -0.1, 0]} color={C.red} r={0.045} head={0.2} /> : null}
    </group>
  </>);
}

export default function FaradayLenzLab() {
  const [P, set, reset] = useLabParams(ELECY_SPECS.faradaylenz);
  const { B, l, v, th, R } = P;
  const m = motionalEmf(B, l, v, th, R);
  const lv = 0.6 + l * 1.6;
  const field = useMemo(() => {
    const out: V3[] = [];
    const n = 2 + Math.round(B * 2);
    for (let i = -n; i <= n; i++) for (const z of [-1.1, 0, 1.1]) out.push([(i * 2.4) / n, 0, z]);
    return out;
  }, [B]);
  return (
    <LabFrame
      label="A conductor slides along tilted rails between a red north pole above and a blue south pole below; arrows ride with it showing motion in green, field in purple, induced current in gold and the opposing force in red, while a resistor closes the circuit and glows with the power"
      camera={[2.2, 2.2, 7.8]}
      onReset={reset}
      scene={(playing) => (<group position={[0, -0.1, 0]}>
        <Box p={[0, 2.4, 0]} s={[5.6, 0.45, 3]} c={C.red} glow={0.15 + B * 0.1} />
        <Box p={[0, -2.4, 0]} s={[5.6, 0.45, 3]} c={C.blue} glow={0.15 + B * 0.1} />
        {field.map((p, i) => <Rod key={i} a={[p[0], 2.1, p[2]]} b={[p[0], -2.1, p[2]]} r={0.012} color={C.purple} o={0.45} />)}
        <group rotation={[0, 0, th * D2R - Math.PI / 2]}>
          <Rod a={[-HALF - 0.4, 0, lv / 2]} b={[HALF + 0.3, 0, lv / 2]} r={0.045} color={C.light} />
          <Rod a={[-HALF - 0.4, 0, -lv / 2]} b={[HALF + 0.3, 0, -lv / 2]} r={0.045} color={C.light} />
          <Resistor a={[-HALF - 0.4, 0, lv / 2]} b={[-HALF - 0.4, 0, -lv / 2]} r={0.1} glow={Math.min(1, m.Pe / 20)} />
        </group>
        <Mover th={th} lv={lv} v={v} I={m.I} F={m.F} playing={playing} />
      </group>)}
      readouts={[
        ["Induced emf e = Blv sin θ", eng(m.e, "V")],
        ["Current I = e/R", eng(m.I, "A")],
        ["Opposing force F = BIl sin θ", eng(m.F, "N")],
        ["Electrical power e·I", eng(m.Pe, "W")],
        ["Mechanical power F·v", eng(m.Pm, "W")],
      ]}
      controls={<>
        <Slider label="Flux density B" value={B} min={0.05} max={2} step={0.01} digits={2} unit=" T" onChange={(x) => set("B", x)} />
        <Slider label="Conductor length l" value={l} min={0.1} max={1} step={0.01} digits={2} unit=" m" onChange={(x) => set("l", x)} />
        <Slider label="Speed v" value={v} min={0} max={20} step={0.1} digits={1} unit=" m/s" onChange={(x) => set("v", x)} />
        <Slider label="Angle θ between motion and field" value={th} min={0} max={90} step={1} digits={0} unit="°" onChange={(x) => set("th", x)} />
        <Slider label="Circuit resistance R" value={R} min={0.1} max={100} step={0.1} digits={1} unit=" Ω" onChange={(x) => set("R", x)} />
      </>}
      note={<>
        <p><b>Faraday’s laws:</b> an emf is induced whenever the flux linked with a circuit changes, and its size equals the rate of change, e = N dΦ/dt. Here the moving rod sweeps out area, so the flux through the loop changes at B·l·v sin θ per second and the <b>dynamically induced emf</b> is e = Blv sin θ (θ = angle between motion and field). Slide parallel to the field (θ = 0) and nothing is cut. A transformer’s emf, where the coil is still and the flux itself alternates, is <b>statically induced</b>.</p>
        <p><b>Lenz’s law:</b> the induced current (gold) flows in the direction that opposes its cause. Its force on the rod, F = BIl sin θ (red), points against the motion, so you must push: the mechanical power F·v equals the electrical power e·I delivered to R (energy is conserved). <b>Fleming’s right-hand rule</b> (generators): thumb = motion (green), first finger = field (purple, N to S), second finger = current. The left-hand rule gives the force on a current in a field (motors).</p>
        <p><b>Try:</b> raise R: the current and the drag fall although the emf stays the same; set θ = 0 and everything vanishes.</p>
      </>}
    />
  );
}
