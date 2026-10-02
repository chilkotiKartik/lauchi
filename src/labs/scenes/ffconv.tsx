"use client";
import { ffRun, FF_TWO, type FF } from "../sim/bcax";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { BCAX_SPECS } from "../meta/bcax.specs";
import { Poly } from "../kit";
import { Bench, Bits, C, Glass, Led, Packet, Rail, Slab, Txt, type V3 } from "./bcax-kit";

const NAMES: Record<FF, string[]> = { SR: ["S", "R"], JK: ["J", "K"], D: ["D"], T: ["T"] };
const ROWS = 8;

export default function FfConvLab() {
  const [P, set, reset] = useLabParams(BCAX_SPECS.ffconv);
  const { base, tgt, k, xs, ys } = P;
  const target: FF = tgt === "same" || tgt === base ? base : (tgt as FF);
  const run = ffRun(base, target, ROWS, xs, ys);
  const q = run.qs[k], last = k > 0 ? k - 1 : -1;
  const X = (i: number) => -3.6 + i * 1.05;
  const tn = NAMES[target], bn = NAMES[base];
  const clock: V3[] = [[-4.1, 4.55, 0]];
  for (let i = 0; i < ROWS; i++) clock.push([X(i) - 0.25, 4.55, 0], [X(i) - 0.25, 4.85, 0], [X(i) + 0.25, 4.85, 0], [X(i) + 0.25, 4.55, 0]);
  clock.push([4.8, 4.55, 0]);
  const conv = target !== base;
  return (
    <LabFrame
      label="A flip-flop built from a master latch and a slave latch next to a timeline of eight clock pulses: rows of input cubes, the converted inputs the real flip-flop needs, and a green output bar showing Q after each pulse"
      camera={[0, 3.2, 11.5]}
      onReset={reset}
      scene={() => (<group position={[0, -0.7, 0]}>
        <Bench w={15} d={5} />
        <Poly pts={clock} c={C.light} w={2} />
        <Glass p={[X(Math.max(0, last)), 2.5, 0]} s={[0.9, 4.6, 0.8]} c={C.gold} on={k > 0} o={0.1} />
        {Array.from({ length: ROWS }, (_, i) => {
          const done = i < k;
          return (<group key={i}>
            <Bits p={[X(i), 3.8, 0]} bits={[run.tin[i][0]]} s={0.42} c={done ? C.blue : "#4b7a99"} />
            {FF_TWO(target) && <Bits p={[X(i), 3.25, 0]} bits={[run.tin[i][1]]} s={0.42} c={done ? C.purple : "#6d5a99"} />}
            {conv && <Bits p={[X(i), 2.55, 0]} bits={[run.bin[i][0]]} s={0.42} c={done ? C.orange : "#8a6a3a"} />}
            {conv && FF_TWO(base) && <Bits p={[X(i), 2.0, 0]} bits={[run.bin[i][1]]} s={0.42} c={done ? C.red : "#8a4a4c"} />}
            {done && <Slab p={[X(i), 0.35 + run.qs[i + 1] * 0.5, 0]} s={[0.55, 0.1 + run.qs[i + 1] * 1.0, 0.55]} c={run.qs[i + 1] ? C.green : "#4a5b65"} glow={run.qs[i + 1] ? 0.8 : 0.02} />}
            {done && run.kinds[i] === "invalid" && <Led p={[X(i), 1.5, 0]} c={C.red} r={0.15} />}
          </group>);
        })}
        <Txt p={[-4.75, 3.8, 0]} s={tn[0]} h={0.42} c={C.blue} />
        {FF_TWO(target) && <Txt p={[-4.75, 3.25, 0]} s={tn[1]} h={0.42} c={C.purple} />}
        {conv && <Txt p={[-4.75, 2.55, 0]} s={bn[0]} h={0.42} c={C.orange} />}
        {conv && FF_TWO(base) && <Txt p={[-4.75, 2.0, 0]} s={bn[1]} h={0.42} c={C.red} />}
        <group position={[-6.4, 1.2, 0]}>
          <Slab p={[0, 0, 0]} s={[1.0, 1.2, 0.9]} c="#1f4f73" glow={0.25} />
          <Slab p={[1.5, 0, 0]} s={[1.0, 1.2, 0.9]} c="#4a2e80" glow={0.25} />
          <Rail a={[0.5, 0, 0]} b={[1.0, 0, 0]} c={C.gold} on={true} />
          <Led p={[0, 0.9, 0]} c={C.blue} on={k > 0 ? run.bin[last][0] === 1 || run.tin[last][0] === 1 : false} />
          <Led p={[1.5, 0.9, 0]} c={C.green} on={q === 1} r={0.15} />
          <Led p={[1.5, -0.9, 0]} c={C.red} on={q === 0} r={0.12} />
          <Packet path={[[-0.9, 0, 0], [0, 0, 0], [1.5, 0, 0], [2.4, 0, 0]]} c={C.gold} speed={0.25} on={k > 0} />
        </group>
      </group>)}
      readouts={[
        ["Q after pulses", String(q)], ["Q-bar", String(1 - q)],
        ["Last pulse did", last >= 0 ? run.kinds[last] : "nothing yet"],
        [`${target} inputs (last)`, last >= 0 ? tn.map((n, i) => `${n}=${run.tin[last][i]}`).join(" ") : "-"],
        [conv ? `${base} inputs it needs` : "Built from", conv ? (last >= 0 ? bn.map((n, i) => `${n}=${run.bin[last][i]}`).join(" ") : "-") : `plain ${base}`],
      ]}
      controls={<>
        <Slider label="Clock pulses applied" value={k} min={0} max={8} step={1} digits={0} onChange={(x) => set("k", Math.round(x))} />
        <Pick label="Real flip-flop (base)" value={base} options={[{ id: "SR", label: "SR flip-flop" }, { id: "JK", label: "JK flip-flop" }, { id: "D", label: "D flip-flop" }, { id: "T", label: "T flip-flop" }]} onChange={(x) => set("base", x)} />
        <Pick label="Behave like (target)" value={tgt} options={[{ id: "same", label: "Same as base (no conversion)" }, { id: "D", label: "D flip-flop" }, { id: "T", label: "T flip-flop" }, { id: "JK", label: "JK flip-flop" }, { id: "SR", label: "SR flip-flop" }]} onChange={(x) => set("tgt", x)} />
        <Slider label="First input pattern (X bits)" value={xs} min={0} max={255} step={1} digits={0} onChange={(x) => set("xs", Math.round(x))} />
        <Slider label="Second input pattern (Y bits)" value={ys} min={0} max={255} step={1} digits={0} onChange={(x) => set("ys", Math.round(x))} />
      </>}
      note={<p>Characteristic equations: SR: Q⁺ = S + R&apos;Q (S·R = 0), JK: Q⁺ = JQ&apos; + K&apos;Q, D: Q⁺ = D, T: Q⁺ = T ⊕ Q. To <b>convert</b> a flip-flop, write the excitation table of the target, read off what the base flip-flop needs to make each Q → Q⁺ move, and solve with a K-map. PYQ Q3.11: SR as D gives S = D, R = D&apos;; JK as T gives J = K = T. The orange and red rows show the inputs the real flip-flop is fed on every pulse; the green bar is Q after the pulse. SR with S = R = 1 is forbidden (red LED). Master-slave means the master follows the input while the clock is high and the slave copies it when the clock falls.</p>}
    />
  );
}
