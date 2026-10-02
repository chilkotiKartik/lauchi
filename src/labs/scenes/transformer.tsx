"use client";
import { useLayoutEffect, useRef } from "react";
import * as THREE from "three";
import { si, transformer } from "../sim/elec";
import { Tick, useQuality } from "../Stage";
import { LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { ELEC_SPECS } from "../meta/elec.specs";

const CW = 3.2, CH = 2.6, DOTS = 18, dummy = new THREE.Object3D();
const turnsShown = (n: number) => Math.min(40, Math.max(4, Math.round(4 * Math.log2(n / 8))));
const _p = new THREE.Vector3();

/** Point on the rectangular core centre line, s in [0,1), clockwise from the top-left corner. */
function rectPoint(s: number, out: THREE.Vector3) {
  const per = 2 * (CW + CH), d = (((s % 1) + 1) % 1) * per;
  if (d < CW) return out.set(-CW / 2 + d, CH / 2, 0);
  if (d < CW + CH) return out.set(CW / 2, CH / 2 - (d - CW), 0);
  if (d < 2 * CW + CH) return out.set(CW / 2 - (d - CW - CH), -CH / 2, 0);
  return out.set(-CW / 2, -CH / 2 + (d - 2 * CW - CH), 0);
}

function Coil({ x, count, color }: { x: number; count: number; color: string }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = ref.current; if (!m) return;
    for (let i = 0; i < count; i++) {
      dummy.position.set(x, -0.95 + ((i + 0.5) / count) * 1.9, 0); dummy.rotation.set(Math.PI / 2, 0, 0); dummy.scale.setScalar(1); dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.count = count; m.instanceMatrix.needsUpdate = true;
  }, [x, count]);
  return <instancedMesh ref={ref} args={[undefined, undefined, 40]}><torusGeometry args={[0.5, 0.05, 8, 20]} /><meshStandardMaterial color={color} metalness={0.5} roughness={0.35} /></instancedMesh>;
}

function Flux({ speed, hot, low }: { speed: number; hot: boolean; low: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null), s = useRef(0);
  const n = low ? 10 : DOTS;
  const tick = (dt: number) => {
    s.current += Math.min(dt, 0.05) * speed;
    const m = ref.current; if (!m) return;
    for (let i = 0; i < n; i++) { rectPoint(s.current + i / n, _p); dummy.position.copy(_p); dummy.position.z = 0.3; dummy.rotation.set(0, 0, 0); dummy.scale.setScalar(1); dummy.updateMatrix(); m.setMatrixAt(i, dummy.matrix); }
    m.count = n; m.instanceMatrix.needsUpdate = true;
  };
  return (<>
    <Tick fn={tick} />
    <instancedMesh ref={ref} args={[undefined, undefined, DOTS]}><sphereGeometry args={[0.1, 10, 10]} /><meshStandardMaterial color={hot ? "#ff5a5f" : "#ffc83d"} emissive={hot ? "#ff5a5f" : "#ffc83d"} emissiveIntensity={0.6} /></instancedMesh>
  </>);
}

