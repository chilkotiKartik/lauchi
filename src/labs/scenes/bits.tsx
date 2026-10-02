"use client";
import { BIT_SYMBOL, bin8, bitExpr, bitHint, bitOp, bitsOf, hex2, type BitOp } from "../sim/cprog";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { CPROG_SPECS } from "../meta/cprog.specs";

const OPS: BitOp[] = ["and", "or", "xor", "not", "shl", "shr"];
const OPNAME: Record<BitOp, string> = { and: "AND  &", or: "OR  |", xor: "XOR  ^", not: "NOT  ~", shl: "Shift left  <<", shr: "Shift right  >>" };

function Row({ v, y, on, off, label }: { v: number; y: number; on: string; off: string; label: string }) {
  const bits = bitsOf(v);
  return (<group position={[0, y, 0]} name={label}>
    {Array.from({ length: 8 }, (_, k) => {
      const bit = bits[7 - k], h = bit ? 0.7 : 0.2;
      return (<mesh key={k} position={[-2.8 + k * 0.8, h / 2, 0]}><boxGeometry args={[0.6, h, 0.6]} /><meshStandardMaterial color={bit ? on : off} emissive={bit ? on : "#000000"} emissiveIntensity={0.3} roughness={0.4} /></mesh>);
    })}
  </group>);
}

export default function BitsLab() {
  const [P, set, reset] = useLabParams(CPROG_SPECS.bits);
  const { a, b, s, op } = P;
  const r = bitOp(op, a, b, s), two = op !== "not" && op !== "shl" && op !== "shr";
  const shifted = op === "shl" || op === "shr";
  return (
    <LabFrame
      label="Three rows of eight 3D bit cubes for the operands A and B and the result: tall coloured cubes are 1s and short dark cubes are 0s"
      camera={[0, 2.4, 8]}
      animated={false}
      onReset={reset}
      scene={() => (<group position={[0.4, -0.6, 0]}>
        <Row v={a} y={1.7} on="#2ba6f5" off="#33454e" label="A" />
        {two && <Row v={b} y={0.4} on="#a970ff" off="#33454e" label="B" />}
        <mesh position={[0, two ? -0.4 : 0.55, 0]}><boxGeometry args={[6.6, 0.05, 0.9]} /><meshStandardMaterial color="#9db0ba" /></mesh>
        <Row v={r} y={two ? -1.7 : -0.8} on="#44c95a" off="#33454e" label="result" />
        {[7, 6, 5, 4, 3, 2, 1, 0].map((p, k) => (<mesh key={p} position={[-2.8 + k * 0.8, -2.95, 0]}><sphereGeometry args={[p === 7 ? 0.09 : 0.05, 8, 8]} /><meshBasicMaterial color={p === 7 ? "#ffc83d" : "#5b6d77"} /></mesh>))}
        {shifted && <mesh position={[0, 2.7, 0]}><boxGeometry args={[Math.max(0.2, s * 0.8), 0.06, 0.06]} /><meshBasicMaterial color="#ff9a1f" /></mesh>}
      </group>)}
      readouts={[
        ["C expression", `${bitExpr(op, a, b, s)}  →  ${r}`], ["A in binary", bin8(a)], [two ? "B in binary" : shifted ? `Shift count s` : "Operator", two ? bin8(b) : shifted ? String(s) : BIT_SYMBOL[op]],
        ["Result in binary", bin8(r)], ["Result in hex", hex2(r)], ["What it does", bitHint(op, a, b, s)],
      ]}
      controls={<>
        <Slider label="Value A (0–255)" value={a} min={0} max={255} step={1} digits={0} onChange={(x) => set("a", Math.round(x))} />
        {two && <Slider label="Value B (0–255)" value={b} min={0} max={255} step={1} digits={0} onChange={(x) => set("b", Math.round(x))} />}
        {shifted && <Slider label="Shift count s" value={s} min={0} max={7} step={1} digits={0} onChange={(x) => set("s", Math.round(x))} />}
        <Pick<BitOp> label="Operator" value={op} options={OPS.map((id) => ({ id, label: OPNAME[id] }))} onChange={(x) => set("op", x)} />
      </>}
      note={<p>Each row shows eight bits, most significant on the left (the gold dot marks bit 7, the small grey dots bits 6 to 0). Tall coloured cubes are 1s. The results are computed for an unsigned char, so ~ and &lt;&lt; stay within 8 bits. Use &amp; with a mask to test or clear bits (x &amp; 1 tests odd), | to set bits, ^ to toggle bits (and to swap without a temporary), &lt;&lt; to multiply by 2ˢ and &gt;&gt; to divide by 2ˢ. Shifting a value with 1s in the top bits left loses them: in an int the result would keep growing, in an unsigned char it wraps. Do not confuse the bitwise &amp; and | with the logical &amp;&amp; and ||, which test the whole value as true or false.</p>}
    />
  );
}
