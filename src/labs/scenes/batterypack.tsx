"use client";
import { useLayoutEffect, useRef } from "react";
import * as THREE from "three";
import { batteryPack, CHEM, dur, eng, type Chem } from "../sim/elecy";
import { Tick } from "../Stage";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { ELECY_SPECS } from "../meta/elecy.specs";
import { Box, C, type V3 } from "../kit";
import { Flow, Rod } from "../kit2";

const CAP = 128, H = 0.9;
const SHELL: Record<Chem, string> = { leadacid: "#8fa3ad", nicd: C.green, liion: C.blue };
const _o = new THREE.Object3D(), RED = new THREE.Color(C.red), GREEN = new THREE.Color(C.green);
function place(m: THREE.InstancedMesh, pts: V3[], sy: number) {
  for (let i = 0; i < pts.length; i++) { _o.position.set(pts[i][0], pts[i][1], pts[i][2]); _o.scale.set(1, sy, 1); _o.updateMatrix(); m.setMatrixAt(i, _o.matrix); }
  m.count = pts.length;
  m.instanceMatrix.needsUpdate = true;
}
function Cells({ pts, r, color, o, y, sy, glow = 0, fillRef }: { pts: V3[]; r: number; color: string; o: number; y: number; sy: number; glow?: number; fillRef?: { current: THREE.MeshStandardMaterial | null } }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => { if (ref.current) place(ref.current, pts.map((p) => [p[0], y, p[2]] as V3), sy); }, [pts, y, sy]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, CAP]} frustumCulled={false}>
      <cylinderGeometry args={[r, r, 1, 16]} />
      <meshStandardMaterial ref={fillRef} color={color} emissive={glow > 0 ? color : "#000000"} emissiveIntensity={glow} transparent={o < 1} opacity={o} depthWrite={o >= 1} roughness={0.4} />
    </instancedMesh>
  );
}
function layout(Ns: number, Np: number) {
  const dx = Math.min(0.55, 6.2 / Ns), dz = Math.min(0.6, 3.4 / Np), x0 = -((Ns - 1) * dx) / 2 - 0.8, z0 = -((Np - 1) * dz) / 2;
  const pts: V3[] = [];
  for (let j = 0; j < Np; j++) for (let i = 0; i < Ns; i++) pts.push([x0 + i * dx, 0, z0 + j * dz]);
  return { dx, dz, x0, z0, pts, r: Math.min(dx, dz) * 0.38, xe: x0 + (Ns - 1) * dx };
}
function soc(t: number, period: number) { return 1 - 0.85 * ((t / period) % 1); }

