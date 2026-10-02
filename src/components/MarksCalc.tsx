"use client";
import { useMemo } from "react";
import { Lochi, type LochiMood } from "@/components/Lochi";
import { useLocalJson } from "@/lib/local-store";
import { GRADES, needed, predict, sgpa } from "@/lib/marks";

export type MarkSubject = { code: string; name: string; short: string; credits: number; ct: number; ta: number; ese: number };
type Saved = { picked: string[]; target: string; vals: Record<string, { ct?: string; ta?: string; es?: string }> };
const EMPTY: Saved = { picked: [], target: "A", vals: {} };
const num = (s: string | undefined) => (s === undefined || s.trim() === "" || Number.isNaN(Number(s)) ? null : Number(s));

export function MarksCalc({ subjects }: { subjects: MarkSubject[] }) {
  const [saved, save] = useLocalJson<Saved>("lockin.marks.v1", EMPTY);
  const picked = subjects.filter((s) => saved.picked.includes(s.code));
  const target = GRADES.find((g) => g[0] === saved.target) ?? GRADES[2];

  const toggle = (code: string) => save({ ...saved, picked: saved.picked.includes(code) ? saved.picked.filter((c) => c !== code) : [...saved.picked, code] });
  const setVal = (code: string, k: "ct" | "ta" | "es", v: string) => save({ ...saved, vals: { ...saved.vals, [code]: { ...saved.vals[code], [k]: v } } });

  const rows = useMemo(() => picked.map((s) => {
    const v = saved.vals[s.code] ?? {}, ct = num(v.ct), ta = num(v.ta), es = num(v.es);
    const has = ct !== null || ta !== null;
    const need = has ? needed(s, ct ?? 0, ta ?? 0, target[2]) : null;
    const pred = has && es !== null ? predict(s, ct ?? 0, ta ?? 0, es) : null;
    return { s, v, need, pred };
  }), [picked, saved.vals, target]);

  const counted = rows.filter((r) => r.pred && r.s.credits > 0);
  const gpa = sgpa(counted.map((r) => ({ points: r.pred!.points, credits: r.s.credits })));
  const complete = rows.length > 0 && rows.every((r) => r.pred || r.s.credits === 0);
  const mood: LochiMood = gpa === null ? "thinking" : gpa >= 8 ? "celebrate" : gpa >= 6 ? "happy" : "thinking";

  return (
    <div className="flex flex-col gap-5">
      <div className="card flex flex-col gap-3">
        <h2 className="text-xl">1. Pick your subjects</h2>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Subjects">
          {subjects.map((s) => (
            <button key={s.code} type="button" aria-pressed={saved.picked.includes(s.code)} onClick={() => toggle(s.code)}
              className={`pill !px-4 !py-2 ${saved.picked.includes(s.code) ? "!border-blue !bg-blue-l !text-blue-t" : ""}`}>{s.short}</button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-extrabold uppercase tracking-wide text-muted">Target grade</span>
          {GRADES.slice(0, 7).map((g) => (
            <button key={g[0]} type="button" aria-pressed={saved.target === g[0]} onClick={() => save({ ...saved, target: g[0] })}
              className={`pill !px-3 ${saved.target === g[0] ? "!border-green !bg-green-l !text-green-t" : ""}`}>{g[0]}</button>
          ))}
        </div>
      </div>

      {rows.length === 0 && <p className="card text-muted">Choose at least one subject above. Your numbers stay on this device only.</p>}

      {rows.map(({ s, v, need, pred }) => {
        const id = s.code.replace("-", "");
        return (
          <section key={s.code} className="card flex flex-col gap-3" aria-labelledby={`t-${id}`}>
            <div><span className="text-xs font-black tracking-wide text-muted">{s.code} · {s.credits > 0 ? `${s.credits} credits` : "non-credit"}</span><h3 id={`t-${id}`} className="text-lg">{s.name}</h3></div>
            <div className="grid grid-cols-3 gap-3">
              {([["ct", `CT /${s.ct}`, s.ct], ["ta", `TA /${s.ta}`, s.ta], ["es", `Expected end-sem /${s.ese}`, s.ese]] as const).map(([k, label, max]) => (
                <div key={k} className="flex flex-col gap-1">
                  <label htmlFor={`m-${id}-${k}`} className="text-xs font-extrabold uppercase tracking-wide text-muted">{label}</label>
                  <input id={`m-${id}-${k}`} className="field" type="number" inputMode="decimal" min={0} max={max} step="any" placeholder="–" value={v[k] ?? ""} onChange={(e) => setVal(s.code, k, e.target.value)} />
                </div>
              ))}
            </div>
            {need ? (
              <div className="flex flex-wrap gap-2 text-sm font-black" role="status">
                <span className="rounded-full bg-soft px-3 py-1 text-head">Sessional {need.sessional}/{s.ct + s.ta}</span>
                <span className="rounded-full bg-blue-l px-3 py-1 text-blue-t">To pass: {need.pass === null ? "not reachable" : `${need.pass}/${s.ese}`}</span>
                <span className="rounded-full bg-purple-l px-3 py-1 text-purple-t">For {target[0]}: {need.target === null ? "not reachable" : `${need.target}/${s.ese}`}</span>
                {pred && <span className={`rounded-full px-3 py-1 ${pred.passed ? "bg-green-l text-green-t" : "bg-red-l text-red-t"}`}>{Math.round(pred.total)}/{s.ct + s.ta + s.ese} → {pred.grade}</span>}
              </div>
            ) : <p className="text-sm text-muted">Enter your CT and TA marks to see what you need in the end sem.</p>}
          </section>
        );
      })}

      {rows.length > 0 && (
        <section className="card flex items-center justify-between gap-4" aria-labelledby="sg">
          <div>
            <h2 id="sg" className="text-sm font-extrabold uppercase tracking-wide text-muted">Estimated SGPA</h2>
            <p className="text-5xl font-black tabular-nums text-head" role="status">{gpa === null ? "–" : gpa.toFixed(2)}</p>
            <p className="mt-1 max-w-md text-sm text-muted">Counts theory subjects with credits. Labs, projects and non-credit courses are left out, so your real SGPA will differ.{!complete && " Fill in the expected end-sem marks for every subject for a full estimate."}</p>
          </div>
          <div className="hidden shrink-0 sm:block"><Lochi mood={mood} size={96} /></div>
        </section>
      )}
    </div>
  );
}
