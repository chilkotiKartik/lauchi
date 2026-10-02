"use client";
import { useLayoutEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { boilResult, hardness, mulberry32 } from "../sim/chem";
import { Tick, useQuality } from "../Stage";
import { Check, LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { CHEM_SPECS } from "../meta/chem.specs";

const CAP = 80, RAD = 1.45, FLOOR = -1.55;
const dummy = new THREE.Object3D();

/** Random resting positions inside the water plus a wobble phase per slot (seeded, so identical every render). */
function makeSpots(seed: number) {
  const r = mulberry32(seed), base = new Float32Array(CAP * 3), ph = new Float32Array(CAP * 3);
  for (let i = 0; i < CAP; i++) {
    const a = r() * Math.PI * 2, d = Math.sqrt(r()) * RAD;
    base[i * 3] = Math.cos(a) * d; base[i * 3 + 1] = -1.4 + r() * 2.5; base[i * 3 + 2] = Math.sin(a) * d;
    ph[i * 3] = r() * 6.28; ph[i * 3 + 1] = r() * 6.28; ph[i * 3 + 2] = r() * 6.28;
  }
  return { base, ph };
}
/** Wobbling ions; `sink` (0..1) drags each one to the bottom of the beaker (settling precipitate). Module-level: no allocation per frame. */
function paint(m: THREE.InstancedMesh, s: { base: Float32Array; ph: Float32Array }, count: number, t: number, sink: number, flat: boolean) {
  const amp = 0.09 * (1 - sink);
  for (let i = 0; i < count; i++) {
    const b = i * 3, floor = FLOOR + 0.08 * ((i * 7) % 5) / 4;
    dummy.position.set(s.base[b] + amp * Math.sin(t * 1.3 + s.ph[b]), s.base[b + 1] + (floor - s.base[b + 1]) * sink + amp * Math.sin(t * 1.7 + s.ph[b + 1]), s.base[b + 2] + amp * Math.sin(t * 1.1 + s.ph[b + 2]));
    dummy.scale.set(1, flat ? 0.55 : 1, 1); dummy.updateMatrix();
    m.setMatrixAt(i, dummy.matrix);
  }
  m.count = count; m.instanceMatrix.needsUpdate = true;
}
function Ions({ spots, count, color, radius, sink, flat = false }: { spots: { base: Float32Array; ph: Float32Array }; count: number; color: string; radius: number; sink?: RefObject<number>; flat?: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null), t = useRef(0);
  useLayoutEffect(() => { if (ref.current) paint(ref.current, spots, count, t.current, sink ? sink.current : 0, flat); }, [spots, count, sink, flat]);
  const tick = (dt: number) => { t.current += Math.min(dt, 0.05); if (ref.current) paint(ref.current, spots, count, t.current, sink ? sink.current : 0, flat); };
  return (<>
    <Tick fn={tick} />
    <instancedMesh ref={ref} args={[undefined, undefined, CAP]}><sphereGeometry args={[radius, 12, 12]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.2} roughness={0.5} /></instancedMesh>
  </>);
}

export default function HardnessLab() {
  const quality = useQuality();
  const [P, set, reset] = useLabParams(CHEM_SPECS.hardness);
  const { ca, mg, hco3, boil } = P;
  const setCa = (x: (typeof P)["ca"]) => set("ca", x), setMg = (x: (typeof P)["mg"]) => set("mg", x), setH = (x: (typeof P)["hco3"]) => set("hco3", x), setBoil = (x: (typeof P)["boil"]) => set("boil", x);
  const h = hardness(ca, mg, hco3, boil);
  const after = boilResult(ca, mg, hco3);
  const use = boil ? after : { ca, mg, hco3, precip: 0 };
  const scale = quality === "low" ? 0.5 : 1;
  const n = (v: number, per: number) => Math.min(CAP, Math.round((v / per) * scale));
  const sCa = useMemo(() => makeSpots(3), []), sMg = useMemo(() => makeSpots(5), []), sH = useMemo(() => makeSpots(9), []), sP = useMemo(() => makeSpots(13), []);
  const grp = useRef<THREE.Group>(null), settle = useRef(0);
  const tick = (dt: number) => {
    const d = Math.min(dt, 0.05);
    settle.current += ((boil ? 1 : 0) - settle.current) * Math.min(1, d * 1.2);
    if (grp.current) grp.current.rotation.y += d * 0.25;
  };
  const f1 = (v: number) => Number(v.toFixed(1)).toString();
  const boiling = boil;
  return (
    <LabFrame
      label="A rotating beaker of water with dots for calcium, magnesium and bicarbonate ions; boiling turns the temporary hardness into white carbonate that settles on the bottom"
      camera={[0, 1.5, 8.5]}
      onReset={reset}
      scene={() => (<group position={[0, 0, 0]}><Tick fn={tick} />
        <group ref={grp}>
          <mesh position={[0, 0, 0]}><cylinderGeometry args={[1.7, 1.7, 3.4, 32, 1, true]} /><meshStandardMaterial color="#9fd8ff" transparent opacity={0.16} side={2} /></mesh>
          <mesh position={[0, -0.25, 0]}><cylinderGeometry args={[1.66, 1.66, 2.9, 32]} /><meshStandardMaterial color={boiling ? "#c9e8ff" : "#7cc4f0"} transparent opacity={0.3} /></mesh>
          <mesh position={[0, -1.7, 0]}><cylinderGeometry args={[1.7, 1.7, 0.08, 32]} /><meshStandardMaterial color="#5b6d77" /></mesh>
          <Ions spots={sCa} count={n(use.ca, 4)} color="#ffc83d" radius={0.12} />
          <Ions spots={sMg} count={n(use.mg, 2)} color="#a970ff" radius={0.1} />
          <Ions spots={sH} count={n(use.hco3, 8)} color="#2ba6f5" radius={0.085} />
          <Ions spots={sP} count={n(use.precip !== 0 ? use.precip : 0, 6)} color="#f3ecd8" radius={0.13} sink={settle} flat />
        </group>
      </group>)}
      readouts={[
        ["Ca²⁺ as CaCO₃", `${f1(ca)} × 50/20 = ${h.caAsCaCO3.toFixed(1)} ppm`], ["Mg²⁺ as CaCO₃", `${f1(mg)} × 50/12 = ${h.mgAsCaCO3.toFixed(1)} ppm`],
        [boil ? "Total hardness after boiling" : "Total hardness", `${h.remaining.toFixed(1)} ppm CaCO₃`], ["Temporary (HCO₃⁻: 61 → 50)", `${h.temporary.toFixed(1)} ppm`], ["Permanent", `${h.permanent.toFixed(1)} ppm`],
        ["Clark degrees (ppm × 0.07)", `${h.clark.toFixed(2)} °Cl`], ["Classification", h.cls],
      ]}
      controls={<>
        <Slider label="Ca²⁺" value={ca} min={0} max={300} step={5} digits={0} unit=" mg/L" onChange={setCa} />
        <Slider label="Mg²⁺" value={mg} min={0} max={120} step={2} digits={0} unit=" mg/L" onChange={setMg} />
        <Slider label="HCO₃⁻ (bicarbonate)" value={hco3} min={0} max={600} step={10} digits={0} unit=" mg/L" onChange={setH} />
        <Check label="Boil the water" checked={boil} onChange={setBoil} />
      </>}
      note={<p>Gold dots are Ca²⁺, purple Mg²⁺ and blue HCO₃⁻; the number of dots follows the concentration. Hardness is expressed as ppm of CaCO₃ using equivalent weights: Ca²⁺ mg/L × 50/20 (= × 100/40) and Mg²⁺ mg/L × 50/12 (= × 100/24), and HCO₃⁻ × 50/61 (= × 100/122) for the carbonate part. Temporary hardness is the smaller of total hardness and the bicarbonate (as CaCO₃); it is removed by boiling, Ca(HCO₃)₂ → CaCO₃↓ + H₂O + CO₂↑, and the white dots settle as scale. The rest is permanent hardness (chlorides and sulphates) that needs lime–soda, zeolite or ion exchange. °Clark = ppm × 0.07 (grains per imperial gallon). Classes: soft below 75 ppm, moderately hard 75–150, hard 150–300, very hard above 300. Simplified model: Mg is assumed to precipitate only after all Ca hardness has gone.</p>}
    />
  );
}
