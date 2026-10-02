"use client";
import { useMemo, useRef } from "react";
import type * as THREE from "three";
import { rng, vulcan } from "../sim/chemy";
import { Tick } from "../Stage";
import { LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { CHEMY_SPECS } from "../meta/chemy.specs";
import { C, Instances, Segs, type Inst } from "../kit";
import { Graph, type XY } from "../kit2";

const NCH = 9, NPT = 44, HX = 1.9, HY = 0.55, HZ = 0.45, XCAP = 60;
const CH_COL = [C.blue, C.green, C.purple, C.orange, C.red, C.light, C.blue, C.green, C.purple];

/** Random-coil chains in a strip, and candidate S–S bridge sites (closest pairs between different chains). */
function network() {
  const r = rng(5), chains: number[][] = [];
  const refl = (v: number, h: number) => (v > h ? 2 * h - v : v < -h ? -2 * h - v : v);
  for (let c = 0; c < NCH; c++) {
    let x = -HX + r() * 0.6, y = (r() - 0.5) * 2 * HY, z = (r() - 0.5) * 2 * HZ;
    const pts: number[] = [x, y, z];
    for (let k = 1; k < NPT; k++) {
      x = refl(x + 0.075 + (r() - 0.5) * 0.22, HX); y = refl(y + (r() - 0.5) * 0.3, HY); z = refl(z + (r() - 0.5) * 0.3, HZ);
      pts.push(x, y, z);
    }
    chains.push(pts);
  }
  const pairs: { d: number; a: number[]; b: number[] }[] = [];
  for (let i = 0; i < NCH; i++) for (let j = i + 1; j < NCH; j++) for (let p = 0; p < NPT; p += 2) for (let q = 0; q < NPT; q += 2) {
    const A = chains[i], B = chains[j], d = Math.hypot(A[p * 3] - B[q * 3], A[p * 3 + 1] - B[q * 3 + 1], A[p * 3 + 2] - B[q * 3 + 2]);
    if (d < 0.3) pairs.push({ d, a: [A[p * 3], A[p * 3 + 1], A[p * 3 + 2]], b: [B[q * 3], B[q * 3 + 1], B[q * 3 + 2]] });
  }
  // deterministic shuffle so the chosen bridges spread along the strip
  for (let i = pairs.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)), tmp = pairs[i]; pairs[i] = pairs[j]; pairs[j] = tmp; }
  const segs = chains.map((pts) => { const s: number[] = []; for (let k = 1; k < NPT; k++) s.push(pts[k * 3 - 3], pts[k * 3 - 2], pts[k * 3 - 1], pts[k * 3], pts[k * 3 + 1], pts[k * 3 + 2]); return s; });
  return { segs, pairs };
}
const NET = network();

