"use client";
import { useMemo } from "react";
import { cylinderSection } from "../sim/gfx";
import { Ball, C, Floor, Poly, pieces, type V3 } from "../kit";
import { LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { GFX_SPECS } from "../meta/gfx.specs";

const S = 0.02;
export default function SectionPlaneLab() {
  const [P, set, reset] = useLabParams(GFX_SPECS.sectionplane);
  const { tilt, r, h } = P;
  const o = cylinderSection(r, h, tilt), t = Math.tan((tilt * Math.PI) / 180);
  const outline = useMemo(() => {
    const up: (V3 | null)[] = [], dn: (V3 | null)[] = [];
    for (let i = 0; i <= 60; i++) {
      const x = -o.xm + (2 * o.xm * i) / 60, y = Math.sqrt(Math.max(0, r * r - x * x));
      up.push([x * S, x * t * S, y * S]); dn.push([x * S, x * t * S, -y * S]);
    }
    const ring = [...up, ...dn.reverse()] as V3[];
    ring.push(ring[0]);
    return pieces(ring);
  }, [o.xm, r, t]);
  return (
    <LabFrame
      label="A see-through cylinder cut by a tilted plane through its centre, with the gold outline of the cut section drawn on the plane"
      camera={[3.2, 2.2, 6]}
      animated={false}
      onReset={reset}
      scene={() => (
        <group>
          <Floor size={10} y={-(h * S) / 2 - 0.02} divisions={10} />
          <mesh><cylinderGeometry args={[r * S, r * S, h * S, 28, 1, true]} /><meshStandardMaterial color={C.blue} transparent opacity={0.28} side={2} /></mesh>
          <mesh position={[0, (h * S) / 2, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[r * S, 28]} /><meshStandardMaterial color={C.blue} transparent opacity={0.35} side={2} /></mesh>
          <mesh position={[0, -(h * S) / 2, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[r * S, 28]} /><meshStandardMaterial color={C.blue} transparent opacity={0.35} side={2} /></mesh>
          <mesh rotation={[0, 0, (tilt * Math.PI) / 180]}><boxGeometry args={[Math.max(r * 2.6, 20) * S, 0.01, Math.max(r * 2.6, 20) * S]} /><meshBasicMaterial color={C.orange} transparent opacity={0.3} side={2} /></mesh>
          {outline.map((p, i) => <Poly key={i} pts={p} c={C.gold} w={4} />)}
          <Ball p={[0, 0, 0]} r={0.05} c={C.white} glow={0.4} />
        </group>
      )}
      readouts={[
        ["Shape of the section", o.shape],
        ["True area of the section", `${o.area.toFixed(0)} mm²`],
        ["Semi-minor axis", `${o.semiMinor.toFixed(1)} mm`],
        ["Semi-major axis (if whole ellipse)", `${o.semiMajor.toFixed(1)} mm`],
        ["Plane leaves through the ends?", o.full ? "No" : "Yes"],
      ]}
      controls={<>
        <Slider label="Tilt of the cutting plane from horizontal" value={tilt} min={0} max={80} step={5} digits={0} unit="°" onChange={(x) => set("tilt", x)} />
        <Slider label="Cylinder radius" value={r} min={10} max={60} step={1} digits={0} unit=" mm" onChange={(x) => set("r", x)} />
        <Slider label="Cylinder height" value={h} min={40} max={200} step={5} digits={0} unit=" mm" onChange={(x) => set("h", x)} />
      </>}
      note={<p>A plane at right angles to the axis cuts a circle. Tilting the plane through the centre by α stretches the section along its slope: an ellipse with semi-minor axis r and semi-major axis r / cos α, whose area is πr² / cos α. This is the true shape you would show in a sectional view. If the plane is steep or the cylinder short, the plane exits through the top or bottom face before crossing the whole width, and only part of the ellipse remains; the area is then found by integration. In a drawing, the cut face is hatched with lines at 45°. Orbit the view to look along the plane.</p>}
    />
  );
}
