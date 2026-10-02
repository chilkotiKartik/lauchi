"use client";
import { Line } from "@react-three/drei";
import { useMemo, useRef } from "react";
import type * as THREE from "three";
import { rectifier } from "../math";
import { Tick } from "../Stage";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { CORE_SPECS } from "../meta/core.specs";

export default function RectifierLab() {
  const [P, set, reset] = useLabParams(CORE_SPECS.rectifier);
  const { mode, C: Cm, R, Vp } = P;
  const setMode = (x: (typeof P)["mode"]) => set("mode", x), setC = (x: (typeof P)["C"]) => set("C", x), setR = (x: (typeof P)["R"]) => set("R", x), setVp = (x: (typeof P)["Vp"]) => set("Vp", x);
  const f = 50, cycles = 3;
  const w = useMemo(() => rectifier(mode, Vp, f, R, Cm * 1e-6, cycles, 600), [mode, Vp, R, Cm]);
  const X = (i: number) => (i / 599) * 7 - 3.5, Y = (v: number) => (v / 12) * 1.7;
  const vin = useMemo(() => w.vin.map((v, i): [number, number, number] => [X(i), Y(v), 0.4]), [w]);
  const vout = useMemo(() => w.vout.map((v, i): [number, number, number] => [X(i), Y(v) - 0.6, -0.4]), [w]);
  const dot = useRef<THREE.Mesh>(null), t = useRef(0);
  const tick = (dt: number) => { t.current = (t.current + Math.min(dt, 0.05) * 0.5) % 1; const i = Math.floor(t.current * 599); dot.current?.position.set(X(i), Y(w.vout[i]) - 0.6, -0.3); };
  const tail = w.vout.slice(300), avg = w.vout.reduce((s, v) => s + v, 0) / w.vout.length;
  const ripple = mode === "smooth" ? Math.max(...tail) - Math.min(...tail) : Math.max(...w.vout) - Math.min(...w.vout);
  return (
    <LabFrame
      label="Diode rectifier: input sine wave and rectified output, live"
      camera={[0, 1.2, 8]}
      onReset={reset}
      scene={() => (<group>
        <Tick fn={tick} />
        <Line points={[[-3.6, -0.6, -0.4], [3.6, -0.6, -0.4]]} color="#33454e" lineWidth={1} />
        <Line points={[[-3.6, 0, 0.4], [3.6, 0, 0.4]]} color="#33454e" lineWidth={1} />
        <Line points={vin} color="#2ba6f5" lineWidth={2} />
        <Line points={vout} color="#ffc83d" lineWidth={3.5} />
        <mesh ref={dot}><sphereGeometry args={[0.07, 12, 12]} /><meshStandardMaterial color="#ff5a5f" emissive="#ff5a5f" emissiveIntensity={0.6} /></mesh>
      </group>)}
      readouts={[["Average output", `${avg.toFixed(2)} V`], [mode === "smooth" ? "Ripple (p–p)" : "Swing (p–p)", `${ripple.toFixed(2)} V`], ["Theory: half / full avg", `${(Vp / Math.PI).toFixed(2)} / ${((2 * Vp) / Math.PI).toFixed(2)} V`], ["Ripple frequency", mode === "half" ? "50 Hz" : "100 Hz"]]}
      controls={<>
        <Pick label="Circuit" value={mode} options={[{ id: "half", label: "Half-wave" }, { id: "full", label: "Full-wave" }, { id: "smooth", label: "Full-wave + capacitor" }]} onChange={setMode} />
        <Slider label="Peak input Vp" value={Vp} min={2} max={12} step={0.5} digits={1} unit=" V" onChange={setVp} />
        <Slider label="Filter capacitor C" value={Cm} min={10} max={2200} step={10} digits={0} unit=" µF" onChange={setC} />
        <Slider label="Load R" value={R} min={50} max={2000} step={10} digits={0} unit=" Ω" onChange={setR} />
      </>}
      note={<p>Blue is the 50 Hz AC input, yellow the rectified output. A half-wave rectifier passes only the positive half (average Vp/π); a full-wave bridge flips the negative half (average 2Vp/π) and doubles the ripple frequency to 100 Hz. Adding a capacitor lets the output hold near the peak while the diode is off and discharge through the load — the ripple is roughly V<sub>p</sub>/(2fRC), so a bigger C or a bigger load resistance gives a smoother supply. The diode&apos;s forward drop is ignored here.</p>}
    />
  );
}
