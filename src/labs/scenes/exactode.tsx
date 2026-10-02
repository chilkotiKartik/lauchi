"use client";
import { useMemo } from "react";
import { EXACT, IF_LABEL, contourSegs, exactLab, exactParts, isExact, type ExactId, type IfId } from "../sim/mathii";
import { LabFrame, Slider, Pick } from "../ui";
import { useLabParams } from "../params";
import { MATHII_SPECS } from "../meta/mathii.specs";
import { C, Orb, Pillar, Segments, Surface, Sway, buildSurface, fmt, ramp, segPoints } from "./mathii-kit";

const N = 41, LO = 0.3, HI = 2.7, S = 2, HMAX = 2.4;
type Field = { vals: number[]; potential: boolean; lo: number; hi: number };
/** Potential φ(x, y) when the equation is exact and φ is known, else the mismatch ∂M/∂y − ∂N/∂x. */
function fieldOf(id: ExactId, mu: IfId): Field {
  const eq = EXACT[id], pf = isExact(eq, mu) ? eq.phi[mu] : undefined, vals: number[] = [];
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const x = LO + ((HI - LO) * i) / (N - 1), y = LO + ((HI - LO) * j) / (N - 1);
    vals.push(pf ? pf(x, y) : exactParts(eq, mu, x, y).diff);
  }
  const fin = vals.filter(Number.isFinite);
  let lo = Math.min(...fin), hi = Math.max(...fin);
  if (!pf) { const m = Math.max(1e-9, ...fin.map(Math.abs)); lo = -m; hi = m; }
  return { vals, potential: !!pf, lo, hi };
}
const norm = (f: Field, v: number) => (f.hi - f.lo > 1e-12 ? (v - f.lo) / (f.hi - f.lo) : 0.5);
const hOf = (f: Field, v: number) => (f.potential ? norm(f, v) * HMAX : (norm(f, v) - 0.5) * HMAX);
const at = (f: Field, x: number, y: number) => f.vals[Math.round(((y - LO) / (HI - LO)) * (N - 1)) * N + Math.round(((x - LO) / (HI - LO)) * (N - 1))];

export default function ExactOdeLab() {
  const [P, set, reset] = useLabParams(MATHII_SPECS.exactode);
  const { x0, y0, eq, mu } = P;
  const fld = useMemo(() => fieldOf(eq, mu), [eq, mu]);
  const flat = !fld.potential && fld.hi < 1e-6;
  const geo = useMemo(() => buildSurface({
    n: N, x0: LO, x1: HI, y0: LO, y1: HI, sx: S, sy: S,
    h: (x, y) => { const v = at(fld, x, y); return Number.isFinite(v) ? hOf(fld, v) : 0; },
    col: (x, y) => { const v = at(fld, x, y); return ramp(Number.isFinite(v) ? norm(fld, v) : 0.5); },
  }), [fld]);
  const out = exactLab(eq, mu, x0, y0);
  const here = fld.potential ? EXACT[eq].phi[mu]!(x0, y0) : out.diff;
  const level = at(fld, x0, y0);
  const cont = segPoints(contourSegs(fld.vals, N, LO, HI, LO, HI, fld.potential ? EXACT[eq].phi[mu]!(x0, y0) : 0), (x, y) => hOf(fld, at(fld, x, y)) + 0.04, S, S);
  const py = Number.isFinite(level) ? hOf(fld, level) : 0;
  const eqd = EXACT[eq];
  return (
    <LabFrame
      label="A coloured height surface: the potential of an exact differential equation, with a gold solution curve through the probe, or a warped red and blue sheet showing how far the equation is from exact"
      camera={[0, 4.2, 7.5]}
      onReset={reset}
      scene={() => (<group>
        <Sway>
          <group position={[-(LO + HI) * S / 2, 0, ((LO + HI) * S) / 2]}>
            <Surface geo={geo} />
            <Segments pts={cont} color="#ffc83d" width={3.2} />
            <Pillar x={x0 * S} z={-y0 * S} h={py} c={C.white} />
            <Orb p={[x0 * S, py, -y0 * S]} r={0.14} c={C.gold} />
            <gridHelper args={[8, 16, "#3d5560", "#26363d"]} position={[(LO + HI) * S / 2, -0.02, -((LO + HI) * S) / 2]} />
          </group>
        </Sway>
      </group>)}
      readouts={[
        ["∂(μM)/∂y", fmt(out.My, 3)],
        ["∂(μN)/∂x", fmt(out.Nx, 3)],
        ["Difference", fmt(out.diff, 4)],
        ["Exact?", out.exact ? "Yes: ∂M/∂y = ∂N/∂x ✓" : "No ✗ (try an integrating factor)"],
        ["Potential φ at probe", out.hasPotential ? fmt(here, 3) : out.exact ? "exact (potential not drawn)" : "none yet"],
        ["Solution", mu === eqd.ifKey ? eqd.sol : out.exact ? "exact, φ = c" : "multiply by the right μ first"],
      ]}
      controls={<>
        <Slider label="Probe x" value={x0} min={0.4} max={2.6} step={0.05} digits={2} onChange={(v) => set("x0", v)} />
        <Slider label="Probe y" value={y0} min={0.4} max={2.6} step={0.05} digits={2} onChange={(v) => set("y0", v)} />
        <Pick label="Equation M dx + N dy = 0" value={eq} options={(Object.keys(EXACT) as ExactId[]).map((k) => ({ id: k, label: EXACT[k].label }))} onChange={(v) => set("eq", v)} />
        <Pick label="Multiply by integrating factor μ" value={mu} options={(Object.keys(IF_LABEL) as IfId[]).map((k) => ({ id: k, label: IF_LABEL[k] }))} onChange={(v) => set("mu", v)} />
      </>}
      note={<p>{flat ? "The sheet is flat: the equation is exact. " : ""}M dx + N dy = 0 is <b>exact</b> when ∂M/∂y = ∂N/∂x. Then a potential φ(x, y) exists with φ<sub>x</sub> = M and φ<sub>y</sub> = N, and the solution is the level curve φ = c. When the equation is exact the surface shows φ and the gold curve is the solution through the probe. When it is <b>not</b> exact the surface shows the mismatch ∂M/∂y − ∂N/∂x instead (red above zero, blue below): a wavy sheet means no potential yet. Multiplying by the right integrating factor μ (for example 1/(x²y²) for Q1.3(b), or 1/y⁴ for Q1.3(d)) flattens the sheet and the potential appears. For y dx − x dy = 0, three different factors 1/y², 1/(xy) and 1/x² all work. Try the PYQ equations and hunt for the factor that makes the readout say Yes.</p>}
    />
  );
}
