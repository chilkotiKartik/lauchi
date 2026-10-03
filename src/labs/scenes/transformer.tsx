"use client";
import { useLayoutEffect, useRef } from "react";
import * as THREE from "three";
import { si, transformer } from "../sim/elec";
import { Tick, useQuality } from "../Stage";
import { LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { ELEC_SPECS } from "../meta/elec.specs";

const CW = 3.2, CH = 2.6, DOTS = 22, dummy = new THREE.Object3D();
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
    const m = ref.current;
    if (!m) return;
    for (let i = 0; i < count; i++) {
      dummy.position.set(x, -0.95 + ((i + 0.5) / count) * 1.9, 0);
      dummy.rotation.set(Math.PI / 2, 0, 0);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.count = count;
    m.instanceMatrix.needsUpdate = true;
  }, [x, count]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, 40]}>
      <torusGeometry args={[0.54, 0.065, 12, 24]} />
      <meshStandardMaterial color={color} metalness={0.8} roughness={0.25} />
    </instancedMesh>
  );
}

function Flux({ speed, hot, low }: { speed: number; hot: boolean; low: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null), s = useRef(0);
  const n = low ? 12 : DOTS;
  const tick = (dt: number) => {
    s.current += Math.min(dt, 0.05) * speed;
    const m = ref.current;
    if (!m) return;
    for (let i = 0; i < n; i++) {
      rectPoint(s.current + i / n, _p);
      dummy.position.copy(_p);
      dummy.position.z = 0.38;
      dummy.rotation.set(0, 0, 0);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.count = n;
    m.instanceMatrix.needsUpdate = true;
  };
  return (
    <>
      <Tick fn={tick} />
      <instancedMesh ref={ref} args={[undefined, undefined, DOTS]}>
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshStandardMaterial
          color={hot ? "#ef4444" : "#eab308"}
          emissive={hot ? "#dc2626" : "#f59e0b"}
          emissiveIntensity={1.2}
          roughness={0.1}
        />
      </instancedMesh>
    </>
  );
}

export default function TransformerLab() {
  const quality = useQuality();
  const [P, set, reset] = useLabParams(ELEC_SPECS.transformer);
  const { V1, N1, N2, f, RL, A } = P;
  const T = transformer(V1, N1, N2, f, RL, A);
  const coreCol = T.saturated ? "#ef4444" : T.Bm > 1.2 ? "#f59e0b" : "#475569";
  const vh = (v: number) => Math.min(2.0, Math.max(0.08, (v / 440) * 1.8));

  return (
    <LabFrame
      label="Industrial Power Transformer: laminated silicon steel core, copper windings, ceramic porcelain bushings, and magnetic flux circulation"
      camera={[0, 0.8, 9.2]}
      onReset={reset}
      note={
        <p>
          Alternating voltage across the primary coil induces a dynamic magnetic flux in the laminated silicon steel core according to the transformer EMF equation: <b>E = 4.44 · f · N · Φ<sub>m</sub></b>. Ideal voltage ratio satisfies <b>V<sub>2</sub> / V<sub>1</sub> = N<sub>2</sub> / N<sub>1</sub></b>. Core saturation occurs above ~1.5 Tesla when silicon steel domain alignment saturates.
        </p>
      }
      scene={() => (
        <group>
          {/* Main Transformer Unit */}
          <group position={[-0.8, 0, 0]}>
            {/* Base heavy-duty channel iron mounting rails */}
            {[-CW / 2, CW / 2].map((bx, i) => (
              <mesh key={i} position={[bx, -CH / 2 - 0.38, 0]}>
                <boxGeometry args={[1.0, 0.16, 1.2]} />
                <meshStandardMaterial color="#0f172a" metalness={0.85} roughness={0.3} />
              </mesh>
            ))}

            {/* Laminated Silicon Steel Core (Top, Bottom, Left, Right Limbs) */}
            <mesh position={[0, CH / 2, 0]}>
              <boxGeometry args={[CW + 0.65, 0.62, 0.75]} />
              <meshStandardMaterial color={coreCol} metalness={0.7} roughness={0.3} />
            </mesh>
            <mesh position={[0, -CH / 2, 0]}>
              <boxGeometry args={[CW + 0.65, 0.62, 0.75]} />
              <meshStandardMaterial color={coreCol} metalness={0.7} roughness={0.3} />
            </mesh>
            <mesh position={[-CW / 2, 0, 0]}>
              <boxGeometry args={[0.62, CH, 0.75]} />
              <meshStandardMaterial color={coreCol} metalness={0.7} roughness={0.3} />
            </mesh>
            <mesh position={[CW / 2, 0, 0]}>
              <boxGeometry args={[0.62, CH, 0.75]} />
              <meshStandardMaterial color={coreCol} metalness={0.7} roughness={0.3} />
            </mesh>

            {/* Core Clamping Tie-Rods with Hex Nuts */}
            {[-1, 1].map((sideZ, i) => (
              <group key={i} position={[0, CH / 2, sideZ * 0.42]}>
                <mesh rotation={[0, 0, Math.PI / 2]}>
                  <cylinderGeometry args={[0.04, 0.04, CW + 0.8, 16]} />
                  <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
                </mesh>
              </group>
            ))}

            {/* Primary & Secondary Insulation Bobbins */}
            <mesh position={[-CW / 2, 0, 0]}>
              <cylinderGeometry args={[0.58, 0.58, 2.0, 24]} />
              <meshStandardMaterial color="#1e1b18" roughness={0.7} />
            </mesh>
            <mesh position={[CW / 2, 0, 0]}>
              <cylinderGeometry args={[0.58, 0.58, 2.0, 24]} />
              <meshStandardMaterial color="#1e1b18" roughness={0.7} />
            </mesh>

            {/* Copper Wire Windings */}
            <Coil x={-CW / 2} count={turnsShown(N1)} color="#ea580c" />
            <Coil x={CW / 2} count={turnsShown(N2)} color="#16a34a" />

            {/* Ribbed Porcelain High-Voltage Bushings on Top */}
            {[-0.22, 0.22].map((dx, i) => (
              <group key={i} position={[-CW / 2 + dx, CH / 2 + 0.45, 0]}>
                {[0, 0.1, 0.2].map((by, j) => (
                  <mesh key={j} position={[0, by, 0]}>
                    <cylinderGeometry args={[0.12, 0.08, 0.08, 16]} />
                    <meshStandardMaterial color="#64748b" roughness={0.2} metalness={0.1} />
                  </mesh>
                ))}
                <mesh position={[0, 0.32, 0]}>
                  <cylinderGeometry args={[0.04, 0.04, 0.16, 16]} />
                  <meshStandardMaterial color="#eab308" metalness={0.9} />
                </mesh>
              </group>
            ))}

            {[-0.22, 0.22].map((dx, i) => (
              <group key={i} position={[CW / 2 + dx, CH / 2 + 0.45, 0]}>
                {[0, 0.1, 0.2].map((by, j) => (
                  <mesh key={j} position={[0, by, 0]}>
                    <cylinderGeometry args={[0.12, 0.08, 0.08, 16]} />
                    <meshStandardMaterial color="#64748b" roughness={0.2} metalness={0.1} />
                  </mesh>
                ))}
                <mesh position={[0, 0.32, 0]}>
                  <cylinderGeometry args={[0.04, 0.04, 0.16, 16]} />
                  <meshStandardMaterial color="#eab308" metalness={0.9} />
                </mesh>
              </group>
            ))}

            {/* Magnetic Flux Circulation Particles */}
            <Flux speed={Math.min(0.5, 0.06 + f / 500)} hot={T.saturated} low={quality === "low"} />
          </group>

          {/* Instrument Load Panel & Meter Columns */}
          <group position={[3.2, -0.4, 0]}>
            <mesh position={[0.4, -1.3, 0]}>
              <boxGeometry args={[2.2, 0.2, 1.4]} />
              <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.6} />
            </mesh>

            {/* Primary & Secondary Voltage Indicator Columns */}
            <group position={[0, -1.15, 0]}>
              <mesh position={[0, vh(V1) / 2, 0]}>
                <boxGeometry args={[0.44, vh(V1), 0.44]} />
                <meshStandardMaterial
                  color="#ea580c"
                  emissive="#ea580c"
                  emissiveIntensity={0.6}
                  metalness={0.2}
                  roughness={0.2}
                />
              </mesh>
              <mesh position={[0.8, vh(T.V2) / 2, 0]}>
                <boxGeometry args={[0.44, vh(T.V2), 0.44]} />
                <meshStandardMaterial
                  color="#16a34a"
                  emissive="#16a34a"
                  emissiveIntensity={0.6}
                  metalness={0.2}
                  roughness={0.2}
                />
              </mesh>
            </group>
          </group>
        </group>
      )}
      readouts={[
        ["Turns ratio N1:N2", `${N1}:${N2} (${T.kind})`],
        ["Secondary voltage V₂", `${T.V2.toFixed(1)} V`],
        ["Secondary current I₂", si(T.I2, "A")],
        ["Primary current I₁", si(T.I1, "A")],
        ["Peak flux Φm = V₁/4.44fN₁", si(T.phim, "Wb")],
        ["Flux density B_m", `${T.Bm.toFixed(2)} T${T.saturated ? " — saturated!" : ""}`],
      ]}
      controls={
        <>
          <Slider label="Primary voltage V₁" value={V1} min={10} max={440} step={1} digits={0} unit=" V" onChange={(x) => set("V1", x)} />
          <Slider label="Primary turns N1" value={N1} min={50} max={2000} step={10} digits={0} onChange={(x) => set("N1", x)} />
          <Slider label="Secondary turns N2" value={N2} min={10} max={4000} step={10} digits={0} onChange={(x) => set("N2", x)} />
          <Slider label="AC Frequency f" value={f} min={16} max={400} step={1} digits={0} unit=" Hz" onChange={(x) => set("f", x)} />
          <Slider label="Load resistance R_L" value={RL} min={1} max={500} step={1} digits={0} unit=" Ω" onChange={(x) => set("RL", x)} />
          <Slider label="Core cross-section A" value={A} min={2} max={100} step={1} digits={0} unit=" cm²" onChange={(x) => set("A", x)} />
        </>
      }
    />
  );
}
