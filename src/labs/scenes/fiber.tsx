"use client";
import { Line } from "@react-three/drei";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { fiber, toRad } from "../sim/physics";
import { Tick } from "../Stage";
import { LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { PHYSICS_SPECS } from "../meta/physics.specs";

const X0 = -5, X1 = 5, RC = 0.6, RCL = 1.0, AIR = 1.7, BEADS = 5;
const dummy = new THREE.Object3D();

interface RayPath {
  /** x, y pairs of the vertices along the ray. */
  xy: number[];
  /** Cumulative length at each vertex. */
  cum: number[];
  total: number;
  /** Index of the vertex where the ray leaves the core (−1 when it is guided). */
  lossIdx: number;
}

/** Piecewise-linear ray: air → end face → bounces (or refraction out at the first wall hit). Pure, memoised by the scene. */
function rayPath(n1: number, n2: number, launchDeg: number, guided: boolean): RayPath {
  const ti = toRad(launchDeg), thr = Math.asin(Math.sin(ti) / n1), t = Math.tan(thr);
  const xy: number[] = [X0 - AIR * Math.cos(ti), -AIR * Math.sin(ti), X0, 0];
  let x = X0, y = 0, dir = 1, lossIdx = -1;
  if (t > 1e-6) {
    for (let b = 0; b < 80; b++) {
      const xw = x + (RC - dir * y) / t;           // where the ray next reaches a wall
      if (xw >= X1) { xy.push(X1, y + dir * t * (X1 - x)); break; }
      xy.push(xw, dir * RC);
      if (!guided) {
        const s = Math.min(1, (n1 * Math.cos(thr)) / n2), tt = Math.asin(s);   // refraction angle from the wall normal
        const dx = Math.min(Math.tan(tt) * (RCL - RC), 6);
        lossIdx = xy.length / 2 - 1;
        xy.push(Math.min(xw + dx, X1 + 0.8), dir * RCL);
        break;
      }
      x = xw; y = dir * RC; dir = -dir;
    }
  } else xy.push(X1, 0);
  const cum = [0];
  for (let i = 2; i < xy.length; i += 2) cum.push(cum[cum.length - 1] + Math.hypot(xy[i] - xy[i - 2], xy[i + 1] - xy[i - 1]));
  return { xy, cum, total: cum[cum.length - 1], lossIdx };
}

function paintPulses(mesh: THREE.InstancedMesh, p: RayPath, t: number) {
  for (let b = 0; b < BEADS; b++) {
    const s = (((t * 2.6 + (b * p.total) / BEADS) % p.total) + p.total) % p.total;
    let k = 1;
    while (k < p.cum.length - 1 && p.cum[k] < s) k++;
    const seg = p.cum[k] - p.cum[k - 1], u = seg > 1e-9 ? (s - p.cum[k - 1]) / seg : 0;
    const ax = p.xy[2 * (k - 1)], ay = p.xy[2 * (k - 1) + 1], bx = p.xy[2 * k], by = p.xy[2 * k + 1];
    dummy.position.set(ax + (bx - ax) * u, ay + (by - ay) * u, 0);
    dummy.scale.setScalar(1);
    dummy.updateMatrix(); mesh.setMatrixAt(b, dummy.matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
}

function Pulses({ path, guided }: { path: RayPath; guided: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null), t = useRef(0);
  useLayoutEffect(() => { if (ref.current) paintPulses(ref.current, path, t.current); }, [path]);
  const tick = (dt: number) => { t.current += Math.min(dt, 0.05); if (ref.current) paintPulses(ref.current, path, t.current); };
  const c = guided ? "#ffc83d" : "#ff5a5f";
  return (<>
    <Tick fn={tick} />
    <instancedMesh ref={ref} args={[undefined, undefined, BEADS]} frustumCulled={false}><sphereGeometry args={[0.12, 14, 10]} /><meshStandardMaterial color={c} emissive={c} emissiveIntensity={0.9} /></instancedMesh>
  </>);
}

export default function FiberLab() {
  const [P, set, reset] = useLabParams(PHYSICS_SPECS.fiber);
  const { launch, n1, n2 } = P;
  const setLaunch = (x: (typeof P)["launch"]) => set("launch", x), setN1 = (x: (typeof P)["n1"]) => set("n1", x), setN2 = (x: (typeof P)["n2"]) => set("n2", x);
  const f = fiber(n1, n2, launch);
  const path = useMemo(() => rayPath(n1, n2, launch, f.guided), [n1, n2, launch, f.guided]);
  const split = path.lossIdx >= 0 ? path.lossIdx : path.xy.length / 2 - 1;
  const good = useMemo(() => { const pts: [number, number, number][] = []; for (let i = 0; i <= split; i++) pts.push([path.xy[2 * i], path.xy[2 * i + 1], 0.05]); return pts; }, [path, split]);
  const lost = useMemo(() => { const pts: [number, number, number][] = []; if (path.lossIdx >= 0) for (let i = path.lossIdx; i < path.xy.length / 2; i++) pts.push([path.xy[2 * i], path.xy[2 * i + 1], 0.05]); return pts; }, [path]);
  const lostEnd = lost.length ? lost[lost.length - 1] : null;
  const coneR = f.acceptDeg === null ? 0 : Math.min(AIR * Math.tan(toRad(f.acceptDeg)), 3.4);
  const wall = `${f.wallDeg.toFixed(1)}°`;
  return (
    <LabFrame
      label="A light pulse entering an optical fibre: guided by total internal reflection inside the core, or refracting out into the cladding"
      camera={[1, 2.4, 11]}
      onReset={reset}
      scene={() => (<group>
        <mesh rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[RC, RC, X1 - X0, 40, 1]} /><meshStandardMaterial color="#2ba6f5" transparent opacity={0.4} roughness={0.2} depthWrite={false} /></mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[RCL, RCL, X1 - X0, 40, 1, true]} /><meshStandardMaterial color="#a970ff" transparent opacity={0.2} side={THREE.DoubleSide} depthWrite={false} /></mesh>
        <Line points={[[X0 - 1.7, 0, 0], [X1 + 0.6, 0, 0]]} color="#5b6d77" lineWidth={1} />
        {coneR > 0 && (
          <mesh position={[X0 - AIR / 2, 0, 0]} rotation={[0, 0, -Math.PI / 2]}><coneGeometry args={[coneR, AIR, 32, 1, true]} /><meshBasicMaterial color="#44c95a" transparent opacity={0.16} side={THREE.DoubleSide} depthWrite={false} /></mesh>
        )}
        <Line points={good} color="#ffc83d" lineWidth={3} />
        {lost.length > 1 && <Line points={lost} color="#ff5a5f" lineWidth={3} />}
        {lostEnd && <mesh position={[lostEnd[0], lostEnd[1], 0.05]}><sphereGeometry args={[0.16, 14, 10]} /><meshStandardMaterial color="#ff5a5f" emissive="#ff5a5f" emissiveIntensity={0.8} /></mesh>}
        <Pulses path={path} guided={f.guided} />
      </group>)}
      readouts={[
        ["Critical angle sin⁻¹(n₂/n₁)", f.critDeg === null ? "—" : `${f.critDeg.toFixed(1)}°`],
        ["Numerical aperture √(n₁² − n₂²)", f.NA === null ? "—" : f.NA.toFixed(3)],
        ["Acceptance angle sin⁻¹(NA)", f.acceptDeg === null ? "—" : f.NA !== null && f.NA >= 1 ? "90° (all)" : `${f.acceptDeg.toFixed(1)}°`],
        ["Δ = (n₁ − n₂)/n₁", `${(f.delta * 100).toFixed(2)} %`],
        ["Angle at core wall", wall],
        ["Ray guided?", f.guided ? "Yes (total internal reflection)" : n2 >= n1 ? "No (needs n₂ < n₁)" : "No, it leaks out"],
      ]}
      controls={<>
        <Slider label="Launch angle θᵢ" value={launch} min={0} max={45} step={1} digits={0} unit="°" onChange={setLaunch} />
        <Slider label="Core index n₁" value={n1} min={1.4} max={1.8} step={0.005} digits={3} onChange={setN1} />
        <Slider label="Cladding index n₂" value={n2} min={1.3} max={1.55} step={0.005} digits={3} onChange={setN2} />
      </>}
      note={<p>A ray entering from air at angle θᵢ bends to sin θᵣ = sin θᵢ / n₁ (Snell&apos;s law) and meets the core–cladding wall at 90° − θᵣ from the normal. If that is at least the critical angle sin⁻¹(n₂/n₁) it is totally reflected, again and again, and the gold pulse travels the whole fibre. The largest launch angle that still works is the acceptance angle, sin θ_max = √(n₁² − n₂²) = NA, drawn as the green cone. Beyond it the ray refracts into the cladding (red) and is lost. Δ = (n₁ − n₂)/n₁ measures the index contrast. Simplified model: a meridional ray in a straight step-index fibre, with the small partial reflection at the wall ignored and the fibre drawn far thicker than real ones.</p>}
    />
  );
}
