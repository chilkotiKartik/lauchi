"use client";
import { useState, useTransition } from "react";
import { startQuiz } from "@/app/quiz/actions";

export function StartQuizButton({ kind, course, unit, topicKey, children, ghost }: {
  kind: "practice" | "topic" | "mock" | "assignment"; course: string; unit: number; topicKey?: string; children: React.ReactNode; ghost?: boolean;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  return (
    <div className="flex flex-col gap-2">
      <button type="button" className={`btn ${ghost ? "btn-ghost" : ""}`} disabled={pending}
        onClick={() => start(async () => { const r = await startQuiz({ kind, course, unit, topicKey }); if (r?.error) setError(r.error); })}>
        {pending ? "Starting…" : children}
      </button>
      {error && <p className="err" role="alert">{error}</p>}
    </div>
  );
}
