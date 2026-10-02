"use client";
import { Line } from "@react-three/drei";
import { useRef } from "react";
import type * as THREE from "three";
import { DIATOMICS, ELEMENT, atomFill, moFill, type Diatomic, type MoId } from "../sim/chem";
import { Tick } from "../Stage";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { CHEM_SPECS } from "../meta/chem.specs";

const AX = 3.5; // x of the atomic columns
/** Energy heights (scene y) of the atomic levels and of each MO. */
const ATOM_Y = { s1: -3.0, s2: -1.1, p: 0.7 };
const MO_Y = (mixed: boolean): Record<MoId, number> => ({
  s1s: -3.5, "s1s*": -2.5, s2s: -1.7, "s2s*": -0.45,
  ...(mixed ? { p2p: -0.1, s2p: 0.35 } : { s2p: -0.1, p2p: 0.4 }),
  "p2p*": 1.0, "s2p*": 1.45,
} as Record<MoId, number>);
const ATOM_COL = ["#9db0ba", "#ffc83d", "#a970ff", "#44c95a", "#ff9a1f", "#5b6d77", "#2ba6f5", "#ff5a5f", "#44c95a", "#a970ff"];

function Bar({ x, y, w, color }: { x: number; y: number; w: number; color: string }) {
  return <mesh position={[x, y, 0]}><boxGeometry args={[w, 0.07, 0.5]} /><meshStandardMaterial color={color} /></mesh>;
}
/** Up (blue) or down (orange) spin arrow: cone head on a short shaft. */
function Arrow({ x, y, up }: { x: number; y: number; up: boolean }) {
  const c = up ? "#ffc83d" : "#44c95a";
  return (
    <group position={[x, y + 0.02, 0.05]} rotation={[up ? 0 : Math.PI, 0, 0]}>
      <mesh position={[0, 0.2, 0]}><cylinderGeometry args={[0.025, 0.025, 0.36, 8]} /><meshStandardMaterial color={c} /></mesh>
      <mesh position={[0, 0.42, 0]}><coneGeometry args={[0.08, 0.16, 10]} /><meshStandardMaterial color={c} /></mesh>
    </group>
  );
}
function Slot({ cx, y, w, up, down, color }: { cx: number; y: number; w: number; up: boolean; down: boolean; color: string }) {
  return (<group>
    <Bar x={cx} y={y} w={w} color={color} />
    {up && <Arrow x={cx - w * 0.2} y={y} up />}
    {down && <Arrow x={cx + w * 0.2} y={y + 0.44} up={false} />}
  </group>);
}
/** x centres and bar widths for `deg` degenerate orbitals around x0. */
const slots = (x0: number, deg: number) => (deg === 1 ? { xs: [x0], w: 1.0 } : deg === 2 ? { xs: [x0 - 0.36, x0 + 0.36], w: 0.62 } : { xs: [x0 - 0.45, x0, x0 + 0.45], w: 0.4 });

function Atom({ x, e }: { x: number; e: number }) {
  const f = atomFill(e);
  const p = slots(x, 3);
  return (<group>
    <Slot cx={x} y={ATOM_Y.s1} w={1} up={f.s1 >= 1} down={f.s1 >= 2} color="#9db0ba" />
    <Slot cx={x} y={ATOM_Y.s2} w={1} up={f.s2 >= 1} down={f.s2 >= 2} color="#9db0ba" />
    {p.xs.map((cx, i) => <Slot key={i} cx={cx} y={ATOM_Y.p} w={p.w} up={i < f.pUp} down={i < f.pDown} color="#9db0ba" />)}
  </group>);
}

