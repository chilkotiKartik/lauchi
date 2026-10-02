"use client";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { ro, rng, SOLUTES, type Solute } from "../sim/chemy";
import { Tick } from "../Stage";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { CHEMY_SPECS } from "../meta/chemy.specs";
import { C, Box, type V3 } from "../kit";
import { Arrow, Flow, Rod } from "../kit2";

const CAP = 64, HX = 3.0, DZ = 1.6, Y0 = -1.8;
const _o = new THREE.Object3D(), _c = new THREE.Color();

function paintIons(m: THREE.InstancedMesh, seeds: Float32Array, n: number, top: number, t: number, sucrose: boolean) {
  for (let i = 0; i < CAP; i++) {
    if (i >= n) { _o.position.set(0, -999, 0); _o.scale.setScalar(0.0001); }
    else {
      const ph = seeds[i * 4 + 3] * 6.283;
      _o.position.set(-HX + 0.25 + seeds[i * 4] * (HX - 0.5) + 0.12 * Math.sin(t * 1.7 + ph), Y0 + 0.2 + seeds[i * 4 + 1] * (top - Y0 - 0.4) + 0.1 * Math.cos(t * 1.3 + ph), (seeds[i * 4 + 2] - 0.5) * (DZ - 0.3));
      _o.scale.setScalar(sucrose ? 1.5 : i % 2 ? 1.25 : 0.8);
    }
    _o.updateMatrix(); m.setMatrixAt(i, _o.matrix);
    m.setColorAt(i, _c.set(sucrose ? C.gold : i % 2 ? C.green : C.purple));
  }
  m.instanceMatrix.needsUpdate = true;
  if (m.instanceColor) m.instanceColor.needsUpdate = true;
}

function Ions({ n, top, sucrose }: { n: number; top: number; sucrose: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null), t = useRef(0);
  const seeds = useMemo(() => { const r = rng(17), a = new Float32Array(CAP * 4); for (let i = 0; i < a.length; i++) a[i] = r(); return a; }, []);
  useLayoutEffect(() => { if (ref.current) paintIons(ref.current, seeds, n, top, t.current, sucrose); }, [seeds, n, top, sucrose]);
  const tick = (dt: number) => { t.current += Math.min(dt, 0.05); if (ref.current) paintIons(ref.current, seeds, n, top, t.current, sucrose); };
  return (<>
    <Tick fn={tick} />
    <instancedMesh ref={ref} args={[undefined, undefined, CAP]} frustumCulled={false}>
      <sphereGeometry args={[0.1, 12, 12]} />
      <meshStandardMaterial color="#ffffff" emissiveIntensity={0.3} />
    </instancedMesh>
  </>);
}

