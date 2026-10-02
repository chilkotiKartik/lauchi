"use client";
import { Line } from "@react-three/drei";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { HALL_WIDTH_MM, fmtSI, fmtSci, hall, prng } from "../sim/physics";
import { Tick, useQuality } from "../Stage";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { PHYSICS_SPECS } from "../meta/physics.specs";

const NMAX = 60, LEN = 7, ZF = 1.05;
const dummy = new THREE.Object3D();
const rnd = prng(57);
const mk = (f: () => number) => Float32Array.from({ length: NMAX }, f);
const U0 = mk(rnd), YR = mk(() => rnd() - 0.5), ZR = mk(() => rnd() - 0.5);

interface Vis { n: number; defl: number; dir: 1 | -1; tv: number }

/** Carriers run along the slab (x) and are pushed toward the +z face by the magnetic force; module-level so render stays pure. */
function paintHall(mesh: THREE.InstancedMesh, v: Vis, drift: number) {
  for (let i = 0; i < NMAX; i++) {
    if (i < v.n) {
      const u = (((U0[i] + v.dir * drift) % 1) + 1) % 1, prog = v.dir > 0 ? u : 1 - u;
      const s = Math.min(1, prog / 0.55), sm = s * s * (3 - 2 * s), z0 = ZR[i] * 1.7;
      dummy.position.set(-(LEN - 0.4) / 2 + (LEN - 0.4) * u, YR[i] * v.tv * 0.75, z0 + (ZF - z0) * v.defl * sm);
      dummy.scale.setScalar(1);
    } else { dummy.position.set(0, 0, 0); dummy.scale.setScalar(0.0001); }
    dummy.updateMatrix(); mesh.setMatrixAt(i, dummy.matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
}

function Carriers({ vis, speed, color }: { vis: Vis; speed: number; color: string }) {
  const ref = useRef<THREE.InstancedMesh>(null), drift = useRef(0);
  useLayoutEffect(() => { if (ref.current) paintHall(ref.current, vis, drift.current); }, [vis]);
  const tick = (dt: number) => { drift.current += (speed / (LEN - 0.4)) * Math.min(dt, 0.05); if (ref.current) paintHall(ref.current, vis, drift.current); };
  return (<>
    <Tick fn={tick} />
    <instancedMesh ref={ref} args={[undefined, undefined, NMAX]} frustumCulled={false}><sphereGeometry args={[0.1, 12, 10]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} /></instancedMesh>
  </>);
}

function Arrow({ from, to, color }: { from: [number, number, number]; to: [number, number, number]; color: string }) {
  const { pos, quat, len } = useMemo(() => {
    const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to), d = b.clone().sub(a), l = d.length();
    return { pos: a.clone().add(b).multiplyScalar(0.5), quat: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()), len: l };
  }, [from, to]);
  return (
    <group position={pos} quaternion={quat}>
      <mesh><cylinderGeometry args={[0.04, 0.04, len - 0.25, 8]} /><meshStandardMaterial color={color} /></mesh>
      <mesh position={[0, len / 2 - 0.125, 0]}><coneGeometry args={[0.11, 0.25, 12]} /><meshStandardMaterial color={color} /></mesh>
    </group>
  );
}