export default function TransformerLab() {
  const quality = useQuality();
  const [P, set, reset] = useLabParams(ELEC_SPECS.transformer);
  const { V1, N1, N2, f, RL, A } = P;
  const T = transformer(V1, N1, N2, f, RL, A);
  const coreCol = T.saturated ? "#ff6055" : T.Bm > 1.2 ? "#e59f48" : "#657682";

  return (
    <LabFrame
      label="Heavy step-up / step-down power transformer with laminated core, copper bobbins, and flux circulation"
      camera={[0, 0.8, 9.2]}
      onReset={reset}
      scene={() => (
        <group>
          {/* Main Transformer Unit */}
          <group position={[-0.8, 0, 0]}>
            {/* Base mounting foot brackets */}
            {[-CW / 2, CW / 2].map((bx, i) => (
              <mesh key={i} position={[bx, -CH / 2 - 0.35, 0]}>
                <boxGeometry args={[0.9, 0.12, 1.1]} />
                <meshStandardMaterial color="#1a252c" metalness={0.7} roughness={0.4} />
              </mesh>
            ))}

            {/* Laminated Silicon Steel Core (Top, Bottom, Left, Right Limbs) */}
            <mesh position={[0, CH / 2, 0]}>
              <boxGeometry args={[CW + 0.6, 0.55, 0.7]} />
              <meshStandardMaterial color={coreCol} metalness={0.65} roughness={0.35} />
            </mesh>
            <mesh position={[0, -CH / 2, 0]}>
              <boxGeometry args={[CW + 0.6, 0.55, 0.7]} />
              <meshStandardMaterial color={coreCol} metalness={0.65} roughness={0.35} />
            </mesh>
            <mesh position={[-CW / 2, 0, 0]}>
              <boxGeometry args={[0.55, CH, 0.7]} />
              <meshStandardMaterial color={coreCol} metalness={0.65} roughness={0.35} />
            </mesh>
            <mesh position={[CW / 2, 0, 0]}>
              <boxGeometry args={[0.55, CH, 0.7]} />
              <meshStandardMaterial color={coreCol} metalness={0.65} roughness={0.35} />
            </mesh>

            {/* Core center E-I clamping plates */}
            <mesh position={[0, 0, 0.37]}>
              <boxGeometry args={[CW + 0.65, 0.08, 0.04]} />
              <meshStandardMaterial color="#2d3c46" metalness={0.8} roughness={0.2} />
            </mesh>
            <mesh position={[0, 0, -0.37]}>
              <boxGeometry args={[CW + 0.65, 0.08, 0.04]} />
              <meshStandardMaterial color="#2d3c46" metalness={0.8} roughness={0.2} />
            </mesh>

            {/* Primary & Secondary Bobbins */}
            <mesh position={[-CW / 2, 0, 0]}>
              <cylinderGeometry args={[0.56, 0.56, 1.95, 24]} />
              <meshStandardMaterial color="#1f1812" roughness={0.6} />
            </mesh>
            <mesh position={[CW / 2, 0, 0]}>
              <cylinderGeometry args={[0.56, 0.56, 1.95, 24]} />
              <meshStandardMaterial color="#1f1812" roughness={0.6} />
            </mesh>

            {/* Copper Wire Windings */}
            <Coil x={-CW / 2} count={turnsShown(N1)} color="#e67e22" />
            <Coil x={CW / 2} count={turnsShown(N2)} color="#2ecc71" />

            {/* Banana Terminal Posts on top of windings */}
            {[-0.2, 0.2].map((dx, i) => (
              <group key={i} position={[-CW / 2 + dx, CH / 2 + 0.38, 0]}>
                <mesh>
                  <cylinderGeometry args={[0.07, 0.07, 0.22, 16]} />
                  <meshStandardMaterial color={i === 0 ? "#ff5a5f" : "#1a252c"} roughness={0.3} metalness={0.4} />
                </mesh>
                <mesh position={[0, 0.12, 0]}>
                  <cylinderGeometry args={[0.04, 0.04, 0.08, 16]} />
                  <meshStandardMaterial color="#cca43b" metalness={0.9} roughness={0.2} />
                </mesh>
              </group>
            ))}

            {[-0.2, 0.2].map((dx, i) => (
              <group key={i} position={[CW / 2 + dx, CH / 2 + 0.38, 0]}>
                <mesh>
                  <cylinderGeometry args={[0.07, 0.07, 0.22, 16]} />
                  <meshStandardMaterial color={i === 0 ? "#ff5a5f" : "#1a252c"} roughness={0.3} metalness={0.4} />
                </mesh>
                <mesh position={[0, 0.12, 0]}>
                  <cylinderGeometry args={[0.04, 0.04, 0.08, 16]} />
                  <meshStandardMaterial color="#cca43b" metalness={0.9} roughness={0.2} />
                </mesh>
              </group>
            ))}

            {/* Magnetic Flux Circulation Particles */}
            <Flux speed={Math.min(0.5, 0.06 + f / 500)} hot={T.saturated} low={quality === "low"} />
          </group>

          {/* Instrument Load Panel & Meter Columns */}
          <group position={[3.2, -0.4, 0]}>
            {/* Bench Enclosure Base */}
            <mesh position={[0.4, -1.3, 0]}>
              <boxGeometry args={[2.2, 0.2, 1.4]} />
              <meshStandardMaterial color="#1a252c" roughness={0.5} metalness={0.5} />
            </mesh>

            {/* Primary & Secondary Voltage Indicator Columns */}
            <group position={[0, -1.15, 0]}>
              <mesh position={[0, vh(V1) / 2, 0]}>
                <boxGeometry args={[0.42, vh(V1), 0.42]} />
                <meshStandardMaterial color="#e67e22" emissive="#e67e22" emissiveIntensity={0.45} metalness={0.3} roughness={0.25} />
              </mesh>
              <mesh position={[0.8, vh(T.V2) / 2, 0]}>
                <boxGeometry args={[0.42, vh(T.V2), 0.42]} />
                <meshStandardMaterial color="#2ecc71" emissive="#2ecc71" emissiveIntensity={0.45} metalness={0.3} roughness={0.25} />
              </mesh>
            </group>
          </group>
        </group>
      )}
      readouts={[
        ["Turns ratio N1:N2", `${N1}:${N2} (${T.kind})`], ["Secondary voltage V₂", `${T.V2.toFixed(1)} V`], ["Secondary current I₂", si(T.I2, "A")],
        ["Primary current I₁", si(T.I1, "A")], ["Peak flux Φm = V₁/4.44fN₁", si(T.phim, "Wb")], ["Flux density B_m", `${T.Bm.toFixed(2)} T${T.saturated ? " — saturated!" : ""}`],
      ]}
      controls={<>
        <Slider label="Primary voltage V₁" value={V1} min={10} max={440} step={1} digits={0} unit=" V" onChange={(x) => set("V1", x)} />
        <Slider label="Primary turns N1" value={N1} min={50} max={2000} step={10} digits={0} onChange={(x) => set("N1", x)} />
        <Slider label="Secondary turns N2" value={N2} min={10} max={4000} step={10} digits={0} onChange={(x) => set("N2", x)} />
        <Slider label="Frequency f" value={f} min={16} max={400} step={1} digits={0} unit=" Hz" onChange={(x) => set("f", x)} />
        <Slider label="Load resistance R_L" value={RL} min={1} max={500} step={1} digits={0} unit=" Ω" onChange={(x) => set("RL", x)} />
        <Slider label="Core area" value={A} min={2} max={100} step={1} digits={0} unit=" cm²" onChange={(x) => set("A", x)} />
      </>}
      note={<p>Alternating current in the orange primary sets up a changing flux (yellow dots) in the iron core; it links the green secondary and induces V₂/V₁ = N2/N1. The EMF equation gives the peak flux Φm = V₁/(4.44·f·N₁) and B_m = Φm/A. An ideal transformer keeps power constant, so V₁I₁ = V₂I₂ and I₁/I₂ = N2/N1: stepping the voltage up steps the current down. The number of drawn turns only follows the real count roughly (log scale). Above about 1.6 T silicon steel saturates; the core and the flux dots turn red. Ideal model: no winding resistance, leakage flux or core loss.</p>}
    />
  );
}
