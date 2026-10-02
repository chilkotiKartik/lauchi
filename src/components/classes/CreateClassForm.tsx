"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClassAction } from "@/app/(app)/classes/actions";

export function CreateClassForm({ courses }: { courses: { code: string; short: string }[] }) {
  const [name, setName] = useState("");
  const [course, setCourse] = useState("");
  const [err, setErr] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <form className="flex flex-col gap-3" onSubmit={(e) => {
      e.preventDefault();
      start(async () => {
        const r = await createClassAction({ name, course });
        if (r.ok && r.id) { router.push(`/classes/${r.id}`); return; }
        setErr(r.message ?? "Try again.");
      });
    }}>
      <div className="flex flex-col gap-1">
        <label htmlFor="class-name" className="font-extrabold text-head">Class name</label>
        <input id="class-name" className="field" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} required autoComplete="off" placeholder="CSE-A Maths, Sem 1" />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="class-course" className="font-extrabold text-head">Subject <span className="font-bold text-muted">(optional)</span></label>
        <select id="class-course" className="field" value={course} onChange={(e) => setCourse(e.target.value)}>
          <option value="">All subjects</option>
          {courses.map((c) => <option key={c.code} value={c.code}>{c.short} ({c.code})</option>)}
        </select>
      </div>
      <button className="btn !min-h-12 self-start !px-5" disabled={pending || !name.trim()}>{pending ? "Creating…" : "Create class"}</button>
      {err && <p role="alert" className="err">{err}</p>}
    </form>
  );
}
