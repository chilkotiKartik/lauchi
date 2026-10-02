"use client";
import { PAR_LABEL, parCoeffs, parDeduce, parEnergy, parNorm, parSum, type ParId } from "../sim/mathii";
import { LabFrame, Slider, Pick } from "../ui";
import { useLabParams } from "../params";
import { MATHII_SPECS } from "../meta/mathii.specs";
import { Graph, type XY } from "../kit2";
import { Instances, type Inst } from "../kit";
import { C, Sway, fmt, ramp } from "./mathii-kit";

const NM = 60;
const fOf = (id: ParId, x: number) => (id === "x" ? x : id === "xsq" ? x * x : id === "abs" ? Math.abs(x) : x < 0 ? -1 : 1);

export default function ParsevalLab() {
  const [P, set, reset] = useLabParams(MATHII_SPECS.parseval);
  const { N, fn } = P;
  const n = Math.round(N);
  const total = parNorm(fn), part = parEnergy(fn, n), frac = Math.min(1, part / total), ded = parDeduce(fn, n);
  const curves = (() => {
    const f: XY[] = [], s: XY[] = [];
    for (let i = 0; i <= 200; i++) {
      const x = -Math.PI + (2 * Math.PI * i) / 200;
      f.push([x, i === 100 && fn === "sq" ? 0 : fOf(fn, x)]); s.push([x, parSum(fn, n, x)]);
    }
    return { f, s };
  })();
  const bars: Inst[] = (() => {
    const e = Array.from({ length: NM }, (_, k) => { const c = parCoeffs(fn, k + 1); return c.a * c.a + c.b * c.b; });
    const mx = Math.max(1e-12, ...e), out: Inst[] = [];
    e.forEach((v, k) => { const h = Math.max(0.015, (v / mx) * 1.8); out.push({ p: [0.3 + k * 0.09, h / 2, 0], s: [0.065, h, 0.065], c: k + 1 <= n ? C.green : C.grey }); });
    return out;
  })();
  const lvl = Math.max(0.02, frac * 2.4), r = ramp(frac), liquid = "#" + r.map((v) => Math.round(v * 255).toString(16).padStart(2, "0")).join("");
  const ymax = fn === "xsq" ? 10.5 : fn === "sq" ? 1.6 : 3.6;
  return (
    <LabFrame
      label="A glass tank that fills with colour as more Fourier harmonics are added until it reaches the total energy mark, a row of green bars for the energy of each harmonic, and a graph of the function with its Fourier partial sum behind"
      camera={[0, 2.2, 9.5]}
      onReset={reset}
      scene={() => (<group>
        <Sway amp={0.2}>
          <Graph x0={-4.6} y0={2.9} w={9.2} h={2.5} z={-1.2} xr={[-Math.PI, Math.PI]} yr={[fn === "xsq" || fn === "abs" ? -0.5 : -ymax, ymax]} grid={6} curves={[{ pts: curves.f, color: C.blue, w: 3 }, { pts: curves.s, color: C.gold, w: 3.2 }]} />
          <group position={[-3.6, 0, 0.5]}>
            <mesh position={[0, 1.2, 0]}><cylinderGeometry args={[0.8, 0.8, 2.4, 32, 1, true]} /><meshStandardMaterial color="#e8f1f5" transparent opacity={0.28} side={2} /></mesh>
            <mesh position={[0, lvl / 2, 0]}><cylinderGeometry args={[0.76, 0.76, lvl, 32]} /><meshStandardMaterial color={liquid} emissive={liquid} emissiveIntensity={0.35} /></mesh>
            <mesh position={[0, 2.4, 0]} rotation={[-Math.PI / 2, 0, 0]}><torusGeometry args={[0.82, 0.03, 8, 40]} /><meshStandardMaterial color={C.gold} emissive={C.gold} emissiveIntensity={0.8} /></mesh>
            <mesh position={[0, -0.05, 0]}><cylinderGeometry args={[1, 1, 0.1, 32]} /><meshStandardMaterial color="#33454e" /></mesh>
          </group>
          <group position={[-1.3, 0, 0.5]}>
            <Instances items={bars} cap={NM} />
            <mesh position={[2.75, -0.02, 0]}><boxGeometry args={[5.6, 0.04, 0.3]} /><meshStandardMaterial color="#5b6d77" /></mesh>
          </group>
        </Sway>
      </group>)}
      readouts={[
        [`a₀²/2 + Σ(aₙ² + bₙ²), n ≤ ${n}`, fmt(part, 5)],
        ["(1/π)∫ f² dx  (Parseval total)", fmt(total, 5)],
        ["Energy captured", `${(frac * 100).toFixed(3)} %`],
        [`${ded.label} (from Parseval)`, fmt(ded.est, 6)],
        ["Exact value", fmt(ded.exact, 6)],
        ["Error", fmt(ded.exact - ded.est, 6)],
      ]}
      controls={<>
        <Slider label="Number of harmonics N" value={N} min={1} max={60} step={1} digits={0} onChange={(v) => set("N", v)} />
        <Pick label="Function f(x) on (−π, π)" value={fn} options={(Object.keys(PAR_LABEL) as ParId[]).map((k) => ({ id: k, label: PAR_LABEL[k] }))} onChange={(v) => set("fn", v)} />
      </>}
      note={<p><b>Parseval&apos;s theorem</b> says the energy of a function equals the energy of its Fourier coefficients: (1/π)∫₋π^π [f(x)]² dx = a₀²/2 + Σ(aₙ² + bₙ²). The tank is the left side; every harmonic pours in its own energy aₙ² + bₙ² (the bars), and the level approaches the gold mark. Because the integral of f² is known, the identity <i>sums a numerical series</i>: for f = x it gives 4Σ1/n² = 2π²/3, so Σ1/n² = π²/6; for f = x² it gives Σ1/n⁴ = π⁴/90; for |x| the odd terms give Σ1/n⁴ = π⁴/96; for the square wave Σ1/n² over odd n = π²/8. These are exactly the deductions asked in PYQ Q3.3 and Q3.5. Raise N to see the estimate close in on the exact value; the sine-type series converge slowly, the n⁻⁴ ones very fast.</p>}
    />
  );
}
