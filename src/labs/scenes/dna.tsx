"use client";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { DNA_SAMPLES, complement, dnaAnalysis, type DnaSample, type MutKind } from "../sim/life";
import { Tick } from "../Stage";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { LIFE_SPECS } from "../meta/life.specs";

const dummy = new THREE.Object3D(), RAD = 0.55, STEP = 0.24, TURN = 0.62;
const BASE = { A: "#44c95a", T: "#ff5a5f", G: "#ffc83d", C: "#2ba6f5" } as Record<string, string>;
const AAC = ["#ff9a1f", "#a970ff", "#2ba6f5", "#44c95a", "#ffc83d", "#ff7ab8", "#5bd6c2"];
const colorOf = (aa: string) => AAC[(aa.charCodeAt(0) + aa.charCodeAt(1)) % AAC.length];

function Helix({ coding, mark }: { coding: string; mark: number }) {
  const s1 = useRef<THREE.InstancedMesh>(null), s2 = useRef<THREE.InstancedMesh>(null), rg = useRef<THREE.InstancedMesh>(null);
  const L = coding.length;
  useLayoutEffect(() => {
    const a = s1.current, b = s2.current, c = rg.current; if (!a || !b || !c) return;
    const col = new THREE.Color();
    for (let i = 0; i < L; i++) {
      const y = (i - (L - 1) / 2) * STEP, ang = i * TURN, hot = i === mark - 1;
      dummy.rotation.set(0, 0, 0);
      dummy.position.set(RAD * Math.cos(ang), y, RAD * Math.sin(ang)); dummy.scale.setScalar(hot ? 1.7 : 1); dummy.updateMatrix(); a.setMatrixAt(i, dummy.matrix); a.setColorAt(i, col.set(BASE[coding[i]]));
      dummy.position.set(-RAD * Math.cos(ang), y, -RAD * Math.sin(ang)); dummy.updateMatrix(); b.setMatrixAt(i, dummy.matrix); b.setColorAt(i, col.set(BASE[complement(coding[i])]));
      dummy.position.set(0, y, 0); dummy.rotation.set(0, -ang, 0); dummy.scale.set(RAD * 2, hot ? 1.8 : 1, 1); dummy.updateMatrix(); c.setMatrixAt(i, dummy.matrix); c.setColorAt(i, col.set(hot ? "#ffffff" : "#9db0ba"));
    }
    for (const m of [a, b, c]) { m.count = L; m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; }
  }, [coding, mark, L]);
  return (<>
    <instancedMesh ref={s1} args={[undefined, undefined, 30]}><sphereGeometry args={[0.11, 12, 12]} /><meshStandardMaterial roughness={0.4} /></instancedMesh>
    <instancedMesh ref={s2} args={[undefined, undefined, 30]}><sphereGeometry args={[0.11, 12, 12]} /><meshStandardMaterial roughness={0.4} /></instancedMesh>
    <instancedMesh ref={rg} args={[undefined, undefined, 30]}><boxGeometry args={[1, 0.03, 0.03]} /><meshStandardMaterial roughness={0.6} /></instancedMesh>
  </>);
}

