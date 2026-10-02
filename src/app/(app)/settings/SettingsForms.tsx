"use client";
import { useActionState } from "react";
import { deleteAccount, saveExam, type SettingsState } from "./actions";

const idle: SettingsState = { status: "idle" };

export function ExamForm({ examDate, hours, min }: { examDate: string | null; hours: number; min: string }) {
  const [state, act, pending] = useActionState(saveExam, idle);
  return (
    <form action={act} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 font-extrabold text-head">Exam date
        <input className="field" type="date" name="examDate" defaultValue={examDate ?? ""} min={min} />
      </label>
      <label className="flex flex-col gap-1 font-extrabold text-head">Hours you can study per day
        <input className="field" type="number" name="hours" min={1} max={12} step={1} defaultValue={hours} required />
      </label>
      {state.status === "error" && <p className="err" role="alert">{state.message}</p>}
      {state.status === "saved" && <p className="ok" role="status">{state.message}</p>}
      <button className="btn w-fit" disabled={pending}>{pending ? "Saving…" : "Save"}</button>
    </form>
  );
}

export function DeleteForm() {
  const [state, act, pending] = useActionState(deleteAccount, idle);
  return (
    <form action={act} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 font-extrabold text-head">Type DELETE to confirm
        <input className="field" name="confirm" autoComplete="off" required aria-describedby="del-help" />
      </label>
      <p id="del-help" className="text-sm text-muted">This removes your account, XP, progress and quiz history. It cannot be undone.</p>
      {state.status === "error" && <p className="err" role="alert">{state.message}</p>}
      <button className="btn !bg-[#c2303a] !text-white !shadow-[0_4px_0_#8f2028] w-fit" disabled={pending}>{pending ? "Deleting…" : "Delete my account"}</button>
    </form>
  );
}
