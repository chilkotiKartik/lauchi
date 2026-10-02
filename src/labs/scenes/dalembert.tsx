"use client";
import { Line } from "@react-three/drei";
import { useMemo, useRef } from "react";
import type * as THREE from "three";
import { WAVE_L, waveClass, waveU } from "../sim/mathii";
import { Tick } from "../Stage";
import { LabFrame, Slider, Pick } from "../ui";
import { useLabParams } from "../params";
import { MATHII_SPECS } from "../meta/mathii.specs";
import { C, Orb, Surface, Sway, buildSurface, fmt, ramp, type V3 } from "./mathii-kit";

const TM = 6, SY = 0.8, HS = 1.3, L = WAVE_L;
function sweep(m: THREE.Object3D | null, u: number) { if (m) m.position.z = -u * TM * SY; }

export default function DAlembertLab() {
  const [P, set, reset] = useLabParams(MATHII_SPECS.dalembert);
  const { t, mode, c, w, amp, xp } = P;
  const geo = useMemo(() => buildSurface({
    n: 73, x0: 0, x1: L, y0: 0, y1: TM, sx: 1, sy: SY,
    h: (x, tt) => waveU(mode, c, w, amp, x, tt) * HS,
    col: (x, tt) => ramp(0.5 + (0.5 * waveU(mode, c, w, amp, x, tt)) / amp),
  }), [mode, c, w, amp]);
  const slice = useMemo(() => Array.from({ length: 121 }, (_, i) => { const x = (L * i) / 120; return [x, waveU(mode, c, w, amp, x, t) * HS + 0.02, -t * SY] as V3; }), [mode, c, w, amp, t]);
  const front = useMemo(() => slice.map((p) => [p[0], p[1], 0.9] as V3), [slice]);
  const cone = useMemo<V3[]>(() => {
    const d = Math.min(c * t, 6);
    return [[xp, 0.03, -t * SY], [xp - d, 0.03, 0], [xp + d, 0.03, 0], [xp, 0.03, -t * SY]];
  }, [xp, c, t]);
  const chars = useMemo<V3[][]>(() => [-1, 1].map((sg) => { const out: V3[] = []; for (let q = 0; q <= TM; q += 0.25) { const x = xp + sg * c * q; if (x >= 0 && x <= L) out.push([x, 0.03, -q * SY]); } return out; }), [xp, c]);
  const plane = useRef<THREE.Mesh>(null), ts = useRef(0);
  const tick = (dt: number) => { ts.current = (ts.current + Math.min(dt, 0.05) * 0.12) % 1; sweep(plane.current, ts.current); };
  const u = waveU(mode, c, w, amp, xp, t), cl = waveClass(c);
  let mx = 0;
  for (let i = 0; i <= 120; i++) mx = Math.max(mx, Math.abs(waveU(mode, c, w, amp, (L * i) / 120, t)));
  return (
    <LabFrame
      label="A coloured space-time surface of a travelling wave with the position along one axis and time going into the screen, a gold slice for the chosen time, orange characteristic lines on the floor and a sweeping glass plane"
      camera={[0, 4.6, 8.8]}
      onReset={reset}
      scene={() => (<group>
        <Tick fn={tick} />
        <Sway amp={0.25}>
          <group position={[-L / 2, -1, (TM * SY) / 2 - 0.5]}>
            <Surface geo={geo} opacity={0.92} />
            <Line points={slice} color={C.gold} lineWidth={4.5} />
            <Line points={front} color={C.gold} lineWidth={5} />
            <Line points={cone} color={C.white} lineWidth={2.4} />
            {chars.map((p, i) => (p.length > 1 ? <Line key={i} points={p} color={i ? C.orange : C.blue} lineWidth={2.6} /> : null))}
            <Orb p={[xp, u * HS + 0.02, -t * SY]} r={0.13} c={C.white} />
            <mesh ref={plane} position={[L / 2, 1, 0]}><planeGeometry args={[L, 3]} /><meshStandardMaterial color="#9fe0ff" transparent opacity={0.1} side={2} depthWrite={false} /></mesh>
            <gridHelper args={[L + 1, 12, "#3d5560", "#26363d"]} position={[L / 2, -0.01, -(TM * SY) / 2]} />
          </group>
        </Sway>
      </group>)}
      readouts={[
        ["Displacement u(x, t) at the probe", fmt(u, 4)],
        ["Domain of dependence", `[${fmt(xp - c * t, 2)}, ${fmt(xp + c * t, 2)}]`],
        ["Distance travelled c·t", fmt(c * t, 3)],
        ["Largest |u| on the string now", fmt(mx, 4)],
        ["Period 2L/c (fixed ends)", mode === "string" ? `${fmt((2 * L) / c, 3)} s` : "not periodic here"],
        ["Type of u_tt = c²u_xx", `hyperbolic, B² − 4AC = ${fmt(cl.disc, 2)} > 0`],
      ]}
      controls={<>
        <Slider label="Time t" value={t} min={0} max={6} step={0.05} digits={2} unit=" s" onChange={(v) => set("t", v)} />
        <Pick label="Initial condition" value={mode} options={[{ id: "pulses", label: "Pulse released at rest (splits in two)" }, { id: "string", label: "Plucked string, fixed ends (reflections)" }, { id: "hammer", label: "Struck string (initial velocity)" }]} onChange={(v) => set("mode", v)} />
        <Slider label="Wave speed c" value={c} min={0.5} max={3} step={0.05} digits={2} onChange={(v) => set("c", v)} />
        <Slider label="Pulse width" value={w} min={0.2} max={1.2} step={0.05} digits={2} onChange={(v) => set("w", v)} />
        <Slider label="Amplitude" value={amp} min={0.5} max={2} step={0.05} digits={2} onChange={(v) => set("amp", v)} />
        <Slider label="Probe position x" value={xp} min={0} max={6} step={0.05} digits={2} onChange={(v) => set("xp", v)} />
      </>}
      note={<p>The one-dimensional wave equation u<sub>tt</sub> = c²u<sub>xx</sub> has the <b>d&apos;Alembert solution</b> u = ½[f(x − ct) + f(x + ct)] + (1/2c)∫ g(s) ds over [x − ct, x + ct], where f = u(x, 0) and g = u<sub>t</sub>(x, 0): two copies of the initial shape running left and right at speed c. A pulse released at rest splits into two half-height pulses. For a string fixed at both ends the shape is extended as an odd function of period 2L, which is exactly why the pulse flips upside down when it reflects, and the motion repeats every 2L/c. A string given only a starting velocity (a hammer blow) rises to a plateau of height amp·w/c between the two fronts. The orange and blue lines on the floor are the <b>characteristics</b> x ± ct = const; the white triangle is the domain of dependence of the probe, the only part of the initial data that can affect u(x, t). The same string solved with separation of variables is a sum of sine modes (see the vibrating string lab).</p>}
    />
  );
}
