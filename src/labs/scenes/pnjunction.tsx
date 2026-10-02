"use client";
import { Line } from "@react-three/drei";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { EG_SI, fermiBelowEc, fmtSI, pnJunction, prng, type PnInfo } from "../sim/physics";
import { Tick, useQuality } from "../Stage";
import { LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { PHYSICS_SPECS } from "../meta/physics.specs";

const XL = -4.5, XR = 4.5, BAR_Y = -1.9, NMAX = 60, Y_BAND = 0.9, E_SCALE = 0.5;
const dummy = new THREE.Object3D();
const rnd = prng(41);
const mk = (f: () => number) => Float32Array.from({ length: NMAX }, f);
const U0 = mk(rnd), U1 = mk(rnd), YR = mk(() => rnd() - 0.5), ZR = mk(() => rnd() - 0.5), W1 = mk(() => 2 + 4 * rnd()), W2 = mk(() => 2 + 4 * rnd()), PH = mk(() => rnd() * 6.283);

/** Drawn (log-scaled) half-widths of the depletion region on the p and n sides. */
function drawnWidths(j: PnInfo): { vp: number; vn: number } {
  if (j.W <= 0) return { vp: 0, vn: 0 };
  const total = Math.min(6.4, Math.max(0.3, 0.55 + 1.05 * Math.log10((j.W * 1e9) / 30)));
  let vp = (total * j.xp) / j.W, vn = (total * j.xn) / j.W;
  const big = Math.max(vp, vn);
  if (big > 4.2) { vp *= 4.2 / big; vn *= 4.2 / big; }
  return { vp, vn };
}

interface Flow { nh: number; ne: number; vp: number; vn: number; jit: number }
function paintCarriers(holes: THREE.InstancedMesh, elecs: THREE.InstancedMesh, f: Flow, drift: number, t: number) {
  const lp = -f.vp - XL, ln = XR - f.vn;
  for (let i = 0; i < NMAX; i++) {
    const j = f.jit * 0.06 * Math.sin(t * W1[i] + PH[i]), k = f.jit * 0.05 * Math.sin(t * W2[i] + PH[i] * 2);
    if (i < f.nh) {
      const u = (((U0[i] + drift) % 1) + 1) % 1;
      dummy.position.set(XL + lp * u + j, BAR_Y + YR[i] * 0.7 + k, ZR[i] * 1.5); dummy.scale.setScalar(1);
    } else { dummy.position.set(0, BAR_Y, 0); dummy.scale.setScalar(0.0001); }
    dummy.updateMatrix(); holes.setMatrixAt(i, dummy.matrix);
    if (i < f.ne) {
      const u = (((U1[i] - drift) % 1) + 1) % 1;
      dummy.position.set(f.vn + ln * u + j, BAR_Y + YR[i] * 0.7 + k, ZR[(i * 7) % NMAX] * 1.5); dummy.scale.setScalar(1);
    } else { dummy.position.set(0, BAR_Y, 0); dummy.scale.setScalar(0.0001); }
    dummy.updateMatrix(); elecs.setMatrixAt(i, dummy.matrix);
  }
  holes.instanceMatrix.needsUpdate = true; elecs.instanceMatrix.needsUpdate = true;
}

function Carriers({ flow, speed }: { flow: Flow; speed: number }) {
  const h = useRef<THREE.InstancedMesh>(null), e = useRef<THREE.InstancedMesh>(null), drift = useRef(0), t = useRef(0);
  useLayoutEffect(() => { if (h.current && e.current) paintCarriers(h.current, e.current, flow, drift.current, t.current); }, [flow]);
  const tick = (dt: number) => {
    const d = Math.min(dt, 0.05); t.current += d; drift.current += speed * d;
    if (h.current && e.current) paintCarriers(h.current, e.current, flow, drift.current, t.current);
  };
  return (<>
    <Tick fn={tick} />
    <instancedMesh ref={h} args={[undefined, undefined, NMAX]} frustumCulled={false}><sphereGeometry args={[0.11, 12, 10]} /><meshStandardMaterial color="#ff5a5f" emissive="#ff5a5f" emissiveIntensity={0.5} /></instancedMesh>
    <instancedMesh ref={e} args={[undefined, undefined, NMAX]} frustumCulled={false}><sphereGeometry args={[0.09, 12, 10]} /><meshStandardMaterial color="#2ba6f5" emissive="#2ba6f5" emissiveIntensity={0.5} /></instancedMesh>
  </>);
}

/** Band-edge polylines (x, y in scene units) for the drawn depletion widths. Energies in eV relative to Ec on the n side. */
function bands(j: PnInfo, V: number, vp: number, vn: number, efn: number) {
  const Vb = Math.max(0, j.Vbi - V), fp = j.W > 0 ? j.xp / j.W : 0.5, dp = Vb * fp, dn = Vb - dp;
  const ec: [number, number, number][] = [], ev: [number, number, number][] = [];
  const add = (x: number, e: number) => { ec.push([x, Y_BAND + E_SCALE * e, 0]); ev.push([x, Y_BAND + E_SCALE * (e - EG_SI), 0]); };
  add(XL, Vb);
  if (vp > 0 && vn > 0) {
    for (let i = 0; i <= 20; i++) { const x = -vp + (vp * i) / 20; add(x, Vb - dp * ((x + vp) / vp) ** 2); }
    for (let i = 1; i <= 20; i++) { const x = (vn * i) / 20; add(x, dn * ((vn - x) / vn) ** 2); }
  } else add(0, Vb);
  add(XR, 0);
  const yn = Y_BAND + E_SCALE * -efn, yp = Y_BAND + E_SCALE * (-efn - V);
  const ef: [number, number, number][] = [[XL, yp, 0], [-vp, yp, 0], [vn, yn, 0], [XR, yn, 0]];
  return { ec, ev, ef };
}

export default function PnJunctionLab() {
  const quality = useQuality();
  const [P, set, reset] = useLabParams(PHYSICS_SPECS.pnjunction);
  const { logNa, logNd, V, T } = P;
  const setNa = (x: (typeof P)["logNa"]) => set("logNa", x), setNd = (x: (typeof P)["logNd"]) => set("logNd", x), setV = (x: (typeof P)["V"]) => set("V", x), setT = (x: (typeof P)["T"]) => set("T", x);
  const j = useMemo(() => pnJunction(logNa, logNd, V, T), [logNa, logNd, V, T]);
  const { vp, vn } = drawnWidths(j);
  const scale = quality === "low" ? 0.5 : 1;
  const nh = Math.round((10 + 12.5 * (logNa - 14)) * scale), ne = Math.round((10 + 12.5 * (logNd - 14)) * scale);
  const flow = useMemo<Flow>(() => ({ nh, ne, vp, vn, jit: T / 300 }), [nh, ne, vp, vn, T]);
  const speed = V > 1e-9 ? 0.06 + 0.9 * (V / 0.7) ** 2 : V < -1e-9 ? -0.03 : 0;
  const efn = fermiBelowEc(logNd, T);
  const b = useMemo(() => bands(j, V, vp, vn, efn), [j, V, vp, vn, efn]);
  const biasTxt = j.bias === "forward" ? (j.collapsed ? "Forward (V ≥ V_bi)" : "Forward") : j.bias === "reverse" ? "Reverse" : "Zero (equilibrium)";
  return (
    <LabFrame
      label="A silicon p-n junction bar with holes and electrons drifting, a shaded depletion region, and the bent energy-band diagram above it"
      camera={[0, 1.2, 12.5]}
      onReset={reset}
      scene={() => (<group>
        <mesh position={[(XL - vp) / 2, BAR_Y, 0]}><boxGeometry args={[-vp - XL, 1.2, 2.2]} /><meshStandardMaterial color="#ff5a5f" transparent opacity={0.28} depthWrite={false} /></mesh>
        <mesh position={[(XR + vn) / 2, BAR_Y, 0]}><boxGeometry args={[XR - vn, 1.2, 2.2]} /><meshStandardMaterial color="#2ba6f5" transparent opacity={0.28} depthWrite={false} /></mesh>
        {vp > 0 && <mesh position={[-vp / 2, BAR_Y, 0]}><boxGeometry args={[vp, 1.2, 2.2]} /><meshStandardMaterial color="#a970ff" transparent opacity={0.55} depthWrite={false} /></mesh>}
        {vn > 0 && <mesh position={[vn / 2, BAR_Y, 0]}><boxGeometry args={[vn, 1.2, 2.2]} /><meshStandardMaterial color="#a970ff" transparent opacity={0.55} depthWrite={false} /></mesh>}
        <Line points={[[0, BAR_Y - 0.9, 0], [0, Y_BAND + E_SCALE * Math.max(0, j.Vbi - V) + 0.4, 0]]} color="#5b6d77" lineWidth={1} transparent opacity={0.6} />
        <Line points={b.ec} color="#2ba6f5" lineWidth={3.5} />
        <Line points={b.ev} color="#ff5a5f" lineWidth={3.5} />
        <Line points={b.ef} color="#44c95a" lineWidth={2.5} />
        <Carriers flow={flow} speed={speed} />
      </group>)}
      readouts={[
        ["Built-in potential V_bi", `${j.Vbi.toFixed(3)} V`],
        ["Depletion width W", j.collapsed ? "≈ 0 (bands flat)" : fmtSI(j.W, "m")],
        ["x_p (p side) | x_n (n side)", j.collapsed ? "—" : `${fmtSI(j.xp, "m", 2)} | ${fmtSI(j.xn, "m", 2)}`],
        ["Saturation current Iₛ", fmtSI(j.Is, "A")],
        ["Diode current I", fmtSI(j.I, "A")],
        ["Bias", biasTxt],
      ]}
      controls={<>
        <Slider label="Acceptors Nₐ, log₁₀ (cm⁻³)" value={logNa} min={14} max={18} step={0.1} digits={1} onChange={setNa} />
        <Slider label="Donors N_d, log₁₀ (cm⁻³)" value={logNd} min={14} max={18} step={0.1} digits={1} onChange={setNd} />
        <Slider label="Applied bias V" value={V} min={-5} max={0.7} step={0.05} digits={2} unit=" V" onChange={setV} />
        <Slider label="Temperature T" value={T} min={250} max={400} step={5} digits={0} unit=" K" onChange={setT} />
      </>}
      note={<p>Red is p-type silicon (holes, the majority carriers) and blue is n-type (electrons). Near the junction they diffuse across and leave behind fixed ions: the purple depletion region, with built-in potential V_bi = (kT/q) ln(NₐN_d/nᵢ²), where nᵢ = 1.5 × 10¹⁰ cm⁻³ for Si at 300 K. Its width is W = √(2ε(V_bi − V)(Nₐ + N_d)/(q NₐN_d)) with ε = 11.7 ε₀, and it extends further into the lightly doped side. Forward bias (V &gt; 0) lowers the barrier V_bi − V, shrinks W and lets carriers stream across; reverse bias raises the barrier and widens W. Above the bar the bands bend by the barrier: Ec blue, Ev red, Fermi level E_F green (it splits by qV under bias). Current is the Shockley equation I = Iₛ(e^(qV/kT) − 1) with Iₛ = 10 fA at 300 K, scaled by nᵢ² at other temperatures. Simplified model: the depletion width is drawn on a log scale, and the ideal-diode equation ignores series resistance and breakdown.</p>}
    />
  );
}
