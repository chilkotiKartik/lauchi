"use client";
import { useMemo } from "react";
import { doubleOp, powerCollapses } from "../sim/weba";
import { C, Instances, Panel, type Inst } from "../kit";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { WEBA_SPECS } from "../meta/weba.specs";

const hex = (bits: number[]) => (bits.join("").match(/.{4}/g) ?? []).map((b) => parseInt(b, 2).toString(16)).join("");
const kind = (i: number) => (i === 0 ? 0 : i < 12 ? 1 : 2);

export default function JsDoubleLab() {
  const [P, set, reset] = useLabParams(WEBA_SPECS.jsdouble);
  const { a, b, op, n } = P;
  const o = doubleOp(a, b, op);
  const nn = Math.round(n);
  const items = useMemo<Inst[]>(() => o.bits.map((v, i) => {
    const row = Math.floor(i / 16), col = i % 16, h = v ? 0.9 : 0.12;
    return { p: [-2.6 + col * 0.35 + (col >= 8 ? 0.15 : 0), h / 2 - 0.9 - row * 0.62 + 1.3, 0], s: [0.26, h, 0.4], c: [C.red, C.gold, C.blue][kind(i)] };
  }), [o.bits]);
  const raw = o.bits.slice(1, 12).reduce((s, x) => s * 2 + x, 0);
  return (
    <LabFrame
      label="Sixty-four blocks in four rows of sixteen, one per bit of the number: tall for 1 and flat for 0, red for the sign bit, gold for the eleven exponent bits and blue for the fifty-two mantissa bits"
      camera={[0, 0.3, 6.4]}
      animated={false}
      onReset={reset}
      scene={() => (
        <group>
          <Panel p={[0, 0.2, -0.5]} w={7.2} h={3.4} />
          <Instances items={items} cap={64} />
        </group>
      )}
      readouts={[
        ["JavaScript prints", o.shortest],
        ["Exact stored value", o.digits],
        ["Equals its 15-digit form?", o.exactDecimal ? "Yes" : `No: ${o.clean}`],
        ["Sign, exponent (raw)", `${o.bits[0]}, ${raw}`],
        ["All 64 bits in hex", hex(o.bits)],
        [`2^${nn} + 1 === 2^${nn} ?`, powerCollapses(nn) ? "true (precision lost)" : "false (still exact)"],
      ]}
      controls={<>
        <Slider label="Number a" value={a} min={-100} max={100} step={0.1} digits={3} onChange={(x) => set("a", x)} />
        <Slider label="Number b" value={b} min={-100} max={100} step={0.1} digits={3} onChange={(x) => set("b", x)} />
        <Pick label="Operation" value={op} options={[{ id: "add", label: "a + b" }, { id: "sub", label: "a − b" }, { id: "mul", label: "a × b" }]} onChange={(v) => set("op", v)} />
        <Slider label="Power of two n" value={n} min={40} max={60} step={1} digits={0} onChange={(x) => set("n", Math.round(x))} />
      </>}
      note={<p>Every JavaScript Number is a 64-bit IEEE 754 double: 1 sign bit (red), 11 exponent bits (gold) and 52 mantissa bits (blue), giving about 15–17 significant decimal digits. Numbers like 0.1 and 0.2 are repeating fractions in binary, so they are stored as the nearest double and small errors appear: 0.1 + 0.2 prints 0.30000000000000004. Whole numbers are exact only up to 2⁵³ − 1 (Number.MAX_SAFE_INTEGER); beyond it 2ⁿ + 1 rounds back to 2ⁿ. The raw exponent is the stored value with a bias of 1023. The bit picture is the result of the chosen operation.</p>}
    />
  );
}
