"use client";
import { Line } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";
import { SURFACES, circleExtrema, criticalPoints, fx, fy } from "../math";
import { useQuality } from "../Stage";
import { Check, LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { CORE_SPECS } from "../meta/core.specs";

const W = 3;
const KIND_COLOR = { min: "#22c55e", max: "#ef4444", saddle: "#eab308", unclear: "#a855f7" } as const;

export default function SurfaceLab() {
  const quality = useQuality();
  const [P, set, reset] = useLabParams(CORE_SPECS.surface);
  const { id, lagr, r, px, py } = P;
  const setId = (x: (typeof P)["id"]) => set("id", x);
  const setLagr = (x: (typeof P)["lagr"]) => set("lagr", x);
  const setR = (x: (typeof P)["r"]) => set("r", x);
  const setPx = (x: (typeof P)["px"]) => set("px", x);
  const setPy = (x: (typeof P)["py"]) => set("py", x);

  const S = SURFACES.find((s) => s.id === id)!;
  const { f, range, zcap } = S;
  const pos = (x: number, y: number, z: number): [number, number, number] => [
    (x / range) * W,
    (Math.max(-zcap, Math.min(zcap, z)) / zcap) * 2,
    (y / range) * W,
  ];

  const seg = quality === "low" ? 48 : 96;
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(2 * W, 2 * W, seg, seg);
    const p = g.attributes.position,
      col = new Float32Array(p.count * 3),
      c = new THREE.Color();
    for (let i = 0; i < p.count; i++) {
      const x = (p.getX(i) / W) * range,
        y = (p.getY(i) / W) * range,
        z = f(x, y);
      const clamped = Math.max(-zcap, Math.min(zcap, z));
      p.setXYZ(i, p.getX(i), (clamped / zcap) * 2, p.getY(i));
      // Topographic elevation colormap: deep ocean blue -> emerald -> amber -> ruby summit
      const norm = (clamped / zcap + 1) / 2;
      c.setHSL(0.55 - 0.55 * norm, 0.85, 0.48);
      col.set([c.r, c.g, c.b], i * 3);
    }
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    g.computeVertexNormals();
    return g;
  }, [f, range, zcap, seg]);

  const crit = useMemo(() => criticalPoints(f, range), [f, range]);
  const ring = useMemo(() => {
    const pts: [number, number, number][] = [];
    for (let i = 0; i <= 180; i++) {
      const t = (i / 180) * 2 * Math.PI;
      pts.push(pos(r * Math.cos(t), r * Math.sin(t), f(r * Math.cos(t), r * Math.sin(t))));
    }
    return pts;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f, r, range, zcap]);
  const floor = useMemo(() => ring.map(([x, , z]): [number, number, number] => [x, -2.05, z]), [ring]);
  const ext = useMemo(() => circleExtrema(f, r), [f, r]);

  const z0 = f(px, py),
    gx = fx(f)(px, py),
    gy = fy(f)(px, py),
    gm = Math.hypot(gx, gy);
  const probeP = pos(px, py, z0);

  // Gradient vector in 3D
  const gradArrow: [number, number, number][] =
    gm > 1e-6
      ? [probeP, [probeP[0] + (gx / gm) * 0.9, probeP[1], probeP[2] + (gy / gm) * 0.9]]
      : [probeP, probeP];

  // Normal vector: (-fx, 1, -fy) normalized
  const nLen = Math.hypot(gx, 1, gy);
  const normArrow: [number, number, number][] = [
    probeP,
    [probeP[0] - (gx / nLen) * 0.8, probeP[1] + (1 / nLen) * 0.8, probeP[2] - (gy / nLen) * 0.8],
  ];

  // Tangent plane patch (quad of corners around probe)
  const tanCorners = useMemo(() => {
    const delta = 0.6;
    const corners: [number, number, number][] = [
      [px - delta, py - delta, z0 - gx * delta - gy * delta],
      [px + delta, py - delta, z0 + gx * delta - gy * delta],
      [px + delta, py + delta, z0 + gx * delta + gy * delta],
      [px - delta, py + delta, z0 - gx * delta + gy * delta],
      [px - delta, py - delta, z0 - gx * delta - gy * delta],
    ];
    return corners.map(([x, y, z]) => pos(x, y, z));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [px, py, z0, gx, gy, range, zcap]);

  const fmt = (n: number) => (Math.abs(n) < 5e-4 ? 0 : n).toFixed(3);

  return (
    <LabFrame
      label={`Multivariable Calculus: 3D surface z = ${S.label}, gradient vector, tangent plane, and critical point extrema`}
      animated={false}
      onReset={reset}
      note={
        <p>
          Height represents the multivariable function <b>z = f(x, y)</b>. The white arrow represents the <b>gradient vector ∇f = (∂f/∂x, ∂f/∂y)</b> showing the direction of steepest ascent. The translucent grid quad represents the <b>tangent plane</b> and its upward normal vector. Critical points occur where ∇f = 0 (minima in green, maxima in red, saddles in yellow).
        </p>
      }
      scene={() => (
        <group>
          {/* Glass Pedestal Base */}
          <mesh position={[0, -2.12, 0]}>
            <boxGeometry args={[2 * W + 0.6, 0.12, 2 * W + 0.6]} />
            <meshStandardMaterial color="#0b111e" roughness={0.2} metalness={0.8} />
          </mesh>

          {/* Coordinate Reference Floor Grid */}
          <gridHelper args={[2 * W, 12, "#38bdf8", "#1e293b"]} position={[0, -2.05, 0]} />

          {/* High-Gloss Continuous 3D Surface */}
          <mesh geometry={geo}>
            <meshStandardMaterial vertexColors side={THREE.DoubleSide} roughness={0.35} metalness={0.2} />
          </mesh>

          {/* Tangent Plane Tile & Wireframe Border */}
          <Line points={tanCorners} color="#38bdf8" lineWidth={2.5} />

          {/* Critical Point Extrema Spheres & Glowing Halo Rings */}
          {crit.map((c, i) => (
            <group key={i} position={pos(c.x, c.y, c.z)}>
              <mesh>
                <sphereGeometry args={[0.11, 24, 24]} />
                <meshStandardMaterial
                  color={KIND_COLOR[c.kind]}
                  emissive={KIND_COLOR[c.kind]}
                  emissiveIntensity={0.8}
                  metalness={0.3}
                />
              </mesh>
              {/* Drop-line to floor */}
              <Line
                points={[
                  [0, 0, 0],
                  [0, -2.05 - pos(c.x, c.y, c.z)[1], 0],
                ]}
                color={KIND_COLOR[c.kind]}
                lineWidth={1}
                dashed
                dashSize={0.08}
                gapSize={0.06}
              />
            </group>
          ))}

          {/* Active Probe Sphere & Laser Beams */}
          <group position={probeP}>
            <mesh>
              <sphereGeometry args={[0.09, 24, 24]} />
              <meshStandardMaterial color="#ffffff" emissive="#38bdf8" emissiveIntensity={1.2} />
            </mesh>
          </group>

          {/* Gradient Vector (White Arrow) */}
          <Line points={gradArrow} color="#ffffff" lineWidth={3.5} />

          {/* Surface Normal Vector (Cyan Arrow) */}
          <Line points={normArrow} color="#38bdf8" lineWidth={2.5} />

          {/* Lagrange Multipliers Constraint Loop */}
          {lagr && (
            <>
              <Line points={ring} color="#a855f7" lineWidth={3.5} />
              <Line points={floor} color="#a855f7" lineWidth={2} dashed dashSize={0.1} gapSize={0.06} />
              <mesh position={pos(ext.max.x, ext.max.y, ext.max.z)}>
                <sphereGeometry args={[0.12, 24, 24]} />
                <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.9} />
              </mesh>
              <mesh position={pos(ext.min.x, ext.min.y, ext.min.z)}>
                <sphereGeometry args={[0.12, 24, 24]} />
                <meshStandardMaterial color="#0284c7" emissive="#0284c7" emissiveIntensity={0.9} />
              </mesh>
            </>
          )}
        </group>
      )}
      readouts={[
        ["Function z = f(x, y)", fmt(z0)],
        ["Partial derivative ∂f/∂x", fmt(gx)],
        ["Partial derivative ∂f/∂y", fmt(gy)],
        ["Gradient norm |∇f|", fmt(gm)],
        ...crit
          .slice(0, 4)
          .map((c, i): [string, string] => [
            `Extremum ${i + 1} (${c.kind.toUpperCase()})`,
            `(${fmt(c.x)}, ${fmt(c.y)}) z=${fmt(c.z)}`,
          ]),
        ...(lagr
          ? ([
              ["Lagrange Circle Max", fmt(ext.max.z)],
              ["Lagrange Circle Min", fmt(ext.min.z)],
            ] as [string, string][])
          : []),
      ]}
      controls={
        <>
          <Pick label="Surface Type" value={id} options={SURFACES.map((s) => ({ id: s.id, label: `z = ${s.label}` }))} onChange={setId} />
          <Slider label="Probe coordinate x" value={px} min={-range} max={range} step={0.05} onChange={setPx} />
          <Slider label="Probe coordinate y" value={py} min={-range} max={range} step={0.05} onChange={setPy} />
          <Check label="Lagrange Constraint (x² + y² = r²)" checked={lagr} onChange={setLagr} />
          {lagr && <Slider label="Circle Radius r" value={r} min={0.2} max={range * 0.9} step={0.05} onChange={setR} />}
        </>
      }
    />
  );
}
