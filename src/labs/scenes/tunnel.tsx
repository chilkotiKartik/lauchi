"use client";
import { useMemo } from "react";
import { pnI, schottkyI, schottkyIs, si, SCHOTTKY_N, TUNNEL, tunnelG, tunnelI, tunnelPV, tunnelRegion, vAt } from "../sim/elexy";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { ELEXY_SPECS } from "../meta/elexy.specs";
import { C, Box, Spin, type V3 } from "../kit";
import { Flow, Graph, Pulse, type XY } from "../kit2";

const VMIN = -0.2, VMAX = 0.7;
/** Particle speed for a current (A): sign gives direction, magnitude grows with the logarithm. */
const speedOf = (I: number) => Math.sign(I) * Math.min(1.4, Math.max(0, Math.log10(Math.abs(I) / 1e-7 + 1) / 4));

function Device({ y, color, I, glow }: { y: number; color: string; I: number; glow: number }) {
  const path = useMemo<V3[]>(() => [[-1.3, y, 0], [1.3, y, 0]], [y]);
  const sp = speedOf(I);
  return (
    <group>
      <Box p={[-0.45, y, 0]} s={[0.9, 0.55, 0.55]} c={color} glow={glow} o={0.75} />
      <Box p={[0.45, y, 0]} s={[0.9, 0.55, 0.55]} c={C.grey} o={0.75} />
      <Box p={[0.0, y, 0]} s={[0.04, 0.6, 0.6]} c={C.white} glow={0.4} />
      <Box p={[-1.15, y, 0]} s={[0.3, 0.12, 0.12]} c={C.light} />
      <Box p={[1.15, y, 0]} s={[0.3, 0.12, 0.12]} c={C.light} />
      {Math.abs(sp) > 0.01 && <Flow path={path} n={10} speed={sp} color={C.gold} r={0.06} cap={12} />}
    </group>
  );
}

