"use client";
import { pyramid } from "../sim/webb";
import { Box, C, Floor, Panel } from "../kit";
import { LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { WEBB_SPECS } from "../meta/webb.specs";

const t = (s: number) => (s < 60 ? `${s.toFixed(1)} s` : `${(s / 60).toFixed(1)} min`);

export default function TestPyramidLab() {
  const [P, set, reset] = useLabParams(WEBB_SPECS.testpyramid);
  const u = Math.round(P.unit), i = Math.round(P.integ), e = Math.round(P.e2e), o = pyramid(u, i, e);
  const w = (n: number, max: number) => (n > 0 ? Math.max(0.2, (n / max) * 4.2) : 0);
  const wu = w(u, 500), wi = w(i, 200), we = w(e, 100);
  const tmax = Math.max(...o.parts, 1);
  return (
    <LabFrame
      label="A stack of three slabs whose widths follow the number of unit tests in green at the bottom, integration tests in blue in the middle and end-to-end tests in purple on top, beside three columns for how long each kind takes"
      camera={[0, 0.5, 6.4]}
      animated={false}
      onReset={reset}
      scene={() => (
        <group>
          <Floor size={12} y={-1.5} divisions={12} />
          <Panel p={[0, 0.1, -0.7]} w={7.8} h={3.9} />
          {wu > 0 && <Box p={[-1.9, -1.15, 0]} s={[wu, 0.65, 0.8]} c={C.green} glow={0.25} />}
          {wi > 0 && <Box p={[-1.9, -0.4, 0]} s={[wi, 0.65, 0.8]} c={C.blue} glow={0.25} />}
          {we > 0 && <Box p={[-1.9, 0.35, 0]} s={[we, 0.65, 0.8]} c={C.purple} glow={0.25} />}
          {o.parts.map((p, k) => <Box key={k} p={[1.9 + k * 0.6, -1.5 + Math.max(0.03, (p / tmax) * 3) / 2, 0]} s={[0.4, Math.max(0.03, (p / tmax) * 3), 0.4]} c={[C.green, C.blue, C.purple][k]} glow={0.3} />)}
        </group>
      )}
      readouts={[
        ["Tests in total", String(o.tests)],
        ["Time to run all", t(o.seconds)],
        ["Share of time in end-to-end", `${(o.e2eShare * 100).toFixed(0)}%`],
        ["Chance of a clean pass (no flake)", `${(o.pClean * 100).toFixed(1)}%`],
      ]}
      controls={<>
        <Slider label="Unit tests" value={u} min={0} max={500} step={10} digits={0} onChange={(x) => set("unit", Math.round(x))} />
        <Slider label="Integration tests" value={i} min={0} max={200} step={5} digits={0} onChange={(x) => set("integ", Math.round(x))} />
        <Slider label="End-to-end tests" value={e} min={0} max={100} step={5} digits={0} onChange={(x) => set("e2e", Math.round(x))} />
      </>}
      note={<p>The test pyramid says: many fast unit tests at the base, fewer integration tests, and a handful of end-to-end tests on top. The columns on the right show the time each layer costs, using assumed averages of 0.02 s per unit test, 0.5 s per integration test and 20 s per end-to-end test. Slow tests also flake more (assumed 0.2% for integration and 2% for end-to-end per run), so a big top layer makes a suite slow and unreliable: the chance that nothing flakes is (1 − p) multiplied over all tests. Unit tests never flake here. These numbers are typical guesses, not measurements of your project.</p>}
    />
  );
}
