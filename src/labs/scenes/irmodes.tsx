"use client";
import { useThree } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import type * as THREE from "three";
import { IR_MOLS, irMode, type IrMol, type MolDef } from "../sim/chemy";
import { Tick } from "../Stage";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { CHEMY_SPECS } from "../meta/chemy.specs";
import { C } from "../kit";
import { Arrow, Graph, type XY } from "../kit2";
import { EL, LiveArrow, RodMesh, aimArrow, placeRod } from "./chemy-kit";

const AMP = 0.22, DIP = 6;
type Refs = { atoms: (THREE.Mesh | null)[]; bonds: (THREE.Mesh | null)[]; shaft: THREE.Mesh | null; head: THREE.Mesh | null };
const pos: number[] = new Array(9).fill(0);

function pose(R: Refs, m: MolDef, vec: number[][], ph: number, mu0: [number, number, number]) {
  const k = AMP * Math.sin(ph);
  let mx = 0, my = 0, mz = 0;
  m.atoms.forEach((a, i) => {
    const x = a.p[0] + k * vec[i][0], y = a.p[1] + k * vec[i][1], z = a.p[2] + k * vec[i][2];
    pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
    mx += a.q * x; my += a.q * y; mz += a.q * z;
    R.atoms[i]?.position.set(x, y, z);
  });
  m.bonds.forEach(([a, b], j) => placeRod(R.bonds[j], pos[a * 3], pos[a * 3 + 1], pos[a * 3 + 2], pos[b * 3], pos[b * 3 + 1], pos[b * 3 + 2], 0.08));
  aimArrow(R.shaft, R.head, 0, 0, 0.9, (mx - mu0[0]) * DIP, (my - mu0[1]) * DIP, (mz - mu0[2]) * DIP, 0.045);
}

function Molecule({ mol, idx, playing, nu }: { mol: IrMol; idx: number; playing: boolean; nu: number }) {
  const m = IR_MOLS[mol];
  const vec = useMemo(() => { const v = m.modes[idx].vec, s = Math.max(...v.map((x) => Math.hypot(...x))) || 1; return v.map((x) => x.map((c) => c / s)); }, [m, idx]);
  const mu0 = useMemo<[number, number, number]>(() => m.atoms.reduce<[number, number, number]>((s, a) => [s[0] + a.q * a.p[0], s[1] + a.q * a.p[1], s[2] + a.q * a.p[2]], [0, 0, 0]), [m]);
  const refs = useRef<Refs>({ atoms: [], bonds: [], shaft: null, head: null }), t = useRef(0);
  const invalidate = useThree((s) => s.invalidate);
  useLayoutEffect(() => { if (!playing) { pose(refs.current, m, vec, Math.PI / 2, mu0); invalidate(); } });
  const tick = (dt: number) => { if (!playing) return; t.current += Math.min(dt, 0.05) * (2 + nu / 900); pose(refs.current, m, vec, t.current, mu0); };
  const mag = Math.hypot(...mu0);
  return (<group>
    <Tick fn={tick} />
    {m.atoms.map((a, i) => <mesh key={`${mol}${i}`} position={a.p} ref={(x) => { refs.current.atoms[i] = x; }}><sphereGeometry args={[a.el === "H" ? 0.24 : 0.36, 20, 20]} /><meshStandardMaterial color={EL[a.el]} roughness={0.3} emissive={EL[a.el]} emissiveIntensity={0.12} /></mesh>)}
    {m.bonds.map((_, j) => <RodMesh key={`${mol}b${j}`} color={C.light} refCb={(x) => { refs.current.bonds[j] = x; }} />)}
    {mag > 0.05 && <Arrow from={[0, 0, -0.9]} to={[mu0[0] * 2.2, mu0[1] * 2.2, -0.9]} color={C.grey} r={0.04} />}
    <LiveArrow color={C.gold} shaftRef={(x) => { refs.current.shaft = x; }} headRef={(x) => { refs.current.head = x; }} />
  </group>);
}

