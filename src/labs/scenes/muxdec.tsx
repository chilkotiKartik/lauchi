"use client";
import { bitsOf, decoder, mux16, muxOut, prioEnc } from "../sim/bcax";
import { Check, LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { BCAX_SPECS } from "../meta/bcax.specs";
import { Bench, Bits, C, Glass, Led, Packet, Rail, Slab, type V3 } from "./bcax-kit";

export default function MuxDecLab() {
  const [P, set, reset] = useLabParams(BCAX_SPECS.muxdec);
  const { mode, sel, data, en, din } = P;
  const is16 = mode === "mux16", s = is16 ? sel : sel & 7, N = is16 ? 16 : 8;
  const d = data & (is16 ? 0xffff : 0xff), dBits = Array.from({ length: N }, (_, i) => (d >> i) & 1);
  const m = mux16(d, s), enc = prioEnc(d & 255), dec = decoder(s & 7, en);
  const sp = is16 ? 0.27 : 0.5, y0 = 1.6 + (N - 1) * sp * 0.5;
  const yIn = (i: number) => y0 - i * sp;
  const outVal = mode === "mux" ? muxOut(d, s) : is16 ? m.out : 0;
  const selBits = bitsOf(s, is16 ? 4 : 3);
  const lit = (i: number) => (mode === "decoder" ? ((dec >> i) & 1) === 1 : mode === "demux" ? i === s && din : mode === "encoder" ? i === enc.y && enc.valid === 1 : i === s);
  const inPath: V3[] = mode === "demux" || mode === "decoder" ? [[-3.6, 1.6, 0], [-1.1, 1.6, 0], [1.1, 1.6, 0], [3.4, yIn(s & 7), 0]] : [[-3.6, yIn(s), 0], [-1.1, yIn(s), 0], [1.1, 1.6, 0], [3.8, 1.6, 0]];
  const showPacket = mode === "mux" || is16 ? outVal === 1 : mode === "demux" ? din : mode === "decoder" ? en : enc.valid === 1;
  return (
    <LabFrame
      label="A multiplexer, demultiplexer, decoder or priority encoder drawn as a glass block: bit cubes on the left, select lines below, and a gold packet running along the one glowing wire that the select lines have chosen"
      camera={[0, 2.4, 10]}
      onReset={reset}
      scene={() => (<group position={[0, -0.6, 0]}>
        <Bench w={12} d={5} />
        {mode !== "demux" && mode !== "decoder" && dBits.map((b, i) => (
          <group key={i}>
            <Bits p={[-4.1, yIn(i) + 0.4, 0]} bits={[b]} s={sp * 0.78} c={mode === "encoder" && enc.valid && i === enc.y ? C.orange : C.blue} />
            <Rail a={[-3.8, yIn(i) + 0.4, 0]} b={[-1.1, yIn(i) + 0.4, 0]} c={C.gold} on={lit(i)} r={0.03} />
          </group>
        ))}
        {(mode === "demux" || mode === "decoder") && (<group>
          <Bits p={[-4.1, 2.0, 0]} bits={[mode === "demux" ? (din ? 1 : 0) : en ? 1 : 0]} s={0.6} c={mode === "demux" ? C.blue : C.green} />
          <Rail a={[-3.7, 2.0, 0]} b={[-1.1, 2.0, 0]} c={C.gold} on={showPacket} />
        </group>)}
        <Glass p={[0, 2.0 + 0.0, 0]} s={[2.2, (N - 1) * sp + 1.6, 1.2]} c={C.purple} on={true} o={0.22} />
        {is16 && [0, 1, 2, 3].map((k) => <Slab key={k} p={[0, 2.9 - k * 0.8 + 0.1, 0.1]} s={[1.2, 0.5, 0.3]} c={k === m.g ? C.orange : "#3a2d66"} glow={k === m.g ? 0.8 : 0.1} />)}
        {(mode === "mux" || is16) && (<group>
          <Rail a={[1.1, 1.6, 0]} b={[3.8, 1.6, 0]} c={C.green} on={outVal === 1} />
          <Led p={[4.2, 1.6, 0]} c={C.green} on={outVal === 1} r={0.22} />
        </group>)}
        {(mode === "demux" || mode === "decoder") && Array.from({ length: 8 }, (_, i) => (
          <group key={i}>
            <Rail a={[1.1, 1.6 + 0.0, 0]} b={[3.6, yIn(i), 0]} c={C.gold} on={lit(i)} r={0.025} />
            <Led p={[3.9, yIn(i), 0]} c={C.gold} on={lit(i)} r={0.2} />
          </group>
        ))}
        {mode === "encoder" && (<group>
          <Bits p={[3.5, 1.8, 0]} bits={bitsOf(enc.y, 3)} s={0.5} c={C.orange} />
          <Led p={[3.5, 0.9, 0]} c={C.green} on={enc.valid === 1} r={0.2} />
          <Rail a={[1.1, 1.6, 0]} b={[2.7, 1.8, 0]} c={C.orange} on={enc.valid === 1} />
        </group>)}
        {mode !== "encoder" && <Bits p={[0, -0.1, 0.5]} bits={selBits} s={0.4} c={C.gold} />}
        {mode !== "encoder" && <Rail a={[0, 0.2, 0.4]} b={[0, 0.9, 0.3]} c={C.gold} on={true} r={0.03} />}
        <Packet path={inPath} c={C.gold} speed={0.3} on={showPacket} />
      </group>)}
      readouts={mode === "mux" ? [
        ["Select S2S1S0", `${selBits.join("")} = ${s}`], ["Output Y", String(outVal)], ["Chosen input", `D${s} = ${dBits[s]}`], ["Inputs D7..D0", dBits.slice(0, 8).reverse().join("")],
      ] : is16 ? [
        ["Select S3..S0", `${selBits.join("")} = ${s}`], ["Output Y", String(m.out)], ["First-rank 4:1 muxes", m.firstRank.join("")], ["Chips needed", "5 × (4:1)"],
      ] : mode === "demux" ? [
        ["Select", `${selBits.join("")} = ${s}`], ["Input", din ? "1" : "0"], ["Output line carrying data", din ? `Y${s}` : "none (all 0)"],
      ] : mode === "decoder" ? [
        ["Select A2A1A0", `${selBits.join("")} = ${s}`], ["Enable", en ? "1 (active)" : "0 (all outputs 0)"], ["Outputs Y7..Y0", dec.toString(2).padStart(8, "0")], ["Active output", en ? `Y${s}` : "none"],
      ] : [
        ["Inputs D7..D0", (d & 255).toString(2).padStart(8, "0")], ["Output Y2Y1Y0", enc.valid ? bitsOf(enc.y, 3).join("") : "000"], ["Valid V", String(enc.valid)], ["Winning input", enc.valid ? `D${enc.y}` : "none"],
      ]}
      controls={<>
        <Slider label="Select value S" value={sel} min={0} max={15} step={1} digits={0} onChange={(x) => set("sel", Math.round(x))} />
        <Slider label="Data bits D (as a number)" value={data} min={0} max={65535} step={1} digits={0} onChange={(x) => set("data", Math.round(x))} />
        <Pick label="Circuit" value={mode} options={[{ id: "mux", label: "8:1 multiplexer" }, { id: "mux16", label: "16:1 mux from five 4:1 muxes" }, { id: "demux", label: "1:8 demultiplexer" }, { id: "decoder", label: "3:8 decoder with enable" }, { id: "encoder", label: "8:3 priority encoder" }]} onChange={(x) => set("mode", x)} />
        {mode === "decoder" && <Check label="Enable E = 1" checked={en} onChange={(x) => set("en", x)} />}
        {mode === "demux" && <Check label="Data input = 1" checked={din} onChange={(x) => set("din", x)} />}
      </>}
      note={<p>A <b>multiplexer</b> (data selector) copies one of 2<sup>n</sup> inputs to a single output: Y = Σ D<sub>i</sub>·m<sub>i</sub>. A <b>demultiplexer</b> does the reverse and sends one input to one of many outputs. A <b>decoder</b> turns an n-bit code into a one-hot line (PYQ Q3.7: 3:8 with active-high enable; with E = 0 every output is 0). A <b>priority encoder</b> outputs the number of the highest-priority active input. PYQ hint: a 16:1 mux is built from four 4:1 muxes in the first rank and one 4:1 mux to pick between them, using S1S0 on the first rank and S3S2 on the last. Slide S and watch the gold packet change wire.</p>}
    />
  );
}
