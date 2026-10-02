"use client";
import { useMemo } from "react";
import { pluralSummary, type Cat, type Lang } from "../sim/webb";
import { C, Instances, Panel, type Inst } from "../kit";
import { LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { WEBB_SPECS } from "../meta/webb.specs";

const COL: Record<Cat, string> = { zero: C.grey, one: C.green, two: C.blue, few: C.gold, many: C.orange, other: C.purple };
const NAMES: Record<Lang, string> = { en: "English", fr: "French", ru: "Russian", pl: "Polish", ar: "Arabic", ja: "Japanese" };

export default function PluralLab() {
  const [P, set, reset] = useLabParams(WEBB_SPECS.plural);
  const lang = P.lang as Lang, n = Math.round(P.n), s = pluralSummary(lang, n);
  const items = useMemo<Inst[]>(() => pluralSummary(P.lang as Lang, Math.round(P.n)).cats.map((c, i) => {
    const cur = i === Math.round(P.n), h = cur ? 1.6 : 0.5, row = Math.floor(i / 26), col = i % 26;
    return { p: [-3.25 + col * 0.26, h / 2 - 0.9 - row * 1.5 + 1.1, 0], s: [0.2, h, 0.3], c: COL[c] };
  }), [P.lang, P.n]);
  return (
    <LabFrame
      label="A skyline of 101 thin blocks for the numbers 0 to 100 in four rows, coloured by plural category, with the chosen number as a taller block"
      camera={[0, 0.4, 6.4]}
      animated={false}
      onReset={reset}
      scene={() => (<group><Panel p={[0, 0.4, -0.5]} w={7.6} h={4.4} /><Instances items={items} cap={101} /></group>)}
      readouts={[
        ["Number tested", String(n)],
        [`Category in ${NAMES[lang]}`, s.cat],
        ["Forms needed for 0–100", `${s.used.length}: ${s.used.join(", ")}`],
        ["Numbers 0–100 in this category", String(s.inCat)],
        ["Next number in a different category", s.next < 0 ? "none up to 100" : String(s.next)],
      ]}
      controls={<>
        <Slider label="Number n" value={n} min={0} max={100} step={1} digits={0} onChange={(x) => set("n", Math.round(x))} />
        <Pick label="Language" value={lang} options={(Object.keys(NAMES) as Lang[]).map((k) => ({ id: k, label: NAMES[k] }))} onChange={(v) => set("lang", v)} />
      </>}
      note={<p>Internationalisation means writing the app so text can change per language; localisation is supplying that text. Plurals are a classic trap: &quot;1 file, 2 files&quot; is an English rule. The Unicode CLDR defines up to six categories (zero, one, two, few, many, other), and each language picks its own rule: English has two, Russian three (one, few, many), Arabic all six, Japanese only one. Each block is one number from 0 to 100, coloured by its category; the tall block is your number. Green is one, blue two, gold few, orange many, purple other, grey zero. Rules here are for whole numbers only; decimals use other rules, and browsers expose these through Intl.PluralRules.</p>}
    />
  );
}
