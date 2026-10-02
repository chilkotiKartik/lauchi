"use client";
import { useMemo } from "react";
import { eng, magCircuit } from "../sim/elecy";
import { LabFrame, Check, Slider } from "../ui";
import { useLabParams } from "../params";
import { ELECY_SPECS } from "../meta/elecy.specs";
import { Box, C, type V3 } from "../kit";
import { Coil, Flow, mix } from "../kit2";

const SUP = "⁰¹²³⁴⁵⁶⁷⁸⁹";
/** 1.02 × 10⁶ style. */
function sci(x: number) {
  if (!Number.isFinite(x)) return "∞";
  if (x === 0) return "0";
  const e = Math.floor(Math.log10(Math.abs(x))), m = x / 10 ** e;
  const sup = String(Math.abs(e)).split("").map((d) => SUP[Number(d)]).join("");
  return e === 0 ? m.toFixed(2) : `${m.toFixed(2)} × 10${e < 0 ? "⁻" : ""}${sup}`;
}
const ORIGIN: V3 = [0, 0, 0];

export default function MagneticGapLab() {
  const [P, set, reset] = useLabParams(ELECY_SPECS.magneticgap);
  const { N, I, lc, A, mur, g, ideal } = P;
  const m = magCircuit(N, I, lc, A, mur, g, ideal);
  const geo = useMemo(() => {
    const W = 2.2 + (2.2 * (lc - 10)) / 190, H = 0.72 * W, t = 0.2 + 0.08 * Math.sqrt(A), gv = g > 0 ? 0.06 + 0.12 * g : 0;
    const x0 = -W / 2 - 0.9, path: V3[] = [[x0, -H / 2, 0.02], [x0, H / 2, 0.02], [x0 + W, H / 2, 0.02], [x0 + W, -H / 2, 0.02], [x0, -H / 2, 0.02]];
    return { W, H, t, gv, x0, path, L: 2 * (W + H) };
  }, [lc, A, g]);
  const sat = m.B > 1.6, bN = Math.min(1, m.B / 1.6);
  const coilTurns = Math.round(Math.min(18, Math.max(4, N / 40)));
  const iron = ideal ? "#7d93a0" : mix("#55646d", "#9fb6c4", Math.min(1, Math.log10(mur) / 4));
  const colH = 2.6, share = m.gapShare;
  const { W, H, t, gv, x0 } = geo, xr = x0 + W, seg = (H - gv) / 2;
  return (
    <LabFrame
      label="A rectangular iron core with an orange magnetising coil on its left limb and an optional air gap in its right limb; blue flux dots circulate round the core, and two columns on the right compare the coil's mmf with the magnetic potential drops across the iron and the gap"
      camera={[0.4, 0.8, 8]}
      onReset={reset}
      scene={() => (<group position={[0, 0.1, 0]}>
        {/* core: left, top, bottom limbs and the right limb split by the gap */}
        <Box p={[x0, 0, 0]} s={[t, H + t, t]} c={iron} />
        <Box p={[x0 + W / 2, H / 2, 0]} s={[W + t, t, t]} c={iron} />
        <Box p={[x0 + W / 2, -H / 2, 0]} s={[W + t, t, t]} c={iron} />
        <Box p={[xr, H / 2 - seg / 2 + t / 4, 0]} s={[t, seg + t / 2, t]} c={iron} />
        <Box p={[xr, -H / 2 + seg / 2 - t / 4, 0]} s={[t, seg + t / 2, t]} c={iron} />
        {gv > 0 ? <Box p={[xr, 0, 0]} s={[t * 1.15, gv, t * 1.15]} c={C.gold} glow={0.4 + share} o={0.45} /> : null}
        {/* coil */}
        <group position={[x0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <Coil p={ORIGIN} turns={coilTurns} r={t * 0.75 + 0.06} len={H * 0.7} color={C.orange} w={3} />
        </group>
        {/* flux */}
        <Flow path={geo.path} n={8 + Math.round(30 * bN)} speed={(0.15 + 0.5 * bN) / geo.L * 4} color={sat ? C.red : C.blue} r={0.07} cap={40} />
        {/* electric analogy: mmf = Σ magnetic potential drops */}
        <group position={[2.6, -colH / 2, 0]}>
          <Box p={[0, colH / 2, 0]} s={[0.45, colH, 0.45]} c={C.green} glow={0.35} />
          <Box p={[0.8, (colH * (1 - share)) / 2, 0]} s={[0.45, Math.max(0.02, colH * (1 - share)), 0.45]} c={iron} glow={0.1} />
          <Box p={[0.8, colH * (1 - share) + (colH * share) / 2, 0]} s={[0.45, Math.max(0.02, colH * share), 0.45]} c={C.gold} glow={0.4} />
          <Box p={[0.4, -0.03, 0]} s={[1.5, 0.05, 0.8]} c={C.grey} />
          <Box p={[1.6, colH * Math.min(1, m.B / 2.4) / 2, 0]} s={[0.3, Math.max(0.02, colH * Math.min(1, m.B / 2.4)), 0.3]} c={sat ? C.red : C.purple} glow={0.35} />
        </group>
      </group>)}
      readouts={[
        ["mmf F = NI", `${eng(m.F, "A-t")}`],
        ["Core reluctance S_c = l/μ₀μ_rA", ideal ? "≈ 0 (μ_r → ∞)" : `${sci(m.Sc)} A-t/Wb`],
        ["Gap reluctance S_g = g/μ₀A", `${sci(m.Sg)} A-t/Wb`],
        ["Flux Φ = F/(S_c + S_g)", Number.isFinite(m.phi) ? eng(m.phi, "Wb") : "unlimited (S = 0)"],
        ["Flux density B = Φ/A", Number.isFinite(m.B) ? `${m.B.toFixed(3)} T${sat ? " (iron would saturate)" : ""}` : "∞: an ideal core needs a gap"],
        ["Share of mmf used by the gap", `${(share * 100).toFixed(1)} %`],
      ]}
      controls={<>
        <Slider label="Turns N" value={N} min={10} max={1000} step={1} digits={0} onChange={(x) => set("N", x)} />
        <Slider label="Coil current I" value={I} min={0.1} max={10} step={0.05} digits={2} unit=" A" onChange={(x) => set("I", x)} />
        <Slider label="Mean core length l" value={lc} min={10} max={200} step={1} digits={0} unit=" cm" onChange={(x) => set("lc", x)} />
        <Slider label="Cross-section area A" value={A} min={1} max={50} step={0.5} digits={1} unit=" cm²" onChange={(x) => set("A", x)} />
        <Slider label="Relative permeability μ_r" value={mur} min={100} max={10000} step={1} digits={0} onChange={(x) => set("mur", x)} />
        <Slider label="Air gap g" value={g} min={0} max={5} step={0.05} digits={2} unit=" mm" onChange={(x) => set("g", x)} />
        <Check label="Ideal core (μ_r → ∞)" checked={ideal} onChange={(x) => set("ideal", x)} />
      </>}
      note={<>
        <p><b>Magnetic circuit = electric circuit.</b> The coil’s <b>mmf</b> F = NI (ampere-turns) drives <b>flux</b> Φ round the core (blue dots) against the <b>reluctance</b> S = l/(μ₀μ_rA), just as an emf drives current against resistance: Φ = F/S like I = E/R. Reluctances in series add, so S = S_core + S_gap. B = Φ/A, H = B/μ and Σ H·l = NI (the magnetic KVL). The green column is the mmf; the column beside it shows how it is shared between the iron (grey) and the gap (gold); the thin column is B (red above about 1.6 T, where real iron saturates).</p>
        <p><b>Why a tiny gap matters:</b> iron is about μ_r ≈ 1000–5000 times easier for flux than air, so 1 mm of air can need more mmf than a metre of iron. Differences from an electric circuit: flux does not “flow” (no energy is spent keeping it), there is no magnetic insulator (leakage and fringing at the gap, ignored here, simplified model), and μ_r of iron falls as B rises (saturation).</p>
        <p><b>Try:</b> start from the iron-ring preset (B = 1 T) and open a 0.5 mm gap; then tick “ideal core” to see that only the gap is left.</p>
      </>}
    />
  );
}
