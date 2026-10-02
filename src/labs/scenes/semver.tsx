"use client";
import { useMemo } from "react";
import { semver, VERSIONS, type RangeKind, type Ver } from "../sim/weba";
import { C, Instances, Panel, Spin, type Inst } from "../kit";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { WEBA_SPECS } from "../meta/weba.specs";

const v = (x: Ver | null) => (x ? x.join(".") : "none");
const RANGE = { caret: "^", tilde: "~", exact: "", gte: ">=" } as const;

export default function SemverLab() {
  const [P, set, reset] = useLabParams(WEBA_SPECS.semver);
  const base: Ver = [Math.round(P.M), Math.round(P.m), Math.round(P.p)], kind = P.kind as RangeKind;
  const s = semver(kind, base);
  const items = useMemo<Inst[]>(() => {
    const base: Ver = [Math.round(P.M), Math.round(P.m), Math.round(P.p)], hi = semver(P.kind as RangeKind, base).highest, match = semver(P.kind as RangeKind, base).match;
    return VERSIONS.map((ver, i) => {
      const isBase = ver[0] === base[0] && ver[1] === base[1] && ver[2] === base[2];
      const isHi = !!hi && ver[0] === hi[0] && ver[1] === hi[1] && ver[2] === hi[2];
      const on = match[i];
      const sz = on ? 0.4 : 0.22;
      return { p: [ver[1] * 0.62 - 1.3, ver[2] * 0.45 - 0.7, ver[0] * 1.0 - 1.5], s: [sz, sz, sz], c: isHi ? C.gold : isBase ? C.blue : on ? C.green : "#5b6d77" };
    });
  }, [P.M, P.m, P.p, P.kind]);
  return (
    <LabFrame
      label="A slowly turning block of one hundred small cubes, one per published version, with major versions front to back, minor left to right and patch upward; accepted versions are large and green, the highest is gold and the range's starting version is blue"
      camera={[0.2, 1.3, 7]}
      animated
      onReset={reset}
      scene={() => (
        <group>
          <Panel p={[0, 0.2, -2.2]} w={6.4} h={3.4} />
          <Spin speed={0.12}><Instances items={items} cap={100} /></Spin>
        </group>
      )}
      readouts={[
        ["Range", `${RANGE[kind]}${v(base)}`],
        ["Versions accepted", `${s.count} of 100`],
        ["npm installs (highest)", v(s.highest)],
        ["Lowest accepted", v(s.lowest)],
      ]}
      controls={<>
        <Slider label="Major version" value={P.M} min={0} max={3} step={1} digits={0} onChange={(x) => set("M", Math.round(x))} />
        <Slider label="Minor version" value={P.m} min={0} max={4} step={1} digits={0} onChange={(x) => set("m", Math.round(x))} />
        <Slider label="Patch version" value={P.p} min={0} max={4} step={1} digits={0} onChange={(x) => set("p", Math.round(x))} />
        <Pick label="Range operator" value={kind} options={[{ id: "caret", label: "^ caret: compatible" }, { id: "tilde", label: "~ tilde: patches only" }, { id: "exact", label: "exact: pinned" }, { id: "gte", label: ">= minimum" }]} onChange={(v2) => set("kind", v2)} />
      </>}
      note={<p>The lab pretends versions 0.0.0 to 3.4.4 all exist. Depth (front to back) is the major number, left to right the minor, height the patch. ^1.2.0 accepts changes that keep the leftmost non-zero number (all 1.x from 1.2.0 up), ~1.2.3 accepts only patch updates within 1.2, an exact version accepts one cube, and &gt;=1.2.0 accepts everything at or above it. For 0.x versions a caret is stricter: ^0.2.3 only allows 0.2.x, and ^0.0.3 only 0.0.3. npm installs the highest accepted version. Pre-release tags are not modelled.</p>}
    />
  );
}
