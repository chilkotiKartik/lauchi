"use client";
import { Line } from "@react-three/drei";
import { useMemo } from "react";
import { eigen2 } from "../math";
import { LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { CORE_SPECS } from "../meta/core.specs";

type V3 = [number, number, number];
export default function EigenLab() {
  const [P, set, reset] = useLabParams(CORE_SPECS.eigen);
  const { a, b, c, d } = P;
  const setA = (x: (typeof P)["a"]) => set("a", x), setB = (x: (typeof P)["b"]) => set("b", x), setC = (x: (typeof P)["c"]) => set("c", x), setD = (x: (typeof P)["d"]) => set("d", x);
  const T = (x: number, y: number): V3 => [a * x + b * y, 0, -(c * x + d * y)];
  const grid = useMemo(() => {
    const lines: V3[][] = [];
    for (let i = -4; i <= 4; i++) {
      lines.push([T(i, -4), T(i, 4)]); lines.push([T(-4, i), T(4, i)]);
    }
    return lines;
  }, [a, b, c, d]); // eslint-disable-line react-hooks/exhaustive-deps
  const circle = useMemo(() => Array.from({ length: 129 }, (_, i) => T(Math.cos((i / 128) * 2 * Math.PI), Math.sin((i / 128) * 2 * Math.PI))), [a, b, c, d]); // eslint-disable-line react-hooks/exhaustive-deps
  const e = eigen2(a, b, c, d), det = a * d - b * c, tr = a + d;
  const ev = e.real ? e.vectors.map((v, i) => ({ v, l: e.values[i] })) : [];
  return (
    <LabFrame
      label="Live linear transformation of the plane with eigenvectors highlighted"
      animated={false}
      camera={[0, 9, 2.5]}
      onReset={reset}
      scene={() => (<group>
        {Array.from({ length: 9 }, (_, i) => (<group key={i}>
          <Line points={[[i - 4, 0, -4], [i - 4, 0, 4]]} color="#33454e" lineWidth={1} />
          <Line points={[[-4, 0, i - 4], [4, 0, i - 4]]} color="#33454e" lineWidth={1} />
        </group>))}
        {grid.map((g, i) => (<Line key={i} points={g} color="#2ba6f5" lineWidth={1.2} transparent opacity={0.6} />))}
        <Line points={circle} color="#ffc83d" lineWidth={3} />
        {ev.map(({ v, l }, i) => (<Line key={i} points={[[-v[0] * 5, 0.02, v[1] * 5], [v[0] * 5, 0.02, -v[1] * 5]]} color={i ? "#a970ff" : "#ff5a5f"} lineWidth={3} dashed={l < 0} dashSize={0.2} gapSize={0.1} />))}
        <Line points={[[0, 0, 0], T(1, 0)]} color="#44c95a" lineWidth={4} />
        <Line points={[[0, 0, 0], T(0, 1)]} color="#ff9a1f" lineWidth={4} />
      </group>)}
      readouts={[
        ["Determinant", det.toFixed(3)], ["Trace", tr.toFixed(3)],
        ...(e.real ? ([["λ₁", e.values[0].toFixed(3)], ["λ₂", e.values[1].toFixed(3)]] as [string, string][]) : ([["Eigenvalues", `${e.re.toFixed(2)} ± ${e.im.toFixed(2)}i`], ["Real eigenvectors", "none"]] as [string, string][])),
      ]}
      controls={<>
        <Slider label="a (row 1, col 1)" value={a} min={-3} max={3} step={0.1} digits={1} onChange={setA} />
        <Slider label="b (row 1, col 2)" value={b} min={-3} max={3} step={0.1} digits={1} onChange={setB} />
        <Slider label="c (row 2, col 1)" value={c} min={-3} max={3} step={0.1} digits={1} onChange={setC} />
        <Slider label="d (row 2, col 2)" value={d} min={-3} max={3} step={0.1} digits={1} onChange={setD} />
      </>}
      note={<p>The matrix [[a, b], [c, d]] moves every point of the plane. The blue grid is the transformed square grid, the yellow curve is what the unit circle becomes, and the green and orange arrows are where the basis vectors (1,0) and (0,1) land. Red and purple lines are the eigenvectors: directions the matrix only stretches by λ, without turning. Set b = −c with a = d = 0 to get a pure rotation — no real eigenvectors exist. A determinant of 0 flattens the plane onto a line.</p>}
    />
  );
}
