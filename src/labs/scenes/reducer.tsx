"use client";
import { useMemo } from "react";
import { actionLog, replay } from "../sim/webb";
import { Bars, Box, C, Floor, Panel } from "../kit";
import { LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { WEBB_SPECS } from "../meta/webb.specs";

const COL = { add: C.green, remove: C.orange, clear: C.red } as const;

export default function ReducerLab() {
  const [P, set, reset] = useLabParams(WEBB_SPECS.reducer);
  const n = Math.round(P.n), add = Math.round(P.add);
  const log = useMemo(() => actionLog(n, add), [n, add]);
  const step = Math.min(Math.round(P.step), n);
  const r = replay(log, step), again = replay(log, step);
  const last = step > 0 ? log[step - 1] : null;
  const hist = r.history.map((h) => h.n);
  const w = Math.min(0.18, 6.4 / (n + 1) - 0.03);
  return (
    <LabFrame
      label="A row of coloured action blocks for add, remove and clear, and beneath it bars showing how many items the cart held after each action so far, plus a tall gold column for the cart total"
      camera={[0, 0.7, 6.6]}
      animated={false}
      onReset={reset}
      scene={() => (
        <group>
          <Floor size={12} y={-1.5} divisions={12} />
          <Panel p={[0, 0.3, -0.7]} w={7.8} h={4} />
          {log.map((a, i) => <Box key={i} p={[-3.3 + i * (6.6 / n), 1.6, 0]} s={[w, 0.35, 0.35]} c={COL[a.type]} glow={i === step - 1 ? 0.9 : i < step ? 0.25 : 0} o={i < step ? 1 : 0.35} />)}
          <Bars values={hist} max={Math.max(5, ...hist)} colors={C.blue} x0={-3.3} y0={-1.5} w={w} gap={6.6 / n - w} height={2.6} glow={0.25} />
          <Box p={[3.5, -1.5 + Math.min(2.8, (r.state.total / 700) * 2.8) / 2, 0]} s={[0.4, Math.max(0.03, Math.min(2.8, (r.state.total / 700) * 2.8)), 0.4]} c={C.gold} glow={0.4} />
        </group>
      )}
      readouts={[
        ["Actions applied", `${step} of ${n}`],
        ["Last action", last ? (last.type === "add" ? `add ₹${last.price}` : last.type) : "none yet"],
        ["Items in the cart", r.state.items.length ? r.state.items.join(", ") : "empty"],
        ["Cart total", `₹${r.state.total}`],
        ["Same log, same state?", JSON.stringify(r.state) === JSON.stringify(again.state) ? "Yes, always" : "No"],
      ]}
      controls={<>
        <Slider label="Replay up to action" value={step} min={0} max={40} step={1} digits={0} onChange={(x) => set("step", Math.round(x))} />
        <Slider label="Actions in the log" value={n} min={5} max={40} step={1} digits={0} onChange={(x) => set("n", Math.round(x))} />
        <Slider label="Share of actions that are adds" value={add} min={20} max={90} step={5} digits={0} unit=" %" onChange={(x) => set("add", x)} />
      </>}
      note={<p>A reducer is a pure function <code>(state, action) =&gt; newState</code>. The cart is never edited directly; every change is an action (green add with a price, orange remove of the last item, red clear). Bright blocks have been applied, dim ones are still to come. Because the reducer has no hidden inputs, replaying the same log always gives the same cart, which makes bugs reproducible and undo/redo easy; the last readout checks it by replaying twice. With useReducer, dispatch(action) is how components send these actions. The log is a fixed pseudo-random pattern; the step is limited to the log length.</p>}
    />
  );
}
