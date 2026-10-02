"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCourse } from "@/lib/syllabus";
import { LESSONS } from "@/content/lessons";
import { clip, lessonTargetSchema, validateLesson } from "@/lib/cms-lessons";

export type LessonResult = { ok: true; id: string; status: "draft" | "published"; version: number; message: string } | { ok: false; errors: string[] };
const bad = (...errors: string[]): LessonResult => ({ ok: false, errors });
const idSchema = z.string().uuid();

type Row = { id: string; course: string; unit: number; topic: number; status: "draft" | "published"; version: number; body: unknown };

async function admin() { const s = await requireAdmin(); return { db: createAdminClient(), userId: s.user.id }; }
const topicTitle = (course: string, unit: number, topic: number) => getCourse(course)?.units[unit - 1]?.topics[topic - 1] ?? null;
function refresh(r: { course: string; unit: number; topic: number }) {
  revalidatePath("/admin/lessons"); revalidatePath(`/learn/${r.course}/${r.unit}/${r.topic}`); revalidatePath("/admin/subjects"); revalidatePath("/admin/stats");
}

async function publishedClash(db: ReturnType<typeof createAdminClient>, t: { course: string; unit: number; topic: number }, selfId: string | null) {
  const { data } = await db.from("cms_lessons").select("id").eq("course", t.course).eq("unit", t.unit).eq("topic", t.topic).eq("status", "published").limit(5);
  return ((data ?? []) as { id: string }[]).some((r) => r.id !== selfId);
}

const saveSchema = z.object({ id: idSchema.optional(), target: lessonTargetSchema.optional(), body: z.unknown(), publish: z.boolean().optional() });

/** Create or update a lesson. `publish` makes it live (full checks); otherwise the current status is kept (a published lesson stays fully checked). */
export async function saveLesson(input: unknown): Promise<LessonResult> {
  const { db, userId } = await admin();
  const p = saveSchema.safeParse(input);
  if (!p.success) return bad("That request wasn't valid.");
  const { id, body, publish } = p.data;
  try {
    let row: Row | null = null;
    let target: { course: string; unit: number; topic: number };
    if (id) {
      const { data } = await db.from("cms_lessons").select("id,course,unit,topic,status,version,body").eq("id", id).limit(1);
      row = ((data ?? [])[0] as Row | undefined) ?? null;
      if (!row) return bad("That lesson no longer exists.");
      target = { course: row.course, unit: Number(row.unit), topic: Number(row.topic) };
    } else {
      if (!p.data.target) return bad("Pick a subject, unit and topic.");
      target = p.data.target;
    }
    const title = topicTitle(target.course, target.unit, target.topic);
    if (!title) return bad("That topic isn't in the syllabus.");
    const status = publish ? "published" : row?.status ?? "draft";
    const v = validateLesson(body, { strict: status === "published" });
    if (!v.ok) return bad(...v.errors);
    if (status === "published" && (await publishedClash(db, target, row?.id ?? null))) return bad("Another lesson is already published for this topic. Unpublish it first.");
    const now = new Date().toISOString();
    if (row) {
      const { error } = await db.from("cms_lessons").update({ body: v.lesson, title: clip(title, 200), status, version: row.version + 1, updated_by: userId, updated_at: now }).eq("id", row.id);
      if (error) return bad("We couldn't save that. Try again.");
      refresh(target);
      return { ok: true, id: row.id, status, version: row.version + 1, message: status === "published" ? "Saved and live for students." : "Draft saved." };
    }
    const { data, error } = await db.from("cms_lessons").insert({ ...target, title: clip(title, 200), body: v.lesson, status, version: 1, updated_by: userId }).select("id").single();
    if (error || !data) return bad("We couldn't save that. Try again.");
    refresh(target);
    return { ok: true, id: (data as { id: string }).id, status, version: 1, message: status === "published" ? "Published." : "Draft created." };
  } catch { return bad("The database isn't reachable right now. Try again in a minute."); }
}

