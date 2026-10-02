"use client";
import Link from "next/link";
import { startTransition, useActionState, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { saveCustomPyq, type FormState } from "@/app/admin/actions";
import { Field } from "@/components/admin/Field";

export type CourseLite = { code: string; short: string; units: { n: number; title: string }[] };
export type PyqInitial = { id: string; course: string; unit: number; kind: "theory" | "numerical"; title: string; parts: { text: string; marks: string | null }[]; marks: string | null; repeated: number; year: string | null };

const idle: FormState = { status: "idle" };

/** Add a new custom PYQ, or edit one (when `initial` is given). Errors from the server's zod check show next to each field. */
export function PyqForm({ courses, initial }: { courses: CourseLite[]; initial?: PyqInitial }) {
  const [state, act, pending] = useActionState(saveCustomPyq, idle);
  // after a successful "add", remount the fields so the form is empty for the next question
  const k = !initial && state.status === "saved" ? `saved-${state.at}` : "form";
  return (
    <div className="flex flex-col gap-3">
      <PyqFields key={k} courses={courses} initial={initial} state={state} pending={pending}
        onSubmit={(fd) => startTransition(() => act(fd))} />
      <div aria-live="polite">
        {state.status === "saved" && <p className="ok" role="status">{state.message}</p>}
      </div>
    </div>
  );
}

function PyqFields({ courses, initial, state, pending, onSubmit }: { courses: CourseLite[]; initial?: PyqInitial; state: FormState; pending: boolean; onSubmit: (fd: FormData) => void }) {
  const reduce = useReducedMotion();
  const [course, setCourse] = useState(initial?.course ?? courses[0]?.code ?? "");
  const [parts, setParts] = useState(() => (initial?.parts.length ? initial.parts : [{ text: "", marks: null }]).map((p, i) => ({ ...p, k: i })));
  const units = courses.find((c) => c.code === course)?.units ?? [];
  const e = state.status === "error" ? state.errors ?? {} : {};
  const pre = initial ? `edit-${initial.id.slice(0, 8)}` : "new";
  return (
    <form noValidate className="flex flex-col gap-4" onSubmit={(ev) => { ev.preventDefault(); onSubmit(new FormData(ev.currentTarget)); }}>
      {initial && <input type="hidden" name="id" value={initial.id} />}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Field id={`${pre}-course`} label="Subject" error={e.course}>
          {(a) => (
            <select {...a} name="course" className="field" value={course} onChange={(x) => setCourse(x.target.value)}>
              {courses.map((c) => <option key={c.code} value={c.code}>{c.short} ({c.code})</option>)}
            </select>
          )}
        </Field>
        <Field id={`${pre}-unit`} label="Unit" error={e.unit}>
          {(a) => (
            <select {...a} key={course} name="unit" className="field" defaultValue={initial && initial.course === course ? String(initial.unit) : String(units[0]?.n ?? 1)}>
              {units.map((u) => <option key={u.n} value={u.n}>Unit {u.n}: {u.title}</option>)}
            </select>
          )}
        </Field>
        <Field id={`${pre}-kind`} label="Type" error={e.kind}>
          {(a) => (
            <select {...a} name="kind" className="field" defaultValue={initial?.kind ?? "theory"}>
              <option value="theory">Theory</option>
              <option value="numerical">Numerical</option>
            </select>
          )}
        </Field>
      </div>
      <Field id={`${pre}-title`} label="Title" hint="A short name students will scan for, e.g. “Newton's rings: radius of dark rings”." error={e.title}>
        {(a) => <input {...a} name="title" className="field" defaultValue={initial?.title ?? ""} maxLength={300} autoComplete="off" />}
      </Field>

      <fieldset className="flex flex-col gap-3 rounded-2xl border-2 border-line p-3">
        <legend className="px-1 font-black text-head">Question parts</legend>
        <p className="text-sm text-muted">You can use &lt;sub&gt;, &lt;sup&gt;, &lt;b&gt; and &lt;i&gt;, e.g. V&lt;sub&gt;th&lt;/sub&gt;.</p>
        {e.parts && <p className="adm-fielderr">{e.parts}</p>}
        <AnimatePresence initial={false}>
          {parts.map((p, i) => (
            <motion.div key={p.k} layout={!reduce} initial={reduce ? false : { opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={reduce ? undefined : { opacity: 0, height: 0 }}
              className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_9rem]">
              <Field id={`${pre}-part-${p.k}`} label={`Part ${i + 1} question`} error={e[`parts.${i}.text`]}>
                {(a) => <textarea {...a} name="part_text" className="field" defaultValue={p.text} maxLength={2000} rows={3} />}
              </Field>
              <div className="flex flex-col gap-2">
                <Field id={`${pre}-pmarks-${p.k}`} label={`Part ${i + 1} marks`} error={e[`parts.${i}.marks`]}>
                  {(a) => <input {...a} name="part_marks" className="field" defaultValue={p.marks ?? ""} maxLength={20} placeholder="e.g. 5" />}
                </Field>
                {parts.length > 1 && (
                  <button type="button" className="btn btn-ghost !min-h-10 !px-3 text-sm" onClick={() => setParts((xs) => xs.filter((x) => x.k !== p.k))}>
                    Remove part {i + 1}
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {parts.length < 12 && (
          <button type="button" className="btn btn-ghost w-fit" onClick={() => setParts((xs) => [...xs, { text: "", marks: null, k: Math.max(-1, ...xs.map((x) => x.k)) + 1 }])}>+ Add a part</button>
        )}
      </fieldset>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Field id={`${pre}-marks`} label="Total marks (optional)" error={e.marks}>
          {(a) => <input {...a} name="marks" className="field" defaultValue={initial?.marks ?? ""} maxLength={20} placeholder="e.g. 10 or 5 to 10" />}
        </Field>
        <Field id={`${pre}-repeated`} label="Times asked in past papers" error={e.repeated}>
          {(a) => <input {...a} name="repeated" type="number" inputMode="numeric" min={0} max={50} className="field" defaultValue={initial?.repeated ?? 1} />}
        </Field>
        <Field id={`${pre}-year`} label="Years asked (optional)" error={e.year}>
          {(a) => <input {...a} name="year" className="field" defaultValue={initial?.year ?? ""} maxLength={60} placeholder="e.g. 2023, 2024" />}
        </Field>
      </div>
      {state.status === "error" && <p className="err" role="alert">{state.message}</p>}
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className="btn" disabled={pending}>{pending ? "Saving…" : initial ? "Save changes" : "Add question"}</button>
        {initial && <Link href="/admin/pyqs" className="font-extrabold">Cancel</Link>}
      </div>
    </form>
  );
}
