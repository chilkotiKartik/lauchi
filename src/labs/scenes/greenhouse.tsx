"use client";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { fmtNum, greenhouse, hash01, C_PRE } from "../sim/life";
import { Tick, useQuality } from "../Stage";
import { LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { LIFE_SPECS } from "../meta/life.specs";

const NS = 24, NI = 40, RS = 1.1, RA = 1.6, RM = 2.6, dummy = new THREE.Object3D();
const COLD = new THREE.Color("#2f7fd0"), HOT = new THREE.Color("#ff4b3a");

/** Sunlight streaming in from the left towards the planet. Module-level: no allocation per frame. */
function paintSun(m: THREE.InstancedMesh, t: number, n: number) {
  for (let i = 0; i < NS; i++) {
    const y = (hash01(i, 1) - 0.5) * 1.7, z = (hash01(i, 2) - 0.5) * 1.7, hit = -Math.sqrt(Math.max(0.05, RS * RS - y * y - z * z));
    const u = ((i / NS) + t) % 1;
    dummy.position.set(-4.2 + u * (hit + 4.2), y, z); dummy.scale.setScalar(i < n ? 1 : 0.001); dummy.updateMatrix(); m.setMatrixAt(i, dummy.matrix);
  }
  m.instanceMatrix.needsUpdate = true;
}
/** Infrared leaving the surface: escapes to space, or (if trapped) bounces off the greenhouse layer and returns. */
function paintIr(m: THREE.InstancedMesh, t: number, n: number, trap: number) {
  for (let i = 0; i < NI; i++) {
    const a = hash01(i, 5) * 6.2832, b = Math.acos(2 * hash01(i, 6) - 1), u = ((i / NI) + t * 0.7) % 1;
    const trapped = hash01(i, 7) < trap, r = trapped ? RS + (RA - RS) * (1 - Math.abs(2 * u - 1)) : RS + (RM - RS) * u;
    dummy.position.set(r * Math.sin(b) * Math.cos(a), r * Math.cos(b), r * Math.sin(b) * Math.sin(a)); dummy.scale.setScalar(i < n ? 1 : 0.001); dummy.updateMatrix(); m.setMatrixAt(i, dummy.matrix);
  }
  m.instanceMatrix.needsUpdate = true;
}

function Rays({ trap, low }: { trap: number; low: boolean }) {
  const sun = useRef<THREE.InstancedMesh>(null), ir = useRef<THREE.InstancedMesh>(null), t = useRef(0);
  const tick = (dt: number) => {
    t.current += Math.min(dt, 0.05) * 0.35;
    if (sun.current) paintSun(sun.current, t.current, low ? 12 : NS);
    if (ir.current) paintIr(ir.current, t.current, low ? 20 : NI, trap);
  };
  return (<>
    <Tick fn={tick} />
    <instancedMesh ref={sun} args={[undefined, undefined, NS]}><sphereGeometry args={[0.07, 8, 8]} /><meshBasicMaterial color="#ffc83d" /></instancedMesh>
    <instancedMesh ref={ir} args={[undefined, undefined, NI]}><sphereGeometry args={[0.055, 8, 8]} /><meshBasicMaterial color="#ff5a5f" /></instancedMesh>
  </>);
}

export default function GreenhouseLab() {
  const quality = useQuality();
  const [P, set, reset] = useLabParams(LIFE_SPECS.greenhouse);
  const { C, lambda, dAlb } = P;
  const G = greenhouse(C, lambda, dAlb);
  const trap = Math.min(0.95, Math.max(0.05, 0.25 + G.dFco2 / 6));
  const earth = useMemo(() => COLD.clone().lerp(HOT, Math.min(1, Math.max(0, G.dT / 6))).getStyle(), [G.dT]);
  const th = Math.max(0.05, Math.min(2.6, (G.dT / 6) * 2.6));
  const dTtxt = `${G.dT >= 0 ? "+" : "−"}${Math.abs(G.dT).toFixed(2)} °C`;
  return (
    <LabFrame
      label="A planet that turns from blue to red as it warms, wrapped in a haze layer that thickens with carbon dioxide, with yellow sunlight streaming in, red infrared particles that escape or bounce back off the haze, and a thermometer bar showing the warming"
      camera={[0, 0.8, 9]}
      onReset={reset}
      scene={() => (<group>
        <group position={[-0.6, 0, 0]}>
          <mesh><sphereGeometry args={[RS, 32, 24]} /><meshStandardMaterial color={earth} roughness={0.6} /></mesh>
          <mesh><sphereGeometry args={[RA, 32, 24]} /><meshStandardMaterial color="#ffb060" transparent opacity={0.05 + 0.3 * Math.min(1, C / 1200)} depthWrite={false} /></mesh>
          <Rays trap={trap} low={quality === "low"} />
        </group>
        <group position={[3.7, -1.5, 0]}>
          <mesh position={[0, 1.4, 0]}><boxGeometry args={[0.3, 2.8, 0.3]} /><meshStandardMaterial color="#33454e" transparent opacity={0.6} /></mesh>
          <mesh position={[0, th / 2, 0]}><boxGeometry args={[0.16, th, 0.16]} /><meshStandardMaterial color="#ff5a5f" emissive="#ff5a5f" emissiveIntensity={0.4} /></mesh>
          <mesh position={[0, -0.1, 0]}><sphereGeometry args={[0.28, 16, 16]} /><meshStandardMaterial color="#ff5a5f" emissive="#ff5a5f" emissiveIntensity={0.4} /></mesh>
        </group>
      </group>)}
      readouts={[
        ["CO₂ concentration", `${C} ppm (${G.ratio.toFixed(2)}× pre-industrial ${C_PRE})`], ["CO₂ forcing 5.35 ln(C/C₀)", `${G.dFco2.toFixed(2)} W/m²`], ["Albedo forcing −(S₀/4)Δα", `${G.dFalb.toFixed(2)} W/m²`],
        ["Total forcing ΔF", `${G.dF.toFixed(2)} W/m²`], ["Equilibrium warming ΔT = λΔF", dTtxt], ["Warming for doubled CO₂", `${G.dT2x.toFixed(2)} °C (λ = ${lambda})`],
      ]}
      controls={<>
        <Slider label="CO₂ concentration" value={C} min={200} max={1200} step={5} digits={0} unit=" ppm" onChange={(x) => set("C", x)} />
        <Slider label="Climate sensitivity λ" value={lambda} min={0.3} max={1.5} step={0.05} digits={2} unit=" K/(W/m²)" onChange={(x) => set("lambda", x)} />
        <Slider label="Change in Earth's albedo Δα" value={dAlb} min={-0.05} max={0.05} step={0.001} digits={3} onChange={(x) => set("dAlb", x)} />
      </>}
      note={<p>Sunlight (yellow) warms the surface, which sends the energy back out as infrared (red). Greenhouse gases such as CO₂, CH₄ and water vapour absorb part of it and re-radiate it downwards, so more infrared bounces back (the fraction drawn is illustrative). Adding CO₂ above the pre-industrial 280 ppm changes the energy balance by the radiative forcing ΔF = 5.35 ln(C/280) W/m², and the eventual warming is ΔT = λ·ΔF, with the climate sensitivity λ of about 0.8 K per W/m² (so ~3 °C for doubled CO₂). Making Earth more reflective (Δα &gt; 0) removes (S₀/4)Δα of incoming sunlight, S₀ = 1361 W/m². This is a one-box equilibrium model; real climate responses include oceans, clouds and feedbacks and take decades, so treat it as a teaching sketch, not a forecast. Total forcing is {fmtNum(G.dF)} W/m² here.</p>}
    />
  );
}
