"use client";
import { startTransition, useActionState } from "react";
import { grantTeacher, revokeTeacher, type TeacherState } from "@/app/admin/teachers/actions";

const idle: TeacherState = { status: "idle" };

export function GrantTeacherForm() {
  const [state, act, pending] = useActionState(grantTeacher, idle);
  return (
    <form noValidate className="flex flex-col gap-2" onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); startTransition(() => act(fd)); }}>
      <label htmlFor="teacher-email" className="font-extrabold text-head">Teacher&apos;s email</label>
      <div className="flex flex-wrap gap-2">
        <input id="teacher-email" name="email" type="email" className="field min-w-0 flex-1" autoComplete="off" placeholder="teacher@example.com" required maxLength={254} />
        <button className="btn !min-h-12 !px-5" disabled={pending}>{pending ? "Saving…" : "Make teacher"}</button>
      </div>
      {state.status !== "idle" && <p role={state.status === "saved" ? "status" : "alert"} className={state.status === "saved" ? "ok" : "err"}>{state.message}</p>}
    </form>
  );
}

export function RevokeTeacherButton({ id, label }: { id: string; label: string }) {
  return (
    <button type="button" className="btn btn-ghost !min-h-9 !px-3 !text-sm" aria-label={`Remove teacher access for ${label}`}
      onClick={() => { if (window.confirm(`Remove teacher access for ${label}? Their existing classes stay but they cannot create new ones.`)) startTransition(() => { void revokeTeacher(id); }); }}>
      Revoke
    </button>
  );
}
