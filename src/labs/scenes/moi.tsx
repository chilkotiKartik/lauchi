"use client";
import { Line } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { moi, sci, type Section } from "../sim/mech";
import { Tick } from "../Stage";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { MECH_SPECS } from "../meta/mech.specs";

const SECTIONS: { id: Section; label: string }[] = [
  { id: "rect", label: "Rectangle" }, { id: "circle", label: "Solid circle" }, { id: "hollow", label: "Hollow circle (tube)" }, { id: "isec", label: "I-section" }, { id: "tsec", label: "T-section" },
];

/** The section as a THREE.Shape in mm with its centroid at the origin. */
function makeShape(sec: Section, b: number, d: number, tf: number, tw: number, ybar: number): THREE.Shape {
  const poly = (pts: [number, number][]) => { const s = new THREE.Shape(); pts.forEach(([x, y], i) => (i ? s.lineTo(x, y - ybar) : s.moveTo(x, y - ybar))); s.closePath(); return s; };
  if (sec === "rect") return poly([[-b / 2, 0], [b / 2, 0], [b / 2, d], [-b / 2, d]]);
  if (sec === "circle" || sec === "hollow") {
    const s = new THREE.Shape(); s.absarc(0, 0, d / 2, 0, Math.PI * 2, false);
    if (sec === "hollow") { const h = new THREE.Path(); h.absarc(0, 0, d / 2 - tf, 0, Math.PI * 2, true); s.holes.push(h); }
    return s;
  }
  if (sec === "isec") return poly([[-b / 2, 0], [b / 2, 0], [b / 2, tf], [tw / 2, tf], [tw / 2, d - tf], [b / 2, d - tf], [b / 2, d], [-b / 2, d], [-b / 2, d - tf], [-tw / 2, d - tf], [-tw / 2, tf], [-b / 2, tf]]);
  return poly([[-tw / 2, 0], [tw / 2, 0], [tw / 2, d - tf], [b / 2, d - tf], [b / 2, d], [-b / 2, d], [-b / 2, d - tf], [-tw / 2, d - tf]]);
}

export default function MoiLab() {
  const [P, set, reset] = useLabParams(MECH_SPECS.moi);
  const { b, d, tf, tw, h, sec } = P;
  const R = moi(sec, b, d, tf, tw, h);
  const round = sec === "circle" || sec === "hollow", big = round ? d : Math.max(b, d), sc = 2.6 / big;
  const geo = useMemo(() => {
    const g = new THREE.ExtrudeGeometry(makeShape(sec, b, d, R.tf, R.tw, R.ybar), { depth: big * 0.7, bevelEnabled: false, curveSegments: 32 });
    g.translate(0, 0, -big * 0.35);
    return g;
  }, [sec, b, d, big, R.tf, R.tw, R.ybar]);
  const spin = useRef<THREE.Group>(null), t = useRef(0);
  const tick = (dt: number) => { t.current += Math.min(dt, 0.05); spin.current?.rotation.set(0.25, 0.6 + 0.35 * Math.sin(t.current * 0.6), 0); };
  const w = (round ? d : b) * sc;
  const yShift = -h * sc;
  return (
    <LabFrame
      label="A 3D beam cross-section of the chosen shape with a gold line for the centroidal axis and a red line for a parallel axis at an offset distance, slowly swaying to show its depth"
      camera={[0, 0.4, 8]}
      onReset={reset}
      scene={() => (<group>
        <Tick fn={tick} />
        <group ref={spin} scale={sc}>
          <mesh geometry={geo}><meshStandardMaterial color="#2ba6f5" roughness={0.45} metalness={0.15} /></mesh>
        </group>
        <Line points={[[-w / 2 - 0.5, 0, 0.9], [w / 2 + 0.5, 0, 0.9]]} color="#ffc83d" lineWidth={3} />
        {h > 0 && <Line points={[[-w / 2 - 0.5, yShift, 0.9], [w / 2 + 0.5, yShift, 0.9]]} color="#ff5a5f" lineWidth={3} />}
        {h > 0 && <Line points={[[w / 2 + 0.7, 0, 0.9], [w / 2 + 0.7, yShift, 0.9]]} color="#44c95a" lineWidth={2} />}
        <mesh position={[0, 0, 0.9]}><sphereGeometry args={[0.08, 10, 10]} /><meshBasicMaterial color="#ffc83d" /></mesh>
      </group>)}
      readouts={[
        ["Area A", `${sci(R.A)} mm²`], ["Centroid ȳ from bottom", `${R.ybar.toFixed(1)} mm`], ["I_x about the centroid", `${sci(R.Ix)} mm⁴`],
        ["I_y about the vertical axis", `${sci(R.Iy)} mm⁴`], [h > 0 ? `I about parallel axis (h = ${h} mm)` : "I about parallel axis (h = 0)", `${sci(R.Ishift)} mm⁴`], ["Radius of gyration k = √(I/A)", `${R.k.toFixed(1)} mm`],
      ]}
      controls={<>
        <Slider label="Width b" value={b} min={10} max={300} step={1} digits={0} unit=" mm" onChange={(x) => set("b", x)} />
        <Slider label="Depth d (diameter for circles)" value={d} min={10} max={300} step={1} digits={0} unit=" mm" onChange={(x) => set("d", x)} />
        <Slider label="Flange / wall thickness" value={tf} min={2} max={100} step={1} digits={0} unit=" mm" onChange={(x) => set("tf", x)} />
        <Slider label="Web thickness" value={tw} min={2} max={100} step={1} digits={0} unit=" mm" onChange={(x) => set("tw", x)} />
        <Slider label="Parallel-axis offset h" value={h} min={0} max={200} step={1} digits={0} unit=" mm" onChange={(x) => set("h", x)} />
        <Pick<Section> label="Section shape" value={sec} options={SECTIONS} onChange={(x) => set("sec", x)} />
      </>}
      note={<p>Second moment of area measures how far a cross-section&apos;s material is spread from an axis, and so how stiff it is in bending: I = ∫y² dA. The gold line is the horizontal axis through the centroid, giving I_x (rectangle bd³/12, circle πd⁴/64, tube π(d⁴ − d_i⁴)/64); the red line is a parallel axis h below it, and the parallel axis theorem says I = I_x + A·h². The perpendicular axis theorem adds I_x + I_y = J, the polar moment. The I-section shows why beams put material in the flanges: high I_x for little area. Thicknesses are limited so the shape stays valid (for example a wall cannot exceed 45 % of the diameter), and the tab &quot;web thickness&quot; only affects the I and T shapes. The T-section centroid ȳ is measured from the bottom of the web.</p>}
    />
  );
}
