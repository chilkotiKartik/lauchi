"use client";
import { Line } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { REACTIONS, fmtPow10, gibbs, type RxnId } from "../sim/chem";
import { Tick } from "../Stage";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { CHEM_SPECS } from "../meta/chem.specs";

const T0 = 100, T1 = 2000, X0 = -4.7, W = 5, HALF = 1.7;
const xOf = (T: number) => X0 + ((T - T0) / (T1 - T0)) * W;
const GREEN = "#44c95a", RED = "#ff5a5f";

type Poly = { pts: [number, number][]; pos: boolean };
/** Sign-coloured regions between the ΔG line and the ΔG = 0 axis (scene coordinates). */
function regions(g0: number, g1: number, yMax: number): Poly[] {
  const y0 = (g0 / yMax) * HALF, y1 = (g1 / yMax) * HALF, xa = xOf(T0), xb = xOf(T1);
  if (g0 === 0 && g1 === 0) return [];
  if (g0 * g1 >= 0) return [{ pts: [[xa, 0], [xa, y0], [xb, y1], [xb, 0]], pos: g0 + g1 > 0 }];
  const xc = xa + ((xb - xa) * g0) / (g0 - g1);
  return [{ pts: [[xa, 0], [xa, y0], [xc, 0]], pos: g0 > 0 }, { pts: [[xc, 0], [xb, y1], [xb, 0]], pos: g1 > 0 }];
}
function Region({ poly }: { poly: Poly }) {
  const geo = useMemo(() => new THREE.ShapeGeometry(new THREE.Shape(poly.pts.map((p) => new THREE.Vector2(p[0], p[1])))), [poly]);
  return <mesh geometry={geo}><meshStandardMaterial color={poly.pos ? RED : GREEN} transparent opacity={0.5} side={THREE.DoubleSide} /></mesh>;
}

