"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { archiveClassAction } from "@/app/(app)/classes/actions";

export function ArchiveButton({ classId, archived }: { classId: string; archived: boolean }) {
  const [err, setErr] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <div className="flex flex-col gap-2">
      <button type="button" className="btn btn-ghost !min-h-11 self-start !px-4" disabled={pending} onClick={() => {
        if (!archived && !window.confirm("Archive this class? The code stops working and students no longer see it.")) return;
        start(async () => {
          const r = await archiveClassAction(classId, !archived);
          if (r.ok) router.refresh(); else setErr(r.message ?? "Try again.");
        });
      }}>{archived ? "Restore class" : "Archive class"}</button>
      {err && <p role="alert" className="err">{err}</p>}
    </div>
  );
}
