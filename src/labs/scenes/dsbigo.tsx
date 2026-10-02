"use client";
import { bigONaught, growth, loopCount, type LoopProg } from "../sim/bcax";
import { Axes, Poly } from "../kit";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { BCAX_SPECS } from "../meta/bcax.specs";
import { Bench, C, Halo, Packet, Slab, type V3 } from "./bcax-kit";

const NAME: Record<LoopProg, string> = { lin: "for (i=0; i<n; i++)", nest: "for i<n { for j<n }", tri: "for i<n { for j<i }", log: "for (i=1; i<=n; i*=2)", nlogn: "for i<n { for (j=1; j<=n; j*=2) }" };
const CLASS: Record<LoopProg, string> = { lin: "O(n)", nest: "O(n²)", tri: "O(n²)", log: "O(log n)", nlogn: "O(n log n)" };

export default function DsBigoLab() {
  const [P, set, reset] = useLabParams(BCAX_SPECS.dsbigo);
  const { view, prog, n, a, b, c, k } = P;
  const nmax = Math.max(n, 8), S = 28;
  const xs = Array.from({ length: S }, (_, i) => 1 + ((nmax - 1) * i) / (S - 1));
  const g = growth(nmax), top = view === "count" ? Math.max(g.quad, 1) : Math.max(a * nmax * nmax + b * nmax + c, k * nmax * nmax, 1);
  const X = (v: number) => -4.5 + ((v - 1) / (nmax - 1)) * 9, Y = (v: number) => 0.1 + Math.min(1, v / top) * 4.4;
  const curve = (f: (v: number) => number): V3[] => xs.map((v) => [X(v), Y(f(v)), 0] as V3);
  const cnt = loopCount(prog, n), gn = growth(n), n0 = bigONaught(a, b, c, k);
  const fN = a * n * n + b * n + c;
  const mark = view === "count" ? Y(cnt) : Y(fN);
  return (
    <LabFrame
      label="A 3D graph of operation counts against input size: thin curves for n, n log n and n squared, a thick gold curve for the chosen loop program, and a glowing marker at the chosen n; in bound mode an orange polynomial is compared with a green k n squared curve"
      camera={[0, 3.2, 10]}
      onReset={reset}
      scene={() => (<group position={[0, -0.6, 0]}>
        <Bench w={13} d={4} />
        <Axes x0={-4.5} y0={0.1} w={9.3} h={4.6} />
        {view === "count" ? (<group>
          <Poly pts={curve((v) => Math.log2(v))} c={C.light} w={1.5} />
          <Poly pts={curve((v) => v)} c={C.blue} w={1.5} />
          <Poly pts={curve((v) => v * Math.log2(Math.max(1, v)))} c={C.purple} w={1.5} />
          <Poly pts={curve((v) => v * v)} c={C.red} w={1.5} />
          <Poly pts={curve((v) => loopCount(prog, Math.round(v)))} c={C.gold} w={4} />
        </group>) : (<group>
          <Poly pts={curve((v) => a * v * v + b * v + c)} c={C.orange} w={4} />
          <Poly pts={curve((v) => k * v * v)} c={C.green} w={3} />
          {n0 !== null && n0 <= nmax && <Slab p={[X(n0), 2.3, -0.3]} s={[0.06, 4.6, 0.6]} c={C.gold} glow={0.8} o={0.7} />}
        </group>)}
        <Slab p={[X(n), mark / 2 + 0.05, 0.3]} s={[0.1, mark, 0.1]} c={C.gold} glow={0.6} />
        <Halo p={[X(n), mark + 0.1, 0.3]} r={0.28} />
        <Packet path={view === "count" ? curve((v) => loopCount(prog, Math.round(v))) : curve((v) => a * v * v + b * v + c)} c={C.white} speed={0.1} r={0.1} />
      </group>)}
      readouts={view === "count" ? [
        ["Program", NAME[prog]], ["Statement runs", String(cnt)], ["Growth class", CLASS[prog]], ["n log n / n²", `${gn.nlogn.toFixed(0)} / ${gn.quad}`], ["2ⁿ for comparison", n > 40 ? "astronomical" : String(gn.exp)],
      ] : [
        ["f(n)", `${a}n² + ${b}n + ${c} = ${fN}`], ["k·n²", String(k * n * n)], ["f(n) ≤ k·n² ?", fN <= k * n * n ? "yes at this n" : "no at this n"], ["Smallest n0 that works", n0 === null ? "none (k too small)" : String(n0)], ["So f(n) is", n0 === null ? "not O(n²) with this k" : `O(n²) with c = ${k}, n0 = ${n0}`],
      ]}
      controls={<>
        <Slider label="Input size n" value={n} min={1} max={64} step={1} digits={0} onChange={(x) => set("n", Math.round(x))} />
        <Pick label="Show" value={view} options={[{ id: "count", label: "Count loop operations" }, { id: "bound", label: "Big-O definition check" }]} onChange={(x) => set("view", x)} />
        {view === "count" && <Pick label="Loop program" value={prog} options={(Object.keys(NAME) as LoopProg[]).map((id) => ({ id, label: NAME[id] }))} onChange={(x) => set("prog", x)} />}
        {view === "bound" && <Slider label="a in f(n) = a n² + b n + c" value={a} min={1} max={10} step={1} digits={0} onChange={(x) => set("a", Math.round(x))} />}
        {view === "bound" && <Slider label="b" value={b} min={0} max={20} step={1} digits={0} onChange={(x) => set("b", Math.round(x))} />}
        {view === "bound" && <Slider label="c" value={c} min={0} max={50} step={1} digits={0} onChange={(x) => set("c", Math.round(x))} />}
        {view === "bound" && <Slider label="Constant k in k·n²" value={k} min={1} max={20} step={1} digits={0} onChange={(x) => set("k", Math.round(x))} />}
      </>}
      note={<p>Time complexity counts how often the basic statement runs as the input size n grows. One loop is O(n); two nested loops over n are O(n²); the triangular loop runs n(n−1)/2 times, still O(n²); doubling the loop variable gives O(log n); a linear loop around it gives O(n log n). Formally f(n) = O(g(n)) if f(n) ≤ c·g(n) for all n ≥ n0 (PYQ Q5.3): in bound mode 3n² + 2n + 5 ≤ 4n² for n ≥ 4, so c = 4 and n0 = 4. Ω is a lower bound and Θ means both. Space complexity counts the extra memory the algorithm needs.</p>}
    />
  );
}
