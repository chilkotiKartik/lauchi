"use client";
import { useMemo } from "react";
import { ironCarbon, phases, prng } from "../sim/mechy";
import { useQuality } from "../Stage";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { MECHY_SPECS } from "../meta/mechy.specs";
import { Box, Instances, Spin, type Inst } from "../kit";
import { C, Graph } from "../kit2";

const MILD = ironCarbon(0.2, "plain").curve, CAST = ironCarbon(3, "plain").curve;

/** A polished, etched sample seen under the microscope: grains coloured by phase (ferrite, pearlite, cementite, graphite flakes). */
function grains(c: number, n: number): Inst[] {
  const ph = phases(c), rnd = prng(1234), out: Inst[] = [];
  const side = Math.ceil(Math.sqrt(n)), cell = 2.6 / side;
  for (let i = 0; i < side; i++) for (let j = 0; j < side; j++) {
    const x = (i - (side - 1) / 2) * cell + (j % 2) * cell * 0.5, y = (j - (side - 1) / 2) * cell;
    if (x * x + y * y > 1.3 * 1.3) continue;
    const r = rnd(), sz = cell * (0.86 + 0.12 * rnd());
    const col = c >= 2 ? (r < 0.6 ? C.purple : C.light) : r < ph.ferrite ? C.light : r < ph.ferrite + ph.pearlite ? C.purple : C.white;
    out.push({ p: [x, y, 0], s: [sz, sz, 0.12 + 0.05 * rnd()], c: col });
  }
  if (c >= 2) {
    const flakes = Math.round(10 + 40 * ph.graphite);
    for (let k = 0; k < flakes; k++) {
      const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * 1.15;
      out.push({ p: [Math.cos(a) * d, Math.sin(a) * d, 0.1], s: [0.35 + 0.3 * rnd(), 0.05, 0.05], c: C.dark });
    }
  }
  return out;
}

export default function CarbonSteelLab() {
  const quality = useQuality();
  const [P, set, reset] = useLabParams(MECHY_SPECS.carbonsteel);
  const { c, kind } = P;
  const m = ironCarbon(c, kind);
  const items = useMemo(() => grains(c, quality === "low" ? 100 : 196), [c, quality]);
  const props: [number, string][] = [[m.uts / 1600, C.blue], [m.bhn / 520, C.orange], [Math.min(1, m.toughness / 140), C.green], [m.el / 40, C.gold]];
  return (
    <LabFrame
      label="Stress–strain curve of the chosen iron–carbon material compared with mild steel and cast iron, a slowly turning etched microstructure disc (ferrite light, pearlite purple, cementite white, graphite flakes dark) and four bars for strength, hardness, toughness and ductility"
      camera={[0.4, 0.3, 9.6]}
      onReset={reset}
      scene={() => (<group>
        <Graph x0={-4.6} y0={-2.2} w={4.6} h={4.2} xr={[0, 42]} yr={[0, 1600]} curves={[
          { pts: MILD, color: C.light, w: 1.5, dashed: true },
          { pts: CAST, color: C.grey, w: 1.5, dashed: true },
          { pts: m.curve, color: m.brittle ? C.red : C.green, w: 3.2 },
        ]} marker={m.curve[m.curve.length - 1]} markerColor={C.red} />
        <group position={[2.05, 0.85, 0]}>
          <mesh position={[0, 0, -0.1]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[1.45, 1.45, 0.12, 40]} /><meshStandardMaterial color={C.dark} metalness={0.5} roughness={0.3} /></mesh>
          <Spin speed={0.18}><group rotation={[0, 0, 0]}><Instances items={items} cap={260} /></group></Spin>
        </group>
        <group position={[0.75, -2.25, 0]}>
          {props.map(([f, col], i) => { const h = Math.max(0.05, Math.min(1, f) * 1.5); return <Box key={i} p={[i * 0.75, h / 2, 0]} s={[0.5, h, 0.5]} c={col} glow={0.35} />; })}
          <Box p={[1.12, -0.05, 0]} s={[3.1, 0.08, 0.8]} c={C.dark} />
        </group>
      </group>)}
      readouts={[
        ["Material", `${m.cls} (${c.toFixed(2)} % C)`],
        ["Strength: UTS / yield", m.brittle ? `${m.uts.toFixed(0)} MPa / no yield point` : `${m.uts.toFixed(0)} / ${m.ys.toFixed(0)} MPa`],
        ["Hardness", `≈ ${m.bhn.toFixed(0)} HB (Brinell)`],
        ["Ductility: elongation", `${m.el.toFixed(1)} %`],
        ["Toughness (area under curve)", `${m.toughness.toFixed(m.toughness < 10 ? 2 : 0)} MJ/m³`],
        ["Resilience σ_y²/2E · typical use", `${m.resilience.toFixed(0)} kJ/m³ · ${m.use}`],
      ]}
      controls={<>
        <Slider label="Carbon content" value={c} min={0.05} max={4} step={0.01} digits={2} unit=" % C" onChange={(x) => set("c", x)} />
        <Pick label="Composition" value={kind} options={[{ id: "plain", label: "Plain carbon (normalised)" }, { id: "alloy", label: "Alloyed: Cr–Ni–Mo, hardened & tempered" }]} onChange={(x) => set("kind", x)} />
      </>}
      note={<>
        <p>Iron with a little carbon is <b>steel</b>; with 2–4 % carbon it is <b>cast iron</b>. Carbon forms hard iron carbide (cementite) that sits in layers with soft ferrite as <b>pearlite</b> (purple grains). More pearlite means more <b>strength</b> and <b>hardness</b> but less <b>ductility</b>: low-carbon (mild) steel ≤ 0.25 % C bends and welds easily, medium-carbon 0.25–0.6 % is used for shafts, rails and gears, high-carbon 0.6–1.5 % for tools and springs. In grey cast iron the extra carbon is free graphite flakes (dark streaks) that act like cracks: the curve (red) is <b>brittle</b>, with no yield point and fracture at under 1 % strain, but it casts beautifully, damps vibration and is strong in compression.</p>
        <p className="mt-2"><b>Toughness</b> is the energy absorbed before fracture (area under the curve); <b>resilience</b> is the elastic energy stored up to yield, σ_y²/2E. <b>Alloy steels</b> (Cr, Ni, Mo, Mn…) heat-treat to much higher strength while keeping useful toughness. Dashed curves are mild steel (light) and cast iron (grey) for comparison. Values are smoothed handbook trends (simplified model); real properties depend on heat treatment.</p>
      </>}
    />
  );
}
