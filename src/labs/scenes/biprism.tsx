"use client";
import { Line } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";
import { biprism, nmHex, twoBeam } from "../sim/phyy";
import { LabFrame, Check, Slider } from "../ui";
import { useLabParams } from "../params";
import { PHYY_SPECS } from "../meta/phyy.specs";
import { Ball, Box, Instances, type Inst, type V3 } from "../kit";
import { Flow, mix } from "../kit2";

const XS = -4.6, XSCR = 4.4, H = 1.5, NS = 150, WIN_MM = 3, SCR_H = 4;

/** High-precision Fresnel double-prism geometry */
function prismGeometry(x0: number, ridge: number) {
  const s = new THREE.Shape();
  s.moveTo(x0, -H);
  s.lineTo(x0 + 0.1, -H);
  s.lineTo(x0 + 0.1 + ridge, 0);
  s.lineTo(x0 + 0.1, H);
  s.lineTo(x0, H);
  s.lineTo(x0, -H);
  const g = new THREE.ExtrudeGeometry(s, { depth: 2.2, bevelEnabled: true, bevelSegments: 3, bevelSize: 0.02, bevelThickness: 0.02 });
  g.translate(0, 0, -1.1);
  return g;
}

export default function BiprismLab() {
  const [P, set, reset] = useLabParams(PHYY_SPECS.biprism);
  const { lam, alpha, mu, a, b, sheet, t, ms } = P;
  const r = biprism(lam, alpha, mu, a, b, sheet ? t : 0, ms);
  const col = nmHex(lam);
  const aV = Math.min(6.5, Math.max(1.2, (9 * a) / (a + b))),
    xp = XS + aV,
    bV = XSCR - xp;
  const dV = Math.min(1.6, 0.25 + r.d * 40);
  const geo = useMemo(() => prismGeometry(xp, 0.06 + alpha * 0.1), [xp, alpha]);

  const rays = useMemo(() => {
    const out: { inc: V3[]; out: V3[]; back: V3[] }[] = [];
    for (const sgn of [1, -1])
      for (const f of [0.12, 0.45, 0.8]) {
        const yp = (sgn * f * H),
          vy = (sgn * dV) / 2,
          ys = yp + (bV * (yp - vy)) / aV;
        out.push({
          inc: [
            [XS, 0, 0],
            [xp, yp, 0],
          ],
          out: [
            [xp + 0.1, yp, 0],
            [XSCR, ys, 0],
          ],
          back: [
            [xp, yp, 0],
            [XS, vy, 0],
          ],
        });
      }
    return out;
  }, [xp, aV, bV, dV]);

  const F = (dV / 2) * (bV / aV);
  const overlap = useMemo(
    () =>
      new THREE.BufferGeometry().setAttribute(
        "position",
        new THREE.Float32BufferAttribute([xp + 0.1, 0, 0, XSCR, F, 0, XSCR, -F, 0], 3)
      ),
    [xp, F]
  );

  const strips = useMemo<Inst[]>(() => {
    const out: Inst[] = [],
      lamM = lam * 1e-9;
    for (let i = 0; i < NS; i++) {
      const yv = -SCR_H / 2 + ((i + 0.5) * SCR_H) / NS,
        yReal = (yv / SCR_H) * WIN_MM * 1e-3;
      const inField = Math.abs(yReal) <= r.field / 2;
      const I = inField ? twoBeam(yReal, lamM, r.d, r.D, r.shift) : 0.04;
      out.push({
        p: [XSCR - 0.04, yv, 0],
        s: [0.03, SCR_H / NS + 0.002, 2.2],
        c: mix("#090e13", col, I),
      });
    }
    return out;
  }, [lam, r.field, r.d, r.D, r.shift, col]);

  const shiftV = Math.max(-SCR_H / 2, Math.min(SCR_H / 2, ((r.shift * 1000) / WIN_MM) * SCR_H));
  const flowA = rays[1],
    flowB = rays[4];
  const pathA = useMemo<V3[]>(() => [flowA.inc[0], flowA.inc[1], flowA.out[1]], [flowA]);
  const pathB = useMemo<V3[]>(() => [flowB.inc[0], flowB.inc[1], flowB.out[1]], [flowB]);

  return (
    <LabFrame
      label="Fresnel's Optical Biprism: monochromatic slit lamp, glass double-prism, coherent virtual twin sources S₁-S₂, and micrometer eyepiece interference fringes"
      camera={[0.8, 1.6, 9.5]}
      onReset={reset}
      note={
        <p>
          Fresnel&apos;s Biprism uses a thin glass prism with an obtuse angle of ~179° to refract light into two overlapping beams that appear to originate from two coherent <b>virtual sources S₁ and S₂</b> separated by <b>d = 2a(μ − 1)α</b>. The resulting fringe width is given by <b>β = λD / d</b>. Inserting a thin transparent mica sheet of thickness <b>t</b> in one path introduces an optical path difference Δ = (μ − 1)t, shifting the central zero-order fringe by <b>x₀ = (μ − 1)tD / d</b>.
        </p>
      }
      scene={() => (
        <group>
          {/* Heavy Optical Breadboard Rail */}
          <mesh position={[0, -2.4, 0]}>
            <boxGeometry args={[11.5, 0.22, 2.6]} />
            <meshStandardMaterial color="#0f172a" metalness={0.85} roughness={0.25} />
          </mesh>

          {/* Slit Source Light Housing & Base */}
          <group position={[XS, 0, 0]}>
            <mesh position={[0, -1.2, 0]}>
              <cylinderGeometry args={[0.08, 0.08, 2.2, 16]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
            </mesh>
            <mesh position={[-0.45, 0, 0]}>
              <boxGeometry args={[0.8, 1.2, 0.9]} />
              <meshStandardMaterial color="#1e293b" metalness={0.8} />
            </mesh>
            <Ball p={[-0.2, 0, 0]} r={0.22} c={col} glow={1.2} />
            {/* Narrow illuminated slit */}
            <Box p={[0, 0, 0]} s={[0.08, 0.6, 1.6]} c={col} glow={1.0} />
          </group>

          {/* Virtual Source Beacons */}
          <Ball p={[XS, dV / 2, 0.02]} r={0.1} c="#a855f7" glow={0.9} />
          <Ball p={[XS, -dV / 2, 0.02]} r={0.1} c="#a855f7" glow={0.9} />

          {/* Biprism Carrier Post & Glass Crystal */}
          <group position={[xp, 0, 0]}>
            <mesh position={[0.05, -1.2, 0]}>
              <cylinderGeometry args={[0.08, 0.08, 2.2, 16]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
            </mesh>
            <mesh geometry={geo}>
              <meshPhysicalMaterial
                color="#e0f2fe"
                transparent
                opacity={0.4}
                roughness={0.05}
                transmission={0.8}
                ior={1.52}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>

          {/* Coherent Ray Paths & Virtual Back-projections */}
          {rays.map((ry, i) => (
            <group key={i}>
              <Line points={ry.inc} color={col} lineWidth={1.8} transparent opacity={0.85} />
              <Line points={ry.out} color={col} lineWidth={1.8} transparent opacity={0.85} />
              {(i === 0 || i === 3) && (
                <Line points={ry.back} color="#c084fc" lineWidth={1.2} dashed dashSize={0.12} gapSize={0.08} />
              )}
            </group>
          ))}

          {/* Overlapping Beam Volume */}
          <mesh geometry={overlap}>
            <meshBasicMaterial color={col} transparent opacity={0.2} side={THREE.DoubleSide} />
          </mesh>

          {/* Photon Flow Streamlines */}
          <Flow path={pathA} n={8} speed={0.35} color={col} r={0.06} />
          <Flow path={pathB} n={8} speed={0.35} color={col} r={0.06} />

          {/* Optional Thin Mica Sheet Holder */}
          {sheet && (
            <group position={[xp + bV * 0.3, H * 0.55, 0]}>
              <Box p={[0, 0, 0]} s={[0.06 + t * 0.012, H * 0.85, 1.8]} c="#22c55e" o={0.5} />
            </group>
          )}

          {/* Micrometer Eyepiece Detector Screen Carrier */}
          <group position={[XSCR, 0, 0]}>
            <mesh position={[0.05, -1.2, 0]}>
              <cylinderGeometry args={[0.1, 0.1, 2.2, 16]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
            </mesh>
            <Box p={[0.05, 0, 0]} s={[0.08, SCR_H + 0.3, 2.6]} c="#0f172a" />
          </group>

          <Instances items={strips} cap={NS} />

          {/* Vernier Eyepiece Crosswire Target */}
          <mesh position={[XSCR - 0.1, shiftV, 1.35]} rotation={[0, 0, Math.PI / 2]}>
            <coneGeometry args={[0.1, 0.25, 16]} />
            <meshStandardMaterial color="#ef4444" emissive="#dc2626" emissiveIntensity={0.8} />
          </mesh>
          <mesh position={[XSCR - 0.1, 0, -1.35]} rotation={[0, 0, Math.PI / 2]}>
            <coneGeometry args={[0.08, 0.2, 16]} />
            <meshStandardMaterial color="#e2e8f0" />
          </mesh>
        </group>
      )}
      readouts={[
        ["Virtual source spacing d", `${(r.d * 1000).toFixed(3)} mm`],
        ["Fringe width β = λD/d", `${(r.beta * 1000).toFixed(4)} mm`],
        ["Fringes in overlap field", r.nFringes.toFixed(0)],
        ["Mica sheet fringe shift", sheet ? `${(r.shift * 1000).toFixed(3)} mm` : "No sheet inserted"],
        ["Shift in whole fringes", sheet ? r.shiftFringes.toFixed(2) : "0.00"],
      ]}
      controls={
        <>
          <Slider label="Source light wavelength λ" value={lam} min={400} max={700} step={1} digits={1} unit=" nm" onChange={(x) => set("lam", x)} />
          <Slider label="Biprism acute angle α" value={alpha} min={0.3} max={3} step={0.05} digits={2} unit="°" onChange={(x) => set("alpha", x)} />
          <Slider label="Glass refractive index μ" value={mu} min={1.4} max={1.75} step={0.01} digits={2} onChange={(x) => set("mu", x)} />
          <Slider label="Distance a (Slit $\\rightarrow$ Biprism)" value={a} min={10} max={60} step={1} digits={0} unit=" cm" onChange={(x) => set("a", x)} />
          <Slider label="Distance b (Biprism $\\rightarrow$ Eyepiece)" value={b} min={20} max={120} step={1} digits={0} unit=" cm" onChange={(x) => set("b", x)} />
          <Check label="Insert Thin Transparent Sheet" checked={sheet} onChange={(x) => set("sheet", x)} />
          {sheet && <Slider label="Sheet thickness t" value={t} min={0.5} max={25} step={0.5} digits={1} unit=" μm" onChange={(x) => set("t", x)} />}
        </>
      }
    />
  );
}
