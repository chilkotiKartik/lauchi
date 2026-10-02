"use client";
import { CHARSETS, passwordCrack, type Charset, type Scheme } from "../sim/weba";
import { Box, C, Floor, Panel, Poly, human } from "../kit";
import { Check, LabFrame, Pick, Slider } from "../ui";
import { useLabParams } from "../params";
import { WEBA_SPECS } from "../meta/weba.specs";

const sci = (x: number) => (x < 1e6 ? Math.round(x).toLocaleString("en-US") : x.toExponential(2).replace("e+", " × 10^"));
const LO = -8, HI = 30, H = 3.2;
const y = (s: number) => -1.5 + (Math.min(HI, Math.max(LO, Math.log10(Math.max(s, 1e-12)))) - LO) / (HI - LO) * H;
const MARKS: [number, string][] = [[1, C.blue], [86400, C.gold], [31557600, C.orange], [4.35e17, C.purple]];

export default function PasswordCrackLab() {
  const [P, set, reset] = useLabParams(WEBA_SPECS.passwordcrack);
  const len = Math.round(P.len), cs = P.cs as Charset, scheme = P.scheme as Scheme, cost = Math.round(P.cost);
  const o = passwordCrack(len, cs, scheme, cost, P.salt);
  const h = Math.max(0.03, y(o.avgSeconds) + 1.5);
  const col = o.avgSeconds < 86400 ? C.red : o.avgSeconds < 3.16e7 ? C.orange : C.green;
  return (
    <LabFrame
      label="A tall column whose height is the average time to crack a password on a log scale, coloured red, orange or green, with horizontal marks for one second, one day, one year and the age of the universe"
      camera={[0, 0.7, 6.6]}
      animated={false}
      onReset={reset}
      scene={() => (
        <group>
          <Floor size={12} y={-1.5} divisions={12} />
          <Panel p={[0, 0.1, -0.8]} w={7.4} h={3.9} />
          <Box p={[-1.6, -1.5 + h / 2, 0]} s={[1.2, h, 1.2]} c={col} glow={0.35} />
          {MARKS.map(([s, c]) => <Poly key={s} pts={[[-3.4, y(s), 0.7], [3.3, y(s), 0.7]]} c={c} w={2} />)}
          <Box p={[1.6, -1.5 + Math.max(0.03, y(o.space / 1e12 + 1e-8) + 1.5 - 0.0) / 2, 0]} s={[1.2, Math.max(0.03, y(o.space / 1e12 + 1e-8) + 1.5), 1.2]} c={C.blue} glow={0.25} />
        </group>
      )}
      readouts={[
        ["Possible passwords", sci(o.space)],
        ["Guesses per second (one GPU)", sci(o.rate)],
        ["Average time to crack", human(o.avgSeconds)],
        ["Worst case", human(o.worstSeconds)],
        ["Same password, same hash?", o.sameHash ? "Yes: one crack breaks every user with it" : "No: salted, each must be cracked separately"],
      ]}
      controls={<>
        <Slider label="Password length" value={len} min={1} max={20} step={1} digits={0} unit=" chars" onChange={(x) => set("len", Math.round(x))} />
        <Pick label="Characters used" value={cs} options={(Object.keys(CHARSETS) as Charset[]).map((k) => ({ id: k, label: { digits: "Digits only (10)", lower: "Lowercase letters (26)", alnum: "Letters and digits (62)", full: "All printable symbols (95)" }[k] }))} onChange={(v) => set("cs", v)} />
        <Pick label="Hash used to store it" value={scheme} options={[{ id: "md5", label: "MD5 (fast, obsolete)" }, { id: "sha256", label: "SHA-256 (fast)" }, { id: "bcrypt", label: "bcrypt (deliberately slow)" }]} onChange={(v) => set("scheme", v)} />
        <Slider label="bcrypt cost factor" value={cost} min={4} max={14} step={1} digits={0} onChange={(x) => set("cost", Math.round(x))} />
        <Check label="A unique salt per user (bcrypt always has one)" checked={P.salt} onChange={(v) => set("salt", v)} />
      </>}
      note={<p>The tall column is the average time for one high-end GPU to guess the password by brute force, on a log scale: the coloured marks show 1 second, 1 day, 1 year and the age of the universe (about 4.35 × 10¹⁷ s). Red means under a day, orange under a year, green longer. The short blue column is the number of possible passwords (÷ 10¹²). Fast hashes let attackers try billions per second; bcrypt is slow on purpose (each cost step doubles the work) and always salted, so identical passwords hash differently. Guess rates are rough assumptions for one GPU (MD5 1.6 × 10¹¹/s, SHA-256 2.2 × 10¹⁰/s, bcrypt cost 5 about 1.8 × 10⁵/s). Real people pick guessable passwords, so this is best case for the user.</p>}
    />
  );
}
