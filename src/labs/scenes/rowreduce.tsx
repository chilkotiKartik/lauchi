"use client";
import { Line } from "@react-three/drei";
import { RR_MATS, fmt, rowSteps, rowSummary, rowText, type RrId } from "../sim/mathi";
import { Shuttle } from "../kit";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { MATHI_SPECS } from "../meta/mathi.specs";
import { C, Instances, Spin, matBars, type V3 } from "./mathi-kit";

const PITCH = 0.85;
export default function RowReduceLab() {
  const [P, set, reset] = useLabParams(MATHI_SPECS.rowreduce);
  const { mat, mode, step } = P;
  const { M: M0, aug, note: tag } = RR_MATS[mat];
  const steps = rowSteps(mat, mode), s = Math.min(Math.round(step), steps.length - 1);
  const S = steps[s].M, prev = s > 0 ? steps[s - 1].M : null, sum = rowSummary(mat, S);
  const R = S.length, Cn = S[0].length, nv = aug ? Cn - 1 : Cn;
  const changed = S.map((r, i) => (prev ? r.some((v, j) => Math.abs(v - prev[i][j]) > 1e-9) : false));
  const pivot = S.map((r) => r.slice(0, nv).findIndex((v) => Math.abs(v) > 1e-9));
  const gap = (j: number) => (aug && j === Cn - 1 ? 0.35 : 0);
  const bars = matBars(S, 0, 0, PITCH, 0.32, (i, j, v) => (pivot[i] === j ? C.gold : aug && j === Cn - 1 ? (v < 0 ? C.orange : C.purple) : undefined)).map((b, k) => ({ ...b, p: [b.p[0] + gap(k % Cn), b.p[1], b.p[2]] as V3 }));
  const plank = S.map((_, i) => ({ p: [gap(Cn - 1) / 2, -0.04, (i - (R - 1) / 2) * PITCH] as V3, s: [Cn * PITCH + 0.5, 0.06, PITCH * 0.92] as V3, c: changed[i] ? C.orange : C.dark }));
  const sepX = ((2 * nv - 1) / 2 - (Cn - 1) / 2) * PITCH + 0.175;
  const zc = (changed.findIndex(Boolean) - (R - 1) / 2) * PITCH, wid = (Cn * PITCH) / 2;
  const barLine: V3[] = [[-wid, 0.02, -((R - 1) / 2) * PITCH - 0.6], [wid + gap(Cn - 1), 0.02, -((R - 1) / 2) * PITCH - 0.6]];
  return (
    <LabFrame
      label="A matrix drawn as a grid of coloured bars, row by row; each elementary row operation reshapes the bars until the echelon form shows the rank"
      camera={[0, 5.4, 6.2]}
      onReset={reset}
      scene={() => (<Spin speed={0.07}><group>
        <Instances items={plank} cap={6} />
        <Instances items={bars} cap={24} />
        {aug && <Line points={[[sepX, 0.03, -R * PITCH / 2], [sepX, 0.03, R * PITCH / 2]]} color={C.light} lineWidth={2} />}
        <Line points={barLine} color={C.green} lineWidth={2} />
        {prev && changed.some(Boolean) && <Shuttle from={[-wid, 2.5, zc]} to={[wid + gap(Cn - 1), 2.5, zc]} speed={0.5} r={0.12} c={C.green} />}
      </group></Spin>)}
      readouts={[
        ["Row operation", s === 0 ? "none yet" : steps[s].op],
        ["Step", `${s} of ${steps.length - 1}`],
        ["Non-zero rows (rank of A)", String(sum.rankA)],
        ["Rank of [A | B]", aug ? String(sum.rankAug) : "—"],
        ["Verdict", sum.verdict],
        ["Row 1  /  Row 2", `${rowText(S[0], aug)}  /  ${rowText(S[1], aug)}`],
      ]}
      controls={<>
        <Slider label="Row operation number" value={step} min={0} max={30} step={1} digits={0} onChange={(v) => set("step", v)} />
        <Pick label="Matrix or system" value={mat} options={(Object.keys(RR_MATS) as RrId[]).map((k) => ({ id: k, label: RR_MATS[k].label }))} onChange={(v) => set("mat", v)} />
        <Pick label="Method" value={mode} options={[{ id: "echelon", label: "Echelon form (Gauss)" }, { id: "gj", label: "Reduced form (Gauss-Jordan)" }]} onChange={(v) => set("mode", v)} />
      </>}
      note={<>
        <p><b>Rank by row reduction.</b> Elementary row operations (swap, scale, add a multiple of one row to another) never change the rank. Reduce to echelon form and the rank is the number of non-zero rows. Blue bars are positive entries, red are negative, grey tiles are zeros, gold marks each pivot; the orange plank is the row that was just changed, and the purple column is B in AX = B. Current matrix: {tag}, {M0.length} × {M0[0].length}, final nullity {fmt(sum.nullity, 0)}.</p>
        <p className="mt-2"><b>Try.</b> PYQ: find the rank of the 4 × 4 matrices (rank 3). Then take the systems from PYQ Q5.2 with λ = 6: μ = 26 ends with a zero row (consistent, a line of solutions) while μ = 20 ends with 0 = 6 (rank A &lt; rank [A|B], no solution). Switch to Gauss-Jordan on the first system to read the solution (1, 2, 3) straight off.</p>
      </>}
    />
  );
}
