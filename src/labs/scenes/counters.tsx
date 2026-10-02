"use client";
import { ctrFmax, ctrMod, ctrState, type Ctr } from "../sim/bcax";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { BCAX_SPECS } from "../meta/bcax.specs";
import { Bench, C, Led, Packet, Rail, Slab, Txt, type V3 } from "./bcax-kit";

const KIND: Record<Ctr, string> = { ripple: "Asynchronous (ripple) up counter", sync: "Synchronous up counter", ring: "Ring counter", johnson: "Johnson (twisted-ring) counter", shift: "Shift register (serial in, serial out)" };

export default function CountersLab() {
  const [P, set, reset] = useLabParams(BCAX_SPECS.counters);
  const { kind, bits: n, k, tpd, tg, din } = P;
  const s = ctrState(kind, n, k, din), mod = ctrMod(kind, n);
  const fmax = ctrFmax(kind, n, tpd, tg), tr = n * tpd, ts = tpd + tg;
  const val = s.reduce((a, b) => a * 2 + b, 0);
  const X = (i: number) => (i - (n - 1) / 2) * 1.7;
  const leftToRight = kind === "ring" || kind === "johnson" || kind === "shift";
  const chain: V3[] = leftToRight ? [[X(0), 1.2, 0.5], [X(n - 1), 1.2, 0.5]] : [[X(n - 1) + 1.7, 1.2, 0.5], [X(0), 1.2, 0.5]];
  const bigText = kind === "ripple" || kind === "sync" ? String(val) : String(k % mod);
  return (
    <LabFrame
      label="A row of flip-flop blocks on a steel bench with a green LED for each stored bit: a gold clock pulse ripples from block to block in the asynchronous counter but reaches every block at once in the synchronous one; two bars compare the settling times"
      camera={[0, 3.4, 11.5]}
      onReset={reset}
      scene={() => (<group position={[0, -0.6, 0]}>
        <Bench w={15} d={5} />
        {s.map((b, i) => (
          <group key={i}>
            <Slab p={[X(i), 1.2, 0]} s={[1.25, 1.1, 0.9]} c={b ? "#2d6b46" : "#3a2d66"} glow={b ? 0.35 : 0.1} />
            <Led p={[X(i), 2.1, 0.2]} c={C.green} on={b === 1} r={0.2} />
            <Txt p={[X(i), 1.2, 0.5]} s={String(b)} h={0.55} c={b ? C.green : "#8f86b8"} />
            {kind === "sync" && <Rail a={[X(i), 0.3, 0.2]} b={[X(i), 0.65, 0.2]} c={C.gold} on={true} />}
          </group>
        ))}
        {kind === "sync" && <Rail a={[X(0), 0.3, 0.2]} b={[X(n - 1) + 1.0, 0.3, 0.2]} c={C.gold} on={true} r={0.06} />}
        {kind !== "sync" && Array.from({ length: n - 1 }, (_, i) => <Rail key={i} a={[X(i) + 0.65, 1.2, 0.5]} b={[X(i + 1) - 0.65, 1.2, 0.5]} c={C.gold} on={true} r={0.05} />)}
        {(kind === "ring" || kind === "johnson") && <Rail a={[X(n - 1), 0.5, 0.8]} b={[X(0), 0.5, 0.8]} c={kind === "johnson" ? C.orange : C.blue} on={true} r={0.05} />}
        {kind === "shift" && <Led p={[X(0) - 1.3, 1.2, 0.5]} c={C.blue} on={((din >> ((Math.max(k, 1) - 1) % 8)) & 1) === 1} r={0.22} />}
        {kind === "sync" ? Array.from({ length: n }, (_, i) => <Packet key={i} path={[[X(n - 1) + 1.0, 0.3, 0.2], [X(i), 0.3, 0.2], [X(i), 0.65, 0.2]]} c={C.gold} speed={0.35} />) : <Packet path={chain} c={C.gold} speed={0.22} />}
        <Txt p={[0, 3.4, 0]} s={bigText} h={0.9} c={C.gold} />
        <Slab p={[6.2, Math.min(2.6, tr / 90) / 2, -1]} s={[0.7, Math.min(2.6, tr / 90), 0.7]} c={C.red} glow={0.5} />
        <Slab p={[7.0, Math.min(2.6, ts / 90) / 2, -1]} s={[0.7, Math.min(2.6, ts / 90), 0.7]} c={C.green} glow={0.5} />
      </group>)}
      readouts={[
        ["State Q (MSB first)", s.join("")], [kind === "ripple" || kind === "sync" ? "Count" : "Pulse in cycle", `${kind === "ripple" || kind === "sync" ? val : k % mod}`],
        ["MOD of the counter", String(mod)], ["Max clock frequency", `${fmax.toFixed(1)} MHz`], ["Settling: ripple vs sync", `${tr.toFixed(0)} ns vs ${ts.toFixed(0)} ns`],
      ]}
      controls={<>
        <Slider label="Clock pulses so far" value={k} min={0} max={40} step={1} digits={0} onChange={(x) => set("k", Math.round(x))} />
        <Pick label="Circuit" value={kind} options={(Object.keys(KIND) as Ctr[]).map((id) => ({ id, label: KIND[id] }))} onChange={(x) => set("kind", x)} />
        <Slider label="Number of flip-flops" value={n} min={2} max={6} step={1} digits={0} onChange={(x) => set("bits", Math.round(x))} />
        <Slider label="Flip-flop delay t(pd)" value={tpd} min={5} max={50} step={1} digits={0} unit=" ns" onChange={(x) => set("tpd", Math.round(x))} />
        <Slider label="AND gate delay" value={tg} min={2} max={30} step={1} digits={0} unit=" ns" onChange={(x) => set("tg", Math.round(x))} />
        {kind === "shift" && <Slider label="Serial input stream (8 bits)" value={din} min={0} max={255} step={1} digits={0} onChange={(x) => set("din", Math.round(x))} />}
      </>}
      note={<p>In a <b>ripple</b> counter each flip-flop clocks the next, so the delays add up: f<sub>max</sub> = 1/(n·t<sub>pd</sub>) and the output is briefly wrong while the pulse travels (red bar). In a <b>synchronous</b> counter all flip-flops share the clock (gold bus), so f<sub>max</sub> = 1/(t<sub>pd</sub> + t<sub>gate</sub>) however many bits (green bar). The <b>ring</b> counter circulates a single 1 (MOD n); the <b>Johnson</b> counter feeds back Q&apos; and has MOD 2n (PYQ Q3.12: 0000, 1000, 1100, 1110, 1111, 0111, 0011, 0001). Shift registers (SISO here) move data one place per pulse: used for delay lines, serial-parallel conversion, multiplication by 2 and sequence generators.</p>}
    />
  );
}