export default function VulcanizeLab() {
  const [P, set, reset] = useLabParams(CHEMY_SPECS.vulcanize);
  const { S, eff, T, lam } = P;
  const v = vulcan(S, eff, T, lam);
  const raw = S < 0.3;
  const nX = raw ? 0 : Math.max(1, Math.min(XCAP, Math.round(v.nuX / 4)));
  const bridges = useMemo(() => {
    const items: Inst[] = [], segs: number[] = [];
    NET.pairs.slice(0, nX).forEach((p) => { items.push({ p: [(p.a[0] + p.b[0]) / 2, (p.a[1] + p.b[1]) / 2, (p.a[2] + p.b[2]) / 2], s: [0.11, 0.11, 0.11], c: C.gold }); segs.push(...p.a, ...p.b); });
    return { items, segs };
  }, [nX]);
  const Gm = v.G / 1e6;
  const curve = useMemo<XY[]>(() => Array.from({ length: 61 }, (_, i) => { const l = 1 + i * 0.1; return [l, Gm * (l - 1 / (l * l))] as XY; }), [Gm]);
  const yMax = Math.max(1, Gm * 7.2);
  const strip = useRef<THREE.Group>(null), clL = useRef<THREE.Mesh>(null), clR = useRef<THREE.Mesh>(null), t = useRef(0);
  const tick = (dt: number) => {
    t.current += Math.min(dt, 0.05) * 1.1;
    const w = 0.5 - 0.5 * Math.cos(t.current), l = raw ? 1 + (lam - 1) * Math.min(1, t.current / Math.PI) * (0.75 + 0.25 * w) : 1 + (lam - 1) * w;
    const sx = 0.55 + Math.min(l, 4.2) / 2.2; // drawn length compressed to stay in view
    strip.current?.scale.set(sx, 1 / Math.sqrt(l), 1 / Math.sqrt(l));
    const half = HX * sx + 0.25;
    clL.current?.position.set(-half, 0, 0); clR.current?.position.set(half, 0, 0);
  };
  return (
    <LabFrame
      label="A strip of rubber held between two clamps is stretched and released: coloured polymer chains coil inside it and gold sulphur bridges tie neighbouring chains together; a stress–stretch graph shows the rubber-elasticity curve for the chosen sulphur content"
      camera={[0.2, 1.8, 9.5]}
      onReset={reset}
      scene={() => (<group>
        <Tick fn={tick} />
        <group position={[-1.3, 0.9, 0]} rotation={[0.25, -0.2, 0]}>
          <group ref={strip}>
            {NET.segs.map((s, i) => <Segs key={i} pts={s} c={CH_COL[i]} />)}
            <Segs pts={bridges.segs} c={C.gold} />
            <Instances items={bridges.items} cap={XCAP} shape="sphere" />
            <mesh><boxGeometry args={[2 * HX + 0.3, 2 * HY + 0.3, 2 * HZ + 0.3]} /><meshStandardMaterial color={raw ? "#c9b48a" : S > 25 ? "#2b2b2b" : "#6b5a45"} transparent opacity={0.22} /></mesh>
          </group>
          <mesh ref={clL}><boxGeometry args={[0.3, 1.6, 1.3]} /><meshStandardMaterial color={C.grey} metalness={0.4} /></mesh>
          <mesh ref={clR}><boxGeometry args={[0.3, 1.6, 1.3]} /><meshStandardMaterial color={C.grey} metalness={0.4} /></mesh>
        </group>
        <Graph x0={-3.6} y0={-2.6} w={6.6} h={1.9} xr={[1, 7]} yr={[0, yMax]} curves={[{ pts: curve, color: C.gold, w: 3 }]} marker={[lam, v.stress / 1e6]} markerColor={C.red} />
      </group>)}
      readouts={[
        ["Cross-link density ν", `${v.nuX.toFixed(1)} mol/m³`],
        ["Mass between cross-links Mc", Number.isFinite(v.Mc) ? `${v.Mc.toFixed(0)} g/mol` : "∞ (no network)"],
        ["Shear modulus G = 2νRT", `${Gm.toFixed(3)} MPa`],
        ["Young's modulus E ≈ 3G", `${(v.E / 1e6).toFixed(2)} MPa`],
        ["Stress at this stretch", raw ? "flows (no recovery)" : `${(v.stress / 1e6).toFixed(2)} MPa`],
        ["Material", v.cls],
      ]}
      controls={<>
        <Slider label="Sulphur added" value={S} min={0} max={40} step={0.1} digits={1} unit=" phr" onChange={(x) => set("S", x)} />
        <Slider label="S atoms per cross-link" value={eff} min={2} max={50} step={1} digits={0} onChange={(x) => set("eff", x)} />
        <Slider label="Temperature" value={T} min={250} max={400} step={1} digits={0} unit=" K" onChange={(x) => set("T", x)} />
        <Slider label="Stretch ratio λ" value={lam} min={1} max={7} step={0.1} digits={1} onChange={(x) => set("lam", x)} />
      </>}
      note={<>
        <p><b>Raw natural rubber</b> (cis-polyisoprene) is a tangle of long chains held only by weak forces: it is soft and sticky when warm, brittle when cold, swells in oils and does not spring back after stretching because chains slide past each other. <b>Vulcanisation</b> (Goodyear, 1839): heat the rubber with 3–5 % sulphur at 100–140 °C (with accelerators such as MBT and ZnO activators). Sulphur bridges (–S<sub>x</sub>–) form at the allylic C–H sites next to the C=C bonds and tie the chains into a 3D network.</p>
        <p className="mt-2">The network gives higher tensile strength, elasticity and abrasion resistance, a wider useful temperature range and lower solvent swelling. Rubber elasticity is entropic: the modulus G = (network chains per m³)·RT grows with cross-link density and with temperature. About 30–50 % sulphur gives hard <b>ebonite</b> (battery cases, insulation).</p>
        <p className="mt-2"><b>Try:</b> slide sulphur from 0 to 10 phr and watch the bridges and the stress climb; set 45 S atoms per cross-link (no accelerator) to see how much sulphur is wasted. Simplified model: ideal network, no entanglements or filler, valid only for soft rubber.</p>
      </>}
    />
  );
}
