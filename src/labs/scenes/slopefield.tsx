"use client";
import { Line } from "@react-three/drei";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { ODES, rk4Path, slopeLab, type OdeId } from "../sim/mathsb";
import { Tick, useQuality } from "../Stage";
import { LabFrame, Slider, Pick } from "../ui";
import { useLabParams } from "../params";
import { MATHSB_SPECS } from "../meta/mathsb.specs";

const XM = 4, YM = 3;

/** The slope field: one short instanced segment per grid point, coloured from flat (blue) to steep (red). */
function FieldSegments({ id, step }: { id: OdeId; step: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const o = useMemo(() => new THREE.Object3D(), []);
  useLayoutEffect(() => {
    const m = ref.current; if (!m) return;
    const f = ODES[id].f, col = new THREE.Color();
    let n = 0;
    for (let x = -XM; x <= XM + 1e-9; x += step) for (let y = -YM; y <= YM + 1e-9; y += step) {
      const s = f(x, y), a = Number.isFinite(s) ? Math.atan(s) : Math.PI / 2;
      o.position.set(x, y, 0); o.rotation.set(0, 0, a); o.scale.set(step * 0.6, 1, 1); o.updateMatrix();
      m.setMatrixAt(n, o.matrix);
      m.setColorAt(n, col.setHSL(0.58 - 0.58 * (Math.abs(a) / (Math.PI / 2)), 0.85, 0.6));
      n++;
    }
    m.count = n; m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [id, step, o]);
  return <instancedMesh ref={ref} args={[undefined, undefined, 400]}><boxGeometry args={[1, 0.05, 0.05]} /><meshStandardMaterial roughness={0.5} /></instancedMesh>;
}

/** Puts two objects at fraction u of the way along a polyline (module-level so the render stays pure). */
function place(a: THREE.Object3D | null, b: THREE.Object3D | null, pts: [number, number, number][], u: number) {
  const ok = pts.length >= 2;
  if (a) a.visible = ok;
  if (b) b.visible = ok;
  if (!ok) return;
  const f = u * (pts.length - 1), i = Math.min(pts.length - 2, Math.floor(f)), t = f - i, p = pts[i], q = pts[i + 1];
  const x = p[0] + (q[0] - p[0]) * t, y = p[1] + (q[1] - p[1]) * t;
  a?.position.set(x, y, 0.1); b?.position.set(x, y, 0.1);
}

export default function SlopeFieldLab() {
  const quality = useQuality();
  const [P, set, reset] = useLabParams(MATHSB_SPECS.slopefield);
  const { id, x0, y0, x1 } = P;
  const ode = ODES[id];
  const out = slopeLab(id, x0, y0, x1);
  const pts = useMemo(() => {
    const fw = rk4Path(ode.f, x0, y0, XM, 0.04, YM * 1.15, ode.maxSlope), bw = rk4Path(ode.f, x0, y0, -XM, 0.04, YM * 1.15, ode.maxSlope);
    return [...bw.slice().reverse(), ...fw.slice(1)].map(([x, y]) => [x, y, 0.05] as [number, number, number]);
  }, [ode, x0, y0]);
  const core = useRef<THREE.Mesh>(null), halo = useRef<THREE.Mesh>(null), prog = useRef(0);
  const tick = (dt: number) => { prog.current = (prog.current + Math.min(dt, 0.05) * 0.16) % 1; place(core.current, halo.current, pts, prog.current); };
  const yShow = out.yRk !== null && Math.abs(out.yRk) <= YM;
  const slopeTxt = Number.isFinite(out.slope) ? out.slope.toFixed(3) : "vertical / undefined";
  return (
    <LabFrame
      label="Slope field of a first-order differential equation with a glowing particle riding the RK4 solution curve"
      camera={[1.5, -2.5, 12]}
      onReset={reset}
      scene={() => (<group>
        <Tick fn={tick} />
        <mesh position={[0, 0, -0.15]}><planeGeometry args={[2 * XM + 0.6, 2 * YM + 0.6]} /><meshStandardMaterial color="#16262e" /></mesh>
        <Line points={[[-XM, 0, -0.05], [XM, 0, -0.05]]} color="#5b6d77" lineWidth={1.5} />
        <Line points={[[0, -YM, -0.05], [0, YM, -0.05]]} color="#5b6d77" lineWidth={1.5} />
        <FieldSegments id={id} step={quality === "low" ? 0.8 : 0.5} />
        {pts.length >= 2 && <Line points={pts} color="#ffc83d" lineWidth={3} />}
        <Line points={[[x1, -YM, 0], [x1, YM, 0]]} color="#a970ff" lineWidth={1.5} dashed dashSize={0.15} gapSize={0.12} />
        {yShow && <mesh position={[x1, out.yRk ?? 0, 0.12]}><sphereGeometry args={[0.1, 16, 12]} /><meshStandardMaterial color="#44c95a" emissive="#44c95a" emissiveIntensity={0.5} /></mesh>}
        <mesh position={[x0, y0, 0.1]}><sphereGeometry args={[0.11, 16, 12]} /><meshStandardMaterial color="#ff5a5f" emissive="#ff5a5f" emissiveIntensity={0.5} /></mesh>
        <mesh ref={halo}><sphereGeometry args={[0.24, 16, 12]} /><meshBasicMaterial color="#ffc83d" transparent opacity={0.28} depthWrite={false} /></mesh>
        <mesh ref={core}><sphereGeometry args={[0.12, 16, 12]} /><meshBasicMaterial color="#fff3c4" /></mesh>
      </group>)}
      readouts={[
        ["y(x₁) by RK4", out.yRk === null ? "— (blows up / vertical)" : out.yRk.toFixed(5)],
        ["Exact y(x₁)", out.exact === null ? "not defined at x₁" : out.exact.toFixed(5)],
        ["|RK4 − exact|", out.err === null ? "—" : out.err.toExponential(1)],
        ["Equation type", out.type],
        ["Slope at (x₀, y₀)", slopeTxt],
      ]}
      controls={<>
        <Pick label="Equation dy/dx =" value={id} options={(Object.keys(ODES) as OdeId[]).map((k) => ({ id: k, label: ODES[k].label }))} onChange={(v) => set("id", v)} />
        <Slider label="Start x₀" value={x0} min={-3} max={3} step={0.1} digits={1} onChange={(v) => set("x0", v)} />
        <Slider label="Start y₀" value={y0} min={-2.5} max={2.5} step={0.1} digits={1} onChange={(v) => set("y0", v)} />
        <Slider label="Evaluate at x₁" value={x1} min={-3} max={3} step={0.1} digits={1} onChange={(v) => set("x1", v)} />
      </>}
      note={<p>Each short segment has the slope f(x, y) of the equation at its own point (blue is flat, red is steep), so a solution curve simply follows the segments. The gold curve is the solution through the red point (x₀, y₀), integrated with fourth-order Runge–Kutta in both directions; the bright particle travels along it. The purple line marks x₁ and the green dot is the RK4 value there, compared with the closed form: linear y′ + y = x is solved with the integrating factor eˣ, y′ = y·cos x by separating variables (y = y₀·e^(sin x − sin x₀)), y′ = y(1 − y) is Bernoulli, and −x/y is exact with x² + y² = c. Try the circle: the solution cannot pass the vertical tangent at x = ±radius, and RK4 reports it.</p>}
    />
  );
}
