"use client";
import { useActionState } from "react";
import { BRANCHES, GOALS } from "@/lib/academics";
import { updateProfile, type ProfileState } from "./actions";

export function ProfileForm({ name, branch, semester, goal }: { name: string; branch: string; semester: number; goal: number }) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(updateProfile, { status: "idle" });
  return (
    <form action={action} className="card flex flex-col gap-3">
      <label htmlFor="name" className="font-black text-head">Name</label>
      <input id="name" name="name" defaultValue={name} maxLength={60} required className="field" autoComplete="given-name" />
      <label htmlFor="branch" className="font-black text-head">Branch</label>
      <select id="branch" name="branch" defaultValue={branch} className="field">{BRANCHES.map((b) => <option key={b.key} value={b.key}>{b.name}</option>)}</select>
      <label htmlFor="semester" className="font-black text-head">Semester</label>
      <select id="semester" name="semester" defaultValue={semester} className="field"><option value="1">Semester I</option><option value="2">Semester II</option></select>
      <label htmlFor="goal" className="font-black text-head">Daily goal</label>
      <select id="goal" name="goal" defaultValue={goal} className="field">{GOALS.map((g) => <option key={g.xp} value={g.xp}>{g.label} · {g.xp} XP</option>)}</select>
      {state.status === "error" && <p className="err" role="alert">{state.message}</p>}
      {state.status === "saved" && <p className="ok" role="status">{state.message}</p>}
      <button className="btn btn-wide" disabled={pending}>{pending ? "Saving…" : "Save changes"}</button>
    </form>
  );
}