export default function RevOsmosisLab() {
  const [P, set, reset] = useLabParams(CHEMY_SPECS.revosmosis);
  const { P: Pa, salt, T, A, sol } = P;
  const r = ro(Pa, salt, T, A, sol);
  const topL = Y0 + 2.4 - Math.min(0.9, Math.max(-0.6, r.net * 0.012)), topR = Y0 + 2.4 + Math.min(0.9, Math.max(-0.6, r.J * 0.006));
  const nIons = Math.round(Math.min(CAP, salt * 0.9 * (sol === "sucrose" ? 0.4 : 1)));
  const nWater = Math.round(Math.min(24, Math.abs(r.J) * 0.5 + (Math.abs(r.net) > 0.05 ? 3 : 0)));
  const path = useMemo<V3[]>(() => (r.J >= 0 ? [[-1.6, -0.6, 0.2], [0, -0.6, 0.2], [1.6, -0.6, 0.2]] : [[1.6, -0.6, 0.2], [0, -0.6, 0.2], [-1.6, -0.6, 0.2]]), [r.J]);
  const path2 = useMemo<V3[]>(() => (r.J >= 0 ? [[-1.6, 0.1, -0.4], [0, 0.1, -0.4], [1.6, 0.1, -0.4]] : [[1.6, 0.1, -0.4], [0, 0.1, -0.4], [-1.6, 0.1, -0.4]]), [r.J]);
  const pLen = Math.min(2.2, 0.3 + Pa * 0.02), piLen = Math.min(2.2, 0.3 + r.pi * 0.02);
  return (
    <LabFrame
      label="Reverse osmosis cell: brine with purple and green ions on the left under a grey piston, a purple semi-permeable membrane in the middle and fresh water on the right; blue water molecules stream through the membrane in the direction set by applied pressure versus osmotic pressure"
      camera={[1.2, 2.2, 9.5]}
      onReset={reset}
      scene={() => (<group rotation={[0.05, -0.25, 0]}>
        <Box p={[-HX / 2, (Y0 + topL) / 2, 0]} s={[HX, topL - Y0, DZ]} c="#2d7fb0" o={0.35} />
        <Box p={[HX / 2, (Y0 + topR) / 2, 0]} s={[HX, topR - Y0, DZ]} c="#7cc7f2" o={0.3} />
        <Box p={[0, Y0 - 0.08, 0]} s={[2 * HX + 0.3, 0.16, DZ + 0.3]} c={C.dark} />
        <Box p={[-HX - 0.08, 0.2, 0]} s={[0.12, 4.2, DZ + 0.3]} c={C.grey} o={0.5} />
        <Box p={[HX + 0.08, 0.2, 0]} s={[0.12, 4.2, DZ + 0.3]} c={C.grey} o={0.5} />
        <Box p={[0, (Y0 + 2.4) / 2 + 0.3, 0]} s={[0.08, 3.4, DZ]} c={C.purple} o={0.65} glow={0.4} />
        <Box p={[-HX / 2, topL + 0.1, 0]} s={[HX - 0.1, 0.2, DZ - 0.05]} c="#9aa8b0" />
        <Rod a={[-HX / 2, topL + 0.2, 0]} b={[-HX / 2, topL + 1.3, 0]} r={0.09} color={C.light} />
        <Arrow from={[-HX / 2 - 0.6, topL + 0.3 + pLen, 0]} to={[-HX / 2 - 0.6, topL + 0.3, 0]} color={C.red} r={0.05} />
        <Arrow from={[0.6, topR + 0.4, 0.5]} to={[0.6 + piLen * 0.6, topR + 0.4 + piLen * 0.6, 0.5]} color={C.gold} r={0.04} />
        <Ions n={nIons} top={topL} sucrose={sol === "sucrose"} />
        {nWater > 0 && <Flow path={path} n={nWater} speed={0.12 + Math.min(0.5, Math.abs(r.J) * 0.01)} color={C.blue} r={0.08} />}
        {nWater > 0 && <Flow path={path2} n={Math.ceil(nWater / 2)} speed={0.1 + Math.min(0.4, Math.abs(r.J) * 0.008)} color={C.white} r={0.06} />}
      </group>)}
      readouts={[
        ["Osmotic pressure π = iCRT", `${r.pi.toFixed(2)} bar`],
        ["Net pressure ΔP − π", `${r.net.toFixed(2)} bar`],
        ["Water flux J", `${r.J.toFixed(1)} L/(m²·h)`],
        ["What happens", r.mode],
        ["Permeate salt", r.net > 0 ? `${r.permeateMgL.toFixed(0)} mg/L` : "—"],
        ["Fresh water per m²", `${r.perDay.toFixed(0)} L/day`],
      ]}
      controls={<>
        <Slider label="Applied pressure ΔP" value={Pa} min={0} max={100} step={0.5} digits={1} unit=" bar" onChange={(x) => set("P", x)} />
        <Slider label="Dissolved solute" value={salt} min={0} max={80} step={0.5} digits={1} unit=" g/L" onChange={(x) => set("salt", x)} />
        <Pick label="Solute" value={sol} options={(Object.keys(SOLUTES) as Solute[]).map((k) => ({ id: k, label: `${SOLUTES[k].name} (i = ${SOLUTES[k].i})` }))} onChange={(x) => set("sol", x)} />
        <Slider label="Temperature" value={T} min={5} max={45} step={1} digits={0} unit=" °C" onChange={(x) => set("T", x)} />
        <Slider label="Membrane permeability A" value={A} min={0.2} max={4} step={0.1} digits={1} unit=" L/(m²·h·bar)" onChange={(x) => set("A", x)} />
      </>}
      note={<>
        <p><b>Osmosis:</b> when a semi-permeable membrane separates pure water from a salt solution, water moves <i>into</i> the concentrated side. The pressure that just stops it is the <b>osmotic pressure</b>, π = iCRT (van &apos;t Hoff; i = 2 for NaCl, C in mol/L, R = 0.0831 L·bar/(mol·K)).</p>
        <p className="mt-2"><b>Reverse osmosis:</b> apply a pressure ΔP greater than π on the brine side and the flow reverses: pure water is squeezed out through the membrane (cellulose acetate or polyamide), leaving ions, organics and microbes behind (≈ 99.5 % rejection). Water flux J = A(ΔP − π). RO removes ionic, non-ionic and colloidal impurities, needs no chemicals and is used for sea-water desalination and boiler feed water; the membrane needs periodic cleaning.</p>
        <p className="mt-2"><b>Try:</b> start at 0 bar (natural osmosis), raise ΔP past π and watch the water reverse. Saltier or warmer feed needs more pressure. Simplified model: no concentration polarisation, constant rejection.</p>
      </>}
    />
  );
}