export default function TunnelLab() {
  const [P, set, reset] = useLabParams(ELEXY_SPECS.tunnel);
  const { V, Ip, mat, phiB } = P;
  const IpA = Ip / 1000;
  const It = tunnelI(V, IpA, mat), G = tunnelG(V, IpA, mat), pv = tunnelPV(IpA, mat);
  const Is = schottkyI(V, phiB), Ipn = pnI(V);
  const region = tunnelRegion(V, IpA, mat), ndr = region === "negative resistance";
  const curves = useMemo(() => {
    const t: XY[] = [], s: XY[] = [], p: XY[] = [];
    for (let i = 0; i <= 180; i++) {
      const v = VMIN + ((VMAX - VMIN) * i) / 180;
      t.push([v, tunnelI(v, IpA, mat) * 1000]); s.push([v, schottkyI(v, phiB) * 1000]); p.push([v, pnI(v) * 1000]);
    }
    return [{ pts: p, color: C.blue, w: 2.2 }, { pts: s, color: C.green, w: 2.2 }, { pts: t, color: C.purple, w: 3.4 }];
  }, [IpA, mat, phiB]);
  const yr: XY = [-0.6 * Ip, 1.7 * Ip];
  const map = (v: number, i: number): V3 => [-5.2 + 5.6 * ((v - VMIN) / (VMAX - VMIN)), -2.4 + 4.6 * Math.min(1, Math.max(0, (i - yr[0]) / (yr[1] - yr[0]))), 0.04];
  return (
    <LabFrame
      label="A large I–V graph comparing a tunnel diode (purple, with a hump and a falling negative-resistance stretch), a Schottky diode (green) and a silicon p–n diode (blue), with glowing dots at the chosen bias; on the right three 3-D diode chips with electrons streaming through them at rates set by their currents"
      camera={[0.4, 0.3, 11]}
      onReset={reset}
      scene={() => (<group>
        <Graph x0={-5.2} y0={-2.4} w={5.6} h={4.6} xr={[VMIN, VMAX]} yr={yr} curves={curves} marker={[V, It * 1000]} markerColor={ndr ? C.red : C.purple}
          vlines={[{ x: pv.Vp, color: C.gold }, { x: pv.Vv, color: C.gold }, { x: V, color: C.white }]} />
        <Pulse p={map(V, Is * 1000)} color={C.green} r={0.09} />
        <Pulse p={map(V, Ipn * 1000)} color={C.blue} r={0.09} />
        {ndr && <Box p={[map((pv.Vp + pv.Vv) / 2, 0)[0], -2.48, 0.02]} s={[map(pv.Vv, 0)[0] - map(pv.Vp, 0)[0], 0.08, 0.05]} c={C.red} glow={0.8} />}
        <group position={[3.4, 0, 0]} rotation={[0.25, -0.5, 0]}>
          <Spin speed={0.15}>
            <Device y={1.4} color={C.purple} I={It} glow={ndr ? 0.9 : 0.25} />
            <Device y={0} color={C.green} I={Is} glow={0.2} />
            <Device y={-1.4} color={C.blue} I={Ipn} glow={0.2} />
          </Spin>
        </group>
      </group>)}
      readouts={[
        ["Tunnel diode current", si(It, "A")],
        ["Tunnel dynamic resistance r = dV/dI", si(1 / G, "Ω")],
        ["Tunnel diode region", region],
        ["Peak / valley (I_p/I_v)", `${(pv.Vp * 1000).toFixed(0)} mV / ${(pv.Vv * 1000).toFixed(0)} mV (${pv.pvr.toFixed(1)} : 1)`],
        ["Schottky current (turn-on)", `${si(Is, "A")} (${vAt(1e-3, schottkyIs(phiB), SCHOTTKY_N).toFixed(2)} V at 1 mA)`],
        ["Silicon p–n current (turn-on)", `${si(Ipn, "A")} (${vAt(1e-3, 1e-12).toFixed(2)} V at 1 mA)`],
      ]}
      controls={<>
        <Slider label="Bias voltage V" value={V} min={-0.2} max={0.7} step={0.005} digits={3} unit=" V" onChange={(x) => set("V", x)} />
        <Slider label="Tunnel peak current I_p" value={Ip} min={1} max={20} step={0.5} digits={1} unit=" mA" onChange={(x) => set("Ip", x)} />
        <Pick label="Tunnel diode material" value={mat} options={[{ id: "ge", label: TUNNEL.ge.label }, { id: "gaas", label: TUNNEL.gaas.label }]} onChange={(x) => set("mat", x)} />
        <Slider label="Schottky barrier height φ_B" value={phiB} min={0.5} max={0.85} step={0.01} digits={2} unit=" eV" onChange={(x) => set("phiB", x)} />
      </>}
      note={<>
        <p><b>Tunnel diode.</b> Both sides are so heavily doped (≈10¹⁹–10²⁰ cm⁻³) that the depletion layer is only ~10 nm thick and the Fermi level lies inside the bands. Electrons <b>tunnel</b> straight through the barrier whenever filled states on one side face empty states on the other. As forward bias rises the overlap first grows (current up to the <b>peak</b> I<sub>p</sub> at V<sub>p</sub>), then shrinks: current <b>falls while voltage rises</b>, the <b>negative-resistance</b> region (red bar) between the gold lines, used in microwave oscillators. Past the <b>valley</b> ordinary diffusion current takes over. In reverse it conducts freely. The peak-to-valley ratio I<sub>p</sub>/I<sub>v</sub> is about 8 for Ge and higher for GaAs.</p>
        <p><b>Schottky diode.</b> A metal–n-semiconductor junction: only majority carriers cross, so there is no stored minority charge (very fast switching) and the barrier φ<sub>B</sub> is low, so it turns on at about <b>0.2–0.3 V</b> instead of 0.6–0.7 V: I = I<sub>s</sub>(e<sup>V/ηV<sub>T</sub></sup> − 1) with I<sub>s</sub> = A**AT²e<sup>−φ<sub>B</sub>/V<sub>T</sub></sup>.</p>
        <p><b>Try:</b> sweep V from 0 to 0.4 V and watch r turn negative; raise φ<sub>B</sub> and the Schottky curve slides right towards silicon. Simplified model: empirical tunnel current I<sub>p</sub>(V/V<sub>p</sub>)e<sup>1−V/V<sub>p</sub></sup> plus a diffusion term, room temperature.</p>
      </>}
    />
  );
}