export default function HallLab() {
  const quality = useQuality();
  const [P, set, reset] = useLabParams(PHYSICS_SPECS.hall);
  const { I, B, logn, t, type } = P;
  const setI = (x: (typeof P)["I"]) => set("I", x), setB = (x: (typeof P)["B"]) => set("B", x), setLogn = (x: (typeof P)["logn"]) => set("logn", x), setT = (x: (typeof P)["t"]) => set("t", x), setType = (x: (typeof P)["type"]) => set("type", x);
  const h = hall(I, B, logn, t, type);
  const tv = 0.4 + 0.3 * t;
  const n = Math.round(Math.min(NMAX, 10 + 4.5 * (logn - 18)) * (quality === "low" ? 0.5 : 1));
  const vis = useMemo<Vis>(() => ({ n, defl: B / (B + 0.3), dir: type === "hole" ? 1 : -1, tv }), [n, B, type, tv]);
  const speed = Math.min(2.2, Math.max(0.25, 0.35 + 0.22 * (Math.log10(Math.max(h.vd, 1e-9)) + 3)));
  const carrier = type === "hole" ? "#ff5a5f" : "#2ba6f5", other = type === "hole" ? "#2ba6f5" : "#ff5a5f";
  const wireA = useMemo<[number, number, number][]>(() => [[0, -tv / 2, ZF + 0.2], [0, -1.7, ZF + 0.2], [0, -1.7, 0.35]], [tv]);
  const wireB = useMemo<[number, number, number][]>(() => [[0, -tv / 2, -ZF - 0.2], [0, -1.7, -ZF - 0.2], [0, -1.7, -0.35]], [tv]);
  return (
    <LabFrame
      label="A slab carrying current in a magnetic field: carriers drift along it and are pushed to the front face, producing a Hall voltage between the faces"
      camera={[4.5, 3.6, 9]}
      onReset={reset}
      scene={() => (<group>
        <mesh><boxGeometry args={[LEN, tv, 2.4]} /><meshStandardMaterial color="#5b6d77" transparent opacity={0.4} roughness={0.5} depthWrite={false} /></mesh>
        <mesh position={[0, 0, ZF + 0.17]}><boxGeometry args={[LEN - 0.3, tv * 0.96, 0.07]} /><meshStandardMaterial color={carrier} emissive={carrier} emissiveIntensity={0.3} transparent opacity={0.75} /></mesh>
        <mesh position={[0, 0, -ZF - 0.17]}><boxGeometry args={[LEN - 0.3, tv * 0.96, 0.07]} /><meshStandardMaterial color={other} emissive={other} emissiveIntensity={0.3} transparent opacity={0.75} /></mesh>
        <Arrow from={[-LEN / 2 - 1.5, 0, 0]} to={[-LEN / 2 - 0.15, 0, 0]} color="#ffc83d" />
        <Arrow from={[LEN / 2 + 0.15, 0, 0]} to={[LEN / 2 + 1.5, 0, 0]} color="#ffc83d" />
        {[-2, 0, 2].map((x) => (<Arrow key={x} from={[x, tv / 2 + 0.1, -0.3]} to={[x, tv / 2 + 1.5, -0.3]} color="#ff9a1f" />))}
        <mesh position={[0, -1.7, 0]}><boxGeometry args={[1.1, 0.5, 0.7]} /><meshStandardMaterial color="#9db0ba" /></mesh>
        <Line points={wireA} color="#9db0ba" lineWidth={2} />
        <Line points={wireB} color="#9db0ba" lineWidth={2} />
        <Carriers vis={vis} speed={speed} color={carrier} />
      </group>)}
      readouts={[
        ["Hall voltage V_H = IB/(nqt)", fmtSI(h.VH, "V")],
        ["Hall coefficient R_H", `${fmtSci(h.RH)} m³/C`],
        [`Drift velocity v_d (w = ${HALL_WIDTH_MM} mm)`, fmtSI(h.vd, "m/s")],
        ["Hall field E_H = V_H/w", fmtSI(h.EH, "V/m")],
        ["Sign of V_H", h.VH > 0 ? "Positive (holes)" : "Negative (electrons)"],
        ["Carrier density n", `${fmtSci(10 ** logn)} m⁻³`],
      ]}
      controls={<>
        <Slider label="Current I" value={I} min={1} max={50} step={1} digits={0} unit=" mA" onChange={setI} />
        <Slider label="Magnetic field B" value={B} min={0.05} max={2} step={0.05} digits={2} unit=" T" onChange={setB} />
        <Slider label="Carrier density n, log₁₀ (m⁻³)" value={logn} min={18} max={29} step={0.1} digits={1} onChange={setLogn} />
        <Slider label="Slab thickness t" value={t} min={0.1} max={5} step={0.1} digits={1} unit=" mm" onChange={setT} />
        <Pick label="Charge carriers" value={type} options={[{ id: "electron", label: "Electrons (n-type / metal)" }, { id: "hole", label: "Holes (p-type)" }]} onChange={setType} />
      </>}
      note={<p>Current I flows along the slab (gold arrows) and a magnetic field B points up through it (orange arrows). The field pushes moving charges sideways with force q v × B. Electrons and holes travelling in opposite directions are deflected to the same face, so that face collects the carriers (front plate coloured for the carrier type) and the opposite face is left with the opposite charge. The sideways electric field grows until it cancels the magnetic force, E_H = v_d B, giving V_H = IB/(nqt) = R_H IB/t with R_H = ±1/(nq), negative for electrons and positive for holes. Its sign identifies the carrier type and its size gives the density n. Here t is the thickness along B and the width across the faces is taken as 5 mm for v_d = I/(nqwt). Metals (n ≈ 10²⁹ m⁻³) give tiny voltages; semiconductors give millivolts. Carrier count and speed on screen are schematic.</p>}
    />
  );
}
