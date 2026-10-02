"use client";
import { lineProjection } from "../sim/gfx";
import { Ball, Box, C, Floor, Panel, Poly, type V3 } from "../kit";
import { LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { GFX_SPECS } from "../meta/gfx.specs";

const S = 0.03;
export default function ProjectionLab() {
  const [P, set, reset] = useLabParams(GFX_SPECS.projection);
  const { sep, h1, d1, h2, d2 } = P;
  const o = lineProjection(sep, h1, d1, h2, d2);
  const a: V3 = [-sep * S / 2, h1 * S, d1 * S], b: V3 = [sep * S / 2, h2 * S, d2 * S];
  const fa: V3 = [a[0], a[1], 0], fb: V3 = [b[0], b[1], 0], ta: V3 = [a[0], 0, a[2]], tb: V3 = [b[0], 0, b[2]];
  return (
    <LabFrame
      label="A vertical plane at the back and a horizontal plane below, with a gold line floating in front of the first and above the second, its blue front view drawn on the vertical plane and its green top view on the horizontal plane, joined by dotted projectors"
      camera={[3.4, 2.6, 6.4]}
      animated={false}
      onReset={reset}
      scene={() => (
        <group position={[0, -1.2, -1]}>
          <Floor size={10} y={-0.02} divisions={10} />
          <Panel p={[0, 1.3, 0]} w={6.4} h={2.6} c="#2d5566" o={0.75} />
          <Box p={[0, -0.01, 1.4]} s={[6.4, 0.03, 2.8]} c="#31586a" o={0.85} />
          <Poly pts={[a, b]} c={C.gold} w={4} />
          <Poly pts={[fa, fb]} c={C.blue} w={3.5} />
          <Poly pts={[ta, tb]} c={C.green} w={3.5} />
          <Poly pts={[a, fa]} c={C.light} w={1.2} />
          <Poly pts={[b, fb]} c={C.light} w={1.2} />
          <Poly pts={[a, ta]} c={C.light} w={1.2} />
          <Poly pts={[b, tb]} c={C.light} w={1.2} />
          <Ball p={a} r={0.07} c={C.gold} glow={0.6} />
          <Ball p={b} r={0.07} c={C.orange} glow={0.6} />
        </group>
      )}
      readouts={[
        ["True length (TL)", `${o.tl.toFixed(1)} mm`],
        ["Front view length", `${o.fv.toFixed(1)} mm`],
        ["Top view length", `${o.tv.toFixed(1)} mm`],
        ["Inclination to the HP (θ)", `${o.theta.toFixed(1)}°`],
        ["Inclination to the VP (φ)", `${o.phi.toFixed(1)}°`],
      ]}
      controls={<>
        <Slider label="Distance between ends along XY" value={sep} min={5} max={100} step={5} digits={0} unit=" mm" onChange={(x) => set("sep", x)} />
        <Slider label="End A: height above HP" value={h1} min={0} max={80} step={5} digits={0} unit=" mm" onChange={(x) => set("h1", x)} />
        <Slider label="End A: distance in front of VP" value={d1} min={0} max={80} step={5} digits={0} unit=" mm" onChange={(x) => set("d1", x)} />
        <Slider label="End B: height above HP" value={h2} min={0} max={80} step={5} digits={0} unit=" mm" onChange={(x) => set("h2", x)} />
        <Slider label="End B: distance in front of VP" value={d2} min={0} max={80} step={5} digits={0} unit=" mm" onChange={(x) => set("d2", x)} />
      </>}
      note={<p>In first-angle projection the object sits in front of the vertical plane (VP) and above the horizontal plane (HP). Dropping projectors onto the VP gives the front view (blue) and onto the HP the top view (green). Two apparent lengths are each shorter than the true length: FV = √(s² + Δh²), TV = √(s² + Δd²), where s is the separation along the reference line and Δh, Δd the differences of height and distance. The true length is √(s² + Δh² + Δd²), and the inclinations follow from right triangles: θ (with the HP) has tan θ = Δh / √(s² + Δd²), φ (with the VP) has tan φ = Δd / √(s² + Δh²). Orbit the view to see it from all sides.</p>}
    />
  );
}
