"use client";
import { useRef } from "react";
import * as THREE from "three";
import { FIELDS3, divCurl, fmt, type FieldId } from "../sim/mathi";
import { Arrow, mix } from "../kit2";
import { Tick } from "../Stage";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { MATHI_SPECS } from "../meta/mathi.specs";
import { C, Glyphs, P3, Triad, type Glyph, type V3 } from "./mathi-kit";

const vt = (v: V3) => `(${fmt(v[0], 2)}, ${fmt(v[1], 2)}, ${fmt(v[2], 2)})`;
const up = new THREE.Vector3(0, 1, 0);

export default function DivCurl3dLab() {
  const [P, set, reset] = useLabParams(MATHI_SPECS.divcurl3d);
  const { field, px, py, pz } = P;
  const F = FIELDS3[field], r = divCurl(field, [px, py, pz]);
  const items: Glyph[] = [];
  for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) for (let k = -2; k <= 2; k++) {
    const v = F.F(i, j, k), m = Math.hypot(...v), len = 0.2 + 0.5 * (m / (m + 1));
    if (m < 1e-9) continue;
    const d = P3(v[0], v[1], v[2]);
    items.push({ p: P3(i * 1.1, j * 1.1, k * 1.1), d: [(d[0] / m) * len, (d[1] / m) * len, (d[2] / m) * len], c: mix(C.blue, C.orange, m / (m + 1.5)), w: 0.1 });
  }
  const O = P3(px * 1.1, py * 1.1, pz * 1.1);
  const c3 = P3(r.curl[0], r.curl[1], r.curl[2]);
  const hub = useRef<THREE.Group>(null), wheel = useRef<THREE.Group>(null), bal = useRef<THREE.Mesh>(null), t = useRef(0);
  const omega = Math.max(-5, Math.min(5, 0.6 * r.curlMag));
  const tick = (dt: number) => {
    t.current += Math.min(dt, 0.05);
    if (hub.current) { if (r.curlMag > 1e-9) hub.current.quaternion.setFromUnitVectors(up, new THREE.Vector3(c3[0], c3[1], c3[2]).normalize()); else hub.current.quaternion.identity(); }
    if (wheel.current) wheel.current.rotation.y = t.current * omega;
    bal.current?.scale.setScalar(1 + Math.max(-0.5, Math.min(0.5, 0.12 * r.div)) * Math.sin(t.current * 2.4));
  };
  const cl = 0.5 + Math.min(1.6, r.curlMag * 0.4), cm = Math.hypot(c3[0], c3[1], c3[2]) || 1;
  return (
    <LabFrame
      label="A lattice of arrows showing a vector field, with a paddle wheel at a chosen point that spins when the curl is non-zero and a sphere that pulses when the divergence is non-zero"
      camera={[4.8, 3.6, 6.2]}
      onReset={reset}
      scene={() => (<group>
        <Tick fn={tick} />
        <Triad len={3.2} />
        <Glyphs items={items} cap={125} />
        <group position={O}>
          <group ref={hub}>
            <group ref={wheel}>
              {[0, 1, 2].map((i) => (<mesh key={i} rotation={[0, (i * Math.PI) / 3, 0]}><boxGeometry args={[0.8, 0.04, 0.12]} /><meshStandardMaterial color={C.gold} emissive={C.gold} emissiveIntensity={0.5} /></mesh>))}
              {[0, 1].map((i) => (<mesh key={i} position={[(i ? 1 : -1) * 0.4, 0, 0]}><sphereGeometry args={[0.07, 10, 10]} /><meshStandardMaterial color={C.red} emissive={C.red} emissiveIntensity={0.6} /></mesh>))}
            </group>
            <mesh><cylinderGeometry args={[0.03, 0.03, 0.5, 8]} /><meshStandardMaterial color="#e8f1f5" /></mesh>
          </group>
          <mesh ref={bal}><sphereGeometry args={[0.55, 18, 14]} /><meshStandardMaterial color={r.div > 1e-9 ? C.green : r.div < -1e-9 ? C.purple : "#5b6d77"} transparent opacity={0.25} depthWrite={false} /></mesh>
        </group>
        {r.curlMag > 1e-9 && <Arrow from={O} to={[O[0] + (c3[0] / cm) * cl, O[1] + (c3[1] / cm) * cl, O[2] + (c3[2] / cm) * cl]} color={C.red} r={0.05} />}
      </group>)}
      readouts={[
        ["F at P", vt(r.F)],
        ["div F = ∇·F", fmt(r.div, 4)],
        ["curl F = ∇×F", vt(r.curl)],
        ["|curl F|", fmt(r.curlMag, 4)],
        ["Solenoidal (div F = 0)?", r.solenoidal ? "yes" : "no"],
        ["Irrotational (curl F = 0)?", r.irrotational ? "yes" : "no"],
      ]}
      controls={<>
        <Slider label="Point P, x" value={px} min={-2} max={2} step={0.1} digits={1} onChange={(v) => set("px", v)} />
        <Slider label="Point P, y" value={py} min={-2} max={2} step={0.1} digits={1} onChange={(v) => set("py", v)} />
        <Slider label="Point P, z" value={pz} min={-2} max={2} step={0.1} digits={1} onChange={(v) => set("pz", v)} />
        <Pick label="Vector field F" value={field} options={(Object.keys(FIELDS3) as FieldId[]).map((k) => ({ id: k, label: FIELDS3[k].label }))} onChange={(v) => set("field", v)} />
      </>}
      note={<>
        <p><b>Divergence and curl.</b> div F = ∂F₁/∂x + ∂F₂/∂y + ∂F₃/∂z measures net outflow per unit volume (the sphere breathes in and out, green for a source, purple for a sink). curl F = ∇×F measures rotation: a tiny paddle wheel turns about the curl axis at angular speed ½|curl F| (the red arrow is the axis). F is <i>solenoidal</i> if div F = 0 and <i>irrotational</i> if curl F = 0; then F = ∇φ for a scalar potential φ. Always div(curl F) = 0 and curl(grad φ) = 0.</p>
        <p className="mt-2"><b>Try.</b> PYQ: r⃗/r³ and (y + z)i + (z + x)j + (x + y)k are both solenoidal <i>and</i> irrotational (the wheel does not turn, the sphere does not pulse). (−y, x, 0) has curl 2k: a fast spinning wheel and no divergence. (x, y, z) has div 3: the sphere pulses but the wheel is still. For (x²y, y²z, z²x) both are non-zero and change as you move P.</p>
      </>}
    />
  );
}
