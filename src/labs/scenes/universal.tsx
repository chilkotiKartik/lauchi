"use client";
import { useMemo } from "react";
import { evalNet, gateFn, levels, U_EXPR, UNETS, type UBase, type USrc, type UTarget } from "../sim/elexy";
import { Check, LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { ELEXY_SPECS } from "../meta/elexy.specs";
import { C, Ball, Box, type V3 } from "../kit";
import { Flow } from "../kit2";
import { Wire } from "./elexy-kit";

const TARGETS: { id: UTarget; label: string }[] = [
  { id: "not", label: "NOT" }, { id: "and", label: "AND" }, { id: "or", label: "OR" }, { id: "nand", label: "NAND" },
  { id: "nor", label: "NOR" }, { id: "xor", label: "XOR" }, { id: "xnor", label: "XNOR" },
];
const XA = -5, LX = 1.8;

/** A 3-D gate body: box + rounded front + inversion bubble; glows green when its output is 1. */
function Gate({ p, base, on }: { p: V3; base: UBase; on: boolean }) {
  const c = base === "nand" ? C.blue : C.purple;
  return (
    <group position={p}>
      <Box p={[-0.15, 0, 0]} s={[0.6, 0.9, 0.5]} c={c} glow={0.15} />
      <mesh position={[0.15, 0, 0]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.45, 0.45, 0.5, 20, 1, false, 0, Math.PI]} /><meshStandardMaterial color={c} emissive={c} emissiveIntensity={0.15} /></mesh>
      <mesh position={[0.7, 0, 0]}><sphereGeometry args={[0.1, 14, 14]} /><meshStandardMaterial color={on ? C.green : C.grey} emissive={on ? C.green : "#000000"} emissiveIntensity={on ? 1 : 0} /></mesh>
    </group>
  );
}

