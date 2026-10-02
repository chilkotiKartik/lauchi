"use client";
import { Line } from "@react-three/drei";
import * as THREE from "three";
import { PHI, directional, fmt, type PhiId } from "../sim/mathi";
import { Arrow, mix } from "../kit2";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { MATHI_SPECS } from "../meta/mathi.specs";
import { C, Dot, Instances, P3, Spin, Triad, type Inst, type V3 } from "./mathi-kit";

const vt = (v: V3, d = 2) => `(${fmt(v[0], d)}, ${fmt(v[1], d)}, ${fmt(v[2], d)})`;
const add = (a: V3, b: V3, k: number): V3 => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];

export default function GradientLab() {
  const [P, set, reset] = useLabParams(MATHI_SPECS.gradient);
  const { phi, px, py, pz, dx, dy, dz } = P;
  const F = PHI[phi], p: V3 = [px, py, pz], r = directional(phi, p, [dx, dy, dz]);
  const sc = Math.abs(r.phi) + 1;
  const items: Inst[] = [];
  for (let i = -3; i <= 3; i++) for (let j = -3; j <= 3; j++) for (let k = -3; k <= 3; k++) {
    const v = F.f(i, j, k), t = Number.isFinite(v) ? Math.tanh(v / sc) : 0;
    items.push({ p: P3(i, j, k), s: [0.1, 0.1, 0.1], c: mix(C.blue, C.red, 0.5 + 0.5 * t) });
  }
  const O = P3(px, py, pz), n3 = P3(r.normal[0], r.normal[1], r.normal[2]), u3 = P3(r.u[0], r.u[1], r.u[2]);
  const gl = 1 + Math.min(1.3, Math.log1p(r.gradMag) * 0.4), cosA = r.gradMag > 1e-9 ? r.D / r.gradMag : 0;
  const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(n3[0], n3[1], n3[2] || 0).normalize());
  const gTip = add(O, n3, gl), uTip = add(O, u3, 1.6), pTip = add(O, n3, 1.6 * cosA);
  return (
    <LabFrame
      label="A cloud of points coloured by the value of a scalar field, with the gradient arrow, a direction arrow, its projection and the tangent plane at a chosen point"
      camera={[4.6, 3.6, 6.6]}
      onReset={reset}
      scene={() => (<Spin speed={0.1}><group>
        <Triad len={3.4} />
        <Instances items={items} cap={343} shape="sphere" />
        {r.gradMag > 1e-9 && <mesh position={O} quaternion={quat}><planeGeometry args={[3, 3]} /><meshStandardMaterial color="#e8f1f5" transparent opacity={0.28} side={THREE.DoubleSide} depthWrite={false} /></mesh>}
        <Dot p={O} r={0.12} c="#ffffff" />
        {r.gradMag > 1e-9 && <Arrow from={O} to={gTip} color={C.red} r={0.05} />}
        <Arrow from={O} to={uTip} color={C.gold} r={0.045} />
        {r.gradMag > 1e-9 && <Arrow from={O} to={pTip} color={C.green} r={0.05} />}
        <Line points={[uTip, pTip]} color="#9db0ba" lineWidth={1.2} dashed dashSize={0.07} gapSize={0.05} />
      </group></Spin>)}
      readouts={[
        ["φ at P", fmt(r.phi, 5)],
        ["∇φ", vt(r.grad, 3)],
        ["|∇φ|", fmt(r.gradMag, 4)],
        ["Directional derivative Dᵤφ", fmt(r.D, 5)],
        ["Angle between ∇φ and u", `${fmt(r.angle, 1)}°`],
        ["Unit normal n̂ = ∇φ/|∇φ|", vt(r.normal, 3)],
      ]}
      controls={<>
        <Slider label="Point P, x" value={px} min={-3} max={3} step={0.1} digits={1} onChange={(v) => set("px", v)} />
        <Slider label="Point P, y" value={py} min={-3} max={3} step={0.1} digits={1} onChange={(v) => set("py", v)} />
        <Slider label="Point P, z" value={pz} min={-3} max={3} step={0.1} digits={1} onChange={(v) => set("pz", v)} />
        <Pick label="Scalar field φ(x, y, z)" value={phi} options={(Object.keys(PHI) as PhiId[]).map((k) => ({ id: k, label: PHI[k].label }))} onChange={(v) => set("phi", v)} />
        <Slider label="Direction, i component" value={dx} min={-3} max={3} step={0.1} digits={1} onChange={(v) => set("dx", v)} />
        <Slider label="Direction, j component" value={dy} min={-3} max={3} step={0.1} digits={1} onChange={(v) => set("dy", v)} />
        <Slider label="Direction, k component" value={dz} min={-3} max={3} step={0.1} digits={1} onChange={(v) => set("dz", v)} />
      </>}
      note={<>
        <p><b>Gradient.</b> ∇φ = φ<sub>x</sub> i + φ<sub>y</sub> j + φ<sub>z</sub> k points in the direction of steepest increase of φ and is normal to the level surface φ = const (the translucent tangent plane). The directional derivative along a unit vector u is D<sub>u</sub>φ = ∇φ · u = |∇φ| cos θ: it is largest (= |∇φ|) along the gradient, zero along the plane. Dots are blue where φ is negative and red where it is positive, relative to the value at P.</p>
        <p className="mt-2"><b>Try.</b> PYQ: φ = x²yz + 4xz² at (1, −2, 1) in the direction 2i − j − 2k: ∇φ = (0, 1, 6), so D<sub>u</sub>φ = (0·2 − 1 − 12)/3 = −13/3 ≈ −4.333. Then set the direction components equal to ∇φ (0, 1, 6) to see the angle drop to 0° and D<sub>u</sub>φ reach |∇φ|. The green arrow is the part of u along the gradient.</p>
      </>}
    />
  );
}
