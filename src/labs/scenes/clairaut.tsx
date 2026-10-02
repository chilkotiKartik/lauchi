"use client";
import { Line } from "@react-three/drei";
import { useMemo, useRef } from "react";
import type * as THREE from "three";
import { CLAIRAUT_LABEL, clairautEnv, clairautF, clairautSingular, clairautTouch, type ClairautId } from "../sim/mathii";
import { Tick } from "../Stage";
import { LabFrame, Slider, Pick } from "../ui";
import { useLabParams } from "../params";
import { MATHII_SPECS } from "../meta/mathii.specs";
import { Rod } from "../kit2";
import { C, Orb, Sway, fmt, ramp, type V3 } from "./mathii-kit";

const XR = 5, YR = 3.6;
/** Part of the line y = c x + d inside the window, or null. */
function clip(c: number, d: number): [V3, V3] | null {
  let x1 = -XR, x2 = XR;
  if (Math.abs(c) > 1e-9) {
    const xa = (-YR - d) / c, xb = (YR - d) / c;
    x1 = Math.max(x1, Math.min(xa, xb)); x2 = Math.min(x2, Math.max(xa, xb));
  } else if (Math.abs(d) > YR) return null;
  if (x2 - x1 < 0.05) return null;
  return [[x1, c * x1 + d, 0], [x2, c * x2 + d, 0]];
}
function envPoints(kind: ClairautId, a: number, b: number): V3[][] {
  const n = 90, out: V3[][] = [];
  if (kind === "ellipse") { const p: V3[] = []; for (let i = 0; i <= n; i++) { const th = (Math.PI * i) / n; p.push([a * Math.cos(th), b * Math.sin(th), 0]); } return [p]; }
  const branches = kind === "inv" ? [1, -1] : [1];
  for (const br of branches) {
    const p: V3[] = [];
    for (let i = 0; i <= n; i++) {
      const x = kind === "inv" ? 0.005 + ((XR - 0.005) * i) / n : -XR + (2 * XR * i) / n, y = clairautEnv(kind, a, b, x, br);
      if (Number.isFinite(y) && Math.abs(y) <= YR) p.push([x, y, 0]);
    }
    out.push(p);
  }
  return out;
}
function moveBead(m: THREE.Object3D | null, cc: number, d: number, u: number) {
  if (!m) return;
  const x = -XR + 2 * XR * u, y = cc * x + d;
  m.visible = Math.abs(y) <= YR;
  m.position.set(x, y, 0.1);
}

