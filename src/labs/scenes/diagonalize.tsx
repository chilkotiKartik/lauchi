"use client";
import { Line } from "@react-three/drei";
import { useRef } from "react";
import type * as THREE from "three";
import { diag2, diagPower, fmt, matPow, orbit2 } from "../sim/mathi";
import { Tick } from "../Stage";
import { LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { MATHI_SPECS } from "../meta/mathi.specs";
import { C, Dot, Grid, Instances, P3, type V3 } from "./mathi-kit";

const mt = (M: number[][]) => M.map((r) => r.map((v) => fmt(v, Math.abs(v) >= 1000 ? 0 : 2)).join("  ")).join("   |   ");
export default function DiagonalizeLab() {
  const [P, set, reset] = useLabParams(MATHI_SPECS.diagonalize);
  const { a, b, c, d, n, ang } = P;
  const N = Math.round(n), D = diag2(a, b, c, d), pw = diagPower(a, b, c, d, N);
  const An = matPow([[a, b], [c, d]], N);
  const ell: V3[] = [];
  const maxR = Math.max(1e-6, ...Array.from({ length: 48 }, (_, i) => { const t = (i * Math.PI * 2) / 48; return Math.hypot(An[0][0] * Math.cos(t) + An[0][1] * Math.sin(t), An[1][0] * Math.cos(t) + An[1][1] * Math.sin(t)); }));
  const se = 2.5 / maxR;
  for (let i = 0; i <= 64; i++) { const t = (i * Math.PI * 2) / 64, x = An[0][0] * Math.cos(t) + An[0][1] * Math.sin(t), y = An[1][0] * Math.cos(t) + An[1][1] * Math.sin(t); ell.push(P3(x * se, y * se, 0.02)); }
  const orb = orbit2(a, b, c, d, ang, N), maxO = Math.max(1e-6, ...orb.map((p) => Math.hypot(p[0], p[1]))), so = 2.5 / maxO;
  const op: V3[] = orb.map((p, i) => P3(p[0] * so, p[1] * so, 0.25 + i * 0.28));
  const circle: V3[] = Array.from({ length: 49 }, (_, i) => P3(Math.cos((i * Math.PI * 2) / 48), Math.sin((i * Math.PI * 2) / 48), 0.02));
  const real = D.kind === "real" || D.kind === "scalar";
  const axes = real ? [{ v: D.v1, c: C.gold }, { v: D.v2, c: C.green }] : D.kind === "defective" ? [{ v: D.v1, c: C.gold }] : [];
  const posts = orb.map((p, i) => ({ p: [p[0] * so, (0.25 + i * 0.28) / 2, -p[1] * so] as V3, s: [0.025, 0.25 + i * 0.28, 0.025] as V3, c: C.dark }));
  const ball = useRef<THREE.Group>(null), t = useRef(0);
  const tick = (dt: number) => {
    t.current = (t.current + Math.min(dt, 0.05) * 0.25) % 1;
    const f = t.current * (op.length - 1), i = Math.min(op.length - 2, Math.floor(f)), u = f - i;
    if (op.length > 1) ball.current?.position.set(op[i][0] + (op[i + 1][0] - op[i][0]) * u, op[i][1] + (op[i + 1][1] - op[i][1]) * u, op[i][2] + (op[i + 1][2] - op[i][2]) * u);
  };
  const lamTxt = D.kind === "complex" ? `${fmt(D.re, 3)} ± ${fmt(D.im, 3)} i` : `${fmt(D.l1, 4)}, ${fmt(D.l2, 4)}`;
  const verdict = D.kind === "real" ? "Diagonalisable (distinct real eigenvalues)" : D.kind === "scalar" ? "Already diagonal (A = λI)" : D.kind === "defective" ? "Not diagonalisable (one eigenvector)" : "Complex eigenvalues (no real eigenvectors)";
  return (
    <LabFrame
      label="The unit circle stretched into an ellipse by A to the power n, aligned with the glowing eigenvector lines, and a ball hopping up a staircase of iterates A to the i times a start vector"
      camera={[4.6, 5.2, 6.2]}
      onReset={reset}
      scene={() => (<group>
        <Tick fn={tick} />
        <Grid size={7} />
        <Line points={circle} color={C.blue} lineWidth={2} />
        <Line points={ell} color={C.orange} lineWidth={3.5} />
        {axes.map((e, i) => <Line key={i} points={[P3(-3.4 * e.v[0], -3.4 * e.v[1], 0.03), P3(3.4 * e.v[0], 3.4 * e.v[1], 0.03)]} color={e.c} lineWidth={3} />)}
        <Instances items={posts} cap={10} />
        <Line points={op} color={C.purple} lineWidth={2.5} />
        {op.map((p, i) => <Dot key={i} p={p} r={i === 0 ? 0.12 : 0.085} c={i === 0 ? C.red : C.purple} glow={0.5} />)}
        <group ref={ball}><Dot p={[0, 0, 0]} r={0.13} c={C.white} glow={0.9} /></group>
      </group>)}
      readouts={[
        [`Aⁿ for n = ${N}`, mt(An)],
        ["Eigenvalues λ₁, λ₂", lamTxt],
        ["Sum  /  trace and product  /  |A|", `${fmt(D.l1 + D.l2, 3)} = ${fmt(a + d, 3)}  /  ${fmt(D.l1 * D.l2, 3)} = ${fmt(a * d - b * c, 3)}`],
        ["Eigenvectors (unit)", real ? `(${fmt(D.v1[0], 3)}, ${fmt(D.v1[1], 3)}), (${fmt(D.v2[0], 3)}, ${fmt(D.v2[1], 3)})` : "—"],
        ["P Dⁿ P⁻¹ matches Aⁿ, error", pw.viaP ? pw.resid.toExponential(1) : "not applicable"],
        ["Verdict", verdict],
      ]}
      controls={<>
        <Slider label="Power n in Aⁿ" value={n} min={0} max={8} step={1} digits={0} onChange={(v) => set("n", v)} />
        <Slider label="Start vector angle" value={ang} min={0} max={360} step={5} digits={0} unit="°" onChange={(v) => set("ang", v)} />
        <Slider label="Entry a (row 1, col 1)" value={a} min={-4} max={4} step={0.5} digits={1} onChange={(v) => set("a", v)} />
        <Slider label="Entry b (row 1, col 2)" value={b} min={-4} max={4} step={0.5} digits={1} onChange={(v) => set("b", v)} />
        <Slider label="Entry c (row 2, col 1)" value={c} min={-4} max={4} step={0.5} digits={1} onChange={(v) => set("c", v)} />
        <Slider label="Entry d (row 2, col 2)" value={d} min={-4} max={4} step={0.5} digits={1} onChange={(v) => set("d", v)} />
      </>}
      note={<>
        <p><b>Diagonalisation.</b> If A has two independent eigenvectors, P = [v₁ v₂] gives P⁻¹AP = D = diag(λ₁, λ₂), so Aⁿ = P Dⁿ P⁻¹: only the diagonal entries are raised to the power. The blue circle is the unit circle and the orange curve is its image under Aⁿ (drawn rescaled to fit): as n grows it flattens onto the gold line, the eigenvector with the larger |λ|. The purple staircase is the orbit x, Ax, A²x, … of the start vector (red) lifted one step per iterate; it also swings into the dominant eigenvector. Green line = the other eigenvector.</p>
        <p className="mt-2"><b>Try.</b> The default A = [4 1; 2 3] has eigenvalues 5 and 2, trace 7, |A| = 10. Make it symmetric (c = b) and the eigenvectors turn orthogonal. Set b = 0 = c, a = d: scalar. Set a = d, c = 0, b ≠ 0: defective, only one eigenvector so no P exists. Try a = d = 0, b = −1, c = 1: a rotation with complex eigenvalues ± i, so no line stays fixed.</p>
      </>}
    />
  );
}
