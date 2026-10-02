"use client";
import { addBits, adderDelay, bcdAdd, bitsOf, bstr, subtract } from "../sim/bcax";
import { Check, LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { BCAX_SPECS } from "../meta/bcax.specs";
import { Bench, Bits, C, Glass, Led, Packet, Rail, Slab, Txt, type V3 } from "./bcax-kit";

export default function AddSubLab() {
  const [P, set, reset] = useLabParams(BCAX_SPECS.addsub);
  const { mode, a, b, cin } = P;
  const isSub = mode === "sub", isBcd = mode === "bcd";
  const aa = isBcd ? Math.min(a, 9) : a, bb = isBcd ? Math.min(b, 9) : b;
  const be = isSub ? ~bb & 15 : bb, ci = isSub ? 1 : cin ? 1 : 0;
  const r = addBits(aa, be, ci), sub = subtract(aa, bb), bcd = bcdAdd(aa, bb, ci);
  const dl = adderDelay(4, mode === "lookahead" ? "lookahead" : "ripple");
  const X = (k: number) => 3.3 - k * 2.2;
  const hasCarry = r.c.slice(1).some((x) => x === 1);
  const ripplePath: V3[] = [[X(0) + 0.9, 1.4, 0.2], [X(3) - 0.9, 1.4, 0.2]];
  const claPaths: V3[][] = [0, 1, 2, 3].map((k) => [[0, 3.9, 0], [X(k), 3.9, 0], [X(k), 1.9, 0]]);
  const total = isBcd ? bcd.z : isSub ? sub.signed : r.value + 16 * r.cout;
  return (
    <LabFrame
      label="Four full-adder blocks in a row on a steel bench with glowing carry wires: a gold carry packet ripples from the least significant stage to the left, or a look-ahead unit sends carries to every stage at once"
      camera={[0, 3.6, 9.5]}
      onReset={reset}
      scene={() => (<group position={[0, -0.7, 0]}>
        <Bench w={13} d={5} />
        {[0, 1, 2, 3].map((k) => (
          <group key={k}>
            <Bits p={[X(k), 3.2, 0]} bits={[(aa >> k) & 1]} s={0.5} c={C.blue} />
            <Bits p={[X(k), 2.55, 0]} bits={[(be >> k) & 1]} s={0.5} c={isSub ? C.purple : C.orange} />
            <Glass p={[X(k), 1.3, 0]} s={[1.5, 1.3, 1.1]} c={C.purple} on={r.s[k] === 1 || r.c[k + 1] === 1} o={0.22} />
            <Slab p={[X(k), 1.3, 0]} s={[1.0, 0.7, 0.5]} c="#3a2d66" glow={0.1} />
            <Txt p={[X(k), 1.3, 0.3]} s="FA" h={0.4} c={C.purple} />
            <Bits p={[X(k), 0.35, 0.3]} bits={[r.s[k]]} s={0.55} c={C.green} />
            <Rail a={[X(k), 2.3, 0]} b={[X(k), 1.95, 0]} c={C.blue} on={true} />
            <Rail a={[X(k), 1.0, 0]} b={[X(k), 0.65, 0]} c={C.green} on={r.s[k] === 1} />
            {k < 3 && <Rail a={[X(k) - 0.75, 1.4, 0.2]} b={[X(k + 1) + 0.75, 1.4, 0.2]} c={C.gold} on={r.c[k + 1] === 1} r={0.07} />}
          </group>
        ))}
        <Rail a={[X(0) + 1.1, 1.4, 0.2]} b={[X(0) + 0.75, 1.4, 0.2]} c={C.gold} on={ci === 1} r={0.07} />
        <Led p={[X(0) + 1.4, 1.4, 0.2]} c={C.gold} on={ci === 1} />
        <Rail a={[X(3) - 0.75, 1.4, 0.2]} b={[X(3) - 1.4, 1.4, 0.2]} c={C.red} on={r.cout === 1} r={0.07} />
        <Led p={[X(3) - 1.6, 1.4, 0.2]} c={isSub ? (r.cout ? C.green : C.red) : C.red} on={r.cout === 1} r={0.14} />
        {mode === "lookahead" && (<group>
          <Slab p={[0, 3.9, -0.6]} s={[7.8, 0.5, 0.6]} c="#5a3d10" glow={0.35} />
          <Txt p={[0, 3.9, -0.25]} s="CLA" h={0.4} c={C.orange} />
          {[0, 1, 2, 3].map((k) => <Rail key={k} a={[X(k), 3.7, -0.3]} b={[X(k), 1.95, 0]} c={C.orange} on={r.c[k] === 1} />)}
        </group>)}
        {isBcd && (<group>
          <Slab p={[-5.6, 0.6, 0]} s={[1.2, 0.8, 0.5]} c={C.orange} glow={bcd.fix ? 1 : 0.1} />
          <Txt p={[-5.6, 0.6, 0.3]} s="+6" h={0.45} c="#2a1500" />
          <Bits p={[-5.6, -0.2, 0]} bits={bitsOf(bcd.digit, 4)} s={0.3} c={C.green} />
        </group>)}
        {mode === "lookahead" ? claPaths.map((p, k) => <Packet key={k} path={p} c={C.orange} speed={0.4} on={r.c[k] === 1} />) : <Packet path={ripplePath} c={C.gold} speed={0.18} on={hasCarry} />}
      </group>)}
      readouts={[
        [isSub ? "A − B" : isBcd ? "BCD digit sum" : "A + B + Cin", isSub ? `${aa} − ${bb} = ${sub.signed}` : isBcd ? `${aa} + ${bb} + ${ci} = ${total}` : `${aa} + ${bb} + ${ci} = ${total}`],
        ["Sum bits S3..S0", bstr(r.value, 4)],
        [isSub ? "No-borrow flag (Cout)" : "Carry out", String(r.cout)],
        isBcd ? ["After +6 correction", bcd.fix ? `${bcd.text} (corrected)` : `${bcd.text} (no correction)`] : ["Last sum ready after", `${dl.sum} gate delays`],
        ["Cout ready after", `${dl.cout} gate delays`],
      ]}
      controls={<>
        <Slider label="Input A" value={a} min={0} max={15} step={1} digits={0} onChange={(x) => set("a", Math.round(x))} />
        <Slider label="Input B" value={b} min={0} max={15} step={1} digits={0} onChange={(x) => set("b", Math.round(x))} />
        <Pick label="Adder type" value={mode} options={[{ id: "ripple", label: "Ripple-carry adder" }, { id: "lookahead", label: "Look-ahead carry adder" }, { id: "sub", label: "Subtractor (A + B' + 1)" }, { id: "bcd", label: "BCD adder (digits 0 to 9)" }]} onChange={(x) => set("mode", x)} />
        {!isSub && <Check label="Carry in (Cin) = 1" checked={cin} onChange={(x) => set("cin", x)} />}
      </>}
      note={<p>Each full adder makes S = A ⊕ B ⊕ Cin and Cout = AB + (A ⊕ B)Cin. In a <b>ripple</b> adder the gold carry must pass through every stage, so the delay grows with the word length (2n gate delays for the sum). The <b>look-ahead</b> unit computes every carry from P = A ⊕ B and G = AB in two extra gate levels, so 4 delays for any carry. The <b>subtractor</b> feeds B&apos; with Cin = 1 (2&apos;s complement); Cout = 1 means A ≥ B. The <b>BCD adder</b> adds 6 (orange) when the binary sum exceeds 9. Try A = 15, B = 1 to see the carry run through all four stages.</p>}
    />
  );
}
