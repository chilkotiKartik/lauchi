"use client";
import { useMemo } from "react";
import { fmtLen, poynting, sci } from "../sim/phyy";
import { LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { PHYY_SPECS } from "../meta/phyy.specs";
import { C, Box, type V3 } from "../kit";
import { Arrow, Flow, Pulse, mix } from "../kit2";
import { Sticks, type StickWave } from "./phyy-kit";

const DIRS: V3[] = (() => {
  const out: V3[] = [[0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1], [-1, 0, 0]];
  for (const a of [1, -1]) for (const b of [1, -1]) for (const c of [1, -1]) out.push([a / Math.sqrt(3), b / Math.sqrt(3), c / Math.sqrt(3)]);
  return out;
})();
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

export default function PoyntingLab() {
  const [P, set, reset] = useLabParams(PHYY_SPECS.poynting);
  const { lgP, lgr, er } = P;
  const p = poynting(lgP, lgr, er);
  const RV = 1.3 + 0.2 * (lgr + 1);
  const fS = clamp01((Math.log10(p.S) + 25) / 53), fE = clamp01((Math.log10(p.E0) + 12) / 28);
  const arrowLen = 0.3 + 1.3 * fS, amp = 0.25 + 0.75 * fE, kV = 4 * Math.sqrt(p.n);
  const eW = useMemo<StickWave>(() => ({ o: [0.3, 0, 0], d: [1, 0, 0], vib: [0, 1, 0], len: RV + 2.2, amp, k: kV, phase: 0 }), [RV, amp, kV]);
  const hW = useMemo<StickWave>(() => ({ o: [0.3, 0, 0], d: [1, 0, 0], vib: [0, 0, 1], len: RV + 2.2, amp: amp * 0.8, k: kV, phase: 0 }), [RV, amp, kV]);
  const flows = useMemo(() => DIRS.slice(0, 5).map((d) => [[d[0] * 0.3, d[1] * 0.3, d[2] * 0.3], [d[0] * (RV + arrowLen), d[1] * (RV + arrowLen), d[2] * (RV + arrowLen)]] as V3[]), [RV, arrowLen]);
  const shell = mix(C.purple, C.blue, clamp01((er - 1) / 20));
  return (
    <LabFrame
      label="A glowing point source inside an imaginary sphere of radius r: gold Poynting arrows point radially outward through the sphere, and along one ray the electric field (red, vertical) and magnetic field (blue, horizontal) oscillate in step as the wave travels out through a square detector patch"
      camera={[2.4, 2.6, 10.5]}
      onReset={reset}
      scene={() => (<group position={[-0.8, 0, 0]}>
        <Pulse p={[0, 0, 0]} color={C.orange} r={0.2 + 0.015 * lgP} />
        <mesh><sphereGeometry args={[RV, 32, 20]} /><meshStandardMaterial color={shell} transparent opacity={0.1 + Math.min(0.15, (er - 1) * 0.01)} depthWrite={false} /></mesh>
        <mesh><sphereGeometry args={[RV, 20, 12]} /><meshBasicMaterial color={shell} wireframe transparent opacity={0.35} /></mesh>
        {DIRS.map((d, i) => <Arrow key={i} from={[d[0] * RV, d[1] * RV, d[2] * RV]} to={[d[0] * (RV + arrowLen), d[1] * (RV + arrowLen), d[2] * (RV + arrowLen)]} color={C.gold} r={0.035} head={0.2} />)}
        {flows.map((f, i) => <Flow key={i} path={f} n={5} speed={0.35} color={C.gold} r={0.045} />)}
        <Sticks w={eW} color={C.red} n={40} speed={3} />
        <Sticks w={hW} color={C.blue} n={40} speed={3} />
        <Arrow from={[RV, 0, 0]} to={[RV + arrowLen + 0.5, 0, 0]} color={C.gold} r={0.06} head={0.3} />
        <Box p={[RV, 0, 0]} s={[0.03, 1, 1]} c={C.green} o={0.55} glow={0.3 + 0.9 * fS} />
      </group>)}
      readouts={[
        ["Intensity ⟨S⟩ = P/4πr²", `${sci(p.S)} W/m² (P = ${sci(p.P)} W, r = ${fmtLen(p.r)})`],
        ["Peak E₀ (rms)", `${sci(p.E0)} V/m (${sci(p.Erms)})`],
        ["Peak B₀ = E₀/v", `${sci(p.B0)} T`],
        ["Peak H₀ = E₀/Z", `${sci(p.H0)} A/m`],
        ["Energy density ⟨u⟩ = ⟨S⟩/v", `${sci(p.u)} J/m³`],
        ["Wave speed v, impedance Z = E/H", `${sci(p.v)} m/s, ${p.Z.toFixed(1)} Ω`],
      ]}
      controls={<>
        <Slider label="Source power P = 10^x W" value={lgP} min={0} max={27} step={0.01} digits={4} onChange={(x) => set("lgP", x)} />
        <Slider label="Distance r = 10^x m" value={lgr} min={-1} max={12} step={0.01} digits={4} onChange={(x) => set("lgr", x)} />
        <Slider label="Relative permittivity εᵣ of the medium" value={er} min={1} max={81} step={0.1} digits={1} onChange={(x) => set("er", x)} />
      </>}
      note={<>
        <p>The <b>Poynting vector S = E × H</b> is the energy crossing unit area per second (W/m²), pointing along the direction the wave carries energy. In a plane EM wave E ⊥ H ⊥ S, E/H = Z (377 Ω in vacuum) and the time-average is <b>⟨S⟩ = ½E₀H₀ = E₀²/2Z</b>. <b>Poynting’s theorem</b>, −∂u/∂t = ∇·S + J·E, says the field energy lost from a volume either flows out through its surface or does work on charges. For a source radiating P watts equally in all directions, all of P crosses any sphere around it, so <b>⟨S⟩ = P/4πr²</b>.</p>
        <p className="mt-2">The sliders use powers of ten so one lab covers a 1 W lamp and the Sun (type 26.58 for 3.8 × 10²⁶ W). <b>Try</b> the PYQ presets: the 100 W bulb at 2 m, the Sun’s surface, and sunlight at the Earth. In a dielectric (εᵣ &gt; 1) the wave slows to c/√εᵣ and Z drops, so the same intensity needs a smaller E. The arrow lengths and wave amplitude follow log S and log E, not to scale.</p>
      </>}
    />
  );
}
