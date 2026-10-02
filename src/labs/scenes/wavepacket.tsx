"use client";
import { Line } from "@react-three/drei";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { fmtLen, sci, wavePacket } from "../sim/phyy";
import { Tick, useQuality } from "../Stage";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { PHYY_SPECS } from "../meta/phyy.specs";
import { C, Bars, Box, type V3 } from "../kit";

const XL = -6, W = 12, LAMV = 0.55, U = 0.9, AMP = 1.3, CAP = 240;
const _o = new THREE.Object3D(), _c = new THREE.Color();
const wrap = (x: number) => x - W * Math.round(x / W);
type Vis = { sig: number; R: number; n: number };
type Refs = { beads: THREE.InstancedMesh; env: THREE.Group; crest: THREE.Mesh; peak: THREE.Mesh };

/** ψ(x, t) = envelope(x − v_g t) · e^{i k (x − v_p t)} drawn as a helix: y = Re ψ, z = Im ψ, colour = phase. */
function paintPacket(r: Refs, v: Vis, t: number) {
  const cE = XL + (((U * t) % W) + W) % W, cP = v.R * U * t, s2 = 4 * v.sig * v.sig;
  for (let i = 0; i < CAP; i++) {
    if (i >= v.n) { _o.position.set(0, -99, 0); _o.scale.setScalar(0.0001); _o.updateMatrix(); r.beads.setMatrixAt(i, _o.matrix); continue; }
    const x = XL + (W * i) / (v.n - 1), d = wrap(x - cE), env = Math.exp(-(d * d) / s2), ph = (2 * Math.PI * (x - cP)) / LAMV;
    _o.position.set(x, AMP * env * Math.cos(ph), AMP * env * Math.sin(ph));
    _o.scale.setScalar(0.35 + 0.65 * env); _o.updateMatrix(); r.beads.setMatrixAt(i, _o.matrix);
    const h = ((ph / (2 * Math.PI)) % 1 + 1) % 1;
    r.beads.setColorAt(i, _c.setHSL(h, 0.85, 0.3 + 0.32 * env));
  }
  r.beads.instanceMatrix.needsUpdate = true;
  if (r.beads.instanceColor) r.beads.instanceColor.needsUpdate = true;
  r.env.position.x = cE;
  r.peak.position.set(cE, 0, 0);
  const n = Math.round((cE - cP) / LAMV), xc = cP + n * LAMV, dc = wrap(xc - cE);
  r.crest.position.set(cE + dc, AMP * Math.exp(-(dc * dc) / s2), 0);
}

function Packet({ v }: { v: Vis }) {
  const beads = useRef<THREE.InstancedMesh>(null), env = useRef<THREE.Group>(null), crest = useRef<THREE.Mesh>(null), peak = useRef<THREE.Mesh>(null), t = useRef(0);
  const draw = () => { if (beads.current && env.current && crest.current && peak.current) paintPacket({ beads: beads.current, env: env.current, crest: crest.current, peak: peak.current }, v, t.current); };
  useLayoutEffect(draw);
  const curve = useMemo(() => { const pts: V3[] = []; const L = Math.min(W / 2, 3.6 * v.sig); for (let i = 0; i <= 80; i++) { const d = -L + (2 * L * i) / 80; pts.push([d, -2.2 + 1.1 * Math.exp(-(d * d) / (2 * v.sig * v.sig)), 0]); } return pts; }, [v.sig]);
  return (<>
    <Tick fn={(dt) => { t.current += Math.min(dt, 0.05); draw(); }} />
    <instancedMesh ref={beads} args={[undefined, undefined, CAP]} frustumCulled={false}><sphereGeometry args={[0.075, 10, 8]} /><meshStandardMaterial color="#ffffff" emissive="#202020" /></instancedMesh>
    <group ref={env}><Line points={curve} color={C.green} lineWidth={2.6} /></group>
    <mesh ref={peak}><sphereGeometry args={[0.13, 16, 16]} /><meshStandardMaterial color={C.green} emissive={C.green} emissiveIntensity={0.8} /></mesh>
    <mesh ref={crest}><sphereGeometry args={[0.12, 16, 16]} /><meshStandardMaterial color={C.red} emissive={C.red} emissiveIntensity={0.8} /></mesh>
  </>);
}

