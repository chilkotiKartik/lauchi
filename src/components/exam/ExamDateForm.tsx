"use client";
import { useActionState } from "react";
import { saveExam, type SettingsState } from "@/app/(app)/settings/actions";

const idle: SettingsState = { status: "idle" };

/** Saves exam_date to the student's profile with the same server action (and validation) as Settings. */
export function ExamDateForm({ examDate, hours, min }: { examDate: string | null; hours: number; min: string }) {
  const [state, act, pending] = useActionState(saveExam, idle);
  return (
    <form action={act} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="hours" value={hours} />
      <label className="flex flex-col gap-1 font-extrabold text-head">Exam date
        <input className="field" type="date" name="examDate" defaultValue={examDate ?? ""} min={min} required />
      </label>
      <button className="btn" disabled={pending}>{pending ? "Saving…" : examDate ? "Change date" : "Set exam date"}</button>
      {state.status === "error" && <p className="err w-full" role="alert">{state.message}</p>}
      {state.status === "saved" && <p className="ok w-full" role="status">{state.message}</p>}
    </form>
  );
}
