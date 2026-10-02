"use client";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { mos, mosMode, mosTransfer, si } from "../sim/elexy";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { ELEXY_SPECS } from "../meta/elexy.specs";
import { C, Box, type V3 } from "../kit";
import { Flow, Graph, type XY } from "../kit2";

const SEG = 24, LEN = 3.2, TMAX = 0.42, _o = new THREE.Object3D();
/** Channel thickness along the channel (0 = source, 1 = drain): q(u) ∝ √(V_ov² − u(V_ov² − (V_ov − V_DS)²)), pinched where V_DS ≥ V_ov. */
function profile(vov: number, VDS: number, scale: number): number[] {
  return Array.from({ length: SEG }, (_, i) => {
    if (vov <= 0) return 0;
    const u = (i + 0.5) / SEG, ve = Math.min(VDS, vov), q2 = vov * vov - u * (vov * vov - (vov - ve) ** 2);
    return Math.min(TMAX, Math.sqrt(Math.max(0, q2)) * scale);
  });
}
function paint(m: THREE.InstancedMesh, prof: number[]) {
  for (let i = 0; i < SEG; i++) {
    const t = Math.max(0.004, prof[i]);
    _o.position.set(-LEN / 2 + (i + 0.5) * (LEN / SEG), -t / 2, 0);
    _o.scale.set(LEN / SEG, t, 1.6); _o.updateMatrix(); m.setMatrixAt(i, _o.matrix);
  }
  m.instanceMatrix.needsUpdate = true;
}
function Channel({ prof }: { prof: number[] }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => { if (ref.current) paint(ref.current, prof); }, [prof]);
  return <instancedMesh ref={ref} args={[undefined, undefined, SEG]} frustumCulled={false}><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color={C.blue} emissive={C.blue} emissiveIntensity={0.55} /></instancedMesh>;
}

