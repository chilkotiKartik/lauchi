"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { getExperiment } from "@/labs/experiments";
import { getLab } from "@/labs/registry";
import { validateLabQuestion } from "@/lib/cms-lab";

export type LabQResult = { ok: true; id: string; status: "draft" | "published"; message: string } | { ok: false; errors: Record<string, string> };
const bad = (message: string, extra: Record<string, string> = {}): LabQResult => ({ ok: false, errors: { _: message, ...extra } });
const idSchema = z.string().uuid();
const saveSchema = z.object({ id: idSchema.optional(), labId: z.string().max(64), payload: z.unknown(), publish: z.boolean().optional() });

async function admin() { const s = await requireAdmin(); return { db: createAdminClient(), userId: s.user.id }; }
const refresh = (labId: string) => { revalidatePath("/admin/lab-content"); revalidatePath(`/labs/${labId}`); revalidatePath("/admin/stats"); revalidatePath("/admin/subjects"); };

export async function saveLabQuestion(input: unknown): Promise<LabQResult> {
  const { db, userId } = await admin();
  const p = saveSchema.safeParse(input);
  if (!p.success) return bad("That request wasn't valid.");
  const { id, labId, payload, publish } = p.data;
  if (!getLab(labId) || !getExperiment(labId)) return bad("Pick a lab that has a guided experiment.", { labId: "Pick a lab that has a guided experiment" });
  const v = validateLabQuestion(payload);
  if (!v.ok) return { ok: false, errors: { _: "Please fix the highlighted fields.", ...v.errors } };
  try {
    let status: "draft" | "published" = publish ? "published" : "draft";
    if (id) {
      const { data } = await db.from("cms_lab_questions").select("id,status,lab_id").eq("id", id).limit(1);
      const row = (data ?? [])[0] as { id: string; status: "draft" | "published"; lab_id: string } | undefined;
      if (!row) return bad("That question no longer exists.");
      if (!publish) status = row.status;
      const { error } = await db.from("cms_lab_questions").update({ lab_id: labId, kind: v.q.type, payload: v.q, status, updated_by: userId, updated_at: new Date().toISOString() }).eq("id", id);
      if (error) return bad("We couldn't save that. Try again.");
      refresh(labId); if (row.lab_id !== labId) refresh(row.lab_id);
      return { ok: true, id, status, message: status === "published" ? "Saved and live for students." : "Draft saved." };
    }
    const { data, error } = await db.from("cms_lab_questions").insert({ lab_id: labId, kind: v.q.type, payload: v.q, status, updated_by: userId }).select("id").single();
    if (error || !data) return bad("We couldn't save that. Try again.");
    refresh(labId);
    return { ok: true, id: (data as { id: string }).id, status, message: status === "published" ? "Published." : "Draft created." };
  } catch { return bad("The database isn't reachable right now. Try again in a minute."); }
}

export async function setLabQuestionStatus(id: string, status: "draft" | "published"): Promise<LabQResult> {
  const { db, userId } = await admin();
  if (!idSchema.safeParse(id).success || (status !== "draft" && status !== "published")) return bad("That request wasn't valid.");
  try {
    const { data } = await db.from("cms_lab_questions").select("id,lab_id,payload").eq("id", id).limit(1);
    const row = (data ?? [])[0] as { id: string; lab_id: string; payload: unknown } | undefined;
    if (!row) return bad("That question no longer exists.");
    if (status === "published" && !validateLabQuestion(row.payload).ok) return bad("This question has problems. Open it and fix them first.");
    const { error } = await db.from("cms_lab_questions").update({ status, updated_by: userId, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) return bad("We couldn't change that. Try again.");
    refresh(row.lab_id);
    return { ok: true, id, status, message: status === "published" ? "Published." : "Unpublished." };
  } catch { return bad("The database isn't reachable right now. Try again in a minute."); }
}

export async function deleteLabQuestion(id: string): Promise<LabQResult> {
  const { db } = await admin();
  if (!idSchema.safeParse(id).success) return bad("That request wasn't valid.");
  try {
    const { data } = await db.from("cms_lab_questions").select("id,lab_id").eq("id", id).limit(1);
    const row = (data ?? [])[0] as { id: string; lab_id: string } | undefined;
    if (!row) return bad("That question no longer exists.");
    const { error } = await db.from("cms_lab_questions").delete().eq("id", id);
    if (error) return bad("We couldn't delete that. Try again.");
    refresh(row.lab_id);
    return { ok: true, id, status: "draft", message: "Deleted." };
  } catch { return bad("The database isn't reachable right now. Try again in a minute."); }
}
