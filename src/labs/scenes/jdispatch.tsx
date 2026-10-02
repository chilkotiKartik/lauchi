"use client";
import { J_DEFS, J_PARENT, dispatch, type JClass, type JMeth } from "../sim/bcax";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { BCAX_SPECS } from "../meta/bcax.specs";
import { Bench, C, Cell, Halo, Led, Packet, Slab, Txt, type V3 } from "./bcax-kit";

const POS: Record<JClass, V3> = { Animal: [0, 0.6, 0], Dog: [-2.4, 2.4, 0], Puppy: [-2.4, 4.2, 0], Cat: [2.6, 2.4, 0] };
const MS: JMeth[] = ["speak", "eat", "fetch"];
export default function JDispatchLab() {
  const [P, set, reset] = useLabParams(BCAX_SPECS.jdispatch);
  const { ref, obj, mi } = P;
  const meth = MS[Math.round(mi)];
  const r = dispatch(ref as JClass, obj as JClass, meth as JMeth);
  const classes = Object.keys(POS) as JClass[];
  const trail: V3[] = r.lookup.map((c) => [POS[c][0] + 1.3, POS[c][1], 0.6] as V3);
  return (
    <LabFrame
      label="A class hierarchy built as stacked blocks: Animal at the bottom, Dog and Cat above it and Puppy on top of Dog, each with brick slots for the methods it overrides; a gold packet climbs from the object's real class upwards until it finds the method to run"
      camera={[0, 3.4, 10.5]}
      onReset={reset}
      scene={() => (<group position={[0, -0.6, 0]}>
        <Bench w={12} d={5} />
        {classes.map((c) => {
          const p = POS[c], isObj = c === obj, par = J_PARENT[c], hit = r.impl === c;
          return (<group key={c}>
            <Slab p={p} s={[3.0, 1.35, 1.2]} c={isObj ? "#4a3a1a" : "#27455c"} glow={isObj ? 0.5 : 0.1} />
            <Txt p={[p[0], p[1] + 0.45, 0.65]} s={c === "Animal" ? "AnImAL" : c === "Puppy" ? "PuPPY" : c === "Dog" ? "dOG" : "CAt"} h={0.32} c={isObj ? C.gold : "#ffffff"} />
            {MS.map((m, i) => <Slab key={m} p={[p[0] - 1.0 + i * 1.0, p[1] - 0.3, 0.65]} s={[0.8, 0.5, 0.2]} c={J_DEFS[c][m] !== undefined ? (hit && m === meth ? C.green : C.orange) : "#34454f"} glow={J_DEFS[c][m] !== undefined ? (hit && m === meth ? 1 : 0.35) : 0} />)}
            {par && <Slab p={[(p[0] + POS[par][0]) / 2, (p[1] + POS[par][1]) / 2, -0.4]} s={[0.12, Math.abs(p[1] - POS[par][1]) - 0.6, 0.12]} c={C.light} glow={0.3} />}
            {hit && <Halo p={[p[0], p[1], 0.7]} r={1.7} c={C.green} />}
          </group>);
        })}
        <Cell p={[-5.0, 0.4, 0.5]} s={[1.6, 0.6, 0.4]} c={C.blue} glow={0.4} v={ref === "Animal" ? "REF A" : ref === "Dog" ? "REF d" : ref === "Puppy" ? "REF P" : "REF C"} th={0.3} />
        <Led p={[5.0, 4.4, 0.5]} c={r.ok ? C.green : C.red} r={0.35} />
        {trail.length > 0 && <Packet path={trail.length > 1 ? trail : [trail[0], [trail[0][0], trail[0][1] + 0.01, 0.6]]} c={C.gold} speed={0.3} r={0.17} />}
      </group>)}
      readouts={[
        ["Statement", `${ref} x = new ${obj}(); x.${meth}();`], ["Compile time", r.ok ? "OK: method found in the reference type" : "ERROR"],
        ["Run-time search", r.ok ? r.lookup.join(" → ") : "-"], ["Method that runs", r.ok ? `${r.impl}.${meth}()` : "none"], [r.ok ? "Output" : "Message", r.ok ? r.out : r.error],
      ]}
      controls={<>
        <Slider label="Method called: 0 speak, 1 eat, 2 fetch" value={mi} min={0} max={2} step={1} digits={0} onChange={(x) => set("mi", Math.round(x))} />
        <Pick label="Reference type" value={ref} options={(Object.keys(POS) as JClass[]).map((id) => ({ id, label: id }))} onChange={(x) => set("ref", x)} />
        <Pick label="Object created with new" value={obj} options={(Object.keys(POS) as JClass[]).map((id) => ({ id, label: id }))} onChange={(x) => set("obj", x)} />
      </>}
      note={<p><b>Dynamic method dispatch</b> (run-time polymorphism): <code>Animal a = new Dog(); a.speak();</code>. The <i>compiler</i> checks that speak() exists in the reference type Animal; at <i>run time</i> the JVM starts at the object&apos;s real class and walks up the inheritance chain until it finds an implementation, so Dog&apos;s overridden speak() runs (PYQ Q7.3). Orange bricks are methods a class defines. Try Animal → Dog → fetch(): the compiler refuses because the reference type does not know fetch(). Overloading, by contrast, is decided at compile time by the argument types; static methods and fields use the reference type.</p>}
    />
  );
}
