"use client";
import { useMemo } from "react";
import { HALF_LABEL, halfCoeffs, halfEnergy, halfF, halfSum, type HalfId } from "../sim/mathii";
import { LabFrame, Slider, Pick } from "../ui";
import { useLabParams } from "../params";
import { MATHII_SPECS } from "../meta/mathii.specs";
import { Graph, type XY } from "../kit2";
import { Instances, type Inst } from "../kit";
import { C, Sway, fmt } from "./mathii-kit";

const NMAX = 40;
function ext(id: HalfId, kind: "sine" | "cosine", L: number, x: number): number {
  const s = ((((x + L) % (2 * L)) + 2 * L) % (2 * L)) - L;
  return kind === "sine" ? (s >= 0 ? halfF(id, L, s) : -halfF(id, L, -s)) : halfF(id, L, Math.abs(s));
}

export default function HalfRangeLab() {
  const [P, set, reset] = useLabParams(MATHII_SPECS.halfrange);
  const { u, fn, kind, N, L } = P;
  const n = Math.round(N), x = u * L;
  const coef = useMemo(() => halfCoeffs(fn, kind, L, NMAX), [fn, kind, L]);
  const fExt = useMemo(() => Array.from({ length: 241 }, (_, i) => { const q = -L + (3 * L * i) / 240; return [q, ext(fn, kind, L, q)] as XY; }), [fn, kind, L]);
  const sPts = useMemo(() => Array.from({ length: 241 }, (_, i) => { const q = -L + (3 * L * i) / 240; return [q, halfSum(kind, coef, L, n, q)] as XY; }), [kind, coef, L, n]);
  const fx = halfF(fn, L, x), sx = halfSum(kind, coef, L, n, x);
  const en = halfEnergy(fn, kind, L, coef, n);
  const start = kind === "sine" ? 0 : 1;
  const mx = Math.max(1e-9, ...coef.map(Math.abs));
  const ymax = Math.max(1e-6, ...fExt.map((p) => Math.abs(p[1]))) * 1.35;
  const bars: Inst[] = useMemo(() => {
    const out: Inst[] = [];
    for (let k = 0; k < NMAX; k++) {
      const v = coef[k + start] ?? 0, h = Math.max(0.02, (Math.abs(v) / mx) * 0.9), on = k + 1 <= n;
      out.push({ p: [-3.7 + k * 0.19, (v >= 0 ? h / 2 : -h / 2) - 0.3, 0], s: [0.13, h, 0.13], c: on ? (v >= 0 ? C.blue : C.orange) : C.grey });
    }
    return out;
  }, [coef, start, mx, n]);
  const lastC = coef[n - 1 + start] ?? 0, endV = halfSum(kind, coef, L, n, L);
  const xmin = -L, xmax = 2 * L;
  return (
    <LabFrame
      label="A graph of the half-range Fourier partial sum in gold over the periodic extension of f in blue, with a row of 3D bars below showing every coefficient, the used ones coloured and the rest grey"
      camera={[0, 1.2, 9.5]}
      onReset={reset}
      scene={() => (<group>
        <Sway amp={0.2}>
          <Graph x0={-4} y0={0.6} w={8} h={3.2} xr={[xmin, xmax]} yr={[-ymax, ymax]} grid={6} marker={[x, sx]} markerColor={C.red}
            curves={[{ pts: fExt, color: C.blue, w: 3 }, { pts: sPts, color: C.gold, w: 3.4 }]}
            vlines={[{ x: 0, color: C.grey }, { x: L, color: C.grey }, { x, color: C.light }]} />
          <Instances items={bars} cap={NMAX} />
          <mesh position={[0, -0.32, -0.05]}><boxGeometry args={[8.2, 0.02, 0.4]} /><meshStandardMaterial color="#5b6d77" /></mesh>
        </Sway>
      </group>)}
      readouts={[
        ["f(x) at the probe", fmt(fx, 4)],
        [`Partial sum S${n}(x)`, fmt(sx, 4)],
        ["Error f − S", fmt(fx - sx, 4)],
        [kind === "sine" ? `b${n}` : `a${n}`, fmt(lastC, 4)],
        ["Parseval: energy captured", `${(en.frac * 100).toFixed(2)} %`],
        [`S${n} at x = L (f(L) = ${fmt(halfF(fn, L, L), 3)})`, fmt(endV, 4)],
      ]}
      controls={<>
        <Slider label="Probe position x / L" value={u} min={0} max={1} step={0.01} digits={2} onChange={(v) => set("u", v)} />
        <Pick label="Function f(x) on (0, L)" value={fn} options={(Object.keys(HALF_LABEL) as HalfId[]).map((k) => ({ id: k, label: HALF_LABEL[k] }))} onChange={(v) => set("fn", v)} />
        <Pick label="Series" value={kind} options={[{ id: "sine", label: "Half-range sine series (odd extension)" }, { id: "cosine", label: "Half-range cosine series (even extension)" }]} onChange={(v) => set("kind", v)} />
        <Slider label="Number of harmonics N" value={N} min={1} max={40} step={1} digits={0} onChange={(v) => set("N", v)} />
        <Slider label="Half-period L" value={L} min={1} max={6.3} step={0.01} digits={2} onChange={(v) => set("L", v)} />
      </>}
      note={<p>A function given only on (0, L) can be expanded in a <b>half-range sine series</b>, f = Σ bₙ sin(nπx/L) with bₙ = (2/L)∫₀ᴸ f sin(nπx/L) dx, or a <b>half-range cosine series</b>, f = a₀/2 + Σ aₙ cos(nπx/L) with aₙ = (2/L)∫₀ᴸ f cos(nπx/L) dx. They correspond to extending f as an odd or an even function of period 2L (blue curve beyond the interval). The bars are bₙ or aₙ (blue positive, orange negative). Notice the cosine series converges faster for continuous f because the even extension has no jump. At a jump the series gives the average [f(x⁺) + f(x⁻)]/2 (Dirichlet): the sine series of f = x equals 0, not L, at x = L. PYQ Q3.5: cosine series of x², |cos x| and sin(πt/l), sine series of x.</p>}
    />
  );
}
