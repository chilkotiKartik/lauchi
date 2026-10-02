"use client";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { cubeLoad, elasticConstants, type CubeMode } from "../sim/mechy";
import { Tick } from "../Stage";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { MECHY_SPECS } from "../meta/mechy.specs";
import { Box, Floor, type V3 } from "../kit";
import { Arrow, C } from "../kit2";

const S = 2.4, H = S / 2, EXAG = 400, CAP = 0.35;
const vis = (x: number) => Math.max(-CAP, Math.min(CAP, x * EXAG));

/** Deformed cube: the load "breathes" from zero to full so the change of shape is easy to see. */
function Cube({ ex, ey, gamma, playing }: { ex: number; ey: number; gamma: number; playing: boolean }) {
  const g = useRef<THREE.Group>(null), t = useRef(Math.PI / 2);
  const edges = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(S, S, S)), []);
  const tick = (dt: number) => {
    if (playing) t.current += Math.min(dt, 0.05) * 1.6; else t.current = Math.PI / 2;
    const f = 0.5 + 0.5 * Math.sin(t.current), m = g.current;
    if (!m) return;
    m.matrix.set(1 + vis(ex) * f, vis(gamma) * f, 0, 0, 0, 1 + vis(ey) * f, 0, 0, 0, 0, 1 + vis(ey) * f, 0, 0, 0, 0, 1);
    m.matrixWorldNeedsUpdate = true;
  };
  return (<>
    <Tick fn={tick} />
    <group ref={g} matrixAutoUpdate={false}>
      <mesh><boxGeometry args={[S, S, S]} /><meshStandardMaterial color={C.green} emissive={C.green} emissiveIntensity={0.15} roughness={0.35} transparent opacity={0.88} /></mesh>
      <lineSegments geometry={edges}><lineBasicMaterial color={C.white} /></lineSegments>
      {[-0.6, 0, 0.6].map((y) => <mesh key={y} position={[0, y, H + 0.005]}><planeGeometry args={[S, 0.03]} /><meshBasicMaterial color="#1e6b2c" /></mesh>)}
      {[-0.6, 0, 0.6].map((x) => <mesh key={x} position={[x, 0, H + 0.006]}><planeGeometry args={[0.03, S]} /><meshBasicMaterial color="#1e6b2c" /></mesh>)}
    </group>
    <lineSegments geometry={edges}><lineBasicMaterial color={C.light} transparent opacity={0.45} /></lineSegments>
  </>);
}

function loadArrows(mode: CubeMode, s: number): { from: V3; to: V3; c: string }[] {
  const L = 0.4 + 1.1 * Math.min(1, s / 500), g = H + 0.25;
  if (s <= 0) return [];
  if (mode === "normal") return [{ from: [g, 0, 0], to: [g + L, 0, 0], c: C.red }, { from: [-g, 0, 0], to: [-g - L, 0, 0], c: C.red }];
  if (mode === "shear") return [
    { from: [-L / 2, g - 0.1, 0], to: [L / 2, g - 0.1, 0], c: C.gold }, { from: [L / 2, -g + 0.1, 0], to: [-L / 2, -g + 0.1, 0], c: C.gold },
    { from: [g - 0.1, -L / 2, 0], to: [g - 0.1, L / 2, 0], c: C.orange }, { from: [-g + 0.1, L / 2, 0], to: [-g + 0.1, -L / 2, 0], c: C.orange },
  ];
  const d: V3[] = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
  return d.map((v) => ({ from: [v[0] * (g + L), v[1] * (g + L), v[2] * (g + L)] as V3, to: [v[0] * g, v[1] * g, v[2] * g] as V3, c: C.blue }));
}

