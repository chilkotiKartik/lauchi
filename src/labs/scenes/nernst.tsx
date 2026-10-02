"use client";
import { Line } from "@react-three/drei";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { CELLS, ION_CHARGE, mulberry32, nernstCell, fmtPow10, sup, type CellId, type Metal } from "../sim/chem";
import { Tick } from "../Stage";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { CHEM_SPECS } from "../meta/chem.specs";

const METAL: Record<Metal, { rod: string; sol: string }> = {
  Zn: { rod: "#9db0ba", sol: "#cfeaff" }, Fe: { rod: "#7d8a90", sol: "#8fe3a0" }, Cu: { rod: "#ff9a1f", sol: "#2ba6f5" }, Ag: { rod: "#e6edf0", sol: "#d8c8ff" },
};
const BX = 2.4; // beaker centre x
const PATH: [number, number][] = [[-BX, 1.6], [-BX, 2.5], [BX, 2.5], [BX, 1.6]];
const SEG = PATH.slice(1).map((p, i) => Math.hypot(p[0] - PATH[i][0], p[1] - PATH[i][1]));
const LEN = SEG.reduce((a, b) => a + b, 0), NE = 28;
const dummy = new THREE.Object3D();

/** Puts electron i at its place along the wire for the given phase (0..1 laps). Module-level so the per-frame work stays out of render. */
function placeElectrons(m: THREE.InstancedMesh, phase: number) {
  for (let i = 0; i < NE; i++) {
    let d = (((phase + i / NE) % 1) + 1) % 1 * LEN, k = 0;
    while (k < SEG.length - 1 && d > SEG[k]) { d -= SEG[k]; k++; }
    const f = d / SEG[k], a = PATH[k], b = PATH[k + 1];
    dummy.position.set(a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, 0);
    dummy.scale.setScalar(1); dummy.updateMatrix();
    m.setMatrixAt(i, dummy.matrix);
  }
  m.instanceMatrix.needsUpdate = true;
}
function Electrons({ speed }: { speed: number }) {
  const ref = useRef<THREE.InstancedMesh>(null), ph = useRef(0);
  useLayoutEffect(() => { if (ref.current) placeElectrons(ref.current, ph.current); }, []);
  const tick = (dt: number) => { ph.current += Math.min(dt, 0.05) * speed; if (ref.current) placeElectrons(ref.current, ph.current); };
  return (<>
    <Tick fn={tick} />
    <instancedMesh ref={ref} args={[undefined, undefined, NE]}><sphereGeometry args={[0.075, 10, 10]} /><meshStandardMaterial color="#7fd0ff" emissive="#2ba6f5" emissiveIntensity={0.9} /></instancedMesh>
  </>);
}
/** Ion dots in one beaker; more dots = more concentrated. */
function IonDots({ count, color, cx, seed }: { count: number; color: string; cx: number; seed: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const spots = useMemo(() => { const r = mulberry32(seed); return Array.from({ length: 40 }, () => { const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 0.95; return [cx + Math.cos(a) * d, -1.35 + r() * 1.7, Math.sin(a) * d] as const; }); }, [cx, seed]);
  useLayoutEffect(() => {
    const m = ref.current; if (!m) return;
    spots.forEach((s, i) => { dummy.position.set(s[0], s[1], s[2]); dummy.scale.setScalar(1); dummy.updateMatrix(); m.setMatrixAt(i, dummy.matrix); });
    m.count = count; m.instanceMatrix.needsUpdate = true;
  }, [spots, count]);
  return <instancedMesh ref={ref} args={[undefined, undefined, 40]}><sphereGeometry args={[0.09, 10, 10]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.25} /></instancedMesh>;
}
function Beaker({ x, metal, log, seed, rodTilt }: { x: number; metal: Metal; log: number; seed: number; rodTilt: number }) {
  const c = METAL[metal], f = Math.max(0, Math.min(1, (log + 4) / 5));
  return (<group>
    <mesh position={[x, -0.5, 0]}><cylinderGeometry args={[1.25, 1.25, 2.4, 28, 1, true]} /><meshStandardMaterial color="#9fd8ff" transparent opacity={0.16} side={2} /></mesh>
    <mesh position={[x, -0.75, 0]}><cylinderGeometry args={[1.2, 1.2, 1.9, 28]} /><meshStandardMaterial color={c.sol} transparent opacity={0.28 + 0.4 * f} /></mesh>
    <mesh position={[x, -1.7, 0]}><cylinderGeometry args={[1.25, 1.25, 0.06, 28]} /><meshStandardMaterial color="#5b6d77" /></mesh>
    <mesh position={[x, 0.1, 0]} rotation={[0, 0, rodTilt]}><boxGeometry args={[0.24, 3.0, 0.1]} /><meshStandardMaterial color={c.rod} metalness={0.5} roughness={0.35} /></mesh>
    <IonDots count={Math.round(4 + 32 * f)} color={c.sol} cx={x} seed={seed} />
  </group>);
}

export default function NernstLab() {
  const [P, set, reset] = useLabParams(CHEM_SPECS.nernst);
  const { logA, logC, T, cell } = P;
  const setCell = (x: (typeof P)["cell"]) => set("cell", x), setA = (x: (typeof P)["logA"]) => set("logA", x), setC = (x: (typeof P)["logC"]) => set("logC", x), setT = (x: (typeof P)["T"]) => set("T", x);
  const o = nernstCell(cell as CellId, logA, logC, T);
  const { anode, cathode } = CELLS[cell as CellId];
  const needle = -Math.max(-1, Math.min(1, o.E / 2)) * 1.3;
  const ionA = `${anode}${sup(`${ION_CHARGE[anode] === 1 ? "" : ION_CHARGE[anode]}+`)}`, ionC = `${cathode}${sup(`${ION_CHARGE[cathode] === 1 ? "" : ION_CHARGE[cathode]}+`)}`;
  return (
    <LabFrame
      label="Galvanic cell with two beakers, electrodes, a salt bridge, a wire with moving electrons and a voltmeter needle that shows the cell potential"
      camera={[0, 1.2, 10.5]}
      onReset={reset}
      scene={() => (<group position={[0, -0.6, 0]}>
        <Beaker x={-BX} metal={anode} log={logA} seed={11} rodTilt={0} />
        <Beaker x={BX} metal={cathode} log={logC} seed={23} rodTilt={0} />
        {/* salt bridge: inverted U */}
        <mesh position={[-1.6, 0.4, 0]}><cylinderGeometry args={[0.16, 0.16, 1.8, 14]} /><meshStandardMaterial color="#e8d9b0" /></mesh>
        <mesh position={[1.6, 0.4, 0]}><cylinderGeometry args={[0.16, 0.16, 1.8, 14]} /><meshStandardMaterial color="#e8d9b0" /></mesh>
        <mesh position={[0, 1.3, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.16, 0.16, 3.36, 14]} /><meshStandardMaterial color="#e8d9b0" /></mesh>
        {/* wire */}
        <Line points={[[-BX, 1.6, 0], [-BX, 2.5, 0], [-0.6, 2.5, 0]]} color="#ffc83d" lineWidth={3} />
        <Line points={[[0.6, 2.5, 0], [BX, 2.5, 0], [BX, 1.6, 0]]} color="#ffc83d" lineWidth={3} />
        <Electrons speed={0.25 * o.E} />
        {/* voltmeter */}
        <group position={[0, 2.5, 0.12]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.6, 0.6, 0.1, 28]} /><meshStandardMaterial color="#1c2b33" /></mesh>
          <mesh rotation={[0, 0, 0]}><torusGeometry args={[0.6, 0.045, 8, 32]} /><meshStandardMaterial color="#44c95a" /></mesh>
          <group rotation={[0, 0, needle]}><mesh position={[0, 0.22, 0.08]}><boxGeometry args={[0.05, 0.46, 0.03]} /><meshStandardMaterial color="#ff5a5f" emissive="#ff5a5f" emissiveIntensity={0.5} /></mesh></group>
          <mesh position={[0, 0, 0.09]}><sphereGeometry args={[0.06, 12, 12]} /><meshStandardMaterial color="#ffc83d" /></mesh>
        </group>
        {/* electron flow arrow marker on anode side: − and + electrode caps */}
        <mesh position={[-BX, 1.75, 0]}><sphereGeometry args={[0.1, 12, 12]} /><meshStandardMaterial color="#ff5a5f" /></mesh>
        <mesh position={[BX, 1.75, 0]}><sphereGeometry args={[0.1, 12, 12]} /><meshStandardMaterial color="#44c95a" /></mesh>
      </group>)}
      readouts={[
        ["E°cell", `${o.E0.toFixed(3)} V`], ["Reaction quotient Q", fmtPow10(o.log10Q)], ["E = E° − (RT/nF) ln Q", `${o.E.toFixed(3)} V`],
        ["ΔG = −nFE", `${o.dGkJ.toFixed(1)} kJ/mol`], ["K = e^(nFE°/RT)", `10^${o.log10K.toFixed(1)}`], ["Electrons n", String(o.n)],
      ]}
      controls={<>
        <Pick label="Cell" value={cell} options={(Object.keys(CELLS) as CellId[]).map((k) => ({ id: k, label: CELLS[k].label }))} onChange={setCell} />
        <Slider label={`Anode ion ${ionA}, log₁₀ of M`} value={logA} min={-4} max={1} step={0.1} digits={1} unit=" log M" onChange={setA} />
        <Slider label={`Cathode ion ${ionC}, log₁₀ of M`} value={logC} min={-4} max={1} step={0.1} digits={1} unit=" log M" onChange={setC} />
        <Slider label="Temperature" value={T} min={273} max={373} step={1} digits={0} unit=" K" onChange={setT} />
      </>}
      note={<p>Left is the anode (oxidation, electrode marked red, electrons leave), right the cathode (reduction, marked green). Overall: {o.reaction}. E°cell = E°(cathode) − E°(anode) using Zn −0.76, Fe −0.44, Cu +0.34, Ag +0.80 V. The Nernst equation E = E° − (RT/nF) ln Q, with Q = [anode ion]^(n/z)/[cathode ion]^(n/z), shows E drops when products build up or reactants are diluted: at 298 K each tenfold change of Q shifts E by 0.059/n V. The electrons in the wire move at a speed that follows E, and the needle shows E on a ±2 V scale. ΔG = −nFE is negative for a working cell; at E = 0, Q = K = e^(nFE°/RT) and the cell is flat (dead). Pure solids have activity 1; concentrations stand in for activities (simplified model). The salt bridge carries ions between the beakers to keep both solutions neutral.</p>}
    />
  );
}
