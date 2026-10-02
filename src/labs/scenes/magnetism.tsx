"use client";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { MAGS, magnet, prng, sci, weissM, type MagMat } from "../sim/phyy";
import { Tick } from "../Stage";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { PHYY_SPECS } from "../meta/phyy.specs";
import { C, Box, Instances, type Inst } from "../kit";
import { Arrow, Graph, type XY } from "../kit2";
import { Circle } from "./phyy-kit";

const NX = 6, NY = 4, NZ = 4, N = NX * NY * NZ, SP = 0.62, X0 = -1.9;
const rnd = prng(41);
const POS = Array.from({ length: N }, (_, i) => { const ix = i % NX, iy = Math.floor(i / NX) % NY, iz = Math.floor(i / (NX * NY)); return [X0 + (ix - (NX - 1) / 2) * SP, (iy - (NY - 1) / 2) * SP, (iz - (NZ - 1) / 2) * SP] as const; });
const U = Array.from({ length: N }, () => { const z = rnd() * 2 - 1, a = rnd() * Math.PI * 2, s = Math.sqrt(1 - z * z); return [s * Math.cos(a), s * Math.sin(a), z] as const; });
const PH = Float32Array.from({ length: N }, () => rnd() * 6.28);
/** Four domains (closure-like): +x, −y, +y, −x; RANK orders atoms by distance from the +x domain so it grows outward as H rises. */
const DOM = POS.map((_, i) => (i % NX < NX / 2 ? 0 : 1) + (Math.floor(i / NX) % NY < NY / 2 ? 0 : 2));
const DDIR = [[1, 0, 0], [0, -1, 0], [0, 1, 0], [-1, 0, 0]] as const;
const RANK = (() => { const c = POS[0], d = POS.map((p) => Math.hypot(p[0] - c[0], p[1] - c[1], (p[2] - c[2]) * 0.3)); const idx = d.map((_, i) => i).sort((a, b) => d[a] - d[b]); const r = new Float32Array(N); idx.forEach((k, j) => { r[k] = j / N; }); return r; })();
const DCOL = [new THREE.Color(C.gold), new THREE.Color(C.green), new THREE.Color(C.blue), new THREE.Color(C.red)];
const _o = new THREE.Object3D(), _v = new THREE.Vector3(), _y = new THREE.Vector3(0, 1, 0), _c = new THREE.Color(), _p = new THREE.Color(C.purple), _g = new THREE.Color(C.gold), _r = new THREE.Color(C.red);

type Vis = { kind: "dia" | "para" | "ferro"; below: boolean; bias: number; jit: number; grow: number; len: number };
function paintMoments(m: THREE.InstancedMesh, v: Vis, t: number) {
  for (let i = 0; i < N; i++) {
    const p = POS[i], ph = PH[i];
    const len = v.len;
    if (v.kind === "dia") { _v.set(-1, 0, 0); _c.copy(_r); }
    else if (v.below) {
      const d = RANK[i] < v.grow ? 0 : DOM[i], dd = DDIR[d];
      _v.set(dd[0] + v.jit * Math.sin(t * 3 + ph), dd[1] + v.jit * Math.cos(t * 2.3 + ph * 1.7), dd[2] + v.jit * Math.sin(t * 2.7 + ph * 2.1)).normalize();
      _c.copy(DCOL[d]);
    } else {
      const u = U[i], b = v.bias;
      _v.set(u[0] * (1 - b) + b + v.jit * Math.sin(t * 3 + ph), u[1] * (1 - b) + v.jit * Math.cos(t * 2.3 + ph * 1.7), u[2] * (1 - b) + v.jit * Math.sin(t * 2.7 + ph * 2.1)).normalize();
      _c.copy(_p).lerp(_g, (_v.x + 1) / 2);
    }
    _o.position.set(p[0] + _v.x * len * 0.25, p[1] + _v.y * len * 0.25, p[2] + _v.z * len * 0.25);
    _o.quaternion.setFromUnitVectors(_y, _v);
    _o.scale.set(1, len / 0.4, 1);
    _o.updateMatrix(); m.setMatrixAt(i, _o.matrix); m.setColorAt(i, _c);
  }
  m.instanceMatrix.needsUpdate = true;
  if (m.instanceColor) m.instanceColor.needsUpdate = true;
}
function Moments({ v }: { v: Vis }) {
  const ref = useRef<THREE.InstancedMesh>(null), t = useRef(0);
  useLayoutEffect(() => { if (ref.current) paintMoments(ref.current, v, t.current); }, [v]);
  return (<>
    <Tick fn={(dt) => { t.current += Math.min(dt, 0.05); if (ref.current) paintMoments(ref.current, v, t.current); }} />
    <instancedMesh ref={ref} args={[undefined, undefined, N]} frustumCulled={false}><coneGeometry args={[0.08, 0.4, 10]} /><meshStandardMaterial color="#ffffff" emissive="#222222" /></instancedMesh>
  </>);
}

