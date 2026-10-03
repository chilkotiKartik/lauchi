"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Field } from "@/components/admin/Field";
import { QuestionView } from "@/components/bank/QuestionView";
import { Rich } from "@/lib/rich";
import { describeAnswer, errorsOf, KIND_LABEL, KINDS, questionSchema, TF_OPTIONS, DIFFICULTY_LABEL, type Given, type Kind } from "@/lib/cms-questions-core";
import { saveQuestion, setQuestionStatus } from "./actions";

export type CourseOpt = { code: string; short: string; units: { n: number; title: string }[] };
export type FormInitial = {
  course: string; unit: number; kind: Kind; stem: string; options: string[]; answer: number | number[] | { value: number; tol: number };
  explanation: string; steps: string[]; difficulty: number; tags: string[];
};
const BLANK = (course: string): FormInitial => ({ course, unit: 1, kind: "mcq", stem: "", options: ["", ""], answer: 0, explanation: "", steps: [], difficulty: 2, tags: [] });

export function StatusBadge({ status }: { status: string }) {
  return status === "published" ? <span className="chip chip-th">Published</span> : <span className="chip chip-warm">Draft</span>;
}

export function QuestionForm({ courses, id, initial, status, preset }: { courses: CourseOpt[]; id?: string; initial?: FormInitial; status?: string; preset?: { course: string; unit: number } }) {
  const router = useRouter();
  const presetOk = preset && courses.some((c) => c.code === preset.course && c.units.some((u) => u.n === preset.unit));
  const start = initial ?? (presetOk ? { ...BLANK(preset.course), unit: preset.unit } : BLANK(courses[0]?.code ?? ""));
  const [course, setCourse] = useState(start.course);
  const [unit, setUnit] = useState(start.unit);
  const [kind, setKind] = useState<Kind>(start.kind);
  const [stem, setStem] = useState(start.stem);
  const [options, setOptions] = useState<string[]>(start.options);
  const [single, setSingle] = useState<number>(typeof start.answer === "number" ? start.answer : 0);
  const [multi, setMulti] = useState<number[]>(Array.isArray(start.answer) ? start.answer : []);
  const [num, setNum] = useState(typeof start.answer === "object" && !Array.isArray(start.answer) ? String(start.answer.value) : "");
  const [tol, setTol] = useState(typeof start.answer === "object" && !Array.isArray(start.answer) ? String(start.answer.tol) : "0");
  const [explanation, setExplanation] = useState(start.explanation);
  const [steps, setSteps] = useState(start.steps.join("\n"));
  const [difficulty, setDifficulty] = useState(start.difficulty);
  const [tags, setTags] = useState(start.tags.join(", "));
  const [tried, setTried] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [curStatus, setCurStatus] = useState(status ?? "draft");
  const [pending, run] = useTransition();
  const [picked, setPicked] = useState<Given | null>(null);

  const units = courses.find((c) => c.code === course)?.units ?? [];
  const opts = kind === "tf" ? [...TF_OPTIONS] : kind === "numeric" ? [] : options;

  const draft = (() => {
    const n = Number(num.trim().replace(",", ".")), t = tol.trim() === "" ? 0 : Number(tol.trim().replace(",", "."));
    const answer = kind === "numeric" ? (num.trim() === "" || Number.isNaN(n) ? undefined : { value: n, tol: Number.isNaN(t) ? -1 : t }) : kind === "multi" ? multi : single;
    return {
      course, unit, kind, stem, options: opts.map((o) => o.trim()), answer, explanation, difficulty,
      steps: steps.split("\n").map((s) => s.trim()).filter(Boolean), tags: tags.split(",").map((s) => s.trim()).filter(Boolean),
    };
  })();
  const parsed = questionSchema.safeParse(draft);
  const errors = tried ? { ...(parsed.success ? {} : errorsOf(parsed.error)), ...serverErrors } : serverErrors;

  function changeKind(k: Kind) {
    setKind(k); setPicked(null); setServerErrors({});
    if (k === "tf") { setSingle(0); } else if (k === "mcq") { setSingle(0); if (options.length < 2) setOptions(["", ""]); } else if (k === "multi") { setMulti([]); if (options.length < 2) setOptions(["", ""]); }
  }
  function removeOption(i: number) {
    setOptions(options.filter((_, k) => k !== i));
    setSingle((s) => (s === i ? 0 : s > i ? s - 1 : s));
    setMulti((m) => m.filter((x) => x !== i).map((x) => (x > i ? x - 1 : x)));
  }
  function save() {
    setTried(true); setMsg(null);
    if (!parsed.success) { setServerErrors({}); setMsg({ ok: false, text: "Please fix the highlighted fields." }); return; }
    run(async () => {
      const r = await saveQuestion(parsed.data, id);
      if (!r.ok) { setServerErrors(r.errors ?? {}); setMsg({ ok: false, text: r.message }); return; }
      setServerErrors({});
      if (!id) { router.replace(`/admin/questions/${r.id}?created=1`); return; }
      setMsg({ ok: true, text: r.message }); router.refresh();
    });
  }
  function toggleStatus() {
    if (!id) return;
    const next = curStatus === "published" ? "draft" : "published";
    run(async () => {
      const r = await setQuestionStatus([id], next);
      setMsg({ ok: r.ok, text: r.message });
      if (r.ok) { setCurStatus(next); router.refresh(); }
    });
  }

  const e = errors;
  const right = parsed.success ? describeAnswer(kind, opts, parsed.data.answer) : "";
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <form noValidate className="card flex flex-col gap-4" onSubmit={(ev) => { ev.preventDefault(); save(); }} aria-label="Question editor">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Field id="q-course" label="Subject" error={e.course}>
            {(a) => <select {...a} className="field" value={course} onChange={(x) => { setCourse(x.target.value); setUnit(courses.find((c) => c.code === x.target.value)?.units[0]?.n ?? 1); }}>
              {courses.map((c) => <option key={c.code} value={c.code}>{c.short} ({c.code})</option>)}</select>}
          </Field>
          <Field id="q-unit" label="Unit" error={e.unit}>
            {(a) => <select {...a} className="field" value={unit} onChange={(x) => setUnit(Number(x.target.value))}>
              {units.map((u) => <option key={u.n} value={u.n}>Unit {u.n}: {u.title}</option>)}</select>}
          </Field>
          <Field id="q-kind" label="Question type" error={e.kind}>
            {(a) => <select {...a} className="field" value={kind} onChange={(x) => changeKind(x.target.value as Kind)}>
              {KINDS.map((k) => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}</select>}
          </Field>
        </div>
        <Field id="q-stem" label="Question" hint="You can use <sub>, <sup>, <b> and <i>." error={e.stem}>
          {(a) => <textarea {...a} className="field" maxLength={2000} value={stem} onChange={(x) => setStem(x.target.value)} />}
        </Field>

        {(kind === "mcq" || kind === "multi" || kind === "tf") && (
          <fieldset className="flex flex-col gap-2">
            <legend className="adm-label"><span>Options</span><span className="hint">{kind === "multi" ? "Tick every correct option." : "Choose the one correct option."}</span></legend>
            {opts.map((o, i) => {
              const L = String.fromCharCode(65 + i);
              return (
                <div key={i} className="flex items-center gap-2">
                  <input type={kind === "multi" ? "checkbox" : "radio"} name="correct" className="h-5 w-5 shrink-0" aria-label={`Option ${L} is correct`}
                    checked={kind === "multi" ? multi.includes(i) : single === i}
                    onChange={() => kind === "multi" ? setMulti(multi.includes(i) ? multi.filter((x) => x !== i) : [...multi, i].sort((p, q) => p - q)) : setSingle(i)} />
                  {kind === "tf" ? <span className="font-extrabold text-head">{o}</span> : (
                    <input className="field min-w-0 flex-1" aria-label={`Option ${L}`} maxLength={300} value={o} onChange={(x) => setOptions(options.map((v, k) => (k === i ? x.target.value : v)))} />
                  )}
                  {kind !== "tf" && options.length > 2 && <button type="button" className="btn btn-ghost" aria-label={`Remove option ${L}`} onClick={() => removeOption(i)}>Remove</button>}
                </div>
              );
            })}
            {kind !== "tf" && options.length < 6 && <button type="button" className="btn btn-ghost w-fit" onClick={() => setOptions([...options, ""])}>Add option</button>}
            {e.options && <span className="adm-fielderr">{e.options}</span>}
          </fieldset>
        )}
        {kind === "numeric" && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field id="q-num" label="Correct number" error={e.answer}>{(a) => <input {...a} className="field" inputMode="decimal" autoComplete="off" value={num} onChange={(x) => setNum(x.target.value)} />}</Field>
            <Field id="q-tol" label="Tolerance (±)" hint="How far off an answer can be and still count." error={undefined}>{(a) => <input {...a} className="field" inputMode="decimal" autoComplete="off" value={tol} onChange={(x) => setTol(x.target.value)} />}</Field>
          </div>
        )}
        {kind !== "numeric" && e.answer && <span className="adm-fielderr">{e.answer}</span>}

        <Field id="q-expl" label="Explanation" hint="Shown to the student after they answer." error={e.explanation}>
          {(a) => <textarea {...a} className="field" maxLength={3000} value={explanation} onChange={(x) => setExplanation(x.target.value)} />}
        </Field>
        <Field id="q-steps" label="Steps (one per line)" hint="Optional worked solution." error={e.steps}>
          {(a) => <textarea {...a} className="field" value={steps} onChange={(x) => setSteps(x.target.value)} />}
        </Field>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field id="q-diff" label="Difficulty" error={e.difficulty}>
            {(a) => <select {...a} className="field" value={difficulty} onChange={(x) => setDifficulty(Number(x.target.value))}>{[1, 2, 3].map((d) => <option key={d} value={d}>{DIFFICULTY_LABEL[d]}</option>)}</select>}
          </Field>
          <Field id="q-tags" label="Tags (comma separated)" error={e.tags}>
            {(a) => <input {...a} className="field" value={tags} onChange={(x) => setTags(x.target.value)} />}
          </Field>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="submit" className="btn" disabled={pending}>{pending ? "Saving…" : "Save question"}</button>
          {id && <button type="button" className={curStatus === "published" ? "btn btn-ghost" : "btn btn-blue"} disabled={pending} onClick={toggleStatus}>{curStatus === "published" ? "Unpublish" : "Publish"}</button>}
          <Link href="/admin/questions" className="btn btn-ghost">Back to the list</Link>
          {id && <StatusBadge status={curStatus} />}
        </div>
        <div aria-live="polite">{msg && <p className={msg.ok ? "ok" : "err"} role={msg.ok ? "status" : "alert"}>{msg.text}</p>}</div>
      </form>

      <section className="card flex h-fit flex-col gap-3 lg:sticky lg:top-4" aria-labelledby="q-prev-h">
        <h2 id="q-prev-h" className="text-xl">Live preview</h2>
        <QuestionView q={{ kind, stem, options: opts, difficulty }} value={picked} onChange={setPicked} groupLabel="Preview answer" />
        <div className="ok flex flex-col gap-1">
          <p>Correct answer: <b>{right || "not set yet"}</b></p>
          {explanation && <p className="whitespace-pre-wrap"><Rich text={explanation} /></p>}
          {draft.steps.length > 0 && <ol className="list-decimal pl-5">{draft.steps.map((s, i) => <li key={i}><Rich text={s} /></li>)}</ol>}
        </div>
      </section>
    </div>
  );
}
