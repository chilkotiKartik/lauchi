"use client";
import { startTransition, useActionState, useState } from "react";
import { pinVideo, type FormState } from "@/app/admin/actions";
import { Field } from "@/components/admin/Field";

export type CourseTopics = { code: string; short: string; units: { n: number; title: string; topics: string[] }[] };

const idle: FormState = { status: "idle" };
const ID = /^[A-Za-z0-9_-]{11}$/;
/** Light client-side preview only; the server parses and validates again. */
const previewId = (s: string) => {
  const t = s.trim();
  if (ID.test(t)) return t;
  const m = /(?:v=|youtu\.be\/|shorts\/|embed\/|live\/)([A-Za-z0-9_-]{11})/.exec(t);
  return m ? m[1] : null;
};

export function VideoForm({ courses }: { courses: CourseTopics[] }) {
  const [state, act, pending] = useActionState(pinVideo, idle);
  const k = state.status === "saved" ? `saved-${state.at}` : "form";
  return (
    <div className="flex flex-col gap-3">
      <VideoFields key={k} courses={courses} state={state} pending={pending} onSubmit={(fd) => startTransition(() => act(fd))} />
      <div aria-live="polite">{state.status === "saved" && <p className="ok" role="status">{state.message}</p>}</div>
    </div>
  );
}

function VideoFields({ courses, state, pending, onSubmit }: { courses: CourseTopics[]; state: FormState; pending: boolean; onSubmit: (fd: FormData) => void }) {
  const [course, setCourse] = useState(courses[0]?.code ?? "");
  const units = courses.find((c) => c.code === course)?.units ?? [];
  const [unit, setUnit] = useState(units[0]?.n ?? 1);
  const topics = units.find((u) => u.n === unit)?.topics ?? [];
  const [video, setVideo] = useState("");
  const id = previewId(video);
  const e = state.status === "error" ? state.errors ?? {} : {};
  return (
    <form noValidate className="flex flex-col gap-4" onSubmit={(ev) => { ev.preventDefault(); onSubmit(new FormData(ev.currentTarget)); }}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_8rem]">
        <Field id="pin-video" label="YouTube link or video id" hint="Paste the link from the Share button, or the 11-character id." error={e.video}>
          {(a) => <input {...a} name="video" className="field" value={video} onChange={(x) => setVideo(x.target.value)} autoComplete="off" inputMode="url" placeholder="https://youtu.be/…" />}
        </Field>
        <div className="flex items-end">
          {id
            // eslint-disable-next-line @next/next/no-img-element -- tiny preview from i.ytimg.com (already allowed by the CSP)
            ? <img src={`https://i.ytimg.com/vi/${id}/mqdefault.jpg`} alt="Preview of the video thumbnail" className="adm-thumb" width={128} height={72} />
            : <span className="adm-thumb grid place-items-center text-xs text-muted" aria-hidden>No preview</span>}
        </div>
      </div>
      <Field id="pin-title" label="Video title" hint="Shown to students. Keep the teacher's own title if it's clear." error={e.title}>
        {(a) => <input {...a} name="title" className="field" maxLength={140} autoComplete="off" />}
      </Field>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Field id="pin-course" label="Subject" error={e.course}>
          {(a) => (
            <select {...a} name="course" className="field" value={course} onChange={(x) => { setCourse(x.target.value); setUnit(courses.find((c) => c.code === x.target.value)?.units[0]?.n ?? 1); }}>
              {courses.map((c) => <option key={c.code} value={c.code}>{c.short} ({c.code})</option>)}
            </select>
          )}
        </Field>
        <Field id="pin-unit" label="Unit" error={e.unit}>
          {(a) => (
            <select {...a} name="unit" className="field" value={unit} onChange={(x) => setUnit(Number(x.target.value))}>
              {units.map((u) => <option key={u.n} value={u.n}>Unit {u.n}: {u.title}</option>)}
            </select>
          )}
        </Field>
        <Field id="pin-topic" label="Topic" error={e.topic}>
          {(a) => (
            <select {...a} key={`${course}-${unit}`} name="topic" className="field" defaultValue="">
              <option value="">Whole unit</option>
              {topics.map((t, i) => <option key={i} value={i + 1}>Topic {i + 1}: {t}</option>)}
            </select>
          )}
        </Field>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field id="pin-channel" label="Channel (optional)" error={e.channel}>
          {(a) => <input {...a} name="channel" className="field" maxLength={80} autoComplete="off" />}
        </Field>
        <Field id="pin-note" label="Note for students (optional)" hint="e.g. “Watch from 12:30 for the derivation.”" error={e.note}>
          {(a) => <input {...a} name="note" className="field" maxLength={200} autoComplete="off" />}
        </Field>
      </div>
      {state.status === "error" && <p className="err" role="alert">{state.message}</p>}
      <button type="submit" className="btn w-fit" disabled={pending}>{pending ? "Pinning…" : "Pin video"}</button>
    </form>
  );
}
