"use client";
import { useMemo } from "react";
import { stackAt, stackTrace } from "../sim/weba";
import { Bars, Box, C, Floor, Panel } from "../kit";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { WEBA_SPECS } from "../meta/weba.specs";

const PAL = [C.blue, C.green, C.gold, C.purple, C.orange, C.red];

export default function CallStackLab() {
  const [P, set, reset] = useLabParams(WEBA_SPECS.callstack);
  const n = Math.round(P.n), kind = P.kind;
  const T = useMemo(() => stackTrace(kind, n), [kind, n]);
  const step = Math.min(Math.round(P.step), T.events.length);
  const st = stackAt(T.events, step);
  const ev = step > 0 ? T.events[step - 1] : null;
  const name = kind === "fact" ? "fact" : kind === "fib" ? "fib" : "sum";
  const progress = T.events.length ? step / T.events.length : 0;
  return (
    <LabFrame
      label="A tower of coloured slabs, one per function call waiting on the stack, growing and shrinking as you step through the calls, beside a progress bar and two columns for the current and deepest stack"
      camera={[0, 0.8, 7]}
      animated={false}
      onReset={reset}
      scene={() => (
        <group>
          <Floor size={12} y={-1.5} divisions={12} />
          <Panel p={[-1.7, 0.4, -0.6]} w={3.6} h={4.4} />
          {st.map((a, i) => <Box key={i} p={[-1.7, -1.3 + i * 0.3, 0]} s={[2.4, 0.26, 1]} c={PAL[a % PAL.length]} glow={i === st.length - 1 ? 0.7 : 0.1} />)}
          <Panel p={[2.2, 0.4, -0.6]} w={3.4} h={4.4} />
          <Bars values={[st.length, T.maxDepth]} max={Math.max(1, T.maxDepth)} colors={[C.green, C.blue]} x0={1.4} y0={-1.5} w={0.6} gap={0.4} height={3.2} glow={0.3} />
          <Box p={[2.2 - 1.3 + (progress * 2.6) / 2, 2.05, 0]} s={[Math.max(0.02, progress * 2.6), 0.16, 0.3]} c={C.gold} glow={0.5} />
          <Box p={[2.2, 2.05, -0.05]} s={[2.6, 0.06, 0.2]} c={C.grey} />
        </group>
      )}
      readouts={[
        ["Answer", String(T.result)],
        ["Total calls", String(T.calls)],
        ["Deepest stack", `${T.maxDepth} frames`],
        ["Now", ev ? (ev.op === "call" ? `call ${name}(${ev.arg})` : `return ${name}(${ev.arg}) = ${ev.val}`) : "before the first call"],
        ["Stack now (top last)", st.length ? st.slice(-5).map((a) => `${name}(${a})`).join(" ▸ ") : "empty"],
        ["Step", `${step} of ${T.events.length}`],
      ]}
      controls={<>
        <Slider label="Argument n" value={n} min={1} max={12} step={1} digits={0} onChange={(x) => set("n", Math.round(x))} />
        <Pick label="Function" value={kind} options={[{ id: "fact", label: "factorial(n) = n × factorial(n − 1)" }, { id: "fib", label: "fib(n) = fib(n − 1) + fib(n − 2)" }, { id: "sum", label: "sum(n) = n + sum(n − 1)" }]} onChange={(v) => set("kind", v)} />
        <Slider label="Step through the calls" value={step} min={0} max={1000} step={1} digits={0} onChange={(x) => set("step", Math.round(x))} />
      </>}
      note={<p>Each function call adds a frame to the top of the call stack, and each return removes it. Drag the last slider (or type a step number) to replay every call and return. The green column is the stack height now and the blue one the deepest it will get; the gold bar shows how far through the replay you are. Factorial and sum go straight down and back up; Fibonacci calls itself twice, so it makes far more calls than its depth suggests (2·fib(n + 1) − 1). The slider stops at the last event of the chosen function.</p>}
    />
  );
}
