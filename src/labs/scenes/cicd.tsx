"use client";
import { pipelineStats } from "../sim/webb";
import { Box, C, Floor, Panel, Poly } from "../kit";
import { Check, LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { WEBB_SPECS } from "../meta/webb.specs";

const min = (m: number) => `${m.toFixed(1)} min`;

export default function CicdLab() {
  const [P, set, reset] = useLabParams(WEBB_SPECS.cicd);
  const o = pipelineStats(P.e2e, P.unitFail, P.e2eFail, P.cache, P.parallel);
  const top = Math.max(...o.stages.map((s) => s.min), 1);
  const shade = (f: number) => (f < 0.05 ? C.green : f < 0.15 ? C.gold : C.red);
  const xs = [-3.2, -1.9, -0.6, 0.7, 2.0];
  return (
    <LabFrame
      label="Five pipeline stage columns in a row (lint, unit tests, build, end-to-end, deploy) whose heights are their durations and whose colours show how often they fail, joined by arrows; when parallel the first three stand side by side in front"
      camera={[0, 0.7, 6.8]}
      animated={false}
      onReset={reset}
      scene={() => (
        <group>
          <Floor size={12} y={-1.5} divisions={12} />
          <Panel p={[-0.2, 0.2, -0.9]} w={8.2} h={3.9} />
          {o.stages.map((s, i) => {
            const h = Math.max(0.15, (s.min / top) * 3), z = P.parallel && i < 3 ? 0.7 : 0;
            return <Box key={s.name} p={[xs[i], -1.5 + h / 2, z]} s={[0.9, h, 0.9]} c={shade(s.fail)} glow={0.3} />;
          })}
          <Poly pts={[[-3.4, -1.55, 1.0], [2.6, -1.55, 1.0]]} c={C.light} w={2} />
        </group>
      )}
      readouts={[
        ["Time when everything passes", min(o.cleanMin)],
        ["Average time per push", min(o.expMin)],
        ["Chance a push goes green", `${(o.pGreen * 100).toFixed(1)}%`],
        ["Longest stage", `${o.stages.reduce((a, b) => (b.min > a.min ? b : a)).name} (${min(Math.max(...o.stages.map((s) => s.min)))})`],
      ]}
      controls={<>
        <Slider label="End-to-end test time" value={P.e2e} min={1} max={30} step={1} digits={0} unit=" min" onChange={(x) => set("e2e", Math.round(x))} />
        <Slider label="Unit-test failure rate" value={P.unitFail} min={0} max={40} step={1} digits={0} unit=" %" onChange={(x) => set("unitFail", x)} />
        <Slider label="End-to-end failure rate" value={P.e2eFail} min={0} max={40} step={1} digits={0} unit=" %" onChange={(x) => set("e2eFail", x)} />
        <Check label="Cache dependencies (build 3 → 1 min)" checked={P.cache} onChange={(v) => set("cache", v)} />
        <Check label="Run lint, unit tests and build in parallel" checked={P.parallel} onChange={(v) => set("parallel", v)} />
      </>}
      note={<p>Every push to the repository runs the stages left to right and stops at the first failure, so later stages run only when earlier ones pass: the average time is lower than the time of a fully passing run. Column height is the stage&apos;s duration; green stages rarely fail, gold sometimes, red often. Caching dependencies shortens the build. Running independent stages in parallel (moved forward in the picture) costs the longest of them rather than the sum. Deployment to the server follows only a fully green pipeline. Lint 0.5 min, unit tests 2 min, and the 3%, 2% and 1% failure rates of lint, build and deploy are assumed typical values.</p>}
    />
  );
}
