"use client";
import { useMemo } from "react";
import { centriPump } from "../sim/mechy";
import { LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { MECHY_SPECS } from "../meta/mechy.specs";
import { Panel, Poly, type V3 } from "../kit";
import { Arrow, C, Flow, Rod } from "../kit2";
import { Spinner } from "./mechy-kit";

const D2R = Math.PI / 180;

/** One backward-curved vane from r1 to r2: dθ/dr = 1/(r tan β), β varying linearly from β1 to β2. */
function vane(r1: number, r2: number, b1: number, b2: number, a0: number): V3[] {
  const n = 24, out: V3[] = [];
  let th = a0;
  for (let i = 0; i <= n; i++) {
    const r = r1 + ((r2 - r1) * i) / n;
    out.push([r * Math.cos(th), r * Math.sin(th), 0.12]);
    const b = (b1 + ((b2 - b1) * i) / n) * D2R;
    th += ((r2 - r1) / n) / (r * Math.tan(b));
  }
  return out;
}

/** Spiral volute casing around the impeller and its delivery pipe. */
function volute(r2: number): V3[] {
  const out: V3[] = [];
  for (let i = 0; i <= 60; i++) { const a = (i / 60) * Math.PI * 2, r = r2 * (1.12 + 0.4 * (i / 60)); out.push([r * Math.cos(-a + Math.PI / 2), r * Math.sin(-a + Math.PI / 2), 0.05]); }
  return out;
}

export default function CentriPumpLab() {
  const [P, set, reset] = useLabParams(MECHY_SPECS.centripump);
  const { N, D2, D1, b2, beta1, beta2 } = P;
  const p = centriPump(N, D1, D2, b2, beta1, beta2);
  const R2 = 0.8 + 1.0 * ((D2 - 100) / 500), R1 = Math.min(0.85 * R2, R2 * (D1 / D2));
  const vanes = useMemo(() => Array.from({ length: 7 }, (_, i) => vane(R1, R2, beta1, beta2, (i / 7) * Math.PI * 2)), [R1, R2, beta1, beta2]);
  const casing = useMemo(() => volute(R2), [R2]);
  const flowPath = useMemo(() => { const v = volute(R2); const end = v[v.length - 1]; return [[0, 0, 0.6], ...vane(R1 * 0.5, R2 * 1.15, beta1, beta2, 0).map(([x, y]) => [-x, y, 0.15] as V3), ...v.slice(10), [end[0] + 1.6, end[1], 0.05]] as V3[]; }, [R1, R2, beta1, beta2]);
  // Outlet velocity triangle (drawn beside the pump): u₂ along x, V_f along y.
  const k = 1.9 / Math.max(p.u2, p.V2, 1e-6), O: V3 = [2.7, -1.3, 0.05];
  const tipU: V3 = [O[0] + p.u2 * k, O[1], 0.05], tipV: V3 = [O[0] + p.Vw2 * k, O[1] + p.Vf * k, 0.05];
  const valid = D1 < D2 && p.Vw2 > 0;
  const spin = -Math.min(9, N / 200);
  const vw: V3 = [O[0] + p.Vw2 * k, O[1] - 0.25, 0.05];
  return (
    <LabFrame
      label="A centrifugal pump seen from the front: water enters at the eye, backward-curved vanes on the spinning impeller fling it outwards into a spiral volute casing and up the delivery pipe; beside it, the outlet velocity triangle shows blade speed, absolute and relative velocities"
      camera={[0.6, 0.3, 9.5]}
      onReset={reset}
      scene={() => (<group>
        <group position={[-1.7, 0.2, 0]} rotation={[0.05, 0.25, 0]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.1]}><cylinderGeometry args={[R2 * 1.6, R2 * 1.6, 0.12, 48]} /><meshStandardMaterial color={C.dark} /></mesh>
          <Poly pts={casing} c={C.light} w={5} />
          <Rod a={[casing[casing.length - 1][0], casing[casing.length - 1][1], 0.05]} b={[casing[casing.length - 1][0] + 1.7, casing[casing.length - 1][1], 0.05]} r={0.32} color={C.blue} o={0.3} />
          <Rod a={[0, 0, 0.1]} b={[0, 0, 1.6]} r={R1 * 0.85} color={C.blue} o={0.22} />
          <Spinner speed={spin}>
            <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[R2, R2, 0.08, 48]} /><meshStandardMaterial color={C.grey} metalness={0.5} roughness={0.35} /></mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.1]}><cylinderGeometry args={[R1 * 0.45, R1 * 0.45, 0.2, 24]} /><meshStandardMaterial color={C.dark} /></mesh>
            {vanes.map((v, i) => <Poly key={i} pts={v} c={C.gold} w={4} />)}
          </Spinner>
          <Flow path={flowPath} n={22} speed={Math.min(0.6, 0.05 + N / 6000)} color={C.blue} r={0.06} />
        </group>
        <Panel p={[3.65, -0.4, -0.02]} w={2.6} h={2.9} />
        <Arrow from={O} to={tipU} color={C.gold} r={0.035} head={0.16} />
        {valid && <Arrow from={O} to={tipV} color={C.blue} r={0.035} head={0.16} />}
        {valid && <Arrow from={tipU} to={tipV} color={C.purple} r={0.035} head={0.16} />}
        <Arrow from={[tipV[0], O[1], 0.05]} to={tipV} color={C.green} r={0.025} head={0.12} />
        {valid && <Poly pts={[[O[0], O[1] - 0.25, 0.05], vw]} c={C.orange} w={3} />}
      </group>)}
      readouts={[
        ["Blade tip speed u₂ = πD₂N/60", `${p.u2.toFixed(2)} m/s (inlet u₁ = ${p.u1.toFixed(2)})`],
        ["Velocity of flow V_f = u₁ tan β₁", `${p.Vf.toFixed(3)} m/s`],
        ["Whirl at outlet V_w2 = u₂ − V_f/tan β₂", valid ? `${p.Vw2.toFixed(2)} m/s` : "invalid (needs D₁ < D₂ and V_w2 > 0)"],
        ["Work per newton V_w2·u₂/g (Euler head)", `${p.H.toFixed(2)} N·m/N = ${p.H.toFixed(2)} m`],
        ["Discharge Q = πD₂b₂V_f", `${(p.Q * 1000).toFixed(1)} L/s`],
        ["Power given to water ρgQH", `${(p.P / 1000).toFixed(2)} kW`],
      ]}
      controls={<>
        <Slider label="Speed N" value={N} min={500} max={3000} step={10} digits={0} unit=" rpm" onChange={(x) => set("N", x)} />
        <Slider label="Outer (outlet) diameter D₂" value={D2} min={100} max={600} step={5} digits={0} unit=" mm" onChange={(x) => set("D2", x)} />
        <Slider label="Inner (inlet) diameter D₁" value={D1} min={50} max={300} step={5} digits={0} unit=" mm" onChange={(x) => set("D1", x)} />
        <Slider label="Outlet width b₂" value={b2} min={5} max={80} step={1} digits={0} unit=" mm" onChange={(x) => set("b2", x)} />
        <Slider label="Vane angle at inlet β₁" value={beta1} min={10} max={60} step={1} digits={0} unit="°" onChange={(x) => set("beta1", x)} />
        <Slider label="Vane angle at outlet β₂" value={beta2} min={15} max={90} step={1} digits={0} unit="°" onChange={(x) => set("beta2", x)} />
      </>}
      note={<>
        <p>A <b>centrifugal pump</b> is a reaction turbine run backwards: an electric motor spins the <b>impeller</b>, water enters at the centre (the <b>eye</b>), the vanes whirl it outwards, and the spiral <b>volute casing</b> slows it down so its kinetic energy becomes pressure head. It must be <b>primed</b> (filled with water) before starting, because spinning air cannot lift water. (A <b>reciprocating pump</b> instead pushes water with a piston and valves; it gives high head at small, pulsating flow.)</p>
        <p className="mt-2">Water enters radially (no whirl), so the energy given per newton is the <b>Euler head</b> H = V<sub>w2</sub>u₂/g. The outlet <b>velocity triangle</b>: blade speed u₂ (gold), relative velocity along the vane V<sub>r2</sub> at β₂ (purple), absolute velocity V₂ (blue), its whirl component V<sub>w2</sub> (orange) and flow component V<sub>f</sub> (green). Head grows with N² and D₂²; radial vanes (β₂ = 90°) give H = u₂²/g. Try the textbook example (R.K. Bansal): D 200/400 mm, 1200 rpm, vanes 20°/30° → 44.1 N·m of work per newton. Ideal (no losses): real manometric head is ~70–85 % of this.</p>
      </>}
    />
  );
}
