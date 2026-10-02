"use client";
import { useMemo, useLayoutEffect, useRef } from "react";
import * as THREE from "three";
import { multiplicity, NMR, nmrInfo, nmrSpectrum, type NmrId } from "../sim/chemx";
import { Tick } from "../Stage";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { CHEMX_SPECS } from "../meta/chemx.specs";
import { C } from "../kit";
import { Graph, Rod } from "../kit2";

const NS = 14, _o = new THREE.Object3D();
function paint(m: THREE.InstancedMesh, t: number, w: number) {
  for (let i = 0; i < NS; i++) {
    const a = (i / NS) * Math.PI * 2, y = -0.9 + (i % 7) * 0.3;
    _o.position.set(Math.cos(a) * 0.32, y, Math.sin(a) * 0.32);
    _o.rotation.set(0.35 * Math.cos(t * w + i), 0, 0.35 * Math.sin(t * w + i));
    _o.updateMatrix(); m.setMatrixAt(i, _o.matrix);
  }
  m.instanceMatrix.needsUpdate = true;
}
function Spins({ w }: { w: number }) {
  const ref = useRef<THREE.InstancedMesh>(null), t = useRef(0);
  useLayoutEffect(() => { if (ref.current) paint(ref.current, t.current, w); }, [w]);
  return (<>
    <Tick fn={(dt) => { t.current += Math.min(dt, 0.05); if (ref.current) paint(ref.current, t.current, w); }} />
    <instancedMesh ref={ref} args={[undefined, undefined, NS]} frustumCulled={false}><coneGeometry args={[0.06, 0.24, 8]} /><meshStandardMaterial color={C.gold} emissive={C.gold} emissiveIntensity={0.5} /></instancedMesh>
  </>);
}

export default function NmrLab() {
  const [P, set, reset] = useLabParams(CHEMX_SPECS.nmr);
  const { B0, J, width, mol } = P;
  const spec = useMemo(() => nmrSpectrum(mol, B0, J, width), [mol, B0, J, width]);
  const info = nmrInfo(mol, B0);
  const pts = useMemo(() => { const out: [number, number][] = []; for (let i = 0; i <= 900; i++) { const d = 9 - (9.5 * i) / 900; out.push([-d, spec.at(d)]); } return out; }, [spec]);
  const ymax = Math.max(1, ...pts.map((p) => p[1])) * 1.1;
  const peaks = NMR[mol].peaks;
  return (
    <LabFrame
      label="An NMR magnet with a spinning sample tube in its bore and precessing proton spins, next to the proton NMR spectrum of the chosen compound with chemical shift decreasing to the right and TMS at zero"
      camera={[0.8, 0.6, 9]}
      onReset={reset}
      scene={() => (<group>
        <group position={[-3.6, 0, 0]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[1.3, 0.38, 16, 40]} /><meshStandardMaterial color={C.blue} /></mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.9, 0]}><torusGeometry args={[1.3, 0.25, 16, 40]} /><meshStandardMaterial color={C.dark} /></mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.9, 0]}><torusGeometry args={[1.3, 0.25, 16, 40]} /><meshStandardMaterial color={C.dark} /></mesh>
          <Rod a={[0, -1.4, 0]} b={[0, 1.6, 0]} r={0.12} color="#e8f1f5" o={0.5} />
          <Spins w={1 + B0 / 3} />
        </group>
        <Graph x0={-1.6} y0={-1.8} w={6.6} h={3.6} xr={[-9, 0.5]} yr={[0, ymax]} curves={[{ pts, color: C.green, w: 2 }]} vlines={[{ x: 0, color: C.light }]} />
      </group>)}
      readouts={[
        ["Proton frequency ν₀ = γB₀", `${info.nu0.toFixed(1)} MHz`],
        ["Signals (excluding TMS)", String(info.signals)],
        ["Signals", peaks.map((p) => `${p.d.toFixed(2)} ppm ${multiplicity(p.n)} (${p.H}H)`).join("; ")],
        ["Coupling J in ppm", `${(spec.Jppm * 1000).toFixed(2)}×10⁻³ ppm`],
        ["Total H integrated", String(info.totalH)],
        ["Spin excess (Boltzmann)", `${info.excessPpm.toFixed(1)} ppm`],
      ]}
      controls={<>
        <Slider label="Magnetic field B₀" value={B0} min={1.41} max={14.1} step={0.01} digits={2} unit=" T" onChange={(x) => set("B0", x)} />
        <Slider label="Coupling constant J" value={J} min={2} max={15} step={0.5} digits={1} unit=" Hz" onChange={(x) => set("J", x)} />
        <Slider label="Line width" value={width} min={0.3} max={6} step={0.1} digits={1} unit=" Hz" onChange={(x) => set("width", x)} />
        <Pick label="Sample" value={mol} options={(Object.keys(NMR) as NmrId[]).map((k) => ({ id: k, label: NMR[k].name }))} onChange={(x) => set("mol", x)} />
      </>}
      note={<p>In the field B₀, proton spins (gold) line up with or against it and precess at the Larmor frequency ν₀ = γB₀/2π = 42.58 MHz per tesla. A radio pulse at that frequency flips them. Electrons around each proton <b>shield</b> it a little, so protons near electronegative atoms (O, Cl, Br) are <b>deshielded</b> and appear further left: the chemical shift δ (ppm) relative to TMS at 0. Each signal is split by n neighbouring equivalent protons into <b>n + 1</b> lines with binomial (Pascal’s triangle) heights, J apart in hertz, so a stronger magnet squeezes multiplets in ppm and gives cleaner spectra. Areas are proportional to the number of protons. Shifts are typical literature values; the OH of ethanol is shown unsplit (fast exchange).</p>}
    />
  );
}
