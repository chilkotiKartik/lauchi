"use client";
import { Line } from "@react-three/drei";
import { useLayoutEffect, useRef, type ReactNode } from "react";
import * as THREE from "three";
import { E3_MATS, eig3, fmt, polyText, scaleMat, spectralNorm, type E3Id, type Mat } from "../sim/mathi";
import { Tick } from "../Stage";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { MATHI_SPECS } from "../meta/mathi.specs";
import { C, Dot, Spin, type V3 } from "./mathi-kit";

const LC = [C.gold, C.green, C.purple];
/** Mesh whose matrix is the 3×3 linear map M (maths axes), so a unit sphere becomes the image ellipsoid exactly. */
function Warp({ M, children }: { M: Mat; children: ReactNode }) {
  const g = useRef<THREE.Group>(null);
  useLayoutEffect(() => {
    const m = g.current;
    if (!m) return;
    m.matrixAutoUpdate = false;
    m.matrix.set(M[0][0], M[0][1], M[0][2], 0, M[1][0], M[1][1], M[1][2], 0, M[2][0], M[2][1], M[2][2], 0, 0, 0, 0, 1);
    m.matrixWorldNeedsUpdate = true;
  }, [M]);
  return <group ref={g}>{children}</group>;
}
const mix = (A: Mat, t: number): Mat => A.map((r, i) => r.map((v, j) => (1 - t) * (i === j ? 1 : 0) + t * v));
export default function Eigen3dLab() {
  const [P, set, reset] = useLabParams(MATHI_SPECS.eigen3d);
  const { mat, k, t } = P;
  const A = scaleMat(E3_MATS[mat].M, k), e = eig3(A);
  const sn = Math.max(spectralNorm(mix(A, 1)), 1), view = 2.5 / Math.max(1, sn), Mt = mix(A, t).map((r) => r.map((v) => v * view));
  const ball = useRef<THREE.Group>(null), clock = useRef(0);
  const tick = (dt: number) => {
    clock.current += Math.min(dt, 0.05) * 0.6;
    const th = clock.current, x = Math.cos(th), y = Math.sin(th) * 0.8, z = Math.sin(th) * 0.6;
    ball.current?.position.set(Mt[0][0] * x + Mt[0][1] * y + Mt[0][2] * z, Mt[2][0] * x + Mt[2][1] * y + Mt[2][2] * z, -(Mt[1][0] * x + Mt[1][1] * y + Mt[1][2] * z));
  };
  const axes: { v: V3; l: number; c: string; plane: boolean }[] = [];
  e.groups.forEach((g, gi) => g.vectors.forEach((v) => axes.push({ v, l: ((1 - t) + t * g.l) * view, c: LC[gi % 3], plane: g.vectors.length > 1 })));
  const pt = (v: V3, s: number): V3 => [v[0] * s, v[2] * s, -v[1] * s];
  const pairsTxt = e.groups.map((g) => `λ = ${fmt(g.l, 3)}: ${g.vectors.map((v) => `(${v.map((x) => fmt(x, 2)).join(", ")})`).join(" and ")}`);
  return (
    <LabFrame
      label="A glass unit sphere being stretched into an ellipsoid by a 3 by 3 matrix, with the glowing eigenvector axes along which it only stretches, never turns"
      camera={[5.2, 3.6, 6]}
      onReset={reset}
      scene={() => (<Spin speed={0.1}><group>
        <Tick fn={tick} />
        <mesh><sphereGeometry args={[view, 20, 14]} /><meshBasicMaterial color={C.light} wireframe transparent opacity={0.2} /></mesh>
        <group rotation={[-Math.PI / 2, 0, 0]}>
          <Warp M={Mt.map((r) => r.slice())}>
            <mesh><sphereGeometry args={[1, 32, 22]} /><meshStandardMaterial color={C.blue} transparent opacity={0.5} roughness={0.3} emissive={C.blue} emissiveIntensity={0.15} depthWrite={false} /></mesh>
            <mesh><sphereGeometry args={[1.005, 20, 14]} /><meshBasicMaterial color={C.white} wireframe transparent opacity={0.25} /></mesh>
          </Warp>
        </group>
        {axes.map((a, i) => (
          <group key={i}>
            <Line points={[pt(a.v, -Math.abs(a.l) - 0.3), pt(a.v, Math.abs(a.l) + 0.3)]} color={a.c} lineWidth={3.5} />
            <Dot p={pt(a.v, a.l)} r={0.12} c={a.c} glow={1} />
          </group>
        ))}
        {axes.some((a) => a.plane) && <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -view, 0]}><ringGeometry args={[view * 0.9, view * 1.0, 40]} /><meshBasicMaterial color={C.orange} transparent opacity={0.35} side={THREE.DoubleSide} /></mesh>}
        <group ref={ball}><Dot p={[0, 0, 0]} r={0.12} c={C.red} glow={0.9} /></group>
        <gridHelper args={[7, 14, "#3a4d57", "#26343c"]} position={[0, -2.7, 0]} />
      </group></Spin>)}
      readouts={[
        ["Characteristic equation", `${polyText(e.c)} = 0`],
        ["Eigenvalues", e.complex ? `${e.values.map((v) => fmt(v, 3)).join(", ")} and ${fmt(e.complex.re, 3)} ± ${fmt(e.complex.im, 3)} i` : e.values.map((v) => fmt(v, 3)).join(", ")],
        ["Sum = trace;  product = |A|", `${fmt(e.values.reduce((s, v) => s + v, 0) + (e.complex ? 2 * e.complex.re : 0), 3)} = ${fmt(e.trace, 3)};  ${fmt(e.det, 3)}`],
        ["Eigenvectors", pairsTxt.join("  |  ")],
        ["Diagonalisable?", e.diagonalizable ? "Yes (3 independent eigenvectors)" : "No"],
        ["Largest stretch of the sphere", fmt(spectralNorm(A), 3)],
      ]}
      controls={<>
        <Slider label="Scale factor k in kA" value={k} min={0.5} max={2} step={0.05} digits={2} onChange={(v) => set("k", v)} />
        <Slider label="Morph from sphere to ellipsoid" value={t} min={0} max={1} step={0.05} digits={2} onChange={(v) => set("t", v)} />
        <Pick label="Matrix" value={mat} options={(Object.keys(E3_MATS) as E3Id[]).map((m) => ({ id: m, label: E3_MATS[m].label }))} onChange={(v) => set("mat", v)} />
      </>}
      note={<>
        <p><b>Eigenvalues and eigenvectors in 3D.</b> A maps the faint grey unit sphere to the blue ellipsoid. Along an eigenvector Av = λv the map only stretches (or flips, if λ &lt; 0) by λ, so the glowing rods through the sphere never change direction: the gold, green and purple dots sit at λ·v. The roots of |A − λI| = 0 add up to the trace and multiply to |A|. The red ball rides along a path on the sphere and is carried by the map. For symmetric matrices the three rods are perpendicular and are the ellipsoid&apos;s principal axes; the orange ring appears when an eigenvalue repeats, because then a whole plane of eigenvectors exists.</p>
        <p className="mt-2"><b>Try.</b> PYQ: A = [−2 5 4; 5 7 5; 4 5 −2] has eigenvalues 12, −3, −6. The triangular matrix shows its diagonal entries 5, 3, 2 as eigenvalues. The repeated-eigenvalue matrix [6 −2 2; −2 3 −1; 2 −1 3] (λ = 2, 2, 8) still has three independent eigenvectors. Slide k: every eigenvalue scales by k, the eigenvectors do not move.</p>
      </>}
    />
  );
}
