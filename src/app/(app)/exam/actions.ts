"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { localDay } from "@/lib/insights";
import { buildSchedule, taskKey } from "@/lib/exam";
import { loadAllUnits, loadScope } from "./data";

export type ExamState = { status: "idle" | "saved" | "error"; message?: string; at?: number };
const fail = (message: string): ExamState => ({ status: "error", message, at: Date.now() });
const keySchema = z.string().regex(/^[A-Z]{2,3}-[0-9]{3}:([1-9]|1[0-2])$/);

async function onboarded() {
  const s = await getSession();
  return s && s.profile.onboarded_at ? s : null;
}

/** Saves which units are in scope (replaces the old choice). Only units the student can actually see are kept. */
export async function saveScope(_prev: ExamState, form: FormData): Promise<ExamState> {
  const s = await onboarded();
  if (!s) return fail("Your session expired. Log in again.");
  const parsed = z.array(keySchema).max(200).safeParse(form.getAll("unit").map(String));
  if (!parsed.success) return fail("Those units aren't valid.");
  const all = await loadAllUnits(s);
  const allowed = new Set(all.map((u) => `${u.course}:${u.unit}`));
  const picked = [...new Set(parsed.data)].filter((k) => allowed.has(k));
  if (picked.length === 0) return fail("Pick at least one unit.");
  const del = await s.supabase.from("exam_plan_items").delete().eq("user_id", s.user.id);
  if (del.error) return fail("We couldn't save that. Try again.");
  const { error } = await s.supabase.from("exam_plan_items").insert(picked.map((k) => { const [course, unit] = k.split(":"); return { user_id: s.user.id, course, unit: Number(unit) }; }));
  if (error) return fail("We couldn't save that. Try again.");
  revalidatePath("/exam");
  return { status: "saved", message: `Saved ${picked.length} ${picked.length === 1 ? "unit" : "units"}. Rebuild your schedule to use them.`, at: Date.now() };
}

/** Rebuilds the schedule from today to the exam: ticked tasks are kept, everything else is replaced. */
export async function regenerateSchedule(): Promise<ExamState> {
  const s = await onboarded();
  if (!s) return fail("Your session expired. Log in again.");
  const exam = s.profile.exam_date;
  if (!exam) return fail("Set your exam date first.");
  const today = localDay(new Date(), s.profile.timezone);
  const { units } = await loadScope(s, await loadAllUnits(s));
  const tasks = buildSchedule(units, today, exam);
  if (!tasks.length) return fail("There are no days left before your exam. Set a later date.");
  const { data: kept } = await s.supabase.from("exam_tasks").select("day,course,unit,kind").eq("done", true).limit(2000);
  const doneKeys = new Set(((kept ?? []) as { day: string; course: string; unit: number; kind: never }[]).map((t) => taskKey(t)));
  const del = await s.supabase.from("exam_tasks").delete().eq("user_id", s.user.id).eq("done", false);
  if (del.error) return fail("We couldn't build your schedule. Try again.");
  const rows = tasks.filter((t) => !doneKeys.has(taskKey(t))).map((t) => ({ ...t, user_id: s.user.id }));
  if (rows.length) {
    const { error } = await s.supabase.from("exam_tasks").insert(rows);
    if (error) return fail("We couldn't build your schedule. Try again.");
  }
  revalidatePath("/exam");
  return { status: "saved", message: "Your schedule is ready.", at: Date.now() };
}

export async function toggleTask(id: string, done: boolean): Promise<ExamState> {
  const s = await onboarded();
  const ok = z.string().uuid().safeParse(id);
  if (!s || !ok.success || typeof done !== "boolean") return fail("We couldn't save that.");
  const { error } = await s.supabase.from("exam_tasks").update({ done, done_at: done ? new Date().toISOString() : null }).eq("id", ok.data).eq("user_id", s.user.id);
  if (error) return fail("We couldn't save that. Try again.");
  revalidatePath("/exam");
  return { status: "saved" };
}
