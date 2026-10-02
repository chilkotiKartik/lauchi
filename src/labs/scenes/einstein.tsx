"use client";
import { Line } from "@react-three/drei";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { einstein, nmHex, prng, sci, sciLog } from "../sim/phyy";
import { Tick, useQuality } from "../Stage";
import { LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { PHYY_SPECS } from "../meta/phyy.specs";
import { C, Box, Instances, Shuttle, type Inst, type V3 } from "../kit";
import { Arrow, Coil, Flow, Graph, Rod, mix, type XY } from "../kit2";

const NI = 64, X0 = -5.4, X1 = -1.2, Y = 1.2, rnd = prng(29);
const IX = Float32Array.from({ length: NI }, () => rnd()), IY = Float32Array.from({ length: NI }, () => rnd() * 2 - 1), IZ = Float32Array.from({ length: NI }, () => rnd() * 2 - 1), IP = Float32Array.from({ length: NI }, () => rnd());
const _o = new THREE.Object3D(), _c = new THREE.Color();
/** Cr³⁺ ions in the rod: a fraction `upper` sit in the metastable level (red glow); a few flash green as they pass through the pump band. */
function paintIons(m: THREE.InstancedMesh, t: number, upper: number, n: number) {
  for (let i = 0; i < NI; i++) {
    if (i >= n) { _o.position.set(0, -99, 0); _o.scale.setScalar(0.0001); _o.updateMatrix(); m.setMatrixAt(i, _o.matrix); continue; }
    const ph = (t * 0.25 + IP[i]) % 1;
    const state = ph < upper ? 2 : ph < upper + 0.04 ? 3 : 1;
    const r = Math.sqrt(Math.abs(IY[i])) * 0.3;
    _o.position.set(X0 + 0.25 + IX[i] * (X1 - X0 - 0.5), Y + r * Math.sign(IY[i]) * 0.9, IZ[i] * 0.3);
    _o.scale.setScalar(state === 1 ? 0.75 : 1.2); _o.updateMatrix(); m.setMatrixAt(i, _o.matrix);
    m.setColorAt(i, _c.set(state === 2 ? C.red : state === 3 ? C.green : "#c9a6b0"));
  }
  m.instanceMatrix.needsUpdate = true;
  if (m.instanceColor) m.instanceColor.needsUpdate = true;
}
function Ions({ upper, n }: { upper: number; n: number }) {
  const ref = useRef<THREE.InstancedMesh>(null), t = useRef(0);
  useLayoutEffect(() => { if (ref.current) paintIons(ref.current, t.current, upper, n); }, [upper, n]);
  return (<>
    <Tick fn={(dt) => { t.current += Math.min(dt, 0.05); if (ref.current) paintIons(ref.current, t.current, upper, n); }} />
    <instancedMesh ref={ref} args={[undefined, undefined, NI]} frustumCulled={false}><sphereGeometry args={[0.055, 10, 10]} /><meshStandardMaterial color="#ffffff" emissive="#401010" /></instancedMesh>
  </>);
}

export default function EinsteinLab() {
  const q = useQuality();
  const [P, set, reset] = useLabParams(PHYY_SPECS.einstein);
  const { lam, T, w } = P;
  const r = einstein(lam, T, w);
  const col = nmHex(lam);
  const y1 = -0.6, y2 = y1 + 0.75 * r.eV, y3 = y2 + 0.55, n2 = Math.round(20 * r.upper);
  const dots = useMemo<Inst[]>(() => {
    const out: Inst[] = [];
    for (let i = 0; i < 20; i++) {
      const up = i < n2, x = 1.05 + ((up ? i : i - n2) % 10) * 0.32, z = Math.floor((up ? i : i - n2) / 10) * 0.3 - 0.15;
      out.push({ p: [x, (up ? y2 : y1) + 0.16, z], s: [0.16, 0.16, 0.16], c: up ? C.red : C.light });
    }
    return out;
  }, [n2, y1, y2]);
  const curve = useMemo<XY[]>(() => Array.from({ length: 80 }, (_, i) => { const Ti = 100 + (5900 * i) / 79; return [Ti, einstein(lam, Ti, 0).lgSpontStim] as XY; }), [lam]);
  const ymax = Math.max(5, Math.ceil(curve[0][1] / 10) * 10);
  const axis = useMemo<V3[]>(() => [[X0 + 0.2, Y, 0], [X1 - 0.2, Y, 0], [X0 + 0.2, Y, 0.001]], []);
  const out = useMemo<V3[]>(() => [[X0 - 0.2, Y, 0], [X0 - 1.6, Y, 0]], []);
  return (
    <LabFrame
      label="A ruby rod wrapped in a helical flash lamp between two mirrors: chromium ions glow red when they sit in the metastable level and a red beam leaves once the pump makes a population inversion; beside it a three-level energy diagram with pump, fast decay and laser arrows and population dots, and a graph of spontaneous-to-stimulated emission ratio against temperature"
      camera={[-0.6, 0.6, 11]}
      onReset={reset}
      scene={() => (<group position={[0.4, 0, 0]}>
        <Rod a={[X0, Y, 0]} b={[X1, Y, 0]} r={0.42} color="#ff6b7d" o={0.3} />
        <Ions upper={r.upper} n={q === "low" ? 32 : NI} />
        <Coil p={[(X0 + X1) / 2, Y, 0]} turns={8} r={0.62} len={X1 - X0 - 0.2} color={mix(C.grey, "#fff7d6", Math.min(1, w / 3))} w={3} />
        <Box p={[X1 + 0.12, Y, 0]} s={[0.08, 1.1, 1.1]} c={C.light} glow={0.2} />
        <Box p={[X0 - 0.12, Y, 0]} s={[0.08, 1.1, 1.1]} c={C.blue} o={0.6} />
        {r.lasing && <Flow path={axis} n={16} speed={1.2} color={C.red} r={0.05} />}
        {r.lasing && <><Line points={out} color={col} lineWidth={2 + 3 * Math.min(1, r.inversion * 2)} /><Flow path={out} n={6} speed={1.1} color={col} r={0.07} /></>}
        <Box p={[0.85 + 1.6, y1, 0]} s={[3.6, 0.1, 0.9]} c={C.light} glow={0.2} />
        <Box p={[0.85 + 1.6, y2, 0]} s={[3.6, 0.1, 0.9]} c={col} glow={0.5} />
        <Box p={[0.85 + 1.6, y3, 0]} s={[3.6, 0.3, 0.9]} c={C.green} o={0.5} glow={0.3} />
        <Instances items={dots} cap={20} shape="sphere" />
        <Arrow from={[1.0, y1 + 0.08, 0.55]} to={[1.0, y3 + 0.1, 0.55]} color={C.green} r={0.05} />
        <Arrow from={[2.3, y3 - 0.12, 0.55]} to={[2.6, y2 + 0.1, 0.55]} color={C.orange} r={0.03} head={0.16} />
        <Arrow from={[3.9, y2 - 0.06, 0.55]} to={[3.9, y1 + 0.08, 0.55]} color={col} r={0.07} />
        <Shuttle from={[1.0, y1 + 0.1, 0.7]} to={[1.0, y3, 0.7]} speed={0.6} c={C.green} r={0.08} />
        <Shuttle from={[3.9, y2, 0.75]} to={[3.9, y1 + 0.1, 0.75]} speed={0.45} c={col} r={0.09} />
        <Graph x0={-5.6} y0={-3.4} w={4.6} h={2.2} xr={[100, 6000]} yr={[0, ymax]} curves={[{ pts: curve, color: C.purple, w: 3 }]} marker={[T, Math.min(ymax, r.lgSpontStim)]} markerColor={C.gold} />
      </group>)}
      readouts={[
        ["Photon energy hν = hc/λ", `${r.eV.toFixed(3)} eV (${sci(r.eV * 1.602176634e-19)} J)`],
        ["A₂₁/B₂₁ = 8πhν³/c³", `${sci(r.AoverB)} J s m⁻³`],
        ["Spontaneous ÷ stimulated at T", sciLog(r.lgSpontStim)],
        ["Thermal N₂/N₁ = e^(−hν/kT)", sciLog(r.lgN2N1)],
        ["Pumped inversion (N₂ − N₁)/N", `${(r.inversion * 100).toFixed(1)} %`],
        ["Lasing?", r.lasing ? "Yes: N₂ > N₁" : "No: N₂ < N₁ (absorption wins)"],
      ]}
      controls={<>
        <Slider label="Transition wavelength λ" value={lam} min={300} max={1100} step={0.1} digits={1} unit=" nm" onChange={(x) => set("lam", x)} />
        <Slider label="Temperature T (thermal equilibrium)" value={T} min={100} max={6000} step={10} digits={0} unit=" K" onChange={(x) => set("T", x)} />
        <Slider label="Pump rate W ÷ A₂₁" value={w} min={0} max={5} step={0.05} digits={2} onChange={(x) => set("w", x)} />
      </>}
      note={<>
        <p>Atoms exchange light with a radiation field in three ways: <b>absorption</b> (rate B₁₂ρN₁), <b>spontaneous emission</b> (A₂₁N₂) and <b>stimulated emission</b> (B₂₁ρN₂). Balancing them in thermal equilibrium against Planck’s law gives Einstein’s relations <b>B₁₂ = B₂₁</b> and <b>A₂₁/B₂₁ = 8πhν³/c³</b>, and the ratio of spontaneous to stimulated emission <b>e^(hν/kT) − 1</b>. For visible light at room temperature this is about 10³⁰: stimulated emission is hopeless unless we force <b>N₂ &gt; N₁</b> (population inversion), which Boltzmann’s N₂/N₁ = e^(−hν/kT) never allows. (The graph shows log₁₀ of the ratio against T.)</p>
        <p className="mt-2">The <b>ruby laser</b> (Al₂O₃ with Cr³⁺) is a three-level system: a xenon flash lamp pumps ions from the ground level to green/blue absorption bands (E₃); they drop in nanoseconds to the metastable level E₂ (lifetime ≈ 3 ms), and the 694.3 nm transition E₂ → E₁ lases between two mirrors. With a pump rate W the steady state is N₂/N₁ = W/A₂₁, so inversion needs <b>W &gt; A₂₁</b>: more than half of all ions must be lifted, which is why ruby lasers need intense flashes and run in pulses. <b>Try:</b> raise the pump past 1, then shorten λ or heat the cavity and watch the ratio. Cavity losses are ignored (simplified model).</p>
      </>}
    />
  );
}
