"use client";
import { CH_MATS, cayley, frac, matPow, type CHId, type Mat } from "../sim/mathi";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { MATHI_SPECS } from "../meta/mathi.specs";
import { C, Dot, Instances, Spin, matBars, type V3 } from "./mathi-kit";

const SLOT = 2.1;
const rowsText = (M: Mat | null) => (M ? M.map((r) => r.map((v) => frac(v)).join(" ")).join(" ; ") : "none");
export default function CayleyHamiltonLab() {
  const [P, set, reset] = useLabParams(MATHI_SPECS.caleyham);
  const { mat, k, a, b, c, d } = P;
  const A: Mat = CH_MATS[mat].M ?? [[a, b], [c, d]], n = A.length;
  const r = cayley(A, Math.round(k));
  const terms = r.c.map((co, i) => matPow(A, i).map((row) => row.map((v) => co * v)));
  const big = Math.max(1, ...terms.flat(2).map(Math.abs)), sc = 1.7 / big;
  const slots = n + 2, x0 = (i: number) => (i - (slots - 1) / 2) * SLOT, pitch = 0.5;
  const items = [
    ...terms.flatMap((T, i) => matBars(T, x0(i), -1.6, pitch, sc)),
    ...matBars(r.P, x0(n + 1), -1.6, pitch, sc, () => C.green),
    ...(r.inv ? matBars(r.inv, x0(0), 1.7, pitch, 1.7 / Math.max(1, ...r.inv.flat().map(Math.abs)), (_i, _j, v) => (v >= 0 ? C.gold : C.orange)) : []),
    ...matBars(r.Ak, x0(n + 1), 1.7, pitch, 1.7 / Math.max(1, ...r.Ak.flat().map(Math.abs)), (_i, _j, v) => (v >= 0 ? C.purple : C.red)),
  ];
  const plus: V3[] = Array.from({ length: n + 1 }, (_, i) => [(x0(i) + x0(i + 1)) / 2, 0.08, -1.6]);
  return (
    <LabFrame
      label="The terms of the characteristic polynomial, each as a grid of coloured bars, add up to a flat green zero matrix; below are the inverse and a high power of the matrix"
      camera={[0, 7.2, 8.4]}
      onReset={reset}
      scene={() => (<Spin speed={0.06}><group>
        <Instances items={items} cap={150} />
        {plus.map((p, i) => <Dot key={i} p={p} r={0.08} c={i === n ? C.green : C.light} glow={0.5} />)}
        <mesh position={[0, -0.03, -0.1]}><boxGeometry args={[slots * SLOT, 0.04, 6.2]} /><meshStandardMaterial color={C.dark} roughness={0.8} /></mesh>
      </group></Spin>)}
      readouts={[
        ["Characteristic equation", `${r.poly} = 0`],
        ["Trace  /  determinant", `${frac(r.tr)}  /  ${frac(r.det)}`],
        ["p(A) = 0 check, largest entry", r.resid < 1e-8 ? "0 (verified)" : r.resid.toExponential(1)],
        ["Inverse A⁻¹ (rows)", r.inv ? rowsText(r.inv) : "none (|A| = 0)"],
        [`Trace of A^${Math.round(k)}`, frac(Math.round(r.trAk * 1e6) / 1e6)],
        [`A^${Math.round(k)} (rows)`, rowsText(r.Ak.map((row) => row.map((v) => Math.round(v * 1e6) / 1e6)))],
      ]}
      controls={<>
        <Slider label="Power k of A" value={k} min={0} max={12} step={1} digits={0} onChange={(v) => set("k", v)} />
        <Pick label="Matrix" value={mat} options={(Object.keys(CH_MATS) as CHId[]).map((m) => ({ id: m, label: CH_MATS[m].label }))} onChange={(v) => set("mat", v)} />
        <Slider label="Own matrix a" value={a} min={-4} max={4} step={1} digits={0} onChange={(v) => set("a", v)} />
        <Slider label="Own matrix b" value={b} min={-4} max={4} step={1} digits={0} onChange={(v) => set("b", v)} />
        <Slider label="Own matrix c" value={c} min={-4} max={4} step={1} digits={0} onChange={(v) => set("c", v)} />
        <Slider label="Own matrix d" value={d} min={-4} max={4} step={1} digits={0} onChange={(v) => set("d", v)} />
      </>}
      note={<>
        <p><b>Cayley-Hamilton theorem.</b> Every square matrix satisfies its own characteristic equation |A − λI| = 0. Back row: the terms c₀I, c₁A, c₂A², … (blue positive, red negative bars) and, after the last gold dot, their sum, a flat green zero matrix. Rearranging p(A) = 0 and multiplying by A⁻¹ gives the inverse (front left, gold): for a 2 × 2 matrix A⁻¹ = [(tr A)I − A]/|A|. Higher powers (front right, purple) reduce to lower ones the same way: A³ = 6A² − 9A + 4I for the first 3 × 3 matrix. The own-matrix sliders only act when &quot;Your own 2 × 2&quot; is picked.</p>
        <p className="mt-2"><b>Try.</b> PYQ: A = [2 −1 1; −1 2 −1; 1 −1 2] gives λ³ − 6λ² + 9λ − 4 = 0 and A⁻¹ = ¼[3 1 −1; 1 3 1; −1 1 3]. Choose the singular 2 × 2 matrix: |A| = 0, so no inverse exists, yet the theorem still holds. Raise k and check the trace of Aᵏ equals the sum of the eigenvalues to the k.</p>
      </>}
    />
  );
}
