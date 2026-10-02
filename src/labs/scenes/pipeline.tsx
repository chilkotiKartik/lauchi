"use client";
import { pipeline } from "../sim/weba";
import { Bars, C, Floor } from "../kit";
import { LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { WEBA_SPECS } from "../meta/weba.specs";

export default function PipelineLab() {
  const [P, set, reset] = useLabParams(WEBA_SPECS.pipeline);
  const n = Math.round(P.n), { t, m } = P;
  const o = pipeline(n, t, Math.round(m));
  const w = 0.2, gap = 0.07, x0 = -(n * (w + gap)) / 2;
  const kept = o.data.map((v, i) => (o.keepMask[i] ? v : 0));
  const mapped = o.data.map((v, i) => (o.keepMask[i] ? v * Math.round(m) : 0));
  const avg = o.kept.length ? o.sum / Math.round(m) / o.kept.length : 0;
  return (
    <LabFrame
      label="Three rows of bars from front to back: the original array in blue, the values kept by filter in green, and the kept values after map in gold"
      camera={[0, 2.6, 6.4]}
      animated={false}
      onReset={reset}
      scene={() => (
        <group>
          <Floor size={12} y={-1.3} divisions={12} />
          <Bars values={o.data} max={100} colors={C.blue} x0={x0} z={1.5} y0={-1.3} w={w} gap={gap} height={1.4} />
          <Bars values={kept} max={100} colors={C.green} x0={x0} z={0} y0={-1.3} w={w} gap={gap} height={1.4} />
          <Bars values={mapped} max={100 * Math.round(m)} colors={C.gold} x0={x0} z={-1.5} y0={-1.3} w={w} gap={gap} height={1.4} />
        </group>
      )}
      readouts={[
        ["Array length", String(n)],
        ["Kept by filter", `${o.kept.length} of ${n}`],
        ["Mapped values", o.mapped.length ? o.mapped.join(", ") : "none"],
        ["reduce: sum", String(o.sum)],
        ["Average of the kept", o.kept.length ? avg.toFixed(1) : "none"],
      ]}
      controls={<>
        <Slider label="Filter threshold: keep x > t" value={t} min={0} max={100} step={5} digits={0} onChange={(x) => set("t", x)} />
        <Slider label="Array length" value={n} min={3} max={24} step={1} digits={0} onChange={(x) => set("n", Math.round(x))} />
        <Slider label="Map multiplier" value={m} min={1} max={5} step={1} digits={0} unit="×" onChange={(x) => set("m", Math.round(x))} />
      </>}
      note={<p>This is the code <code>data.filter(x =&gt; x &gt; t).map(x =&gt; x * m).reduce((s, x) =&gt; s + x, 0)</code>. Front row (blue): the original values, a fixed list of pseudo-random numbers from 1 to 100. Middle row (green): filter keeps a value only if it is above the threshold, so the row gets shorter; the bars that were removed shrink to stubs. Back row (gold): map transforms each kept value, here by the multiplier. reduce then adds them into a single number. None of the three methods changes the original array.</p>}
    />
  );
}
