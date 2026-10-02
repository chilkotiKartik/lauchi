"use client";
import { bundleSize } from "../sim/webb";
import { Bars, C, Floor, Panel } from "../kit";
import { LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { WEBB_SPECS } from "../meta/webb.specs";

const kb = (v: number) => (v >= 1024 ? `${(v / 1024).toFixed(2)} MB` : `${v.toFixed(0)} KB`);

export default function BundleLab() {
  const [P, set, reset] = useLabParams(WEBB_SPECS.bundle);
  const o = bundleSize(Math.round(P.mods), P.kb, P.used, P.minify, P.gzip);
  return (
    <LabFrame
      label="Four columns falling in height: all source code in grey, after tree-shaking in blue, after minifying in gold and after compression in green"
      camera={[0, 0.7, 6.2]}
      animated={false}
      onReset={reset}
      scene={() => (
        <group>
          <Floor size={12} y={-1.5} divisions={12} />
          <Panel p={[0, 0.2, -0.7]} w={6.8} h={3.9} />
          <Bars values={[o.raw, o.shaken, o.minified, o.gz]} max={Math.max(o.raw, 1)} colors={[C.grey, C.blue, C.gold, C.green]} x0={-1.9} y0={-1.5} w={0.75} gap={0.35} height={3.2} glow={0.3} />
        </group>
      )}
      readouts={[
        ["All source", kb(o.raw)],
        ["After tree-shaking", kb(o.shaken)],
        ["After minifying", kb(o.minified)],
        ["After gzip (sent to the browser)", kb(o.gz)],
        ["Smaller by", `${o.ratio.toFixed(1)}×`],
      ]}
      controls={<>
        <Slider label="Modules imported" value={P.mods} min={10} max={500} step={10} digits={0} onChange={(x) => set("mods", Math.round(x))} />
        <Slider label="Average module size" value={P.kb} min={1} max={50} step={1} digits={0} unit=" KB" onChange={(x) => set("kb", x)} />
        <Slider label="Code actually used" value={P.used} min={10} max={100} step={5} digits={0} unit=" %" onChange={(x) => set("used", x)} />
        <Slider label="Size left after minifying" value={P.minify} min={30} max={90} step={5} digits={0} unit=" %" onChange={(x) => set("minify", x)} />
        <Slider label="Size left after gzip" value={P.gzip} min={15} max={50} step={1} digits={0} unit=" %" onChange={(x) => set("gzip", x)} />
      </>}
      note={<p>A bundler such as Vite, webpack or esbuild follows the import statements from your entry file and joins the modules it finds into a few files. Tree-shaking drops exports nothing imports (blue), minification shortens names and removes whitespace (gold), and gzip or brotli compress what is sent over the network (green). The percentages are typical assumptions, not measurements of your project: JavaScript often minifies to about 60% and gzips to about 30% of that. Bundling exists because browsers once could not load many small modules efficiently; import maps are a bundler-free alternative.</p>}
    />
  );
}
