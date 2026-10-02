"use client";
import { Line } from "@react-three/drei";
import { useMemo, useRef } from "react";
import type * as THREE from "three";
import { eng, waveAt, waveStats, type Wave } from "../sim/elecy";
import { Tick } from "../Stage";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { ELECY_SPECS } from "../meta/elecy.specs";
import { C, type V3 } from "../kit";
import { Graph, type XY } from "../kit2";
import { LiveArrow, type ArrowState } from "./elecy-kit";

const GX = -0.9, GY = -1.6, GW = 5.6, GH = 3.2, YC = GY + GH / 2, RV = GH / 2 / 1.15, PX = -2.6;
const D2R = Math.PI / 180;

function Moving({ wave, amp, rate, th, playing }: { wave: Wave; amp: number; rate: number; th: number; playing: boolean }) {
  const ang = useRef(th), dot = useRef<THREE.Mesh>(null), tip = useRef<THREE.Mesh>(null), bar = useRef<THREE.Mesh>(null);
  const sine = wave === "sine";
  const tick = (dt: number) => {
    ang.current = playing ? (ang.current + Math.min(dt, 0.05) * rate) % 720 : th;
    const a = ang.current, v = (waveAt(wave, 1, a * D2R) * amp) / 1.15;               // −1…1 of the half-height
    const y = YC + v * (GH / 2), x = GX + (a / 720) * GW;
    dot.current?.position.set(x, y, 0.05);
    const ty = YC + Math.sin(a * D2R) * RV * amp, tz = Math.cos(a * D2R) * RV * amp;
    tip.current?.position.set(PX, ty, tz);
    if (bar.current) { bar.current.position.set((PX + x) / 2, y, 0.02); bar.current.scale.set(Math.max(0.01, x - PX), 1, 1); bar.current.visible = sine; }
  };
  const get = (o: ArrowState) => { o.a = ang.current * D2R; o.l = sine ? RV * amp : 0; };
  return (<group>
    <Tick fn={tick} />
    <mesh ref={dot}><sphereGeometry args={[0.12, 16, 16]} /><meshStandardMaterial color={C.red} emissive={C.red} emissiveIntensity={0.7} /></mesh>
    <mesh ref={tip} visible={sine}><sphereGeometry args={[0.1, 14, 14]} /><meshStandardMaterial color={C.gold} emissive={C.gold} emissiveIntensity={0.7} /></mesh>
    <mesh ref={bar}><boxGeometry args={[1, 0.025, 0.025]} /><meshBasicMaterial color={C.light} transparent opacity={0.6} /></mesh>
    <group position={[PX, YC, 0]} rotation={[0, -Math.PI / 2, 0]}><LiveArrow get={get} color={C.gold} r={0.045} /></group>
  </group>);
}

