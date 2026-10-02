"use client";
import { cascade, type Spec } from "../sim/weba";
import { Ball, Box, C, Floor, Panel } from "../kit";
import { Check, LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { WEBA_SPECS } from "../meta/weba.specs";

const U = 0.26, COLS = [C.red, C.blue, C.green];
function Tower({ x, s, win, halo }: { x: number; s: Spec; win: boolean; halo: boolean }) {
  return (
    <group position={[x, -1.4, 0]}>
      <Box p={[0.55, -0.03, 0]} s={[1.9, 0.08, 0.9]} c={win ? C.gold : C.grey} glow={win ? 0.6 : 0} />
      {s.map((n, i) => n > 0 ? <Box key={i} p={[i * 0.6, (n * U) / 2, 0]} s={[0.46, n * U, 0.46]} c={COLS[i]} glow={0.25} /> : null)}
      {halo && <Box p={[0.55, 1.4, 0]} s={[2, 2.8, 1]} c={C.red} o={0.16} />}
      {win && <Ball p={[0.55, 2.9, 0]} r={0.16} c={C.gold} glow={0.8} />}
    </group>
  );
}

export default function SpecificityLab() {
  const [P, set, reset] = useLabParams(WEBA_SPECS.specificity);
  const A: Spec = [Math.round(P.id1), Math.round(P.cls1), Math.round(P.tag1)], B: Spec = [Math.round(P.id2), Math.round(P.cls2), Math.round(P.tag2)];
  const r = cascade(A, B, P.imp);
  return (
    <LabFrame
      label="Two towers, one per CSS rule, each with a red column for ids, a blue column for classes and a green column for tags; the winning rule stands on a gold plate under a gold ball"
      camera={[0, 0.6, 7.4]}
      animated={false}
      onReset={reset}
      scene={() => (
        <group>
          <Floor size={12} y={-1.45} divisions={12} />
          <Panel p={[0, 0.4, -0.7]} w={8.4} h={4.4} />
          <Tower x={-3.4} s={A} win={r.winner === "A"} halo={P.imp} />
          <Tower x={0.9} s={B} win={r.winner === "B"} halo={false} />
        </group>
      )}
      readouts={[
        ["Rule A (ids, classes, tags)", `(${A.join(", ")})${P.imp ? " !important" : ""}`],
        ["Rule B (ids, classes, tags)", `(${B.join(", ")})`],
        ["Winner", `Rule ${r.winner}`],
        ["Why", r.why],
      ]}
      controls={<>
        <Slider label="Rule A: ids (#x)" value={P.id1} min={0} max={9} step={1} digits={0} onChange={(x) => set("id1", Math.round(x))} />
        <Slider label="Rule A: classes (.x)" value={P.cls1} min={0} max={9} step={1} digits={0} onChange={(x) => set("cls1", Math.round(x))} />
        <Slider label="Rule A: tags (p, div)" value={P.tag1} min={0} max={9} step={1} digits={0} onChange={(x) => set("tag1", Math.round(x))} />
        <Check label="Rule A is !important" checked={P.imp} onChange={(v) => set("imp", v)} />
        <Slider label="Rule B: ids (#x)" value={P.id2} min={0} max={9} step={1} digits={0} onChange={(x) => set("id2", Math.round(x))} />
        <Slider label="Rule B: classes (.x)" value={P.cls2} min={0} max={9} step={1} digits={0} onChange={(x) => set("cls2", Math.round(x))} />
        <Slider label="Rule B: tags (p, div)" value={P.tag2} min={0} max={9} step={1} digits={0} onChange={(x) => set("tag2", Math.round(x))} />
      </>}
      note={<p>When two rules set the same property on one element, the browser compares their specificity as a triple: ids first, then classes (also attributes and pseudo-classes), then tags. The first column where they differ decides, so one id outranks any number of classes. If the triples are equal the rule written later wins. An !important declaration beats normal ones regardless of specificity. Rule B is assumed to come after rule A in the file; the inline style attribute and the universal selector are left out of this model.</p>}
    />
  );
}
