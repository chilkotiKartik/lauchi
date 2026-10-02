"use client";
import { Line } from "@react-three/drei";
import * as THREE from "three";
import { fmt, levelStatus, planeMin, sphereDist, type V3 as VV } from "../sim/mathi";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { MATHI_SPECS } from "../meta/mathi.specs";
import { Arrow } from "../kit2";
import { C, Dot, P3, Spin, Triad, type V3 } from "./mathi-kit";

const q = new THREE.Quaternion(), zAxis = new THREE.Vector3(0, 0, 1);
const orient = (n: V3) => { q.setFromUnitVectors(zAxis, new THREE.Vector3(...n).normalize()); return q.clone(); };
const vt = (v: VV) => `(${fmt(v[0], 2)}, ${fmt(v[1], 2)}, ${fmt(v[2], 2)})`;

export default function LagrangeMultLab() {
  const [P, set, reset] = useLabParams(MATHI_SPECS.lagrangemult);
  const { mode, a, b, c, p, R, r } = P;
  const plane = mode === "plane";
  const pm = planeMin(a, b, c, p), sd = sphereDist([a, b, c], R);
  const d = pm ? pm.dist : 0;
  const k = plane ? 2.6 / Math.max(d * 1.2, 1.2) : 2.8 / Math.max(Math.hypot(a, b, c) * 1.1, R, 1.2);
  const status = plane ? levelStatus(r, d) : "free";
  const lvl = status === "touch" ? C.green : status === "cut" ? C.orange : C.blue;
  const nS = P3(a, b, c), nn = Math.hypot(...nS) || 1;
  const nDir: V3 = [nS[0] / nn, nS[1] / nn, nS[2] / nn];
  const ptS: V3 = pm ? (P3(pm.pt[0] * k, pm.pt[1] * k, pm.pt[2] * k)) : [0, 0, 0];
  const rad = Math.min(r * k, 4.6);
  return (
    <LabFrame
      label={plane ? "A plane ax + by + cz = p and a growing level sphere x² + y² + z² = r² that first touches it at the constrained minimum" : "A sphere constraint, a point P and the nearest and farthest points of the sphere from P"}
      camera={[3.6, 3.4, 6.4]}
      onReset={reset}
      scene={() => (<Spin speed={0.08}>
        <Triad len={3.4} />
        <Dot p={[0, 0, 0]} r={0.07} c="#ffffff" />
        {plane && pm && (<group>
          <mesh position={[nDir[0] * d * k * Math.sign(p || 1), nDir[1] * d * k * Math.sign(p || 1), nDir[2] * d * k * Math.sign(p || 1)]} quaternion={orient(nDir)}>
            <planeGeometry args={[8, 8]} /><meshStandardMaterial color={C.purple} transparent opacity={0.3} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
          <mesh><sphereGeometry args={[Math.max(rad, 0.01), 32, 20]} /><meshStandardMaterial color={lvl} transparent opacity={0.22} depthWrite={false} /></mesh>
          <mesh><sphereGeometry args={[Math.max(rad, 0.01), 18, 12]} /><meshBasicMaterial color={lvl} wireframe transparent opacity={0.55} /></mesh>
          <Line points={[[0, 0, 0], ptS]} color={C.gold} lineWidth={2} dashed dashSize={0.1} gapSize={0.07} />
          <Dot p={ptS} r={0.13} c={C.green} glow={0.9} />
          <Arrow from={ptS} to={[ptS[0] + (ptS[0] / (Math.hypot(...ptS) || 1)) * 1.3, ptS[1] + (ptS[1] / (Math.hypot(...ptS) || 1)) * 1.3, ptS[2] + (ptS[2] / (Math.hypot(...ptS) || 1)) * 1.3]} color={C.red} />
          <Arrow from={ptS} to={[ptS[0] + nDir[0] * 1.9 * Math.sign(p || 1) * 0.7, ptS[1] + nDir[1] * 1.9 * Math.sign(p || 1) * 0.7, ptS[2] + nDir[2] * 1.9 * Math.sign(p || 1) * 0.7]} color={C.gold} />
        </group>)}
        {!plane && (<group>
          <mesh><sphereGeometry args={[R * k, 32, 20]} /><meshStandardMaterial color={C.purple} transparent opacity={0.28} depthWrite={false} /></mesh>
          <mesh><sphereGeometry args={[R * k, 18, 12]} /><meshBasicMaterial color={C.purple} wireframe transparent opacity={0.45} /></mesh>
          <Dot p={P3(a * k, b * k, c * k)} r={0.14} c={C.gold} glow={0.9} />
          <Line points={[P3(-sd.far[0] * k, -sd.far[1] * k, -sd.far[2] * k), P3(a * k, b * k, c * k)]} color="#9db0ba" lineWidth={1.5} dashed dashSize={0.1} gapSize={0.07} />
          <Dot p={P3(sd.near[0] * k, sd.near[1] * k, sd.near[2] * k)} r={0.12} c={C.green} glow={0.9} />
          <Dot p={P3(sd.far[0] * k, sd.far[1] * k, sd.far[2] * k)} r={0.12} c={C.red} glow={0.9} />
          <Line points={[P3(a * k, b * k, c * k), P3(sd.near[0] * k, sd.near[1] * k, sd.near[2] * k)]} color={C.green} lineWidth={3} />
          <Line points={[P3(a * k, b * k, c * k), P3(sd.far[0] * k, sd.far[1] * k, sd.far[2] * k)]} color={C.red} lineWidth={3} />
        </group>)}
      </Spin>)}
      readouts={plane ? [
        ["Minimum of x² + y² + z²", pm ? fmt(pm.min, 4) : "—"],
        ["Minimising point", pm ? vt(pm.pt) : "—"],
        ["Multiplier λ", pm ? fmt(pm.lambda, 4) : "—"],
        ["Distance to the plane", pm ? fmt(pm.dist, 4) : "—"],
        ["Level sphere r²", fmt(r * r, 3)],
        ["Level sphere vs plane", status === "free" ? "has not reached the plane" : status === "touch" ? "just touching: the minimum" : `cuts a circle of radius ${fmt(Math.sqrt(Math.max(0, r * r - d * d)), 3)}`],
      ] : [
        ["Nearest distance", fmt(sd.dmin, 4)],
        ["Farthest distance", fmt(sd.dmax, 4)],
        ["Nearest point", vt(sd.near)],
        ["Farthest point", vt(sd.far)],
        ["|P| from the origin", fmt(Math.hypot(a, b, c), 4)],
        ["Radius of the sphere", fmt(R, 2)],
      ]}
      controls={<>
        <Pick label="Problem" value={mode} options={[{ id: "plane", label: "Minimum of x² + y² + z² on a plane" }, { id: "sphere", label: "Distance from a point to a sphere" }]} onChange={(v) => set("mode", v)} />
        <Slider label={plane ? "Plane coefficient a" : "Point P, x"} value={a} min={-13} max={13} step={0.5} digits={1} onChange={(v) => set("a", v)} />
        <Slider label={plane ? "Plane coefficient b" : "Point P, y"} value={b} min={-13} max={13} step={0.5} digits={1} onChange={(v) => set("b", v)} />
        <Slider label={plane ? "Plane coefficient c" : "Point P, z"} value={c} min={-13} max={13} step={0.5} digits={1} onChange={(v) => set("c", v)} />
        {plane ? <Slider label="Constant p (ax + by + cz = p)" value={p} min={-30} max={30} step={0.5} digits={1} onChange={(v) => set("p", v)} /> : <Slider label="Sphere radius R" value={R} min={0.5} max={8} step={0.5} digits={1} onChange={(v) => set("R", v)} />}
        {plane && <Slider label="Level sphere radius r" value={r} min={0} max={10} step={0.1} digits={1} onChange={(v) => set("r", v)} />}
      </>}
      note={<>
        <p><b>Lagrange&apos;s method.</b> To extremise f subject to φ = 0, set F = f + λφ and solve F<sub>x</sub> = F<sub>y</sub> = F<sub>z</sub> = 0 together with φ = 0. Geometrically, f and φ are tangent at the answer, so ∇f = −λ∇φ: the red and gold arrows are parallel. In plane mode, f = x² + y² + z² grows as the level sphere (radius r) inflates; the first time it touches the purple plane gives the minimum p²/(a² + b² + c²) at (pa, pb, pc)/(a² + b² + c²).</p>
        <p className="mt-2"><b>Try.</b> PYQ: minimise x² + y² + z² when ax + by + cz = p (preset a = 1, b = 2, c = 2, p = 9 gives 9). Drag r until the sphere turns green: that is exactly r² = the minimum. Switch to the sphere problem for the PYQ &quot;maximum and minimum distance of the point (1, 2, −1) from x² + y² + z² = 24&quot;: the extremes lie on the line from the origin through P, at distances |P| ± R.</p>
      </>}
    />
  );
}
