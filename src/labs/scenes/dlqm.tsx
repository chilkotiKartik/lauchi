"use client";
import { QM_SETS, qm, type Imp } from "../sim/bcax";
import { Instances, type Inst } from "../kit";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { BCAX_SPECS } from "../meta/bcax.specs";
import { Bench, C, Glass, Led, Txt } from "./bcax-kit";

export default function DlQmLab() {
  const [P, set, reset] = useLabParams(BCAX_SPECS.dlqm);
  const { fn, stage } = P;
  const sel = QM_SETS[fn], nv = sel.nv;
  const r = qm([...sel.m], nv);
  const nc = r.cols.length, st = Math.min(stage, nc + 2);
  const items: Inst[] = [];
  const cs = 0.2, rowH = 0.27, per = 13;
  const place = (c: number, list: Imp[]) => {
    list.forEach((imp, i) => {
      const sub = Math.floor(i / per), row = i % per;
      const x0 = -5.6 + c * 2.6 + sub * 1.55, y = 4.4 - row * rowH;
      const isPrime = r.primes.includes(imp), isEss = r.essential.includes(imp.bits) && isPrime, inCover = r.cover.some((q) => q.bits === imp.bits);
      const backC = st >= nc && isPrime ? (st >= nc + 1 && inCover ? (isEss ? C.orange : C.purple) : C.green) : imp.used && st > c + 1 ? "#2c3b44" : "#26353d";
      items.push({ p: [x0 + (nv * (cs + 0.04)) / 2 - 0.1, y, -0.12], s: [nv * (cs + 0.04) + 0.1, rowH - 0.04, 0.05], c: backC });
      imp.bits.split("").forEach((b, k) => items.push({ p: [x0 + k * (cs + 0.04), y, 0], s: [b === "-" ? cs * 0.55 : cs, b === "-" ? cs * 0.35 : cs, cs], c: b === "1" ? C.blue : b === "0" ? "#475a64" : C.gold }));
    });
  };
  r.cols.forEach((col, c) => { if (c <= st) place(c, col); });
  return (
    <LabFrame
      label="A wall of glowing bit rows: the minterms in column one, then each pass of the Quine-McCluskey table merges rows that differ in one bit into a dash; prime implicants light green and the chosen cover turns orange"
      camera={[0, 2.6, 11]}
      onReset={reset}
      scene={() => (<group position={[0, -0.9, 0]}>
        <Bench w={15} d={4} />
        <Instances items={items} cap={900} />
        {r.cols.map((_, c) => c <= st && <Glass key={c} p={[-5.6 + c * 2.6 + 0.55 + (c === 0 && r.cols[0].length > 13 ? 0.8 : 0), 2.9, -0.05]} s={[1.6 + (r.cols[c].length > 13 ? 1.6 : 0), 3.6, 0.5]} c={C.blue} on={c === st} o={0.05} />)}
        {st >= nc + 1 && <Txt p={[0, 0.3, 0.6]} s={r.sop.length > 22 ? r.sop.slice(0, 22) : r.sop} h={0.38} c={C.gold} />}
        <Led p={[6.8, 4.6, 0]} c={st >= nc + 1 ? C.green : C.gold} />
      </group>)}
      readouts={[
        ["Stage shown", `${st} of ${nc + 2}`], ["Minterms", String(sel.m.length)], ["Prime implicants", String(r.primes.length)],
        ["Essential primes", String(r.essential.length)], ["Minimal SOP", r.sop],
      ]}
      controls={<>
        <Slider label="Stage of the table" value={stage} min={0} max={6} step={1} digits={0} onChange={(x) => set("stage", Math.round(x))} />
        <Pick label="Function" value={fn} options={(Object.keys(QM_SETS) as (keyof typeof QM_SETS)[]).map((id) => ({ id, label: QM_SETS[id].name }))} onChange={(x) => set("fn", x)} />
      </>}
      note={<p>Column 1 lists the minterms as bit rows (blue 1, dark 0). Each pass merges two rows that differ in exactly one bit, replacing that bit by a gold dash; rows that were merged are greyed out. A row that never merges is a <b>prime implicant</b> (green). Prime implicants that are the only cover of some minterm are <b>essential</b> (orange); extra primes needed to cover the rest are purple. PYQ Q3.4: f = Σm(0,1,5,7,10,14) gives A&apos;B&apos;C&apos; + A&apos;BD + ACD&apos;. Move the stage slider from 0 to the end to build the answer step by step.</p>}
    />
  );
}
