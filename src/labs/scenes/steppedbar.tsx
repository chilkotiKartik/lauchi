"use client";
import { useRef } from "react";
import type * as THREE from "three";
import { steppedBar } from "../sim/mechy";
import { Tick } from "../Stage";
import { LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { MECHY_SPECS } from "../meta/mechy.specs";
import { Box, type V3 } from "../kit";
import { Arrow, C, Graph, mix, type XY } from "../kit2";

const W = 8, X0 = -4, EXAG = 250;

/** The bar's three segments and four joint arrows; segments stretch or shorten (exaggerated) as the load is applied. */
function Bar({ lens, radii, colors, strain, forces, fmax, playing }: { lens: number[]; radii: number[]; colors: string[]; strain: number[]; forces: number[]; fmax: number; playing: boolean }) {
  const seg = useRef<(THREE.Mesh | null)[]>([]), joint = useRef<(THREE.Group | null)[]>([]), t = useRef(Math.PI / 2);
  const tick = (dt: number) => {
    if (playing) t.current += Math.min(dt, 0.05) * 1.5; else t.current = Math.PI / 2;
    const f = 0.5 + 0.5 * Math.sin(t.current);
    let x = X0;
    joint.current[0]?.position.set(x, 0, 0);
    for (let i = 0; i < 3; i++) {
      const e = Math.max(-0.4, Math.min(0.4, strain[i] * EXAG)) * f, l = lens[i] * (1 + e);
      const m = seg.current[i];
      if (m) { m.position.x = x + l / 2; m.scale.y = l; }
      x += l;
      joint.current[i + 1]?.position.set(x, 0, 0);
    }
  };
  return (<>
    <Tick fn={tick} />
    {lens.map((l, i) => (
      <mesh key={i} ref={(el) => { seg.current[i] = el; }} rotation={[0, 0, Math.PI / 2]} position={[X0 + lens.slice(0, i).reduce((a, b) => a + b, 0) + l / 2, 0, 0]} scale={[1, l, 1]}>
        <cylinderGeometry args={[radii[i], radii[i], 1, 28]} />
        <meshStandardMaterial color={colors[i]} emissive={colors[i]} emissiveIntensity={0.25} roughness={0.35} metalness={0.2} />
      </mesh>
    ))}
    {forces.map((F, i) => {
      const L = Math.abs(F) < 1e-9 ? 0 : 0.35 + 1.1 * (Math.abs(F) / fmax), dir = Math.sign(F), y = 0.95 + (i % 2) * 0.35;
      return (
        <group key={i} ref={(el) => { joint.current[i] = el; }} position={[X0, 0, 0]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[Math.max(...radii) + 0.06, 0.035, 8, 28]} /><meshStandardMaterial color={i === 1 ? C.green : C.gold} emissive={i === 1 ? C.green : C.gold} emissiveIntensity={0.4} /></mesh>
          {L > 0 && <Arrow from={[0, y, 0] as V3} to={[dir * L, y, 0] as V3} color={i === 1 ? C.green : C.gold} r={0.045} />}
          <mesh position={[0, y / 2, 0]}><boxGeometry args={[0.03, y, 0.03]} /><meshBasicMaterial color={C.light} /></mesh>
        </group>
      );
    })}
  </>);
}

export default function SteppedBarLab() {
  const [P, set, reset] = useLabParams(MECHY_SPECS.steppedbar);
  const { FA, FC, FD, A1, A2, A3, L1, L2, L3, E } = P;
  const b = steppedBar(FA, FC, FD, [A1, A2, A3], [L1, L2, L3], E);
  const Lt = L1 + L2 + L3, Amax = Math.max(A1, A2, A3);
  const lens = [L1, L2, L3].map((l) => (l / Lt) * W);
  const radii = [A1, A2, A3].map((a) => 0.14 + 0.5 * Math.sqrt(a / Amax));
  const smax = Math.max(1e-9, ...b.sigma.map(Math.abs));
  const colors = b.sigma.map((s) => (Math.abs(s) < 1e-9 ? C.grey : mix(C.grey, s > 0 ? C.blue : C.red, 0.35 + 0.65 * Math.abs(s) / smax)));
  const strain = b.dL.map((d, i) => d / [L1, L2, L3][i]);
  const forces = [FA, b.FB, FC, FD], fmax = Math.max(1e-9, ...forces.map(Math.abs));
  const nmax = Math.max(1, ...b.N.map(Math.abs));
  const xs = [0, L1, L1 + L2, Lt], afd: XY[] = [[0, 0]];
  for (let i = 0; i < 3; i++) afd.push([xs[i], b.N[i]], [xs[i + 1], b.N[i]]);
  afd.push([Lt, 0]);
  const nature = (n: number) => (Math.abs(n) < 1e-9 ? "0" : `${Math.abs(n).toFixed(1)} ${n > 0 ? "T" : "C"}`);
  const names = ["AB", "BC", "CD"];
  return (
    <LabFrame
      label="A stepped circular bar of three segments with axial loads at its four joints; each segment glows blue in tension or red in compression and stretches or shortens, above its axial-force diagram"
      camera={[0, 0.6, 10]}
      onReset={reset}
      scene={(playing) => (<group>
        <group position={[0, 0.7, 0]} rotation={[0.25, 0, 0]}>
          <Bar lens={lens} radii={radii} colors={colors} strain={strain} forces={forces} fmax={fmax} playing={playing} />
          <Box p={[0, -0.85, 0]} s={[W + 1, 0.06, 1.4]} c={C.dark} />
        </group>
        <Graph x0={X0} y0={-3.3} w={W} h={1.9} xr={[0, Lt]} yr={[-nmax * 1.15, nmax * 1.15]} curves={[{ pts: afd, color: C.purple, w: 3 }]} vlines={[{ x: L1, color: C.grey }, { x: L1 + L2, color: C.grey }]} />
      </group>)}
      readouts={[
        ["Load at B for equilibrium", `${Math.abs(b.FB).toFixed(1)} kN ${b.FB >= 0 ? "→" : "←"}`],
        ["Forces in AB, BC, CD", b.N.map(nature).join(" | ") + " kN"],
        ["Stresses σ = P/A", b.sigma.map((s) => s.toFixed(1)).join(" | ") + " MPa"],
        ["Changes δ = PL/AE", b.dL.map((d) => d.toFixed(3)).join(" | ") + " mm"],
        ["Total change in length", `${b.total >= 0 ? "+" : ""}${b.total.toFixed(4)} mm (${b.total >= 0 ? "longer" : "shorter"})`],
        ["Most stressed segment", `${names[b.worst]}: ${Math.abs(b.sigma[b.worst]).toFixed(1)} MPa`],
      ]}
      controls={<>
        <Slider label="Load at A (+ → right)" value={FA} min={-500} max={500} step={1} digits={2} unit=" kN" onChange={(x) => set("FA", x)} />
        <Slider label="Load at C (+ → right)" value={FC} min={-500} max={500} step={1} digits={2} unit=" kN" onChange={(x) => set("FC", x)} />
        <Slider label="Load at D (+ → right)" value={FD} min={-500} max={500} step={1} digits={2} unit=" kN" onChange={(x) => set("FD", x)} />
        <Slider label="Young's modulus E" value={E} min={50} max={400} step={0.1} digits={1} unit=" GPa" onChange={(x) => set("E", x)} />
        <Slider label="Area of AB" value={A1} min={50} max={5000} step={25} digits={0} unit=" mm²" onChange={(x) => set("A1", x)} />
        <Slider label="Length of AB" value={L1} min={100} max={3000} step={50} digits={0} unit=" mm" onChange={(x) => set("L1", x)} />
        <Slider label="Area of BC" value={A2} min={50} max={5000} step={25} digits={0} unit=" mm²" onChange={(x) => set("A2", x)} />
        <Slider label="Length of BC" value={L2} min={100} max={3000} step={50} digits={0} unit=" mm" onChange={(x) => set("L2", x)} />
        <Slider label="Area of CD" value={A3} min={50} max={5000} step={25} digits={0} unit=" mm²" onChange={(x) => set("A3", x)} />
        <Slider label="Length of CD" value={L3} min={100} max={3000} step={50} digits={0} unit=" mm" onChange={(x) => set("L3", x)} />
      </>}
      note={<>
        <p>A bar made of pieces with different areas carries axial loads at its joints A, B, C, D (positive = pointing right). First the whole bar must be in equilibrium, so the load at B is whatever makes ΣF = 0 (green arrow). Then cut each segment and look at the free body to its left: the internal force is <b>tension</b> (blue, the piece pulls on the cut) or <b>compression</b> (red). The purple axial-force diagram shows it along the bar.</p>
        <p className="mt-2">Each segment obeys Hooke&apos;s law, so its change in length is <b>δ = PL/(AE)</b> and the total is the sum, <b>δ = Σ PᵢLᵢ/(AᵢE)</b> (tension lengthens, compression shortens). The segments&apos; movement is exaggerated about 250 times. Try the PYQ presets, then shrink one area and watch its stress, and its share of δ, jump. Assumes stresses stay below the elastic limit and ignores stress concentration at the steps.</p>
      </>}
    />
  );
}
