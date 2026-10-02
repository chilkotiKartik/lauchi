"use client";
import { useMemo, useRef } from "react";
import type * as THREE from "three";
import { snMech, type Substrate } from "../sim/chemx";
import { Tick } from "../Stage";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { CHEMX_SPECS } from "../meta/chemx.specs";
import { C } from "../kit";
import { Graph } from "../kit2";

const GROUPS: Record<Substrate, ("H" | "CH3")[]> = { methyl: ["H", "H", "H"], primary: ["CH3", "H", "H"], secondary: ["CH3", "CH3", "H"], tertiary: ["CH3", "CH3", "CH3"] };
const smooth = (x: number) => { const c = Math.min(1, Math.max(0, x)); return c * c * (3 - 2 * c); };

/** One looping animation: S_N2 (back-side attack + umbrella flip) or S_N1 (ionise, flatten, attack from either side). */
function Reaction({ sn2, groups }: { sn2: boolean; groups: ("H" | "CH3")[] }) {
  const nu = useRef<THREE.Mesh>(null), lg = useRef<THREE.Mesh>(null), sub = useRef<THREE.Group[]>([]), t = useRef(0), side = useRef(1);
  const tick = (dt: number) => {
    const prev = t.current;
    t.current = (t.current + Math.min(dt, 0.05) * 0.22) % 1;
    if (t.current < prev) side.current = -side.current;
    const p = t.current;
    let nuX: number, lgX: number, lgY = 0, flip: number;
    if (sn2) { nuX = -3.2 + 2.1 * smooth(p / 0.5); lgX = 1.1 + 2.2 * smooth((p - 0.45) / 0.45); flip = smooth((p - 0.35) / 0.35); }
    else {
      // ionise and flatten, then the nucleophile adds to one face or the other on alternate loops
      const s = side.current, out = smooth(p / 0.35);
      lgX = 1.1 + 2.4 * out; lgY = 1.4 * out;
      flip = 0.5 * out + (s > 0 ? 0.5 : -0.5) * smooth((p - 0.55) / 0.3);
      nuX = s > 0 ? -3.2 + 2.1 * smooth((p - 0.45) / 0.4) : 3.2 - 2.1 * smooth((p - 0.45) / 0.4);
    }
    nu.current?.position.set(nuX, 0, 0);
    lg.current?.position.set(lgX, lgY, 0);
    // substituents swing from pointing left (+) through planar to pointing right (inverted)
    const ang = (1 - 2 * Math.min(1, Math.max(0, flip))) * 0.42; // +: groups lean left, −: inverted
    sub.current.forEach((g, i) => { if (g) { const a = (i / 3) * Math.PI * 2; g.position.set(-ang * 1.1, Math.cos(a) * 1.05, Math.sin(a) * 1.05); } });
  };
  return (<group>
    <Tick fn={tick} />
    <mesh><sphereGeometry args={[0.36, 20, 20]} /><meshStandardMaterial color="#3a3f44" /></mesh>
    {groups.map((g, i) => (
      <group key={i} ref={(el) => { if (el) sub.current[i] = el; }}>
        <mesh><sphereGeometry args={[g === "H" ? 0.24 : 0.38, 16, 16]} /><meshStandardMaterial color={g === "H" ? C.white : C.grey} /></mesh>
      </group>
    ))}
    <mesh ref={lg} position={[1.1, 0, 0]}><sphereGeometry args={[0.5, 20, 20]} /><meshStandardMaterial color={C.green} emissive={C.green} emissiveIntensity={0.2} /></mesh>
    <mesh ref={nu} position={[-3.2, 0, 0]}><sphereGeometry args={[0.42, 20, 20]} /><meshStandardMaterial color={C.purple} emissive={C.purple} emissiveIntensity={0.35} /></mesh>
  </group>);
}

