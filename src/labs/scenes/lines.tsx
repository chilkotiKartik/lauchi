"use client";
import { Line } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { clipLine, fmt, lines } from "../sim/mathsa";
import { Tick } from "../Stage";
import { LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { MATHSA_SPECS } from "../meta/mathsa.specs";

type V3 = [number, number, number];
const U = 0.5, WIN = 5.5; // world units per maths unit; lines are clipped to |x|, |y| ≤ 5.5
const w = (x: number, y: number, z = 0): V3 => [x * U, y * U, z];
const QUAD_COLORS = { I: "#44c95a", II: "#2ba6f5", III: "#a970ff", IV: "#ff9a1f" } as const;

/** A glowing cylinder between two points (a "tube" line). */
function Rod({ a, b, color, r = 0.035 }: { a: V3; b: V3; color: string; r?: number }) {
  const { pos, q, len } = useMemo(() => {
    const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A), L = d.length();
    return { pos: A.add(B).multiplyScalar(0.5).toArray() as V3, q: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), L > 0 ? d.normalize() : new THREE.Vector3(0, 1, 0)), len: Math.max(L, 1e-4) };
  }, [a, b]);
  return <mesh position={pos} quaternion={q}><cylinderGeometry args={[r, r, len, 12]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.45} /></mesh>;
}

/** Bead gliding along P1 → P2 and back (visual only), and a pulsing halo round the intersection. */
function moveBead(bead: THREE.Mesh, halo: THREE.Mesh | null, a: V3, b: V3, t: number) {
  const s = 0.5 - 0.5 * Math.cos(t * 0.9);
  bead.position.set(a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s, 0.06);
  if (halo) halo.scale.setScalar(1 + 0.35 * Math.sin(t * 3));
}

