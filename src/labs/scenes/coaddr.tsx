"use client";
import { PC_AFTER_FETCH, effective, memAt, type AMode } from "../sim/bcax";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { BCAX_SPECS } from "../meta/bcax.specs";
import { Bench, C, Cell, Halo, Packet, Rail, Slab, Txt, type V3 } from "./bcax-kit";

const NAME: Record<AMode, string> = { imm: "Immediate", dir: "Direct", ind: "Indirect", reg: "Register", regind: "Register indirect", autodec: "Auto-decrement", rel: "Relative (PC)", idx: "Indexed (XR)" };
const MEMS = [399, 400, 500, 600, 702, 800];
export default function CoaAddrLab() {
  const [P, set, reset] = useLabParams(BCAX_SPECS.coaddr);
  const { mode, x, r1, xr } = P;
  const e = effective(mode as AMode, x, r1, xr);
  const my = (a: number) => 4.0 - MEMS.indexOf(a) * 0.7;
  const inMem = (a: number | null) => a !== null && MEMS.includes(a);
  const ptr = mode === "ind" ? memAt(x) : null;
  const trail: V3[] = [[-3.4, 2.8, 0]];
  if (mode === "ind" && inMem(x)) trail.push([4.2, my(x), 0], [4.2, my(x) - 0.2, 0.3]);
  if (e.ea !== null && inMem(e.ea)) trail.push([4.0, my(e.ea), 0]);
  const hot = new Set<number>([...(e.ea !== null ? [e.ea] : []), ...(mode === "ind" ? [x] : [])]);
  return (
    <LabFrame
      label="An instruction word with its address field on the left and a column of memory words on the right: a gold packet follows the addressing mode, going straight to the operand, through one memory word, or through a pointer first"
      camera={[0, 3.2, 10]}
      onReset={reset}
      scene={() => (<group position={[0, -0.6, 0]}>
        <Bench w={13} d={5} />
        <Slab p={[-4.6, 3.4, 0]} s={[2.4, 1.6, 0.6]} c="#3a2d66" glow={0.2} />
        <Txt p={[-4.6, 3.8, 0.35]} s="oP" h={0.4} c={C.purple} />
        <Txt p={[-4.6, 3.05, 0.35]} s={String(x)} h={0.5} c={C.gold} />
        <Cell p={[-4.6, 1.6, 0]} s={[1.6, 0.7, 0.5]} c={C.blue} glow={0.3} v={`PC ${PC_AFTER_FETCH}`} th={0.3} />
        <Cell p={[-4.6, 0.7, 0]} s={[1.6, 0.7, 0.5]} c={mode === "reg" || mode === "regind" || mode === "autodec" ? C.orange : "#35566e"} glow={0.3} v={`R1 ${r1}`} th={0.3} />
        <Cell p={[-2.7, 0.7, 0]} s={[1.6, 0.7, 0.5]} c={mode === "idx" ? C.orange : "#35566e"} glow={0.3} v={`XR ${xr}`} th={0.3} />
        {MEMS.map((a) => (<group key={a}>
          <Slab p={[4.2, my(a), 0]} s={[2.4, 0.6, 0.5]} c={hot.has(a) ? (a === e.ea ? C.gold : C.purple) : "#2a3a44"} glow={hot.has(a) ? 0.7 : 0.05} />
          <Txt p={[3.4, my(a), 0.3]} s={String(a)} h={0.3} c={C.light} glow={0.6} />
          <Txt p={[4.9, my(a), 0.3]} s={String(memAt(a))} h={0.34} c={a === e.ea ? "#2a1d00" : "#ffffff"} />
        </group>))}
        {e.ea !== null && inMem(e.ea) && <Halo p={[4.2, my(e.ea), 0.2]} r={0.9} />}
        {trail.length > 1 && <Packet path={trail} c={C.gold} speed={0.3} />}
        {e.ea === null && <Rail a={[-3.4, 2.8, 0]} b={[-1.0, 2.8, 0]} c={C.gold} on={true} />}
        <Slab p={[0, 3.2, 0]} s={[2.0, 1.2, 0.6]} c={C.green} glow={0.5} />
        <Txt p={[0, 3.2, 0.35]} s={String(e.operand)} h={0.6} c="#06260f" />
      </group>)}
      readouts={[
        ["Mode", NAME[mode as AMode]], ["Effective address", e.ea === null ? "none (operand is not in memory)" : String(e.ea)], ["Operand", String(e.operand)],
        ["Memory accesses for the operand", String(e.accesses)], ["Pointer fetched first", ptr === null ? "-" : `M[${x}] = ${ptr}`],
      ]}
      controls={<>
        <Slider label="Address field of the instruction" value={x} min={0} max={999} step={1} digits={0} onChange={(v) => set("x", Math.round(v))} />
        <Pick label="Addressing mode" value={mode} options={(Object.keys(NAME) as AMode[]).map((id) => ({ id, label: NAME[id] }))} onChange={(v) => set("mode", v)} />
        <Slider label="Register R1" value={r1} min={0} max={999} step={1} digits={0} onChange={(v) => set("r1", Math.round(v))} />
        <Slider label="Index register XR" value={xr} min={0} max={999} step={1} digits={0} onChange={(v) => set("xr", Math.round(v))} />
      </>}
      note={<p>The textbook set-up: the instruction is at address 200 with its address field in word 201, so after the fetch PC = 202, R1 = 400, XR = 100 and the address field is 500. <b>Immediate</b>: operand = 500. <b>Direct</b>: EA = 500, operand 800. <b>Indirect</b>: M[500] = 800 is the EA, operand 300 (two memory reads). <b>Register</b>: operand = R1 = 400. <b>Register indirect</b>: EA = R1 = 400, operand 700. <b>Auto-decrement</b>: R1 becomes 399, operand 450. <b>Relative</b>: EA = PC + 500 = 702, operand 325. <b>Indexed</b>: EA = 500 + XR = 600, operand 900 (PYQ Q6.7). Slide the address field to see other words (made-up values).</p>}
    />
  );
}