export default function ClairautLab() {
  const [P, set, reset] = useLabParams(MATHII_SPECS.clairaut);
  const { c, kind, a, b } = P;
  const cc = kind === "inv" && Math.abs(c) < 0.15 ? (c < 0 ? -0.15 : 0.15) : c;
  const d = clairautF(kind, a, b, cc), [xt, yt] = clairautTouch(kind, a, b, cc);
  const cs = useMemo(() => (kind === "inv" ? [-3, -2, -1.4, -1, -0.7, -0.45, 0.45, 0.7, 1, 1.4, 2, 3] : [-3, -2.5, -2, -1.5, -1, -0.5, 0, 0.5, 1, 1.5, 2, 2.5, 3]), [kind]);
  const lines = useMemo(() => cs.map((q, i) => ({ seg: clip(q, clairautF(kind, a, b, q)), col: ramp(i / (cs.length - 1)) })), [cs, kind, a, b]);
  const env = useMemo(() => envPoints(kind, a, b), [kind, a, b]);
  const sel = clip(cc, d), bead = useRef<THREE.Mesh>(null), tt = useRef(0);
  const tick = (dt: number) => { tt.current = (tt.current + Math.min(dt, 0.05) * 0.1) % 1; moveBead(bead.current, cc, d, tt.current); };
  const brs = cc < 0 ? -1 : 1, slope = (clairautEnv(kind, a, b, xt + 1e-5, brs) - clairautEnv(kind, a, b, xt - 1e-5, brs)) / 2e-5;
  const hex = (r: [number, number, number]) => "#" + [r[0], r[1], r[2]].map((v) => Math.round(v * 255).toString(16).padStart(2, "0")).join("");
  return (
    <LabFrame
      label="A fan of straight lines, one for each value of the constant c, all touching one glowing curve: the singular solution of Clairaut's equation; one line is highlighted with its touching point"
      camera={[0, 0.8, 11]}
      onReset={reset}
      scene={() => (<group>
        <Tick fn={tick} />
        <Sway amp={0.22}>
          <mesh position={[0, 0, -0.25]}><planeGeometry args={[2 * XR + 0.6, 2 * YR + 0.6]} /><meshStandardMaterial color="#16303b" /></mesh>
          <Line points={[[-XR, 0, -0.2], [XR, 0, -0.2]]} color={C.grey} lineWidth={1.4} />
          <Line points={[[0, -YR, -0.2], [0, YR, -0.2]]} color={C.grey} lineWidth={1.4} />
          {lines.map((l, i) => l.seg ? <Rod key={i} a={[l.seg[0][0], l.seg[0][1], 0.02 * (i % 3)]} b={[l.seg[1][0], l.seg[1][1], 0.02 * (i % 3)]} r={0.025} color={hex(l.col)} glow={0.25} /> : null)}
          {env.map((p, i) => p.length > 1 ? <Line key={"e" + i} points={p} color={C.green} lineWidth={5} /> : null)}
          {sel && <Rod a={[sel[0][0], sel[0][1], 0.06]} b={[sel[1][0], sel[1][1], 0.06]} r={0.07} color={C.gold} glow={0.6} />}
          {Math.abs(yt) <= YR && Math.abs(xt) <= XR && <Orb p={[xt, yt, 0.12]} r={0.17} c={C.white} />}
          <mesh ref={bead}><sphereGeometry args={[0.1, 12, 10]} /><meshStandardMaterial color={C.red} emissive={C.red} emissiveIntensity={0.8} /></mesh>
        </Sway>
      </group>)}
      readouts={[
        ["General solution", `y = ${fmt(cc, 2)}x ${d < 0 ? "−" : "+"} ${Math.abs(d).toFixed(3)}`],
        ["Intercept f(c)", fmt(d, 3)],
        ["Touching point", `(${fmt(xt, 3)}, ${fmt(yt, 3)})`],
        ["Envelope slope there", fmt(slope, 3)],
        ["Singular solution", clairautSingular(kind, a)],
        ["Check y = px + f(p)", `${fmt(cc * xt + d, 3)} = ${fmt(yt, 3)} ✓`],
      ]}
      controls={<>
        <Slider label="Constant c (slope p of the highlighted line)" value={c} min={-3} max={3} step={0.05} digits={2} onChange={(v) => set("c", v)} />
        <Pick label="Clairaut equation" value={kind} options={(Object.keys(CLAIRAUT_LABEL) as ClairautId[]).map((k) => ({ id: k, label: CLAIRAUT_LABEL[k] }))} onChange={(v) => set("kind", v)} />
        <Slider label="Parameter a" value={a} min={0.3} max={3} step={0.05} digits={2} onChange={(v) => set("a", v)} />
        <Slider label="Parameter b (ellipse form only)" value={b} min={0.5} max={4} step={0.05} digits={2} onChange={(v) => set("b", v)} />
      </>}
      note={<p><b>Clairaut&apos;s equation</b> y = px + f(p), p = dy/dx. Differentiating gives (x + f′(p)) dp/dx = 0. Either dp/dx = 0, so p = c and the <b>general solution</b> is the family of straight lines y = cx + f(c); or x + f′(p) = 0, and eliminating p between this and y = px + f(p) gives the <b>singular solution</b>, the envelope that every line touches (green). For y = px + a/p it is the parabola y² = 4ax (PYQ Q1.8); for y = px + √(a²p² + b²) it is the ellipse x²/a² + y²/b² = 1. Slide c and watch the gold line roll along the envelope, always tangent at the white point where its slope equals the envelope&apos;s slope. The singular solution is not obtainable from the general one by any value of c.</p>}
    />
  );
}
