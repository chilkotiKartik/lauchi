"use client";
import { useMemo, useRef } from "react";
import type * as THREE from "three";
import { fullWave, si } from "../sim/elexy";
import { Tick } from "../Stage";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { ELEXY_SPECS } from "../meta/elexy.specs";
import { C, Box, type V3 } from "../kit";
import { Coil, Flow, Graph, Rod, type XY } from "../kit2";
import { Diode, Res, Tracer, Wire } from "./elexy-kit";

/* Bridge: AC at the top (P) and bottom (Q) corners, + at the right (R), − at the left (L). */
const P: V3 = [0, 1.3, 0], Q: V3 = [0, -1.3, 0], R: V3 = [1.3, 0, 0], L: V3 = [-1.3, 0, 0];
const ST: V3 = [-2.6, 1.6, 0], SB: V3 = [-2.6, -1.6, 0], SM: V3 = [-2.6, 0, 0];
const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
/** Load sits behind the bridge (z = −1.4) so the return wire never crosses the AC leads. */
const LOAD_A: V3 = [2.6, 0, 0], LOAD_B: V3 = [2.6, 0, -1.4];
const BRIDGE_POS: V3[] = [[-2.6, 1.6, 0], [0, 1.6, 0], P, R, LOAD_A, LOAD_B, [-1.3, 0, -1.4], L, Q, [0, -1.6, 0], [-2.6, -1.6, 0]];
const BRIDGE_NEG: V3[] = [[-2.6, -1.6, 0], [0, -1.6, 0], Q, R, LOAD_A, LOAD_B, [-1.3, 0, -1.4], L, P, [0, 1.6, 0], [-2.6, 1.6, 0]];
/* Centre-tap: D1 from the top end, D2 from the bottom end, both to the output node O; load from O back to the centre tap. */
const O: V3 = [1.6, 0, 0];
const CT_POS: V3[] = [ST, [-1.2, 1.6, 0], [0.6, 1.6, 0], [1.6, 1.6, 0], O, [0.4, 0, 0], [-1.4, 0, 0], SM];
const CT_NEG: V3[] = [SB, [-1.2, -1.6, 0], [0.6, -1.6, 0], [1.6, -1.6, 0], O, [0.4, 0, 0], [-1.4, 0, 0], SM];

function Glow({ a, b, color }: { a: V3; b: V3; color: string }) {
  return <Rod a={lerp(a, b, 0.3)} b={lerp(a, b, 0.7)} r={0.22} color={color} glow={0.9} o={0.35} />;
}

