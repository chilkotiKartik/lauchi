"use client";
import { bitsOf, bstr, digitCodes, fracBinary, fromTwos, signedForms } from "../sim/bcax";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { BCAX_SPECS } from "../meta/bcax.specs";
import { Bench, Bits, C, Cell, Led, Packet, Slab, Txt, type V3 } from "./bcax-kit";

const SIGN = (n: number, c: string) => [C.gold, ...Array(n - 1).fill(c)] as string[];

export default function DlCodesLab() {
  const [P, set, reset] = useLabParams(BCAX_SPECS.dlcodes);
  const { view, n, d, fb } = P;
  const f = signedForms(n), dc = digitCodes(d), fr = fracBinary(fb);
  const down: V3[] = [[-4.6, 3.0, 0.4], [-4.6, 1.0, 0.4]];
  return (
    <LabFrame
      label="Rows of glowing bit cubes on a steel bench: the same number written as sign-magnitude, 1's complement and 2's complement, or as BCD, Excess-3 and Gray code, or as a binary fraction with weight towers"
      camera={[0, 3.2, 9]}
      onReset={reset}
      scene={() => (<group position={[0, -0.6, 0]}>
        <Bench w={13} d={6} />
        {view === "signed" && (<group>
          {([["S", f.sm, C.blue, 3.4], ["1C", f.ones, C.purple, 2.3], ["2C", f.twos, C.green, 1.2]] as [string, number, string, number][]).map(([lab, v, c, y]) => (
            <group key={lab}>
              <Slab p={[0, y, -0.4]} s={[7.1, 0.8, 0.2]} c="#22333c" metal={0.5} />
              <Txt p={[-4.5, y, 0]} s={lab} h={0.5} c={c} />
              <Bits p={[0.3, y, 0]} bits={bitsOf(v, 8)} s={0.7} gap={0.1} cols={SIGN(8, c)} />
            </group>
          ))}
          <Packet path={down} c={C.orange} speed={0.25} on={n < 0} />
          <Led p={[4.6, 3.4, 0]} c={n < 0 ? C.red : C.green} />
          <Txt p={[5.5, 3.4, 0]} s={n < 0 ? "-" : "+"} h={0.6} c={n < 0 ? C.red : C.green} />
        </group>)}
        {view === "codes" && (<group>
          {([["bcd", dc.bcd, C.blue, 3.4], ["XS3", dc.xs3, C.orange, 2.4], ["GR", dc.gray, C.purple, 1.4]] as [string, number, string, number][]).map(([lab, v, c, y]) => (
            <group key={lab}>
              <Slab p={[0, y, -0.4]} s={[4, 0.8, 0.2]} c="#22333c" metal={0.5} />
              <Txt p={[-3.4, y, 0]} s={lab === "bcd" ? "bCd" : lab} h={0.45} c={c} />
              <Bits p={[0, y, 0]} bits={bitsOf(v, 4)} s={0.7} gap={0.12} c={c} />
            </group>
          ))}
          <Cell p={[3.6, 2.4, 0]} s={[1.2, 1.6, 0.5]} c={C.gold} glow={0.5} v={d} tc="#2a1d00" th={1.1} />
          <Bits p={[0, 0.5, 0]} bits={[dc.parity]} s={0.7} c={C.gold} />
          <Txt p={[-1.4, 0.5, 0]} s="P" h={0.45} c={C.gold} />
        </group>)}
        {view === "frac" && (<group>
          {bitsOf(fb, 8).map((b, i) => {
            const w = i < 4 ? 2 ** (3 - i) : 2 ** (3 - i), h = 0.15 + Math.abs(w) * 0.32, x = (i - 3.5) * 0.95 + (i >= 4 ? 0.35 : -0.35);
            return (<group key={i}>
              <Slab p={[x, h / 2, 0]} s={[0.6, h, 0.6]} c={b ? (i < 4 ? C.blue : C.orange) : "#3b4d57"} glow={b ? 0.6 : 0.02} />
              <Bits p={[x, h + 0.55, 0]} bits={[b]} s={0.55} c={i < 4 ? C.blue : C.orange} />
            </group>);
          })}
          <mesh position={[0, 0.35, 0]}><sphereGeometry args={[0.17, 12, 12]} /><meshStandardMaterial color={C.gold} emissive={C.gold} emissiveIntensity={1.4} /></mesh>
          <Txt p={[0, 4.3, 0]} s={String(fr.value)} h={0.8} c={C.gold} />
        </group>)}
      </group>)}
      readouts={view === "signed" ? [
        ["Sign-magnitude", bstr(f.sm, 8)], ["1's complement", bstr(f.ones, 8)], ["2's complement", bstr(f.twos, 8)],
        ["2's back to decimal", String(fromTwos(f.twos))], ["Hex of 2's form", f.twos.toString(16).toUpperCase().padStart(2, "0")],
      ] : view === "codes" ? [
        ["BCD", bstr(dc.bcd, 4)], ["Excess-3", bstr(dc.xs3, 4)], ["Gray code", bstr(dc.gray, 4)], ["Even-parity bit", String(dc.parity)], ["Digit", String(d)],
      ] : [
        ["Bit pattern", `${bstr(fr.int, 4)}.${bstr(fr.fr, 4)}`], ["Integer part", String(fr.int)], ["Fraction part", `${fr.fr}/16 = ${fr.fr / 16}`], ["Decimal value", String(fr.value)],
      ]}
      controls={<>
        {view === "signed" && <Slider label="Decimal number n" value={n} min={-127} max={127} step={1} digits={0} onChange={(x) => set("n", Math.round(x))} />}
        {view === "codes" && <Slider label="Decimal digit d" value={d} min={0} max={9} step={1} digits={0} onChange={(x) => set("d", Math.round(x))} />}
        {view === "frac" && <Slider label="8-bit pattern xxxx.xxxx" value={fb} min={0} max={255} step={1} digits={0} onChange={(x) => set("fb", Math.round(x))} />}
        <Pick label="Show" value={view} options={[{ id: "signed", label: "Signed 8-bit forms" }, { id: "codes", label: "BCD, Excess-3, Gray, parity" }, { id: "frac", label: "Binary fraction" }]} onChange={(x) => set("view", x)} />
      </>}
      note={view === "signed" ? (
        <p>For a negative number the <b>sign-magnitude</b> form keeps the magnitude and sets the sign bit (gold). <b>1&apos;s complement</b> flips every bit of the magnitude. <b>2&apos;s complement</b> adds 1 to that: 2&apos;s = 256 − |n| in 8 bits. PYQ: −25 is 10011001, 11100110 and 11100111. Positive numbers are identical in all three forms. 2&apos;s complement is used in computers because one adder handles both signs. Try n = 0 to see that only 2&apos;s complement has a single zero.</p>
      ) : view === "codes" ? (
        <p><b>BCD</b> writes each decimal digit in 4 plain bits. <b>Excess-3</b> is BCD + 3 (self-complementing). <b>Gray</b> code changes only one bit between neighbours: g = b XOR (b &gt;&gt; 1). The <b>even-parity</b> bit (gold) makes the total number of 1s even, so a single flipped bit is detected. Step d from 0 to 9 and watch only one Gray bit change each time.</p>
      ) : (
        <p>Integer bits have weights 8, 4, 2, 1 (blue towers); fraction bits have 1/2, 1/4, 1/8, 1/16 (orange). PYQ: (1001.0010)<sub>2</sub> = 8 + 1 + 1/8 = 9.125. Set the pattern to 146 to see it. Multiplying a fraction by 2 repeatedly gives its binary digits.</p>
      )}
    />
  );
}
