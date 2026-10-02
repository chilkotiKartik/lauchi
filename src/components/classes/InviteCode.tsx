"use client";
import { useState, useTransition } from "react";
import { regenerateCodeAction } from "@/app/(app)/classes/actions";

const pretty = (c: string) => `${c.slice(0, 4)}-${c.slice(4)}`;

/** The invite code (owner only), with copy and regenerate. A new code makes the old one stop working at once. */
export function InviteCode({ classId, code: first, archived }: { classId: string; code: string; archived: boolean }) {
  const [code, setCode] = useState(first);
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();
  const copy = async () => {
    try { await navigator.clipboard.writeText(code); setMsg("Code copied. Share it with your class."); }
    catch { setMsg(`Copy failed. Your code is ${code}`); }
  };
  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="text-xs font-black uppercase tracking-wider text-muted">Invite code</p>
        <p className="font-mono text-3xl font-black tracking-[0.12em] text-head" data-testid="class-code" data-code={code}>{pretty(code)}</p>
      </div>
      {archived
        ? <p className="text-sm text-muted">This class is archived, so the code does not work. Restore the class to let students join.</p>
        : <p className="text-sm text-muted">Students type this on the Classes page. Anyone with the code can join, so regenerate it if it leaks.</p>}
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn btn-blue !min-h-11 !px-4" onClick={copy}>Copy code</button>
        <button type="button" className="btn btn-ghost !min-h-11 !px-4" disabled={pending} onClick={() => start(async () => {
          const r = await regenerateCodeAction(classId);
          if (r.ok && r.code) setCode(r.code);
          setMsg(r.message ?? "Try again.");
        })}>{pending ? "Making a new code…" : "Regenerate code"}</button>
      </div>
      <p role="status" className="min-h-[1.25rem] text-sm font-extrabold text-green-t">{msg}</p>
    </div>
  );
}
