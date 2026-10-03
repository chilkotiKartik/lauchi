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

/** One backward-curved vane from r1 to r2 */
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

/** Spiral volute casing around the impeller and its delivery pipe */
function volute(r2: number): V3[] {
  const out: V3[] = [];
  for (let i = 0; i <= 60; i++) {
    const a = (i / 60) * Math.PI * 2, r = r2 * (1.15 + 0.45 * (i / 60));
    out.push([r * Math.cos(-a + Math.PI / 2), r * Math.sin(-a + Math.PI / 2), 0.05]);
  }
  return out;
}

export default function CentriPumpLab() {
  const [P, set, reset] = useLabParams(MECHY_SPECS.centripump);
  const { N, D2, D1, b2, beta1, beta2 } = P;
  const p = centriPump(N, D1, D2, b2, beta1, beta2);
  const R2 = 0.8 + 1.0 * ((D2 - 100) / 500), R1 = Math.min(0.85 * R2, R2 * (D1 / D2));
  const vanes = useMemo(() => Array.from({ length: 7 }, (_, i) => vane(R1, R2, beta1, beta2, (i / 7) * Math.PI * 2)), [R1, R2, beta1, beta2]);
  const casing = useMemo(() => volute(R2), [R2]);
  const flowPath = useMemo(() => {
    const v = volute(R2);
    const end = v[v.length - 1];
    return [
      [0, 0, 0.7],
      ...vane(R1 * 0.5, R2 * 1.15, beta1, beta2, 0).map(([x, y]) => [-x, y, 0.18] as V3),
      ...v.slice(10),
      [end[0] + 1.8, end[1], 0.08],
    ] as V3[];
  }, [R1, R2, beta1, beta2]);

  const k = 1.9 / Math.max(p.u2, p.V2, 1e-6), O: V3 = [2.7, -1.3, 0.05];
  const tipU: V3 = [O[0] + p.u2 * k, O[1], 0.05], tipV: V3 = [O[0] + p.Vw2 * k, O[1] + p.Vf * k, 0.05];
  const valid = D1 < D2 && p.Vw2 > 0;
  const spin = -Math.min(9, N / 200);
  const vw: V3 = [O[0] + p.Vw2 * k, O[1] - 0.25, 0.05];

  return (
    <LabFrame
      label="Centrifugal Water Pump: cast iron volute casing, backward-curved impeller vanes, suction eye, delivery pipe, and outlet velocity triangle"
      camera={[0.6, 0.3, 9.5]}
      onReset={reset}
      note={
        <p>
          Centrifugal pumps convert rotational kinetic energy from an electric motor/engine into hydrostatic pressure head. Fluid enters axially through the <b>eye of the impeller</b> and is accelerated radially outwards by backward-curved vanes into the expanding <b>volute casing</b>, converting kinetic velocity head into useful static pressure head.
        </p>
      }
      scene={() => (
        <group>
          <group position={[-1.7, 0.2, 0]} rotation={[0.05, 0.25, 0]}>
            {/* Cast Iron Volute Casing Outer Shell */}
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.12]}>
              <cylinderGeometry args={[R2 * 1.75, R2 * 1.75, 0.24, 48]} />
              <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.35} />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.08]}>
              <cylinderGeometry args={[R2 * 1.55, R2 * 1.55, 0.12, 48, 1, true]} />
              <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.4} side={2} />
            </mesh>

            {/* Volute contour wire & flange */}
            <Poly pts={casing} c="#38bdf8" w={5} />

            {/* Discharge Delivery Pipe Flange */}
            <Rod
              a={[casing[casing.length - 1][0], casing[casing.length - 1][1], 0.05]}
              b={[casing[casing.length - 1][0] + 1.8, casing[casing.length - 1][1], 0.05]}
              r={0.34}
              color="#0284c7"
              o={0.5}
            />

            {/* Suction Inlet Flanged Eye Pipe */}
            <Rod a={[0, 0, 0.1]} b={[0, 0, 1.8]} r={R1 * 0.88} color="#0284c7" o={0.4} />

            {/* Spinning Machined Bronze Impeller */}
            <Spinner speed={spin}>
              {/* Back shroud plate */}
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[R2, R2, 0.1, 48]} />
                <meshStandardMaterial color="#ca8a04" metalness={0.85} roughness={0.2} />
              </mesh>
              {/* Impeller Hub Nose Cone */}
              <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.12]}>
                <coneGeometry args={[R1 * 0.45, 0.25, 24]} />
                <meshStandardMaterial color="#eab308" metalness={0.9} roughness={0.15} />
              </mesh>
              {/* Backward-curved 3D Vanes */}
              {vanes.map((v, i) => (
                <Poly key={i} pts={v} c="#facc15" w={5} />
              ))}
            </Spinner>

            {/* High-Velocity Fluid Streamlines */}
            <Flow path={flowPath} n={26} speed={Math.min(0.8, 0.06 + N / 5000)} color="#38bdf8" r={0.07} />
          </group>

          {/* Velocity Triangle Diagram Panel */}
          <Panel p={[3.65, -0.4, -0.02]} w={2.6} h={2.9} />
          <Arrow from={O} to={tipU} color={C.gold} r={0.035} head={0.16} />
          {valid && <Arrow from={O} to={tipV} color={C.blue} r={0.035} head={0.16} />}
          {valid && <Arrow from={tipU} to={tipV} color={C.purple} r={0.035} head={0.16} />}
          <Arrow from={[tipV[0], O[1], 0.05]} to={tipV} color={C.green} r={0.025} head={0.12} />
          {valid && <Poly pts={[[O[0], O[1] - 0.25, 0.05], vw]} c={C.orange} w={3} />}
        </group>
      )}
      readouts={[
        ["Blade tip speed u₂ = πD₂N/60", `${p.u2.toFixed(2)} m/s (inlet u₁ = ${p.u1.toFixed(2)})`],
        ["Velocity of flow V_f = u₁ tan β₁", `${p.Vf.toFixed(3)} m/s`],
        ["Whirl at outlet V_w2 = u₂ − V_f/tan β₂", valid ? `${p.Vw2.toFixed(2)} m/s` : "invalid parameters"],
        ["Work per newton V_w2·u₂/g (Euler head)", `${p.H.toFixed(2)} m`],
        ["Discharge flow rate Q", `${(p.Q * 1000).toFixed(1)} L/s`],
        ["Power imparted to water ρgQH", `${(p.P / 1000).toFixed(2)} kW`],
      ]}
      controls={
        <>
          <Slider label="Impeller speed N" value={N} min={500} max={3000} step={25} digits={0} unit=" rpm" onChange={(x) => set("N", x)} />
          <Slider label="Outlet diameter D₂" value={D2} min={150} max={600} step={5} digits={0} unit=" mm" onChange={(x) => set("D2", x)} />
          <Slider label="Inlet diameter D₁" value={D1} min={50} max={300} step={5} digits={0} unit=" mm" onChange={(x) => set("D1", x)} />
          <Slider label="Vane width at outlet b₂" value={b2} min={10} max={80} step={1} digits={0} unit=" mm" onChange={(x) => set("b2", x)} />
          <Slider label="Vane angle at inlet β₁" value={beta1} min={15} max={60} step={1} digits={0} unit="°" onChange={(x) => set("beta1", x)} />
          <Slider label="Vane angle at outlet β₂" value={beta2} min={15} max={60} step={1} digits={0} unit="°" onChange={(x) => set("beta2", x)} />
        </>
      }
    />
  );
}
