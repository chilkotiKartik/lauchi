"use client";
import { Line } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";
import { SURFACES, circleExtrema, criticalPoints, fx, fy } from "../math";
import { useQuality } from "../Stage";
import { Check, LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { CORE_SPECS } from "../meta/core.specs";

const W = 3; // world half-width
const KIND_COLOR = { min: "#44c95a", max: "#ff5a5f", saddle: "#ffc83d", unclear: "#a970ff" } as const;

export default function SurfaceLab() {
  const quality = useQuality();
  const [P, set, reset] = useLabParams(CORE_SPECS.surface);
  const { id, lagr, r, px, py } = P;
  const setId = (x: (typeof P)["id"]) => set("id", x), setLagr = (x: (typeof P)["lagr"]) => set("lagr", x), setR = (x: (typeof P)["r"]) => set("r", x), setPx = (x: (typeof P)["px"]) => set("px", x), setPy = (x: (typeof P)["py"]) => set("py", x);
  const S = SURFACES.find((s) => s.id === id)!;
  const { f, range, zcap } = S;
  const pos = (x: number, y: number, z: number): [number, number, number] => [
    (x / range) * W, (Math.max(-zcap, Math.min(zcap, z)) / zcap) * 2, (y / range) * W,
  ];

  const seg = quality === "low" ? 48 : 90;
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(2 * W, 2 * W, seg, seg);
    const p = g.attributes.position, col = new Float32Array(p.count * 3), c = new THREE.Color();
    for (let i = 0; i < p.count; i++) {
      const x = (p.getX(i) / W) * range, y = (p.getY(i) / W) * range, z = f(x, y);
      const clamped = Math.max(-zcap, Math.min(zcap, z));
      p.setXYZ(i, p.getX(i), (clamped / zcap) * 2, p.getY(i));
      c.setHSL(0.6 - 0.45 * ((clamped / zcap + 1) / 2), 0.7, 0.5);
      col.set([c.r, c.g, c.b], i * 3);
    }
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    g.computeVertexNormals();
    return g;
  }, [f, range, zcap, seg]);

  const crit = useMemo(() => criticalPoints(f, range), [f, range]);
  const ring = useMemo(() => {
    const pts: [number, number, number][] = [];
    for (let i = 0; i <= 180; i++) { const t = (i / 180) * 2 * Math.PI; pts.push(pos(r * Math.cos(t), r * Math.sin(t), f(r * Math.cos(t), r * Math.sin(t)))); }
    return pts;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f, r, range, zcap]);
  const floor = useMemo(() => ring.map(([x, , z]): [number, number, number] => [x, -2.05, z]), [ring]);
  const ext = useMemo(() => circleExtrema(f, r), [f, r]);

  const z0 = f(px, py), gx = fx(f)(px, py), gy = fy(f)(px, py), gm = Math.hypot(gx, gy);
  const arrow: [number, number, number][] = gm > 1e-6
    ? [pos(px, py, z0), [pos(px, py, z0)[0] + (gx / gm) * 0.8, pos(px, py, z0)[1], pos(px, py, z0)[2] + (gy / gm) * 0.8]] : [pos(px, py, z0), pos(px, py, z0)];
  const fmt = (n: number) => (Math.abs(n) < 5e-4 ? 0 : n).toFixed(3);

  return (
    <LabFrame
      label={`3D surface z = ${S.label} with critical points`}
      animated={false}
      onReset={reset}
      scene={() => (
        <group>
          <mesh geometry={geo}><meshStandardMaterial vertexColors side={THREE.DoubleSide} roughness={0.6} /></mesh>
          <gridHelper args={[2 * W, 12, "#3a4d57", "#26343c"]} position={[0, -2.05, 0]} />
          {crit.map((c, i) => (
            <mesh key={i} position={pos(c.x, c.y, c.z)}><sphereGeometry args={[0.09, 16, 16]} /><meshStandardMaterial color={KIND_COLOR[c.kind]} emissive={KIND_COLOR[c.kind]} emissiveIntensity={0.5} /></mesh>
          ))}
          <mesh position={pos(px, py, z0)}><sphereGeometry args={[0.07, 16, 16]} /><meshStandardMaterial color="#fff" /></mesh>
          <Line points={arrow} color="#ffffff" lineWidth={3} />
          {lagr && (<>
            <Line points={ring} color="#a970ff" lineWidth={3} />
            <Line points={floor} color="#a970ff" lineWidth={2} dashed dashSize={0.1} gapSize={0.06} />
            <mesh position={pos(ext.max.x, ext.max.y, ext.max.z)}><sphereGeometry args={[0.1, 16, 16]} /><meshStandardMaterial color="#ff5a5f" /></mesh>
            <mesh position={pos(ext.min.x, ext.min.y, ext.min.z)}><sphereGeometry args={[0.1, 16, 16]} /><meshStandardMaterial color="#2ba6f5" /></mesh>
          </>)}
        </group>
      )}
      readouts={[
        ["f(x, y)", fmt(z0)], ["∂f/∂x", fmt(gx)], ["∂f/∂y", fmt(gy)], ["|∇f|", fmt(gm)],
        ...crit.slice(0, 4).map((c, i): [string, string] => [`Point ${i + 1} · ${c.kind}`, `(${fmt(c.x)}, ${fmt(c.y)}) f=${fmt(c.z)}`]),
        ...(lagr ? ([["Max on circle", fmt(ext.max.z)], ["Min on circle", fmt(ext.min.z)]] as [string, string][]) : []),
      ]}
      controls={<>
        <Pick label="Surface" value={id} options={SURFACES.map((s) => ({ id: s.id, label: `z = ${s.label}` }))} onChange={setId} />
        <Slider label="Probe x" value={px} min={-range} max={range} onChange={setPx} />
        <Slider label="Probe y" value={py} min={-range} max={range} onChange={setPy} />
        <Check label="Lagrange: constrain to x² + y² = r²" checked={lagr} onChange={setLagr} />
        {lagr && <Slider label="Radius r" value={r} min={0.2} max={range * 0.9} onChange={setR} />}
      </>}
      note={<>
        <p><b>How to read it.</b> Height is f(x, y) (clipped to keep the view readable). Green dots are local minima, red are maxima, yellow are saddle points — found numerically where ∇f = 0 and classified by the second-derivative test D = f<sub>xx</sub>f<sub>yy</sub> − f<sub>xy</sub>². The white arrow is the gradient at your probe, the direction of steepest ascent.</p>
        <p className="mt-2"><b>Lagrange.</b> Turn on the constraint: the purple curve is the surface restricted to the circle. The red and blue dots are its highest and lowest points — exactly where ∇f is parallel to ∇g.</p>
      </>}
    />
  );
}
