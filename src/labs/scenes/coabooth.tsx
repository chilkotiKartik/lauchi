"use client";
import { boothFrames, boothProduct, bstr, divFrames, toSigned } from "../sim/bcax";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { BCAX_SPECS } from "../meta/bcax.specs";
import { Bench, Bits, C, Glide, Halo, Led, Txt, bitsOfN } from "./bcax-kit";

export default function CoaBoothLab() {
  const [P, set, reset] = useLabParams(BCAX_SPECS.coabooth);
  const { mode, m, q, step } = P;
  const isB = mode === "booth";
  const frames = isB ? boothFrames(m, q) : divFrames(Math.abs(q), Math.max(1, Math.abs(m)));
  const k = Math.min(step, frames.length - 1), f = frames[k], n = f.n, aw = isB ? n : n + 1;
  const last = frames[frames.length - 1];
  const doing = f.op === "A + M" || f.op === "A - M" || f.op === "shift" || f.op.startsWith("A -");
  return (
    <LabFrame
      label="Three rows of bit cubes: the multiplicand M, the accumulator A and the multiplier Q with its extra Q-1 bit; each Booth cycle adds or subtracts M into A and then slides the whole A, Q row one place to the right"
      camera={[0, 3, 9.5]}
      onReset={reset}
      scene={(playing) => (<group position={[0, -0.6, 0]}>
        <Bench w={13} d={5} />
        <Txt p={[-5.2, 3.7, 0]} s="M" h={0.5} c={C.purple} />
        <Bits p={[-1.2, 3.7, 0]} bits={bitsOfN(f.M, isB ? n : n)} s={0.55} c={C.purple} />
        <Txt p={[-5.2, 2.5, 0]} s="A" h={0.5} c={C.blue} />
        <Glide to={[-1.2 + (f.op === "shift" ? 0 : 0), 2.5, 0]} playing={playing}><Bits p={[0, 0, 0]} bits={bitsOfN(f.A, aw)} s={0.55} c={C.blue} /></Glide>
        <Txt p={[-5.2, 1.3, 0]} s="Q" h={0.5} c={C.green} />
        <Bits p={[1.6, 1.3, 0]} bits={bitsOfN(f.Q, n)} s={0.55} c={C.green} />
        {isB && <Bits p={[4.1, 1.3, 0]} bits={[f.Q1]} s={0.55} c={C.orange} />}
        {isB && <Txt p={[5.0, 1.3, 0]} s="-1" h={0.35} c={C.orange} />}
        {doing && <Halo p={[-1.2, 2.5, 0]} r={2.3} c={f.op === "A - M" || f.op.startsWith("A -") ? C.red : f.op === "A + M" ? C.green : C.gold} />}
        <Led p={[5.2, 2.5, 0]} c={f.op === "A + M" ? C.green : f.op === "A - M" ? C.red : f.op === "shift" ? C.gold : C.grey} r={0.3} />
        <Txt p={[0, 0.3, 0.6]} s={String(f.cycle)} h={0.7} c={C.gold} />
      </group>)}
      readouts={isB ? [
        ["Cycle", `${f.cycle} of ${n}`], ["Operation", f.op], ["A  Q  Q-1", `${bstr(f.A, n)} ${bstr(f.Q, n)} ${f.Q1}`], ["M = multiplicand", `${bstr(f.M, n)} (${toSigned(f.M, n)})`], ["Product now / final", `${boothProduct(f)} / ${m * q}`],
      ] : [
        ["Cycle", `${f.cycle} of ${n}`], ["Operation", f.op], ["A  Q", `${bstr(f.A, n + 1)} ${bstr(f.Q, n)}`], ["Quotient so far", String(f.Q)], ["Final quotient, remainder", `${last.Q}, ${last.A}`],
      ]}
      controls={<>
        <Slider label="Step" value={step} min={0} max={12} step={1} digits={0} onChange={(x) => set("step", Math.round(x))} />
        <Pick label="Algorithm" value={mode} options={[{ id: "booth", label: "Booth's multiplication (4-bit signed)" }, { id: "div", label: "Restoring division (4-bit)" }]} onChange={(x) => set("mode", x)} />
        <Slider label={isB ? "Multiplicand M" : "Divisor (absolute value)"} value={m} min={-7} max={7} step={1} digits={0} onChange={(x) => set("m", Math.round(x))} />
        <Slider label={isB ? "Multiplier Q" : "Dividend (absolute value)"} value={q} min={-8} max={15} step={1} digits={0} onChange={(x) => set("q", Math.round(x))} />
      </>}
      note={isB ? (
        <p><b>Booth&apos;s algorithm</b> multiplies signed two&apos;s-complement numbers. Each cycle looks at Q0 and Q−1: <b>10</b> = start of a run of 1s, so A = A − M; <b>01</b> = end of a run, so A = A + M; <b>00</b> or <b>11</b> = nothing. Then A, Q, Q−1 shift right arithmetically (the sign bit is copied). After n cycles the 2n-bit product is in A:Q. Long runs of 1s need only two operations. PYQ: trace 7 × −3 = −21. (This 4-bit model keeps M between −7 and 7.)</p>
      ) : (
        <p><b>Restoring division</b>: shift A:Q left, subtract the divisor M from A; if the result is negative restore A (undo the subtraction) and set quotient bit 0, otherwise keep it and set the bit to 1. After n cycles Q holds the quotient and A the remainder. Non-restoring division skips the restore step and instead adds M in the next cycle. Absolute values are used in this lab.</p>
      )}
    />
  );
}
