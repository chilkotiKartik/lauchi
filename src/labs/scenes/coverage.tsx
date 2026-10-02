"use client";
import { useMemo } from "react";
import { coverage } from "../sim/weba";
import { Box, C, Instances, type Inst } from "../kit";
import { LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { WEBA_SPECS } from "../meta/weba.specs";

export default function CoverageLab() {
  const [P, set, reset] = useLabParams(WEBA_SPECS.coverage);
  const tests = Math.round(P.tests), branches = Math.round(P.branches), per = Math.round(P.per), bugs = Math.round(P.bugs);
  const o = useMemo(() => coverage(branches, tests, per, bugs), [branches, tests, per, bugs]);
  const items = useMemo<Inst[]>(() => o.covered.map((cov, i) => {
    const col = i % 8, row = Math.floor(i / 8), h = cov ? 0.7 : 0.18;
    const c = o.bug[i] ? (cov ? C.gold : C.red) : cov ? C.green : "#5b6d77";
    return { p: [-1.95 + col * 0.56, h / 2 - 0.9, -0.8 + row * 0.56], s: [0.44, h, 0.44], c };
  }), [o]);
  return (
    <LabFrame
      label="A grid of blocks, one per code branch: tall green blocks are covered by a test, low grey blocks are not, gold blocks are covered bugs that a test found and red blocks are bugs no test reached"
      camera={[0, 2.8, 5.6]}
      animated={false}
      onReset={reset}
      scene={() => (
        <group>
          <Box p={[0, -0.95, 0.3]} s={[5.2, 0.06, 3.4]} c="#2a4653" />
          <Instances items={items} cap={40} />
        </group>
      )}
      readouts={[
        ["Branch coverage", `${o.pct.toFixed(0)}%`],
        ["Branches covered", `${o.count} of ${branches}`],
        ["Bugs found", `${o.found} of ${o.bugs}`],
        ["Bugs missed", String(o.bugs - o.found)],
        ["Tests that added nothing new", String(o.wasted)],
      ]}
      controls={<>
        <Slider label="Number of tests" value={tests} min={0} max={40} step={1} digits={0} onChange={(x) => set("tests", Math.round(x))} />
        <Slider label="Branches in the code" value={branches} min={4} max={40} step={1} digits={0} onChange={(x) => set("branches", Math.round(x))} />
        <Slider label="Branches each test reaches" value={per} min={1} max={6} step={1} digits={0} onChange={(x) => set("per", Math.round(x))} />
        <Slider label="Hidden bugs" value={bugs} min={0} max={6} step={1} digits={0} onChange={(x) => set("bugs", Math.round(x))} />
      </>}
      note={<p>Every block is one branch of the code (an if, a case, a loop path). Each test runs a few branches picked by a fixed pseudo-random pattern, so the same numbers always give the same picture. Green raised blocks have run; grey low blocks never have. Bugs sit in a few branches: gold means a test ran the buggy branch (and would have caught it), red means no test did. Coverage tells you which code ran, not whether the assertions were good, but you cannot find a bug in code that never runs. Tests such as those written in Jest measure this with a coverage report.</p>}
    />
  );
}
