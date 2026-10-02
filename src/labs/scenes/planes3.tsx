"use client";
import { Line, Edges } from "@react-three/drei";
import { useMemo } from "react";
import { SYSTEMS, fmt, pairLine, planePolygon, planesInfo, type SysId, type V3 as VV } from "../sim/mathi";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { MATHI_SPECS } from "../meta/mathi.specs";
import { C, Dot, GeoMesh, P3, Spin, Triad, fanGeo, type V3 } from "./mathi-kit";

const R = 12, K = 3 / R, PC = [C.red, C.blue, C.green];
function clipLine(pt: VV, dir: VV): [V3, V3] | null {
  let lo = -1e9, hi = 1e9;
  for (let i = 0; i < 3; i++) {
    if (Math.abs(dir[i]) < 1e-9) { if (Math.abs(pt[i]) > R) return null; continue; }
    const t1 = (-R - pt[i]) / dir[i], t2 = (R - pt[i]) / dir[i];
    lo = Math.max(lo, Math.min(t1, t2)); hi = Math.min(hi, Math.max(t1, t2));
  }
  if (lo >= hi) return null;
  const at = (t: number): V3 => P3((pt[0] + dir[0] * t) * K, (pt[1] + dir[1] * t) * K, (pt[2] + dir[2] * t) * K);
  return [at(lo), at(hi)];
}
const eqn = (r: number[]) => {
  const t = (c: number, v: string, first: boolean) => (Math.abs(c) < 1e-9 ? "" : `${c < 0 ? "−" : first ? "" : "+"} ${Math.abs(c) === 1 ? "" : fmt(Math.abs(c), 1).replace(/\.0$/, "")}${v} `);
  let s = t(r[0], "x", true) + t(r[1], "y", !t(r[0], "x", true)) + t(r[2], "z", false);
  s = s.trim().replace(/^\+ /, "");
  return `${s} = ${fmt(r[3], 1).replace(/\.0$/, "")}`;
};

export default function Planes3Lab() {
  const [P, set, reset] = useLabParams(MATHI_SPECS.planes3);
  const { sys, lam, mu } = P;
  const info = planesInfo(sys, lam, mu), M = info.M;
  const polys = useMemo(() => {
    const m = SYSTEMS[sys].rows(lam, mu);
    return m.map((r) => planePolygon([r[0], r[1], r[2]], r[3], R).map((p) => P3(p[0] * K, p[1] * K, p[2] * K)));
  }, [sys, lam, mu]);
  const geos = useMemo(() => polys.map((p) => (p.length >= 3 ? fanGeo(p) : null)), [polys]);
  const sol = info.sol;
  const pairs: [V3, V3][] = [];
  if (sol.kind === "none") {
    for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) {
      const L = pairLine([M[i][0], M[i][1], M[i][2]], M[i][3], [M[j][0], M[j][1], M[j][2]], M[j][3]);
      const cl = L && clipLine(L.pt, L.dir);
      if (cl) pairs.push(cl);
    }
  }
  const solLine = sol.kind === "line" ? clipLine(sol.pt, sol.dir) : null;
  const inside = sol.kind === "unique" && sol.pt.every((v) => Math.abs(v) <= R);
  return (
    <LabFrame
      label="Three coloured planes inside a cube: they meet in one point, a line, or not at all depending on the values of lambda and mu"
      camera={[4.2, 3.4, 6.4]}
      onReset={reset}
      scene={() => (<Spin speed={0.1}><group>
        <mesh><boxGeometry args={[6, 6, 6]} /><meshBasicMaterial visible={false} /><Edges color="#5b6d77" /></mesh>
        <Triad len={3} />
        {geos.map((g, i) => g && <GeoMesh key={i} geo={g} vc={false} color={PC[i]} o={0.38} />)}
        {polys.map((p, i) => p.length >= 3 && <Line key={i} points={[...p, p[0]]} color={PC[i]} lineWidth={2} />)}
        {inside && sol.kind === "unique" && <Dot p={P3(sol.pt[0] * K, sol.pt[1] * K, sol.pt[2] * K)} r={0.2} c={C.gold} glow={1} />}
        {solLine && <Line points={solLine} color={C.gold} lineWidth={6} />}
        {pairs.map((l, i) => <Line key={i} points={l} color={C.purple} lineWidth={4} />)}
      </group></Spin>)}
      readouts={[
        ["Rank of A", String(info.rankA)],
        ["Rank of [A | B]", String(info.rankAug)],
        ["Verdict", info.verdict],
        ["Solution", info.text],
        ["det A", fmt(info.detA, 3)],
        ["Plane 3", eqn(M[2])],
      ]}
      controls={<>
        <Slider label="λ (z-coefficient of plane 3)" value={lam} min={-5} max={12} step={0.5} digits={1} onChange={(v) => set("lam", v)} />
        <Slider label="μ (right side of plane 3)" value={mu} min={-10} max={40} step={0.5} digits={1} onChange={(v) => set("mu", v)} />
        <Pick label="System of equations" value={sys} options={(Object.keys(SYSTEMS) as SysId[]).map((k) => ({ id: k, label: SYSTEMS[k].label }))} onChange={(v) => set("sys", v)} />
      </>}
      note={<>
        <p><b>Each linear equation is a plane.</b> AX = B is consistent iff rank A = rank [A|B]. If both equal the number of unknowns (3) the planes meet in a single point (gold ball). If rank A = rank [A|B] = 2 they share a line (gold line). If rank A &lt; rank [A|B] they do not all meet: the three purple lines are where pairs of planes cross, forming a triangular prism (or the planes are parallel). The cube shows −12 ≤ x, y, z ≤ 12.</p>
        <p className="mt-2"><b>Try.</b> PYQ: x + y + z = 16, x + 2y + 5z = 10, 2x + 3y + λz = μ. The determinant is λ − 6, so any λ ≠ 6 gives a unique point. At λ = 6: μ = 26 gives infinitely many solutions (a line) and any other μ gives no solution. For the first PYQ system (2x − 5y + 2z = 8 …) the critical value is λ = 3 with μ = 5/2.</p>
      </>}
    />
  );
}