export default function DnaLab() {
  const [P, set, reset] = useLabParams(LIFE_SPECS.dna);
  const { pos, kind, sample } = P;
  const seq = DNA_SAMPLES[sample];
  const A = useMemo(() => dnaAnalysis(seq, pos, kind), [seq, pos, kind]);
  const spin = useRef<THREE.Group>(null);
  const tick = (dt: number) => { if (spin.current) spin.current.rotation.y += Math.min(dt, 0.05) * 0.45; };
  const n = Math.min(10, Math.max(A.orig.aa.length, A.now.aa.length));
  const beads = Array.from({ length: n }, (_, i) => ({ i, aa: A.now.aa[i], old: A.orig.aa[i] }));
  const changed = (i: number) => kind !== "none" && A.now.aa[i] !== A.orig.aa[i];
  const effectText: Record<string, string> = { none: "no mutation", silent: "silent: same amino acid", missense: "missense: different amino acid", nonsense: "nonsense: early stop, shortened protein", "start lost": "start codon lost: no protein", "stop lost": "stop lost: protein runs on", "non-coding": "outside the coding region" };
  const tail = A.now.stopped ? "ends at stop codon" : A.now.started ? "no stop codon reached" : "no start codon";
  return (
    <LabFrame
      label="A rotating double helix of coloured base spheres with the mutated base enlarged and its rung in white, and on the right the chain of amino-acid beads it codes for, with the changed amino acid in red"
      camera={[0.6, 0.4, 8.4]}
      onReset={reset}
      scene={() => (<group>
        <Tick fn={tick} />
        <group ref={spin} position={[-2.6, 0, 0]}><Helix coding={A.mut} mark={A.pos} /></group>
        <group position={[0.6, 0.2, 0]}>
          {beads.map(({ i, aa }) => (<mesh key={i} position={[(i % 5) * 0.62, 1.1 - Math.floor(i / 5) * 1.1 + Math.sin(i * 1.1) * 0.15, 0]}>
            <sphereGeometry args={[changed(i) ? 0.3 : 0.24, 16, 16]} /><meshStandardMaterial color={aa ? (changed(i) ? "#ff3a4a" : colorOf(aa)) : "#33454e"} emissive={changed(i) ? "#ff3a4a" : "#000000"} emissiveIntensity={0.4} /></mesh>))}
          {A.now.stopped && (<mesh position={[(n % 5) * 0.62, 1.1 - Math.floor(n / 5) * 1.1, 0]}><boxGeometry args={[0.4, 0.4, 0.4]} /><meshStandardMaterial color="#ff5a5f" /></mesh>)}
          <mesh position={[1.24, -1.6, 0]}><boxGeometry args={[3.4, 0.05, 0.5]} /><meshStandardMaterial color="#33454e" /></mesh>
        </group>
      </group>)}
      readouts={[
        [`Base ${A.pos} of the coding strand`, `${A.oldBase} → ${A.newBase}`], [`Codon ${A.codonIndex + 1}`, `${A.oldCodon || "—"} (${A.oldAA}) → ${A.newCodon || "—"} (${A.newAA})`], ["Effect", effectText[A.effect]],
        ["Protein", `${A.now.aa.length} amino acids (original ${A.orig.aa.length}); ${tail}`], ["mRNA", A.mrna], ["GC content / Wallace Tm", `${A.gc.toFixed(0)} % / ${A.tm} °C`],
      ]}
      controls={<>
        <Slider label="Mutated base position" value={pos} min={1} max={30} step={1} digits={0} onChange={(x) => set("pos", Math.round(x))} />
        <Pick<MutKind> label="Point mutation" value={kind} options={[{ id: "none", label: "None (original gene)" }, { id: "ts", label: "Transition (A↔G, C↔T)" }, { id: "tv", label: "Transversion (A↔T, G↔C)" }]} onChange={(x) => set("kind", x)} />
        <Pick<DnaSample> label="Gene" value={sample} options={[{ id: "s1", label: "Gene 1" }, { id: "s2", label: "Gene 2" }, { id: "s3", label: "Gene 3 (short, GC-rich)" }, { id: "s4", label: "Gene 4 (short, AT-rich)" }, { id: "s5", label: "Gene 5 (His-tag)" }]} onChange={(x) => set("sample", x)} />
      </>}
      note={<p>The double helix shows the coding strand (front spheres) paired with its complement: A green pairs with T red, G gold with C blue. Transcription copies the coding strand into mRNA with U in place of T, and each three-base codon is read in frame from the AUG start codon into one amino acid of the standard genetic code (beads on the right; the red cube is the stop). A point mutation changes one base: silent if the new codon codes for the same amino acid (the code is redundant), missense if it changes the amino acid, nonsense if it makes a stop codon and cuts the protein short. Transitions swap purine for purine or pyrimidine for pyrimidine; transversions swap a purine with a pyrimidine. The genes are short teaching sequences, not real genes.</p>}
    />
  );
}
