"use client";
import { useState, useTransition } from "react";
import { formatCode } from "@/lib/social";
import type { Result } from "@/app/(app)/friends/actions";

type Props = {
  code: string;
  /** "Your friend code" / "Group invite code" — also the accessible name of the code. */
  title: string;
  hint: string;
  shareText: string;
  testId: string;
  regen?: () => Promise<Result>;
};

/** An invite code with copy-link and share buttons. The link is /join/CODE on this site; it still needs sign-in. */
export function CodeCard({ code, title, hint, shareText, testId, regen }: Props) {
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();
  const link = () => `${window.location.origin}/join/${code}`;

  const copy = async () => {
    try { await navigator.clipboard.writeText(link()); setMsg("Link copied. Paste it in WhatsApp or anywhere."); }
    catch { setMsg(`Copy failed. Your link is ${link()}`); }
  };
  const share = async () => {
    if (typeof navigator.share !== "function") return copy();
    try { await navigator.share({ title: "lockin.", text: shareText, url: link() }); } catch { /* closed the share sheet */ }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-wider text-muted">{title}</p>
          <p className="font-mono text-2xl font-black tracking-[0.12em] text-head" data-testid={testId} data-code={code}>{formatCode(code)}</p>
        </div>
      </div>
      <p className="text-sm text-muted">{hint}</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn btn-blue !min-h-11 !px-4" onClick={copy}>Copy invite link</button>
        <button type="button" className="btn btn-ghost !min-h-11 !px-4" onClick={share}>Share</button>
        {regen && (
          <button type="button" className="btn btn-ghost !min-h-11 !px-4" disabled={pending}
            onClick={() => start(async () => { const r = await regen(); setMsg(r.message ?? (r.ok ? "" : "Try again.")); })}>
            {pending ? "Making a new code…" : "New code"}
          </button>
        )}
      </div>
      <p role="status" className="min-h-[1.25rem] text-sm font-extrabold text-green-t">{msg}</p>
    </div>
  );
}
