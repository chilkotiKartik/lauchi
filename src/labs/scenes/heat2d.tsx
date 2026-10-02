"use client";
import { Line } from "@react-three/drei";
import { useMemo } from "react";
import { contourSegs, plateRate, plateTemp } from "../sim/mathii";
import { LabFrame, Slider, Pick } from "../ui";
import { useLabParams } from "../params";
import { MATHII_SPECS } from "../meta/mathii.specs";
import { C, Orb, Pillar, Segments, Surface, Sway, buildSurface, fmt, ramp, segPoints } from "./mathii-kit";

const N = 37, HT = 2.4;

export default function Heat2dLab() {
  const [P, set, reset] = useLabParams(MATHII_SPECS.heat2d);
  const { U, mode, b, m, n, a2, t, px, py } = P;
  const mm = Math.round(m), nn = Math.round(n), s = 5 / Math.max(1, b);
  const grid = useMemo(() => {
    const v: number[] = [];
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) v.push(plateTemp(mode, U, b, mm, nn, a2, t, i / (N - 1), (b * j) / (N - 1)));
    return v;
  }, [mode, U, b, mm, nn, a2, t]);
  const hot = mode !== "decay";
  const geo = useMemo(() => buildSurface({
    n: N, x0: 0, x1: 1, y0: 0, y1: b, sx: s, sy: s,
    h: (x, y) => { const T = grid[Math.round((y / b) * (N - 1)) * N + Math.round(x * (N - 1))]; return (T / U) * HT; },
    col: (x, y) => { const T = grid[Math.round((y / b) * (N - 1)) * N + Math.round(x * (N - 1))]; return ramp(hot ? Math.max(0, T / U) : 0.5 + (0.5 * T) / U); },
  }), [grid, U, b, s, hot]);
  const iso = useMemo(() => {
    const levels = hot ? [0.1, 0.25, 0.5, 0.75, 0.9] : [-0.5, -0.25, 0.25, 0.5];
    return levels.map((q) => segPoints(contourSegs(grid, N, 0, 1, 0, b, q * U), () => q * HT + 0.03, s, s));
  }, [grid, U, b, s, hot]);
  const nodal = useMemo(() => (hot ? [] : segPoints(contourSegs(grid, N, 0, 1, 0, b, 0), () => 0.03, s, s)), [grid, b, s, hot]);
  const Tp = plateTemp(mode, U, b, mm, nn, a2, t, px, py * b), Tc = plateTemp(mode, U, b, mm, nn, a2, t, 0.5, b / 2);
  const peak = Math.max(...grid), lam = mode === "decay" ? plateRate(a2, b, mm, nn) : plateRate(a2, b, 1, 1);
  const cx = s / 2, cz = (s * b) / 2;
  return (
    <LabFrame
      label="A coloured 3D temperature surface over a rectangular plate with white isotherm lines: hot red where the top edge is heated or at the start, blue where the edges are held at zero, with a gold probe pillar"
      camera={[0, 4.6, 7.6]}
      onReset={reset}
      scene={() => (<group>
        <Sway amp={0.3}>
          <group position={[-cx, -0.5, cz]}>
            <Surface geo={geo} />
            {iso.map((p, i) => <Segments key={i} pts={p} color="#e8f1f5" width={1.6} />)}
            <Segments pts={nodal} color={C.white} width={3} />
            <Line points={[[0, 0.01, 0], [s, 0.01, 0], [s, 0.01, -s * b], [0, 0.01, -s * b], [0, 0.01, 0]]} color={C.light} lineWidth={2} />
            {mode === "steady" && <Line points={[[0, 0.02, -s * b], [s, 0.02, -s * b]]} color={C.red} lineWidth={6} />}
            <Pillar x={px * s} z={-py * b * s} h={(Tp / U) * HT} c={C.white} />
            <Orb p={[px * s, (Tp / U) * HT, -py * b * s]} r={0.14} c={C.gold} />
            <gridHelper args={[Math.max(s, s * b) + 1, 12, "#3d5560", "#26363d"]} position={[cx, -0.02, -cz]} />
          </group>
        </Sway>
      </group>)}
      readouts={[
        ["Temperature at the probe", `${fmt(Tp, 2)} °`],
        ["Temperature at the centre", `${fmt(Tc, 2)} °`],
        ["Hottest point on the plate", `${fmt(peak, 2)} °`],
        ["Equation type", mode === "steady" ? "Laplace uxx + uyy = 0, elliptic (B² − 4AC = −4)" : "Heat ut = α²(uxx + uyy), parabolic (B² − 4AC = 0)"],
        ["Decay rate λ", mode === "steady" ? "none: steady state" : `${fmt(lam, 4)} per unit time`],
        ["Time constant 1/λ", mode === "steady" ? "—" : fmt(1 / lam, 4)],
      ]}
      controls={<>
        <Slider label="Temperature scale U" value={U} min={10} max={200} step={1} digits={0} unit=" °" onChange={(v) => set("U", v)} />
        <Pick label="Problem" value={mode} options={[{ id: "steady", label: "Steady state (Laplace): top edge at U, other edges 0" }, { id: "decay", label: "Transient: one mode sin(mπx)·sin(nπy/b)" }, { id: "cool", label: "Transient: uniform plate cooling, edges at 0" }]} onChange={(v) => set("mode", v)} />
        <Slider label="Plate height b (width = 1)" value={b} min={0.5} max={2.5} step={0.05} digits={2} onChange={(v) => set("b", v)} />
        <Slider label="Mode number m (x direction)" value={m} min={1} max={4} step={1} digits={0} onChange={(v) => set("m", v)} />
        <Slider label="Mode number n (y direction)" value={n} min={1} max={4} step={1} digits={0} onChange={(v) => set("n", v)} />
        <Slider label="Diffusivity α²" value={a2} min={0.05} max={1} step={0.01} digits={2} onChange={(v) => set("a2", v)} />
        <Slider label="Time t" value={t} min={0} max={1} step={0.01} digits={2} onChange={(v) => set("t", v)} />
        <Slider label="Probe x / width" value={px} min={0.02} max={0.98} step={0.01} digits={2} onChange={(v) => set("px", v)} />
        <Slider label="Probe y / height" value={py} min={0.02} max={0.98} step={0.01} digits={2} onChange={(v) => set("py", v)} />
      </>}
      note={<p>In two dimensions the heat equation is ∂u/∂t = α²(∂²u/∂x² + ∂²u/∂y²). <b>Steady state</b> (∂u/∂t = 0) leaves Laplace&apos;s equation uxx + uyy = 0. Separating variables u = X(x)Y(y) gives X&apos;&apos;/X = −Y&apos;&apos;/Y = −k²; to fit three edges at 0 and the top at U the solution is u = Σ (4U/nπ) sin(nπx) sinh(nπy)/sinh(nπb), n odd. By symmetry the centre of a square plate with one edge at U is exactly U/4 (check it). In the <b>transient</b> problem each product mode sin(mπx)sin(nπy/b) simply decays like e<sup>−λt</sup> with λ = α²π²(m² + n²/b²); a uniform initial temperature is a sum of the odd modes with coefficients 16U/(π²mn), and after a short time only the slowest mode (m = n = 1) survives. White curves are isotherms; the gold pillar is the probe. Classification by B² − 4AC: Laplace is elliptic, heat is parabolic.</p>}
    />
  );
}
