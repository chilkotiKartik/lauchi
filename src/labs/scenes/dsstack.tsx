"use client";
import { EXPRS, infixFrames, postfixFrames, queueFrames, stackFrames } from "../sim/bcax";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { BCAX_SPECS } from "../meta/bcax.specs";
import { Bench, C, Cell, Glass, Glide, Halo, Led, Pointer, Slab, Txt, cyc, type V3 } from "./bcax-kit";

export default function DsStackLab() {
  const [P, set, reset] = useLabParams(BCAX_SPECS.dsstack);
  const { mode, cap, ex, step } = P;
  const E = EXPRS[ex];
  const frames = mode === "stack" ? stackFrames(cap) : mode === "cqueue" ? queueFrames(cap) : mode === "postfix" ? postfixFrames(E.postfix) : infixFrames(E.infix);
  const k = Math.min(step, frames.length - 1), f = frames[k];
  const tokens = mode === "postfix" ? E.postfix : mode === "infix" ? E.infix : "";
  const tower = mode !== "cqueue";
  const slots = mode === "stack" ? cap : 8;
  const R = 2.5;
  const ringPos = (i: number): V3 => { const a = (i / cap) * Math.PI * 2 - Math.PI / 2; return [Math.cos(a) * R, 0.4, Math.sin(a) * R * 0.8]; };
  return (
    <LabFrame
      label={mode === "cqueue" ? "A ring of numbered slots on a steel bench forming a circular queue: items sit in the slots, a green marker shows the front and an orange marker the rear, which wraps round the ring" : "A glass tube on a steel bench: coloured value slabs drop onto the stack one by one and lift off again, with a gold pointer marking the top; red flashes show overflow and underflow"}
      camera={mode === "cqueue" ? [0, 5.5, 7.5] : [4, 3.6, 8]}
      onReset={reset}
      scene={(playing) => (<group position={[0, -0.6, 0]}>
        <Bench w={13} d={8} />
        {tower && (<group position={[mode === "stack" ? 0 : -3.2, 0, 0]}>
          <Glass p={[0, slots * 0.31 + 0.1, 0]} s={[2.0, slots * 0.62 + 0.3, 1.2]} c={f.err ? C.red : C.blue} on={f.err} o={0.08} />
          {Array.from({ length: slots }, (_, i) => <Slab key={"e" + i} p={[0, 0.3 + i * 0.62, 0]} s={[1.7, 0.08, 0.9]} c="#3b4d57" />)}
          {f.cells.map((v, i) => v !== null && (
            <Glide key={`${i}-${v}`} to={[0, 0.3 + i * 0.62 + 0.28, 0]} from={[0, 0.3 + i * 0.62 + 2.4, 0]} playing={playing}>
              <Cell p={[0, 0, 0]} s={[1.6, 0.52, 0.9]} c={cyc(i)} glow={i === f.top ? 0.7 : 0.15} v={v} th={0.36} />
            </Glide>
          ))}
          {f.top >= 0 && <Pointer p={[1.5, 0.3 + f.top * 0.62 + 0.55, 0]} />}
          <Led p={[0, slots * 0.62 + 0.6, 0]} c={f.err ? C.red : C.green} r={0.2} />
        </group>)}
        {mode === "cqueue" && (<group>
          {Array.from({ length: cap }, (_, i) => {
            const p = ringPos(i), v = f.cells[i];
            return (<group key={i}>
              <Cell p={p} s={[0.95, 0.5, 0.7]} c={v !== null ? cyc(i) : "#33444e"} glow={v !== null ? 0.4 : 0.02} v={v ?? ""} th={0.32} />
              <Txt p={[p[0] * 1.3, 0.1, p[2] * 1.3]} s={String(i)} h={0.3} c={C.light} glow={0.5} />
              {i === f.front && f.count > 0 && <Pointer p={[p[0], 1.1, p[2]]} c={C.green} />}
              {i === f.rear && f.count > 0 && <Pointer p={[p[0], 1.55, p[2]]} c={C.orange} />}
            </group>);
          })}
          {f.count > 0 && <Halo p={[ringPos(f.rear)[0], 0.4, ringPos(f.rear)[2]]} r={0.6} c={C.orange} />}
          <Led p={[0, 0.5, 0]} c={f.err ? C.red : f.count === cap ? C.gold : C.green} r={0.3} />
          <Txt p={[0, 1.3, 0]} s={String(f.count)} h={0.8} c={C.gold} />
        </group>)}
        {tokens && (<group position={[0, 0.25, 2.8]}>
          {tokens.split("").map((t, i) => {
            const n = tokens.length;
            return <Cell key={i} p={[(i - (n - 1) / 2) * 0.72, 0, 0]} s={[0.6, 0.55, 0.3]} c={i === k - 1 ? C.gold : i < k ? C.green : "#3b4d57"} glow={i === k - 1 ? 0.8 : i < k ? 0.2 : 0} v={t} tc={i === k - 1 ? "#2a1d00" : "#ffffff"} th={0.36} />;
          })}
        </group>)}
        {mode === "infix" && f.out && (<group position={[0, 0.25, 3.7]}>
          {f.out.split("").map((t, i) => <Cell key={i} p={[(i - (f.out.length - 1) / 2) * 0.62, 0, 0]} s={[0.52, 0.5, 0.3]} c={C.purple} glow={0.4} v={t} th={0.34} />)}
        </group>)}
      </group>)}
      readouts={mode === "stack" ? [
        ["Operation", f.op === "start" ? "none yet" : f.op], ["top", String(f.top)], ["Items stored", String(f.count)], ["Capacity MAX", String(cap)], ["What happened", f.note],
      ] : mode === "cqueue" ? [
        ["Operation", f.op === "start" ? "none yet" : f.op], ["front / rear", `${f.front} / ${f.count ? f.rear : "-"}`], ["Items (count)", `${f.count} of ${cap}`], ["What happened", f.note],
      ] : mode === "postfix" ? [
        ["Postfix string", E.postfix], ["Token read", f.op === "start" ? "none yet" : f.op], ["Stack now", f.cells.join(" ") || "empty"], ["Result at the end", String(E.value)], ["What happened", f.note],
      ] : [
        ["Infix string", E.infix], ["Token read", f.op === "start" ? "none yet" : f.op], ["Operator stack", f.cells.join(" ") || "empty"], ["Postfix so far", f.out || "(none)"], ["What happened", f.note],
      ]}
      controls={<>
        <Slider label="Step through the operations" value={step} min={0} max={14} step={1} digits={0} onChange={(x) => set("step", Math.round(x))} />
        <Pick label="Structure" value={mode} options={[{ id: "stack", label: "Array stack: push and pop" }, { id: "cqueue", label: "Circular queue: enqueue and dequeue" }, { id: "postfix", label: "Postfix evaluation (stack)" }, { id: "infix", label: "Infix to postfix (stack)" }]} onChange={(x) => set("mode", x)} />
        {(mode === "stack" || mode === "cqueue") && <Slider label="Capacity (array size)" value={cap} min={3} max={8} step={1} digits={0} onChange={(x) => set("cap", Math.round(x))} />}
        {(mode === "postfix" || mode === "infix") && <Pick label="Expression" value={ex} options={[{ id: "e1", label: `${EXPRS.e1.infix}  =  ${EXPRS.e1.postfix}` }, { id: "e2", label: `${EXPRS.e2.infix}  =  ${EXPRS.e2.postfix}` }]} onChange={(x) => set("ex", x)} />}
      </>}
      note={mode === "stack" ? (
        <p>A <b>stack</b> is LIFO: push does <code>top++; A[top] = x</code> after checking <b>overflow</b> (top = MAX−1); pop does <code>x = A[top]; top−−</code> after checking <b>underflow</b> (top = −1). Lower the capacity to 4 and push the fifth item: the tube flashes red. PYQ Q5.5 asks for exactly these algorithms.</p>
      ) : mode === "cqueue" ? (
        <p>A <b>circular queue</b> reuses freed slots: <code>rear = (rear + 1) mod N</code> and <code>front = (front + 1) mod N</code>. When rear reaches the end of the array it wraps to index 0 (the orange marker jumps round the ring) as long as the queue is not full. A plain linear queue would report &quot;full&quot; here even though slots are free (PYQ Q5.7).</p>
      ) : mode === "postfix" ? (
        <p><b>Postfix evaluation</b>: scan left to right; push operands; on an operator pop two values (the second popped is the right operand), apply it and push the result. The single value left at the end is the answer.</p>
      ) : (
        <p><b>Infix to postfix</b>: operands go straight to the output; an operator first pops every operator of equal or higher precedence from the stack, then is pushed; &quot;(&quot; is pushed and &quot;)&quot; pops until the matching &quot;(&quot;. At the end the remaining operators are popped.</p>
      )}
    />
  );
}
