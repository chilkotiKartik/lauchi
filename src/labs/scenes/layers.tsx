"use client";
import { layers, type Changed } from "../sim/webb";
import { Box, C, Floor, Panel } from "../kit";
import { Check, LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { WEBB_SPECS } from "../meta/webb.specs";

export default function LayersLab() {
  const [P, set, reset] = useLabParams(WEBB_SPECS.layers);
  const o = layers(P.base, P.tools, P.deps, P.app, P.changed as Changed, P.multi);
  const total = o.layers.reduce((s, l) => s + l.mb, 0) || 1, sc = 3.2 / total;
  const ys: number[] = [];
  o.layers.reduce((acc, l) => { ys.push(acc + (l.mb * sc) / 2); return acc + l.mb * sc; }, -1.5);
  return (
    <LabFrame
      label="A tower of four stacked slabs for the image layers, thicker for bigger layers: layers that are reused from the cache are green, layers that must be rebuilt are red, and a build-tools layer left out by a multi-stage build is see-through"
      camera={[0.5, 0.6, 6.4]}
      animated={false}
      onReset={reset}
      scene={() => (
        <group>
          <Floor size={12} y={-1.5} divisions={12} />
          <Panel p={[-0.4, 0.1, -0.8]} w={6.6} h={3.9} />
          {o.layers.map((l, i) => l.mb > 0 ? <Box key={l.name} p={[-1.6, ys[i], 0]} s={[2.4, Math.max(0.05, l.mb * sc), 1.4]} c={o.rebuilt[i] ? C.red : C.green} glow={0.25} o={l.final ? 1 : 0.3} /> : null)}
          <Box p={[2, -1.5 + (o.finalMB * sc) / 2, 0]} s={[0.5, Math.max(0.05, o.finalMB * sc), 0.5]} c={C.blue} glow={0.3} />
          <Box p={[2.9, -1.5 + (o.pushed * sc) / 2, 0]} s={[0.5, Math.max(0.03, o.pushed * sc), 0.5]} c={C.orange} glow={0.3} />
        </group>
      )}
      readouts={[
        ["Final image size", `${o.finalMB.toFixed(0)} MB`],
        ["Layers rebuilt", `${o.count} of 4`],
        ["Data to rebuild and push", `${o.pushed.toFixed(0)} MB`],
        ["Reused from the cache", `${o.reusedPct.toFixed(1)}%`],
      ]}
      controls={<>
        <Slider label="Base image" value={P.base} min={5} max={500} step={5} digits={0} unit=" MB" onChange={(x) => set("base", x)} />
        <Slider label="Build tools layer" value={P.tools} min={0} max={800} step={10} digits={0} unit=" MB" onChange={(x) => set("tools", x)} />
        <Slider label="Dependencies layer" value={P.deps} min={0} max={800} step={10} digits={0} unit=" MB" onChange={(x) => set("deps", x)} />
        <Slider label="Application layer" value={P.app} min={1} max={200} step={1} digits={0} unit=" MB" onChange={(x) => set("app", x)} />
        <Pick label="What you changed" value={P.changed} options={[{ id: "app", label: "Application code" }, { id: "deps", label: "Dependencies" }, { id: "base", label: "Base image" }]} onChange={(v) => set("changed", v)} />
        <Check label="Multi-stage build (leave build tools out)" checked={P.multi} onChange={(v) => set("multi", v)} />
      </>}
      note={<p>A container image is a stack of read-only layers, one per build step, in the order of the Dockerfile. When you change something, that layer and every layer above it are rebuilt; the layers below come from the build cache (green). That is why dependencies are installed before the application code is copied in: code changes then rebuild only the small top layer. A multi-stage build compiles in one stage with all the tools and copies only the result into the final image, so the build-tools layer (see-through) is not shipped. This lab is a model of the idea; it does not need Docker to run. Layer sizes are the values you set, and build times are not modelled. Blue is the image, orange the data rebuilt.</p>}
    />
  );
}
