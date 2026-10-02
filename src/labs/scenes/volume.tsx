"use client";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { volumeUnder, type Fn2 } from "../math";
import { Pick, LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { CORE_SPECS } from "../meta/core.specs";

const FUNCS = {
  xy: { label: "z = x·y", f: ((x, y) => x * y) as Fn2, exact: (a: number, b: number) => (a * a * b * b) / 4 },
  sum: { label: "z = x² + y²", f: ((x, y) => x * x + y * y) as Fn2, exact: (a: number, b: number) => (a ** 3 * b + a * b ** 3) / 3 },
  flat: { label: "z = 3 (constant)", f: (() => 3) as Fn2, exact: (a: number, b: number) => 3 * a * b },
} as const;
type Id = keyof typeof FUNCS;

const H = 2.5;
/** Lives inside the Canvas so its ref is attached by the time the layout effect runs. */
function Columns({ f, n, a, b, zmax }: { f: Fn2; n: number; a: number; b: number; zmax: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const o = useMemo(() => new THREE.Object3D(), []);
  useLayoutEffect(() => {
    const m = ref.current; if (!m) return;
    const col = new THREE.Color();
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const x = ((i + 0.5) * a) / n, y = ((j + 0.5) * b) / n, h = Math.max(0.005, (f(x, y) / zmax) * H);
      o.position.set(((i + 0.5) / n) * a - a / 2, h / 2, ((j + 0.5) / n) * b - b / 2);
      o.scale.set((a / n) * 0.94, h, (b / n) * 0.94); o.updateMatrix();
      m.setMatrixAt(i * n + j, o.matrix);
      m.setColorAt(i * n + j, col.setHSL(0.6 - 0.5 * (f(x, y) / zmax), 0.7, 0.55));
    }
    m.count = n * n; m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [f, n, a, b, zmax, o]);
  return <instancedMesh ref={ref} args={[undefined, undefined, 40 * 40]}><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial roughness={0.5} /></instancedMesh>;
}

export default function VolumeLab() {
  const [P, set, reset] = useLabParams(CORE_SPECS.volume);
  const { id, n, a, b } = P;
  const setId = (x: (typeof P)["id"]) => set("id", x), setN = (x: (typeof P)["n"]) => set("n", x), setA = (x: (typeof P)["a"]) => set("a", x), setB = (x: (typeof P)["b"]) => set("b", x);
  const F = FUNCS[id];
  const zmax = Math.max(F.f(a, b), F.f(a, 0), F.f(0, b), 1e-6);
  const approx = volumeUnder(F.f, a, b, n), exact = F.exact(a, b);
  return (
    <LabFrame
      label="Riemann-sum columns filling the volume under a surface over a rectangle"
      animated={false}
      camera={[4.5, 4, 5]}
      onReset={reset}
      scene={() => (<group>
        <gridHelper args={[8, 16, "#3a4d57", "#26343c"]} />
        <Columns f={F.f} n={n} a={a} b={b} zmax={zmax} />
      </group>)}
      readouts={[["Columns", `${n} × ${n}`], ["Riemann sum", approx.toFixed(4)], ["Exact ∬ f dA", exact.toFixed(4)], ["Error", Math.abs(approx - exact).toExponential(2)]]}
      controls={<>
        <Pick label="Surface" value={id} options={(Object.keys(FUNCS) as Id[]).map((k) => ({ id: k, label: FUNCS[k].label }))} onChange={setId} />
        <Slider label="Grid n × n" value={n} min={1} max={40} step={1} digits={0} onChange={setN} />
        <Slider label="Width in x" value={a} min={0.5} max={3} onChange={setA} />
        <Slider label="Width in y" value={b} min={0.5} max={3} onChange={setB} />
      </>}
      note={<p>The volume under z = f(x, y) over the rectangle [0, a] × [0, b] is the double integral ∬ f dA. Each column has base ΔA = (a/n)(b/n) and height f at its centre; the sum of their volumes is the midpoint Riemann sum. Drag n up and watch the error fall towards zero. The exact values are the iterated integrals, e.g. ∫₀ᵃ∫₀ᵇ xy dy dx = a²b²/4.</p>}
    />
  );
}
