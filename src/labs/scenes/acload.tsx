"use client";
import { useMemo, useRef } from "react";
import { acLoad, acPoint } from "../sim/elexy";
import { Tick } from "../Stage";
import { LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { ELEXY_SPECS } from "../meta/elexy.specs";
import { C, Panel, type V3 } from "../kit";
import { Graph, Rod, type XY } from "../kit2";
import { Tracer, Wire } from "./elexy-kit";

const GX = -2.2, GY = -1.2, GW = 6.2, GH = 4.2;

export default function AcLoadLab() {
  const [P, set, reset] = useLabParams(ELEXY_SPECS.acload);
  const { ICQ, VCC, RC, RE, RL, ip } = P;
  const L = acLoad(VCC, RC, RE, RL, ICQ);
  const xmax = Math.max(VCC, L.vceOff) * 1.08, ymax = Math.max(L.icDcSat, L.icSat) * 1.08;
  const X = (v: number) => GX + (GW * v) / xmax, Yc = (i: number) => GY + (GH * i) / ymax;
  const phase = useRef(0);
  const tick = (dt: number) => { phase.current = (phase.current + Math.min(dt, 0.05) * 0.25) % 1; };
  const W = useMemo(() => {
    const Lm = acLoad(VCC, RC, RE, RL, ICQ), x = (v: number) => GX + (GW * v) / xmax, y = (i: number) => GY + (GH * i) / ymax;
    const op: V3[] = [], icw: V3[] = [], vcw: V3[] = [];
    const N = 160;
    for (let i = 0; i <= N; i++) {
      const th = (2 * Math.PI * 2 * i) / N, [v, c] = acPoint(Lm, ip, th), u = i / N;
      op.push([x(v), y(c), 0.08]);
      icw.push([GX - 0.25 - 2.2 * u, y(c), 0.04]); // i_c(t): time runs to the left of the I_C axis
      vcw.push([x(v), GY - 0.25 - 2.0 * u, 0.04]); // v_ce(t): time runs down below the V_CE axis
    }
    return { op, icw, vcw };
  }, [VCC, RC, RE, RL, ICQ, ip, xmax, ymax]);
  const clipHi = ip > L.IC + 1e-9, clipLo = ip * L.rac > L.VCEQ + 1e-9;
  const yours = Math.min(ip, L.IC) * L.rac + Math.min(ip * L.rac, L.VCEQ);
  const dc: XY[] = [[0, L.icDcSat], [VCC, 0]], ac: XY[] = [[0, L.icSat], [L.vceOff, 0]];
  const half = L.swing / 2;
  return (
    <LabFrame
      label="A transistor output-characteristic plane with the orange DC load line, the steeper purple AC load line through the red Q point, a green bar marking the largest symmetrical swing, and a gold operating point sliding along the AC line; the collector-current wave is drawn to the left and the V_CE wave below, flattening where the signal clips"
      camera={[-0.6, -0.8, 11.5]}
      onReset={reset}
      scene={() => (<group>
        <Tick fn={tick} />
        <Graph x0={GX} y0={GY} w={GW} h={GH} xr={[0, xmax]} yr={[0, ymax]} curves={[{ pts: dc, color: C.orange, w: 3 }, { pts: ac, color: C.purple, w: 3 }]} marker={[L.VCEQ, L.IC]} markerColor={C.red} />
        {half > 1e-3 && <Rod a={[X(L.VCEQ - half), Yc(L.IC + half / L.rac), 0.06]} b={[X(L.VCEQ + half), Yc(L.IC - half / L.rac), 0.06]} r={0.07} color={C.green} glow={0.6} />}
        <Wire pts={[[X(L.VCEQ), GY, 0.03], [X(L.VCEQ), Yc(L.IC), 0.03]]} c={C.red} w={1.2} />
        <Wire pts={[[GX, Yc(L.IC), 0.03], [X(L.VCEQ), Yc(L.IC), 0.03]]} c={C.red} w={1.2} />
        <Panel p={[GX - 1.35, Yc(ymax / 2), -0.01]} w={2.5} h={GH} c="#16303b" />
        <Panel p={[GX + GW / 2, GY - 1.25, -0.01]} w={GW} h={2.3} c="#16303b" />
        <Wire pts={W.icw} c={clipHi || clipLo ? C.red : C.gold} w={2.6} />
        <Wire pts={W.vcw} c={clipHi || clipLo ? C.red : C.blue} w={2.6} />
        <Tracer pts={W.op} phase={phase} color={C.gold} r={0.13} />
        <Tracer pts={W.icw} phase={phase} color={C.gold} r={0.08} />
        <Tracer pts={W.vcw} phase={phase} color={C.blue} r={0.08} />
      </group>)}
      readouts={[
        ["Q point V_CEQ, I_CQ", `${L.VCEQ.toFixed(2)} V, ${L.IC.toFixed(2)} mA`],
        ["r_dc = R_C + R_E / r_ac = R_C ‖ R_L", `${L.rdc.toFixed(2)} kΩ / ${L.rac.toFixed(2)} kΩ`],
        ["AC line ends: V_CE(off), I_C(sat)", `${L.vceOff.toFixed(2)} V, ${L.icSat.toFixed(2)} mA`],
        ["Max symmetrical swing (p-p)", `${L.swing.toFixed(2)} V (limited by ${L.limit})`],
        ["Optimum I_CQ = V_CC/(r_dc + r_ac)", `${L.ICopt.toFixed(2)} mA`],
        ["Your signal output (p-p)", `${yours.toFixed(2)} V${clipHi || clipLo ? ` (clips at ${clipHi && clipLo ? "both ends" : clipHi ? "cut-off" : "saturation"})` : ""}`],
      ]}
      controls={<>
        <Slider label="Quiescent current I_CQ" value={ICQ} min={0.1} max={6} step={0.05} digits={2} unit=" mA" onChange={(x) => set("ICQ", x)} />
        <Slider label="Supply V_CC" value={VCC} min={5} max={30} step={0.5} digits={1} unit=" V" onChange={(x) => set("VCC", x)} />
        <Slider label="Collector resistor R_C" value={RC} min={0.5} max={10} step={0.1} digits={1} unit=" kΩ" onChange={(x) => set("RC", x)} />
        <Slider label="Emitter resistor R_E (bypassed)" value={RE} min={0} max={5} step={0.1} digits={1} unit=" kΩ" onChange={(x) => set("RE", x)} />
        <Slider label="Load R_L" value={RL} min={0.5} max={50} step={0.1} digits={1} unit=" kΩ" onChange={(x) => set("RL", x)} />
        <Slider label="Signal: collector current peak" value={ip} min={0} max={6} step={0.05} digits={2} unit=" mA" onChange={(x) => set("ip", x)} />
      </>}
      note={<>
        <p><b>Graphical analysis of a CE amplifier.</b> For DC the capacitors are open, so the collector circuit sees R<sub>C</sub> + R<sub>E</sub>: the <b>DC load line</b> (orange) V<sub>CE</sub> = V<sub>CC</sub> − I<sub>C</sub>(R<sub>C</sub> + R<sub>E</sub>) runs from V<sub>CC</sub> to V<sub>CC</sub>/(R<sub>C</sub> + R<sub>E</sub>), and the bias fixes the <b>Q point</b> on it. For the signal the coupling and bypass capacitors are shorts, so the collector sees only r<sub>ac</sub> = R<sub>C</sub> ‖ R<sub>L</sub>: the <b>AC load line</b> (purple) passes through Q with the steeper slope −1/r<sub>ac</sub>, meeting the axes at V<sub>CEQ</sub> + I<sub>CQ</sub>r<sub>ac</sub> and I<sub>CQ</sub> + V<sub>CEQ</sub>/r<sub>ac</sub>.</p>
        <p>The operating point (gold) slides along the AC line. It cannot go below I<sub>C</sub> = 0 (<b>cut-off</b>) or past V<sub>CE</sub> = 0 (<b>saturation</b>), so the largest undistorted output is 2·min(V<sub>CEQ</sub>, I<sub>CQ</sub>r<sub>ac</sub>) peak-to-peak (green bar). It is largest when Q sits at the middle of the AC line, I<sub>CQ</sub> = V<sub>CC</sub>/(r<sub>dc</sub> + r<sub>ac</sub>).</p>
        <p><b>Try:</b> raise the signal until the waves (i<sub>c</sub> to the left, v<sub>ce</sub> below) turn red and flatten, then move I<sub>CQ</sub> to the optimum value. Simplified model: ideal transistor (V<sub>CE(sat)</sub> = 0), R<sub>E</sub> fully bypassed.</p>
      </>}
    />
  );
}
