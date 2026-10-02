"use client";
import { gcd, gcdTrace, type GcdStep } from "../sim/extra";
import { Bars, Box, C, Floor, Panel, Poly } from "../kit";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { EXTRA_SPECS } from "../meta/extra.specs";

const NODES: { id: GcdStep["node"]; y: number; x: number; c: string; label: string }[] = [
  { id: "start", y: 1.9, x: -2.2, c: C.green, label: "Start" },
  { id: "input", y: 1.1, x: -2.2, c: C.blue, label: "Input" },
  { id: "test", y: 0.2, x: -2.2, c: C.gold, label: "Test" },
  { id: "calc", y: -0.7, x: -0.5, c: C.purple, label: "Calculate" },
  { id: "output", y: -0.9, x: -3.9, c: C.red, label: "Output" },
];

export default function GcdFlowLab() {
  const [P, set, reset] = useLabParams(EXTRA_SPECS.gcdflow);
  const { a, b, method, step } = P;
  const trace = gcdTrace(a, b, method);
  const i = Math.min(Math.round(step), trace.length - 1), cur = trace[i];
  const top = Math.max(a, b);
  const loops = trace.filter((s) => s.node === "calc").length;
  return (
    <LabFrame
      label="A flowchart in 3D with start, input, decision, calculation and output blocks, the active block glowing, and two columns showing the current values of a and b"
      camera={[0, 0.6, 6.5]}
      animated={false}
      onReset={reset}
      scene={() => (
        <group>
          <Floor size={12} y={-1.5} divisions={12} />
          <Panel p={[-2.2, 0.5, -0.4]} w={5.6} h={4} />
          {NODES.map((n) => {
            const on = cur.node === n.id;
            return n.id === "test"
              ? <mesh key={n.id} position={[n.x, n.y, 0]} rotation={[0, 0, Math.PI / 4]}><boxGeometry args={[0.7, 0.7, 0.3]} /><meshStandardMaterial color={n.c} emissive={n.c} emissiveIntensity={on ? 0.9 : 0.05} roughness={0.5} /></mesh>
              : <Box key={n.id} p={[n.x, n.y, 0]} s={[1.2, 0.5, 0.3]} c={n.c} glow={on ? 0.9 : 0.05} />;
          })}
          <Poly pts={[[-2.2, 1.65, 0], [-2.2, 1.35, 0]]} c={C.light} w={2} />
          <Poly pts={[[-2.2, 0.85, 0], [-2.2, 0.55, 0]]} c={C.light} w={2} />
          <Poly pts={[[-1.85, 0.2, 0], [-0.5, 0.2, 0], [-0.5, -0.45, 0]]} c={C.light} w={2} />
          <Poly pts={[[-0.5, -0.95, 0], [-0.5, -1.25, 0], [-3.05, -1.25, 0], [-3.05, 0.2, 0], [-2.55, 0.2, 0]]} c={C.orange} w={2} />
          <Poly pts={[[-2.2, -0.15, 0], [-2.2, -0.9, 0], [-3.3, -0.9, 0]]} c={C.light} w={2} />
          <Panel p={[2.9, 0, -0.4]} w={2.4} h={3.4} />
          <Bars values={[cur.a, cur.b]} max={top} colors={[C.blue, C.orange]} x0={2.2} y0={-1.5} w={0.7} gap={0.3} height={2.9} glow={0.3} />
        </group>
      )}
      readouts={[
        ["gcd(a, b)", String(gcd(a, b))],
        ["Loop passes to finish", String(loops)],
        ["Now at", cur.note],
        ["a now", String(cur.a)],
        ["b now", String(cur.b)],
        ["Trace length", `${trace.length} steps`],
      ]}
      controls={<>
        <Slider label="Number a" value={a} min={1} max={999} step={1} digits={0} onChange={(x) => set("a", Math.round(x))} />
        <Slider label="Number b" value={b} min={1} max={999} step={1} digits={0} onChange={(x) => set("b", Math.round(x))} />
        <Pick label="Method" value={method} options={[{ id: "mod", label: "Remainder (a mod b)" }, { id: "sub", label: "Repeated subtraction" }]} onChange={(v) => set("method", v)} />
        <Slider label="Step through the trace" value={i} min={0} max={200} step={1} digits={0} onChange={(x) => set("step", Math.round(x))} />
      </>}
      note={<p>Green block: start. Blue: read a and b. Gold diamond: the decision (is b = 0 for the remainder method, is a = b for subtraction). Purple: the calculation, whose arrow (orange) loops back to the decision. Red: print the answer. The block glowing now is the step you have selected with the last slider, and the two columns show the current a (blue) and b (orange). Euclid&apos;s method replaces (a, b) by (b, a mod b) until b is 0, and the last a is gcd(a, b). Repeated subtraction gives the same answer in many more steps. The step slider stops at the end of the trace.</p>}
    />
  );
}
