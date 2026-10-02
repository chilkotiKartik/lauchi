"use client";
import { renderTimes } from "../sim/weba";
import { Box, C, Floor, Panel, spans } from "../kit";
import { LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { WEBA_SPECS } from "../meta/weba.specs";

const ms = (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(2)} s` : `${v.toFixed(0)} ms`);
const W = 6.4;

export default function SsrCsrLab() {
  const [P, set, reset] = useLabParams(WEBA_SPECS.ssrcsr);
  const { rtt, bw, html, js, server, api, cpu } = P;
  const r = renderTimes(rtt, bw, html, js, server, api, cpu);
  const dl = (kb: number) => (kb * 8) / bw, exec = js * cpu, connect = 2 * rtt;
  const ssr = [connect, rtt + server, dl(html), dl(js), exec];
  const csr = [connect, rtt + dl(2), dl(js), exec, rtt + api];
  const max = Math.max(r.ssrReady, r.csrReady, 1);
  const sa = spans(ssr.map((v) => Math.max(0.03, (v / max) * W))), sb = spans(csr.map((v) => Math.max(0.03, (v / max) * W)));
  const colS = [C.purple, C.gold, C.green, C.blue, C.orange], colC = [C.purple, C.gold, C.blue, C.orange, C.red];
  const mark = (t: number) => -W / 2 + (t / max) * W;
  return (
    <LabFrame
      label="Two rows of coloured time blocks, server-side rendering at the back and client-side rendering at the front, each with a tall gold pole where real content first appears"
      camera={[0, 1.6, 6.4]}
      animated={false}
      onReset={reset}
      scene={() => (
        <group>
          <Floor size={12} y={-1.2} divisions={12} />
          <Panel p={[0, 0.3, -1.4]} w={8} h={3.4} />
          {sa.map((s, i) => <Box key={`s${i}`} p={[-W / 2 + s.x + s.w / 2, 0.6, -0.5]} s={[s.w, 0.5, 0.6]} c={colS[i]} glow={0.2} />)}
          {sb.map((s, i) => <Box key={`c${i}`} p={[-W / 2 + s.x + s.w / 2, -0.4, 0.5]} s={[s.w, 0.5, 0.6]} c={colC[i]} glow={0.2} />)}
          <Box p={[mark(r.ssrContent), 0.6, -0.5]} s={[0.05, 1.5, 0.05]} c={C.white} glow={0.8} />
          <Box p={[mark(r.csrContent), -0.4, 0.5]} s={[0.05, 1.5, 0.05]} c={C.white} glow={0.8} />
        </group>
      )}
      readouts={[
        ["SSR: content appears", ms(r.ssrContent)],
        ["SSR: page interactive", ms(r.ssrReady)],
        ["CSR: content appears", ms(r.csrContent)],
        ["Content shows sooner with SSR by", ms(r.csrContent - r.ssrContent)],
        ["CSR ÷ SSR content time", `${(r.csrContent / r.ssrContent).toFixed(1)}×`],
      ]}
      controls={<>
        <Slider label="Round-trip time" value={rtt} min={10} max={500} step={10} digits={0} unit=" ms" onChange={(x) => set("rtt", x)} />
        <Slider label="Bandwidth" value={bw} min={1} max={200} step={1} digits={0} unit=" Mbit/s" onChange={(x) => set("bw", x)} />
        <Slider label="Server-rendered HTML" value={html} min={5} max={300} step={5} digits={0} unit=" KB" onChange={(x) => set("html", x)} />
        <Slider label="JavaScript bundle" value={js} min={20} max={2000} step={10} digits={0} unit=" KB" onChange={(x) => set("js", x)} />
        <Slider label="Server render time" value={server} min={0} max={1000} step={10} digits={0} unit=" ms" onChange={(x) => set("server", x)} />
        <Slider label="API response time" value={api} min={0} max={1000} step={10} digits={0} unit=" ms" onChange={(x) => set("api", x)} />
        <Slider label="CPU slowness (1 = fast laptop)" value={cpu} min={1} max={6} step={0.5} digits={1} unit="×" onChange={(x) => set("cpu", x)} />
      </>}
      note={<p>Back row: server-side rendering, as with EJS templates. After the connection (purple), the server builds the HTML (gold) and sends it (green), so real content appears at the white pole; the page then downloads (blue) and runs (orange) its JavaScript to become interactive. Front row: client-side rendering. The browser gets an almost empty page, downloads and runs the whole bundle, then calls the API (red) before anything real can show. Assumptions: TCP + TLS 1.3 is two round trips, running JavaScript costs 1 ms per KB on a 1× CPU, and the empty shell is 2 KB. No caching or streaming.</p>}
    />
  );
}