export default function BridgeRectLab() {
  const [P_, set, reset] = useLabParams(ELEXY_SPECS.bridgerect);
  const { Vm, topo, RL, rd, Vg } = P_;
  const r = fullWave(topo, Vm, RL, rd, Vg);
  const bridge = topo === "bridge";
  const phase = useRef(0), pos = useRef<THREE.Group>(null), neg = useRef<THREE.Group>(null);
  const tick = (dt: number) => {
    phase.current = (phase.current + Math.min(dt, 0.05) * 0.3) % 1;
    const s = Math.sin(2 * Math.PI * phase.current);
    if (pos.current) pos.current.visible = s > 0.05;
    if (neg.current) neg.current.visible = s < -0.05;
  };
  const g = useMemo(() => {
    const vin: XY[] = [], vout: XY[] = [];
    for (let i = 0; i <= 200; i++) { const t = (2 * i) / 200, s = Math.sin(2 * Math.PI * t); vin.push([t, Vm * s]); vout.push([t, r.Im * RL * Math.abs(s) * (Math.abs(s) * Vm > r.nd * Vg ? 1 : 0)]); }
    return { vin, vout };
  }, [Vm, RL, Vg, r.Im, r.nd]);
  const tracer = useMemo<V3[]>(() => g.vout.map(([t, v]) => [-4.4 + (t / 2) * 8.8, -4.8 + 2.1 * ((v + 1.1 * Vm) / (2.2 * Vm)), 0.05]), [g.vout, Vm]);
  const sp = Math.min(1.4, 0.25 + r.Im * 3);
  return (
    <LabFrame
      label="A transformer feeding either a four-diode bridge or a two-diode centre-tap rectifier in 3-D; the conducting diodes glow and charges flow through them and the load in each half-cycle, always in the same direction through the load; a graph below shows the input sine and the full-wave rectified output"
      camera={[0.6, 0.2, 11.5]}
      onReset={reset}
      scene={() => (<group>
        <Tick fn={tick} />
        <group position={[-0.2, 0.6, 0]}>
          <Box p={[-3.55, 0, 0]} s={[0.3, 3.6, 0.9]} c={C.grey} />
          <group rotation={[0, 0, Math.PI / 2]}>
            <Coil p={[0, 4.15, 0]} turns={9} r={0.35} len={2.8} color={C.orange} />
            <Coil p={[0, 2.95, 0]} turns={bridge ? 9 : 14} r={0.35} len={2.8} color={C.blue} />
          </group>
          {bridge ? (<>
            <Wire pts={[ST, [0, 1.6, 0], P]} /><Wire pts={[SB, [0, -1.6, 0], Q]} />
            <Diode a={P} b={R} /><Diode a={Q} b={R} /><Diode a={L} b={P} /><Diode a={L} b={Q} />
            <Wire pts={[R, LOAD_A]} c={C.red} /><Res a={LOAD_A} b={LOAD_B} glow={Math.min(1, r.eta)} />
            <Wire pts={[LOAD_B, [-1.3, 0, -1.4], L]} c={C.blue} />
            <group ref={pos}><Glow a={P} b={R} color={C.orange} /><Glow a={L} b={Q} color={C.orange} /><Flow path={BRIDGE_POS} n={22} speed={sp * 0.5} color={C.gold} r={0.07} cap={24} /></group>
            <group ref={neg}><Glow a={Q} b={R} color={C.green} /><Glow a={L} b={P} color={C.green} /><Flow path={BRIDGE_NEG} n={22} speed={sp * 0.5} color={C.gold} r={0.07} cap={24} /></group>
          </>) : (<>
            <Wire pts={[ST, [-1.2, 1.6, 0]]} /><Diode a={[-1.2, 1.6, 0]} b={[0.6, 1.6, 0]} /><Wire pts={[[0.6, 1.6, 0], [1.6, 1.6, 0], O]} c={C.red} />
            <Wire pts={[SB, [-1.2, -1.6, 0]]} /><Diode a={[-1.2, -1.6, 0]} b={[0.6, -1.6, 0]} /><Wire pts={[[0.6, -1.6, 0], [1.6, -1.6, 0], O]} c={C.red} />
            <Wire pts={[O, [0.4, 0, 0]]} c={C.red} /><Res a={[0.4, 0, 0]} b={[-1.4, 0, 0]} glow={Math.min(1, r.eta)} /><Wire pts={[[-1.4, 0, 0], SM]} c={C.blue} />
            <group ref={pos}><Glow a={[-1.2, 1.6, 0]} b={[0.6, 1.6, 0]} color={C.orange} /><Flow path={CT_POS} n={16} speed={sp * 0.6} color={C.gold} r={0.07} cap={18} /></group>
            <group ref={neg}><Glow a={[-1.2, -1.6, 0]} b={[0.6, -1.6, 0]} color={C.green} /><Flow path={CT_NEG} n={16} speed={sp * 0.6} color={C.gold} r={0.07} cap={18} /></group>
          </>)}
        </group>
        <Graph x0={-4.4} y0={-4.8} w={8.8} h={2.1} xr={[0, 2]} yr={[-Vm * 1.1, Vm * 1.1]} curves={[{ pts: g.vin, color: C.blue, w: 1.6, dashed: true }, { pts: g.vout, color: C.gold, w: 3 }, { pts: [[0, r.Vdc], [2, r.Vdc]], color: C.green, w: 2 }]} />
        <Tracer pts={tracer} phase={phase} color={C.red} r={0.1} />
      </group>)}
      readouts={[
        ["Peak load current I_m", si(r.Im, "A")],
        ["I_dc = 2I_m/π  (V_dc)", `${si(r.Idc, "A")}  (${r.Vdc.toFixed(1)} V)`],
        ["I_rms = I_m/√2", si(r.Irms, "A")],
        ["Rectification efficiency η", `${(r.eta * 100).toFixed(1)} %`],
        ["PIV per diode", `${r.PIV.toFixed(1)} V (${bridge ? "V_m" : "2V_m"})`],
        ["Ripple γ · TUF · ripple freq.", `${r.ripple.toFixed(3)} · ${r.TUF} · 2f = 100 Hz`],
      ]}
      controls={<>
        <Slider label="Secondary peak V_m" value={Vm} min={5} max={400} step={0.1} digits={1} unit=" V" onChange={(x) => set("Vm", x)} />
        <Pick label="Circuit" value={topo} options={[{ id: "bridge", label: "Bridge (4 diodes)" }, { id: "ct", label: "Centre-tap (2 diodes)" }]} onChange={(x) => set("topo", x)} />
        <Slider label="Load resistance R_L" value={RL} min={100} max={5000} step={10} digits={0} unit=" Ω" onChange={(x) => set("RL", x)} />
        <Slider label="Diode forward resistance r_d" value={rd} min={0} max={50} step={1} digits={0} unit=" Ω" onChange={(x) => set("rd", x)} />
        <Slider label="Diode cut-in voltage V_γ" value={Vg} min={0} max={0.8} step={0.05} digits={2} unit=" V" onChange={(x) => set("Vg", x)} />
      </>}
      note={<>
        <p>Both circuits are <b>full-wave</b>: current flows through the load in the same direction in both half-cycles, so the output is |sin| with average I<sub>dc</sub> = 2I<sub>m</sub>/π, I<sub>rms</sub> = I<sub>m</sub>/√2, ripple factor γ = √((I<sub>rms</sub>/I<sub>dc</sub>)² − 1) = 0.482 and ripple at 2f. Efficiency η = P<sub>dc</sub>/P<sub>ac</sub> = (8/π²)·R<sub>L</sub>/(R<sub>L</sub> + n r<sub>d</sub>) ≤ 81.2 %.</p>
        <p>The <b>bridge</b> puts two diodes in series (orange pair on + half-cycles, green pair on − half-cycles), so I<sub>m</sub> = (V<sub>m</sub> − 2V<sub>γ</sub>)/(R<sub>L</sub> + 2r<sub>d</sub>), but it needs no centre tap, each diode sees only PIV = V<sub>m</sub> and TUF = 0.812. The <b>centre-tap</b> uses one diode at a time, but its secondary must be twice as long (2V<sub>m</sub> end to end), each diode must block PIV = 2V<sub>m</sub>, and TUF is only 0.693.</p>
        <p><b>Try:</b> the presets reproduce two PYQs. Switch between bridge and centre-tap and compare PIV and η. Simplified model: diodes are a cut-in voltage plus a resistor, and I<sub>dc</sub> = 2I<sub>m</sub>/π ignores the short dead zone near zero.</p>
      </>}
    />
  );
}