export default function MoTheoryLab() {
  const [P, set, reset] = useLabParams(CHEM_SPECS.motheory);
  const { charge, mol } = P;
  const setCharge = (x: (typeof P)["charge"]) => set("charge", x), setMol = (x: (typeof P)["mol"]) => set("mol", x);
  const r = moFill(mol as Diatomic, charge);
  const Z = ELEMENT[mol].Z;
  const eachAtom = Z; // neutral atoms on the sides; the ion charge changes only the molecular orbitals
  const y = MO_Y(r.mixed);
  const molG = useRef<THREE.Group>(null), elG = useRef<THREE.Group>(null), t = useRef(0);
  const tick = (dt: number) => {
    t.current += Math.min(dt, 0.05);
    if (molG.current) molG.current.rotation.y = t.current * 0.6;
    if (elG.current) elG.current.position.y = 0.03 * Math.sin(t.current * 2.5);
  };
  const bo = r.bondOrder;
  const gap = bo <= 0 ? 2.5 : 1.9 - 0.2 * Math.min(bo, 3);
  const bondR = 0.03 + 0.05 * Math.max(bo, 0);
  const col = ATOM_COL[Z - 1];
  const ns = (id: MoId) => (id === "p2p" || id === "p2p*" ? 2 : 1) as 1 | 2;
  const links: [number, number, number][] = [ // [atomic y, MO y, MO y] pairs drawn as dashed connectors
    [ATOM_Y.s1, y.s1s, y["s1s*"]], [ATOM_Y.s2, y.s2s, y["s2s*"]], [ATOM_Y.p, y.s2p, y["s2p*"]], [ATOM_Y.p, y.p2p, y["p2p*"]],
  ];
  return (
    <LabFrame
      label="Molecular orbital energy diagram: atomic levels on both sides, molecular orbitals in the middle filled with spin arrows, and a small rotating molecule whose bond thickness follows bond order"
      camera={[0, 0.4, 11.5]}
      onReset={reset}
      scene={() => (<group position={[0, -0.2, 0]}><Tick fn={tick} />
        <Line points={[[-AX - 1, -3.9, 0], [-AX - 1, 2, 0]]} color="#5b6d77" lineWidth={1.5} />
        {links.map(([ya, yb, yc], i) => (<group key={i}>
          {[-1, 1].map((s) => (<group key={s}>
            <Line points={[[s * (AX - 0.5), ya, 0], [s * 0.6, yb, 0]]} color="#33454e" lineWidth={1} dashed dashSize={0.1} gapSize={0.08} />
            <Line points={[[s * (AX - 0.5), ya, 0], [s * 0.6, yc, 0]]} color="#33454e" lineWidth={1} dashed dashSize={0.1} gapSize={0.08} />
          </group>))}
        </group>))}
        <group ref={elG}>
          <Atom x={-AX} e={eachAtom} />
          <Atom x={AX} e={eachAtom} />
          {r.levels.map((L) => {
            const s = slots(0, ns(L.id));
            return s.xs.map((cx, i) => (
              <Slot key={`${L.id}${i}`} cx={cx} y={y[L.id]} w={s.w} up={i < L.up} down={i < L.down} color={L.bonding ? "#2ba6f5" : "#ff5a5f"} />
            ));
          })}
        </group>
        <group ref={molG} position={[0, 3.0, 0]} scale={0.8}>
          <mesh position={[-gap / 2, 0, 0]}><sphereGeometry args={[0.42, 24, 24]} /><meshStandardMaterial color={col} /></mesh>
          <mesh position={[gap / 2, 0, 0]}><sphereGeometry args={[0.42, 24, 24]} /><meshStandardMaterial color={col} /></mesh>
          {bo > 0 && <mesh rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[bondR, bondR, gap, 16]} /><meshStandardMaterial color="#cfd8dc" /></mesh>}
        </group>
      </group>)}
      readouts={[
        ["Species", r.formula], ["Electrons", String(r.electrons)], ["Bond order ½(Nb − Na)", bo.toFixed(1)], ["Magnetic behaviour", r.magnetic], ["Stability", r.verdict], ["MO configuration", r.config],
      ]}
      controls={<>
        <Slider label="Ion charge" value={charge} min={-2} max={2} step={1} digits={0} unit=" e" onChange={setCharge} />
        <Pick label="Molecule" value={mol} options={DIATOMICS.map((m) => ({ id: m, label: `${ELEMENT[m].sym}₂` }))} onChange={setMol} />
      </>}
      note={<p>Two atoms (grey levels, left and right) combine their 1s, 2s and 2p atomic orbitals into bonding (blue, lower) and antibonding (red, higher) molecular orbitals in the middle, filled from the bottom by Aufbau, Pauli and Hund: one yellow (↑) then one green (↓) arrow per orbital, with degenerate π orbitals filled singly first. Bond order = ½ (bonding − antibonding electrons); paramagnetic means unpaired electrons. Up to N₂ (Z ≤ 7) s–p mixing pushes σ2p above π2p; from O₂ on, the normal order applies, which is why O₂ has two unpaired π* electrons. Try O₂⁺ (charge +1, bond order 2.5), O₂⁻ (1.5) and O₂²⁻ (1), or He₂ (0). The small molecule on top gets a thicker bond as the bond order rises; atom levels are schematic, not to scale.</p>}
    />
  );
}
