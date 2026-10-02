"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { redeemCode } from "@/app/(app)/friends/actions";

/** One box for both kinds of code: a friend's code sends a request, a group code joins the group. */
export function CodeForm() {
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <form className="flex flex-col gap-2" onSubmit={(e) => {
      e.preventDefault();
      start(async () => {
        const r = await redeemCode(code);
        if (r.ok && r.id) { router.push(`/friends/groups/${r.id}`); return; }
        setMsg({ ok: r.ok, text: r.message ?? "" });
        if (r.ok) setCode("");
      });
    }}>
      <label htmlFor="code-in" className="font-extrabold text-head">Got a code?</label>
      <div className="flex flex-wrap gap-2">
        <input id="code-in" className="field min-w-0 flex-1 font-mono uppercase tracking-widest" value={code} onChange={(e) => setCode(e.target.value)}
          placeholder="ABCD-2345" autoComplete="off" autoCapitalize="characters" spellCheck={false} maxLength={300} aria-describedby="code-help" />
        <button className="btn !min-h-12 !px-5" disabled={pending || code.trim().length < 8}>{pending ? "Checking…" : "Use code"}</button>
      </div>
      <p id="code-help" className="text-xs text-muted">A friend&apos;s code sends them a friend request. A group code adds you to the group.</p>
      {msg && <p role={msg.ok ? "status" : "alert"} className={msg.ok ? "ok" : "err"}>{msg.text}</p>}
    </form>
  );
}
