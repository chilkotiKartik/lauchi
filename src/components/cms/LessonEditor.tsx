"use client";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Lesson } from "@/content/lessons/types";
import { LessonView } from "@/components/LessonView";
import { deleteLesson, saveLesson, setLessonStatus, type LessonResult } from "@/app/admin/lessons/actions";

type Target = { course: string; unit: number; topic: number };
type Props = { id: string | null; target: Target; topicTitle: string; initial: Lesson; status: "draft" | "published" | null; version: number; labs: { id: string; title: string }[] };

function Lines({ id, label, hint, value, onChange, rows = 3 }: { id: string; label: string; hint?: string; value: string[]; onChange: (v: string[]) => void; rows?: number }) {
  return (
    <div className="adm-label">
      <label htmlFor={id}>{label}</label>
      {hint && <span className="hint">{hint}</span>}
      <textarea id={id} className="field" rows={rows} value={value.join("\n")} onChange={(e) => onChange(e.target.value.split("\n"))} />
    </div>
  );
}
function Text({ id, label, value, onChange, hint, area }: { id: string; label: string; value: string; onChange: (v: string) => void; hint?: string; area?: boolean }) {
  return (
    <div className="adm-label">
      <label htmlFor={id}>{label}</label>
      {hint && <span className="hint">{hint}</span>}
      {area ? <textarea id={id} className="field" rows={4} value={value} onChange={(e) => onChange(e.target.value)} /> : <input id={id} className="field" value={value} onChange={(e) => onChange(e.target.value)} />}
    </div>
  );
}

const swap = <T,>(a: T[], i: number, f: (x: T) => T) => a.map((x, j) => (j === i ? f(x) : x));
const drop = <T,>(a: T[], i: number) => a.filter((_, j) => j !== i);

