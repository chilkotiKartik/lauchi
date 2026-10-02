"use client";
import { codeSplit } from "../sim/webb";
import { Box, C, Floor, Panel } from "../kit";
import { LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { WEBB_SPECS } from "../meta/webb.specs";

const ms = (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(2)} s` : `${v.toFixed(0)} ms`);

export default function CodeSplitLab() {
  const [P, set, reset] = useLabParams(WEBB_SPECS.codesplit);
  const routes = Math.round(P.routes), o = codeSplit(routes, P.routeKB, P.vendor, Math.round(P.visited), P.mbps);
  const sc = 3.4 / Math.max(o.single, 1);
  const seg = (x: number, kb: number, c: string, z: number) => <Box key={`${z}${x}`} p={[x + (kb * sc) / 2 - 3.3, 0.5 - z * 1.3, 0]} s={[Math.max(0.02, kb * sc), 0.55, 0.6]} c={c} glow={0.2} />;
  const chunks = Array.from({ length: routes }, (_, i) => i);
  return (
    <LabFrame
      label="A long orange bar for the single bundle above a second bar split into a purple shared block and blue route blocks, where the routes the visitor has opened are green and the unopened ones stay grey"
      camera={[0, 0.5, 6.4]}
      animated={false}
      onReset={reset}
      scene={() => (
        <group>
          <Floor size={12} y={-1.4} divisions={12} />
          <Panel p={[0, -0.1, -0.7]} w={7.8} h={3.4} />
          {seg(0, o.single, C.orange, 0)}
          {seg(0, P.vendor, C.purple, 1)}
          {chunks.map((i) => seg(P.vendor * sc + i * P.routeKB * sc, P.routeKB, i < o.visited ? C.green : C.grey, 1))}
        </group>
      )}
      readouts={[
        ["One bundle", `${o.single} KB, ${ms(o.singleMs)}`],
        ["First load when split", `${o.initial} KB, ${ms(o.initialMs)}`],
        ["First load saved", `${o.savedPct.toFixed(1)}%`],
        ["Downloaded after visiting routes", `${o.after} KB`],
        ["Never downloaded", `${o.unusedKB} KB`],
      ]}
      controls={<>
        <Slider label="Routes in the app" value={routes} min={2} max={12} step={1} digits={0} onChange={(x) => set("routes", Math.round(x))} />
        <Slider label="Size of each route" value={P.routeKB} min={20} max={500} step={10} digits={0} unit=" KB" onChange={(x) => set("routeKB", x)} />
        <Slider label="Shared vendor code" value={P.vendor} min={50} max={1000} step={10} digits={0} unit=" KB" onChange={(x) => set("vendor", x)} />
        <Slider label="Routes the visitor opens" value={P.visited} min={1} max={12} step={1} digits={0} onChange={(x) => set("visited", Math.round(x))} />
        <Slider label="Bandwidth" value={P.mbps} min={1} max={100} step={1} digits={0} unit=" Mbit/s" onChange={(x) => set("mbps", x)} />
      </>}
      note={<p>Top bar: the whole app in one file, so a visitor downloads every route before anything works. Bottom bar: shared code (purple) plus one chunk per route, loaded lazily with React.lazy and dynamic import(). Only the shared code and the first route are needed up front; green chunks are ones the visitor opened, grey ones are never downloaded unless needed. Sizes are transfer sizes in kilobytes and time is size × 8 divided by bandwidth; caching, parallel requests and latency are ignored. The number of routes visited is limited to the number of routes.</p>}
    />
  );
}
