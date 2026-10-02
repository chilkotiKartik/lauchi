"use client";
import { Line } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { SEMIS, ekBand, nmHex, sci, type Semi } from "../sim/phyy";
import { Tick, useQuality } from "../Stage";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { PHYY_SPECS } from "../meta/phyy.specs";
import { C } from "../kit";
import { Arrow, mix } from "../kit2";

const KM = 1.15, KS = 2.6, Q = 0.85, AC = 2.0, AV = 1.4, AX = 1.6, CB_TOP = 1.8, VB_BOT = -1.6;
const _a = new THREE.Color(), _b = new THREE.Color(), _m = new THREE.Color();

/** Conduction band E(kx, kz) in eV (k in units of the zone-edge wave number): one valley at Γ for a direct gap, side valleys at ±k₀ otherwise. */
function cb(kx: number, kz: number, Eg: number, EG: number, k0: number, direct: boolean) {
  const g = (direct ? Eg : EG) + AC * (kx * kx + kz * kz);
  if (direct) return g;
  const sx = Eg + AX * ((Math.abs(kx) - k0) ** 2 + kz * kz), sz = Eg + AX * ((Math.abs(kz) - k0) ** 2 + kx * kx);
  return Math.min(g, sx, sz);
}
/** A band surface over the k-plane; colour runs from c0 at the band edge (lo for the conduction band, hi for the valence band) to c1. */
function bandGeometry(f: (kx: number, kz: number) => number, lo: number, hi: number, c0: string, c1: string, seg: number, edgeAtTop: boolean) {
  const g = new THREE.PlaneGeometry(2 * KM * KS, 2 * KM * KS, seg, seg);
  g.rotateX(-Math.PI / 2);
  const p = g.attributes.position, col = new Float32Array(p.count * 3);
  _a.set(c0); _b.set(c1);
  for (let i = 0; i < p.count; i++) {
    const E = Math.min(hi, Math.max(lo, f(p.getX(i) / KS, p.getZ(i) / KS)));
    p.setY(i, E * Q);
    const t = Math.abs(E - (edgeAtTop ? hi : lo)) / Math.max(1e-6, hi - lo);
    _m.copy(_a).lerp(_b, t);
    col[3 * i] = _m.r; col[3 * i + 1] = _m.g; col[3 * i + 2] = _m.b;
  }
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  g.computeVertexNormals();
  return g;
}

type Anim = { Eg: number; k0: number; direct: boolean };
type R = { el: THREE.Mesh; ho: THREE.Mesh; ph: THREE.Mesh; pn: THREE.Mesh };
/** One recombination every 3 s: the electron drops from the conduction-band minimum to the valence-band top, emitting a photon (and a phonon if it must change k). */
function paintRecomb(r: R, a: Anim, t: number) {
  const u = (t % 3) / 3, ex = a.k0 * KS, ey = a.Eg * Q;
  const fall = Math.min(1, Math.max(0, (u - 0.45) / 0.3)), out = Math.max(0, (u - 0.75) / 0.25);
  const bob = 0.04 * Math.sin(t * 6);
  r.el.visible = u < 0.76; r.ho.visible = u < 0.76;
  r.el.position.set(ex * (1 - fall), ey * (1 - fall) + 0.12 + bob, 0);
  r.ho.position.set(0, -0.1 - bob, 0);
  r.ph.visible = u > 0.75;
  r.ph.position.set(0.3 + out * 3, 0.1 + out * 2.2, 0.25 * Math.sin(out * 30));
  r.ph.scale.setScalar(a.direct ? 1 : 0.55);
  r.pn.visible = !a.direct && u > 0.5 && u < 0.95;
  const v = Math.max(0, (u - 0.5) / 0.45);
  r.pn.position.set(ex * 0.5 + v * 2.2, ey * 0.5 - 0.3 - v * 0.6, 0.15 * Math.sin(v * 40));
}
function Recombination({ a, photon }: { a: Anim; photon: string }) {
  const el = useRef<THREE.Mesh>(null), ho = useRef<THREE.Mesh>(null), ph = useRef<THREE.Mesh>(null), pn = useRef<THREE.Mesh>(null), t = useRef(0.2);
  const tick = (dt: number) => { t.current += Math.min(dt, 0.05); if (el.current && ho.current && ph.current && pn.current) paintRecomb({ el: el.current, ho: ho.current, ph: ph.current, pn: pn.current }, a, t.current); };
  return (<>
    <Tick fn={tick} />
    <mesh ref={el} position={[a.k0 * KS, a.Eg * Q + 0.12, 0]}><sphereGeometry args={[0.13, 16, 16]} /><meshStandardMaterial color={C.gold} emissive={C.gold} emissiveIntensity={0.9} /></mesh>
    <mesh ref={ho} position={[0, -0.1, 0]}><sphereGeometry args={[0.13, 16, 16]} /><meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.4} transparent opacity={0.8} /></mesh>
    <mesh ref={ph} visible={false}><sphereGeometry args={[0.15, 16, 16]} /><meshStandardMaterial color={photon} emissive={photon} emissiveIntensity={1.2} /></mesh>
    <mesh ref={pn} visible={false}><boxGeometry args={[0.18, 0.18, 0.18]} /><meshStandardMaterial color={C.green} emissive={C.green} emissiveIntensity={0.8} /></mesh>
  </>);
}

