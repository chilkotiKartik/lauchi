"use client";
import { Line } from "@react-three/drei";
import { useRef } from "react";
import type * as THREE from "three";
import { REGIONS, fmt, regionArea, strips, type Order, type RegionId } from "../sim/mathi";
import { Tick } from "../Stage";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { MATHI_SPECS } from "../meta/mathi.specs";
import { C, Grid, Instances, P3, type Inst, type V3 } from "./mathi-kit";

export default function ReverseOrderLab() {
  const [P, set, reset] = useLabParams(MATHI_SPECS.reverseorder);
  const { id, order, n } = P;
  const R = REGIONS[id];
  const A = strips(id, order, n), B = strips(id, order === "dydx" ? "dxdy" : "dydx", n);
  const w = R.x[1] - R.x[0], h = R.y[1] - R.y[0], s = 4.4 / Math.max(w, h);
  const ox = -(R.x[0] + w / 2) * s, oy = -(R.y[0] + h / 2) * s;
  const pt = (x: number, y: number, z = 0.02): V3 => { const p = P3(x * s + ox, y * s - oy, z); return [p[0], p[1], p[2] + 0.2]; };
  const col1 = order === "dydx" ? C.blue : C.orange, col2 = order === "dydx" ? "#7cc8f7" : "#ffc07a";
  const vmax = Math.max(...A.strips.map((t) => t.v), 1e-9), bs = 2.2 / vmax;
  const items: Inst[] = [];
  A.strips.forEach((t, i) => {
    const mid = (t.lo + t.hi) / 2, len = Math.max(0, t.hi - t.lo) * s, wd = t.w * s * 0.9;
    if (order === "dydx") {
      const p = pt(t.c, mid, 0.03), q = pt(t.c, R.y[0] - 0.12 * h, 0.03);
      items.push({ p, s: [wd, 0.05, len], c: i % 2 ? col1 : col2 });
      items.push({ p: [q[0], (t.v * bs) / 2 + 0.03, q[2]], s: [wd, Math.max(0.01, t.v * bs), 0.28], c: i % 2 ? C.green : C.gold });
    } else {
      const p = pt(mid, t.c, 0.03), q = pt(R.x[0] - 0.12 * w, t.c, 0.03);
      items.push({ p, s: [len, 0.05, wd], c: i % 2 ? col1 : col2 });
      items.push({ p: [q[0], (t.v * bs) / 2 + 0.03, q[2]], s: [0.28, Math.max(0.01, t.v * bs), wd], c: i % 2 ? C.green : C.gold });
    }
  });
  const lowEdge: V3[] = Array.from({ length: 61 }, (_, i) => { const x = R.x[0] + (w * i) / 60; return pt(x, R.ylo(x), 0.05); });
  const highEdge: V3[] = Array.from({ length: 61 }, (_, i) => { const x = R.x[0] + (w * i) / 60; return pt(x, R.yhi(x), 0.05); });
  const sweep = useRef<THREE.Mesh>(null), t = useRef(0);
  const tick = (dt: number) => {
    t.current = (t.current + Math.min(dt, 0.05) * 0.18) % 1;
    const m = sweep.current;
    if (!m) return;
    const f = t.current;
    if (order === "dydx") { const p = pt(R.x[0] + w * f, (R.y[0] + R.y[1]) / 2, 0.12); m.position.set(p[0], p[1], p[2]); m.scale.set(0.04, 0.5, h * s * 1.05); }
    else { const p = pt((R.x[0] + R.x[1]) / 2, R.y[0] + h * f, 0.12); m.position.set(p[0], p[1], p[2]); m.scale.set(w * s * 1.05, 0.5, 0.04); }
  };
  const exactTxt = fmt(R.exact, 5);
  return (
    <LabFrame
      label="A region of integration on the floor cut into thin strips either vertically or horizontally, with a bar in front of each strip showing its inner integral"
      camera={[0, 5.2, 6.6]}
      onReset={reset}
      scene={() => (<group>
        <Tick fn={tick} />
        <Grid size={8} y={0} />
        <Instances items={items} cap={90} />
        <Line points={lowEdge} color={C.light} lineWidth={2} />
        <Line points={highEdge} color={C.light} lineWidth={2} />
        <Line points={[pt(R.x[0], R.ylo(R.x[0])), pt(R.x[0], R.yhi(R.x[0]))]} color={C.light} lineWidth={2} />
        <Line points={[pt(R.x[1], R.ylo(R.x[1])), pt(R.x[1], R.yhi(R.x[1]))]} color={C.light} lineWidth={2} />
        <mesh ref={sweep}><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color={C.red} emissive={C.red} emissiveIntensity={0.7} transparent opacity={0.55} /></mesh>
      </group>)}
      readouts={[
        [`Strip sum (${order === "dydx" ? "dy dx" : "dx dy"})`, fmt(A.sum, 5)],
        [`Strip sum (${order === "dydx" ? "dx dy" : "dy dx"})`, fmt(B.sum, 5)],
        ["Exact value", exactTxt],
        ["Error of this order", fmt(Math.abs(A.sum - R.exact), 6)],
        ["Area of the region", fmt(regionArea(id, order), 4)],
        ["Region", R.text],
      ]}
      controls={<>
        <Slider label="Number of strips n" value={n} min={2} max={40} step={1} digits={0} onChange={(v) => set("n", v)} />
        <Pick label="Integral" value={id} options={(Object.keys(REGIONS) as RegionId[]).map((k) => ({ id: k, label: REGIONS[k].label }))} onChange={(v) => set("id", v)} />
        <Pick label="Order of integration" value={order} options={[{ id: "dydx", label: "dy first, then dx (vertical strips)" }, { id: "dxdy", label: "dx first, then dy (horizontal strips)" }]} onChange={(v: Order) => set("order", v)} />
      </>}
      note={<>
        <p><b>Changing the order of integration.</b> Sketch the region, then slice it the other way. Vertical strips of width dx run from the lower curve y = φ₁(x) to the upper curve y = φ₂(x); horizontal strips run from x = ψ₁(y) to ψ₂(y). The bar in front of each strip is its inner integral, so (area of bars) = the double integral. Both orders add up to the same number — but one order can be impossible in closed form.</p>
        <p className="mt-2"><b>Try.</b> PYQ: ∫₀^π∫ₓ^π (sin y)/y dy dx. In dy dx order the inner integral of (sin y)/y has no elementary form; in dx dy order it is just (sin y)/y · y = sin y and the answer is 2. The &quot;x² ≤ y ≤ 2 − x&quot; preset (PYQ, xy) has a region whose other order needs two pieces (y ≤ 1 and y ≥ 1) and equals 3/8. Raise n and watch both strip sums close in on the exact value.</p>
      </>}
    />
  );
}