export default function LinesLab() {
  const [P, set, reset] = useLabParams(MATHSA_SPECS.lines);
  const { x1, y1, x2, y2, m, c } = P;
  const setX1 = (x: (typeof P)["x1"]) => set("x1", x), setY1 = (x: (typeof P)["y1"]) => set("y1", x), setX2 = (x: (typeof P)["x2"]) => set("x2", x), setY2 = (x: (typeof P)["y2"]) => set("y2", x), setM = (x: (typeof P)["m"]) => set("m", x), setC = (x: (typeof P)["c"]) => set("c", x);
  const L = lines(x1, y1, x2, y2, m, c);

  const seg1 = L.ok ? clipLine(x1, y1, x2 - x1, y2 - y1, WIN) : null;
  const seg2 = clipLine(0, c, 1, m, WIN);
  const p1 = w(x1, y1, 0.05), p2 = w(x2, y2, 0.05);
  const hitIn = L.hit && Math.abs(L.hit[0]) <= WIN && Math.abs(L.hit[1]) <= WIN ? L.hit : null;

  // Acute-angle arc at the intersection, from line 1's direction to line 2's.
  let arc: V3[] | null = null;
  if (hitIn && L.ok) {
    const d1 = Math.atan2(y2 - y1, x2 - x1);
    let d2 = Math.atan2(m, 1), diff = Math.atan2(Math.sin(d2 - d1), Math.cos(d2 - d1));
    if (Math.abs(diff) > Math.PI / 2) { d2 += Math.PI; diff = Math.atan2(Math.sin(d2 - d1), Math.cos(d2 - d1)); }
    arc = Array.from({ length: 25 }, (_, k): V3 => { const t = d1 + (diff * k) / 24; return [hitIn[0] * U + 0.55 * Math.cos(t), hitIn[1] * U + 0.55 * Math.sin(t), 0.07]; });
  }

  const bead = useRef<THREE.Mesh>(null), halo = useRef<THREE.Mesh>(null), t = useRef(0);
  const tick = (dt: number) => { t.current += Math.min(dt, 0.05); if (bead.current) moveBead(bead.current, halo.current, p1, p2, t.current); };

  const meet = !L.ok ? "— (P₁ = P₂)"
    : L.relation === "parallel" ? `never: parallel, gap ${fmt(L.gap, 3)}`
    : L.relation === "coincident" ? "everywhere: same line"
    : `(${fmt(L.hit![0], 2)}, ${fmt(L.hit![1], 2)}) · ${L.relation === "perpendicular" ? "perpendicular" : "neither ∥ nor ⊥"}`;
  const q = L.quad as keyof typeof QUAD_COLORS;

  return (
    <LabFrame
      label="A tilted coordinate grid with a line through two points, a line y = mx + c, their intersection and the angle between them"
      camera={[1.2, 1.4, 7.4]}
      onReset={reset}
      scene={() => (<group>
        <Tick fn={tick} />
        <group rotation={[-0.62, 0, 0]}>
          {(["I", "II", "III", "IV"] as const).map((k) => { const sx = k === "I" || k === "IV" ? 1 : -1, sy = k === "I" || k === "II" ? 1 : -1; return (
            <mesh key={k} position={[sx * WIN * U / 2, sy * WIN * U / 2, -0.03]}>
              <planeGeometry args={[WIN * U, WIN * U]} />
              <meshBasicMaterial color={QUAD_COLORS[k]} transparent opacity={k === q ? 0.34 : 0.12} side={THREE.DoubleSide} />
            </mesh>); })}
          <gridHelper args={[2 * WIN * U, 11, "#4a6570", "#2e434c"]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.02]} />
          <Line points={[w(-WIN, 0), w(WIN, 0)]} color="#e8f1f5" lineWidth={1.8} />
          <Line points={[w(0, -WIN), w(0, WIN)]} color="#e8f1f5" lineWidth={1.8} />
          {seg1 && <Rod a={w(seg1[0][0], seg1[0][1])} b={w(seg1[1][0], seg1[1][1])} color="#2ba6f5" />}
          {seg2 && <Rod a={w(seg2[0][0], seg2[0][1])} b={w(seg2[1][0], seg2[1][1])} color="#44c95a" />}
          {L.ok && !L.vertical && (<>
            <Line points={[w(x1, y1, 0.03), w(x2, y1, 0.03), w(x2, y2, 0.03)]} color="#ffc83d" lineWidth={1.4} dashed dashSize={0.1} gapSize={0.06} />
          </>)}
          <mesh position={p1}><sphereGeometry args={[0.13, 20, 20]} /><meshStandardMaterial color="#ffc83d" emissive="#ffc83d" emissiveIntensity={0.8} /></mesh>
          <mesh position={p2}><sphereGeometry args={[0.13, 20, 20]} /><meshStandardMaterial color="#ff9a1f" emissive="#ff9a1f" emissiveIntensity={0.8} /></mesh>
          <mesh position={w(L.mid[0], L.mid[1], 0.05)}><sphereGeometry args={[0.08, 16, 16]} /><meshStandardMaterial color="#a970ff" emissive="#a970ff" emissiveIntensity={0.7} /></mesh>
          <mesh ref={bead}><sphereGeometry args={[0.06, 12, 12]} /><meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} /></mesh>
          {hitIn && (<>
            <mesh position={w(hitIn[0], hitIn[1], 0.06)}><sphereGeometry args={[0.11, 20, 20]} /><meshStandardMaterial color="#ff5a5f" emissive="#ff5a5f" emissiveIntensity={0.8} /></mesh>
            <mesh ref={halo} position={w(hitIn[0], hitIn[1], 0.06)}><sphereGeometry args={[0.2, 20, 20]} /><meshBasicMaterial color="#ff5a5f" transparent opacity={0.25} /></mesh>
          </>)}
          {arc && <Line points={arc} color="#ffc83d" lineWidth={3} />}
        </group>
      </group>)}
      readouts={[
        ["Slope m₁ of P₁P₂", !L.ok ? "—" : L.vertical ? "undefined (vertical)" : fmt(L.m1, 3)],
        ["Distance P₁P₂", fmt(L.dist, 3)],
        ["Midpoint", `(${fmt(L.mid[0], 2)}, ${fmt(L.mid[1], 2)})`],
        ["Angle θ between lines", !L.ok ? "—" : `${fmt(L.angle, 2)}° (tan θ = ${Number.isFinite(L.tan) ? fmt(L.tan, 3) : "∞"})`],
        ["Lines meet at", meet],
        ["Quadrant of P₁", L.quad],
      ]}
      controls={<>
        <Slider label="Point 1 x₁" value={x1} min={-5} max={5} step={0.1} digits={1} onChange={setX1} />
        <Slider label="Point 1 y₁" value={y1} min={-5} max={5} step={0.1} digits={1} onChange={setY1} />
        <Slider label="Point 2 x₂" value={x2} min={-5} max={5} step={0.1} digits={1} onChange={setX2} />
        <Slider label="Point 2 y₂" value={y2} min={-5} max={5} step={0.1} digits={1} onChange={setY2} />
        <Slider label="Line 2 slope m" value={m} min={-5} max={5} step={0.1} digits={1} onChange={setM} />
        <Slider label="Line 2 intercept c" value={c} min={-5} max={5} step={0.1} digits={1} onChange={setC} />
      </>}
      note={<>
        <p><b>What you see.</b> The blue line passes through P₁ (gold) and P₂ (orange); the dashed gold legs are the run x₂ − x₁ and rise y₂ − y₁, so its slope is m₁ = (y₂ − y₁)/(x₂ − x₁). The green line is y = mx + c. The purple dot is the midpoint ((x₁ + x₂)/2, (y₁ + y₂)/2), and the distance is √((x₂ − x₁)² + (y₂ − y₁)²). The quadrant holding P₁ is highlighted.</p>
        <p className="mt-2"><b>Angle and intersection.</b> The acute angle between the lines obeys tan θ = |(m₁ − m₂)/(1 + m₁m₂)| (gold arc). The lines are parallel when m₁ = m₂ (then the gap between them is |c₁ − c₂|/√(1 + m²)) and perpendicular when m₁m₂ = −1, which makes the denominator zero and θ = 90°. Otherwise they meet where both equations hold (red dot).</p>
        <p className="mt-2"><b>Try.</b> Set m to −1/m₁ for a right angle; make x₁ = x₂ for a vertical line with undefined slope; or copy m₁ into m to make the lines parallel.</p>
      </>}
    />
  );
}
