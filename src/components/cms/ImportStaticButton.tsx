"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { importStaticLesson } from "@/app/admin/lessons/actions";

export function ImportStaticButton({ course, unit, topic }: { course: string; unit: number; topic: number }) {
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-col gap-1">
      <button type="button" className="btn btn-ghost" disabled={pending} onClick={() => start(async () => {
        setErr(null);
        const r = await importStaticLesson({ course, unit, topic });
        if (!r.ok) setErr(r.errors[0]); else router.push(`/admin/lessons/${r.id}`);
      })}>{pending ? "Copying…" : "Start from the built-in lesson"}</button>
      {err && <span className="adm-fielderr" role="alert">{err}</span>}
    </div>
  );
}
