"use client";
import { useLayoutEffect, useMemo, useRef } from "react";
import { useThree } from "@react-three/fiber";
import type * as THREE from "three";
import { DA_DH, DIENOPHILES, dielsAlder, sci, type Dienophile } from "../sim/chemy";
import { Tick } from "../Stage";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { CHEMY_SPECS } from "../meta/chemy.specs";
import { C } from "../kit";
import { Graph, type XY } from "../kit2";
import { EL, RodMesh, placeRod } from "./chemy-kit";

type P3 = [number, number, number];
const RING = 1.35;
const ANG = [180, 120, 60, 0, -60, -120].map((d) => (d * Math.PI) / 180);
const PROD: P3[] = ANG.map((a, i) => [RING * Math.cos(a), i < 4 ? 0.18 : -0.18, RING * Math.sin(a)]);
const REAC: P3[] = ANG.map((a, i) => (i < 4 ? [RING * 1.08 * Math.cos(a), 1.35, RING * 1.02 * Math.sin(a)] : [RING * 0.95 * Math.cos(a), -1.35, RING * 0.95 * Math.sin(a) + 0.15]));
/** σ skeleton, π bonds (start order → end order), forming σ bonds. */
const SIGMA: [number, number][] = [[0, 1], [1, 2], [2, 3], [4, 5]];
const PI: { b: [number, number]; from: number; to: number }[] = [{ b: [0, 1], from: 1, to: 0 }, { b: [1, 2], from: 0, to: 1 }, { b: [2, 3], from: 1, to: 0 }, { b: [4, 5], from: 1, to: 0 }];
const FORM: [number, number][] = [[3, 4], [5, 0]];
/** Lobes above/below C1, C4 (diene HOMO ψ₂: +, −) and C5, C6 (dienophile LUMO π*: +, −); sign of the TOP lobe. */
const LOBES: { atom: number; top: number }[] = [{ atom: 0, top: 1 }, { atom: 3, top: -1 }, { atom: 4, top: 1 }, { atom: 5, top: -1 }];
/** Substituents on C5 / C6: [host atom, element, outward distance, height]. */
const SUBS: Record<Dienophile, [number, string, number, number][]> = {
  ethene: [[4, "H", 0.75, -0.35], [5, "H", 0.75, -0.35], [4, "H", 0.6, 0.45], [5, "H", 0.6, 0.45]],
  acrolein: [[4, "C", 1.0, -0.3], [4, "O", 1.8, -0.55], [5, "H", 0.75, -0.35]],
  maleic: [[4, "C", 1.0, -0.3], [5, "C", 1.0, -0.3], [4, "O", 1.75, -0.2], [5, "O", 1.75, -0.2], [-1, "O", 1.55, -0.4]],
};

const ease = (x: number) => x * x * (3 - 2 * x);
type Refs = { atoms: (THREE.Mesh | null)[]; sig: (THREE.Mesh | null)[]; pi: (THREE.Mesh | null)[]; form: (THREE.Mesh | null)[]; lobes: (THREE.Mesh | null)[]; subs: (THREE.Mesh | null)[]; dot: THREE.Mesh | null };
const cur: P3[] = PROD.map(() => [0, 0, 0]);

