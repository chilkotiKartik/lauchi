"use client";
import { useActionState, useState } from "react";
import { askDoubt, type DoubtState } from "@/app/(app)/doubts/actions";
import { BODY_MAX, TITLE_MAX } from "@/lib/doubts-consts";

export type CourseOpt = { code: string; short: string; units: { n: number; title: string }[] };
const idle: DoubtState = { status: "idle" };

export function AskForm({ courses, limit }: { courses: CourseOpt[]; limit: number }) {
  const [state, act, pending] = useActionState(askDoubt, idle);
  const [course, setCourse] = useState("");
  const [body, setBody] = useState("");
  const units = courses.find((c) => c.code === course)?.units ?? [];
  const e = state.errors ?? {};
  return (
    <form action={act} className="flex flex-col gap-3" aria-label="Ask a doubt">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 font-extrabold text-head">Subject
          <select className="field" name="course" required value={course} onChange={(ev) => setCourse(ev.target.value)} aria-invalid={!!e.course}>
            <option value="">Pick a subject</option>
            {courses.map((c) => <option key={c.code} value={c.code}>{c.short}</option>)}
          </select>
          {e.course && <span className="text-sm text-red-t" role="alert">{e.course}</span>}
        </label>
        <label className="flex flex-col gap-1 font-extrabold text-head">Unit (optional)
          <select className="field" name="unit" disabled={!course} key={course} defaultValue="" aria-invalid={!!e.unit}>
            <option value="">Not sure</option>
            {units.map((u) => <option key={u.n} value={u.n}>Unit {u.n}: {u.title}</option>)}
          </select>
          {e.unit && <span className="text-sm text-red-t" role="alert">{e.unit}</span>}
        </label>
      </div>
      <label className="flex flex-col gap-1 font-extrabold text-head">Title
        <input className="field" name="title" required minLength={5} maxLength={TITLE_MAX} placeholder="e.g. Why is Kirchhoff's voltage law true?" aria-invalid={!!e.title} />
        {e.title && <span className="text-sm text-red-t" role="alert">{e.title}</span>}
      </label>
      <label className="flex flex-col gap-1 font-extrabold text-head">Your doubt
        <textarea className="field min-h-32" name="body" required minLength={10} maxLength={BODY_MAX} value={body} onChange={(ev) => setBody(ev.target.value)} placeholder="What have you tried? Where exactly are you stuck?" aria-invalid={!!e.body} />
        <span className="text-xs font-normal text-muted">{body.length}/{BODY_MAX}</span>
        {e.body && <span className="text-sm text-red-t" role="alert">{e.body}</span>}
      </label>
      <label className="flex items-start gap-2 font-semibold">
        <input type="checkbox" name="makePublic" className="mt-1" />
        <span>Make this public after answering. If a teacher approves, other students can find the question and answer. Your name is never shown.</span>
      </label>
      {state.status === "error" && <p className="err" role="alert">{state.message}</p>}
      <div className="flex items-center gap-3"><button className="btn w-fit" disabled={pending}>{pending ? "Sending…" : "Ask my doubt"}</button><span className="text-sm text-muted">Up to {limit} doubts a day.</span></div>
    </form>
  );
}
