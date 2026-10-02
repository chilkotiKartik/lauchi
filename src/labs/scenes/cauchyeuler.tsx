"use client";
import { Line } from "@react-three/drei";
import { useMemo } from "react";
import { ceDY, ceResidual, ceRoots, ceY } from "../sim/mathii";
import { LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { MATHII_SPECS } from "../meta/mathii.specs";
import { Graph, type XY } from "../kit2";
import { C, Orb, Sway, fmt, type V3 } from "./mathii-kit";

const XA = 0.2, XB = 4, NP = 100, RS = 3 / 8;
const g1 = (a: number): V3 => [a, 0.01, 0];
function rootPos(re: number, im: number): V3 { return [Math.max(-3, Math.min(3, re * RS)), 0.12, -Math.max(-3, Math.min(3, im * RS))]; }

export default function CauchyEulerLab() {
  const [P, set, reset] = useLabParams(MATHII_SPECS.cauchyeuler);
  const { a, b, x, c1, c2 } = P;
  const r = ceRoots(a, b);
  const d = useMemo(() => {
    const xs = Array.from({ length: NP + 1 }, (_, i) => XA + ((XB - XA) * i) / NP);
    const ys = xs.map((q) => ceY(a, b, c1, c2, q));
    const abs = ys.filter(Number.isFinite).map(Math.abs).sort((p, q) => p - q);
    const top = Math.max(1, (abs[Math.floor(abs.length * 0.88)] ?? 1) * 1.5);
    return { xs, ys, top };
  }, [a, b, c1, c2]);
  const px: XY[] = d.xs.map((q, i) => [q, d.ys[i]]).filter((p): p is XY => Number.isFinite(p[1]));
  const pz: XY[] = d.xs.map((q, i) => [Math.log(q), d.ys[i]] as XY).filter((p) => Number.isFinite(p[1]));
  const y = ceY(a, b, c1, c2, x), dy = ceDY(a, b, c1, c2, x), res = ceResidual(a, b, c1, c2, x);
  const col = r.kind === "real" ? C.green : r.kind === "repeat" ? C.gold : C.purple;
  const roots = r.kind === "complex" ? [rootPos(r.alpha, r.beta), rootPos(r.alpha, -r.beta)] : [rootPos(r.m1, 0), rootPos(r.m2, 0)];
  const zr: [number, number] = [Math.log(XA), Math.log(XB)];
  return (
    <LabFrame
      label="Two graphs of the same Cauchy-Euler solution, y against x on the left and y against z equal to log x on the right, above a flat complex plane where the roots of the auxiliary equation sit as glowing spheres"
      camera={[0, 3.6, 9.5]}
      onReset={reset}
      scene={() => (<group>
        <Sway amp={0.2}>
          <Graph x0={-5.2} y0={0.2} w={4.6} h={2.8} xr={[XA, XB]} yr={[-d.top, d.top]} marker={Number.isFinite(y) ? [x, y] : null} markerColor={C.gold} grid={4} curves={[{ pts: px, color: C.blue, w: 3.2 }]} vlines={[{ x, color: C.light }]} />
          <Graph x0={0.6} y0={0.2} w={4.6} h={2.8} xr={zr} yr={[-d.top, d.top]} marker={Number.isFinite(y) ? [Math.log(x), y] : null} markerColor={C.gold} grid={4} curves={[{ pts: pz, color: C.orange, w: 3.2 }]} vlines={[{ x: Math.log(x), color: C.light }]} />
          <group position={[0, -2.2, 1.6]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[3.2, 40]} /><meshStandardMaterial color="#16303b" /></mesh>
            <Line points={[g1(-3), g1(3)]} color={C.light} lineWidth={1.6} />
            <Line points={[[0, 0.01, -3], [0, 0.01, 3]]} color={C.light} lineWidth={1.6} />
            <gridHelper args={[6, 12, "#3d5560", "#26363d"]} position={[0, 0.005, 0]} />
            {roots.map((p, i) => <Orb key={i} p={p} r={0.2} c={col} glow={0.9} />)}
            {roots.map((p, i) => <Line key={"l" + i} points={[[p[0], 0.01, 0], [p[0], 0.12, p[2]], p]} color={col} lineWidth={2} />)}
          </group>
        </Sway>
      </group>)}
      readouts={[
        ["Auxiliary equation (x = eᶻ)", `m² ${a - 1 < 0 ? "−" : "+"} ${Math.abs(a - 1).toFixed(1)}m ${b < 0 ? "−" : "+"} ${Math.abs(b).toFixed(1)} = 0`],
        ["Roots", r.kind === "complex" ? `${fmt(r.alpha, 2)} ± ${fmt(r.beta, 2)}i` : r.kind === "repeat" ? `${fmt(r.m1, 2)} (repeated)` : `${fmt(r.m1, 2)}, ${fmt(r.m2, 2)}`],
        ["Solution form", r.kind === "real" ? "c₁x^m₁ + c₂x^m₂" : r.kind === "repeat" ? "(c₁ + c₂ ln x)x^m" : "x^α[c₁cos(β ln x) + c₂sin(β ln x)]"],
        ["y(x)", fmt(y, 4)],
        ["y′(x)", fmt(dy, 4)],
        ["x²y″ + a x y′ + b y", Math.abs(res) < 1e-3 * (1 + Math.abs(y)) ? "≈ 0 ✓" : fmt(res, 5)],
      ]}
      controls={<>
        <Slider label="Coefficient a in x²y″ + a·x·y′ + b·y = 0" value={a} min={-4} max={6} step={0.5} digits={1} onChange={(v) => set("a", v)} />
        <Slider label="Coefficient b" value={b} min={-4} max={8} step={0.5} digits={1} onChange={(v) => set("b", v)} />
        <Slider label="Point x" value={x} min={0.2} max={4} step={0.05} digits={2} onChange={(v) => set("x", v)} />
        <Slider label="Constant c₁" value={c1} min={-2} max={2} step={0.1} digits={1} onChange={(v) => set("c1", v)} />
        <Slider label="Constant c₂" value={c2} min={-2} max={2} step={0.1} digits={1} onChange={(v) => set("c2", v)} />
      </>}
      note={<p>The <b>Cauchy-Euler equation</b> x²y″ + a x y′ + b y = 0 has variable coefficients, yet the substitution x = eᶻ (so x d/dx = D and x² d²/dx² = D(D − 1)) turns it into the constant-coefficient equation (D² + (a − 1)D + b)y = 0. The orange graph is that equation in z = ln x, the blue one is the original in x: same curve, stretched logarithmically. Roots of m² + (a − 1)m + b = 0: real distinct m₁, m₂ give c₁x^m₁ + c₂x^m₂; equal roots give (c₁ + c₂ ln x)x^m; complex α ± iβ give x^α[c₁cos(β ln x) + c₂ sin(β ln x)], which oscillates forever as x → 0. The roots are the glowing spheres on the complex plane (green real, gold repeated, purple complex pair). PYQ Q2.4: x²y″ − 3xy′ + 5y = x log x has m = 2 ± i. For the right-hand side use variation of parameters or put x = eᶻ and use the usual PI rules.</p>}
    />
  );
}
