"use server";
import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { customPyqSchema, fieldErrors, isAdmin, pinVideoSchema } from "@/lib/admin";

export type FormState = { status: "idle" | "saved" | "error"; message?: string; errors?: Record<string, string>; at?: number };

/** Every admin action starts here: re-checks the signed-in user on the server. Non-admins get the same 404 as the pages. */
async function admin() {
  const s = await getSession();
  if (!s || !(await isAdmin())) notFound();
  return { db: createAdminClient(), userId: s.user.id };
}

const uuid = z.string().uuid();
const fail = (message: string, errors?: Record<string, string>): FormState => ({ status: "error", message, errors, at: Date.now() });

/* ------------------------------------------------------------------ custom PYQs */

export async function saveCustomPyq(_prev: FormState, form: FormData): Promise<FormState> {
  const { db, userId } = await admin();
  const texts = form.getAll("part_text").map(String);
  const marks = form.getAll("part_marks").map(String);
  const parsed = customPyqSchema.safeParse({
    course: String(form.get("course") ?? ""), unit: String(form.get("unit") ?? ""), kind: String(form.get("kind") ?? ""),
    title: String(form.get("title") ?? ""), marks: String(form.get("marks") ?? ""), repeated: String(form.get("repeated") || "1"),
    year: String(form.get("year") ?? ""),
    parts: texts.map((t, i) => ({ text: t, marks: marks[i] ?? "" })),
  });
  if (!parsed.success) return fail("Please fix the highlighted fields.", fieldErrors(parsed.error));
  const v = parsed.data;
  const row = { course: v.course, unit: v.unit, kind: v.kind, title: v.title, parts: v.parts, marks: v.marks, repeated: v.repeated, year: v.year };
  const id = String(form.get("id") ?? "");
  try {
    if (id) {
      if (!uuid.safeParse(id).success) return fail("That question no longer exists.");
      const { data, error } = await db.from("custom_pyqs").update({ ...row, updated_at: new Date().toISOString() }).eq("id", id).select("id");
      if (error) return fail("We couldn't save that. Try again.");
      if (!data?.length) return fail("That question no longer exists.");
    } else {
      const { error } = await db.from("custom_pyqs").insert({ ...row, created_by: userId });
      if (error) return fail("We couldn't save that. Try again.");
    }
  } catch { return fail("The admin database isn't configured on this server."); }
  revalidatePath("/admin", "layout");
  revalidatePath("/pyq");
  return { status: "saved", message: id ? "Changes saved." : "Question added. Students will see it in the PYQ bank.", at: Date.now() };
}

export async function setPyqHidden(id: string, hidden: boolean): Promise<void> {
  const { db } = await admin();
  if (!uuid.safeParse(id).success) return;
  await db.from("custom_pyqs").update({ hidden, updated_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/admin", "layout");
  revalidatePath("/pyq");
}

/* ------------------------------------------------------------------ pinned videos */

export async function pinVideo(_prev: FormState, form: FormData): Promise<FormState> {
  const { db, userId } = await admin();
  const parsed = pinVideoSchema.safeParse({
    course: String(form.get("course") ?? ""), unit: String(form.get("unit") ?? ""), topic: String(form.get("topic") ?? ""),
    video: String(form.get("video") ?? ""), title: String(form.get("title") ?? ""), channel: String(form.get("channel") ?? ""), note: String(form.get("note") ?? ""),
  });
  if (!parsed.success) return fail("Please fix the highlighted fields.", fieldErrors(parsed.error));
  const v = parsed.data;
  try {
    const { data: last } = await db.from("pinned_videos").select("position").eq("course", v.course).eq("unit", v.unit)
      .order("position", { ascending: false }).limit(1);
    const position = (last?.[0]?.position as number | undefined ?? -1) + 1;
    const { error } = await db.from("pinned_videos").insert({
      course: v.course, unit: v.unit, topic: v.topic, video_id: v.video, title: v.title, channel: v.channel, note: v.note, position, created_by: userId,
    });
    if (error) return fail("We couldn't pin that video. Try again.");
  } catch { return fail("The admin database isn't configured on this server."); }
  revalidatePath("/admin", "layout");
  return { status: "saved", message: "Video pinned. It shows first as Teacher's pick.", at: Date.now() };
}

/** Moves a pinned video one place up (-1) or down (+1) among the videos of the same unit. */
export async function movePinned(id: string, dir: number): Promise<void> {
  const { db } = await admin();
  if (!uuid.safeParse(id).success || (dir !== -1 && dir !== 1)) return;
  const { data: me } = await db.from("pinned_videos").select("id,course,unit").eq("id", id).limit(1);
  const cur = me?.[0] as { id: string; course: string; unit: number } | undefined;
  if (!cur) return;
  const { data } = await db.from("pinned_videos").select("id,position,created_at").eq("course", cur.course).eq("unit", cur.unit)
    .order("position", { ascending: true }).order("created_at", { ascending: true }).limit(100);
  const list = ((data ?? []) as { id: string }[]).map((r) => r.id);
  const i = list.indexOf(id), j = i + dir;
  if (i < 0 || j < 0 || j >= list.length) return;
  [list[i], list[j]] = [list[j], list[i]];
  // renumber the whole unit so positions stay 0..n-1 even after removals
  await Promise.all(list.map((vid, position) => db.from("pinned_videos").update({ position }).eq("id", vid)));
  revalidatePath("/admin", "layout");
}

export async function removePinned(id: string): Promise<void> {
  const { db } = await admin();
  if (!uuid.safeParse(id).success) return;
  await db.from("pinned_videos").delete().eq("id", id);
  revalidatePath("/admin", "layout");
}

/* ------------------------------------------------------------------ reports */

const reportUpdate = z.object({
  id: z.string().uuid(),
  status: z.enum(["open", "fixed", "ignored"], { error: "Pick a status" }),
  fix_note: z.string().trim().max(500, "Keep the note under 500 characters"),
});

export async function updateReport(_prev: FormState, form: FormData): Promise<FormState> {
  const { db } = await admin();
  const parsed = reportUpdate.safeParse({ id: String(form.get("id") ?? ""), status: String(form.get("status") ?? ""), fix_note: String(form.get("fix_note") ?? "") });
  if (!parsed.success) return fail("Please fix the highlighted fields.", fieldErrors(parsed.error));
  const { id, status, fix_note } = parsed.data;
  try {
    const { error } = await db.from("question_reports")
      .update({ status, fix_note, resolved_at: status === "open" ? null : new Date().toISOString() }).eq("id", id);
    if (error) return fail("We couldn't save that. Try again.");
  } catch { return fail("The admin database isn't configured on this server."); }
  revalidatePath("/admin", "layout");
  return { status: "saved", message: "Saved.", at: Date.now() };
}