function pose(R: Refs, s: number, dn: Dienophile, mapE: (x: number) => [number, number]) {
  for (let i = 0; i < 6; i++) {
    for (let k = 0; k < 3; k++) cur[i][k] = REAC[i][k] + (PROD[i][k] - REAC[i][k]) * s;
    R.atoms[i]?.position.set(cur[i][0], cur[i][1], cur[i][2]);
  }
  SIGMA.forEach(([a, b], j) => placeRod(R.sig[j], ...cur[a], ...cur[b], 0.07));
  PI.forEach((p, j) => {
    const o = p.from + (p.to - p.from) * s, [a, b] = p.b, m = R.pi[j];
    if (!m) return;
    m.visible = o > 0.04;
    placeRod(m, cur[a][0], cur[a][1] + 0.16, cur[a][2], cur[b][0], cur[b][1] + 0.16, cur[b][2], 0.05 * Math.max(0.05, o));
  });
  FORM.forEach(([a, b], j) => { const m = R.form[j]; if (!m) return; m.visible = s > 0.12; placeRod(m, ...cur[a], ...cur[b], 0.02 + 0.05 * s); });
  LOBES.forEach((l, j) => {
    const c = cur[l.atom], k = Math.max(0.001, 1 - s);
    R.lobes[2 * j]?.position.set(c[0], c[1] + 0.32 * k, c[2]); R.lobes[2 * j]?.scale.set(k, k, k);
    R.lobes[2 * j + 1]?.position.set(c[0], c[1] - 0.32 * k, c[2]); R.lobes[2 * j + 1]?.scale.set(k, k, k);
  });
  SUBS[dn].forEach(([host, , d, h], j) => {
    const m = R.subs[j]; if (!m) return;
    if (host < 0) { const x = (cur[4][0] + cur[5][0]) / 2, z = (cur[4][2] + cur[5][2]) / 2, y = (cur[4][1] + cur[5][1]) / 2, r = Math.hypot(x, z) || 1; m.position.set(x + (x / r) * d, y + h, z + (z / r) * d); return; }
    const c = cur[host], r = Math.hypot(c[0], c[2]) || 1;
    m.position.set(c[0] + (c[0] / r) * d * 0.8, c[1] + h, c[2] + (c[2] / r) * d * 0.8);
  });
  const [ex, ey] = mapE(s);
  R.dot?.position.set(ex, ey, 0.05);
}

const GX = 1.5, GY = -1.6, GW = 3.2, GH = 3.2;
function energy(x: number, Ea: number) { const ts = 0.45; return x < ts ? (Ea * (1 - Math.cos((Math.PI * x) / ts))) / 2 : DA_DH + ((Ea - DA_DH) * (1 + Math.cos((Math.PI * (x - ts)) / (1 - ts)))) / 2; }

function Scene({ playing, xi, dn, Ea, yr }: { playing: boolean; xi: number; dn: Dienophile; Ea: number; yr: [number, number] }) {
  const refs = useRef<Refs>({ atoms: [], sig: [], pi: [], form: [], lobes: [], subs: [], dot: null });
  const t = useRef(0);
  const invalidate = useThree((s) => s.invalidate);
  const prof = useMemo<XY[]>(() => Array.from({ length: 81 }, (_, i) => [i / 80, energy(i / 80, Ea)] as XY), [Ea]);
  const mapE = (s: number): [number, number] => [GX + GW * s, GY + (GH * (energy(s, Ea) - yr[0])) / (yr[1] - yr[0])];
  useLayoutEffect(() => { if (!playing) { pose(refs.current, xi, dn, mapE); invalidate(); } });
  const tick = (dt: number) => {
    if (!playing) return;
    t.current = (t.current + Math.min(dt, 0.05) * 0.18) % 1.25;
    pose(refs.current, ease(Math.min(1, t.current)), dn, mapE);
  };
  const subs = SUBS[dn];
  return (<group>
    <Tick fn={tick} />
    <group position={[-1.4, 0, 0]} rotation={[0.15, -0.35, 0]}>
      {PROD.map((_, i) => <mesh key={i} ref={(m) => { refs.current.atoms[i] = m; }}><sphereGeometry args={[0.24, 18, 18]} /><meshStandardMaterial color={EL.C} roughness={0.35} /></mesh>)}
      {SIGMA.map((_, j) => <RodMesh key={j} color={C.light} refCb={(m) => { refs.current.sig[j] = m; }} />)}
      {PI.map((_, j) => <RodMesh key={j} color={C.blue} glow={0.4} refCb={(m) => { refs.current.pi[j] = m; }} />)}
      {FORM.map((_, j) => <RodMesh key={j} color={C.gold} glow={0.6} refCb={(m) => { refs.current.form[j] = m; }} />)}
      {LOBES.flatMap((l, j) => [l.top, -l.top].map((sg, k) => (
        <mesh key={`${j}${k}`} ref={(m) => { refs.current.lobes[2 * j + k] = m; }}>
          <sphereGeometry args={[0.2, 14, 14]} />
          <meshStandardMaterial color={sg > 0 ? C.green : C.purple} emissive={sg > 0 ? C.green : C.purple} emissiveIntensity={0.4} transparent opacity={0.7} />
        </mesh>)))}
      {subs.map(([, el], j) => <mesh key={`${dn}${j}`} ref={(m) => { refs.current.subs[j] = m; }}><sphereGeometry args={[el === "H" ? 0.13 : 0.2, 14, 14]} /><meshStandardMaterial color={EL[el]} roughness={0.35} /></mesh>)}
    </group>
    <Graph x0={GX} y0={GY} w={GW} h={GH} xr={[0, 1]} yr={yr} curves={[{ pts: prof, color: C.orange, w: 3 }]} />
    <mesh ref={(m) => { refs.current.dot = m; }} position={[GX, GY, 0.05]}><sphereGeometry args={[0.11, 16, 16]} /><meshStandardMaterial color={C.red} emissive={C.red} emissiveIntensity={0.7} /></mesh>
  </group>);
}

