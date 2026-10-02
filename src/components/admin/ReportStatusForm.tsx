"use client";
import { startTransition, useActionState } from "react";
import { updateReport, type FormState } from "@/app/admin/actions";
import { Field } from "@/components/admin/Field";

const idle: FormState = { status: "idle" };

/** Change a report's status and leave a fix note (e.g. "fixed template t3 in gen_b.js"). */
export function ReportStatusForm({ id, status, note }: { id: string; status: "open" | "fixed" | "ignored"; note: string }) {
  const [state, act, pending] = useActionState(updateReport, idle);
  const e = state.status === "error" ? state.errors ?? {} : {};
  const pre = `rep-${id.slice(0, 8)}`;
  return (
    <form noValidate className="flex flex-col gap-2 sm:flex-row sm:items-end" onSubmit={(ev) => { ev.preventDefault(); const fd = new FormData(ev.currentTarget); startTransition(() => act(fd)); }}>
      <input type="hidden" name="id" value={id} />
      <div className="sm:w-40">
        <Field id={`${pre}-status`} label="Status" error={e.status}>
          {(a) => (
            <select {...a} name="status" className="field" defaultValue={status}>
              <option value="open">Open</option>
              <option value="fixed">Fixed</option>
              <option value="ignored">Ignored</option>
            </select>
          )}
        </Field>
      </div>
      <div className="flex-1">
        <Field id={`${pre}-note`} label="Fix note" error={e.fix_note}>
          {(a) => <input {...a} name="fix_note" className="field" defaultValue={note} maxLength={500} autoComplete="off" placeholder="What was changed, and where" />}
        </Field>
      </div>
      <button type="submit" className="btn btn-blue shrink-0" disabled={pending}>{pending ? "Saving…" : "Save"}</button>
      <span aria-live="polite" className="sm:self-center">
        {state.status === "saved" && <span className="ok inline-block" role="status">{state.message}</span>}
        {state.status === "error" && !Object.keys(e).length && <span className="err inline-block" role="alert">{state.message}</span>}
      </span>
    </form>
  );
}
