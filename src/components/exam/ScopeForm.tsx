"use client";
import { useActionState } from "react";
import { saveScope, type ExamState } from "@/app/(app)/exam/actions";

export type ScopeCourse = { code: string; short: string; units: { n: number; title: string; picked: boolean }[] };
const idle: ExamState = { status: "idle" };

export function ScopeForm({ courses }: { courses: ScopeCourse[] }) {
  const [state, act, pending] = useActionState(saveScope, idle);
  return (
    <form action={act} className="flex flex-col gap-3">
      {courses.map((c) => (
        <fieldset key={c.code} className="flex flex-col gap-1 rounded-2xl border-2 border-line p-3">
          <legend className="px-1 font-black text-head">{c.short}</legend>
          {c.units.map((u) => (
            <label key={u.n} className="flex items-start gap-2 py-0.5">
              <input type="checkbox" name="unit" value={`${c.code}:${u.n}`} defaultChecked={u.picked} className="mt-1" />
              <span>Unit {u.n}: {u.title}</span>
            </label>
          ))}
        </fieldset>
      ))}
      {state.status === "error" && <p className="err" role="alert">{state.message}</p>}
      {state.status === "saved" && <p className="ok" role="status">{state.message}</p>}
      <button className="btn w-fit" disabled={pending}>{pending ? "Saving…" : "Save my syllabus"}</button>
    </form>
  );
}