const MAT_OPTS: { id: MagMat; label: string }[] = [
  { id: "bi", label: "Bismuth (diamagnetic)" }, { id: "cu", label: "Copper (diamagnetic)" }, { id: "al2o3", label: "Alumina Al₂O₃ (diamagnetic)" },
  { id: "gd", label: "Gadolinium sulphate (paramagnetic)" }, { id: "fe", label: "Iron (ferromagnetic)" },
];

export default function MagnetismLab() {
  const [P, set, reset] = useLabParams(PHYY_SPECS.magnetism);
  const { H, T, mat } = P;
  const m = magnet(mat, H, T), info = MAGS[mat], Tc = info.Tc ?? 1043, below = m.kind === "ferro" && T < Tc;
  const fH = Math.min(1, Math.log10(1 + H) / 5);
  const vis = useMemo<Vis>(() => ({
    kind: m.kind, below, bias: Math.min(1, Math.cbrt(Math.max(0, m.align))),
    jit: below ? 0.05 + 0.7 * (1 - m.ms) : 0.2 + 0.5 * Math.min(1, T / 600), grow: below ? 0.25 + 0.75 * m.align : 0, len: m.kind === "dia" ? 0.08 + 0.3 * fH : 0.42,
  }), [m.kind, below, m.align, m.ms, T, fH]);
  const atoms = useMemo<Inst[]>(() => POS.map((p) => ({ p: [p[0], p[1], p[2]], s: [0.16, 0.16, 0.16], c: m.kind === "dia" ? "#9fd3ea" : m.kind === "para" ? "#c7b3ff" : C.light })), [m.kind]);
  const graph = useMemo(() => {
    if (m.kind === "dia") return { yr: [-1, 1] as XY, curves: [{ pts: [[0, -0.6], [1500, -0.6]] as XY[], color: C.red, w: 3 }], mk: [T, -0.6] as XY, vl: [] as { x: number; color: string }[] };
    if (m.kind === "para") return { yr: [0, 1] as XY, curves: [{ pts: [[0, 0], [1500, 1]] as XY[], color: C.purple, w: 3 }], mk: [T, T / 1500] as XY, vl: [] };
    const ms = Array.from({ length: 61 }, (_, i) => { const Ti = (Tc * i) / 60; return [Ti, weissM(Ti, Tc)] as XY; });
    return { yr: [0, 1.05] as XY, curves: [{ pts: ms, color: C.gold, w: 3 }, { pts: [[Tc, 0], [1500, 1]] as XY[], color: C.purple, w: 2.5, dashed: true }], mk: (T < Tc ? [T, weissM(T, Tc)] : [T, (T - Tc) / (1500 - Tc)]) as XY, vl: [{ x: Tc, color: C.red }] };
  }, [m.kind, T, Tc]);
  const law = m.kind === "dia" ? "χ < 0, independent of T (Langevin)" : m.kind === "para" ? `Curie law χ = C/T, C = ${m.curie.toFixed(2)} K` : below ? `Below T_C = ${Tc} K: M_s = ${(m.ms * 100).toFixed(1)} % of M_s(0)` : `Curie–Weiss χ = C/(T − T_C), C = ${m.curie.toFixed(2)} K`;
  const micro = m.kind === "dia" ? `Langevin orbit radius ⟨r²⟩^½ ≈ ${(m.rRms * 1e10).toFixed(2)} Å` : below ? `Domains aligned with H: ${(m.align * 100).toFixed(1)} %` : `Mean alignment ⟨cos θ⟩ = ${sci(m.align)}`;
  return (
    <LabFrame
      label="A block of atoms with their magnetic moments drawn as cones in an applied field (blue arrows): diamagnets show small induced moments opposing the field, paramagnets jiggle randomly with a slight bias along the field, and iron below its Curie temperature splits into coloured domains that grow along the field; a graph shows susceptibility or spontaneous magnetisation against temperature"
      camera={[0.6, 2.2, 10]}
      onReset={reset}
      scene={() => (<group>
        <Instances items={atoms} cap={N} shape="sphere" />
        <Moments v={vis} />
        {m.kind === "dia" && [0, 7, 15, 22, 40, 59].map((i) => <Circle key={i} p={[POS[i][0], POS[i][1], POS[i][2]]} r={0.2} axis="x" color={C.orange} w={1.5} seg={24} />)}
        {H > 0 && [-1.45, 1.45].map((y) => <Arrow key={y} from={[X0 - 2.4, y, 0]} to={[X0 + 2.4, y, 0]} color={C.blue} r={0.02 + 0.05 * fH} head={0.3} />)}
        <Graph x0={1.6} y0={-1.6} w={3.6} h={3.2} xr={[0, 1500]} yr={graph.yr} curves={graph.curves} marker={graph.mk} markerColor={C.green} vlines={graph.vl} />
        <Box p={[0, -2.2, 0]} s={[10, 0.08, 2]} c={C.dark} />
      </group>)}
      readouts={[
        ["Susceptibility χ = M/H", sci(m.chi)],
        ["Relative permeability μᵣ = 1 + χ", Math.abs(m.chi) < 0.01 ? (1 + m.chi).toFixed(7) : sci(1 + m.chi, 4)],
        ["Magnetisation M", `${sci(m.M)} A/m`],
        ["Flux density B = μ₀(H + M)", `${sci(m.B, 5)} T`],
        ["Temperature law", law],
        ["Microscopic picture", micro],
      ]}
      controls={<>
        <Slider label="Applied field H" value={H} min={0} max={100000} step={10} digits={0} unit=" A/m" onChange={(x) => set("H", x)} />
        <Slider label="Temperature T" value={T} min={1} max={1500} step={1} digits={0} unit=" K" onChange={(x) => set("T", x)} />
        <Pick label="Material" value={mat} options={MAT_OPTS} onChange={(x) => set("mat", x)} />
      </>}
      note={<>
        <p><b>Diamagnetism</b> (bismuth, copper, Al₂O₃): atoms have no permanent moment. An applied field speeds up or slows down the orbiting electrons (Lenz’s law), inducing tiny moments that <b>oppose</b> H, so χ is small and negative. Langevin’s theory gives <b>χ = −μ₀NZe²⟨r²⟩/6m</b>, which does not involve temperature at all; the lab inverts it to show the orbit size that the measured χ implies. <b>Paramagnetism</b>: each atom carries a permanent moment μ, randomly oriented by heat; the field only biases them slightly, M = Nμ L(μ₀μH/kT), giving <b>Curie’s law χ = C/T</b> with C = μ₀Nμ²/3k (1/χ against T is a straight line through the origin). <b>Ferromagnetism</b> (iron): neighbouring moments lock together into <b>domains</b>; a field makes the favourably oriented domains grow, giving enormous χ, hysteresis and saturation. Above the <b>Curie temperature</b> (1043 K) order is lost and χ = C/(T − T<sub>C</sub>).</p>
        <p className="mt-2"><b>Try:</b> the PYQ preset (Al₂O₃ at 10 A/m), cool the paramagnet and watch 1/χ, then heat iron through 1043 K. The ferromagnet below T<sub>C</sub> uses the Weiss mean-field M<sub>s</sub>(T) and a simple domain-growth curve (simplified model, no hysteresis; see the B–H loop lab for that). Moment alignment is drawn exaggerated.</p>
      </>}
    />
  );
}