export default function IrModesLab() {
  const [P, set, reset] = useLabParams(CHEMY_SPECS.irmodes);
  const { k, iso, mol } = P;
  const m = IR_MOLS[mol], r = irMode(mol, k, iso);
  const sticks = useMemo(() => m.modes.map((_, j) => ({ ...irMode(mol, j + 1, iso), j })), [m, mol, iso]);
  const curves = sticks.map((s) => ({ pts: [[s.nu, 0], [s.nu, s.mode.ir ? 1 : 0.45]] as XY[], color: s.mode.ir ? C.gold : C.purple, w: s.j === r.idx ? 5 : 3, dashed: !s.mode.ir }));
  return (
    <LabFrame
      label="A ball-and-stick molecule vibrating in one normal mode; a gold arrow shows how much its dipole moment changes (none for IR-inactive modes), a grey arrow its permanent dipole, and a stick spectrum shows IR-active bands in gold and Raman-only bands in purple"
      camera={[0.3, 1.4, 9]}
      onReset={reset}
      scene={(playing) => (<group>
        <group position={[-2.1, 0.3, 0]} rotation={[0.2, -0.4, 0]}><Molecule mol={mol} idx={r.idx} playing={playing} nu={r.nu} /></group>
        <Graph x0={0.6} y0={-1.8} w={3.8} h={3.2} xr={[4000, 300]} yr={[0, 1.15]} curves={curves} marker={[r.nu, r.mode.ir ? 1 : 0.45]} markerColor={r.mode.ir ? C.gold : C.purple} />
      </group>)}
      readouts={[
        ["Vibrational modes", `${r.count} (3N − ${m.linear ? 5 : 6}, N = ${m.atoms.length})`],
        ["Mode shown", `${r.idx + 1} of ${r.shown}: ${r.mode.name}`],
        ["Wavenumber ν̃", `${r.nu.toFixed(0)} cm⁻¹ (λ = ${r.umWave.toFixed(2)} μm)`],
        ["IR active?", r.mode.ir ? "Yes: dipole moment changes" : "No: dipole does not change"],
        ["Raman active?", r.mode.raman ? "Yes: polarisability changes" : "No"],
        ["Isotope shift", iso === 1 ? "none (normal isotopes)" : `${r.nu0} → ${r.nu.toFixed(0)} cm⁻¹`],
      ]}
      controls={<>
        <Slider label="Normal mode number" value={k} min={1} max={4} step={1} digits={0} onChange={(x) => set("k", x)} />
        <Pick label="Molecule" value={mol} options={(Object.keys(IR_MOLS) as IrMol[]).map((x) => ({ id: x, label: IR_MOLS[x].name }))} onChange={(x) => set("mol", x)} />
        <Slider label="Isotope: mass × (H → D ≈ 2)" value={iso} min={1} max={2.5} step={0.001} digits={3} onChange={(x) => set("iso", x)} />
      </>}
      note={<>
        <p>A molecule of N atoms has 3N degrees of freedom: 3 translations, 3 rotations (2 if linear), and <b>3N − 6 vibrations (3N − 5 if linear)</b>. H₂O has 3: symmetric stretch (3652 cm⁻¹), bend (1595) and asymmetric stretch (3756). Linear CO₂ has 4: symmetric stretch (1388), two degenerate bends (667) and asymmetric stretch (2349).</p>
        <p className="mt-2"><b>Selection rule for IR:</b> a vibration absorbs infrared only if the <b>dipole moment changes</b> during it (gold arrow). So the CO₂ symmetric stretch, and homonuclear N₂, O₂, H₂, are IR inactive (but Raman active, which needs a change in polarisability); CO, HCl, H₂O all absorb. In molecules with a centre of symmetry, a mode cannot be both IR and Raman active (mutual exclusion). Below about 1400 cm⁻¹ many coupled bends and skeletal modes overlap into a pattern unique to each molecule — the <b>fingerprint region</b>.</p>
        <p className="mt-2"><b>Try:</b> step through the modes of each molecule; then set the isotope factor to 2 for H₂O: ν̃ = (1/2πc)√(k/μ), so a heavier atom lowers the wavenumber (O–D ≈ 2660 cm⁻¹). Isotope shifts use the reduced mass of one bond (harmonic, simplified); amplitudes are exaggerated.</p>
      </>}
    />
  );
}
