"use client";
import { Line } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { REV_CURVES, fmt, revolve, type RevId } from "../sim/mathi";
import { Tick, useQuality } from "../Stage";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { MATHI_SPECS } from "../meta/mathi.specs";
import { mix } from "../kit2";
import { C, GeoMesh, type V3 } from "./mathi-kit";

function lathe(prof: [number, number][], sweepDeg: number, nth: number): THREE.BufferGeometry {
  const rows = prof.length, cols = nth + 1, pos = new Float32Array(rows * cols * 3), col = new Float32Array(rows * cols * 3), idx: number[] = [], c = new THREE.Color();
  const x0 = Math.min(...prof.map((p) => p[0])), x1 = Math.max(...prof.map((p) => p[0]));
  for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) {
    const ph = (sweepDeg * Math.PI / 180) * (j / nth), k = (i * cols + j) * 3;
    pos[k] = prof[i][0]; pos[k + 1] = prof[i][1] * Math.cos(ph); pos[k + 2] = prof[i][1] * Math.sin(ph);
    c.set(mix(C.blue, C.orange, (prof[i][0] - x0) / Math.max(1e-9, x1 - x0))); col[k] = c.r; col[k + 1] = c.g; col[k + 2] = c.b;
  }
  for (let i = 0; i < rows - 1; i++) for (let j = 0; j < nth; j++) { const a = i * cols + j, b = a + 1, d = a + cols, e = d + 1; idx.push(a, d, b, b, d, e); }
  const g = new THREE.BufferGeometry();
  g.setIndex(idx); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  g.computeVertexNormals();
  return g;
}

export default function RevCurvesLab() {
  const quality = useQuality();
  const [P, set, reset] = useLabParams(MATHI_SPECS.revcurves);
  const { curve, a, sweep } = P;
  const C0 = REV_CURVES[curve], r = revolve(curve, a);
  const pts = Array.from({ length: 81 }, (_, i) => C0.xy(C0.t[0] + ((C0.t[1] - C0.t[0]) * i) / 80, a));
  const xs = pts.map((p) => p[0]), x0 = Math.min(...xs), x1 = Math.max(...xs), ymax = Math.max(...pts.map((p) => p[1]));
  const s = 4.4 / Math.max(x1 - x0, 2 * ymax), xm = (x0 + x1) / 2;
  const prof: [number, number][] = pts.map((p) => [(p[0] - xm) * s, p[1] * s]);
  const geo = useMemo(() => lathe(prof, Math.max(sweep, 1), quality === "low" ? 28 : 48), [curve, a, sweep, quality]); // eslint-disable-line react-hooks/exhaustive-deps
  const line: V3[] = prof.map((p) => [p[0], p[1], 0]);
  const gen = useRef<THREE.Group>(null), t = useRef(0);
  const tick = (dt: number) => { t.current += Math.min(dt, 0.05) * 0.8; if (gen.current) gen.current.rotation.x = ((t.current % (2 * Math.PI)) / (2 * Math.PI)) * (sweep * Math.PI) / 180; };
  const frac = sweep / 360;
  return (
    <LabFrame
      label="A parametric curve spinning about the x-axis to sweep out a coloured solid of revolution"
      camera={[0, 2.8, 7.2]}
      onReset={reset}
      scene={() => (<group>
        <Tick fn={tick} />
        <Line points={[[-3.2, 0, 0], [3.2, 0, 0]]} color={C.light} lineWidth={2} />
        <GeoMesh geo={geo} o={0.8} />
        <group ref={gen}><Line points={line} color={C.gold} lineWidth={5} /></group>
        <Line points={prof.map((p) => [p[0], -p[1], 0] as V3)} color={C.light} lineWidth={1.5} dashed dashSize={0.1} gapSize={0.08} />
      </group>)}
      readouts={[
        ["Volume V = π∫y² dx", fmt(r.V, 4)],
        ["Surface area S = 2π∫y ds", fmt(r.S, 4)],
        ["Arc length L", fmt(r.L, 4)],
        ["Arc centroid ȳ = S / 2πL", fmt(r.yBar, 4)],
        ["Swept part of the volume", fmt(r.V * frac, 4)],
        ["Curve", C0.eq],
      ]}
      controls={<>
        <Slider label="Scale a" value={a} min={0.5} max={2.5} step={0.05} digits={2} onChange={(v) => set("a", v)} />
        <Pick label="Curve" value={curve} options={(Object.keys(REV_CURVES) as RevId[]).map((k) => ({ id: k, label: REV_CURVES[k].label }))} onChange={(v) => set("curve", v)} />
        <Slider label="Sweep angle" value={sweep} min={0} max={360} step={5} digits={0} unit="°" onChange={(v) => set("sweep", v)} />
      </>}
      note={<>
        <p><b>Parametric curves revolved about the x-axis.</b> V = π∫y² |dx/dt| dt, S = 2π∫y √(x′² + y′²) dt, arc length L = ∫√(x′² + y′²) dt, all over the parameter range. By Pappus&apos;s theorem S = 2πȳL, where ȳ is the distance of the curve&apos;s centroid from the axis. The gold curve is the generator; it rotates through the sweep angle.</p>
        <p className="mt-2"><b>Try.</b> PYQ: the astroid x = a cos³t, y = a sin³t gives V = 32πa³/105 and S = 12πa²/5 (a = 1: 0.957 and 7.54). One arch of the cycloid gives V = 5π²a³ and S = 64πa²/3. The loop of y² = x²(x + 4) gives V = 64π/3 ≈ 67.02. Check scaling: doubling a multiplies V by 8 and S by 4.</p>
      </>}
    />
  );
}