export default function MosDepEnhLab() {
  const [P, set, reset] = useLabParams(ELEXY_SPECS.mosdepenh);
  const { VGS, type, VDS, VT, k, IDSS, VP } = P;
  const dep = type === "dep";
  const r = mos(type, VGS, VDS, VT, k, IDSS, VP);
  const scale = 0.06;
  const prof = useMemo(() => profile(r.vov, VDS, scale), [r.vov, VDS]);
  const curves = useMemo(() => {
    const e: XY[] = [], d: XY[] = [];
    for (let i = 0; i <= 160; i++) { const v = -6 + (16 * i) / 160; e.push([v, mosTransfer("enh", v, VT, k, IDSS, VP)]); d.push([v, mosTransfer("dep", v, VT, k, IDSS, VP)]); }
    const out: XY[] = Array.from({ length: 81 }, (_, i) => { const v = (20 * i) / 80; return [v, mos(type, VGS, v, VT, k, IDSS, VP).ID] as XY; });
    return { e, d, out };
  }, [VT, k, IDSS, VP, type, VGS]);
  const ymax = Math.max(2, 1.3 * mosTransfer(type, Math.max(VGS, dep ? 0 : VT + 1), VT, k, IDSS, VP), 1.2 * r.ID);
  const path = useMemo<V3[]>(() => [[-LEN / 2 - 0.5, -0.15, 0.3], [LEN / 2 + 0.5, -0.15, 0.3]], []);
  const gateGlow = Math.min(1, Math.abs(VGS) / 8);
  return (
    <LabFrame
      label="A 3-D cross-section of an n-channel MOSFET: red p-type substrate, blue n+ source and drain, a thin white oxide and a gold gate; a glowing blue channel forms under the oxide (or is built in for the depletion type), thins towards the drain and pinches off, with electrons streaming through; graphs show the transfer characteristics of both MOSFET types and the drain characteristic"
      camera={[0.2, 0.8, 11]}
      onReset={reset}
      scene={() => (<group>
        <group position={[-3.0, 0.4, 0]} rotation={[0.35, 0.45, 0]}>
          <Box p={[0, -0.9, 0]} s={[LEN + 1.8, 1.8, 1.8]} c={C.red} o={0.55} />
          <Box p={[-LEN / 2 - 0.45, -0.35, 0]} s={[0.9, 0.7, 1.8]} c={C.blue} glow={0.15} />
          <Box p={[LEN / 2 + 0.45, -0.35, 0]} s={[0.9, 0.7, 1.8]} c={C.blue} glow={0.15} />
          {dep && <Box p={[0, -0.12, 0]} s={[LEN, 0.24, 1.82]} c={C.purple} o={0.35} />}
          <Channel prof={prof} />
          <Box p={[0, 0.06, 0]} s={[LEN + 0.2, 0.12, 1.8]} c={C.white} o={0.55} />
          <Box p={[0, 0.27, 0]} s={[LEN, 0.3, 1.6]} c={C.gold} glow={0.2 + 0.6 * gateGlow} />
          <Box p={[-LEN / 2 - 0.45, 0.2, 0]} s={[0.5, 0.4, 1.2]} c={C.light} />
          <Box p={[LEN / 2 + 0.45, 0.2, 0]} s={[0.5, 0.4, 1.2]} c={C.light} />
          <Box p={[0, -1.9, 0]} s={[LEN + 1.8, 0.2, 1.8]} c={C.grey} />
          {r.ID > 1e-3 && <Flow path={path} n={16} speed={Math.min(1.5, 0.15 + r.ID / 15)} color={C.gold} r={0.06} cap={18} />}
        </group>
        <Graph x0={0.4} y0={0.3} w={4.6} h={2.6} xr={[-6, 10]} yr={[0, ymax]} curves={[{ pts: curves.e, color: C.gold, w: dep ? 1.4 : 3.2, dashed: dep }, { pts: curves.d, color: C.purple, w: dep ? 3.2 : 1.4, dashed: !dep }]} marker={[VGS, r.ID]} markerColor={C.red} vlines={[{ x: r.vth, color: C.green }]} />
        <Graph x0={0.4} y0={-3.2} w={4.6} h={2.6} xr={[0, 20]} yr={[0, ymax]} curves={[{ pts: curves.out, color: dep ? C.purple : C.gold, w: 3 }]} marker={[VDS, r.ID]} markerColor={C.red} vlines={r.vov > 0 ? [{ x: Math.min(20, r.VDSsat), color: C.blue }] : []} />
      </group>)}
      readouts={[
        ["Drain current I_D", si(r.ID / 1000, "A")],
        ["Region", r.region],
        ["Mode of operation", mosMode(type, VGS, VT, VP)],
        ["Transconductance g_m", si(r.gm / 1000, "S")],
        ["Pinch-off at V_DS(sat) = V_GS − V_th", r.vov > 0 ? `${r.VDSsat.toFixed(2)} V` : "—"],
        [dep ? "Shockley: I_DSS(1 − V_GS/V_P)²" : "Square law: k(V_GS − V_T)²", si(mosTransfer(type, VGS, VT, k, IDSS, VP) / 1000, "A")],
      ]}
      controls={<>
        <Slider label="Gate–source voltage V_GS" value={VGS} min={-6} max={10} step={0.1} digits={1} unit=" V" onChange={(x) => set("VGS", x)} />
        <Pick label="MOSFET type" value={type} options={[{ id: "enh", label: "Enhancement (E-MOSFET)" }, { id: "dep", label: "Depletion (D-MOSFET)" }]} onChange={(x) => set("type", x)} />
        <Slider label="Drain–source voltage V_DS" value={VDS} min={0} max={20} step={0.1} digits={1} unit=" V" onChange={(x) => set("VDS", x)} />
        <Slider label="Threshold V_T (E-MOSFET)" value={VT} min={0.5} max={5} step={0.1} digits={1} unit=" V" onChange={(x) => set("VT", x)} />
        <Slider label="k (E-MOSFET)" value={k} min={0.05} max={2} step={0.001} digits={3} unit=" mA/V²" onChange={(x) => set("k", x)} />
        <Slider label="I_DSS (D-MOSFET)" value={IDSS} min={1} max={20} step={0.5} digits={1} unit=" mA" onChange={(x) => set("IDSS", x)} />
        <Slider label="Pinch-off V_P (D-MOSFET)" value={VP} min={-8} max={-1} step={0.1} digits={1} unit=" V" onChange={(x) => set("VP", x)} />
      </>}
      note={<>
        <p>Both are n-channel MOSFETs: n⁺ source and drain in a p substrate, with a metal gate insulated by a thin SiO₂ layer, so the gate draws no current at all. In the <b>enhancement</b> type there is <b>no channel</b> at V<sub>GS</sub> = 0. A positive gate repels holes and attracts electrons; once V<sub>GS</sub> passes the <b>threshold V<sub>T</sub></b> an <b>inversion layer</b> of electrons forms the channel, and I<sub>D</sub> = k(V<sub>GS</sub> − V<sub>T</sub>)² (gold curve, only for V<sub>GS</sub> &gt; V<sub>T</sub>). The <b>depletion</b> type has an n channel diffused in during manufacture (purple layer), so I<sub>D</sub> = I<sub>DSS</sub> at V<sub>GS</sub> = 0. A negative gate depletes it (depletion mode) until cut-off at V<sub>P</sub>; a positive gate draws in extra electrons (enhancement mode), all on one Shockley curve I<sub>D</sub> = I<sub>DSS</sub>(1 − V<sub>GS</sub>/V<sub>P</sub>)². That is why a D-MOSFET can work in both modes and an E-MOSFET only in one.</p>
        <p>Along the channel the voltage rises from 0 at the source to V<sub>DS</sub> at the drain, so the channel is thinnest at the drain. At V<sub>DS</sub> = V<sub>GS</sub> − V<sub>th</sub> it <b>pinches off</b> there and I<sub>D</sub> saturates (lower graph, blue line). <b>Try:</b> the textbook presets (k = 0.278 mA/V², V<sub>T</sub> = 2 V gives 10 mA at V<sub>GS</sub> = 8 V; I<sub>DSS</sub> = 6 mA, V<sub>P</sub> = −3 V gives 10.67 mA at +1 V). Simplified model: square law, no channel-length modulation, channel thickness drawn to scale with the inversion charge.</p>
      </>}
    />
  );
}
