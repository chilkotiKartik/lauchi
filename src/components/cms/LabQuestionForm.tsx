"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Rich } from "@/lib/rich";
import { deleteLabQuestion, saveLabQuestion, setLabQuestionStatus, type LabQResult } from "@/app/admin/lab-content/actions";

export type LabQInitial = {
  id: string | null; labId: string; status: "draft" | "published" | null; type: "mcq" | "tf" | "numeric";
  prompt: string; scenario: string; marks: number; hint: string; formulas: string[]; solution: string[]; explanation: string; commonMistake: string;
  options: string[]; answerIdx: number; tf: boolean; num: string; tolerance: string; unit: string;
};
export const blankLabQ = (labId: string): LabQInitial => ({ id: null, labId, status: null, type: "mcq", prompt: "", scenario: "", marks: 1, hint: "", formulas: [], solution: [""], explanation: "", commonMistake: "", options: ["", "", "", ""], answerIdx: 0, tf: true, num: "", tolerance: "0", unit: "" });

function F({ id, label, hint, error, children }: { id: string; label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return <div className="adm-label"><label htmlFor={id}>{label}</label>{hint && <span className="hint">{hint}</span>}{children}{error && <span className="adm-fielderr">{error}</span>}</div>;
}

export function LabQuestionForm({ initial, labs }: { initial: LabQInitial; labs: { id: string; title: string }[] }) {
  const router = useRouter();
  const [f, setF] = useState(initial);
  const [id, setId] = useState(initial.id);
  const [status, setStatus] = useState(initial.status);
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [ok, setOk] = useState<string | null>(null);
  const [sure, setSure] = useState(false);
  const [pending, start] = useTransition();
  const set = <K extends keyof LabQInitial>(k: K, v: LabQInitial[K]) => setF((p) => ({ ...p, [k]: v }));
  const lines = (s: string) => s.split("\n");

  const payload = () => ({
    type: f.type, prompt: f.prompt, scenario: f.scenario, marks: f.marks, hint: f.hint, formulas: f.formulas, solution: f.solution, explanation: f.explanation, commonMistake: f.commonMistake,
    ...(f.type === "mcq" ? { options: f.options, answer: f.answerIdx } : f.type === "tf" ? { answer: f.tf } : { answer: f.num === "" ? NaN : Number(f.num), tolerance: f.tolerance === "" ? NaN : Number(f.tolerance), unit: f.unit }),
  });
  const done = (r: LabQResult, refresh = true) => {
    if (!r.ok) { setErrs(r.errors); setOk(null); return; }
    setErrs({}); setOk(r.message); setStatus(r.status); setId(r.id);
    if (refresh) router.replace("/admin/lab-content?lab=" + encodeURIComponent(f.labId));
    router.refresh();
  };
  const save = (publish: boolean) => start(async () => {
    const pl = payload();
    // NaN does not survive the server-action boundary; send null so the server reports "Answer must be a number".
    const safe = JSON.parse(JSON.stringify(pl, (_k, v) => (typeof v === "number" && !Number.isFinite(v) ? null : v)));
    done(await saveLabQuestion({ id: id ?? undefined, labId: f.labId, payload: safe, publish }), !id);
  });

  const preview = f.type === "mcq" ? f.options.map((o) => o.trim()).filter(Boolean) : [];
  return (
    <form noValidate className="flex flex-col gap-4" aria-label="Lab question" onSubmit={(e) => { e.preventDefault(); save(false); }}>
      <div className="grid gap-3 sm:grid-cols-2">
        <F id="lq-lab" label="Lab" error={errs.labId}>
          <select id="lq-lab" className="field" value={f.labId} onChange={(e) => set("labId", e.target.value)}>{labs.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}</select>
        </F>
        <F id="lq-type" label="Question type">
          <select id="lq-type" className="field" value={f.type} onChange={(e) => set("type", e.target.value as LabQInitial["type"])}>
            <option value="mcq">Multiple choice</option><option value="tf">True or false</option><option value="numeric">Numeric answer</option>
          </select>
        </F>
      </div>
      <F id="lq-prompt" label="Question" error={errs.prompt}><textarea id="lq-prompt" className="field" rows={3} value={f.prompt} onChange={(e) => set("prompt", e.target.value)} aria-invalid={errs.prompt ? true : undefined} /></F>
      <F id="lq-scenario" label="Scenario (optional)" hint="Shown above the question." error={errs.scenario}><textarea id="lq-scenario" className="field" rows={2} value={f.scenario} onChange={(e) => set("scenario", e.target.value)} /></F>
      {f.type === "mcq" && (
        <div className="grid gap-3 sm:grid-cols-[1fr_9rem]">
          <F id="lq-options" label="Options" hint="One option per line, 2 to 6, all different." error={errs.options}><textarea id="lq-options" className="field" rows={4} value={f.options.join("\n")} onChange={(e) => set("options", lines(e.target.value))} aria-invalid={errs.options ? true : undefined} /></F>
          <F id="lq-answer" label="Correct option number" error={errs.answer}><input id="lq-answer" type="number" min={1} max={6} className="field" value={f.answerIdx + 1} onChange={(e) => set("answerIdx", Math.max(0, Math.floor(Number(e.target.value) || 1) - 1))} /></F>
        </div>
      )}
      {f.type === "tf" && (
        <F id="lq-tf" label="Correct answer"><select id="lq-tf" className="field" value={f.tf ? "true" : "false"} onChange={(e) => set("tf", e.target.value === "true")}><option value="true">True</option><option value="false">False</option></select></F>
      )}
      {f.type === "numeric" && (
        <div className="grid gap-3 sm:grid-cols-3">
          <F id="lq-num" label="Correct answer" error={errs.answer}><input id="lq-num" inputMode="decimal" className="field" value={f.num} onChange={(e) => set("num", e.target.value)} aria-invalid={errs.answer ? true : undefined} /></F>
          <F id="lq-tol" label="Tolerance (plus or minus)" error={errs.tolerance}><input id="lq-tol" inputMode="decimal" className="field" value={f.tolerance} onChange={(e) => set("tolerance", e.target.value)} /></F>
          <F id="lq-unit" label="Unit (optional)" error={errs.unit}><input id="lq-unit" className="field" value={f.unit} onChange={(e) => set("unit", e.target.value)} /></F>
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-[9rem_1fr]">
        <F id="lq-marks" label="Marks" error={errs.marks}><input id="lq-marks" type="number" min={1} max={10} className="field" value={f.marks} onChange={(e) => set("marks", Number(e.target.value))} /></F>
        <F id="lq-hint" label="Hint (optional)" error={errs.hint}><input id="lq-hint" className="field" value={f.hint} onChange={(e) => set("hint", e.target.value)} /></F>
      </div>
      <F id="lq-solution" label="Worked solution steps" hint="One step per line." error={errs.solution}><textarea id="lq-solution" className="field" rows={4} value={f.solution.join("\n")} onChange={(e) => set("solution", lines(e.target.value))} aria-invalid={errs.solution ? true : undefined} /></F>
      <F id="lq-formulas" label="Formulas used (optional)" hint="One per line." error={errs.formulas}><textarea id="lq-formulas" className="field" rows={2} value={f.formulas.join("\n")} onChange={(e) => set("formulas", lines(e.target.value))} /></F>
      <F id="lq-expl" label="Explanation" error={errs.explanation}><textarea id="lq-expl" className="field" rows={3} value={f.explanation} onChange={(e) => set("explanation", e.target.value)} aria-invalid={errs.explanation ? true : undefined} /></F>
      <F id="lq-mistake" label="Common mistake (optional)" error={errs.commonMistake}><input id="lq-mistake" className="field" value={f.commonMistake} onChange={(e) => set("commonMistake", e.target.value)} /></F>
      <p className="rounded-2xl bg-soft p-3 text-sm text-muted">The correct answer is saved with the question and checked in the student&apos;s browser, the same as the built-in lab questions. Use only <b>&lt;sub&gt; &lt;sup&gt; &lt;b&gt; &lt;i&gt;</b> for formatting.</p>

      <section className="card flex flex-col gap-2" aria-label="Question preview">
        <h3 className="text-base">Preview</h3>
        {f.scenario.trim() && <p className="text-sm text-muted"><Rich text={f.scenario} /></p>}
        <p className="font-extrabold text-head"><Rich text={f.prompt || "Your question appears here."} /> <span className="text-xs text-muted">({f.marks} mark{f.marks === 1 ? "" : "s"})</span></p>
        {f.type === "mcq" && <ol className="flex flex-col gap-1">{preview.map((o, i) => <li key={i} className={`rounded-xl border-2 px-3 py-1.5 ${i === f.answerIdx ? "border-green" : "border-line"}`}><Rich text={o} />{i === f.answerIdx && <span className="ml-2 text-xs font-black text-green-t">correct answer</span>}</li>)}</ol>}
        {f.type === "tf" && <p className="text-sm">True or false. Correct answer: <b>{f.tf ? "True" : "False"}</b></p>}
        {f.type === "numeric" && <p className="text-sm">Type a number{f.unit ? ` in ${f.unit}` : ""}. Correct answer: <b>{f.num || "?"}</b> ± {f.tolerance || "0"}</p>}
      </section>

      <div aria-live="polite">
        {ok && <p className="ok" role="status">{ok}</p>}
        {errs._ && <p className="err" role="alert">{errs._}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button type="submit" className="btn btn-ghost" disabled={pending}>{status === "published" ? "Save changes" : "Save draft"}</button>
        <button type="button" className="btn" disabled={pending} onClick={() => save(true)}>{status === "published" ? "Save and keep published" : "Publish"}</button>
        {id && status === "published" && <button type="button" className="btn btn-ghost" disabled={pending} onClick={() => start(async () => done(await setLabQuestionStatus(id, "draft"), false))}>Unpublish</button>}
        {id && (sure
          ? <><button type="button" className="seg !text-red-t" disabled={pending} onClick={() => start(async () => { const r = await deleteLabQuestion(id); if (r.ok) router.replace("/admin/lab-content"); else { setErrs(r.errors); setSure(false); } })}>Yes, delete question</button><button type="button" className="seg" onClick={() => setSure(false)}>Keep</button></>
          : <button type="button" className="seg !text-red-t" disabled={pending} onClick={() => setSure(true)}>Delete question</button>)}
      </div>
    </form>
  );
}
