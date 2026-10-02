"use client";
import { Line } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";
import { boxEnergy, boxPsi, photonNm } from "../math";
import { Tick } from "../Stage";
import { LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { CORE_SPECS } from "../meta/core.specs";

const W = 6, N = 160;
function paintPsi(geo: THREE.BufferGeometry, n: number, L: number, t: number) {
  const p = geo.attributes.position as THREE.BufferAttribute;
  const c = Math.cos(t), amp = Math.sqrt(L / 2);
  for (let i = 0; i <= N; i++) { const x = (i / N) * L; p.setXYZ(i, (i / N) * W - W / 2, boxPsi(n, L, x) * amp * c * 1.3, 0); }
  p.needsUpdate = true;
}
function makePsiLine(n: number, L: number) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array((N + 1) * 3), 3));
  paintPsi(geo, n, L, 0);
  return new THREE.Line(geo, new THREE.LineBasicMaterial({ color: "#ffc83d" }));
}
const tickT = { t: 0 };
function stepPsi(line: THREE.Line, n: number, L: number, dt: number) {
  tickT.t += Math.min(dt, 0.05) * 2 * Math.min(n, 4);
  paintPsi(line.geometry, n, L, tickT.t);
}
function PsiLine({ n, L }: { n: number; L: number }) {
  const line = useMemo(() => makePsiLine(n, L), [n, L]);
  return (<><Tick fn={(dt) => stepPsi(line, n, L, dt)} /><primitive object={line} /></>);
}
export default function BoxLab() {
  const [P, set, reset] = useLabParams(CORE_SPECS.box);
  const { n, L } = P;
  const setN = (x: (typeof P)["n"]) => set("n", x), setL = (x: (typeof P)["L"]) => set("L", x);
  const E = boxEnergy(n, L), E1 = boxEnergy(1, L);
  const dE = n > 1 ? E - boxEnergy(n - 1, L) : NaN;
  const amp = Math.sqrt(L / 2);
  const prob = useMemo(() => Array.from({ length: N + 1 }, (_, i) => { const x = (i / N) * L; const v = boxPsi(n, L, x) * amp; return [(i / N) * W - W / 2, -2.2 + v * v * 2.2, 0] as [number, number, number]; }), [n, L, amp]);
  const ladder = [1, 2, 3, 4, 5, 6].map((k) => boxEnergy(k, L) / boxEnergy(6, L));
  return (
    <LabFrame
      label="Particle in a one-dimensional box: standing-wave wavefunction, probability and energy levels"
      camera={[0, 0.2, 8.5]}
      onReset={reset}
      scene={() => (<group>
        <PsiLine n={n} L={L} />
        <Line points={[[-W / 2, -2.2, 0], [W / 2, -2.2, 0]]} color="#5b6d77" lineWidth={1.5} />
        <Line points={[[-W / 2, -2.2, 0], [-W / 2, 2.2, 0]]} color="#ff5a5f" lineWidth={4} />
        <Line points={[[W / 2, -2.2, 0], [W / 2, 2.2, 0]]} color="#ff5a5f" lineWidth={4} />
        <Line points={prob} color="#2ba6f5" lineWidth={3} />
        {ladder.map((h, i) => (<Line key={i} points={[[W / 2 + 0.3, -2.2 + h * 4.4, 0], [W / 2 + 1.1, -2.2 + h * 4.4, 0]]} color={i + 1 === n ? "#44c95a" : "#5b6d77"} lineWidth={i + 1 === n ? 4 : 2} />))}
      </group>)}
      readouts={[["Level n", String(n)], ["Energy Eₙ", `${E.toFixed(3)} eV`], ["Ground state E₁", `${E1.toFixed(3)} eV`], ["Nodes inside", String(n - 1)], ["Gap Eₙ − Eₙ₋₁", Number.isNaN(dE) ? "—" : `${dE.toFixed(3)} eV`], ["Photon for that drop", Number.isNaN(dE) ? "—" : `${photonNm(dE).toFixed(0)} nm`]]}
      controls={<>
        <Slider label="Quantum number n" value={n} min={1} max={6} step={1} digits={0} onChange={setN} />
        <Slider label="Box width L" value={L} min={0.2} max={2} step={0.05} digits={2} unit=" nm" onChange={setL} />
      </>}
      note={<p>An electron trapped between two impenetrable walls can only have wavefunctions that fit whole half-wavelengths in the box: ψₙ = √(2/L) sin(nπx/L). That forces energies Eₙ = n²h²/8mL² (0.376 n²/L² eV for L in nm). Yellow is ψ oscillating in time; blue is the probability density |ψ|², which does not move — with n nodes minus one, the electron is never found at a node. Squeeze the box and every level climbs as 1/L² and the gaps widen, which is why smaller quantum dots emit bluer light. The ladder on the right shows the relative spacing: gaps grow as 2n + 1.</p>}
    />
  );
}
