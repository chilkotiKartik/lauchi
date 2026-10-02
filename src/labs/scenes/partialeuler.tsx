"use client";
import { Line } from "@react-three/drei";
import { useMemo } from "react";
import { EULER_FUNCS, euler, fmt, type EulerId } from "../sim/mathi";
import { useQuality } from "../Stage";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { MATHI_SPECS } from "../meta/mathi.specs";
import { mix } from "../kit2";
import { C, Dot, GeoMesh, Grid, P3, surfaceGeo, type V3 } from "./mathi-kit";

const D0 = 0.1, D1 = 3;
function zmaxOf(id: EulerId) {
  let m = 0.01;
  for (let i = 0; i <= 10; i++) for (let j = 0; j <= 10; j++) m = Math.max(m, Math.abs(EULER_FUNCS[id].f(D0 + ((D1 - D0) * i) / 10, D0 + ((D1 - D0) * j) / 10)));
  return m;
}

export default function PartialEulerLab() {
  const quality = useQuality();
  const [P, set, reset] = useLabParams(MATHI_SPECS.partialeuler);
  const { fn, px, py, t } = P;
  const F = EULER_FUNCS[fn], e = euler(fn, px, py, t);
  const zs = 2.6 / zmaxOf(fn), N = quality === "low" ? 24 : 36;
  const geo = useMemo(() => surfaceGeo(F.f, [D0, D1], [D0, D1], N, (_x, _y, z) => mix(C.blue, C.gold, Math.abs(z) / (2.6 / zs)), zs, 1e9), [fn, N]); // eslint-disable-line react-hooks/exhaustive-deps
  const xs: V3[] = Array.from({ length: 41 }, (_, i) => { const x = D0 + ((D1 - D0) * i) / 40; return P3(x, py, F.f(x, py) * zs); });
  const ys: V3[] = Array.from({ length: 41 }, (_, i) => { const y = D0 + ((D1 - D0) * i) / 40; return P3(px, y, F.f(px, y) * zs); });
  const sMax = Math.min(D1 / Math.max(px, py), 3), ray: V3[] = Array.from({ length: 41 }, (_, i) => { const s = 0.1 + ((sMax - 0.1) * i) / 40; return P3(s * px, s * py, F.f(s * px, s * py) * zs); });
  const d = 0.55;
  const tx: V3[] = [P3(px - d, py, (e.f - e.fx * d) * zs), P3(px + d, py, (e.f + e.fx * d) * zs)];
  const ty: V3[] = [P3(px, py - d, (e.f - e.fy * d) * zs), P3(px, py + d, (e.f + e.fy * d) * zs)];
  const inside = t * px <= D1 && t * py <= D1;
  const fmtN = (v: number | null) => (v === null ? "—" : fmt(v, 4));
  return (
    <LabFrame
      label="The surface z = f(x, y) with slice curves through a point, their tangent lines giving the partial derivatives, and a ray showing how f scales"
      camera={[0, 4.6, 6.4]}
      animated={false}
      onReset={reset}
      scene={() => (<group position={[-2, -1.2, 2]} scale={1.35}>
        <Grid size={6} y={0} />
        <GeoMesh geo={geo} o={0.85} />
        <Line points={xs} color={C.gold} lineWidth={3} />
        <Line points={ys} color={C.blue} lineWidth={3} />
        <Line points={ray} color={C.purple} lineWidth={3} />
        <Line points={tx} color={C.red} lineWidth={4} />
        <Line points={ty} color={C.green} lineWidth={4} />
        <Dot p={P3(px, py, e.f * zs)} r={0.09} c="#ffffff" />
        {inside && <Dot p={P3(t * px, t * py, e.scaled * zs)} r={0.08} c={C.purple} />}
        <Line points={[P3(px, py, 0), P3(px, py, e.f * zs)]} color="#9db0ba" lineWidth={1} dashed dashSize={0.06} gapSize={0.05} />
      </group>)}
      readouts={[
        ["f(x, y)", fmt(e.f, 4)],
        ["∂f/∂x, ∂f/∂y", `${fmt(e.fx, 3)}, ${fmt(e.fy, 3)}`],
        ["x fₓ + y f_y", fmt(e.lhs, 4)],
        [e.n === null ? "n·f (not homogeneous)" : `n·f with n = ${e.n}`, fmtN(e.rhs)],
        ["f(tx, ty)", inside ? fmt(e.scaled, 4) : "outside the grid"],
        ["tⁿ · f(x, y)", fmtN(e.scaledPred)],
      ]}
      controls={<>
        <Slider label="Point x" value={px} min={0.2} max={3} step={0.05} digits={2} onChange={(v) => set("px", v)} />
        <Slider label="Point y" value={py} min={0.2} max={3} step={0.05} digits={2} onChange={(v) => set("py", v)} />
        <Pick label="Function" value={fn} options={(Object.keys(EULER_FUNCS) as EulerId[]).map((k) => ({ id: k, label: EULER_FUNCS[k].label }))} onChange={(v) => set("fn", v)} />
        <Slider label="Scale factor t" value={t} min={0.5} max={2.5} step={0.05} digits={2} onChange={(v) => set("t", v)} />
      </>}
      note={<>
        <p><b>Partial derivatives.</b> Cut the surface by the plane y = const (gold curve): the slope of its tangent (red) is ∂f/∂x. Cut by x = const (blue curve): the tangent (green) has slope ∂f/∂y. <b>Euler&apos;s theorem:</b> if f(tx, ty) = tⁿ f(x, y) (homogeneous of degree n) then x f<sub>x</sub> + y f<sub>y</sub> = n f. The purple curve is f along the ray through the origin and your point; its height grows like tⁿ.</p>
        <p className="mt-2"><b>Try.</b> x² + xy + y² (n = 2): at any point x f<sub>x</sub> + y f<sub>y</sub> equals 2f. Switch to (x − y)/(x + y), of degree 0, and the sum is 0 while f stays the same along the ray. Choose x² + y³: it is not homogeneous, so the two sides disagree. The surface is stretched vertically to fit.</p>
      </>}
    />
  );
}
