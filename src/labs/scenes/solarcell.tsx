"use client";
import { Line } from "@react-three/drei";
import { useMemo } from "react";
import { led, LED_MATS, nmHex, solarCell, type LedMat } from "../sim/phyx";
import { fmtSI } from "../sim/physics";
import { LabFrame, Pick, Slider, Check } from "../ui";
import { useLabParams } from "../params";
import { PHYX_SPECS } from "../meta/phyx.specs";
import { type V3 } from "../kit";
import { Flow, Graph, sample } from "../kit2";

export default function SolarCellLab() {
  const [P, set, reset] = useLabParams(PHYX_SPECS.solarcell);
  const { G, A, T, R, V, mode, mat, cells } = P;
  const sc = solarCell(G, A, T, R);
  const le = led(mat, V);
  const solar = mode === "solar";
  const curve = useMemo(() => sample((v) => Math.max(-0.2, sc.curve(v)), 0, Math.max(0.05, sc.Voc * 1.02), 100), [sc]);
  const loadLine = useMemo(() => sample((v) => v / R, 0, Math.max(0.05, sc.Voc), 20), [R, sc.Voc]);
  const ledCurve = useMemo(() => sample((v) => led(mat, v).I * 1000, 0, 3.5, 140), [mat]);
  const sunRays = useMemo<V3[][]>(() => [-1.4, 0, 1.4].map((x) => [[x - 1.2, 3.8, 0], [x, 0.45, 0]]), []);
  const circuit = useMemo<V3[]>(() => [[-1.8, 0.2, 0], [-1.8, -1.6, 0], [1.8, -1.6, 0], [1.8, 0.2, 0]], []);
  const glow = nmHex(le.lambda);

  return (
    <LabFrame
      label={
        solar
          ? "Monocrystalline silicon photovoltaic solar cell with anti-reflective coating, contact fingers, and live illuminated I–V curve load tracker"
          : "Light Emitting Diode (LED) semiconductor die with forward-bias photon emission and calibrated I–V characteristic curve"
      }
      camera={[0.5, 1.6, 9.2]}
      onReset={reset}
      scene={() => (
        <group position={[-1.6, 0, 0]}>
          {solar ? (
            <group>
              {/* Solar Cell Substrate / Base Plate */}
              <mesh position={[0, -0.22, 0]}>
                <boxGeometry args={[3.6, 0.16, 2.0]} />
                <meshStandardMaterial color="#1a242b" metalness={0.7} roughness={0.4} />
              </mesh>

              {/* p-type Silicon Layer (Red base) */}
              <mesh position={[0, -0.06, 0]}>
                <boxGeometry args={[3.4, 0.16, 1.8]} />
                <meshStandardMaterial color="#c0392b" metalness={0.4} roughness={0.35} />
              </mesh>

              {/* Depletion Region (Subtle dielectric band) */}
              <mesh position={[0, 0.04, 0]}>
                <boxGeometry args={[3.42, 0.04, 1.82]} />
                <meshStandardMaterial color="#9db0ba" transparent opacity={0.65} />
              </mesh>

              {/* n-type Silicon with Anti-Reflective Blue Coating */}
              <mesh position={[0, 0.16, 0]}>
                <boxGeometry args={[3.4, 0.2, 1.8]} />
                <meshStandardMaterial color="#1f4e79" metalness={0.6} roughness={0.2} />
              </mesh>

              {/* Silver Busbars and Contact Fingers Grid */}
              {cells && (
                <group position={[0, 0.27, 0]}>
                  {/* Two Main Silver Busbars */}
                  {[-0.8, 0.8].map((bx, i) => (
                    <mesh key={i} position={[bx, 0, 0]}>
                      <boxGeometry args={[0.08, 0.02, 1.76]} />
                      <meshStandardMaterial color="#ecf0f1" metalness={0.9} roughness={0.1} />
                    </mesh>
                  ))}
                  {/* Fine Contact Fingers */}
                  {Array.from({ length: 9 }).map((_, i) => (
                    <mesh key={i} position={[0, 0, -0.75 + i * 0.1875]}>
                      <boxGeometry args={[3.3, 0.015, 0.02]} />
                      <meshStandardMaterial color="#bdc3c7" metalness={0.9} roughness={0.15} />
                    </mesh>
                  ))}
                </group>
              )}

              {/* Incident Solar Rays & Sun Source */}
              {G > 0 && (
                <group>
                  <mesh position={[-2.8, 4.2, 0]}>
                    <sphereGeometry args={[0.55, 24, 24]} />
                    <meshStandardMaterial color="#f39c12" emissive="#f39c12" emissiveIntensity={0.6 + G / 1200} />
                  </mesh>
                  {sunRays.map((r, i) => (
                    <group key={i}>
                      <Line points={r} color="#f1c40f" lineWidth={2} />
                      <Flow path={r} n={Math.round(4 + G / 200)} speed={1.2} color="#f1c40f" r={0.065} />
                    </group>
                  ))}
                </group>
              )}

              {/* External Load Resistor Box */}
              <group position={[0, -1.6, 0]}>
                <mesh>
                  <boxGeometry args={[1.4, 0.5, 0.7]} />
                  <meshStandardMaterial color="#2c3e50" metalness={0.6} roughness={0.35} />
                </mesh>
                {/* Resistor Rotary Knobs */}
                {[-0.35, 0.35].map((kx, i) => (
                  <mesh key={i} position={[kx, 0.28, 0]}>
                    <cylinderGeometry args={[0.16, 0.16, 0.1, 16]} />
                    <meshStandardMaterial color="#cca43b" metalness={0.85} roughness={0.25} />
                  </mesh>
                ))}
              </group>

              {/* Circuit Wiring & Current Flow */}
              <Line points={circuit} color="#95a5a6" lineWidth={2.5} />
              {sc.Iop > 0.001 && <Flow path={circuit} n={16} speed={Math.min(1.8, 0.3 + sc.Iop / 2.5)} color="#3498db" r={0.065} />}
            </group>
          ) : (
            <group>
              {/* LED Metal Leadframe & Anode/Cathode Posts */}
              <group position={[0, 0, 0]}>
                <mesh position={[-0.2, -0.6, 0]}>
                  <cylinderGeometry args={[0.04, 0.04, 1.4, 16]} />
                  <meshStandardMaterial color="#bdc3c7" metalness={0.9} roughness={0.15} />
                </mesh>
                <mesh position={[0.2, -0.7, 0]}>
                  <cylinderGeometry args={[0.04, 0.04, 1.2, 16]} />
                  <meshStandardMaterial color="#bdc3c7" metalness={0.9} roughness={0.15} />
                </mesh>
                {/* Reflective Reflector Cup */}
                <mesh position={[0, 0.1, 0]}>
                  <cylinderGeometry args={[0.3, 0.15, 0.25, 20]} />
                  <meshStandardMaterial color="#ecf0f1" metalness={0.95} roughness={0.1} />
                </mesh>
                {/* Glowing Semiconductor Die */}
                <mesh position={[0, 0.18, 0]}>
                  <boxGeometry args={[0.14, 0.06, 0.14]} />
                  <meshStandardMaterial color={glow} emissive={glow} emissiveIntensity={le.on ? 1.5 : 0.1} />
                </mesh>
                {/* Epoxy Lens Dome */}
                <mesh position={[0, 0.5, 0]}>
                  <sphereGeometry args={[0.65, 32, 32]} />
                  <meshStandardMaterial color={glow} emissive={glow} emissiveIntensity={le.on ? 0.9 : 0.05} transparent opacity={le.on ? 0.75 : 0.35} />
                </mesh>
              </group>

              {/* DC Power Supply Box */}
              <group position={[0, -1.6, 0]}>
                <mesh>
                  <boxGeometry args={[1.3, 0.6, 0.8]} />
                  <meshStandardMaterial color="#1a252c" metalness={0.7} roughness={0.35} />
                </mesh>
                <mesh position={[0, 0, 0.42]}>
                  <planeGeometry args={[0.7, 0.25]} />
                  <meshBasicMaterial color="#0d1b22" />
                </mesh>
              </group>

              <Line points={circuit} color="#95a5a6" lineWidth={2.5} />
              {le.on && <Flow path={circuit} n={14} speed={-0.8} color="#3498db" r={0.065} />}
            </group>
          )}

          {/* Calibrated I-V Graph with Active Operating Point Marker */}
          {solar ? (
            <Graph
              x0={2.4}
              y0={-1.8}
              w={4.2}
              h={3.6}
              xr={[0, Math.max(0.1, sc.Voc * 1.05)]}
              yr={[0, Math.max(0.01, sc.Isc * 1.15)]}
              curves={[
                { pts: curve, color: "#2ecc71", w: 3.5 },
                { pts: loadLine, color: "#3498db", w: 2.2 },
              ]}
              marker={[sc.Vop, sc.Iop]}
            />
          ) : (
            <Graph
              x0={2.4}
              y0={-1.8}
              w={4.2}
              h={3.6}
              xr={[0, 3.5]}
              yr={[0, 100]}
              curves={[{ pts: ledCurve, color: glow, w: 3.5 }]}
              marker={[V, le.I * 1000]}
            />
          )}
        </group>
      )}
      readouts={solar ? [
        ["Short-circuit current I_sc", fmtSI(sc.Isc, "A")],
        ["Open-circuit voltage V_oc", fmtSI(sc.Voc, "V")],
        ["Maximum power", fmtSI(sc.Pm, "W")],
        ["Fill factor", sc.FF.toFixed(3)],
        ["Efficiency", `${sc.eff.toFixed(2)} %`],
        ["Power into the load", fmtSI(sc.Pop, "W")],
      ] : [
        ["Band gap E_g", `${le.Eg.toFixed(2)} eV`],
        ["Emitted wavelength λ = hc/E_g", `${le.lambda.toFixed(0)} nm`],
        ["Forward current", fmtSI(le.I, "A")],
        ["State", le.on ? "Glowing" : "Off (below turn-on)"],
        ["Photons per second", le.on ? `${(le.photonsPerS / 1e15).toFixed(2)} ×10¹⁵` : "0"],
      ]}
      controls={<>
        <Slider label="Sunlight G" value={G} min={0} max={1500} step={10} digits={0} unit=" W/m²" onChange={(x) => set("G", x)} />
        <Slider label="Cell area" value={A} min={1} max={200} step={1} digits={0} unit=" cm²" onChange={(x) => set("A", x)} />
        <Slider label="Cell temperature" value={T} min={250} max={350} step={1} digits={0} unit=" K" onChange={(x) => set("T", x)} />
        <Slider label="Load resistance" value={R} min={0.01} max={5} step={0.01} digits={2} unit=" Ω" onChange={(x) => set("R", x)} />
        <Pick label="Device" value={mode} options={[{ id: "solar", label: "Solar cell (illuminated)" }, { id: "led", label: "LED (forward biased)" }]} onChange={(x) => set("mode", x)} />
        <Pick label="LED material" value={mat} options={(Object.keys(LED_MATS) as LedMat[]).map((k) => ({ id: k, label: `${LED_MATS[k].name} (${LED_MATS[k].Eg} eV)` }))} onChange={(x) => set("mat", x)} />
        <Slider label="LED bias voltage" value={V} min={0} max={3.5} step={0.01} digits={2} unit=" V" onChange={(x) => set("V", x)} />
        <Check label="Show contact fingers" checked={cells} onChange={(x) => set("cells", x)} />
      </>}
      note={<p><b>Solar cell:</b> photons with energy above the band gap create electron–hole pairs; the built-in field of the depletion layer sweeps electrons to the n side and holes to the p side, so current flows through the load. The illuminated curve I = I<sub>ph</sub> − I₀(e<sup>V/nV<sub>T</sub></sup> − 1) gives I<sub>sc</sub> at V = 0 and V<sub>oc</sub> at I = 0; the load line I = V/R crosses it at the operating point (red). The fill factor P<sub>max</sub>/(V<sub>oc</sub>I<sub>sc</sub>) measures how square the curve is. Heat raises I₀ and lowers V<sub>oc</sub>. <b>LED:</b> forward bias pushes electrons and holes into the junction, where they recombine and emit photons of energy ≈ E<sub>g</sub>, so λ = 1240/E<sub>g</sub> nm. Direct-gap materials (GaAs, GaAsP, InGaN) do this efficiently. Single-diode model with typical silicon values; the LED current model is simplified.</p>}
    />
  );
}
