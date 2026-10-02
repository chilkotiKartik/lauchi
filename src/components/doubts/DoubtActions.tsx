"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { askAi, markHelpful, resolveDoubt } from "@/app/(app)/doubts/actions";

export function AiButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");
  const router = useRouter();
  return (
    <div className="flex flex-col gap-2">
      <button type="button" className="btn btn-ghost w-fit" disabled={pending} onClick={() => start(async () => { const r = await askAi(id); setMsg(r.status === "error" ? r.message ?? "" : ""); if (r.status === "saved") router.refresh(); })}>
        {pending ? "Lochi is thinking…" : "Ask AI for a first answer"}
      </button>
      {msg && <p className="err" role="alert">{msg}</p>}
    </div>
  );
}

export function ResolveButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");
  const router = useRouter();
  return (
    <div className="flex flex-col gap-2">
      <button type="button" className="btn w-fit" disabled={pending} onClick={() => start(async () => { const r = await resolveDoubt(id); setMsg(r.status === "error" ? r.message ?? "" : ""); if (r.status === "saved") router.refresh(); })}>
        {pending ? "Saving…" : "Mark as resolved"}
      </button>
      {msg && <p className="err" role="alert">{msg}</p>}
    </div>
  );
}

export function HelpfulButton({ answerId, count }: { answerId: string; count: number }) {
  const [n, setN] = useState(count);
  const [voted, setVoted] = useState(false);
  const [pending, start] = useTransition();
  const [err, setErr] = useState("");
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <button type="button" className="btn btn-ghost !px-3 !py-1 text-sm" aria-pressed={voted} disabled={pending || voted}
        onClick={() => start(async () => { const r = await markHelpful(answerId); if (r.ok) { setN(r.count ?? n + 1); setVoted(true); setErr(""); } else setErr(r.error ?? "Try again."); })}>
        {voted ? "Marked helpful" : "This helped"} · {n}
      </button>
      {err && <span className="text-sm text-red-t" role="alert">{err}</span>}
    </span>
  );
}
