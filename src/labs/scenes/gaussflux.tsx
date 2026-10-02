"use client";
import * as THREE from "three";
import { GFIELDS, fmt, gauss, type GId } from "../sim/mathi";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { MATHI_SPECS } from "../meta/mathi.specs";
import { C, Glyphs, Grid, Instances, P3, Spin, type Glyph, type Inst, type V3 } from "./mathi-kit";
import { Edges } from "@react-three/drei";

export default function GaussFluxLab() {
  const [P, set, reset] = useLabParams(MATHI_SPECS.gaussflux);
  const { field, a, b, c } = P;
  const G = GFIELDS[field], r = gauss(field, a, b, c);
  const s = 3 / Math.max(a, b, c), A = a * s, B = b * s, Cc = c * s;
  const fmax = Math.max(1e-9, ...Object.values(r.faces).map(Math.abs));
  const faces: { key: keyof typeof r.faces; pos: V3; size: [number, number]; rot: V3; out: V3 }[] = [
    { key: "x0", pos: [-A / 2, 0, 0], size: [B, Cc], rot: [0, -Math.PI / 2, 0], out: [-1, 0, 0] },
    { key: "x1", pos: [A / 2, 0, 0], size: [B, Cc], rot: [0, Math.PI / 2, 0], out: [1, 0, 0] },
    { key: "y0", pos: [0, 0, B / 2], size: [A, Cc], rot: [0, 0, 0], out: [0, 0, 1] },
    { key: "y1", pos: [0, 0, -B / 2], size: [A, Cc], rot: [0, Math.PI, 0], out: [0, 0, -1] },
    { key: "z0", pos: [0, -Cc / 2, 0], size: [A, B], rot: [Math.PI / 2, 0, 0], out: [0, -1, 0] },
    { key: "z1", pos: [0, Cc / 2, 0], size: [A, B], rot: [-Math.PI / 2, 0, 0], out: [0, 1, 0] },
  ];
  const glyphs: Glyph[] = faces.map((f) => ({ p: f.pos, d: [f.out[0] * 0.7, f.out[1] * 0.7, f.out[2] * 0.7], c: r.faces[f.key] >= 0 ? C.orange : C.blue, w: 0.18 }));
  const cloud: Inst[] = [];
  let dmax = 1e-9;
  const nn = 4, cells: { p: V3; d: number }[] = [];
  for (let i = 0; i < nn; i++) for (let j = 0; j < nn; j++) for (let k = 0; k < nn; k++) {
    const x = ((i + 0.5) / nn) * a, y = ((j + 0.5) / nn) * b, z = ((k + 0.5) / nn) * c, d = G.div(x, y, z);
    dmax = Math.max(dmax, Math.abs(d));
    const p = P3(x * s - A / 2, y * s - B / 2, z * s - Cc / 2);
    cells.push({ p, d });
  }
  cells.forEach(({ p, d }) => { const m = 0.06 + 0.2 * (Math.abs(d) / dmax); cloud.push({ p, s: [m, m, m], c: Math.abs(d) < 1e-9 ? C.grey : d > 0 ? C.red : C.purple }); });
  return (
    <LabFrame
      label="A box whose six faces glow orange where the field flows out and blue where it flows in, with balls inside sized by the divergence"
      camera={[4.2, 3.4, 6.2]}
      onReset={reset}
      scene={() => (<group>
        <Grid size={8} y={-2} />
        <Spin speed={0.12}><group>
          {faces.map((f) => {
            const fl = r.faces[f.key];
            return (<mesh key={f.key} position={f.pos} rotation={f.rot}>
              <planeGeometry args={f.size} />
              <meshStandardMaterial color={fl >= 0 ? C.orange : C.blue} emissive={fl >= 0 ? C.orange : C.blue} emissiveIntensity={0.25} transparent opacity={0.18 + 0.5 * (Math.abs(fl) / fmax)} side={THREE.DoubleSide} depthWrite={false} />
            </mesh>);
          })}
          <mesh><boxGeometry args={[A, Cc, B]} /><meshBasicMaterial visible={false} /><Edges color={C.light} /></mesh>
          <Instances items={cloud} cap={64} shape="sphere" />
          <Glyphs items={glyphs} cap={8} />
        </group></Spin>
      </group>)}
      readouts={[
        ["Surface flux ∯F·n̂ dS", fmt(r.surface, 5)],
        ["Volume integral ∭∇·F dV", fmt(r.volume, 5)],
        ["Difference", fmt(r.diff, 8)],
        ["Faces x = 0 | x = a", `${fmt(r.faces.x0, 3)} | ${fmt(r.faces.x1, 3)}`],
        ["Faces y = 0 | y = b", `${fmt(r.faces.y0, 3)} | ${fmt(r.faces.y1, 3)}`],
        ["Faces z = 0 | z = c", `${fmt(r.faces.z0, 3)} | ${fmt(r.faces.z1, 3)}`],
      ]}
      controls={<>
        <Slider label="Length a (x from 0 to a)" value={a} min={0.5} max={3} step={0.1} digits={1} onChange={(v) => set("a", v)} />
        <Slider label="Width b (y from 0 to b)" value={b} min={0.5} max={3} step={0.1} digits={1} onChange={(v) => set("b", v)} />
        <Slider label="Height c (z from 0 to c)" value={c} min={0.5} max={3} step={0.1} digits={1} onChange={(v) => set("c", v)} />
        <Pick label="Vector field F" value={field} options={(Object.keys(GFIELDS) as GId[]).map((k) => ({ id: k, label: GFIELDS[k].label }))} onChange={(v) => set("field", v)} />
      </>}
      note={<>
        <p><b>Gauss&apos;s divergence theorem.</b> ∯<sub>S</sub> F·n̂ dS = ∭<sub>V</sub> ∇·F dV: the net flux out through a closed surface equals the total divergence (sources minus sinks) inside. Each face is tinted by its outward flux (orange out, blue in; stronger colour means larger). The balls inside are sized by the divergence ∇·F (red for sources, purple for sinks). Add up the six face values and you get the volume integral exactly.</p>
        <p className="mt-2"><b>Try.</b> PYQ: F = 4xz i − y² j + yz k over the unit cube; ∇·F = 4z − y, so ∭ = 2 − 1/2 = 3/2, and the six faces add to the same 3/2. F = (x, y, z) has divergence 3 so the flux is 3abc (the volume times 3). The constant field leaves as much as enters: net flux 0, as the theorem predicts for ∇·F = 0.</p>
      </>}
    />
  );
}
