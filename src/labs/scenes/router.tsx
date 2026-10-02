"use client";
import { matchRoute, paging } from "../sim/webb";
import { Ball, Box, C, Floor, Panel } from "../kit";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { WEBB_SPECS } from "../meta/webb.specs";

const PATTERNS = { user: "/users/:id", userpost: "/users/:id/posts/:postId", files: "/files/*", about: "/about" } as const;
const URLS = { u42: "/users/42", u42p7: "/users/42/posts/7", users: "/users", fileab: "/files/a/b.txt", about: "/about", aboutslash: "/about/" } as const;

export default function RouterLab() {
  const [P, set, reset] = useLabParams(WEBB_SPECS.router);
  const pattern = PATTERNS[P.pattern], url = URLS[P.url], m = matchRoute(pattern, url);
  const g = paging(Math.round(P.page), Math.round(P.size), Math.round(P.total));
  const pSeg = pattern.split("/").filter(Boolean), uSeg = url.split("/").filter(Boolean);
  const cells = Math.min(g.pages, 20);
  return (
    <LabFrame
      label="Two rows of blocks, the route pattern's segments above and the URL's segments below, green where they match and red where they do not, and under them a strip of page blocks with the current page in gold"
      camera={[0, 0.7, 6.4]}
      animated={false}
      onReset={reset}
      scene={() => (
        <group>
          <Floor size={12} y={-1.5} divisions={12} />
          <Panel p={[0, 0.2, -0.6]} w={7.4} h={3.8} />
          {pSeg.map((s, i) => <Box key={`p${i}`} p={[-3 + i * 1.5, 1.2, 0]} s={[1.3, 0.5, 0.4]} c={s.startsWith(":") || s === "*" ? C.purple : C.blue} glow={0.25} />)}
          {uSeg.map((s, i) => { const ok = m.ok || (i < pSeg.length && (pSeg[i].startsWith(":") || pSeg[i] === "*" || pSeg[i] === s)); return <Box key={`u${i}`} p={[-3 + i * 1.5, 0.3, 0]} s={[1.3, 0.5, 0.4]} c={ok ? C.green : C.red} glow={0.25} />; })}
          {Array.from({ length: cells }, (_, i) => <Box key={i} p={[-3.3 + i * (6.6 / Math.max(cells, 1)), -1.0, 0]} s={[Math.max(0.1, 6 / Math.max(cells, 1) - 0.06), 0.4, 0.4]} c={i + 1 === g.page ? C.gold : C.grey} glow={i + 1 === g.page ? 0.7 : 0} />)}
          {m.ok && <Ball p={[3.4, 0.75, 0]} r={0.2} c={C.green} glow={0.7} />}
        </group>
      )}
      readouts={[
        ["Pattern", pattern],
        ["URL", url],
        ["Match?", m.ok ? "Yes" : "No"],
        ["Path parameters", m.ok ? (Object.keys(m.params).length ? Object.entries(m.params).map(([k, v]) => `${k} = ${v}`).join(", ") : "none") : "none"],
        ["Why", m.why],
        ["?page= → offset, showing", `${g.offset}, ${g.shown} items of ${Math.round(P.total)} (page ${g.page}/${g.pages})`],
      ]}
      controls={<>
        <Slider label="Query parameter page" value={P.page} min={1} max={50} step={1} digits={0} onChange={(x) => set("page", Math.round(x))} />
        <Slider label="Query parameter pageSize" value={P.size} min={5} max={50} step={5} digits={0} onChange={(x) => set("size", Math.round(x))} />
        <Slider label="Total items on the server" value={P.total} min={0} max={500} step={5} digits={0} onChange={(x) => set("total", Math.round(x))} />
        <Pick label="Route pattern" value={P.pattern} options={(Object.keys(PATTERNS) as (keyof typeof PATTERNS)[]).map((k) => ({ id: k, label: PATTERNS[k] }))} onChange={(v) => set("pattern", v)} />
        <Pick label="URL in the address bar" value={P.url} options={(Object.keys(URLS) as (keyof typeof URLS)[]).map((k) => ({ id: k, label: URLS[k] }))} onChange={(v) => set("url", v)} />
      </>}
      note={<p>A client-side router compares the URL path with each route pattern segment by segment, without asking the server. Purple pattern segments are variables (:id) or a splat (*); they match anything and capture it as a parameter. Literal segments must match exactly, and the number of segments must agree (a trailing slash is ignored). Query parameters after the ? do not take part in matching; here page and pageSize decide the API request&apos;s offset = (page − 1) × pageSize. The page strip shows at most 20 pages, current page in gold.</p>}
    />
  );
}
