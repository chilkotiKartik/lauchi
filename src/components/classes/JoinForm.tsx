"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { joinClassAction } from "@/app/(app)/classes/actions";

/** Join a class with the code the teacher shared. Case does not matter; spaces and dashes are ignored. */
export function JoinForm() {
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <form className="flex flex-col gap-2" onSubmit={(e) => {
      e.preventDefault();
      start(async () => {
        const r = await joinClassAction({ code });
        setMsg({ ok: r.ok, text: r.message ?? "" });
        if (r.ok) { setCode(""); router.refresh(); }
      });
    }}>
      <label htmlFor="class-code" className="font-extrabold text-head">Class code</label>
      <div className="flex flex-wrap gap-2">
        <input id="class-code" className="field min-w-0 flex-1 font-mono uppercase tracking-widest" value={code} onChange={(e) => setCode(e.target.value)}
          placeholder="ABCD-2345" autoComplete="off" autoCapitalize="characters" spellCheck={false} maxLength={40} aria-describedby="class-code-help" />
        <button className="btn !min-h-12 !px-5" disabled={pending || code.trim().length < 8}>{pending ? "Joining…" : "Join class"}</button>
      </div>
      <p id="class-code-help" className="text-xs text-muted">Your teacher sees your name and your study numbers (XP, streak, quiz accuracy). They never see your answers or chats. You can leave any time.</p>
      {msg && <p role={msg.ok ? "status" : "alert"} className={msg.ok ? "ok" : "err"}>{msg.text}</p>}
    </form>
  );
}
