"use server";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { fieldErrors, isAdmin } from "@/lib/admin";
import { BUCKET, checkFile, idSchema, safeFileName, storagePath, uploadSchema } from "@/lib/resources";

export type ResState = { status: "idle" | "saved" | "error"; message?: string; errors?: Record<string, string>; at?: number };
const fail = (message: string, errors?: Record<string, string>): ResState => ({ status: "error", message, errors, at: Date.now() });

/** Same guard as the other admin actions: re-checks the signed-in user, 404 for everyone else. */
async function admin() {
  const s = await getSession();
  if (!s || !(await isAdmin())) notFound();
  return { db: createAdminClient(), userId: s.user.id };
}

const refresh = () => { revalidatePath("/admin", "layout"); revalidatePath("/resources"); };

export async function uploadResource(_prev: ResState, form: FormData): Promise<ResState> {
  const { db, userId } = await admin();
  const parsed = uploadSchema.safeParse({
    course: String(form.get("course") ?? ""), unit: String(form.get("unit") ?? ""), topic: String(form.get("topic") ?? ""),
    kind: String(form.get("kind") ?? ""), title: String(form.get("title") ?? ""), description: String(form.get("description") ?? ""), url: String(form.get("url") ?? ""),
  });
  if (!parsed.success) return fail("Please fix the highlighted fields.", fieldErrors(parsed.error));
  const v = parsed.data;

  const file = form.get("file");
  const hasFile = file instanceof File && file.size > 0;
  if (v.kind === "link" && !v.url) return fail("Please fix the highlighted fields.", { url: "Paste the link students should open" });
  if (!hasFile && !v.url) return fail("Please fix the highlighted fields.", { file: "Add a file, or paste a link" });
  if (v.kind === "link" && hasFile) return fail("Please fix the highlighted fields.", { file: "A link has no file. Pick another kind, or remove the file" });

  const id = randomUUID();
  let stored: { path: string; name: string; size: number; mime: string } | null = null;
  if (hasFile) {
    if (file.size > 20 * 1024 * 1024) return fail("Please fix the highlighted fields.", { file: "That file is bigger than 20 MB. Try compressing it." });
    const bytes = new Uint8Array(await file.arrayBuffer());
    const chk = checkFile(bytes);
    if (!chk.ok) return fail("Please fix the highlighted fields.", { file: chk.message });
    const name = safeFileName(file.name, chk.type.ext);
    const path = storagePath(v.course, v.unit, id, name);
    try {
      const { error } = await db.storage.from(BUCKET).upload(path, bytes, { contentType: chk.type.mime, upsert: false });
      if (error) return fail("We couldn't store that file. Storage may not be set up yet. Check the 'resources' bucket and try again.");
    } catch { return fail("File storage isn't reachable on this server right now. Try again in a minute."); }
    stored = { path, name, size: bytes.length, mime: chk.type.mime };
  }

  try {
    const { error } = await db.from("resources").insert({
      id, course: v.course, unit: v.unit, topic: v.topic, kind: v.kind, title: v.title, description: v.description,
      file_path: stored?.path ?? null, file_name: stored?.name ?? null, size_bytes: stored?.size ?? null, mime: stored?.mime ?? null,
      external_url: v.url, created_by: userId, allow_download: form.get("allow_download") === "on",
    });
    if (error) throw error;
  } catch {
    if (stored) { try { await db.storage.from(BUCKET).remove([stored.path]); } catch { /* best effort */ } }
    return fail("We couldn't save that. Try again.");
  }
  refresh();
  return { status: "saved", message: form.get("allow_download") === "on" ? "Added. Students on that subject can read and download it now." : "Added as read-only. Students on that subject can read it in the app now.", at: Date.now() };
}

/** Read-only (false) or downloadable (true) for students. */
export async function setResourceDownload(id: string, allow: boolean): Promise<void> {
  const { db } = await admin();
  if (!idSchema.safeParse(id).success || typeof allow !== "boolean") return;
  await db.from("resources").update({ allow_download: allow }).eq("id", id);
  refresh();
}

export async function setResourceHidden(id: string, hidden: boolean): Promise<void> {
  const { db } = await admin();
  if (!idSchema.safeParse(id).success) return;
  await db.from("resources").update({ hidden }).eq("id", id);
  refresh();
}

/** Deletes the row and its stored file. */
export async function deleteResource(id: string): Promise<void> {
  const { db } = await admin();
  if (!idSchema.safeParse(id).success) return;
  const { data } = await db.from("resources").select("file_path").eq("id", id).limit(1);
  const path = (data?.[0] as { file_path: string | null } | undefined)?.file_path;
  if (path) { try { await db.storage.from(BUCKET).remove([path]); } catch { /* the row still goes; an orphan file is harmless and private */ } }
  await db.from("resources").delete().eq("id", id);
  refresh();
}