/** Structured lesson editor with a live preview that uses the real student LessonView. */
export function LessonEditor({ id: id0, target, topicTitle, initial, status: status0, version: version0, labs }: Props) {
  const router = useRouter();
  const [id, setId] = useState(id0);
  const [l, setL] = useState<Lesson>(initial);
  const [status, setStatus] = useState(status0);
  const [version, setVersion] = useState(version0);
  const [msg, setMsg] = useState<{ ok: boolean; text: string[] } | null>(null);
  const [sure, setSure] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [pending, start] = useTransition();

  const preview = useMemo<Lesson>(() => {
    const nz = (a: string[]) => a.map((s) => s.trim()).filter(Boolean);
    return {
      intro: l.intro, sections: l.sections.filter((s) => s.h.trim() || nz(s.p).length).map((s) => ({ h: s.h, p: nz(s.p), ...(s.formula && nz(s.formula).length ? { formula: nz(s.formula) } : {}) })),
      examples: l.examples.filter((e) => e.q.trim()).map((e) => ({ q: e.q, steps: nz(e.steps), ans: e.ans })), mistakes: nz(l.mistakes),
      check: l.check.filter((c) => c.q.trim() && nz(c.o).length >= 2).map((c) => ({ q: c.q, o: nz(c.o), a: Math.min(Math.max(c.a, 0), nz(c.o).length - 1), why: c.why })),
      ...(l.lab ? { lab: l.lab } : {}),
    };
  }, [l]);

  const apply = (r: LessonResult, after?: (r: Extract<LessonResult, { ok: true }>) => void) => {
    if (!r.ok) { setMsg({ ok: false, text: r.errors }); return; }
    setMsg({ ok: true, text: [r.message] }); setStatus(r.status); setVersion(r.version); setId(r.id); after?.(r);
  };
  const save = (publish: boolean) => start(async () => {
    setMsg(null);
    const r = await saveLesson({ id: id ?? undefined, target: id ? undefined : target, body: l, publish });
    apply(r, (ok) => { if (!id) router.replace(`/admin/lessons/${ok.id}`); else router.refresh(); });
  });
  const unpublish = () => start(async () => { setMsg(null); apply(await setLessonStatus(id!, "draft"), () => router.refresh()); });
  const remove = () => start(async () => {
    const r = await deleteLesson(id!);
    if (!r.ok) { setMsg({ ok: false, text: r.errors }); setSure(false); return; }
    router.replace("/admin/lessons");
  });

  return (
    <div className="flex flex-col gap-5">
      <section className="card flex flex-wrap items-center gap-3" aria-label="Lesson status">
        <div className="mr-auto">
          <p className="text-sm font-black text-muted">{target.course} · Unit {target.unit} · Topic {target.topic}</p>
          <h2 className="text-xl">{topicTitle}</h2>
        </div>
        <span className={`chip ${status === "published" ? "chip-id" : "chip-warm"}`}>{status === "published" ? "Published" : status === "draft" ? "Draft" : "New (not saved)"}</span>
        {id && <span className="text-sm text-muted">Version {version}</span>}
      </section>

      <form className="flex flex-col gap-5" noValidate onSubmit={(e) => { e.preventDefault(); save(false); }} aria-label="Lesson editor">
        <section className="card flex flex-col gap-3">
          <h2 className="text-xl">Intro</h2>
          <Text id="les-intro" label="Intro" hint="Needs more than 40 characters to publish. You can use <sub>, <sup>, <b> and <i> only." value={l.intro} onChange={(v) => setL({ ...l, intro: v })} area />
          <div className="adm-label">
            <label htmlFor="les-lab">Linked lab (optional)</label>
            <select id="les-lab" className="field" value={l.lab?.id ?? ""} onChange={(e) => { const lab = labs.find((x) => x.id === e.target.value); setL({ ...l, lab: lab ? { id: lab.id, label: l.lab?.label || `Try it in the 3D lab: ${lab.title}` } : undefined }); }}>
              <option value="">No lab</option>
              {labs.map((x) => <option key={x.id} value={x.id}>{x.title}</option>)}
            </select>
          </div>
          {l.lab && <Text id="les-lab-label" label="Lab link text" value={l.lab.label} onChange={(v) => setL({ ...l, lab: { id: l.lab!.id, label: v } })} />}
        </section>

        <section className="card flex flex-col gap-4" aria-label="Sections">
          <h2 className="text-xl">Sections</h2>
          {l.sections.map((s, i) => (
            <fieldset key={i} className="flex flex-col gap-3 rounded-2xl border-2 border-line p-3">
              <legend className="px-1 font-black text-head">Section {i + 1}</legend>
              <Text id={`sec-${i}-h`} label={`Section ${i + 1} heading`} value={s.h} onChange={(v) => setL({ ...l, sections: swap(l.sections, i, (x) => ({ ...x, h: v })) })} />
              <Lines id={`sec-${i}-p`} label={`Section ${i + 1} paragraphs`} hint="One paragraph per line." value={s.p} onChange={(v) => setL({ ...l, sections: swap(l.sections, i, (x) => ({ ...x, p: v })) })} />
              <Lines id={`sec-${i}-f`} label={`Section ${i + 1} formulas`} hint="Optional. One formula per line." rows={2} value={s.formula ?? []} onChange={(v) => setL({ ...l, sections: swap(l.sections, i, (x) => ({ ...x, formula: v })) })} />
              <button type="button" className="seg !text-red-t w-fit" aria-label={`Remove section ${i + 1}`} onClick={() => setL({ ...l, sections: drop(l.sections, i) })}>Remove section</button>
            </fieldset>
          ))}
          <button type="button" className="btn btn-ghost w-fit" onClick={() => setL({ ...l, sections: [...l.sections, { h: "", p: [""] }] })}>Add section</button>
        </section>

        <section className="card flex flex-col gap-4" aria-label="Worked examples">
          <h2 className="text-xl">Worked examples</h2>
          {l.examples.map((e, i) => (
            <fieldset key={i} className="flex flex-col gap-3 rounded-2xl border-2 border-line p-3">
              <legend className="px-1 font-black text-head">Example {i + 1}</legend>
              <Text id={`ex-${i}-q`} label={`Example ${i + 1} question`} value={e.q} onChange={(v) => setL({ ...l, examples: swap(l.examples, i, (x) => ({ ...x, q: v })) })} area />
              <Lines id={`ex-${i}-s`} label={`Example ${i + 1} steps`} hint="One step per line." value={e.steps} onChange={(v) => setL({ ...l, examples: swap(l.examples, i, (x) => ({ ...x, steps: v })) })} />
              <Text id={`ex-${i}-a`} label={`Example ${i + 1} answer`} value={e.ans} onChange={(v) => setL({ ...l, examples: swap(l.examples, i, (x) => ({ ...x, ans: v })) })} />
              <button type="button" className="seg !text-red-t w-fit" aria-label={`Remove example ${i + 1}`} onClick={() => setL({ ...l, examples: drop(l.examples, i) })}>Remove example</button>
            </fieldset>
          ))}
          <button type="button" className="btn btn-ghost w-fit" onClick={() => setL({ ...l, examples: [...l.examples, { q: "", steps: [""], ans: "" }] })}>Add example</button>
        </section>

        <section className="card flex flex-col gap-3" aria-label="Common mistakes">
          <h2 className="text-xl">Common mistakes</h2>
          <Lines id="les-mistakes" label="Mistakes" hint="One mistake per line. At least 2 to publish." value={l.mistakes} onChange={(v) => setL({ ...l, mistakes: v })} rows={4} />
        </section>

        <section className="card flex flex-col gap-4" aria-label="Self-check questions">
          <h2 className="text-xl">Check yourself</h2>
          {l.check.map((c, i) => (
            <fieldset key={i} className="flex flex-col gap-3 rounded-2xl border-2 border-line p-3">
              <legend className="px-1 font-black text-head">Check {i + 1}</legend>
              <Text id={`ck-${i}-q`} label={`Check ${i + 1} question`} value={c.q} onChange={(v) => setL({ ...l, check: swap(l.check, i, (x) => ({ ...x, q: v })) })} />
              <Lines id={`ck-${i}-o`} label={`Check ${i + 1} options`} hint="One option per line, all different." rows={4} value={c.o} onChange={(v) => setL({ ...l, check: swap(l.check, i, (x) => ({ ...x, o: v })) })} />
              <div className="adm-label">
                <label htmlFor={`ck-${i}-a`}>Check {i + 1} correct option number</label>
                <input id={`ck-${i}-a`} type="number" min={1} max={8} className="field w-28" value={c.a + 1} onChange={(e) => setL({ ...l, check: swap(l.check, i, (x) => ({ ...x, a: Math.max(0, Math.floor(Number(e.target.value) || 1) - 1) })) })} />
              </div>
              <Text id={`ck-${i}-w`} label={`Check ${i + 1} explanation`} value={c.why} onChange={(v) => setL({ ...l, check: swap(l.check, i, (x) => ({ ...x, why: v })) })} />
              <button type="button" className="seg !text-red-t w-fit" aria-label={`Remove check ${i + 1}`} onClick={() => setL({ ...l, check: drop(l.check, i) })}>Remove question</button>
            </fieldset>
          ))}
          <button type="button" className="btn btn-ghost w-fit" onClick={() => setL({ ...l, check: [...l.check, { q: "", o: ["", "", "", ""], a: 0, why: "" }] })}>Add check question</button>
        </section>

        <div aria-live="polite">
          {msg && (msg.ok
            ? <p className="ok" role="status">{msg.text[0]}</p>
            : <ul className="card !border-red flex flex-col gap-1" role="alert">{msg.text.map((t, i) => <li key={i} className="adm-fielderr">{t}</li>)}</ul>)}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="submit" className="btn btn-ghost" disabled={pending}>{pending ? "Working…" : status === "published" ? "Save changes" : "Save draft"}</button>
          <button type="button" className="btn" disabled={pending} onClick={() => save(true)}>{status === "published" ? "Save and keep published" : "Publish"}</button>
          {status === "published" && <button type="button" className="btn btn-ghost" disabled={pending} onClick={unpublish}>Unpublish</button>}
          <button type="button" className="seg" aria-pressed={showPreview} onClick={() => setShowPreview((v) => !v)}>{showPreview ? "Hide preview" : "Show preview"}</button>
          {id && (sure ? (
            <>
              <button type="button" className="seg !text-red-t" disabled={pending} onClick={remove}>Yes, delete lesson</button>
              <button type="button" className="seg" onClick={() => setSure(false)}>Keep</button>
            </>
          ) : <button type="button" className="seg !text-red-t" disabled={pending} onClick={() => setSure(true)}>Delete lesson</button>)}
        </div>
      </form>

      {showPreview && (
        <section className="card flex flex-col gap-4" aria-label="Lesson preview">
          <h2 className="text-xl">Preview (what students see)</h2>
          <h3 className="text-2xl">{topicTitle}</h3>
          <LessonView lesson={preview} />
        </section>
      )}
    </div>
  );
}
