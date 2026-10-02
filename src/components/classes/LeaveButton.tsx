"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { leaveClassAction } from "@/app/(app)/classes/actions";

export function LeaveButton({ classId, name }: { classId: string; name: string }) {
  const [sure, setSure] = useState(false);
  const [err, setErr] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();
  if (!sure) return <button type="button" className="btn btn-ghost !min-h-11 !px-4" onClick={() => setSure(true)} aria-label={`Leave ${name}`}>Leave</button>;
  return (
    <span className="flex flex-wrap items-center gap-2" role="group" aria-label={`Leave ${name}?`}>
      <button type="button" className="btn !min-h-11 !px-4" disabled={pending} onClick={() => start(async () => {
        const r = await leaveClassAction(classId);
        if (r.ok) router.refresh(); else setErr(r.message ?? "Try again.");
      })}>{pending ? "Leaving…" : "Yes, leave"}</button>
      <button type="button" className="btn btn-ghost !min-h-11 !px-4" onClick={() => setSure(false)}>Stay</button>
      {err && <span role="alert" className="err">{err}</span>}
    </span>
  );
}