export default function UniversalLab() {
  const [P, set, reset] = useLabParams(ELEXY_SPECS.universal);
  const { tpd, base, target, a, b } = P;
  const net = UNETS[base][target];
  const out = evalNet(base, net, a, b), lv = levels(net), depth = lv[lv.length - 1];
  const y = out[out.length - 1];
  const layout = useMemo(() => {
    const L = levels(net), count: Record<number, number> = {}, seen: Record<number, number> = {};
    for (const l of L) count[l] = (count[l] ?? 0) + 1;
    return L.map((l) => { const k = seen[l] ?? 0; seen[l] = k + 1; return [XA + 1.2 + LX * l, (count[l] - 1) * 0.8 - k * 1.6, 0] as V3; });
  }, [net]);
  const src = (s: USrc): V3 => (s === "A" ? [XA, 1.4, 0] : s === "B" ? [XA, -1.4, 0] : [layout[s][0] + 0.8, layout[s][1], 0]);
  const val = (s: USrc) => (s === "A" ? a : s === "B" ? b : out[s]);
  const wires = net.flatMap((g, i) => g.map((s, j) => {
    const from = src(s), to: V3 = [layout[i][0] - 0.45, layout[i][1] + (j === 0 ? 0.25 : -0.25), 0], mx = (from[0] + to[0]) / 2;
    return { pts: [from, [mx, from[1], 0], [mx, to[1], 0], to] as V3[], on: val(s), key: `${i}-${j}` };
  }));
  const last = layout[layout.length - 1], Yp: V3 = [last[0] + 1.6, last[1], 0];
  const table = [[false, false], [false, true], [true, false], [true, true]] as const;
  const used = target === "not" ? "A only" : "A, B";
  return (
    <LabFrame
      label="Logic gates built only from NAND (blue) or only from NOR (purple) gates in 3-D, arranged by logic level from inputs A and B on the left to the output lamp Y on the right; wires carrying 1 glow green with moving pulses, and a 3-D truth table of four rows lights the current input row"
      camera={[0, 0.2, 11]}
      animated
      onReset={reset}
      scene={() => (<group>
        <Ball p={[XA, 1.4, 0]} r={0.28} c={a ? C.gold : C.grey} glow={a ? 0.9 : 0} />
        <Ball p={[XA, -1.4, 0]} r={0.28} c={b ? C.gold : C.grey} glow={b ? 0.9 : 0} />
        {net.map((_, i) => <Gate key={i} p={layout[i]} base={base} on={out[i]} />)}
        {wires.map((w) => <group key={w.key}><Wire pts={w.pts} c={w.on ? C.green : C.red} w={w.on ? 3 : 1.6} />{w.on && <Flow path={w.pts} n={3} speed={0.5} color={C.gold} r={0.05} cap={4} />}</group>)}
        <Wire pts={[[last[0] + 0.8, last[1], 0], Yp]} c={y ? C.green : C.red} w={3} />
        <Ball p={Yp} r={0.42} c={y ? C.gold : C.dark} glow={y ? 1.2 : 0} />
        <group position={[-3.6, -3.1, 0]}>
          {table.map(([ta, tb], r) => {
            const yy = gateFn(target, ta, tb), cur = ta === a && (target === "not" || tb === b);
            return (<group key={r} position={[r * 2.0, 0, 0]}>
              <Box p={[0, 0, -0.1]} s={[1.8, 0.7, 0.1]} c={cur ? C.orange : C.dark} glow={cur ? 0.5 : 0} />
              <Box p={[-0.55, 0, 0.1]} s={[0.35, 0.35, 0.35]} c={ta ? C.gold : C.grey} glow={ta ? 0.6 : 0} />
              <Box p={[-0.1, 0, 0.1]} s={[0.35, 0.35, 0.35]} c={tb ? C.gold : C.grey} glow={tb ? 0.6 : 0} />
              <Box p={[0.55, 0, 0.1]} s={[0.4, 0.4, 0.4]} c={yy ? C.green : C.red} glow={0.5} />
            </group>);
          })}
        </group>
      </group>)}
      readouts={[
        ["Output Y", y ? "1" : "0"],
        [`${base.toUpperCase()} gates used`, String(net.length)],
        ["Logic levels (longest path)", String(depth)],
        ["Propagation delay = levels × t_pd", `${(depth * tpd).toFixed(0)} ns`],
        ["Boolean expression", U_EXPR[base][target]],
        ["Truth table Y for AB = 00, 01, 10, 11", table.map(([ta, tb]) => (gateFn(target, ta, tb) ? 1 : 0)).join(" ")],
      ]}
      controls={<>
        <Slider label="Delay per gate t_pd" value={tpd} min={1} max={50} step={1} digits={0} unit=" ns" onChange={(x) => set("tpd", x)} />
        <Pick label="Build only with" value={base} options={[{ id: "nand", label: "NAND gates" }, { id: "nor", label: "NOR gates" }]} onChange={(x) => set("base", x)} />
        <Pick label="Function to build" value={target} options={TARGETS} onChange={(x) => set("target", x)} />
        <Check label={`Input A = ${a ? 1 : 0}`} checked={a} onChange={(x) => set("a", x)} />
        <Check label={`Input B = ${b ? 1 : 0}${target === "not" ? " (unused)" : ""}`} checked={b} onChange={(x) => set("b", x)} />
      </>}
      note={<>
        <p>NAND and NOR are <b>universal gates</b>: any Boolean function can be built from either one alone, which is why chips are often made of nothing else. The tricks: tie both inputs together to get <b>NOT</b> (A NAND A = A′); follow a NAND by a NOT to get <b>AND</b> (2 gates); invert both inputs first to get <b>OR</b> from NAND by <b>De Morgan</b>: (A′·B′)′ = A + B (3 gates). NOR works the same way with AND and OR swapped: NOR + NOT = OR (2 gates), (A′ + B′)′ = A·B (3 gates). XOR takes 4 NANDs: with X = (AB)′, Y = ((A·X)′·(B·X)′)′; the same four-gate pattern in NOR gives XNOR.</p>
        <p>Inputs used: {used}. Each extra level adds one gate delay t<sub>pd</sub>, so fewer levels mean a faster circuit. <b>Try:</b> build OR from NAND and step A and B through all four rows: the green wires show which signals are 1, and the truth-table blocks (A, B, Y) light the row you are on.</p>
      </>}
    />
  );
}
