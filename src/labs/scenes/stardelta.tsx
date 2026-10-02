"use client";
import { useRef } from "react";
import type * as THREE from "three";
import { eng, starDelta } from "../sim/elecy";
import { Tick } from "../Stage";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { ELECY_SPECS } from "../meta/elecy.specs";
import { Box, C, type V3 } from "../kit";
import { Flow } from "../kit2";
import { Node, Resistor } from "./elecy-kit";

const TRI: [number, number][] = [[0, 1.55], [-1.45, -0.95], [1.45, -0.95]];          // a, b, c
const vtx = (cx: number, i: number, z = 0): V3 => [cx + TRI[i][0], TRI[i][1], z];
const DX = -2.5, SX = 2.5;                                                              // delta left, star right
const PAIRS: [number, number, number][] = [[0, 1, 2], [1, 2, 0], [2, 0, 1]];           // ab (c open), bc (a open), ca (b open)
const TERM_COL = [C.red, C.gold, C.blue];

export default function StarDeltaLab() {
  const [P, set, reset] = useLabParams(ELECY_SPECS.stardelta);
  const { R1, R2, R3, mode } = P;
  const r = starDelta(mode, R1, R2, R3);
  const d = r.delta, y = r.star;
  const dArm = [d.Rab, d.Rbc, d.Rca], sArm = [y.Ra, y.Rb, y.Rc];
  const rmax = Math.max(...dArm, ...sArm);
  const rad = (R: number) => 0.07 + 0.13 * Math.sqrt(R / rmax);
  const O: V3 = [SX, 0, 0];
  // delta arm k joins vertices (k, k+1): ab, bc, ca
  const armOf = (i: number, j: number) => (i + 1) % 3 === j ? i : j;              // index of the delta arm between two vertices
  const groups = useRef<(THREE.Group | null)[]>([]), t = useRef(0);
  const tick = (dt: number) => {
    t.current += Math.min(dt, 0.05);
    const k = Math.floor(t.current / 4) % 3;
    groups.current.forEach((g, i) => { if (g) g.visible = i === k; });
  };
  const term = [r.term.ab, r.term.bc, r.term.ca];
  return (
    <LabFrame
      label="A delta network on the left and its equivalent star on the right share terminals a, b and c; resistor thickness shows each value, and a test current entering one terminal and leaving another flows identically in both networks, cycling through the three terminal pairs"
      camera={[0, 0.6, 8.6]}
      onReset={reset}
      scene={() => (<group position={[0, 0.1, 0]}>
        <Tick fn={tick} />
        <Box p={[DX, 0.1, -0.35]} s={[4.3, 3.6, 0.1]} c="#1a3440" o={0.9} />
        <Box p={[SX, 0.1, -0.35]} s={[4.3, 3.6, 0.1]} c="#22303f" o={0.9} />
        {/* delta */}
        {[0, 1, 2].map((k) => <Resistor key={k} a={vtx(DX, k)} b={vtx(DX, (k + 1) % 3)} r={rad(dArm[k])} body={0.55} />)}
        {/* star */}
        {[0, 1, 2].map((k) => <Resistor key={k} a={vtx(SX, k)} b={O} r={rad(sArm[k])} body={0.5} />)}
        <Node p={O} c={C.purple} r={0.13} />
        {[0, 1, 2].map((k) => <group key={k}><Node p={vtx(DX, k)} c={TERM_COL[k]} r={0.15} /><Node p={vtx(SX, k)} c={TERM_COL[k]} r={0.15} /></group>)}
        {PAIRS.map(([i, j, o], n) => {
          const direct = 1 / dArm[armOf(i, j)], around = 1 / (dArm[armOf(i, o)] + dArm[armOf(o, j)]), tot = 1 / term[n];
          const v = 1.4;
          return (
            <group key={n} ref={(el) => { groups.current[n] = el; }} visible={n === 0}>
              <Flow path={[vtx(DX, i, 0.02), vtx(DX, j, 0.02)]} n={9} speed={(v * direct) / tot / 2.9} color={C.gold} r={0.07} />
              <Flow path={[vtx(DX, i, 0.02), vtx(DX, o, 0.02), vtx(DX, j, 0.02)]} n={16} speed={(v * around) / tot / 5.8} color={C.orange} r={0.07} />
              <Flow path={[vtx(SX, i, 0.02), [SX, 0, 0.02], vtx(SX, j, 0.02)]} n={10} speed={v / 3.4} color={C.gold} r={0.07} />
              <Box p={[(DX + SX) / 2, -1.75, 0]} s={[0.5, 0.12, 0.12]} c={TERM_COL[i]} glow={0.6} />
              <Box p={[(DX + SX) / 2, -1.95, 0]} s={[0.5, 0.12, 0.12]} c={TERM_COL[j]} glow={0.6} />
            </group>
          );
        })}
      </group>)}
      readouts={mode === "y2d" ? [
        ["Delta R_ab = ΣR_aR_b / R_c", eng(d.Rab, "Ω")],
        ["Delta R_bc = ΣR_aR_b / R_a", eng(d.Rbc, "Ω")],
        ["Delta R_ca = ΣR_aR_b / R_b", eng(d.Rca, "Ω")],
        ["a–b, c open (both)", eng(r.term.ab, "Ω")],
        ["b–c, a open (both)", eng(r.term.bc, "Ω")],
        ["c–a, b open (both)", eng(r.term.ca, "Ω")],
      ] : [
        ["Star R_a = R_abR_ca / ΣR", eng(y.Ra, "Ω")],
        ["Star R_b = R_abR_bc / ΣR", eng(y.Rb, "Ω")],
        ["Star R_c = R_bcR_ca / ΣR", eng(y.Rc, "Ω")],
        ["a–b, c open (both)", eng(r.term.ab, "Ω")],
        ["b–c, a open (both)", eng(r.term.bc, "Ω")],
        ["c–a, b open (both)", eng(r.term.ca, "Ω")],
      ]}
      controls={<>
        <Slider label={mode === "y2d" ? "Star arm R_a" : "Delta arm R_ab"} value={R1} min={1} max={100} step={0.5} digits={1} unit=" Ω" onChange={(x) => set("R1", x)} />
        <Slider label={mode === "y2d" ? "Star arm R_b" : "Delta arm R_bc"} value={R2} min={1} max={100} step={0.5} digits={1} unit=" Ω" onChange={(x) => set("R2", x)} />
        <Slider label={mode === "y2d" ? "Star arm R_c" : "Delta arm R_ca"} value={R3} min={1} max={100} step={0.5} digits={1} unit=" Ω" onChange={(x) => set("R3", x)} />
        <Pick label="Convert" value={mode} options={[{ id: "y2d", label: "Star → delta (you set the star)" }, { id: "d2y", label: "Delta → star (you set the delta)" }]} onChange={(x) => set("mode", x)} />
      </>}
      note={<>
        <p>Left: a <b>delta (Δ, mesh)</b> with arms R_ab, R_bc, R_ca between terminals a (red), b (gold) and c (blue). Right: the <b>star (Y)</b> with arms R_a, R_b, R_c meeting at the purple star point. Thicker resistor = larger value. Every 4 s a test current is pushed in at one terminal and out at another (the two bars at the bottom show which pair); the third terminal floats. In the delta the current splits between the direct arm (gold) and the path round the other two (orange); in the star it simply runs through two arms. The resistance seen at each pair is the same for both networks, which is what “equivalent” means.</p>
        <p><b>Δ → Y:</b> R_a = R_abR_ca/(R_ab + R_bc + R_ca) (the two delta arms touching a, over the sum). <b>Y → Δ:</b> R_ab = R_a + R_b + R_aR_b/R_c = (R_aR_b + R_bR_c + R_cR_a)/R_c. For equal arms R_Δ = 3R_Y. <b>Use it</b> to untangle bridge (Wheatstone) networks that are neither series nor parallel: replace one delta of the bridge by a star and the rest collapses to series–parallel. <b>Try:</b> make one star arm tiny and see the delta arm opposite it become huge.</p>
      </>}
    />
  );
}
