"use client";
import { useMemo } from "react";
import { HARM, contourSegs, harmCheck, type HarmId } from "../sim/mathii";
import { LabFrame, Slider, Pick } from "../ui";
import { useLabParams } from "../params";
import { MATHII_SPECS } from "../meta/mathii.specs";
import { Arrow } from "../kit2";
import { C, Orb, Pillar, Segments, Surface, Sway, buildSurface, cfmt, fmt, ramp, segPoints, type V3 } from "./mathii-kit";

const N = 61, H = 2, S = 1.5, HS = 0.5, CL = 3;
const clampU = (u: number) => Math.max(-CL, Math.min(CL, Number.isFinite(u) ? u : CL));
const hu = (id: HarmId, x: number, y: number) => clampU(HARM[id].u(x, y)) * HS;

export default function HarmonicLab() {
  const [P, set, reset] = useLabParams(MATHII_SPECS.harmonic);
  const { px, py, fn } = P;
  const F = HARM[fn];
  const geo = useMemo(() => buildSurface({
    n: N, x0: -H, x1: H, y0: -H, y1: H, sx: S, sy: S,
    h: (x, y) => hu(fn, x, y), col: (x, y) => ramp(0.5 + clampU(HARM[fn].u(x, y)) / (2 * CL)),
  }), [fn]);
  const lines = useMemo(() => {
    const uv: number[] = [], vv: number[] = [];
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const x = -H + (2 * H * i) / (N - 1), y = -H + (2 * H * j) / (N - 1);
      uv.push(F.u(x, y)); vv.push(F.v ? F.v(x, y) : NaN);
    }
    for (let j = 0; j < N; j++) for (let i = 0; i < N - 1; i++) { const a = vv[j * N + i], b = vv[j * N + i + 1]; if (Math.abs(a - b) > 2.5) { vv[j * N + i] = NaN; vv[j * N + i + 1] = NaN; } }
    for (let j = 0; j < N - 1; j++) for (let i = 0; i < N; i++) { const a = vv[j * N + i], b = vv[(j + 1) * N + i]; if (Math.abs(a - b) > 2.5) { vv[j * N + i] = NaN; vv[(j + 1) * N + i] = NaN; } }
    const lift = (x: number, y: number) => hu(fn, x, y) + 0.03;
    const ul = [-2, -1, -0.5, 0, 0.5, 1, 2].map((q) => segPoints(contourSegs(uv, N, -H, H, -H, H, q), lift, S, S));
    const vl = F.v ? [-2.4, -1.6, -0.8, -0.4, 0, 0.4, 0.8, 1.6, 2.4].map((q) => segPoints(contourSegs(vv, N, -H, H, -H, H, q), lift, S, S)) : [];
    return { ul, vl };
  }, [fn, F]);
  const chk = harmCheck(fn, px, py), u = F.u(px, py), v = F.v ? F.v(px, py) : NaN, w = F.f ? F.f([px, py]) : null;
  const base: V3 = [px * S, hu(fn, px, py) + 0.04, -py * S];
  const gl = Math.hypot(chk.ux, chk.uy) || 1, gv = Math.hypot(chk.vx, chk.vy) || 1;
  const au: V3 = [base[0] + (chk.ux / gl) * 0.9, base[1], base[2] - (chk.uy / gl) * 0.9];
  const av: V3 = Number.isFinite(gv) && F.v ? [base[0] + (chk.vx / gv) * 0.9, base[1], base[2] - (chk.vy / gv) * 0.9] : base;
  const small = (x: number) => (Math.abs(x) < 2e-3 ? "0 ✓" : fmt(x, 4));
  return (
    <LabFrame
      label="A coloured surface of a harmonic function u(x, y) with blue contour lines of u and orange contour lines of its harmonic conjugate v crossing at right angles, and two gradient arrows at a probe point"
      camera={[0, 5.4, 7.6]}
      onReset={reset}
      scene={() => (<group>
        <Sway amp={0.3}>
          <group position={[0, -0.3, 0]}>
            <Surface geo={geo} opacity={0.9} />
            {lines.ul.map((p, i) => <Segments key={"u" + i} pts={p} color="#bfe6ff" width={1.8} />)}
            {lines.vl.map((p, i) => <Segments key={"v" + i} pts={p} color={C.orange} width={1.8} />)}
            <Pillar x={px * S} z={-py * S} h={base[1]} c={C.white} />
            <Orb p={base} r={0.13} c={C.gold} />
            <Arrow from={base} to={au} color="#7fd0ff" r={0.045} />
            {F.v && <Arrow from={base} to={av} color={C.orange} r={0.045} />}
            <gridHelper args={[8, 16, "#3d5560", "#26363d"]} position={[0, -1.6, 0]} />
          </group>
        </Sway>
      </group>)}
      readouts={[
        ["u(x, y)", fmt(u, 4)],
        ["Harmonic conjugate v", F.v ? fmt(v, 4) : "none exists"],
        ["∇²u = uxx + uyy", Math.abs(chk.lap) < 2e-3 ? "0 ✓ harmonic" : `${fmt(chk.lap, 3)} ✗ not harmonic`],
        ["C-R: ux − vy , uy + vx", F.v ? `${small(chk.crA)} , ${small(chk.crB)}` : "cannot hold"],
        ["Gradients ∇u · ∇v", F.v ? small(chk.dot) : "—"],
        [F.fText, w ? cfmt(w, 3) : "not analytic"],
      ]}
      controls={<>
        <Slider label="Probe x" value={px} min={-2} max={2} step={0.05} digits={2} onChange={(v) => set("px", v)} />
        <Slider label="Probe y" value={py} min={-2} max={2} step={0.05} digits={2} onChange={(v) => set("py", v)} />
        <Pick label="Function u(x, y)" value={fn} options={(Object.keys(HARM) as HarmId[]).map((k) => ({ id: k, label: HARM[k].label }))} onChange={(v) => set("fn", v)} />
      </>}
      note={<p>A function u(x, y) is <b>harmonic</b> if it satisfies Laplace&apos;s equation uxx + uyy = 0. If u is harmonic, a <b>harmonic conjugate</b> v exists with u + iv analytic, i.e. the Cauchy-Riemann equations ux = vy, uy = −vx hold. Because ∇u · ∇v = ux vx + uy vy = −vy vx + vx vy = 0, the level curves of u (blue) and of v (orange) always cross at right angles, the same picture as the grid under a conformal map. To find v: integrate vy = ux with respect to y, then fix the missing function of x with vx = −uy; or use the <b>Milne-Thomson</b> shortcut f&apos;(z) = ux(z, 0) − i uy(z, 0). PYQ Q5.1 uses u = ½ log(x² + y²) (v = arctan(y/x), f = log z), u = x³ − 3xy² (f = z³), u = e⁻ˣ(x sin y − y cos y) and u = 3x − 2xy (f = iz² + 3z). Pick u = x² + y² to see a non-harmonic function: ∇²u = 4 and no conjugate exists. The surface is clipped at |u| = 3.</p>}
    />
  );
}
