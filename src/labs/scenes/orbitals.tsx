"use client";
import { Line } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { ORBITAL_IDS, ORBITALS, orbitalInfo, sampleOrbital, type OrbitalId } from "../sim/chem";
import { Tick, useQuality } from "../Stage";
import { Check, LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { CHEM_SPECS } from "../meta/chem.specs";

const POS = new THREE.Color("#2ba6f5"), NEG = new THREE.Color("#ff5a5f"), FIT = 3.2;

/** Points cloud for one orbital: chemistry axes (x, y, z) → scene (x, z, −y) so the p_z axis points up. */
function buildCloud(id: OrbitalId, count: number, cut: boolean, scale: number): THREE.BufferGeometry {
  const s = sampleOrbital(id, count);
  const keep: number[] = [];
  for (let i = 0; i < count; i++) if (!cut || s.pos[i * 3 + 1] >= 0) keep.push(i); // remove chemistry y < 0 = scene z > 0, the half nearest the camera
  const pos = new Float32Array(keep.length * 3), col = new Float32Array(keep.length * 3), c = new THREE.Color();
  keep.forEach((i, j) => {
    pos[j * 3] = s.pos[i * 3] * scale; pos[j * 3 + 1] = s.pos[i * 3 + 2] * scale; pos[j * 3 + 2] = -s.pos[i * 3 + 1] * scale;
    c.copy(s.sign[i] > 0 ? POS : NEG).multiplyScalar(0.62 + 0.38 * ((i * 2654435761) % 1000) / 1000);
    col[j * 3] = c.r; col[j * 3 + 1] = c.g; col[j * 3 + 2] = c.b;
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  return g;
}

function swing(g: THREE.Group, t: number, cut: boolean) {
  g.rotation.y = cut ? 0.9 * Math.sin(t * 0.45) : t * 0.35;
}

export default function OrbitalsLab() {
  const quality = useQuality();
  const [P, set, reset] = useLabParams(CHEM_SPECS.orbitals);
  const { pts, orbital, cut } = P;
  const setPts = (x: (typeof P)["pts"]) => set("pts", x), setOrb = (x: (typeof P)["orbital"]) => set("orbital", x), setCut = (x: (typeof P)["cut"]) => set("cut", x);
  const info = useMemo(() => orbitalInfo(orbital), [orbital]);
  const count = quality === "low" ? Math.round(pts / 2) : Math.round(pts);
  const scale = FIT / Math.max(info.r90 * 1.25, 3);
  const cloud = useMemo(() => buildCloud(orbital, count, cut, scale), [orbital, count, cut, scale]);
  const drawn = cloud.getAttribute("position").count;
  const grp = useRef<THREE.Group>(null), t = useRef(0);
  const tick = (dt: number) => { t.current += Math.min(dt, 0.05); if (grp.current) swing(grp.current, t.current, cut); };
  const o = ORBITALS[orbital];
  const rmp = info.rMostProbable;
  const nodes = info.nodeRadii.length ? info.nodeRadii.map((r) => `${r.toFixed(1)} a₀`).join(", ") : "none";
  return (
    <LabFrame
      label="Rotating 3D probability cloud of a hydrogen atomic orbital, blue where the wavefunction is positive and red where negative"
      camera={[1.5, 3.2, 9]}
      onReset={reset}
      scene={() => (<group><Tick fn={tick} />
        <group ref={grp}>
          <points geometry={cloud}><pointsMaterial size={0.07} vertexColors sizeAttenuation /></points>
          <mesh><sphereGeometry args={[0.09, 16, 16]} /><meshStandardMaterial color="#ffc83d" emissive="#ffc83d" emissiveIntensity={0.7} /></mesh>
          <Line points={[[0, -FIT, 0], [0, FIT, 0]]} color="#5b6d77" lineWidth={1} />
          <Line points={[[-FIT, 0, 0], [FIT, 0, 0]]} color="#5b6d77" lineWidth={1} />
          <Line points={[[0, 0, -FIT], [0, 0, FIT]]} color="#5b6d77" lineWidth={1} />
        </group>
      </group>)}
      readouts={[
        ["Orbital", o.label], ["n, l, mₗ", `${o.n}, ${o.l}, ${o.ml}`], ["Radial nodes n − l − 1", String(info.radialNodes)], ["Angular nodes l", String(info.angularNodes)],
        ["Energy −13.6/n²", `${info.energyEv.toFixed(2)} eV`], ["Most probable r", `${rmp.toFixed(2)} a₀ (${(rmp * 52.9177).toFixed(0)} pm)`], ["Radial node at", nodes], ["Points drawn", String(drawn)],
      ]}
      controls={<>
        <Slider label="Points sampled" value={pts} min={500} max={6000} step={250} digits={0} onChange={setPts} />
        <Pick label="Orbital" value={orbital} options={ORBITAL_IDS.map((id) => ({ id, label: `${ORBITALS[id].label}  (n = ${ORBITALS[id].n}, l = ${ORBITALS[id].l})` }))} onChange={setOrb} />
        <Check label="Cut-away (show the inside)" checked={cut} onChange={setCut} />
      </>}
      note={<p>Each dot is a possible place to find the electron, drawn at random with probability |ψ|² (a fixed pseudo-random sequence, so the picture is repeatable). Blue dots are where ψ is positive and red where it is negative: the two lobes of a p or d orbital have opposite signs, and 2s/3s change sign across each spherical radial node. The number of radial nodes is n − l − 1 and angular nodes l; energy Eₙ = −13.6/n² eV depends only on n. For 1s the radial probability r²R² peaks at exactly a₀ = 52.9 pm, the Bohr radius, even though the density |ψ|² is greatest at the nucleus. Switch on the cut-away to remove the front half and see the 2s node at r = 2a₀. Real orbitals such as 2pₓ and 3d_xy are combinations of ±mₗ. Drag to rotate; fewer points on slow devices.</p>}
    />
  );
}
