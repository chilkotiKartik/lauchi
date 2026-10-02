"use client";
import { Line } from "@react-three/drei";
import { useMemo } from "react";
import { davisson, rowsPattern, sci } from "../sim/phyy";
import { useQuality } from "../Stage";
import { LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { PHYY_SPECS } from "../meta/phyy.specs";
import { C, Ball, Box, Instances, type Inst, type V3 } from "../kit";
import { Flow, Pulse, Rod } from "../kit2";

const D2R = Math.PI / 180, RD = 3.1, GUN = 3.6;
const lobeR = (I: number, phi: number) => 0.25 + 2.3 * (0.85 * I + 0.15 * Math.cos(phi));

export default function DavissonLab() {
  const q = useQuality();
  const [P, set, reset] = useLabParams(PHYY_SPECS.davisson);
  const { V, d, phi } = P;
  const o = davisson(V, d, phi);
  const n = q === "low" ? 7 : 10;
  const atoms = useMemo<Inst[]>(() => {
    const out: Inst[] = [], sp = 0.3;
    for (let layer = 0; layer < 2; layer++) for (let i = 0; i < n; i++) for (let k = 0; k < n; k++) {
      const off = layer ? sp / 2 : 0;
      out.push({ p: [(i - (n - 1) / 2) * sp + off, -0.12 - layer * 0.22, (k - (n - 1) / 2) * sp + off], s: [0.2, 0.2, 0.2], c: layer ? C.grey : "#b9e0cc" });
    }
    return out;
  }, [n]);
  const lobe = useMemo<V3[]>(() => Array.from({ length: 181 }, (_, i) => {
    const a = (i - 90) * D2R, r = lobeR(rowsPattern(a, o.lam, d * 1e-10), a);
    return [r * Math.sin(a), r * Math.cos(a), 0] as V3;
  }), [o.lam, d]);
  const arc = useMemo<V3[]>(() => Array.from({ length: 61 }, (_, i) => { const a = (i * 3 - 90) * D2R; return [RD * Math.sin(a), RD * Math.cos(a), 0] as V3; }), []);
  const pr = phi * D2R, dir: V3 = [Math.sin(pr), Math.cos(pr), 0];
  const beam = useMemo<V3[]>(() => [[0, GUN - 0.2, 0], [0, 0.02, 0]], []);
  const scat = useMemo<V3[]>(() => [[0, 0.05, 0], [Math.sin(pr) * (RD - 0.3), Math.cos(pr) * (RD - 0.3), 0]], [pr]);
  const peaks = o.peaks.flatMap((p) => [p, -p]).map((p) => { const a = p * D2R, r = lobeR(1, a); return [r * Math.sin(a), r * Math.cos(a), 0] as V3; });
  return (
    <LabFrame
      label="The Davisson–Germer experiment: an electron gun fires a beam straight down onto a nickel crystal; electrons scatter, a gold polar curve shows how strongly they come off at each angle, with diffraction peaks marked red, and a detector on a curved track can be swung round to any angle"
      camera={[0.6, 2.2, 9.5]}
      onReset={reset}
      scene={() => (<group position={[0, -1.4, 0]}>
        <Instances items={atoms} cap={200} shape="sphere" />
        <Box p={[0, -0.6, 0]} s={[n * 0.3 + 0.4, 0.3, n * 0.3 + 0.4]} c={C.dark} />
        <Rod a={[0, GUN, 0]} b={[0, GUN + 0.9, 0]} r={0.2} color={C.light} />
        <Ball p={[0, GUN + 0.95, 0]} r={0.12} c={C.orange} glow={1.2} />
        <Line points={beam} color={C.blue} lineWidth={2} transparent opacity={0.5} />
        <Flow path={beam} n={12} speed={0.9} color={C.blue} r={0.06} />
        <Line points={lobe} color={C.gold} lineWidth={3} />
        <Line points={arc} color={C.grey} lineWidth={2} dashed dashSize={0.15} gapSize={0.1} />
        {peaks.map((p, i) => <Pulse key={i} p={p} color={C.red} r={0.09} />)}
        <Flow path={scat} n={Math.round(2 + 10 * o.I)} speed={0.7} color={C.green} r={0.055} />
        <Rod a={[dir[0] * (RD - 0.25), dir[1] * (RD - 0.25), 0]} b={[dir[0] * (RD + 0.35), dir[1] * (RD + 0.35), 0]} r={0.2} color={C.purple} glow={0.2 + 0.9 * o.I} />
        <Line points={[[0, 0, 0], [dir[0] * RD, dir[1] * RD, 0]]} color={C.purple} lineWidth={1} dashed dashSize={0.1} gapSize={0.08} />
      </group>)}
      readouts={[
        ["de Broglie λ = h/√(2meV)", `${o.lamA.toFixed(4)} Å`],
        ["12.27/√V Å check", `${o.simpleA.toFixed(4)} Å (relativistic correction ${o.relPct.toFixed(3)} %)`],
        ["Electron speed v", `${sci(o.v)} m/s`],
        ["Peaks where d sin φ = nλ", o.peaks.length ? o.peaks.map((p, i) => `n=${i + 1}: ${p.toFixed(1)}°`).join(", ") : "none (λ > d)"],
        ["Bragg glancing angle θ = 90° − φ₁/2", o.peaks.length ? `${(90 - o.peaks[0] / 2).toFixed(1)}°` : "—"],
        ["Detector signal at φ", `${(o.I * 100).toFixed(0)} % of a peak`],
      ]}
      controls={<>
        <Slider label="Accelerating voltage V" value={V} min={10} max={600} step={1} digits={0} unit=" V" onChange={(x) => set("V", x)} />
        <Slider label="Surface row spacing d" value={d} min={1} max={4} step={0.01} digits={2} unit=" Å" onChange={(x) => set("d", x)} />
        <Slider label="Detector angle φ" value={phi} min={0} max={90} step={0.5} digits={1} unit="°" onChange={(x) => set("phi", x)} />
      </>}
      note={<>
        <p>de Broglie proposed that a particle of momentum p has a wavelength <b>λ = h/p</b>. An electron accelerated through V volts has p = √(2meV), so <b>λ = h/√(2meV) = 12.27/√V Å</b>; at higher energies the relativistic form λ = h/√(2m₀eV(1 + eV/2m₀c²)) is needed. In 1927 <b>Davisson and Germer</b> fired 54 V electrons at a nickel crystal and found a strong reflection at φ = 50°, exactly where the rows of surface atoms (d = 2.15 Å) act as a reflection grating: <b>d sin φ = nλ</b> gives λ = 1.65 Å, matching 12.27/√54 = 1.67 Å. Electrons diffract, so they are waves.</p>
        <p className="mt-2"><b>Try:</b> sweep the detector at 54 V, then raise V: λ shrinks, the peak moves in and a second order appears. Below about 32 V on nickel, λ &gt; d and no diffracted beam can form. The straight-back spike at φ = 0 is the zero order. The curve is the ideal row-grating factor plus a smooth background (simplified model).</p>
      </>}
    />
  );
}
