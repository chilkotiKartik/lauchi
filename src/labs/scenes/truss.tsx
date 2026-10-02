"use client";
import { useMemo } from "react";
import { buildTruss, solveTruss } from "../sim/mechx";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { MECHX_SPECS } from "../meta/mechx.specs";
import { C, Ball, Box } from "../kit";
import { Arrow, Rod } from "../kit2";

export default function TrussLab() {
  const [P, set, reset] = useLabParams(MECHX_SPECS.truss);
  const { P: load, W, bays, span, h, type } = P;
  const nb = Math.round(bays);
  const tr = useMemo(() => buildTruss(type, nb, span, h, load, W), [type, nb, span, h, load, W]);
  const s = useMemo(() => solveTruss(tr), [tr]);
  const k = 9 / Math.max(span, h * 2.2);
  const at = (i: number): [number, number, number] => [(tr.nodes[i][0] - span / 2) * k, (tr.nodes[i][1] - h / 2) * k, 0];
  const fmax = s ? Math.max(1e-6, ...s.forces.map(Math.abs)) : 1;
  const maxT = s ? Math.max(0, ...s.forces) : 0, maxC = s ? Math.min(0, ...s.forces) : 0;
  const zero = s ? s.forces.filter((f) => Math.abs(f) < 1e-6).length : 0;
  return (
    <LabFrame
      label="A pin-jointed truss with a pinned support on the left and a roller on the right; members glow blue in tension and red in compression, thicker for bigger forces, with load arrows at the joints"
      camera={[0, 0.4, 10]}
      animated={false}
      onReset={reset}
      scene={() => (<group>
        {tr.members.map(([a, b], i) => {
          const f = s ? s.forces[i] : 0, mag = Math.abs(f) / fmax;
          return <Rod key={i} a={at(a)} b={at(b)} r={0.04 + 0.1 * mag} color={Math.abs(f) < 1e-6 ? C.grey : f > 0 ? C.blue : C.red} glow={0.15 + 0.4 * mag} />;
        })}
        {tr.nodes.map((_, i) => <Ball key={i} p={at(i)} r={0.13} c={C.white} />)}
        {tr.loads.filter((l) => l.fy !== 0).map((l, i) => { const p = at(l.node); const len = 0.4 + 0.9 * Math.min(1, Math.abs(l.fy) / Math.max(load, W, 1)); return <Arrow key={i} from={[p[0], p[1] + len + 0.15, 0]} to={[p[0], p[1] + 0.15, 0]} color={C.gold} />; })}
        <mesh position={[at(tr.pin)[0], at(tr.pin)[1] - 0.4, 0]}><coneGeometry args={[0.35, 0.55, 3]} /><meshStandardMaterial color={C.green} /></mesh>
        <Ball p={[at(tr.roller)[0], at(tr.roller)[1] - 0.33, 0]} r={0.2} c={C.green} />
        <Box p={[0, at(0)[1] - 0.72, 0]} s={[span * k + 1.6, 0.12, 1]} c={C.dark} />
      </group>)}
      readouts={s ? [
        ["Reaction at pin R_A", `${s.Ray.toFixed(2)} kN ↑`],
        ["Reaction at roller R_B", `${s.Rby.toFixed(2)} kN ↑`],
        ["Largest tension", `${maxT.toFixed(2)} kN`],
        ["Largest compression", `${Math.abs(maxC).toFixed(2)} kN`],
        ["Zero-force members", String(zero)],
        ["m = 2j − 3 check", `${tr.members.length} = 2×${tr.nodes.length} − 3 ✓ (perfect truss)`],
      ] : [["Status", "Unstable or indeterminate layout"]]}
      controls={<>
        <Slider label="Load at each lower joint P" value={load} min={0} max={100} step={1} digits={0} unit=" kN" onChange={(x) => set("P", x)} />
        <Slider label="Extra load at mid-span W" value={W} min={0} max={200} step={1} digits={0} unit=" kN" onChange={(x) => set("W", x)} />
        <Pick label="Truss type" value={type} options={[{ id: "pratt", label: "Pratt" }, { id: "howe", label: "Howe" }, { id: "warren", label: "Warren" }]} onChange={(x) => set("type", x)} />
        <Slider label="Number of bays" value={bays} min={2} max={6} step={1} digits={0} onChange={(x) => set("bays", x)} />
        <Slider label="Span" value={span} min={4} max={30} step={0.5} digits={1} unit=" m" onChange={(x) => set("span", x)} />
        <Slider label="Height" value={h} min={1} max={8} step={0.1} digits={1} unit=" m" onChange={(x) => set("h", x)} />
      </>}
      note={<p>A <b>perfect truss</b> has just enough members to be rigid: m = 2j − 3. Then the <b>method of joints</b> works: each pin joint is in equilibrium, ΣF<sub>x</sub> = 0 and ΣF<sub>y</sub> = 0, giving 2j equations for the m member forces and the 3 support reactions. This lab solves all of them at once. Members in <b>tension</b> (pulling on the joints) are blue, <b>compression</b> red, unloaded grey, and thickness shows size. Under downward loads the top chord is compressed and the bottom chord stretched; Pratt diagonals are in tension, Howe diagonals in compression. Loads act only at the joints and self-weight is ignored.</p>}
    />
  );
}
