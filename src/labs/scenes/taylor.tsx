"use client";
import { Line } from "@react-three/drei";
import { useMemo } from "react";
import { TAYLOR_FUNCS, taylor, type TaylorId } from "../math";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { CORE_SPECS } from "../meta/core.specs";

export default function TaylorLab() {
  const [P, set, reset] = useLabParams(CORE_SPECS.taylor);
  const { id, n, a, x0 } = P;
  const setId = (x: (typeof P)["id"]) => set("id", x), setN = (x: (typeof P)["n"]) => set("n", x), setA = (x: (typeof P)["a"]) => set("a", x), setX0 = (x: (typeof P)["x0"]) => set("x0", x);
  const F = TAYLOR_FUNCS[id];
  const lo = Math.max(F.lo, id === "ln" ? -0.95 : F.lo), hi = F.hi, W = 3.4, H = 1.4;
  const cap = id === "exp" ? 8 : id === "ln" ? 3 : 2.5;
  const X = (x: number) => ((x - (lo + hi) / 2) / ((hi - lo) / 2)) * W;
  const Y = (y: number) => (Math.max(-cap, Math.min(cap, y)) / cap) * H;
  const xs = useMemo(() => Array.from({ length: 300 }, (_, i) => lo + ((hi - lo) * i) / 299), [lo, hi]);
  const curve = useMemo(() => xs.map((x): [number, number, number] => [X(x), Y(F.f(x)), 0]), [xs, F]); // eslint-disable-line react-hooks/exhaustive-deps
  // Keep only the contiguous run around the centre that stays inside the plot, so diverging tails leave the frame instead of flattening at the edge.
  const poly = (deg: number, z: number) => {
    const ys = xs.map((x) => taylor(id, deg, a, x));
    let c = 0; xs.forEach((x, i) => { if (Math.abs(x - a) < Math.abs(xs[c] - a)) c = i; });
    let l = c, r = c;
    while (l > 0 && Math.abs(ys[l - 1]) <= cap) l--;
    while (r < xs.length - 1 && Math.abs(ys[r + 1]) <= cap) r++;
    const out: [number, number, number][] = [];
    for (let i = l; i <= r; i++) out.push([X(xs[i]), Y(ys[i]), z]);
    return out.length > 1 ? out : [[X(a), 0, z], [X(a) + 0.001, 0, z]] as [number, number, number][];
  };
  const layers = useMemo(() => Array.from({ length: n }, (_, d) => poly(d, -0.25 * (n - d))), [n, id, a, xs]); // eslint-disable-line react-hooks/exhaustive-deps
  const main = useMemo(() => poly(n, 0.15), [n, id, a, xs]); // eslint-disable-line react-hooks/exhaustive-deps
  const exact = F.f(x0), approx = taylor(id, n, a, x0);
  return (
    <LabFrame
      label={`Taylor polynomials of ${F.label} converging on the true curve`}
      animated={false}
      camera={[0, 1, 8]}
      onReset={reset}
      scene={() => (<group>
        <Line points={[[-W - 0.3, 0, 0], [W + 0.3, 0, 0]]} color="#5b6d77" lineWidth={1.5} />
        <Line points={[[X(0), -H - 0.2, 0], [X(0), H + 0.2, 0]]} color="#5b6d77" lineWidth={1.5} />
        {layers.map((p, i) => (<Line key={i} points={p} color="#2ba6f5" lineWidth={1} transparent opacity={0.35} />))}
        <Line points={curve} color="#ffffff" lineWidth={3} />
        <Line points={main} color="#ffc83d" lineWidth={3.5} />
        <mesh position={[X(a), Y(F.f(a)), 0.2]}><sphereGeometry args={[0.09, 16, 16]} /><meshStandardMaterial color="#44c95a" /></mesh>
        <mesh position={[X(x0), Y(approx), 0.2]}><sphereGeometry args={[0.08, 16, 16]} /><meshStandardMaterial color="#ffc83d" /></mesh>
        <mesh position={[X(x0), Y(exact), 0.2]}><sphereGeometry args={[0.08, 16, 16]} /><meshStandardMaterial color="#ffffff" /></mesh>
      </group>)}
      readouts={[["f(x₀) exact", exact.toFixed(6)], [`P${n}(x₀)`, approx.toFixed(6)], ["Absolute error", Math.abs(exact - approx).toExponential(2)], ["Centre a", a.toFixed(2)]]}
      controls={<>
        <Pick label="Function" value={id} options={(Object.keys(TAYLOR_FUNCS) as TaylorId[]).map((k) => ({ id: k, label: TAYLOR_FUNCS[k].label }))} onChange={(v) => { setId(v); setA(0); setX0(v === "ln" ? 0.5 : 1.5); }} />
        <Slider label="Degree n" value={n} min={1} max={15} step={1} digits={0} onChange={setN} />
        <Slider label="Centre a" value={a} min={id === "ln" ? -0.5 : -2} max={2} step={0.1} digits={1} onChange={setA} />
        <Slider label="Test point x₀" value={x0} min={id === "ln" ? -0.9 : -3} max={id === "ln" ? 2.5 : 3} onChange={setX0} />
      </>}
      note={<p>The white curve is the true function; the yellow curve is its degree-n Taylor polynomial Pₙ(x) = Σ f⁽ᵏ⁾(a)(x − a)ᵏ / k! about the green point, and the faint blue curves are the lower degrees stacked behind. Increase n and the yellow curve hugs the white one over a wider window around a. For ln(1 + x) about a = 0 the series only converges for −1 &lt; x ≤ 1, so beyond x = 1 more terms make it worse — try it.</p>}
    />
  );
}
