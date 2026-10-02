"use client";
import { Line } from "@react-three/drei";
import { useMemo } from "react";
import { UC_LABEL, ucF, ucLimit, ucNeeded, ucSup, ucUniform, ucXmax, type UcId } from "../sim/mathii";
import { LabFrame, Slider, Pick } from "../ui";
import { useLabParams } from "../params";
import { MATHII_SPECS } from "../meta/mathii.specs";
import { C, Orb, Surface, Sway, buildSurface, fmt, ramp, type V3 } from "./mathii-kit";

const NR = 40, W = 6.4, SY = 0.1, XS = 90;
const HS: Record<UcId, number> = { xn: 2.2, hump: 5, sinn: 2.2, sinsum: 1.5 };

export default function UniformConvLab() {
  const [P, set, reset] = useLabParams(MATHII_SPECS.uniformconv);
  const { n, fn, a, eps } = P;
  const nn = Math.round(n), xm = ucXmax(fn, a), sx = W / xm, hs = HS[fn];
  const geo = useMemo(() => buildSurface({
    n: 61, x0: 0, x1: xm, y0: 1, y1: NR, sx, sy: SY,
    h: (x, k) => ucF(fn, Math.round(k), x) * hs,
    col: (x, k, h) => ramp(0.5 + (0.5 * h) / (hs * (fn === "sinsum" ? 1.8 : 1))),
  }), [fn, xm, sx, hs]);
  const pts = useMemo(() => {
    const slice: V3[] = [], lim: V3[] = [], up: V3[] = [], dn: V3[] = [];
    let best = 0, bx = 0;
    for (let i = 0; i <= XS; i++) {
      const x = (xm * i) / XS, y = ucF(fn, nn, x), l = ucLimit(fn, a, x), z = -nn * SY;
      slice.push([x * sx, y * hs + 0.02, z]); lim.push([x * sx, l * hs + 0.02, z]); up.push([x * sx, (l + eps) * hs, z]); dn.push([x * sx, (l - eps) * hs, z]);
      const dlt = Math.abs(y - (fn === "xn" && x >= 1 ? 0 : l));
      if (dlt > best) { best = dlt; bx = x; }
    }
    return { slice, lim, up, dn, bx };
  }, [fn, nn, a, eps, xm, sx, hs]);
  const sup = ucSup(fn, nn, a), need = ucNeeded(fn, a, eps), uni = ucUniform(fn, a), inside = sup < eps;
  const peak: V3 = [pts.bx * sx, ucF(fn, nn, pts.bx) * hs + 0.05, -nn * SY];
  return (
    <LabFrame
      label="A rippling coloured 3D surface of the function sequence with x along one axis and the index n going into the screen, a gold slice for the chosen n and green tube lines at the tolerance epsilon around the limit"
      camera={[0, 3.6, 8.5]}
      onReset={reset}
      scene={() => (<group>
        <Sway amp={0.25}>
          <group position={[-W / 2, -0.8, (NR * SY) / 2]}>
            <Surface geo={geo} opacity={0.88} />
            <Line points={pts.lim} color={C.white} lineWidth={2.4} />
            <Line points={pts.up} color={C.green} lineWidth={2.4} dashed dashSize={0.15} gapSize={0.1} />
            <Line points={pts.dn} color={C.green} lineWidth={2.4} dashed dashSize={0.15} gapSize={0.1} />
            <Line points={pts.slice} color={C.gold} lineWidth={4.5} />
            <Orb p={peak} r={0.12} c={inside ? C.green : C.red} />
            <gridHelper args={[W + 1, 12, "#3d5560", "#26363d"]} position={[W / 2, -0.01, -(NR * SY) / 2]} />
          </group>
        </Sway>
      </group>)}
      readouts={[
        ["Chosen n", String(nn)],
        ["sup |fₙ(x) − f(x)|", fmt(sup, 5)],
        ["Tolerance ε", fmt(eps, 3)],
        ["Inside the ε-tube?", inside ? "Yes ✓ for this n" : "No ✗ the peak sticks out"],
        ["N so that all n ≥ N fit", need === null ? "none: no such N exists" : String(need)],
        ["Uniformly convergent?", uni ? "Yes: sup → 0" : "No: sup does not → 0"],
      ]}
      controls={<>
        <Slider label="Index n" value={n} min={1} max={60} step={1} digits={0} onChange={(v) => set("n", v)} />
        <Pick label="Sequence / series" value={fn} options={(Object.keys(UC_LABEL) as UcId[]).map((k) => ({ id: k, label: UC_LABEL[k] }))} onChange={(v) => set("fn", v)} />
        <Slider label="Right end a (for xⁿ on [0, a])" value={a} min={0.3} max={1} step={0.01} digits={2} onChange={(v) => set("a", v)} />
        <Slider label="Tolerance ε" value={eps} min={0.02} max={0.6} step={0.01} digits={2} onChange={(v) => set("eps", v)} />
      </>}
      note={<p>fₙ → f <b>uniformly</b> on an interval if sup|fₙ(x) − f(x)| → 0, which means that for any ε there is one N that works for every x: from n = N onward the whole graph fits inside the green ε-tube round the limit. Pointwise convergence only needs a different N for each x. The surface shows x across and n going back; the gold slice is fₙ. For xⁿ on [0, a] with a &lt; 1 the sup is aⁿ → 0 (uniform), but on [0, 1] the sup stays 1 because of the steep wall near x = 1 (the limit is discontinuous). The hump n·x·e<sup>−nx</sup> tends to 0 at every point, but its peak 1/e simply moves towards 0 and never shrinks. For a series Σfₖ the <b>Weierstrass M-test</b> says: if |fₖ(x)| ≤ Mₖ and ΣMₖ converges then the series converges uniformly; here |sin kx/k²| ≤ 1/k² and Σ1/k² = π²/6, so the tail beyond n is below Σ<sub>k&gt;n</sub> 1/k² (the sup readout).</p>}
    />
  );
}
