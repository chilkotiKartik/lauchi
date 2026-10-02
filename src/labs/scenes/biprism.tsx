"use client";
import { Line } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";
import { biprism, nmHex, twoBeam } from "../sim/phyy";
import { LabFrame, Check, Slider } from "../ui";
import { useLabParams } from "../params";
import { PHYY_SPECS } from "../meta/phyy.specs";
import { C, Ball, Box, Instances, type Inst, type V3 } from "../kit";
import { Flow, mix } from "../kit2";

const XS = -4.6, XSCR = 4.4, H = 1.5, NS = 150, WIN_MM = 3, SCR_H = 4;

/** Cross-section of the biprism (thick ridge in the middle, thin edges), extruded along z. */
function prismGeometry(x0: number, ridge: number) {
  const s = new THREE.Shape();
  s.moveTo(x0, -H); s.lineTo(x0 + 0.08, -H); s.lineTo(x0 + 0.08 + ridge, 0); s.lineTo(x0 + 0.08, H); s.lineTo(x0, H); s.lineTo(x0, -H);
  const g = new THREE.ExtrudeGeometry(s, { depth: 2, bevelEnabled: false });
  g.translate(0, 0, -1);
  return g;
}

export default function BiprismLab() {
  const [P, set, reset] = useLabParams(PHYY_SPECS.biprism);
  const { lam, alpha, mu, a, b, sheet, t, ms } = P;
  const r = biprism(lam, alpha, mu, a, b, sheet ? t : 0, ms);
  const col = nmHex(lam);
  const aV = Math.min(6.5, Math.max(1.2, (9 * a) / (a + b))), xp = XS + aV, bV = XSCR - xp;
  const dV = Math.min(1.6, 0.25 + r.d * 40);
  const geo = useMemo(() => prismGeometry(xp, 0.06 + alpha * 0.1), [xp, alpha]);
  const rays = useMemo(() => {
    const out: { inc: V3[]; out: V3[]; back: V3[] }[] = [];
    for (const sgn of [1, -1]) for (const f of [0.12, 0.45, 0.8]) {
      const yp = sgn * f * H, vy = sgn * dV / 2, ys = yp + (bV * (yp - vy)) / aV;
      out.push({ inc: [[XS, 0, 0], [xp, yp, 0]], out: [[xp + 0.1, yp, 0], [XSCR, ys, 0]], back: [[xp, yp, 0], [XS, vy, 0]] });
    }
    return out;
  }, [xp, aV, bV, dV]);
  const F = (dV / 2) * (bV / aV);
  const overlap = useMemo(() => new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute([xp + 0.1, 0, 0, XSCR, F, 0, XSCR, -F, 0], 3)), [xp, F]);
  const strips = useMemo<Inst[]>(() => {
    const out: Inst[] = [], lamM = lam * 1e-9;
    for (let i = 0; i < NS; i++) {
      const yv = -SCR_H / 2 + ((i + 0.5) * SCR_H) / NS, yReal = (yv / SCR_H) * WIN_MM * 1e-3;
      const inField = Math.abs(yReal) <= r.field / 2;
      const I = inField ? twoBeam(yReal, lamM, r.d, r.D, r.shift) : 0.04;
      out.push({ p: [XSCR - 0.04, yv, 0], s: [0.03, SCR_H / NS + 0.002, 2.2], c: mix("#0a1014", col, I) });
    }
    return out;
  }, [lam, r.field, r.d, r.D, r.shift, col]);
  const shiftV = Math.max(-SCR_H / 2, Math.min(SCR_H / 2, (r.shift * 1000 / WIN_MM) * SCR_H));
  const flowA = rays[1], flowB = rays[4];
  const pathA = useMemo<V3[]>(() => [flowA.inc[0], flowA.inc[1], flowA.out[1]], [flowA]);
  const pathB = useMemo<V3[]>(() => [flowB.inc[0], flowB.inc[1], flowB.out[1]], [flowB]);
  return (
    <LabFrame
      label="Fresnel's biprism: light from a slit passes through a thin double prism, the two halves appear to come from two virtual sources, and the overlapping beams make bright and dark fringes on a magnified screen; an optional thin sheet in one beam shifts the fringes"
      camera={[0.8, 1.6, 9.5]}
      onReset={reset}
      scene={() => (<group>
        <Ball p={[XS - 0.55, 0, 0]} r={0.28} c={C.orange} glow={1} />
        <Box p={[XS, 0, 0]} s={[0.06, 0.55, 1.6]} c={C.gold} glow={0.9} />
        <Ball p={[XS, dV / 2, 0.02]} r={0.1} c={C.purple} glow={0.9} />
        <Ball p={[XS, -dV / 2, 0.02]} r={0.1} c={C.purple} glow={0.9} />
        <mesh geometry={geo}><meshPhysicalMaterial color="#bfe8ff" transparent opacity={0.35} roughness={0.05} side={THREE.DoubleSide} /></mesh>
        {rays.map((ry, i) => (<group key={i}>
          <Line points={ry.inc} color={col} lineWidth={1.6} transparent opacity={0.8} />
          <Line points={ry.out} color={col} lineWidth={1.6} transparent opacity={0.8} />
          {(i === 0 || i === 3) && <Line points={ry.back} color={C.purple} lineWidth={1.2} dashed dashSize={0.12} gapSize={0.08} />}
        </group>))}
        <mesh geometry={overlap}><meshBasicMaterial color={col} transparent opacity={0.22} side={THREE.DoubleSide} /></mesh>
        <Flow path={pathA} n={8} speed={0.35} color={col} r={0.06} />
        <Flow path={pathB} n={8} speed={0.35} color={col} r={0.06} />
        {sheet && <Box p={[xp + bV * 0.3, H * 0.55, 0]} s={[0.05 + t * 0.012, H * 0.8, 1.7]} c={C.green} o={0.45} />}
        <Box p={[XSCR + 0.04, 0, 0]} s={[0.06, SCR_H + 0.3, 2.5]} c="#1d2b31" />
        <Instances items={strips} cap={NS} />
        <mesh position={[XSCR - 0.1, shiftV, 1.35]} rotation={[0, 0, Math.PI / 2]}><coneGeometry args={[0.1, 0.25, 12]} /><meshStandardMaterial color={C.red} emissive={C.red} emissiveIntensity={0.6} /></mesh>
        <mesh position={[XSCR - 0.1, 0, -1.35]} rotation={[0, 0, Math.PI / 2]}><coneGeometry args={[0.08, 0.2, 12]} /><meshStandardMaterial color={C.light} /></mesh>
        <Box p={[0, -2.35, 0]} s={[10, 0.08, 1.2]} c={C.dark} />
      </group>)}
      readouts={[
        ["Virtual-source gap d = 2a(μ−1)α", `${(r.d * 1000).toFixed(3)} mm`],
        ["Fringe width β = λD/d", `${(r.beta * 1000).toFixed(4)} mm`],
        ["Fringes in the overlap field", r.nFringes.toFixed(0)],
        ["Sheet shift x₀ = (μ−1)tD/d", sheet ? `${(r.shift * 1000).toFixed(3)} mm` : "no sheet"],
        ["Shift in fringes (μ−1)t/λ", sheet ? r.shiftFringes.toFixed(2) : "0"],
      ]}
      controls={<>
        <Slider label="Wavelength λ" value={lam} min={400} max={700} step={1} digits={1} unit=" nm" onChange={(x) => set("lam", x)} />
        <Slider label="Biprism angle α" value={alpha} min={0.3} max={3} step={0.05} digits={2} unit="°" onChange={(x) => set("alpha", x)} />
        <Slider label="Biprism index μ" value={mu} min={1.4} max={1.8} step={0.01} digits={2} onChange={(x) => set("mu", x)} />
        <Slider label="Slit to biprism a" value={a} min={5} max={50} step={1} digits={0} unit=" cm" onChange={(x) => set("a", x)} />
        <Slider label="Biprism to eyepiece b" value={b} min={20} max={150} step={1} digits={0} unit=" cm" onChange={(x) => set("b", x)} />
        <Check label="Thin sheet in the upper beam" checked={sheet} onChange={(x) => set("sheet", x)} />
        <Slider label="Sheet thickness t" value={t} min={0.5} max={20} step={0.1} digits={2} unit=" µm" onChange={(x) => set("t", x)} />
        <Slider label="Sheet index μ_s" value={ms} min={1.3} max={1.8} step={0.01} digits={2} onChange={(x) => set("ms", x)} />
      </>}
      note={<>
        <p>A <b>biprism</b> is two thin prisms joined at their bases. Each half bends the light from the slit towards the middle, so the two beams seem to come from two <b>virtual sources</b> (purple) a distance d = 2a(μ − 1)α apart. Being images of one slit, they are <b>coherent</b>, and where the beams overlap (shaded) they interfere: bright fringes where the path difference is nλ, with fringe width <b>β = λD/d</b> (D = a + b). The screen on the right is a magnified 3 mm strip, as seen through the eyepiece; the ray diagram is not to scale.</p>
        <p className="mt-2">Put a thin sheet (thickness t, index μ<sub>s</sub>) in one beam: its optical path grows by (μ<sub>s</sub> − 1)t, so the whole pattern slides towards that beam by <b>x₀ = (μ<sub>s</sub> − 1)tD/d</b>, which is (μ<sub>s</sub> − 1)t/λ fringe widths (red marker vs grey zero). Counting the shifted fringes gives t. <b>Try:</b> change λ (β ∝ λ), make α smaller (d shrinks, fringes widen but the field narrows), then switch on the sheet.</p>
      </>}
    />
  );
}