export default function DielsAlderLab() {
  const [P, set, reset] = useLabParams(CHEMY_SPECS.dielsalder);
  const { T, c0, xi, dn } = P;
  const d = dielsAlder(T, dn, c0), info = DIENOPHILES[dn];
  const Ea = info.Ea, yr: [number, number] = [DA_DH - 20, Ea + 25];
  return (
    <LabFrame
      label="Butadiene (top, four grey carbons) and a dienophile (bottom) approach face to face; green and purple p-orbital lobes of matching phase overlap, two gold sigma bonds form and the six carbons close into a ring, while a dot moves along the reaction energy profile over the activation barrier"
      camera={[0.4, 2.6, 8.8]}
      onReset={reset}
      scene={(playing) => <Scene playing={playing} xi={xi} dn={dn} Ea={Ea} yr={yr} />}
      readouts={[
        ["ΔG = ΔH − TΔS", `${d.dG.toFixed(1)} kJ/mol (${d.spont ? "forward favoured" : "retro favoured"})`],
        ["Equilibrium constant K", `10^${d.log10K.toFixed(1)}`],
        ["Ceiling temperature ΔH/ΔS", `${d.Tc.toFixed(0)} K`],
        ["Rate constant k", `${sci(d.k)} L mol⁻¹ s⁻¹`],
        ["Half-life at c₀", d.half > 3.15e9 ? "> 100 years" : d.half > 86400 ? `${(d.half / 86400).toFixed(1)} days` : d.half > 3600 ? `${(d.half / 3600).toFixed(1)} h` : d.half > 60 ? `${(d.half / 60).toFixed(1)} min` : `${d.half.toFixed(2)} s`],
        ["Product", `${info.product} (${info.stereo})`],
      ]}
      controls={<>
        <Slider label="Temperature" value={T} min={250} max={1100} step={1} digits={0} unit=" K" onChange={(x) => set("T", x)} />
        <Pick label="Dienophile" value={dn} options={(Object.keys(DIENOPHILES) as Dienophile[]).map((k) => ({ id: k, label: DIENOPHILES[k].name }))} onChange={(x) => set("dn", x)} />
        <Slider label="Starting concentration c₀" value={c0} min={0.1} max={5} step={0.1} digits={1} unit=" mol/L" onChange={(x) => set("c0", x)} />
        <Slider label="Reaction coordinate (when paused)" value={xi} min={0} max={1} step={0.01} digits={2} onChange={(x) => set("xi", x)} />
      </>}
      note={<>
        <p>The <b>Diels–Alder reaction</b> is a [4 + 2] <b>cycloaddition</b>: a conjugated diene in its s-cis form and a dienophile (an alkene) form a six-membered ring in <b>one concerted step</b> through a cyclic transition state. Three π bonds (blue) break, two new σ bonds (gold) and one new π bond (C2=C3) form; no intermediate, no catalyst needed. The diene&apos;s HOMO and the dienophile&apos;s LUMO overlap with matching phase (green with green, purple with purple) on the same face of both — suprafacial, thermally allowed.</p>
        <p className="mt-2">Electron-withdrawing groups (–CHO, –COOR, anhydride) on the dienophile lower its LUMO and speed the reaction enormously; the addition is <b>syn</b>, so cis groups stay cis (and cyclic dienes give the <b>endo</b> product). Joining two molecules into one loses entropy (ΔS ≈ −188 J/(mol·K)), so above T = ΔH/ΔS the <b>retro-Diels–Alder</b> wins.</p>
        <p className="mt-2"><b>Try:</b> pause and drag the reaction coordinate through the transition state; compare ethene with maleic anhydride at 320 K; heat past 900 K. Ea and A values are approximate literature figures; ΔH and ΔS are for butadiene + ethene (gas) and used for all three — a simplified model.</p>
      </>}
    />
  );
}
