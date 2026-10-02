"use client";
import { useState, useTransition } from "react";
import { setLeague } from "@/app/(app)/league/actions";

export function LeagueToggle({ joined }: { joined: boolean }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  return (
    <div className="flex flex-col gap-2">
      <button type="button" className={`btn ${joined ? "btn-ghost" : ""}`} disabled={pending}
        onClick={() => start(async () => { const r = await setLeague(!joined); setError(r.ok ? "" : r.error ?? "Try again."); })}>
        {pending ? "Saving…" : joined ? "Leave the league" : "Join the league"}
      </button>
      {error && <p className="err" role="alert">{error}</p>}
    </div>
  );
}
