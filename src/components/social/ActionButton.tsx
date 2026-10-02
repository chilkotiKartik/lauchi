"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Result } from "@/app/(app)/friends/actions";

type Props = {
  action: () => Promise<Result>;
  label: string;
  /** Accessible name when the visible label is short ("Accept" → "Accept Riya"). */
  ariaLabel?: string;
  pendingLabel?: string;
  /** Asks once more before running (for removing and leaving). */
  confirm?: string;
  /** Label shown after success; the button then stays disabled. */
  doneLabel?: string;
  /** Where to go after success. */
  goTo?: string;
  className?: string;
};

/** One button that runs a server action, with a pending state, an optional confirm step and a spoken result. */
export function ActionButton({ action, label, ariaLabel, pendingLabel = "…", confirm, doneLabel, goTo, className = "btn btn-ghost" }: Props) {
  const [pending, start] = useTransition();
  const [asking, setAsking] = useState(false);
  const [done, setDone] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const router = useRouter();

  const run = () => start(async () => {
    const r = await action();
    setAsking(false);
    if (r.ok) { if (doneLabel) setDone(true); setMsg(r.message ? { ok: true, text: r.message } : null); if (goTo) router.push(goTo); }
    else setMsg({ ok: false, text: r.message ?? "Try again." });
  });

  if (asking) {
    return (
      <span className="inline-flex flex-wrap items-center gap-2" role="group" aria-label={confirm}>
        <span className="text-sm font-extrabold text-head">{confirm}</span>
        <button type="button" className="btn !min-h-10 !bg-red !px-4 !shadow-none" disabled={pending} onClick={run}>{pending ? pendingLabel : "Yes"}</button>
        <button type="button" className="btn btn-ghost !min-h-10 !px-4" disabled={pending} onClick={() => setAsking(false)}>No</button>
      </span>
    );
  }
  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button type="button" className={className} aria-label={done && doneLabel ? undefined : ariaLabel} disabled={pending || done}
        onClick={() => (confirm ? setAsking(true) : run())}>
        {pending ? pendingLabel : done && doneLabel ? doneLabel : label}
      </button>
      {msg && !(done && doneLabel) && <span role={msg.ok ? "status" : "alert"} className={`text-xs font-extrabold ${msg.ok ? "text-green-t" : "text-red-t"}`}>{msg.text}</span>}
    </span>
  );
}
