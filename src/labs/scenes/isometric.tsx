"use client";
import { foreshortening, ISO_SCALE } from "../sim/gfx";
import { useMemo } from "react";
import { BoxGeometry as BoxGeo } from "three";
import { C, Floor } from "../kit";
import { LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { GFX_SPECS } from "../meta/gfx.specs";

const FACES = [C.red, C.orange, C.blue, C.purple, C.green, C.gold];
export default function IsometricLab() {
  const [P, set, reset] = useLabParams(GFX_SPECS.isometric);
  const { az, el, edge } = P;
  const f = foreshortening(az, el), size = 1 + (edge / 100) * 1.6, rad = Math.PI / 180;
  const geo = useMemo(() => new BoxGeo(size, size, size), [size]);
  const iso = f.every((r) => Math.abs(r - ISO_SCALE) < 0.005);
  return (
    <LabFrame
      label="A cube with six differently coloured faces that you turn about a vertical and a horizontal axis, so that at the isometric setting all three visible faces look equally foreshortened"
      camera={[0, 0.4, 7]}
      animated={false}
      onReset={reset}
      scene={() => (
        <group>
          <Floor size={12} y={-1.9} divisions={12} />
          <group rotation={[el * rad, -az * rad, 0]}>
            <mesh>
              <boxGeometry args={[size, size, size]} />
              {FACES.map((c, i) => <meshStandardMaterial key={i} attach={`material-${i}`} color={c} roughness={0.5} />)}
            </mesh>
            <lineSegments><edgesGeometry args={[geo]} /><lineBasicMaterial color="#0f1a20" /></lineSegments>
          </group>
        </group>
      )}
      readouts={[
        ["Width edge (x) shows at", `${(f[0] * 100).toFixed(1)}% = ${(edge * f[0]).toFixed(1)} mm`],
        ["Height edge (y) shows at", `${(f[1] * 100).toFixed(1)}% = ${(edge * f[1]).toFixed(1)} mm`],
        ["Depth edge (z) shows at", `${(f[2] * 100).toFixed(1)}% = ${(edge * f[2]).toFixed(1)} mm`],
        ["Isometric view?", iso ? "Yes, all three at 81.65%" : "No, edges shrink unequally"],
        ["Isometric scale", `${ISO_SCALE.toFixed(4)} (1 ÷ 1.2247)`],
      ]}
      controls={<>
        <Slider label="Turn about the vertical axis (azimuth)" value={az} min={0} max={90} step={1} digits={1} unit="°" onChange={(x) => set("az", x)} />
        <Slider label="Tilt towards the viewer (elevation)" value={el} min={0} max={90} step={1} digits={3} unit="°" onChange={(x) => set("el", x)} />
        <Slider label="Cube edge" value={edge} min={10} max={100} step={5} digits={0} unit=" mm" onChange={(x) => set("edge", x)} />
      </>}
      note={<p>Each edge of the cube is drawn shorter than it is because it points partly along the line of sight. If the viewing direction makes angle γ with an edge, the edge shows at √(1 − cos²γ) of its length. Turning the cube 45° about the vertical and then tilting it 35.264° (= arcsin 1/√3) makes all three edges show at √(2/3) = 0.8165, and the axes appear 120° apart: the isometric view. Drawing offices skip the shrinking and draw true lengths, which is the isometric drawing, 1.2247 times bigger than the isometric view. At azimuth 0 and elevation 0 you get the front view, and at elevation 90° the top view. The edge length only changes the printed sizes and the cube&apos;s size on screen.</p>}
    />
  );
}
