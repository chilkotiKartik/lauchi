"use client";
import { Line } from "@react-three/drei";
import { useMemo, useRef } from "react";
import { T2_FUNCS, fmt, taylor2, taylor2Terms, type T2Id } from "../sim/mathi";
import { Tick, useQuality } from "../Stage";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { MATHI_SPECS } from "../meta/mathi.specs";
import { mix } from "../kit2";
import { C, Dot, GeoMesh, Grid, P3, Triad, surfaceGeo } from "./mathi-kit";
import type * as THREE from "three";

const ZS = 0.42, XR: [number, number] = [-1.5, 1.5], YR: [number, number] = [-0.9, 1.5];

export default function Taylor2VarLab() {
  const quality = useQuality();
  const [P, set, reset] = useLabParams(MATHI_SPECS.taylor2var);
  const { fn, n, x, y } = P;
  const r = taylor2(fn, n, x, y);
  const N = quality === "low" ? 24 : 36;
  const exact = useMemo(() => surfaceGeo(T2_FUNCS[fn].f, XR, YR, N, (_x, _y, z) => mix(C.blue, C.green, (z + 2) / 5), ZS, 5), [fn, N]);
  const poly = useMemo(() => surfaceGeo((a, b) => taylor2(fn, n, a, b).p, XR, YR, N, (_x, _y, z) => mix(C.gold, C.orange, (z + 2) / 5), ZS, 5), [fn, n, N]);
  const grp = useRef<THREE.Group>(null), t = useRef(0);
  const tick = (dt: number) => { t.current += Math.min(dt, 0.05); grp.current?.rotation.set(0, Math.sin(t.current * 0.3) * 0.5, 0); };
  const zf = Math.max(-5, Math.min(5, r.f)) * ZS, zp = Math.max(-5, Math.min(5, r.p)) * ZS;
  const [X, , Z] = P3(x, y, 0);
  const terms = n <= 3 ? taylor2Terms(fn, n) : `${r.terms} non-zero terms`;
  return (
    <LabFrame
      label="Two surfaces over the xy-plane: the true function and its Taylor polynomial, with a red bar showing the error at the chosen point"
      camera={[0, 4.4, 6.6]}
      onReset={reset}
      scene={() => (<group>
        <Tick fn={tick} />
        <group ref={grp} scale={1.7} position={[0, -0.6, 0]}>
          <Grid size={4} />
          <Triad len={1.8} />
          <GeoMesh geo={exact} o={0.9} />
          <GeoMesh geo={poly} o={0.5} />
          <Line points={[[X, 0, Z], [X, Math.max(zf, zp), Z]]} color="#9db0ba" lineWidth={1} dashed dashSize={0.05} gapSize={0.04} />
          <Line points={[[X, zf, Z], [X, zp, Z]]} color={C.red} lineWidth={5} />
          <Dot p={[X, zf, Z]} r={0.05} c={C.blue} />
          <Dot p={[X, zp, Z]} r={0.05} c={C.gold} />
          <Dot p={[0, T2_FUNCS[fn].f(0, 0) * ZS, 0]} r={0.05} c={C.purple} />
        </group>
      </group>)}
      readouts={[
        ["Exact f(x, y)", fmt(r.f, 5)],
        [`Taylor P${n}(x, y)`, fmt(r.p, 5)],
        ["Error Pₙ − f", fmt(r.err, 5)],
        ["Non-zero terms", String(r.terms)],
        ["Polynomial", terms],
        ["Degree n", String(n)],
      ]}
      controls={<>
        <Slider label="Degree n" value={n} min={1} max={6} step={1} digits={0} onChange={(v) => set("n", v)} />
        <Pick label="Function f(x, y)" value={fn} options={(Object.keys(T2_FUNCS) as T2Id[]).map((k) => ({ id: k, label: T2_FUNCS[k].label }))} onChange={(v) => set("fn", v)} />
        <Slider label="Point x" value={x} min={-1.5} max={1.5} step={0.05} digits={2} onChange={(v) => set("x", v)} />
        <Slider label="Point y" value={y} min={-0.9} max={1.5} step={0.05} digits={2} onChange={(v) => set("y", v)} />
      </>}
      note={<>
        <p><b>Taylor&apos;s theorem in two variables</b> (about the origin, a Maclaurin series): f(x, y) = f + (x f<sub>x</sub> + y f<sub>y</sub>) + 1/2!(x² f<sub>xx</sub> + 2xy f<sub>xy</sub> + y² f<sub>yy</sub>) + 1/3!(…) + …. Each degree adds the terms x<sup>i</sup>y<sup>j</sup> with i + j = n. The blue-green surface is the true function; the translucent gold surface is the polynomial of degree n.</p>
        <p className="mt-2"><b>Try.</b> Pick e<sup>x</sup> sin y and degree 3: the polynomial is y + xy + x²y/2 − y³/6 (PYQ: expand e<sup>x</sup> sin y up to third-degree terms). For e<sup>x</sup> log(1 + y) the first six terms are exactly the terms up to degree 3. Raise the degree and watch the gold surface sink into the true one; the red bar is the error at your point. Near the origin the fit is excellent; far from it, or for y close to −1 with the logarithm, it is poor.</p>
      </>}
    />
  );
}
