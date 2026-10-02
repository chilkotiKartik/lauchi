"use client";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { depletion, jfet, jfetId } from "../sim/elexx";
import { LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { ELEXX_SPECS } from "../meta/elexx.specs";
import { C, Box, type V3 } from "../kit";
import { Flow, Graph } from "../kit2";

const SEG = 24, LEN = 5, H = 0.9, _o = new THREE.Object3D();
function paint(m: THREE.InstancedMesh, prof: number[], top: boolean) {
  for (let i = 0; i < SEG; i++) {
    const w = Math.max(0.02, prof[i] * H);
    _o.position.set(-LEN / 2 + (i + 0.5) * (LEN / SEG), top ? H - w / 2 : -H + w / 2, 0);
    _o.scale.set(LEN / SEG, w, 1.2); _o.updateMatrix(); m.setMatrixAt(i, _o.matrix);
  }
  m.instanceMatrix.needsUpdate = true;
}
function Depletion({ prof, top }: { prof: number[]; top: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => { if (ref.current) paint(ref.current, prof, top); }, [prof, top]);
  return <instancedMesh ref={ref} args={[undefined, undefined, SEG]} frustumCulled={false}><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color="#c8d3d9" transparent opacity={0.6} /></instancedMesh>;
}

export default function JfetLab() {
  const [P, set, reset] = useLabParams(ELEXX_SPECS.jfet);
  const { VGS, VDS, IDSS, VP } = P;
  const vgs = Math.max(VGS, VP);
  const r = jfet(vgs, VDS, IDSS, VP);
  const prof = useMemo(() => Array.from({ length: SEG }, (_, i) => depletion((i + 0.5) / SEG, vgs, VDS, VP, r.VDSsat)), [vgs, VDS, VP, r.VDSsat]);
  const family = useMemo(() => [0, 0.25, 0.5, 0.75].map((k) => ({ pts: Array.from({ length: 61 }, (_, i) => { const v = (25 * i) / 60; return [v, jfetId(VP * k, v, IDSS, VP).ID] as [number, number]; }), color: Math.abs(VP * k - vgs) < 0.05 ? C.green : "#3d5560", w: Math.abs(VP * k - vgs) < 0.05 ? 3 : 1.4 })), [IDSS, VP, vgs]);
  const own = useMemo(() => Array.from({ length: 61 }, (_, i) => { const v = (25 * i) / 60; return [v, jfetId(vgs, v, IDSS, VP).ID] as [number, number]; }), [vgs, IDSS, VP]);
  const path = useMemo<V3[]>(() => [[-LEN / 2 - 0.6, 0, 0], [LEN / 2 + 0.6, 0, 0]], []);
  return (
    <LabFrame
      label="An n-channel JFET bar: blue channel between source and drain, red p-type gates above and below, grey depletion regions that widen towards the drain until they pinch the channel; electrons flow at a rate set by the drain current"
      camera={[0.8, 1.6, 9.5]}
      onReset={reset}
      scene={() => (<group position={[-1.6, 0.4, 0]}>
        <Box p={[0, 0, 0]} s={[LEN, 2 * H, 1.2]} c={C.blue} o={0.55} />
        <Box p={[0, H + 0.25, 0]} s={[LEN * 0.7, 0.5, 1.25]} c={C.red} />
        <Box p={[0, -H - 0.25, 0]} s={[LEN * 0.7, 0.5, 1.25]} c={C.red} />
        <Box p={[-LEN / 2 - 0.3, 0, 0]} s={[0.6, 2 * H, 1.3]} c={C.light} />
        <Box p={[LEN / 2 + 0.3, 0, 0]} s={[0.6, 2 * H, 1.3]} c={C.light} />
        <Depletion prof={prof} top />
        <Depletion prof={prof} top={false} />
        {r.ID > 0.01 && <Flow path={path} n={16} speed={Math.min(1.6, 0.1 + r.ID / 8)} color={C.gold} r={0.07} />}
        <Graph x0={3.6} y0={-2.2} w={4.2} h={3.8} xr={[0, 25]} yr={[0, IDSS * 1.15]} curves={[...family, { pts: own, color: C.gold, w: 2.4 }]} marker={[VDS, r.ID]} vlines={[{ x: Math.max(0, r.VDSsat), color: C.purple }]} />
      </group>)}
      readouts={[
        ["Drain current I_D", `${r.ID.toFixed(3)} mA`],
        ["Region", r.region],
        ["Pinch-off at V_DS = V_GS − V_P", `${Math.max(0, r.VDSsat).toFixed(2)} V`],
        ["Transconductance g_m", `${r.gm.toFixed(3)} mS`],
        ["Saturation current I_DSS(1 − V_GS/V_P)²", `${(IDSS * (1 - vgs / VP) ** 2).toFixed(3)} mA`],
        ["Gate current", "≈ 0 (reverse-biased junction)"],
      ]}
      controls={<>
        <Slider label="Gate–source V_GS" value={VGS} min={-5} max={0} step={0.05} digits={2} unit=" V" onChange={(x) => set("VGS", x)} />
        <Slider label="Drain–source V_DS" value={VDS} min={0} max={25} step={0.1} digits={1} unit=" V" onChange={(x) => set("VDS", x)} />
        <Slider label="I_DSS" value={IDSS} min={2} max={20} step={0.5} digits={1} unit=" mA" onChange={(x) => set("IDSS", x)} />
        <Slider label="Pinch-off voltage V_P" value={VP} min={-6} max={-1} step={0.1} digits={1} unit=" V" onChange={(x) => set("VP", x)} />
      </>}
      note={<p>Electrons flow from source to drain through the n-channel. The p⁺ gates are reverse-biased, so depletion regions (grey) grow into the channel and narrow it; a more negative V<sub>GS</sub> squeezes harder (voltage control, almost no gate current). Because the channel voltage rises along its length, the reverse bias, and so the depletion, is largest at the <b>drain</b> end. In the <b>ohmic</b> region the channel acts as a resistor; at V<sub>DS</sub> = V<sub>GS</sub> − V<sub>P</sub> the depletion layers meet at the drain (<b>pinch-off</b>) and the current saturates at I<sub>D</sub> = I<sub>DSS</sub>(1 − V<sub>GS</sub>/V<sub>P</sub>)² (Shockley). Below V<sub>P</sub> the device is cut off. Curves: drain characteristics for V<sub>GS</sub> = 0, ¼, ½, ¾ of V<sub>P</sub> (gold = yours); 1 % channel-length modulation is included.</p>}
    />
  );
}
