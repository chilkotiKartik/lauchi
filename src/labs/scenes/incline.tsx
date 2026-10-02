"use client";
import { useRef } from "react";
import type * as THREE from "three";
import { G, incline } from "../sim/mech";
import { Tick } from "../Stage";
import { LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { MECH_SPECS } from "../meta/mech.specs";

const LEN = 6, S0 = 0.9, S1 = 5.1;

/** A force arrow of length `len` pointing along +x of its parent frame (rotate the wrapper to aim it). */
function Arrow({ len, color }: { len: number; color: string }) {
  const l = Math.max(0.05, len), shaft = Math.max(0.01, l - 0.2);
  return (<>
    <mesh position={[shaft / 2, 0, 0]}><boxGeometry args={[shaft, 0.06, 0.06]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} /></mesh>
    <mesh position={[l - 0.1, 0, 0]} rotation={[0, 0, -Math.PI / 2]}><coneGeometry args={[0.11, 0.22, 10]} /><meshStandardMaterial color={color} /></mesh>
  </>);
}

export default function InclineLab() {
  const [P, set, reset] = useLabParams(MECH_SPECS.incline);
  const { theta, m, muS, muK, P: push } = P;
  const R = incline(theta, m, muS, muK, push);
  const th = (theta * Math.PI) / 180;
  const W = R.W, sc = 2.2 / Math.max(W, Math.abs(push), 1);
  const blk = useRef<THREE.Group>(null), s = useRef(S0 + 1), v = useRef(0);
  const tick = (dt: number) => {
    const d = Math.min(dt, 0.05);
    if (R.state === "rest") { v.current = 0; } else { v.current += R.a * d * 0.35; s.current += v.current * d; }
    if (s.current > S1 || s.current < S0) { s.current = S0 + (S1 - S0) / 2; v.current = 0; }
    blk.current?.position.set(s.current, 0.32, 0);
  };
  const fr = R.friction;
  return (
    <LabFrame
      label="A block on a tilting ramp with coloured arrows for its weight, the normal force, friction and any push, sliding when the forces are unbalanced"
      camera={[0.5, 1.4, 9]}
      onReset={reset}
      scene={() => (<group position={[-2.9, -1.6, 0]}>
        <Tick fn={tick} />
        <group rotation={[0, 0, th]}>
          <mesh position={[LEN / 2, -0.12, 0]}><boxGeometry args={[LEN, 0.24, 1.6]} /><meshStandardMaterial color="#7c8d97" metalness={0.2} roughness={0.6} /></mesh>
          <group ref={blk} position={[S0 + 1, 0.32, 0]}>
            <mesh><boxGeometry args={[0.8, 0.64, 0.8]} /><meshStandardMaterial color="#ff9a1f" roughness={0.5} /></mesh>
            <group position={[0, 0, 0.5]}>
              <group rotation={[0, 0, -Math.PI / 2 - th]}><Arrow len={W * sc} color="#ff5a5f" /></group>
              <group rotation={[0, 0, Math.PI / 2]}><Arrow len={R.N * sc} color="#2ba6f5" /></group>
              {Math.abs(fr) > 1e-6 && <group rotation={[0, 0, fr > 0 ? 0 : Math.PI]}><Arrow len={Math.abs(fr) * sc} color="#ffc83d" /></group>}
              {push > 0 && <group position={[0, -0.25, 0]}><Arrow len={push * sc} color="#44c95a" /></group>}
            </group>
          </group>
        </group>
        <mesh position={[LEN * Math.cos(th) / 2, -0.03, 0]}><boxGeometry args={[LEN * Math.cos(th) + 0.4, 0.06, 1.8]} /><meshStandardMaterial color="#33454e" /></mesh>
      </group>)}
      readouts={[
        ["Weight W = mg", `${R.W.toFixed(1)} N`], ["Normal N = W cosθ", `${R.N.toFixed(1)} N`], ["Down-slope pull W sinθ", `${R.down.toFixed(1)} N`],
        ["Limiting friction μs·N", `${R.fsMax.toFixed(1)} N`], ["Friction acting", `${Math.abs(fr).toFixed(1)} N ${fr > 0 ? "up" : fr < 0 ? "down" : ""}`.trim()],
        [R.state === "rest" ? "State" : `Acceleration (${R.state} the slope)`, R.state === "rest" ? `at rest (repose ${R.repose.toFixed(1)}°)` : `${Math.abs(R.a).toFixed(2)} m/s²`],
      ]}
      controls={<>
        <Slider label="Ramp angle θ" value={theta} min={0} max={80} step={1} digits={0} unit=" °" onChange={(x) => set("theta", x)} />
        <Slider label="Mass m" value={m} min={1} max={100} step={1} digits={0} unit=" kg" onChange={(x) => set("m", x)} />
        <Slider label="Static friction μs" value={muS} min={0} max={1.5} step={0.01} digits={2} onChange={(x) => set("muS", x)} />
        <Slider label="Kinetic friction μk" value={muK} min={0} max={1.5} step={0.01} digits={2} onChange={(x) => set("muK", x)} />
        <Slider label="Push P up the slope" value={push} min={0} max={600} step={5} digits={0} unit=" N" onChange={(x) => set("P", x)} />
      </>}
      note={<p>Red is the weight mg (g = {G} m/s²), blue the normal force N = mg cosθ perpendicular to the ramp, gold the friction along the ramp and green your push P. While the pull along the slope (P − mg sinθ) is smaller than the limiting friction μs·N, static friction matches it exactly and the block stays at rest; once it is exceeded the block slides and friction drops to μk·N, so a = (P − mg sinθ − μk·N)/m (μk is not allowed above μs). With no push the block starts to slide when tanθ &gt; μs, i.e. at the angle of repose arctan μs (the angle of friction). Arrow lengths are drawn to a common scale; the sliding speed of the picture is slowed down.</p>}
    />
  );
}