export default function ElasticLab() {
  const [P, set, reset] = useLabParams(MECHY_SPECS.elastic);
  const { E, nu, s, a, mode } = P;
  const k = elasticConstants(E, nu), r = cubeLoad(E, nu, mode, s, a);
  const arrows = useMemo(() => loadArrows(mode, s), [mode, s]);
  const Kshow = Math.min(k.K, 3 * E), barMax = Math.max(E, Kshow, 1);
  const bars: [number, string][] = [[E, C.gold], [k.G, C.purple], [Kshow, C.blue]];
  const sym = mode === "normal" ? "σ" : mode === "shear" ? "τ" : "p";
  const fmtK = Number.isFinite(k.K) ? `${k.K.toFixed(1)} GPa` : "∞ (incompressible)";
  return (
    <LabFrame
      label="A cube of material under load: it stretches and narrows under tension, skews under shear or shrinks evenly under all-round pressure, with load arrows on its faces, a ghost outline of the original shape and bars comparing E, G and K"
      camera={[2.2, 2.4, 9]}
      onReset={reset}
      scene={(playing) => (<group>
        <group position={[-1.4, 0.3, 0]} rotation={[0.12, -0.45, 0]}>
          <Cube ex={r.ex} ey={r.ey} gamma={r.gamma} playing={playing} />
          {arrows.map((ar, i) => <Arrow key={i} from={ar.from} to={ar.to} color={ar.c} r={0.05} />)}
        </group>
        <group position={[2.4, -1.6, 0]}>
          {bars.map(([v, c], i) => { const h = Math.max(0.04, (v / barMax) * 3.2); return <Box key={i} p={[i * 0.75, h / 2, 0]} s={[0.5, h, 0.5]} c={c} glow={0.3} />; })}
          <Box p={[0.75, -0.06, 0]} s={[2.4, 0.08, 0.9]} c={C.dark} />
        </group>
        <Floor size={12} y={-1.7} divisions={12} />
      </group>)}
      readouts={[
        ["Modulus of rigidity G = E/2(1+ν)", `${k.G.toFixed(1)} GPa`],
        ["Bulk modulus K = E/3(1−2ν)", fmtK],
        ["Check E = 9KG/(3K+G)", `${k.Echeck.toFixed(1)} GPa`],
        [mode === "shear" ? "Shear strain γ = τ/G" : mode === "normal" ? "Strains εₓ, ε_lateral" : "Linear strain each side", mode === "shear" ? `${(r.gamma * 1e6).toFixed(0)} × 10⁻⁶ rad` : mode === "normal" ? `${(r.ex * 1e6).toFixed(0)}, ${(r.ey * 1e6).toFixed(0)} × 10⁻⁶` : `${(r.ex * 1e6).toFixed(0)} × 10⁻⁶`],
        [mode === "shear" ? "Top face slides by" : mode === "normal" ? "Length change, side change" : "Each side changes by", mode === "shear" ? `${(r.shift * 1000).toFixed(2)} µm` : `${(r.dA * 1000).toFixed(2)} µm${mode === "normal" ? `, ${(r.dLat * 1000).toFixed(2)} µm` : ""}`],
        ["Volumetric strain ε_v = ΔV/V", `${(r.ev * 1e6).toFixed(0)} × 10⁻⁶ (ΔV = ${r.dV.toFixed(1)} mm³)`],
      ]}
      controls={<>
        <Slider label="Young's modulus E" value={E} min={10} max={400} step={1} digits={0} unit=" GPa" onChange={(x) => set("E", x)} />
        <Slider label="Poisson's ratio ν" value={nu} min={0} max={0.49} step={0.01} digits={2} onChange={(x) => set("nu", x)} />
        <Pick label="Load on the cube" value={mode} options={[{ id: "normal", label: "Direct tension σ (one axis)" }, { id: "shear", label: "Pure shear τ" }, { id: "volume", label: "All-round pressure p (volumetric)" }]} onChange={(x) => set("mode", x)} />
        <Slider label={`Applied stress ${sym}`} value={s} min={0} max={500} step={1} digits={0} unit=" MPa" onChange={(x) => set("s", x)} />
        <Slider label="Cube side a" value={a} min={10} max={200} step={1} digits={0} unit=" mm" onChange={(x) => set("a", x)} />
      </>}
      note={<>
        <p>Three loads, three elastic constants. <b>Direct stress</b> σ stretches the cube by ε = σ/E (Young&apos;s modulus E) and makes it thinner sideways by ν·ε (<b>Poisson&apos;s ratio</b> ν = lateral strain / longitudinal strain). <b>Shear</b> τ skews it by the angle γ = τ/G (modulus of rigidity G); note the complementary shear on the side faces that keeps the cube from spinning. <b>All-round pressure</b> p shrinks its volume by ΔV/V = p/K (bulk modulus K).</p>
        <p className="mt-2">Only two constants are independent: <b>E = 2G(1 + ν) = 3K(1 − 2ν)</b>, so E = 9KG/(3K + G). For steel (E = 200 GPa, ν = 0.3) G = 76.9 GPa and K = 166.7 GPa. The cube&apos;s deformation is exaggerated about 400 times. Try: push ν towards 0.5 (rubber) and watch K shoot up, because the volume can hardly change; set ν = 0 (cork) and a stretched cube does not get thinner at all.</p>
      </>}
    />
  );
}
