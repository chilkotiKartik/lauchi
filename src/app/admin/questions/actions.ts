"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { courseOptions } from "@/app/admin/data";
import { errorsOf, parseImport, questionSchema, type QuestionInput } from "@/lib/cms-questions-core";

export type SaveState = { ok: true; id: string; message: string } | { ok: false; message: string; errors?: Record<string, string> };
export type BulkState = { ok: boolean; message: string };
export type ImportState = { ok: boolean; message: string; count: number; errors: { line: number; message: string }[]; imported?: boolean };

const ids = z.array(z.string().uuid()).min(1).max(200);

/** Every action re-checks admin rights first (404 for anyone else) and then uses the service-role client. */
async function admin() {
  const s = await requireAdmin();
  return { db: createAdminClient(), userId: s.user.id };
}
/** Students' pages are dynamic and read with no cache, but revalidate the router cache too so a publish is live at once. */
const refresh = () => { revalidatePath("/bank", "layout"); revalidatePath("/admin/questions", "layout"); };

const courseOk = (course: string, unit: number) => courseOptions().some((c) => c.code === course && c.units.some((u) => u.n === unit));

/** A Postgres array literal; PostgREST accepts it for text[] columns. */
const pgArray = (a: string[]) => `{${a.map((x) => `"${x.replace(/(["\\])/g, "\\$1")}"`).join(",")}}`;

const rowOf = (q: QuestionInput) => ({
  course: q.course, unit: q.unit, kind: q.kind, stem: q.stem, options: q.options, answer: q.answer, explanation: q.explanation,
  steps: q.steps.length ? q.steps : null, difficulty: q.difficulty, tags: pgArray(q.tags),
});

function validate(input: unknown): { q: QuestionInput } | { errors: Record<string, string> } {
  const p = questionSchema.safeParse(input);
  if (!p.success) return { errors: errorsOf(p.error) };
  if (!courseOk(p.data.course, p.data.unit)) return { errors: { unit: "That subject doesn't have this unit" } };
  return { q: p.data };
}

export async function saveQuestion(input: unknown, id?: string): Promise<SaveState> {
  const { db, userId } = await admin();
  if (id !== undefined && !z.string().uuid().safeParse(id).success) return { ok: false, message: "That question doesn't exist." };
  const v = validate(input);
  if ("errors" in v) return { ok: false, message: "Please fix the highlighted fields.", errors: v.errors };
  try {
    if (id) {
      const { data, error } = await db.from("cms_questions").update({ ...rowOf(v.q), updated_at: new Date().toISOString() }).eq("id", id).select("id");
      if (error) throw error;
      if (!data?.length) return { ok: false, message: "That question doesn't exist any more." };
      refresh();
      return { ok: true, id, message: "Saved. Students see the change straight away if it is published." };
    }
    const { data, error } = await db.from("cms_questions").insert({ ...rowOf(v.q), status: "draft", created_by: userId }).select("id").single();
    if (error || !data) throw error ?? new Error("no row");
    refresh();
    return { ok: true, id: (data as { id: string }).id, message: "Saved as a draft. Publish it when you are ready." };
  } catch { return { ok: false, message: "We couldn't save that. Try again." }; }
}

export async function setQuestionStatus(idList: string[], status: "draft" | "published"): Promise<BulkState> {
  const { db } = await admin();
  const p = ids.safeParse(idList);
  if (!p.success || (status !== "draft" && status !== "published")) return { ok: false, message: "Pick at least one question." };
  try {
    const { error } = await db.from("cms_questions").update(
      status === "published" ? { status, published_at: new Date().toISOString(), updated_at: new Date().toISOString() } : { status, updated_at: new Date().toISOString() },
    ).in("id", p.data);
    if (error) throw error;
  } catch { return { ok: false, message: "We couldn't update those. Try again." }; }
  refresh();
  return { ok: true, message: `${p.data.length} ${p.data.length === 1 ? "question" : "questions"} ${status === "published" ? "published" : "unpublished"}.` };
}

export async function deleteQuestions(idList: string[]): Promise<BulkState> {
  const { db } = await admin();
  const p = ids.safeParse(idList);
  if (!p.success) return { ok: false, message: "Pick at least one question." };
  try {
    const { error } = await db.from("cms_questions").delete().in("id", p.data);
    if (error) throw error;
  } catch { return { ok: false, message: "We couldn't delete those. Try again." }; }
  refresh();
  return { ok: true, message: `${p.data.length} ${p.data.length === 1 ? "question" : "questions"} deleted.` };
}

/** Copies a question as a new draft. */
export async function duplicateQuestion(id: string): Promise<SaveState> {
  const { db, userId } = await admin();
  if (!z.string().uuid().safeParse(id).success) return { ok: false, message: "That question doesn't exist." };
  try {
    const { data } = await db.from("cms_questions").select("course,unit,kind,stem,options,answer,explanation,steps,difficulty,tags").eq("id", id).limit(1);
    const src = (data ?? [])[0];
    if (!src) return { ok: false, message: "That question doesn't exist any more." };
    const { data: row, error } = await db.from("cms_questions").insert({ ...src, tags: pgArray(Array.isArray(src.tags) ? src.tags.map(String) : []), status: "draft", created_by: userId }).select("id").single();
    if (error || !row) throw error ?? new Error("no row");
    refresh();
    return { ok: true, id: (row as { id: string }).id, message: "Duplicated as a draft." };
  } catch { return { ok: false, message: "We couldn't duplicate that. Try again." }; }
}

/** CSV bulk import. mode "preview" only validates; "import" inserts every row, or nothing if any row is invalid. */
export async function importQuestions(text: string, mode: "preview" | "import", publish: boolean): Promise<ImportState> {
  const { db, userId } = await admin();
  if (typeof text !== "string" || text.length > 400_000) return { ok: false, message: "That is too much text to import at once.", count: 0, errors: [] };
  const r = parseImport(text, courseOk);
  if (r.errors.length) return { ok: false, message: `${r.errors.length} ${r.errors.length === 1 ? "row needs" : "rows need"} fixing. Nothing was imported.`, count: 0, errors: r.errors.slice(0, 50) };
  if (mode === "preview") return { ok: true, message: `${r.rows.length} ${r.rows.length === 1 ? "question looks" : "questions look"} good. Nothing is saved yet.`, count: r.rows.length, errors: [] };
  const now = new Date().toISOString();
  try {
    const { error } = await db.from("cms_questions").insert(r.rows.map((q) => ({
      ...rowOf(q), status: publish ? "published" : "draft", published_at: publish ? now : null, created_by: userId,
    })));
    if (error) throw error;
  } catch { return { ok: false, message: "We couldn't import those. Nothing was saved. Try again.", count: 0, errors: [] }; }
  refresh();
  return { ok: true, imported: true, count: r.rows.length, errors: [], message: `Imported ${r.rows.length} ${r.rows.length === 1 ? "question" : "questions"} as ${publish ? "published" : "drafts"}.` };
}
