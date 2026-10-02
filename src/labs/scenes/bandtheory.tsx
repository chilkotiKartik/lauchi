"use client";
import { Line } from "@react-three/drei";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { bands, KB_EV, nmToHex, rng, sci, type Doping } from "../sim/chemy";
import { Tick, useQuality } from "../Stage";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { CHEMY_SPECS } from "../meta/chemy.specs";
import { C, Instances, Shuttle, type Inst } from "../kit";
import { Graph, type XY } from "../kit2";

const SCALE = 0.55, BAND = 1.6, W = 3.4, D = 1.4, X0 = -2.2, CAP = 40;
const _o = new THREE.Object3D();

/** Carriers wander inside their band slab. */
function paintCarriers(m: THREE.InstancedMesh, seeds: Float32Array, n: number, yLo: number, yHi: number, t: number) {
  for (let i = 0; i < CAP; i++) {
    if (i >= n) { _o.position.set(0, -999, 0); _o.scale.setScalar(0.0001); }
    else {
      const sx = seeds[i * 4], sy = seeds[i * 4 + 1], sz = seeds[i * 4 + 2], ph = seeds[i * 4 + 3] * 6.283;
      const x = X0 + (sx - 0.5) * W * 0.9 + 0.25 * Math.sin(t * 1.3 + ph);
      const y = yLo + (yHi - yLo) * (0.15 + 0.7 * sy) + 0.1 * Math.sin(t * 2.1 + ph * 2);
      const z = (sz - 0.5) * D * 0.8 + 0.15 * Math.cos(t * 1.7 + ph);
      _o.position.set(x, y, z); _o.scale.setScalar(1);
    }
    _o.updateMatrix(); m.setMatrixAt(i, _o.matrix);
  }
  m.instanceMatrix.needsUpdate = true;
}

function Carriers({ n, yLo, yHi, color, seed }: { n: number; yLo: number; yHi: number; color: string; seed: number }) {
  const ref = useRef<THREE.InstancedMesh>(null), t = useRef(0);
  const seeds = useMemo(() => { const r = rng(seed), a = new Float32Array(CAP * 4); for (let i = 0; i < a.length; i++) a[i] = r(); return a; }, [seed]);
  useLayoutEffect(() => { if (ref.current) paintCarriers(ref.current, seeds, n, yLo, yHi, t.current); }, [seeds, n, yLo, yHi]);
  const tick = (dt: number) => { t.current += Math.min(dt, 0.05); if (ref.current) paintCarriers(ref.current, seeds, n, yLo, yHi, t.current); };
  return (<>
    <Tick fn={tick} />
    <instancedMesh ref={ref} args={[undefined, undefined, CAP]} frustumCulled={false}>
      <sphereGeometry args={[0.09, 12, 12]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} />
    </instancedMesh>
  </>);
}

const dots = (x: number) => (x <= 1 ? 0 : Math.round(Math.min(1, Math.max(0, (Math.log10(x) - 2) / 20)) * CAP));

