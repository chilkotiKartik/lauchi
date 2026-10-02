"use client";
import { Line } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { MATERIALS, hSat, hysteresis, loopB, loopK, loopPoints, si, type MaterialId } from "../sim/elec";
import { Tick } from "../Stage";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { ELEC_SPECS } from "../meta/elec.specs";

const SX = 2.6, SY = 1.9;

export default function HysteresisLab() {
  const [P, set, reset] = useLabParams(ELEC_SPECS.hysteresis);
  const { hpk, f, vol, mat } = P;
  const m = MATERIALS[mat];
  const H = hysteresis(mat, hpk, f, vol);
  const hs = hSat(m) * 2.5;                      // axis: H from −2.5·H_sat to +2.5·H_sat (the largest allowed peak)
  const pts = useMemo(() => loopPoints(m, hpk * hSat(m), 160).map(([h, b]) => [(h / hs) * SX * 2, (b / 2) * SY * 1.05, 0] as [number, number, number]), [m, hpk, hs]);
  const major = useMemo(() => loopPoints(m, 2.5 * hSat(m), 160).map(([h, b]) => [(h / hs) * SX * 2, (b / 2) * SY * 1.05, 0] as [number, number, number]), [m, hs]);
  const fill = useMemo(() => new THREE.ShapeGeometry(new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)))), [pts]);
  const dot = useRef<THREE.Mesh>(null), tt = useRef(0);
  const k = loopK(m, H.Hm);
  const tick = (dt: number) => {
    tt.current += Math.min(dt, 0.05) * 0.5;
    const ph = (tt.current % 1) * 2, desc = ph < 1, u = desc ? ph : ph - 1;
    const h = (desc ? 1 : -1) * H.Hm * Math.cos(Math.PI * u);
    const x = (h / hs) * SX * 2, y = (loopB(m, k, h, desc) / 2) * SY * 1.05;
    dot.current?.position.set(x, y, 0.05);
  };
  return (
    <LabFrame
      label="A B–H hysteresis loop drawn in 3D with a shaded interior whose area is the energy lost each cycle, a faint outline of the material's saturation loop and a dot tracing the loop"
      camera={[0, 0.3, 7.5]}
      onReset={reset}
      scene={() => (<group>
        <Tick fn={tick} />
        <mesh geometry={fill}><meshStandardMaterial color="#a970ff" transparent opacity={0.55} side={THREE.DoubleSide} emissive="#a970ff" emissiveIntensity={0.25} /></mesh>
        <mesh geometry={fill} position={[0, 0, -0.4]}><meshStandardMaterial color="#2ba6f5" transparent opacity={0.3} side={THREE.DoubleSide} /></mesh>
        <Line points={major} color="#5b6d77" lineWidth={1.2} dashed dashSize={0.1} gapSize={0.07} />
        <Line points={pts} color="#ffc83d" lineWidth={3} />
        <Line points={[[-SX * 2, 0, 0], [SX * 2, 0, 0]]} color="#9db0ba" lineWidth={1.5} />
        <Line points={[[0, -SY * 1.05, 0], [0, SY * 1.05, 0]]} color="#9db0ba" lineWidth={1.5} />
        <mesh ref={dot}><sphereGeometry args={[0.13, 14, 14]} /><meshStandardMaterial color="#ff5a5f" emissive="#ff5a5f" emissiveIntensity={0.5} /></mesh>
        <mesh position={[(H.Hc / hs) * SX * 2, 0, 0.02]}><sphereGeometry args={[0.07, 10, 10]} /><meshBasicMaterial color="#44c95a" /></mesh>
        <mesh position={[0, (H.Br / 2) * SY * 1.05, 0.02]}><sphereGeometry args={[0.07, 10, 10]} /><meshBasicMaterial color="#ff9a1f" /></mesh>
      </group>)}
      readouts={[
        ["Peak field H_m", `${H.Hm.toFixed(0)} A/m`], ["Peak flux density B_m", `${H.Bm.toFixed(3)} T`], ["Retentivity B_r", `${H.Br.toFixed(3)} T`],
        ["Coercivity H_c", `${H.Hc.toFixed(1)} A/m`], ["Loop area ∮H·dB", `${si(H.area, "J/m³")} per cycle`], ["Hysteresis loss", si(H.P, "W")],
      ]}
      controls={<>
        <Slider label="Peak field, × saturation field" value={hpk} min={0.1} max={2.5} step={0.05} digits={2} onChange={(x) => set("hpk", x)} />
        <Slider label="Supply frequency f" value={f} min={1} max={400} step={1} digits={0} unit=" Hz" onChange={(x) => set("f", x)} />
        <Slider label="Core volume" value={vol} min={1} max={1000} step={1} digits={0} unit=" cm³" onChange={(x) => set("vol", x)} />
        <Pick<MaterialId> label="Core material" value={mat} options={(Object.keys(MATERIALS) as MaterialId[]).map((id) => ({ id, label: MATERIALS[id].name }))} onChange={(x) => set("mat", x)} />
      </>}
      note={<p>The gold curve is B against H as the field swings up and down; the red dot traces it, the green dot marks the coercivity H_c (the field that brings B back to zero) and the orange dot marks the retentivity B_r (the flux left when H returns to zero). The area of the loop, ∮H·dB, is the energy turned into heat in each cubic metre every cycle, so the loss in the whole core is P = area × volume × f. The dashed outline is the material&apos;s full saturation loop. Soft materials (silicon steel, soft ferrite) have thin loops and suit transformers and motors; hard steel has a fat loop and stays magnetised, so it makes permanent magnets. Simplified tanh model with typical textbook values; real loops depend on the alloy and its history.</p>}
    />
  );
}
