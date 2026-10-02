"use client";
import { httpJourney } from "../sim/weba";
import { Box, C, Floor, Panel, Poly, Shuttle, spans } from "../kit";
import { Check, LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { WEBA_SPECS } from "../meta/weba.specs";

const W = 6.4, COL = [C.purple, C.blue, C.green, C.gold, C.orange];
const ms = (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(2)} s` : `${v.toFixed(v < 10 ? 1 : 0)} ms`);

export default function HttpJourneyLab() {
  const [P, set, reset] = useLabParams(WEBA_SPECS.httpjourney);
  const { rtt, dns, https, server, size, mbps } = P;
  const j = httpJourney(rtt, dns, https, server, size, mbps);
  const total = j.total || 1;
  const sp = spans(j.parts.map((v) => Math.max(0.04, (v / total) * W)));
  const end = sp[sp.length - 1].x + sp[sp.length - 1].w;
  return (
    <LabFrame
      label="A timeline of five coloured blocks for DNS, TCP, TLS, the server request and the download, whose lengths follow their time, between a browser cube on the left and a server cube on the right with a gold packet travelling between them"
      camera={[0, 1.3, 6.8]}
      animated
      onReset={reset}
      scene={() => (
        <group>
          <Floor size={12} y={-1.2} divisions={12} />
          <Panel p={[0, 0.2, -0.7]} w={8.6} h={3.2} />
          <Box p={[-4.05, 0, 0]} s={[0.7, 0.7, 0.7]} c={C.light} />
          <Box p={[4.05, 0, 0]} s={[0.7, 0.9, 0.7]} c={C.red} glow={0.2} />
          {sp.map((s, i) => <Box key={i} p={[-W / 2 + s.x + s.w / 2, 0, 0]} s={[s.w, 0.6, 0.6]} c={COL[i]} glow={0.2} />)}
          <Poly pts={[[-W / 2, -0.55, 0], [-W / 2 + end, -0.55, 0]]} c={C.light} w={2} />
          <Shuttle from={[-3.5, 0.75, 0]} to={[3.5, 0.75, 0]} speed={0.3} r={0.11} />
        </group>
      )}
      readouts={[
        ["DNS lookup", ms(j.dns)],
        ["TCP + TLS set-up", ms(j.tcp + j.tls)],
        ["First byte (TTFB)", ms(j.ttfb)],
        ["Download", ms(j.download)],
        ["Page ready", ms(j.total)],
        ["Share spent on round trips", `${(((j.dns + j.tcp + j.tls + rtt) / total) * 100).toFixed(0)}%`],
      ]}
      controls={<>
        <Slider label="Round-trip time" value={rtt} min={5} max={500} step={5} digits={0} unit=" ms" onChange={(x) => set("rtt", x)} />
        <Slider label="DNS lookup (0 if cached)" value={dns} min={0} max={200} step={5} digits={0} unit=" ms" onChange={(x) => set("dns", x)} />
        <Check label="HTTPS (adds a TLS round trip)" checked={https} onChange={(v) => set("https", v)} />
        <Slider label="Server processing" value={server} min={0} max={1000} step={10} digits={0} unit=" ms" onChange={(x) => set("server", x)} />
        <Slider label="Page size" value={size} min={10} max={5000} step={10} digits={0} unit=" KB" onChange={(x) => set("size", x)} />
        <Slider label="Bandwidth" value={mbps} min={1} max={200} step={1} digits={0} unit=" Mbit/s" onChange={(x) => set("mbps", x)} />
      </>}
      note={<p>Purple: DNS turns the name into an address. Blue: the TCP handshake takes one round trip. Green: TLS 1.3 adds one more for HTTPS. Gold: the request travels there and back (one round trip) plus the server&apos;s think time, so the sum up to here is the time to first byte. Orange: the download, page size in kilobits divided by bandwidth. Block lengths are drawn to scale. A simplified model: it ignores TCP slow start, redirects and later requests for images and scripts, so real pages are slower.</p>}
    />
  );
}