/** Publish (full checks on the stored body) or unpublish an existing lesson. */
export async function setLessonStatus(id: string, status: "draft" | "published"): Promise<LessonResult> {
  const { db, userId } = await admin();
  if (!idSchema.safeParse(id).success || (status !== "draft" && status !== "published")) return bad("That request wasn't valid.");
  try {
    const { data } = await db.from("cms_lessons").select("id,course,unit,topic,status,version,body").eq("id", id).limit(1);
    const row = ((data ?? [])[0] as Row | undefined) ?? null;
    if (!row) return bad("That lesson no longer exists.");
    const t = { course: row.course, unit: Number(row.unit), topic: Number(row.topic) };
    if (status === "published") {
      const v = validateLesson(row.body, { strict: true });
      if (!v.ok) return bad(...v.errors);
      if (await publishedClash(db, t, row.id)) return bad("Another lesson is already published for this topic. Unpublish it first.");
    }
    const { error } = await db.from("cms_lessons").update({ status, version: row.version + 1, updated_by: userId, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) return bad("We couldn't change that. Try again.");
    refresh(t);
    return { ok: true, id, status, version: row.version + 1, message: status === "published" ? "Published." : "Unpublished. Students see the built-in notes again." };
  } catch { return bad("The database isn't reachable right now. Try again in a minute."); }
}

export async function deleteLesson(id: string): Promise<LessonResult> {
  const { db } = await admin();
  if (!idSchema.safeParse(id).success) return bad("That request wasn't valid.");
  try {
    const { data } = await db.from("cms_lessons").select("id,course,unit,topic").eq("id", id).limit(1);
    const row = ((data ?? [])[0] as Pick<Row, "id" | "course" | "unit" | "topic"> | undefined) ?? null;
    if (!row) return bad("That lesson no longer exists.");
    const { error } = await db.from("cms_lessons").delete().eq("id", id);
    if (error) return bad("We couldn't delete that. Try again.");
    refresh({ course: row.course, unit: Number(row.unit), topic: Number(row.topic) });
    return { ok: true, id, status: "draft", version: 0, message: "Deleted." };
  } catch { return bad("The database isn't reachable right now. Try again in a minute."); }
}

/** Copies the built-in lesson for a topic into a new draft (or returns the existing CMS lesson for that topic). */
export async function importStaticLesson(input: unknown): Promise<LessonResult> {
  const { db, userId } = await admin();
  const t = lessonTargetSchema.safeParse(input);
  if (!t.success) return bad("Pick a subject, unit and topic.");
  const { course, unit, topic } = t.data;
  const title = topicTitle(course, unit, topic);
  if (!title) return bad("That topic isn't in the syllabus.");
  const st = LESSONS[`${course}:${unit}:${topic}`];
  if (!st) return bad("There is no built-in lesson for this topic. Start from a blank one instead.");
  try {
    const { data: ex } = await db.from("cms_lessons").select("id,status,version").eq("course", course).eq("unit", unit).eq("topic", topic).order("created_at", { ascending: false }).limit(1);
    const have = ((ex ?? [])[0] as { id: string; status: "draft" | "published"; version: number } | undefined);
    if (have) return { ok: true, id: have.id, status: have.status, version: have.version, message: "A CMS lesson already exists for this topic. Opened it." };
    const v = validateLesson(JSON.parse(JSON.stringify(st)), { strict: false });
    if (!v.ok) return bad(...v.errors);
    const { data, error } = await db.from("cms_lessons").insert({ course, unit, topic, title: clip(title, 200), body: v.lesson, status: "draft", version: 1, updated_by: userId }).select("id").single();
    if (error || !data) return bad("We couldn't import that. Try again.");
    revalidatePath("/admin/lessons");
    return { ok: true, id: (data as { id: string }).id, status: "draft", version: 1, message: "Copied the built-in lesson into a draft." };
  } catch { return bad("The database isn't reachable right now. Try again in a minute."); }
}
