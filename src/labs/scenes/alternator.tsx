"use client";
import { useMemo, useRef } from "react";
import type * as THREE from "three";
import { alternator, eng } from "../sim/elecy";
import { Tick } from "../Stage";
import { LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { ELECY_SPECS } from "../meta/elecy.specs";
import { Box, C } from "../kit";
import { Graph, type XY } from "../kit2";

const PH = [C.red, C.gold, C.blue], SX = -2.2, GX = 0.9, GW = 3.9, GY = -1.6, GH = 3.2;

/** Per-frame update of the phase-coil glow and the rotor */
function paint(mats: (THREE.MeshStandardMaterial | null)[], phaseOf: number[], th: number) {
  for (let i = 0; i < mats.length; i++) {
    const m = mats[i];
    if (m) m.emissiveIntensity = 0.15 + 0.85 * Math.abs(Math.sin(th - (phaseOf[i] * 2 * Math.PI) / 3));
  }
}

function Machine({ P, N, amp, playing }: { P: number; N: number; amp: number; playing: boolean }) {
  const rotor = useRef<THREE.Group>(null);
  const mats = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const mark = useRef<THREE.Mesh>(null);
  const mech = useRef(0);

  const nc = (3 * P) / 2;
  const coils = useMemo(() => Array.from({ length: nc }, (_, k) => ({ a: (k / nc) * 2 * Math.PI, ph: k % 3 })), [nc]);
  const phaseOf = useMemo(() => coils.map((c) => c.ph), [coils]);
  const poles = useMemo(() => Array.from({ length: P }, (_, k) => (k / P) * 2 * Math.PI), [P]);
  const salient = P > 4;

  const tick = (dt: number) => {
    if (playing) mech.current += Math.min(dt, 0.05) * (0.25 + (N / 3600) * 1.5);
    if (rotor.current) rotor.current.rotation.z = mech.current;

    const th = (P / 2) * mech.current;
    paint(mats.current, phaseOf, th);
    if (mark.current) mark.current.position.x = GX + ((((th * 180) / Math.PI) % 720) / 720) * GW;
  };

  const tw = Math.min(0.5, ((2 * Math.PI * 1.7) / nc) * 0.55),
    pw = Math.min(0.7, ((2 * Math.PI * 0.95) / P) * 0.6);

  return (
    <>
      <Tick fn={tick} />
      <mesh ref={mark} position={[GX, GY + GH / 2, 0.06]}>
        <boxGeometry args={[0.04, GH * amp, 0.04]} />
        <meshBasicMaterial color={C.white} />
      </mesh>
      <group position={[SX, 0, 0]}>
        {/* Stator Steel Outer Ring & Mounting Feet */}
        <mesh>
          <torusGeometry args={[2.2, 0.35, 16, 64]} />
          <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.35} />
        </mesh>

        {/* 3-Phase Stator Armature Coils */}
        {coils.map((c, i) => (
          <mesh key={i} position={[Math.cos(c.a) * 1.7, Math.sin(c.a) * 1.7, 0]} rotation={[0, 0, c.a]}>
            <boxGeometry args={[0.28, tw, 0.85]} />
            <meshStandardMaterial
              ref={(el) => {
                mats.current[i] = el;
              }}
              color={PH[c.ph]}
              emissive={PH[c.ph]}
              emissiveIntensity={0.35}
              metalness={0.6}
              roughness={0.25}
            />
          </mesh>
        ))}

        {/* Dynamic Rotor Assembly */}
        <group ref={rotor}>
          {salient ? (
            <>
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.75, 0.75, 0.75, 32]} />
                <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.3} />
              </mesh>
              {poles.map((a, k) => (
                <group key={k} rotation={[0, 0, a]}>
                  <Box p={[1.05, 0, 0]} s={[0.6, pw, 0.72]} c={k % 2 ? C.blue : C.red} glow={0.35} />
                  <Box p={[1.38, 0, 0]} s={[0.12, pw * 1.4, 0.76]} c="#94a3b8" />
                </group>
              ))}
            </>
          ) : (
            <>
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[1.4, 1.4, 0.8, 48]} />
                <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.25} />
              </mesh>
              {poles.map((a, k) => (
                <group key={k} rotation={[0, 0, a]}>
                  <Box p={[1.35, 0, 0]} s={[0.1, 0.75, 0.82]} c={k % 2 ? C.blue : C.red} glow={0.45} />
                </group>
              ))}
            </>
          )}
          {/* Central Rotating Shaft */}
          <mesh position={[0, 0, 0.55]}>
            <cylinderGeometry args={[0.18, 0.18, 0.6, 24]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
          </mesh>
        </group>
      </group>
    </>
  );
}

