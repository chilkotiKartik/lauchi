"use client";
import { useMemo } from "react";
import { rollout } from "../sim/webb";
import { Box, C, Floor, Instances, Panel, type Inst } from "../kit";
import { LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { WEBB_SPECS } from "../meta/webb.specs";

const n = (x: number) => Math.round(x).toLocaleString("en-US");

export default function CanaryLab() {
  const [P, set, reset] = useLabParams(WEBB_SPECS.canary);
  const o = rollout(P.rps, P.roll, P.err, P.detect, P.staging);
  const items = useMemo<Inst[]>(() => Array.from({ length: 100 }, (_, i) => {
    const hit = i < Math.round(P.roll);
    return { p: [(i % 10) * 0.32 - 1.45, hit ? 0.1 : 0, Math.floor(i / 10) * 0.32 - 1.4], s: [0.26, hit ? 0.5 : 0.2, 0.26], c: hit ? C.red : C.blue };
  }), [P.roll]);
  return (
    <LabFrame
      label="A ten by ten field of blocks for users, where the red raised blocks receive the new buggy version and blue ones stay on the old version, with a gate on the left whose height shows how often staging catches the bug"
      camera={[0.5, 3.2, 5.6]}
      animated={false}
      onReset={reset}
      scene={() => (
        <group>
          <Floor size={12} y={-0.15} divisions={12} />
          <Panel p={[0, 0.3, -2]} w={7.6} h={2} />
          <Box p={[-3.4, -0.1 + (P.staging / 100) * 1.4 + 0.02, 0]} s={[0.3, Math.max(0.05, (P.staging / 100) * 2.8), 0.9]} c={C.green} glow={0.4} />
          <Box p={[-3.4, 1.3, 0]} s={[0.4, 0.04, 1]} c={C.light} />
          <Instances items={items} cap={100} />
        </group>
      )}
      readouts={[
        ["Failed requests, staged rollout", n(o.failed)],
        ["Failed requests, everyone at once", n(o.bigBang)],
        ["Damage avoided", `${o.saved.toFixed(0)}%`],
        ["Users on the new version", `${Math.round(P.roll)}%`],
        ["Chance staging misses the bug", `${(o.reachProd * 100).toFixed(0)}%`],
        ["Expected failed requests", n(o.expected)],
      ]}
      controls={<>
        <Slider label="Traffic" value={P.rps} min={100} max={10000} step={100} digits={0} unit=" req/s" onChange={(x) => set("rps", x)} />
        <Slider label="Users given the new version" value={P.roll} min={1} max={100} step={1} digits={0} unit=" %" onChange={(x) => set("roll", x)} />
        <Slider label="Errors caused by the bug" value={P.err} min={1} max={100} step={1} digits={0} unit=" %" onChange={(x) => set("err", x)} />
        <Slider label="Minutes until it is detected and rolled back" value={P.detect} min={1} max={30} step={1} digits={0} unit=" min" onChange={(x) => set("detect", x)} />
        <Slider label="Staging tests catch such a bug" value={P.staging} min={0} max={100} step={5} digits={0} unit=" %" onChange={(x) => set("staging", x)} />
      </>}
      note={<p>Before production, code passes through development, testing and staging environments. Staging is a copy of production; the green gate&apos;s height is how often it catches a bug before release. A bug that slips through then meets a canary release: only a small share of users (red blocks) get the new version first. Failed requests are traffic × time until rollback × share of users on the new version × the bug&apos;s error rate; sending it to everyone multiplies the damage by 100 ÷ share. Expected damage also multiplies by the chance staging misses the bug. All figures are model inputs you choose, assuming the bug always shows up and rollback is exact.</p>}
    />
  );
}