export default function SnMechLab() {
  const [P, set, reset] = useLabParams(CHEMX_SPECS.snmech);
  const { conc, T, sub, nu, solv } = P;
  const r = snMech(sub, nu === "strong", solv, conc, T);
  const sn2 = r.main === "SN2";
  const base = Math.min(r.g1, r.g2);
  const profile = useMemo(() => {
    const pts: [number, number][] = [];
    for (let i = 0; i <= 100; i++) {
      const x = i / 100;
      const y = sn2 ? (r.g2 - base + 20) * Math.exp(-(((x - 0.5) / 0.14) ** 2)) - 25 * x
        : (r.g1 - base + 20) * Math.exp(-(((x - 0.3) / 0.1) ** 2)) + 14 * Math.exp(-(((x - 0.5) / 0.12) ** 2)) + 10 * Math.exp(-(((x - 0.68) / 0.08) ** 2)) - 25 * x;
      pts.push([x, y]);
    }
    return pts;
  }, [sn2, r.g1, r.g2, base]);
  return (
    <LabFrame
      label="Ball-and-stick alkyl halide: the purple nucleophile attacks and the green bromide leaves, either in one step with an umbrella flip of the three groups, or in two steps through a flat carbocation, beside a reaction-energy diagram"
      camera={[0, 1.4, 9]}
      onReset={reset}
      scene={() => (<group>
        <group position={[-1.5, 0.6, 0]}><Reaction sn2={sn2} groups={GROUPS[sub]} /></group>
        <Graph x0={-4.5} y0={-3.4} w={9} h={1.9} xr={[0, 1]} yr={[-30, 70]} curves={[{ pts: profile, color: sn2 ? C.blue : C.orange, w: 3 }]} />
      </group>)}
      readouts={[
        ["Main mechanism", r.main === "SN2" ? "S_N2 (one step)" : "S_N1 (two steps)"],
        ["Rate law", r.rateLaw],
        ["Share by S_N2", `${(r.f2 * 100).toFixed(1)} %`],
        ["Relative S_N2 rate", r.r2.toPrecision(3)],
        ["Relative S_N1 rate", r.r1.toPrecision(3)],
        ["Product stereochemistry", `${r.inversionPct.toFixed(0)} % inverted, ${(100 - r.inversionPct).toFixed(0)} % retained`],
      ]}
      controls={<>
        <Slider label="Nucleophile concentration" value={conc} min={0.01} max={2} step={0.01} digits={2} unit=" M" onChange={(x) => set("conc", x)} />
        <Slider label="Temperature" value={T} min={273} max={373} step={1} digits={0} unit=" K" onChange={(x) => set("T", x)} />
        <Pick label="Substrate" value={sub} options={[{ id: "methyl", label: "Methyl (CH₃Br)" }, { id: "primary", label: "Primary (CH₃CH₂Br)" }, { id: "secondary", label: "Secondary ((CH₃)₂CHBr)" }, { id: "tertiary", label: "Tertiary ((CH₃)₃CBr)" }]} onChange={(x) => set("sub", x)} />
        <Pick label="Nucleophile" value={nu} options={[{ id: "strong", label: "Strong (OH⁻, CN⁻, I⁻)" }, { id: "weak", label: "Weak (H₂O, ROH)" }]} onChange={(x) => set("nu", x)} />
        <Pick label="Solvent" value={solv} options={[{ id: "aprotic", label: "Polar aprotic (acetone, DMSO)" }, { id: "protic", label: "Polar protic (water, alcohol)" }]} onChange={(x) => set("solv", x)} />
      </>}
      note={<p><b>S_N2</b>: the nucleophile attacks the carbon from the side opposite the leaving group, through a five-coordinate transition state [Nu···C···Br]<sup>‡</sup>, and the other three groups flip like an umbrella in a gale: <b>Walden inversion</b>. One step, so rate = k[RX][Nu]. Crowding by methyl groups blocks the back side, so the order is methyl &gt; 1° &gt; 2° ≫ 3°. Polar aprotic solvents leave the nucleophile “naked” and fast. <b>S_N1</b>: the C–Br bond breaks first to a flat sp² carbocation (rate = k[RX]); tertiary cations are most stable and polar protic solvents stabilise them, and the nucleophile can then add from either face, giving a racemic mixture. Relative rates are illustrative orders of magnitude, not measured data.</p>}
    />
  );
}
