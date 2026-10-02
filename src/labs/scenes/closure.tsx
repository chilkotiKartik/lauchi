"use client";
import { counters } from "../sim/weba";
import { Ball, Box, C, Floor, Panel, Poly } from "../kit";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { WEBA_SPECS } from "../meta/weba.specs";

const PAL = [C.blue, C.green, C.gold, C.purple, C.orange, C.red];

export default function ClosureLab() {
  const [P, set, reset] = useLabParams(WEBA_SPECS.closure);
  const n = Math.round(P.n), t = Math.round(P.t), mode = P.mode;
  const o = counters(n, t, mode);
  const gap = 1.05, x0 = -((n - 1) * gap) / 2;
  const h = (v: number) => Math.max(0.04, (v / 30) * 2.6);
  return (
    <LabFrame
      label={mode === "closure" ? "Separate glass jars, one per counter, each holding its own coloured column of its own height" : "Small balls for each counter all linked by lines to one tall red shared column"}
      camera={[0, 0.7, 6.8]}
      animated={false}
      onReset={reset}
      scene={() => (
        <group>
          <Floor size={12} y={-1.4} divisions={12} />
          <Panel p={[0, 0.2, -0.8]} w={7.6} h={3.8} />
          {mode === "closure"
            ? o.values.map((v, i) => (
              <group key={i} position={[x0 + i * gap, -1.4, 0]}>
                <Box p={[0, 1.4, 0]} s={[0.8, 2.8, 0.8]} c={C.light} o={0.18} />
                <Box p={[0, h(v) / 2, 0]} s={[0.5, h(v), 0.5]} c={PAL[i % 6]} glow={0.3} />
              </group>
            ))
            : (
              <group>
                <Box p={[0, -1.4 + h(t) / 2, 0]} s={[0.9, h(t), 0.9]} c={C.red} glow={0.4} />
                {o.values.map((_, i) => {
                  const p: [number, number, number] = [x0 + i * gap, 1.6, 0.9];
                  return <group key={i}><Ball p={p} r={0.2} c={PAL[i % 6]} glow={0.4} /><Poly pts={[p, [0, -1.4 + h(t), 0]]} c={C.light} w={1.6} /></group>;
                })}
              </group>
            )}
        </group>
      )}
      readouts={[
        ["Counter values", o.values.join(", ")],
        ["Calls made", String(t)],
        ["Independent copies of the state", mode === "closure" ? String(n) : "1 (shared)"],
        ["Can outside code change it?", mode === "closure" ? "No, only via the returned function" : "Yes, any code can"],
      ]}
      controls={<>
        <Slider label="Calls made in turn" value={t} min={0} max={30} step={1} digits={0} onChange={(x) => set("t", Math.round(x))} />
        <Slider label="Counters created" value={n} min={1} max={6} step={1} digits={0} onChange={(x) => set("n", Math.round(x))} />
        <Pick label="Where the count lives" value={mode} options={[{ id: "closure", label: "Inside a closure (private)" }, { id: "global", label: "One global variable" }]} onChange={(v) => set("mode", v)} />
      </>}
      note={<p>A factory like <code>function makeCounter() {"{"} let count = 0; return () =&gt; ++count; {"}"}</code> gives every counter its own count, kept alive by the returned function (a closure) and unreachable from outside: the glass jars. With one global variable every counter reads and writes the same number, and any code can change it, the tall red column. The calls are made round-robin: counter 1, counter 2, and so on. Closures are how JavaScript modules emulate private methods and hidden state.</p>}
    />
  );
}
