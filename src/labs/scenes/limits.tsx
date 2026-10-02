"use client";
import { useMemo } from "react";
import { limFn, limitAt } from "../sim/extra";
import { Axes, Ball, C, Panel, Poly, pieces, type V3 } from "../kit";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { EXTRA_SPECS } from "../meta/extra.specs";

const X0 = -3.2, XW = 6.4, YC = 0, YS = 0.7, CLIP = 3;
const sx = (x: number) => X0 + ((x + 4) / 8) * XW, sy = (y: number) => YC + Math.max(-CLIP, Math.min(CLIP, y)) * YS;
const fmt = (v: number | null) => (v === null ? "undefined" : v === Infinity ? "+∞" : v === -Infinity ? "−∞" : v.toFixed(4));

export default function LimitsLab() {
  const [P, set, reset] = useLabParams(EXTRA_SPECS.limits);
  const { a, k, j, h, kind } = P;
  const L = limitAt(kind, a, k, j);
  const lo = limFn(kind, a - h, k, j), hi = limFn(kind, a + h, k, j);
  const parts = useMemo(() => {
    const pts: (V3 | null)[] = [];
    for (let i = 0; i <= 320; i++) {
      const x = -4 + (i / 320) * 8;
      if (kind === "jump" && Math.abs(x - k) < 0.013) { pts.push(null); continue; }
      const y = limFn(kind, x, k, j);
      pts.push(y === null || Math.abs(y) > CLIP ? null : [sx(x), sy(y), 0.05]);
    }
    return pieces(pts);
  }, [kind, k, j]);
  const openAt = (x: number, y: number, c: string) => <Ball p={[sx(x), sy(y), 0.12]} r={0.09} c={c} glow={0.5} />;
  const hole = kind === "hole" ? 2 * k : kind === "sinc" ? 1 : null;
  return (
    <LabFrame
      label="A curve with a removable hole, a jump, sin x over x, or a pole, with blue and red markers approaching the chosen point from the left and right and gold guide lines"
      camera={[0, 0.2, 6.3]}
      animated={false}
      onReset={reset}
      scene={() => (
        <group>
          <Panel p={[0, 0, -0.2]} w={7.2} h={4.6} />
          <Axes x0={X0} y0={YC} w={XW} h={0} c={C.grey} />
          <Poly pts={[[sx(0), -2.2, 0], [sx(0), 2.2, 0]]} c={C.grey} w={1.2} />
          {parts.map((p, i) => <Poly key={i} pts={p} c={C.green} w={3.2} />)}
          <Poly pts={[[sx(a), -2.2, 0.03], [sx(a), 2.2, 0.03]]} c={C.gold} w={1.2} />
          {hole !== null && openAt(kind === "sinc" ? 0 : k, hole, C.orange)}
          {kind === "jump" && openAt(k, k, C.orange)}
          {lo !== null && Math.abs(lo) <= CLIP && <Ball p={[sx(a - h), sy(lo), 0.15]} r={0.11} c={C.blue} glow={0.6} />}
          {hi !== null && Math.abs(hi) <= CLIP && <Ball p={[sx(a + h), sy(hi), 0.15]} r={0.11} c={C.red} glow={0.6} />}
        </group>
      )}
      readouts={[
        ["Left limit", fmt(L.left)],
        ["Right limit", fmt(L.right)],
        ["Limit exists?", L.exists ? `Yes, = ${fmt(L.limit)}` : "No"],
        ["Value f(a)", fmt(L.at)],
        ["Continuous at a?", L.continuous ? "Yes" : "No"],
        ["f(a − h) and f(a + h)", `${fmt(lo)} | ${fmt(hi)}`],
      ]}
      controls={<>
        <Slider label="Point a" value={a} min={-3} max={3} step={0.25} digits={2} onChange={(x) => set("a", x)} />
        <Pick label="Function" value={kind} options={[{ id: "hole", label: "(x² − k²)/(x − k): removable hole" }, { id: "jump", label: "Jump of size j at x = k" }, { id: "sinc", label: "sin x / x" }, { id: "pole", label: "1/(x − k): pole" }]} onChange={(v) => set("kind", v)} />
        <Slider label="Special point k" value={k} min={-3} max={3} step={0.25} digits={2} onChange={(x) => set("k", x)} />
        <Slider label="Jump size j" value={j} min={-3} max={3} step={0.25} digits={2} onChange={(x) => set("j", x)} />
        <Slider label="Distance h" value={h} min={0.001} max={1} step={0.001} digits={3} onChange={(x) => set("h", x)} />
      </>}
      note={<p>The green curve is the function. The gold line is x = a. The limit at a exists only if the value approached from the left (blue marker, at a − h) equals the value approached from the right (red marker, at a + h) and is finite. A function is continuous at a if the limit exists and equals f(a). Orange dots mark a missing or displaced point: a hole (limit exists, f undefined: removable), a jump (left and right differ) or a pole (values run off to ±∞). Shrink h towards 0 to watch the markers close in on the limit. The graph clips at ±3; k and j only affect the functions that use them.</p>}
    />
  );
}
