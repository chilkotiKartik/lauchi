"use client";
import { Line } from "@react-three/drei";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { EG_SI, fermiBelowEc, fmtSI, pnJunction, prng, type PnInfo } from "../sim/physics";
import { Tick, useQuality } from "../Stage";
import { LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { PHYSICS_SPECS } from "../meta/physics.specs";

const XL = -4.5,
  XR = 4.5,
  BAR_Y = -1.9,
  NMAX = 60,
  Y_BAND = 0.9,
  E_SCALE = 0.5;
const dummy = new THREE.Object3D();
const rnd = prng(41);
const mk = (f: () => number) => Float32Array.from({ length: NMAX }, f);
const U0 = mk(rnd),
  U1 = mk(rnd),
  YR = mk(() => rnd() - 0.5),
  ZR = mk(() => rnd() - 0.5),
  W1 = mk(() => 2 + 4 * rnd()),
  W2 = mk(() => 2 + 4 * rnd()),
  PH = mk(() => rnd() * 6.283);

/** Drawn half-widths of the depletion region */
function drawnWidths(j: PnInfo): { vp: number; vn: number } {
  if (j.W <= 0) return { vp: 0, vn: 0 };
  const total = Math.min(6.4, Math.max(0.3, 0.55 + 1.05 * Math.log10((j.W * 1e9) / 30)));
  let vp = (total * j.xp) / j.W,
    vn = (total * j.xn) / j.W;
  const big = Math.max(vp, vn);
  if (big > 4.2) {
    vp *= 4.2 / big;
    vn *= 4.2 / big;
  }
  return { vp, vn };
}

interface Flow {
  nh: number;
  ne: number;
  vp: number;
  vn: number;
  jit: number;
}
function paintCarriers(holes: THREE.InstancedMesh, elecs: THREE.InstancedMesh, f: Flow, drift: number, t: number) {
  const lp = -f.vp - XL,
    ln = XR - f.vn;
  for (let i = 0; i < NMAX; i++) {
    const j = f.jit * 0.06 * Math.sin(t * W1[i] + PH[i]),
      k = f.jit * 0.05 * Math.sin(t * W2[i] + PH[i] * 2);
    if (i < f.nh) {
      const u = (((U0[i] + drift) % 1) + 1) % 1;
      dummy.position.set(XL + lp * u + j, BAR_Y + YR[i] * 0.7 + k, ZR[i] * 1.5);
      dummy.scale.setScalar(1);
    } else {
      dummy.position.set(0, BAR_Y, 0);
      dummy.scale.setScalar(0.0001);
    }
    dummy.updateMatrix();
    holes.setMatrixAt(i, dummy.matrix);
    if (i < f.ne) {
      const u = (((U1[i] - drift) % 1) + 1) % 1;
      dummy.position.set(f.vn + ln * u + j, BAR_Y + YR[i] * 0.7 + k, ZR[(i * 7) % NMAX] * 1.5);
      dummy.scale.setScalar(1);
    } else {
      dummy.position.set(0, BAR_Y, 0);
      dummy.scale.setScalar(0.0001);
    }
    dummy.updateMatrix();
    elecs.setMatrixAt(i, dummy.matrix);
  }
  holes.instanceMatrix.needsUpdate = true;
  elecs.instanceMatrix.needsUpdate = true;
}

function Carriers({ flow, speed }: { flow: Flow; speed: number }) {
  const h = useRef<THREE.InstancedMesh>(null),
    e = useRef<THREE.InstancedMesh>(null),
    drift = useRef(0),
    t = useRef(0);
  useLayoutEffect(() => {
    if (h.current && e.current) paintCarriers(h.current, e.current, flow, drift.current, t.current);
  }, [flow]);
  const tick = (dt: number) => {
    const d = Math.min(dt, 0.05);
    t.current += d;
    drift.current += speed * d;
    if (h.current && e.current) paintCarriers(h.current, e.current, flow, drift.current, t.current);
  };
  return (
    <>
      <Tick fn={tick} />
      <instancedMesh ref={h} args={[undefined, undefined, NMAX]} frustumCulled={false}>
        <sphereGeometry args={[0.11, 14, 12]} />
        <meshStandardMaterial color="#f87171" emissive="#ef4444" emissiveIntensity={0.8} />
      </instancedMesh>
      <instancedMesh ref={e} args={[undefined, undefined, NMAX]} frustumCulled={false}>
        <sphereGeometry args={[0.09, 14, 12]} />
        <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={0.8} />
      </instancedMesh>
    </>
  );
}

function bands(j: PnInfo, V: number, vp: number, vn: number, efn: number) {
  const Vb = Math.max(0, j.Vbi - V),
    fp = j.W > 0 ? j.xp / j.W : 0.5,
    dp = Vb * fp,
    dn = Vb - dp;
  const ec: [number, number, number][] = [],
    ev: [number, number, number][] = [];
  const add = (x: number, e: number) => {
    ec.push([x, Y_BAND + E_SCALE * e, 0]);
    ev.push([x, Y_BAND + E_SCALE * (e - EG_SI), 0]);
  };
  add(XL, Vb);
  if (vp > 0 && vn > 0) {
    for (let i = 0; i <= 20; i++) {
      const x = -vp + (vp * i) / 20;
      add(x, Vb - dp * ((x + vp) / vp) ** 2);
    }
    for (let i = 1; i <= 20; i++) {
      const x = (vn * i) / 20;
      add(x, dn * ((vn - x) / vn) ** 2);
    }
  } else add(0, Vb);
  add(XR, 0);
  const yn = Y_BAND + E_SCALE * -efn,
    yp = Y_BAND + E_SCALE * (-efn - V);
  const ef: [number, number, number][] = [
    [XL, yp, 0],
    [-vp, yp, 0],
    [vn, yn, 0],
    [XR, yn, 0],
  ];
  return { ec, ev, ef };
}

export default function PnJunctionLab() {
  const quality = useQuality();
  const [P, set, reset] = useLabParams(PHYSICS_SPECS.pnjunction);
  const { logNa, logNd, V, T } = P;
  const setNa = (x: (typeof P)["logNa"]) => set("logNa", x);
  const setNd = (x: (typeof P)["logNd"]) => set("logNd", x);
  const setV = (x: (typeof P)["V"]) => set("V", x);
  const setT = (x: (typeof P)["T"]) => set("T", x);

  const j = useMemo(() => pnJunction(logNa, logNd, V, T), [logNa, logNd, V, T]);
  const { vp, vn } = drawnWidths(j);
  const scale = quality === "low" ? 0.5 : 1;
  const nh = Math.round((10 + 12.5 * (logNa - 14)) * scale),
    ne = Math.round((10 + 12.5 * (logNd - 14)) * scale);
  const flow = useMemo<Flow>(() => ({ nh, ne, vp, vn, jit: T / 300 }), [nh, ne, vp, vn, T]);
  const speed = V > 1e-9 ? 0.06 + 0.9 * (V / 0.7) ** 2 : V < -1e-9 ? -0.03 : 0;
  const efn = fermiBelowEc(logNd, T);
  const b = useMemo(() => bands(j, V, vp, vn, efn), [j, V, vp, vn, efn]);
  const biasTxt =
    j.bias === "forward"
      ? j.collapsed
        ? "Forward Bias (V ≥ V_bi, Barrier Collapsed)"
        : "Forward Bias (Barrier Lowered)"
      : j.bias === "reverse"
      ? "Reverse Bias (Barrier Widened)"
      : "Thermal Equilibrium (Zero Bias)";

  return (
    <LabFrame
      label="Semiconductor PN Junction Diode: silicon crystal lattice, depletion region barrier, hole/electron carrier flow, and energy band diagram"
      camera={[0, 0.4, 9.8]}
      onReset={reset}
      note={
        <p>
          At a metallurgical PN junction, majority carrier diffusion creates a <b>space-charge depletion region</b> depleted of free mobile carriers, establishing a built-in potential barrier <b>V<sub>bi</sub> = (kT/q) · ln(N<sub>A</sub>N<sub>D</sub> / n<sub>i</sub>²)</b>. Forward bias (+ on P, − on N) lowers this potential hill to allow exponential diffusion current, whereas reverse bias widens the barrier.
        </p>
      }
      scene={() => (
        <group>
          {/* Semiconductor Crystal Physical Block */}
          <group position={[0, BAR_Y, 0]}>
            {/* P-Type Region Block (Acceptor dopant host) */}
            <mesh position={[(XL - vp) / 2, 0, 0]}>
              <boxGeometry args={[Math.max(0.1, -vp - XL), 1.6, 2.0]} />
              <meshStandardMaterial color="#1e1b4b" transparent opacity={0.6} roughness={0.3} />
            </mesh>
            {/* N-Type Region Block (Donor dopant host) */}
            <mesh position={[(XR + vn) / 2, 0, 0]}>
              <boxGeometry args={[Math.max(0.1, XR - vn), 1.6, 2.0]} />
              <meshStandardMaterial color="#082f49" transparent opacity={0.6} roughness={0.3} />
            </mesh>
            {/* Depletion Space-Charge Region (Electric Field Barrier) */}
            <mesh position={[(-vp + vn) / 2, 0, 0]}>
              <boxGeometry args={[Math.max(0.1, vp + vn), 1.65, 2.05]} />
              <meshStandardMaterial
                color="#eab308"
                emissive="#ca8a04"
                emissiveIntensity={0.25}
                transparent
                opacity={0.3}
                roughness={0.2}
              />
            </mesh>

            {/* Heavy Anode & Cathode Metallic Terminals */}
            <mesh position={[XL - 0.25, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.2, 0.2, 0.5, 20]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.95} />
            </mesh>
            <mesh position={[XR + 0.25, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.2, 0.2, 0.5, 20]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.95} />
            </mesh>
          </group>

          {/* Dynamic Charge Carriers (Red Holes & Blue Electrons) */}
          <Carriers flow={flow} speed={speed} />

          {/* Upper Energy Band Diagram (Conduction Band Ec, Valence Band Ev, Fermi Level Ef) */}
          <group position={[0, 0, 0]}>
            <Line points={b.ec} color="#38bdf8" lineWidth={3.5} />
            <Line points={b.ev} color="#f87171" lineWidth={3.5} />
            <Line points={b.ef} color="#22c55e" lineWidth={2} dashed dashSize={0.14} gapSize={0.08} />
          </group>
        </group>
      )}
      readouts={[
        ["Operating State", biasTxt],
        ["Built-in Potential V_bi", `${j.Vbi.toFixed(3)} V`],
        ["Total Depletion Width W", `${(j.W * 1e9).toFixed(1)} nm`],
        ["Maximum Electric Field E_max", fmtSI(j.Emax, "V/m")],
        ["Reverse Saturation Current I_s", fmtSI(j.Is, "A")],
        ["Shockley Diode Current I", fmtSI(j.I, "A")],
      ]}
      controls={
        <>
          <Slider label="Acceptor concentration N_A" value={logNa} min={14} max={18} step={0.1} digits={1} unit=" (10ˣ cm⁻³)" onChange={setNa} />
          <Slider label="Donor concentration N_D" value={logNd} min={14} max={18} step={0.1} digits={1} unit=" (10ˣ cm⁻³)" onChange={setNd} />
          <Slider label="Applied Voltage V" value={V} min={-2.0} max={0.8} step={0.02} digits={2} unit=" V" onChange={setV} />
          <Slider label="Temperature T" value={T} min={200} max={450} step={5} digits={0} unit=" K" onChange={setT} />
        </>
      }
    />
  );
}
