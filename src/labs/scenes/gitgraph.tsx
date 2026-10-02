"use client";
import { useMemo } from "react";
import { integrate, type Strategy } from "../sim/webb";
import { C, Instances, Panel, Segs, type Inst } from "../kit";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { WEBB_SPECS } from "../meta/webb.specs";

export default function GitGraphLab() {
  const [P, set, reset] = useLabParams(WEBB_SPECS.gitgraph);
  const f = Math.round(P.f), m0 = Math.round(P.m0), m1 = Math.round(P.m1), s = P.strategy as Strategy;
  const o = integrate(m0, f, m1, s);
  const g = useMemo(() => {
    const F = Math.round(P.f), M0 = Math.round(P.m0), M1 = Math.round(P.m1), S = P.strategy as Strategy, base = M0 + M1, sp = Math.min(0.55, 6.4 / (base + F + 2));
    const X = (i: number) => -3.3 + i * sp, nodes: Inst[] = [], e: number[] = [];
    const node = (x: number, y: number, c: string) => nodes.push({ p: [x, y, 0], s: [0.26, 0.26, 0.26], c });
    const line = (x1: number, y1: number, x2: number, y2: number) => e.push(x1, y1, 0, x2, y2, 0);
    // before: main rail (y = 1.2) and the feature rail (y = 2.1) that left main after commit M0
    for (let i = 0; i < base; i++) { node(X(i), 1.2, C.blue); if (i > 0) line(X(i - 1), 1.2, X(i), 1.2); }
    for (let j = 0; j < F; j++) { node(X(M0 + j), 2.1, C.green); line(j === 0 ? X(M0 - 1) : X(M0 + j - 1), j === 0 ? 1.2 : 2.1, X(M0 + j), 2.1); }
    // after: what main looks like once the strategy is applied (y = -0.4)
    for (let i = 0; i < base; i++) { node(X(i), -0.4, C.blue); if (i > 0) line(X(i - 1), -0.4, X(i), -0.4); }
    if (S === "merge") { for (let j = 0; j < F; j++) { node(X(M0 + j), 0.5, C.green); line(j === 0 ? X(M0 - 1) : X(M0 + j - 1), j === 0 ? -0.4 : 0.5, X(M0 + j), 0.5); } node(X(base), -0.4, C.gold); line(X(base - 1), -0.4, X(base), -0.4); line(X(M0 + F - 1), 0.5, X(base), -0.4); }
    else if (S === "squash") { node(X(base), -0.4, C.gold); line(X(base - 1), -0.4, X(base), -0.4); }
    else { for (let j = 0; j < F; j++) { node(X(base + j), -0.4, C.orange); line(X(base + j - 1), -0.4, X(base + j), -0.4); } }
    return { nodes, edges: e };
  }, [P.f, P.m0, P.m1, P.strategy]);
  return (
    <LabFrame
      label="Two commit graphs made of balls joined by lines: on top main with a feature branch above it before integrating, and below what main looks like after a merge commit, a squash or a rebase, with new commits in gold or orange"
      camera={[0, 0.7, 6.6]}
      animated={false}
      onReset={reset}
      scene={() => (<group><Panel p={[0, 0.9, -0.5]} w={7.6} h={2.6} /><Panel p={[0, -0.4, -0.5]} w={7.6} h={2} /><Segs pts={g.edges} c="#9db0ba" /><Instances items={g.nodes} cap={40} shape="sphere" /></group>)}
      readouts={[
        ["Commits on main afterwards", String(o.commits)],
        ["Merge commit added?", o.mergeCommit ? "Yes" : "No"],
        ["History is a straight line?", o.linear ? "Yes" : "No, it forks and joins"],
        ["Feature commits kept as they were", String(s === "rebase" ? 0 : o.featureVisible)],
        ["Commits rewritten (new hashes)", String(o.rewritten)],
      ]}
      controls={<>
        <Slider label="Commits on the feature branch" value={f} min={1} max={6} step={1} digits={0} onChange={(x) => set("f", Math.round(x))} />
        <Slider label="Commits on main before branching" value={m0} min={1} max={6} step={1} digits={0} onChange={(x) => set("m0", Math.round(x))} />
        <Slider label="New commits on main since" value={m1} min={0} max={6} step={1} digits={0} onChange={(x) => set("m1", Math.round(x))} />
        <Pick label="How the pull request is merged" value={s} options={[{ id: "merge", label: "Merge commit" }, { id: "squash", label: "Squash and merge" }, { id: "rebase", label: "Rebase and merge" }]} onChange={(v) => set("strategy", v)} />
      </>}
      note={<p>Top: main (blue) and a feature branch (green) that split off after the last of the first main commits. Below: main after the pull request is accepted. A merge commit (gold) keeps every feature commit and joins the two lines. Squash-and-merge folds the whole branch into one new commit (gold), keeping main tidy but losing the steps. Rebase replays the feature commits on top of main as new commits (orange), giving a straight history but new hashes. Conflicts, review comments and force-pushes are not modelled.</p>}
    />
  );
}
