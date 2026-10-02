"use client";
import { Line } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { filmReflect, nmHex, wedge } from "../sim/phyy";
import { Tick } from "../Stage";
import { LabFrame, Check, Slider } from "../ui";
import { useLabParams } from "../params";
import { PHYY_SPECS } from "../meta/phyy.specs";
import { C, Box, type V3 } from "../kit";
import { Flow, Rod } from "../kit2";

const LV = 6, SEG = 600, DEPTH = 2.4;
const _a = new THREE.Color(), _b = new THREE.Color();

/** The air film seen from above: vertex colours from the reflected (or transmitted) intensity along the wedge. */
function fringeGeometry(lamNm: number, dUm: number, mu: number, trans: boolean, col: string) {
  const g = new THREE.PlaneGeometry(LV, DEPTH, SEG, 1);
  g.rotateX(-Math.PI / 2);
  const p = g.attributes.position, c = new Float32Array(p.count * 3);
  const lam = lamNm * 1e-9, D = dUm * 1e-6, orders = (2 * mu * D) / lam;
  const vpf = SEG / Math.max(orders, 1e-6), k = Math.min(1, Math.max(0, (vpf - 2.5) / 4)); // too fine to resolve → washes out
  _b.set(col);
  for (let i = 0; i < p.count; i++) {
    const f = (p.getX(i) + LV / 2) / LV, r = filmReflect(f * D, lam, mu);
    const I = trans ? 0.35 + 0.65 * (1 - r) : r;
    const v = 0.5 + (I - 0.5) * k;
    _a.set("#06090b").lerp(_b, v);
    c[3 * i] = _a.r; c[3 * i + 1] = _a.g; c[3 * i + 2] = _a.b;
  }
  g.setAttribute("color", new THREE.BufferAttribute(c, 3));
  return g;
}

function Microscope({ playing }: { playing: boolean }) {
  const g = useRef<THREE.Group>(null), t = useRef(0);
  const tick = (dt: number) => { if (playing) t.current += Math.min(dt, 0.05); if (g.current) g.current.position.x = 2.4 * Math.sin(t.current * 0.35); };
  return (
    <group ref={g}>
      <Tick fn={tick} />
      <Rod a={[0, 3.2, 0]} b={[0, 4.6, 0]} r={0.2} color={C.light} />
      <Rod a={[0, 2.55, 0]} b={[0, 3.2, 0]} r={0.13} color={C.grey} />
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[0.32, 0.38, 32]} /><meshBasicMaterial color={C.red} /></mesh>
      <Line points={[[-0.35, 0.03, 0], [0.35, 0.03, 0]]} color={C.red} lineWidth={1.5} />
      <Line points={[[0, 0.03, -0.35], [0, 0.03, 0.35]]} color={C.red} lineWidth={1.5} />
    </group>
  );
}

