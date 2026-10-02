"use client";
import { Line } from "@react-three/drei";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { channelProfile, eng, nmos } from "../sim/elex";
import { Tick, useQuality } from "../Stage";
import { LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { ELEX_SPECS } from "../meta/elex.specs";

const SLICES = 24, CL = 3.2, DOTS = 26, dummy = new THREE.Object3D();

function Channel({ Vov, VDS }: { Vov: number; VDS: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = ref.current; if (!m) return;
    for (let i = 0; i < SLICES; i++) {
      const th = 0.02 + 0.32 * channelProfile((i + 0.5) / SLICES, Vov, VDS);
      dummy.position.set(-CL / 2 + ((i + 0.5) / SLICES) * CL, 0.02 - th / 2 + 0.16, 0); dummy.scale.set(CL / SLICES * 1.02, th, 1.4); dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  }, [Vov, VDS]);
  return <instancedMesh ref={ref} args={[undefined, undefined, SLICES]}><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color="#2ba6f5" emissive="#2ba6f5" emissiveIntensity={0.35} transparent opacity={0.9} /></instancedMesh>;
}

/** Electrons drifting from source to drain; density and speed follow the drain current. Module-level: no allocation per frame. */
function paintDots(m: THREE.InstancedMesh, t: number, active: number, Vov: number, VDS: number) {
  for (let i = 0; i < DOTS; i++) {
    const u = ((i / DOTS) + t) % 1;
    const th = 0.02 + 0.32 * channelProfile(u, Vov, VDS);
    dummy.position.set(-CL / 2 + u * CL, 0.2 - th * 0.5, ((i * 37) % 11 - 5) * 0.11);
    dummy.scale.setScalar(i < active ? 1 : 0.001); dummy.updateMatrix();
    m.setMatrixAt(i, dummy.matrix);
  }
  m.instanceMatrix.needsUpdate = true;
}
function Electrons({ speed, active, Vov, VDS }: { speed: number; active: number; Vov: number; VDS: number }) {
  const ref = useRef<THREE.InstancedMesh>(null), t = useRef(0);
  const tick = (dt: number) => { t.current += Math.min(dt, 0.05) * speed; if (ref.current) paintDots(ref.current, t.current, active, Vov, VDS); };
  return (<>
    <Tick fn={tick} />
    <instancedMesh ref={ref} args={[undefined, undefined, DOTS]}><sphereGeometry args={[0.055, 8, 8]} /><meshBasicMaterial color="#ffc83d" /></instancedMesh>
  </>);
}

export default function MosfetLab() {
  const quality = useQuality();
  const [P, set, reset] = useLabParams(ELEX_SPECS.mosfet);
  const { VGS, VDS, Vt, k, lambda } = P;
  const kk = k * 1e-3;
  const M = nmos(VGS, VDS, Vt, kk, lambda);
  const family = useMemo(() => {
    const vgs = [Vt + 1, Vt + 2, Vt + 3, Vt + 4].filter((v) => v <= 8.5);
    const top = Math.max(...vgs.map((v) => nmos(v, 10, Vt, kk, lambda).ID), 1e-9);
    const lines = vgs.map((v, j) => {
      const p: [number, number, number][] = [];
      for (let i = 0; i <= 60; i++) { const d = (10 * i) / 60; p.push([(d / 10) * 3.2, (nmos(v, d, Vt, kk, lambda).ID / top) * 2.2, 0]); }
      return { p, c: ["#2ba6f5", "#44c95a", "#ffc83d", "#a970ff"][j] };
    });
    const edge: [number, number, number][] = [];
    for (let i = 0; i <= 40; i++) { const d = (i / 40) * Math.min(10, 4), vg = Vt + d; edge.push([(d / 10) * 3.2, Math.min(2.4, (nmos(vg, d, Vt, kk, lambda).ID / top) * 2.2), 0.01]); }
    return { lines, edge, top };
  }, [Vt, kk, lambda]);
  const yNow = Math.min(2.4, (M.ID / family.top) * 2.2);
  const active = Math.round(Math.min(1, Math.sqrt(M.ID / Math.max(family.top, 1e-9)) * 1.2) * (quality === "low" ? 12 : DOTS));
  const region = M.region === "triode" ? "triode (ohmic)" : M.region;
  return (
    <LabFrame
      label="Left, a cut-away n-channel MOSFET with a blue inversion layer that narrows towards the drain and yellow electrons flowing along it; right, a family of output characteristic curves with a dot at the operating point"
      camera={[0.2, 1.6, 9]}
      onReset={reset}
      scene={() => (<group>
        <group position={[-2.6, 0.5, 0]}>
          <mesh position={[0, -0.75, 0]}><boxGeometry args={[4.6, 1.1, 1.5]} /><meshStandardMaterial color="#8f7bd6" /></mesh>
          <mesh position={[-CL / 2 - 0.25, -0.05, 0]}><boxGeometry args={[0.7, 0.55, 1.5]} /><meshStandardMaterial color="#ff9a1f" /></mesh>
          <mesh position={[CL / 2 + 0.25, -0.05, 0]}><boxGeometry args={[0.7, 0.55, 1.5]} /><meshStandardMaterial color="#ff5a5f" /></mesh>
          <mesh position={[0, 0.38, 0]}><boxGeometry args={[CL, 0.08, 1.5]} /><meshStandardMaterial color="#7f8f99" /></mesh>
          <mesh position={[0, 0.66, 0]}><boxGeometry args={[CL, 0.42, 1.5]} /><meshStandardMaterial color={VGS > Vt ? "#44c95a" : "#5b6d77"} emissive={VGS > Vt ? "#44c95a" : "#000000"} emissiveIntensity={0.25} /></mesh>
          <Channel Vov={M.Vov} VDS={VDS} />
          {M.Vov > 0 && <Electrons speed={0.15 + Math.min(1.2, M.ID * 40)} active={active} Vov={M.Vov} VDS={VDS} />}
        </group>
        <group position={[1.6, -1.6, 0]}>
          <Line points={[[0, 0, 0], [3.4, 0, 0]]} color="#9db0ba" lineWidth={1.5} />
          <Line points={[[0, 0, 0], [0, 2.6, 0]]} color="#9db0ba" lineWidth={1.5} />
          {family.lines.map((l, j) => (<Line key={j} points={l.p} color={l.c} lineWidth={2.2} />))}
          <Line points={family.edge} color="#ff9a1f" lineWidth={1.4} dashed dashSize={0.1} gapSize={0.07} />
          <mesh position={[(VDS / 10) * 3.2, yNow, 0.05]}><sphereGeometry args={[0.14, 14, 14]} /><meshStandardMaterial color="#ff5a5f" emissive="#ff5a5f" emissiveIntensity={0.45} /></mesh>
        </group>
      </group>)}
      readouts={[
        ["Region", region], ["Overdrive V_ov = V_GS − V_t", `${M.Vov.toFixed(2)} V`], ["Drain current I_D", eng(M.ID, "A")],
        ["Transconductance g_m", eng(M.gm, "S")], ["Output resistance r_o", eng(M.ro, "Ω")], ["Pinch-off at V_DS =", `${Math.max(0, M.Vov).toFixed(2)} V`],
      ]}
      controls={<>
        <Slider label="Gate voltage V_GS" value={VGS} min={0} max={8} step={0.1} digits={1} unit=" V" onChange={(x) => set("VGS", x)} />
        <Slider label="Drain voltage V_DS" value={VDS} min={0} max={10} step={0.1} digits={1} unit=" V" onChange={(x) => set("VDS", x)} />
        <Slider label="Threshold V_t" value={Vt} min={0.3} max={4} step={0.1} digits={1} unit=" V" onChange={(x) => set("Vt", x)} />
        <Slider label="Device constant k′W/L" value={k} min={0.1} max={10} step={0.1} digits={1} unit=" mA/V²" onChange={(x) => set("k", x)} />
        <Slider label="Channel-length modulation λ" value={lambda} min={0} max={0.1} step={0.005} digits={3} unit=" /V" onChange={(x) => set("lambda", x)} />
      </>}
      note={<p>A positive gate voltage above V_t attracts electrons under the gate and forms the blue inversion channel joining the orange source to the red drain. In the triode region (V_DS &lt; V_GS − V_t) the current I_D = k[(V_GS − V_t)V_DS − V_DS²/2] rises with V_DS and the channel is thinner at the drain end. At V_DS = V_GS − V_t the channel pinches off at the drain; beyond that, in saturation, I_D = (k/2)(V_GS − V_t)² is nearly flat and the transistor works as an amplifier with g_m = k(V_GS − V_t). λ adds the slight upward slope (1 + λV_DS). The orange dashed curve on the graph separates the two regions. Long-channel square-law model, no body effect; the channel thickness is drawn from the gradual-channel formula, not to scale.</p>}
    />
  );
}