export default function BatteryPackLab() {
  const [P, set, reset] = useLabParams(ELECY_SPECS.batterypack);
  const { Ns: ns, Np: np, chem, Ah, I } = P;
  const Ns = Math.round(ns), Np = Math.round(np);
  const b = batteryPack(chem, Ns, Np, Ah, I);
  const lay = layout(Ns, Np);
  const fillMat = useRef<THREE.MeshStandardMaterial | null>(null), fillGrp = useRef<THREE.Group>(null), bulb = useRef<THREE.MeshStandardMaterial>(null), t = useRef(0);
  const period = 3 + 2 * Math.log10(1 + b.hours) * 2;
  const tick = (dt: number) => {
    t.current += Math.min(dt, 0.05);
    const s = soc(t.current, period);
    fillGrp.current?.scale.set(1, s, 1);
    fillMat.current?.color.copy(RED).lerp(GREEN, (s - 0.15) / 0.85);
    if (bulb.current) bulb.current.emissiveIntensity = 0.4 + 0.8 * Math.min(1, Math.log10(1 + b.P) / 3);
  };
  const xb = lay.xe + 2.0, top = H + 0.12;
  const zf = lay.z0 - 0.35, zb = lay.z0 + (Np - 1) * lay.dz + 0.35;
  return (
    <LabFrame
      label="A battery pack of cylindrical cells arranged in series columns and parallel rows, joined by gold bus bars, with a coloured charge level falling inside every cell and current dots flowing to a glowing lamp"
      camera={[1.2, 3.6, 7.6]}
      onReset={reset}
      scene={() => (<group position={[0, -0.6, 0]}>
        <Tick fn={tick} />
        <Box p={[0.2, -0.06, 0]} s={[8.8, 0.1, 4.4]} c="#1b333d" />
        <Cells pts={lay.pts} r={lay.r} color={SHELL[chem]} o={0.32} y={H / 2} sy={H} />
        <group ref={fillGrp}><Cells pts={lay.pts} r={lay.r * 0.82} color={C.green} o={1} y={H / 2} sy={H * 0.96} glow={0.35} fillRef={fillMat} /></group>
        {/* series links along each string, parallel bars at the ends */}
        {Array.from({ length: Np }, (_, j) => <Rod key={j} a={[lay.x0, top, lay.z0 + j * lay.dz]} b={[lay.xe, top, lay.z0 + j * lay.dz]} r={0.03} color={C.gold} glow={0.3} />)}
        <Rod a={[lay.x0 - 0.25, top, zf]} b={[lay.x0 - 0.25, top, zb]} r={0.05} color={C.blue} glow={0.3} />
        <Rod a={[lay.xe + 0.25, top, zf]} b={[lay.xe + 0.25, top, zb]} r={0.05} color={C.red} glow={0.3} />
        {/* load lamp */}
        <Rod a={[xb, 0, 0]} b={[xb, 1.3, 0]} r={0.06} color={C.light} />
        <mesh position={[xb, 1.6, 0]}><sphereGeometry args={[0.32, 20, 20]} /><meshStandardMaterial ref={bulb} color={C.gold} emissive={C.gold} emissiveIntensity={0.8} /></mesh>
        <Flow path={[[lay.xe + 0.25, top + 0.1, 0], [xb, top + 0.1, 0], [xb, 1.3, 0.1], [xb, top + 0.5, 0.6], [lay.x0 - 0.25, top + 0.5, zb], [lay.x0 - 0.25, top + 0.1, 0]]} n={20} speed={Math.min(1, 0.1 + b.C * 0.4) / 3} color={C.orange} r={0.06} />
      </group>)}
      readouts={[
        ["Pack voltage = N_s × V_cell", `${b.V.toFixed(1)} V`],
        ["Capacity = N_p × cell Ah", `${eng(b.Ah, "Ah")}`],
        ["Energy V·Ah · mass", `${eng(b.Wh, "Wh")} · ${b.kg < 10 ? b.kg.toFixed(2) : b.kg.toFixed(1)} kg`],
        ["C-rate = I / Ah", `${b.C < 0.1 ? b.C.toFixed(3) : b.C.toFixed(2)} C`],
        ["Runtime = Ah / I (ideal)", dur(b.hours * 3600)],
        [`Energy to recharge (η ${(CHEM[chem].etaWh * 100).toFixed(0)} %)`, eng(b.WhIn, "Wh")],
      ]}
      controls={<>
        <Slider label="Cells in series N_s" value={Ns} min={1} max={16} step={1} digits={0} onChange={(x) => set("Ns", x)} />
        <Slider label="Strings in parallel N_p" value={Np} min={1} max={8} step={1} digits={0} onChange={(x) => set("Np", x)} />
        <Pick label="Chemistry" value={chem} options={[{ id: "leadacid", label: "Lead–acid (2.0 V/cell)" }, { id: "nicd", label: "Nickel–cadmium (1.2 V/cell)" }, { id: "liion", label: "Lithium-ion (3.7 V/cell)" }]} onChange={(x) => set("chem", x)} />
        <Slider label="Cell capacity" value={Ah} min={0.5} max={200} step={0.5} digits={1} unit=" Ah" onChange={(x) => set("Ah", x)} />
        <Slider label="Load current I" value={I} min={0.1} max={100} step={0.1} digits={1} unit=" A" onChange={(x) => set("I", x)} />
      </>}
      note={<>
        <p><b>Series adds voltage, parallel adds capacity.</b> N_s cells in a string give N_s × V_cell; N_p strings side by side share the current and give N_p × the cell Ah. Stored energy (Wh) = V × Ah. <b>Capacity</b> (Ah) = current × hours, so the ideal runtime is Ah/I. The <b>C-rate</b> is the current as a multiple of capacity: 1C empties the pack in an hour, C/10 in ten. Real batteries give less at high C-rates (Peukert effect, see the earthing & lead–acid lab) and must not be deep-discharged, so the runtime here is an upper limit (simplified model). The coloured level in the cells is just a time-lapse of a discharge.</p>
        <p><b>Primary vs secondary:</b> primary cells (dry Leclanché, alkaline) are used once; secondary cells are recharged by reversing the reaction. <b>Lead–acid</b> (PbO₂ + Pb in H₂SO₄, 2 V, ~35 Wh/kg, cheap, heavy, ~80 % Wh efficiency): inverters, cars. <b>Ni–Cd</b> (1.2 V, robust, long cycle life, memory effect, ~70 %). <b>Li-ion</b> (3.7 V, ~150–250 Wh/kg, ~95 % efficient, no memory effect, needs a battery-management system): phones, EVs. Ampere-hour efficiency = Ah out/Ah in; watt-hour efficiency = Wh out/Wh in (lower, because charging needs a higher voltage).</p>
        <p><b>Try:</b> build a 48 V scooter pack from Li-ion cells, then from lead–acid, and compare the mass.</p>
      </>}
    />
  );
}
