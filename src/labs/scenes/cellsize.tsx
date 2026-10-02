"use client";
import { useLayoutEffect, useRef } from "react";
import * as THREE from "three";
import { cellSize } from "../sim/extra";
import { Bars, C, Floor, Panel } from "../kit";
import { useQuality } from "../Stage";
import { LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { EXTRA_SPECS } from "../meta/extra.specs";

const CAP = 60, dummy = new THREE.Object3D(), up = new THREE.Vector3(0, 1, 0), dir = new THREE.Vector3();
/** Microvilli placed evenly over a sphere (Fibonacci spiral). */
function paint(m: THREE.InstancedMesh, n: number, R: number) {
  for (let i = 0; i < CAP; i++) {
    if (i >= n) { dummy.position.set(0, 0, 0); dummy.scale.setScalar(0.0001); dummy.updateMatrix(); m.setMatrixAt(i, dummy.matrix); continue; }
    const y = 1 - (2 * (i + 0.5)) / Math.max(n, 1), rr = Math.sqrt(1 - y * y), th = i * 2.399963;
    dir.set(rr * Math.cos(th), y, rr * Math.sin(th));
    dummy.position.copy(dir).multiplyScalar(R + 0.1);
    dummy.quaternion.setFromUnitVectors(up, dir);
    dummy.scale.set(1, 1, 1); dummy.updateMatrix(); m.setMatrixAt(i, dummy.matrix);
  }
  m.instanceMatrix.needsUpdate = true;
}
function Villi({ n, R }: { n: number; R: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => { if (ref.current) paint(ref.current, n, R); }, [n, R]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, CAP]}>
      <cylinderGeometry args={[0.04, 0.04, 0.24, 6]} />
      <meshStandardMaterial color={C.green} emissive={C.green} emissiveIntensity={0.3} />
    </instancedMesh>
  );
}

export default function CellSizeLab() {
  const quality = useQuality();
  const [P, set, reset] = useLabParams(EXTRA_SPECS.cellsize);
  const { r, D, fold } = P;
  const o = cellSize(r, D, fold);
  const R = 0.35 + 1.15 * (Math.log10(r / 0.5) / Math.log10(200));
  const n = Math.min(CAP, Math.round(((fold - 1) / 49) * CAP));
  const seg = quality === "low" ? 16 : 24;
  const lg = (v: number) => Math.min(1, Math.max(0.02, Math.log10(v * 100) / 4.6)); // log scale so 0.03 … 300 fit
  return (
    <LabFrame
      label="A translucent cell sphere with a purple nucleus that grows with cell radius, green microvilli covering the membrane as the fold factor rises, and two columns comparing surface to volume ratio without and with folding"
      camera={[0, 0.8, 6.6]}
      animated={false}
      onReset={reset}
      scene={() => (
        <group>
          <Floor size={12} y={-1.9} divisions={12} />
          <group position={[-2.2, 0, 0]}>
            <mesh><sphereGeometry args={[R, seg, seg]} /><meshStandardMaterial color={C.blue} transparent opacity={0.4} roughness={0.3} /></mesh>
            <mesh><sphereGeometry args={[R * 0.35, seg, seg]} /><meshStandardMaterial color={C.purple} emissive={C.purple} emissiveIntensity={0.3} /></mesh>
            <Villi n={quality === "low" ? Math.round(n / 2) : n} R={R} />
          </group>
          <Panel p={[2.8, -0.1, -0.5]} w={3.4} h={3.5} />
          <Bars values={[lg(o.saOverV), lg(o.saVFolded)]} max={1} colors={[C.blue, C.green]} x0={1.9} y0={-1.8} w={0.8} gap={0.4} height={3} glow={0.3} />
        </group>
      )}
      readouts={[
        ["Surface area", `${o.sa.toFixed(0)} μm²`],
        ["Volume", `${o.vol.toFixed(0)} μm³`],
        ["Surface : volume", `${o.saOverV.toFixed(3)} per μm`],
        ["With folded membrane", `${o.saVFolded.toFixed(3)} per μm`],
        ["Diffusion to centre", o.diffusionS < 1e-3 ? "< 1 ms" : o.diffusionS < 1 ? `${(o.diffusionS * 1000).toFixed(0)} ms` : `${o.diffusionS.toFixed(1)} s`],
      ]}
      controls={<>
        <Slider label="Cell radius r" value={r} min={0.5} max={100} step={0.5} digits={1} unit=" μm" onChange={(x) => set("r", x)} />
        <Slider label="Diffusion coefficient D" value={D} min={50} max={1000} step={10} digits={0} unit=" μm²/s" onChange={(x) => set("D", x)} />
        <Slider label="Membrane folding factor" value={fold} min={1} max={50} step={1} digits={0} unit="×" onChange={(x) => set("fold", x)} />
      </>}
      note={<p>For a sphere the surface area is 4πr² and the volume 4πr³/3, so surface : volume is 3/r: doubling the radius halves it. A cell&apos;s needs grow with its volume but its supply comes through its surface, so big cells starve. Diffusion time to the centre is about r²/(6D), which rises with the square of the radius (D ≈ 500 μm²/s is a small molecule in cytoplasm). The green spikes are microvilli: folding the membrane multiplies the surface without adding volume, which is why intestine cells have them. The columns use a log scale so all sizes fit. The cell radius on screen is also scaled logarithmically.</p>}
    />
  );
}