export default function BandTheoryLab() {
  const [P, set, reset] = useLabParams(CHEMY_SPECS.bandtheory);
  const { Eg, T, dop } = P;
  const q = useQuality();
  const b = bands(Eg, T, dop);
  const gap = b.metal ? -0.5 : Eg * SCALE;
  const yv = -gap / 2 - 0.2, yc = yv + gap;
  const levels = useMemo<Inst[]>(() => {
    const out: Inst[] = [], nl = q === "low" ? 6 : 10;
    for (let i = 0; i < nl; i++) {
      const f = i / (nl - 1);
      out.push({ p: [X0, yv - BAND + f * BAND, 0], s: [W, 0.05, D], c: new THREE.Color(C.blue).lerp(new THREE.Color("#1c5f8c"), 1 - f).getStyle() });
      out.push({ p: [X0, yc + f * BAND, 0], s: [W, 0.05, D], c: new THREE.Color(C.orange).lerp(new THREE.Color("#7a4310"), f).getStyle() });
    }
    return out;
  }, [yv, yc, q]);
  const nE = b.metal ? CAP : dots(b.n), nH = b.metal ? 0 : dots(b.p);
  const curve = useMemo<XY[]>(() => Array.from({ length: 76 }, (_, i) => { const t = 50 + i * 10, x = bands(Eg, t, dop); return [t, Math.log10(Math.max(1, dop === "none" ? x.ni : Math.max(x.n, x.p)))] as XY; }), [Eg, dop]);
  const curveI = useMemo<XY[]>(() => Array.from({ length: 76 }, (_, i) => { const t = 50 + i * 10; return [t, Math.log10(Math.max(1, bands(Eg, t, "none").ni))] as XY; }), [Eg]);
  const photon = b.metal ? null : nmToHex(b.edgeNm);
  const ef = yv + b.Ef * SCALE;
  return (
    <LabFrame
      label="Energy band diagram: a blue valence band and an orange conduction band separated by the forbidden gap; gold electrons wander in the conduction band and red holes in the valence band, a photon hops the gap, the gold dashed line is the Fermi level, and a graph shows log of carrier density against temperature"
      camera={[0.6, 1.2, 10.5]}
      onReset={reset}
      scene={() => (<group rotation={[0.08, 0.28, 0]}>
        <Instances items={levels} cap={20} shape="box" />
        <mesh position={[X0, b.metal ? yv : (yv + yc) / 2, 0]}>
          <boxGeometry args={[W, Math.max(0.02, Math.abs(gap)), D]} />
          <meshStandardMaterial color={b.metal ? C.green : C.purple} transparent opacity={0.12} />
        </mesh>
        <Carriers n={nE} yLo={b.metal ? yv - 0.6 : yc} yHi={b.metal ? yv : yc + BAND} color={C.gold} seed={3} />
        <Carriers n={nH} yLo={yv - 0.6} yHi={yv} color={C.red} seed={9} />
        {!b.metal && <Line points={[[X0 - W / 2 - 0.2, ef, D / 2], [X0 + W / 2 + 0.2, ef, D / 2]]} color={C.gold} lineWidth={2} dashed dashSize={0.15} gapSize={0.1} />}
        {!b.metal && dop === "n" && <Line points={[[X0 - W / 2, yc - 0.15, 0], [X0 + W / 2, yc - 0.15, 0]]} color={C.green} lineWidth={2.5} dashed dashSize={0.08} gapSize={0.12} />}
        {!b.metal && dop === "p" && <Line points={[[X0 - W / 2, yv + 0.15, 0], [X0 + W / 2, yv + 0.15, 0]]} color={C.purple} lineWidth={2.5} dashed dashSize={0.08} gapSize={0.12} />}
        {photon && <Shuttle from={[X0 + 1.1, yv, D / 2 + 0.2]} to={[X0 + 1.1, yc, D / 2 + 0.2]} speed={0.5} r={0.11} c={photon} />}
        {photon && <Line points={[[X0 + 1.1, yv, D / 2 + 0.2], [X0 + 1.1, yc, D / 2 + 0.2]]} color={photon} lineWidth={1.5} />}
        <Graph x0={1.2} y0={-2.2} w={3.4} h={3.6} xr={[50, 800]} yr={[0, 24]} curves={[{ pts: curveI, color: C.blue, w: 2, dashed: dop !== "none" }, ...(dop !== "none" ? [{ pts: curve, color: dop === "n" ? C.green : C.purple }] : [])]} marker={[T, Math.log10(Math.max(1, dop === "none" ? b.ni : Math.max(b.n, b.p)))]} markerColor={C.gold} />
      </group>)}
      readouts={[
        ["Class", b.cls],
        ["Band gap E_g", b.metal ? "0 (overlap)" : `${Eg.toFixed(2)} eV = ${(Eg / (KB_EV * T)).toFixed(0)} kT`],
        ["Intrinsic carriers n_i", b.metal ? "≈ 8.5 × 10²² cm⁻³ (free e⁻)" : `${sci(b.ni)} cm⁻³`],
        ["Electrons n / holes p", b.metal ? "electron sea" : `${sci(b.n, 1)} / ${sci(b.p, 1)} cm⁻³`],
        ["Fermi level above E_V", b.metal ? "inside the band" : `${b.Ef.toFixed(3)} eV`],
        ["Absorption edge hc/E_g", b.metal ? "none (absorbs all)" : `${b.edgeNm.toFixed(0)} nm`],
      ]}
      controls={<>
        <Slider label="Band gap E_g" value={Eg} min={0} max={6} step={0.01} digits={2} unit=" eV" onChange={(x) => set("Eg", x)} />
        <Slider label="Temperature" value={T} min={50} max={800} step={5} digits={0} unit=" K" onChange={(x) => set("T", x)} />
        <Pick label="Doping (10¹⁶ cm⁻³)" value={dop} options={[{ id: "none", label: "Intrinsic (pure)" }, { id: "n", label: "n-type (donor, e.g. P in Si)" }, { id: "p", label: "p-type (acceptor, e.g. B in Si)" }] as { id: Doping; label: string }[]} onChange={(x) => set("dop", x)} />
      </>}
      note={<>
        <p>When N atoms come together their orbitals combine into N closely spaced molecular orbitals — a <b>band</b>. The filled <b>valence band</b> (blue) and the empty <b>conduction band</b> (orange) are separated by the <b>forbidden gap</b> E_g. In a <b>conductor</b> the bands overlap (E_g = 0), so electrons move freely. In a <b>semiconductor</b> (E_g ≈ 0.1–3 eV) heat lifts a few electrons across, leaving <b>holes</b>: n_i = √(N_c N_v)·e^(−E_g/2kT). In an <b>insulator</b> (E_g &gt; 3 eV) almost none make it.</p>
        <p className="mt-2"><b>Try:</b> raise the temperature for Si and watch n_i climb (conductivity of semiconductors rises with T, that of metals falls). Dope it: donors (green level just below the conduction band) give n ≈ N_D and push the Fermi level up. Light with λ shorter than hc/E_g can bridge the gap. Simplified model: one effective density of states for every solid.</p>
      </>}
    />
  );
}