export default function AcWaveformsLab() {
  const [P, set, reset] = useLabParams(ELECY_SPECS.acwaveforms);
  const { Vm, f, wave, th } = P;
  const s = waveStats(wave, Vm, f);
  const sine = wave === "sine", amp = 0.35 + (0.65 * Vm) / 400;
  const curves = useMemo(() => {
    const pts: XY[] = [], sq: XY[] = [];
    for (let i = 0; i <= 360; i++) { const a = i * 2, v = waveAt(wave, 1, a * D2R); pts.push([a, v * amp]); sq.push([a, v * v * amp]); }
    const hel: V3[] = [];
    for (let i = 0; i <= 240; i++) { const a = i * 3; hel.push([GX + (a / 720) * GW, YC + Math.sin(a * D2R) * RV * amp, Math.cos(a * D2R) * RV * amp]); }
    const ring: V3[] = Array.from({ length: 65 }, (_, i) => { const a = (i / 64) * 2 * Math.PI; return [PX, YC + Math.sin(a) * RV * amp, Math.cos(a) * RV * amp] as V3; });
    return { pts, sq, hel, ring };
  }, [wave, amp]);
  const kr = s.rms / Vm, ka = s.avg / Vm;
  const lvl = (y: number): XY[] => [[0, y * amp], [720, y * amp]];
  return (
    <LabFrame
      label="A gold phasor rotates in a circle and its tip traces a helix whose shadow on the back wall is the sine wave; the wall graph also shows the squared wave in purple, the rms level in gold and the average level in green, with a red dot riding the wave"
      camera={[1.4, 1.6, 8.4]}
      onReset={reset}
      scene={(playing) => (<group>
        <Graph x0={GX} y0={GY} w={GW} h={GH} xr={[0, 720]} yr={[-1.15, 1.15]} grid={8}
          curves={[
            { pts: curves.sq, color: C.purple, w: 2 },
            { pts: lvl(kr), color: C.gold, w: 2.2, dashed: true }, ...(wave === "half" || wave === "full" ? [] : [{ pts: lvl(-kr), color: C.gold, w: 2.2, dashed: true }]),
            { pts: lvl(ka), color: C.green, w: 2.2, dashed: true },
            { pts: lvl(1), color: C.red, w: 1.2, dashed: true },
            { pts: curves.pts, color: C.blue, w: 3.4 },
          ]}
          vlines={[{ x: th, color: C.orange }]} />
        {sine ? <>
          <Line points={curves.ring} color={C.grey} lineWidth={1.6} />
          <Line points={curves.hel} color={C.orange} lineWidth={1.8} transparent opacity={0.85} />
          <Line points={[[PX, YC - RV - 0.2, 0], [PX, YC + RV + 0.2, 0]]} color={C.light} lineWidth={1.2} />
        </> : null}
        <Moving wave={wave} amp={amp} rate={60 + 2 * f} th={th} playing={playing} />
      </group>)}
      readouts={[
        ["RMS value", `${eng(s.rms, "V", 4)} (${kr.toFixed(3)} V_m)`],
        [wave === "half" || wave === "full" ? "Average (full cycle)" : "Average (half cycle)", `${eng(s.avg, "V", 4)} (${ka.toFixed(3)} V_m)`],
        ["Form factor = rms/avg", s.ff.toFixed(3)],
        ["Peak factor = V_m/rms", s.pf.toFixed(3)],
        ["Period T · ω = 2πf", `${eng(s.T, "s")} · ${s.w.toFixed(1)} rad/s`],
        [`Instantaneous v at ${th.toFixed(0)}°`, eng(waveAt(wave, Vm, th * D2R), "V", 4)],
      ]}
      controls={<>
        <Slider label="Peak value V_m" value={Vm} min={1} max={400} step={0.1} digits={1} unit=" V" onChange={(x) => set("Vm", x)} />
        <Slider label="Frequency f" value={f} min={1} max={100} step={0.1} digits={1} unit=" Hz" onChange={(x) => set("f", x)} />
        <Pick label="Waveform" value={wave} options={[{ id: "sine", label: "Sine (with rotating phasor)" }, { id: "full", label: "Full-wave rectified sine" }, { id: "half", label: "Half-wave rectified sine" }, { id: "square", label: "Square" }, { id: "triangle", label: "Triangular" }]} onChange={(x) => set("wave", x)} />
        <Slider label="Angle ωt for the reading" value={th} min={0} max={360} step={1} digits={0} unit="°" onChange={(x) => set("th", x)} />
      </>}
      note={<>
        <p><b>Phasor picture:</b> a line of length V_m (gold) turning at ω = 2πf rad/s. Its tip draws the orange helix as time runs along the wall; the helix’s shadow on the wall is v = V_m sin ωt (blue). That is why a sinusoid can be handled as a rotating phasor. The wall is two cycles (0–720°); the red dot rides the wave, and the orange line marks the angle you chose for the instantaneous-value reading.</p>
        <p><b>RMS</b> is the steady DC that would heat a resistor equally: square the wave (purple), take its mean, then the square root. For a sine V_rms = V_m/√2 = 0.707 V_m (gold line). <b>Average</b> of a full sine cycle is zero, so it is taken over a half cycle: V_avg = 2V_m/π = 0.637 V_m (green). <b>Form factor</b> = rms/avg = 1.11 and <b>peak factor</b> = V_m/rms = 1.414 for a sine. Half-wave rectified: V_m/2, V_m/π, 1.57, 2. Square: 1, 1. Triangle: V_m/√3, V_m/2, 1.155, 1.732.</p>
        <p><b>Try:</b> put V_m = 325 V for Indian mains (230 V rms); switch waveforms and see the peak factor rise as the wave gets “peakier”.</p>
      </>}
    />
  );
}
