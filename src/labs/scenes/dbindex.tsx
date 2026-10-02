"use client";
import { dbIndex } from "../sim/weba";
import { Bars, Box, C, Floor, Panel, Shuttle } from "../kit";
import { Check, LabFrame, Slider } from "../ui";
import { useLabParams } from "../params";
import { WEBA_SPECS } from "../meta/weba.specs";

const LV = [C.gold, C.blue, C.green, C.purple, C.orange];
const big = (x: number) => (x >= 1e6 ? x.toExponential(2).replace("e+", " × 10^") : Math.round(x).toLocaleString("en-US"));

export default function DbIndexLab() {
  const [P, set, reset] = useLabParams(WEBA_SPECS.dbindex);
  const o = dbIndex(P.exp, P.fanout);
  const lg = (x: number) => Math.max(0.05, Math.log10(x + 1) / 8);
  const levels = Math.min(o.levels, 5);
  return (
    <LabFrame
      label="A stack of wider and wider slabs for the levels of a B-tree index with a gold packet running down it, next to two columns comparing rows read by an index and by a full table scan on a log scale"
      camera={[0, 0.6, 7]}
      animated
      onReset={reset}
      scene={() => (
        <group>
          <Floor size={12} y={-1.5} divisions={12} />
          <Panel p={[-1.8, 0.2, -0.7]} w={3.8} h={4} />
          {Array.from({ length: levels }, (_, i) => (
            <Box key={i} p={[-1.8, 1.4 - i * 0.62, 0]} s={[0.5 + i * 0.75, 0.42, 0.8]} c={LV[i]} glow={0.25} />
          ))}
          <Box p={[-1.8, 1.4 - levels * 0.62, 0]} s={[3.2, 0.3, 0.8]} c={C.grey} />
          <Shuttle from={[-1.8, 1.9, 0.5]} to={[-1.8, 1.4 - levels * 0.62, 0.5]} speed={0.35} r={0.1} />
          <Panel p={[2.5, 0.2, -0.7]} w={3.4} h={4} />
          <Bars values={[lg(o.indexReads), lg(o.scanAvg)]} max={1} colors={[C.green, C.red]} x0={1.6} y0={-1.5} w={0.7} gap={0.4} height={3.2} glow={0.3} />
        </group>
      )}
      readouts={[
        ["Rows in the table", big(o.rows)],
        ["Full scan, average rows read", big(o.scanAvg)],
        ["B-tree levels", String(o.levels)],
        ["Index page reads (incl. the row)", String(o.indexReads)],
        ["Index is faster by", `${big(o.speedup)}×`],
        ["This query reads", P.index ? `${o.indexReads} pages (index)` : `${big(o.scanAvg)} rows (scan)`],
      ]}
      controls={<>
        <Slider label="Table size, rows = 10^x" value={P.exp} min={2} max={8} step={0.5} digits={1} onChange={(x) => set("exp", x)} />
        <Slider label="Index fan-out (keys per node)" value={P.fanout} min={50} max={500} step={10} digits={0} onChange={(x) => set("fanout", x)} />
        <Check label="The query can use the index" checked={P.index} onChange={(v) => set("index", v)} />
      </>}
      note={<p>Without an index the database scans the table: to find one row it reads about half the rows on average (all of them in the worst case). A B-tree index, like the one Postgres builds for a primary key, sends the search down one node per level. With fan-out f a tree of N rows has about log_f N levels, so a million rows need 3 levels at f = 100 and a hundred million need only 4. The columns compare the two costs on a log scale; the gold packet runs down the levels. Real costs also depend on caching, row width and selectivity; this counts only rows and pages.</p>}
    />
  );
}
