"use client";
import { useMemo, useRef } from "react";
import type * as THREE from "three";
import { bitRow, complements, divSteps, fracDigits, toBase } from "../sim/elexy";
import { Tick } from "../Stage";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { ELEXY_SPECS } from "../meta/elexy.specs";
import { C, Ball, Box, Instances, type Inst } from "../kit";

const IB = 12, FB = 8, W = 0.42, GAP = 0.06;
/** x of bit i (0 = most significant integer bit); a gap is left for the binary point. */
const bx = (i: number) => (i - (IB + FB) / 2) * (W + GAP) + (i >= IB ? 0.3 : 0);

export default function NumBaseLab() {
  const [P, set, reset] = useLabParams(ELEXY_SPECS.numbase);
  const { n, frac, group } = P;
  const N = Math.floor(n);
  const bits = useMemo(() => bitRow(N, frac, IB, FB), [N, frac]);
  const g = group === "hex" ? 4 : 3, base = group === "hex" ? 16 : 8;
  const digits = useMemo(() => {
    const out: { x: number; v: number }[] = [];
    for (let k = 0; k * g < IB; k++) { let v = 0, xs = 0, c = 0; for (let j = 0; j < g; j++) { const i = IB - 1 - k * g - j; if (i >= 0) { v += bits[i] << j; xs += bx(i); c++; } } out.push({ x: xs / c, v }); }
    for (let k = 0; k * g < FB; k++) { let v = 0, xs = 0, c = 0; for (let j = 0; j < g; j++) { const i = IB + k * g + j; if (i < IB + FB) { v += bits[i] << (g - 1 - j); xs += bx(i); c++; } } out.push({ x: xs / c, v }); }
    return out;
  }, [bits, g]);
  const plates = useMemo<Inst[]>(() => Array.from({ length: IB + FB }, (_, i) => {
    const grp = i < IB ? Math.floor((IB - 1 - i) / g) : 1000 + Math.floor((i - IB) / g);
    return { p: [bx(i), -0.32, 0], s: [W + GAP, 0.08, 0.7], c: grp % 2 === 0 ? C.blue : C.purple };
  }), [g]);
  const scan = useRef<THREE.Mesh>(null), t = useRef(0), row = useRef<THREE.Group>(null);
  const tick = (dt: number) => {
    t.current += Math.min(dt, 0.05);
    if (scan.current) scan.current.position.x = bx(0) - 0.3 + (((t.current * 0.35) % 1) * (bx(IB + FB - 1) - bx(0) + 0.6));
    if (row.current) row.current.rotation.x = -0.35 + 0.06 * Math.sin(t.current * 0.8);
  };
  const steps = divSteps(N, base), fsteps = fracDigits(frac, base, 4);
  const c = complements(N, 12);
  const bcd = String(N).split("").map((d) => Number(d).toString(2).padStart(4, "0")).join(" ");
  const fracShown = frac > 0 ? frac.toFixed(6).replace(/0+$/, "") : "0";
  return (
    <LabFrame
      label="A row of twenty 3-D bit cubes, twelve before and eight after a red binary point; cubes that are 1 glow gold, alternate groups of three or four bits sit on blue and purple plates, and behind each group a bar rises to the value of its octal or hexadecimal digit while a light scans along the row"
      camera={[0, 2.6, 10]}
      onReset={reset}
      scene={() => (<group>
        <Tick fn={tick} />
        <group ref={row} rotation={[-0.35, 0, 0]}>
          <Instances items={plates} cap={IB + FB} />
          {bits.map((v, i) => <Box key={i} p={[bx(i), 0, 0]} s={[W, W, W]} c={v ? C.gold : "#26363d"} glow={v ? 0.9 : 0} />)}
          <Ball p={[(bx(IB - 1) + bx(IB)) / 2, -0.15, 0.1]} r={0.1} c={C.red} glow={0.9} />
          {digits.map((d, i) => <Box key={i} p={[d.x, 0.35 + (0.12 + (1.9 * d.v) / (base - 1)) / 2, -0.7]} s={[W * (g - 0.6), 0.12 + (1.9 * d.v) / (base - 1), 0.25]} c={d.v === 0 ? C.grey : group === "hex" ? C.green : C.orange} glow={0.3} />)}
          <mesh ref={scan} position={[bx(0), 0, 0.45]}><boxGeometry args={[0.08, 0.7, 0.05]} /><meshStandardMaterial color={C.white} emissive={C.white} emissiveIntensity={1} transparent opacity={0.7} /></mesh>
        </group>
      </group>)}
      readouts={[
        ["Decimal", `${N}${frac > 0 ? fracShown.slice(1) : ""}`],
        ["Binary", toBase(N, frac, 2, 10)],
        ["Octal", toBase(N, frac, 8, 6)],
        ["Hexadecimal", toBase(N, frac, 16, 6)],
        ["BCD of the integer part", bcd],
        ["12-bit 1's / 2's complement", `${c.ones} / ${c.twos}`],
      ]}
      controls={<>
        <Slider label="Integer part" value={n} min={0} max={4095} step={1} digits={0} onChange={(x) => set("n", x)} />
        <Slider label="Fraction part" value={frac} min={0} max={0.999999} step={0.001} digits={6} onChange={(x) => set("frac", x)} />
        <Pick label="Group the bits for" value={group} options={[{ id: "hex", label: "Hexadecimal (groups of 4)" }, { id: "oct", label: "Octal (groups of 3)" }]} onChange={(x) => set("group", x)} />
      </>}
      note={<>
        <p><b>Integer part: repeated division.</b> Divide by the new base and keep the remainders; read them from the last to the first. For base {base}: {steps.map(([q, r], i) => <span key={i}>{i === 0 ? N : steps[i - 1][0]} ÷ {base} = {q} r <b>{r.toString(base).toUpperCase()}</b>{i < steps.length - 1 ? "; " : ""}</span>)} → <b>{N.toString(base).toUpperCase()}</b>.</p>
        <p><b>Fraction part: repeated multiplication.</b> Multiply by the base and keep the integer parts, read top to bottom: {fracShown} × {base} … gives <b>.{fsteps.digits || "0"}{fsteps.exact ? "" : "…"}</b>{fsteps.exact ? " (terminates)" : " (does not terminate in four digits; stop at the accuracy you need)"}. To go back to decimal use Σ dᵢ·rⁱ, with negative powers after the point.</p>
        <p><b>Shortcut between binary, octal and hex:</b> 8 = 2³ and 16 = 2⁴, so group the bits in threes or fours <b>outwards from the binary point</b> (the coloured plates) and replace each group with one digit (the bars). (436.21)₈ → 100 011 110 . 010 001₂; (1BD.A)₁₆ = 0001 1011 1101 . 1010₂ = 445.625. The 2’s complement (invert every bit, add 1) is how a computer stores −N. <b>Try:</b> the PYQ presets.</p>
      </>}
    />
  );
}