const BL = 1.25; // half beam length
export default function GibbsLab() {
  const [P, set, reset] = useLabParams(CHEM_SPECS.gibbs);
  const { T, rxn, dH, dS } = P;
  const setT = (x: (typeof P)["T"]) => set("T", x), setRxn = (x: (typeof P)["rxn"]) => set("rxn", x), setH = (x: (typeof P)["dH"]) => set("dH", x), setS = (x: (typeof P)["dS"]) => set("dS", x);
  const r = rxn === "custom" ? { label: "custom reaction", dH, dS } : REACTIONS[rxn];
  const g = gibbs(r.dH, r.dS, T);
  const gAt = (t: number) => r.dH - (t * r.dS) / 1000;
  const yMax = Math.max(Math.abs(gAt(T0)), Math.abs(gAt(T1)), 20);
  const yOf = (v: number) => (v / yMax) * HALF;
  const polys = useMemo(() => regions(gAt(T0), gAt(T1), yMax), [r.dH, r.dS, yMax]); // eslint-disable-line react-hooks/exhaustive-deps
  const tilt = Math.max(-1, Math.min(1, g.dG / 60)) * 0.42;
  const ball = useRef<THREE.Mesh>(null), ph = useRef(0);
  const tick = (dt: number) => {
    const m = ball.current; if (!m) return;
    if (Math.abs(tilt) < 0.012) { m.position.x = 0; return; }
    ph.current = (ph.current + Math.min(dt, 0.05) * (0.25 + 0.7 * (Math.abs(tilt) / 0.42))) % 1;
    const lowEnd = tilt < 0 ? BL - 0.15 : -(BL - 0.15), highEnd = -lowEnd;
    m.position.x = highEnd + (lowEnd - highEnd) * ph.current * ph.current;
  };
  const dotCol = g.dG < 0 ? GREEN : RED;
  const inRange = g.Tcross !== null && g.Tcross >= T0 && g.Tcross <= T1;
  return (
    <LabFrame
      label="Gibbs free energy against temperature as a sloping line with green spontaneous and red non-spontaneous regions, and a tilting balance with a rolling ball showing which direction is downhill"
      camera={[0, 0.5, 12.5]}
      onReset={reset}
      scene={() => (<group position={[0, 0.2, 0]}><Tick fn={tick} />
        {/* plot */}
        <Line points={[[X0, -HALF - 0.2, 0], [X0, HALF + 0.2, 0]]} color="#5b6d77" lineWidth={1.5} />
        <Line points={[[X0, 0, 0], [X0 + W, 0, 0]]} color="#cfd8dc" lineWidth={2} />
        {polys.map((p, i) => <Region key={i} poly={p} />)}
        <Line points={[[xOf(T0), yOf(gAt(T0)), 0.02], [xOf(T1), yOf(gAt(T1)), 0.02]]} color="#ffc83d" lineWidth={4} />
        {inRange && <mesh position={[xOf(g.Tcross as number), 0, 0.05]}><sphereGeometry args={[0.1, 14, 14]} /><meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} /></mesh>}
        <Line points={[[xOf(T), 0, 0.03], [xOf(T), yOf(g.dG), 0.03]]} color={dotCol} lineWidth={2} dashed dashSize={0.1} gapSize={0.07} />
        <mesh position={[xOf(T), yOf(g.dG), 0.06]}><sphereGeometry args={[0.15, 18, 18]} /><meshStandardMaterial color={dotCol} emissive={dotCol} emissiveIntensity={0.6} /></mesh>
        {/* balance */}
        <group position={[2.9, -0.9, 0]}>
          <mesh position={[0, 0.5, 0]}><coneGeometry args={[0.45, 1.0, 3]} /><meshStandardMaterial color="#5b6d77" /></mesh>
          <mesh position={[0, -0.05, 0]}><boxGeometry args={[2.2, 0.1, 0.9]} /><meshStandardMaterial color="#33454e" /></mesh>
          <group position={[0, 1.05, 0]} rotation={[0, 0, tilt]}>
            <mesh><boxGeometry args={[BL * 2, 0.1, 0.55]} /><meshStandardMaterial color="#cfd8dc" /></mesh>
            <mesh position={[-BL + 0.2, 0.22, 0]}><boxGeometry args={[0.4, 0.34, 0.4]} /><meshStandardMaterial color="#2ba6f5" /></mesh>
            <mesh position={[BL - 0.2, 0.22, 0]}><boxGeometry args={[0.4, 0.34, 0.4]} /><meshStandardMaterial color="#ffc83d" /></mesh>
            <mesh ref={ball} position={[0, 0.16, 0]}><sphereGeometry args={[0.13, 16, 16]} /><meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.3} /></mesh>
          </group>
        </group>
      </group>)}
      readouts={[
        ["ΔG at T", `${g.dG.toFixed(2)} kJ/mol`], ["ΔH", `${r.dH.toFixed(1)} kJ/mol`], ["TΔS", `${g.TdS.toFixed(2)} kJ/mol`],
        ["Crossover T = ΔH/ΔS", g.Tcross === null ? "none" : `${g.Tcross.toFixed(0)} K`],
        ["Spontaneous?", g.equilibrium ? "At equilibrium (ΔG ≈ 0)" : g.spontaneous ? "Yes (ΔG < 0)" : "No (ΔG > 0)"],
        ["K = e^(−ΔG/RT)", fmtPow10(g.log10K)], ["Regime", g.regime],
      ]}
      controls={<>
        <Pick label="Reaction" value={rxn} options={[...(Object.keys(REACTIONS) as Exclude<RxnId, "custom">[]).map((k) => ({ id: k as RxnId, label: REACTIONS[k].label })), { id: "custom" as RxnId, label: "Custom (set ΔH and ΔS)" }]} onChange={setRxn} />
        <Slider label="Temperature T" value={T} min={100} max={2000} step={10} digits={0} unit=" K" onChange={setT} />
        {rxn === "custom" && <>
          <Slider label="Custom ΔH" value={dH} min={-300} max={300} step={5} digits={0} unit=" kJ/mol" onChange={setH} />
          <Slider label="Custom ΔS" value={dS} min={-300} max={300} step={5} digits={0} unit=" J/K" onChange={setS} />
        </>}
      </>}
      note={<p>ΔG = ΔH − TΔS. The gold line is ΔG against T: its intercept is ΔH and its slope is −ΔS. Green regions have ΔG &lt; 0 (spontaneous), red regions ΔG &gt; 0 (not spontaneous); the white dot is the crossover temperature T = ΔH/ΔS where ΔG = 0 (it exists only when ΔH and ΔS have the same sign). The balance shows the same thing: the ball always rolls to the lower side, products (yellow) when ΔG &lt; 0, reactants (blue) when ΔG &gt; 0. Water boiling (+40.7 kJ, +109 J/K) crosses at 373 K; CaCO₃ decomposition (+178 kJ, +161 J/K) at about 1106 K; the Haber process (−92.2 kJ, −198.7 J/K) is spontaneous only below 464 K. K = e^(−ΔG/RT) links the sign of ΔG to the position of equilibrium. Textbook ΔH and ΔS are assumed constant with T (simplified model), and ΔG is at standard state.</p>}
    />
  );
}