export default function AlternatorLab() {
  const [Pm, set, reset] = useLabParams(ELECY_SPECS.alternator);
  const { P, N, phi, T, Kw } = Pm;
  const Pe = Math.max(2, 2 * Math.round(P / 2));
  const a = alternator(Pe, N, phi, T, Kw);
  const amp = Math.min(1, Math.max(0.2, Math.log10(Math.max(a.Eph, 1)) / 4.3));
  const waves = useMemo(
    () =>
      [0, 1, 2].map((k) => {
        const pts: XY[] = [];
        for (let i = 0; i <= 240; i++) {
          const x = i * 3;
          pts.push([x, amp * Math.sin(((x - 120 * k) * Math.PI) / 180)]);
        }
        return pts;
      }),
    [amp]
  );

  return (
    <LabFrame
      label="Three-Phase Synchronous Alternator: revolving magnetic field rotor, 3-phase stationary stator coils (R-Y-B), and real-time generated 3-phase sine waves"
      camera={[0, 0.2, 9.4]}
      onReset={reset}
      note={
        <p>
          In a 3-phase synchronous alternator, the DC field winding rotates on the <b>rotor</b> while the 3-phase AC armature winding is housed in the stationary <b>stator</b> slots 120° apart. As magnetic poles rotate past the coils, Faraday induction produces balanced three-phase AC voltages: <b>E<sub>ph</sub> = 4.44 · f · Φ · T · K<sub>w</sub></b> with electrical frequency <b>f = P · N / 120</b>.
        </p>
      }
      scene={(playing) => (
        <group>
          <Machine P={Pe} N={N} amp={amp} playing={playing} />
          <Graph
            x0={GX}
            y0={GY}
            w={GW}
            h={GH}
            xr={[0, 720]}
            yr={[-1.1, 1.1]}
            grid={8}
            curves={waves.map((w, k) => ({ pts: w, color: PH[k], w: 2.8 }))}
          />
        </group>
      )}
      readouts={[
        ["AC Frequency f = PN/120", `${a.f.toFixed(2)} Hz`],
        ["Phase EMF E_ph", eng(a.Eph, "V")],
        ["Line EMF (Star) E_L = √3·E_ph", eng(a.EL, "V")],
        ["Speed required for 50 Hz", `${a.N50.toFixed(0)} rpm`],
        ["Rotor configuration", a.rotor],
      ]}
      controls={
        <>
          <Slider label="Number of Poles P" value={Pe} min={2} max={24} step={2} digits={0} onChange={(x) => set("P", x)} />
          <Slider label="Rotor Speed N" value={N} min={100} max={3600} step={5} digits={0} unit=" rpm" onChange={(x) => set("N", x)} />
          <Slider label="Magnetic Flux per pole Φ" value={phi} min={1} max={200} step={0.5} digits={1} unit=" mWb" onChange={(x) => set("phi", x)} />
          <Slider label="Turns per phase T" value={T} min={10} max={2000} step={1} digits={0} onChange={(x) => set("T", x)} />
          <Slider label="Winding Factor K_w" value={Kw} min={0.7} max={1} step={0.01} digits={2} onChange={(x) => set("Kw", x)} />
        </>
      }
    />
  );
}
