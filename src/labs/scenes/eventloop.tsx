"use client";
import { eventLoop, type LoopItem } from "../sim/weba";
import { Bars, Box, C, Floor, Panel } from "../kit";
import { LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { WEBA_SPECS } from "../meta/weba.specs";

const COL: Record<LoopItem["kind"], string> = { sync: C.green, tick: C.purple, promise: C.blue, timer: C.orange };
const short = (l: string) => l.replace("nextTick ", "tick ").replace(/ \(\d+ ms\)/, "");

export default function EventLoopLab() {
  const [P, set, reset] = useLabParams(WEBA_SPECS.eventloop);
  const ticks = Math.round(P.ticks), promises = Math.round(P.promises);
  const order = eventLoop(ticks, promises, [P.d1, P.d2, P.d3]);
  const firstTimer = order.find((x) => x.kind === "timer")!;
  const w = 0.44, x0 = -(order.length * (w + 0.1)) / 2 + 0.25;
  return (
    <LabFrame
      label="A row of numbered blocks in the order the callbacks run: green synchronous code, purple nextTick, blue promises and orange timers, above four columns counting each kind"
      camera={[0, 1, 7]}
      animated={false}
      onReset={reset}
      scene={() => (
        <group>
          <Floor size={12} y={-1.4} divisions={12} />
          <Panel p={[0, 0.9, -0.6]} w={7.6} h={1.6} />
          {order.map((o, i) => <Box key={i} p={[x0 + i * (w + 0.1), 0.9, 0]} s={[w, 0.5 + 0.06 * (order.length - i), 0.5]} c={COL[o.kind]} glow={0.3} />)}
          <Panel p={[0, -0.55, -0.6]} w={7.6} h={1.8} />
          <Bars values={[2, ticks, promises, 3]} max={4} colors={[C.green, C.purple, C.blue, C.orange]} x0={-1.5} y0={-1.4} w={0.6} gap={0.6} height={1.5} glow={0.3} />
        </group>
      )}
      readouts={[
        ["Runs first", order.slice(0, 2).map((x) => x.label).join(", ")],
        ["Order (first 6)", order.slice(0, 6).map((x) => short(x.label)).join(" → ")],
        ["Callbacks before any timer", String(2 + ticks + promises)],
        ["First timer to fire", `timer ${firstTimer.label.split(" ")[1]}`],
        ["Timers in delay order", order.filter((x) => x.kind === "timer").map((x) => short(x.label).replace("timer ", "T")).join(" → ")],
      ]}
      controls={<>
        <Slider label="process.nextTick calls" value={ticks} min={0} max={4} step={1} digits={0} onChange={(x) => set("ticks", Math.round(x))} />
        <Slider label="Promise .then callbacks" value={promises} min={0} max={4} step={1} digits={0} onChange={(x) => set("promises", Math.round(x))} />
        <Slider label="Timer 1 delay" value={P.d1} min={0} max={200} step={5} digits={0} unit=" ms" onChange={(x) => set("d1", x)} />
        <Slider label="Timer 2 delay" value={P.d2} min={0} max={200} step={5} digits={0} unit=" ms" onChange={(x) => set("d2", x)} />
        <Slider label="Timer 3 delay" value={P.d3} min={0} max={200} step={5} digits={0} unit=" ms" onChange={(x) => set("d3", x)} />
      </>}
      note={<p>The program logs &quot;start&quot;, schedules the callbacks you chose, then logs &quot;end&quot;. Node runs all synchronous code first (green). When the stack is empty it drains the nextTick queue (purple), then the promise microtask queue (blue), and only then moves on to timers (orange), which fire in order of delay, with equal delays in the order they were created; a delay of 0 is treated as 1 ms. That is why a promise callback always beats setTimeout(…, 0). Real programs also have I/O callbacks and setImmediate, which this model leaves out.</p>}
    />
  );
}