const MATS: { id: Semi; label: string }[] = [
  { id: "gaas", label: "GaAs (direct)" }, { id: "si", label: "Silicon (indirect)" }, { id: "ge", label: "Germanium (indirect)" }, { id: "gan", label: "GaN (direct)" }, { id: "inp", label: "InP (direct)" },
];

export default function EkBandLab() {
  const qu = useQuality();
  const [P, set, reset] = useLabParams(PHYY_SPECS.ekband);
  const { T, E, mat } = P;
  const s = SEMIS[mat], o = ekBand(mat, T, E), k0 = s.kmin;
  const seg = qu === "low" ? 28 : 48;
  const cbGeo = useMemo(() => bandGeometry((x, z) => cb(x, z, o.Eg, o.EG, k0, s.direct), o.Eg, o.Eg + CB_TOP, C.blue, C.purple, seg, false), [o.Eg, o.EG, k0, s.direct, seg]);
  const vbGeo = useMemo(() => bandGeometry((x, z) => -AV * (x * x + z * z), VB_BOT, 0, C.orange, C.red, seg, true), [seg]);
  const photon = o.lamNm >= 380 && o.lamNm <= 780 ? nmHex(o.lamNm) : o.lamNm > 780 ? "#ff3b3b" : C.purple;
  const anim = useMemo<Anim>(() => ({ Eg: o.Eg, k0: s.direct ? 0 : k0, direct: s.direct }), [o.Eg, k0, s.direct]);
  const tip: [number, number, number] = [0, E * Q, 0];
  const arrowCol = o.absorb === "none" ? C.grey : o.absorb === "direct" ? C.orange : C.gold;
  const absorbText = o.absorb === "none" ? "No: hν < E_g, crystal is transparent" : o.absorb === "direct" ? "Yes, strongly (vertical transition)" : "Weakly: needs a phonon to supply ħk";
  return (
    <LabFrame
      label="Energy–momentum band surfaces of a semiconductor: a red-orange valence band bowl opening downward and a blue-purple conduction band above it; an electron (gold) at the conduction-band minimum drops to a hole at the valence-band top and emits a photon, straight down for a direct gap, or diagonally with a green phonon for an indirect gap; an orange arrow shows the chosen photon energy"
      camera={[4.6, 3.4, 7.6]}
      onReset={reset}
      scene={() => (<group position={[0, -0.9, 0]}>
        <mesh geometry={cbGeo}><meshStandardMaterial vertexColors side={THREE.DoubleSide} transparent opacity={0.88} roughness={0.5} /></mesh>
        <mesh geometry={cbGeo}><meshBasicMaterial color={C.white} wireframe transparent opacity={0.08} /></mesh>
        <mesh geometry={vbGeo}><meshStandardMaterial vertexColors side={THREE.DoubleSide} transparent opacity={0.88} roughness={0.5} /></mesh>
        <mesh geometry={vbGeo}><meshBasicMaterial color={C.white} wireframe transparent opacity={0.08} /></mesh>
        <Line points={[[-KM * KS, (o.Eg * Q) / 2, -KM * KS], [KM * KS, (o.Eg * Q) / 2, -KM * KS]]} color={C.green} lineWidth={1.5} dashed dashSize={0.15} gapSize={0.1} />
        <Line points={[[-KM * KS - 0.2, 0, -KM * KS], [KM * KS + 0.2, 0, -KM * KS]]} color={C.light} lineWidth={1.6} />
        <Line points={[[-KM * KS, VB_BOT * Q, -KM * KS], [-KM * KS, (o.Eg + CB_TOP) * Q + 0.2, -KM * KS]]} color={C.light} lineWidth={1.6} />
        <Arrow from={[0, 0.02, 0.35]} to={[tip[0], tip[1], 0.35]} color={arrowCol} r={0.035} head={0.22} />
        {o.absorb === "phonon" && <Line points={[[0, tip[1], 0.35], [k0 * KS, o.Eg * Q, 0]]} color={C.green} lineWidth={2} dashed dashSize={0.1} gapSize={0.07} />}
        <Recombination a={anim} photon={photon} />
        <mesh position={[0, (o.Eg * Q) / 2, -KM * KS - 0.02]}><planeGeometry args={[2 * KM * KS, o.Eg * Q]} /><meshBasicMaterial color={mix("#0f1a20", C.green, 0.12)} transparent opacity={0.6} /></mesh>
      </group>)}
      readouts={[
        ["Band gap E_g(T)", `${o.Eg.toFixed(3)} eV (${s.name})`],
        ["Gap type", s.direct ? "Direct: CB minimum at k = 0" : `Indirect: CB minimum at ${s.kmin} × zone edge`],
        ["Emission λ = 1.24/E_g µm", `${(o.lamNm / 1000).toFixed(3)} µm ${s.direct ? "(bright)" : "(very weak)"}`],
        ["Crystal momentum to shed", s.direct ? "≈ 0 (photon's k is enough)" : `≈ ${sci(o.kRatio, 2)} × the photon's k`],
        ["Photon of hν absorbed?", absorbText],
        ["Intrinsic nᵢ at T", `${sci(o.ni)} cm⁻³`],
      ]}
      controls={<>
        <Slider label="Temperature T" value={T} min={1} max={600} step={1} digits={0} unit=" K" onChange={(x) => set("T", x)} />
        <Slider label="Incoming photon energy hν" value={E} min={0.3} max={4} step={0.01} digits={2} unit=" eV" onChange={(x) => set("E", x)} />
        <Pick label="Semiconductor" value={mat} options={MATS} onChange={(x) => set("mat", x)} />
      </>}
      note={<>
        <p>An <b>E–k diagram</b> plots electron energy against crystal momentum ħk. The valence band (red) peaks at k = 0. In a <b>direct band-gap</b> material (GaAs, InP, GaN) the conduction-band minimum (blue) sits at the same k, so an electron can fall straight down and give all its energy to a photon of λ = hc/E<sub>g</sub> = 1.24/E<sub>g</sub> µm: these make <b>LEDs and laser diodes</b>. In an <b>indirect</b> material (Si, Ge) the minimum lies far out in k. A photon carries almost no momentum (its k is about a thousand times too small), so the jump also needs a <b>phonon</b> (lattice vibration, green) to take up ħk. Three-body events are rare, so Si and Ge emit very little light and electrons mostly lose their energy as heat; they absorb weakly near E<sub>g</sub> too, which is why silicon solar cells must be thick.</p>
        <p className="mt-2">The gap shrinks as the lattice warms (Varshni: E<sub>g</sub> = E<sub>g0</sub> − αT²/(T + β)), and the intrinsic carrier density <b>nᵢ = √(N<sub>c</sub>N<sub>v</sub>) e^(−E<sub>g</sub>/2kT)</b> rises steeply; the green dashed line marks the intrinsic Fermi level near mid-gap. <b>Try:</b> compare GaAs and Si, then set hν between E<sub>g</sub> and the direct gap. Band shapes are schematic (parabolic, a 2-D slice of k-space).</p>
      </>}
    />
  );
}
