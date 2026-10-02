"use client";
import { Line } from "@react-three/drei";
import { HESS, hess, type HessRxn } from "../sim/chemy";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { CHEMY_SPECS } from "../meta/chemy.specs";
import { C, Ball, Box, Spin, type V3 } from "../kit";
import { Arrow, Flow, Pulse } from "../kit2";

const XL = -2.6, XR = 2.6;
const SP_COL: Record<string, string> = { C: C.grey, "C(gr)": C.grey, "C(dia)": "#bfe9ff", "H₂": C.white, "CH₄": C.green, "C₂H₄": C.purple, "C₂H₆": C.blue };

function Tokens({ list, x, y }: { list: { f: string; nu: number }[]; x: number; y: number }) {
  const balls: { p: V3; c: string }[] = [];
  let i = 0;
  for (const s of list) for (let k = 0; k < s.nu; k++) { balls.push({ p: [x - 0.6 + i * 0.42, y + 0.22, 0.1], c: SP_COL[s.f] ?? C.light }); i++; }
  return <>{balls.map((b, j) => <Ball key={j} p={b.p} r={0.17} c={b.c} glow={0.25} />)}</>;
}

export default function HessLawLab() {
  const [P, set, reset] = useLabParams(CHEMY_SPECS.hesslaw);
  const { a, b, c, rxn } = P;
  const R = HESS[rxn], h = hess(rxn, a, b, c);
  const hi = Math.max(0, h.dH), lo = Math.min(h.sumR, 0, h.dH);
  const y = (E: number) => -2.3 + (4.6 * (E - lo)) / (hi - lo || 1);
  const yR = y(0), yP = y(h.dH), yC = y(h.sumR);
  const loop: V3[] = [[XL, yR, 0.3], [XL, yC + 0.1, 0.3], [XR, yC + 0.1, 0.3], [XR, yP, 0.3], [XL, yR, 0.3]];
  return (
    <LabFrame
      label="Hess's law energy cycle: a reactants platform and a products platform at their enthalpies, a combustion-products floor far below; a gold arrow is the direct path, blue and red arrows go round through combustion, and a glowing dot circulates around the cycle"
      camera={[0.8, 0.9, 10]}
      onReset={reset}
      scene={() => (<group rotation={[0.05, -0.18, 0]}>
        <Box p={[XL, yR, 0]} s={[2.3, 0.1, 1.3]} c={C.blue} glow={0.15} />
        <Box p={[XR, yP, 0]} s={[2.3, 0.1, 1.3]} c={h.dH <= 0 ? C.green : C.red} glow={0.15} />
        <Box p={[0, yC - 0.05, 0]} s={[7.6, 0.1, 1.5]} c={C.orange} glow={0.2} />
        <Tokens list={R.reac} x={XL} y={yR} />
        <Tokens list={R.prod} x={XR} y={yP} />
        <Spin speed={0.6}><Ball p={[-0.5, yC + 0.25, 0]} r={0.16} c={C.grey} /><Ball p={[-0.15, yC + 0.25, 0]} r={0.14} c={C.red} /><Ball p={[0.25, yC + 0.25, 0]} r={0.14} c={C.red} /></Spin>
        <Arrow from={[XL + 1.2, yR + 0.1, 0]} to={[XR - 1.2, yP + 0.1, 0]} color={C.gold} r={0.05} />
        <Arrow from={[XL - 0.9, yR - 0.1, 0]} to={[XL - 0.9, yC + 0.05, 0]} color={C.blue} r={0.05} />
        <Arrow from={[XR + 0.9, yC + 0.05, 0]} to={[XR + 0.9, yP - 0.1, 0]} color={C.red} r={0.05} />
        <Flow path={loop} n={5} speed={0.12} color={C.gold} r={0.09} />
        <Line points={[[-4.2, -2.4, 0], [-4.2, 2.5, 0]]} color={C.light} lineWidth={1.5} />
        <Pulse p={[-4.2, yR, 0]} color={C.blue} r={0.08} />
        <Pulse p={[-4.2, yP, 0]} color={h.dH <= 0 ? C.green : C.red} r={0.08} />
      </group>)}
      readouts={[
        ["ΔH of reaction", `${h.dH.toFixed(2)} kJ/mol`],
        ["Σν ΔHc (reactants)", `${h.sumR.toFixed(2)} kJ/mol`],
        ["Σν ΔHc (products)", `${h.sumP.toFixed(2)} kJ/mol`],
        ["Δn (gas)", String(h.dng)],
        ["ΔU = ΔH − Δn_g RT", `${h.dU.toFixed(2)} kJ/mol`],
        ["Nature", h.nature],
      ]}
      controls={<>
        <Slider label={R.labels.a ?? "ΔHc 1"} value={a} min={-2000} max={-100} step={0.01} digits={2} unit=" kJ/mol" onChange={(x) => set("a", x)} />
        <Pick label="Reaction" value={rxn} options={[{ id: "ch4", label: HESS.ch4.eq }, { id: "hydrog", label: HESS.hydrog.eq }, { id: "diamond", label: HESS.diamond.eq }] as { id: HessRxn; label: string }[]} onChange={(x) => set("rxn", x)} />
        {R.labels.b && <Slider label={R.labels.b} value={b} min={-2000} max={-100} step={0.01} digits={2} unit=" kJ/mol" onChange={(x) => set("b", x)} />}
        <Slider label={R.labels.c ?? "ΔHc 3"} value={c} min={-2000} max={-100} step={0.01} digits={2} unit=" kJ/mol" onChange={(x) => set("c", x)} />
      </>}
      note={<>
        <p><b>Hess&apos;s law of constant heat summation:</b> enthalpy is a state function, so ΔH for a change is the same whichever route you take. Here the direct route (gold) for <b>{R.eq}</b> is hard to measure, but every species can be burnt to {R.burnt}. Going down by burning the reactants (blue) and back up by &ldquo;un-burning&rdquo; the products (red) must give the same ΔH:</p>
        <p className="mt-2 text-center font-bold">ΔH<sub>rxn</sub> = Σν ΔH<sub>c</sub>(reactants) − Σν ΔH<sub>c</sub>(products)</p>
        <p className="mt-2">ΔU follows from ΔH = ΔU + Δn<sub>g</sub>RT (water as liquid, 298 K). <b>Try:</b> load the PYQ presets and check the textbook answers; then change one heat of combustion and see that a 1 kJ error moves ΔH by exactly ν kJ. Applications: heats of formation, transition (graphite → diamond) and reactions that cannot be done cleanly. Limitation: the data must refer to the same T, P and physical states.</p>
      </>}
    />
  );
}
