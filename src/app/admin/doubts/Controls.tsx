"use client";
import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { answerDoubt, deleteDoubt, setHidden, setPublished, type AdState } from "./actions";

const idle: AdState = { status: "idle" };

export function AnswerForm({ id }: { id: string }) {
  const [state, act, pending] = useActionState(answerDoubt.bind(null, id), idle);
  return (
    <form action={act} className="flex flex-col gap-2">
      <label className="flex flex-col gap-1 font-extrabold text-head">Your answer
        <textarea className="field min-h-24" name="body" required minLength={2} maxLength={4000} />
      </label>
      {state.status === "error" && <p className="err" role="alert">{state.message}</p>}
      {state.status === "saved" && <p className="ok" role="status">{state.message}</p>}
      <button className="btn w-fit" disabled={pending}>{pending ? "Sending…" : "Send answer"}</button>
    </form>
  );
}

export function RowButtons({ id, published, hidden, canPublish }: { id: string; published: boolean; hidden: boolean; canPublish: boolean }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");
  const router = useRouter();
  const run = (f: () => Promise<AdState>) => start(async () => { const r = await f(); setMsg(r.status === "error" ? r.message ?? "" : ""); if (r.status === "saved") router.refresh(); });
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {canPublish && <button type="button" className="btn btn-ghost" disabled={pending} onClick={() => run(() => setPublished(id, !published))}>{published ? "Unpublish" : "Publish to library"}</button>}
        <button type="button" className="btn btn-ghost" disabled={pending} onClick={() => run(() => setHidden(id, !hidden))}>{hidden ? "Unhide" : "Hide as abusive"}</button>
        <button type="button" className="btn btn-ghost" disabled={pending} onClick={() => { if (window.confirm("Delete this doubt and its answers for good?")) run(() => deleteDoubt(id)); }}>Delete</button>
      </div>
      {msg && <p className="err" role="alert">{msg}</p>}
    </div>
  );
}