export default function WedgeLab() {
  const [P, set, reset] = useLabParams(PHYY_SPECS.wedge);
  const { lam, D, L, mu, trans } = P;
  const w = wedge(lam, D, L, mu);
  const col = nmHex(lam);
  const thV = Math.min(0.22, 0.02 + w.theta * 60), gap = LV * Math.tan(thV);
  const geo = useMemo(() => fringeGeometry(lam, D, mu, trans, col), [lam, D, mu, trans, col]);
  const liquid = useMemo(() => {
    const s = new THREE.Shape(); s.moveTo(-LV / 2, 0); s.lineTo(LV / 2, 0); s.lineTo(LV / 2, gap); s.lineTo(-LV / 2, 0);
    const g = new THREE.ExtrudeGeometry(s, { depth: DEPTH, bevelEnabled: false }); g.translate(0, 0, -DEPTH / 2); return g;
  }, [gap]);
  const beam = useMemo<V3[]>(() => [[-1.8, 3.25, -0.6], [-1.8, 0.05, -0.6]], []);
  const beam2 = useMemo<V3[]>(() => [[1.8, 3.25, -0.6], [1.8, 0.05, -0.6]], []);
  return (
    <LabFrame
      label="An air wedge between two glass plates touching at one end and propped open by a thin wire at the other; light from a sodium lamp falls on it from above, straight bright and dark fringes run parallel to the contact edge, and a travelling microscope scans across them"
      camera={[0, 4.6, 7.4]}
      onReset={reset}
      scene={(playing) => (<group position={[0, -0.6, 0]}>
        <Box p={[0, -0.12, 0]} s={[LV + 0.4, 0.2, DEPTH + 0.2]} c="#9fd3ea" o={0.5} />
        <mesh geometry={geo} position={[0, 0.005, 0]}><meshBasicMaterial vertexColors /></mesh>
        <group position={[-LV / 2, 0, 0]} rotation={[0, 0, thV]}>
          <Box p={[LV / 2 + 0.2, 0.1, 0]} s={[LV + 0.4, 0.2, DEPTH + 0.2]} c="#bfe8ff" o={0.3} />
        </group>
        <mesh position={[LV / 2, gap / 2, 0]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[Math.max(0.02, gap / 2), Math.max(0.02, gap / 2), DEPTH + 0.5, 16]} /><meshStandardMaterial color={C.orange} metalness={0.6} roughness={0.3} /></mesh>
        {mu > 1.001 && <mesh geometry={liquid}><meshStandardMaterial color={C.blue} transparent opacity={0.25 + (mu - 1) * 0.4} /></mesh>}
        <Rod a={[-LV / 2, 3.4, -0.7]} b={[LV / 2, 3.4, -0.7]} r={0.14} color={C.gold} glow={1.1} />
        <Box p={[0, 3.62, -0.7]} s={[LV + 0.4, 0.12, 0.5]} c={C.dark} />
        {[-2.4, -1.2, 0, 1.2, 2.4].map((x) => <Line key={x} points={[[x, 3.25, -0.6], [x, 0.05, -0.6]]} color={col} lineWidth={1.2} transparent opacity={0.55} />)}
        <Flow path={beam} n={6} speed={0.5} color={col} r={0.06} />
        <Flow path={beam2} n={6} speed={0.5} color={col} r={0.06} />
        <Microscope playing={playing} />
        <Box p={[-LV / 2 - 0.1, 0.25, 0]} s={[0.12, 0.5, DEPTH + 0.3]} c={C.purple} glow={0.3} />
      </group>)}
      readouts={[
        ["Wedge angle θ = D/L", `${(w.theta * 1000).toFixed(3)} mrad (${((w.theta * 180) / Math.PI).toFixed(4)}°)`],
        ["Fringe width β = λ/2μθ", `${(w.beta * 1000).toFixed(3)} mm`],
        ["Dark fringes across the wedge", String(w.nDark)],
        ["Fringes per cm", (0.01 / w.beta).toFixed(1)],
        ["At the contact edge (t = 0)", trans ? "Bright (transmitted light)" : "Dark (λ/2 phase change on reflection)"],
      ]}
      controls={<>
        <Slider label="Wavelength λ" value={lam} min={400} max={700} step={1} digits={0} unit=" nm" onChange={(x) => set("lam", x)} />
        <Slider label="Wire diameter D" value={D} min={2} max={100} step={0.5} digits={1} unit=" µm" onChange={(x) => set("D", x)} />
        <Slider label="Wire distance from edge L" value={L} min={2} max={15} step={0.1} digits={1} unit=" cm" onChange={(x) => set("L", x)} />
        <Slider label="Film refractive index μ" value={mu} min={1} max={1.7} step={0.01} digits={2} onChange={(x) => set("mu", x)} />
        <Check label="View transmitted light instead" checked={trans} onChange={(x) => set("trans", x)} />
      </>}
      note={<>
        <p>Two flat plates touch along one edge and a thin wire props the other end open, so the film between them is a <b>wedge</b> whose thickness grows steadily, t = xθ. Light reflected from the top and bottom of the film interferes with path difference 2μt cos r (+ λ/2 for the reflection at the denser surface). Dark fringes fall where <b>2μt = nλ</b>, and since t grows in equal steps the fringes are <b>straight, equally spaced lines parallel to the edge</b>, with width <b>β = λ/2μθ</b>. The contact edge is dark in reflected light; in transmitted light the pattern is exactly complementary (bright edge, lower contrast).</p>
        <p className="mt-2"><b>Try:</b> a thicker wire or a shorter L packs the fringes tighter; fill the wedge with liquid (μ &gt; 1) and β shrinks by μ. Counting fringes per cm with the travelling microscope gives θ, and so the wire diameter D = Lλ/2μβ. When fringes get too fine to resolve they wash out to uniform grey. The vertical scale is exaggerated.</p>
      </>}
    />
  );
}
