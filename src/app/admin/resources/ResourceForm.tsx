"use client";
import { startTransition, useActionState, useRef, useState } from "react";
import { uploadResource, type ResState } from "@/app/admin/resources/actions";
import { Field } from "@/components/admin/Field";
import { formatSize, KINDS, KIND_LABEL, MAX_BYTES } from "@/lib/resources";

export type CourseTopics = { code: string; short: string; units: { n: number; title: string; topics: string[] }[] };
const idle: ResState = { status: "idle" };

export function ResourceForm({ courses }: { courses: CourseTopics[] }) {
  const [state, act, pending] = useActionState(uploadResource, idle);
  const k = state.status === "saved" ? `saved-${state.at}` : "form";
  return (
    <div className="flex flex-col gap-3">
      <Fields key={k} courses={courses} state={state} pending={pending} onSubmit={(fd) => startTransition(() => act(fd))} />
      <div aria-live="polite">{state.status === "saved" && <p className="ok" role="status">{state.message}</p>}</div>
    </div>
  );
}

function Fields({ courses, state, pending, onSubmit }: { courses: CourseTopics[]; state: ResState; pending: boolean; onSubmit: (fd: FormData) => void }) {
  const [course, setCourse] = useState(courses[0]?.code ?? "");
  const units = courses.find((c) => c.code === course)?.units ?? [];
  const [unit, setUnit] = useState(units[0]?.n ?? 1);
  const topics = units.find((u) => u.n === unit)?.topics ?? [];
  const [kind, setKind] = useState<string>("notes");
  const [picked, setPicked] = useState<File | null>(null);
  const [over, setOver] = useState(false);
  const [fileErr, setFileErr] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const e = state.status === "error" ? state.errors ?? {} : {};

  function take(f: File | null) {
    setFileErr(null);
    if (f && f.size > MAX_BYTES) { setPicked(null); setFileErr("That file is bigger than 20 MB. Try compressing it."); if (input.current) input.current.value = ""; return; }
    setPicked(f);
  }
  function drop(ev: React.DragEvent) {
    ev.preventDefault(); setOver(false);
    const f = ev.dataTransfer.files[0];
    if (!f || !input.current) return;
    const dt = new DataTransfer(); dt.items.add(f); input.current.files = dt.files; take(f);
  }

  return (
    <form noValidate className="flex flex-col gap-4" onSubmit={(ev) => { ev.preventDefault(); onSubmit(new FormData(ev.currentTarget)); }}>
      <div className="adm-label">
        <label htmlFor="res-file">File (PDF, PNG or JPG, up to 20 MB)</label>
        <div
          className={`adm-drop ${over ? "is-over" : ""}`}
          onDragOver={(ev) => { ev.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)} onDrop={drop}
        >
          <input
            ref={input} id="res-file" name="file" type="file" accept="application/pdf,image/png,image/jpeg,.pdf,.png,.jpg,.jpeg" className="adm-drop-input"
            aria-invalid={e.file || fileErr ? true : undefined} aria-describedby={e.file || fileErr ? "res-file-err" : undefined}
            onChange={(x) => take(x.target.files?.[0] ?? null)}
          />
          <span aria-hidden className="text-2xl">📄</span>
          <span className="font-extrabold text-head">{picked ? picked.name : "Drop a file here, or tap to choose"}</span>
          <span className="text-sm text-muted">{picked ? formatSize(picked.size) : "Leave empty if you are only sharing a link"}</span>
        </div>
        {(e.file || fileErr) && <span id="res-file-err" className="adm-fielderr">{fileErr ?? e.file}</span>}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field id="res-title" label="Title" hint="What students will see, e.g. “Unit 2 handwritten notes”." error={e.title}>
          {(a) => <input {...a} name="title" className="field" maxLength={140} autoComplete="off" />}
        </Field>
        <Field id="res-kind" label="Kind" error={e.kind}>
          {(a) => (
            <select {...a} name="kind" className="field" value={kind} onChange={(x) => setKind(x.target.value)}>
              {KINDS.map((x) => <option key={x} value={x}>{KIND_LABEL[x]}</option>)}
            </select>
          )}
        </Field>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Field id="res-course" label="Subject" error={e.course}>
          {(a) => (
            <select {...a} name="course" className="field" value={course} onChange={(x) => { setCourse(x.target.value); setUnit(courses.find((c) => c.code === x.target.value)?.units[0]?.n ?? 1); }}>
              {courses.map((c) => <option key={c.code} value={c.code}>{c.short} ({c.code})</option>)}
            </select>
          )}
        </Field>
        <Field id="res-unit" label="Unit" error={e.unit}>
          {(a) => (
            <select {...a} name="unit" className="field" value={unit} onChange={(x) => setUnit(Number(x.target.value))}>
              {units.map((u) => <option key={u.n} value={u.n}>Unit {u.n}: {u.title}</option>)}
            </select>
          )}
        </Field>
        <Field id="res-topic" label="Topic (optional)" error={e.topic}>
          {(a) => (
            <select {...a} key={`${course}-${unit}`} name="topic" className="field" defaultValue="">
              <option value="">Whole unit</option>
              {topics.map((t, i) => <option key={i} value={i + 1}>Topic {i + 1}: {t}</option>)}
            </select>
          )}
        </Field>
      </div>
      <Field id="res-desc" label="Description (optional)" hint="One or two lines: what is inside, which pages, who wrote it." error={e.description}>
        {(a) => <textarea {...a} name="description" className="field" maxLength={500} />}
      </Field>
      <Field id="res-url" label={kind === "link" ? "Link" : "Link (optional)"} hint="A web page or YouTube link. Needed for the Link kind; otherwise it is shown next to the file." error={e.url}>
        {(a) => <input {...a} name="url" className="field" autoComplete="off" inputMode="url" placeholder="https://…" />}
      </Field>
      <label className="flex items-start gap-3 rounded-2xl border-2 border-line p-3">
        <input type="checkbox" name="allow_download" className="mt-1 h-5 w-5" />
        <span><b className="text-head">Students may download this file</b><br /><span className="text-sm text-muted">Leave it off to make the file read-only: students read it inside lockin. (PDF pages drawn in the app, watermarked with their email) and get no download button or file link.</span></span>
      </label>
      {state.status === "error" && <p className="err" role="alert">{state.message}</p>}
      <button type="submit" className="btn w-fit" disabled={pending}>{pending ? "Uploading…" : "Add to notes & files"}</button>
    </form>
  );
}
