"use client";
import { fetAmp, si, type FetCfg } from "../sim/elexy";
import { Check, LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { ELEXY_SPECS } from "../meta/elexy.specs";
import { C, Ball, Box, type V3 } from "../kit";
import { Rod } from "../kit2";
import { BeadWave, Ground, Res, Wire } from "./elexy-kit";

/** Terminal positions of the FET block (gate left, drain up, source down). */
const G: V3 = [-1.1, 0, 0], D: V3 = [0.35, 1.5, 0], S: V3 = [0.35, -1.5, 0];
const ROLE: Record<FetCfg, { inp: "G" | "S"; out: "D" | "S"; com: "G" | "D" | "S"; name: string }> = {
  cs: { inp: "G", out: "D", com: "S", name: "common source" },
  cd: { inp: "G", out: "S", com: "D", name: "common drain (source follower)" },
  cg: { inp: "S", out: "D", com: "G", name: "common gate" },
};
const TP: Record<"G" | "D" | "S", V3> = { G, D, S };

export default function FetAmpLab() {
  const [P, set, reset] = useLabParams(ELEXY_SPECS.fetamp);
  const { gm, cfg, rd, RD, RS, load, RL, RG, vin } = P;
  const a = fetAmp(cfg, gm, rd, RD, RS, load ? RL : Infinity, RG);
  const role = ROLE[cfg];
  const ai = 0.55 / Math.max(1, Math.abs(a.Av) / 3.5), ao = Math.min(2, ai * Math.abs(a.Av));
  const colorOf = (t: "G" | "D" | "S") => (t === role.com ? C.green : t === role.inp ? C.blue : C.gold);
  return (
    <LabFrame
      label="A 3-D n-channel FET block with gate, drain and source leads coloured by role (blue input, gold output, green common and earthed); a travelling blue bead wave enters the input and a gold bead wave leaves the output, larger by the voltage gain and flipped upside down for the common-source amplifier"
      camera={[0, 0.3, 11]}
      onReset={reset}
      scene={() => (<group>
        <group rotation={[0.1, -0.25, 0]}>
          <Box p={[0.35, 0, 0]} s={[0.5, 2.2, 1]} c={C.blue} o={0.6} />
          <Box p={[-0.05, 0, 0]} s={[0.3, 1.2, 1.05]} c={C.red} glow={0.2} />
          <Rod a={G} b={[-0.2, 0, 0]} r={0.07} color={colorOf("G")} glow={0.4} />
          <Rod a={D} b={[0.35, 1.1, 0]} r={0.07} color={colorOf("D")} glow={0.4} />
          <Rod a={S} b={[0.35, -1.1, 0]} r={0.07} color={colorOf("S")} glow={0.4} />
          {(["G", "D", "S"] as const).map((t) => <Ball key={t} p={TP[t]} r={0.17} c={colorOf(t)} glow={0.6} />)}
          <Ground p={[TP[role.com][0] + (role.com === "G" ? -0.4 : 0.6), TP[role.com][1] - 0.35, 0]} />
          <Wire pts={[TP[role.com], [TP[role.com][0] + (role.com === "G" ? -0.4 : 0.6), TP[role.com][1], 0], [TP[role.com][0] + (role.com === "G" ? -0.4 : 0.6), TP[role.com][1] - 0.3, 0]]} c={C.green} />
          {cfg !== "cd" && <Res a={[1.6, 2.6, 0]} b={[1.6, 1.5, 0]} glow={0.2} />}
          {cfg !== "cd" && <Wire pts={[D, [1.6, 1.5, 0]]} />}
          {cfg !== "cs" && <Res a={[1.6, -1.5, 0]} b={[1.6, -2.6, 0]} glow={0.2} />}
          {cfg !== "cs" && <Wire pts={[S, [1.6, -1.5, 0]]} />}
          <Wire pts={[TP[role.inp], [-3, TP[role.inp][1], 0]]} c={C.blue} w={2.4} />
          <Wire pts={[TP[role.out], [3, TP[role.out][1], 0]]} c={C.gold} w={2.4} />
        </group>
        <BeadWave p={[-4.4, TP[role.inp][1] + (role.inp === "S" ? -0.9 : 0.9), 0.4]} len={2.8} amp={ai} color={C.blue} speed={0.45} />
        <BeadWave p={[4.4, TP[role.out][1] + (role.out === "S" ? -0.9 : 0.9) * (ao > 1 ? 1.4 : 1), 0.4]} len={2.8} amp={ao} color={C.gold} sign={a.Av < 0 ? -1 : 1} speed={0.45} />
      </group>)}
      readouts={[
        ["Voltage gain A_v", `${a.Av.toFixed(3)}`],
        ["Phase shift", `${a.Av < 0 ? 180 : 0}°`],
        ["Input impedance Z_i", si(a.Zi * 1000, "Ω")],
        ["Output impedance Z_o", si(a.Zo * 1000, "Ω")],
        ["Output peak v_o = |A_v|·v_i", si((Math.abs(a.Av) * vin) / 1000, "V")],
        ["Amplification factor μ = g_m r_d", (gm * rd).toFixed(0)],
      ]}
      controls={<>
        <Slider label="Transconductance g_m" value={gm} min={0.5} max={10} step={0.025} digits={3} unit=" mS" onChange={(x) => set("gm", x)} />
        <Pick label="Configuration" value={cfg} options={[{ id: "cs", label: "Common source (CS)" }, { id: "cd", label: "Common drain / source follower (CD)" }, { id: "cg", label: "Common gate (CG)" }]} onChange={(x) => set("cfg", x)} />
        <Slider label="Drain resistance r_d" value={rd} min={5} max={200} step={1} digits={0} unit=" kΩ" onChange={(x) => set("rd", x)} />
        <Slider label="Drain resistor R_D" value={RD} min={0.5} max={20} step={0.1} digits={1} unit=" kΩ" onChange={(x) => set("RD", x)} />
        <Slider label="Source resistor R_S (CD, CG)" value={RS} min={0.2} max={20} step={0.1} digits={1} unit=" kΩ" onChange={(x) => set("RS", x)} />
        <Check label="Connect a load R_L" checked={load} onChange={(x) => set("load", x)} />
        <Slider label="Load R_L" value={RL} min={1} max={100} step={1} digits={0} unit=" kΩ" onChange={(x) => set("RL", x)} />
        <Slider label="Gate resistor R_G" value={RG} min={0.1} max={10} step={0.1} digits={1} unit=" MΩ" onChange={(x) => set("RG", x)} />
        <Slider label="Input peak v_i" value={vin} min={1} max={500} step={1} digits={0} unit=" mV" onChange={(x) => set("vin", x)} />
      </>}
      note={<>
        <p>In the small-signal model a FET is a current source g<sub>m</sub>v<sub>gs</sub> from drain to source in parallel with r<sub>d</sub>, and the gate is an open circuit. Which terminal is common decides the behaviour (you are viewing <b>{role.name}</b>):</p>
        <p><b>CS</b> (input gate, output drain, R<sub>S</sub> bypassed): A<sub>v</sub> = −g<sub>m</sub>(r<sub>d</sub> ‖ R<sub>D</sub> ‖ R<sub>L</sub>), 180° phase shift, Z<sub>i</sub> = R<sub>G</sub> (megohms), Z<sub>o</sub> = R<sub>D</sub> ‖ r<sub>d</sub>: the general-purpose voltage amplifier. <b>CD / source follower</b> (output at source): A<sub>v</sub> = g<sub>m</sub>R′/(1 + g<sub>m</sub>R′) with R′ = R<sub>S</sub> ‖ r<sub>d</sub> ‖ R<sub>L</sub>, just under 1 and in phase, Z<sub>i</sub> = R<sub>G</sub>, Z<sub>o</sub> = R<sub>S</sub> ‖ r<sub>d</sub> ‖ 1/g<sub>m</sub> (low): a buffer. <b>CG</b> (input at source): A<sub>v</sub> = (g<sub>m</sub> + 1/r<sub>d</sub>)R′/(1 + R′/r<sub>d</sub>) ≈ g<sub>m</sub>(R<sub>D</sub> ‖ R<sub>L</sub>), in phase, but Z<sub>i</sub> = R<sub>S</sub> ‖ (r<sub>d</sub> + R′)/(1 + g<sub>m</sub>r<sub>d</sub>) ≈ 1/g<sub>m</sub> is low, like a BJT common base.</p>
        <p><b>Try:</b> the CS preset uses g<sub>m</sub> = 1.875 mS (I<sub>DSS</sub> = 10 mA, V<sub>P</sub> = −8 V, V<sub>GSQ</sub> = −2 V), r<sub>d</sub> = 25 kΩ, R<sub>D</sub> = 2 kΩ → A<sub>v</sub> ≈ −3.47. Connect a load and see the gain drop. The bead waves are drawn to scale with each other (input shrunk when the gain is large).</p>
      </>}
    />
  );
}