export default function WavePacketLab() {
  const q = useQuality();
  const [P, set, reset] = useLabParams(PHYY_SPECS.wavepacket);
  const { lgv, sp, pt, conv } = P;
  const w = wavePacket(lgv, sp, pt, conv);
  const sig = Math.min(1.8, Math.max(0.22, LAMV / (4 * Math.PI * (sp / 100))));
  const vis = useMemo<Vis>(() => ({ sig, R: Math.min(8, w.ratio), n: q === "low" ? 120 : CAP }), [sig, w.ratio, q]);
  const s = Math.min(6, Math.max(0.35, sp / 5));
  const spec = useMemo(() => Array.from({ length: 15 }, (_, j) => Math.exp(-((j - 7) ** 2) / (2 * s * s))), [s]);
  const name = pt === "e" ? "electron" : pt === "p" ? "proton" : "neutron";
  return (
    <LabFrame
      label="A de Broglie wave packet drawn as a glowing helix (real and imaginary parts, coloured by phase) inside a Gaussian envelope: the green dot rides the envelope at the group velocity while the red dot rides a crest at the phase velocity; below, the probability density, and above, the spread of component wave numbers"
      camera={[0, 1.2, 11]}
      onReset={reset}
      scene={() => (<group>
        <Line points={[[XL - 0.3, 0, 0], [XL + W + 0.3, 0, 0]]} color={C.grey} lineWidth={1.5} />
        <Line points={[[XL - 0.3, -2.2, 0], [XL + W + 0.3, -2.2, 0]]} color={C.light} lineWidth={1.5} />
        <Packet v={vis} />
        <Bars values={spec} max={1} colors={[C.purple, C.blue, C.green, C.gold, C.orange, C.red]} x0={-2.1} y0={2.0} z={-1.5} w={0.22} gap={0.08} height={1.1} glow={0.4} />
        <Box p={[0, 1.96, -1.5]} s={[4.8, 0.04, 0.4]} c={C.dark} />
      </group>)}
      readouts={[
        ["de Broglie λ = h/p", `${fmtLen(w.lam)} (${name})`],
        ["Group velocity v_g = dω/dk", `${sci(w.vg)} m/s (= particle v)`],
        ["Phase velocity v_p = ω/k", `${sci(w.vp)} m/s${w.vp > 2.99792458e8 ? " (> c)" : ""}`],
        ["v_p · v_g", conv === "rel" ? `${sci(w.prod)} m²/s² = c²` : `${sci(w.prod)} m²/s² = v²/2`],
        ["Momentum spread Δp", `${sci(w.dp)} kg m/s`],
        ["Smallest Δx = ħ/2Δp", fmtLen(w.dx)],
      ]}
      controls={<>
        <Slider label="Speed exponent: v = 10^x m/s" value={lgv} min={2} max={8.4} step={0.01} digits={4} onChange={(x) => set("lgv", x)} />
        <Slider label="Momentum spread Δp/p" value={sp} min={0.001} max={50} step={0.001} digits={3} unit=" %" onChange={(x) => set("sp", x)} />
        <Pick label="Particle" value={pt} options={[{ id: "e", label: "Electron" }, { id: "p", label: "Proton" }, { id: "n", label: "Neutron" }]} onChange={(x) => set("pt", x)} />
        <Pick label="Energy counted in ω = E/ħ" value={conv} options={[{ id: "rel", label: "Total energy E = γmc² (v_p = c²/v)" }, { id: "kin", label: "Kinetic energy only E = p²/2m (v_p = v/2)" }]} onChange={(x) => set("conv", x)} />
      </>}
      note={<>
        <p>A moving particle has a <b>de Broglie wavelength λ = h/p</b>. A single wave e<sup>i(kx − ωt)</sup> fills all space, so a localised particle is a <b>wave packet</b>: many waves with wave numbers spread by Δk (the bars above) add up to a lump. Its <b>crests</b> move at the <b>phase velocity v<sub>p</sub> = ω/k</b> (red dot), but the lump itself, and the energy and probability it carries, moves at the <b>group velocity v<sub>g</sub> = dω/dk</b> (green dot). With E = ħω and p = ħk, v<sub>g</sub> = dE/dp = v, the particle’s speed. Counting the rest energy (E = γmc²) gives <b>v<sub>p</sub> = c²/v &gt; c</b> and <b>v<sub>p</sub>v<sub>g</sub> = c²</b>; this breaks no law because crests carry no information. (Counting only kinetic energy gives v<sub>p</sub> = v/2: the phase velocity is convention-dependent, the group velocity is not.)</p>
        <p className="mt-2">Squeeze the spread of wave numbers and the packet gets longer: for this Gaussian packet <b>Δx·Δp = ħ/2</b> exactly, the minimum allowed by <b>Heisenberg’s uncertainty principle</b> Δx·Δp ≥ ħ/2. <b>Try</b> the PYQ (an electron at 500 m/s measured to 0.002 %): Δx ≥ 5.8 mm. On screen the crest speed is capped at 8 × the envelope speed, the packet width is clamped, and spreading of the packet with time is not shown.</p>
      </>}
    />
  );
}
