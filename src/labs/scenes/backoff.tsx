"use client";
import { backoff } from "../sim/webb";
import { Bars, C, Floor, Panel } from "../kit";
import { LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { WEBB_SPECS } from "../meta/webb.specs";

const t = (ms: number) => (ms >= 1000 ? `${(ms / 1000).toFixed(1)} s` : `${ms.toFixed(0)} ms`);

export default function BackoffLab() {
  const [P, set, reset] = useLabParams(WEBB_SPECS.backoff);
  const attempts = Math.round(P.attempts), o = backoff(P.base, P.factor, attempts, P.cap, P.fail);
  const cols = o.waits.map((w) => (w >= P.cap ? C.red : C.blue));
  return (
    <LabFrame
      label="A row of columns, one per retry, whose heights are the wait before that retry, blue and turning red when the cap is reached, with a green column for the chance of eventually succeeding"
      camera={[0, 0.7, 6.4]}
      animated={false}
      onReset={reset}
      scene={() => (
        <group>
          <Floor size={12} y={-1.5} divisions={12} />
          <Panel p={[0, 0.2, -0.7]} w={7.6} h={3.9} />
          {o.waits.length > 0 && <Bars values={o.waits} max={Math.max(...o.waits, 1)} colors={cols} x0={-3.3} y0={-1.5} w={0.45} gap={0.15} height={3.1} glow={0.3} />}
          <Bars values={[o.pSuccess]} max={1} colors={C.green} x0={3.1} y0={-1.5} w={0.5} height={3.1} glow={0.3} />
        </group>
      )}
      readouts={[
        ["Waits between attempts", o.waits.length ? o.waits.map(t).join(", ") : "none (one attempt)"],
        ["Worst-case total wait", t(o.worstWait)],
        ["Expected wait", t(o.expWait)],
        ["Chance it works eventually", `${(o.pSuccess * 100).toFixed(1)}%`],
        ["Chance every attempt fails", `${(o.pAllFail * 100).toFixed(1)}%`],
        ["Average attempts used", o.expAttempts.toFixed(2)],
      ]}
      controls={<>
        <Slider label="First wait" value={P.base} min={50} max={2000} step={50} digits={0} unit=" ms" onChange={(x) => set("base", x)} />
        <Slider label="Growth factor per retry" value={P.factor} min={1} max={4} step={0.5} digits={1} unit="×" onChange={(x) => set("factor", x)} />
        <Slider label="Attempts (first try + retries)" value={attempts} min={1} max={10} step={1} digits={0} onChange={(x) => set("attempts", Math.round(x))} />
        <Slider label="Longest single wait (cap)" value={P.cap} min={500} max={60000} step={500} digits={0} unit=" ms" onChange={(x) => set("cap", x)} />
        <Slider label="Chance one attempt fails" value={P.fail} min={0} max={100} step={5} digits={0} unit=" %" onChange={(x) => set("fail", x)} />
      </>}
      note={<p>If a request fails because a server is busy, retrying at once only makes it busier. Exponential backoff waits base, base × factor, base × factor², … before each retry, up to a cap (red columns are at the cap). The green column is the chance that at least one attempt works: 1 − p^attempts when each attempt fails independently with probability p. The expected wait counts a wait only if all earlier attempts failed. Real systems add random jitter so many clients do not retry in step; this model has none, and assumes failures are independent.</p>}
    />
  );
}
